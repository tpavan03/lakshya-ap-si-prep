import type { Question } from '../data'
import { int, options4, pick, rng, severe, shuffle, type Rand } from './severeKit'

/**
 * Severe reasoning, topic top-up (ids `svr-<family>-<n>` with families
 * `analogy`, `classify`, `rank`, `venn`, `mathop`, `alpha`, `logic`).
 *
 * These families fill canonical AP topics that the first severe bank did not
 * cover. Every answer is computed in code and every item carries a
 * `recompute` closure that re-derives the key independently:
 * - analogies are checked against a library of candidate rules: every rule
 *   consistent with both example pairs must give the same answer;
 * - odd-one-out items are checked against a property library: every property
 *   that splits the options 3–1 must isolate the same option;
 * - ranking, truth-teller and conditional-logic items are brute-force solved
 *   over the whole search space and must have exactly one solution;
 * - Venn items are solved by elimination over the eight regions and must be
 *   determined by the given data.
 */

type Check = { id: string; verify: () => string | null }
const bank: Question[] = []
const checks: Check[] = []
const familyCount: Record<string, number> = {}
const seenText = new Set<string>()

const posRand = rng(20261125)
let posQueue: number[] = []
const nextPos = () => {
  if (posQueue.length === 0) posQueue = shuffle(posRand, [0, 1, 2, 3])
  return posQueue.pop() as number
}

type Emit = { family: string; topic: string; question: string; correct: string; traps: string[]; explanation: string; hint: string; seconds: number; recompute: () => string }

const emit = (e: Emit) => {
  if (seenText.has(e.question)) throw new Error('duplicate question text')
  const pos = nextPos()
  let built
  try {
    built = options4(e.correct, e.traps, pos)
  } catch (err) {
    posQueue.push(pos)
    throw err
  }
  const { options, answer } = built
  const n = (familyCount[e.family] ?? 0) + 1
  const id = `svr-${e.family}-${String(n).padStart(3, '0')}`
  familyCount[e.family] = n
  seenText.add(e.question)
  bank.push(severe({ id, subject: 'Reasoning', topic: e.topic, question: e.question, options, answer, explanation: e.explanation, hint: e.hint, seconds: e.seconds }))
  const keyed = options[answer]
  checks.push({
    id,
    verify: () => {
      let again: string
      try {
        again = e.recompute()
      } catch (err) {
        return `${id}: recompute threw ${(err as Error).message}`
      }
      return again === keyed ? null : `${id}: recomputed "${again}" but keyed "${keyed}"`
    },
  })
}

const produce = (family: string, want: number, seed0: number, attempt: (r: Rand) => void, maxTries = want * 400) => {
  const start = familyCount[family] ?? 0
  for (let t = 0; t < maxTries && (familyCount[family] ?? 0) - start < want; t++) {
    try {
      attempt(rng(seed0 + t * 7919))
    } catch {
      // rejected draw (ambiguous item or colliding traps): try the next seed
    }
  }
  if ((familyCount[family] ?? 0) - start < want) throw new Error(`svr-${family}: built ${(familyCount[family] ?? 0) - start}/${want} from seed ${seed0}`)
}

const range = (n: number) => Array.from({ length: n }, (_, i) => i)
const mod = (a: number, n: number) => ((a % n) + n) % n
const ALPHA = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
const pos1 = (ch: string) => ALPHA.indexOf(ch) + 1
const nth = (k: number) => `${k}${k % 100 >= 11 && k % 100 <= 13 ? 'th' : k % 10 === 1 ? 'st' : k % 10 === 2 ? 'nd' : k % 10 === 3 ? 'rd' : 'th'}`
function reject(why: string): never {
  throw new Error(why)
}
const perms = (n: number): number[][] => {
  const out: number[][] = []
  const a = range(n)
  const rec = (k: number) => {
    if (k === n) return void out.push([...a])
    for (let i = k; i < n; i++) {
      ;[a[k], a[i]] = [a[i], a[k]]
      rec(k + 1)
      ;[a[k], a[i]] = [a[i], a[k]]
    }
  }
  rec(0)
  return out
}

// ===========================================================================
// Analogy
// ===========================================================================

type NumRule = { text: string; f: (n: number) => number }
const NUM_RULES: NumRule[] = [
  { text: 'n² + n', f: n => n * n + n },
  { text: 'n² − n', f: n => n * n - n },
  { text: 'n² + 1', f: n => n * n + 1 },
  { text: 'n² − 1', f: n => n * n - 1 },
  { text: 'n² + 2n', f: n => n * n + 2 * n },
  { text: 'n² − 2n', f: n => n * n - 2 * n },
  { text: '(n + 1)²', f: n => (n + 1) ** 2 },
  { text: '(n − 1)²', f: n => (n - 1) ** 2 },
  { text: 'n³ + 1', f: n => n ** 3 + 1 },
  { text: 'n³ − 1', f: n => n ** 3 - 1 },
  { text: 'n³ + n', f: n => n ** 3 + n },
  { text: 'n³ − n', f: n => n ** 3 - n },
  { text: 'n³ + n²', f: n => n ** 3 + n * n },
  { text: 'n³ − n²', f: n => n ** 3 - n * n },
  { text: '2n² + 1', f: n => 2 * n * n + 1 },
  { text: '2n² − 1', f: n => 2 * n * n - 1 },
  { text: '3n² − n', f: n => 3 * n * n - n },
  { text: 'n² + 3n + 2 = (n + 1)(n + 2)', f: n => (n + 1) * (n + 2) },
  { text: '(n − 1)(n + 2)', f: n => (n - 1) * (n + 2) },
  { text: 'n(n + 1)/2 (the n-th triangular number)', f: n => (n * (n + 1)) / 2 },
  { text: '2n + 1', f: n => 2 * n + 1 },
  { text: '3n + 2', f: n => 3 * n + 2 },
  { text: '4n − 3', f: n => 4 * n - 3 },
  { text: 'n² + 5', f: n => n * n + 5 },
  { text: 'n² − 5', f: n => n * n - 5 },
  { text: '(2n)² − 1', f: n => 4 * n * n - 1 },
  { text: 'n³ − 2n', f: n => n ** 3 - 2 * n },
  { text: '(n + 2)² − 2', f: n => (n + 2) ** 2 - 2 },
  { text: 'n² + n + 1', f: n => n * n + n + 1 },
  { text: 'n² − n + 1', f: n => n * n - n + 1 },
]
// Rules a setter would actually choose for an analogy item (non-linear, layered).
const SETTER_NUM = NUM_RULES.filter(r => /³|2n²|3n²|\(n − 1\)\(n \+ 2\)|\(n \+ 1\)\(n \+ 2\)|\(n \+ 2\)² − 2|n² [+−] n \+ 1|\(2n\)²|triangular/.test(r.text))

const numberAnalogy = (r: Rand) => {
  const rule = pick(r, SETTER_NUM)
  const [a1, a2, b] = shuffle(r, range(14).map(i => i + 3)).slice(0, 3)
  const consistent = NUM_RULES.filter(g => g.f(a1) === rule.f(a1) && g.f(a2) === rule.f(a2))
  const answers = new Set(consistent.map(g => g.f(b)))
  if (answers.size !== 1) reject('ambiguous analogy')
  const right = rule.f(b)
  const half = NUM_RULES.filter(g => (g.f(a1) === rule.f(a1)) !== (g.f(a2) === rule.f(a2))).map(g => g.f(b))
  const near = NUM_RULES.filter(g => g !== rule).map(g => g.f(b)).filter(v => Math.abs(v - right) <= Math.max(6, right * 0.08))
  const traps = shuffle(r, [...new Set([...half, ...near, right + b, right - b, right + 1])].filter(v => v !== right && v > 0))
  emit({
    family: 'analogy',
    topic: 'Analogy',
    question: `Select the number that completes the analogy in the same way as the first two pairs.\n${a1} : ${rule.f(a1)} :: ${a2} : ${rule.f(a2)} :: ${b} : ?`,
    correct: String(right),
    traps: traps.map(String),
    explanation: `Both given pairs follow n → ${rule.text}: ${a1} → ${rule.f(a1)} and ${a2} → ${rule.f(a2)}. Applying it to ${b} gives ${right}. Rules that fit only one of the two pairs (for example ${NUM_RULES.find(g => (g.f(a1) === rule.f(a1)) !== (g.f(a2) === rule.f(a2)))?.text ?? 'a simple linear rule'}) lead to the traps, which is why both pairs must be checked.`,
    hint: 'Test each candidate rule on both example pairs, not just the first one.',
    seconds: 80,
    recompute: () => {
      const vals = new Set(NUM_RULES.filter(g => g.f(a1) === rule.f(a1) && g.f(a2) === rule.f(a2)).map(g => g.f(b)))
      if (vals.size !== 1) throw new Error('not unique')
      return String([...vals][0])
    },
  })
}

