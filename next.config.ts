import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  /*
    QUAN TRỌNG KHI DEPLOY.

    Giáo trình nằm ở thư mục `content/` và được đọc bằng `node:fs` lúc chạy
    (xem lib/content/loader.ts). Vercel chỉ đóng gói những file mà nó truy vết
    được qua lệnh `import` — file đọc động bằng fs sẽ KHÔNG được đưa vào bundle,
    và trang sẽ lỗi "Thiếu file content/levels.json" ngay khi deploy xong.

    Dòng dưới ép Next.js đưa toàn bộ `content/` vào output của mọi route.
    Nếu sau này bạn đọc động thêm thư mục nào khác, nhớ khai báo ở đây.
  */
  outputFileTracingIncludes: {
    '/**': ['./content/**/*'],
  },
}

export default nextConfig
