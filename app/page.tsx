import Link from 'next/link'
import { redirect } from 'next/navigation'

import { ArrowRightIcon, BookIcon, CompassIcon, RepeatIcon, SpeakerIcon } from '@/components/icons'
import { Container } from '@/components/ui'
import { getCurrentUser } from '@/lib/auth'
import { getLevelStats } from '@/lib/content/loader'
import { levelTheme } from '@/lib/level-theme'
import { levelToSlug } from '@/lib/utils'

const FEATURES = [
  {
    Icon: BookIcon,
    title: '10 cấp độ theo chuẩn CEFR',
    text: 'Từ A1.1 tới C2, mỗi cấp chia thành các unit theo chủ đề với từ vựng, ngữ pháp và bài tập riêng.',
  },
  {
    Icon: SpeakerIcon,
    title: 'Phát âm mọi từ và câu',
    text: 'Bấm loa để nghe giọng đọc tiếng Đức ngay trong trình duyệt — không cần cài gì thêm.',
  },
  {
    Icon: RepeatIcon,
    title: 'Ôn tập ngắt quãng SM-2',
    text: 'Thuật toán như Anki tự xếp lịch ôn: từ nào hay quên sẽ quay lại dày hơn, từ đã thuộc thì giãn ra.',
  },
  {
    Icon: CompassIcon,
    title: 'Kiểm tra xếp lớp',
    text: 'Làm bài test ngắn để biết nên bắt đầu từ cấp nào, thay vì đoán mò.',
  },
]

const EXERCISE_KINDS = [
  'Trắc nghiệm',
  'Điền vào chỗ trống',
  'Nối từ',
  'Sắp xếp câu',
  'Nghe hiểu',
  'Dịch Đức–Việt',
  'Chia động từ',
]

export default async function HomePage() {
  const user = await getCurrentUser()
  if (user) redirect('/dashboard')

  const stats = getLevelStats()
  const totals = stats.reduce(
    (acc, row) => ({
      units: acc.units + row.unitCount,
      vocab: acc.vocab + row.vocabCount,
      exercises: acc.exercises + row.exerciseCount,
    }),
    { units: 0, vocab: 0, exercises: 0 },
  )

  return (
    <Container className="max-w-6xl">
      <section className="py-10 text-center sm:py-16">
        <span className="chip bg-brand-50 text-brand-700">A1.1 → C2 · theo khung CEFR</span>
        <h1 className="text-ink-900 mx-auto mt-4 max-w-3xl text-3xl font-bold tracking-tight text-balance sm:text-5xl">
          Học tiếng Đức bài bản, từ bảng chữ cái đến tranh luận học thuật
        </h1>
        <p className="text-ink-600 mx-auto mt-4 max-w-2xl text-base text-pretty sm:text-lg">
          Một lộ trình duy nhất gồm {totals.units} unit, {totals.vocab} từ vựng và {totals.exercises}{' '}
          bài tập — kèm hệ thống ôn tập ngắt quãng để những gì đã học không rơi rụng.
        </p>
        <div className="mt-7 flex flex-wrap justify-center gap-3">
          <Link href="/register" className="btn-primary">
            Bắt đầu miễn phí
            <ArrowRightIcon width={18} height={18} />
          </Link>
          <Link href="/levels" className="btn-secondary">
            Xem lộ trình
          </Link>
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-2">
        {FEATURES.map(({ Icon, title, text }) => (
          <div key={title} className="card p-5">
            <div className="bg-brand-50 text-brand-600 grid h-10 w-10 place-items-center rounded-xl">
              <Icon />
            </div>
            <h2 className="text-ink-900 mt-3 font-semibold">{title}</h2>
            <p className="text-ink-600 mt-1 text-sm">{text}</p>
          </div>
        ))}
      </section>

      <section className="mt-12">
        <h2 className="text-ink-900 text-xl font-bold">Bảy kiểu bài tập</h2>
        <p className="text-ink-600 mt-1 text-sm">
          Mỗi kiểu rèn một kỹ năng khác nhau — đặc biệt là sắp xếp câu và chia động từ, hai điểm khó
          nhất của tiếng Đức.
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          {EXERCISE_KINDS.map((kind) => (
            <span key={kind} className="chip border-ink-200 border bg-white">
              {kind}
            </span>
          ))}
        </div>
      </section>

      <section className="mt-12 mb-8">
        <h2 className="text-ink-900 text-xl font-bold">Lộ trình 10 cấp độ</h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          {stats.map(({ level, unitCount, vocabCount }) => {
            const theme = levelTheme(level.code)
            return (
              <Link
                key={level.code}
                href={`/levels/${levelToSlug(level.code)}`}
                className={`card hover:border-ink-300 p-4 transition hover:shadow-md ${theme.border}`}
              >
                <span className={`chip ${theme.chip}`}>{level.code}</span>
                <div className="text-ink-900 mt-2 text-sm font-semibold">
                  {level.title.split('—')[1]?.trim() ?? level.title}
                </div>
                <div className="text-ink-500 mt-1 text-xs">
                  {unitCount} unit · {vocabCount} từ
                </div>
              </Link>
            )
          })}
        </div>
      </section>
    </Container>
  )
}
