import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'

import { ArrowLeftIcon, CheckIcon } from '@/components/icons'
import { Container, EmptyState, PageHeader, ProgressBar } from '@/components/ui'
import { getCurrentUser } from '@/lib/auth'
import { getLevel, getUnitsByLevel } from '@/lib/content/loader'
import { LEVEL_CODES } from '@/lib/content/schema'
import { levelTheme } from '@/lib/level-theme'
import { getUnitProgressMap, isUnitComplete } from '@/lib/progress'
import { cn, levelToSlug, slugToLevel } from '@/lib/utils'

type Props = { params: Promise<{ level: string }> }

/** Sinh sẵn 10 trang cấp độ lúc build. */
export function generateStaticParams() {
  return LEVEL_CODES.map((code) => ({ level: levelToSlug(code) }))
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { level: levelSlug } = await params
  const level = getLevel(slugToLevel(levelSlug))
  if (!level) return { title: 'Không tìm thấy cấp độ' }
  return { title: level.title, description: level.descriptionVi }
}

export default async function LevelPage({ params }: Props) {
  const { level: levelSlug } = await params
  const levelCode = slugToLevel(levelSlug)
  const level = getLevel(levelCode)
  if (!level) notFound()

  const units = getUnitsByLevel(levelCode)
  const theme = levelTheme(levelCode)
  const user = await getCurrentUser()
  const progressMap = user ? await getUnitProgressMap(user.id) : new Map()

  const completedCount = units.filter((unit) => isUnitComplete(unit, progressMap.get(unit.id))).length

  return (
    <Container>
      <Link href="/levels" className="btn-ghost btn-sm -ml-3 mb-2">
        <ArrowLeftIcon width={16} height={16} />
        Tất cả cấp độ
      </Link>

      <PageHeader
        eyebrow={<span className={`chip ${theme.chip} font-bold`}>{level.code}</span>}
        title={level.title.split('—')[1]?.trim() ?? level.title}
        description={level.descriptionVi}
      />

      <div className="card mb-6 p-5">
        <h2 className="section-title">Học xong cấp này bạn có thể</h2>
        <ul className="mt-3 grid gap-2 sm:grid-cols-2">
          {level.canDo.map((item) => (
            <li key={item} className="text-ink-700 flex gap-2 text-sm">
              <CheckIcon width={16} height={16} className={cn('mt-0.5 shrink-0', theme.text)} />
              {item}
            </li>
          ))}
        </ul>

        {user && units.length > 0 ? (
          <div className="border-ink-100 mt-4 border-t pt-4">
            <div className="text-ink-500 mb-1.5 flex justify-between text-xs">
              <span>
                {completedCount}/{units.length} unit hoàn thành
              </span>
              <span className="font-semibold tabular-nums">
                {Math.round((completedCount / units.length) * 100)}%
              </span>
            </div>
            <ProgressBar
              value={(completedCount / units.length) * 100}
              tone={theme.bar}
              size="sm"
            />
          </div>
        ) : null}
      </div>

      <h2 className="section-title mb-3">Danh sách unit</h2>

      {units.length === 0 ? (
        <EmptyState
          title="Cấp độ này chưa có nội dung"
          description={`Khung dữ liệu đã sẵn sàng. Thêm file JSON vào content/units/${levelCode}/ là unit sẽ tự xuất hiện ở đây, không cần sửa code.`}
          action={{ href: '/levels', label: 'Chọn cấp độ khác' }}
        />
      ) : (
        <ol className="space-y-2.5">
          {units.map((unit) => {
            const progress = progressMap.get(unit.id)
            const done = isUnitComplete(unit, progress)
            const started = Boolean(progress)

            return (
              <li key={unit.id}>
                <Link
                  href={`/learn/${levelToSlug(unit.level)}/${unit.slug}`}
                  className="card hover:border-ink-300 flex items-center gap-4 p-4 transition hover:shadow-md"
                >
                  <span
                    className={cn(
                      'grid h-10 w-10 shrink-0 place-items-center rounded-xl text-sm font-bold',
                      done ? 'bg-emerald-500 text-white' : `${theme.soft} ${theme.text}`,
                    )}
                  >
                    {done ? <CheckIcon width={20} height={20} /> : unit.order}
                  </span>

                  <div className="min-w-0 flex-1">
                    <div className="text-ink-900 truncate font-semibold">{unit.titleVi}</div>
                    <div className="text-ink-500 de truncate text-sm">{unit.title}</div>
                    <div className="text-ink-400 mt-1 flex flex-wrap gap-x-3 text-xs">
                      <span>{unit.vocabulary.length} từ</span>
                      <span>{unit.grammar.length} ngữ pháp</span>
                      <span>{unit.exercises.length} bài tập</span>
                    </div>
                  </div>

                  {started && !done ? (
                    <span className="chip bg-amber-100 text-amber-800">Đang học</span>
                  ) : null}
                </Link>
              </li>
            )
          })}
        </ol>
      )}
    </Container>
  )
}
