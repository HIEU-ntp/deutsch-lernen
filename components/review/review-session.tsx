'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState } from 'react'

import { CheckIcon, RepeatIcon, SparkIcon } from '@/components/icons'
import { SpeakButton } from '@/components/speak-button'
import { ProgressBar } from '@/components/ui'
import type { GrammarPoint, VocabItem } from '@/lib/content/schema'
import { levelTheme } from '@/lib/level-theme'
import { previewIntervals, RECALL_GRADES, type SrsState } from '@/lib/srs'
import { cn, displayWord, levelToSlug } from '@/lib/utils'

/**
 * Phiên ôn tập ngắt quãng.
 *
 * Thẻ được tải sẵn một lượt từ server. Thẻ bị đánh giá "Quên rồi" sẽ quay lại
 * cuối hàng đợi ngay trong phiên (giống Anki) thay vì phải đợi lần sau.
 */

export type SessionCard = {
  id: string
  itemType: string
  level: string
  unitId: string
  unitSlug: string
  state: SrsState
  vocab?: VocabItem
  grammar?: GrammarPoint
}

const GRADE_STYLES: Record<string, string> = {
  again: 'bg-rose-500 hover:bg-rose-600 text-white',
  hard: 'bg-amber-500 hover:bg-amber-600 text-white',
  good: 'bg-sky-500 hover:bg-sky-600 text-white',
  easy: 'bg-emerald-500 hover:bg-emerald-600 text-white',
}

const ARTICLE_CHIP: Record<string, string> = {
  der: 'bg-blue-100 text-blue-800',
  die: 'bg-rose-100 text-rose-800',
  das: 'bg-emerald-100 text-emerald-800',
}

