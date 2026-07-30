import { RichText } from '@/components/rich-text'
import { SpeakButton } from '@/components/speak-button'
import type { GrammarPoint, GrammarTable } from '@/lib/content/schema'

function Table({ table }: { table: GrammarTable }) {
  return (
    <figure className="my-4">
      {table.title ? (
        <figcaption className="text-ink-600 mb-2 text-sm font-semibold">{table.title}</figcaption>
      ) : null}

      {/* Bảng chia động từ thường rộng — cho cuộn ngang thay vì vỡ layout trên mobile */}
      <div className="border-ink-200 no-scrollbar overflow-x-auto rounded-xl border">
        <table className="w-full min-w-max border-collapse text-sm">
          <thead>
            <tr className="bg-ink-100">
              {table.headers.map((header, index) => (
                <th
                  key={index}
                  scope="col"
                  className="text-ink-700 border-ink-200 border-b px-3 py-2 text-left font-semibold whitespace-nowrap"
                >
                  {header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {table.rows.map((row, rowIndex) => (
              <tr key={rowIndex} className="even:bg-ink-50">
                {row.map((cell, cellIndex) => (
                  <td
                    key={cellIndex}
                    className="border-ink-100 text-ink-700 border-b px-3 py-2 whitespace-nowrap last:border-r-0"
                  >
                    {cellIndex === 0 ? <span className="de text-ink-900">{cell}</span> : cell}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {table.footnote ? (
        <p className="text-ink-500 mt-1.5 text-xs">{table.footnote}</p>
      ) : null}
    </figure>
  )
}

export function GrammarPointCard({
  point,
  showSummary = true,
}: {
  point: GrammarPoint
  showSummary?: boolean
}) {
  return (
    <article className="card p-5">
      <h3 className="de text-ink-900 text-lg font-bold">{point.title}</h3>
      <p className="text-brand-700 text-sm font-medium">{point.titleVi}</p>

      {showSummary ? <p className="text-ink-600 mt-2 text-sm italic">{point.summary}</p> : null}

      <RichText text={point.explanation} className="text-ink-700 mt-3 text-sm leading-relaxed" />

      {point.tables.map((table, index) => (
        <Table key={index} table={table} />
      ))}

      {point.examples.length > 0 ? (
        <div className="mt-4">
          <h4 className="text-ink-500 mb-2 text-xs font-semibold tracking-wide uppercase">Ví dụ</h4>
          <ul className="space-y-2">
            {point.examples.map((example, index) => (
              <li key={index} className="bg-ink-50 flex items-start gap-2 rounded-lg p-2.5">
                <SpeakButton text={example.de} size="sm" />
                <div className="min-w-0">
                  <div className="de text-ink-800 text-sm">{example.de}</div>
                  <div className="text-ink-500 text-sm">{example.vi}</div>
                  {example.note ? (
                    <div className="text-ink-400 mt-0.5 text-xs">{example.note}</div>
                  ) : null}
                </div>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {point.commonMistakes.length > 0 ? (
        <div className="mt-4 rounded-xl bg-rose-50 p-3.5">
          <h4 className="mb-1.5 text-xs font-semibold tracking-wide text-rose-800 uppercase">
            Lỗi thường gặp
          </h4>
          <ul className="space-y-1.5">
            {point.commonMistakes.map((mistake, index) => (
              <li key={index} className="flex gap-2 text-sm text-rose-900">
                <span aria-hidden="true">⚠️</span>
                <span>{mistake}</span>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </article>
  )
}

export function GrammarSection({ points }: { points: GrammarPoint[] }) {
  if (points.length === 0) {
    return <p className="text-ink-500 text-sm">Unit này chưa có phần ngữ pháp.</p>
  }

  return (
    <div className="space-y-4">
      {points.map((point) => (
        <GrammarPointCard key={point.id} point={point} />
      ))}
    </div>
  )
}
