/**
 * Thuật toán ôn tập ngắt quãng SM-2 (SuperMemo 2) — cũng là thuật toán nền của Anki.
 *
 * Ý tưởng: mỗi thẻ có một "hệ số dễ" (easeFactor). Trả lời đúng thì khoảng cách
 * tới lần ôn sau được nhân lên; trả lời sai thì thẻ quay về đầu hàng đợi và hệ số
 * dễ giảm xuống, nên thẻ khó sẽ xuất hiện dày hơn.
 *
 * Các hàm ở đây đều thuần tuý (không đụng database, không đụng thời gian hệ thống
 * trừ khi truyền vào), nên chạy được ở cả server và client, và dễ kiểm thử.
 */

import { addDays } from './utils'

/** Mức tự đánh giá của người học sau mỗi thẻ. */
export const RECALL_GRADES = [
  {
    grade: 0,
    key: 'again',
    label: 'Quên rồi',
    description: 'Không nhớ gì — xem lại ngay trong phiên này',
    color: 'rose',
  },
  {
    grade: 3,
    key: 'hard',
    label: 'Khó',
    description: 'Nhớ ra nhưng phải nghĩ lâu',
    color: 'amber',
  },
  {
    grade: 4,
    key: 'good',
    label: 'Được',
    description: 'Nhớ sau một chút do dự',
    color: 'sky',
  },
  {
    grade: 5,
    key: 'easy',
    label: 'Dễ',
    description: 'Nhớ ngay lập tức',
    color: 'emerald',
  },
] as const

export type RecallGrade = (typeof RECALL_GRADES)[number]['grade']

export const MIN_EASE_FACTOR = 1.3
export const DEFAULT_EASE_FACTOR = 2.5

/** Khi quên, thẻ quay lại sau 10 phút để ôn lại ngay trong phiên. */
export const RELEARN_MINUTES = 10

export type SrsState = {
  /** Số lần trả lời đúng liên tiếp */
  repetition: number
  /** Khoảng cách tới lần ôn kế tiếp, tính bằng ngày (0 = ôn lại trong phiên) */
  interval: number
  easeFactor: number
  lapses: number
}

export type SrsReviewResult = SrsState & {
  dueDate: Date
}

export function initialSrsState(): SrsState {
  return {
    repetition: 0,
    interval: 0,
    easeFactor: DEFAULT_EASE_FACTOR,
    lapses: 0,
  }
}

/**
 * Tính trạng thái mới của thẻ sau một lần ôn.
 *
 * @param state trạng thái hiện tại của thẻ
 * @param quality mức tự đánh giá 0-5 (xem RECALL_GRADES)
 * @param now mốc thời gian dùng để tính hạn ôn kế tiếp
 */
export function reviewCard(state: SrsState, quality: number, now: Date = new Date()): SrsReviewResult {
  const q = Math.max(0, Math.min(5, Math.round(quality)))

  // Cập nhật hệ số dễ theo công thức gốc của SM-2.
  const nextEase = Math.max(
    MIN_EASE_FACTOR,
    state.easeFactor + (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02)),
  )

  // q < 3 nghĩa là không nhớ nổi → học lại từ đầu.
  if (q < 3) {
    const dueDate = new Date(now.getTime() + RELEARN_MINUTES * 60_000)
    return {
      repetition: 0,
      interval: 0,
      easeFactor: nextEase,
      lapses: state.lapses + 1,
      dueDate,
    }
  }

  let interval: number
  if (state.repetition === 0) {
    interval = 1
  } else if (state.repetition === 1) {
    interval = 6
  } else {
    interval = Math.round(state.interval * nextEase)
  }

  // Trả lời "Khó" thì đừng giãn quá nhanh.
  if (q === 3) {
    interval = Math.max(1, Math.round(interval * 0.8))
  }

  interval = Math.max(1, Math.min(interval, 365 * 5))

  return {
    repetition: state.repetition + 1,
    interval,
    easeFactor: nextEase,
    lapses: state.lapses,
    dueDate: addDays(now, interval),
  }
}

/**
 * Xem trước khoảng cách ứng với từng nút, để hiện lên nút bấm
 * ("Được — 6 ngày nữa"). Giúp người học hiểu hệ quả của lựa chọn.
 */
export function previewIntervals(state: SrsState): Record<RecallGrade, string> {
  const result = {} as Record<RecallGrade, string>
  for (const { grade } of RECALL_GRADES) {
    const next = reviewCard(state, grade)
    result[grade] =
      next.interval === 0
        ? `${RELEARN_MINUTES} phút`
        : next.interval === 1
          ? '1 ngày'
          : next.interval < 30
            ? `${next.interval} ngày`
            : next.interval < 365
              ? `${Math.round(next.interval / 30)} tháng`
              : `${(next.interval / 365).toFixed(1)} năm`
  }
  return result
}

/**
 * Một thẻ được coi là "đã thuộc" khi đã ôn đúng nhiều lần và khoảng cách ôn
 * đã vượt 21 ngày — mốc quen thuộc trong nghiên cứu về trí nhớ dài hạn.
 */
export const MATURE_INTERVAL_DAYS = 21

export function isMature(state: Pick<SrsState, 'interval'>): boolean {
  return state.interval >= MATURE_INTERVAL_DAYS
}

export type SrsBucket = 'new' | 'learning' | 'young' | 'mature'

export function bucketOf(state: Pick<SrsState, 'repetition' | 'interval'>): SrsBucket {
  if (state.repetition === 0) return state.interval === 0 ? 'new' : 'learning'
  if (state.interval < MATURE_INTERVAL_DAYS) return 'young'
  return 'mature'
}

export const BUCKET_LABELS: Record<SrsBucket, string> = {
  new: 'Mới',
  learning: 'Đang học',
  young: 'Đã nhớ',
  mature: 'Thuộc lòng',
}
