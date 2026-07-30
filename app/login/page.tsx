import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { Suspense } from 'react'

import { AuthForm } from '@/components/auth-form'
import { Container } from '@/components/ui'
import { getCurrentUser } from '@/lib/auth'

export const metadata: Metadata = { title: 'Đăng nhập' }

export default async function LoginPage() {
  if (await getCurrentUser()) redirect('/dashboard')

  return (
    <Container className="max-w-md">
      <h1 className="text-ink-900 mt-6 mb-1 text-center text-2xl font-bold">Chào mừng trở lại</h1>
      <p className="text-ink-500 mb-6 text-center text-sm">
        Đăng nhập để tiếp tục lộ trình và ôn tập những gì đến hạn.
      </p>

      {/* useSearchParams cần Suspense bao ngoài */}
      <Suspense fallback={<div className="card h-80 animate-pulse" />}>
        <AuthForm mode="login" />
      </Suspense>
    </Container>
  )
}