// Letter-group analogies: optional reversal and/or mirror (A↔Z), then a per-position shift.
type LetterRule = { reverse: boolean; mirror: boolean; shifts: number[] }
const applyLetters = (w: string, rule: LetterRule) => {
  const src = rule.reverse ? [...w].reverse() : [...w]
  return src.map((ch, i) => ALPHA[mod((rule.mirror ? 25 - ALPHA.indexOf(ch) : ALPHA.indexOf(ch)) + rule.shifts[i], 26)]).join('')
}
const inferLetterRules = (x: string, y: string): LetterRule[] => {
  const out: LetterRule[] = []
  for (const reverse of [false, true]) for (const mirror of [false, true]) {
    const src = reverse ? [...x].reverse() : [...x]
    const shifts = src.map((ch, i) => {
      const base = mirror ? 25 - ALPHA.indexOf(ch) : ALPHA.indexOf(ch)
      const s = mod(ALPHA.indexOf(y[i]) - base, 26)
      return s > 13 ? s - 26 : s
    })
    out.push({ reverse, mirror, shifts })
  }
  return out
}
const describeLetterRule = (rule: LetterRule) => {
  const parts: string[] = []
  if (rule.reverse) parts.push('reverse the order of the letters')
  if (rule.mirror) parts.push('replace each letter by its opposite (A↔Z, B↔Y, …)')
  parts.push(`shift the letters by ${rule.shifts.map(s => (s >= 0 ? `+${s}` : `−${-s}`)).join(', ')} respectively`)
  return parts.join(', then ')
}
const randomWord = (r: Rand, n: number) => {
  const letters = shuffle(r, [...ALPHA]).slice(0, n)
  return letters.join('')
}
const letterAnalogy = (r: Rand) => {
  const n = pick(r, [3, 4, 4])
  const rule: LetterRule = { reverse: r() < 0.5, mirror: r() < 0.35, shifts: range(n).map(() => pick(r, [-3, -2, -1, 1, 2, 3, 4])) }
  if (!rule.reverse && !rule.mirror) reject('too plain')
  const [x1, x2, x3] = [randomWord(r, n), randomWord(r, n), randomWord(r, n)]
  const y1 = applyLetters(x1, rule), y2 = applyLetters(x2, rule)
  const answers = new Set(inferLetterRules(x1, y1).filter(g => applyLetters(x2, g) === y2).map(g => applyLetters(x3, g)))
  if (answers.size !== 1) reject('ambiguous')
  const right = applyLetters(x3, rule)
  const traps = [
    applyLetters(x3, { ...rule, reverse: !rule.reverse }),
    applyLetters(x3, { ...rule, mirror: !rule.mirror }),
    applyLetters(x3, { ...rule, shifts: rule.shifts.map((s, i) => (i === n - 1 ? s + 1 : s)) }),
    applyLetters(x3, { ...rule, shifts: [...rule.shifts].reverse() }),
    applyLetters(x3, { ...rule, shifts: rule.shifts.map((s, i) => (i === 0 ? s - 1 : s)) }),
  ]
  emit({
    family: 'analogy',
    topic: 'Analogy',
    question: `Select the letter-cluster that completes the analogy in the same way as the first two pairs.\n${x1} : ${y1} :: ${x2} : ${y2} :: ${x3} : ?`,
    correct: right,
    traps,
    explanation: `From ${x1} → ${y1}: ${describeLetterRule(rule)}. The same operation turns ${x2} into ${y2}, confirming it. Applied to ${x3}, it gives ${right}. ${rule.reverse ? 'Skipping the reversal' : 'Reversing the cluster'}${rule.mirror ? ', skipping the opposite-letter step' : ''} or slipping one shift gives the traps.`,
    hint: 'Compare letters position by position; if the shifts look irregular, try reversing the cluster or taking opposite letters first.',
    seconds: 100,
    recompute: () => {
      const vals = new Set(inferLetterRules(x1, y1).filter(g => applyLetters(x2, g) === y2).map(g => applyLetters(x3, g)))
      if (vals.size !== 1) throw new Error('not unique')
      return [...vals][0]
    },
  })
}

// Word → number analogies.
type WordRule = { text: string; f: (w: string) => number }
const sumPos = (w: string) => [...w].reduce((s, c) => s + pos1(c), 0)
const sumRev = (w: string) => [...w].reduce((s, c) => s + 27 - pos1(c), 0)
const WORD_RULES: WordRule[] = [
  { text: 'sum of the alphabet positions of the letters', f: sumPos },
  { text: 'sum of the reverse-alphabet positions (A = 26 … Z = 1)', f: sumRev },
  { text: 'twice the sum of the letter positions', f: w => 2 * sumPos(w) },
  { text: 'sum of the letter positions plus the number of letters', f: w => sumPos(w) + w.length },
  { text: 'sum of the letter positions minus the number of letters', f: w => sumPos(w) - w.length },
  { text: 'sum of the letter positions multiplied by the number of letters', f: w => sumPos(w) * w.length },
  { text: 'product of the positions of the first and last letters', f: w => pos1(w[0]) * pos1(w[w.length - 1]) },
  { text: 'sum of the squares of the positions of the first and last letters', f: w => pos1(w[0]) ** 2 + pos1(w[w.length - 1]) ** 2 },
  { text: 'sum of the positions of the vowels multiplied by the number of consonants', f: w => [...w].filter(c => 'AEIOU'.includes(c)).reduce((s, c) => s + pos1(c), 0) * [...w].filter(c => !'AEIOU'.includes(c)).length },
  { text: 'sum of the letter positions plus the position of the first letter', f: w => sumPos(w) + pos1(w[0]) },
  { text: 'square of the number of letters plus the sum of positions', f: w => w.length ** 2 + sumPos(w) },
  { text: 'difference between the sum of positions and the sum of reverse positions', f: w => Math.abs(sumPos(w) - sumRev(w)) },
]
const WORDS = ['FIR', 'LAW', 'JAIL', 'CASE', 'COURT', 'BAIL', 'BEAT', 'DUTY', 'RANK', 'BADGE', 'CRIME', 'PROOF', 'GUARD', 'TRIAL', 'JUDGE', 'ALIBI', 'ORDER', 'CLUE', 'SIREN', 'ARMS', 'PATROL', 'RIFLE', 'CADET', 'BATON', 'HONOUR', 'VALOUR', 'SALUTE', 'MARCH', 'CAMP', 'DRILL']
const wordAnalogy = (r: Rand) => {
  const rule = pick(r, WORD_RULES.slice(0, 11))
  const [w1, w2, w3] = shuffle(r, WORDS).slice(0, 3)
  const consistent = WORD_RULES.filter(g => g.f(w1) === rule.f(w1) && g.f(w2) === rule.f(w2))
  if (new Set(consistent.map(g => g.f(w3))).size !== 1) reject('ambiguous')
  const right = rule.f(w3)
  const traps = shuffle(r, [...new Set(WORD_RULES.filter(g => g !== rule).map(g => g.f(w3)))]).filter(v => v !== right).slice(0, 2)
  traps.push(right + w3.length, right - 1, right + 2)
  emit({
    family: 'analogy',
    topic: 'Analogy',
    question: `In a certain code, ${w1} is written as ${rule.f(w1)} and ${w2} is written as ${rule.f(w2)}. Following the same rule, how will ${w3} be written?`,
    correct: String(right),
    traps: traps.map(String),
    explanation: `The rule is the ${rule.text}. Check: ${w1} → ${rule.f(w1)}, ${w2} → ${rule.f(w2)}. For ${w3} (positions ${[...w3].map(pos1).join(', ')}) the value is ${right}. Other plausible rules match at most one of the two examples.`,
    hint: 'Write down the letter positions of both examples and test candidate rules on both.',
    seconds: 100,
    recompute: () => {
      const vals = new Set(WORD_RULES.filter(g => g.f(w1) === rule.f(w1) && g.f(w2) === rule.f(w2)).map(g => g.f(w3)))
      if (vals.size !== 1) throw new Error('not unique')
      return String([...vals][0])
    },
  })
}

// ===========================================================================
// Classification (odd one out)
// ===========================================================================

const isPrime = (n: number) => {
  if (n < 2) return false
  for (let d = 2; d * d <= n; d++) if (n % d === 0) return false
  return true
}
const digits = (n: number) => String(n).split('').map(Number)
const isSquare = (n: number) => Number.isInteger(Math.sqrt(n))
const isCube = (n: number) => Math.round(Math.cbrt(n)) ** 3 === n
type Prop = { text: string; holds: (n: number) => boolean }
const NUM_PROPS: Prop[] = [
  { text: 'even', holds: n => n % 2 === 0 },
  { text: 'prime', holds: isPrime },
  { text: 'a perfect square', holds: isSquare },
  { text: 'a perfect cube', holds: isCube },
  ...[3, 4, 5, 6, 7, 8, 9, 11, 13].map(k => ({ text: `a multiple of ${k}`, holds: (n: number) => n % k === 0 })),
  { text: 'a palindrome', holds: (n: number) => String(n) === String(n).split('').reverse().join('') },
  { text: 'of digit sum even', holds: (n: number) => digits(n).reduce((s, d) => s + d, 0) % 2 === 0 },
  { text: 'of prime digit sum', holds: (n: number) => isPrime(digits(n).reduce((s, d) => s + d, 0)) },
  { text: 'a three-digit number', holds: (n: number) => n >= 100 },
  { text: 'written with digits in increasing order', holds: (n: number) => digits(n).every((d, i, a) => i === 0 || d > a[i - 1]) },
  { text: 'one more than a perfect square', holds: (n: number) => isSquare(n - 1) },
  { text: 'one less than a perfect square', holds: (n: number) => isSquare(n + 1) },
  { text: 'one more than a perfect cube', holds: (n: number) => isCube(n - 1) },
  { text: 'one less than a perfect cube', holds: (n: number) => isCube(n + 1) },
  { text: 'a product of two consecutive integers', holds: (n: number) => Number.isInteger((Math.sqrt(4 * n + 1) - 1) / 2) },
  { text: 'a product of two distinct primes', holds: (n: number) => { for (let p = 2; p * p < n; p++) if (n % p === 0) return isPrime(p) && isPrime(n / p) && p !== n / p; return false } },
  { text: 'the square of a prime', holds: (n: number) => isSquare(n) && isPrime(Math.sqrt(n)) },
]
type Gen = { text: string; make: (r: Rand) => number; is: (n: number) => boolean; decoy: (r: Rand) => number }
const GENS: Gen[] = [
  { text: 'a prime whose digit sum is also prime', make: r => pick(r, range(97).map(i => i + 11).filter(n => isPrime(n) && isPrime(digits(n).reduce((s, d) => s + d, 0)))), is: n => isPrime(n) && isPrime(digits(n).reduce((s, d) => s + d, 0)), decoy: r => pick(r, range(97).map(i => i + 11).filter(n => isPrime(n) && !isPrime(digits(n).reduce((s, d) => s + d, 0)))) },
  { text: 'one less than the square of a multiple of 3', make: r => (3 * int(r, 2, 10)) ** 2 - 1, is: n => isSquare(n + 1) && Math.sqrt(n + 1) % 3 === 0, decoy: r => (3 * int(r, 2, 10) + pick(r, [1, 2])) ** 2 - 1 },
  { text: 'the square of a prime', make: r => pick(r, [5, 7, 11, 13, 17, 19, 23, 29, 31]) ** 2, is: n => isSquare(n) && isPrime(Math.sqrt(n)), decoy: r => pick(r, [9, 15, 21, 25, 27, 33, 35]) ** 2 },
  { text: 'a product of two consecutive odd numbers', make: r => { const k = 2 * int(r, 2, 15) + 1; return k * (k + 2) }, is: n => { const s = Math.round(Math.sqrt(n + 1)); return s * s === n + 1 && s % 2 === 0 }, decoy: r => { const k = 2 * int(r, 3, 15); return k * (k + 2) } },
  { text: 'of the form n³ + n', make: r => { const k = int(r, 3, 9); return k ** 3 + k }, is: n => range(12).some(k => k ** 3 + k === n), decoy: r => { const k = int(r, 3, 9); return k ** 3 + k + pick(r, [-2, 2]) } },
  { text: 'of the form n² + n + 1', make: r => { const k = int(r, 4, 20); return k * k + k + 1 }, is: n => range(40).some(k => k * k + k + 1 === n), decoy: r => { const k = int(r, 4, 20); return k * k + k + 3 } },
  { text: 'a multiple of 7 whose digit sum is a multiple of 4', make: r => pick(r, range(140).map(i => 7 * (i + 2)).filter(n => digits(n).reduce((s, d) => s + d, 0) % 4 === 0)), is: n => n % 7 === 0 && digits(n).reduce((s, d) => s + d, 0) % 4 === 0, decoy: r => pick(r, range(140).map(i => 7 * (i + 2)).filter(n => digits(n).reduce((s, d) => s + d, 0) % 4 !== 0)) },
]
const isolated = (opts: number[], holds: (n: number) => boolean) => {
  const yes = opts.filter(holds)
  if (yes.length === 1) return yes[0]
  if (yes.length === 3) return opts.find(o => !holds(o))
  return undefined
}
const oddNumber = (r: Rand, gi: number) => {
  const g = GENS[gi % GENS.length]
  const all = [...NUM_PROPS, { text: g.text, holds: g.is }]
  let three = new Set<number>(), decoy = 0, opts: number[] = []
  let found = false
  for (let attempt = 0; attempt < 400 && !found; attempt++) {
    three = new Set<number>()
    for (let t = 0; t < 30 && three.size < 3; t++) three.add(g.make(r))
    decoy = g.decoy(r)
    if (three.size < 3 || g.is(decoy) || three.has(decoy)) continue
    opts = shuffle(r, [...three, decoy])
    // Only the two-layer rule may isolate the odd one: no other property may split 3–1,
    // and no single surface property may already give the answer away.
    found = all.every(p => {
      const iso = isolated(opts, p.holds)
      return iso === undefined || iso === decoy
    }) && NUM_PROPS.every(p => isolated(opts, p.holds) === undefined)
  }
  if (!found) reject('no clean draw')
  const sharedBy = NUM_PROPS.filter(p => opts.every(p.holds)).map(p => p.text)
  emit({
    family: 'classify',
    topic: 'Classification',
    question: `Three of the following four numbers share a property that the fourth does not. Find the odd one out.\n${opts.join(', ')}`,
    correct: String(decoy),
    traps: opts.filter(o => o !== decoy).map(String),
    explanation: `${[...three].join(', ')} are each ${g.text}; ${decoy} is not. ${sharedBy.length ? `Surface features do not separate them (all four are ${sharedBy.slice(0, 2).join(' and ')}). ` : ''}No single simple property (parity, primality, squares, cubes, small divisors, digit sums, number of digits) splits the four numbers three to one, so the two-layer rule is the intended one.`,
    hint: 'Look for a two-layer property; check that it leaves exactly one number out.',
    seconds: 90,
    recompute: () => {
      const isos = new Set(all.map(p => isolated(opts, p.holds)).filter(x => x !== undefined))
      if (isos.size !== 1) throw new Error('ambiguous')
      return String([...isos][0])
    },
  })
}

