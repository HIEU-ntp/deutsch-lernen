import { NextResponse } from 'next/server'

import { z } from 'zod'

import { jsonError, parseBody } from '@/lib/api'
import { createSession, hashPassword } from '@/lib/auth'
import { LEVEL_CODES } from '@/lib/content/schema'
import { prisma } from '@/lib/db'

const bodySchema = z.object({
  name: z.string().trim().min(1, 'Vui lòng nhập tên').max(60),
  email: z.email('Email không hợp lệ').trim().toLowerCase(),
  password: z.string().min(8, 'Mật khẩu cần ít nhất 8 ký tự').max(200),
  startLevel: z.enum(LEVEL_CODES).optional(),
})

export async function POST(request: Request) {
  const { data, response } = await parseBody(request, bodySchema)
  if (response) return response

  const existing = await prisma.user.findUnique({ where: { email: data.email } })
  if (existing) return jsonError('Email này đã được đăng ký', 409)

  const user = await prisma.user.create({
    data: {
      name: data.name,
      email: data.email,
      passwordHash: await hashPassword(data.password),
      currentLevel: data.startLevel ?? 'A1.1',
    },
    select: { id: true, name: true, email: true },
  })

  await createSession(user.id)

  return NextResponse.json({ user }, { status: 201 })
}
