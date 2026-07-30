import { getGrammarPoint, getUnitById, getVocabItem } from './content/loader'
import type { GrammarPoint, UnitWithMeta, VocabItem } from './content/schema'
import { prisma } from './db'
import { reviewCard, type SrsState } from './srs'

/**
 * Cầu nối giữa thẻ SRS trong database và nội dung trong `content/`.
 *
 * Database chỉ lưu `itemId`, nội dung thật nằm ở file JSON. Nếu bạn xoá một từ
 * khỏi file bài học, thẻ tương ứng sẽ không giải được nội dung nữa — các hàm ở
 * đây bỏ qua thẻ đó thay vì làm sập trang, và `pruneOrphanCards` giúp dọn dẹp.
 */

export type ReviewCard = {
  id: string
  itemId: string
  itemType: string
  level: string
  unitId: string
  state: SrsState
  dueDate: Date
} & (
  | { itemType: 'vocab'; vocab: VocabItem; grammar?: never }
  | { itemType: 'grammar'; grammar: GrammarPoint; vocab?: never }
)

type RawCard = {
  id: string
  itemId: string
  itemType: string
  level: string
  unitId: string
  repetition: number
  interval: number
  easeFactor: number
  lapses: number
  dueDate: Date
}

function attachContent(card: RawCard): ReviewCard | null {
  const state: SrsState = {
    repetition: card.repetition,
    interval: card.interval,
    easeFactor: card.easeFactor,
    lapses: card.lapses,
  }

  const base = {
    id: card.id,
    itemId: card.itemId,
    level: card.level,
    unitId: card.unitId,
    state,
    dueDate: card.dueDate,
  }

  if (card.itemType === 'vocab') {
    const found = getVocabItem(card.itemId)
    return found ? { ...base, itemType: 'vocab', vocab: found.item } : null
  }

  if (card.itemType === 'grammar') {
    const found = getGrammarPoint(card.itemId)
    return found ? { ...base, itemType: 'grammar', grammar: found.point } : null
  }

  return null
}

/** Các thẻ đã tới hạn ôn, sắp xếp thẻ quá hạn lâu nhất lên trước. */
export async function getDueCards(userId: string, limit = 50, at = new Date()): Promise<ReviewCard[]> {
  const rows = await prisma.srsCard.findMany({
    where: { userId, dueDate: { lte: at } },
    orderBy: [{ dueDate: 'asc' }],
    take: limit,
  })

  return rows.map(attachContent).filter((card): card is ReviewCard => card !== null)
}

export type DueSummary = {
  total: number
  vocab: number
  grammar: number
  byLevel: { level: string; count: number }[]
  /** Số thẻ sẽ tới hạn trong 7 ngày tới, tính theo từng ngày */
  upcoming: { date: string; count: number }[]
}

export async function getDueSummary(userId: string, at = new Date()): Promise<DueSummary> {
  const due = await prisma.srsCard.findMany({
    where: { userId, dueDate: { lte: at } },
    select: { itemType: true, level: true },
  })

  const byLevel = new Map<string, number>()
  for (const card of due) byLevel.set(card.level, (byLevel.get(card.level) ?? 0) + 1)

  const weekAhead = new Date(at)
  weekAhead.setDate(weekAhead.getDate() + 7)

  const future = await prisma.srsCard.findMany({
    where: { userId, dueDate: { gt: at, lte: weekAhead } },
    select: { dueDate: true },
  })

  const byDate = new Map<string, number>()
  for (const card of future) {
    const key = card.dueDate.toISOString().slice(0, 10)
    byDate.set(key, (byDate.get(key) ?? 0) + 1)
  }

  return {
    total: due.length,
    vocab: due.filter((card) => card.itemType === 'vocab').length,
    grammar: due.filter((card) => card.itemType === 'grammar').length,
    byLevel: [...byLevel.entries()]
      .map(([level, count]) => ({ level, count }))
      .sort((a, b) => b.count - a.count),
    upcoming: [...byDate.entries()]
      .map(([date, count]) => ({ date, count }))
      .sort((a, b) => a.date.localeCompare(b.date)),
  }
}

/**
 * Tạo thẻ ôn tập cho toàn bộ từ vựng (hoặc ngữ pháp) của một unit.
 * Gọi khi người học bấm "Đã học xong" ở tab tương ứng. Bỏ qua item đã có thẻ.
 */
export async function seedCardsForUnit(
  userId: string,
  unit: UnitWithMeta,
  itemType: 'vocab' | 'grammar',
): Promise<number> {
  const itemIds =
    itemType === 'vocab' ? unit.vocabulary.map((item) => item.id) : unit.grammar.map((point) => point.id)

  if (itemIds.length === 0) return 0

  const existing = await prisma.srsCard.findMany({
    where: { userId, itemId: { in: itemIds } },
    select: { itemId: true },
  })
  const known = new Set(existing.map((row) => row.itemId))
  const missing = itemIds.filter((id) => !known.has(id))
  if (missing.length === 0) return 0

  const now = new Date()
  await prisma.srsCard.createMany({
    data: missing.map((itemId) => ({
      userId,
      itemId,
      itemType,
      level: unit.level,
      unitId: unit.id,
      dueDate: now, // tới hạn ngay để ôn lần đầu trong hôm nay
    })),
  })

  return missing.length
}

/** Áp dụng kết quả tự đánh giá cho một thẻ. */
export async function applyReview(
  userId: string,
  cardId: string,
  quality: number,
  now = new Date(),
): Promise<{ interval: number; dueDate: Date } | null> {
  const card = await prisma.srsCard.findFirst({ where: { id: cardId, userId } })
  if (!card) return null

  const next = reviewCard(
    {
      repetition: card.repetition,
      interval: card.interval,
      easeFactor: card.easeFactor,
      lapses: card.lapses,
    },
    quality,
    now,
  )

  await prisma.srsCard.update({
    where: { id: card.id },
    data: {
      repetition: next.repetition,
      interval: next.interval,
      easeFactor: next.easeFactor,
      lapses: next.lapses,
      dueDate: next.dueDate,
      lastReviewedAt: now,
    },
  })

  return { interval: next.interval, dueDate: next.dueDate }
}

/**
 * Xoá các thẻ trỏ tới nội dung không còn tồn tại trong `content/`
 * (ví dụ bạn đã xoá một từ khỏi file bài học).
 */
export async function pruneOrphanCards(userId: string): Promise<number> {
  const cards = await prisma.srsCard.findMany({
    where: { userId },
    select: { id: true, itemId: true, itemType: true, unitId: true },
  })

  const orphans = cards
    .filter((card) => {
      if (!getUnitById(card.unitId)) return true
      return card.itemType === 'vocab' ? !getVocabItem(card.itemId) : !getGrammarPoint(card.itemId)
    })
    .map((card) => card.id)

  if (orphans.length === 0) return 0

  await prisma.srsCard.deleteMany({ where: { id: { in: orphans } } })
  return orphans.length
}
