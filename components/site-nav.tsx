'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useState, useTransition } from 'react'

import { BookIcon, ChartIcon, FlameIcon, GrammarIcon, RepeatIcon, SparkIcon } from '@/components/icons'
import { cn } from '@/lib/utils'

export type NavUser = {
  name: string
  xp: number
  streakCount: number
  dueCount: number
}

const NAV_ITEMS = [
  { href: '/levels', label: 'Học', Icon: BookIcon },
  { href: '/review', label: 'Ôn tập', Icon: RepeatIcon, badgeKey: 'dueCount' as const },
  { href: '/grammar', label: 'Ngữ pháp', Icon: GrammarIcon },
  { href: '/dashboard', label: 'Tiến trình', Icon: ChartIcon },
]

function isActive(pathname: string, href: string): boolean {
  return pathname === href || pathname.startsWith(`${href}/`)
}

export function SiteHeader({ user }: { user: NavUser | null }) {
  const pathname = usePathname()
  const router = useRouter()
  const [menuOpen, setMenuOpen] = useState(false)
  const [pending, startTransition] = useTransition()

  async function handleLogout() {
    await fetch('/api/auth/logout', { method: 'POST' })
    setMenuOpen(false)
    startTransition(() => {
      router.replace('/')
      router.refresh()
    })
  }

  return (
    <header className="border-ink-200 sticky top-0 z-30 border-b bg-white/90 backdrop-blur">
      <div className="mx-auto flex h-14 w-full max-w-5xl items-center gap-3 px-4 sm:px-6">
        <Link href={user ? '/dashboard' : '/'} className="flex shrink-0 items-center gap-2">
          <span className="bg-brand-600 grid h-8 w-8 place-items-center rounded-lg text-sm font-bold text-white">
            DE
          </span>
          <span className="text-ink-900 hidden text-sm font-bold sm:inline">Deutsch Lernen</span>
        </Link>

        {user ? (
          <nav className="ml-2 hidden items-center gap-1 md:flex">
            {NAV_ITEMS.map(({ href, label, Icon, badgeKey }) => {
              const count = badgeKey ? user[badgeKey] : 0
              return (
                <Link
                  key={href}
                  href={href}
                  className={cn(
                    'relative flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium transition',
                    isActive(pathname, href)
                      ? 'bg-brand-50 text-brand-700'
                      : 'text-ink-600 hover:bg-ink-100',
                  )}
                >
                  <Icon width={17} height={17} />
                  {label}
                  {count > 0 ? (
                    <span className="ml-0.5 rounded-full bg-rose-500 px-1.5 py-0.5 text-[10px] leading-none font-bold text-white">
                      {count > 99 ? '99+' : count}
                    </span>
                  ) : null}
                </Link>
              )
            })}
          </nav>
        ) : null}

        <div className="ml-auto flex items-center gap-2">
          {user ? (
            <>
              <span className="text-ink-600 hidden items-center gap-1 text-xs font-semibold sm:flex">
                <FlameIcon width={15} height={15} className="text-orange-500" />
                {user.streakCount}
              </span>
              <span className="text-ink-600 hidden items-center gap-1 text-xs font-semibold sm:flex">
                <SparkIcon width={15} height={15} className="text-amber-500" />
                {user.xp.toLocaleString('vi-VN')}
              </span>

              <div className="relative">
                <button
                  type="button"
                  onClick={() => setMenuOpen((open) => !open)}
                  className="bg-ink-100 text-ink-700 hover:bg-ink-200 grid h-9 w-9 place-items-center rounded-full text-sm font-bold"
                  aria-haspopup="menu"
                  aria-expanded={menuOpen}
                  aria-label="Menu tài khoản"
                >
                  {user.name.slice(0, 1).toUpperCase()}
                </button>

                {menuOpen ? (
                  <>
                    <button
                      type="button"
                      className="fixed inset-0 z-10 cursor-default"
                      aria-hidden="true"
                      tabIndex={-1}
                      onClick={() => setMenuOpen(false)}
                    />
                    <div
                      role="menu"
                      className="border-ink-200 absolute right-0 z-20 mt-2 w-52 overflow-hidden rounded-xl border bg-white shadow-lg"
                    >
                      <div className="border-ink-100 border-b px-4 py-3">
                        <div className="text-ink-900 truncate text-sm font-semibold">{user.name}</div>
                        <div className="text-ink-500 text-xs">{user.xp.toLocaleString('vi-VN')} XP</div>
                      </div>
                      <Link
                        href="/placement"
                        onClick={() => setMenuOpen(false)}
                        className="text-ink-700 hover:bg-ink-50 block px-4 py-2.5 text-sm"
                        role="menuitem"
                      >
                        Kiểm tra xếp lớp
                      </Link>
                      <button
                        type="button"
                        onClick={handleLogout}
                        disabled={pending}
                        className="hover:bg-ink-50 block w-full px-4 py-2.5 text-left text-sm text-rose-600 disabled:opacity-50"
                        role="menuitem"
                      >
                        Đăng xuất
                      </button>
                    </div>
                  </>
                ) : null}
              </div>
            </>
          ) : (
            <>
              <Link href="/login" className="btn-ghost btn-sm">
                Đăng nhập
              </Link>
              <Link href="/register" className="btn-primary btn-sm">
                Bắt đầu học
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  )
}

/** Thanh điều hướng dưới đáy, chỉ hiện trên màn hình nhỏ. */
export function MobileTabBar({ user }: { user: NavUser | null }) {
  const pathname = usePathname()
  if (!user) return null

  return (
    <nav className="border-ink-200 fixed inset-x-0 bottom-0 z-30 border-t bg-white/95 pb-[env(safe-area-inset-bottom)] backdrop-blur md:hidden">
      <div className="mx-auto flex max-w-lg">
        {NAV_ITEMS.map(({ href, label, Icon, badgeKey }) => {
          const count = badgeKey ? user[badgeKey] : 0
          const active = isActive(pathname, href)
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'relative flex flex-1 flex-col items-center gap-0.5 py-2.5 text-[11px] font-medium transition',
                active ? 'text-brand-700' : 'text-ink-500',
              )}
            >
              <span className="relative">
                <Icon width={21} height={21} />
                {count > 0 ? (
                  <span className="absolute -top-1.5 -right-2.5 rounded-full bg-rose-500 px-1.5 py-0.5 text-[9px] leading-none font-bold text-white">
                    {count > 99 ? '99+' : count}
                  </span>
                ) : null}
              </span>
              {label}
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
