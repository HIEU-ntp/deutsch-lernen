'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState } from 'react'

import { CheckIcon, RepeatIcon } from '@/components/icons'

/**
 * Nút "Đã học xong" cho tab Từ vựng / Ngữ pháp.
 *
 * Bấm nút sẽ tạo thẻ ôn tập ngắt quãng cho toàn bộ item của phần đó và đánh dấu
 * tiến trình. Đây chính là điểm nối giữa việc học bài mới và hệ thống SRS.
 */
export function SectionCompleteButton({
  unitId,
  itemType,
  itemCount,
  alreadyDone,
  isLoggedIn,
}: {
  unitId: string
  itemType: 'vocab' | 'grammar'
  itemCount: number
  alreadyDone: boolean
  isLoggedIn: boolean
}) {
  const router = useRouter()
  const [state, setState] = useState<'idle' | 'saving' | 'done'>(alreadyDone ? 'done' : 'idle')
  const [created, setCreated] = useState<number | null>(null)

  const noun = itemType === 'vocab' ? 'từ' : 'điểm ngữ pháp'

  if (itemCount === 0) return null

  if (!isLoggedIn) {
    return (
      <div className="card text-ink-600 mt-5 p-4 text-center text-sm">
        <Link href="/register" className="text-brand-700 font-semibold underline">
          Tạo tài khoản
        </Link>{' '}
        để đưa {itemCount} {noun} này vào lịch ôn tập ngắt quãng.
      </div>
    )
  }

  async function handleClick() {
    setState('saving')
    try {
      const response = await fetch('/api/srs/seed', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ unitId, itemType }),
      })
      if (response.ok) {
        const body = (await response.json()) as { created: number }
        setCreated(body.created)
        setState('done')
        router.refresh()
      } else {
        setState('idle')
      }
    } catch {
      setState('idle')
    }
  }

  if (state === 'done') {
    return (
      <div className="mt-5 flex flex-col items-center gap-2 rounded-2xl bg-emerald-50 p-4 text-center">
        <span className="flex items-center gap-2 text-sm font-semibold text-emerald-900">
          <CheckIcon width={18} height={18} />
          Đã đưa vào lịch ôn tập
          {created !== null && created > 0 ? ` (+${created} thẻ mới)` : ''}
        </span>
        <Link href="/review" className="btn-secondary btn-sm">
          <RepeatIcon width={15} height={15} />
          Tới trang ôn tập
        </Link>
      </div>
    )
  }

  return (
    <div className="mt-5 text-center">
      <button
        type="button"
        onClick={handleClick}
        disabled={state === 'saving'}
        className="btn-primary"
      >
        {state === 'saving' ? 'Đang lưu…' : `Đã học xong — đưa ${itemCount} ${noun} vào lịch ôn`}
      </button>
      <p className="text-ink-400 mt-2 text-xs">
        Hệ thống sẽ nhắc bạn ôn lại đúng lúc sắp quên, theo thuật toán SM-2.
      </p>
    </div>
  )
}
