import { NextResponse } from 'next/server'

import { z } from 'zod'

import { jsonError, parseBody, withUser } from '@/lib/api'
import { getUnitById } from '@/lib/content/loader'
import { prisma } from '@/lib/db'
import { grantBadges } from '@/lib/rewards'
import { seedCardsForUnit } from '@/lib/srs-service'

/**
 * Đưa từ vựng / ngữ pháp của một unit vào lịch ôn tập ngắt quãng,
 * đồng thời đánh dấu phần đó của unit là đã học.
 */
const bodySchema = z.object({
  unitId: z.string().min(1),
  itemType: z.enum(['vocab', 'grammar']),
})

export const POST = withUser(async (user, request) => {
  const { data, response } = await parseBody(request, bodySchema)
  if (response) return response

  const unit = getUnitById(data.unitId)
  if (!unit) return jsonError('Không tìm thấy unit này', 404)

  const created = await seedCardsForUnit(user.id, unit, data.itemType)

  const doneField = data.itemType === 'vocab' ? { vocabDone: true } : { grammarDone: true }
  const progress = await prisma.unitProgress.upsert({
    where: { userId_unitId: { userId: user.id, unitId: unit.id } },
    create: { userId: user.id, unitId: unit.id, level: unit.level, ...doneField },
    update: doneField,
  })

  // Đánh dấu hoàn thành unit khi mọi phần có nội dung đều xong.
  const complete =
    (unit.vocabulary.length === 0 || progress.vocabDone) &&
    (unit.grammar.length === 0 || progress.grammarDone) &&
    (unit.exercises.length === 0 || progress.exercisesDone)

  if (complete && !progress.completedAt) {
    await prisma.unitProgress.update({
      where: { id: progress.id },
      data: { completedAt: new Date() },
    })
  }

  const newBadges = await grantBadges(user.id, user.streakCount)

  return NextResponse.json({ created, complete, newBadges })
})
