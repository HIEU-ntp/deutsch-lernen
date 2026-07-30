/**
 * Text-to-Speech cho tiếng Đức, dùng Web Speech API có sẵn trong trình duyệt.
 *
 * Không cần API key, không tốn phí, chạy offline sau khi trình duyệt tải giọng.
 * macOS/iOS có sẵn giọng Anna/Helena (de-DE); Windows có Katja/Hedda; Chrome trên
 * Android dùng giọng Google Deutsch.
 *
 * Nếu sau này muốn đổi sang dịch vụ TTS chất lượng cao hơn (ElevenLabs, Azure…),
 * chỉ cần thay phần thân của `speakGerman` — mọi component đều gọi qua hàm này.
 *
 * Module chỉ chạy phía client.
 */

export const GERMAN_LANG = 'de-DE'

let cachedVoices: SpeechSynthesisVoice[] = []

export function isSpeechSupported(): boolean {
  return typeof window !== 'undefined' && 'speechSynthesis' in window
}

/**
 * Danh sách giọng đọc được tải bất đồng bộ: lần gọi đầu tiên thường trả về mảng
 * rỗng, phải đợi sự kiện `voiceschanged`.
 */
export function loadVoices(): Promise<SpeechSynthesisVoice[]> {
  if (!isSpeechSupported()) return Promise.resolve([])

  const existing = window.speechSynthesis.getVoices()
  if (existing.length > 0) {
    cachedVoices = existing
    return Promise.resolve(existing)
  }

  return new Promise((resolve) => {
    const timeout = setTimeout(() => {
      cachedVoices = window.speechSynthesis.getVoices()
      resolve(cachedVoices)
    }, 1000)

    window.speechSynthesis.addEventListener(
      'voiceschanged',
      () => {
        clearTimeout(timeout)
        cachedVoices = window.speechSynthesis.getVoices()
        resolve(cachedVoices)
      },
      { once: true },
    )
  })
}

/** Chọn giọng tiếng Đức tốt nhất đang có. */
export function pickGermanVoice(
  voices: SpeechSynthesisVoice[] = cachedVoices,
): SpeechSynthesisVoice | null {
  const german = voices.filter((voice) => voice.lang.replace('_', '-').startsWith('de'))
  if (german.length === 0) return null

  // Ưu tiên giọng de-DE chuẩn, sau đó tới giọng chất lượng cao (thường không phải local).
  const exact = german.filter((voice) => voice.lang.replace('_', '-') === GERMAN_LANG)
  const pool = exact.length > 0 ? exact : german

  const preferredNames = ['Google', 'Anna', 'Helena', 'Katja', 'Markus', 'Petra']
  for (const name of preferredNames) {
    const match = pool.find((voice) => voice.name.includes(name))
    if (match) return match
  }

  return pool[0]
}

export type SpeakOptions = {
  /** 0.1 – 2. Đọc chậm lại khi luyện phát âm từng từ. */
  rate?: number
  pitch?: number
  volume?: number
  onEnd?: () => void
  onError?: () => void
}

/**
 * Đọc một câu/từ tiếng Đức. Tự huỷ câu đang đọc dở trước đó.
 * Trả về `false` nếu trình duyệt không hỗ trợ.
 */
export async function speakGerman(text: string, options: SpeakOptions = {}): Promise<boolean> {
  if (!isSpeechSupported() || !text.trim()) return false

  const voices = cachedVoices.length > 0 ? cachedVoices : await loadVoices()
  const voice = pickGermanVoice(voices)

  window.speechSynthesis.cancel()

  const utterance = new SpeechSynthesisUtterance(text)
  utterance.lang = GERMAN_LANG
  utterance.rate = options.rate ?? 0.9
  utterance.pitch = options.pitch ?? 1
  utterance.volume = options.volume ?? 1
  if (voice) utterance.voice = voice
  if (options.onEnd) utterance.addEventListener('end', options.onEnd)
  if (options.onError) utterance.addEventListener('error', options.onError)

  window.speechSynthesis.speak(utterance)
  return true
}

export function stopSpeaking(): void {
  if (isSpeechSupported()) window.speechSynthesis.cancel()
}

/** Có giọng tiếng Đức nào trong máy không — dùng để cảnh báo người dùng. */
export async function hasGermanVoice(): Promise<boolean> {
  if (!isSpeechSupported()) return false
  return pickGermanVoice(await loadVoices()) !== null
}
