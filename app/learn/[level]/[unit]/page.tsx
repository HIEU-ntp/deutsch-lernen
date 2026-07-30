import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'

import { ExercisePlayer } from '@/components/exercises/exercise-player'
import { ArrowLeftIcon, ArrowRightIcon } from '@/components/icons'
import { GrammarSection } from '@/components/learn/grammar-section'
import { SectionCompleteButton } from '@/components/learn/section-complete-button'
import { VocabSection } from '@/components/learn/vocab-section'
import { Container } from '@/components/ui'
import { getCurrentUser } from '@/lib/auth'
import { getAllUnits, getUnitBySlug, getUnitNeighbours } from '@/lib/content/loader'
import { prisma } from '@/lib/db'
import { levelTheme } from '@/lib/level-theme'
import { cn, levelToSlug, slugToLevel } from '@/lib/utils'

type Props = {
  params: Promise<{ level: string; unit: string }>
  searchParams: Promise<{ tab?: string }>
}

const TABS = [
  { key: 'vocab', label: 'Từ vựng' },
  { key: 'grammar', label: 'Ngữ pháp' },
  { key: 'exercises', label: 'Bài tập' },
] as const

type TabKey = (typeof TABS)[number]['key']

export function generateStaticParams() {
  return getAllUnits().map((unit) => ({
    level: levelToSlug(unit.level),
    unit: unit.slug,
  }))
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { level, unit: unitSlug } = await params
  const unit = getUnitBySlug(slugToLevel(level), unitSlug)
  if (!unit) return { title: 'Không tìm thấy bài học' }
  return {
    title: `${unit.titleVi} · ${unit.level}`,
    description: unit.description,
  }
}

export default async function UnitPage({ params, searchParams }: Props) {
  const { level: levelSlug, unit: unitSlug } = await params
  const { tab } = await searchParams

  const levelCode = slugToLevel(levelSlug)
  const unit = getUnitBySlug(levelCode, unitSlug)
  if (!unit) notFound()

  const activeTab: TabKey = TABS.some((t) => t.key === tab) ? (tab as TabKey) : 'vocab'
  const user = await getCurrentUser()
  const progress = user
    ? await prisma.unitProgress.findUnique({
        where: { userId_unitId: { userId: user.id, unitId: unit.id } },
        select: { vocabDone: true, grammarDone: true, exercisesDone: true, bestScore: true },
      })
    : null

  const theme = levelTheme(unit.level)
  const { previous, next } = getUnitNeighbours(unit)
  const basePath = `/learn/${levelToSlug(unit.level)}/${unit.slug}`

  const counts: Record<TabKey, number> = {
    vocab: unit.vocabulary.length,
    grammar: unit.grammar.length,
    exercises: unit.exercises.length,
  }

  return (
    <Container>
      <Link href={`/levels/${levelToSlug(unit.level)}`} className="btn-ghost btn-sm -ml-3 mb-2">
        <ArrowLeftIcon width={16} height={16} />
        {unit.level}
      </Link>

      <header className="mb-5">
        <div className="mb-1.5 flex flex-wrap items-center gap-2">
          <span className={`chip ${theme.chip} font-bold`}>{unit.level}</span>
          <span className="text-ink-400 text-xs font-medium">Unit {unit.order}</span>
        </div>
        <h1 className="text-ink-900 text-2xl font-bold tracking-tight sm:text-3xl">{unit.titleVi}</h1>
        <p className="de text-ink-500 mt-1">{unit.title}</p>
        {unit.description ? (
          <p className="text-ink-600 mt-2.5 max-w-2xl text-sm">{unit.description}</p>
        ) : null}

        {unit.goals.length > 0 ? (
          <ul className="mt-3 flex flex-wrap gap-2">
            {unit.goals.map((goal) => (
              <li key={goal} className={`chip ${theme.soft} ${theme.text}`}>
                {goal}
              </li>
            ))}
          </ul>
        ) : null}
      </header>

      {/* Dải tab — cuộn ngang được trên màn hình hẹp */}
      <div className="border-ink-200 no-scrollbar mb-5 flex gap-1 overflow-x-auto border-b">
        {TABS.map(({ key, label }) => (
          <Link
            key={key}
            href={key === 'vocab' ? basePath : `${basePath}?tab=${key}`}
            scroll={false}
            className={cn(
              '-mb-px flex items-center gap-1.5 border-b-2 px-4 py-2.5 text-sm font-semibold whitespace-nowrap transition',
              activeTab === key
                ? 'border-brand-600 text-brand-700'
                : 'text-ink-500 hover:text-ink-800 border-transparent',
            )}
          >
            {label}
            <span
              className={cn(
                'rounded-full px-1.5 py-0.5 text-[10px] tabular-nums',
                activeTab === key ? 'bg-brand-100 text-brand-700' : 'bg-ink-100 text-ink-500',
              )}
            >
              {counts[key]}
            </span>
          </Link>
        ))}
      </div>

      {activeTab === 'vocab' ? (
        <>
          <VocabSection items={unit.vocabulary} />
          <SectionCompleteButton
            unitId={unit.id}
            itemType="vocab"
            itemCount={unit.vocabulary.length}
            alreadyDone={Boolean(progress?.vocabDone)}
            isLoggedIn={Boolean(user)}
          />
        </>
      ) : null}

      {activeTab === 'grammar' ? (
        <>
          <GrammarSection points={unit.grammar} />
          <SectionCompleteButton
            unitId={unit.id}
            itemType="grammar"
            itemCount={unit.grammar.length}
            alreadyDone={Boolean(progress?.grammarDone)}
            isLoggedIn={Boolean(user)}
          />
        </>
      ) : null}
      {activeTab === 'exercises' ? (
        unit.exercises.length > 0 ? (
          <ExercisePlayer
            unitId={unit.id}
            level={unit.level}
            exercises={unit.exercises}
            isLoggedIn={Boolean(user)}
            nextUnitHref={next ? `/learn/${levelToSlug(next.level)}/${next.slug}?tab=exercises` : null}
          />
        ) : (
          <p className="text-ink-500 text-sm">Unit này chưa có bài tập.</p>
        )
      ) : null}

      <nav className="border-ink-200 mt-8 flex items-center justify-between gap-3 border-t pt-5">
        {previous ? (
          <Link
            href={`/learn/${levelToSlug(previous.level)}/${previous.slug}`}
            className="btn-secondary btn-sm min-w-0"
          >
            <ArrowLeftIcon width={16} height={16} />
            <span className="truncate">{previous.titleVi}</span>
          </Link>
        ) : (
          <span />
        )}

        {next ? (
          <Link
            href={`/learn/${levelToSlug(next.level)}/${next.slug}`}
            className="btn-primary btn-sm min-w-0"
          >
            <span className="truncate">{next.titleVi}</span>
            <ArrowRightIcon width={16} height={16} />
          </Link>
        ) : (
          <span />
        )}
      </nav>
    </Container>
  )
}
