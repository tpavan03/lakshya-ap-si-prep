import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { test } from 'node:test'
import { questions, type Question } from '../src/data.ts'
import { apTemplateFamilies, createExamQuiz, createPracticeQuiz, EXAMS, getBlueprints, isLegacyTemplate } from '../src/lib/examEngine.ts'
import { generatedQuantReasoningQuestions } from '../src/questions/generatedQuantReasoning.ts'
import { expandedGeneralStudiesQuestions } from '../src/questions/gsExpandedBank.ts'
import { expandedApQuestions } from '../src/questions/apExpandedBank.ts'
import { niclQuestions } from '../src/questions/nicl.ts'
import { severeArithmeticQuestions } from '../src/questions/severeArithmetic.ts'
import { severeReasoningQuestions, severeReasoningSelfCheck } from '../src/questions/severeReasoning.ts'
import { severeGsPolityEconomyScienceQuestions } from '../src/questions/severeGsPolityEconomyScience.ts'
import { severeGsHistoryGeographyQuestions } from '../src/questions/severeGsHistoryGeography.ts'
import { severeApFocusQuestions } from '../src/questions/severeApFocus.ts'

const severe: Question[] = [
  ...severeArithmeticQuestions,
  ...severeReasoningQuestions,
  ...severeGsPolityEconomyScienceQuestions,
  ...severeGsHistoryGeographyQuestions,
  ...severeApFocusQuestions,
]
const byId = new Map(questions.map(q => [q.id, q]))

test('every severe item reaches the assembled bank (nothing is silently de-duplicated away)', () => {
  assert.equal(new Set(severe.map(q => q.id)).size, severe.length)
  for (const q of severe) assert.ok(byId.has(q.id), `${q.id} was dropped during assembly`)
})

test('severe items are well-formed: Hard, four distinct options, one valid answer', () => {
  for (const q of severe) {
    assert.match(q.id, /^sv[a-z]-/, q.id)
    assert.equal(q.difficulty, 'Hard', q.id)
    assert.equal(q.options.length, 4, q.id)
    assert.equal(new Set(q.options.map(o => o.trim().toLowerCase())).size, 4, `${q.id}: duplicate options`)
    assert.ok(Number.isInteger(q.answer) && q.answer >= 0 && q.answer < 4, q.id)
    assert.ok(q.explanation.trim().length > 40 && q.hint.trim(), `${q.id}: explanation or hint missing`)
    assert.ok(!/NaN|undefined|Infinity|\[object/.test(q.question + q.options.join() + q.explanation), `${q.id}: rendering artefact`)
  }
})

test('answer positions are balanced in every severe subject', () => {
  for (const subject of ['Arithmetic', 'Reasoning', 'General Studies', 'AP Focus']) {
    const items = severe.filter(q => q.subject === subject)
    const counts = [0, 1, 2, 3].map(i => items.filter(q => q.answer === i).length)
    for (const c of counts) assert.ok(c / items.length > 0.15 && c / items.length < 0.35, `${subject}: answer positions ${counts}`)
  }
})

test('every reasoning puzzle re-solves to exactly one solution matching its key', () => {
  assert.deepEqual(severeReasoningSelfCheck(), [])
})

test('old ids still resolve, with unchanged text and answers; templated items are not labelled Hard', () => {
  for (const old of [...generatedQuantReasoningQuestions, ...expandedGeneralStudiesQuestions, ...expandedApQuestions]) {
    const current = byId.get(old.id)
    assert.ok(current, `${old.id} no longer resolves`)
    assert.equal(current.question, old.question)
    assert.deepEqual(current.options, old.options)
    assert.equal(current.answer, old.answer)
  }
  assert.ok(questions.filter(q => /^gq[ar]-/.test(q.id)).every(q => q.difficulty !== 'Hard'))
})

const apPapers = (['prelims', 'mains'] as const).flatMap(stage => EXAMS['ap-si'].stages[stage].map(paper => ({ stage, paper })))

test('AP SI papers are overwhelmingly hard, mostly severe, and cap template families', () => {
  for (const { stage, paper } of apPapers) for (const seed of [1, 2, 3, 17, 30]) {
    const quiz = createExamQuiz('ap-si', stage, paper.id, seed, questions)
    const n = quiz.items.length
    assert.equal(n, paper.questions)
    assert.equal(new Set(quiz.items.map(q => q.id)).size, n)
    const hard = quiz.items.filter(q => q.difficulty === 'Hard').length
    const fresh = quiz.items.filter(q => q.id.startsWith('sv')).length
    const legacy = quiz.items.filter(isLegacyTemplate).length
    assert.ok(hard / n >= 0.84, `${paper.id}#${seed}: hard share ${hard}/${n}`)
    assert.ok(fresh / n >= 0.7, `${paper.id}#${seed}: severe share ${fresh}/${n}`)
    assert.ok(legacy / n <= 0.15, `${paper.id}#${seed}: legacy template share ${legacy}/${n}`)
    const used = new Map<string, number>()
    for (const q of quiz.items) for (const [key, cap] of apTemplateFamilies(q)) {
      used.set(key, (used.get(key) ?? 0) + 1)
      assert.ok(used.get(key)! <= cap, `${paper.id}#${seed}: family ${key} exceeds ${cap}`)
    }
  }
})

test('AP practice keeps difficulty filters usable and soft caps still fill small pools', () => {
  for (const difficulty of ['Easy', 'Medium', 'Hard'] as const) {
    const quiz = createPracticeQuiz({ examId: 'ap-si', pool: questions, subjects: ['Arithmetic', 'Reasoning'], difficulty, count: 25, minutes: 30, seed: 5 })
    assert.equal(quiz.items.length, 25)
    assert.ok(quiz.items.every(q => q.difficulty === difficulty))
  }
  const all = createPracticeQuiz({ examId: 'ap-si', pool: questions, count: 40, minutes: 40, seed: 9 })
  assert.ok(all.items.filter(q => q.difficulty === 'Hard').length >= 34)
  // A saved-questions pool made only of one template family must still be playable.
  const saved = questions.filter(q => q.id.startsWith('gqa-pct-')).slice(0, 6)
  const quiz = createPracticeQuiz({ examId: 'ap-si', pool: saved, count: 6, minutes: 10, seed: 3 })
  assert.deepEqual(new Set(quiz.items.map(q => q.id)), new Set(saved.map(q => q.id)))
})

test('NICL selection is byte-for-byte unchanged by the AP policy', () => {
  const ids: string[] = []
  for (const stream of ['generalist', 'it'] as const) for (const stage of ['prelims', 'mains'] as const) for (const bp of getBlueprints('nicl-ao', stage, stream)) for (const seed of [1, 7, 42]) {
    const pool = niclQuestions.filter(q => stream === 'it' || q.subject !== 'IT Professional Knowledge')
    ids.push(...createExamQuiz('nicl-ao', stage, bp.id, seed, pool).items.map(q => q.id))
  }
  for (const difficulty of ['All', 'Hard', 'Medium'] as const) ids.push(...createPracticeQuiz({ examId: 'nicl-ao', pool: niclQuestions, difficulty, count: 20, minutes: 20, seed: 20261124 }).items.map(q => q.id))
  // Digest recorded from the selection engine before the AP severe-bank change.
  assert.equal(ids.length, 2160)
  assert.equal(createHash('sha256').update(ids.join(',')).digest('hex'), '12e7a6d1b3a9c68038fb4125b32d94997f644baf062d2419f983a064792b7016')
})
