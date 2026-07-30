# Deutsch Lernen — Học tiếng Đức từ A1.1 đến C2

Web app học tiếng Đức theo khung CEFR, dành cho người Việt. Toàn bộ giáo trình nằm trong
file JSON — **thêm bài học mới không cần sửa một dòng code nào**.

| | |
|---|---|
| **Cấp độ** | A1.1 · A1.2 · A2.1 · A2.2 · B1.1 · B1.2 · B2.1 · B2.2 · C1 · C2 |
| **Nội dung hiện có** | 34 unit · 383 từ vựng · 68 điểm ngữ pháp · 237 bài tập |
| **Loại bài tập** | trắc nghiệm, điền chỗ trống, nối từ, sắp xếp câu, nghe hiểu, dịch, chia động từ |
| **Ôn tập** | thuật toán SM-2 (giống Anki) |

---

## 1. Chạy trên máy

Yêu cầu: **Node.js 20.9+** (khuyến nghị 22 hoặc mới hơn). Không cần cài Docker hay Postgres.

**Terminal 1** — bật database (giữ nguyên cửa sổ này):

```bash
npm run db:dev
```

**Terminal 2** — cài đặt và chạy app:

```bash
npm install
cp .env.example .env
npx prisma migrate deploy
npm run dev
```

Mở http://localhost:3000, bấm **Bắt đầu học** để tạo tài khoản.

`npm run db:dev` bật một Postgres chạy ngay trên máy bạn (qua `prisma dev`), nên môi trường
local và production dùng **cùng một hệ quản trị CSDL** — tránh được loại lỗi chỉ xuất hiện
sau khi deploy. Chuỗi kết nối mặc định trong `.env.example` đã khớp sẵn, không cần sửa.

Sau khi copy `.env.example` thành `.env`, hãy sinh một khoá bí mật mới:

```bash
openssl rand -base64 32
```

Dán chuỗi vừa sinh vào `AUTH_SECRET`. Khi `NODE_ENV=production` thì `AUTH_SECRET` là **bắt buộc**.

### Các lệnh khác

| Lệnh | Việc nó làm |
|---|---|
| `npm run db:dev` | bật Postgres cục bộ (cần chạy trước khi `npm run dev`) |
| `npm run dev` | chạy dev server (Turbopack) |
| `npm run build` rồi `npm start` | build và chạy bản production |
| `npm run content:check` | **kiểm tra toàn bộ file nội dung** — chạy sau mỗi lần sửa bài học |
| `npm run typecheck` | kiểm tra TypeScript |
| `npm run lint` | ESLint |
| `npm run db:deploy` | áp dụng migration đang có |
| `npm run db:studio` | mở Prisma Studio để xem database |

> **Khi bạn sửa `prisma/schema.prisma`:** `prisma migrate dev` cần một *shadow database*
> riêng để phát hiện sai lệch, mà Postgres cục bộ của `prisma dev` không tách được database.
> Hãy trỏ `SHADOW_DATABASE_URL` tới một Postgres thật (một database dev miễn phí trên cloud
> là đủ). Nếu chỉ chạy ứng dụng chứ không đổi schema thì không cần bận tâm.

---

## 2. Thêm bài học mới

Đây là phần quan trọng nhất của dự án: **nội dung tách hoàn toàn khỏi code**.

### Các bước

1. Copy `content/units/_template.json` sang `content/units/<CẤP ĐỘ>/<NN>-<slug>.json`
   Ví dụ: `content/units/A2.1/03-wetter.json`
2. Sửa nội dung, xoá khoá `_huong_dan`.
3. Chạy `npm run content:check` — script báo chính xác file nào, trường nào sai.
4. Xong. Bài học tự xuất hiện trên web.

> Ở chế độ dev không cần restart server: nội dung được đọc lại mỗi request nên sửa file là
> thấy ngay. Ở production, nội dung được cache trong bộ nhớ sau lần đọc đầu tiên.

Loader bỏ qua file bắt đầu bằng `_` hoặc `.`, nên bạn có thể để bản nháp trong thư mục
`content/units/` mà không ảnh hưởng gì.

### Cấu trúc thư mục nội dung

```
content/
├── levels.json              # định nghĩa 10 cấp độ (tên, mô tả, mục tiêu)
├── placement.json           # ngân hàng câu hỏi cho bài kiểm tra xếp lớp
└── units/
    ├── _template.json       # file mẫu, loader bỏ qua
    ├── A1.1/
    │   ├── 01-alphabet.json
    │   └── …
    └── C2/
        └── …
```

Hỗ trợ cả `.json`, `.yaml` và `.yml` — dùng định dạng nào cũng được.

