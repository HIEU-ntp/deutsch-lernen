import type { Metadata } from 'next'
import Link from 'next/link'

import {
  ArrowRightIcon,
  BookIcon,
  ChartIcon,
  FlameIcon,
  RepeatIcon,
  SparkIcon,
} from '@/components/icons'
import { Container, PageHeader, ProgressBar, StatCard } from '@/components/ui'
import { requireUser } from '@/lib/auth'
import { getLevel, getUnitsByLevel } from '@/lib/content/loader'
import { LEVEL_CODES } from '@/lib/content/schema'
import { prisma } from '@/lib/db'
import { BADGES, getBadge, rankForXp } from '@/lib/gamification'
import { levelTheme } from '@/lib/level-theme'
import {
  computeLevelProgress,
  getNextUnit,
  getUnitProgressMap,
  getVocabStats,
  getWeakSpots,
} from '@/lib/progress'
import { getDueSummary } from '@/lib/srs-service'
import { cn, levelToSlug } from '@/lib/utils'

export const metadata: Metadata = { title: 'Tiến trình của bạn' }

export default async function DashboardPage() {
  const user = await requireUser('/dashboard')

  const [progressMap, vocabStats, weakSpots, nextUnit, badges, dueSummary] = await Promise.all([
    getUnitProgressMap(user.id),
    getVocabStats(user.id),
    getWeakSpots(user.id),
    getNextUnit(user.id, user.currentLevel),
    prisma.badge.findMany({ where: { userId: user.id }, orderBy: { earnedAt: 'desc' } }),
    getDueSummary(user.id),
  ])

  const levelProgress = computeLevelProgress(progressMap)
  const rank = rankForXp(user.xp)
  const currentLevel = getLevel(user.currentLevel)

  const totalCompleted = [...levelProgress.values()].reduce((n, row) => n + row.completedUnits, 0)
  const totalUnits = [...levelProgress.values()].reduce((n, row) => n + row.totalUnits, 0)

  const earnedCodes = new Set(badges.map((badge) => badge.code))

  return (
    <Container>
      <PageHeader
        eyebrow={
          <span className="text-ink-500 text-sm">
            {rank.current.icon} {rank.current.name}
          </span>
        }
        title={`Chào ${user.name}!`}
        description={
          dueSummary.total > 0
            ? `Hôm nay có ${dueSummary.total} thẻ cần ôn lại.`
            : 'Hôm nay chưa có thẻ nào tới hạn ôn — thời điểm tốt để học bài mới.'
        }
        actions={
          dueSummary.total > 0 ? (
            <Link href="/review" className="btn-primary">
              <RepeatIcon width={17} height={17} />
              Ôn {dueSummary.total} thẻ
            </Link>
          ) : null
        }
      />

      {/* Chỉ số nhanh */}
      <section className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard
          label="Chuỗi ngày học"
          value={`${user.streakCount} ngày`}
          hint={`Kỷ lục: ${user.longestStreak} ngày`}
          icon={<FlameIcon width={15} height={15} />}
          tone="text-orange-500"
        />
        <StatCard
          label="Tổng XP"
          value={user.xp.toLocaleString('vi-VN')}
          hint={rank.next ? `Còn ${(rank.next.minXp - user.xp).toLocaleString('vi-VN')} XP tới ${rank.next.name}` : 'Cấp cao nhất'}
          icon={<SparkIcon width={15} height={15} />}
          tone="text-amber-500"
        />
        <StatCard
          label="Từ đã thuộc"
          value={vocabStats.mature}
          hint={`${vocabStats.total} từ đang trong lịch ôn`}
          icon={<BookIcon width={15} height={15} />}
          tone="text-emerald-600"
        />
        <StatCard
          label="Unit hoàn thành"
          value={`${totalCompleted}/${totalUnits}`}
          hint={`Cấp hiện tại: ${user.currentLevel}`}
          icon={<ChartIcon width={15} height={15} />}
        />
      </section>

      {/* Thanh tiến trình cấp bậc */}
      {rank.next ? (
        <div className="card mb-6 p-4">
          <div className="text-ink-600 mb-1.5 flex justify-between text-xs font-medium">
            <span>
              {rank.current.icon} {rank.current.name}
            </span>
            <span>
              {rank.next.icon} {rank.next.name}
            </span>
          </div>
          <ProgressBar value={rank.progress} tone="bg-amber-500" size="sm" />
        </div>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          {/* Học tiếp */}
          {nextUnit ? (
            <section>
              <h2 className="section-title mb-3">Học tiếp</h2>
              <Link
                href={`/learn/${levelToSlug(nextUnit.level)}/${nextUnit.slug}`}
                className="card hover:border-ink-300 flex items-center gap-4 p-5 transition hover:shadow-md"
              >
                <span
                  className={cn(
                    'grid h-12 w-12 shrink-0 place-items-center rounded-xl text-lg font-bold',
                    levelTheme(nextUnit.level).soft,
                    levelTheme(nextUnit.level).text,
                  )}
                >
                  {nextUnit.order}
                </span>
                <div className="min-w-0 flex-1">
                  <span className={`chip ${levelTheme(nextUnit.level).chip} mb-1`}>
                    {nextUnit.level}
                  </span>
                  <div className="text-ink-900 truncate font-semibold">{nextUnit.titleVi}</div>
                  <div className="de text-ink-500 truncate text-sm">{nextUnit.title}</div>
                </div>
                <ArrowRightIcon className="text-ink-400" />
              </Link>
            </section>
          ) : null}

          {/* Tiến trình theo cấp độ */}
          <section>
            <h2 className="section-title mb-3">Tiến trình theo cấp độ</h2>
            <div className="card divide-ink-100 divide-y">
              {LEVEL_CODES.map((code) => {
                const progress = levelProgress.get(code)
                const units = getUnitsByLevel(code)
                const theme = levelTheme(code)

                return (
                  <Link
                    key={code}
                    href={`/levels/${levelToSlug(code)}`}
                    className="hover:bg-ink-50 flex items-center gap-3 px-4 py-3 transition"
                  >
                    <span className={`chip ${theme.chip} w-14 justify-center font-bold`}>{code}</span>
                    <div className="min-w-0 flex-1">
                      <ProgressBar value={progress?.percent ?? 0} tone={theme.bar} size="sm" />
                    </div>
                    <span className="text-ink-500 w-20 shrink-0 text-right text-xs tabular-nums">
                      {units.length === 0
                        ? 'chưa có bài'
                        : `${progress?.completedUnits ?? 0}/${units.length} unit`}
                    </span>
                  </Link>
                )
              })}
            </div>
          </section>

          {/* Điểm yếu */}
          <section>
            <h2 className="section-title mb-1">Điểm yếu cần luyện</h2>
            <p className="text-ink-500 mb-3 text-sm">
              Dựa trên 300 lượt trả lời gần nhất, chỉ tính nhóm có từ 4 lượt trở lên.
            </p>

            {weakSpots.length === 0 ? (
              <div className="card text-ink-500 p-5 text-sm">
                Chưa đủ dữ liệu. Hãy làm thêm bài tập để hệ thống nhận ra bạn hay sai ở đâu.
              </div>
            ) : (
              <div className="card divide-ink-100 divide-y">
                {weakSpots.map((spot) => (
                  <div key={spot.skillTag} className="px-4 py-3">
                    <div className="mb-1.5 flex items-baseline justify-between gap-3">
                      <span className="text-ink-800 text-sm font-medium">{spot.label}</span>
                      <span
                        className={cn(
                          'shrink-0 text-sm font-bold tabular-nums',
                          spot.accuracy >= 80
                            ? 'text-emerald-600'
                            : spot.accuracy >= 60
                              ? 'text-amber-600'
                              : 'text-rose-600',
                        )}
                      >
                        {spot.accuracy}%
                      </span>
                    </div>
                    <ProgressBar
                      value={spot.accuracy}
                      size="sm"
                      tone={
                        spot.accuracy >= 80
                          ? 'bg-emerald-500'
                          : spot.accuracy >= 60
                            ? 'bg-amber-500'
                            : 'bg-rose-500'
                      }
                    />
                    <p className="text-ink-400 mt-1 text-xs">
                      Sai {spot.wrong}/{spot.total} lượt
                    </p>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>

        {/* Cột phải */}
        <div className="space-y-6">
          {currentLevel ? (
            <section className="card p-5">
              <h2 className="section-title mb-1">Cấp độ hiện tại</h2>
              <span className={`chip ${levelTheme(currentLevel.code).chip} font-bold`}>
                {currentLevel.code}
              </span>
              <p className="text-ink-600 mt-2 text-sm">{currentLevel.descriptionVi}</p>
              <Link href="/placement" className="btn-secondary btn-sm mt-3 w-full">
                Làm lại bài xếp lớp
              </Link>
            </section>
          ) : null}

          {dueSummary.upcoming.length > 0 ? (
            <section className="card p-5">
              <h2 className="section-title mb-3">Lịch ôn 7 ngày tới</h2>
              <ul className="space-y-1.5">
                {dueSummary.upcoming.map((day) => (
                  <li key={day.date} className="text-ink-600 flex justify-between text-sm">
                    <span>
                      {new Date(`${day.date}T00:00:00`).toLocaleDateString('vi-VN', {
                        weekday: 'short',
                        day: '2-digit',
                        month: '2-digit',
                      })}
                    </span>
                    <span className="text-ink-900 font-semibold tabular-nums">{day.count}</span>
                  </li>
                ))}
              </ul>
            </section>
          ) : null}

          <section className="card p-5">
            <h2 className="section-title mb-3">
              Huy hiệu{' '}
              <span className="text-ink-400 text-sm font-normal">
                {badges.length}/{BADGES.length}
              </span>
            </h2>

            {badges.length > 0 ? (
              <ul className="mb-4 space-y-2">
                {badges.slice(0, 6).map((badge) => {
                  const definition = getBadge(badge.code)
                  return (
                    <li key={badge.id} className="flex items-center gap-2.5">
                      <span className="grid h-9 w-9 place-items-center rounded-lg bg-amber-50 text-lg">
                        {definition.icon}
                      </span>
                      <div className="min-w-0">
                        <div className="text-ink-800 truncate text-sm font-semibold">
                          {definition.title}
                        </div>
                        <div className="text-ink-400 truncate text-xs">{definition.description}</div>
                      </div>
                    </li>
                  )
                })}
              </ul>
            ) : (
              <p className="text-ink-500 mb-4 text-sm">Chưa có huy hiệu nào. Bắt đầu thôi!</p>
            )}

            <details className="group">
              <summary className="text-ink-500 hover:text-ink-700 cursor-pointer text-xs font-medium">
                Xem tất cả huy hiệu
              </summary>
              <ul className="mt-2.5 grid grid-cols-6 gap-1.5">
                {BADGES.map((badge) => (
                  <li
                    key={badge.code}
                    title={`${badge.title} — ${badge.description}`}
                    className={cn(
                      'grid aspect-square place-items-center rounded-lg text-base',
                      earnedCodes.has(badge.code) ? 'bg-amber-50' : 'bg-ink-100 opacity-30 grayscale',
                    )}
                  >
                    {badge.icon}
                  </li>
                ))}
              </ul>
            </details>
          </section>
        </div>
      </div>
    </Container>
  )
}
