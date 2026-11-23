import type { Question } from '../data'
import { assemblyKey, fmt, gcd, int, options4, pick, rng, severe, shuffle, type Rand } from './severeKit'

/**
 * Severe arithmetic, topic top-up (ids `sva-simp-f<frame>-<n>`, `sva-alg-f<frame>-<n>`).
 *
 * Added so that every canonical AP topic has enough genuinely hard items for
 * topic-wise practice: simplification (BODMAS with "of", recurring decimals,
 * telescoping surds, surd ordering, indices, nested radicals, identities with
 * decimals, continued fractions) and algebraic identities. Every answer is
 * computed with exact rational arithmetic, and every trap is the result of a
 * named wrong method. The same frame/id scheme as severeArithmetic.ts keeps the
 * per-frame family cap working.
 */

type Draft = { topic: string; question: string; correct: string; traps: string[]; explanation: string; hint: string; seconds?: number }
type Frame = (r: Rand) => Draft | null

// ------------------------------------------------------------ exact rationals
type Q = { n: number; d: number }
const Q = (n: number, d = 1): Q => {
  if (d === 0 || !Number.isFinite(n) || !Number.isFinite(d)) throw new Error('bad rational')
  const s = d < 0 ? -1 : 1
  const g = gcd(Math.abs(n), Math.abs(d)) || 1
  return { n: (s * n) / g, d: Math.abs(d) / g }
}
const add = (a: Q, b: Q) => Q(a.n * b.d + b.n * a.d, a.d * b.d)
const sub = (a: Q, b: Q) => Q(a.n * b.d - b.n * a.d, a.d * b.d)
const mul = (a: Q, b: Q) => Q(a.n * b.n, a.d * b.d)
const div = (a: Q, b: Q) => Q(a.n * b.d, a.d * b.n)
const show = (q: Q) => (q.d === 1 ? String(q.n) : `${q.n}/${q.d}`)
const safe = (q: Q) => Math.abs(q.n) < 1e6 && q.d < 1e6

const TOPIC_SIMP = 'Simplification, surds and indices'
const TOPIC_ALG = 'Algebra and quadratic equations'

