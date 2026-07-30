import fs from 'node:fs'
import path from 'node:path'

import { parse as parseYaml } from 'yaml'
import { z } from 'zod'

import {
  LEVEL_CODES,
  levelSchema,
  placementSchema,
  unitSchema,
  type GrammarPoint,
  type Level,
  type LevelCode,
  type Unit,
  type UnitWithMeta,
  type VocabItem,
} from './schema'

/**
 * Nạp toàn bộ giáo trình từ thư mục `content/`.
 *
 * ⚠️ Module này dùng `node:fs` nên CHỈ chạy được ở phía server
 * (Server Component, Route Handler, script). Đừng import từ file có `'use client'`.
 *
 * Cách thêm bài học mới: tạo file `content/units/<LEVEL>/<NN>-<slug>.json`
 * (hoặc .yaml). Không cần sửa code, không cần migrate database.
 */

const CONTENT_DIR = path.join(process.cwd(), 'content')
const UNITS_DIR = path.join(CONTENT_DIR, 'units')
const LEVELS_FILE = path.join(CONTENT_DIR, 'levels.json')

// ---------------------------------------------------------------------------
// Đọc file
// ---------------------------------------------------------------------------

const SUPPORTED_EXTENSIONS = ['.json', '.yaml', '.yml']

function readStructuredFile(filePath: string): unknown {
  const raw = fs.readFileSync(filePath, 'utf8')
  const ext = path.extname(filePath).toLowerCase()

  try {
    return ext === '.json' ? JSON.parse(raw) : parseYaml(raw)
  } catch (error) {
    throw new Error(
      `Không đọc được file nội dung ${path.relative(process.cwd(), filePath)}:\n` +
        (error instanceof Error ? error.message : String(error)),
    )
  }
}

function walkContentFiles(dir: string): string[] {
  if (!fs.existsSync(dir)) return []

  const files: string[] = []
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    // Bỏ qua file ẩn và file bắt đầu bằng "_" (dùng cho template/nháp)
    if (entry.name.startsWith('.') || entry.name.startsWith('_')) continue

    const full = path.join(dir, entry.name)
    if (entry.isDirectory()) {
      files.push(...walkContentFiles(full))
    } else if (SUPPORTED_EXTENSIONS.includes(path.extname(entry.name).toLowerCase())) {
      files.push(full)
    }
  }
  return files.sort()
}

function formatZodError(filePath: string, error: z.ZodError): Error {
  return new Error(
    `Nội dung không hợp lệ: ${path.relative(process.cwd(), filePath)}\n${z.prettifyError(error)}`,
  )
}

// ---------------------------------------------------------------------------
// Xây index
// ---------------------------------------------------------------------------

export type ContentIndex = {
  levels: Level[]
  levelByCode: Map<LevelCode, Level>
  units: UnitWithMeta[]
  unitsByLevel: Map<LevelCode, UnitWithMeta[]>
  unitById: Map<string, UnitWithMeta>
  /** khoá: `${level}/${slug}` */
  unitBySlug: Map<string, UnitWithMeta>
  vocabById: Map<string, { item: VocabItem; unit: UnitWithMeta }>
  grammarById: Map<string, { point: GrammarPoint; unit: UnitWithMeta }>
}

