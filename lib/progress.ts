import { getAllUnits, getUnitsByLevel } from './content/loader'
import { LEVEL_CODES, type UnitWithMeta } from './content/schema'
import { prisma } from './db'
import { MATURE_INTERVAL_DAYS } from './srs'
import { percent } from './utils'

/**
 * Ghép dữ liệu tiến trình trong database với giáo trình trong `content/`.
 * Mọi trang cần biết "người dùng học tới đâu" đều đi qua đây.
 */

export type UnitProgressRow = {
  unitId: string
  vocabDone: boolean
  grammarDone: boolean
  exercisesDone: boolean
  bestScore: number
  completedAt: Date | null
}

export async function getUnitProgressMap(userId: string): Promise<Map<string, UnitProgressRow>> {
  const rows = await prisma.unitProgress.findMany({
    where: { userId },
    select: {
      unitId: true,
      vocabDone: true,
      grammarDone: true,
      exercisesDone: true,
      bestScore: true,
      completedAt: true,
    },
  })
  return new Map(rows.map((row) => [row.unitId, row]))
}

/**
 * Một unit được tính là hoàn thành khi mọi phần *có nội dung* của nó đã xong.
 * Unit chỉ có từ vựng mà không có ngữ pháp thì không đòi hỏi grammarDone.
 */
export function isUnitComplete(unit: UnitWithMeta, progress?: UnitProgressRow): boolean {
  if (!progress) return false
  const needVocab = unit.vocabulary.length > 0
  const needGrammar = unit.grammar.length > 0
  const needExercises = unit.exercises.length > 0

  return (
    (!needVocab || progress.vocabDone) &&
    (!needGrammar || progress.grammarDone) &&
    (!needExercises || progress.exercisesDone)
  )
}

export type LevelProgress = {
  level: string
  totalUnits: number
  completedUnits: number
  startedUnits: number
  percent: number
}

export function computeLevelProgress(
  progressMap: Map<string, UnitProgressRow>,
): Map<string, LevelProgress> {
  const result = new Map<string, LevelProgress>()

  for (const level of LEVEL_CODES) {
    const units = getUnitsByLevel(level)
    let completed = 0
    let started = 0

    for (const unit of units) {
      const progress = progressMap.get(unit.id)
      if (!progress) continue
      started += 1
      if (isUnitComplete(unit, progress)) completed += 1
    }

    result.set(level, {
      level,
      totalUnits: units.length,
      completedUnits: completed,
      startedUnits: started,
      percent: percent(completed, units.length),
    })
  }

  return result
}

export async function countDueCards(userId: string, at: Date = new Date()): Promise<number> {
  return prisma.srsCard.count({ where: { userId, dueDate: { lte: at } } })
}

export type VocabStats = {
  total: number
  mature: number
  learning: number
  dueToday: number
}

export async function getVocabStats(userId: string): Promise<VocabStats> {
  const [total, mature, dueToday] = await Promise.all([
    prisma.srsCard.count({ where: { userId, itemType: 'vocab' } }),
    prisma.srsCard.count({
      where: { userId, itemType: 'vocab', interval: { gte: MATURE_INTERVAL_DAYS } },
    }),
    prisma.srsCard.count({
      where: { userId, itemType: 'vocab', dueDate: { lte: new Date() } },
    }),
  ])

  return { total, mature, learning: total - mature, dueToday }
}

/**
 * Unit tiếp theo nên học: unit chưa hoàn thành đầu tiên ở cấp độ hiện tại,
 * nếu cấp đó đã xong hết thì tìm sang cấp kế tiếp.
 */
export async function getNextUnit(
  userId: string,
  currentLevel: string,
): Promise<UnitWithMeta | null> {
  const progressMap = await getUnitProgressMap(userId)
  const startIndex = Math.max(0, LEVEL_CODES.indexOf(currentLevel as never))

  const ordered = [
    ...LEVEL_CODES.slice(startIndex),
    ...LEVEL_CODES.slice(0, startIndex),
  ]

  for (const level of ordered) {
    for (const unit of getUnitsByLevel(level)) {
      if (!isUnitComplete(unit, progressMap.get(unit.id))) return unit
    }
  }

  return getAllUnits()[0] ?? null
}

// ---------------------------------------------------------------------------
// Phân tích điểm yếu
// ---------------------------------------------------------------------------

export const SKILL_LABELS: Record<string, string> = {
  'noun-gender': 'Giống của danh từ (der/die/das)',
  'verb-conjugation': 'Chia động từ',
  'word-order': 'Trật tự từ trong câu',
  cases: 'Các cách (Nominativ/Akkusativ/Dativ/Genitiv)',
  prepositions: 'Giới từ',
  articles: 'Mạo từ',
  plural: 'Số nhiều',
  'adjective-endings': 'Đuôi tính từ',
  tenses: 'Thì của động từ',
  subjunctive: 'Konjunktiv',
  passive: 'Câu bị động',
  'subordinate-clauses': 'Mệnh đề phụ',
  connectors: 'Liên từ',
  listening: 'Nghe hiểu',
  translation: 'Dịch',
  vocabulary: 'Từ vựng',
  pronunciation: 'Phát âm & chính tả',
  numbers: 'Số đếm',
  time: 'Thời gian',
}

export function skillLabel(tag: string): string {
  return SKILL_LABELS[tag] ?? tag
}

export type WeakSpot = {
  skillTag: string
  label: string
  total: number
  wrong: number
  accuracy: number
}

/**
 * Thống kê tỉ lệ đúng theo từng nhóm kỹ năng, dựa trên 300 lượt trả lời gần nhất.
 * Chỉ tính nhóm có ít nhất 4 lượt để tránh kết luận vội.
 */
export async function getWeakSpots(userId: string, limit = 5): Promise<WeakSpot[]> {
  const attempts = await prisma.attempt.findMany({
    where: { userId, skillTag: { not: null } },
    select: { skillTag: true, correct: true },
    orderBy: { createdAt: 'desc' },
    take: 300,
  })

  const buckets = new Map<string, { total: number; wrong: number }>()
  for (const attempt of attempts) {
    const tag = attempt.skillTag!
    const bucket = buckets.get(tag) ?? { total: 0, wrong: 0 }
    bucket.total += 1
    if (!attempt.correct) bucket.wrong += 1
    buckets.set(tag, bucket)
  }

  return [...buckets.entries()]
    .filter(([, bucket]) => bucket.total >= 4)
    .map(([skillTag, bucket]) => ({
      skillTag,
      label: skillLabel(skillTag),
      total: bucket.total,
      wrong: bucket.wrong,
      accuracy: percent(bucket.total - bucket.wrong, bucket.total),
    }))
    .sort((a, b) => a.accuracy - b.accuracy || b.total - a.total)
    .slice(0, limit)
}