export function ReviewSession({ cards }: { cards: SessionCard[] }) {
  const router = useRouter()

  const [queue, setQueue] = useState(cards)
  const [revealed, setRevealed] = useState(false)
  const [done, setDone] = useState(0)
  const [again, setAgain] = useState(0)
  const [xp, setXp] = useState(0)
  const [busy, setBusy] = useState(false)

  const card = queue[0]
  const total = cards.length

  async function grade(quality: number) {
    if (!card || busy) return
    setBusy(true)

    try {
      const response = await fetch('/api/srs/review', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cardId: card.id, quality }),
      })
      if (response.ok) {
        const body = (await response.json()) as { xpGained: number }
        setXp((value) => value + body.xpGained)
      }
    } catch {
      // Mất mạng: vẫn cho học tiếp, thẻ sẽ tới hạn lại ở lần sau.
    }

    if (quality < 3) {
      // Học lại ngay trong phiên: đưa thẻ xuống cuối hàng đợi.
      setQueue(([, ...rest]) => [...rest, card])
      setAgain((value) => value + 1)
    } else {
      setQueue(([, ...rest]) => rest)
      setDone((value) => value + 1)
    }

    setRevealed(false)
    setBusy(false)
  }

  if (!card) {
    return (
      <div className="card p-8 text-center">
        <div className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-emerald-500 text-white">
          <CheckIcon width={32} height={32} />
        </div>
        <h2 className="text-ink-900 mt-4 text-2xl font-bold">Xong hết rồi!</h2>
        <p className="text-ink-600 mt-1">
          Bạn đã ôn {done} thẻ{again > 0 ? `, trong đó ${again} thẻ cần học lại` : ''}.
        </p>

        {xp > 0 ? (
          <span className="chip mt-3 bg-amber-100 text-amber-800">
            <SparkIcon width={14} height={14} />+{xp} XP
          </span>
        ) : null}

        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button
            type="button"
            onClick={() => router.refresh()}
            className="btn-secondary"
          >
            <RepeatIcon width={16} height={16} />
            Kiểm tra thẻ mới
          </button>
          <Link href="/dashboard" className="btn-primary">
            Về trang tiến trình
          </Link>
        </div>
      </div>
    )
  }

  const theme = levelTheme(card.level)
  const intervals = previewIntervals(card.state)
  const unitHref = `/learn/${levelToSlug(card.level)}/${card.unitSlug}`

  return (
    <div>
      <div className="mb-4">
        <div className="text-ink-500 mb-1.5 flex items-center justify-between text-xs font-medium">
          <span>
            Còn {queue.length} thẻ · đã xong {done}/{total}
          </span>
          {xp > 0 ? <span className="text-amber-600">+{xp} XP</span> : null}
        </div>
        <ProgressBar value={(done / Math.max(1, total)) * 100} size="sm" />
      </div>

      <div className="card min-h-72 p-6 text-center">
        <div className="mb-4 flex items-center justify-center gap-2">
          <span className={`chip ${theme.chip} font-bold`}>{card.level}</span>
          <span className="chip bg-ink-100 text-ink-600">
            {card.itemType === 'vocab' ? 'Từ vựng' : 'Ngữ pháp'}
          </span>
        </div>

        {card.vocab ? (
          <VocabCardBody item={card.vocab} revealed={revealed} />
        ) : card.grammar ? (
          <GrammarCardBody point={card.grammar} revealed={revealed} unitHref={unitHref} />
        ) : null}
      </div>

      {!revealed ? (
        <button
          type="button"
          onClick={() => setRevealed(true)}
          className="btn-primary mt-4 w-full"
        >
          Hiện đáp án
        </button>
      ) : (
        <div className="mt-4">
          <p className="text-ink-500 mb-2 text-center text-xs">Bạn nhớ được tới mức nào?</p>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {RECALL_GRADES.map(({ grade: value, key, label }) => (
              <button
                key={key}
                type="button"
                disabled={busy}
                onClick={() => grade(value)}
                className={cn(
                  'flex cursor-pointer flex-col items-center gap-0.5 rounded-xl px-3 py-3 text-sm font-semibold transition disabled:opacity-50',
                  GRADE_STYLES[key],
                )}
              >
                {label}
                <span className="text-[11px] font-normal opacity-90">{intervals[value]}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      <p className="text-ink-400 mt-4 text-center text-xs">
        Thẻ này thuộc{' '}
        <Link href={unitHref} className="hover:text-ink-600 underline">
          bài học gốc
        </Link>
      </p>
    </div>
  )
}

function VocabCardBody({ item, revealed }: { item: VocabItem; revealed: boolean }) {
  return (
    <>
      <div className="flex items-center justify-center gap-2">
        <span className="de text-ink-900 text-3xl font-bold">{item.de}</span>
        <SpeakButton text={displayWord(item)} />
      </div>

      {!revealed ? (
        <p className="text-ink-400 mt-4 text-sm">
          {item.pos === 'noun' ? 'Nhớ lại nghĩa VÀ mạo từ der/die/das' : 'Nhớ lại nghĩa của từ này'}
        </p>
      ) : (
        <div className="mt-4">
          {item.article ? (
            <span className={cn('chip mb-2 font-bold', ARTICLE_CHIP[item.article])}>
              {item.article} {item.de}
              {item.plural ? ` · die ${item.plural}` : ''}
            </span>
          ) : null}

          <p className="text-ink-900 text-xl">{item.vi}</p>

          {item.example ? (
            <div className="bg-ink-50 mt-4 rounded-xl p-3 text-left">
              <div className="flex items-start gap-2">
                <SpeakButton text={item.example.de} size="sm" />
                <div>
                  <p className="de text-ink-800 text-sm">{item.example.de}</p>
                  <p className="text-ink-500 text-sm">{item.example.vi}</p>
                </div>
              </div>
            </div>
          ) : null}

          {item.note ? (
            <p className="mt-3 rounded-lg bg-amber-50 px-3 py-2 text-left text-xs text-amber-900">
              💡 {item.note}
            </p>
          ) : null}
        </div>
      )}
    </>
  )
}

function GrammarCardBody({
  point,
  revealed,
  unitHref,
}: {
  point: GrammarPoint
  revealed: boolean
  unitHref: string
}) {
  return (
    <>
      <p className="de text-ink-900 text-xl font-bold">{point.title}</p>
      <p className="text-brand-700 mt-1 text-sm">{point.titleVi}</p>

      {!revealed ? (
        <p className="text-ink-400 mt-4 text-sm">Nhớ lại quy tắc này hoạt động thế nào</p>
      ) : (
        <div className="mt-4 text-left">
          <p className="text-ink-700 text-sm">{point.summary}</p>

          {point.examples.slice(0, 2).map((example, index) => (
            <div key={index} className="bg-ink-50 mt-2 flex items-start gap-2 rounded-lg p-2.5">
              <SpeakButton text={example.de} size="sm" />
              <div>
                <p className="de text-ink-800 text-sm">{example.de}</p>
                <p className="text-ink-500 text-sm">{example.vi}</p>
              </div>
            </div>
          ))}

          <Link href={unitHref} className="text-brand-700 mt-3 inline-block text-xs underline">
            Xem giải thích đầy đủ
          </Link>
        </div>
      )}
    </>
  )
}
