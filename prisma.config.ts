import 'dotenv/config'
import { defineConfig } from 'prisma/config'

/**
 * Cấu hình Prisma CLI.
 *
 * `shadowDatabaseUrl` là một database trống Prisma dùng để phát hiện sai lệch
 * (drift) khi chạy `prisma migrate dev`. Với Postgres cục bộ do `npx prisma dev`
 * tạo ra, ta phải chỉ rõ nó; còn `prisma migrate deploy` (dùng khi deploy) thì
 * KHÔNG cần shadow database nên biến này không bắt buộc có trên Vercel.
 */
export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    path: 'prisma/migrations',
  },
  datasource: {
    url: process.env['DATABASE_URL'],
    shadowDatabaseUrl: process.env['SHADOW_DATABASE_URL'],
  },
})
