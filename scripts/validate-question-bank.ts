import { questions } from '../src/data'

const problems: string[] = []
const ids = new Set<string>()
const stems = new Set<string>()

for (const item of questions) {
  if (ids.has(item.id)) problems.push(`Duplicate id: ${item.id}`)
  ids.add(item.id)

  const normalize = (value: string) => value.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim()
  const stem = `${normalize(item.question)}|${item.options.map(normalize).join('|')}`
  if (stems.has(stem)) problems.push(`Duplicate stem: ${item.question}`)
  stems.add(stem)

  if (item.options.length !== 4) problems.push(`${item.id}: expected exactly four options`)
  if (new Set(item.options.map(option => option.trim())).size !== item.options.length) problems.push(`${item.id}: duplicate answer options`)
  if (item.id.startsWith('gq') && new Set(item.options.map(option => normalize(option))).size !== item.options.length) problems.push(`${item.id}: duplicate answer options`)
  if (!Number.isInteger(item.answer) || item.answer < 0 || item.answer >= item.options.length) problems.push(`${item.id}: invalid answer index`)
  if (!item.explanation.trim() || !item.hint.trim()) problems.push(`${item.id}: missing explanation or hint`)
  if (!item.source.trim()) problems.push(`${item.id}: missing source or provenance note`)
  if (item.seconds < 15 || item.seconds > 240) problems.push(`${item.id}: unreasonable target time`)
}

if (questions.length < 4_110) problems.push(`Expected at least ten times the former 411-question bank, received ${questions.length}`)

const distribution = Object.entries(
  questions.reduce<Record<string, number>>((counts, item) => {
    counts[item.subject] = (counts[item.subject] ?? 0) + 1
    return counts
  }, {}),
)
const hardDistribution = questions.reduce<Record<string, number>>((counts, item) => {
  if (item.difficulty === 'Hard') counts[item.subject] = (counts[item.subject] ?? 0) + 1
  return counts
}, {})

for (const subject of ['Arithmetic', 'Reasoning', 'General Studies', 'AP Focus', 'English']) {
  const count = distribution.find(([name]) => name === subject)?.[1] ?? 0
  if (count < 600) problems.push(`${subject}: requires at least 600 unique questions for sectionals, received ${count}`)
  const hardCount = hardDistribution[subject] ?? 0
  if (hardCount < 350) problems.push(`${subject}: requires at least 350 hard questions, received ${hardCount}`)
}

if (new Set(questions.slice(0, 100).map(item => item.id)).size !== 100) {
  problems.push('The full-mock pool cannot supply 100 unique ids')
}

if (problems.length) {
  console.error(problems.join('\n'))
  process.exit(1)
}

console.log(`Validated ${questions.length} unique questions.`)
for (const [subject, count] of distribution) console.log(`${subject}: ${count} total · ${hardDistribution[subject] ?? 0} hard`)
