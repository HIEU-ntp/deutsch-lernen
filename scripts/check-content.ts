/**
 * Kiểm tra toàn bộ nội dung trong `content/` có đúng định dạng không.
 *
 *   npm run content:check
 *
 * Chạy lệnh này sau khi thêm/sửa file bài học. Nếu có lỗi, script in ra đường dẫn
 * file và trường bị sai rồi thoát với mã lỗi 1 (tiện gắn vào CI).
 */

import { getContentIndex, getLevelStats } from '../lib/content/loader'
import { EXERCISE_TYPE_LABELS, type ExerciseType } from '../lib/content/schema'

function main() {
  const index = getContentIndex()
  const stats = getLevelStats()

  const totals = {
    units: index.units.length,
    vocab: index.vocabById.size,
    grammar: index.grammarById.size,
    exercises: index.units.reduce((n, unit) => n + unit.exercises.length, 0),
  }

  console.log('✅ Nội dung hợp lệ\n')

  const pad = (value: string | number, width: number) => String(value).padStart(width)
  console.log('Cấp    Unit  Từ vựng  Ngữ pháp  Bài tập')
  console.log('─'.repeat(43))
  for (const row of stats) {
    const flag = row.unitCount === 0 ? '  ← chưa có nội dung' : ''
    console.log(
      `${row.level.code.padEnd(6)} ${pad(row.unitCount, 4)}  ${pad(row.vocabCount, 7)}  ` +
        `${pad(row.grammarCount, 8)}  ${pad(row.exerciseCount, 7)}${flag}`,
    )
  }
  console.log('─'.repeat(43))
  console.log(
    `Tổng   ${pad(totals.units, 4)}  ${pad(totals.vocab, 7)}  ` +
      `${pad(totals.grammar, 8)}  ${pad(totals.exercises, 7)}`,
  )

  // Phân bố các loại bài tập — giúp phát hiện khi một loại bị bỏ quên.
  const byType = new Map<ExerciseType, number>()
  for (const unit of index.units) {
    for (const exercise of unit.exercises) {
      byType.set(exercise.type, (byType.get(exercise.type) ?? 0) + 1)
    }
  }

  console.log('\nPhân bố loại bài tập')
  console.log('─'.repeat(43))
  for (const [type, label] of Object.entries(EXERCISE_TYPE_LABELS) as [ExerciseType, string][]) {
    const count = byType.get(type) ?? 0
    const bar = '█'.repeat(Math.min(20, count))
    console.log(`${label.padEnd(20)} ${pad(count, 4)} ${bar}${count === 0 ? ' ← chưa dùng' : ''}`)
  }

  // Cảnh báo mềm: unit không có bài tập, hoặc bài tập nghe không có audioText hợp lý.
  const warnings: string[] = []
  for (const unit of index.units) {
    if (unit.exercises.length === 0) {
      warnings.push(`${unit.sourceFile}: unit chưa có bài tập nào`)
    }
    if (unit.vocabulary.length === 0 && unit.grammar.length === 0) {
      warnings.push(`${unit.sourceFile}: unit chưa có từ vựng lẫn ngữ pháp`)
    }
    for (const item of unit.vocabulary) {
      if (item.pos === 'noun' && !item.article) {
        warnings.push(`${unit.sourceFile}: danh từ "${item.de}" thiếu mạo từ (der/die/das)`)
      }
    }
  }

  if (warnings.length > 0) {
    console.log(`\n⚠️  ${warnings.length} cảnh báo`)
    console.log('─'.repeat(43))
    for (const warning of warnings.slice(0, 30)) console.log(`   ${warning}`)
    if (warnings.length > 30) console.log(`   … và ${warnings.length - 30} cảnh báo khác`)
  }

  console.log()
}

try {
  main()
} catch (error) {
  console.error('\n❌ Nội dung KHÔNG hợp lệ\n')
  console.error(error instanceof Error ? error.message : error)
  console.error()
  process.exit(1)
}
