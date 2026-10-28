import assert from 'node:assert/strict'
import { test } from 'node:test'
import { BankCoverageError, createExamQuiz, createPracticeQuiz, EXAMS, getBlueprints, getQuizClock, scoreQuiz, selectQuestions, startQuiz, type ExamId } from '../src/lib/examEngine.ts'
import { createDefaultStore, normalizeStore, saveAttempt } from '../src/lib/store.ts'
import type { Question } from '../src/data.ts'

const item = (subject: string, index: number): Question => ({ id: `${subject}-${index}`, subject: subject as Question['subject'], topic: `Topic ${index % 6}`, question: `${subject} scenario ${index}: choose the valid outcome.`, options: [`Correct ${index}`, `Wrong ${index}`, `Other ${index}`, `Neither ${index}`], answer: 0, explanation: `Worked explanation for ${index}.`, hint: 'Check the relationship.', seconds: 90, difficulty: index % 10 < 6 ? 'Hard' : index % 10 < 9 ? 'Medium' : 'Easy', source: 'Original test fixture' })
const pool: Question[] = ['Arithmetic', 'Reasoning', 'General Studies', 'AP Focus', 'English', 'General Awareness', 'Computer Knowledge', 'IT Professional Knowledge'].flatMap(subject => Array.from({ length: 240 }, (_, index) => item(subject, index)))

test('all official objective blueprints keep exact count, time and unique content', () => {
  for (const examId of ['ap-si', 'nicl-ao'] as ExamId[]) for (const stage of ['prelims', 'mains'] as const) for (const blueprint of EXAMS[examId].stages[stage]) {
    const quiz = createExamQuiz(examId, stage, blueprint.id, 7, pool)
    assert.equal(quiz.items.length, blueprint.questions)
    assert.equal(quiz.minutes, blueprint.minutes)
    assert.equal(new Set(quiz.items.map(q => q.id)).size, blueprint.questions)
    assert.deepEqual(quiz.sections.map(s => s.itemIds.length), blueprint.sections.map(s => s.questions))
    assert.deepEqual(quiz.sections.map(s => s.durationSeconds), blueprint.sections.map(s => s.minutes * 60))
    assert.deepEqual(quiz.items.map(q => q.id), createExamQuiz(examId, stage, blueprint.id, 7, pool).items.map(q => q.id))
    assert.notDeepEqual(quiz.items.map(q => q.id), createExamQuiz(examId, stage, blueprint.id, 8, pool).items.map(q => q.id))
  }
})

test('missing coverage fails clearly instead of shortening an official simulation', () => {
  assert.throws(() => createExamQuiz('nicl-ao', 'mains', 'mains-generalist', 1, pool.filter(q => q.subject !== 'Computer Knowledge')), BankCoverageError)
  assert.throws(() => createExamQuiz('ap-si', 'prelims', 'invalid-paper', 1, pool), /valid paper/)
  const duplicate = item('Arithmetic', 1)
  assert.throws(() => createPracticeQuiz({ examId: 'ap-si', pool: [duplicate, { ...duplicate, id: 'another-id' }], count: 2, minutes: 10 }), BankCoverageError)
})

test('selection favours hard questions and distributes topics before numeric variants', () => {
  const selected = selectQuestions(pool.filter(q => q.subject === 'Arithmetic'), 20, 99)
  assert.equal(selected.filter(q => q.difficulty === 'Hard').length, 12)
  assert.equal(new Set(selected.map(q => q.topic)).size, 6)
  assert.equal(selected.length, 20)
})

test('NICL timers lock completed and future sections using wall clock after a reload', () => {
  const quiz = startQuiz(createExamQuiz('nicl-ao', 'prelims', 'prelims-generalist', 1, pool), 1000)
  const first = getQuizClock(quiz, 1000)
  assert.equal(first.remainingSeconds, 3600)
  assert.equal(first.sectionRemainingSeconds, 1200)
  assert.equal(first.currentSectionIndex, 0)
  assert.deepEqual(first.allowedItemIds, quiz.sections[0].itemIds)
  const boundary = getQuizClock(JSON.parse(JSON.stringify(quiz)), 1000 + 1200 * 1000)
  assert.equal(boundary.currentSectionIndex, 1)
  assert.equal(boundary.sectionRemainingSeconds, 1200)
  assert.deepEqual(boundary.allowedItemIds, quiz.sections[1].itemIds)
  const late = getQuizClock(quiz, 1000 + 2500 * 1000)
  assert.equal(late.currentSectionIndex, 2)
  assert.equal(late.sectionRemainingSeconds, 1100)
  const expired = getQuizClock(quiz, 1000 + 3600 * 1000)
  assert.equal(expired.isFinished, true)
  assert.deepEqual(expired.allowedItemIds, [])
})

