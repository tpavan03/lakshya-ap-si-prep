import { test } from 'node:test'
import assert from 'node:assert/strict'
import { niclPapers, previousPapers } from '../src/pyq'
import { paperAnswerKeys } from '../src/paperKeys'
import { getPaperAttemptState, recordPaperAnswer } from '../src/lib/paperAttempt'

const nicl = niclPapers[0]
const ap = previousPapers.find(paper => paper.id === 'ap-2023-prelims-1')!
const baseline = { answers: {}, current: 0, startedAt: 1_000, expiresAt: 3_601_000 }

test('matched paper keys cover every source question and valid option', () => {
  for (const [id, key] of Object.entries(paperAnswerKeys)) {
    const paper = [...niclPapers, ...previousPapers].find(item => item.id === id)
    assert.ok(paper, id)
    assert.equal(key.answers.length, paper.questions, id)
    assert.ok(key.answers.every(answer => Number.isInteger(answer) && answer >= 0 && answer < (paper.options ?? 4)), id)
  }
  assert.match(paperAnswerKeys[ap.id].label, /final key/)
  assert.ok(niclPapers.every(paper => paper.status === 'Memory-based'))
})

test('NICL paper sections change at the exact deadline and clamp stale question position', () => {
  const before = getPaperAttemptState(nicl, baseline, 1_200_999)
  assert.equal(before.sectionIndex, 0)
  assert.equal(before.upper, 29)
  assert.equal(before.sectionRemaining, 1)
  const boundary = getPaperAttemptState(nicl, baseline, 1_201_000)
  assert.equal(boundary.sectionIndex, 1)
  assert.equal(boundary.current, 30)
  assert.equal(boundary.sectionRemaining, 1200)
  const third = getPaperAttemptState(nicl, baseline, 2_401_000)
  assert.equal(third.sectionIndex, 2)
  assert.equal(third.current, 65)
})

test('reload and background time do not restart the paper timer', () => {
  const reloaded = JSON.parse(JSON.stringify(baseline))
  assert.equal(getPaperAttemptState(nicl, reloaded, 3_000_000).remaining, 601)
  assert.equal(getPaperAttemptState(nicl, reloaded, 3_601_000).remaining, 0)
  assert.equal(getPaperAttemptState(nicl, reloaded, 4_601_000).remaining, 0)
})

test('answer writes reject closed sections, expired papers and submitted attempts', () => {
  assert.equal(recordPaperAnswer(nicl, baseline, 30, 0, 10_000), baseline)
  assert.equal(recordPaperAnswer(nicl, baseline, 0, 0, 1_201_000), baseline)
  assert.equal(recordPaperAnswer(nicl, baseline, 65, 0, 3_601_000), baseline)
  const submitted = { ...baseline, submitted: true }
  assert.equal(recordPaperAnswer(nicl, submitted, 0, 0, 10_000), submitted)
  const answer = recordPaperAnswer(nicl, baseline, 0, 2, 10_000)
  assert.equal(answer.answers['0'], 2)
  assert.deepEqual(baseline.answers, {})
})

test('NICL scores apply the quarter-mark penalty and AP papers do not', () => {
  const key = paperAnswerKeys[nicl.id].answers
  const state = getPaperAttemptState(nicl, { answers: { '0': key[0], '1': (key[1] + 1) % 5 }, current: 0, submitted: true }, 0)
  assert.equal(state.correct, 1)
  assert.equal(state.wrong, 1)
  assert.equal(state.score, 0.75)
  assert.equal(state.upper, 99)
  const apKey = paperAnswerKeys[ap.id].answers
  assert.equal(getPaperAttemptState(ap, { answers: { '0': apKey[0], '1': (apKey[1] + 1) % 4 }, current: 0 }, 0).score, 1)
  const noKey = previousPapers.find(paper => paper.id === 'ap-2023-final-3')!
  assert.equal(getPaperAttemptState(noKey, { answers: { '0': 0 }, current: 0 }, 0).score, undefined)
})

test('AP 2023 Paper II final-key amendment accepts both permitted answers to Q95', () => {
  const paper = previousPapers.find(item => item.id === 'ap-2023-prelims-2')!
  for (const answer of [0, 3]) {
    assert.equal(getPaperAttemptState(paper, { answers: { '94': answer }, current: 94 }, 0).score, 1)
  }
  for (const answer of [1, 2]) {
    assert.equal(getPaperAttemptState(paper, { answers: { '94': answer }, current: 94 }, 0).score, 0)
  }
})
