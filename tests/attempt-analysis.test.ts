import assert from 'node:assert/strict'
import { test } from 'node:test'
import type { Question } from '../src/data.ts'
import { scoreQuiz, type Attempt, type Quiz } from '../src/lib/examEngine.ts'
import { createDefaultStore, normalizeStore, saveAttempt } from '../src/lib/store.ts'
import {
  actionPlan, analyseAttempt, difficultyBreakdown, isCareless, isGoodSkip, isTimeSink, summarise, tagFor, timeAnalysis, topicBreakdown, trendFor,
} from '../src/lib/attemptAnalysis.ts'

const q = (id: string, subject: Question['subject'], topic: string, difficulty: Question['difficulty'] = 'Hard', seconds = 60): Question => ({
  id, subject, topic, question: `Fixture ${id}?`, options: ['A', 'B', 'C', 'D'], answer: 0, explanation: 'Because A.', hint: 'Think.', seconds, difficulty, source: 'Fixture',
})
const quizOf = (items: Question[], extra: Partial<Quiz> = {}): Quiz => ({
  id: 'ap-si-practice-1', examId: 'ap-si', mode: 'exam', blueprintId: 'paper-1', seed: 1, title: 'AP SI · Paper I · 1', items,
  sections: [{ id: 'paper-1', title: 'Paper I', itemIds: items.map(i => i.id), durationSeconds: 3600 }], minutes: 60, negativeMark: 0.25, marksPerCorrect: 1, sectionalTiming: false, startedAt: 0, ...extra,
})

// Ratio (legacy name) and Ratio and proportion both map to the canonical "Ratio, proportion and partnership".
const items = [
  q('r1', 'Arithmetic', 'Ratio'), // correct, 50s
  q('r2', 'Arithmetic', 'Ratio and proportion'), // wrong, 120s → time sink
  q('p1', 'Arithmetic', 'Percentages', 'Medium'), // wrong, 10s → careless
  q('p2', 'Arithmetic', 'Percentages', 'Medium'), // skipped, 20s → good skip
  q('p3', 'Arithmetic', 'Percentages', 'Easy'), // skipped, 100s → time sink
  q('s1', 'Reasoning', 'Syllogism'), // correct, 40s
  q('s2', 'Reasoning', 'Syllogism'), // correct, 45s
  q('s3', 'Reasoning', 'Syllogism'), // correct, 30s
  q('s4', 'Reasoning', 'Syllogism'), // wrong, 60s
]
const answers = { r1: 0, r2: 1, p1: 2, s1: 0, s2: 0, s3: 0, s4: 3 }
const seconds = { r1: 50, r2: 120, p1: 10, p2: 20, p3: 100, s1: 40, s2: 45, s3: 30, s4: 60 }
const attempt = scoreQuiz(quizOf(items, { marked: ['r2', 'ghost'] }), answers, seconds, 30 * 60 * 1000)

test('scoring records the time allowed and marked ids for the analysis', () => {
  assert.equal(attempt.minutes, 60)
  assert.deepEqual(attempt.marked, ['r2'])
  const s = summarise(attempt)
  assert.equal(s.attempted, 7)
  assert.equal(s.skipped, 2)
  assert.equal(s.accuracy, 57)
  assert.equal(s.secondsAllowed, 3600)
})

test('topic tags use clear thresholds', () => {
  assert.equal(tagFor(75), 'Strong')
  assert.equal(tagFor(74), 'Needs work')
  assert.equal(tagFor(50), 'Needs work')
  assert.equal(tagFor(49), 'Weak')
})

test('topic breakdown maps legacy names canonically and sorts weakest first', () => {
  const blocks = topicBreakdown(attempt)
  assert.deepEqual(blocks.map(b => b.subject), ['Arithmetic', 'Reasoning'])
  const arith = blocks[0].topics
  assert.deepEqual(arith.map(t => t.topic), ['Percentages', 'Ratio, proportion and partnership'])
  assert.deepEqual([arith[0].correct, arith[0].wrong, arith[0].skipped, arith[0].accuracy, arith[0].tag], [0, 1, 2, 0, 'Weak'])
  assert.deepEqual([arith[1].total, arith[1].accuracy, arith[1].tag, arith[1].avgSeconds, arith[1].avgTarget], [2, 50, 'Needs work', 85, 60])
  assert.equal(blocks[1].topics[0].tag, 'Strong')
})

