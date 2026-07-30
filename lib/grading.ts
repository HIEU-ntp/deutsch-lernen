import type { Exercise } from './content/schema'
import { isAnswerCorrect, normalizeAnswer } from './utils'

/**
 * Chấm điểm bài tập.
 *
 * Tách riêng khỏi giao diện để có thể chấm ở cả client (phản hồi tức thì) và
 * server (nếu sau này cần chống gian lận), và để dễ kiểm thử.
 *
 * Kiểu dữ liệu câu trả lời theo từng loại bài tập:
 *   multiple_choice           number | null            (chỉ số phương án)
 *   listening (choice)        number | null
 *   listening (dictation)     string
 *   fill_blank                string[]                 (một phần tử mỗi ô trống)
 *   translate                 string
 *   matching                  Record<number, string>   (chỉ số vế trái → nội dung vế phải)
 *   reorder                   string[]                 (thứ tự người học chọn)
 *   conjugation               string[]                 (một phần tử mỗi dòng)
 */

export type GradeResult = {
  correct: boolean
  /** Đúng/sai của từng thành phần (ô trống, cặp nối, dòng chia động từ…) */
  details: boolean[]
  /** Đáp án đúng, hiển thị khi trả lời sai */
  correctAnswer: string
  /** Số thành phần trả lời đúng / tổng số thành phần */
  partial: { correct: number; total: number }
}

function result(details: boolean[], correctAnswer: string): GradeResult {
  const correctCount = details.filter(Boolean).length
  return {
    correct: details.length > 0 && correctCount === details.length,
    details,
    correctAnswer,
    partial: { correct: correctCount, total: details.length },
  }
}

/** Câu trả lời rỗng — dùng để chặn nút "Kiểm tra" khi người học chưa làm gì. */
export function isAnswerEmpty(exercise: Exercise, answer: unknown): boolean {
  switch (exercise.type) {
    case 'multiple_choice':
      return answer === null || answer === undefined
    case 'listening':
      return exercise.mode === 'choice'
        ? answer === null || answer === undefined
        : !String(answer ?? '').trim()
    case 'translate':
      return !String(answer ?? '').trim()
    case 'fill_blank':
    case 'conjugation': {
      const values = (answer as string[] | undefined) ?? []
      return values.every((value) => !value?.trim())
    }
    case 'matching': {
      const pairs = (answer as Record<number, string> | undefined) ?? {}
      return Object.keys(pairs).length < exercise.pairs.length
    }
    case 'reorder': {
      const tokens = (answer as string[] | undefined) ?? []
      return tokens.length < exercise.answer.length
    }
  }
}

export function gradeExercise(exercise: Exercise, answer: unknown): GradeResult {
  switch (exercise.type) {
    case 'multiple_choice': {
      const index = answer as number | null
      return result([index === exercise.answerIndex], exercise.options[exercise.answerIndex])
    }

    case 'listening': {
      if (exercise.mode === 'choice') {
        const index = answer as number | null
        const options = exercise.options ?? []
        const answerIndex = exercise.answerIndex ?? -1
        return result([index === answerIndex], options[answerIndex] ?? '')
      }
      const text = String(answer ?? '')
      const accepted = exercise.answers ?? [exercise.audioText]
      return result([isAnswerCorrect(text, accepted)], accepted[0])
    }

    case 'translate': {
      const text = String(answer ?? '')
      return result([isAnswerCorrect(text, exercise.answers)], exercise.answers[0])
    }

    case 'fill_blank': {
      const values = (answer as string[] | undefined) ?? []
      const details = exercise.blanks.map((blank, index) =>
        isAnswerCorrect(values[index] ?? '', blank.answers),
      )
      const filled = exercise.sentence.split('___')
      const correctAnswer = filled.reduce(
        (sentence, part, index) =>
          sentence + part + (index < exercise.blanks.length ? exercise.blanks[index].answers[0] : ''),
        '',
      )
      return result(details, correctAnswer)
    }

    case 'conjugation': {
      const values = (answer as string[] | undefined) ?? []
      const details: boolean[] = []
      for (const [index, row] of exercise.rows.entries()) {
        if (row.prefilled) continue
        details.push(isAnswerCorrect(values[index] ?? '', [row.answer, ...row.alternatives]))
      }
      const correctAnswer = exercise.rows
        .map((row) => `${row.pronoun} ${row.answer}`)
        .join(' · ')
      return result(details, correctAnswer)
    }

    case 'matching': {
      const chosen = (answer as Record<number, string> | undefined) ?? {}
      const details = exercise.pairs.map(
        (pair, index) => normalizeAnswer(chosen[index] ?? '') === normalizeAnswer(pair.right),
      )
      const correctAnswer = exercise.pairs.map((pair) => `${pair.left} → ${pair.right}`).join(' · ')
      return result(details, correctAnswer)
    }

    case 'reorder': {
      const tokens = (answer as string[] | undefined) ?? []
      const given = tokens.join(' ')
      const candidates = [exercise.answer, ...exercise.alternatives]
      const matched = candidates.some(
        (candidate) => normalizeAnswer(candidate.join(' ')) === normalizeAnswer(given),
      )
      return result([matched], exercise.answer.join(' '))
    }
  }
}

/** Giá trị khởi tạo cho ô trả lời của từng loại bài tập. */
export function emptyAnswer(exercise: Exercise): unknown {
  switch (exercise.type) {
    case 'multiple_choice':
      return null
    case 'listening':
      return exercise.mode === 'choice' ? null : ''
    case 'translate':
      return ''
    case 'fill_blank':
      return exercise.blanks.map(() => '')
    case 'conjugation':
      return exercise.rows.map((row) => (row.prefilled ? row.answer : ''))
    case 'matching':
      return {} as Record<number, string>
    case 'reorder':
      return [] as string[]
  }
}

/** Nhãn kỹ năng mặc định khi file nội dung không khai báo `skillTag`. */
export function defaultSkillTag(exercise: Exercise): string {
  switch (exercise.type) {
    case 'listening':
      return 'listening'
    case 'translate':
      return 'translation'
    case 'conjugation':
      return 'verb-conjugation'
    case 'reorder':
      return 'word-order'
    case 'matching':
      return 'vocabulary'
    default:
      return 'vocabulary'
  }
}
