import assert from 'node:assert/strict'
import { test } from 'node:test'
import { questions, type Question } from '../src/data.ts'
import { createPracticeQuiz } from '../src/lib/examEngine.ts'
import { AP_TOPIC_SUBJECTS, AP_TOPIC_TAXONOMY, canonicalTopic, canonicalTopicFor } from '../src/topicTaxonomy.ts'
import { quantQuestions } from '../src/questions/quant.ts'
import { hardQuantReasoningQuestions } from '../src/questions/hardQuantReasoning.ts'
import { generatedQuantReasoningQuestions } from '../src/questions/generatedQuantReasoning.ts'
import { generalStudiesQuestions } from '../src/questions/generalStudies.ts'
import { expandedGeneralStudiesQuestions } from '../src/questions/gsExpandedBank.ts'
import { expandedApQuestions } from '../src/questions/apExpandedBank.ts'
import { severeArithmeticQuestions } from '../src/questions/severeArithmetic.ts'
import { severeReasoningQuestions } from '../src/questions/severeReasoning.ts'
import { severeGsPolityEconomyScienceQuestions } from '../src/questions/severeGsPolityEconomyScience.ts'
import { severeGsHistoryGeographyQuestions } from '../src/questions/severeGsHistoryGeography.ts'
import { severeApFocusQuestions } from '../src/questions/severeApFocus.ts'
import { severeTopicArithmeticQuestions } from '../src/questions/severeTopicArithmetic.ts'
import { severeTopicReasoningQuestions, severeTopicReasoningSelfCheck } from '../src/questions/severeTopicReasoning.ts'
import { severeTopicApFocusQuestions } from '../src/questions/severeTopicApFocus.ts'
import { niclQuestions } from '../src/questions/nicl.ts'

const ap = questions.filter(q => (AP_TOPIC_SUBJECTS as readonly string[]).includes(q.subject))
const byId = new Map(questions.map(q => [q.id, q]))
const isNewHard = (q: Question) => q.id.startsWith('sv') && q.difficulty === 'Hard'

test('every AP question carries a canonical topic of its own subject', () => {
  for (const q of ap) {
    const allowed = AP_TOPIC_TAXONOMY[q.subject as keyof typeof AP_TOPIC_TAXONOMY]
    assert.ok(allowed.includes(q.topic), `${q.id}: "${q.topic}" is not a canonical ${q.subject} topic`)
  }
})

test('canonical topic names are distinct within and across AP subjects', () => {
  const all = AP_TOPIC_SUBJECTS.flatMap(s => AP_TOPIC_TAXONOMY[s])
  assert.equal(new Set(all).size, all.length)
  for (const s of AP_TOPIC_SUBJECTS) assert.ok(AP_TOPIC_TAXONOMY[s].length >= 10 && AP_TOPIC_TAXONOMY[s].length <= 22, s)
})

test('every canonical AP topic has at least 15 new hard (severe) items', () => {
  for (const subject of AP_TOPIC_SUBJECTS) for (const topic of AP_TOPIC_TAXONOMY[subject]) {
    const n = ap.filter(q => q.subject === subject && q.topic === topic && isNewHard(q)).length
    assert.ok(n >= 15, `${subject} / ${topic}: only ${n} new hard items`)
  }
})

test('topic practice with difficulty "All" is at least 80% Hard for every canonical topic', () => {
  for (const subject of AP_TOPIC_SUBJECTS) for (const topic of AP_TOPIC_TAXONOMY[subject]) for (const seed of [1, 5, 9]) {
    const quiz = createPracticeQuiz({ examId: 'ap-si', pool: questions, subjects: [subject], topics: [topic], difficulty: 'All', count: 20, minutes: 20, seed })
    assert.equal(quiz.items.length, 20)
    assert.equal(new Set(quiz.items.map(q => q.id)).size, 20)
    assert.ok(quiz.items.every(q => q.subject === subject && q.topic === topic))
    const hard = quiz.items.filter(q => q.difficulty === 'Hard').length
    assert.ok(hard >= 16, `${subject} / ${topic} #${seed}: ${hard}/20 Hard`)
  }
})

test('explicit Easy and Medium filters still work for topic practice', () => {
  for (const [difficulty, topic] of [['Easy', 'Percentages'], ['Medium', 'Time and work'], ['Medium', 'Clocks and calendars']] as const) {
    const quiz = createPracticeQuiz({ examId: 'ap-si', pool: questions, topics: [topic], difficulty, count: 10, minutes: 10, seed: 3 })
    assert.ok(quiz.items.every(q => q.difficulty === difficulty && q.topic === topic), `${topic} ${difficulty}`)
  }
})

