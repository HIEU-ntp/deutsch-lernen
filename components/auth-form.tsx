'use client'

import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { useState } from 'react'

/** Form đăng nhập / đăng ký dùng chung. */
export function AuthForm({ mode }: { mode: 'login' | 'register' }) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const nextPath = searchParams.get('next') ?? '/dashboard'

  const [error, setError] = useState<string | null>(null)
  const [pending, setPending] = useState(false)

  const isRegister = mode === 'register'

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)
    setPending(true)

    const form = new FormData(event.currentTarget)
    const payload = isRegister
      ? {
          name: String(form.get('name') ?? ''),
          email: String(form.get('email') ?? ''),
          password: String(form.get('password') ?? ''),
        }
      : {
          email: String(form.get('email') ?? ''),
          password: String(form.get('password') ?? ''),
        }

    try {
      const response = await fetch(`/api/auth/${mode}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      if (!response.ok) {
        const body = (await response.json().catch(() => ({}))) as { error?: string }
        setError(body.error ?? 'Có lỗi xảy ra, vui lòng thử lại')
        setPending(false)
        return
      }

      router.replace(isRegister ? '/placement' : nextPath)
      router.refresh()
    } catch {
      setError('Không kết nối được tới máy chủ')
      setPending(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="card space-y-4 p-6">
      {isRegister ? (
        <div>
          <label htmlFor="name" className="label">
            Tên của bạn
          </label>
          <input id="name" name="name" required maxLength={60} className="input" autoComplete="name" />
        </div>
      ) : null}

      <div>
        <label htmlFor="email" className="label">
          Email
        </label>
        <input
          id="email"
          name="email"
          type="email"
          required
          className="input"
          autoComplete="email"
          inputMode="email"
        />
      </div>

      <div>
        <label htmlFor="password" className="label">
          Mật khẩu
        </label>
        <input
          id="password"
          name="password"
          type="password"
          required
          minLength={isRegister ? 8 : 1}
          className="input"
          autoComplete={isRegister ? 'new-password' : 'current-password'}
        />
        {isRegister ? (
          <p className="text-ink-400 mt-1 text-xs">Ít nhất 8 ký tự</p>
        ) : null}
      </div>

      {error ? (
        <p role="alert" className="rounded-xl bg-rose-50 px-3 py-2.5 text-sm text-rose-800">
          {error}
        </p>
      ) : null}

      <button type="submit" disabled={pending} className="btn-primary w-full">
        {pending ? 'Đang xử lý…' : isRegister ? 'Tạo tài khoản' : 'Đăng nhập'}
      </button>

      <p className="text-ink-500 text-center text-sm">
        {isRegister ? 'Đã có tài khoản? ' : 'Chưa có tài khoản? '}
        <Link
          href={isRegister ? '/login' : '/register'}
          className="text-brand-700 font-semibold hover:underline"
        >
          {isRegister ? 'Đăng nhập' : 'Đăng ký'}
        </Link>
      </p>
    </form>
  )
}
