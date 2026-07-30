import Link from 'next/link'

import { cn } from '@/lib/utils'

/** Thanh tiến trình. `tone` nhận class nền Tailwind, ví dụ "bg-emerald-500". */
export function ProgressBar({
  value,
  tone = 'bg-brand-600',
  className,
  size = 'md',
}: {
  value: number
  tone?: string
  className?: string
  size?: 'sm' | 'md'
}) {
  const clamped = Math.max(0, Math.min(100, Math.round(value)))
  return (
    <div
      className={cn(
        'bg-ink-200 w-full overflow-hidden rounded-full',
        size === 'sm' ? 'h-1.5' : 'h-2.5',
        className,
      )}
      role="progressbar"
      aria-valuenow={clamped}
      aria-valuemin={0}
      aria-valuemax={100}
    >
      <div
        className={cn('h-full rounded-full transition-[width] duration-500', tone)}
        style={{ width: `${clamped}%` }}
      />
    </div>
  )
}

export function StatCard({
  label,
  value,
  hint,
  icon,
  tone = 'text-brand-600',
}: {
  label: string
  value: React.ReactNode
  hint?: string
  icon?: React.ReactNode
  tone?: string
}) {
  return (
    <div className="card p-4">
      <div className="text-ink-500 flex items-center gap-2 text-xs font-medium">
        {icon ? <span className={tone}>{icon}</span> : null}
        <span className="truncate">{label}</span>
      </div>
      <div className="text-ink-900 mt-1.5 text-2xl font-bold tabular-nums">{value}</div>
      {hint ? <div className="text-ink-500 mt-0.5 text-xs">{hint}</div> : null}
    </div>
  )
}

export function EmptyState({
  title,
  description,
  action,
  icon,
}: {
  title: string
  description?: string
  action?: { href: string; label: string }
  icon?: React.ReactNode
}) {
  return (
    <div className="card flex flex-col items-center gap-3 px-6 py-12 text-center">
      {icon ? <div className="text-ink-300">{icon}</div> : null}
      <div>
        <h3 className="text-ink-900 font-semibold">{title}</h3>
        {description ? (
          <p className="text-ink-500 mx-auto mt-1 max-w-md text-sm">{description}</p>
        ) : null}
      </div>
      {action ? (
        <Link href={action.href} className="btn-primary btn-sm mt-1">
          {action.label}
        </Link>
      ) : null}
    </div>
  )
}

export function PageHeader({
  eyebrow,
  title,
  description,
  actions,
}: {
  eyebrow?: React.ReactNode
  title: string
  description?: React.ReactNode
  actions?: React.ReactNode
}) {
  return (
    <header className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div className="min-w-0">
        {eyebrow ? <div className="mb-1.5">{eyebrow}</div> : null}
        <h1 className="text-ink-900 text-2xl font-bold tracking-tight sm:text-3xl">{title}</h1>
        {description ? <p className="text-ink-600 mt-1.5 max-w-2xl text-sm">{description}</p> : null}
      </div>
      {actions ? <div className="flex shrink-0 flex-wrap gap-2">{actions}</div> : null}
    </header>
  )
}

export function Chip({
  children,
  className,
}: {
  children: React.ReactNode
  className?: string
}) {
  return <span className={cn('chip bg-ink-100 text-ink-700', className)}>{children}</span>
}

/** Khung nội dung chuẩn của mọi trang. */
export function Container({
  children,
  className,
}: {
  children: React.ReactNode
  className?: string
}) {
  return <div className={cn('mx-auto w-full max-w-5xl px-4 py-6 sm:px-6 sm:py-8', className)}>{children}</div>
}
