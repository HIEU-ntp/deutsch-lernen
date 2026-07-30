/** Ghép class name có điều kiện (thay cho clsx, đủ dùng cho dự án này). */
export function cn(...values: Array<string | false | null | undefined>): string {
  return values.filter(Boolean).join(' ')
}

// ---------------------------------------------------------------------------
// So khớp đáp án
// ---------------------------------------------------------------------------

/**
 * Chuẩn hoá chuỗi trước khi so đáp án.
 *
 * Người học thường không có bàn phím tiếng Đức, nên chấp nhận cách gõ thay thế
 * chính thức: ä→ae, ö→oe, ü→ue, ß→ss. Đồng thời bỏ qua khác biệt hoa/thường,
 * khoảng trắng thừa và dấu câu ở cuối câu.
 */
export function normalizeAnswer(input: string): string {
  return input
    .trim()
    .toLowerCase()
    .normalize('NFC')
    .replace(/ä/g, 'ae')
    .replace(/ö/g, 'oe')
    .replace(/ü/g, 'ue')
    .replace(/ß/g, 'ss')
    .replace(/[.,!?;:"'„“”]/g, '')
    .replace(/\s+/g, ' ')
}

/** So sánh câu trả lời của người học với danh sách đáp án được chấp nhận. */
export function isAnswerCorrect(given: string, accepted: readonly string[]): boolean {
  const normalized = normalizeAnswer(given)
  if (!normalized) return false
  return accepted.some((answer) => normalizeAnswer(answer) === normalized)
}

// ---------------------------------------------------------------------------
// Xáo trộn có thể tái lập
// ---------------------------------------------------------------------------

/** Hash chuỗi thành số 32-bit (FNV-1a) để làm hạt giống ngẫu nhiên. */
export function hashString(value: string): number {
  let hash = 0x811c9dc5
  for (let i = 0; i < value.length; i++) {
    hash ^= value.charCodeAt(i)
    hash = Math.imul(hash, 0x01000193)
  }
  return hash >>> 0
}

/** PRNG mulberry32 — nhỏ gọn, đủ ngẫu nhiên cho việc xáo đáp án. */
export function createRandom(seed: number): () => number {
  let state = seed >>> 0
  return () => {
    state = (state + 0x6d2b79f5) >>> 0
    let t = state
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

/**
 * Xáo trộn theo hạt giống.
 *
 * Dùng seed cố định (thường là id bài tập) để server và client cho ra cùng một
 * thứ tự — nếu xáo ngẫu nhiên thật thì React sẽ báo lỗi hydration mismatch.
 * Truyền thêm `salt` khi muốn xáo lại (ví dụ khi người học bấm "làm lại").
 */
export function seededShuffle<T>(items: readonly T[], seed: string): T[] {
  const random = createRandom(hashString(seed))
  const result = [...items]
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1))
    ;[result[i], result[j]] = [result[j], result[i]]
  }
  return result
}

// ---------------------------------------------------------------------------
// Ngày tháng
// ---------------------------------------------------------------------------

/** Trả về chuỗi YYYY-MM-DD theo giờ địa phương (không dùng UTC để streak đúng). */
export function toLocalDateString(date: Date = new Date()): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

/** Số ngày chênh lệch giữa hai chuỗi YYYY-MM-DD. */
export function daysBetween(from: string, to: string): number {
  const a = new Date(`${from}T00:00:00`)
  const b = new Date(`${to}T00:00:00`)
  return Math.round((b.getTime() - a.getTime()) / 86_400_000)
}

export function addDays(date: Date, days: number): Date {
  const result = new Date(date)
  result.setDate(result.getDate() + days)
  return result
}

/** "3 ngày nữa", "hôm nay", "2 ngày trước" */
export function formatRelativeDays(days: number): string {
  if (days === 0) return 'hôm nay'
  if (days === 1) return 'ngày mai'
  if (days === -1) return 'hôm qua'
  return days > 0 ? `${days} ngày nữa` : `${Math.abs(days)} ngày trước`
}

// ---------------------------------------------------------------------------
// Hiển thị
// ---------------------------------------------------------------------------

/** Ghép mạo từ với danh từ để hiển thị / đọc TTS: "das Haus". */
export function displayWord(word: { de: string; article?: string | null }): string {
  return word.article ? `${word.article} ${word.de}` : word.de
}

export function percent(part: number, total: number): number {
  if (total <= 0) return 0
  return Math.round((part / total) * 100)
}

/** Chuyển mã cấp độ thành slug an toàn cho URL: "A1.1" → "a1-1" */
export function levelToSlug(level: string): string {
  return level.toLowerCase().replace(/\./g, '-')
}

/** Nghịch đảo của levelToSlug: "a1-1" → "A1.1" */
export function slugToLevel(slug: string): string {
  const [head, tail] = slug.split('-')
  return tail ? `${head.toUpperCase()}.${tail}` : head.toUpperCase()
}
