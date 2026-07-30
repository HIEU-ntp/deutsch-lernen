/**
 * Màu sắc theo nhóm CEFR.
 *
 * Tailwind quét mã nguồn để tìm tên class, nên các class phải viết đầy đủ ở dạng
 * chuỗi tĩnh — không được ghép kiểu `bg-${color}-100`, vì như vậy Tailwind sẽ
 * không sinh ra CSS tương ứng.
 */

export type CefrGroup = 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2'

type LevelTheme = {
  /** Nền nhạt + chữ đậm, dùng cho chip/nhãn */
  chip: string
  /** Nền đậm, dùng cho thanh tiến trình và nút */
  bar: string
  /** Viền */
  border: string
  /** Chấm tròn nhỏ */
  dot: string
  /** Chữ */
  text: string
  /** Nền rất nhạt cho thẻ */
  soft: string
}

const THEMES: Record<CefrGroup, LevelTheme> = {
  A1: {
    chip: 'bg-emerald-100 text-emerald-800',
    bar: 'bg-emerald-500',
    border: 'border-emerald-200',
    dot: 'bg-emerald-500',
    text: 'text-emerald-700',
    soft: 'bg-emerald-50',
  },
  A2: {
    chip: 'bg-teal-100 text-teal-800',
    bar: 'bg-teal-500',
    border: 'border-teal-200',
    dot: 'bg-teal-500',
    text: 'text-teal-700',
    soft: 'bg-teal-50',
  },
  B1: {
    chip: 'bg-sky-100 text-sky-800',
    bar: 'bg-sky-500',
    border: 'border-sky-200',
    dot: 'bg-sky-500',
    text: 'text-sky-700',
    soft: 'bg-sky-50',
  },
  B2: {
    chip: 'bg-indigo-100 text-indigo-800',
    bar: 'bg-indigo-500',
    border: 'border-indigo-200',
    dot: 'bg-indigo-500',
    text: 'text-indigo-700',
    soft: 'bg-indigo-50',
  },
  C1: {
    chip: 'bg-violet-100 text-violet-800',
    bar: 'bg-violet-500',
    border: 'border-violet-200',
    dot: 'bg-violet-500',
    text: 'text-violet-700',
    soft: 'bg-violet-50',
  },
  C2: {
    chip: 'bg-rose-100 text-rose-800',
    bar: 'bg-rose-500',
    border: 'border-rose-200',
    dot: 'bg-rose-500',
    text: 'text-rose-700',
    soft: 'bg-rose-50',
  },
}

export function cefrGroupOf(level: string): CefrGroup {
  const group = level.slice(0, 2).toUpperCase()
  return (group in THEMES ? group : 'A1') as CefrGroup
}

export function levelTheme(level: string): LevelTheme {
  return THEMES[cefrGroupOf(level)]
}
