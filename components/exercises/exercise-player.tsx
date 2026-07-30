'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState } from 'react'

import { ExerciseView } from '@/components/exercises/views'
import { ArrowRightIcon, CheckIcon, CloseIcon, RepeatIcon, SparkIcon } from '@/components/icons'
import { ProgressBar } from '@/components/ui'
import { EXERCISE_TYPE_LABELS, type Exercise } from '@/lib/content/schema'
import { XP_RULES } from '@/lib/gamification'
import { defaultSkillTag, emptyAnswer, gradeExercise, isAnswerEmpty, type GradeResult } from '@/lib/grading'
import { cn, percent } from '@/lib/utils'

/**
 * Bộ chạy một phiên bài tập.
 *
 * Luồng: hiển thị từng câu → người học trả lời → bấm "Kiểm tra" → xem phản hồi
 * và giải thích → "Tiếp tục". Sai thì được "Thử lại" (điểm XP thấp hơn).
 * Cuối phiên hiện bảng tổng kết và gửi kết quả về server.
 */

type Props = {
  unitId: string
  level: string
  exercises: Exercise[]
  /** Chưa đăng nhập thì vẫn làm bài được, chỉ không lưu tiến trình. */
  isLoggedIn: boolean
  nextUnitHref: string | null
}

type Attempt = {
  exerciseId: string
  exerciseType: string
  correct: boolean
  skillTag: string
}

type FinishResponse = {
  xpGained: number
  newBadges: { code: string; title: string; icon: string }[]
  streak: number
}