// Letter clusters: three follow a gap pattern, one breaks it.
const gapsOf = (w: string) => [...w].slice(1).map((c, i) => ALPHA.indexOf(c) - ALPHA.indexOf(w[i]))
type LProp = { text: string; holds: (w: string) => boolean }
const LETTER_PROPS: LProp[] = [
  { text: 'contains a vowel', holds: w => /[AEIOU]/.test(w) },
  { text: 'starts with a vowel', holds: w => /^[AEIOU]/.test(w) },
  { text: 'has all positions even', holds: w => [...w].every(c => pos1(c) % 2 === 0) },
  { text: 'has all positions odd', holds: w => [...w].every(c => pos1(c) % 2 === 1) },
  { text: 'is in alphabetical order', holds: w => gapsOf(w).every(g => g > 0) },
  { text: 'has first and last letters that are opposites (positions sum to 27)', holds: w => pos1(w[0]) + pos1(w[w.length - 1]) === 27 },
  { text: 'has position sum even', holds: w => [...w].reduce((s, c) => s + pos1(c), 0) % 2 === 0 },
  { text: 'starts in the first half of the alphabet', holds: w => pos1(w[0]) <= 13 },
]
const oddCluster = (r: Rand) => {
  const len = pick(r, [3, 4])
  const gaps = range(len - 1).map(() => pick(r, [-3, -2, 2, 3, 4, 5]))
  if (new Set(gaps).size === 1 && r() < 0.7) reject('plain')
  const build = (start: number, gs: number[]) => {
    let p = start
    const out = [ALPHA[p]]
    for (const g of gs) {
      p += g
      if (p < 0 || p > 25) return null
      out.push(ALPHA[p])
    }
    return out.join('')
  }
  const groups = new Set<string>()
  for (let t = 0; t < 40 && groups.size < 3; t++) {
    const w = build(int(r, 0, 25), gaps)
    if (w) groups.add(w)
  }
  if (groups.size < 3) reject('few')
  const k = int(r, 0, len - 2)
  const bent = gaps.map((g, i) => (i === k ? g + pick(r, [-1, 1]) : g))
  if (bent[k] === 0) reject('zero gap')
  const decoy = build(int(r, 0, 25), bent)
  if (!decoy || groups.has(decoy)) reject('decoy')
  const opts = shuffle(r, [...groups, decoy])
  const sameGaps = (w: string) => gapsOf(w).every((g, i) => g === gaps[i])
  const all = [...LETTER_PROPS, { text: 'gap pattern', holds: sameGaps }]
  const iso = (p: LProp) => {
    const yes = opts.filter(p.holds)
    return yes.length === 1 ? yes[0] : yes.length === 3 ? opts.find(o => !p.holds(o)) : undefined
  }
  for (const p of all) {
    const x = iso(p)
    if (x !== undefined && x !== decoy) reject('other split')
  }
  const gtxt = (gs: number[]) => gs.map(g => (g > 0 ? `+${g}` : `${g}`)).join(', ')
  emit({
    family: 'classify',
    topic: 'Classification',
    question: `Three of the following four letter-clusters are alike in a certain way and one is different. Select the odd one.\n${opts.join(', ')}`,
    correct: decoy,
    traps: opts.filter(o => o !== decoy),
    explanation: `In ${[...groups].join(', ')} the successive letters move by ${gtxt(gaps)} alphabet positions. In ${decoy} the moves are ${gtxt(gapsOf(decoy))}, breaking the pattern at step ${k + 1}. Features such as vowels or the starting letter do not separate any other cluster.`,
    hint: 'Write the alphabet positions and compare the steps between consecutive letters.',
    seconds: 80,
    recompute: () => {
      const isos = new Set(all.map(iso).filter(x => x !== undefined))
      if (isos.size !== 1) throw new Error('ambiguous')
      return [...isos][0] as string
    },
  })
}

// Number pairs: three follow b = f(a), one does not.
const oddPair = (r: Rand) => {
  const rule = pick(r, SETTER_NUM)
  const as = shuffle(r, range(12).map(i => i + 3)).slice(0, 4)
  const pairs = as.slice(0, 3).map(a => [a, rule.f(a)] as const)
  const da = as[3]
  const db = rule.f(da) + pick(r, [-2, -1, 1, 2, da, -da])
  if (db <= 0) reject('neg')
  const decoy = [da, db] as const
  const opts = shuffle(r, [...pairs, decoy])
  const label = (p: readonly [number, number]) => `(${p[0]}, ${p[1]})`
  const isoBy = (g: NumRule) => {
    const yes = opts.filter(p => g.f(p[0]) === p[1])
    return yes.length === 1 ? yes[0] : yes.length === 3 ? opts.find(p => g.f(p[0]) !== p[1]) : undefined
  }
  for (const g of NUM_RULES) {
    const x = isoBy(g)
    if (x !== undefined && x !== decoy) reject('other split')
  }
  emit({
    family: 'classify',
    topic: 'Classification',
    question: `In three of the following number pairs the second number is obtained from the first by the same rule. Select the pair that does NOT follow it.\n${opts.map(label).join(', ')}`,
    correct: label(decoy),
    traps: opts.filter(p => p !== decoy).map(label),
    explanation: `The rule is b = ${rule.text}: ${pairs.map(([a, b]) => `${a} → ${b}`).join(', ')}. For ${da} the rule gives ${rule.f(da)}, not ${db}, so ${label(decoy)} is the odd pair. No other candidate rule fits exactly three pairs.`,
    hint: 'Find a single formula that fits three pairs exactly.',
    seconds: 90,
    recompute: () => {
      const isos = new Set(NUM_RULES.map(isoBy).filter(x => x !== undefined))
      if (isos.size !== 1) throw new Error('ambiguous')
      return label([...isos][0] as readonly [number, number])
    },
  })
}

// ===========================================================================
// Ranking and order
// ===========================================================================

