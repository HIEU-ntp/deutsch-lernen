import { z } from 'zod'

/**
 * Định nghĩa "hợp đồng" cho toàn bộ nội dung học nằm trong thư mục `content/`.
 *
 * Mọi file bài học đều được kiểm tra bằng các schema dưới đây khi nạp, nên nếu
 * bạn viết sai định dạng thì lỗi sẽ hiện ra ngay kèm đường dẫn file + trường sai,
 * thay vì làm hỏng giao diện lúc chạy.
 *
 * Chạy `npm run content:check` để kiểm tra toàn bộ nội dung.
 */

// ---------------------------------------------------------------------------
// Cấp độ
// ---------------------------------------------------------------------------

export const LEVEL_CODES = [
  'A1.1',
  'A1.2',
  'A2.1',
  'A2.2',
  'B1.1',
  'B1.2',
  'B2.1',
  'B2.2',
  'C1',
  'C2',
] as const

export type LevelCode = (typeof LEVEL_CODES)[number]

export const levelCodeSchema = z.enum(LEVEL_CODES)

export const levelSchema = z.object({
  code: levelCodeSchema,
  /** Tên hiển thị, ví dụ "A1.1 — Khởi đầu" */
  title: z.string().min(1),
  /** Nhóm CEFR gốc: A1, A2, B1, B2, C1, C2 */
  cefr: z.enum(['A1', 'A2', 'B1', 'B2', 'C1', 'C2']),
  descriptionVi: z.string().min(1),
  /** Danh sách "sau khi học xong bạn có thể…" */
  canDo: z.array(z.string()).default([]),
  /** Số giờ học gợi ý */
  estimatedHours: z.number().int().positive().optional(),
})

export type Level = z.infer<typeof levelSchema>

// ---------------------------------------------------------------------------
// Từ vựng
// ---------------------------------------------------------------------------

export const PARTS_OF_SPEECH = [
  'noun',
  'verb',
  'adjective',
  'adverb',
  'preposition',
  'pronoun',
  'conjunction',
  'numeral',
  'phrase',
  'particle',
  'interjection',
] as const

export type PartOfSpeech = (typeof PARTS_OF_SPEECH)[number]

export const exampleSchema = z.object({
  de: z.string().min(1),
  vi: z.string().min(1),
})

export const vocabItemSchema = z.object({
  /** id duy nhất toàn hệ thống, ví dụ "a1-1-u02-v-hallo" */
  id: z.string().min(1),
  /** Từ ở dạng gốc, KHÔNG kèm mạo từ. Ví dụ "Haus", không phải "das Haus". */
  de: z.string().min(1),
  /** Mạo từ xác định — chỉ dùng cho danh từ. */
  article: z.enum(['der', 'die', 'das']).optional(),
  /** Dạng số nhiều, ví dụ "Häuser" */
  plural: z.string().optional(),
  pos: z.enum(PARTS_OF_SPEECH),
  vi: z.string().min(1),
  /** Phiên âm IPA, ví dụ "haʊ̯s" */
  ipa: z.string().optional(),
  example: exampleSchema.optional(),
  /** Ghi chú thêm (cách dùng, mẹo nhớ, cảnh báo lỗi hay gặp) */
  note: z.string().optional(),
  /** Với động từ bất quy tắc: các dạng chính "fahren, fuhr, ist gefahren" */
  principalParts: z.string().optional(),
  tags: z.array(z.string()).default([]),
})

export type VocabItem = z.infer<typeof vocabItemSchema>

// ---------------------------------------------------------------------------
// Ngữ pháp
// ---------------------------------------------------------------------------

export const grammarTableSchema = z.object({
  title: z.string().optional(),
  headers: z.array(z.string()).min(1),
  rows: z.array(z.array(z.string())).min(1),
  /** Chú thích dưới bảng */
  footnote: z.string().optional(),
})