### Cấu trúc một unit

```jsonc
{
  "id": "a2-1-u03-wetter",     // duy nhất toàn hệ thống
  "level": "A2.1",             // phải khớp một cấp trong levels.json
  "order": 3,                  // thứ tự hiển thị trong cấp độ
  "slug": "wetter",            // dùng trong URL, duy nhất trong cấp độ
  "title": "Das Wetter",       // tiêu đề tiếng Đức
  "titleVi": "Thời tiết",      // tiêu đề tiếng Việt
  "description": "…",
  "goals": ["…"],

  "vocabulary": [ … ],
  "grammar":    [ … ],
  "exercises":  [ … ]
}
```

### Từ vựng

```jsonc
{
  "id": "a2-1-u03-v-wetter",
  "de": "Wetter",              // KHÔNG kèm mạo từ
  "article": "das",            // der | die | das — chỉ dùng cho danh từ
  "plural": "—",
  "pos": "noun",               // noun|verb|adjective|adverb|preposition|pronoun|
                               // conjunction|numeral|phrase|particle|interjection
  "vi": "thời tiết",
  "ipa": "ˈvɛtɐ",                                 // tuỳ chọn
  "principalParts": "fahren, fuhr, ist gefahren", // tuỳ chọn, cho động từ bất quy tắc
  "example": { "de": "…", "vi": "…" },            // tuỳ chọn
  "note": "mẹo nhớ, lỗi hay gặp",                 // tuỳ chọn
  "tags": ["thoi-tiet"]
}
```

Giao diện tự tô màu theo giống danh từ: **der** xanh dương, **die** hồng, **das** xanh lá.

### Ngữ pháp

Trường `explanation` hỗ trợ markdown tối giản: `**đậm**`, `*nghiêng*`, `` `mã` ``, dòng bắt
đầu bằng `- ` thành gạch đầu dòng, dòng trống ngăn đoạn. Ngoài ra có `tables` (bảng biến
cách, bảng chia động từ), `examples` (kèm nút phát âm) và `commonMistakes`.

Mọi điểm ngữ pháp tự động xuất hiện ở trang **Ngữ pháp tra cứu** (`/grammar`), lọc được theo
cấp độ và tìm kiếm được.

### Bảy loại bài tập

| `type` | Trường bắt buộc |
|---|---|
| `multiple_choice` | `prompt`, `options`, `answerIndex` |
| `fill_blank` | `sentence` (dùng `___`), `blanks[]` (số lượng phải khớp số `___`) |
| `matching` | `pairs[]` với `left` / `right` |
| `reorder` | `answer[]` (thứ tự đúng — giao diện tự xáo trộn), `alternatives[][]` tuỳ chọn |
| `listening` | `audioText`, `mode`: `choice` (+ `options`, `answerIndex`) hoặc `dictation` (+ `answers`) |
| `translate` | `direction`: `de-vi` hoặc `vi-de`, `source`, `answers[]` |
| `conjugation` | `verb`, `tense`, `tenseLabel`, `rows[]` với `pronoun` / `answer` |

Trường dùng chung: `id`, `explanation`, `skillTag`, `points` (mặc định 10).

`skillTag` quyết định mục **Điểm yếu** trên dashboard. Các nhãn chuẩn: `noun-gender`,
`verb-conjugation`, `word-order`, `cases`, `prepositions`, `articles`, `plural`,
`adjective-endings`, `tenses`, `subjunctive`, `passive`, `subordinate-clauses`,
`connectors`, `listening`, `translation`, `vocabulary`, `pronunciation`, `numbers`, `time`.
Bạn có thể tự thêm nhãn mới — chỉ cần bổ sung nhãn tiếng Việt vào `SKILL_LABELS` trong
[`lib/progress.ts`](lib/progress.ts).

### Chấm điểm khoan dung có chủ đích

Bộ chấm điểm bỏ qua hoa/thường, khoảng trắng thừa, dấu câu cuối câu, và **chấp nhận cách gõ
thay thế chính thức**: `ae` → ä, `oe` → ö, `ue` → ü, `ss` → ß. Người học không có bàn phím
tiếng Đức vẫn làm bài bình thường.

---

## 3. Kiến trúc

### Nguyên tắc trung tâm

> **Database chỉ lưu dữ liệu người dùng. Giáo trình nằm trong file.**

Database không hề biết unit là gì — nó chỉ lưu chuỗi id (`unitId`, `itemId`, `exerciseId`).
Nhờ vậy thêm 100 bài học mới cũng không cần một migration nào.

