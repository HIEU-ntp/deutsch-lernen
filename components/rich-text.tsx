import { Fragment, type ReactNode } from 'react'

/**
 * Bộ render markdown tối giản cho phần giải thích ngữ pháp.
 *
 * Cố tình KHÔNG dùng thư viện markdown đầy đủ: nội dung do chính bạn viết trong
 * file JSON, chỉ cần vài cú pháp cơ bản, và cách này thì không bao giờ chèn HTML
 * thô vào trang (không dùng dangerouslySetInnerHTML).
 *
 * Cú pháp hỗ trợ:
 *   **đậm**        → in đậm
 *   *nghiêng*      → in nghiêng
 *   `ví dụ`        → nền xám nhạt, dùng để làm nổi câu/từ tiếng Đức
 *   dòng "- ..."   → danh sách gạch đầu dòng
 *   dòng trống     → ngăn đoạn văn
 *
 * Backtick trong dự án này hầu như luôn bọc tiếng Đức (câu ví dụ, dạng chia động từ)
 * chứ không bọc mã nguồn, nên nó KHÔNG render bằng font mono — font mono hiển thị
 * dấu Umlaut xấu. Bên trong backtick vẫn xử lý được `**đậm**` để làm nổi phần cần chú ý.
 */

const INLINE_PATTERN = /(\*\*[^*]+\*\*|\*[^*]+\*|`[^`]+`)/g
const EMPHASIS_PATTERN = /(\*\*[^*]+\*\*|\*[^*]+\*)/g

/** Chỉ xử lý đậm/nghiêng — dùng cho phần nằm bên trong backtick. */
function renderEmphasis(text: string, keyPrefix: string): ReactNode[] {
  return text.split(EMPHASIS_PATTERN).map((part, index) => {
    const key = `${keyPrefix}-e${index}`

    if (part.startsWith('**') && part.endsWith('**') && part.length > 4) {
      return (
        <strong key={key} className="font-bold">
          {part.slice(2, -2)}
        </strong>
      )
    }
    if (part.startsWith('*') && part.endsWith('*') && part.length > 2) {
      return (
        <em key={key} className="italic">
          {part.slice(1, -1)}
        </em>
      )
    }
    return <Fragment key={key}>{part}</Fragment>
  })
}

function renderInline(text: string, keyPrefix: string): ReactNode[] {
  return text.split(INLINE_PATTERN).map((part, index) => {
    const key = `${keyPrefix}-${index}`

    if (part.startsWith('**') && part.endsWith('**') && part.length > 4) {
      return (
        <strong key={key} className="text-ink-900 font-semibold">
          {part.slice(2, -2)}
        </strong>
      )
    }
    if (part.startsWith('`') && part.endsWith('`') && part.length > 2) {
      return (
        <span key={key} className="de bg-ink-100 text-ink-900 rounded px-1.5 py-0.5">
          {renderEmphasis(part.slice(1, -1), key)}
        </span>
      )
    }
    if (part.startsWith('*') && part.endsWith('*') && part.length > 2) {
      return (
        <em key={key} className="italic">
          {part.slice(1, -1)}
        </em>
      )
    }
    return <Fragment key={key}>{part}</Fragment>
  })
}

export function RichText({ text, className }: { text: string; className?: string }) {
  const blocks = text.split(/\n\s*\n/)

  return (
    <div className={className}>
      {blocks.map((block, blockIndex) => {
        const lines = block.split('\n').filter((line) => line.trim().length > 0)
        if (lines.length === 0) return null

        const isList = lines.every((line) => line.trimStart().startsWith('- '))

        if (isList) {
          return (
            <ul key={blockIndex} className="my-2.5 space-y-1.5 pl-1">
              {lines.map((line, lineIndex) => (
                <li key={lineIndex} className="flex gap-2">
                  <span className="text-ink-400 mt-2 h-1 w-1 shrink-0 rounded-full bg-current" />
                  <span>{renderInline(line.trimStart().slice(2), `${blockIndex}-${lineIndex}`)}</span>
                </li>
              ))}
            </ul>
          )
        }

        return (
          <p key={blockIndex} className="my-2.5 first:mt-0 last:mb-0">
            {renderInline(lines.join(' '), String(blockIndex))}
          </p>
        )
      })}
    </div>
  )
}