export const grammarPointSchema = z.object({
  id: z.string().min(1),
  /** Tên tiếng Đức của điểm ngữ pháp, ví dụ "Präsens der regelmäßigen Verben" */
  title: z.string().min(1),
  /** Tên tiếng Việt */
  titleVi: z.string().min(1),
  /** Tóm tắt 1-2 câu, hiện ở trang tra cứu */
  summary: z.string().min(1),
  /**
   * Giải thích chi tiết. Hỗ trợ markdown tối giản:
   * `**đậm**`, `*nghiêng*`, `` `code` ``, dòng bắt đầu bằng `- ` thành bullet,
   * và dòng trống ngăn đoạn.
   */
  explanation: z.string().min(1),
  examples: z.array(exampleSchema.extend({ note: z.string().optional() })).default([]),
  tables: z.array(grammarTableSchema).default([]),
  /** Lỗi người Việt hay mắc với điểm ngữ pháp này */
  commonMistakes: z.array(z.string()).default([]),
  tags: z.array(z.string()).default([]),
})

export type GrammarPoint = z.infer<typeof grammarPointSchema>
export type GrammarTable = z.infer<typeof grammarTableSchema>

// ---------------------------------------------------------------------------
// Bài tập
// ---------------------------------------------------------------------------

/**
 * Nhãn kỹ năng — dùng để thống kê "điểm yếu" trên dashboard.
 * Có thể thêm nhãn mới thoải mái, đây chỉ là gợi ý danh sách chuẩn.
 */
export const SKILL_TAGS = [
  'noun-gender',
  'verb-conjugation',
  'word-order',
  'cases',
  'prepositions',
  'articles',
  'plural',
  'adjective-endings',
  'tenses',
  'subjunctive',
  'passive',
  'subordinate-clauses',
  'connectors',
  'listening',
  'translation',
  'vocabulary',
  'pronunciation',
  'numbers',
  'time',
] as const

const exerciseBase = {
  id: z.string().min(1),
  /** Nhãn kỹ năng cho phân tích điểm yếu. Chuỗi tự do, xem SKILL_TAGS. */
  skillTag: z.string().optional(),
  /** Giải thích hiện ra sau khi trả lời */
  explanation: z.string().optional(),
  /** Điểm XP khi làm đúng (mặc định 10) */
  points: z.number().int().positive().default(10),
}

/** 1. Trắc nghiệm */
export const multipleChoiceSchema = z.object({
  ...exerciseBase,
  type: z.literal('multiple_choice'),
  prompt: z.string().min(1),
  /** Bản dịch/diễn giải câu hỏi bằng tiếng Việt */
  promptVi: z.string().optional(),
  options: z.array(z.string()).min(2),
  answerIndex: z.number().int().min(0),
})

/** 2. Điền vào chỗ trống — dùng `___` để đánh dấu mỗi ô trống */
export const fillBlankSchema = z.object({
  ...exerciseBase,
  type: z.literal('fill_blank'),
  /** Ví dụ: "Ich ___ Anna und ___ aus Vietnam." */
  sentence: z.string().min(1),
  /** Mỗi phần tử tương ứng một dấu `___`, theo thứ tự xuất hiện */
  blanks: z
    .array(
      z.object({
        /** Các đáp án được chấp nhận (phần tử đầu là đáp án chuẩn) */
        answers: z.array(z.string().min(1)).min(1),
        hint: z.string().optional(),
      }),
    )
    .min(1),
  translation: z.string().optional(),
})

/** 3. Nối từ/câu */
export const matchingSchema = z.object({
  ...exerciseBase,
  type: z.literal('matching'),
  instruction: z.string().optional(),
  pairs: z
    .array(
      z.object({
        left: z.string().min(1),
        right: z.string().min(1),
      }),
    )
    .min(2),
})

/** 4. Sắp xếp câu — cực quan trọng với trật tự từ tiếng Đức */
export const reorderSchema = z.object({
  ...exerciseBase,
  type: z.literal('reorder'),
  instruction: z.string().optional(),
  /** Thứ tự đúng. Giao diện sẽ tự xáo trộn khi hiển thị. */
  answer: z.array(z.string().min(1)).min(2),
  /** Các thứ tự đúng khác (tiếng Đức thường có nhiều trật tự hợp lệ) */
  alternatives: z.array(z.array(z.string().min(1))).default([]),
  translation: z.string().optional(),
})