function buildIndex(): ContentIndex {
  // --- levels.json ---
  if (!fs.existsSync(LEVELS_FILE)) {
    throw new Error(`Thiếu file ${path.relative(process.cwd(), LEVELS_FILE)}`)
  }

  const levelsParsed = z.array(levelSchema).safeParse(readStructuredFile(LEVELS_FILE))
  if (!levelsParsed.success) throw formatZodError(LEVELS_FILE, levelsParsed.error)

  const levels = [...levelsParsed.data].sort(
    (a, b) => LEVEL_CODES.indexOf(a.code) - LEVEL_CODES.indexOf(b.code),
  )

  const levelByCode = new Map<LevelCode, Level>(levels.map((l) => [l.code, l]))

  // --- units ---
  const units: UnitWithMeta[] = []
  const unitById = new Map<string, UnitWithMeta>()
  const unitBySlug = new Map<string, UnitWithMeta>()
  const vocabById = new Map<string, { item: VocabItem; unit: UnitWithMeta }>()
  const grammarById = new Map<string, { point: GrammarPoint; unit: UnitWithMeta }>()
  const exerciseIds = new Set<string>()

  for (const file of walkContentFiles(UNITS_DIR)) {
    const parsed = unitSchema.safeParse(readStructuredFile(file))
    if (!parsed.success) throw formatZodError(file, parsed.error)

    const unit: UnitWithMeta = {
      ...(parsed.data as Unit),
      sourceFile: path.relative(process.cwd(), file),
    }

    if (!levelByCode.has(unit.level)) {
      throw new Error(
        `${unit.sourceFile}: cấp độ "${unit.level}" chưa được khai báo trong content/levels.json`,
      )
    }

    if (unitById.has(unit.id)) {
      throw new Error(
        `Trùng id unit "${unit.id}": ${unitById.get(unit.id)!.sourceFile} và ${unit.sourceFile}`,
      )
    }
    unitById.set(unit.id, unit)

    const slugKey = `${unit.level}/${unit.slug}`
    if (unitBySlug.has(slugKey)) {
      throw new Error(
        `Trùng slug "${unit.slug}" trong cấp ${unit.level}: ` +
          `${unitBySlug.get(slugKey)!.sourceFile} và ${unit.sourceFile}`,
      )
    }
    unitBySlug.set(slugKey, unit)

    for (const item of unit.vocabulary) {
      if (vocabById.has(item.id)) {
        throw new Error(
          `Trùng id từ vựng "${item.id}": ${vocabById.get(item.id)!.unit.sourceFile} và ${unit.sourceFile}`,
        )
      }
      vocabById.set(item.id, { item, unit })
    }

    for (const point of unit.grammar) {
      if (grammarById.has(point.id)) {
        throw new Error(
          `Trùng id ngữ pháp "${point.id}": ${grammarById.get(point.id)!.unit.sourceFile} và ${unit.sourceFile}`,
        )
      }
      grammarById.set(point.id, { point, unit })
    }

    for (const exercise of unit.exercises) {
      if (exerciseIds.has(exercise.id)) {
        throw new Error(`Trùng id bài tập "${exercise.id}" (thấy ở ${unit.sourceFile})`)
      }
      exerciseIds.add(exercise.id)
    }

    units.push(unit)
  }

  units.sort((a, b) => {
    const byLevel = LEVEL_CODES.indexOf(a.level) - LEVEL_CODES.indexOf(b.level)
    return byLevel !== 0 ? byLevel : a.order - b.order
  })

  const unitsByLevel = new Map<LevelCode, UnitWithMeta[]>()
  for (const code of LEVEL_CODES) unitsByLevel.set(code, [])
  for (const unit of units) unitsByLevel.get(unit.level)!.push(unit)

  // Cảnh báo (không chặn) nếu `order` bị trùng trong cùng cấp độ.
  for (const [code, list] of unitsByLevel) {
    const seen = new Map<number, string>()
    for (const unit of list) {
      const previous = seen.get(unit.order)
      if (previous) {
        console.warn(
          `[content] Cấp ${code}: unit "${unit.id}" và "${previous}" cùng order ${unit.order}`,
        )
      }
      seen.set(unit.order, unit.id)
    }
  }

  return { levels, levelByCode, units, unitsByLevel, unitById, unitBySlug, vocabById, grammarById }
}

// ---------------------------------------------------------------------------
// Cache
// ---------------------------------------------------------------------------

let cached: ContentIndex | null = null

/**
 * Trong production, nội dung được đọc một lần rồi giữ trong bộ nhớ.
 * Trong dev, đọc lại mỗi lần để bạn sửa file JSON là thấy ngay, không cần restart.
 */
export function getContentIndex(): ContentIndex {
  if (process.env.NODE_ENV === 'production') {
    cached ??= buildIndex()
    return cached
  }
  return buildIndex()
}