export function ExercisePlayer({ unitId, level, exercises, isLoggedIn, nextUnitHref }: Props) {
  const router = useRouter()

  const [index, setIndex] = useState(0)
  const [answer, setAnswer] = useState<unknown>(() => emptyAnswer(exercises[0]))
  const [result, setResult] = useState<GradeResult | null>(null)
  const [attemptNo, setAttemptNo] = useState(0)
  const [triedOnce, setTriedOnce] = useState(false)

  /** Ghi lại kết quả lần trả lời ĐẦU TIÊN của mỗi câu — dùng để tính điểm. */
  const [firstTry, setFirstTry] = useState<Record<string, boolean>>({})
  const [attempts, setAttempts] = useState<Attempt[]>([])

  const [finished, setFinished] = useState(false)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState<FinishResponse | null>(null)

  const exercise = exercises[index]
  const isLast = index === exercises.length - 1

  function check() {
    if (!exercise || result) return
    const graded = gradeExercise(exercise, answer)
    setResult(graded)

    setAttempts((list) => [
      ...list,
      {
        exerciseId: exercise.id,
        exerciseType: exercise.type,
        correct: graded.correct,
        skillTag: exercise.skillTag ?? defaultSkillTag(exercise),
      },
    ])

    if (!(exercise.id in firstTry)) {
      setFirstTry((record) => ({ ...record, [exercise.id]: graded.correct }))
    }
  }

  function retry() {
    setResult(null)
    setAnswer(emptyAnswer(exercise))
    setAttemptNo((n) => n + 1)
    setTriedOnce(true)
  }

  async function goNext() {
    if (isLast) {
      await finish()
      return
    }
    const nextIndex = index + 1
    setIndex(nextIndex)
    setAnswer(emptyAnswer(exercises[nextIndex]))
    setResult(null)
    setAttemptNo(0)
    setTriedOnce(false)
  }

  const correctCount = Object.values(firstTry).filter(Boolean).length
  const score = percent(correctCount, exercises.length)

  async function finish() {
    setFinished(true)
    if (!isLoggedIn) return

    setSaving(true)
    try {
      const response = await fetch('/api/attempts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ unitId, level, score, attempts }),
      })
      if (response.ok) {
        setSaved((await response.json()) as FinishResponse)
        router.refresh()
      }
    } catch {
      // Mất mạng thì vẫn cho xem kết quả, chỉ là không lưu được.
    } finally {
      setSaving(false)
    }
  }

  function restart() {
    setIndex(0)
    setAnswer(emptyAnswer(exercises[0]))
    setResult(null)
    setAttemptNo(0)
    setTriedOnce(false)
    setFirstTry({})
    setAttempts([])
    setFinished(false)
    setSaved(null)
  }

  // -------------------------------------------------------------------------
  // Bảng tổng kết
  // -------------------------------------------------------------------------

  if (finished) {
    const wrong = exercises.filter((item) => firstTry[item.id] === false)
    const xpEstimate = exercises.reduce((total, item) => {
      if (firstTry[item.id]) return total + item.points
      if (item.id in firstTry) return total + XP_RULES.exerciseRetry
      return total
    }, 0)

    return (
      <div className="card p-6 text-center">
        <div
          className={cn(
            'mx-auto grid h-16 w-16 place-items-center rounded-full text-white',
            score >= 80 ? 'bg-emerald-500' : score >= 50 ? 'bg-amber-500' : 'bg-rose-500',
          )}
        >
          {score >= 80 ? <CheckIcon width={32} height={32} /> : <RepeatIcon width={30} height={30} />}
        </div>

        <h2 className="text-ink-900 mt-4 text-2xl font-bold">
          {score >= 80 ? 'Xuất sắc!' : score >= 50 ? 'Khá ổn!' : 'Cần luyện thêm'}
        </h2>
        <p className="text-ink-600 mt-1">
          Đúng {correctCount}/{exercises.length} câu ngay lần đầu ({score}%)
        </p>

        <div className="mt-4 flex items-center justify-center gap-2 text-sm">
          <span className="chip bg-amber-100 text-amber-800">
            <SparkIcon width={14} height={14} />+{saved?.xpGained ?? xpEstimate} XP
          </span>
          {saved && saved.streak > 0 ? (
            <span className="chip bg-orange-100 text-orange-800">🔥 {saved.streak} ngày liên tiếp</span>
          ) : null}
        </div>

        {saved?.newBadges.length ? (
          <div className="mt-4 rounded-xl bg-amber-50 p-4">
            <p className="text-sm font-semibold text-amber-900">Huy hiệu mới!</p>
            <div className="mt-2 flex flex-wrap justify-center gap-2">
              {saved.newBadges.map((badge) => (
                <span key={badge.code} className="chip border border-amber-200 bg-white">
                  <span aria-hidden="true">{badge.icon}</span> {badge.title}
                </span>
              ))}
            </div>
          </div>
        ) : null}

        {!isLoggedIn ? (
          <p className="text-ink-500 bg-ink-50 mt-4 rounded-xl p-3 text-sm">
            Bạn chưa đăng nhập nên kết quả không được lưu.{' '}
            <Link href="/register" className="text-brand-700 font-semibold underline">
              Tạo tài khoản
            </Link>{' '}
            để theo dõi tiến trình và ôn tập ngắt quãng.
          </p>
        ) : null}

        {saving ? <p className="text-ink-400 mt-3 text-xs">Đang lưu kết quả…</p> : null}

        {wrong.length > 0 ? (
          <div className="mt-5 text-left">
            <h3 className="text-ink-700 mb-2 text-sm font-semibold">Những câu cần xem lại</h3>
            <ul className="space-y-1.5">
              {wrong.map((item) => (
                <li key={item.id} className="bg-ink-50 text-ink-600 rounded-lg px-3 py-2 text-sm">
                  <span className="text-ink-400 text-xs">{EXERCISE_TYPE_LABELS[item.type]}</span>
                  <span className="text-ink-800 block">
                    {item.type === 'multiple_choice'
                      ? item.prompt
                      : item.type === 'fill_blank'
                        ? item.sentence.replace(/___/g, '___')
                        : item.type === 'translate'
                          ? item.source
                          : item.type === 'reorder'
                            ? item.answer.join(' ')
                            : item.type === 'conjugation'
                              ? `${item.verb} — ${item.tenseLabel}`
                              : item.type === 'listening'
                                ? (item.question ?? 'Bài nghe')
                                : (item.instruction ?? 'Nối từ')}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        ) : null}

        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button type="button" onClick={restart} className="btn-secondary">
            <RepeatIcon width={16} height={16} />
            Làm lại
          </button>
          {nextUnitHref ? (
            <Link href={nextUnitHref} className="btn-primary">
              Bài tiếp theo
              <ArrowRightIcon width={16} height={16} />
            </Link>
          ) : null}
        </div>
      </div>
    )
  }

  // -------------------------------------------------------------------------
  // Màn hình làm bài
  // -------------------------------------------------------------------------

  return (
    <div>
      <div className="mb-4">
        <div className="text-ink-500 mb-1.5 flex items-center justify-between text-xs font-medium">
          <span>
            Câu {index + 1}/{exercises.length} · {EXERCISE_TYPE_LABELS[exercise.type]}
          </span>
          <span className="tabular-nums">
            {correctCount} đúng
          </span>
        </div>
        <ProgressBar value={(index / exercises.length) * 100} size="sm" />
      </div>

      <div className="card p-5">
        <ExerciseView
          key={`${exercise.id}-${attemptNo}`}
          exercise={exercise}
          value={answer}
          onChange={setAnswer}
          result={result}
        />
      </div>

      {result ? (
        <div
          className={cn(
            'mt-4 rounded-2xl p-4',
            result.correct ? 'bg-emerald-50' : 'bg-rose-50',
          )}
        >
          <div className="flex items-start gap-2.5">
            <span
              className={cn(
                'mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-full text-white',
                result.correct ? 'bg-emerald-500' : 'bg-rose-500',
              )}
            >
              {result.correct ? <CheckIcon width={15} height={15} /> : <CloseIcon width={15} height={15} />}
            </span>
            <div className="min-w-0 flex-1">
              <p
                className={cn(
                  'font-semibold',
                  result.correct ? 'text-emerald-900' : 'text-rose-900',
                )}
              >
                {result.correct
                  ? triedOnce
                    ? 'Đúng rồi — lần sau cố gắng đúng ngay nhé!'
                    : 'Chính xác!'
                  : result.partial.total > 1
                    ? `Chưa đúng — đúng ${result.partial.correct}/${result.partial.total} phần`
                    : 'Chưa đúng'}
              </p>

              {exercise.explanation ? (
                <p
                  className={cn(
                    'mt-1 text-sm',
                    result.correct ? 'text-emerald-800' : 'text-rose-800',
                  )}
                >
                  {exercise.explanation}
                </p>
              ) : null}
            </div>
          </div>
        </div>
      ) : null}

      <div className="mt-5 flex flex-wrap gap-2">
        {!result ? (
          <button
            type="button"
            onClick={check}
            disabled={isAnswerEmpty(exercise, answer)}
            className="btn-primary flex-1 sm:flex-none"
          >
            Kiểm tra
          </button>
        ) : (
          <>
            {!result.correct ? (
              <button type="button" onClick={retry} className="btn-secondary">
                <RepeatIcon width={16} height={16} />
                Thử lại
              </button>
            ) : null}
            <button type="button" onClick={goNext} className="btn-primary flex-1 sm:flex-none">
              {isLast ? 'Xem kết quả' : 'Tiếp tục'}
              <ArrowRightIcon width={16} height={16} />
            </button>
          </>
        )}
      </div>
    </div>
  )
}
