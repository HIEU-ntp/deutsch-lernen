import { NextResponse } from 'next/server'

import { z } from 'zod'

import { jsonError, parseBody, withUser } from '@/lib/api'
import { getUnitById } from '@/lib/content/loader'
import { prisma } from '@/lib/db'
import { XP_RULES } from '@/lib/gamification'
import { recordActivity } from '@/lib/rewards'

/**
 * Lưu kết quả một phiên làm bài tập của unit.
 *
 * XP được tính lại ở server dựa trên nội dung gốc trong `content/`, không tin
 * vào con số client gửi lên.
 */
const bodySchema = z.object({
  unitId: z.string().min(1),
  level: z.string().min(1),
  /** Phần trăm câu đúng ngay lần đầu, 0-100 */
  score: z.number().int().min(0).max(100),
  attempts: z
    .array(
      z.object({
        exerciseId: z.string().min(1),
        exerciseType: z.string().min(1),
        correct: z.boolean(),
        skillTag: z.string().optional(),
      }),
    )
    .max(200),
})

export const POST = withUser(async (user, request) => {
  const { data, response } = await parseBody(request, bodySchema)
  if (response) return response

  const unit = getUnitById(data.unitId)
  if (!unit) return jsonError('Không tìm thấy unit này', 404)

  const pointsById = new Map(unit.exercises.map((exercise) => [exercise.id, exercise.points]))

  // Ghi lại toàn bộ lượt trả lời để phân tích điểm yếu.
  if (data.attempts.length > 0) {
    await prisma.attempt.createMany({
      data: data.attempts.map((attempt) => ({
        userId: user.id,
        unitId: unit.id,
        level: unit.level,
        exerciseId: attempt.exerciseId,
        exerciseType: attempt.exerciseType,
        correct: attempt.correct,
        skillTag: attempt.skillTag ?? null,
      })),
    })
  }

  // XP: đúng ngay lần đầu ăn trọn điểm, đúng sau khi sai chỉ được điểm an ủi.
  const seen = new Set<string>()
  let xp = 0
  for (const attempt of data.attempts) {
    if (!pointsById.has(attempt.exerciseId)) continue
    const isFirstTry = !seen.has(attempt.exerciseId)
    seen.add(attempt.exerciseId)

    if (attempt.correct) {
      xp += isFirstTry ? (pointsById.get(attempt.exerciseId) ?? 0) : XP_RULES.exerciseRetry
    }
  }

  const previous = await prisma.unitProgress.findUnique({
    where: { userId_unitId: { userId: user.id, unitId: unit.id } },
  })

  // Thưởng hoàn thành unit chỉ trao một lần.
  if (!previous?.exercisesDone) {
    xp += XP_RULES.unitCompleted
    if (data.score === 100) xp += XP_RULES.perfectUnitBonus
  }

  const progress = await prisma.unitProgress.upsert({
    where: { userId_unitId: { userId: user.id, unitId: unit.id } },
    create: {
      userId: user.id,
      unitId: unit.id,
      level: unit.level,
      exercisesDone: true,
      bestScore: data.score,
    },
    update: {
      exercisesDone: true,
      bestScore: Math.max(previous?.bestScore ?? 0, data.score),
    },
  })

  const complete =
    (unit.vocabulary.length === 0 || progress.vocabDone) &&
    (unit.grammar.length === 0 || progress.grammarDone) &&
    progress.exercisesDone

  if (complete && !progress.completedAt) {
    await prisma.unitProgress.update({
      where: { id: progress.id },
      data: { completedAt: new Date() },
    })
  }

  const activity = await recordActivity(user.id, { xp })

  return NextResponse.json({ ...activity, unitComplete: complete })
})