/** Xoá cache thủ công (dùng trong script / test). */
export function clearContentCache(): void {
  cached = null
}

// ---------------------------------------------------------------------------
// API truy vấn
// ---------------------------------------------------------------------------

export function getLevels(): Level[] {
  return getContentIndex().levels
}

export function getLevel(code: string): Level | undefined {
  return getContentIndex().levelByCode.get(code as LevelCode)
}

export function getAllUnits(): UnitWithMeta[] {
  return getContentIndex().units
}

export function getUnitsByLevel(code: string): UnitWithMeta[] {
  return getContentIndex().unitsByLevel.get(code as LevelCode) ?? []
}

export function getUnitById(id: string): UnitWithMeta | undefined {
  return getContentIndex().unitById.get(id)
}

export function getUnitBySlug(level: string, slug: string): UnitWithMeta | undefined {
  return getContentIndex().unitBySlug.get(`${level}/${slug}`)
}

export function getVocabItem(id: string): { item: VocabItem; unit: UnitWithMeta } | undefined {
  return getContentIndex().vocabById.get(id)
}

export function getGrammarPoint(id: string): { point: GrammarPoint; unit: UnitWithMeta } | undefined {
  return getContentIndex().grammarById.get(id)
}

/** Toàn bộ điểm ngữ pháp, phục vụ trang tra cứu. */
export function getAllGrammarPoints(): Array<{ point: GrammarPoint; unit: UnitWithMeta }> {
  const index = getContentIndex()
  return index.units.flatMap((unit) => unit.grammar.map((point) => ({ point, unit })))
}

/** Unit liền trước / liền sau trong cùng cấp độ, để làm nút điều hướng. */
export function getUnitNeighbours(unit: UnitWithMeta): {
  previous: UnitWithMeta | null
  next: UnitWithMeta | null
} {
  const siblings = getUnitsByLevel(unit.level)
  const i = siblings.findIndex((u) => u.id === unit.id)
  return {
    previous: i > 0 ? siblings[i - 1] : null,
    next: i >= 0 && i < siblings.length - 1 ? siblings[i + 1] : null,
  }
}

// ---------------------------------------------------------------------------
// Bài kiểm tra xếp lớp
// ---------------------------------------------------------------------------

const PLACEMENT_FILE = path.join(CONTENT_DIR, 'placement.json')

let cachedPlacement: z.infer<typeof placementSchema> | null = null

/** Nạp bộ câu hỏi xếp lớp từ `content/placement.json`. */
export function getPlacement(): z.infer<typeof placementSchema> {
  if (process.env.NODE_ENV === 'production' && cachedPlacement) return cachedPlacement

  if (!fs.existsSync(PLACEMENT_FILE)) {
    throw new Error(`Thiếu file ${path.relative(process.cwd(), PLACEMENT_FILE)}`)
  }

  const parsed = placementSchema.safeParse(readStructuredFile(PLACEMENT_FILE))
  if (!parsed.success) throw formatZodError(PLACEMENT_FILE, parsed.error)

  // Sắp xếp câu hỏi từ dễ tới khó để người học không bị nản ngay câu đầu.
  const sorted = {
    ...parsed.data,
    questions: [...parsed.data.questions].sort(
      (a, b) => LEVEL_CODES.indexOf(a.level) - LEVEL_CODES.indexOf(b.level),
    ),
  }

  cachedPlacement = sorted
  return sorted
}

export type LevelStats = {
  level: Level
  unitCount: number
  vocabCount: number
  grammarCount: number
  exerciseCount: number
}

export function getLevelStats(): LevelStats[] {
  const index = getContentIndex()
  return index.levels.map((level) => {
    const units = index.unitsByLevel.get(level.code) ?? []
    return {
      level,
      unitCount: units.length,
      vocabCount: units.reduce((n, u) => n + u.vocabulary.length, 0),
      grammarCount: units.reduce((n, u) => n + u.grammar.length, 0),
      exerciseCount: units.reduce((n, u) => n + u.exercises.length, 0),
    }
  })
}
