import { PrismaPg } from '@prisma/adapter-pg'

import { PrismaClient } from '@/generated/prisma/client'

/**
 * Prisma Client dùng chung.
 *
 * Trong dev, Next.js hot-reload module liên tục; nếu tạo client mới mỗi lần sẽ mở
 * quá nhiều kết nối tới database. Vì vậy giữ instance trên `globalThis`.
 *
 * Postgres được dùng ở CẢ hai môi trường:
 *   - local: `npx prisma dev` (Postgres chạy trên máy, không cần Docker)
 *   - production: chuỗi kết nối trong biến môi trường DATABASE_URL
 *
 * Dùng chung một hệ CSDL giúp tránh loại lỗi chỉ xuất hiện sau khi deploy.
 */
function createPrismaClient() {
  const connectionString = process.env.DATABASE_URL
  if (!connectionString) {
    throw new Error(
      'Thiếu biến môi trường DATABASE_URL.\n' +
        'Chạy local: mở một terminal khác và gõ `npx prisma dev`, rồi copy chuỗi kết nối vào .env\n' +
        'Trên Vercel: thêm DATABASE_URL trong Project Settings → Environment Variables.',
    )
  }

  const adapter = new PrismaPg({ connectionString })

  return new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error'],
  })
}

const globalForPrisma = globalThis as unknown as {
  prisma?: ReturnType<typeof createPrismaClient>
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient()

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma
}
