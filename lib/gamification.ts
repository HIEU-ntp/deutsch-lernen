import { LEVEL_CODES, type LevelCode } from './content/schema'

/** Điểm XP cho từng hành động. */
export const XP_RULES = {
  /** mỗi câu bài tập trả lời đúng ngay lần đầu */
  exerciseCorrect: 10,
  /** trả lời đúng nhưng sau khi đã sai */
  exerciseRetry: 3,
  /** hoàn thành phần bài tập của một unit */
  unitCompleted: 50,
  /** hoàn thành unit với 100% đúng */
  perfectUnitBonus: 30,
  /** mỗi thẻ ôn tập SRS đã xử lý */
  reviewCard: 5,
  /** hoàn thành toàn bộ một cấp độ */
  levelCompleted: 300,
} as const

// ---------------------------------------------------------------------------
// Cấp bậc người học (tính từ tổng XP)
// ---------------------------------------------------------------------------

export type Rank = { name: string; minXp: number; icon: string }

export const RANKS: Rank[] = [
  { name: 'Anfänger', minXp: 0, icon: '🌱' },
  { name: 'Lernender', minXp: 500, icon: '📗' },
  { name: 'Fortgeschritten', minXp: 2000, icon: '📘' },
  { name: 'Kenner', minXp: 5000, icon: '🎓' },
  { name: 'Profi', minXp: 12000, icon: '🏅' },
  { name: 'Meister', minXp: 25000, icon: '👑' },
]

export function rankForXp(xp: number): { current: Rank; next: Rank | null; progress: number } {
  let current = RANKS[0]
  let next: Rank | null = null

  for (let i = 0; i < RANKS.length; i++) {
    if (xp >= RANKS[i].minXp) {
      current = RANKS[i]
      next = RANKS[i + 1] ?? null
    }
  }

  const progress = next
    ? Math.min(100, Math.round(((xp - current.minXp) / (next.minXp - current.minXp)) * 100))
    : 100

  return { current, next, progress }
}

// ---------------------------------------------------------------------------
// Huy hiệu
// ---------------------------------------------------------------------------

export type BadgeDefinition = {
  code: string
  title: string
  description: string
  icon: string
}

const STATIC_BADGES: BadgeDefinition[] = [
  {
    code: 'first-unit',
    title: 'Bước đầu tiên',
    description: 'Hoàn thành bài học đầu tiên',
    icon: '🚀',
  },
  {
    code: 'perfect-unit',
    title: 'Không sai câu nào',
    description: 'Đạt 100% ở phần bài tập của một unit',
    icon: '🎯',
  },
  { code: 'streak-3', title: 'Ba ngày liền', description: 'Học 3 ngày liên tiếp', icon: '🔥' },
  { code: 'streak-7', title: 'Trọn một tuần', description: 'Học 7 ngày liên tiếp', icon: '🔥' },
  { code: 'streak-30', title: 'Bền bỉ', description: 'Học 30 ngày liên tiếp', icon: '🏆' },
  { code: 'vocab-50', title: '50 từ', description: 'Đưa 50 từ vào lịch ôn tập', icon: '📖' },
  { code: 'vocab-200', title: '200 từ', description: 'Đưa 200 từ vào lịch ôn tập', icon: '📚' },
  { code: 'vocab-500', title: '500 từ', description: 'Đưa 500 từ vào lịch ôn tập', icon: '🗂️' },
  {
    code: 'mature-100',
    title: 'Trí nhớ dài hạn',
    description: '100 thẻ đạt mức thuộc lòng (khoảng ôn > 21 ngày)',
    icon: '🧠',
  },
  {
    code: 'reviewer-100',
    title: 'Chăm ôn',
    description: 'Đã ôn ít nhất một lần cho 100 thẻ khác nhau',
    icon: '♻️',
  },
  {
    code: 'placement-done',
    title: 'Đã xếp lớp',
    description: 'Hoàn thành bài kiểm tra xếp lớp',
    icon: '🧭',
  },
]

/** Huy hiệu "hoàn thành cấp độ", sinh tự động cho cả 10 cấp. */
const LEVEL_BADGES: BadgeDefinition[] = LEVEL_CODES.map((code) => ({
  code: levelBadgeCode(code),
  title: `Hoàn thành ${code}`,
  description: `Học xong toàn bộ unit của cấp ${code}`,
  icon: '🎖️',
}))

export function levelBadgeCode(level: LevelCode | string): string {
  return `level-${level.toLowerCase().replace(/\./g, '-')}`
}

export const BADGES: BadgeDefinition[] = [...STATIC_BADGES, ...LEVEL_BADGES]

const BADGE_BY_CODE = new Map(BADGES.map((badge) => [badge.code, badge]))

export function getBadge(code: string): BadgeDefinition {
  return (
    BADGE_BY_CODE.get(code) ?? {
      code,
      title: code,
      description: 'Huy hiệu',
      icon: '🏅',
    }
  )
}

// ---------------------------------------------------------------------------
// Streak
// ---------------------------------------------------------------------------

/**
 * Tính streak mới khi người dùng học vào ngày `today`.
 *
 * - Học tiếp ngày kế tiếp → streak + 1
 * - Học lại trong cùng ngày → giữ nguyên
 * - Nghỉ từ 2 ngày trở lên → streak về 1
 */
export function nextStreak(
  lastStudyDate: string | null,
  currentStreak: number,
  today: string,
  gapInDays: (from: string, to: string) => number,
): { streak: number; isNewDay: boolean } {
  if (!lastStudyDate) return { streak: 1, isNewDay: true }
  if (lastStudyDate === today) return { streak: Math.max(1, currentStreak), isNewDay: false }

  const gap = gapInDays(lastStudyDate, today)
  if (gap === 1) return { streak: currentStreak + 1, isNewDay: true }
  return { streak: 1, isNewDay: true }
}