test('time buckets and the marks lost in each', () => {
  const t = timeAnalysis(attempt)!
  assert.deepEqual(t.timeSinks.ids, ['r2', 'p3'])
  assert.equal(t.timeSinks.marksLost, 2.25) // wrong: 1 + 0.25 penalty; skipped: 1
  assert.deepEqual(t.careless.ids, ['p1'])
  assert.equal(t.careless.marksLost, 1.25)
  assert.deepEqual(t.goodSkips.ids, ['p2'])
  assert.ok(!isTimeSink(attempt.review.find(r => r.question.id === 's4')!), 'exactly on target is not a sink')
  assert.ok(!isCareless(attempt.review.find(r => r.question.id === 'r1')!), 'a correct answer is never careless')
  assert.ok(isGoodSkip(attempt.review.find(r => r.question.id === 'p2')!))
})

test('difficulty breakdown', () => {
  assert.deepEqual(difficultyBreakdown(attempt).map(d => [d.difficulty, d.correct, d.total, d.accuracy]), [['Hard', 4, 6, 67], ['Medium', 0, 2, 0], ['Easy', 0, 1, 0]])
})

test('trend uses only earlier attempts of the same paper', () => {
  const earlier = (id: string, date: string, correct: number, blueprintId = 'paper-1'): Attempt => ({ ...attempt, id, date, blueprintId, score: correct, correct, wrong: 9 - correct, unanswered: 0, seconds: 900 })
  const history = [earlier('a', '2026-11-01T00:00:00Z', 3), earlier('b', '2026-11-05T00:00:00Z', 5), earlier('x', '2026-11-06T00:00:00Z', 9, 'paper-2'), earlier('future', '2030-01-01T00:00:00Z', 9)]
  const current = { ...attempt, date: '2026-11-10T00:00:00Z' }
  const trend = trendFor(current, [current, ...history])!
  assert.deepEqual(trend.points.map(p => p.id), ['a', 'b', current.id])
  assert.equal(trend.scoreChange, Number((current.score - 5).toFixed(2)))
  assert.equal(trend.avgSecondsChange, Math.round(current.seconds / 9) - 100)
  assert.equal(trendFor(current, [current]), null)
})

test('action plan gives at most three steps: weakest topics and a retry of missed questions', () => {
  const plan = actionPlan(attempt, topicBreakdown(attempt), timeAnalysis(attempt))
  assert.equal(plan.length, 3)
  assert.deepEqual(plan.map(s => s.kind), ['topic', 'topic', 'retry'])
  assert.equal(plan[0].kind === 'topic' && plan[0].topic, 'Percentages')
  const retry = plan.find(s => s.kind === 'retry')!
  assert.ok(retry.kind === 'retry' && retry.ids.length === 5)
  const perfect = scoreQuiz(quizOf(items.slice(5, 8)), { s1: 0, s2: 0, s3: 0 }, { s1: 10, s2: 10, s3: 10 }, 1000)
  assert.deepEqual(actionPlan(perfect, topicBreakdown(perfect), timeAnalysis(perfect)), [])
})

test('older attempts still analyse: no review, no timing, no minutes', () => {
  const store = normalizeStore({ activeExam: 'ap-si', exams: { 'ap-si': { attempts: [{ id: 'old', title: 'Old', date: '2024-01-01T00:00:00Z', score: 5, maxMarks: 10, correct: 5, wrong: 2, total: 10, seconds: 600 }] } } })
  const old = store.exams['ap-si'].attempts[0]
  assert.equal(old.minutes, undefined)
  assert.equal(old.marked, undefined)
  const a = analyseAttempt(old, store.exams['ap-si'].attempts)
  assert.equal(a.summary.secondsAllowed, null)
  assert.deepEqual([a.subjects, a.difficulty, a.plan, a.time, a.trend], [[], [], [], null, null])
  // Review present but recorded without per-question seconds: no time block.
  const untimed = { ...attempt, review: attempt.review.map(r => ({ ...r, seconds: 0 })) }
  assert.equal(timeAnalysis(untimed), null)
  // New fields survive the store round trip.
  const saved = normalizeStore(JSON.parse(JSON.stringify(saveAttempt(createDefaultStore(), attempt))))
  assert.equal(saved.exams['ap-si'].attempts[0].minutes, 60)
  assert.deepEqual(saved.exams['ap-si'].attempts[0].marked, ['r2'])
})

test('NICL attempts keep their own topic names', () => {
  const nicl = scoreQuiz(quizOf([q('n1', 'Arithmetic', 'Ratio')], { examId: 'nicl-ao' }), { n1: 0 }, { n1: 30 }, 1000)
  assert.equal(topicBreakdown(nicl)[0].topics[0].topic, 'Ratio')
})
