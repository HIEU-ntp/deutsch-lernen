import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { Suspense } from 'react'

import { AuthForm } from '@/components/auth-form'
import { Container } from '@/components/ui'
import { getCurrentUser } from '@/lib/auth'

export const metadata: Metadata = { title: 'Đăng ký' }

export default async function RegisterPage() {
  if (await getCurrentUser()) redirect('/dashboard')

  return (
    <Container className="max-w-md">
      <h1 className="text-ink-900 mt-6 mb-1 text-center text-2xl font-bold">Tạo tài khoản</h1>
      <p className="text-ink-500 mb-6 text-center text-sm">
        Miễn phí. Sau khi đăng ký bạn sẽ làm một bài kiểm tra xếp lớp ngắn để biết nên bắt đầu từ
        đâu.
      </p>

      <Suspense fallback={<div className="card h-96 animate-pulse" />}>
        <AuthForm mode="register" />
      </Suspense>
    </Container>
  )
}
