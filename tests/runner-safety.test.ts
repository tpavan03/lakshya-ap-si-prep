import assert from 'node:assert/strict'
import { test } from 'node:test'
import { emptyWritingDraft, normalizeWritingDraft, writingStorageKey } from '../src/lib/writingDraft.ts'

test('writing storage separates accounts, guests, exams and languages', () => {
  const cases = [writingStorageKey('user-a', 'nicl-ao', 'English'), writingStorageKey('user-b', 'nicl-ao', 'English'), writingStorageKey('guest', 'nicl-ao', 'English'), writingStorageKey('user-a', 'ap-si', 'English'), writingStorageKey('user-a', 'ap-si', 'Telugu / Urdu')]
  assert.equal(new Set(cases).size, cases.length)
  assert.notEqual(writingStorageKey('user:a', 'ap-si', 'English'), writingStorageKey('user', 'ap-si', 'a:English'))
  const memory = new Map([[cases[0], JSON.stringify({ answers: ['Private draft', '', ''] })]])
  assert.equal(normalizeWritingDraft(JSON.parse(memory.get(cases[0])!)).answers[0], 'Private draft')
  assert.deepEqual(normalizeWritingDraft(JSON.parse(memory.get(cases[1]) ?? 'null')), emptyWritingDraft())
  assert.deepEqual(normalizeWritingDraft(JSON.parse(memory.get(cases[2]) ?? 'null')), emptyWritingDraft())
})

test('malformed writing drafts cannot crash answer inputs or start an unbounded timer', () => {
  for (const raw of [null, '', 3, { answers: null }, { answers: [1, null] }]) assert.deepEqual(normalizeWritingDraft(raw).answers, ['', '', ''])
  assert.deepEqual(normalizeWritingDraft({ answers: ['Keep me'], startedAt: 1000, expiresAt: 0 }).answers, ['Keep me', '', ''])
  assert.equal(normalizeWritingDraft({ startedAt: 1000, expiresAt: 0 }).startedAt, undefined)
  const normalized = normalizeWritingDraft({ answers: ['essay', 'précis', 'comprehension'], startedAt: 1000, expiresAt: 61000, submitted: true })
  assert.equal(normalized.startedAt, 1000)
  assert.equal(normalized.expiresAt, 61000)
  assert.equal(normalized.submitted, true)
  const first = emptyWritingDraft(), second = emptyWritingDraft()
  first.answers[0] = 'changed'
  assert.equal(second.answers[0], '')
})
