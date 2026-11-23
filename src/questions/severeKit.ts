import type { Question, Subject } from '../data'

/**
 * Shared helpers for the "severe" AP SI bank (ids prefixed `sv`).
 *
 * Every severe item is editorially authored practice modelled on the style of
 * hard questions in recent recruitment exams; none is a historical question.
 * Generated items compute their answers in code, and arrangement puzzles are
 * brute-force checked for a single solution before they are emitted.
 */
export const SEVERE_SOURCE = 'Original severe practice · editorially authored, modelled on recent SI/SSC/bank-mains hard-question styles'

export const SEVERE_PREFIX = 'sv'

/** Deterministic PRNG so the bank is identical on every build. */
export const rng = (seed: number) => {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}
export type Rand = ReturnType<typeof rng>
export const pick = <T>(r: Rand, items: readonly T[]): T => items[Math.floor(r() * items.length)]
export const int = (r: Rand, min: number, max: number) => min + Math.floor(r() * (max - min + 1))
export const shuffle = <T>(r: Rand, items: readonly T[]): T[] => {
  const copy = [...items]
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(r() * (i + 1))
    ;[copy[i], copy[j]] = [copy[j], copy[i]]
  }
  return copy
}

export const gcd = (a: number, b: number): number => (b ? gcd(b, a % b) : Math.abs(a))
export const lcm = (a: number, b: number) => Math.abs(a * b) / gcd(a, b)
export const fmt = (n: number) => (Number.isInteger(n) ? String(n) : String(Number(n.toFixed(2))))
export const money = (n: number) => `₹${Math.round(n).toLocaleString('en-IN')}`
export const frac = (num: number, den: number) => {
  const g = gcd(num, den)
  const [n, d] = [num / g, den / g]
  return d === 1 ? String(n) : `${n}/${d}`
}

const norm = (value: string) => value.toLowerCase().replace(/\s+/g, '').replace(/\.$/, '')

/**
 * Places the correct option at a seeded position among exactly three distinct
 * traps. Throws when the traps collapse, so a generator can never emit an item
 * with duplicate or missing distractors.
 */
export const options4 = (correct: string, traps: readonly string[], seed: number) => {
  const seen = new Set([norm(correct)])
  const distinct: string[] = []
  for (const trap of traps) {
    const key = norm(trap)
    if (!seen.has(key)) {
      seen.add(key)
      distinct.push(trap)
    }
    if (distinct.length === 3) break
  }
  if (distinct.length < 3) throw new Error(`Not enough distinct traps for answer ${correct}: ${traps.join(' / ')}`)
  const answer = ((seed % 4) + 4) % 4
  const options = [...distinct]
  options.splice(answer, 0, correct)
  return { options, answer }
}

/** Numeric helper: traps are formatted with the same unit and must differ from the answer. */
export const numeric4 = (correct: number, traps: readonly number[], seed: number, render: (n: number) => string = fmt) =>
  options4(render(correct), traps.filter(t => Number.isFinite(t) && render(t) !== render(correct)).map(render), seed)

export type SevereInput = {
  id: string
  subject: Subject
  topic: string
  question: string
  options: string[]
  answer: number
  explanation: string
  hint: string
  seconds?: number
}

export const severe = (input: SevereInput): Question => {
  if (!input.id.startsWith(SEVERE_PREFIX)) throw new Error(`${input.id}: severe ids must start with ${SEVERE_PREFIX}`)
  if (input.options.length !== 4) throw new Error(`${input.id}: needs four options`)
  if (!Number.isInteger(input.answer) || input.answer < 0 || input.answer > 3) throw new Error(`${input.id}: bad answer index`)
  return {
    id: input.id,
    subject: input.subject,
    topic: input.topic,
    question: input.question,
    options: input.options,
    answer: input.answer,
    explanation: input.explanation,
    hint: input.hint,
    seconds: input.seconds ?? 120,
    difficulty: 'Hard',
    source: SEVERE_SOURCE,
  }
}

/**
 * Mirrors the de-duplication key used when the bank is assembled in data.ts
 * (ASCII letters and digits only). Generators must keep this key unique, or
 * the assembler would silently drop an item: e.g. "x² − 2x" and "x² + 2x"
 * collide once symbols are stripped.
 */
export const assemblyKey = (question: string, options: readonly string[]) => {
  const n = (value: string) => value.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim()
  return `${n(question)}|${options.map(n).join('|')}`
}

/** Standard option sets for multi-statement items. */
export const TWO_STATEMENTS = ['1 only', '2 only', 'Both 1 and 2', 'Neither 1 nor 2']
export const THREE_STATEMENTS = ['1 and 2 only', '2 and 3 only', '1 and 3 only', '1, 2 and 3']