```
Người dùng ──▶ Next.js App Router
                    │
                    ├──▶ lib/content/loader.ts ──▶ content/*.json   (giáo trình, chỉ đọc)
                    │         └── Zod validate khi nạp
                    │
                    └──▶ lib/db.ts (Prisma) ──▶ Postgres            (dữ liệu người dùng)
```

### Stack

| Thành phần | Lựa chọn | Lý do |
|---|---|---|
| Framework | Next.js 16 (App Router) + TypeScript | Server Component và API route trong một repo |
| UI | Tailwind CSS v4 | responsive nhanh, không cần thư viện component |
| Database | Postgres qua Prisma 7 | local dùng `prisma dev` (không cần Docker), production dùng Postgres cloud — cùng một hệ CSDL ở cả hai nơi |
| Xác thực | JWT trong cookie httpOnly (`jose` + `bcryptjs`) | không phụ thuộc OAuth provider nào |
| Nội dung | File JSON/YAML validate bằng Zod | source of truth tách khỏi DB |
| Phát âm | Web Speech API (`de-DE`) | miễn phí, không cần API key |

### Bản đồ thư mục

```
app/
├── page.tsx                    # trang giới thiệu
├── login/ · register/          # đăng nhập, đăng ký
├── dashboard/                  # tiến trình, điểm yếu, huy hiệu
├── levels/[level]/             # danh sách unit theo cấp độ
├── learn/[level]/[unit]/       # trang học: Từ vựng / Ngữ pháp / Bài tập
├── review/                     # "Ôn tập hôm nay" (SRS)
├── grammar/                    # ngữ pháp tra cứu, lọc + tìm kiếm
├── placement/                  # bài kiểm tra xếp lớp
└── api/                        # auth, attempts, srs, placement

lib/
├── content/schema.ts           # Zod schema — "hợp đồng" của mọi file nội dung
├── content/loader.ts           # nạp, validate và đánh index nội dung
├── srs.ts                      # thuật toán SM-2 (thuần, không phụ thuộc DB)
├── srs-service.ts              # ghép thẻ SRS với nội dung
├── grading.ts                  # chấm điểm 7 loại bài tập
├── progress.ts                 # tiến trình, thống kê điểm yếu
├── rewards.ts                  # XP, streak, huy hiệu
├── placement.ts                # thuật toán xếp lớp
├── auth.ts · db.ts · tts.ts · utils.ts
```

### Thuật toán ôn tập ngắt quãng (SM-2)

Mỗi từ vựng / điểm ngữ pháp đã học sinh ra một thẻ trong bảng `srs_cards`. Sau mỗi lần ôn,
người học tự đánh giá theo 4 mức, thuật toán tính lại khoảng cách ôn kế tiếp:

| Đánh giá | Chất lượng | Hệ quả |
|---|---|---|
| Quên rồi | 0 | Học lại sau 10 phút, hệ số dễ giảm mạnh |
| Khó | 3 | Giãn chậm (×0.8), hệ số dễ giảm nhẹ |
| Được | 4 | Giãn theo hệ số dễ |
| Dễ | 5 | Giãn theo hệ số dễ, hệ số dễ tăng |

Trả lời "Được" liên tục cho chuỗi khoảng cách: 1 → 6 → 15 → 38 → 95 → 238 ngày. Thẻ có
khoảng cách ≥ 21 ngày được tính là **đã thuộc** trên dashboard.

Trang `/review` gộp thẻ đến hạn của **mọi cấp độ**, nạp tối đa 40 thẻ mỗi phiên. Thẻ bị đánh
giá "Quên rồi" quay lại cuối hàng đợi ngay trong phiên.

### Xếp lớp

Bài test xét từ cấp thấp lên: đạt ≥ 60% ở một cấp thì xét tiếp cấp trên; **cấp đầu tiên
không đạt chính là cấp được gợi ý**. Cách này tránh việc đoán mò trúng vài câu khó mà bị xếp
nhầm lên quá cao. Sửa ngân hàng câu hỏi trong `content/placement.json`; chỉnh ngưỡng qua
trường `passRatio`.

---

## 4. Deploy lên Vercel

Dự án đã cấu hình sẵn. Bạn chỉ cần một database và hai lệnh.

### 4.1. Tạo database Postgres (miễn phí)

Chọn một nhà cung cấp, tạo database, copy **connection string**:

