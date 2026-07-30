'use client'

import { useMemo, useState } from 'react'

import { CheckIcon, CloseIcon } from '@/components/icons'
import { SpeakButton } from '@/components/speak-button'
import type {
  ConjugationExercise,
  Exercise,
  FillBlankExercise,
  ListeningExercise,
  MatchingExercise,
  MultipleChoiceExercise,
  ReorderExercise,
  TranslateExercise,
} from '@/lib/content/schema'
import type { GradeResult } from '@/lib/grading'
import { cn, seededShuffle } from '@/lib/utils'

/**
 * Giao diện cho 7 loại bài tập.
 *
 * Mọi view đều nhận cùng một bộ props: câu trả lời hiện tại (`value`), hàm cập
 * nhật (`onChange`) và kết quả chấm (`result`, null nghĩa là chưa bấm kiểm tra).
 * Việc chấm điểm nằm ở `lib/grading.ts`, không nằm trong component.
 *
 * Thêm loại bài tập mới: khai báo schema trong lib/content/schema.ts, thêm nhánh
 * chấm điểm trong lib/grading.ts, rồi thêm một view ở đây và nối vào
 * `ExerciseView` ở cuối file.
 */

export type ViewProps<T extends Exercise> = {
  exercise: T
  value: unknown
  onChange: (value: unknown) => void
  result: GradeResult | null
}

/** Trạng thái màu của một ô đáp án sau khi chấm. */
function optionState(
  index: number,
  selected: number | null,
  answerIndex: number,
  result: GradeResult | null,
) {
  if (!result) {
    return selected === index
      ? 'border-brand-500 bg-brand-50 text-brand-900 ring-2 ring-brand-100'
      : 'border-ink-200 bg-white hover:border-ink-300 hover:bg-ink-50'
  }
  if (index === answerIndex) return 'border-emerald-400 bg-emerald-50 text-emerald-900'
  if (index === selected) return 'border-rose-400 bg-rose-50 text-rose-900'
  return 'border-ink-200 bg-white opacity-60'
}

function ChoiceList({
  options,
  selected,
  answerIndex,
  result,
  onSelect,
}: {
  options: string[]
  selected: number | null
  answerIndex: number
  result: GradeResult | null
  onSelect: (index: number) => void
}) {
  return (
    <div className="grid gap-2">
      {options.map((option, index) => (
        <button
          key={index}
          type="button"
          disabled={Boolean(result)}
          onClick={() => onSelect(index)}
          className={cn(
            'flex w-full cursor-pointer items-center gap-3 rounded-xl border px-4 py-3 text-left text-sm transition',
            'disabled:cursor-default',
            optionState(index, selected, answerIndex, result),
          )}
        >
          <span
            className={cn(
              'grid h-6 w-6 shrink-0 place-items-center rounded-full border text-xs font-bold',
              result && index === answerIndex
                ? 'border-emerald-500 bg-emerald-500 text-white'
                : result && index === selected
                  ? 'border-rose-500 bg-rose-500 text-white'
                  : selected === index
                    ? 'border-brand-500 bg-brand-500 text-white'
                    : 'border-ink-300 text-ink-400',
            )}
          >
            {result && index === answerIndex ? (
              <CheckIcon width={14} height={14} />
            ) : result && index === selected ? (
              <CloseIcon width={14} height={14} />
            ) : (
              String.fromCharCode(65 + index)
            )}
          </span>
          <span className="de">{option}</span>
        </button>
      ))}
    </div>
  )
}

// ---------------------------------------------------------------------------
// 1. Trắc nghiệm
// ---------------------------------------------------------------------------