// --------------------------------------------------------------- simplification
const simplification: Frame[] = [
  // 1. BODMAS where "of" binds before ÷
  r => {
    const F = () => Q(int(r, 1, 9), pick(r, [2, 3, 4, 5, 6, 7, 8, 9, 12]))
    const [A, B, C, D, E, G] = [F(), F(), F(), F(), F(), F()]
    if ([A, B, C, D, E, G].some(x => x.d === 1)) return null
    const right = sub(add(div(A, mul(B, C)), mul(D, E)), G)
    const noOf = sub(add(mul(div(A, B), C), mul(D, E)), G)
    const leftToRight = sub(mul(add(mul(div(A, B), C), D), E), G)
    const signSlip = add(add(div(A, mul(B, C)), mul(D, E)), G)
    if (right.n <= 0 || right.d > 40 || ![noOf, leftToRight, signSlip].every(safe)) return null
    return {
      topic: TOPIC_SIMP,
      question: `Simplify: ${show(A)} ÷ ${show(B)} of ${show(C)} + ${show(D)} × ${show(E)} − ${show(G)}`,
      correct: show(right),
      traps: [show(noOf), show(leftToRight), show(signSlip)],
      explanation: `"Of" is worked before division: ${show(B)} of ${show(C)} = ${show(mul(B, C))}. Then ${show(A)} ÷ ${show(mul(B, C))} = ${show(div(A, mul(B, C)))} and ${show(D)} × ${show(E)} = ${show(mul(D, E))}. Finally ${show(div(A, mul(B, C)))} + ${show(mul(D, E))} − ${show(G)} = ${show(right)}. Treating "of" as an ordinary × after ÷ gives ${show(noOf)}; working strictly left to right gives ${show(leftToRight)}.`,
      hint: 'In BODMAS the O ("of") comes before D: multiply the "of" pair first.',
      seconds: 120,
    }
  },
  // 2. Pure and mixed recurring decimals
  r => {
    const ab = int(r, 12, 98), c = int(r, 1, 8), d = int(r, 1, 9), e = int(r, 1, 8)
    if (ab % 11 === 0 || c === d) return null
    const x = Q(ab, 99), y = Q(10 * c + d - c, 90), z = Q(e, 9)
    const right = sub(add(x, y), z)
    if (right.n <= 0) return null
    const terminating = sub(add(Q(ab, 100), Q(10 * c + d, 100)), Q(e, 10))
    const wrong99 = sub(add(x, Q(10 * c + d, 99)), z)
    const wrong90 = sub(add(Q(ab, 90), y), z)
    const s = String(ab)
    return {
      topic: TOPIC_SIMP,
      question: `Express as a fraction in its lowest terms: 0.${s}${s}${s}… + 0.${c}${d}${d}${d}… − 0.${e}${e}${e}…  (in each decimal the repeating block continues indefinitely)`,
      correct: show(right),
      traps: [show(wrong99), show(wrong90), show(terminating)],
      explanation: `0.${s}${s}… = ${s}/99 (two-digit pure repeating block). 0.${c}${d}${d}… is mixed: (${c}${d} − ${c})/90 = ${10 * c + d - c}/90. 0.${e}${e}… = ${e}/9. Sum: ${show(x)} + ${show(y)} − ${show(z)} = ${show(right)}. Writing the mixed decimal as ${c}${d}/99 or the pure one over 90 are the standard slips.`,
      hint: 'Pure recurring: block over as many 9s as its length. Mixed: (all digits − non-repeating part) over 9s followed by 0s.',
      seconds: 130,
    }
  },
  // 3. Telescoping surd sums
  r => {
    const step2 = r() < 0.4
    const a = int(r, 1, 6), b = int(r, a + 2, a + 9)
    if (step2) {
      // Σ 1/(√k + √(k+2)) for k = m, m+2, …, n with m = a², n + 2 = b², same parity
      const m = a * a, last = b * b - 2
      if ((last - m) % 2 !== 0 || last <= m) return null
      const terms = (last - m) / 2 + 1
      const right = Q(b - a, 2)
      return {
        topic: TOPIC_SIMP,
        question: `Find the value of 1/(√${m} + √${m + 2}) + 1/(√${m + 2} + √${m + 4}) + 1/(√${m + 4} + √${m + 6}) + … + 1/(√${last} + √${last + 2}).`,
        correct: show(right),
        traps: [String(b - a), String(b + a), show(Q(b + a, 2)), String(terms)],
        explanation: `Rationalise each term: 1/(√k + √(k+2)) = (√(k+2) − √k)/2. The sum telescopes to (√${last + 2} − √${m})/2 = (${b} − ${a})/2 = ${show(right)}. Forgetting the factor 1/2 from (k+2) − k = 2 gives ${b - a}; there are ${terms} terms, which is not the value.`,
        hint: 'Multiply each term by its conjugate; note the denominator becomes 2, not 1.',
        seconds: 130,
      }
    }
    const m = a * a, n = b * b - 1
    return {
      topic: TOPIC_SIMP,
      question: `Find the value of 1/(√${m} + √${m + 1}) + 1/(√${m + 1} + √${m + 2}) + … + 1/(√${n} + √${n + 1}).`,
      correct: String(b - a),
      traps: [String(b + a), String(n - m + 1), String(b * b - a * a), show(Q(b - a, 2))],
      explanation: `Each term 1/(√k + √(k+1)) = √(k+1) − √k after multiplying by the conjugate. All middle terms cancel, leaving √${n + 1} − √${m} = ${b} − ${a} = ${b - a}. ${n - m + 1} is only the number of terms.`,
      hint: 'Rationalise one term and look for cancellation.',
      seconds: 110,
    }
  },
  // 4. Ordering surds of different index
  r => {
    const idx = shuffle(r, [2, 3, 4, 6]).slice(0, 4)
    const rad = idx.map(i => (i === 2 ? int(r, 2, 7) : i === 3 ? int(r, 3, 15) : i === 4 ? int(r, 5, 40) : int(r, 20, 300)))
    const val = idx.map((i, k) => rad[k] ** (1 / i))
    const sorted = [...val].sort((x, y) => y - x)
    for (let k = 1; k < 4; k++) if (sorted[k - 1] / sorted[k] < 1.004) return null
    const sym = (i: number, a: number) => (i === 2 ? `√${a}` : i === 3 ? `∛${a}` : i === 4 ? `∜${a}` : `⁶√${a}`)
    const items = idx.map((i, k) => ({ s: sym(i, rad[k]), v: val[k], a: rad[k], i }))
    const desc = [...items].sort((x, y) => y.v - x.v).map(x => x.s)
    const byRad = [...items].sort((x, y) => y.a - x.a).map(x => x.s)
    const byIdx = [...items].sort((x, y) => x.i - y.i).map(x => x.s)
    const swap = [...desc]
    ;[swap[1], swap[2]] = [swap[2], swap[1]]
    const swap2 = [...desc]
    ;[swap2[0], swap2[1]] = [swap2[1], swap2[0]]
    const L = 12
    const powers = items.map(x => `${x.s} = ${x.a}^(1/${x.i}) → raised to ${L}: ${x.a}^${L / x.i} = ${(x.a ** (L / x.i)).toLocaleString('en-IN')}`)
    return {
      topic: TOPIC_SIMP,
      question: `Which of the following arranges ${items.map(x => x.s).join(', ')} in descending order?`,
      correct: desc.join(' > '),
      traps: [byRad.join(' > '), byIdx.join(' > '), swap.join(' > '), swap2.join(' > ')],
      explanation: `Bring all to a common index: LCM of ${idx.join(', ')} is ${L}. ${powers.join('; ')}. Comparing these whole numbers gives ${desc.join(' > ')}. Ordering by radicand or by root index ignores that both change the value.`,
      hint: 'Raise every surd to the LCM of the root indices and compare the resulting integers.',
      seconds: 130,
    }
  },
  // 5. Indices: equate exponents after converting to a common base
  r => {
    const [b, b2, b3] = pick(r, [[2, 4, 8], [3, 9, 27]] as const)
    const p = int(r, 1, 4), rr = int(r, 1, 3), t = int(r, 1, 3), q = int(r, -3, 5), s = int(r, -3, 5), u = int(r, -2, 5)
    const den = p + 2 * rr - 3 * t
    if (den === 0) return null
    const x = Q(3 * u - q - 2 * s, den)
    const naiveDen = p + rr - t
    if (naiveDen === 0) return null
    const naive = Q(u - q - s, naiveDen)
    const half = Q(3 * u - q - s, p + rr - 3 * t || 97)
    const slip = Q(3 * u + q - 2 * s, den)
    if (x.d > 6 || x.n === 0) return null
    const lin = (a: number, c: number) => `${a === 1 ? '' : a}x ${c < 0 ? '−' : '+'} ${Math.abs(c)}`
    return {
      topic: TOPIC_SIMP,
      question: `If ${b}^(${lin(p, q)}) × ${b2}^(${lin(rr, s)}) = ${b3}^(${lin(t, u)}), what is the value of x?`,
      correct: show(x),
      traps: [show(naive), show(half), show(slip)],
      explanation: `Write everything with base ${b}: ${b2} = ${b}², ${b3} = ${b}³. Then ${b}^(${lin(p, q)}) × ${b}^(${2 * rr}x ${2 * s < 0 ? '−' : '+'} ${Math.abs(2 * s)}) = ${b}^(${3 * t}x ${3 * u < 0 ? '−' : '+'} ${Math.abs(3 * u)}). Adding exponents: ${p + 2 * rr}x ${q + 2 * s < 0 ? '−' : '+'} ${Math.abs(q + 2 * s)} = ${3 * t}x ${3 * u < 0 ? '−' : '+'} ${Math.abs(3 * u)}, so x = ${show(x)}. Equating the exponents without changing the bases gives ${show(naive)}.`,
      hint: 'Convert all bases to the same prime before comparing exponents.',
      seconds: 110,
    }
  },
  // 6. Nested radicals that collapse from the inside out
  r => {
    const s1 = int(r, 2, 9), s2 = int(r, 3, 10), s3 = int(r, 3, 11), s4 = int(r, 4, 13)
    const d = s1 * s1, c = s2 * s2 - s1, b = s3 * s3 - s2, a = s4 * s4 - s3
    if (c <= 0 || b <= 0 || a <= 0) return null
    const outerOnly = Math.sqrt(a)
    return {
      topic: TOPIC_SIMP,
      question: `Find the value of √(${a} + √(${b} + √(${c} + √${d}))).`,
      correct: String(s4),
      traps: [String(s4 + 1), String(s4 - 1), String(s3), String(Math.round(outerOnly) === s4 ? s4 + 2 : Math.round(outerOnly))],
      explanation: `Work from the innermost root: √${d} = ${s1}; √(${c} + ${s1}) = √${c + s1} = ${s2}; √(${b} + ${s2}) = √${b + s2} = ${s3}; √(${a} + ${s3}) = √${a + s3} = ${s4}. Stopping a level early gives ${s3}.`,
      hint: 'Evaluate the innermost root first and move outwards.',
      seconds: 100,
    }
  },
  // 7. Algebraic identities hidden in decimals
  r => {
    const a = int(r, 51, 97) / 100, bb = int(r, 11, 49) / 100
    const A = fmt(a), B = fmt(bb)
    const kind = int(r, 0, 2)
    const round = (n: number) => fmt(Number(n.toFixed(4)))
    if (kind === 0)
      return {
        topic: TOPIC_SIMP,
        question: `Simplify: (${A} × ${A} × ${A} + ${B} × ${B} × ${B}) ÷ (${A} × ${A} − ${A} × ${B} + ${B} × ${B})`,
        correct: round(a + bb),
        traps: [round(a - bb), round(a * a + bb * bb), round((a + bb) ** 2), round(a * bb)],
        explanation: `With a = ${A}, b = ${B} this is (a³ + b³)/(a² − ab + b²) = a + b = ${round(a + bb)}, since a³ + b³ = (a + b)(a² − ab + b²).`,
        hint: 'Recognise a³ + b³ and its factor a² − ab + b².',
        seconds: 90,
      }
    if (kind === 1)
      return {
        topic: TOPIC_SIMP,
        question: `Simplify: (${A} × ${A} × ${A} − ${B} × ${B} × ${B}) ÷ (${A} × ${A} + ${A} × ${B} + ${B} × ${B})`,
        correct: round(a - bb),
        traps: [round(a + bb), round(a * a - bb * bb), round((a - bb) ** 2), round(a * bb)],
        explanation: `With a = ${A}, b = ${B}: (a³ − b³)/(a² + ab + b²) = a − b = ${round(a - bb)}.`,
        hint: 'a³ − b³ = (a − b)(a² + ab + b²).',
        seconds: 90,
      }
    return {
      topic: TOPIC_SIMP,
      question: `Simplify: (${A} × ${A} − ${B} × ${B}) ÷ (${A} + ${B}) + (${A} × ${A} × ${A} + ${B} × ${B} × ${B}) ÷ (${A} × ${A} − ${A} × ${B} + ${B} × ${B})`,
      correct: round(2 * a),
      traps: [round(2 * bb), round(a + bb), round(a * a + bb * bb), round(2 * (a + bb))],
      explanation: `With a = ${A}, b = ${B}: (a² − b²)/(a + b) = a − b and (a³ + b³)/(a² − ab + b²) = a + b. The sum is 2a = ${round(2 * a)}.`,
      hint: 'Reduce each quotient with its identity before adding.',
      seconds: 110,
    }
  },
  // 8. Continued fractions
  r => {
    const a = int(r, 1, 5), b = int(r, 1, 6), c = int(r, 2, 7), lead = int(r, 1, 3)
    const right = add(Q(lead), div(Q(1), add(Q(a), div(Q(1), add(Q(b), Q(1, c))))))
    const flat = add(Q(lead), Q(1, a + b + c))
    const sum = add(add(add(Q(lead), Q(1, a)), Q(1, b)), Q(1, c))
    const midSlip = add(Q(lead), div(Q(1), add(Q(a), Q(1, b + c))))
    return {
      topic: TOPIC_SIMP,
      question: `Simplify: ${lead} + 1/(${a} + 1/(${b} + 1/${c}))`,
      correct: show(right),
      traps: [show(midSlip), show(flat), show(sum)],
      explanation: `Start at the bottom: ${b} + 1/${c} = ${show(add(Q(b), Q(1, c)))}; its reciprocal is ${show(div(Q(1), add(Q(b), Q(1, c))))}. Then ${a} + that = ${show(add(Q(a), div(Q(1), add(Q(b), Q(1, c)))))}, whose reciprocal is ${show(div(Q(1), add(Q(a), div(Q(1), add(Q(b), Q(1, c))))))}. Adding ${lead} gives ${show(right)}. Adding ${b} and ${c} before inverting gives ${show(midSlip)}.`,
      hint: 'Collapse the deepest level first and invert one level at a time.',
      seconds: 110,
    }
  },
  // 9. Close fractions: difference between the largest and the smallest
  r => {
    const fr4: Q[] = []
    const seen = new Set<string>()
    while (fr4.length < 4) {
      const n = int(r, 3, 15), k = int(r, 1, 4)
      const f = Q(n, n + k)
      if (!seen.has(show(f)) && f.d <= 25) {
        seen.add(show(f))
        fr4.push(f)
      }
    }
    const v = fr4.map(f => f.n / f.d)
    const iMax = v.indexOf(Math.max(...v)), iMin = v.indexOf(Math.min(...v))
    const sortedIdx = v.map((_, i) => i).sort((x, y) => v[y] - v[x])
    if (iMax === 3 && iMin === 0) return null
    const right = sub(fr4[iMax], fr4[iMin])
    const listed = sub(fr4[0], fr4[3])
    const top2 = sub(fr4[sortedIdx[0]], fr4[sortedIdx[1]])
    const byNum = [...fr4].sort((x, y) => y.n - x.n)
    const numTrap = sub(byNum[0], byNum[3])
    return {
      topic: TOPIC_SIMP,
      question: `What is the difference between the largest and the smallest of the fractions ${fr4.map(show).join(', ')}?`,
      correct: show(right),
      traps: [show(top2), show(Q(Math.abs(listed.n), listed.d)), show(Q(Math.abs(numTrap.n), numTrap.d)), show(add(right, Q(1, 100)))],
      explanation: `Compare by cross-multiplication (or by 1 − fraction, since each is n/(n+k)): the order is ${sortedIdx.map(i => show(fr4[i])).join(' > ')}. Largest − smallest = ${show(fr4[iMax])} − ${show(fr4[iMin])} = ${show(right)}. Choosing by the largest numerator, or subtracting the first and last listed, gives the traps.`,
      hint: 'For fractions just below 1, compare the gaps 1 − n/(n+k) = k/(n+k): the smaller gap is the larger fraction.',
      seconds: 120,
    }
  },
  // 10. Fractional indices of perfect powers
  r => {
    const powers: [number, number, number][] = [[4, 2, 2], [8, 2, 3], [16, 2, 4], [32, 2, 5], [64, 2, 6], [9, 3, 2], [27, 3, 3], [81, 3, 4], [243, 3, 5], [25, 5, 2], [125, 5, 3], [625, 5, 4]]
    const exps = [0.2, 0.25, 0.4, 0.5, 0.6, 0.75, 0.8, 1.2, 1.25, 1.5]
    const terms: { v: number; p: number; k: number; e: number }[] = []
    for (let i = 0; i < 3; i++) {
      const [v, p, k] = pick(r, powers)
      const fits = exps.filter(x => Math.abs(k * x - Math.round(k * x)) < 1e-9)
      if (!fits.length) return null
      const e = pick(r, fits) * (r() < 0.45 ? -1 : 1)
      terms.push({ v, p, k, e })
    }
    if (new Set(terms.map(t => t.v)).size < 3 || !terms.some(t => t.e < 0)) return null
    const exp = (t: { k: number; e: number }) => Math.round(t.k * t.e)
    const val = (t: { p: number; k: number; e: number }, flip = false) => {
      const x = flip ? Math.abs(exp(t)) : exp(t)
      return x >= 0 ? Q(t.p ** x) : Q(1, t.p ** -x)
    }
    const right = div(mul(val(terms[0]), val(terms[1])), val(terms[2]))
    const noSign = div(mul(val(terms[0], true), val(terms[1], true)), val(terms[2], true))
    const allMul = mul(mul(val(terms[0]), val(terms[1])), val(terms[2]))
    const flipLast = div(Q(1), right)
    const midSign = div(mul(val(terms[0]), val(terms[1], true)), val(terms[2]))
    if (![right, noSign, allMul, flipLast, midSign].every(safe)) return null
    const e = (x: number) => (x < 0 ? `(−${fmt(-x)})` : fmt(x))
    return {
      topic: TOPIC_SIMP,
      question: `Find the value of (${terms[0].v})^${e(terms[0].e)} × (${terms[1].v})^${e(terms[1].e)} ÷ (${terms[2].v})^${e(terms[2].e)}.`,
      correct: show(right),
      traps: [show(noSign), show(allMul), show(flipLast), show(midSign)],
      explanation: terms.map(t => `${t.v} = ${t.p}^${t.k}, so (${t.v})^${e(t.e)} = ${t.p}^${exp(t)} = ${show(val(t))}`).join('; ') + `. Hence ${show(val(terms[0]))} × ${show(val(terms[1]))} ÷ ${show(val(terms[2]))} = ${show(right)}. Ignoring a negative sign in an index, multiplying by the last term instead of dividing, or inverting the result, gives the traps.`,
      hint: 'Write each base as a prime power, multiply the indices, and keep track of negative indices.',
      seconds: 120,
    }
  },
]