| Nhà cung cấp | Ghi chú |
|---|---|
| [Neon](https://neon.tech) | bậc miễn phí rộng rãi, khởi tạo nhanh nhất |
| [Prisma Postgres](https://www.prisma.io/postgres) | cùng hệ sinh thái Prisma đang dùng |
| [Supabase](https://supabase.com) | nếu bạn muốn thêm tính năng khác sau này |

Chuỗi kết nối phải có `?sslmode=require` (hầu hết nhà cung cấp tự thêm sẵn).

### 4.2. Deploy

```bash
vercel login
vercel link
```

Thêm hai biến môi trường (chạy từng lệnh, dán giá trị khi được hỏi):

```bash
vercel env add DATABASE_URL production
vercel env add AUTH_SECRET production
```

`AUTH_SECRET` sinh bằng `openssl rand -base64 32` — **đừng dùng lại khoá của môi trường local**.

Rồi deploy:

```bash
vercel --prod
```

### 4.3. Những gì đã được lo sẵn

| Vấn đề | Cách xử lý trong repo |
|---|---|
| Migration chạy khi nào? | `vercel-build` script chạy `prisma migrate deploy` trước `next build` |
| Prisma Client được sinh ra chưa? | `postinstall` chạy `prisma generate` |
| Thư mục `content/` có bị bỏ quên không? | `outputFileTracingIncludes` trong `next.config.ts` ép Vercel đóng gói — **thiếu dòng này là app sập ngay sau khi deploy** vì nội dung được đọc bằng `fs` lúc chạy |
| Máy chủ đặt ở đâu? | `vercel.json` chọn vùng `sin1` (Singapore) cho độ trễ thấp từ Việt Nam |

> Nên đặt database ở **cùng vùng Singapore** với Vercel. Database ở Mỹ hoặc EU sẽ khiến mỗi
> truy vấn đi vòng nửa vòng Trái Đất và trang tải chậm thấy rõ.

### 4.4. Kiểm tra sau khi deploy

1. Mở URL Vercel trả về, đăng ký một tài khoản → nếu tạo được thì database đã thông.
2. Vào một bài học bất kỳ → nếu hiện từ vựng thì `content/` đã được đóng gói đúng.
3. Bấm "Đã học xong" rồi vào trang **Ôn tập** → xác nhận SRS ghi được dữ liệu.

---

## 5. Những điều đã biết và hướng phát triển

**Giọng đọc.** Chất lượng phát âm phụ thuộc giọng `de-DE` cài trên máy người dùng. macOS và
Windows có sẵn; một số bản Linux thì không, khi đó nút loa sẽ mờ đi kèm chú thích. Muốn chất
lượng cao hơn, chỉ cần thay phần thân hàm `speakGerman` trong [`lib/tts.ts`](lib/tts.ts) —
mọi component đều gọi qua hàm này.

**Múi giờ.** Streak tính theo ngày của máy chủ. Chạy local thì máy chủ chính là máy bạn nên
không lệch; khi deploy lên server ở múi giờ khác, hãy truyền ngày từ client xuống hàm
`recordActivity`.

**Nội dung A2–C2.** Mỗi cấp hiện có 2 unit mẫu, đủ để thấy hệ thống scale và làm khuôn để bổ
sung. A1.1 và A1.2 đã đầy đủ 9 unit mỗi cấp.

**Có thể làm tiếp:** nhập/xuất bộ thẻ Anki, luyện nói bằng Web Speech Recognition, bảng xếp
hạng, chia sẻ tiến trình, chế độ offline (PWA).

---

## 6. Ghi chú kỹ thuật

- **Next.js 16**: `params`, `searchParams`, `cookies()`, `headers()` đều **bất đồng bộ** —
  luôn `await` trước khi dùng. `middleware.ts` đã đổi tên thành `proxy.ts` (dự án này không
  dùng đến).
- **Tailwind v4**: `@apply` chỉ nhận utility thật, **không** nhận class tự định nghĩa trong
  `@layer`. Xem chú thích trong [`app/globals.css`](app/globals.css).
- **Xáo trộn đáp án** dùng hạt giống cố định (id bài tập) để server và client cho ra cùng
  thứ tự — nếu xáo ngẫu nhiên thật, React sẽ báo lỗi hydration mismatch.
- **Prisma 7** dùng driver adapter (`@prisma/adapter-pg`) và đọc `DATABASE_URL` từ
  `prisma.config.ts`.
- **Postgres cục bộ của `prisma dev` không tách được database**: mọi tên database trong
  chuỗi kết nối đều trỏ về cùng một kho dữ liệu. Điều này chỉ ảnh hưởng tới `migrate dev`
  (cần shadow database), không ảnh hưởng tới việc chạy ứng dụng.
- **File đọc bằng `fs` lúc chạy phải khai báo trong `outputFileTracingIncludes`**, nếu không
  Vercel sẽ không đóng gói chúng.
