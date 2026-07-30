import { NextResponse } from 'next/server'

import { z } from 'zod'

import { jsonError, parseBody, withUser } from '@/lib/api'
import { XP_RULES } from '@/lib/gamification'
import { recordActivity } from '@/lib/rewards'
import { applyReview } from '@/lib/srs-service'

const bodySchema = z.object({
  cardId: z.string().min(1),
  /** Mức tự đánh giá theo SM-2: 0 = quên hẳn, 5 = nhớ ngay */
  quality: z.number().int().min(0).max(5),
})

export const POST = withUser(async (user, request) => {
  const { data, response } = await parseBody(request, bodySchema)
  if (response) return response

  const result = await applyReview(user.id, data.cardId, data.quality)
  if (!result) return jsonError('Không tìm thấy thẻ này', 404)

  // Chỉ cộng XP khi nhớ được, tránh việc bấm "Quên" liên tục để cày điểm.
  const xp = data.quality >= 3 ? XP_RULES.reviewCard : 0
  const activity = await recordActivity(user.id, { xp })

  return NextResponse.json({
    interval: result.interval,
    dueDate: result.dueDate.toISOString(),
    ...activity,
  })
})