const rowExchange = (r: Rand) => {
  const [A, B] = shuffle(r, ['Arun', 'Bhanu', 'Chaitra', 'Dinesh', 'Esha', 'Farooq', 'Gowri', 'Harsha']).slice(0, 2)
  const total = int(r, 35, 70)
  const pa = int(r, 5, total - 20), pb = int(r, pa + 6, total - 4)
  const fromRightB = total - pb + 1
  const between = pb - pa - 1
  const ask = int(r, 0, 2)
  if (ask === 0) {
    emit({
      family: 'rank', topic: 'Ranking and order',
      question: `In a row of people facing north, ${A} is ${nth(pa)} from the left end and ${B} is ${nth(fromRightB)} from the right end. When ${A} and ${B} interchange their positions, ${A} becomes ${nth(pb)} from the left end. How many people are there in the row?`,
      correct: String(total),
      traps: [String(total + 1), String(total - 1), String(pa + fromRightB), String(pb + fromRightB)],
      explanation: `After the interchange ${A} stands where ${B} stood, so ${B}'s original position is ${nth(pb)} from the left and ${nth(fromRightB)} from the right. Total = ${pb} + ${fromRightB} − 1 = ${total}. Adding without subtracting 1 counts ${B} twice.`,
      hint: 'Use the person whose position is known from both ends after the swap.',
      seconds: 80,
      recompute: () => String(pb + fromRightB - 1),
    })
  } else if (ask === 1) {
    emit({
      family: 'rank', topic: 'Ranking and order',
      question: `In a row of ${total} people, ${A} is ${nth(pa)} from the left end and ${B} is ${nth(fromRightB)} from the right end. How many people stand between ${A} and ${B}?`,
      correct: String(between),
      traps: [String(between + 1), String(between - 1), String(between + 2), String(Math.abs(total - pa - fromRightB))],
      explanation: `${B} is ${nth(total - fromRightB + 1)} from the left (${total} − ${fromRightB} + 1). People between = ${total - fromRightB + 1} − ${pa} − 1 = ${between}.`,
      hint: 'Convert both positions to the same end first.',
      seconds: 80,
      recompute: () => String(total - fromRightB + 1 - pa - 1),
    })
  } else {
    if ((pa + pb) % 2 !== 0) reject('no midpoint')
    const mid = (pa + pb) / 2
    const midRight = total - mid + 1
    emit({
      family: 'rank', topic: 'Ranking and order',
      question: `In a row of ${total} people facing north, ${A} is ${nth(pa)} from the left end and ${B} is ${nth(fromRightB)} from the right end. Kavya stands exactly midway between ${A} and ${B}. What is Kavya's position from the right end?`,
      correct: nth(midRight),
      traps: [nth(midRight + 1), nth(midRight - 1), nth(mid), nth(Math.round((pa + fromRightB) / 2))],
      explanation: `${B} is ${nth(pb)} from the left (${total} − ${fromRightB} + 1). Midway between ${nth(pa)} and ${nth(pb)} is ${nth(mid)} from the left, i.e. ${total} − ${mid} + 1 = ${nth(midRight)} from the right.`,
      hint: 'Bring both people to the left-end scale, find the midpoint, then convert back.',
      seconds: 100,
      recompute: () => nth(total - (pa + total - fromRightB + 1) / 2 + 1),
    })
  }
}

const classRank = (r: Rand) => {
  const top = int(r, 8, 30), bottom = int(r, 8, 30), failed = int(r, 3, 12), absent = int(r, 2, 8)
  const passed = top + bottom - 1
  const total = passed + failed + absent
  const name = pick(r, ['Ravi', 'Sravani', 'Imran', 'Lakshmi', 'Naveen', 'Pallavi'])
  emit({
    family: 'rank', topic: 'Ranking and order',
    question: `In the results of a class test, ${name} is ${nth(top)} from the top and ${nth(bottom)} from the bottom among the students who passed; no two passed students share a rank. ${failed} students failed and ${absent} students were absent from the test. How many students are on the class roll?`,
    correct: String(total),
    traps: [String(total + 1), String(passed + failed), String(passed), String(total - 1)],
    explanation: `Passed students = ${top} + ${bottom} − 1 = ${passed}. Roll strength = passed + failed + absent = ${passed} + ${failed} + ${absent} = ${total}. Forgetting the absentees gives ${passed + failed}.`,
    hint: 'The two ranks give the number of passed students only; add the other groups afterwards.',
    seconds: 75,
    recompute: () => String(top + bottom - 1 + failed + absent),
  })
}

// Comparison puzzles: brute force over all height orders of six people.
const P6 = perms(6)
type RClue = { text: string; test: (h: number[]) => boolean } // h[person] = rank (0 = tallest)
const rankPuzzle = (r: Rand) => {
  const names = shuffle(r, ['P', 'Q', 'R', 'S', 'T', 'U'])
  const L = (i: number) => names[i]
  const hidden = pick(r, P6)
  const pool: RClue[] = []
  for (let a = 0; a < 6; a++) for (let b = 0; b < 6; b++) {
    if (a === b) continue
    if (hidden[a] < hidden[b]) pool.push({ text: `${L(a)} is taller than ${L(b)}`, test: h => h[a] < h[b] })
    const gap = Math.abs(hidden[a] - hidden[b]) - 1
    if (a < b && gap >= 1) pool.push({ text: `exactly ${gap} ${gap === 1 ? 'person is' : 'people are'} between ${L(a)} and ${L(b)} in height order`, test: h => Math.abs(h[a] - h[b]) - 1 === gap })
    for (let c = 0; c < 6; c++) if (c !== a && c !== b && hidden[a] < hidden[c] && hidden[c] < hidden[b] && a < b) pool.push({ text: `${L(c)} is shorter than ${L(a)} but taller than ${L(b)}`, test: h => h[a] < h[c] && h[c] < h[b] })
  }
  for (let a = 0; a < 6; a++) {
    const k = hidden[a]
    if (k > 0 && k < 5) pool.push({ text: `${L(a)} is neither the tallest nor the shortest`, test: h => h[a] > 0 && h[a] < 5 })
    pool.push({ text: `exactly ${k === 0 ? 'no one is' : k === 1 ? 'one person is' : `${k} people are`} taller than ${L(a)}`.replace('exactly no one', 'no one'), test: h => h[a] === k })
  }
  // Prefer relational clues; at most one "exactly k taller" clue.
  const ordered = shuffle(r, pool)
  let cands = P6
  const chosen: RClue[] = []
  let absolute = 0
  for (const clue of ordered) {
    const isAbs = clue.text.includes('taller than') && /^(exactly|no one)/.test(clue.text)
    if (isAbs && absolute >= 1) continue
    const next = cands.filter(clue.test)
    if (next.length < cands.length) {
      chosen.push(clue)
      cands = next
      if (isAbs) absolute++
    }
    if (cands.length === 1) break
  }
  if (cands.length !== 1 || chosen.length < 5) reject('not unique or too easy')
  // Drop redundant clues.
  for (let i = chosen.length - 1; i >= 0; i--) {
    const rest = chosen.filter((_, j) => j !== i)
    if (P6.filter(h => rest.every(c => c.test(h))).length === 1) chosen.splice(i, 1)
  }
  if (chosen.length < 4) reject('too easy')
  const order = range(6).sort((a, b) => hidden[a] - hidden[b])
  const askKind = int(r, 0, 2)
  const solve = () => {
    const sols = P6.filter(h => chosen.every(c => c.test(h)))
    if (sols.length !== 1) throw new Error('not unique')
    return sols[0]
  }
  let question: string, correct: string, traps: string[], recompute: () => string
  if (askKind === 0) {
    const k = int(r, 1, 4)
    question = `Who is the ${nth(k + 1)} tallest?`
    correct = L(order[k])
    traps = [order[k - 1], order[k + 1], ...order.filter((_, i) => i !== k)].map(L)
    recompute = () => L(solve().indexOf(k))
  } else if (askKind === 1) {
    const x = int(r, 0, 5)
    question = `How many people are shorter than ${L(x)}?`
    correct = String(5 - hidden[x])
    traps = [String(hidden[x]), String(5 - hidden[x] + 1), String(Math.max(0, 5 - hidden[x] - 1)), String(6 - hidden[x])]
    recompute = () => String(5 - solve()[x])
  } else {
    question = 'Who is the shortest, and who is immediately taller than that person?'
    const s = order[5], t = order[4]
    correct = `${L(s)}; ${L(t)}`
    traps = [`${L(t)}; ${L(s)}`, `${L(s)}; ${L(order[3])}`, `${L(order[4])}; ${L(order[3])}`, `${L(order[0])}; ${L(order[1])}`]
    recompute = () => {
      const h = solve()
      return `${L(h.indexOf(5))}; ${L(h.indexOf(4))}`
    }
  }
  const clueText = chosen.map((c, i) => `(${i + 1}) ${c.text.charAt(0).toUpperCase()}${c.text.slice(1)}.`).join(' ')
  emit({
    family: 'rank', topic: 'Ranking and order',
    question: `Six people P, Q, R, S, T and U are all of different heights. ${clueText}\n${question}`,
    correct,
    traps,
    explanation: `Combining the clues fixes a single order from tallest to shortest: ${order.map(L).join(' > ')}. Each clue is needed; removing any one leaves more than one possible order. Hence the answer is ${correct}.`,
    hint: 'Build chains from the direct comparisons first, then use the "between" and position clues to place the remaining people.',
    seconds: 150,
    recompute,
  })
}

// ===========================================================================
// Venn diagrams (set counting)
// ===========================================================================