/** 5. Nghe hiểu — `audioText` được đọc bằng Text-to-Speech giọng de-DE */
export const listeningSchema = z.object({
  ...exerciseBase,
  type: z.literal('listening'),
  /** Câu tiếng Đức máy sẽ đọc. Người học KHÔNG nhìn thấy chuỗi này. */
  audioText: z.string().min(1),
  /** 'choice' = nghe rồi chọn đáp án; 'dictation' = nghe rồi gõ lại */
  mode: z.enum(['choice', 'dictation']).default('choice'),
  question: z.string().optional(),
  options: z.array(z.string()).optional(),
  answerIndex: z.number().int().min(0).optional(),
  /** Với mode 'dictation': các chuỗi được chấp nhận */
  answers: z.array(z.string()).optional(),
})

/** 6. Dịch ngắn */
export const translateSchema = z.object({
  ...exerciseBase,
  type: z.literal('translate'),
  direction: z.enum(['de-vi', 'vi-de']),
  source: z.string().min(1),
  /** Các bản dịch được chấp nhận (phần tử đầu là đáp án mẫu) */
  answers: z.array(z.string().min(1)).min(1),
  hint: z.string().optional(),
})

/** 7. Chia động từ */
export const conjugationSchema = z.object({
  ...exerciseBase,
  type: z.literal('conjugation'),
  /** Nguyên thể, ví dụ "sein" */
  verb: z.string().min(1),
  verbVi: z.string().optional(),
  /** Mã thì, ví dụ "praesens", "praeteritum", "perfekt", "konjunktiv2" */
  tense: z.string().min(1),
  /** Nhãn hiển thị của thì, ví dụ "Präsens (hiện tại)" */
  tenseLabel: z.string().min(1),
  rows: z
    .array(
      z.object({
        /** Chủ ngữ, ví dụ "ich", "du", "er/sie/es" */
        pronoun: z.string().min(1),
        answer: z.string().min(1),
        /** Các biến thể cũng đúng */
        alternatives: z.array(z.string()).default([]),
        /** Điền sẵn ô này (làm mẫu), người học không phải gõ */
        prefilled: z.boolean().default(false),
      }),
    )
    .min(2),
  note: z.string().optional(),
})

export const exerciseSchema = z.discriminatedUnion('type', [
  multipleChoiceSchema,
  fillBlankSchema,
  matchingSchema,
  reorderSchema,
  listeningSchema,
  translateSchema,
  conjugationSchema,
])

export type Exercise = z.infer<typeof exerciseSchema>
export type ExerciseType = Exercise['type']
export type MultipleChoiceExercise = z.infer<typeof multipleChoiceSchema>
export type FillBlankExercise = z.infer<typeof fillBlankSchema>
export type MatchingExercise = z.infer<typeof matchingSchema>
export type ReorderExercise = z.infer<typeof reorderSchema>
export type ListeningExercise = z.infer<typeof listeningSchema>
export type TranslateExercise = z.infer<typeof translateSchema>
export type ConjugationExercise = z.infer<typeof conjugationSchema>

export const EXERCISE_TYPE_LABELS: Record<ExerciseType, string> = {
  multiple_choice: 'Trắc nghiệm',
  fill_blank: 'Điền vào chỗ trống',
  matching: 'Nối từ',
  reorder: 'Sắp xếp câu',
  listening: 'Nghe hiểu',
  translate: 'Dịch',
  conjugation: 'Chia động từ',
}

// ---------------------------------------------------------------------------
// Unit
// ---------------------------------------------------------------------------

