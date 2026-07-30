import { NextResponse } from 'next/server'

import { z } from 'zod'

import { parseBody, withUser } from '@/lib/api'
import { getPlacement } from '@/lib/content/loader'
import { prisma } from '@/lib/db'
import { evaluatePlacement, placementComment } from '@/lib/placement'
import { grantBadges } from '@/lib/rewards'

const bodySchema = z.object({
  /** khoá là id câu hỏi, giá trị là chỉ số phương án đã chọn */
  answers: z.record(z.string(), z.number().int().min(0)),
})

export const POST = withUser(async (user, request) => {
  const { data, response } = await parseBody(request, bodySchema)
  if (response) return response

  const placement = getPlacement()
  const outcome = evaluatePlacement(placement.questions, data.answers, placement.passRatio)

  await prisma.placementResult.create({
    data: {
      userId: user.id,
      score: outcome.score,
      total: outcome.total,
      suggestedLevel: outcome.suggestedLevel,
      breakdown: JSON.stringify(outcome.breakdown),
    },
  })

  await prisma.user.update({
    where: { id: user.id },
    data: { currentLevel: outcome.suggestedLevel },
  })

  const newBadges = await grantBadges(user.id, user.streakCount)

  return NextResponse.json({
    ...outcome,
    comment: placementComment(outcome),
    newBadges,
  })
})