// --------------------------------------------------------------------- algebra
const algebra: Frame[] = [
  // 1. x + 1/x = k → higher symmetric powers
  r => {
    const k = int(r, 3, 9), want = pick(r, [3, 4, 5] as const)
    const p2 = k * k - 2, p3 = k ** 3 - 3 * k
    const right = want === 3 ? p3 : want === 4 ? p2 * p2 - 2 : p2 * p3 - k
    const traps = want === 3 ? [k ** 3, k ** 3 + 3 * k, k ** 3 - 3] : want === 4 ? [p2 * p2, k ** 4 - 2, p2 * p2 + 2] : [p2 * p3, k ** 5 - 5 * k, p2 * p3 + k]
    const sup = { 3: '³', 4: '⁴', 5: '⁵' }[want]
    return {
      topic: TOPIC_ALG,
      question: `If x + 1/x = ${k}, what is the value of x${sup} + 1/x${sup}?`,
      correct: String(right),
      traps: traps.map(String),
      explanation: want === 3
        ? `x³ + 1/x³ = (x + 1/x)³ − 3(x + 1/x) = ${k}³ − 3×${k} = ${right}.`
        : want === 4
          ? `x² + 1/x² = ${k}² − 2 = ${p2}; x⁴ + 1/x⁴ = (x² + 1/x²)² − 2 = ${p2}² − 2 = ${right}.`
          : `x² + 1/x² = ${p2}, x³ + 1/x³ = ${p3}. (x² + 1/x²)(x³ + 1/x³) = x⁵ + 1/x⁵ + x + 1/x, so x⁵ + 1/x⁵ = ${p2}×${p3} − ${k} = ${right}.`,
      hint: 'Build up from x + 1/x by squaring or cubing, and subtract the cross terms.',
      seconds: 100,
    }
  },
  // 2. a + b + c and a² + b² + c² → a³ + b³ + c³ − 3abc
  r => {
    const a = int(r, -4, 9), b = int(r, -4, 9), c = int(r, 1, 9)
    const s = a + b + c, t = a * a + b * b + c * c
    if (s <= 0) return null
    const p = (s * s - t) / 2
    const right = s * (t - p)
    const traps = [s * (t + p), s ** 3 - 3 * p, s * t]
    if (traps.includes(right)) return null
    return {
      topic: TOPIC_ALG,
      question: `If a + b + c = ${s} and a² + b² + c² = ${t}, find the value of a³ + b³ + c³ − 3abc.`,
      correct: String(right),
      traps: traps.map(String),
      explanation: `ab + bc + ca = [(a + b + c)² − (a² + b² + c²)]/2 = (${s * s} − ${t})/2 = ${p}. Then a³ + b³ + c³ − 3abc = (a + b + c)(a² + b² + c² − ab − bc − ca) = ${s} × (${t} − ${p}) = ${right}.`,
      hint: 'Find ab + bc + ca first, then use the factorised identity.',
      seconds: 110,
    }
  },
  // 3. x − 1/x = k → x⁴ + 1/x⁴
  r => {
    const k = int(r, 2, 8)
    const p2 = k * k + 2, right = p2 * p2 - 2
    return {
      topic: TOPIC_ALG,
      question: `If x − 1/x = ${k}, what is the value of x⁴ + 1/x⁴?`,
      correct: String(right),
      traps: [String(k ** 4 + 2), String(p2 * p2), String((k * k - 2) ** 2 - 2)],
      explanation: `(x − 1/x)² = x² − 2 + 1/x², so x² + 1/x² = ${k}² + 2 = ${p2}. Squaring again: x⁴ + 1/x⁴ = ${p2}² − 2 = ${right}. Using −2 instead of +2 at the first step (as for x + 1/x) gives ${(k * k - 2) ** 2 - 2}.`,
      hint: 'With a minus sign inside, the cross term is added back, not subtracted.',
      seconds: 100,
    }
  },
  // 4. Linear pair → a derived expression
  r => {
    const x = int(r, -6, 9), y = int(r, -6, 9)
    if (x === y || x === 0 || y === 0) return null
    const p = int(r, 2, 7), q = int(r, 2, 7), u = int(r, 2, 7), v = int(r, 2, 7)
    if (p * v + q * u === 0) return null
    const m = p * x + q * y, n = u * x - v * y
    const kind = int(r, 0, 1)
    const f = (X: number, Y: number) => (kind === 0 ? 3 * X - 2 * Y + X * Y : X * X + X * Y - 2 * Y)
    const right = f(x, y), swapped = f(y, x)
    const sx = -x, sy = -y
    const signTrap = f(sx, y), other = f(x, sy)
    if (new Set([right, swapped, signTrap, other]).size < 4) return null
    const expr = kind === 0 ? '3x − 2y + xy' : 'x² + xy − 2y'
    return {
      topic: TOPIC_ALG,
      question: `If ${p}x + ${q}y = ${m} and ${u}x − ${v}y = ${n}, what is the value of ${expr}?`,
      correct: String(right),
      traps: [String(swapped), String(signTrap), String(other)],
      explanation: `Eliminate y: multiply the first equation by ${v} and the second by ${q} and add: ${p * v + q * u}x = ${m * v + n * q}, so x = ${x}. Substituting, ${q}y = ${m} − ${p * x} = ${m - p * x}, so y = ${y}. With x = ${x} and y = ${y}, ${expr} = ${right}. Swapping x and y gives ${swapped}.`,
      hint: 'Solve the pair exactly, then substitute carefully with signs.',
      seconds: 120,
    }
  },
  // 5. Ratio substitution into a rational expression
  r => {
    const p = int(r, 2, 9), q = int(r, 2, 9)
    if (gcd(p, q) !== 1) return null
    const k1 = int(r, 2, 5), k2 = int(r, 1, 4)
    const f = (a: number, b: number) => Q(k1 * a * a - k2 * b * b, a * a + a * b)
    const right = f(p, q)
    const swap = f(q, p)
    const linear = Q(k1 * p - k2 * q, p + q)
    const noCross = Q(k1 * p * p - k2 * q * q, p * p)
    if (right.n === 0) return null
    return {
      topic: TOPIC_ALG,
      question: `If a : b = ${p} : ${q}, find the value of (${k1}a² − ${k2 === 1 ? '' : k2}b²) / (a² + ab).`,
      correct: show(right),
      traps: [show(swap), show(linear), show(noCross)],
      explanation: `Put a = ${p}k, b = ${q}k; k² cancels. Numerator: ${k1}×${p * p} − ${k2}×${q * q} = ${k1 * p * p - k2 * q * q}. Denominator: ${p * p} + ${p * q} = ${p * p + p * q}. Value = ${show(right)}. Substituting a = ${q}, b = ${p} reverses the ratio and gives ${show(swap)}.`,
      hint: 'A homogeneous expression depends only on the ratio: substitute a = pk, b = qk.',
      seconds: 100,
    }
  },
]

