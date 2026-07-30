'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState } from 'react'

import { ArrowRightIcon, CheckIcon, CloseIcon, CompassIcon } from '@/components/icons'
import { ProgressBar } from '@/components/ui'
import type { PlacementQuestion } from '@/lib/content/schema'
import { levelTheme } from '@/lib/level-theme'
import type { LevelBreakdown } from '@/lib/placement'
import { cn, levelToSlug } from '@/lib/utils'

type Outcome = {
  suggestedLevel: string
  score: number
  total: number
  breakdown: LevelBreakdown[]
  comment: string
}

/**
 * Bài kiểm tra xếp lớp.
 *
 * Cố tình KHÔNG hiện đúng/sai sau từng câu: mục tiêu là đo trình độ, không phải
 * dạy. Người học có thể bấm "Chưa biết" để bỏ qua — thà bỏ qua còn hơn đoán mò
 * rồi bị xếp nhầm lên cấp quá cao.
 */
export function PlacementTest({ questions }: { questions: PlacementQuestion[] }) {
  const router = useRouter()

  const [index, setIndex] = useState(0)
  const [answers, setAnswers] = useState<Record<string, number>>({})
  const [selected, setSelected] = useState<number | null>(null)
  const [outcome, setOutcome] = useState<Outcome | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const question = questions[index]
  const isLast = index === questions.length - 1

  async function submit(finalAnswers: Record<string, number>) {
    setSubmitting(true)
    setError(null)
    try {
      const response = await fetch('/api/placement', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ answers: finalAnswers }),
      })
      if (!response.ok) {
        setError('Không lưu được kết quả. Vui lòng thử lại.')
        setSubmitting(false)
        return
      }
      setOutcome((await response.json()) as Outcome)
      router.refresh()
    } catch {
      setError('Không kết nối được tới máy chủ.')
    } finally {
      setSubmitting(false)
    }
  }

  function next(choice: number | null) {
    const updated =
      choice === null ? answers : { ...answers, [question.id]: choice }
    setAnswers(updated)
    setSelected(null)

    if (isLast) {
      void submit(updated)
    } else {
      setIndex(index + 1)
    }
  }

  // -------------------------------------------------------------------------
  // Kết quả
  // -------------------------------------------------------------------------

  if (outcome) {
    const theme = levelTheme(outcome.suggestedLevel)

    return (
      <div className="card p-6 text-center">
        <div className="bg-brand-50 text-brand-600 mx-auto grid h-16 w-16 place-items-center rounded-full">
          <CompassIcon width={32} height={32} />
        </div>

        <p className="text-ink-500 mt-4 text-sm">Bạn nên bắt đầu từ</p>
        <p className={cn('mt-1 text-4xl font-bold', theme.text)}>{outcome.suggestedLevel}</p>
        <p className="text-ink-600 mx-auto mt-3 max-w-md text-sm">{outcome.comment}</p>

        <p className="text-ink-500 mt-3 text-sm">
          Đúng {outcome.score}/{outcome.total} câu
        </p>

        <div className="mt-5 text-left">
          <h3 className="text-ink-700 mb-2 text-sm font-semibold">Chi tiết theo cấp độ</h3>
          <ul className="space-y-1.5">
            {outcome.breakdown.map((row) => (
              <li
                key={row.level}
                className="bg-ink-50 flex items-center justify-between rounded-lg px-3 py-2 text-sm"
              >
                <span className="flex items-center gap-2">
                  <span
                    className={cn(
                      'grid h-5 w-5 place-items-center rounded-full text-white',
                      row.passed ? 'bg-emerald-500' : 'bg-ink-300',
                    )}
                  >
                    {row.passed ? <CheckIcon width={12} height={12} /> : <CloseIcon width={12} height={12} />}
                  </span>
                  <span className={`chip ${levelTheme(row.level).chip}`}>{row.level}</span>
                </span>
                <span className="text-ink-600 tabular-nums">
                  {row.correct}/{row.total}
                </span>
              </li>
            ))}
          </ul>
        </div>

        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <Link href={`/levels/${levelToSlug(outcome.suggestedLevel)}`} className="btn-primary">
            Bắt đầu học {outcome.suggestedLevel}
            <ArrowRightIcon width={16} height={16} />
          </Link>
          <Link href="/levels" className="btn-secondary">
            Xem toàn bộ lộ trình
          </Link>
        </div>
      </div>
    )
  }

  // -------------------------------------------------------------------------
  // Làm bài
  // -------------------------------------------------------------------------

  return (
    <div>
      <div className="mb-4">
        <div className="text-ink-500 mb-1.5 flex justify-between text-xs font-medium">
          <span>
            Câu {index + 1}/{questions.length}
          </span>
          <span>Không hiện đúng/sai cho tới khi làm xong</span>
        </div>
        <ProgressBar value={(index / questions.length) * 100} size="sm" />
      </div>

      <div className="card p-5">
        <p className="de text-ink-900 text-lg">{question.prompt}</p>
        {question.promptVi ? (
          <p className="text-ink-500 mt-1 text-sm">{question.promptVi}</p>
        ) : null}

        <div className="mt-4 grid gap-2">
          {question.options.map((option, optionIndex) => (
            <button
              key={optionIndex}
              type="button"
              onClick={() => setSelected(optionIndex)}
              className={cn(
                'de w-full cursor-pointer rounded-xl border px-4 py-3 text-left text-sm transition',
                selected === optionIndex
                  ? 'border-brand-500 bg-brand-50 ring-brand-100 ring-2'
                  : 'border-ink-200 hover:border-ink-300 hover:bg-ink-50 bg-white',
              )}
            >
              {option}
            </button>
          ))}
        </div>
      </div>

      {error ? (
        <p role="alert" className="mt-3 rounded-xl bg-rose-50 px-3 py-2.5 text-sm text-rose-800">
          {error}
        </p>
      ) : null}

      <div className="mt-4 flex gap-2">
        <button
          type="button"
          onClick={() => next(null)}
          disabled={submitting}
          className="btn-ghost"
        >
          Chưa biết
        </button>
        <button
          type="button"
          onClick={() => next(selected)}
          disabled={selected === null || submitting}
          className="btn-primary flex-1"
        >
          {submitting ? 'Đang chấm…' : isLast ? 'Xem kết quả' : 'Câu tiếp theo'}
        </button>
      </div>
    </div>
  )
}
