import { NextResponse } from 'next/server'

import { z } from 'zod'

import { getApiUser, type SessionUser } from './auth'

/** Tiện ích dùng chung cho các Route Handler. */

export function jsonError(message: string, status = 400, extra?: Record<string, unknown>) {
  return NextResponse.json({ error: message, ...extra }, { status })
}

export function unauthorized() {
  return jsonError('Bạn cần đăng nhập để thực hiện thao tác này', 401)
}

/**
 * Đọc và kiểm tra body JSON theo schema Zod.
 * Trả về `{ data }` khi hợp lệ, hoặc `{ response }` chứa lỗi 400 để trả về ngay.
 */
export async function parseBody<T extends z.ZodType>(
  request: Request,
  schema: T,
): Promise<{ data: z.infer<T>; response?: never } | { data?: never; response: NextResponse }> {
  let raw: unknown
  try {
    raw = await request.json()
  } catch {
    return { response: jsonError('Body không phải JSON hợp lệ') }
  }

  const parsed = schema.safeParse(raw)
  if (!parsed.success) {
    return {
      response: jsonError('Dữ liệu gửi lên không hợp lệ', 400, {
        details: z.treeifyError(parsed.error),
      }),
    }
  }

  return { data: parsed.data }
}

/** Bọc handler cần đăng nhập: tự trả 401 nếu chưa có phiên. */
export function withUser<T>(
  handler: (user: SessionUser, request: Request) => Promise<NextResponse<T>> | Promise<NextResponse>,
) {
  return async (request: Request) => {
    const user = await getApiUser()
    if (!user) return unauthorized()
    return handler(user, request)
  }
}
