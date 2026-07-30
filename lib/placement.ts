import { LEVEL_CODES, type LevelCode, type PlacementQuestion } from './content/schema'

/**
 * Thuật toán xếp lớp.
 *
 * Xét từ cấp thấp nhất lên: chừng nào người học còn đạt tỉ lệ đúng tối thiểu ở
 * một cấp thì coi như đã nắm cấp đó và xét tiếp cấp sau. Cấp đầu tiên KHÔNG đạt
 * chính là nơi nên bắt đầu học — vì đó là chỗ kiến thức bắt đầu hổng.
 *
 * Cách này (thay vì chỉ cộng tổng điểm) tránh trường hợp người học đoán mò trúng
 * vài câu C1 nhưng lại sai câu A2 và bị xếp nhầm lên quá cao.
 */

export type LevelBreakdown = {
  level: LevelCode
  correct: number
  total: number
  passed: boolean
}

export type PlacementOutcome = {
  suggestedLevel: LevelCode
  score: number
  total: number
  breakdown: LevelBreakdown[]
  /** Cấp cao nhất đã vượt qua, dùng để viết nhận xét */
  highestPassed: LevelCode | null
}

export function evaluatePlacement(
  questions: PlacementQuestion[],
  answers: Record<string, number>,
  passRatio = 0.6,
): PlacementOutcome {
  const byLevel = new Map<LevelCode, { correct: number; total: number }>()

  let score = 0
  for (const question of questions) {
    const bucket = byLevel.get(question.level) ?? { correct: 0, total: 0 }
    bucket.total += 1
    if (answers[question.id] === question.answerIndex) {
      bucket.correct += 1
      score += 1
    }
    byLevel.set(question.level, bucket)
  }

  const breakdown: LevelBreakdown[] = []
  let suggested: LevelCode | null = null
  let highestPassed: LevelCode | null = null

  for (const level of LEVEL_CODES) {
    const bucket = byLevel.get(level)
    if (!bucket) continue // cấp này chưa có câu hỏi nào

    const passed = bucket.correct / bucket.total >= passRatio
    breakdown.push({ level, correct: bucket.correct, total: bucket.total, passed })

    if (passed) {
      highestPassed = level
    } else if (suggested === null) {
      suggested = level
    }
  }

  return {
    suggestedLevel: suggested ?? LEVEL_CODES[LEVEL_CODES.length - 1],
    score,
    total: questions.length,
    breakdown,
    highestPassed,
  }
}

/** Nhận xét ngắn hiển thị cùng kết quả. */
export function placementComment(outcome: PlacementOutcome): string {
  const ratio = outcome.total === 0 ? 0 : outcome.score / outcome.total

  if (!outcome.highestPassed) {
    return 'Bạn đang bắt đầu từ con số 0 — đúng chỗ để khởi động. Hãy học tuần tự từ A1.1, đừng vội nhảy cóc.'
  }
  if (ratio >= 0.9) {
    return 'Nền tảng của bạn rất chắc. Cấp được gợi ý là nơi bắt đầu có những điểm bạn chưa nắm trọn.'
  }
  if (ratio >= 0.6) {
    return `Bạn đã vững tới ${outcome.highestPassed}. Nên bắt đầu ở cấp gợi ý để lấp những chỗ còn hổng.`
  }
  return 'Có vài chỗ căn bản còn chưa chắc. Bắt đầu ở cấp gợi ý sẽ giúp bạn đi nhanh hơn về sau.'
}
