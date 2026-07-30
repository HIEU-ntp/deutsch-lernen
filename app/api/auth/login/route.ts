import { NextResponse } from 'next/server'

import { z } from 'zod'

import { jsonError, parseBody } from '@/lib/api'
import { createSession, verifyPassword } from '@/lib/auth'
import { prisma } from '@/lib/db'

const bodySchema = z.object({
  email: z.email('Email không hợp lệ').trim().toLowerCase(),
  password: z.string().min(1, 'Vui lòng nhập mật khẩu'),
})

export async function POST(request: Request) {
  const { data, response } = await parseBody(request, bodySchema)
  if (response) return response

  const user = await prisma.user.findUnique({ where: { email: data.email } })

  // Cùng một thông báo cho cả hai trường hợp để không lộ email nào đã đăng ký.
  const invalid = () => jsonError('Email hoặc mật khẩu không đúng', 401)
  if (!user) {
    // Vẫn băm một lần để thời gian phản hồi không tiết lộ email có tồn tại hay không.
    await verifyPassword(data.password, '$2b$10$invalidinvalidinvalidinvalidinvalidinvalidinvalidinv')
    return invalid()
  }

  if (!(await verifyPassword(data.password, user.passwordHash))) return invalid()

  await createSession(user.id)

  return NextResponse.json({
    user: { id: user.id, name: user.name, email: user.email },
  })
}
