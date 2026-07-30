'use client'

import { useEffect, useState } from 'react'

import { SpeakerIcon } from '@/components/icons'
import { hasGermanVoice, speakGerman } from '@/lib/tts'
import { cn } from '@/lib/utils'

/**
 * Nút phát âm tiếng Đức. Dùng ở mọi nơi có tiếng Đức: từ vựng, ví dụ ngữ pháp,
 * bài tập nghe hiểu.
 *
 * Nếu trình duyệt không có giọng tiếng Đức, nút vẫn hiển thị nhưng bị mờ và có
 * tooltip giải thích — tốt hơn là biến mất không dấu vết.
 */
export function SpeakButton({
  text,
  rate = 0.9,
  label,
  className,
  size = 'md',
}: {
  text: string
  rate?: number
  label?: string
  className?: string
  size?: 'sm' | 'md'
}) {
  const [speaking, setSpeaking] = useState(false)
  const [voiceMissing, setVoiceMissing] = useState(false)

  useEffect(() => {
    // `hasGermanVoice` đã tự trả về false khi trình duyệt không hỗ trợ, nên chỉ cần
    // một nhánh bất đồng bộ duy nhất — gọi setState thẳng trong effect sẽ gây
    // cascading render và bị ESLint chặn.
    let cancelled = false
    void hasGermanVoice().then((available) => {
      if (!cancelled) setVoiceMissing(!available)
    })
    return () => {
      cancelled = true
    }
  }, [])

  async function handleClick(event: React.MouseEvent) {
    event.preventDefault()
    event.stopPropagation()
    setSpeaking(true)
    await speakGerman(text, {
      rate,
      onEnd: () => setSpeaking(false),
      onError: () => setSpeaking(false),
    })
    // Dự phòng: một số trình duyệt không bắn sự kiện `end`.
    setTimeout(() => setSpeaking(false), Math.max(1500, text.length * 90))
  }

  const iconSize = size === 'sm' ? 15 : 18

  return (
    <button
      type="button"
      onClick={handleClick}
      title={
        voiceMissing
          ? 'Máy chưa có giọng đọc tiếng Đức — hãy cài gói giọng de-DE trong cài đặt hệ thống'
          : `Nghe: ${text}`
      }
      aria-label={label ?? `Nghe phát âm: ${text}`}
      className={cn(
        'inline-flex shrink-0 cursor-pointer items-center justify-center gap-1.5 rounded-lg transition',
        size === 'sm' ? 'h-7 w-7' : 'h-9 w-9',
        label ? (size === 'sm' ? 'w-auto px-2' : 'w-auto px-3') : '',
        speaking
          ? 'bg-brand-600 text-white'
          : 'bg-brand-50 text-brand-600 hover:bg-brand-100',
        voiceMissing && 'opacity-40',
        className,
      )}
    >
      <SpeakerIcon width={iconSize} height={iconSize} />
      {label ? <span className="text-xs font-semibold">{label}</span> : null}
    </button>
  )
}