// Regions: 0 onlyA, 1 onlyB, 2 onlyC, 3 AB only, 4 BC only, 5 CA only, 6 ABC, 7 none
type Lin = { coef: number[]; rhs: number }
const determined = (eqs: Lin[], ask: number[]): number | null => {
  const rows = eqs.map(e => [...e.coef, e.rhs])
  const pivots: number[] = []
  let row = 0
  for (let col = 0; col < 8 && row < rows.length; col++) {
    let p = rows.findIndex((x, i) => i >= row && Math.abs(x[col]) > 1e-9)
    if (p < 0) continue
    ;[rows[row], rows[p]] = [rows[p], rows[row]]
    const pv = rows[row][col]
    rows[row] = rows[row].map(v => v / pv)
    for (let i = 0; i < rows.length; i++) if (i !== row && Math.abs(rows[i][col]) > 1e-9) {
      const f = rows[i][col]
      rows[i] = rows[i].map((v, j) => v - f * rows[row][j])
    }
    pivots.push(col)
    row++
    p = -1
  }
  const t = [...ask]
  let val = 0
  pivots.forEach((col, i) => {
    const f = t[col]
    if (Math.abs(f) < 1e-12) return
    for (let j = 0; j < 8; j++) t[j] -= f * rows[i][j]
    val += f * rows[i][8]
  })
  return t.every(v => Math.abs(v) < 1e-9) ? Math.round(val * 1e6) / 1e6 : null
}
const vec = (...idx: number[]) => range(8).map(i => (idx.includes(i) ? 1 : 0))
const dot = (a: number[], x: number[]) => a.reduce((s, v, i) => s + v * x[i], 0)
const SETS: [string, string, string][] = [['Hindi', 'Telugu', 'Urdu'], ['Hindi', 'English', 'Tamil'], ['driving', 'swimming', 'first aid'], ['Tally', 'Excel', 'Python'], ['Kannada', 'Odia', 'Marathi']]
const vennThree = (r: Rand) => {
  const x = range(8).map(i => (i === 6 ? int(r, 3, 14) : i === 7 ? int(r, 4, 30) : int(r, 5, 40)))
  const [a, b, c] = pick(r, SETS)
  const A = dot(vec(0, 3, 5, 6), x), B = dot(vec(1, 3, 4, 6), x), C = dot(vec(2, 4, 5, 6), x)
  const N = x.reduce((s, v) => s + v, 0)
  const exactlyTwo = x[3] + x[4] + x[5], exactlyOne = x[0] + x[1] + x[2]
  const variant = int(r, 0, 2)
  const people = variant === 2 ? 'trainees' : 'candidates'
  let stmts: string[], eqs: Lin[], ask: number[], askText: string, right: number, traps: number[], why: string
  if (variant === 0) {
    const AB = x[3] + x[6], BC = x[4] + x[6], CA = x[5] + x[6]
    stmts = [`${N} ${people} were surveyed`, `${A} know ${a}`, `${B} know ${b}`, `${C} know ${c}`, `${AB} know both ${a} and ${b}`, `${BC} know both ${b} and ${c}`, `${CA} know both ${c} and ${a}`, `${x[6]} know all three`]
    eqs = [{ coef: vec(0, 1, 2, 3, 4, 5, 6, 7), rhs: N }, { coef: vec(0, 3, 5, 6), rhs: A }, { coef: vec(1, 3, 4, 6), rhs: B }, { coef: vec(2, 4, 5, 6), rhs: C }, { coef: vec(3, 6), rhs: AB }, { coef: vec(4, 6), rhs: BC }, { coef: vec(5, 6), rhs: CA }, { coef: vec(6), rhs: x[6] }]
    const k = int(r, 0, 2)
    if (k === 0) {
      ask = vec(7); askText = 'How many know none of the three?'; right = x[7]
      traps = [N - (A + B + C - AB - BC - CA), N - (A + B + C - AB - BC - CA + 2 * x[6]), N - (A + B + C) + AB + BC + CA - 2 * x[6]]
      why = `Using inclusion–exclusion, at least one = ${A} + ${B} + ${C} − ${AB} − ${BC} − ${CA} + ${x[6]} = ${N - x[7]}. None = ${N} − ${N - x[7]} = ${x[7]}. Forgetting to add back the triple overlap gives ${N - (A + B + C - AB - BC - CA)}.`
    } else if (k === 1) {
      ask = vec(3, 4, 5); askText = 'How many know exactly two of the three?'; right = exactlyTwo
      traps = [AB + BC + CA, AB + BC + CA - x[6], exactlyTwo + x[6]]
      why = `Exactly two = (${AB} + ${BC} + ${CA}) − 3 × ${x[6]} = ${exactlyTwo}. Each pairwise figure includes the ${x[6]} who know all three, so they must be removed three times, not once.`
    } else {
      ask = vec(0); askText = `How many know only ${a}?`; right = x[0]
      traps = [A - AB - CA, A - AB - CA + 2 * x[6], A - x[3] - x[5]]
      why = `Only ${a} = ${A} − ${AB} − ${CA} + ${x[6]} = ${x[0]} (the all-three group is subtracted twice, so it is added back once).`
    }
  } else if (variant === 1) {
    stmts = [`${N} ${people} were surveyed and ${x[7]} know none of ${a}, ${b} and ${c}`, `${A} know ${a}, ${B} know ${b} and ${C} know ${c}`, `${x[6]} know all three`]
    eqs = [{ coef: vec(0, 1, 2, 3, 4, 5, 6, 7), rhs: N }, { coef: vec(7), rhs: x[7] }, { coef: vec(0, 3, 5, 6), rhs: A }, { coef: vec(1, 3, 4, 6), rhs: B }, { coef: vec(2, 4, 5, 6), rhs: C }, { coef: vec(6), rhs: x[6] }]
    ask = vec(3, 4, 5); askText = 'How many know exactly two of the three?'; right = exactlyTwo
    const atLeast1 = N - x[7]
    traps = [A + B + C - atLeast1, A + B + C - atLeast1 - x[6], A + B + C - atLeast1 - 3 * x[6]]
    why = `At least one = ${N} − ${x[7]} = ${atLeast1}. The sum ${A} + ${B} + ${C} = ${A + B + C} counts "exactly one" once, "exactly two" twice and "all three" three times. So (one + two + three) = ${atLeast1} and (one + 2·two + 3·three) = ${A + B + C}. Subtracting: two + 2 × ${x[6]} = ${A + B + C - atLeast1}, hence exactly two = ${exactlyTwo}.`
  } else {
    const atLeastTwo = exactlyTwo + x[6]
    stmts = [`${exactlyOne} ${people} know exactly one of ${a}, ${b} and ${c}`, `${atLeastTwo} know at least two of them`, `the numbers knowing ${a}, ${b} and ${c} are ${A}, ${B} and ${C} respectively`]
    eqs = [{ coef: vec(0, 1, 2), rhs: exactlyOne }, { coef: vec(3, 4, 5, 6), rhs: atLeastTwo }, { coef: vec(0, 3, 5, 6), rhs: A }, { coef: vec(1, 3, 4, 6), rhs: B }, { coef: vec(2, 4, 5, 6), rhs: C }]
    ask = vec(6); askText = 'How many know all three?'; right = x[6]
    const S = A + B + C
    traps = [S - exactlyOne - 2 * atLeastTwo + 1, (S - exactlyOne - atLeastTwo) / 2, S - exactlyOne - atLeastTwo]
    why = `A + B + C = one + 2·two + 3·three = ${S}. With one = ${exactlyOne} and two + three = ${atLeastTwo}: ${S} = ${exactlyOne} + 2 × ${atLeastTwo} + three, so three = ${S} − ${exactlyOne} − ${2 * atLeastTwo} = ${x[6]}.`
  }
  if (determined(eqs, ask) !== right) reject('not determined')
  emit({
    family: 'venn', topic: 'Venn diagrams',
    question: `In a survey, ${stmts.join('; ')}. ${askText}`,
    correct: String(right),
    traps: traps.filter(t => Number.isInteger(t) && t >= 0).map(String).concat([String(right + x[6]), String(right + 1)]),
    explanation: why,
    hint: 'Draw three overlapping circles, start from the innermost region and work outwards; remember which figures already include the triple overlap.',
    seconds: 150,
    recompute: () => {
      const v = determined(eqs, ask)
      if (v === null) throw new Error('not determined')
      return String(v)
    },
  })
}

const vennBounds = (r: Rand) => {
  const N = int(r, 6, 20) * 10, a = int(r, Math.round(N * 0.4), Math.round(N * 0.8)), b = int(r, Math.round(N * 0.35), Math.round(N * 0.75)), m = int(r, 2, 15)
  const [s1, s2] = pick(r, [['drink tea', 'drink coffee'], ['travel by bus', 'travel by metro'], ['practise yoga', 'go jogging'], ['read a morning newspaper', 'watch television news']] as const)
  const feasible = range(Math.min(a, b) + 1).filter(both => {
    const none = N - (a + b - both)
    return none >= m && a - both >= 0 && b - both >= 0 && none >= 0
  })
  if (feasible.length < 3) reject('narrow')
  const lo = Math.min(...feasible), hi = Math.max(...feasible)
  const kind = int(r, 0, 2)
  let ask: string, right: number, traps: number[], why: string, rec: () => number
  const enumerate = () => range(Math.min(a, b) + 1).filter(both => N - (a + b - both) >= m && N - (a + b - both) >= 0)
  if (kind === 0) {
    ask = `What is the minimum possible number of people who do both?`
    right = lo
    traps = [Math.max(0, a + b - N), lo + 1, hi, a + b - N + 2 * m]
    why = `If x do both, then none = ${N} − (${a} + ${b} − x) = x − ${a + b - N}. The condition none ≥ ${m} gives x ≥ ${a + b - N + m}${a + b - N + m < 0 ? ', and x cannot be negative' : ''}, so the minimum is ${lo}. Ignoring the "at least ${m} do neither" condition gives ${Math.max(0, a + b - N)}.`
    rec = () => Math.min(...enumerate())
  } else if (kind === 1) {
    ask = `What is the maximum possible number of people who do exactly one of the two?`
    right = a + b - 2 * lo
    traps = [a + b - 2 * hi, a + b - lo, N - m, a + b - 2 * lo + 2]
    why = `Exactly one = (${a} − x) + (${b} − x) = ${a + b} − 2x, which is largest when x (both) is smallest. The smallest feasible x is ${lo}, so the maximum is ${a + b} − ${2 * lo} = ${right}.`
    rec = () => a + b - 2 * Math.min(...enumerate())
  } else {
    ask = `What is the difference between the maximum and the minimum possible number of people who do neither?`
    right = hi - lo
    traps = [hi - lo + 1, Math.min(a, b) - Math.max(0, a + b - N), hi, N - Math.max(a, b) - m]
    why = `None = x − ${a + b - N}, so it rises one-for-one with x (both). x ranges from ${lo} to ${hi} (= the smaller group, ${Math.min(a, b)}${hi < Math.min(a, b) ? ', limited further by the total' : ''}), so the difference is ${hi} − ${lo} = ${right}.`
    rec = () => {
      const f = enumerate()
      return Math.max(...f) - Math.min(...f)
    }
  }
  emit({
    family: 'venn', topic: 'Venn diagrams',
    question: `Of ${N} people surveyed, ${a} ${s1} and ${b} ${s2}. At least ${m} of them do neither. ${ask}`,
    correct: String(right),
    traps: traps.filter(t => t >= 0).map(String),
    explanation: why,
    hint: 'Express every region in terms of the overlap x and impose all the conditions on x.',
    seconds: 130,
    recompute: () => String(rec()),
  })
}

// ===========================================================================
// Mathematical operations
// ===========================================================================