test('AP papers allow navigation across all questions for the whole paper', () => {
  const quiz = startQuiz(createExamQuiz('ap-si', 'mains', 'mains-paper-3', 1, pool), 1000)
  const clock = getQuizClock(quiz, 1000 + 4000 * 1000)
  assert.equal(clock.remainingSeconds, 6800)
  assert.equal(clock.allowedItemIds.length, 200)
  assert.equal(clock.sectionRemainingSeconds, clock.remainingSeconds)
})

test('custom filters and retry IDs apply together and preserve the requested limit', () => {
  const candidates = pool.filter(q => q.subject === 'Reasoning' && q.topic === 'Topic 0' && q.difficulty === 'Hard')
  const quiz = createPracticeQuiz({ examId: 'nicl-ao', pool, subjects: ['Reasoning'], topics: ['Topic 0'], difficulty: 'Hard', questionIds: candidates.map(q => q.id), count: 5, minutes: 4, seed: 2 })
  assert.equal(quiz.items.length, 5)
  assert.equal(quiz.negativeMark, 0.25)
  assert.ok(quiz.items.every(q => q.subject === 'Reasoning' && q.topic === 'Topic 0' && q.difficulty === 'Hard'))
  assert.equal(createPracticeQuiz({ examId: 'nicl-ao', pool, count: 2, minutes: 1, negativeMark: 0 }).negativeMark, 0)
  for (const count of [0, -1, 1.5, 251]) assert.throws(() => createPracticeQuiz({ examId: 'ap-si', pool, count, minutes: 10 }), /1 and 250/)
  assert.throws(() => createPracticeQuiz({ examId: 'ap-si', pool, count: 5, minutes: 0 }), /1 and 360/)
})

test('scoring distinguishes wrong, unattempted, invalid and correct answers with a full review', () => {
  const quiz = startQuiz(createPracticeQuiz({ examId: 'nicl-ao', pool, count: 4, minutes: 10, seed: 2 }), 1000)
  const [a, b, c, d] = quiz.items
  const result = scoreQuiz(quiz, { [a.id]: 0, [b.id]: 1, [c.id]: -1, [d.id]: 99 }, { [a.id]: 30, [b.id]: 45 }, 121000)
  assert.equal(result.correct, 1)
  assert.equal(result.wrong, 1)
  assert.equal(result.unanswered, 2)
  assert.equal(result.score, 0.75)
  assert.equal(result.maxMarks, 4)
  assert.equal(result.accuracy, 50)
  assert.equal(result.seconds, 120)
  assert.equal(result.review[0].seconds, 30)
  assert.equal(result.review[1].marks, -0.25)
  assert.equal(result.review[2].selected, null)
  assert.equal(result.sections.practice.total, 4)
  const allWrong = scoreQuiz(quiz, Object.fromEntries(quiz.items.map(q => [q.id, 1])), {}, 121000)
  assert.equal(allWrong.score, -1)
  assert.equal(scoreQuiz({ ...quiz, negativeMark: 0 }, Object.fromEntries(quiz.items.map(q => [q.id, 1]))).score, 0)
})

test('v2 AP history migrates without leaking into NICL and survives a v3 cloud roundtrip', () => {
  const legacy = { version: 2, profile: { name: 'Pavan', category: 'BC-A', examDate: '2027-02-15', dailyMinutes: 90 }, saved: ['a01'], attempts: [{ id: 'old-1', title: 'Past practice', date: '2026-09-19', score: 7, total: 10, seconds: 120, subjects: { Arithmetic: { correct: 7, total: 10 } } }], daily: [{ date: '2026-09-19', questions: 10, correct: 7, minutes: 2 }], pyqProgress: { 'ap-2018-prelims-1': { answers: { '0': 2 }, current: 5 } } }
  const migrated = normalizeStore(legacy)
  assert.equal(migrated.profile.name, 'Pavan')
  assert.equal(migrated.exams['ap-si'].attempts[0].correct, 7)
  assert.deepEqual(migrated.exams['ap-si'].saved, ['a01'])
  assert.equal(migrated.exams['ap-si'].pyqProgress['ap-2018-prelims-1'].current, 5)
  assert.deepEqual(migrated.exams['nicl-ao'].attempts, [])
  assert.deepEqual(normalizeStore(JSON.parse(JSON.stringify(migrated))), migrated)
})

