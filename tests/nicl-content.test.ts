import assert from 'node:assert/strict'
import test from 'node:test'
import { niclQuestions } from '../src/questions/nicl'
import { niclTheoryChapters, niclTopics } from '../src/niclTheory'

test('NICL has enough distinct authored questions for every Generalist and IT Mains section', () => {
  for (const subject of ['Arithmetic', 'Reasoning', 'English', 'General Awareness', 'Computer Knowledge', 'IT Professional Knowledge']) {
    assert.ok(niclQuestions.filter(q => q.subject === subject).length >= 50, `${subject} requires at least 50 unique items`)
  }
  assert.equal(new Set(niclQuestions.map(q => q.id)).size, niclQuestions.length)
  assert.equal(new Set(niclQuestions.map(q => q.question)).size, niclQuestions.length)
  for (const q of niclQuestions) {
    assert.ok(q.options.length >= 4 && q.options.length <= 5, q.id)
    assert.equal(new Set(q.options).size, q.options.length, q.id)
    assert.ok(q.answer >= 0 && q.answer < q.options.length, q.id)
    assert.ok(q.explanation.length > 50, q.id)
    assert.match(q.source, /Original NICL AO practice/)
  }
})

test('all DI growth answers use the original total as denominator and round to two decimals', () => {
  const growth = niclQuestions.filter(q => q.topic === 'Data interpretation' && q.question.includes('percentage increase'))
  assert.equal(growth.length, 12)
  for (const q of growth) {
    const counts = q.question.match(/April — Motor (\d+), Health (\d+), Fire (\d+)/)
    assert.ok(counts)
    const base = counts.slice(1).reduce((sum, n) => sum + Number(n), 0)
    const actual = Number.parseFloat(q.options[q.answer])
    assert.ok(Math.abs(actual - (80 / base * 100)) <= 0.0051, q.id)
  }
})

test('generated mixture answers follow two withdrawals rather than one', () => {
  const mixture = niclQuestions.filter(q => q.topic === 'Mixture replacement')
  assert.equal(mixture.length, 10)
  for (const q of mixture) {
    const counts = q.question.match(/contains (\d+) L of milk\. (\d+) L is removed/)
    assert.ok(counts)
    const [volume, withdrawal] = counts.slice(1).map(Number)
    const fraction = (volume - withdrawal) / volume
    assert.ok(Math.abs(Number.parseFloat(q.options[q.answer]) - volume * fraction ** 2) < 0.00001, q.id)
  }
})

test('probability answers count same-colour pairs without replacement', () => {
  const probability = niclQuestions.filter(q => q.topic === 'Probability')
  assert.equal(probability.length, 10)
  for (const q of probability) {
    const counts = q.question.match(/has (\d+) red and (\d+) blue/)
    assert.ok(counts)
    const [red, blue] = counts.slice(1).map(Number)
    const [numerator, denominator] = q.options[q.answer].split('/').map(Number)
    const expected = ((red * (red - 1)) + (blue * (blue - 1))) / ((red + blue) * (red + blue - 1))
    assert.ok(Math.abs(numerator / denominator - expected) < 1e-12, q.id)
  }
})

test('NICL theory has matching topics and a dedicated specialist chapter', () => {
  assert.deepEqual(niclTopics.map(t => t.id), niclTheoryChapters.map(c => c.topicId))
  assert.ok(niclTheoryChapters.some(c => c.subject === 'IT Professional Knowledge'))
  for (const chapter of niclTheoryChapters) {
    assert.ok(chapter.sections.length >= 3)
    assert.ok(chapter.workedExamples.length >= 1)
    assert.ok(chapter.sources.length >= 2)
  }
})
