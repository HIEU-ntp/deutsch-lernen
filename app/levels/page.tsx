import type { Metadata } from 'next'
import Link from 'next/link'

import { ArrowRightIcon, CheckIcon } from '@/components/icons'
import { Container, PageHeader, ProgressBar } from '@/components/ui'
import { getCurrentUser } from '@/lib/auth'
import { getLevelStats } from '@/lib/content/loader'
import { levelTheme } from '@/lib/level-theme'
import { computeLevelProgress, getUnitProgressMap, type LevelProgress } from '@/lib/progress'
import { levelToSlug } from '@/lib/utils'

export const metadata: Metadata = {
  title: 'Lộ trình A1 → C2',
  description: 'Toàn bộ 10 cấp độ theo khung tham chiếu CEFR.',
}

export default async function LevelsPage() {
  const user = await getCurrentUser()
  const stats = getLevelStats()

  let progressByLevel = new Map<string, LevelProgress>()
  if (user) {
    progressByLevel = computeLevelProgress(await getUnitProgressMap(user.id))
  }

  return (
    <Container>
      <PageHeader
        title="Lộ trình học"
        description="Mười cấp độ theo khung CEFR. Bạn có thể học tuần tự, hoặc nhảy thẳng tới cấp phù hợp sau khi làm bài kiểm tra xếp lớp."
        actions={
          user ? (
            <Link href="/placement" className="btn-secondary btn-sm">
              Kiểm tra xếp lớp
            </Link>
          ) : null
        }
      />

      <div className="space-y-3">
        {stats.map(({ level, unitCount, vocabCount, grammarCount, exerciseCount }) => {
          const theme = levelTheme(level.code)
          const progress = progressByLevel.get(level.code)
          const isCurrent = user?.currentLevel === level.code
          const isEmpty = unitCount === 0

          return (
            <Link
              key={level.code}
              href={`/levels/${levelToSlug(level.code)}`}
              className="card hover:border-ink-300 block p-5 transition hover:shadow-md"
            >
              <div className="flex flex-wrap items-start gap-x-3 gap-y-2">
                <span className={`chip ${theme.chip} font-bold`}>{level.code}</span>

                {isCurrent ? (
                  <span className="chip bg-brand-100 text-brand-700">Cấp độ của bạn</span>
                ) : null}

                {progress && progress.completedUnits === progress.totalUnits && unitCount > 0 ? (
                  <span className="chip bg-emerald-100 text-emerald-800">
                    <CheckIcon width={13} height={13} />
                    Hoàn thành
                  </span>
                ) : null}

                {isEmpty ? (
                  <span className="chip bg-ink-100 text-ink-500">Chưa có nội dung</span>
                ) : null}

                <ArrowRightIcon className="text-ink-400 ml-auto mt-1" width={18} height={18} />
              </div>

              <h2 className="text-ink-900 mt-2.5 text-lg font-bold">
                {level.title.split('—')[1]?.trim() ?? level.title}
              </h2>
              <p className="text-ink-600 mt-1 text-sm">{level.descriptionVi}</p>

              <div className="text-ink-500 mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs">
                <span>{unitCount} unit</span>
                <span>{vocabCount} từ vựng</span>
                <span>{grammarCount} điểm ngữ pháp</span>
                <span>{exerciseCount} bài tập</span>
                {level.estimatedHours ? <span>~{level.estimatedHours} giờ học</span> : null}
              </div>

              {user && progress && progress.totalUnits > 0 ? (
                <div className="mt-3">
                  <div className="text-ink-500 mb-1 flex justify-between text-xs">
                    <span>
                      {progress.completedUnits}/{progress.totalUnits} unit hoàn thành
                    </span>
                    <span className="font-semibold tabular-nums">{progress.percent}%</span>
                  </div>
                  <ProgressBar value={progress.percent} tone={theme.bar} size="sm" />
                </div>
              ) : null}
            </Link>
          )
        })}
      </div>
    </Container>
  )
}