test('recording an attempt scopes daily statistics and ignores duplicate submissions', () => {
  const store = createDefaultStore(), quiz = startQuiz(createPracticeQuiz({ examId: 'nicl-ao', pool, count: 2, minutes: 10, seed: 5 }), 1000)
  const attempt = scoreQuiz(quiz, { [quiz.items[0].id]: 0 }, {}, 61000)
  const next = saveAttempt(store, attempt)
  assert.equal(next.exams['nicl-ao'].attempts.length, 1)
  assert.equal(next.exams['nicl-ao'].daily[0].correct, 1)
  assert.equal(next.exams['ap-si'].attempts.length, 0)
  assert.equal(saveAttempt(next, attempt), next)
  assert.equal(store.exams['nicl-ao'].attempts.length, 0)
})

test('malformed legacy storage normalizes to usable fields', () => {
  const store = normalizeStore({ profile: { dailyMinutes: -100 }, attempts: [null, { title: 'bad', total: -2 }], saved: ['a', 'a', null] })
  assert.equal(store.profile.dailyMinutes, 15)
  assert.equal(store.profile.examDate, '')
  assert.deepEqual(store.exams['ap-si'].attempts, [])
  assert.deepEqual(store.exams['ap-si'].saved, ['a'])
})

test('NICL IT uses the common prelims and its distinct six-section mains with exact timings', () => {
  const prelim = getBlueprints('nicl-ao', 'prelims', 'it')[0]
  assert.equal(prelim.id, 'prelims-it')
  assert.deepEqual(prelim.sections.map(s => [s.questions, s.minutes]), [[30, 20], [35, 20], [35, 20]])
  const quiz = startQuiz(createExamQuiz('nicl-ao', 'mains', 'mains-it', 3, pool), 1000)
  assert.equal(quiz.stream, 'it')
  assert.equal(quiz.items.length, 250)
  assert.equal(quiz.minutes, 180)
  assert.equal(new Set(quiz.items.map(q => q.id)).size, 250)
  assert.deepEqual(quiz.sections.map(s => s.itemIds.length), [40, 40, 40, 40, 40, 50])
  assert.deepEqual(quiz.sections.map(s => s.durationSeconds / 60), [35, 20, 35, 30, 25, 35])
  assert.equal(quiz.items.filter(q => q.subject === 'IT Professional Knowledge').length, 50)
  const professional = getQuizClock(quiz, 1000 + 145 * 60000)
  assert.equal(professional.currentSectionIndex, 5)
  assert.equal(professional.sectionRemainingSeconds, 35 * 60)
  assert.deepEqual(professional.allowedItemIds, quiz.sections[5].itemIds)
  const attempt = scoreQuiz(quiz, { [quiz.items[0].id]: 0 }, {}, 61000)
  assert.equal(attempt.stream, 'it')
  const stored = normalizeStore(saveAttempt(createDefaultStore(), attempt))
  assert.equal(stored.exams['nicl-ao'].attempts[0].stream, 'it')
  assert.throws(() => createExamQuiz('nicl-ao', 'mains', 'mains-it', 3, pool.filter(q => q.subject !== 'IT Professional Knowledge')), /IT professional knowledge needs 50/)
})

test('legacy NICL attempts default to Generalist and custom IT practice retains stream', () => {
  const quiz = createPracticeQuiz({ examId: 'nicl-ao', stream: 'it', pool, subjects: ['IT Professional Knowledge'], count: 5, minutes: 5, seed: 2 })
  assert.equal(quiz.stream, 'it')
  const legacy = normalizeStore({ exams: { 'nicl-ao': { attempts: [{ title: 'Legacy NICL', total: 10, score: 5 }] } } })
  assert.equal(legacy.exams['nicl-ao'].attempts[0].stream, 'generalist')
  assert.equal(getBlueprints('ap-si', 'mains', 'it')[0].id, 'mains-paper-3')
})