export const SEVERE_TOPIC_ARITHMETIC_FAMILIES: Array<[string, Frame[], number]> = [
  ['simp', simplification, 30],
  ['alg', algebra, 15],
]

const build = (): Question[] => {
  const out: Question[] = []
  const stems = new Set<string>()
  SEVERE_TOPIC_ARITHMETIC_FAMILIES.forEach(([key, frames, count], familyIndex) => {
    const r = rng(0x70b1c + familyIndex * 104729)
    let made = 0, attempts = 0
    const perFrame = frames.map(() => 0)
    while (made < count) {
      if (++attempts > count * 2000) throw new Error(`sva-${key}: could only build ${made}/${count}`)
      const frameIndex = made % frames.length
      let draft: Draft | null
      try {
        draft = frames[frameIndex](r)
      } catch {
        continue
      }
      if (!draft) continue
      let choice
      try {
        choice = options4(draft.correct, draft.traps, made * 3 + familyIndex + 1)
      } catch {
        continue
      }
      const stemKey = assemblyKey(draft.question, [])
      if (stems.has(draft.question) || stems.has(stemKey)) continue
      stems.add(draft.question)
      stems.add(stemKey)
      made++
      perFrame[frameIndex]++
      out.push(severe({
        id: `sva-${key}-f${frameIndex + 1}-${String(perFrame[frameIndex]).padStart(2, '0')}`,
        subject: 'Arithmetic',
        topic: draft.topic,
        question: draft.question,
        options: choice.options,
        answer: choice.answer,
        explanation: draft.explanation,
        hint: draft.hint,
        seconds: draft.seconds,
      }))
    }
  })
  return out
}

export const severeTopicArithmeticQuestions: Question[] = build()
