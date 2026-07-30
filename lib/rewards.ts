import { getUnitsByLevel } from './content/loader'
import { LEVEL_CODES } from './content/schema'
import { prisma } from './db'
import { getBadge, levelBadgeCode, nextStreak, type BadgeDefinition } from './gamification'
import { isUnitComplete, getUnitProgressMap } from './progress'
import { MATURE_INTERVAL_DAYS } from './srs'
import { daysBetween, toLocalDateString } from './utils'

/**
 * Cộng XP, cập nhật streak và trao huy hiệu.
 *
 * Mọi hành động có thưởng (làm bài tập, ôn thẻ SRS, hoàn thành unit) đều gọi
 * `recordActivity` để logic tính streak/huy hiệu nằm ở đúng một chỗ.
 *
 * Lưu ý múi giờ: streak tính theo ngày *của máy chủ*. Với bản chạy local thì máy
 * chủ chính là máy bạn nên không lệch. Khi triển khai lên server ở múi giờ khác,
 * hãy truyền `today` từ client xuống.
 */

export type ActivityResult = {
  xpGained: number
  totalXp: number
  streak: number
  newBadges: BadgeDefinition[]
}

export async function recordActivity(
  userId: string,
  options: { xp: number; today?: string },
): Promise<ActivityResult> {
  const today = options.today ?? toLocalDateString()

  const user = await prisma.user.findUniqueOrThrow({
    where: { id: userId },
    select: { xp: true, streakCount: true, longestStreak: true, lastStudyDate: true },
  })

  const { streak } = nextStreak(user.lastStudyDate, user.streakCount, today, daysBetween)

  const updated = await prisma.user.update({
    where: { id: userId },
    data: {
      xp: { increment: options.xp },
      streakCount: streak,
      longestStreak: Math.max(user.longestStreak, streak),
      lastStudyDate: today,
    },
    select: { xp: true },
  })

  const newBadges = await grantBadges(userId, streak)

  return {
    xpGained: options.xp,
    totalXp: updated.xp,
    streak,
    newBadges,
  }
}

/**
 * Kiểm tra toàn bộ điều kiện huy hiệu và trao những cái vừa đạt.
 * Chạy sau mỗi hoạt động — số truy vấn nhỏ và tránh được trạng thái lệch.
 */
export async function grantBadges(userId: string, streak: number): Promise<BadgeDefinition[]> {
  const [owned, progressMap, vocabCards, matureCards, reviewedCards, placement] = await Promise.all([
    prisma.badge.findMany({ where: { userId }, select: { code: true } }),
    getUnitProgressMap(userId),
    prisma.srsCard.count({ where: { userId, itemType: 'vocab' } }),
    prisma.srsCard.count({ where: { userId, interval: { gte: MATURE_INTERVAL_DAYS } } }),
    prisma.srsCard.count({ where: { userId, lastReviewedAt: { not: null } } }),
    prisma.placementResult.count({ where: { userId } }),
  ])

  const ownedCodes = new Set(owned.map((badge) => badge.code))
  const earned: string[] = []
  const claim = (code: string, condition: boolean) => {
    if (condition && !ownedCodes.has(code)) earned.push(code)
  }

  // Unit & cấp độ
  let completedUnits = 0
  let perfectUnit = false
  for (const level of LEVEL_CODES) {
    const units = getUnitsByLevel(level)
    if (units.length === 0) continue

    let levelDone = 0
    for (const unit of units) {
      const progress = progressMap.get(unit.id)
      if (isUnitComplete(unit, progress)) {
        completedUnits += 1
        levelDone += 1
      }
      if (progress && progress.bestScore === 100) perfectUnit = true
    }

    claim(levelBadgeCode(level), levelDone === units.length)
  }

  claim('first-unit', completedUnits >= 1)
  claim('perfect-unit', perfectUnit)
  claim('streak-3', streak >= 3)
  claim('streak-7', streak >= 7)
  claim('streak-30', streak >= 30)
  claim('vocab-50', vocabCards >= 50)
  claim('vocab-200', vocabCards >= 200)
  claim('vocab-500', vocabCards >= 500)
  claim('mature-100', matureCards >= 100)
  claim('reviewer-100', reviewedCards >= 100)
  claim('placement-done', placement > 0)

  if (earned.length === 0) return []

  await prisma.badge.createMany({
    data: earned.map((code) => ({ userId, code })),
  })

  return earned.map(getBadge)
}