function MultipleChoiceView({
  exercise,
  value,
  onChange,
  result,
}: ViewProps<MultipleChoiceExercise>) {
  return (
    <div>
      <p className="text-ink-900 mb-1 font-medium">{exercise.prompt}</p>
      {exercise.promptVi ? <p className="text-ink-500 mb-3 text-sm">{exercise.promptVi}</p> : null}
      <div className="mt-3">
        <ChoiceList
          options={exercise.options}
          selected={value as number | null}
          answerIndex={exercise.answerIndex}
          result={result}
          onSelect={onChange}
        />
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// 2. Điền vào chỗ trống
// ---------------------------------------------------------------------------

function FillBlankView({ exercise, value, onChange, result }: ViewProps<FillBlankExercise>) {
  const values = (value as string[]) ?? []
  const parts = exercise.sentence.split('___')

  function update(index: number, next: string) {
    const copy = [...values]
    copy[index] = next
    onChange(copy)
  }

  return (
    <div>
      <p className="text-ink-500 mb-3 text-sm">Điền từ còn thiếu vào chỗ trống</p>

      <div className="de text-ink-900 flex flex-wrap items-center gap-x-1.5 gap-y-2.5 text-lg leading-relaxed">
        {parts.map((part, index) => (
          <span key={index} className="contents">
            <span>{part}</span>
            {index < exercise.blanks.length ? (
              <span className="inline-flex flex-col">
                <input
                  type="text"
                  value={values[index] ?? ''}
                  onChange={(event) => update(index, event.target.value)}
                  disabled={Boolean(result)}
                  autoComplete="off"
                  autoCapitalize="off"
                  spellCheck={false}
                  aria-label={`Chỗ trống ${index + 1}`}
                  className={cn(
                    'w-32 rounded-lg border-2 px-2.5 py-1 text-base focus:outline-none sm:w-40',
                    result
                      ? result.details[index]
                        ? 'border-emerald-400 bg-emerald-50 text-emerald-900'
                        : 'border-rose-400 bg-rose-50 text-rose-900'
                      : 'border-ink-300 focus:border-brand-500 bg-white',
                  )}
                />
                {!result && exercise.blanks[index].hint ? (
                  <span className="text-ink-400 mt-0.5 text-center text-[11px]">
                    {exercise.blanks[index].hint}
                  </span>
                ) : null}
                {result && !result.details[index] ? (
                  <span className="mt-0.5 text-center text-[11px] font-semibold text-emerald-700">
                    {exercise.blanks[index].answers[0]}
                  </span>
                ) : null}
              </span>
            ) : null}
          </span>
        ))}
      </div>

      {exercise.translation ? (
        <p className="text-ink-500 mt-4 text-sm">{exercise.translation}</p>
      ) : null}
    </div>
  )
}

// ---------------------------------------------------------------------------
// 3. Nối từ
// ---------------------------------------------------------------------------

function MatchingView({ exercise, value, onChange, result }: ViewProps<MatchingExercise>) {
  const pairs = (value as Record<number, string>) ?? {}
  const [activeLeft, setActiveLeft] = useState<number | null>(null)

  // Xáo cột phải theo hạt giống cố định để server và client khớp nhau.
  const rightOptions = useMemo(
    () => seededShuffle(exercise.pairs.map((pair) => pair.right), exercise.id),
    [exercise],
  )

  const usedRights = new Set(Object.values(pairs))

  function selectLeft(index: number) {
    if (result) return
    if (pairs[index]) {
      const next = { ...pairs }
      delete next[index]
      onChange(next)
      setActiveLeft(index)
      return
    }
    setActiveLeft(activeLeft === index ? null : index)
  }

  function selectRight(text: string) {
    if (result) return
    if (activeLeft === null) return
    const next = { ...pairs }
    // Bỏ liên kết cũ nếu vế phải này đã được dùng
    for (const [key, val] of Object.entries(next)) {
      if (val === text) delete next[Number(key)]
    }
    next[activeLeft] = text
    onChange(next)
    setActiveLeft(null)
  }

  return (
    <div>
      <p className="text-ink-500 mb-3 text-sm">
        {exercise.instruction ?? 'Chọn một mục bên trái, rồi chọn mục tương ứng bên phải'}
      </p>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          {exercise.pairs.map((pair, index) => (
            <button
              key={index}
              type="button"
              onClick={() => selectLeft(index)}
              disabled={Boolean(result)}
              className={cn(
                'w-full cursor-pointer rounded-xl border px-3 py-2.5 text-left text-sm transition disabled:cursor-default',
                result
                  ? result.details[index]
                    ? 'border-emerald-400 bg-emerald-50'
                    : 'border-rose-400 bg-rose-50'
                  : activeLeft === index
                    ? 'border-brand-500 bg-brand-50 ring-brand-100 ring-2'
                    : pairs[index]
                      ? 'border-ink-300 bg-ink-50'
                      : 'border-ink-200 hover:border-ink-300 bg-white',
              )}
            >
              <span className="de text-ink-900 block">{pair.left}</span>
              {pairs[index] ? (
                <span
                  className={cn(
                    'mt-0.5 block truncate text-xs',
                    result && !result.details[index] ? 'text-rose-700' : 'text-brand-700',
                  )}
                >
                  → {pairs[index]}
                </span>
              ) : null}
              {result && !result.details[index] ? (
                <span className="mt-0.5 block truncate text-xs font-semibold text-emerald-700">
                  ✓ {pair.right}
                </span>
              ) : null}
            </button>
          ))}
        </div>

        <div className="space-y-2">
          {rightOptions.map((text, index) => {
            const used = usedRights.has(text)
            return (
              <button
                key={index}
                type="button"
                onClick={() => selectRight(text)}
                disabled={Boolean(result) || used}
                className={cn(
                  'w-full cursor-pointer rounded-xl border px-3 py-2.5 text-left text-sm transition disabled:cursor-default',
                  used
                    ? 'border-ink-200 bg-ink-100 text-ink-400 line-through'
                    : activeLeft !== null
                      ? 'border-brand-300 hover:border-brand-500 hover:bg-brand-50 bg-white'
                      : 'border-ink-200 bg-white',
                )}
              >
                {text}
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// 4. Sắp xếp câu
// ---------------------------------------------------------------------------

function ReorderView({ exercise, onChange, result }: ViewProps<ReorderExercise>) {
  /*
    Câu tiếng Đức hay có từ lặp lại ("Ich stehe auf und ich gehe"), nên không thể
    xác định ô nào đã dùng chỉ bằng nội dung từ. Vì vậy state cục bộ lưu *vị trí*
    trong kho từ, còn giá trị đẩy lên trên (`onChange`) vẫn là mảng token để bộ
    chấm điểm dùng trực tiếp.

    Khi người học bấm "Làm lại", ExercisePlayer đổi `key` của view nên component
    được tạo mới và state này tự trở về rỗng.
  */
  const bank = useMemo(
    () => seededShuffle(exercise.answer.map((token, index) => ({ token, slot: index })), exercise.id),
    [exercise],
  )

  const [picked, setPicked] = useState<number[]>([])
  const chosen = picked.map((position) => bank[position].token)
  const usedSlots = new Set(picked)

  function commit(next: number[]) {
    setPicked(next)
    onChange(next.map((position) => bank[position].token))
  }

  function pick(position: number) {
    if (result) return
    commit([...picked, position])
  }

  function remove(index: number) {
    if (result) return
    commit(picked.filter((_, i) => i !== index))
  }

  return (
    <div>
      <p className="text-ink-500 mb-3 text-sm">
        {exercise.instruction ?? 'Bấm các từ theo đúng thứ tự để tạo thành câu'}
      </p>

      {/* Vùng câu đang ghép */}
      <div
        className={cn(
          'flex min-h-16 flex-wrap items-start gap-2 rounded-xl border-2 border-dashed p-3',
          result
            ? result.correct
              ? 'border-emerald-400 bg-emerald-50'
              : 'border-rose-400 bg-rose-50'
            : 'border-ink-300 bg-ink-50',
        )}
      >
        {chosen.length === 0 ? (
          <span className="text-ink-400 py-1.5 text-sm">Câu của bạn sẽ hiện ở đây…</span>
        ) : (
          chosen.map((token, index) => (
            <button
              key={`${picked[index]}-${index}`}
              type="button"
              onClick={() => remove(index)}
              disabled={Boolean(result)}
              className="de border-ink-300 text-ink-900 cursor-pointer rounded-lg border bg-white px-3 py-1.5 text-sm shadow-sm transition hover:border-rose-300 hover:bg-rose-50 disabled:cursor-default"
            >
              {token}
            </button>
          ))
        )}
      </div>

      {/* Kho từ */}
      <div className="mt-3 flex flex-wrap gap-2">
        {bank.map(({ token, slot }, position) => (
          <button
            key={slot}
            type="button"
            onClick={() => pick(position)}
            disabled={usedSlots.has(position) || Boolean(result)}
            className={cn(
              'de cursor-pointer rounded-lg border px-3 py-1.5 text-sm transition disabled:cursor-default',
              usedSlots.has(position)
                ? 'border-ink-200 bg-ink-100 text-ink-300'
                : 'border-ink-300 text-ink-900 hover:border-brand-400 hover:bg-brand-50 bg-white',
            )}
          >
            {token}
          </button>
        ))}
      </div>

      {exercise.translation ? (
        <p className="text-ink-500 mt-3 text-sm">{exercise.translation}</p>
      ) : null}
    </div>
  )
}

// ---------------------------------------------------------------------------
// 5. Nghe hiểu
// ---------------------------------------------------------------------------

function ListeningView({ exercise, value, onChange, result }: ViewProps<ListeningExercise>) {
  return (
    <div>
      <div className="bg-brand-50 mb-4 flex flex-col items-center gap-3 rounded-2xl p-5">
        <p className="text-brand-900 text-sm font-medium">Nghe rồi trả lời</p>
        <div className="flex items-center gap-2">
          <SpeakButton text={exercise.audioText} label="Nghe" />
          <SpeakButton text={exercise.audioText} rate={0.6} label="Chậm" />
        </div>
        {result ? (
          <p className="de text-ink-700 text-center text-sm">
            &bdquo;{exercise.audioText}&ldquo;
          </p>
        ) : (
          <p className="text-brand-700 text-xs">Nghe được bao nhiêu lần tuỳ ý</p>
        )}
      </div>

      {exercise.question ? (
        <p className="text-ink-900 mb-3 font-medium">{exercise.question}</p>
      ) : null}

      {exercise.mode === 'choice' ? (
        <ChoiceList
          options={exercise.options ?? []}
          selected={value as number | null}
          answerIndex={exercise.answerIndex ?? -1}
          result={result}
          onSelect={onChange}
        />
      ) : (
        <div>
          <input
            type="text"
            value={(value as string) ?? ''}
            onChange={(event) => onChange(event.target.value)}
            disabled={Boolean(result)}
            placeholder="Gõ lại câu bạn vừa nghe…"
            autoComplete="off"
            autoCapitalize="off"
            spellCheck={false}
            className={cn(
              'input de',
              result &&
                (result.correct
                  ? 'border-emerald-400 bg-emerald-50'
                  : 'border-rose-400 bg-rose-50'),
            )}
          />
          <p className="text-ink-400 mt-1.5 text-xs">
            Gõ ae/oe/ue/ss thay cho ä/ö/ü/ß cũng được chấp nhận.
          </p>
        </div>
      )}
    </div>
  )
}

// ---------------------------------------------------------------------------
// 6. Dịch
// ---------------------------------------------------------------------------

function TranslateView({ exercise, value, onChange, result }: ViewProps<TranslateExercise>) {
  const toGerman = exercise.direction === 'vi-de'

  return (
    <div>
      <div className="text-ink-500 mb-2 flex items-center gap-2 text-xs font-semibold">
        <span className="chip bg-ink-100">{toGerman ? 'Việt → Đức' : 'Đức → Việt'}</span>
      </div>

      <div className="bg-ink-50 mb-3 flex items-start gap-2 rounded-xl p-4">
        {!toGerman ? <SpeakButton text={exercise.source} size="sm" /> : null}
        <p className={cn('text-ink-900 text-lg', !toGerman && 'de')}>{exercise.source}</p>
      </div>

      <textarea
        value={(value as string) ?? ''}
        onChange={(event) => onChange(event.target.value)}
        disabled={Boolean(result)}
        rows={2}
        placeholder={toGerman ? 'Viết câu tiếng Đức…' : 'Viết nghĩa tiếng Việt…'}
        spellCheck={false}
        className={cn(
          'input resize-y',
          toGerman && 'de',
          result &&
            (result.correct ? 'border-emerald-400 bg-emerald-50' : 'border-rose-400 bg-rose-50'),
        )}
      />

      {exercise.hint && !result ? (
        <p className="text-ink-400 mt-1.5 text-xs">💡 {exercise.hint}</p>
      ) : null}

      {result && !result.correct ? (
        <div className="mt-2 rounded-xl bg-emerald-50 p-3 text-sm">
          <span className="font-semibold text-emerald-800">Đáp án mẫu: </span>
          <span className={cn('text-emerald-900', toGerman && 'de')}>{exercise.answers[0]}</span>
          {exercise.answers.length > 1 ? (
            <p className="mt-1 text-xs text-emerald-700">
              Cách khác: {exercise.answers.slice(1).join(' · ')}
            </p>
          ) : null}
        </div>
      ) : null}
    </div>
  )
}

// ---------------------------------------------------------------------------
// 7. Chia động từ
// ---------------------------------------------------------------------------

function ConjugationView({ exercise, value, onChange, result }: ViewProps<ConjugationExercise>) {
  const values = (value as string[]) ?? []

  function update(index: number, next: string) {
    const copy = [...values]
    copy[index] = next
    onChange(copy)
  }

  // `result.details` chỉ chứa các dòng người học phải điền, nên cần ánh xạ lại.
  let detailCursor = 0
  const detailIndexByRow = exercise.rows.map((row) => (row.prefilled ? -1 : detailCursor++))

  return (
    <div>
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <span className="de text-ink-900 text-lg font-bold">{exercise.verb}</span>
        {exercise.verbVi ? <span className="text-ink-500 text-sm">({exercise.verbVi})</span> : null}
        <SpeakButton text={exercise.verb} size="sm" />
        <span className="chip bg-brand-50 text-brand-700 ml-auto">{exercise.tenseLabel}</span>
      </div>

      <div className="border-ink-200 overflow-hidden rounded-xl border">
        {exercise.rows.map((row, index) => {
          const detailIndex = detailIndexByRow[index]
          const isCorrect = result && detailIndex >= 0 ? result.details[detailIndex] : null

          return (
            <div
              key={index}
              className="border-ink-100 flex items-center gap-3 border-b px-3 py-2 last:border-b-0"
            >
              <span className="de text-ink-600 w-24 shrink-0 text-sm sm:w-28">{row.pronoun}</span>

              {row.prefilled ? (
                <span className="de text-ink-400 flex-1 py-1 text-sm">{row.answer}</span>
              ) : (
                <div className="flex-1">
                  <input
                    type="text"
                    value={values[index] ?? ''}
                    onChange={(event) => update(index, event.target.value)}
                    disabled={Boolean(result)}
                    autoComplete="off"
                    autoCapitalize="off"
                    spellCheck={false}
                    aria-label={`Chia động từ cho ${row.pronoun}`}
                    className={cn(
                      'de w-full rounded-lg border-2 px-2.5 py-1.5 text-sm focus:outline-none',
                      isCorrect === null
                        ? 'border-ink-300 focus:border-brand-500 bg-white'
                        : isCorrect
                          ? 'border-emerald-400 bg-emerald-50 text-emerald-900'
                          : 'border-rose-400 bg-rose-50 text-rose-900',
                    )}
                  />
                </div>
              )}

              {isCorrect === false ? (
                <span className="de shrink-0 text-sm font-semibold text-emerald-700">
                  {row.answer}
                </span>
              ) : null}
            </div>
          )
        })}
      </div>

      {exercise.note ? <p className="text-ink-500 mt-2.5 text-xs">💡 {exercise.note}</p> : null}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Điều phối
// ---------------------------------------------------------------------------

export function ExerciseView(props: ViewProps<Exercise>) {
  const { exercise } = props

  switch (exercise.type) {
    case 'multiple_choice':
      return <MultipleChoiceView {...props} exercise={exercise} />
    case 'fill_blank':
      return <FillBlankView {...props} exercise={exercise} />
    case 'matching':
      return <MatchingView {...props} exercise={exercise} />
    case 'reorder':
      return <ReorderView {...props} exercise={exercise} />
    case 'listening':
      return <ListeningView {...props} exercise={exercise} />
    case 'translate':
      return <TranslateView {...props} exercise={exercise} />
    case 'conjugation':
      return <ConjugationView {...props} exercise={exercise} />
  }
}