type Op = '+' | '−' | '×' | '÷'
const OPS: Op[] = ['+', '−', '×', '÷']
const evalBodmas = (nums: number[], ops: Op[]): number | null => {
  const ns = [...nums], os = [...ops]
  for (let i = 0; i < os.length;) {
    if (os[i] === '×' || os[i] === '÷') {
      if (os[i] === '÷' && (ns[i + 1] === 0 || ns[i] % ns[i + 1] !== 0)) return null
      const v = os[i] === '×' ? ns[i] * ns[i + 1] : ns[i] / ns[i + 1]
      ns.splice(i, 2, v)
      os.splice(i, 1)
    } else i++
  }
  let v = ns[0]
  os.forEach((o, i) => (v = o === '+' ? v + ns[i + 1] : v - ns[i + 1]))
  return v
}
const evalLeft = (nums: number[], ops: Op[]): number | null => {
  let v = nums[0]
  for (let i = 0; i < ops.length; i++) {
    const n = nums[i + 1]
    if (ops[i] === '÷' && (n === 0 || v % n !== 0)) return null
    v = ops[i] === '+' ? v + n : ops[i] === '−' ? v - n : ops[i] === '×' ? v * n : v / n
  }
  return v
}
const exprText = (nums: number[], ops: (string)[]) => nums.map((n, i) => (i < ops.length ? `${n} ${ops[i]} ` : `${n}`)).join('')
const derangement = (r: Rand): Record<Op, Op> => {
  for (;;) {
    const p = shuffle(r, OPS)
    if (p.every((o, i) => o !== OPS[i])) return Object.fromEntries(OPS.map((o, i) => [o, p[i]])) as Record<Op, Op>
  }
}
const symbolSub = (r: Rand, letters: boolean) => {
  const map = derangement(r)
  const inverse = Object.fromEntries(OPS.map(o => [map[o], o])) as Record<Op, Op>
  const nums = range(5).map(() => int(r, 2, 24))
  const written = range(4).map(() => pick(r, OPS))
  if (new Set(written).size < 3) reject('dull')
  const actual = written.map(o => map[o])
  if (!actual.includes('÷') || !actual.includes('×')) reject('needs × and ÷')
  const right = evalBodmas(nums, actual)
  const ltr = evalLeft(nums, actual)
  const raw = evalBodmas(nums, written)
  const inv = evalBodmas(nums, written.map(o => inverse[o]))
  if (right === null || ltr === null || Math.abs(right) > 400 || right === ltr) reject('bad')
  const LET: Record<Op, string> = letters ? Object.fromEntries(OPS.map((o, i) => [o, ['P', 'Q', 'R', 'S'][i]])) as Record<Op, string> : { '+': '+', '−': '−', '×': '×', '÷': '÷' }
  const legend = letters
    ? OPS.map(o => `'${LET[o]}' means '${map[o] === '+' ? 'plus' : map[o] === '−' ? 'minus' : map[o] === '×' ? 'multiplied by' : 'divided by'}'`).join(', ')
    : OPS.map(o => `'${o}' means '${map[o]}'`).join(', ')
  emit({
    family: 'mathop', topic: 'Mathematical operations',
    question: `If ${legend}, what is the value of the following?\n${exprText(nums, written.map(o => LET[o]))}`,
    correct: String(right),
    traps: [ltr, raw, inv, right + nums[4], right - 1].filter((v): v is number => v !== null && Number.isInteger(v)).map(String),
    explanation: `Substituting gives ${exprText(nums, actual)}. Applying BODMAS (÷ and × before + and −) gives ${right}. Working left to right after substitution gives ${ltr}${raw !== null ? `; ignoring the substitution gives ${raw}` : ''}.`,
    hint: 'Rewrite the whole expression with the real operators first, then apply BODMAS.',
    seconds: 100,
    recompute: () => String(evalBodmas(nums, written.map(o => map[o]))),
  })
}

const PAIR_SWAPS: [Op, Op][] = [['+', '−'], ['+', '×'], ['+', '÷'], ['−', '×'], ['−', '÷'], ['×', '÷']]
const swapOps = (ops: Op[], [x, y]: [Op, Op]) => ops.map(o => (o === x ? y : o === y ? x : o))
const whichSwap = (r: Rand) => {
  const nums = range(5).map(() => int(r, 2, 20))
  const ops = shuffle(r, OPS)
  const good = pick(r, PAIR_SWAPS)
  const target = evalBodmas(nums, swapOps(ops, good))
  if (target === null || target < 0 || target > 300) reject('bad target')
  const works = PAIR_SWAPS.filter(p => evalBodmas(nums, swapOps(ops, p)) === target)
  if (works.length !== 1 || evalBodmas(nums, ops) === target) reject('not unique')
  const label = ([x, y]: [Op, Op]) => `${x} and ${y}`
  emit({
    family: 'mathop', topic: 'Mathematical operations',
    question: `Which two signs should be interchanged to make the following equation correct?\n${exprText(nums, ops)} = ${target}`,
    correct: label(good),
    traps: shuffle(r, PAIR_SWAPS.filter(p => p !== good)).map(label),
    explanation: `Interchanging ${label(good)} gives ${exprText(nums, swapOps(ops, good))}, which equals ${target} by BODMAS. Checking all six possible interchanges, no other pair produces ${target} (for example, ${PAIR_SWAPS.filter(p => p !== good).slice(0, 2).map(p => `swapping ${label(p)} gives ${evalBodmas(nums, swapOps(ops, p)) ?? 'a non-integer value'}`).join('; ')}).`,
    hint: 'Try each option, rewrite the equation, and evaluate with BODMAS.',
    seconds: 120,
    recompute: () => {
      const ok = PAIR_SWAPS.filter(p => evalBodmas(nums, swapOps(ops, p)) === target)
      if (ok.length !== 1) throw new Error('not unique')
      return label(ok[0])
    },
  })
}

type CondOp = { sym: string; text: string; f: (a: number, b: number) => number }
const condOps: CondOp[] = [
  { sym: '@', text: 'a @ b = a + b if both a and b are odd; a × b if both are even; and |a − b| otherwise', f: (a, b) => (a % 2 && b % 2 ? a + b : !(a % 2) && !(b % 2) ? a * b : Math.abs(a - b)) },
  { sym: '#', text: 'a # b = a² − b if a > b; b² − a if b > a; and 2a if a = b', f: (a, b) => (a > b ? a * a - b : b > a ? b * b - a : 2 * a) },
  { sym: '$', text: 'a $ b = (a + b)/2 if a + b is even; and a × b − 1 otherwise', f: (a, b) => ((a + b) % 2 === 0 ? (a + b) / 2 : a * b - 1) },
  { sym: '&', text: 'a & b = a × b if a is a multiple of b; a + 2b if b is a multiple of a; and a − b otherwise', f: (a, b) => (a % b === 0 ? a * b : b % a === 0 ? a + 2 * b : a - b) },
]
const conditional = (r: Rand) => {
  const [o1, o2] = shuffle(r, condOps).slice(0, 2)
  const [p, q, s, t] = range(4).map(() => int(r, 2, 12))
  const left = o1.f(p, q), rightIn = o1.f(s, t)
  if (left <= 0 || rightIn <= 0) reject('neg')
  const v = o2.f(left, rightIn)
  if (!Number.isInteger(v) || Math.abs(v) > 500) reject('big')
  const swapped = o2.f(o1.f(q, p), o1.f(t, s))
  const wrongOrder = o1.f(o2.f(p, q), o2.f(s, t))
  const naive = o2.f(p + q, s + t)
  emit({
    family: 'mathop', topic: 'Mathematical operations',
    question: `Two operations are defined for positive integers a and b:\n${o1.text};\n${o2.text}.\nFind the value of (${p} ${o1.sym} ${q}) ${o2.sym} (${s} ${o1.sym} ${t}).`,
    correct: String(v),
    traps: [swapped, wrongOrder, naive, v + 1, v - 2].filter(x => Number.isInteger(x)).map(String),
    explanation: `${p} ${o1.sym} ${q} = ${left} and ${s} ${o1.sym} ${t} = ${rightIn} (check which condition applies to each pair). Then ${left} ${o2.sym} ${rightIn} = ${v}. Applying the operations in the wrong order, or the wrong branch of a condition, gives the traps.`,
    hint: 'Evaluate the brackets first and decide the branch of each definition from the actual numbers.',
    seconds: 120,
    recompute: () => String(o2.f(o1.f(p, q), o1.f(s, t))),
  })
}

// ===========================================================================
// Alphabet test
// ===========================================================================

const alphaPosition = (r: Rand) => {
  const kind = int(r, 0, 2)
  const k1 = int(r, 4, 20), k2 = int(r, 3, 9)
  const dir = pick(r, ['left', 'right'] as const)
  if (kind === 0) {
    const from = pick(r, ['left', 'right'] as const)
    const base = from === 'left' ? k1 - 1 : 26 - k1
    const target = dir === 'right' ? base + k2 : base - k2
    if (target < 0 || target > 25) reject('off')
    const right = ALPHA[target]
    emit({
      family: 'alpha', topic: 'Alphabet test',
      question: `Which letter is ${nth(k2)} to the ${dir} of the ${nth(k1)} letter from the ${from} end of the English alphabet?`,
      correct: right,
      traps: [ALPHA[dir === 'right' ? base - k2 : base + k2], ALPHA[target + 1], ALPHA[target - 1], ALPHA[from === 'left' ? 26 - k1 : k1 - 1]].filter(Boolean),
      explanation: `The ${nth(k1)} letter from the ${from} is ${ALPHA[base]} (position ${base + 1}). Moving ${k2} places to the ${dir} reaches position ${target + 1}, which is ${right}.`,
      hint: 'Convert to a position from the left end, then move.',
      seconds: 60,
      recompute: () => ALPHA[(from === 'left' ? k1 - 1 : 26 - k1) + (dir === 'right' ? k2 : -k2)],
    })
  } else if (kind === 1) {
    const rev = [...ALPHA].reverse()
    const base = k1 - 1
    const target = dir === 'right' ? base + k2 : base - k2
    if (target < 0 || target > 25) reject('off')
    emit({
      family: 'alpha', topic: 'Alphabet test',
      question: `If the English alphabet is written in reverse order (Z first, A last), which letter will be ${nth(k2)} to the ${dir} of the ${nth(k1)} letter from the left end?`,
      correct: rev[target],
      traps: [ALPHA[target], rev[dir === 'right' ? base - k2 : base + k2], rev[target + 1], ALPHA[base + (dir === 'right' ? k2 : -k2) + 1]].filter(Boolean),
      explanation: `In the reversed sequence the ${nth(k1)} letter from the left is ${rev[base]}. Moving ${k2} places to the ${dir} gives the ${nth(target + 1)} letter of the reversed sequence, ${rev[target]}.`,
      hint: 'In the reversed alphabet the n-th letter from the left is the (27 − n)-th letter of A–Z.',
      seconds: 70,
      recompute: () => [...ALPHA].reverse()[k1 - 1 + (dir === 'right' ? k2 : -k2)],
    })
  } else {
    const every = pick(r, [3, 4, 5])
    const kept = [...ALPHA].filter((_, i) => (i + 1) % every !== 0)
    const k = int(r, 4, kept.length - 2)
    const fromRight = kept[kept.length - k]
    emit({
      family: 'alpha', topic: 'Alphabet test',
      question: `If every ${nth(every)} letter of the English alphabet (${ALPHA[every - 1]}, ${ALPHA[2 * every - 1]}, ${ALPHA[3 * every - 1]}, …) is dropped, which letter will be ${nth(k)} from the right end of the remaining sequence?`,
      correct: fromRight,
      traps: [ALPHA[26 - k], kept[kept.length - k - 1], kept[kept.length - k + 1], kept[k - 1]].filter(Boolean),
      explanation: `${26 - kept.length} letters are dropped, leaving ${kept.length}: ${kept.join('')}. Counting ${k} from the right gives ${fromRight}. Counting in the full alphabet gives ${ALPHA[26 - k]}.`,
      hint: 'Write out the shortened sequence before counting from the right.',
      seconds: 90,
      recompute: () => {
        const ks = [...ALPHA].filter((_, i) => (i + 1) % every !== 0)
        return ks[ks.length - k]
      },
    })
  }
}