test('legacy topic names (stored attempts, old filters) resolve to the canonical topic', () => {
  assert.equal(canonicalTopic({ id: 'old', subject: 'Arithmetic', topic: 'Profit & loss' }), 'Profit, loss and discount')
  assert.equal(canonicalTopic({ id: 'old', subject: 'Arithmetic', topic: 'Ratio' }), 'Ratio, proportion and partnership')
  assert.equal(canonicalTopic({ id: 'old', subject: 'General Studies', topic: 'Indian Polity' }), 'Constitutional foundations')
  assert.equal(canonicalTopic({ id: 'gs004', subject: 'General Studies', topic: 'Indian Polity' }), 'Parliament and federalism')
  assert.equal(canonicalTopic({ id: 'svp-bio-007', subject: 'AP Focus', topic: 'AP heritage crafts and biodiversity' }), 'AP forests, wildlife and wetlands')
  // Every legacy copy of an assembled question maps to that question's current topic.
  const sources: Question[] = [...quantQuestions, ...hardQuantReasoningQuestions, ...generatedQuantReasoningQuestions, ...generalStudiesQuestions, ...expandedGeneralStudiesQuestions, ...expandedApQuestions, ...severeArithmeticQuestions, ...severeReasoningQuestions, ...severeGsPolityEconomyScienceQuestions, ...severeGsHistoryGeographyQuestions, ...severeApFocusQuestions]
  for (const old of sources) {
    const current = byId.get(old.id)
    if (current) assert.equal(canonicalTopic(old), current.topic, old.id)
  }
  const quiz = createPracticeQuiz({ examId: 'ap-si', pool: questions, topics: ['Profit & loss'], count: 10, minutes: 10, seed: 2 })
  assert.ok(quiz.items.every(q => q.topic === 'Profit, loss and discount'))
})

test('mapping changes only topics: ids, text, options and answers are untouched and ids are unique', () => {
  assert.equal(new Set(questions.map(q => q.id)).size, questions.length)
  const sources: Question[] = [...quantQuestions, ...hardQuantReasoningQuestions, ...generalStudiesQuestions, ...expandedGeneralStudiesQuestions, ...expandedApQuestions, ...severeArithmeticQuestions, ...severeReasoningQuestions, ...severeGsPolityEconomyScienceQuestions, ...severeGsHistoryGeographyQuestions, ...severeApFocusQuestions]
  for (const old of sources) {
    const current = byId.get(old.id)
    if (!current) continue
    assert.equal(current.question, old.question, old.id)
    assert.deepEqual(current.options, old.options, old.id)
    assert.equal(current.answer, old.answer, old.id)
    assert.equal(current.difficulty, old.difficulty, old.id)
  }
})

test('topic top-up items are well-formed, reach the bank and re-solve to their keys', () => {
  const fresh = [...severeTopicArithmeticQuestions, ...severeTopicReasoningQuestions, ...severeTopicApFocusQuestions]
  assert.equal(new Set(fresh.map(q => q.id)).size, fresh.length)
  for (const q of fresh) {
    assert.ok(byId.has(q.id), `${q.id} was dropped during assembly`)
    assert.match(q.id, /^sv[a-z]-/)
    assert.equal(q.difficulty, 'Hard')
    assert.equal(new Set(q.options.map(o => o.trim().toLowerCase())).size, 4, q.id)
    assert.ok(q.explanation.length > 40 && q.hint.length > 5, q.id)
    assert.ok(!/NaN|undefined|Infinity|\[object/.test(q.question + q.options.join() + q.explanation), q.id)
  }
  for (const subject of ['Arithmetic', 'Reasoning', 'AP Focus']) {
    const items = fresh.filter(q => q.subject === subject)
    const counts = [0, 1, 2, 3].map(i => items.filter(q => q.answer === i).length)
    for (const c of counts) assert.ok(c / items.length >= 0.15 && c / items.length <= 0.35, `${subject}: ${counts}`)
  }
  assert.deepEqual(severeTopicReasoningSelfCheck(), [])
})

test('NICL topics are never mapped', () => {
  for (const q of niclQuestions) assert.equal(canonicalTopicFor('nicl-ao', q), q.topic)
  assert.ok(niclQuestions.some(q => q.subject === 'Arithmetic' && q.topic === 'Data interpretation'))
})