export const unitSchema = z
  .object({
    /** id duy nhất, quy ước: "<level-slug>-u<NN>-<chu-de>", vd "a1-1-u01-alphabet" */
    id: z.string().min(1),
    level: levelCodeSchema,
    /** Thứ tự trong cấp độ, bắt đầu từ 1 */
    order: z.number().int().positive(),
    /** Slug dùng trong URL, duy nhất trong phạm vi một cấp độ */
    slug: z
      .string()
      .min(1)
      .regex(/^[a-z0-9-]+$/, 'slug chỉ được chứa chữ thường, số và dấu gạch ngang'),
    /** Tiêu đề tiếng Đức */
    title: z.string().min(1),
    /** Tiêu đề tiếng Việt */
    titleVi: z.string().min(1),
    description: z.string().optional(),
    /** Mục tiêu bài học */
    goals: z.array(z.string()).default([]),
    vocabulary: z.array(vocabItemSchema).default([]),
    grammar: z.array(grammarPointSchema).default([]),
    exercises: z.array(exerciseSchema).default([]),
  })
  .superRefine((unit, ctx) => {
    // Kiểm tra tính nhất quán mà Zod thuần không diễn đạt được.
    for (const [i, ex] of unit.exercises.entries()) {
      const at = (field: string) => ({ path: ['exercises', i, field] as (string | number)[] })

      if (ex.type === 'multiple_choice' && ex.answerIndex >= ex.options.length) {
        ctx.addIssue({
          code: 'custom',
          message: `answerIndex ${ex.answerIndex} vượt quá số lượng options (${ex.options.length})`,
          ...at('answerIndex'),
        })
      }

      if (ex.type === 'fill_blank') {
        const blankCount = (ex.sentence.match(/___/g) ?? []).length
        if (blankCount !== ex.blanks.length) {
          ctx.addIssue({
            code: 'custom',
            message: `câu có ${blankCount} dấu "___" nhưng khai báo ${ex.blanks.length} blanks`,
            ...at('blanks'),
          })
        }
      }

      if (ex.type === 'reorder') {
        // So sánh không phân biệt hoa/thường: khi đổi trật tự, từ đứng đầu câu
        // tiếng Đức phải viết hoa nên "Morgen" và "morgen" là cùng một token.
        // Bộ chấm điểm cũng bỏ qua hoa/thường nên cách so sánh này là nhất quán.
        const fingerprint = (tokens: string[]) =>
          [...tokens].map((token) => token.toLowerCase()).sort().join('|')

        for (const [j, alt] of ex.alternatives.entries()) {
          const sameTokens =
            alt.length === ex.answer.length && fingerprint(alt) === fingerprint(ex.answer)
          if (!sameTokens) {
            ctx.addIssue({
              code: 'custom',
              message: `alternatives[${j}] phải dùng đúng các từ như answer, chỉ khác thứ tự`,
              ...at('alternatives'),
            })
          }
        }
      }

      if (ex.type === 'listening') {
        if (ex.mode === 'choice') {
          if (!ex.options?.length || ex.answerIndex === undefined) {
            ctx.addIssue({
              code: 'custom',
              message: 'listening mode "choice" cần có options và answerIndex',
              ...at('options'),
            })
          } else if (ex.answerIndex >= ex.options.length) {
            ctx.addIssue({
              code: 'custom',
              message: `answerIndex ${ex.answerIndex} vượt quá số lượng options`,
              ...at('answerIndex'),
            })
          }
        } else if (!ex.answers?.length) {
          ctx.addIssue({
            code: 'custom',
            message: 'listening mode "dictation" cần có answers',
            ...at('answers'),
          })
        }
      }

      if (ex.type === 'conjugation' && ex.rows.every((r) => r.prefilled)) {
        ctx.addIssue({
          code: 'custom',
          message: 'phải có ít nhất một dòng chưa prefilled để người học điền',
          ...at('rows'),
        })
      }
    }
  })

/** Kiểu unit sau khi Zod đã áp default — mọi mảng đều tồn tại. */
export type Unit = z.infer<typeof unitSchema>

// ---------------------------------------------------------------------------
// Bài kiểm tra xếp lớp
// ---------------------------------------------------------------------------

/**
 * Câu hỏi xếp lớp nằm ở `content/placement.json`, độc lập với các unit.
 * Mỗi câu gắn với một cấp độ; thuật toán xếp lớp xét từ thấp lên cao và dừng ở
 * cấp đầu tiên người học chưa vượt qua.
 */
export const placementQuestionSchema = z.object({
  id: z.string().min(1),
  level: levelCodeSchema,
  prompt: z.string().min(1),
  promptVi: z.string().optional(),
  options: z.array(z.string()).min(2),
  answerIndex: z.number().int().min(0),
  explanation: z.string().optional(),
})

export type PlacementQuestion = z.infer<typeof placementQuestionSchema>

export const placementSchema = z.object({
  /** Tỉ lệ đúng tối thiểu để coi là đã vượt qua một cấp độ (0-1) */
  passRatio: z.number().min(0).max(1).default(0.6),
  questions: z.array(placementQuestionSchema).min(1),
})

/** Unit kèm thông tin điều hướng do loader tính ra. */
export type UnitWithMeta = Unit & {
  /** Đường dẫn file nguồn, hữu ích khi báo lỗi */
  sourceFile: string
}