const SYMBOLS = ['@', '#', '$', '%', '&', '*', '©', '£']
const VOWELS = 'AEIOU'
const kindOf = (ch: string) => (/[0-9]/.test(ch) ? 'digit' : /[A-Z]/.test(ch) ? (VOWELS.includes(ch) ? 'vowel' : 'consonant') : 'symbol')
const alphaSeries = (r: Rand) => {
  const seq = range(20).map(() => {
    const t = r()
    return t < 0.25 ? String(int(r, 1, 9)) : t < 0.42 ? pick(r, SYMBOLS) : t < 0.6 ? pick(r, [...VOWELS]) : pick(r, [...'BCDFGHJKLMNPRSTVW'])
  })
  const kind = int(r, 0, 2)
  const shown = seq.join(' ')
  if (kind === 0) {
    const [pre, mid, post] = pick(r, [['consonant', 'vowel', 'digit'], ['digit', 'symbol', 'consonant'], ['symbol', 'digit', 'vowel'], ['vowel', 'consonant', 'symbol'], ['digit', 'consonant', 'digit']] as const)
    const count = (s: string[]) => s.filter((c, i) => i > 0 && i < s.length - 1 && kindOf(c) === mid && kindOf(s[i - 1]) === pre && kindOf(s[i + 1]) === post).length
    const onlyPre = seq.filter((c, i) => i > 0 && kindOf(c) === mid && kindOf(seq[i - 1]) === pre).length
    const onlyPost = seq.filter((c, i) => i < seq.length - 1 && kindOf(c) === mid && kindOf(seq[i + 1]) === post).length
    const right = count(seq)
    if (right === 0 || onlyPre === right || onlyPost === right) reject('weak')
    const art = (w: string) => (/^[aeiou]/.test(w) ? 'an' : 'a')
    emit({
      family: 'alpha', topic: 'Alphabet test',
      question: `Study the following arrangement:\n${shown}\nHow many ${mid}s in it are immediately preceded by ${art(pre)} ${pre} and immediately followed by ${art(post)} ${post}?`,
      correct: String(right),
      traps: [String(onlyPre), String(onlyPost), String(right + 1), String(Math.max(0, right - 1))],
      explanation: `Scanning each ${mid} and checking both neighbours gives ${right}. Checking only the preceding element gives ${onlyPre}; only the following element gives ${onlyPost}.`,
      hint: 'Mark every candidate element and check both neighbours; the first and last elements cannot qualify.',
      seconds: 120,
      recompute: () => String(count(seq)),
    })
  } else if (kind === 1) {
    const a = int(r, 8, 15), b = int(r, 3, 6)
    const dir = pick(r, ['left', 'right'] as const)
    const fromEnd = pick(r, ['left', 'right'] as const)
    const base = fromEnd === 'left' ? a - 1 : 20 - a
    const target = dir === 'right' ? base + b : base - b
    if (target < 0 || target > 19) reject('off')
    emit({
      family: 'alpha', topic: 'Alphabet test',
      question: `Study the following arrangement:\n${shown}\nWhich element is ${nth(b)} to the ${dir} of the ${nth(a)} element from the ${fromEnd} end?`,
      correct: seq[target],
      traps: [seq[dir === 'right' ? base - b : base + b], seq[target + 1], seq[target - 1], seq[fromEnd === 'left' ? 20 - a : a - 1]].filter((x): x is string => Boolean(x)),
      explanation: `The ${nth(a)} element from the ${fromEnd} end${fromEnd === 'right' ? ` is the ${nth(base + 1)} from the left` : ''} (${seq[base]}). Moving ${b} to the ${dir} reaches the ${nth(target + 1)} from the left, which is ${seq[target]}.`,
      hint: 'Re-express every position from the left end before moving.',
      seconds: 90,
      recompute: () => {
        const bs = fromEnd === 'left' ? a - 1 : 20 - a
        return seq[dir === 'right' ? bs + b : bs - b]
      },
    })
  } else {
    const drop = pick(r, ['digit', 'symbol'] as const)
    const kept = seq.filter(c => kindOf(c) !== drop)
    const k = int(r, 3, Math.min(10, kept.length - 2))
    if (new Set([kept[kept.length - k], seq[seq.length - k]]).size < 2) reject('trap = answer')
    emit({
      family: 'alpha', topic: 'Alphabet test',
      question: `Study the following arrangement:\n${shown}\nIf all the ${drop}s are removed, which element will be ${nth(k)} from the right end?`,
      correct: kept[kept.length - k],
      traps: [seq[seq.length - k], kept[kept.length - k - 1], kept[kept.length - k + 1], kept[k - 1]].filter((x): x is string => Boolean(x)),
      explanation: `After removing the ${drop}s the arrangement is ${kept.join(' ')} (${kept.length} elements). The ${nth(k)} from the right is ${kept[kept.length - k]}.`,
      hint: 'Rewrite the shortened arrangement before counting.',
      seconds: 100,
      recompute: () => {
        const ks = seq.filter(c => kindOf(c) !== drop)
        return ks[ks.length - k]
      },
    })
  }
}

const PAIR_WORDS = ['MONARCHIST', 'BLACKSMITH', 'DOCUMENTARY', 'TRAMPOLINE', 'FIRMLY', 'GUNPOWDER', 'HYDRAULICS', 'NIGHTMARES', 'PLAYGROUND', 'COMPLAINED', 'JUDICATORY', 'FLASHPOINT', 'BIRTHDAY', 'TOWNSHIP', 'PERFUMING', 'DESKTOP', 'CHIVALROUS', 'UNCOPYRIGHTABLE', 'WATCHDOG', 'CORNFLAKES'].filter(w => new Set(w).size === w.length)
const letterPairs = (w: string) => {
  let both = 0, fwd = 0
  for (let i = 0; i < w.length; i++) for (let j = i + 1; j < w.length; j++) {
    const d = j - i, a = ALPHA.indexOf(w[j]) - ALPHA.indexOf(w[i])
    if (Math.abs(a) === d) {
      both++
      if (a > 0) fwd++
    }
  }
  return { both, fwd }
}
const alphaPairs = (r: Rand) => {
  const w = pick(r, PAIR_WORDS)
  const { both, fwd } = letterPairs(w)
  if (both < 2 || fwd === both) reject('weak')
  const adjacent = [...w].slice(1).filter((c, i) => Math.abs(ALPHA.indexOf(c) - ALPHA.indexOf(w[i])) === 1).length
  const list: string[] = []
  for (let i = 0; i < w.length; i++) for (let j = i + 1; j < w.length; j++) if (Math.abs(ALPHA.indexOf(w[j]) - ALPHA.indexOf(w[i])) === j - i) list.push(`${w[i]}${w[j]}`)
  emit({
    family: 'alpha', topic: 'Alphabet test',
    question: `How many pairs of letters are there in the word ${w} that have as many letters between them in the word as in the English alphabet (counting both forward and backward directions)?`,
    correct: String(both),
    traps: [String(fwd), String(adjacent), String(both + 1), String(both - 1)],
    explanation: `Checking every pair of positions: ${list.join(', ')} qualify, i.e. ${both} pairs. Counting only pairs in forward alphabetical direction gives ${fwd}.`,
    hint: 'For each pair, compare the gap in the word with the gap in the alphabet; check both directions.',
    seconds: 120,
    recompute: () => String(letterPairs(w).both),
  })
}

const REARR_WORDS = ['GRADUATE', 'CONSTABLE', 'MAGISTRATE', 'INSPECTOR', 'EVIDENCE', 'PRISONER', 'WARRANT', 'DETECTIVE', 'VERDICT', 'SENTINEL', 'TRAFFIC', 'HIGHWAY', 'CUSTODY', 'SECURITY', 'MOTORCADE', 'STATION', 'PATROLMAN', 'OFFICER', 'GAZETTE', 'COMMANDO']
const alphaRearrange = (r: Rand) => {
  const w = pick(r, REARR_WORDS)
  const kind = int(r, 0, 1)
  if (kind === 0) {
    const sorted = [...w].sort()
    const same = [...w].filter((c, i) => sorted[i] === c).length
    const sameRev = [...w].filter((c, i) => [...sorted].reverse()[i] === c).length
    if (same === 0) reject('none')
    emit({
      family: 'alpha', topic: 'Alphabet test',
      question: `If the letters of the word ${w} are arranged in alphabetical order from left to right, how many letters will remain in the same position as in the original word?`,
      correct: String(same),
      traps: [String(sameRev), String(same + 1), String(Math.max(0, same - 1)), String(same + 2)],
      explanation: `Alphabetical order: ${sorted.join('')}. Comparing position by position with ${w}, ${same} letter${same === 1 ? '' : 's'} stay${same === 1 ? 's' : ''} in place${same ? ` (${[...w].map((c, i) => (sorted[i] === c ? `${c} at ${i + 1}` : '')).filter(Boolean).join(', ')})` : ''}.`,
      hint: 'Write the sorted word directly under the original and compare column by column (watch repeated letters).',
      seconds: 90,
      recompute: () => {
        const s = [...w].sort()
        return String([...w].filter((c, i) => s[i] === c).length)
      },
    })
  } else {
    const t = [...w].map(c => (VOWELS.includes(c) ? ALPHA[(ALPHA.indexOf(c) + 1) % 26] : ALPHA[(ALPHA.indexOf(c) + 25) % 26]))
    const sorted = [...t].sort()
    const k = int(r, 2, Math.min(5, w.length - 1))
    const right = sorted[sorted.length - k]
    emit({
      family: 'alpha', topic: 'Alphabet test',
      question: `In the word ${w}, each vowel is replaced by the next letter of the English alphabet and each consonant by the previous letter. The new letters are then arranged in alphabetical order. Which letter will be ${nth(k)} from the right end?`,
      correct: right,
      traps: [[...w].sort()[w.length - k], sorted[sorted.length - k - 1] ?? sorted[0], sorted[sorted.length - k + 1], t[t.length - k]].filter((x): x is string => Boolean(x)),
      explanation: `${w} becomes ${t.join('')}; arranged alphabetically: ${sorted.join('')}. The ${nth(k)} from the right is ${right}.`,
      hint: 'Do the replacement first, then sort, then count from the right.',
      seconds: 110,
      recompute: () => {
        const tt = [...w].map(c => (VOWELS.includes(c) ? ALPHA[(ALPHA.indexOf(c) + 1) % 26] : ALPHA[(ALPHA.indexOf(c) + 25) % 26])).sort()
        return tt[tt.length - k]
      },
    })
  }
}

