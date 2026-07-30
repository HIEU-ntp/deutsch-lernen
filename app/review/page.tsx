import type { Metadata } from 'next'
import Link from 'next/link'

import { RepeatIcon } from '@/components/icons'
import { ReviewSession, type SessionCard } from '@/components/review/review-session'
import { Container, EmptyState, PageHeader } from '@/components/ui'
import { requireUser } from '@/lib/auth'
import { getUnitById } from '@/lib/content/loader'
import { levelTheme } from '@/lib/level-theme'
import { getDueCards, getDueSummary } from '@/lib/srs-service'
import { formatRelativeDays } from '@/lib/utils'

export const metadata: Metadata = {
  title: 'Ôn tập hôm nay',
  description: 'Toàn bộ từ vựng và ngữ pháp đã tới hạn ôn, gộp chung mọi cấp độ.',
}

/** Số thẻ tối đa nạp trong một phiên, để phiên học không dài vô tận. */
const SESSION_LIMIT = 40

export default async function ReviewPage() {
  const user = await requireUser('/review')

  const [cards, summary] = await Promise.all([
    getDueCards(user.id, SESSION_LIMIT),
    getDueSummary(user.id),
  ])

  const sessionCards: SessionCard[] = cards.map((card) => ({
    id: card.id,
    itemType: card.itemType,
    level: card.level,
    unitId: card.unitId,
    unitSlug: getUnitById(card.unitId)?.slug ?? '',
    state: card.state,
    vocab: card.vocab,
    grammar: card.grammar,
  }))

  return (
    <Container className="max-w-2xl">
      <PageHeader
        title="Ôn tập hôm nay"
        description={
          summary.total > 0
            ? `${summary.total} thẻ đã tới hạn (${summary.vocab} từ vựng, ${summary.grammar} ngữ pháp) — gộp chung mọi cấp độ.`
            : undefined
        }
      />

      {sessionCards.length === 0 ? (
        <div className="space-y-4">
          <EmptyState
            icon={<RepeatIcon width={40} height={40} />}
            title="Hôm nay không có thẻ nào tới hạn"
            description="Hệ thống chỉ nhắc ôn đúng lúc bạn sắp quên. Hãy học bài mới, những từ đó sẽ tự động xuất hiện ở đây vào đúng thời điểm."
            action={{ href: '/levels', label: 'Học bài mới' }}
          />

          {summary.upcoming.length > 0 ? (
            <div className="card p-5">
              <h2 className="section-title mb-3">Sắp tới hạn</h2>
              <ul className="space-y-2">
                {summary.upcoming.map((day) => {
                  const days = Math.round(
                    (new Date(`${day.date}T00:00:00`).getTime() - new Date().setHours(0, 0, 0, 0)) /
                      86_400_000,
                  )
                  return (
                    <li key={day.date} className="text-ink-600 flex justify-between text-sm">
                      <span>{formatRelativeDays(days)}</span>
                      <span className="text-ink-900 font-semibold tabular-nums">
                        {day.count} thẻ
                      </span>
                    </li>
                  )
                })}
              </ul>
            </div>
          ) : null}
        </div>
      ) : (
        <>
          {summary.byLevel.length > 1 ? (
            <div className="mb-4 flex flex-wrap gap-2">
              {summary.byLevel.map(({ level, count }) => (
                <span key={level} className={`chip ${levelTheme(level).chip}`}>
                  {level}: {count}
                </span>
              ))}
            </div>
          ) : null}

          <ReviewSession cards={sessionCards} />

          {summary.total > SESSION_LIMIT ? (
            <p className="text-ink-400 mt-4 text-center text-xs">
              Phiên này nạp {SESSION_LIMIT} thẻ. Còn {summary.total - SESSION_LIMIT} thẻ nữa — làm
              xong phiên này rồi tải lại trang để tiếp tục.
            </p>
          ) : null}

          <p className="text-ink-400 mt-6 text-center text-xs">
            Cách chấm điểm dựa trên thuật toán SM-2.{' '}
            <Link href="/grammar" className="underline">
              Xem thêm ngữ pháp
            </Link>
          </p>
        </>
      )}
    </Container>
  )
}
