import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'

import bcrypt from 'bcryptjs'
import { SignJWT, jwtVerify } from 'jose'

import { prisma } from './db'

/**
 * Xác thực đơn giản bằng JWT lưu trong cookie httpOnly.
 *
 * Chọn cách này thay vì NextAuth để dự án chạy được ngay khi clone về, không cần
 * cấu hình OAuth provider nào. Nếu sau này cần đăng nhập bằng Google/GitHub thì
 * thay thế phần này bằng NextAuth mà không ảnh hưởng tới phần còn lại — mọi nơi
 * đều lấy người dùng qua `getCurrentUser()` / `requireUser()`.
 */

const COOKIE_NAME = 'deutsch_session'
const SESSION_DAYS = 30

function getSecret(): Uint8Array {
  const secret = process.env.AUTH_SECRET
  if (!secret || secret.length < 32) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error(
        'Thiếu biến môi trường AUTH_SECRET (cần ít nhất 32 ký tự). ' +
          'Sinh khoá bằng: openssl rand -base64 32',
      )
    }
    // Chỉ dùng cho môi trường dev khi người dùng chưa tạo .env
    return new TextEncoder().encode('dev-only-insecure-secret-please-change-me!!')
  }
  return new TextEncoder().encode(secret)
}

// ---------------------------------------------------------------------------
// Mật khẩu
// ---------------------------------------------------------------------------

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10)
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash)
}

// ---------------------------------------------------------------------------
// Phiên đăng nhập
// ---------------------------------------------------------------------------

export async function createSession(userId: string): Promise<void> {
  const token = await new SignJWT({ sub: userId })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(`${SESSION_DAYS}d`)
    .sign(getSecret())

  const store = await cookies()
  store.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: SESSION_DAYS * 24 * 60 * 60,
  })
}

export async function destroySession(): Promise<void> {
  const store = await cookies()
  store.delete(COOKIE_NAME)
}

async function getUserIdFromCookie(): Promise<string | null> {
  const store = await cookies()
  const token = store.get(COOKIE_NAME)?.value
  if (!token) return null

  try {
    const { payload } = await jwtVerify(token, getSecret())
    return typeof payload.sub === 'string' ? payload.sub : null
  } catch {
    // Token hết hạn hoặc bị sửa đổi
    return null
  }
}

export type SessionUser = {
  id: string
  email: string
  name: string
  currentLevel: string
  xp: number
  streakCount: number
  longestStreak: number
  lastStudyDate: string | null
}

export async function getCurrentUser(): Promise<SessionUser | null> {
  const userId = await getUserIdFromCookie()
  if (!userId) return null

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      email: true,
      name: true,
      currentLevel: true,
      xp: true,
      streakCount: true,
      longestStreak: true,
      lastStudyDate: true,
    },
  })

  return user
}

/** Dùng trong Server Component: chưa đăng nhập thì chuyển sang trang đăng nhập. */
export async function requireUser(returnTo?: string): Promise<SessionUser> {
  const user = await getCurrentUser()
  if (!user) {
    redirect(returnTo ? `/login?next=${encodeURIComponent(returnTo)}` : '/login')
  }
  return user
}

/** Dùng trong Route Handler: trả về null để caller tự dựng response 401. */
export async function getApiUser(): Promise<SessionUser | null> {
  return getCurrentUser()
}