// ===========================================================================
// Statements and logical deduction
// ===========================================================================

// Truth-tellers and liars: each person is either always truthful or always lying.
type Claim = { text: (N: string[]) => string; holds: (t: boolean[]) => boolean }
const claimPool = (i: number): Claim[] => {
  const others = range(3).filter(j => j !== i)
  const [j, k] = others
  return [
    { text: N => `${N[j]} is a liar.`, holds: t => !t[j] },
    { text: N => `${N[k]} is truthful.`, holds: t => t[k] },
    { text: N => `${N[j]} and ${N[k]} are of the same type.`, holds: t => t[j] === t[k] },
    { text: N => `${N[j]} and ${N[k]} are of different types.`, holds: t => t[j] !== t[k] },
    { text: () => 'Exactly one of us three is truthful.', holds: t => t.filter(Boolean).length === 1 },
    { text: () => 'At least two of us are liars.', holds: t => t.filter(x => !x).length >= 2 },
    { text: N => `Either I or ${N[j]} is a liar, but not both.`, holds: t => !t[i] !== !t[j] },
    { text: N => `If ${N[k]} is truthful, then so is ${N[j]}.`, holds: t => !t[k] || t[j] },
  ]
}
const knights = (r: Rand) => {
  const N = shuffle(r, ['Anil', 'Bharathi', 'Chandu', 'Divya', 'Eshwar', 'Farida']).slice(0, 3)
  const claims = range(3).map(i => pick(r, claimPool(i)))
  const worlds = range(8).map(m => range(3).map(b => Boolean((m >> b) & 1)))
  const sols = worlds.filter(t => t.every((ti, i) => claims[i].holds(t) === ti))
  if (sols.length !== 1) reject('not unique')
  const sol = sols[0]
  const label = (t: boolean[]) => {
    const truthful = N.filter((_, i) => t[i])
    return truthful.length === 0 ? 'None of them' : truthful.length === 3 ? 'All three' : `${truthful.join(' and ')} only`
  }
  const right = label(sol)
  const traps = worlds.filter(t => label(t) !== right).map(label)
  emit({
    family: 'logic', topic: 'Statements and logical deduction',
    question: `Each of ${N.join(', ')} is either a truth-teller (always tells the truth) or a liar (always lies).\n${N.map((n, i) => `${n} says: “${claims[i].text(N)}”`).join('\n')}\nWho among them is/are truth-teller(s)?`,
    correct: right,
    traps: shuffle(r, traps),
    explanation: `Test all 8 type assignments. A truth-teller's statement must be true and a liar's must be false. Only one assignment is consistent: ${N.map((n, i) => `${n} ${sol[i] ? 'truthful' : 'liar'}`).join(', ')}. ${N.map((n, i) => `${n}'s statement is ${claims[i].holds(sol) ? 'true' : 'false'}`).join('; ')}, matching each speaker's type.`,
    hint: 'Assume one speaker is truthful, follow the consequences, and look for a contradiction; then try the opposite.',
    seconds: 150,
    recompute: () => {
      const s = worlds.filter(t => t.every((ti, i) => claims[i].holds(t) === ti))
      if (s.length !== 1) throw new Error('not unique')
      return label(s[0])
    },
  })
}

// Conditional statements over four propositions; exactly one option must follow.
type Prop4 = { name: string; neg: string }
const THEMES: Prop4[][] = [
  [{ name: 'the alarm rings', neg: 'the alarm does not ring' }, { name: 'the guard checks the vault', neg: 'the guard does not check the vault' }, { name: 'the lights are switched on', neg: 'the lights are not switched on' }, { name: 'the control room is informed', neg: 'the control room is not informed' }],
  [{ name: 'the FIR is registered', neg: 'the FIR is not registered' }, { name: 'the inspector visits the spot', neg: 'the inspector does not visit the spot' }, { name: 'the witness is examined', neg: 'the witness is not examined' }, { name: 'the report reaches the court', neg: 'the report does not reach the court' }],
  [{ name: 'it rains', neg: 'it does not rain' }, { name: 'the match is postponed', neg: 'the match is not postponed' }, { name: 'the ground is covered', neg: 'the ground is not covered' }, { name: 'the spectators are refunded', neg: 'the spectators are not refunded' }],
]
type Formula = { text: string; holds: (v: boolean[]) => boolean }
const lit = (T: Prop4[], i: number, pos: boolean): Formula => ({ text: pos ? T[i].name : T[i].neg, holds: v => v[i] === pos })
const deduction = (r: Rand) => {
  const T = pick(r, THEMES)
  const premisePool: Formula[] = []
  for (let a = 0; a < 4; a++) for (let b = 0; b < 4; b++) {
    if (a === b) continue
    for (const pa of [true, false]) for (const pb of [true, false]) {
      const A = lit(T, a, pa), B = lit(T, b, pb)
      premisePool.push({ text: `If ${A.text}, then ${B.text}`, holds: v => !A.holds(v) || B.holds(v) })
      if (a < b) premisePool.push({ text: `Either ${A.text} or ${B.text} (or both)`, holds: v => A.holds(v) || B.holds(v) })
    }
  }
  const premises = shuffle(r, premisePool).slice(0, 3)
  const fact = lit(T, int(r, 0, 3), r() < 0.5)
  const all = [...premises, fact]
  const worlds = range(16).map(m => range(4).map(b => Boolean((m >> b) & 1)))
  const models = worlds.filter(v => all.every(f => f.holds(v)))
  if (models.length === 0 || models.length > 4) reject('degenerate')
  const literals: Formula[] = range(4).flatMap(i => [lit(T, i, true), lit(T, i, false)])
  const forcedAll = literals.filter(l => models.every(l.holds) && l.text !== fact.text)
  // The answer must need the fact and a chain: neither the premises alone nor any single premise with the fact force it.
  const premOnly = worlds.filter(v => premises.every(p => p.holds(v)))
  const deep = forcedAll.filter(l => !premOnly.every(l.holds) && premises.every(p => !worlds.filter(v => p.holds(v) && fact.holds(v)).every(l.holds)))
  if (!deep.length) reject('no multi-step conclusion')
  const forced = [deep[0]]
  const possible = literals.filter(l => !models.every(l.holds) && models.some(l.holds) && l.text !== fact.text)
  const impossible = literals.filter(l => !models.some(l.holds))
  if (possible.length < 2) reject('few traps')
  const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1)
  const right = cap(forced[0].text)
  // Narrate a unit-propagation chain from the fact.
  const known: Formula[] = [fact]
  const steps: string[] = []
  for (let guard = 0; guard < 4 && !known.some(k => k.text === forced[0].text); guard++) {
    let progressed = false
    for (const [pi, p] of premises.entries()) {
      const ws = worlds.filter(v => p.holds(v) && known.every(k => k.holds(v)))
      const fresh = literals.find(l => !known.some(k => k.text === l.text) && ws.length > 0 && ws.every(l.holds) && !worlds.filter(v => known.every(k => k.holds(v))).every(l.holds))
      if (fresh) {
        known.push(fresh)
        steps.push(`statement ${pi + 1} then gives "${fresh.text}"`)
        progressed = true
        break
      }
    }
    if (!progressed) break
  }
  const chain = known.some(k => k.text === forced[0].text) ? `Start from statement 4 ("${fact.text}"); ${steps.join('; ')}.` : `Checking the possible cases against all four statements shows that "${forced[0].text}" holds in every one.`
  const traps = shuffle(r, [...possible, ...impossible].map(l => cap(l.text)))
  emit({
    family: 'logic', topic: 'Statements and logical deduction',
    question: `Consider the following statements as true:\n${premises.map((p, i) => `${i + 1}. ${cap(p.text)}.`).join('\n')}\n4. ${cap(fact.text)}.\nWhich one of the following must be true?`,
    correct: right,
    traps,
    explanation: `${chain} So "${forced[0].text}" must be true. Each other option fails in at least one consistent case (it may be true, but it is not forced). Remember: "if X then Y" with Y false forces X false (contrapositive), but with X false it says nothing about Y.`,
    hint: 'Start from statement 4 and chain the conditionals, using contrapositives where needed; avoid "denying the antecedent".',
    seconds: 130,
    recompute: () => {
      const ms = worlds.filter(v => all.every(f => f.holds(v)))
      const shown = new Set([right, ...traps])
      const f = literals.filter(l => shown.has(cap(l.text)) && ms.every(l.holds))
      if (f.length !== 1) throw new Error('not unique')
      return cap(f[0].text)
    },
  })
}

// ===========================================================================
// Build
// ===========================================================================

produce('analogy', 9, 51001, numberAnalogy)
produce('analogy', 6, 52001, letterAnalogy)
produce('analogy', 6, 53001, wordAnalogy)
{
  let gi = 0
  produce('classify', 8, 54001, r => oddNumber(r, gi++))
}
produce('classify', 8, 55001, oddCluster)
produce('classify', 7, 56001, oddPair)
produce('rank', 4, 57001, rowExchange)
produce('rank', 2, 58001, classRank)
produce('rank', 12, 59001, rankPuzzle)
produce('venn', 12, 60001, vennThree)
produce('venn', 6, 61001, vennBounds)
produce('mathop', 6, 62001, r => symbolSub(r, false))
produce('mathop', 4, 63001, r => symbolSub(r, true))
produce('mathop', 8, 64001, whichSwap)
produce('mathop', 6, 65001, conditional)
produce('alpha', 6, 66001, alphaPosition)
produce('alpha', 8, 67001, alphaSeries)
produce('alpha', 5, 68001, alphaPairs)
produce('alpha', 5, 69001, alphaRearrange)
produce('logic', 5, 70001, knights)
produce('logic', 5, 71001, deduction)

export const severeTopicReasoningQuestions: Question[] = bank
export const severeTopicReasoningSelfCheck = (): string[] => checks.map(c => c.verify()).filter((x): x is string => x !== null)
