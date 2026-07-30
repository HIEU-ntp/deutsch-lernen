import type { Metadata } from 'next'
import Link from 'next/link'

import { GrammarPointCard } from '@/components/learn/grammar-section'
import { Container, EmptyState, PageHeader } from '@/components/ui'
import { getAllGrammarPoints } from '@/lib/content/loader'
import { LEVEL_CODES } from '@/lib/content/schema'
import { levelTheme } from '@/lib/level-theme'
import { cn, levelToSlug } from '@/lib/utils'

export const metadata: Metadata = {
  title: 'Ngữ pháp tra cứu',
  description:
    'Toàn bộ điểm ngữ pháp từ A1 đến C2 ở một chỗ: bảng biến cách, chia động từ, giới từ đi với cách nào.',
}

type Props = { searchParams: Promise<{ level?: string; q?: string }> }

export default async function GrammarPage({ searchParams }: Props) {
  const { level: levelFilter, q } = await searchParams
  const query = (q ?? '').trim().toLowerCase()

  const all = getAllGrammarPoints()

  const filtered = all.filter(({ point, unit }) => {
    if (levelFilter && unit.level !== levelFilter) return false
    if (!query) return true

    const haystack = [
      point.title,
      point.titleVi,
      point.summary,
      point.explanation,
      ...point.tags,
      unit.titleVi,
    ]
      .join(' ')
      .toLowerCase()

    return haystack.includes(query)
  })

  // Nhóm theo cấp độ để dễ nhìn
  const grouped = new Map<string, typeof filtered>()
  for (const entry of filtered) {
    const list = grouped.get(entry.unit.level) ?? []
    list.push(entry)
    grouped.set(entry.unit.level, list)
  }

  return (
    <Container>
      <PageHeader
        title="Ngữ pháp tra cứu"
        description={`${all.length} điểm ngữ pháp từ A1.1 đến C2. Tra nhanh khi cần, không phải học tuần tự.`}
      />

      {/* Form GET nên vẫn hoạt động khi JavaScript bị tắt */}
      <form method="get" className="mb-5">
        <div className="flex flex-col gap-2 sm:flex-row">
          <input
            type="search"
            name="q"
            defaultValue={q ?? ''}
            placeholder="Tìm: Akkusativ, Konjunktiv, giới từ…"
            className="input flex-1"
            aria-label="Tìm điểm ngữ pháp"
          />
          <button type="submit" className="btn-primary">
            Tìm
          </button>
        </div>

        <div className="no-scrollbar mt-3 flex gap-1.5 overflow-x-auto pb-1">
          <FilterChip label="Tất cả" href={q ? `/grammar?q=${encodeURIComponent(q)}` : '/grammar'} active={!levelFilter} />
          {LEVEL_CODES.map((code) => {
            const count = all.filter((entry) => entry.unit.level === code).length
            if (count === 0) return null
            const params = new URLSearchParams()
            params.set('level', code)
            if (q) params.set('q', q)
            return (
              <FilterChip
                key={code}
                label={`${code} (${count})`}
                href={`/grammar?${params.toString()}`}
                active={levelFilter === code}
                className={levelTheme(code).chip}
              />
            )
          })}
        </div>
      </form>

      {filtered.length === 0 ? (
        <EmptyState
          title="Không tìm thấy điểm ngữ pháp nào"
          description={
            query
              ? `Không có kết quả cho "${q}". Thử từ khoá khác, ví dụ "Akkusativ" hoặc "động từ".`
              : 'Cấp độ này chưa có nội dung ngữ pháp.'
          }
          action={{ href: '/grammar', label: 'Xoá bộ lọc' }}
        />
      ) : (
        <div className="space-y-8">
          {LEVEL_CODES.filter((code) => grouped.has(code)).map((code) => (
            <section key={code}>
              <div className="mb-3 flex items-center gap-2">
                <span className={`chip ${levelTheme(code).chip} font-bold`}>{code}</span>
                <span className="text-ink-400 text-xs">{grouped.get(code)!.length} điểm ngữ pháp</span>
              </div>

              <div className="space-y-4">
                {grouped.get(code)!.map(({ point, unit }) => (
                  <div key={point.id}>
                    <GrammarPointCard point={point} />
                    <p className="text-ink-400 mt-1.5 px-1 text-xs">
                      Trong bài{' '}
                      <Link
                        href={`/learn/${levelToSlug(unit.level)}/${unit.slug}?tab=grammar`}
                        className="hover:text-ink-600 underline"
                      >
                        {unit.titleVi}
                      </Link>
                    </p>
                  </div>
                ))}
              </div>
            </section>
          ))}
        </div>
      )}
    </Container>
  )
}

function FilterChip({
  label,
  href,
  active,
  className,
}: {
  label: string
  href: string
  active: boolean
  className?: string
}) {
  return (
    <Link
      href={href}
      className={cn(
        'chip shrink-0 whitespace-nowrap transition',
        active ? 'bg-ink-900 text-white' : (className ?? 'bg-ink-100 text-ink-600'),
      )}
    >
      {label}
    </Link>
  )
}
