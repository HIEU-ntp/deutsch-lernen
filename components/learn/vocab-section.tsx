'use client'

import { useState } from 'react'

import { ArrowLeftIcon, ArrowRightIcon } from '@/components/icons'
import { SpeakButton } from '@/components/speak-button'
import type { VocabItem } from '@/lib/content/schema'
import { cn, displayWord } from '@/lib/utils'

/**
 * Màu theo giống của danh từ — mẹo ghi nhớ kinh điển: der = xanh dương,
 * die = hồng, das = xanh lá. Nhìn quen mắt sẽ nhớ giống nhanh hơn nhiều
 * so với học thuộc từng từ.
 */
const ARTICLE_STYLES: Record<string, { chip: string; ring: string }> = {
  der: { chip: 'bg-blue-100 text-blue-800', ring: 'border-l-blue-400' },
  die: { chip: 'bg-rose-100 text-rose-800', ring: 'border-l-rose-400' },
  das: { chip: 'bg-emerald-100 text-emerald-800', ring: 'border-l-emerald-400' },
}

const POS_LABELS: Record<string, string> = {
  noun: 'danh từ',
  verb: 'động từ',
  adjective: 'tính từ',
  adverb: 'trạng từ',
  preposition: 'giới từ',
  pronoun: 'đại từ',
  conjunction: 'liên từ',
  numeral: 'số từ',
  phrase: 'cụm từ',
  particle: 'tiểu từ',
  interjection: 'thán từ',
}

function VocabRow({ item }: { item: VocabItem }) {
  const style = item.article ? ARTICLE_STYLES[item.article] : undefined

  return (
    <li
      className={cn(
        'border-ink-200 border-l-4 bg-white p-4 first:rounded-t-2xl last:rounded-b-2xl',
        'border-b last:border-b-0',
        style?.ring ?? 'border-l-ink-300',
      )}
    >
      <div className="flex items-start gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
            {item.article ? (
              <span className={cn('chip px-2 py-0.5 font-bold', style?.chip)}>{item.article}</span>
            ) : null}
            <span className="de text-ink-900 text-lg">{item.de}</span>
            {item.plural ? (
              <span className="text-ink-400 text-sm">· die {item.plural}</span>
            ) : null}
            <span className="text-ink-400 text-xs">{POS_LABELS[item.pos] ?? item.pos}</span>
          </div>

          <div className="text-ink-700 mt-0.5">{item.vi}</div>

          {item.ipa ? <div className="text-ink-400 mt-0.5 font-mono text-xs">/{item.ipa}/</div> : null}

          {item.principalParts ? (
            <div className="text-ink-500 mt-1 text-xs">
              Dạng chính: <span className="de">{item.principalParts}</span>
            </div>
          ) : null}

          {item.example ? (
            <div className="bg-ink-50 mt-2.5 rounded-lg p-2.5">
              <div className="flex items-start gap-2">
                <SpeakButton text={item.example.de} size="sm" />
                <div className="min-w-0">
                  <div className="de text-ink-800 text-sm">{item.example.de}</div>
                  <div className="text-ink-500 text-sm">{item.example.vi}</div>
                </div>
              </div>
            </div>
          ) : null}

          {item.note ? (
            <div className="mt-2 rounded-lg bg-amber-50 px-2.5 py-2 text-xs text-amber-900">
              💡 {item.note}
            </div>
          ) : null}
        </div>

        <SpeakButton text={displayWord(item)} />
      </div>
    </li>
  )
}

function Flashcards({ items }: { items: VocabItem[] }) {
  const [index, setIndex] = useState(0)
  const [revealed, setRevealed] = useState(false)

  const item = items[index]
  if (!item) return null

  function go(delta: number) {
    setRevealed(false)
    setIndex((current) => (current + delta + items.length) % items.length)
  }

  const style = item.article ? ARTICLE_STYLES[item.article] : undefined

  return (
    <div>
      <div className="text-ink-500 mb-2 text-center text-xs font-medium tabular-nums">
        {index + 1} / {items.length}
      </div>

      <button
        type="button"
        onClick={() => setRevealed((value) => !value)}
        className="card flex min-h-56 w-full cursor-pointer flex-col items-center justify-center gap-3 p-6 text-center transition hover:shadow-md"
      >
        <div className="flex items-center gap-2">
          {item.article && revealed ? (
            <span className={cn('chip font-bold', style?.chip)}>{item.article}</span>
          ) : null}
          <span className="de text-ink-900 text-2xl sm:text-3xl">{item.de}</span>
        </div>

        {revealed ? (
          <>
            <div className="text-ink-700 text-lg">{item.vi}</div>
            {item.example ? (
              <div className="text-ink-500 max-w-md text-sm">
                <span className="de">{item.example.de}</span>
                <br />
                {item.example.vi}
              </div>
            ) : null}
          </>
        ) : (
          <span className="text-ink-400 text-sm">Bấm để xem nghĩa</span>
        )}
      </button>

      <div className="mt-3 flex items-center justify-center gap-2">
        <button type="button" onClick={() => go(-1)} className="btn-secondary btn-sm">
          <ArrowLeftIcon width={16} height={16} />
          Trước
        </button>
        <SpeakButton text={displayWord(item)} label="Nghe" />
        <button type="button" onClick={() => go(1)} className="btn-secondary btn-sm">
          Sau
          <ArrowRightIcon width={16} height={16} />
        </button>
      </div>
    </div>
  )
}

export function VocabSection({ items }: { items: VocabItem[] }) {
  const [mode, setMode] = useState<'list' | 'cards'>('list')

  if (items.length === 0) {
    return <p className="text-ink-500 text-sm">Unit này chưa có từ vựng.</p>
  }

  return (
    <div>
      <div className="mb-3 flex items-center justify-between gap-3">
        <p className="text-ink-500 text-sm">{items.length} từ trong bài</p>
        <div className="bg-ink-100 flex rounded-lg p-0.5">
          {(
            [
              ['list', 'Danh sách'],
              ['cards', 'Thẻ ghi nhớ'],
            ] as const
          ).map(([value, label]) => (
            <button
              key={value}
              type="button"
              onClick={() => setMode(value)}
              className={cn(
                'cursor-pointer rounded-md px-3 py-1.5 text-xs font-semibold transition',
                mode === value ? 'text-ink-900 bg-white shadow-sm' : 'text-ink-500',
              )}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {mode === 'cards' ? (
        <Flashcards items={items} />
      ) : (
        <ul className="border-ink-200 overflow-hidden rounded-2xl border shadow-sm">
          {items.map((item) => (
            <VocabRow key={item.id} item={item} />
          ))}
        </ul>
      )}
    </div>
  )
}
