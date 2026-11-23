import type { Question } from '../data'
import { int, options4, pick, rng, severe, shuffle, type Rand } from './severeKit'

/**
 * Severe reasoning bank (ids `svr-<family>-<n>`).
 *
 * Every answer is computed in code. Arrangement, floor, scheduling and
 * family puzzles are produced by drawing a hidden solution, adding true clues
 * until a brute-force solver over the whole search space finds exactly one
 * solution, and only then asking questions about that solution. Each item
 * keeps a `recompute` closure that re-solves from the stored clue predicates;
 * `severeReasoningSelfCheck()` runs them all.
 */

// ---------------------------------------------------------------------------
// Shared plumbing
// ---------------------------------------------------------------------------

type Check = { id: string; verify: () => string | null }
const bank: Question[] = []
const checks: Check[] = []
const familyCount: Record<string, number> = {}
const seenText = new Set<string>()

const posRand = rng(20261124)
let posQueue: number[] = []
const nextPos = () => {
  if (posQueue.length === 0) posQueue = shuffle(posRand, [0, 1, 2, 3])
  return posQueue.pop() as number
}

type Emit = {
  family: string
  topic: string
  question: string
  correct: string
  traps: string[]
  explanation: string
  hint: string
  seconds: number
  recompute: () => string
}

const emit = (e: Emit) => {
  if (seenText.has(e.question)) throw new Error('duplicate question text')
  const { options, answer } = options4(e.correct, e.traps, nextPos())
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

/** Runs a generator over successive seeds until `want` items are emitted (or attempts run out). */
const produce = (family: string, want: number, seed0: number, attempt: (r: Rand, seed: number) => void, maxTries = want * 12) => {
  const start = familyCount[family] ?? 0
  for (let t = 0; t < maxTries && (familyCount[family] ?? 0) - start < want; t++) {
    const seed = seed0 + t * 7919
    try {
      attempt(rng(seed), seed)
    } catch {
      // a rejected draw (non-unique puzzle, colliding traps): try the next seed
    }
  }
}

const range = (n: number) => Array.from({ length: n }, (_, i) => i)
const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1)
const ORDW = ['zeroth', 'first', 'second', 'third', 'fourth', 'fifth', 'sixth', 'seventh', 'eighth', 'ninth']
const NUMW = ['no', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight']
const nth = (k: number) => `${k}${k % 100 >= 11 && k % 100 <= 13 ? 'th' : k % 10 === 1 ? 'st' : k % 10 === 2 ? 'nd' : k % 10 === 3 ? 'rd' : 'th'}`
const mod = (a: number, n: number) => ((a % n) + n) % n
const pair = (a: string, b: string) => [a, b].sort().join(' and ')
const listAnd = (xs: string[]) => (xs.length <= 1 ? xs.join('') : `${xs.slice(0, -1).join(', ')} and ${xs[xs.length - 1]}`)

const permCache = new Map<number, number[][]>()
const perms = (n: number): number[][] => {
  const hit = permCache.get(n)
  if (hit) return hit
  const out: number[][] = []
  const a = range(n)
  const rec = (k: number) => {
    if (k === n) {
      out.push([...a])
      return
    }
    for (let i = k; i < n; i++) {
      ;[a[k], a[i]] = [a[i], a[k]]
      rec(k + 1)
      ;[a[k], a[i]] = [a[i], a[k]]
    }
  }
  rec(0)
  permCache.set(n, out)
  return out
}

/** Weighted shuffle: heavier clue types tend to come first. */
const wshuffle = <T extends { w: number }>(r: Rand, items: readonly T[]): T[] =>
  items
    .map(it => ({ it, key: Math.pow(r(), 1 / it.w) }))
    .sort((a, b) => b.key - a.key)
    .map(x => x.it)

// ---------------------------------------------------------------------------
// Generic uniqueness engine over an indexed search space
// ---------------------------------------------------------------------------

type Clue = { text: string; w: number; test: (k: number) => boolean }

const solveIdx = (N: number, clues: readonly Clue[]): number[] => {
  const out: number[] = []
  for (let k = 0; k < N; k++) {
    let ok = true
    for (const c of clues)
      if (!c.test(k)) {
        ok = false
        break
      }
    if (ok) out.push(k)
  }
  return out
}

const filterIdx = (N: number, cands: number[] | null, test: (k: number) => boolean) => {
  const next: number[] = []
  if (cands) {
    for (const k of cands) if (test(k)) next.push(k)
  } else for (let k = 0; k < N; k++) if (test(k)) next.push(k)
  return next
}

/**
 * Greedily adds true clues until exactly one solution remains, then (optionally)
 * removes clues that became redundant. Returns null when the pool cannot force
 * uniqueness within `maxClues`.
 */
type Chosen = { clues: Clue[] }
/**
 * Greedily adds true clues until exactly one solution remains, then (optionally)
 * removes clues that became redundant. Returns null when the pool cannot force
 * uniqueness within `maxClues`.
 */
const chooseClues = (N: number, pool: readonly Clue[], r: Rand, prune: boolean, maxClues: number, minClues = 0): Chosen | null => {
  const order = wshuffle(r, pool)
  let cands: number[] | null = null
  let chosen: Clue[] = []
  for (const c of order) {
    const next = filterIdx(N, cands, c.test)
    const before: number = cands ? cands.length : N
    if (next.length > 0 && next.length < before) {
      chosen.push(c)
      cands = next
      if (next.length === 1) break
    }
  }
  if (!cands || cands.length !== 1 || chosen.length < minClues) return null
  // Redundancy pruning: clue j is redundant iff no state violates clue j alone.
  while (prune && chosen.length > 1) {
    const only = new Int32Array(chosen.length)
    for (let k = 0; k < N; k++) {
      let fails = 0
      let which = -1
      for (let j = 0; j < chosen.length; j++)
        if (!chosen[j].test(k)) {
          fails++
          which = j
          if (fails > 1) break
        }
      if (fails === 1) only[which]++
    }
    const drop = chosen.findIndex((_, j) => only[j] === 0)
    if (drop < 0) break
    chosen = chosen.filter((_, j) => j !== drop)
  }
  if (chosen.length > maxClues) return null
  return { clues: chosen }
}

type Facts = { size: number; add: (k: number, cnt: Int32Array) => void; label: (f: number) => string }

/**
 * Builds the deduction chain: clue by clue (most restrictive first when
 * `greedy`), which facts become fixed.
 */
const narrate = (N: number, chosen: Chosen, shown: readonly Clue[], facts: Facts, greedy = true) => {
  const left = [...chosen.clues]
  let cands: number[] | null = null
  const known = new Uint8Array(facts.size)
  const steps: string[] = []
  while (left.length) {
    let bestI = 0
    if (greedy && left.length > 1) {
      const size = cands ? cands.length : N
      const stride = Math.max(1, Math.floor(size / 3000))
      let bestCount = Infinity
      left.forEach((c, li) => {
        let n = 0
        for (let t = 0; t < size; t += stride) if (c.test(cands ? cands[t] : t)) n++
        if (n < bestCount) {
          bestCount = n
          bestI = li
        }
      })
    }
    const clue = left.splice(bestI, 1)[0]
    cands = filterIdx(N, cands, clue.test)
    const cnt = new Int32Array(facts.size)
    for (const k of cands) facts.add(k, cnt)
    const fresh: string[] = []
    for (let f = 0; f < facts.size; f++)
      if (cnt[f] === cands.length && !known[f]) {
        known[f] = 1
        fresh.push(facts.label(f))
      }
    const no = shown.indexOf(clue) + 1
    steps.push(fresh.length ? `clue ${no} fixes ${listAnd(fresh)}` : `clue ${no} narrows it to ${cands.length} possible cases`)
  }
  return `Deduction: ${steps.join('; ')}.`
}

const clueBlock = (clues: readonly { text: string }[]) => clues.map((c, i) => `(${i + 1}) ${c.text}.`).join(' ')

// ---------------------------------------------------------------------------
// Name pools
// ---------------------------------------------------------------------------

const NAME_SETS = [
  ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'],
  ['P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W'],
  ['J', 'K', 'L', 'M', 'N', 'O', 'P', 'Q'],
  ['Arun', 'Bhanu', 'Chitra', 'Divya', 'Eswar', 'Farah', 'Gopi', 'Hema'],
  ['Kiran', 'Latha', 'Mohan', 'Nandu', 'Om', 'Pavani', 'Ravi', 'Sita'],
  ['Teja', 'Usha', 'Varun', 'Winnie', 'Yamini', 'Zoya', 'Bala', 'Charan'],
  ['L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S'],
  ['Anil', 'Bindu', 'Chandu', 'Deepa', 'Ganesh', 'Indu', 'Jaya', 'Kalyan'],
]

// ---------------------------------------------------------------------------
// Seating (linear rows and circles) — shared state model
// ---------------------------------------------------------------------------

type Side = 'left' | 'right'
const other = (s: Side): Side => (s === 'left' ? 'right' : 'left')
/** seat[i] = person in seat i; at[p] = seat of p; face[p] = +1 (north / centre) or −1 (south / outside). */
type Seats = { seat: number[]; at: number[]; face: number[] }

const seatCache = new Map<string, Seats[]>()
const seatUniverse = (n: number, mixed: boolean, circular: boolean): Seats[] => {
  const key = `${n}|${mixed}|${circular}`
  const hit = seatCache.get(key)
  if (hit) return hit
  const out: Seats[] = []
  const base = circular ? perms(n - 1).map(p => [0, ...p.map(x => x + 1)]) : perms(n)
  const faces = range(mixed ? 1 << n : 1).map(m => range(n).map(p => (!mixed || (m >> p) & 1 ? 1 : -1)))
  for (const seat of base) {
    const at = new Array<number>(n)
    seat.forEach((p, i) => (at[p] = i))
    for (const face of faces) out.push({ seat, at, face })
  }
  seatCache.set(key, out)
  return out
}

type Geo = {
  n: number
  circular: boolean
  mixed: boolean
  /** Person k places to `side` of p, from p's own facing; −1 if off the row. */
  nbr: (s: Seats, p: number, side: Side, k: number) => number
}

const rowGeo = (n: number, mixed: boolean): Geo => ({
  n,
  circular: false,
  mixed,
  nbr: (s, p, side, k) => {
    const i = s.at[p] + k * (side === 'right' ? 1 : -1) * s.face[p]
    return i >= 0 && i < n ? s.seat[i] : -1
  },
})
// Facing the centre, a person's left is clockwise (+1 seat index).
const circleGeo = (n: number, mixed: boolean): Geo => ({
  n,
  circular: true,
  mixed,
  nbr: (s, p, side, k) => s.seat[mod(s.at[p] + k * (side === 'left' ? 1 : -1) * s.face[p], n)],
})

const posPhrase = (k: number, side: Side) => (k === 1 ? `immediately to the ${side} of` : `${ORDW[k]} to the ${side} of`)
const relWords = (k: number, side: Side) => `${k === 1 ? 'Immediately' : cap(ORDW[k])} to the ${side}`

type Pred = { text: string; w: number; pred: (s: Seats) => boolean }

const seatPool = (h: Seats, g: Geo, N: string[], r: Rand): Pred[] => {
  const { n, circular, mixed } = g
  const out: Pred[] = []
  const add = (text: string, w: number, pred: (s: Seats) => boolean) => {
    if (!pred(h)) throw new Error(`false clue generated: ${text}`)
    out.push({ text, w, pred })
  }
  const kmax = circular ? Math.min(3, Math.floor((n - 1) / 2)) : 3
  for (let x = 0; x < n; x++)
    for (let y = 0; y < n; y++) {
      if (x === y) continue
      for (const side of ['left', 'right'] as Side[])
        for (let k = 1; k <= kmax; k++)
          if (g.nbr(h, y, side, k) === x) {
            add(`${N[x]} sits ${posPhrase(k, side)} ${N[y]}`, circular ? 1.1 : k === 1 ? 1.4 : 2, s => g.nbr(s, y, side, k) === x)
            if (circular && k >= 2 && r() < 0.5) add(`Only ${NUMW[k - 1]} ${k - 1 === 1 ? 'person sits' : 'persons sit'} between ${N[y]} and ${N[x]} when counted from the ${side} of ${N[y]}`, 2, s => g.nbr(s, y, side, k) === x)
          }
      if (x < y) {
        if (!circular) {
          const gap = Math.abs(h.at[x] - h.at[y]) - 1
          if (gap === 0) add(`${N[x]} and ${N[y]} sit next to each other`, 1, s => Math.abs(s.at[x] - s.at[y]) === 1)
          else {
            add(`Exactly ${NUMW[gap]} ${gap === 1 ? 'person sits' : 'persons sit'} between ${N[x]} and ${N[y]}`, 2, s => Math.abs(s.at[x] - s.at[y]) - 1 === gap)
            if (r() < 0.25) add(`${N[x]} does not sit next to ${N[y]}`, 0.5, s => Math.abs(s.at[x] - s.at[y]) !== 1)
          }
        } else {
          const d = mod(h.at[x] - h.at[y], n)
          if (n % 2 === 0 && d === n / 2) add(`${N[x]} sits directly opposite ${N[y]}`, 1.6, s => mod(s.at[x] - s.at[y], n) === n / 2)
          if (d === 1 || d === n - 1) add(`${N[x]} is an immediate neighbour of ${N[y]}`, 1.8, s => [1, n - 1].includes(mod(s.at[x] - s.at[y], n)))
          else if (r() < 0.5) add(`${N[x]} is not an immediate neighbour of ${N[y]}`, 0.9, s => ![1, n - 1].includes(mod(s.at[x] - s.at[y], n)))
        }
        if (mixed) {
          const same = h.face[x] === h.face[y]
          if (r() < 0.35) add(`${N[x]} and ${N[y]} face ${same ? 'the same direction' : 'opposite directions'}`, 1.4, s => (s.face[x] === s.face[y]) === same)
        }
      }
    }
  // indirect two-hop clues (only meaningful when facings differ; otherwise they collapse to one hop)
  if (mixed)
  for (let x = 0; x < n; x++)
    for (const s1 of ['left', 'right'] as Side[])
      for (let k1 = 1; k1 <= 2; k1++) {
        const q = g.nbr(h, x, s1, k1)
        if (q < 0) continue
        for (const s2 of ['left', 'right'] as Side[])
          for (let k2 = 1; k2 <= Math.min(2, kmax); k2++) {
            const z = g.nbr(h, q, s2, k2)
            if (z < 0 || z === x || z === q || r() > 0.3) continue
            add(`${N[z]} sits ${posPhrase(k2, s2)} the person who sits ${posPhrase(k1, s1)} ${N[x]}`, 3, s => {
              const qq = g.nbr(s, x, s1, k1)
              return qq >= 0 && g.nbr(s, qq, s2, k2) === z
            })
          }
      }
  if (!circular) {
    for (let x = 0; x < n; x++) {
      const end = h.at[x] === 0 || h.at[x] === n - 1
      if (end) add(`${N[x]} sits at one of the extreme ends`, 1.2, s => s.at[x] === 0 || s.at[x] === n - 1)
      const lo = mixed ? 'west' : 'left'
      const hi = mixed ? 'east' : 'right'
      if (r() < 0.4) {
        const fromLo = h.at[x] < n / 2
        const k = fromLo ? h.at[x] + 1 : n - h.at[x]
        add(`${N[x]} sits ${ORDW[k]} from the ${fromLo ? lo : hi} end`, 0.35, s => (fromLo ? s.at[x] + 1 : n - s.at[x]) === k)
      }
      for (let y = 0; y < n; y++) {
        if (x === y) continue
        if (!mixed && n - 1 - h.at[x] === h.at[y]) add(`As many persons sit to the right of ${N[x]} as to the left of ${N[y]}`, 2.5, s => n - 1 - s.at[x] === s.at[y])
        for (let z = y + 1; z < n && !mixed; z++) {
          if (z === x || x > y) continue
          const gxy = Math.abs(h.at[x] - h.at[y]) - 1
          if (gxy >= 1 && gxy === Math.abs(h.at[y] - h.at[z]) - 1 && r() < 0.5)
            add(`The number of persons sitting between ${N[x]} and ${N[y]} is the same as the number sitting between ${N[y]} and ${N[z]}`, 2.5, s => Math.abs(s.at[x] - s.at[y]) === Math.abs(s.at[y] - s.at[z]) && Math.abs(s.at[x] - s.at[y]) > 1)
        }
        if (!mixed && h.at[x] < h.at[y] - 1 && r() < 0.3) add(`${N[x]} sits somewhere to the left of ${N[y]}, but not immediately to the left`, 1.2, s => s.at[x] < s.at[y] - 1)
        if (x < y && h.at[x] > 0 && h.at[x] < n - 1 && h.at[y] > 0 && h.at[y] < n - 1 && r() < 0.3) add(`Neither ${N[x]} nor ${N[y]} sits at an extreme end`, 1, s => s.at[x] > 0 && s.at[x] < n - 1 && s.at[y] > 0 && s.at[y] < n - 1)
      }
    }
  }
  if (mixed) {
    const dirIn = circular ? 'faces the centre' : 'faces north'
    const dirOut = circular ? 'faces away from the centre' : 'faces south'
    for (let x = 0; x < n; x++) {
      if (r() < 0.4) add(`${N[x]} ${h.face[x] === 1 ? dirIn : dirOut}`, 0.7, s => s.face[x] === h.face[x])
      const l = g.nbr(h, x, 'left', 1)
      const rt = g.nbr(h, x, 'right', 1)
      if (l >= 0 && rt >= 0) {
        if (h.face[l] === h.face[rt]) {
          const f = h.face[l]
          add(`Both the immediate neighbours of ${N[x]} ${(f === 1 ? (circular ? 'face the centre' : 'face north') : circular ? 'face away from the centre' : 'face south')}`, 2, s => {
            const a = g.nbr(s, x, 'left', 1)
            const b = g.nbr(s, x, 'right', 1)
            return a >= 0 && b >= 0 && s.face[a] === f && s.face[b] === f
          })
        } else
          add(`The immediate neighbours of ${N[x]} face opposite directions`, 2, s => {
            const a = g.nbr(s, x, 'left', 1)
            const b = g.nbr(s, x, 'right', 1)
            return a >= 0 && b >= 0 && s.face[a] !== s.face[b]
          })
      }
    }
    const cntIn = h.face.filter(f => f === 1).length
    add(`Exactly ${NUMW[cntIn]} of them ${cntIn === 1 ? (circular ? 'faces the centre' : 'faces north') : circular ? 'face the centre' : 'face north'}`, 1, s => s.face.filter(f => f === 1).length === cntIn)
    if (!circular) {
      const same = h.face[h.seat[0]] === h.face[h.seat[n - 1]]
      add(`The persons at the two extreme ends face ${same ? 'the same direction' : 'opposite directions'}`, 1.3, s => (s.face[s.seat[0]] === s.face[s.seat[n - 1]]) === same)
    }
  }
  return out
}

type SeatQ = { ask: string; answer: (s: Seats) => string; traps: string[]; why: string }

const seatQuestions = (h: Seats, g: Geo, N: string[], r: Rand): (() => SeatQ | null)[] => {
  const { n, circular, mixed } = g
  const nm = (p: number) => (p < 0 ? 'No one' : N[p])
  const randPeople = (excl: number[]) => shuffle(r, range(n).filter(p => !excl.includes(p))).map(nm)
  const kmax = circular ? Math.min(3, Math.floor((n - 1) / 2)) : 3
  const keep = mixed ? (circular ? ' (each keeps his or her own facing direction)' : ' (each keeps his or her own facing direction)') : ''
  const facingNote = (p: number) => (mixed ? ` ${N[p]} ${h.face[p] === 1 ? (circular ? 'faces the centre' : 'faces north') : circular ? 'faces outward, so left and right are reversed' : 'faces south, so his or her right is towards the west'}.` : '')
  const relOf = (s: Seats, x: number, y: number): [Side, number] | null => {
    for (let k = 1; k <= kmax; k++) for (const side of ['left', 'right'] as Side[]) if (g.nbr(s, y, side, k) === x) return [side, k]
    return null
  }
  return [
    () => {
      const x = int(r, 0, n - 1)
      const side: Side = pick(r, ['left', 'right'])
      const k = int(r, 1, kmax)
      const t = g.nbr(h, x, side, k)
      if (t < 0) return null
      const traps = [g.nbr(h, x, other(side), k), g.nbr(h, x, side, k + 1), g.nbr(h, x, side, k - 1), g.nbr(h, x, other(side), k + 1)].filter(p => p >= 0 && p !== x && p !== t).map(nm)
      return { ask: `Who sits ${posPhrase(k, side)} ${N[x]}?`, answer: s => nm(g.nbr(s, x, side, k)), traps: [...traps, ...randPeople([t, x])], why: `${N[t]} is ${posPhrase(k, side)} ${N[x]}.${facingNote(x)}` }
    },
    () => {
      const x = int(r, 0, n - 1)
      const y = int(r, 0, n - 1)
      if (x === y) return null
      const rel = relOf(h, x, y)
      if (!rel) return null
      const [side, k] = rel
      const cands: [Side, number][] = [[other(side), k], [side, k + 1], [side, k - 1], [other(side), k + 1], [other(side), k - 1]]
      const traps = cands.filter(([sd, kk]) => kk >= 1 && kk <= kmax && g.nbr(h, y, sd, kk) !== x).map(([sd, kk]) => relWords(kk, sd))
      return {
        ask: `What is the position of ${N[x]} with respect to ${N[y]}?`,
        answer: s => {
          const rr = relOf(s, x, y)
          return rr ? relWords(rr[1], rr[0]) : 'none'
        },
        traps,
        why: `${N[x]} is ${posPhrase(k, side)} ${N[y]}.${facingNote(y)}`,
      }
    },
    () => {
      const x = int(r, 0, n - 1)
      const y = int(r, 0, n - 1)
      if (x === y) return null
      if (!circular) {
        const gap = Math.abs(h.at[x] - h.at[y]) - 1
        const show = (v: number) => (v === 0 ? 'None' : String(v))
        return { ask: `How many persons sit between ${N[x]} and ${N[y]}?`, answer: s => show(Math.abs(s.at[x] - s.at[y]) - 1), traps: [gap + 1, gap - 1, gap + 2, n - 2 - gap, gap + 3].filter(v => v >= 0 && v !== gap).map(show), why: `${N[x]} is in seat ${h.at[x] + 1} and ${N[y]} in seat ${h.at[y] + 1} from the ${mixed ? 'west' : 'left'} end, so ${gap} sit between them.` }
      }
      const side: Side = pick(r, ['left', 'right'])
      const count = (s: Seats) => {
        let k = 1
        while (g.nbr(s, x, side, k) !== y) k++
        return k - 1
      }
      const c = count(h)
      const show = (v: number) => (v === 0 ? 'None' : String(v))
      return { ask: `How many persons sit between ${N[x]} and ${N[y]} when counted from the ${side} of ${N[x]}?`, answer: s => show(count(s)), traps: [n - 2 - c, c + 1, c - 1, c + 2].filter(v => v >= 0 && v !== c).map(show), why: `Moving from ${N[x]} towards ${N[x]}'s ${side}, ${c} person(s) come before ${N[y]}; the other way round there are ${n - 2 - c}.${facingNote(x)}` }
    },
    () => {
      const x = int(r, 0, n - 1)
      const y = int(r, 0, n - 1)
      if (x === y) return null
      const side: Side = pick(r, ['left', 'right'])
      const k = int(r, 1, 2)
      const swap = (s: Seats): Seats => {
        const seat = [...s.seat]
        ;[seat[s.at[x]], seat[s.at[y]]] = [seat[s.at[y]], seat[s.at[x]]]
        const at = [...s.at]
        ;[at[x], at[y]] = [at[y], at[x]]
        return { seat, at, face: s.face }
      }
      const sw = swap(h)
      const t = g.nbr(sw, y, side, k)
      if (t < 0 || t === x) return null
      const traps = [g.nbr(h, y, side, k), g.nbr(sw, x, side, k), g.nbr(sw, y, other(side), k), g.nbr(h, x, side, k)].filter(p => p >= 0 && p !== t).map(nm)
      return { ask: `If ${N[x]} and ${N[y]} interchange their seats${keep}, who will sit ${posPhrase(k, side)} ${N[y]}?`, answer: s => nm(g.nbr(swap(s), y, side, k)), traps: [...traps, ...randPeople([t])], why: `After the swap ${N[y]} occupies ${N[x]}'s old seat; counting from there in ${N[y]}'s own ${side} direction gives ${N[t]}.` }
    },
    () => {
      type St = { text: string; holds: (s: Seats) => boolean }
      const stmt = (x: number, y: number, side: Side, k: number): St => ({ text: `${N[x]} sits ${posPhrase(k, side)} ${N[y]}`, holds: s => g.nbr(s, y, side, k) === x })
      const y = int(r, 0, n - 1)
      const side: Side = pick(r, ['left', 'right'])
      const k = int(r, 1, kmax)
      const x = g.nbr(h, y, side, k)
      if (x < 0 || x === y) return null
      const all: St[] = [stmt(x, y, side, k)]
      for (let tries = 0; tries < 60 && all.length < 6; tries++) {
        const yy = int(r, 0, n - 1)
        const sd: Side = pick(r, ['left', 'right'])
        const kk = int(r, 1, kmax)
        const xx = pick(r, range(n).filter(p => p !== yy))
        const st = stmt(xx, yy, sd, kk)
        if (!st.holds(h) && !all.some(a => a.text === st.text)) all.push(st)
      }
      const offered = all.slice(0, 4)
      if (offered.length < 4) return null
      return {
        ask: 'Which of the following statements is true?',
        answer: s => {
          const t = offered.filter(a => a.holds(s))
          return t.length === 1 ? t[0].text : `${t.length} true`
        },
        traps: offered.slice(1).map(a => a.text),
        why: `In the final arrangement ${offered[0].text}; each of the other three statements contradicts it.`,
      }
    },
    () => {
      if (circular) {
        if (n % 2) return null
        const x = int(r, 0, n - 1)
        const opp = (s: Seats) => s.seat[mod(s.at[x] + n / 2, n)]
        const o = opp(h)
        const traps = [h.seat[mod(h.at[x] + n / 2 + 1, n)], h.seat[mod(h.at[x] + n / 2 - 1, n)], h.seat[mod(h.at[x] + 1, n)], h.seat[mod(h.at[x] - 1, n)]].map(nm)
        return { ask: `Who sits directly opposite ${N[x]}?`, answer: s => nm(opp(s)), traps, why: `${N[o]} is ${n / 2} seats away from ${N[x]} in either direction.` }
      }
      const ends = (s: Seats) => pair(N[s.seat[0]], N[s.seat[n - 1]])
      return { ask: 'Who sit at the two extreme ends of the row?', answer: ends, traps: [pair(N[h.seat[0]], N[h.seat[n - 2]]), pair(N[h.seat[1]], N[h.seat[n - 1]]), pair(N[h.seat[1]], N[h.seat[n - 2]]), pair(N[h.seat[0]], N[h.seat[2]])], why: `The ${mixed ? 'west' : 'left'} end is ${N[h.seat[0]]} and the other end is ${N[h.seat[n - 1]]}.` }
    },
    () => {
      const x = int(r, 0, n - 1)
      const nb = (s: Seats) => {
        const a = g.nbr(s, x, 'left', 1)
        const b = g.nbr(s, x, 'right', 1)
        return a >= 0 && b >= 0 ? pair(N[a], N[b]) : 'none'
      }
      const a = g.nbr(h, x, 'left', 1)
      const b = g.nbr(h, x, 'right', 1)
      if (a < 0 || b < 0) return null
      const a2 = g.nbr(h, x, 'left', 2)
      const b2 = g.nbr(h, x, 'right', 2)
      const traps = [a2 >= 0 ? pair(N[a2], N[b]) : '', b2 >= 0 ? pair(N[a], N[b2]) : '', a2 >= 0 && b2 >= 0 ? pair(N[a2], N[b2]) : '', pair(N[a], N[pick(r, range(n).filter(p => ![a, b, x].includes(p)))])].filter(Boolean)
      return { ask: `Who are the immediate neighbours of ${N[x]}?`, answer: nb, traps, why: `${N[x]} sits between ${N[a]} and ${N[b]}.` }
    },
    () => {
      const x = int(r, 0, n - 1)
      const s1: Side = pick(r, ['left', 'right'])
      const s2: Side = pick(r, ['left', 'right'])
      const k1 = int(r, 1, 2)
      const k2 = int(r, 1, Math.min(2, kmax))
      const hop = (s: Seats) => {
        const q = g.nbr(s, x, s1, k1)
        return q < 0 ? -1 : g.nbr(s, q, s2, k2)
      }
      const q = g.nbr(h, x, s1, k1)
      const t = hop(h)
      if (q < 0 || t < 0 || t === x) return null
      const traps = [g.nbr(h, q, other(s2), k2), g.nbr(h, x, s2, k2), g.nbr(h, q, s2, k2 + 1)].filter(p => p >= 0 && p !== t).map(nm)
      return { ask: `Who sits ${posPhrase(k2, s2)} the person who sits ${posPhrase(k1, s1)} ${N[x]}?`, answer: s => nm(hop(s)), traps: [...traps, ...randPeople([t])], why: `${posPhrase(k1, s1).replace(/^./, c => c.toUpperCase())} ${N[x]} is ${N[q]}; ${posPhrase(k2, s2)} ${N[q]} is ${N[t]}.${facingNote(q)}` }
    },
    () => {
      if (!mixed) return null
      const cnt = (s: Seats) => String(s.face.filter(f => f === -1).length)
      const c = Number(cnt(h))
      return { ask: `How many persons ${circular ? 'face away from the centre' : 'face south'}?`, answer: cnt, traps: [c + 1, c - 1, n - c, c + 2].filter(v => v >= 0 && v <= n && v !== c).map(String), why: `Facing directions are fixed by the clues: ${range(n).filter(p => h.face[p] === -1).map(p => N[p]).join(', ')} ${circular ? 'face outward' : 'face south'}.` }
    },
  ]
}

const seatArrangement = (h: Seats, g: Geo, N: string[]) => {
  const tag = (p: number) => (g.mixed ? `${N[p]}(${h.face[p] === 1 ? (g.circular ? 'in' : 'N') : g.circular ? 'out' : 'S'})` : N[p])
  return g.circular ? `Clockwise from ${N[h.seat[0]]}: ${h.seat.map(tag).join(' → ')}` : `${g.mixed ? 'West to east' : 'Left to right'}: ${h.seat.map(tag).join(', ')}`
}

const seatPuzzle = (family: string, topic: string, r: Rand, n: number, mixed: boolean, circular: boolean, perPuzzle: number) => {
  const g = circular ? circleGeo(n, mixed) : rowGeo(n, mixed)
  const U = seatUniverse(n, mixed, circular)
  const N = pick(r, NAME_SETS).slice(0, n)
  const hidden = U[int(r, 0, U.length - 1)]
  const pool = seatPool(hidden, g, N, r).map(p => ({ text: p.text, w: p.w, test: (k: number) => p.pred(U[k]) }))
  const minC = n - 3
  const picked = chooseClues(U.length, pool, r, true, n + 4, minC)
  if (!picked || picked.clues.length < minC) throw new Error('weak puzzle')
  const chosen = picked.clues
  const shown = shuffle(r, chosen)
  const facts: Facts = {
    size: n * n + (mixed ? 2 * n : 0),
    add: (k, cnt) => {
      const s = U[k]
      if (circular) {
        // positions relative to the first-named person, so rotation does not matter
        for (let p = 1; p < n; p++) cnt[p * n + mod(s.at[p] - s.at[0], n)]++
      } else for (let p = 0; p < n; p++) cnt[p * n + s.at[p]]++
      if (mixed) for (let p = 0; p < n; p++) cnt[n * n + 2 * p + (s.face[p] === 1 ? 0 : 1)]++
    },
    label: f => {
      if (f >= n * n) {
        const p = Math.floor((f - n * n) / 2)
        const out = (f - n * n) % 2 === 1
        return `${N[p]} ${circular ? (out ? 'facing outward' : 'facing the centre') : out ? 'facing south' : 'facing north'}`
      }
      const p = Math.floor(f / n)
      const v = f % n
      if (circular) return `${N[p]} ${v} seat${v === 1 ? '' : 's'} clockwise from ${N[0]}`
      return `${N[p]} in seat ${v + 1}`
    },
  }
  const chain = narrate(U.length, picked, shown, facts)
  const intro = circular
    ? `${cap(NUMW[n])} persons ${listAnd(N)} sit around a circular table at equal distances. ${mixed ? 'Some of them face the centre and the rest face away from the centre. Left and right are always taken from the facing direction of the person used as the reference.' : 'All of them face the centre.'}`
    : `${cap(NUMW[n])} persons ${listAnd(N)} sit in a straight row${mixed ? ' running from west to east. Some of them face north and the rest face south. Left and right are always taken from the facing direction of the person used as the reference.' : ', all facing north (seat 1 is the left end).'}`
  const stem = `${intro} ${clueBlock(shown)}`
  const qs = shuffle(r, seatQuestions(hidden, g, N, r))
  let made = 0
  const asked = new Set<string>()
  for (const make of qs) {
    if (made >= perPuzzle) break
    const q = make()
    if (!q || asked.has(q.ask)) continue
    const correct = q.answer(hidden)
    try {
      emit({
        family,
        topic,
        question: `${stem} ${q.ask}`,
        correct,
        traps: q.traps,
        explanation: `${chain} ${seatArrangement(hidden, g, N)}. ${q.why}`,
        hint: circular
          ? `Fix one person, place the definite 'k-th to the left/right' clues first${mixed ? '; for an outward-facing person left and right are reversed' : ' (for centre-facing persons, left is clockwise)'}, then use the negative clues to eliminate cases.`
          : `Draw seats 1 to ${n}, place the block clues (exact gaps, immediate neighbours) first and test each case against the remaining clues.${mixed ? ' For a south-facing person, left and right are reversed.' : ''}`,
        seconds: n >= 8 || mixed ? 240 : 210,
        recompute: () => {
          const sols = solveIdx(U.length, chosen)
          if (sols.length !== 1) return `not unique (${sols.length})`
          return q.answer(U[sols[0]])
        },
      })
      asked.add(q.ask)
      made++
    } catch {
      // trap collision for this question; try another question type
    }
  }
}

produce('seat-lin', 10, 1001, r => seatPuzzle('seat-lin', 'Seating arrangement', r, 8, false, false, 2), 30)
produce('seat-lin', 30, 2001, r => seatPuzzle('seat-lin', 'Seating arrangement', r, 7, false, false, 2), 60)
produce('seat-lin', 12, 3001, r => seatPuzzle('seat-lin', 'Seating arrangement', r, 6, true, false, 2), 30)
produce('seat-circ', 14, 4001, r => seatPuzzle('seat-circ', 'Circular arrangement', r, 8, false, true, 2), 60)
produce('seat-circ', 24, 5001, r => seatPuzzle('seat-circ', 'Circular arrangement', r, 7, false, true, 2), 60)
produce('seat-circ', 18, 6001, r => seatPuzzle('seat-circ', 'Circular arrangement', r, 6, true, true, 2), 40)

// ---------------------------------------------------------------------------
// One-dimensional slot puzzles: stacked boxes, exams across months
// ---------------------------------------------------------------------------

type Skin1 = {
  family: string
  topic: string
  slotName: (s: number) => string
  slotAt: (s: number) => string
  later: string
  names: () => string[][]
  intro: (N: string[]) => string
  rel: (x: string, y: string, d: number) => string // x is d slots higher/later than y (d may be negative)
  gap: (x: string, y: string, g: number) => string
  some: (x: string, y: string) => string
  parity: (x: string, odd: boolean) => string
  extreme: (x: string) => string
  at: (x: string, s: number) => string
  eq: (x: string, y: string) => string
  between: (x: string, y: string, z: string) => string
  slotFact?: { name: (yes: boolean) => string; has: (s: number) => boolean; clue: (x: string, yes: boolean) => string; pairClue: (x: string, y: string, yes: boolean) => string }
  qRel: (x: string, d: number) => string
  qSlot: (x: string) => string
  qWho: (s: number) => string
  qGap: (x: string, y: string) => string
  qHigher: (x: string) => string
  hint: string
}

const boxSkin = (n: number): Skin1 => {
  const pos = (s: number) => (s >= Math.ceil(n / 2) ? `${ORDW[n - s]} from the top` : `${ORDW[s + 1]} from the bottom`)
  return {
    family: 'box',
    topic: 'Puzzle',
    slotName: s => `position ${s + 1} from the bottom`,
    slotAt: s => `at position ${s + 1} from the bottom`,
    later: 'above it',
    names: () => NAME_SETS.filter(x => x[0].length === 1),
    intro: N => `${cap(NUMW[N.length])} boxes ${listAnd(N)} are stacked one above the other in a single pile (position 1 is the bottom box, position ${N.length} the top box).`,
    rel: (x, y, d) => (Math.abs(d) === 1 ? `Box ${x} is kept immediately ${d > 0 ? 'above' : 'below'} box ${y}` : `Box ${x} is kept ${d > 0 ? 'above' : 'below'} box ${y} with exactly ${NUMW[Math.abs(d) - 1]} ${Math.abs(d) - 1 === 1 ? 'box' : 'boxes'} between them`),
    gap: (x, y, g) => `Exactly ${NUMW[g]} ${g === 1 ? 'box is' : 'boxes are'} kept between box ${x} and box ${y}`,
    some: (x, y) => `Box ${x} is kept somewhere above box ${y}, but not immediately above it`,
    parity: (x, odd) => `Box ${x} is kept at an ${odd ? 'odd' : 'even'}-numbered position`,
    extreme: x => `Box ${x} is either the top box or the bottom box`,
    at: (x, s) => `Box ${x} is the ${pos(s)}`,
    eq: (x, y) => `As many boxes are kept above box ${x} as below box ${y}`,
    between: (x, y, z) => `Box ${x} is kept somewhere between boxes ${y} and ${z}`,
    qRel: (x, d) => (Math.abs(d) === 1 ? `Which box is kept immediately ${d > 0 ? 'above' : 'below'} box ${x}?` : `Which box is kept exactly ${NUMW[Math.abs(d)]} positions ${d > 0 ? 'above' : 'below'} box ${x}?`),
    qSlot: x => `At which position from the bottom is box ${x} kept?`,
    qWho: s => `Which box is the ${pos(s)}?`,
    qGap: (x, y) => `How many boxes are kept between box ${x} and box ${y}?`,
    qHigher: x => `How many boxes are kept above box ${x}?`,
    hint: `Number the positions 1 (bottom) to ${n} (top); place the exact-gap pairs as blocks, then use the "as many above as below" and parity clues to choose between cases.`,
  }
}

const MONTHS8 = ['January', 'March', 'April', 'June', 'July', 'September', 'October', 'November']
const MDAYS8 = [31, 31, 30, 30, 31, 30, 31, 30]
const monthSkin = (): Skin1 => ({
  family: 'sched-month',
  topic: 'Scheduling',
  slotName: s => MONTHS8[s],
  slotAt: s => `in ${MONTHS8[s]}`,
  later: 'after it',
  names: () => NAME_SETS,
  intro: N => `Eight candidates ${listAnd(N)} each take an exam in a different one of these months of the same year: ${MONTHS8.join(', ')}. 'Before', 'after', 'immediately after' and 'between' refer only to these eight months in this order.`,
  rel: (x, y, d) => (Math.abs(d) === 1 ? `${x}'s exam is in the month immediately ${d > 0 ? 'after' : 'before'} ${y}'s` : `${x}'s exam is ${d > 0 ? 'after' : 'before'} ${y}'s, with exactly ${NUMW[Math.abs(d) - 1]} ${Math.abs(d) - 1 === 1 ? 'exam' : 'exams'} in between`),
  gap: (x, y, g) => `Exactly ${NUMW[g]} ${g === 1 ? 'person has an exam' : 'persons have exams'} between ${x} and ${y}`,
  some: (x, y) => `${x}'s exam is in some month after ${y}'s, but not immediately after`,
  parity: (x, odd) => `${x}'s exam is in ${odd ? 'January, April, July or October' : 'March, June, September or November'}`,
  extreme: x => `${x}'s exam is either in January or in November`,
  at: (x, s) => `${x}'s exam is in ${MONTHS8[s]}`,
  eq: (x, y) => `As many persons have exams after ${x} as before ${y}`,
  between: (x, y, z) => `${x}'s exam is in some month between the exams of ${y} and ${z}`,
  slotFact: {
    name: yes => (yes ? '31-day' : '30-day'),
    has: s => MDAYS8[s] === 31,
    clue: (x, yes) => `${x}'s exam is in a month having ${yes ? 31 : 30} days`,
    pairClue: (x, y, yes) => `Neither ${x} nor ${y} has an exam in a month having ${yes ? 31 : 30} days`,
  },
  qRel: (x, d) => (Math.abs(d) === 1 ? `Whose exam is in the month immediately ${d > 0 ? 'after' : 'before'} ${x}'s?` : `Whose exam is exactly ${NUMW[Math.abs(d)]} months ${d > 0 ? 'after' : 'before'} ${x}'s in the list?`),
  qSlot: x => `In which month is ${x}'s exam?`,
  qWho: s => `Whose exam is in ${MONTHS8[s]}?`,
  qGap: (x, y) => `How many persons have their exams between ${x} and ${y}?`,
  qHigher: x => `How many persons have their exams after ${x}?`,
  hint: 'List the eight months as slots 1-8; place exact-gap pairs as blocks, then use the 30/31-day and "as many before as after" clues to eliminate cases.',
})

const slot1Puzzle = (skin: Skin1, r: Rand, perPuzzle: number, n = 8) => {
  const U = seatUniverse(n, false, false)
  const N = shuffle(r, pick(r, skin.names())).slice(0, n).sort()
  const h = U[int(r, 0, U.length - 1)]
  const pool: Pred[] = []
  const add = (text: string, w: number, pred: (s: Seats) => boolean) => {
    if (!pred(h)) throw new Error(`false clue ${text}`)
    pool.push({ text, w, pred })
  }
  for (let x = 0; x < n; x++) {
    for (let y = 0; y < n; y++) {
      if (x === y) continue
      const d = h.at[x] - h.at[y]
      if (Math.abs(d) <= 3 && r() < 0.6) add(skin.rel(N[x], N[y], d), Math.abs(d) === 1 ? 1.5 : 2, s => s.at[x] - s.at[y] === d)
      if (x < y && Math.abs(d) >= 2) add(skin.gap(N[x], N[y], Math.abs(d) - 1), 2, s => Math.abs(s.at[x] - s.at[y]) === Math.abs(d))
      if (d >= 2 && r() < 0.4) add(skin.some(N[x], N[y]), 1.3, s => s.at[x] - s.at[y] >= 2)
      if (n - 1 - h.at[x] === h.at[y] && r() < 0.7) add(skin.eq(N[x], N[y]), 2.5, s => n - 1 - s.at[x] === s.at[y])
      for (let z = y + 1; z < n; z++)
        if (z !== x && (h.at[y] - h.at[x]) * (h.at[z] - h.at[x]) < 0 && r() < 0.12) add(skin.between(N[x], N[y], N[z]), 1.5, s => (s.at[y] - s.at[x]) * (s.at[z] - s.at[x]) < 0)
      if (skin.slotFact && x < y && skin.slotFact.has(h.at[x]) === skin.slotFact.has(h.at[y]) && r() < 0.3) {
        const yes = !skin.slotFact.has(h.at[x])
        const f = skin.slotFact
        add(f.pairClue(N[x], N[y], yes), 1.3, s => f.has(s.at[x]) !== yes && f.has(s.at[y]) !== yes)
      }
    }
    const odd = h.at[x] % 2 === 0
    if (r() < 0.5) add(skin.parity(N[x], odd), 1, s => (s.at[x] % 2 === 0) === odd)
    if (h.at[x] === 0 || h.at[x] === n - 1) add(skin.extreme(N[x]), 1.2, s => s.at[x] === 0 || s.at[x] === n - 1)
    if (r() < 0.35) add(skin.at(N[x], h.at[x]), 0.35, s => s.at[x] === h.at[x])
    if (skin.slotFact && r() < 0.5) {
      const f = skin.slotFact
      const yes = f.has(h.at[x])
      add(f.clue(N[x], yes), 1.1, s => f.has(s.at[x]) === yes)
    }
  }
  const clues: Clue[] = pool.map(p => ({ text: p.text, w: p.w, test: (k: number) => p.pred(U[k]) }))
  const picked = chooseClues(U.length, clues, r, true, 11, n - 2)
  if (!picked || picked.clues.length < n - 2) throw new Error('weak puzzle')
  const chosen = picked.clues
  const shown = shuffle(r, chosen)
  const facts: Facts = { size: n * n, add: (k, cnt) => U[k].at.forEach((sl, p) => cnt[p * n + sl]++), label: f => `${N[Math.floor(f / n)]} ${skin.slotAt(f % n)}` }
  const chain = narrate(U.length, picked, shown, facts)
  const order = `Final order (slot 1 → ${n}): ${h.seat.map(p => N[p]).join(', ')}`
  const nm = (p: number) => (p < 0 ? 'None' : N[p])
  const at = (s: Seats, sl: number) => (sl >= 0 && sl < n ? s.seat[sl] : -1)
  const others = (excl: number[]) => shuffle(r, range(n).filter(p => !excl.includes(p))).map(nm)
  const makers: (() => SeatQ | null)[] = [
    () => {
      const x = int(r, 0, n - 1)
      const d = pick(r, [1, -1, 2, -2, 3])
      const t = at(h, h.at[x] + d)
      if (t < 0) return null
      const traps = [at(h, h.at[x] - d), at(h, h.at[x] + d + Math.sign(d)), at(h, h.at[x] + d - Math.sign(d))].filter(p => p >= 0 && p !== x && p !== t).map(nm)
      return { ask: skin.qRel(N[x], d), answer: s => nm(at(s, s.at[x] + d)), traps: [...traps, ...others([t, x])], why: `${N[x]} is ${skin.slotAt(h.at[x])}, so the answer is the one ${skin.slotAt(h.at[x] + d)}: ${N[t]}.` }
    },
    () => {
      const x = int(r, 0, n - 1)
      const v = h.at[x]
      const show = (sl: number) => (skin.family === 'box' ? nth(sl + 1) : MONTHS8[sl])
      return { ask: skin.qSlot(N[x]), answer: s => show(s.at[x]), traps: [v + 1, v - 1, n - 1 - v, v + 2, v - 2].filter(t => t >= 0 && t < n && t !== v).map(show), why: `${N[x]} is ${skin.slotAt(v)}.` }
    },
    () => {
      const sl = int(r, 0, n - 1)
      const t = h.seat[sl]
      const traps = [at(h, n - 1 - sl), at(h, sl + 1), at(h, sl - 1)].filter(p => p >= 0 && p !== t).map(nm)
      return { ask: skin.qWho(sl), answer: s => nm(s.seat[sl]), traps: [...traps, ...others([t])], why: `The one ${skin.slotAt(sl)} is ${N[t]}.` }
    },
    () => {
      const x = int(r, 0, n - 1)
      const y = int(r, 0, n - 1)
      if (x === y) return null
      const gp = Math.abs(h.at[x] - h.at[y]) - 1
      const show = (v: number) => (v === 0 ? 'None' : String(v))
      return { ask: skin.qGap(N[x], N[y]), answer: s => show(Math.abs(s.at[x] - s.at[y]) - 1), traps: [gp + 1, gp - 1, gp + 2, n - 2 - gp].filter(v => v >= 0 && v !== gp).map(show), why: `${N[x]} is ${skin.slotAt(h.at[x])} and ${N[y]} ${skin.slotAt(h.at[y])}, so ${gp} lie between them.` }
    },
    () => {
      const x = int(r, 0, n - 1)
      const c = n - 1 - h.at[x]
      return { ask: skin.qHigher(N[x]), answer: s => String(n - 1 - s.at[x]), traps: [c + 1, c - 1, h.at[x], c + 2].filter(v => v >= 0 && v !== c).map(String), why: `${N[x]} is ${skin.slotAt(h.at[x])}, so ${c} come ${skin.later}.` }
    },
    () => {
      if (!skin.slotFact) return null
      const f = skin.slotFact
      const x = int(r, 0, n - 1)
      const cnt = (s: Seats) => range(n).filter(sl => sl > s.at[x] && f.has(sl)).length
      const c = cnt(h)
      return { ask: `How many persons have their exams in ${f.name(true)} months after ${N[x]}'s exam?`, answer: s => String(cnt(s)), traps: [c + 1, c - 1, n - 1 - h.at[x] - c, c + 2].filter(v => v >= 0 && v !== c).map(String), why: `${N[x]}'s exam is in ${MONTHS8[h.at[x]]}; the later 31-day months among the list number ${c}.` }
    },
  ]
  const qs = shuffle(r, makers)
  let made = 0
  const asked = new Set<string>()
  for (const make of qs) {
    if (made >= perPuzzle) break
    const q = make()
    if (!q || asked.has(q.ask)) continue
    try {
      emit({
        family: skin.family,
        topic: skin.topic,
        question: `${skin.intro(N)} ${clueBlock(shown)} ${q.ask}`,
        correct: q.answer(h),
        traps: q.traps,
        explanation: `${chain} ${order}. ${q.why}`,
        hint: skin.hint,
        seconds: 225,
        recompute: () => {
          const sols = solveIdx(U.length, chosen)
          return sols.length === 1 ? q.answer(U[sols[0]]) : `not unique (${sols.length})`
        },
      })
      asked.add(q.ask)
      made++
    } catch {
      // try another question type
    }
  }
}

produce('box', 21, 7001, r => slot1Puzzle(boxSkin(7), r, 3, 7), 40)
produce('sched-month', 18, 8001, r => slot1Puzzle(monthSkin(), r, 3), 30)

// ---------------------------------------------------------------------------
// Two-dimensional slot puzzles (person × attribute × slot): floors and weekdays
// ---------------------------------------------------------------------------

const P6 = perms(6)
const SL6 = new Int8Array(720 * 6) // SL6[i*6+item] = slot
const IT6 = new Int8Array(720 * 6) // IT6[i*6+slot] = item
P6.forEach((p, i) =>
  p.forEach((sl, item) => {
    SL6[i * 6 + item] = sl
    IT6[i * 6 + sl] = item
  }),
)

type PClue = { text: string; w: number; kind: 0 | 1 | 2; test: (i: number, j: number) => boolean }
type Ent = { t: 0 | 1; i: number }

const solve2D = (clues: readonly PClue[]): number[] => {
  const P = range(720).filter(i => clues.every(c => c.kind !== 0 || c.test(i, 0)))
  const A = range(720).filter(j => clues.every(c => c.kind !== 1 || c.test(0, j)))
  const mixed = clues.filter(c => c.kind === 2)
  const out: number[] = []
  for (const i of P) for (const j of A) if (mixed.every(c => c.test(i, j))) out.push(i * 720 + j)
  return out
}

const choose2D = (pool: readonly PClue[], r: Rand, maxClues: number): PClue[] | null => {
  const queue = wshuffle(r, pool)
  let P = range(720)
  let A = range(720)
  let pairs: number[] | null = null
  const chosen: PClue[] = []
  const deferred: PClue[] = []
  let nP = 0
  let nA = 0
  while (queue.length) {
    const c = queue.shift() as PClue
    if (!pairs) {
      if (c.kind === 0 && nP < 4) {
        const next = P.filter(i => c.test(i, 0))
        if (next.length < P.length) {
          P = next
          chosen.push(c)
          nP++
        }
      } else if (c.kind === 1 && nA < 3) {
        const next = A.filter(j => c.test(0, j))
        if (next.length < A.length) {
          A = next
          chosen.push(c)
          nA++
        }
      } else if (c.kind === 2) deferred.push(c)
      if (P.length * A.length <= 60000 || (nP >= 4 && nA >= 3) || queue.length === 0) {
        if (P.length * A.length > 150000) return null
        pairs = []
        for (const i of P) for (const j of A) pairs.push(i * 720 + j)
        queue.unshift(...deferred)
      }
    } else {
      const next: number[] = pairs.filter(k => c.test(Math.floor(k / 720), k % 720))
      if (next.length > 0 && next.length < pairs.length) {
        pairs = next
        chosen.push(c)
        if (next.length === 1) break
      }
    }
  }
  if (!pairs || pairs.length !== 1 || chosen.length > maxClues) return null
  return chosen
}

type Skin2 = {
  family: string
  topic: string
  intro: (N: string[], A: string[]) => string
  pname: (p: string) => string
  aname: (a: string) => string
  slotName: (s: number) => string
  rel: (x: string, y: string, d: number) => string
  gap: (x: string, y: string, g: number) => string
  some: (x: string, y: string) => string
  eq: (x: string, y: string) => string
  parity: (x: string, odd: boolean) => string
  extreme: (x: string) => string
  notExtreme: (x: string, y: string) => string
  at: (x: string, s: number) => string
  has: (p: string, a: string, yes: boolean) => string
  qRel: (x: string, d: number) => string
  qAttr: (p: string) => string
  qSlot: (x: string) => string
  qGap: (x: string, y: string) => string
  qHigher: (x: string) => string
  comboText: (s: number, p: string, a: string) => string
  hint: string
}

const CARS = ['Honda', 'Kia', 'Tata', 'Ford', 'Audi', 'Maruti', 'Hyundai', 'Skoda']
const SUBJECTS = ['Physics', 'Chemistry', 'Botany', 'History', 'Civics', 'Economics', 'Telugu', 'Zoology']
const DAYS6 = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

const floorSkin: Skin2 = {
  family: 'floor',
  topic: 'Puzzle',
  intro: (N, A) => `Six persons ${listAnd(N)} live on the six floors of a building, one person per floor; floor 1 is the lowest and floor 6 the topmost. Each owns a different car among ${listAnd(A)}.`,
  pname: p => p,
  aname: a => `the ${a} owner`,
  slotName: s => `floor ${s + 1}`,
  rel: (x, y, d) => (Math.abs(d) === 1 ? `${x} lives immediately ${d > 0 ? 'above' : 'below'} ${y}` : `${x} lives ${NUMW[Math.abs(d)]} floors ${d > 0 ? 'above' : 'below'} ${y}`),
  gap: (x, y, g) => `Exactly ${NUMW[g]} ${g === 1 ? 'person lives' : 'persons live'} between ${x} and ${y}`,
  some: (x, y) => `${x} lives on some floor above ${y}, but not immediately above`,
  eq: (x, y) => `The number of floors above ${x} is the same as the number of floors below ${y}`,
  parity: (x, odd) => `${x} lives on an ${odd ? 'odd' : 'even'}-numbered floor`,
  extreme: x => `${x} lives either on the lowest floor or on the topmost floor`,
  notExtreme: (x, y) => `Neither ${x} nor ${y} lives on the lowest or the topmost floor`,
  at: (x, s) => `${x} lives on floor ${s + 1}`,
  has: (p, a, yes) => `${p} ${yes ? 'owns' : 'does not own'} the ${a}`,
  qRel: (x, d) => (Math.abs(d) === 1 ? `Who lives immediately ${d > 0 ? 'above' : 'below'} ${x}?` : `Who lives ${NUMW[Math.abs(d)]} floors ${d > 0 ? 'above' : 'below'} ${x}?`),
  qAttr: p => `Which car does ${p} own?`,
  qSlot: x => `On which floor does ${x} live?`,
  qGap: (x, y) => `How many persons live between ${x} and ${y}?`,
  qHigher: x => `How many persons live above ${x}?`,
  comboText: (s, p, a) => `Floor ${s + 1} – ${p} – ${a}`,
  hint: 'Make a 6-row table (floor, person, car). Fix the exact-distance pairs first, branch on the few open cases, and kill branches with the car clues.',
}

const daySkin: Skin2 = {
  family: 'sched-day',
  topic: 'Scheduling',
  intro: (N, A) => `Six lecturers ${listAnd(N)} each give one lecture on a different day from Monday to Saturday of the same week. Each teaches a different subject among ${listAnd(A)}.`,
  pname: p => p,
  aname: a => `the ${a} lecturer`,
  slotName: s => DAYS6[s],
  rel: (x, y, d) => (Math.abs(d) === 1 ? `${x} lectures on the day immediately ${d > 0 ? 'after' : 'before'} ${y}` : `${x} lectures ${NUMW[Math.abs(d)]} days ${d > 0 ? 'after' : 'before'} ${y}`),
  gap: (x, y, g) => `Exactly ${NUMW[g]} ${g === 1 ? 'lecture is' : 'lectures are'} held between the lectures of ${x} and ${y}`,
  some: (x, y) => `${x} lectures on some day after ${y}, but not on the very next day`,
  eq: (x, y) => `As many lectures are held after ${x}'s lecture as before the lecture of ${y}`,
  parity: (x, odd) => `${x} lectures on ${odd ? 'Monday, Wednesday or Friday' : 'Tuesday, Thursday or Saturday'}`,
  extreme: x => `${x} lectures either on Monday or on Saturday`,
  notExtreme: (x, y) => `Neither ${x} nor ${y} lectures on Monday or on Saturday`,
  at: (x, s) => `${x} lectures on ${DAYS6[s]}`,
  has: (p, a, yes) => `${p} ${yes ? 'teaches' : 'does not teach'} ${a}`,
  qRel: (x, d) => (Math.abs(d) === 1 ? `Who lectures on the day immediately ${d > 0 ? 'after' : 'before'} ${x}?` : `Who lectures ${NUMW[Math.abs(d)]} days ${d > 0 ? 'after' : 'before'} ${x}?`),
  qAttr: p => `Which subject does ${p} teach?`,
  qSlot: x => `On which day does ${x} lecture?`,
  qGap: (x, y) => `How many lectures are held between the lectures of ${x} and ${y}?`,
  qHigher: x => `How many lectures are held after the lecture of ${x}?`,
  comboText: (s, p, a) => `${DAYS6[s]} – ${p} – ${a}`,
  hint: 'Draw a Monday-to-Saturday grid with person and subject rows. Place the exact-gap pairs, branch on the open cases, and eliminate with the subject clues.',
}

const slot2Puzzle = (skin: Skin2, r: Rand, perPuzzle: number) => {
  const n = 6
  const N = shuffle(r, pick(r, NAME_SETS)).slice(0, n).sort()
  const A = shuffle(r, skin === floorSkin ? CARS : SUBJECTS).slice(0, n)
  const hi = int(r, 0, 719)
  const hj = int(r, 0, 719)
  const slotOf = (i: number, j: number, e: Ent) => (e.t === 0 ? SL6[i * 6 + e.i] : SL6[j * 6 + e.i])
  const nameOf = (e: Ent) => (e.t === 0 ? skin.pname(N[e.i]) : skin.aname(A[e.i]))
  const ents: Ent[] = [...range(n).map(i => ({ t: 0 as const, i })), ...range(n).map(i => ({ t: 1 as const, i }))]
  const pool: PClue[] = []
  const add = (text: string, w: number, e: Ent[], test: (i: number, j: number) => boolean) => {
    if (!test(hi, hj)) throw new Error(`false clue ${text}`)
    const kind: 0 | 1 | 2 = e.every(x => x.t === 0) ? 0 : e.every(x => x.t === 1) ? 1 : 2
    pool.push({ text: cap(text), w, kind, test })
  }
  for (const e1 of ents)
    for (const e2 of ents) {
      if (e1 === e2) continue
      const d = slotOf(hi, hj, e1) - slotOf(hi, hj, e2)
      if (d === 0) continue
      const a1 = nameOf(e1)
      const a2 = nameOf(e2)
      if (Math.abs(d) <= 3 && r() < 0.5) add(skin.rel(a1, a2, d), Math.abs(d) === 1 ? 1.6 : 2, [e1, e2], (i, j) => slotOf(i, j, e1) - slotOf(i, j, e2) === d)
      if (ents.indexOf(e1) < ents.indexOf(e2) && Math.abs(d) >= 2 && r() < 0.6) add(skin.gap(a1, a2, Math.abs(d) - 1), 2, [e1, e2], (i, j) => Math.abs(slotOf(i, j, e1) - slotOf(i, j, e2)) === Math.abs(d))
      if (d >= 2 && r() < 0.35) add(skin.some(a1, a2), 1.3, [e1, e2], (i, j) => slotOf(i, j, e1) - slotOf(i, j, e2) >= 2)
      if (n - 1 - slotOf(hi, hj, e1) === slotOf(hi, hj, e2) && r() < 0.6) add(skin.eq(a1, a2), 2.4, [e1, e2], (i, j) => n - 1 - slotOf(i, j, e1) === slotOf(i, j, e2))
      const s1 = slotOf(hi, hj, e1)
      const s2 = slotOf(hi, hj, e2)
      if (ents.indexOf(e1) < ents.indexOf(e2) && s1 > 0 && s1 < n - 1 && s2 > 0 && s2 < n - 1 && r() < 0.2) add(skin.notExtreme(a1, a2), 1, [e1, e2], (i, j) => [slotOf(i, j, e1), slotOf(i, j, e2)].every(v => v > 0 && v < n - 1))
    }
  for (const e of ents) {
    const s = slotOf(hi, hj, e)
    const odd = s % 2 === 0
    if (r() < 0.5) add(skin.parity(nameOf(e), odd), 1, [e], (i, j) => (slotOf(i, j, e) % 2 === 0) === odd)
    if (s === 0 || s === n - 1) add(skin.extreme(nameOf(e)), 1.2, [e], (i, j) => [0, n - 1].includes(slotOf(i, j, e)))
    if (r() < 0.25) add(skin.at(nameOf(e), s), 0.3, [e], (i, j) => slotOf(i, j, e) === s)
  }
  for (let p = 0; p < n; p++) {
    const mine = IT6[hj * 6 + SL6[hi * 6 + p]]
    if (r() < 0.25) add(skin.has(N[p], A[mine], true), 0.4, [{ t: 0, i: p }, { t: 1, i: mine }], (i, j) => SL6[i * 6 + p] === SL6[j * 6 + mine])
    for (let a = 0; a < n; a++)
      if (a !== mine && r() < 0.12) add(skin.has(N[p], A[a], false), 0.6, [{ t: 0, i: p }, { t: 1, i: a }], (i, j) => SL6[i * 6 + p] !== SL6[j * 6 + a])
  }
  const chosen = choose2D(pool, r, 14)
  if (!chosen || chosen.length < 8) throw new Error('weak 2D puzzle')
  const shown = shuffle(r, chosen)
  // narration (in solving order): persons and attributes are pinned separately until mixed clues bind them
  const steps: string[] = []
  {
    let P = range(720)
    let Aset = range(720)
    let pairs: number[] | null = null
    const known = new Set<string>()
    for (const c of chosen) {
      if (!pairs && c.kind === 0) P = P.filter(i => c.test(i, 0))
      else if (!pairs && c.kind === 1) Aset = Aset.filter(j => c.test(0, j))
      else {
        if (!pairs) {
          pairs = []
          for (const i of P) for (const j of Aset) pairs.push(i * 720 + j)
        }
        pairs = pairs.filter(k => c.test(Math.floor(k / 720), k % 720))
      }
      const fixed: string[] = []
      const Pl = pairs ? [...new Set(pairs.map(k => Math.floor(k / 720)))] : P
      const Al = pairs ? [...new Set(pairs.map(k => k % 720))] : Aset
      for (let p = 0; p < n; p++) {
        const v = SL6[Pl[0] * 6 + p]
        if (Pl.every(i => SL6[i * 6 + p] === v)) fixed.push(`${N[p]} on ${skin.slotName(v)}`)
        const w = SL6[Al[0] * 6 + p]
        if (Al.every(j => SL6[j * 6 + p] === w)) fixed.push(`${A[p]} on ${skin.slotName(w)}`)
      }
      const fresh = fixed.filter(f => !known.has(f))
      fresh.forEach(f => known.add(f))
      const no = shown.indexOf(c) + 1
      const cases = pairs ? pairs.length : P.length * Aset.length
      steps.push(fresh.length ? `clue ${no} fixes ${listAnd(fresh)}` : `clue ${no} leaves ${cases} cases`)
    }
  }
  const table = range(n)
    .map(s => `${skin.slotName(s)}: ${N[IT6[hi * 6 + s]]} (${A[IT6[hj * 6 + s]]})`)
    .join('; ')
  const chain = `Deduction (solving order): ${steps.join('; ')}. Final table — ${table}.`
  type Q2 = { ask: string; answer: (i: number, j: number) => string; traps: string[]; why: string }
  const personAt = (i: number, s: number) => (s >= 0 && s < n ? N[IT6[i * 6 + s]] : '')
  const attrOfP = (i: number, j: number, p: number) => A[IT6[j * 6 + SL6[i * 6 + p]]]
  const randEnt = () => pick(r, ents)
  const makers: (() => Q2 | null)[] = [
    () => {
      const e = randEnt()
      const d = pick(r, [1, -1, 2, -2])
      const s = slotOf(hi, hj, e) + d
      if (s < 0 || s >= n) return null
      const base = slotOf(hi, hj, e)
      const traps = [personAt(hi, base - d), personAt(hi, s + Math.sign(d)), personAt(hi, s - Math.sign(d)), personAt(hi, base)].filter(t => t && t !== personAt(hi, s))
      return { ask: skin.qRel(nameOf(e), d), answer: (i, j) => personAt(i, slotOf(i, j, e) + d) || 'None', traps: [...traps, ...shuffle(r, N)], why: `${cap(nameOf(e))} is on ${skin.slotName(base)}; ${skin.slotName(s)} belongs to ${personAt(hi, s)}.` }
    },
    () => {
      const p = int(r, 0, n - 1)
      const s = SL6[hi * 6 + p]
      const traps = [s + 1, s - 1, s + 2, s - 2].filter(v => v >= 0 && v < n).map(v => A[IT6[hj * 6 + v]])
      return { ask: skin.qAttr(N[p]), answer: (i, j) => attrOfP(i, j, p), traps: [...traps, ...shuffle(r, A)], why: `${N[p]} is on ${skin.slotName(s)}, which goes with ${A[IT6[hj * 6 + s]]}.` }
    },
    () => {
      const e = randEnt()
      const s = slotOf(hi, hj, e)
      const show = (v: number) => cap(skin.slotName(v))
      return { ask: skin.qSlot(nameOf(e)), answer: (i, j) => show(slotOf(i, j, e)), traps: [s + 1, s - 1, n - 1 - s, s + 2, s - 2].filter(v => v >= 0 && v < n && v !== s).map(show), why: `${cap(nameOf(e))} is on ${skin.slotName(s)}.` }
    },
    () => {
      const e1 = randEnt()
      const e2 = randEnt()
      const g = Math.abs(slotOf(hi, hj, e1) - slotOf(hi, hj, e2)) - 1
      if (e1 === e2 || g < 0) return null
      const show = (v: number) => (v === 0 ? 'None' : String(v))
      return { ask: skin.qGap(nameOf(e1), nameOf(e2)), answer: (i, j) => show(Math.abs(slotOf(i, j, e1) - slotOf(i, j, e2)) - 1), traps: [g + 1, g - 1, g + 2, n - 2 - g].filter(v => v >= 0 && v !== g).map(show), why: `${cap(nameOf(e1))} is on ${skin.slotName(slotOf(hi, hj, e1))} and ${nameOf(e2)} on ${skin.slotName(slotOf(hi, hj, e2))}.` }
    },
    () => {
      const e = { t: 1 as const, i: int(r, 0, n - 1) }
      const c = n - 1 - slotOf(hi, hj, e)
      return { ask: skin.qHigher(nameOf(e)), answer: (i, j) => String(n - 1 - slotOf(i, j, e)), traps: [c + 1, c - 1, n - 1 - c, c + 2].filter(v => v >= 0 && v !== c).map(String), why: `${cap(nameOf(e))} is on ${skin.slotName(n - 1 - c)}.` }
    },
    () => {
      const s = int(r, 0, n - 1)
      const truth = skin.comboText(s, personAt(hi, s), A[IT6[hj * 6 + s]])
      const sp = (s + int(r, 1, n - 1)) % n
      const traps = [skin.comboText(s, personAt(hi, sp), A[IT6[hj * 6 + s]]), skin.comboText(s, personAt(hi, s), A[IT6[hj * 6 + sp]]), skin.comboText(sp, personAt(hi, s), A[IT6[hj * 6 + s]]), skin.comboText((s + 1) % n, personAt(hi, (s + 1) % n), A[IT6[hj * 6 + ((s + 2) % n)]])]
      return {
        ask: 'Which of the following combinations is correct?',
        answer: (i, j) => {
          const ok = [truth, ...traps].filter(t => range(n).some(v => skin.comboText(v, personAt(i, v), A[IT6[j * 6 + v]]) === t))
          return ok.length === 1 ? ok[0] : `${ok.length} correct`
        },
        traps,
        why: `From the final table, ${truth} is the only matching row.`,
      }
    },
  ]
  const qs = shuffle(r, makers)
  let made = 0
  const asked = new Set<string>()
  for (const make of qs) {
    if (made >= perPuzzle) break
    const q = make()
    if (!q || asked.has(q.ask)) continue
    try {
      emit({
        family: skin.family,
        topic: skin.topic,
        question: `${skin.intro(N, A)} ${clueBlock(shown)} ${q.ask}`,
        correct: q.answer(hi, hj),
        traps: q.traps,
        explanation: `${chain} ${q.why}`,
        hint: skin.hint,
        seconds: 240,
        recompute: () => {
          const sols = solve2D(chosen)
          return sols.length === 1 ? q.answer(Math.floor(sols[0] / 720), sols[0] % 720) : `not unique (${sols.length})`
        },
      })
      asked.add(q.ask)
      made++
    } catch {
      // try another question type
    }
  }
}

produce('floor', 24, 9001, r => slot2Puzzle(floorSkin, r, 3), 40)
produce('sched-day', 24, 10001, r => slot2Puzzle(daySkin, r, 3), 40)

// ---------------------------------------------------------------------------
// Syllogisms — model-based checker over Venn regions of four sets
// ---------------------------------------------------------------------------

type SylForm = 'all' | 'no' | 'some' | 'someNot' | 'onlyFew'
type SylConcForm = SylForm | 'possAll' | 'possSome' | 'possNo' | 'possSomeNot'
type SylStmt = { f: SylForm; x: number; y: number }
type SylConc = { f: SylConcForm; x: number; y: number }

// Region reg (1..15) = subset of the four sets; model bit (reg-1) set = that region is non-empty.
const regMask = (fn: (reg: number) => boolean) => {
  let m = 0
  for (let reg = 1; reg < 16; reg++) if (fn(reg)) m |= 1 << (reg - 1)
  return m
}
const inSet = (reg: number, t: number) => ((reg >> t) & 1) === 1
const XY = range(16).map(i => regMask(reg => inSet(reg, i >> 2) && inSet(reg, i & 3)))
const XnY = range(16).map(i => regMask(reg => inSet(reg, i >> 2) && !inSet(reg, i & 3)))
const SYL_MODELS: number[] = []
{
  const setMask = range(4).map(t => regMask(reg => inSet(reg, t)))
  for (let m = 1; m < 1 << 15; m++) if (setMask.every(sm => (m & sm) !== 0)) SYL_MODELS.push(m)
}
const sylHolds = (f: SylForm, x: number, y: number, m: number): boolean => {
  const both = (m & XY[x * 4 + y]) !== 0
  const out = (m & XnY[x * 4 + y]) !== 0
  if (f === 'all') return !out
  if (f === 'no') return !both
  if (f === 'some') return both
  if (f === 'someNot') return out
  return both && out
}
const sylValid = (st: readonly SylStmt[]) => SYL_MODELS.filter(m => st.every(s => sylHolds(s.f, s.x, s.y, m)))
const POSS: Record<string, SylForm> = { possAll: 'all', possSome: 'some', possNo: 'no', possSomeNot: 'someNot' }
/** 'follows' | 'fails' | 'certain' (a possibility that is already definite — avoided because conventions differ). */
const sylStatus = (c: SylConc, models: readonly number[]): 'follows' | 'fails' | 'certain' => {
  const base = POSS[c.f]
  if (base) {
    const some = models.some(m => sylHolds(base, c.x, c.y, m))
    const every = models.every(m => sylHolds(base, c.x, c.y, m))
    return every ? 'certain' : some ? 'follows' : 'fails'
  }
  return models.every(m => sylHolds(c.f as SylForm, c.x, c.y, m)) ? 'follows' : 'fails'
}
const SYL_THEMES: [string, string][][] = [
  [['pens', 'pen'], ['books', 'book'], ['files', 'file'], ['clips', 'clip']],
  [['doctors', 'doctor'], ['nurses', 'nurse'], ['teachers', 'teacher'], ['singers', 'singer']],
  [['rivers', 'river'], ['lakes', 'lake'], ['ponds', 'pond'], ['wells', 'well']],
  [['cars', 'car'], ['buses', 'bus'], ['trucks', 'truck'], ['vans', 'van']],
  [['roses', 'rose'], ['lilies', 'lily'], ['tulips', 'tulip'], ['lotuses', 'lotus']],
  [['chairs', 'chair'], ['tables', 'table'], ['desks', 'desk'], ['sofas', 'sofa']],
  [['rings', 'ring'], ['chains', 'chain'], ['bangles', 'bangle'], ['anklets', 'anklet']],
  [['laptops', 'laptop'], ['phones', 'phone'], ['tablets', 'tablet'], ['watches', 'watch']],
  [['kings', 'king'], ['queens', 'queen'], ['rulers', 'ruler'], ['soldiers', 'soldier']],
  [['bricks', 'brick'], ['stones', 'stone'], ['tiles', 'tile'], ['rocks', 'rock']],
  [['clerks', 'clerk'], ['officers', 'officer'], ['guards', 'guard'], ['drivers', 'driver']],
  [['mangoes', 'mango'], ['apples', 'apple'], ['grapes', 'grape'], ['guavas', 'guava']],
]
const SINGULAR = new Map(SYL_THEMES.flat().map(([pl, sg]) => [pl, sg]))
const sg = (pl: string) => SINGULAR.get(pl) ?? pl
const an = (w: string) => (/^[aeiou]/.test(w) ? `an ${w}` : `a ${w}`)
const sylText = (f: SylConcForm, X: string, Y: string) => {
  switch (f) {
    case 'all': return `All ${X} are ${Y}`
    case 'no': return `No ${sg(X)} is ${an(sg(Y))}`
    case 'some': return `Some ${X} are ${Y}`
    case 'someNot': return `Some ${X} are not ${Y}`
    case 'onlyFew': return `Only a few ${X} are ${Y}`
    case 'possAll': return `All ${X} being ${Y} is a possibility`
    case 'possSome': return `Some ${X} being ${Y} is a possibility`
    case 'possNo': return `It is possible that no ${sg(X)} is ${an(sg(Y))}`
    default: return `Some ${X} not being ${Y} is a possibility`
  }
}
const sylWhy = (c: SylConc, st: readonly SylStmt[], models: readonly number[], T: string[]) => {
  const X = T[c.x]
  const Y = T[c.y]
  const status = sylStatus(c, models)
  const base = POSS[c.f]
  if (base) {
    if (status === 'follows') return `a diagram satisfying every statement can be drawn in which ${sylText(base, X, Y).replace(/^./, ch => ch.toLowerCase())}, so it follows`
    const neg: Record<string, string> = { all: `some ${X} are forced outside ${Y}`, some: `no ${X} can be ${Y}`, no: `some ${X} are forced to be ${Y}`, someNot: `all ${X} are forced inside ${Y}` }
    return `it is impossible because ${neg[base]} by the statements, so it does not follow`
  }
  if (status === 'follows') {
    const idx = range(st.length)
    const subsets: number[][] = [...idx.map(i => [i]), ...idx.flatMap(i => idx.filter(j => j > i).map(j => [i, j])), idx]
    const why = subsets.find(sub => sylValid(sub.map(i => st[i])).every(m => sylHolds(c.f as SylForm, c.x, c.y, m))) ?? idx
    return `it is true in every possible diagram (it is forced by statement${why.length > 1 ? 's' : ''} ${why.map(i => i + 1).join(' and ')}), so it follows`
  }
  const f = c.f as SylForm
  const counter: Record<SylForm, string> = {
    all: `some ${X} lie outside ${Y}`,
    no: `some ${X} are ${Y}`,
    some: `no ${sg(X)} is ${an(sg(Y))}`,
    someNot: `every one of the ${X} is ${Y}`,
    onlyFew: models.some(m => !sylHolds('some', c.x, c.y, m)) ? `no ${sg(X)} is ${an(sg(Y))}` : `all ${X} are ${Y}`,
  }
  return `the statements still allow a case where ${counter[f]}, so it does not follow`
}

const sylStatements = (r: Rand, count: number): SylStmt[] => {
  const forms: SylForm[] = ['all', 'all', 'all', 'some', 'some', 'no', 'no', 'onlyFew', 'onlyFew', 'someNot']
  const order = shuffle(r, [0, 1, 2, 3])
  const out: SylStmt[] = []
  for (let i = 0; i < count; i++) {
    const a = order[i]
    const b = order[i + 1]
    const f = pick(r, forms)
    const flip = f === 'some' || f === 'no' ? r() < 0.5 : r() < 0.25
    out.push(flip ? { f, x: b, y: a } : { f, x: a, y: b })
  }
  return out
}
const randConc = (r: Rand, used: number[]): SylConc => {
  const x = pick(r, used)
  const y = pick(r, used.filter(v => v !== x))
  const f = pick(r, ['all', 'some', 'some', 'no', 'someNot', 'onlyFew', 'possAll', 'possAll', 'possSome', 'possNo', 'possSomeNot'] as SylConcForm[])
  return { f, x, y }
}
const xorAlways = (a: SylConc, b: SylConc, models: readonly number[]) =>
  !POSS[a.f] && !POSS[b.f] && models.every(m => sylHolds(a.f as SylForm, a.x, a.y, m) !== sylHolds(b.f as SylForm, b.x, b.y, m))

const SYL_TWO = ['Only conclusion I follows', 'Only conclusion II follows', 'Either conclusion I or conclusion II follows', 'Neither conclusion I nor conclusion II follows', 'Both conclusions I and II follow']
const sylHint = "Draw the minimal Venn diagram for each statement, then try to break each conclusion with an alternative diagram. 'Only a few A are B' means some A are B and some A are not B; a possibility conclusion follows if at least one valid diagram shows it."

const sylTwo = (r: Rand, idx: number) => {
  const T = shuffle(r, pick(r, SYL_THEMES)).map(t => t[0])
  const nst = r() < 0.6 ? 3 : 2
  const st = sylStatements(r, nst)
  const models = sylValid(st)
  if (!models.length) throw new Error('inconsistent')
  const used = [...new Set(st.flatMap(s => [s.x, s.y]))]
  const target = idx % 5
  for (let t = 0; t < 60; t++) {
    let c1 = randConc(r, used)
    let c2 = randConc(r, used)
    if (target === 2) {
      // build a complementary pair on the same two sets
      const x = pick(r, used)
      const y = pick(r, used.filter(v => v !== x))
      const [f1, f2] = pick(r, [['some', 'no'], ['all', 'someNot']] as [SylForm, SylForm][])
      ;[c1, c2] = shuffle(r, [{ f: f1, x, y }, { f: f2, x, y }])
    }
    if (c1.x === c2.x && c1.y === c2.y && c1.f === c2.f) continue
    const s1 = sylStatus(c1, models)
    const s2 = sylStatus(c2, models)
    if (s1 === 'certain' || s2 === 'certain') continue
    const isDirect = (c: SylConc) => st.some(s => s.x === c.x && s.y === c.y && s.f === c.f)
    if (isDirect(c1) || isDirect(c2)) continue
    let ans: number
    if (s1 === 'follows' && s2 === 'follows') ans = 4
    else if (s1 === 'follows') ans = 0
    else if (s2 === 'follows') ans = 1
    else ans = xorAlways(c1, c2, models) ? 2 : 3
    if (ans !== [0, 1, 2, 3, 4][target]) continue
    const question = `Statements: ${st.map((s, i) => `(${i + 1}) ${sylText(s.f, T[s.x], T[s.y])}.`).join(' ')} Conclusions: I. ${sylText(c1.f, T[c1.x], T[c1.y])}. II. ${sylText(c2.f, T[c2.x], T[c2.y])}. Taking the statements to be true even if they seem to be at variance with known facts, which conclusion(s) follow?`
    const why = `Conclusion I: ${sylWhy(c1, st, models, T)}. Conclusion II: ${sylWhy(c2, st, models, T)}.${ans === 2 ? ' The two conclusions form a complementary pair about the same two terms: in every valid diagram exactly one of them is true, so "either I or II" follows.' : ''}`
    const stCopy = [...st]
    emit({
      family: 'syl',
      topic: 'Syllogism',
      question,
      correct: SYL_TWO[ans],
      traps: shuffle(r, SYL_TWO.filter((_, i) => i !== ans)),
      explanation: why,
      hint: sylHint,
      seconds: 150,
      recompute: () => {
        const ms = sylValid(stCopy)
        const a = sylStatus(c1, ms) === 'follows'
        const b = sylStatus(c2, ms) === 'follows'
        return SYL_TWO[a && b ? 4 : a ? 0 : b ? 1 : xorAlways(c1, c2, ms) ? 2 : 3]
      },
    })
    return
  }
  throw new Error('no conclusion pair for target')
}

const sylPick = (r: Rand, idx: number) => {
  const T = shuffle(r, pick(r, SYL_THEMES)).map(t => t[0])
  const st = sylStatements(r, 3)
  const models = sylValid(st)
  if (!models.length) throw new Error('inconsistent')
  const used = [0, 1, 2, 3]
  const wantFollow = idx % 2 === 0 // even: pick the one that follows; odd: pick the one that does NOT follow
  const yes: SylConc[] = []
  const no: SylConc[] = []
  const seen = new Set<string>()
  for (let t = 0; t < 200 && (yes.length < 3 || no.length < 3); t++) {
    const c = randConc(r, used)
    const key = `${c.f}${c.x}${c.y}`
    if (seen.has(key) || st.some(s => s.x === c.x && s.y === c.y && s.f === c.f)) continue
    seen.add(key)
    const status = sylStatus(c, models)
    if (status === 'follows') yes.push(c)
    else if (status === 'fails') no.push(c)
  }
  const [one, many] = wantFollow ? [yes, no] : [no, yes]
  if (one.length < 1 || many.length < 3) throw new Error('not enough conclusions')
  const correct = one[0]
  const traps = many.slice(0, 3)
  const txt = (c: SylConc) => sylText(c.f, T[c.x], T[c.y])
  const stCopy = [...st]
  emit({
    family: 'syl',
    topic: 'Syllogism',
    question: `Statements: ${st.map((s, i) => `(${i + 1}) ${sylText(s.f, T[s.x], T[s.y])}.`).join(' ')} Which of the following conclusions ${wantFollow ? 'definitely follows' : 'does NOT follow'} from the statements?`,
    correct: txt(correct),
    traps: traps.map(txt),
    explanation: [correct, ...traps].map(c => `"${txt(c)}": ${sylWhy(c, st, models, T)}.`).join(' '),
    hint: sylHint,
    seconds: 165,
    recompute: () => {
      const ms = sylValid(stCopy)
      const hits = [correct, ...traps].filter(c => (sylStatus(c, ms) === 'follows') === wantFollow)
      return hits.length === 1 ? txt(hits[0]) : `${hits.length} candidates`
    },
  })
}

{
  let i = 0
  produce('syl', 26, 11001, r => sylTwo(r, i++), 200)
  let j = 0
  produce('syl', 16, 12001, r => sylPick(r, j++), 100)
}

// ---------------------------------------------------------------------------
// Coded inequalities — model-based (enumerate weak orderings of the letters)
// ---------------------------------------------------------------------------

type Rel = '>' | '<' | '=' | '≥' | '≤'
const RELS: Rel[] = ['>', '<', '=', '≥', '≤']
const relHolds = (rel: Rel, a: number, b: number) => (rel === '>' ? a > b : rel === '<' ? a < b : rel === '=' ? a === b : rel === '≥' ? a >= b : a <= b)
const REL_DEF: Record<Rel, string> = {
  '>': 'is neither smaller than nor equal to',
  '<': 'is neither greater than nor equal to',
  '=': 'is neither greater than nor smaller than',
  '≥': 'is not smaller than',
  '≤': 'is not greater than',
}
const INEQ_VARS = 6
/** Every assignment of values 0..5 to the six letters (enough to realise every weak ordering). */
const INEQ_MODELS: Int8Array[] = []
{
  const flat = new Int8Array(6 ** INEQ_VARS * INEQ_VARS)
  for (let k = 0; k < 6 ** INEQ_VARS; k++) {
    let v = k
    for (let t = 0; t < INEQ_VARS; t++) {
      flat[k * INEQ_VARS + t] = v % 6
      v = Math.floor(v / 6)
    }
    INEQ_MODELS.push(flat.subarray(k * INEQ_VARS, (k + 1) * INEQ_VARS))
  }
}
type Ineq = { a: number; rel: Rel; b: number }
type IneqConc = { a: number; rel: Rel; b: number }
const ineqModels = (st: readonly Ineq[]) => INEQ_MODELS.filter(m => st.every(s => relHolds(s.rel, m[s.a], m[s.b])))
const concHolds = (c: IneqConc, m: Int8Array) => relHolds(c.rel, m[c.a], m[c.b])
const ineqFollows = (c: IneqConc, ms: readonly Int8Array[]) => ms.every(m => concHolds(c, m))
/** A ≥/≤ conclusion whose strict form is also forced is avoided (exam conventions differ). */
const ineqAmbiguous = (c: IneqConc, ms: readonly Int8Array[]) =>
  (c.rel === '≥' || c.rel === '≤') && ineqFollows({ a: c.a, rel: c.rel === '≥' ? '>' : '<', b: c.b }, ms)
const strongest = (a: number, b: number, ms: readonly Int8Array[]): string => {
  for (const rel of ['=', '>', '<', '≥', '≤'] as Rel[]) if (ms.every(m => relHolds(rel, m[a], m[b]))) return rel
  return '?'
}

/** Builds chains like A ≥ B > C = D over the six letters, sharing letters across lines. */
const ineqChains = (r: Rand, L: string[]) => {
  const order = shuffle(r, range(INEQ_VARS))
  const relPool: Rel[] = ['>', '<', '=', '≥', '≤', '>', '<', '≥', '≤']
  const first = order.slice(0, 4)
  const second = [order[4], first[int(r, 1, 2)], order[5]]
  if (r() < 0.5) second.reverse()
  const lines = [first, second].map(vars => vars.slice(1).map((b, i) => ({ a: vars[i], rel: pick(r, relPool), b })))
  const text = lines.map(line => line.map((s, i) => `${i === 0 ? L[s.a] : ''} ${s.rel} ${L[s.b]}`).join('').trim())
  return { st: lines.flat(), text }
}
const pathText = (a: number, b: number, st: readonly Ineq[], L: string[]) => {
  // breadth-first search through the statement graph so the explanation can show the linking chain
  const adj = range(INEQ_VARS).map(() => [] as { to: number; rel: Rel }[])
  const flipRel: Record<Rel, Rel> = { '>': '<', '<': '>', '=': '=', '≥': '≤', '≤': '≥' }
  for (const s of st) {
    adj[s.a].push({ to: s.b, rel: s.rel })
    adj[s.b].push({ to: s.a, rel: flipRel[s.rel] })
  }
  const prev = new Map<number, { from: number; rel: Rel }>()
  const q = [a]
  const seen = new Set([a])
  while (q.length) {
    const u = q.shift() as number
    for (const e of adj[u])
      if (!seen.has(e.to)) {
        seen.add(e.to)
        prev.set(e.to, { from: u, rel: e.rel })
        q.push(e.to)
      }
  }
  if (!prev.has(b)) return `${L[a]} and ${L[b]} are not linked`
  const parts: string[] = [L[b]]
  let cur = b
  while (cur !== a) {
    const p = prev.get(cur) as { from: number; rel: Rel }
    parts.unshift(L[p.from], p.rel)
    cur = p.from
  }
  return parts.join(' ')
}

const INEQ_TWO = ['Only conclusion I is true', 'Only conclusion II is true', 'Either conclusion I or conclusion II is true', 'Neither conclusion I nor conclusion II is true', 'Both conclusions I and II are true']
const ineqWhy = (c: IneqConc, st: readonly Ineq[], ms: readonly Int8Array[], L: string[]) => {
  const best = strongest(c.a, c.b, ms)
  const chain = pathText(c.a, c.b, st, L)
  const ok = ineqFollows(c, ms)
  return `${L[c.a]} ${c.rel} ${L[c.b]}: the linking chain is ${chain}${best === '?' ? ', which mixes opposite signs, so no definite relation exists' : `, giving ${L[c.a]} ${best} ${L[c.b]}`} — ${ok ? 'true' : 'not definitely true'}`
}

const ineqTwo = (r: Rand, idx: number, coded: boolean) => {
  const L = shuffle(r, ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'J', 'K', 'L', 'M', 'P', 'Q', 'R', 'S', 'T', 'V']).slice(0, INEQ_VARS)
  const { st, text } = ineqChains(r, L)
  const ms = ineqModels(st)
  if (!ms.length) throw new Error('inconsistent')
  const target = idx % 5
  for (let t = 0; t < 80; t++) {
    const a = int(r, 0, INEQ_VARS - 1)
    const b = int(r, 0, INEQ_VARS - 1)
    if (a === b || st.some(s => (s.a === a && s.b === b) || (s.a === b && s.b === a))) continue
    let c1: IneqConc = { a, rel: pick(r, RELS), b }
    let c2: IneqConc
    if (target === 2) {
      const pairs: [Rel, Rel][] = [['>', '='], ['<', '='], ['≥', '<'], ['≤', '>']]
      const [r1, r2] = pick(r, pairs)
      ;[c1, c2] = shuffle(r, [{ a, rel: r1, b }, { a, rel: r2, b }])
    } else {
      const a2 = int(r, 0, INEQ_VARS - 1)
      const b2 = int(r, 0, INEQ_VARS - 1)
      if (a2 === b2 || st.some(s => (s.a === a2 && s.b === b2) || (s.a === b2 && s.b === a2))) continue
      c2 = { a: a2, rel: pick(r, RELS), b: b2 }
    }
    if (ineqAmbiguous(c1, ms) || ineqAmbiguous(c2, ms) || (c1.a === c2.a && c1.b === c2.b && c1.rel === c2.rel)) continue
    const f1 = ineqFollows(c1, ms)
    const f2 = ineqFollows(c2, ms)
    const xor = c1.a === c2.a && c1.b === c2.b && ms.every(m => concHolds(c1, m) !== concHolds(c2, m))
    const ans = f1 && f2 ? 4 : f1 ? 0 : f2 ? 1 : xor ? 2 : 3
    if (ans !== target) continue
    const sym = shuffle(r, ['@', '#', '$', '%', '&'])
    const code = new Map(RELS.map((rel, i) => [rel, sym[i]]))
    const enc = (s: string) => (coded ? s.replace(/[><=≥≤]/g, ch => code.get(ch as Rel) as string) : s)
    const defs = coded ? `In the following, ${RELS.map(rel => `'P ${code.get(rel)} Q' means 'P ${REL_DEF[rel]} Q'`).join('; ')}. ` : ''
    const cText = (c: IneqConc) => enc(`${L[c.a]} ${c.rel} ${L[c.b]}`)
    const question = `${defs}Statements: ${text.map(enc).join('; ')}. Conclusions: I. ${cText(c1)} II. ${cText(c2)}. Which of the following is correct?`
    const decoded = coded ? `Decoded statements: ${text.join('; ')}. ` : ''
    const stCopy = [...st]
    emit({
      family: 'ineq',
      topic: 'Coded inequalities',
      question,
      correct: INEQ_TWO[ans],
      traps: shuffle(r, INEQ_TWO.filter((_, i) => i !== ans)),
      explanation: `${decoded}I. ${ineqWhy(c1, st, ms, L)}. II. ${ineqWhy(c2, st, ms, L)}.${ans === 2 ? ' The two conclusions relate the same pair and together cover every case, exactly one being true each time, so "either I or II" is correct.' : ''}`,
      hint: coded ? 'Decode every symbol first, then join the statements through common letters; a single opposite sign in the chain kills the relation, and ≥ with = keeps ≥.' : 'Join the statements through common letters; one opposite sign breaks the chain, and a chain containing ≥ but no > gives only ≥ (which yields an either-or pair with > and =).',
      seconds: coded ? 150 : 110,
      recompute: () => {
        const m2 = ineqModels(stCopy)
        const g1 = ineqFollows(c1, m2)
        const g2 = ineqFollows(c2, m2)
        const x = c1.a === c2.a && c1.b === c2.b && m2.every(m => concHolds(c1, m) !== concHolds(c2, m))
        return INEQ_TWO[g1 && g2 ? 4 : g1 ? 0 : g2 ? 1 : x ? 2 : 3]
      },
    })
    return
  }
  throw new Error('no conclusions for target')
}

const INEQ5: Int8Array[] = INEQ_MODELS.filter(m => m[5] === 0 && m.every(v => v < 5))
const ineqSymbol = (r: Rand) => {
  // "Which symbol should replace ? so that both conclusions are definitely true?"
  const L = shuffle(r, ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'K', 'M', 'P', 'R', 'S', 'T']).slice(0, 5)
  const rels = range(4).map(() => pick(r, ['>', '≥', '=', '<', '≤'] as Rel[]))
  const hole = int(r, 0, 3)
  const build = (sym: Rel): Ineq[] => rels.map((rel, i) => ({ a: i, rel: i === hole ? sym : rel, b: i + 1 }))
  const modelsFor = (sym: Rel) => INEQ5.filter(m => build(sym).every(s => relHolds(s.rel, m[s.a], m[s.b])))
  // read two definite relations off the chain under a seeded "answer" symbol, spanning the hole
  const answerSym = pick(r, RELS)
  const ms0 = modelsFor(answerSym)
  const spans = range(5).flatMap(a => range(5).filter(b => b >= a + 2 && a <= hole && b > hole).map(b => [a, b]))
  const defs = shuffle(r, spans)
    .map(([a, b]) => ({ a, b, rel: strongest(a, b, ms0) }))
    .filter(x => x.rel !== '?')
    .map(x => (r() < 0.5 ? x : { a: x.b, b: x.a, rel: ({ '>': '<', '<': '>', '=': '=', '≥': '≤', '≤': '≥' } as Record<string, string>)[x.rel] }))
  if (defs.length < 2) throw new Error('chain too weak')
  const conc1 = defs[0] as IneqConc
  const conc2 = defs[1] as IneqConc
  const works = (sym: Rel) => {
    const ms = modelsFor(sym)
    return ms.length > 0 && ineqFollows(conc1, ms) && ineqFollows(conc2, ms) && !ineqAmbiguous(conc1, ms) && !ineqAmbiguous(conc2, ms)
  }
  const good = RELS.filter(works)
  if (good.length !== 1) throw new Error('need exactly one working symbol')
  const expr = (sym: string) => L.map((v, i) => (i < 4 ? `${v} ${i === hole ? sym : rels[i]} ` : v)).join('')
  const correct = good[0]
  const traps = shuffle(r, RELS.filter(x => x !== correct))
  const cTxt = (c: IneqConc) => `${L[c.a]} ${c.rel} ${L[c.b]}`
  emit({
    family: 'ineq',
    topic: 'Coded inequalities',
    question: `In the expression ${expr('?')}, which symbol should replace the question mark so that both '${cTxt(conc1)}' and '${cTxt(conc2)}' are definitely true?`,
    correct,
    traps,
    explanation: `Try each symbol. Only with '${correct}' does the chain ${expr(correct)} force ${cTxt(conc1)} and ${cTxt(conc2)} together; ${traps.slice(0, 3).map(t => `with '${t}' at least one of them is not certain`).join('; ')}.`,
    hint: 'Substitute each option and read the chain between the two letters of each conclusion; any opposite sign on the path makes the relation uncertain.',
    seconds: 120,
    recompute: () => {
      const g = RELS.filter(works)
      return g.length === 1 ? g[0] : `${g.length} symbols`
    },
  })
}

{
  let i = 0
  produce('ineq', 18, 13001, r => ineqTwo(r, i++, true), 200)
  let j = 0
  produce('ineq', 9, 14001, r => ineqTwo(r, j++, false), 120)
  produce('ineq', 8, 15001, r => ineqSymbol(r), 200)
}

// ---------------------------------------------------------------------------
// Blood relations — family-tree walks, path reduction and gender models
// ---------------------------------------------------------------------------

type Gender = 'M' | 'F'
type Person = { g: Gender; parents: number[]; spouse: number }
type RelWord = 'mother' | 'father' | 'brother' | 'sister' | 'wife' | 'husband' | 'son' | 'daughter'
type Step = 'U' | 'D' | 'S' | 'P'

const makeFamily = (r: Rand): Person[] => {
  const F: Person[] = []
  const add = (g: Gender, parents: number[] = []) => {
    F.push({ g, parents, spouse: -1 })
    return F.length - 1
  }
  const marry = (a: number, b: number) => {
    F[a].spouse = b
    F[b].spouse = a
  }
  const g1a = add('M')
  const g1b = add('F')
  marry(g1a, g1b)
  const g2a = add('M')
  const g2b = add('F')
  marry(g2a, g2b)
  const kidsA = range(int(r, 2, 3)).map(() => add(r() < 0.5 ? 'M' : 'F', [g1a, g1b]))
  const kidsB = range(int(r, 1, 2)).map(() => add(r() < 0.5 ? 'M' : 'F', [g2a, g2b]))
  // one cross-family marriage
  const x = pick(r, kidsA)
  const yOpts = kidsB.filter(k => F[k].g !== F[x].g)
  if (yOpts.length) marry(x, pick(r, yOpts))
  for (const k of [...kidsA, ...kidsB]) if (F[k].spouse < 0 && r() < 0.75) marry(k, add(F[k].g === 'M' ? 'F' : 'M'))
  const couples = [...kidsA, ...kidsB].filter(k => F[k].spouse >= 0 && F[k].g === 'M')
  for (const m of couples) for (let c = int(r, 1, 3); c > 0; c--) add(r() < 0.5 ? 'M' : 'F', [m, F[m].spouse])
  return F
}
const famNbrs = (F: Person[], p: number): { q: number; step: Step }[] => {
  const out: { q: number; step: Step }[] = []
  F[p].parents.forEach(q => out.push({ q, step: 'U' }))
  F.forEach((o, q) => {
    if (o.parents.includes(p)) out.push({ q, step: 'D' })
    if (q !== p && o.parents.length && o.parents[0] === F[p].parents[0] && F[p].parents.length) out.push({ q, step: 'S' })
  })
  if (F[p].spouse >= 0) out.push({ q: F[p].spouse, step: 'P' })
  return out
}
/** Word for "A is the ___ of B" when the step from A to B is `step`. */
const relWordOf = (step: Step, g: Gender): RelWord =>
  step === 'D' ? (g === 'M' ? 'father' : 'mother') : step === 'U' ? (g === 'M' ? 'son' : 'daughter') : step === 'S' ? (g === 'M' ? 'brother' : 'sister') : g === 'M' ? 'husband' : 'wife'
const stepOfWord = (w: RelWord): Step => (w === 'father' || w === 'mother' ? 'D' : w === 'son' || w === 'daughter' ? 'U' : w === 'brother' || w === 'sister' ? 'S' : 'P')
const genderOfWord = (w: RelWord): Gender => (['father', 'son', 'brother', 'husband'].includes(w) ? 'M' : 'F')

const REDUCE: [string, string][] = [['UD', 'S'], ['DU', 'P'], ['SU', 'U'], ['DS', 'D'], ['SS', 'S'], ['PD', 'D'], ['UP', 'U']]
const reducePath = (path: string): string | null => {
  if (path.includes('PP')) return null
  let cur = path
  for (let guard = 0; guard < 20; guard++) {
    const hit = REDUCE.find(([a]) => cur.includes(a))
    if (!hit) break
    cur = cur.replace(hit[0], hit[1])
    if (cur.includes('PP')) return null
  }
  return cur
}
const KIN: Record<string, [string, string] | string> = {
  D: ['Son', 'Daughter'],
  DD: ['Grandson', 'Granddaughter'],
  U: ['Father', 'Mother'],
  UU: ['Grandfather', 'Grandmother'],
  S: ['Brother', 'Sister'],
  P: ['Husband', 'Wife'],
  SD: ['Nephew', 'Niece'],
  US: ['Uncle', 'Aunt'],
  USD: 'Cousin',
  DP: ['Son-in-law', 'Daughter-in-law'],
  PU: ['Father-in-law', 'Mother-in-law'],
  PS: ['Brother-in-law', 'Sister-in-law'],
  SP: ['Brother-in-law', 'Sister-in-law'],
}
const flipPath = (p: string) => p.split('').reverse().map(c => (c === 'U' ? 'D' : c === 'D' ? 'U' : c)).join('')

/** Independent truth from the tree, for cross-checking the reduction rules. */
const treeCode = (F: Person[], s: number, t: number): string | null => {
  const par = (p: number) => F[p].parents
  const sib = (a: number, b: number) => a !== b && par(a).length > 0 && par(a)[0] === par(b)[0]
  const isPar = (a: number, b: number) => par(b).includes(a) // a parent of b
  if (F[s].spouse === t) return 'P'
  if (isPar(t, s)) return 'U'
  if (isPar(s, t)) return 'D'
  if (sib(s, t)) return 'S'
  if (par(s).some(p => isPar(t, p))) return 'UU'
  if (par(t).some(p => isPar(s, p))) return 'DD'
  if (par(s).some(p => sib(p, t))) return 'US'
  if (par(t).some(p => sib(p, s))) return 'SD'
  if (par(s).some(p => par(t).some(q => sib(p, q)))) return 'USD'
  if (par(t).includes(-1)) return null
  if (F[t].spouse >= 0 && isPar(s, F[t].spouse)) return 'DP'
  if (F[s].spouse >= 0 && isPar(t, F[s].spouse)) return 'PU'
  if (F[s].spouse >= 0 && sib(F[s].spouse, t)) return 'PS'
  if (F[t].spouse >= 0 && sib(s, F[t].spouse)) return 'SP'
  return null
}

type Chain = { words: RelWord[] } // words[i]: P_i is the words[i] of P_{i+1}
const chainPath = (c: Chain, from: number, to: number) => {
  const steps = c.words.map(stepOfWord)
  if (from < to) return steps.slice(from, to).join('')
  return flipPath(steps.slice(to, from).join(''))
}
/** Gender of each chain person in every model consistent with the statements (null if impossible). */
const chainGenders = (c: Chain): Gender[][] | null => {
  const n = c.words.length + 1
  const spousePairs: [number, number][] = []
  for (let a = 0; a < n; a++)
    for (let b = a + 1; b < n; b++) {
      const red = reducePath(chainPath(c, a, b))
      if (red === null) return null
      if (red === 'P') spousePairs.push([a, b])
    }
  const out: Gender[][] = []
  for (let m = 0; m < 1 << n; m++) {
    const g: Gender[] = range(n).map(i => ((m >> i) & 1 ? 'F' : 'M'))
    if (c.words.some((w, i) => genderOfWord(w) !== g[i])) continue
    if (spousePairs.some(([a, b]) => g[a] === g[b])) continue
    out.push(g)
  }
  return out.length ? out : null
}
/** The relation of P_t to P_s as a kinship term, or 'Cannot be determined'. */
const chainAnswer = (c: Chain, s: number, t: number): string | null => {
  const red = reducePath(chainPath(c, s, t))
  if (!red) return null
  const kin = KIN[red]
  if (!kin) return null
  const models = chainGenders(c)
  if (!models) return null
  if (typeof kin === 'string') return kin
  const gs = new Set(models.map(g => g[t]))
  return gs.size === 1 ? kin[[...gs][0] === 'M' ? 0 : 1] : 'Cannot be determined'
}
const kinTraps = (red: string, ans: string): string[] => {
  const kin = KIN[red]
  const out: string[] = []
  if (Array.isArray(kin)) out.push(kin[0] === ans ? kin[1] : kin[0])
  const rev = KIN[flipPath(red)]
  if (rev) out.push(...(Array.isArray(rev) ? rev : [rev]))
  const near: Record<string, string[]> = { D: ['Grandson', 'Nephew'], DD: ['Son', 'Nephew'], U: ['Grandfather', 'Uncle'], UU: ['Father', 'Uncle'], S: ['Cousin', 'Brother-in-law'], P: ['Brother-in-law', 'Sister-in-law'], SD: ['Son', 'Cousin'], US: ['Father', 'Cousin'], USD: ['Brother', 'Nephew'], DP: ['Son', 'Nephew'], PU: ['Father', 'Uncle'], PS: ['Brother', 'Cousin'], SP: ['Brother', 'Cousin'] }
  out.push(...(near[red] ?? []))
  if (ans !== 'Cannot be determined') out.push('Cannot be determined')
  return out
}

const walkChain = (r: Rand, len: number): { chain: Chain; F: Person[]; people: number[] } | null => {
  const F = makeFamily(r)
  let cur = int(r, 0, F.length - 1)
  const people = [cur]
  const words: RelWord[] = []
  for (let i = 0; i < len; i++) {
    const opts = famNbrs(F, cur).filter(o => !people.includes(o.q))
    if (!opts.length) return null
    const o = pick(r, opts)
    words.push(relWordOf(o.step, F[cur].g))
    people.push(o.q)
    cur = o.q
  }
  return { chain: { words }, F, people }
}

const BR_SYMBOLS = ['+', '−', '×', '÷', '@', '#', '$', '%', '*']
const brHint = 'Write the chain as a family tree: mark each person’s gender only when a statement fixes it, convert every link to parent/child/sibling/spouse, and simplify (a parent’s other child is a sibling; a child’s other parent is a spouse).'

const bloodCoded = (r: Rand, verbal: boolean) => {
  const len = int(r, 3, 5)
  const w = walkChain(r, len)
  if (!w) throw new Error('walk failed')
  const { chain, F, people } = w
  const n = len + 1
  const L = shuffle(r, ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'J', 'K', 'L', 'M', 'N', 'P', 'Q', 'R', 'S', 'T']).slice(0, n)
  // choose the pair to ask about
  const pairs = shuffle(r, range(n).flatMap(a => range(n).filter(b => b !== a && Math.abs(a - b) >= 2).map(b => [a, b])))
  for (const [s, t] of pairs) {
    const ans = chainAnswer(chain, s, t)
    if (!ans) continue
    const red = reducePath(chainPath(chain, s, t)) as string
    const truth = treeCode(F, people[s], people[t])
    if (truth !== red) continue // reduction must agree with the actual tree
    if (ans === 'Cannot be determined' && r() < 0.6) continue
    let question: string
    let decode: string
    if (!verbal) {
      const used = [...new Set(chain.words)]
      const extra = shuffle(r, (['mother', 'father', 'brother', 'sister', 'wife', 'husband', 'son', 'daughter'] as RelWord[]).filter(x => !used.includes(x))).slice(0, Math.max(0, 5 - used.length))
      const defs = shuffle(r, [...used, ...extra])
      const sym = new Map(defs.map((d, i) => [d, BR_SYMBOLS[i]]))
      const expr = L.map((x, i) => (i < len ? `${x} ${sym.get(chain.words[i])} ` : x)).join('')
      question = `In a certain code, ${defs.map(d => `'P ${sym.get(d)} Q' means 'P is the ${d} of Q'`).join('; ')}. If '${expr}' is true, how is ${L[t]} related to ${L[s]}?`
      decode = `Decoding: ${chain.words.map((wd, i) => `${L[i]} is the ${wd} of ${L[i + 1]}`).join('; ')}.`
    } else {
      question = `${chain.words.map((wd, i) => `${L[i]} is the ${wd} of ${L[i + 1]}.`).join(' ')} No one in the family has remarried. How is ${L[t]} related to ${L[s]}?`
      decode = ''
    }
    const lo = Math.min(s, t)
    const hiI = Math.max(s, t)
    const links = chain.words.slice(lo, hiI).map((wd, k) => `${L[lo + k]} is the ${wd} of ${L[lo + k + 1]}`).join(', ')
    let gNote = ''
    if (ans === 'Cannot be determined') gNote = ` No statement fixes the gender of ${L[t]}, so the exact term cannot be determined.`
    else if (typeof KIN[red] !== 'string') {
      if (t < len) gNote = ` ${L[t]} is stated to be a ${['father', 'son', 'brother', 'husband'].includes(chain.words[t]) ? 'male' : 'female'} (${L[t]} is the ${chain.words[t]} of ${L[t + 1]}).`
      else {
        const partner = range(n).find(i => i !== t && reducePath(chainPath(chain, i, t)) === 'P')
        if (partner !== undefined) gNote = ` ${L[t]} must be the spouse of ${L[partner]}, so ${L[t]}'s gender is opposite to ${L[partner]}'s.`
      }
    }
    const kinName = typeof KIN[red] === 'string' ? (KIN[red] as string).toLowerCase() : (KIN[red] as string[]).join('/').toLowerCase()
    emit({
      family: 'blood',
      topic: 'Blood relations',
      question,
      correct: ans,
      traps: shuffle(r, kinTraps(red, ans)),
      explanation: `${decode} Links between ${L[lo]} and ${L[hiI]}: ${links}. Relative to ${L[s]}, ${L[t]} is the ${red.split('').map(c => ({ U: 'parent', D: 'child', S: 'sibling', P: 'spouse' })[c]).join("'s ")} (a parent's other child is a sibling, a child's other parent is the spouse), i.e. ${L[s]}'s ${kinName}.${gNote}`,
      hint: brHint,
      seconds: verbal ? 120 : 150,
      recompute: () => chainAnswer(chain, s, t) ?? 'invalid',
    })
    return
  }
  throw new Error('no determinate pair')
}

const bloodWhich = (r: Rand) => {
  // Which expression shows that the first person is the <term> of the last?
  const L = shuffle(r, ['P', 'Q', 'R', 'S', 'T', 'M', 'N', 'K']).slice(0, 4)
  const words: RelWord[] = shuffle(r, ['mother', 'father', 'brother', 'sister', 'wife', 'husband', 'son', 'daughter'] as RelWord[]).slice(0, 5)
  const sym = new Map(words.map((d, i) => [d, BR_SYMBOLS[i]]))
  const opts: { chain: Chain; text: string }[] = []
  for (let t = 0; t < 300 && opts.length < 30; t++) {
    const c: Chain = { words: range(3).map(() => pick(r, words)) }
    const text = L.map((x, i) => (i < 3 ? `${x} ${sym.get(c.words[i])} ` : x)).join('')
    if (!opts.some(o => o.text === text)) opts.push({ chain: c, text })
  }
  const relOf = (c: Chain) => chainAnswer(c, 3, 0) // relation of first (index 0) to last (index 3)
  const valid = opts.filter(o => {
    const a = relOf(o.chain)
    return a && a !== 'Cannot be determined'
  })
  const byTerm = new Map<string, typeof opts>()
  valid.forEach(o => byTerm.set(relOf(o.chain) as string, [...(byTerm.get(relOf(o.chain) as string) ?? []), o]))
  const terms = shuffle(r, [...byTerm.keys()])
  for (const term of terms) {
    const right = (byTerm.get(term) as typeof opts)[0]
    const wrong = shuffle(r, opts.filter(o => relOf(o.chain) !== term)).slice(0, 3)
    if (wrong.length < 3) continue
    const offered = [right, ...wrong]
    emit({
      family: 'blood',
      topic: 'Blood relations',
      question: `In a certain code, ${words.map(d => `'A ${sym.get(d)} B' means 'A is the ${d} of B'`).join('; ')}. Which of the following expressions definitely means that ${L[0]} is the ${term.toLowerCase()} of ${L[3]}?`,
      correct: right.text,
      traps: wrong.map(o => o.text),
      explanation: offered.map(o => `${o.text}: ${o.chain.words.map((wd, i) => `${L[i]} is ${wd} of ${L[i + 1]}`).join(', ')} ⇒ ${L[0]} is ${(() => {
        const a = relOf(o.chain)
        return a ? (a === 'Cannot be determined' ? 'related but the exact term cannot be fixed' : `the ${a.toLowerCase()} of ${L[3]}`) : 'not consistently related (the statements conflict)'
      })()}`).join('. ') + '.',
      hint: brHint,
      seconds: 180,
      recompute: () => {
        const hits = offered.filter(o => relOf(o.chain) === term)
        return hits.length === 1 ? hits[0].text : `${hits.length} hits`
      },
    })
    return
  }
  throw new Error('no usable term')
}

produce('blood', 20, 16001, r => bloodCoded(r, false), 400)
produce('blood', 12, 17001, r => bloodCoded(r, true), 300)
produce('blood', 10, 18001, r => bloodWhich(r), 100)

// ---------------------------------------------------------------------------
// Input–output machines (simulated)
// ---------------------------------------------------------------------------

type Machine = { wordsAsc: boolean; numsAsc: boolean; wordSide: 'left' | 'right'; stack: boolean }
const runMachine = (input: string[], m: Machine): string[][] => {
  const isNum = (x: string) => /^\d+$/.test(x)
  const words = input.filter(x => !isNum(x))
  const nums = input.filter(isNum)
  const wOrder = [...words].sort((a, b) => (m.wordsAsc ? a.localeCompare(b) : b.localeCompare(a)))
  const nOrder = [...nums].sort((a, b) => (m.numsAsc ? Number(a) - Number(b) : Number(b) - Number(a)))
  const steps: string[][] = []
  const k = Math.max(words.length, nums.length)
  let leftPlaced: string[] = []
  let rightPlaced: string[] = []
  for (let i = 0; i < k; i++) {
    const w = wOrder[i]
    const nn = nOrder[i]
    const toLeft = m.wordSide === 'left' ? w : nn
    const toRight = m.wordSide === 'left' ? nn : w
    if (toLeft !== undefined) leftPlaced = m.stack ? [toLeft, ...leftPlaced] : [...leftPlaced, toLeft]
    if (toRight !== undefined) rightPlaced = m.stack ? [...rightPlaced, toRight] : [toRight, ...rightPlaced]
    const placed = new Set([...leftPlaced, ...rightPlaced])
    steps.push([...leftPlaced, ...input.filter(x => !placed.has(x)), ...rightPlaced])
  }
  return steps
}
const IO_WORDS = ['tiger', 'mango', 'river', 'bold', 'quiet', 'eagle', 'house', 'jump', 'night', 'apple', 'zebra', 'grape', 'vivid', 'orbit', 'kite', 'dream', 'lunar', 'smile', 'fresh', 'cloud', 'urban', 'yield', 'wheat', 'pearl']
const ioInput = (r: Rand) => {
  const words = shuffle(r, IO_WORDS).slice(0, 4)
  const nums: string[] = []
  while (nums.length < 4) {
    const v = String(int(r, 11, 98))
    if (!nums.includes(v)) nums.push(v)
  }
  return shuffle(r, [...words, ...nums])
}
const ioPuzzle = (r: Rand, ask: number) => {
  const m: Machine = { wordsAsc: r() < 0.6, numsAsc: r() < 0.5, wordSide: r() < 0.5 ? 'left' : 'right', stack: r() < 0.35 }
  const ex = ioInput(r)
  const exSteps = runMachine(ex, m)
  const inp = ioInput(r)
  const steps = runMachine(inp, m)
  // every step must visibly change the line, otherwise the step count is ambiguous
  for (const ss of [exSteps, steps]) ss.forEach((st, i) => {
    const prev = i === 0 ? (ss === exSteps ? ex : inp) : ss[i - 1]
    if (st.join(' ') === prev.join(' ')) throw new Error('idle step')
  })
  const line = (xs: string[]) => xs.join(' ')
  const illus = `A word and number arrangement machine, given an input line, rearranges it step by step following a fixed rule. Illustration — Input: ${line(ex)}. ${exSteps.map((s, i) => `Step ${ROMAN[i + 1]}: ${line(s)}.`).join(' ')} (Step ${ROMAN[exSteps.length]} is the last step.) Following the same rule, answer for the input: ${line(inp)}.`
  const rule = `Rule: in each step the ${m.wordsAsc ? 'next word in dictionary order' : 'next word in reverse dictionary order'} goes to the ${m.wordSide} side and the ${m.numsAsc ? 'next smallest number' : 'next largest number'} goes to the ${m.wordSide === 'left' ? 'right' : 'left'} side, ${m.stack ? 'each new element taking the extreme end and pushing the earlier ones inward' : 'each new element placed just inside the elements already arranged'}; the rest keep their relative order.`
  const solved = `${rule} For the given input: ${steps.map((s, i) => `Step ${ROMAN[i + 1]}: ${line(s)}`).join('; ')}.`
  const last = steps.length
  const hint = 'From the illustration, note which word and which number move in Step I and where they go; check whether later picks are placed inside the earlier ones or at the very ends.'
  const kStep = int(r, 2, last - 1)
  const frames: (() => void)[] = [
    () => {
      const swapAdj = (xs: string[]) => {
        const c = [...xs]
        const i = int(r, 2, c.length - 3)
        ;[c[i], c[i + 1]] = [c[i + 1], c[i]]
        return c
      }
      emit({ family: 'io', topic: 'Input-output', question: `${illus} Which of the following is Step ${ROMAN[kStep]}?`, correct: line(steps[kStep - 1]), traps: [line(steps[kStep - 2]), line(steps[kStep]), line(swapAdj(steps[kStep - 1])), line(runMachine(inp, { ...m, stack: !m.stack })[kStep - 1])], explanation: solved, hint, seconds: 200, recompute: () => line(runMachine(inp, m)[kStep - 1]) })
    },
    () => {
      const pos = int(r, 2, 6)
      const fromRight = r() < 0.5
      const at = (xs: string[]) => (fromRight ? xs[xs.length - pos] : xs[pos - 1])
      const s = steps[kStep - 1]
      emit({ family: 'io', topic: 'Input-output', question: `${illus} In Step ${ROMAN[kStep]}, which element is ${nth(pos)} from the ${fromRight ? 'right' : 'left'} end?`, correct: at(s), traps: [fromRight ? s[pos - 1] : s[s.length - pos], at(steps[kStep - 2]), at(steps[kStep]), s[(fromRight ? s.length - pos : pos - 1) + 1], s[(fromRight ? s.length - pos : pos - 1) - 1]].filter(Boolean), explanation: solved, hint, seconds: 190, recompute: () => at(runMachine(inp, m)[kStep - 1]) })
    },
    () => {
      const fin = steps[last - 1]
      const x = pick(r, fin.slice(1, -1))
      const y = pick(r, fin.filter(v => v !== x))
      const gap = (xs: string[]) => String(Math.abs(xs.indexOf(x) - xs.indexOf(y)) - 1)
      const g = Number(gap(fin))
      emit({ family: 'io', topic: 'Input-output', question: `${illus} In the last step, how many elements lie between '${x}' and '${y}'?`, correct: String(g), traps: [g + 1, g - 1, g + 2, Number(gap(steps[last - 2]))].filter(v => v >= 0 && v !== g).map(String), explanation: solved, hint, seconds: 190, recompute: () => gap(runMachine(inp, m)[last - 1]) })
    },
    () => {
      const s2 = steps[1]
      emit({ family: 'io', topic: 'Input-output', question: `${illus.replace(/Following the same rule, answer for the input: .*$/, '')}If Step II of another input is '${line(s2)}', what will be the last step for that input?`, correct: line(steps[last - 1]), traps: [line(steps[last - 2]), line(runMachine(inp, { ...m, stack: !m.stack })[last - 1]), line([...steps[last - 1]].reverse()), line(runMachine(inp, { ...m, numsAsc: !m.numsAsc })[last - 1])], explanation: `${rule} Step II already has two words and two numbers fixed; continuing: ${steps.slice(2).map((s, i) => `Step ${ROMAN[i + 3]}: ${line(s)}`).join('; ')}.`, hint, seconds: 210, recompute: () => line(runMachine(inp, m)[last - 1]) })
    },
    () => {
      const target = steps[kStep - 1]
      emit({ family: 'io', topic: 'Input-output', question: `${illus} Which step is '${line(target)}'?`, correct: `Step ${ROMAN[kStep]}`, traps: [`Step ${ROMAN[kStep - 1]}`, `Step ${ROMAN[kStep + 1]}`, 'There is no such step', `Step ${ROMAN[kStep + 2] ?? 'VI'}`], explanation: solved, hint, seconds: 180, recompute: () => `Step ${ROMAN[runMachine(inp, m).findIndex(s => line(s) === line(target)) + 1]}` })
    },
  ]
  frames[ask % frames.length]()
}
const ROMAN = ['', 'I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII']
{
  let i = 0
  produce('io', 30, 19001, r => ioPuzzle(r, i++), 120)
}

// ---------------------------------------------------------------------------
// Coding–decoding
// ---------------------------------------------------------------------------

const CODE_WORDS = ['police', 'duty', 'law', 'order', 'public', 'safety', 'first', 'always', 'serve', 'protect', 'nation', 'honour', 'truth', 'wins', 'brave', 'guard', 'peace', 'keep']
const CODE_SYLL = ['ka', 'pi', 'zo', 'mu', 'te', 'ri', 'lo', 'ne', 'sa', 'fu', 'jo', 'ba', 'dy', 'qe', 'vo', 'ga']

/** Sound propagation: candidate codes per word from intersection/exclusion, then singles. */
const propagateCodes = (words: string[], sentences: { w: string[]; c: string[] }[]) => {
  const allCodes = [...new Set(sentences.flatMap(s => s.c))]
  const cand = new Map(words.map(w => [w, new Set(allCodes)]))
  for (const w of words)
    for (const s of sentences) {
      const set = cand.get(w) as Set<string>
      if (s.w.includes(w)) for (const c of [...set]) if (!s.c.includes(c)) set.delete(c)
      if (!s.w.includes(w)) for (const c of s.c) set.delete(c)
    }
  for (let changed = true; changed; ) {
    changed = false
    for (const w of words) {
      const set = cand.get(w) as Set<string>
      if (set.size === 1) {
        const c = [...set][0]
        for (const o of words)
          if (o !== w && (cand.get(o) as Set<string>).delete(c)) changed = true
      }
    }
    for (const s of sentences)
      for (const c of s.c) {
        const holders = s.w.filter(w => (cand.get(w) as Set<string>).has(c))
        if (holders.length === 1 && (cand.get(holders[0]) as Set<string>).size > 1) {
          cand.set(holders[0], new Set([c]))
          changed = true
        }
      }
  }
  return cand
}
/** Independent brute force: all bijections consistent with every sentence. */
const bruteCodes = (words: string[], sentences: { w: string[]; c: string[] }[]) => {
  const codes = [...new Set(sentences.flatMap(s => s.c))]
  const sols: Map<string, string>[] = []
  const asg = new Map<string, string>()
  const used = new Set<string>()
  const ok = (w: string, c: string) => sentences.every(s => s.w.includes(w) === s.c.includes(c))
  const rec = (i: number) => {
    if (i === words.length) {
      sols.push(new Map(asg))
      return
    }
    for (const c of codes)
      if (!used.has(c) && ok(words[i], c)) {
        used.add(c)
        asg.set(words[i], c)
        rec(i + 1)
        used.delete(c)
        asg.delete(words[i])
      }
  }
  rec(0)
  return sols
}

const codeSentences = (r: Rand, ask: number) => {
  const words = shuffle(r, CODE_WORDS).slice(0, 8)
  const codes = shuffle(r, CODE_SYLL).slice(0, 8)
  const code = new Map(words.map((w, i) => [w, codes[i]]))
  const sentences = range(4).map(() => {
    const w = shuffle(r, words).slice(0, int(r, 3, 4))
    return { w, c: shuffle(r, w.map(x => code.get(x) as string)) }
  })
  const present = words.filter(w => sentences.some(s => s.w.includes(w)))
  const cand = propagateCodes(present, sentences)
  const fixed = present.filter(w => (cand.get(w) as Set<string>).size === 1 && sentences.filter(s => s.w.includes(w)).length >= 2)
  const open = present.filter(w => (cand.get(w) as Set<string>).size > 1)
  if (fixed.length < 2) throw new Error('too few determined words')
  const show = sentences.map(s => `'${s.w.join(' ')}' is written as '${s.c.join(' ')}'`).join('; ')
  const stem = `In a certain code language, ${show}.`
  const why = (w: string) => {
    const inS = sentences.map((s, i) => (s.w.includes(w) ? i + 1 : 0)).filter(Boolean)
    return `'${w}' appears in sentences ${inS.join(' and ')}; the codes common to them, after removing codes already fixed for other words${sentences.some(s => !s.w.includes(w)) ? ' and codes from sentences without the word' : ''}, leave only '${code.get(w)}'`
  }
  const solve = () => bruteCodes(present, sentences)
  const frame = ask % 3
  if (frame === 0) {
    const w = pick(r, fixed)
    emit({
      family: 'code',
      topic: 'Coding-decoding',
      question: `${stem} What is the code for '${w}'?`,
      correct: code.get(w) as string,
      traps: [...shuffle(r, sentences.filter(s => s.w.includes(w)).flatMap(s => s.c)), ...codes],
      explanation: `${why(w)}. Fixed codes: ${fixed.map(x => `${x} = ${code.get(x)}`).join(', ')}${open.length ? `; ${open.join(', ')} cannot be pinned individually` : ''}.`,
      hint: 'Compare sentences pairwise: a word common to two sentences takes a code common to both; strike out codes already fixed.',
      seconds: 120,
      recompute: () => {
        const sols = solve()
        const vals = new Set(sols.map(m => m.get(w)))
        return vals.size === 1 ? ([...vals][0] as string) : 'not determined'
      },
    })
  } else if (frame === 1) {
    const w = pick(r, fixed)
    const c = code.get(w) as string
    emit({
      family: 'code',
      topic: 'Coding-decoding',
      question: `${stem} Which word is coded as '${c}'?`,
      correct: w,
      traps: [...shuffle(r, sentences.filter(s => s.c.includes(c)).flatMap(s => s.w)), ...words],
      explanation: `${why(w)}, so '${c}' stands for '${w}'.`,
      hint: 'A code that appears in two sentences belongs to a word common to both; use sentences that lack the code to exclude candidates.',
      seconds: 120,
      recompute: () => {
        const sols = solve()
        const vals = new Set(sols.map(m => [...m].find(([, v]) => v === c)?.[0]))
        return vals.size === 1 ? ([...vals][0] as string) : 'not determined'
      },
    })
  } else {
    const [a, b] = shuffle(r, fixed)
    const ans = [code.get(a) as string, code.get(b) as string].sort().join(' ')
    const traps = shuffle(r, codes)
      .flatMap(x => codes.map(y => [x, y]))
      .filter(([x, y]) => x < y && [x, y].sort().join(' ') !== ans && (x === code.get(a) || y === code.get(b) || x === code.get(b) || y === code.get(a)))
      .map(p => p.join(' '))
    emit({
      family: 'code',
      topic: 'Coding-decoding',
      question: `${stem} Which of the following could be the code for '${a} ${b}' (codes may appear in any order)?`,
      correct: ans,
      traps: shuffle(r, traps),
      explanation: `${why(a)}; ${why(b)}. So '${a} ${b}' is coded with '${code.get(a)}' and '${code.get(b)}' in some order.`,
      hint: 'Fix each of the two words separately by sentence comparison; order of codes in a sentence is irrelevant.',
      seconds: 140,
      recompute: () => {
        const sols = solve()
        const vals = new Set(sols.map(m => [m.get(a), m.get(b)].sort().join(' ')))
        return vals.size === 1 ? [...vals][0] : 'not determined'
      },
    })
  }
}

const ALPHA = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
const shiftL = (ch: string, k: number) => ALPHA[mod(ALPHA.indexOf(ch) + k, 26)]
type LetterOp = { name: string; f: (w: string) => string }
const letterOps = (k: number): LetterOp[] => [
  { name: 'reverse the word', f: w => w.split('').reverse().join('') },
  { name: 'reverse each half separately', f: w => w.slice(0, w.length / 2).split('').reverse().join('') + w.slice(w.length / 2).split('').reverse().join('') },
  { name: 'swap each adjacent pair (1↔2, 3↔4, 5↔6)', f: w => w.replace(/(.)(.)/g, '$2$1') },
  { name: `move each letter ${k} places forward`, f: w => w.split('').map(c => shiftL(c, k)).join('') },
  { name: `move each letter ${k} places backward`, f: w => w.split('').map(c => shiftL(c, -k)).join('') },
  { name: `move letters in odd positions ${k} forward and in even positions ${k} backward`, f: w => w.split('').map((c, i) => shiftL(c, i % 2 === 0 ? k : -k)).join('') },
  { name: 'replace each letter by its opposite (A↔Z, B↔Y, …)', f: w => w.split('').map(c => ALPHA[25 - ALPHA.indexOf(c)]).join('') },
]
const SIX = ['GARDEN', 'PLANET', 'MOTHER', 'SILVER', 'FOREST', 'BRIDGE', 'CASTLE', 'POLICE', 'TEMPLE', 'WINTER', 'MARKET', 'ORANGE', 'PENCIL', 'STREAM', 'FLOWER', 'CAMERA', 'BOTTLE', 'GOLDEN', 'MIRROR', 'SIGNAL', 'TICKET', 'VOLUME']
const codeLetters = (r: Rand) => {
  const k = int(r, 1, 3)
  const ops = letterOps(k)
  const [i1, i2] = shuffle(r, range(ops.length)).slice(0, 2)
  const o1 = ops[i1]
  const o2 = ops[i2]
  // order matters only when it changes the result; require a genuinely two-step rule
  const enc = (w: string) => o2.f(o1.f(w))
  const [e1, e2, target] = shuffle(r, SIX).slice(0, 3)
  if (enc(target) === o1.f(target) || enc(target) === o2.f(target)) throw new Error('rule collapses')
  const alt = letterOps(k + 1)
  const c0 = enc(target)
  const traps = [o1.f(target), o2.f(target), o2.f(alt[i1].f(target)), alt[i2].f(o1.f(target)), o1.f(o2.f(target)), c0.split('').map(ch => shiftL(ch, 1)).join(''), c0[1] + c0[0] + c0.slice(2), c0.slice(0, 4) + c0[5] + c0[4]]
  emit({
    family: 'code',
    topic: 'Coding-decoding',
    question: `In a certain code, ${e1} is written as ${enc(e1)} and ${e2} is written as ${enc(e2)}. Following the same two-stage rule, how is ${target} written?`,
    correct: enc(target),
    traps,
    explanation: `The rule has two stages: first ${o1.name}, then ${o2.name}. Check: ${e1} → ${o1.f(e1)} → ${enc(e1)}. For ${target}: ${target} → ${o1.f(target)} → ${enc(target)}.`,
    hint: 'Compare letter positions first (is the word reversed or halves swapped?), then compare alphabet values to find the shift.',
    seconds: 150,
    recompute: () => o2.f(o1.f(target)),
  })
}

const codeConditions = (r: Rand) => {
  const letters = shuffle(r, ALPHA.split('')).slice(0, 12)
  if (letters.filter(c => 'AEIOU'.includes(c)).length < 2) throw new Error('need vowels')
  const syms = shuffle(r, ['2', '5', '7', '9', '4', '8', '3', '6', '@', '#', '$', '%', '&', '*', '©', '1'])
  const table = new Map(letters.map((c, i) => [c, syms[i]]))
  const isV = (c: string) => 'AEIOU'.includes(c)
  type Cond = { text: string; when: (w: string) => boolean; apply: (codes: string[], w: string) => string[] }
  const conds: Cond[] = [
    { text: 'If the first letter is a vowel and the last letter is a consonant, the codes of the first and the last letters are interchanged', when: w => isV(w[0]) && !isV(w[w.length - 1]), apply: c => [c[c.length - 1], ...c.slice(1, -1), c[0]] },
    { text: "If both the first and the last letters are consonants, both are coded as the code of the last letter", when: w => !isV(w[0]) && !isV(w[w.length - 1]), apply: c => [c[c.length - 1], ...c.slice(1, -1), c[c.length - 1]] },
    { text: "If the first letter is a consonant and the last letter is a vowel, both are coded as '£'", when: w => !isV(w[0]) && isV(w[w.length - 1]), apply: c => ['£', ...c.slice(1, -1), '£'] },
    { text: "If the second letter is a vowel, its code is replaced by the code of the first letter", when: w => isV(w[1]), apply: c => [c[0], c[0], ...c.slice(2)] },
  ]
  const order = shuffle(r, range(conds.length)).slice(0, 3)
  const used = order.map(i => conds[i])
  const encode = (w: string) => {
    const base = w.split('').map(c => table.get(c) as string)
    const hit = used.find(c => c.when(w))
    return (hit ? hit.apply(base, w) : base).join('')
  }
  // choose a group where some condition applies and that is not the very first condition
  for (let t = 0; t < 50; t++) {
    const w = shuffle(r, letters).slice(0, 6).join('')
    const hitIdx = used.findIndex(c => c.when(w))
    if (hitIdx < 0) continue
    const plain = w.split('').map(c => table.get(c) as string)
    const traps = [plain.join(''), ...used.filter((_, i) => i !== hitIdx).map(c => c.apply(plain, w).join('')), [...plain].reverse().join(''), conds.filter(c => !used.includes(c))[0].apply(plain, w).join('')]
    emit({
      family: 'code',
      topic: 'Coding-decoding',
      question: `Letters are coded as follows — ${letters.map(c => `${c}: ${table.get(c)}`).join(', ')}. Conditions (apply only the first condition that fits, in the order given): ${used.map((c, i) => `(${['i', 'ii', 'iii'][i]}) ${c.text}`).join('; ')}. If none applies, code each letter directly. What is the code for the letter group ${w}?`,
      correct: encode(w),
      traps,
      explanation: `Direct codes: ${w} → ${plain.join('')}. Checking the conditions in order, condition (${['i', 'ii', 'iii'][hitIdx]}) is the first that fits (${w[0]} is ${isV(w[0]) ? 'a vowel' : 'a consonant'}, ${w[w.length - 1]} is ${isV(w[w.length - 1]) ? 'a vowel' : 'a consonant'}${w[1] ? `, second letter ${w[1]}` : ''}), giving ${encode(w)}.`,
      hint: 'Write the plain code first, then test the conditions strictly in the given order and apply only the first match.',
      seconds: 150,
      recompute: () => encode(w),
    })
    return
  }
  throw new Error('no group')
}

const codeNumeric = (r: Rand) => {
  const pos = (c: string) => ALPHA.indexOf(c) + 1
  const rules: { text: string; f: (w: string) => number }[] = [
    { text: 'twice the sum of the letter positions', f: w => 2 * w.split('').reduce((s, c) => s + pos(c), 0) },
    { text: 'sum of the reverse positions (A = 26, …, Z = 1)', f: w => w.split('').reduce((s, c) => s + 27 - pos(c), 0) },
    { text: 'sum of the letter positions plus the number of letters', f: w => w.split('').reduce((s, c) => s + pos(c), 0) + w.length },
    { text: 'sum of the letter positions multiplied by the number of letters', f: w => w.length * w.split('').reduce((s, c) => s + pos(c), 0) },
    { text: 'product of the positions of the first and last letters plus the number of letters', f: w => pos(w[0]) * pos(w[w.length - 1]) + w.length },
    { text: 'sum of the squares of the positions of the first and last letters', f: w => pos(w[0]) ** 2 + pos(w[w.length - 1]) ** 2 },
  ]
  const ri = int(r, 0, rules.length - 1)
  const rule = rules[ri]
  const pool = ['CAT', 'DOG', 'BIRD', 'LION', 'FISH', 'GOAT', 'DEER', 'BEAR', 'WOLF', 'HAWK', 'MULE', 'CROW', 'DUCK', 'FROG', 'HEN', 'OWL', 'APE', 'YAK']
  const [a, b, c] = shuffle(r, pool).slice(0, 3)
  // the two examples must rule out every other rule in the list
  const rivals = rules.filter((x, i) => i !== ri && x.f(a) === rule.f(a) && x.f(b) === rule.f(b))
  if (rivals.length) throw new Error('examples ambiguous')
  const ans = rule.f(c)
  emit({
    family: 'code',
    topic: 'Coding-decoding',
    question: `In a certain code, ${a} = ${rule.f(a)} and ${b} = ${rule.f(b)}. Using the same rule (A = 1, B = 2, …, Z = 26), what is the code for ${c}?`,
    correct: String(ans),
    traps: rules.filter((_, i) => i !== ri).map(x => String(x.f(c))).concat([String(ans + 2), String(ans - 1)]),
    explanation: `Test the examples: ${a} → ${rule.f(a)} and ${b} → ${rule.f(b)} fit "${rule.text}" (letter positions of ${a}: ${a.split('').map(pos).join(', ')}). Applying it to ${c} (positions ${c.split('').map(pos).join(', ')}) gives ${ans}.`,
    hint: 'Write the letter positions of each example and test sum, reverse sum and first/last products against both examples before applying.',
    seconds: 130,
    recompute: () => String(rule.f(c)),
  })
}

{
  let i = 0
  produce('code', 14, 20001, r => codeSentences(r, i++), 200)
  produce('code', 9, 21001, r => codeLetters(r), 100)
  produce('code', 7, 22001, r => codeConditions(r), 100)
  produce('code', 6, 23001, r => codeNumeric(r), 200)
}

// ---------------------------------------------------------------------------
// Directions: walks with turns, coded directions, shadows, rotated compass
// ---------------------------------------------------------------------------

const DIR8 = ['North', 'North-East', 'East', 'South-East', 'South', 'South-West', 'West', 'North-West']
const VEC4: [number, number][] = [[0, 1], [1, 0], [0, -1], [-1, 0]] // N E S W
const dirName = (dx: number, dy: number) => {
  if (dx === 0 && dy === 0) return 'at the start'
  const ns = dy > 0 ? 'North' : dy < 0 ? 'South' : ''
  const ew = dx > 0 ? 'East' : dx < 0 ? 'West' : ''
  return ns && ew ? `${ns}-${ew}` : ns || ew
}
const TRIPLES = new Map<string, number>()
for (const [a, b, c] of [[3, 4, 5], [6, 8, 10], [5, 12, 13], [9, 12, 15], [8, 15, 17], [12, 16, 20], [7, 24, 25], [15, 20, 25], [20, 21, 29], [12, 5, 13], [10, 24, 26], [18, 24, 30]]) {
  TRIPLES.set(`${a},${b}`, c)
  TRIPLES.set(`${b},${a}`, c)
}
const dist = (dx: number, dy: number) => (dx === 0 ? Math.abs(dy) : dy === 0 ? Math.abs(dx) : (TRIPLES.get(`${Math.abs(dx)},${Math.abs(dy)}`) ?? -1))
const dirHint = 'Track each leg on x–y axes (east +x, north +y); a right turn rotates the heading clockwise by 90°. Combine the net displacements with Pythagoras.'

const dirWalk = (r: Rand, frame: number) => {
  const names = pick(r, [['Ravi', 'he', 'his'], ['Sita', 'she', 'her'], ['Arjun', 'he', 'his'], ['Latha', 'she', 'her']])
  const [nm, he] = names
  for (let t = 0; t < 400; t++) {
    let head = int(r, 0, 3)
    const start = head
    let x = 0
    let y = 0
    const legs = int(r, 4, 6)
    const parts: string[] = []
    const pts: [number, number][] = [[0, 0]]
    const moves: [number, number][] = [] // [heading, metres]
    for (let i = 0; i < legs; i++) {
      if (i > 0) {
        const turn = pick(r, ['right', 'left', 'left', 'right', 'about'] as const)
        if (turn === 'about' && i === legs - 1) continue
        head = mod(head + (turn === 'right' ? 1 : turn === 'left' ? -1 : 2), 4)
        parts.push(turn === 'about' ? 'turns back' : `turns ${turn}`)
      }
      const d = pick(r, [2, 3, 4, 5, 6, 7, 8, 9, 10, 12, 15])
      x += VEC4[head][0] * d
      y += VEC4[head][1] * d
      pts.push([x, y])
      moves.push([head, d])
      parts.push(`walks ${d} m`)
    }
    const D = dist(x, y)
    if (D <= 0 || x === 0 || y === 0) continue
    const walk = `${nm} starts facing ${DIR8[start * 2]}, ${parts.join(', ')}.`
    const finalFace = DIR8[head * 2]
    const replay = () => {
      const fx = moves.reduce((acc, [hd, d]) => acc + VEC4[hd][0] * d, 0)
      const fy = moves.reduce((acc, [hd, d]) => acc + VEC4[hd][1] * d, 0)
      return { fx, fy, fh: moves[moves.length - 1][0] }
    }
    const coords = `Taking the start as (0, 0): the turning points are ${pts.slice(1).map(([a, b]) => `(${a}, ${b})`).join(', ')}.`
    if (frame % 2 === 0) {
      const ans = `${D} m, ${dirName(x, y)}`
      emit({ family: 'dir', topic: 'Directions', question: `${walk} How far and in which direction is ${he} now from the starting point?`, correct: ans, traps: [`${D} m, ${dirName(-x, y)}`, `${D} m, ${dirName(x, -y)}`, `${Math.abs(x) + Math.abs(y)} m, ${dirName(x, y)}`, `${D} m, ${dirName(-x, -y)}`], explanation: `${coords} Net displacement: ${Math.abs(x)} m ${x > 0 ? 'east' : 'west'} and ${Math.abs(y)} m ${y > 0 ? 'north' : 'south'}, so the distance is √(${x * x}+${y * y}) = ${D} m towards ${dirName(x, y)}.`, hint: dirHint, seconds: 150, recompute: () => {
        const { fx, fy } = replay()
        return `${dist(fx, fy)} m, ${dirName(fx, fy)}`
      } })
    } else {
      const ans = `${finalFace}; ${dirName(-x, -y)} of ${nm}`
      emit({ family: 'dir', topic: 'Directions', question: `${walk} Which direction is ${he} facing at the end, and in which direction is the starting point from ${he === 'he' ? 'him' : 'her'}?`, correct: ans, traps: [`${finalFace}; ${dirName(x, y)} of ${nm}`, `${DIR8[mod(head + 2, 4) * 2]}; ${dirName(-x, -y)} of ${nm}`, `${DIR8[mod(head + 1, 4) * 2]}; ${dirName(-x, -y)} of ${nm}`, `${DIR8[mod(head - 1, 4) * 2]}; ${dirName(x, y)} of ${nm}`], explanation: `${coords} The last heading is ${finalFace}. ${nm} ends at (${x}, ${y}), so the start lies towards ${dirName(-x, -y)} from ${he === 'he' ? 'him' : 'her'}.`, hint: dirHint, seconds: 150, recompute: () => {
        const { fx, fy, fh } = replay()
        return `${DIR8[fh * 2]}; ${dirName(-fx, -fy)} of ${nm}`
      } })
    }
    return
  }
  throw new Error('no clean walk')
}

const dirCoded = (r: Rand) => {
  const sy = shuffle(r, ['@', '#', '$', '%', '&', '©'])
  const defs = shuffle(r, [0, 1, 2, 3]).map((d, i) => ({ sym: sy[i], d, m: int(r, 2, 9) }))
  const L = shuffle(r, ['P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'K', 'M']).slice(0, 5)
  for (let t = 0; t < 200; t++) {
    const ops = range(4).map(() => pick(r, defs))
    // "X sym Y" means X is m metres to direction d of Y
    const pos: [number, number][] = [[0, 0], [0, 0], [0, 0], [0, 0], [0, 0]]
    for (let i = 3; i >= 0; i--) pos[i] = [pos[i + 1][0] + VEC4[ops[i].d][0] * ops[i].m, pos[i + 1][1] + VEC4[ops[i].d][1] * ops[i].m]
    const dx = pos[4][0] - pos[0][0]
    const dy = pos[4][1] - pos[0][1]
    const D = dist(dx, dy)
    if (D <= 0 || dx === 0 || dy === 0) continue
    const expr = L.map((v, i) => (i < 4 ? `${v} ${ops[i].sym} ` : v)).join('')
    const ans = `${D} m, ${dirName(dx, dy)}`
    emit({
      family: 'dir',
      topic: 'Directions',
      question: `${defs.map(df => `'A ${df.sym} B' means A is ${df.m} m to the ${DIR8[df.d * 2].toLowerCase()} of B`).join('; ')}. If ${expr}, what is the position of ${L[4]} with respect to ${L[0]}?`,
      correct: ans,
      traps: [`${D} m, ${dirName(-dx, -dy)}`, `${D} m, ${dirName(-dx, dy)}`, `${Math.abs(dx) + Math.abs(dy)} m, ${dirName(dx, dy)}`, `${D} m, ${dirName(dx, -dy)}`],
      explanation: `Place ${L[4]} at (0, 0) and work leftwards: ${range(4).reverse().map(i => `${L[i]} is ${ops[i].m} m ${DIR8[ops[i].d * 2].toLowerCase()} of ${L[i + 1]} → ${L[i]} at (${pos[i][0]}, ${pos[i][1]})`).join('; ')}. From ${L[0]}, ${L[4]} is ${Math.abs(dx)} m ${dx > 0 ? 'east' : 'west'} and ${Math.abs(dy)} m ${dy > 0 ? 'north' : 'south'}: ${D} m towards ${dirName(dx, dy)}.`,
      hint: 'Decode each symbol into a vector, fix the last letter at the origin, and add the vectors; watch that "A @ B" places A relative to B, not the other way round.',
      seconds: 160,
      recompute: () => ans,
    })
    return
  }
  throw new Error('no clean coded walk')
}

const dirShadow = (r: Rand) => {
  // morning: sun in the east, shadows to the west; evening: the reverse
  const morning = r() < 0.5
  const shadowDir = morning ? 3 : 1 // W or E (index into VEC4 order N E S W)
  const nm = pick(r, ['Kiran', 'Usha', 'Mahesh', 'Rekha'])
  const relSide = pick(r, ['left', 'right', 'back', 'front'] as const)
  // facing f such that shadowDir is on relSide: left = f-1, right = f+1, back = f+2, front = f
  const f = mod(shadowDir - (relSide === 'right' ? 1 : relSide === 'left' ? -1 : relSide === 'back' ? 2 : 0), 4)
  const turns = pick(r, [[1], [-1, -1], [1, 1, 1], [-1], [2, 1]])
  const f2 = mod(f + turns.reduce((a, b) => a + b, 0), 4)
  const rel = mod(shadowDir - f2, 4)
  const relWord = ['in front of', 'to the right of', 'behind', 'to the left of'][rel]
  const turnText = turns.map(tn => (tn === 1 ? 'turned 90° clockwise' : tn === -1 ? 'turned 90° anticlockwise' : 'turned about (180°)')).join(', then ')
  const ans = `${DIR8[f * 2]}; shadow ${relWord} ${nm}`
  const sides = ['in front of', 'to the right of', 'behind', 'to the left of']
  emit({
    family: 'dir',
    topic: 'Directions',
    question: `One ${morning ? 'morning, soon after sunrise' : 'evening, shortly before sunset'}, ${nm} stood on open ground and noticed that ${nm}'s own shadow fell exactly ${relSide === 'front' ? 'in front of' : relSide === 'back' ? 'behind' : `to the ${relSide} of`} ${nm}. ${nm} then ${turnText}. Which direction was ${nm} facing at first, and where does the shadow fall now?`,
    correct: ans,
    traps: [`${DIR8[mod(f + 2, 4) * 2]}; shadow ${relWord} ${nm}`, `${DIR8[f * 2]}; shadow ${sides[mod(rel + 2, 4)]} ${nm}`, `${DIR8[mod(f + 2, 4) * 2]}; shadow ${sides[mod(rel + 2, 4)]} ${nm}`, `${DIR8[f * 2]}; shadow ${sides[mod(rel + 1, 4)]} ${nm}`],
    explanation: `${morning ? 'In the morning the sun is in the east, so shadows fall to the west' : 'In the evening the sun is in the west, so shadows fall to the east'}. A shadow ${relSide === 'front' ? 'in front' : relSide === 'back' ? 'behind' : `on the ${relSide}`} means ${nm} faced ${DIR8[f * 2]}. After the turns ${nm} faces ${DIR8[f2 * 2]}; the shadow still points ${DIR8[shadowDir * 2]}, which is ${relWord} ${nm}.`,
    hint: 'Fix the shadow direction from the time of day first (morning → west, evening → east); it does not change when the person turns.',
    seconds: 120,
    recompute: () => ans,
  })
}

const dirRotate = (r: Rand) => {
  const k = pick(r, [1, 2, 3, 5, 6, 7]) // rotation in 45° steps (clockwise)
  const a = int(r, 0, 7)
  let b = int(r, 0, 7)
  if (b === a) b = mod(a + 3, 8)
  const q = pick(r, range(8).filter(x => x !== a && x !== b))
  const ans = DIR8[mod(q + k, 8)]
  emit({
    family: 'dir',
    topic: 'Directions',
    question: `In a re-labelled compass, ${DIR8[a]} is called ${DIR8[mod(a + k, 8)]} and ${DIR8[b]} is called ${DIR8[mod(b + k, 8)]}; every direction is re-labelled by the same rotation. A man walks towards the real ${DIR8[q]}. What will this compass call that direction?`,
    correct: ans,
    traps: [DIR8[mod(q - k, 8)], DIR8[mod(q + k + 4, 8)], DIR8[mod(q + k + 1, 8)], DIR8[mod(q + k - 1, 8)]],
    explanation: `${DIR8[a]} → ${DIR8[mod(a + k, 8)]} is a rotation of ${k <= 4 ? `${k * 45}° clockwise` : `${(8 - k) * 45}° anticlockwise`} (check: ${DIR8[b]} → ${DIR8[mod(b + k, 8)]} also fits). Applying the same rotation to ${DIR8[q]} gives ${ans}.`,
    hint: 'Measure the rotation from the first pair (in 45° steps), confirm it with the second pair, then apply it in the same sense.',
    seconds: 100,
    recompute: () => DIR8[mod(q + k, 8)],
  })
}

{
  let i = 0
  produce('dir', 12, 24001, r => dirWalk(r, i++), 100)
  produce('dir', 8, 25001, r => dirCoded(r), 100)
  produce('dir', 6, 26001, r => dirShadow(r), 50)
  produce('dir', 4, 27001, r => dirRotate(r), 50)
}

// ---------------------------------------------------------------------------
// Series: mixed operations, interleaved series, wrong-number, alphabet groups
// ---------------------------------------------------------------------------

type SeriesGen = { rule: string; terms: number[]; alt: number[] }
const seriesGens: ((r: Rand) => SeriesGen)[] = [
  r => {
    const a = int(r, 2, 9)
    const [m1, c1, m2, c2] = [int(r, 2, 3), int(r, 1, 4), int(r, 2, 3), -int(r, 1, 5)]
    const t = [a]
    for (let i = 1; i < 7; i++) t.push(i % 2 ? t[i - 1] * m1 + c1 : t[i - 1] * m2 + c2)
    return { rule: `alternately ×${m1}${c1 >= 0 ? '+' : ''}${c1} and ×${m2}${c2}`, terms: t, alt: [t[5] * m1 + c1, t[5] * m2 + c2] }
  },
  r => {
    const a = int(r, 1, 6)
    const c = int(r, 0, 2)
    const t = [a]
    for (let i = 1; i < 7; i++) t.push(t[i - 1] * i + (c ? i : -i + 2 * c))
    return { rule: `×1, ×2, ×3, … with ${c ? '+1, +2, +3, …' : '−1, −2, −3, …'} added`, terms: t, alt: [t[5] * 6, t[5] * 5 + 5] }
  },
  r => {
    const a = int(r, 5, 40)
    const s = int(r, 2, 5)
    const t = [a]
    for (let i = 1; i < 7; i++) t.push(t[i - 1] + (s + i - 1) ** 2)
    return { rule: `differences are consecutive squares ${s}², ${s + 1}², ${s + 2}², …`, terms: t, alt: [t[5] + (s + 4) ** 2, t[5] + (s + 5) ** 2 + 1] }
  },
  r => {
    const a = int(r, 2, 20)
    const t = [a]
    const P = [2, 3, 5, 7, 11, 13, 17, 19]
    const off = int(r, 0, 1)
    for (let i = 1; i < 7; i++) t.push(t[i - 1] + P[i - 1 + off] * 2)
    return { rule: `differences are twice the consecutive primes`, terms: t, alt: [t[5] + P[4 + off] * 2, t[5] + P[6 + off] * 2] }
  },
  r => {
    const a = int(r, 3, 15)
    const d0 = int(r, 2, 6)
    const dd = int(r, 2, 4)
    const t = [a]
    for (let i = 1; i < 7; i++) t.push(t[i - 1] + d0 + dd * (i - 1) * i / 2)
    return { rule: `second differences increase by ${dd} each time`, terms: t, alt: [t[5] + d0 + dd * 10, t[5] + d0 + dd * 20] }
  },
  r => {
    const a = int(r, 2, 9)
    const d = int(r, 3, 9)
    const g = int(r, 3, 6)
    const m = 2
    const t: number[] = []
    for (let i = 0; i < 7; i++) t.push(i % 2 === 0 ? a + d * (i / 2) : g * m ** ((i - 1) / 2))
    return { rule: `two interleaved series: odd places +${d} (starting ${a}), even places ×2 (starting ${g})`, terms: t, alt: [t[5] * 2, t[4] + d] }
  },
  r => {
    const s = int(r, 2, 5)
    const sign = r() < 0.5 ? 1 : -1
    const t = range(7).map(i => (s + i) ** 3 + sign * (s + i))
    return { rule: `n³ ${sign > 0 ? '+' : '−'} n for n = ${s}, ${s + 1}, …`, terms: t, alt: [(s + 6) ** 3, (s + 6) ** 2 * (s + 6) - sign * (s + 6)] }
  },
  r => {
    const a = int(r, 8, 24) * 4
    const t = [a]
    for (let i = 1; i < 7; i++) t.push(t[i - 1] * (i % 2 ? 0.5 : 3))
    if (!t.every(Number.isInteger)) throw new Error('fraction')
    return { rule: 'alternately ×0.5 and ×3', terms: t, alt: [t[5] * 2, t[5] * 1.5] }
  },
  r => {
    const a = int(r, 2, 6)
    const t = [a]
    for (let i = 1; i < 7; i++) t.push(t[i - 1] * 2 + (i % 2 ? i * i : -i))
    return { rule: '×2 + 1², ×2 − 2, ×2 + 3², ×2 − 4, … (odd steps add squares, even steps subtract n)', terms: t, alt: [t[5] * 2 + 36, t[5] * 2 - 7] }
  },
]

const seriesQ = (r: Rand, idx: number) => {
  const gi = idx % seriesGens.length
  const g = seriesGens[gi](r)
  const t = g.terms
  if (t.some(v => !Number.isInteger(v) || Math.abs(v) > 200000) || new Set(t).size < 7) throw new Error('bad series')
  const kind = Math.floor(idx / seriesGens.length) % 3
  const show = (xs: (number | string)[]) => xs.join(', ')
  if (kind === 0) {
    const ans = t[6]
    emit({ family: 'series', topic: 'Number series', question: `What comes next in the series: ${show(t.slice(0, 6))}, ?`, correct: String(ans), traps: [...g.alt, ans + (t[5] - t[4]), ans + 2, ans - 1].filter(v => v !== ans).map(String), explanation: `Rule: ${g.rule}. Check: ${show(t.slice(0, 6))} all fit; so the next term is ${ans}.`, hint: 'Test differences first; if they grow quickly, test ×k ± c and alternating patterns, or split odd and even places.', seconds: 100, recompute: () => String(t[6]) })
  } else if (kind === 1) {
    const hole = int(r, 2, 4)
    const shown = t.map((v, i) => (i === hole ? '?' : v))
    const ans = t[hole]
    emit({ family: 'series', topic: 'Number series', question: `Find the missing term: ${show(shown)}`, correct: String(ans), traps: [ans + 1, ans - 2, ans + (t[hole + 1] - t[hole]), Math.round((t[hole - 1] + t[hole + 1]) / 2), ans + 4].filter(v => v !== ans).map(String), explanation: `Rule: ${g.rule}. The term at position ${hole + 1} must be ${ans}, which also produces the next given term ${t[hole + 1]}.`, hint: 'Use the terms on both sides of the gap: the rule must carry the left neighbour to the missing term and the missing term to the right neighbour.', seconds: 110, recompute: () => String(t[hole]) })
  } else {
    const wrong = int(r, 2, 5)
    const delta = pick(r, [1, 2, -1, -2, 3, 10])
    const bad = [...t]
    bad[wrong] = t[wrong] + delta
    const others = shuffle(r, range(7).filter(i => i !== wrong && i > 0)).slice(0, 3)
    emit({ family: 'series', topic: 'Number series', question: `Exactly one number in the series is wrong. Find it: ${show(bad)}`, correct: String(bad[wrong]), traps: others.map(i => String(bad[i])), explanation: `Rule: ${g.rule}. Following it gives ${show(t)}; the given ${bad[wrong]} should be ${t[wrong]}.`, hint: 'Find the rule from the opening terms, then generate the series yourself and compare term by term.', seconds: 120, recompute: () => String(bad.find((v, i) => v !== t[i])) })
  }
}

const alphaSeries = (r: Rand) => {
  const size = int(r, 2, 3)
  const starts = range(size).map(() => int(r, 0, 25))
  const steps = range(size).map(() => pick(r, [1, 2, 3, -1, -2, -3, 4, -4]))
  const grow = range(size).map(() => pick(r, [0, 1, -1]))
  const term = (i: number) => range(size).map(p => ALPHA[mod(starts[p] + steps[p] * i + grow[p] * (i * (i - 1)) / 2, 26)]).join('')
  const terms = range(6).map(term)
  if (new Set(terms).size < 6) throw new Error('repeat')
  const ans = terms[5]
  const tweak = (k: number, by: number) => range(size).map(p => (p === k ? ALPHA[mod(ALPHA.indexOf(ans[p]) + by, 26)] : ans[p])).join('')
  emit({
    family: 'series',
    topic: 'Alphabet series',
    question: `What comes next: ${terms.slice(0, 5).join(', ')}, ?`,
    correct: ans,
    traps: [tweak(0, 1), tweak(size - 1, -1), tweak(0, -1), tweak(size - 1, 2), ans.split('').reverse().join('')],
    explanation: `Treat each letter position as its own series: ${range(size).map(p => `position ${p + 1} moves ${steps[p] > 0 ? '+' : ''}${steps[p]}${grow[p] ? ` with the step changing by ${grow[p] > 0 ? '+1' : '−1'} each time` : ''}`).join('; ')} (letters wrap from Z to A). Next term: ${ans}.`,
    hint: 'Write letter positions (A = 1 … Z = 26) for each place separately and look for a constant or steadily changing step.',
    seconds: 110,
    recompute: () => term(5),
  })
}

{
  let i = 0
  produce('series', 27, 28001, r => seriesQ(r, i++), 200)
  produce('series', 8, 29001, r => alphaSeries(r), 50)
}

// ---------------------------------------------------------------------------
// Data sufficiency — enumerate the candidate answers
// ---------------------------------------------------------------------------

const DS_OPTS = ['Statement I alone is sufficient, but statement II alone is not', 'Statement II alone is sufficient, but statement I alone is not', 'Both statements together are needed; neither alone is sufficient', 'Even both statements together are not sufficient']
type DsFact<S> = { text: string; holds: (s: S) => boolean }
type DsWorld<S> = { stem: string; universe: S[]; ask: (s: S) => string; question: string; facts: DsFact<S>[]; explain: (s: S) => string }

const dsCategory = <S,>(w: DsWorld<S>, s1: DsFact<S>[], s2: DsFact<S>[]) => {
  const answers = (fs: DsFact<S>[]) => {
    const out = new Set<string>()
    for (const s of w.universe) if (fs.every(f => f.holds(s))) {
      out.add(w.ask(s))
      if (out.size > 1) break
    }
    return out
  }
  const a1 = answers(s1).size === 1
  const a2 = answers(s2).size === 1
  const both = answers([...s1, ...s2]).size === 1
  if (a1 && a2) return -1 // either alone — not used in this option set
  return a1 ? 0 : a2 ? 1 : both ? 2 : 3
}
const dsEmit = <S,>(r: Rand, w: DsWorld<S>, hidden: S, target: number) => {
  for (let t = 0; t < 300; t++) {
    const pool = shuffle(r, w.facts)
    const s1 = pool.slice(0, int(r, 1, 2))
    const s2 = pool.slice(2, 2 + int(r, 1, 2))
    if (s2.length === 0) continue
    if (dsCategory(w, s1, s2) !== target) continue
    const count = (fs: DsFact<S>[], plural = false) => {
      const vals = [...new Set(w.universe.filter(s => fs.every(f => f.holds(s))).map(w.ask))]
      return vals.length === 1 ? `${plural ? 'fix' : 'fixes'} the answer (${vals[0]})` : `still ${plural ? 'allow' : 'allows'} ${vals.length} answers (${vals.slice(0, 4).join(', ')}${vals.length > 4 ? ', …' : ''})`
    }
    const txt = (fs: DsFact<S>[]) => fs.map(f => f.text).join('; ')
    emit({
      family: 'ds',
      topic: 'Data sufficiency',
      question: `${w.stem} Question: ${w.question} Statement I: ${txt(s1)}. Statement II: ${txt(s2)}. Decide whether the data in the statements are sufficient to answer the question.`,
      correct: DS_OPTS[target],
      traps: DS_OPTS.filter((_, i) => i !== target),
      explanation: `Statement I alone ${count(s1)}. Statement II alone ${count(s2)}. Together they ${count([...s1, ...s2], true)}. ${w.explain(hidden)}`,
      hint: 'Test each statement on its own by listing every case it still allows; only if both fail alone, combine them.',
      seconds: 150,
      recompute: () => DS_OPTS[dsCategory(w, s1, s2)] ?? 'either',
    })
    return
  }
  throw new Error('no statements for target')
}

const dsRanking = (r: Rand, target: number) => {
  const N = shuffle(r, pick(r, NAME_SETS)).slice(0, 5).sort()
  const U = perms(5) // U[k][p] = rank of p (0 = tallest)
  const h = pick(r, U)
  const facts: DsFact<number[]>[] = []
  for (let a = 0; a < 5; a++)
    for (let b = 0; b < 5; b++) if (a !== b && h[a] < h[b] && r() < 0.5) facts.push({ text: `${N[a]} is taller than ${N[b]}`, holds: s => s[a] < s[b] })
  for (let a = 0; a < 5; a++) {
    if (h[a] > 0 && h[a] < 4 && r() < 0.5) facts.push({ text: `${N[a]} is neither the tallest nor the shortest`, holds: s => s[a] > 0 && s[a] < 4 })
    if (r() < 0.35) facts.push({ text: h[a] === 0 ? `Nobody is taller than ${N[a]}` : `Only ${NUMW[h[a]]} ${h[a] === 1 ? 'person is' : 'persons are'} taller than ${N[a]}`, holds: s => s[a] === h[a] })
    for (let b = 0; b < 5; b++)
      for (let c = b + 1; c < 5; c++) if (a !== b && a !== c && (h[a] - h[b]) * (h[a] - h[c]) < 0 && r() < 0.15) facts.push({ text: `${N[a]}'s height lies between those of ${N[b]} and ${N[c]}`, holds: s => (s[a] - s[b]) * (s[a] - s[c]) < 0 })
  }
  const k = int(r, 0, 2)
  const ask = (s: number[]) => N[s.indexOf(k)]
  dsEmit(r, { stem: `Five friends ${listAnd(N)} have different heights.`, universe: U, ask, question: `Who is the ${k === 0 ? 'tallest' : `${ORDW[k + 1]} tallest`}?`, facts, explain: s => `(Actual order, tallest first: ${range(5).map(i => N[s.indexOf(i)]).join(' > ')}.)` }, h, target)
}

const dsNumber = (r: Rand, target: number) => {
  const U = range(90).map(i => i + 10)
  const h = pick(r, U)
  const t = Math.floor(h / 10)
  const u = h % 10
  const isPrime = (n: number) => n > 1 && range(n).every(d => d < 2 || n % d !== 0)
  const raw: DsFact<number>[] = [
    { text: `The sum of its digits is ${t + u}`, holds: n => Math.floor(n / 10) + (n % 10) === t + u },
    { text: `The tens digit exceeds the units digit by ${t - u}`, holds: n => Math.floor(n / 10) - (n % 10) === t - u },
    { text: `The product of its digits is ${t * u}`, holds: n => Math.floor(n / 10) * (n % 10) === t * u },
    { text: `The number is ${h % 2 ? 'odd' : 'even'}`, holds: n => n % 2 === h % 2 },
    { text: `The number is ${isPrime(h) ? '' : 'not '}a prime`, holds: n => isPrime(n) === isPrime(h) },
    { text: `The number is ${h > 50 ? 'greater' : 'not greater'} than 50`, holds: n => n > 50 === h > 50 },
    { text: `Reversing its digits gives a number ${Math.abs(h - (u * 10 + t))} ${h > u * 10 + t ? 'smaller' : 'larger'} than it`, holds: n => n - ((n % 10) * 10 + Math.floor(n / 10)) === h - (u * 10 + t) },
    { text: `The number leaves remainder ${h % 7} when divided by 7`, holds: n => n % 7 === h % 7 },
  ]
  const facts = raw.filter(f => !f.text.includes('by 0') && !f.text.includes(' 0 smaller') && !f.text.includes(' 0 larger') && !f.text.includes('by -'))
  dsEmit(r, { stem: 'N is a two-digit number.', universe: U, ask: n => String(n), question: 'What is the value of N?', facts, explain: n => `(The number consistent with everything is ${n}.)` }, h, target)
}

const dsDay = (r: Rand, target: number) => {
  const W = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
  const U = range(49).map(i => [Math.floor(i / 7), i % 7]) // [day of A, day of B]
  const h = pick(r, U.filter(([a, b]) => a !== b))
  const [ha, hb] = h
  const nm = pick(r, [['Ramesh', 'Suresh'], ['Anitha', 'Kavya'], ['Prakash', 'Imran']])
  const facts: DsFact<number[]>[] = [
    { text: `${nm[0]} visited on a day after Tuesday but before ${W[Math.min(6, ha + int(r, 1, 3))]}`, holds: s => s[0] > 1 && s[0] < Math.min(6, ha + 1 + (W.indexOf('Monday'))) + 0 },
    { text: `${nm[1]} visited ${Math.abs(ha - hb)} day${Math.abs(ha - hb) === 1 ? '' : 's'} ${hb > ha ? 'after' : 'before'} ${nm[0]} in the same week`, holds: s => s[1] - s[0] === hb - ha },
    { text: `Neither of them visited on a weekend`, holds: s => s[0] < 5 && s[1] < 5 },
    { text: `${nm[0]} did not visit on ${W[(ha + 1) % 7]} or ${W[(ha + 2) % 7]}`, holds: s => s[0] !== (ha + 1) % 7 && s[0] !== (ha + 2) % 7 },
    { text: `${nm[1]} visited on ${['Monday, Wednesday, Friday or Sunday', 'Tuesday, Thursday or Saturday'][hb % 2]}`, holds: s => s[1] % 2 === hb % 2 },
    { text: `${nm[0]} visited ${ha < hb ? 'earlier' : 'later'} in the week than ${nm[1]}`, holds: s => (s[0] < s[1]) === (ha < hb) && s[0] !== s[1] },
    { text: `${nm[1]} visited on ${W[hb]}`, holds: s => s[1] === hb },
  ]
  // the first fact must be true of the hidden case
  facts[0] = (() => {
    const lo = Math.max(0, ha - int(r, 1, 2))
    const hi = Math.min(6, ha + int(r, 1, 2))
    return { text: `${nm[0]} visited on a day after ${W[lo]}${hi > ha ? ` but before ${W[hi]}` : ''}`.replace(`after ${W[ha]}`, `on or after ${W[ha]}`), holds: (s: number[]) => s[0] > lo && (hi > ha ? s[0] < hi : true) }
  })()
  if (!facts.every(f => f.holds(h)) || ha === 0) throw new Error('fact false')
  dsEmit(r, { stem: `${nm[0]} and ${nm[1]} each visited a museum once, on different days of the same Monday-to-Sunday week.`, universe: U.filter(([a, b]) => a !== b), ask: s => W[s[0]], question: `On which day did ${nm[0]} visit?`, facts, explain: s => `(${nm[0]} visited on ${W[s[0]]} and ${nm[1]} on ${W[s[1]]}.)` }, h, target)
}

{
  let i = 0
  produce('ds', 10, 30001, r => dsRanking(r, i++ % 4), 120)
  let j = 1
  produce('ds', 9, 31001, r => dsNumber(r, j++ % 4), 150)
  let k = 2
  produce('ds', 7, 32001, r => dsDay(r, k++ % 4), 150)
}

// ---------------------------------------------------------------------------
// Cubes (explicit cubelet model) and dice (orientation model)
// ---------------------------------------------------------------------------

/** For every cubelet of an a×b×c block, the list of outer faces it touches (0..5 = −x,+x,−y,+y,−z,+z). */
const cubelets = (a: number, b: number, c: number) => {
  const out: number[][] = []
  for (let x = 0; x < a; x++)
    for (let y = 0; y < b; y++)
      for (let z = 0; z < c; z++) {
        const f: number[] = []
        if (x === 0) f.push(0)
        if (x === a - 1) f.push(1)
        if (y === 0) f.push(2)
        if (y === b - 1) f.push(3)
        if (z === 0) f.push(4)
        if (z === c - 1) f.push(5)
        out.push(f)
      }
  return out
}
const cubeHint = 'Classify small cubes as corners, edge (non-corner) cubes, face-centre cubes and hidden inner cubes; then check which of their outer faces actually carry paint.'

const cubePaint = (r: Rand, idx: number) => {
  const n = int(r, 4, 7)
  const kind = idx % 6
  const cs = cubelets(n, n, n)
  type Q = { text: string; count: (paint: (string | null)[]) => number; traps: number[] }
  if (kind === 0) {
    // two opposite faces left unpainted
    const paint = ['red', 'red', 'red', 'red', null, null]
    const k = int(r, 0, 2)
    const cnt = (p: (string | null)[]) => cs.filter(f => f.filter(x => p[x]).length === k).length
    const ans = cnt(paint)
    const allPainted = cs.filter(f => f.length === k).length
    emit({ family: 'cube', topic: 'Cubes', question: `A solid cube is painted red on four faces, leaving the top and the bottom unpainted. It is then cut into ${n ** 3} identical small cubes. How many small cubes have exactly ${NUMW[k]} red face${k === 1 ? '' : 's'}?`, correct: String(ans), traps: [allPainted, ans + 4, ans + (n - 2) * 2, Math.abs(ans - 4), ans + n].filter(v => v !== ans).map(String), explanation: `With top and bottom unpainted, only the four side faces count. Counting cubelets by how many of those four faces they touch gives ${ans} with exactly ${k}. (If all six faces were painted it would be ${allPainted}, the common trap.)`, hint: cubeHint, seconds: 140, recompute: () => String(cnt(paint)) })
    return
  }
  if (kind === 1) {
    // opposite pairs in three colours
    const paint = ['red', 'red', 'blue', 'blue', 'green', 'green']
    const qs: Q[] = [
      { text: 'exactly two different colours', count: p => cs.filter(f => new Set(f.map(x => p[x])).size === 2).length, traps: [12 * (n - 2), 8, 12 * (n - 2) + 8, 6 * (n - 2) ** 2] },
      { text: 'red and blue but no green', count: p => cs.filter(f => { const s = new Set(f.map(x => p[x])); return s.size === 2 && s.has('red') && s.has('blue') }).length, traps: [8 * (n - 2), 2 * (n - 2), 4 * (n - 2) + 4, 12 * (n - 2)] },
      { text: 'only red (and no other colour)', count: p => cs.filter(f => f.length === 1 && p[f[0]] === 'red').length, traps: [(n - 2) ** 2, 6 * (n - 2) ** 2, 2 * (n - 2) ** 2 + 4 * (n - 2), 4 * (n - 2) ** 2] },
    ]
    const q = pick(r, qs)
    const ans = q.count(paint)
    emit({ family: 'cube', topic: 'Cubes', question: `A cube has one pair of opposite faces painted red, another pair blue and the remaining pair green. It is cut into ${n ** 3} identical small cubes. How many small cubes show ${q.text}?`, correct: String(ans), traps: q.traps.filter(v => v !== ans).map(String), explanation: `Same colours are on opposite faces, so any two adjacent faces differ. ${q.text === 'exactly two different colours' ? `Two colours appear exactly on the non-corner edge cubes: 12 edges × (${n}−2) = ${ans} (corners show three colours).` : q.text.startsWith('red and blue') ? `Red–blue cubes lie on the 4 edges where a red face meets a blue face, excluding corners: 4 × (${n}−2) = ${ans}.` : `Only-red cubes are the face-centre cubes of the two red faces: 2 × (${n}−2)² = ${ans}.`}`, hint: cubeHint, seconds: 150, recompute: () => String(q.count(paint)) })
    return
  }
  if (kind === 2) {
    // three faces meeting at a corner red, the other three blue
    const paint = ['red', 'blue', 'red', 'blue', 'red', 'blue']
    const qs: Q[] = [
      { text: 'both red and blue paint', count: p => cs.filter(f => new Set(f.map(x => p[x])).size === 2).length, traps: [12 * (n - 2), 6 * (n - 2), 6 * (n - 2) + 8, 6 * (n - 2) + 2] },
      { text: 'only red paint (at least one face)', count: p => cs.filter(f => f.length > 0 && f.every(x => p[x] === 'red')).length, traps: [3 * (n - 2) ** 2, 3 * (n - 1) ** 2, 3 * (n - 2) ** 2 + 3 * (n - 2), (n - 1) ** 3 - (n - 2) ** 3 + 1] },
    ]
    const q = pick(r, qs)
    const ans = q.count(paint)
    emit({ family: 'cube', topic: 'Cubes', question: `The three faces of a cube that meet at one corner are painted red and the other three faces blue. The cube is cut into ${n ** 3} identical small cubes. How many small cubes have ${q.text}?`, correct: String(ans), traps: q.traps.filter(v => v !== ans).map(String), explanation: `Let the red faces be x = 0, y = 0, z = 0 and the blue faces x = ${n - 1}, y = ${n - 1}, z = ${n - 1} (in cubelet coordinates 0…${n - 1}). ${q.text.startsWith('only red') ? `A cube has only red paint if some coordinate is 0 and none is ${n - 1}: (${n}−1)³ − (${n}−2)³ = ${(n - 1) ** 3} − ${(n - 2) ** 3} = ${ans}.` : `Painted cubes number ${n}³ − (${n}−2)³ = ${n ** 3 - (n - 2) ** 3}; only-red and only-blue each number (${n}−1)³ − (${n}−2)³ = ${(n - 1) ** 3 - (n - 2) ** 3}; so both colours = ${n ** 3 - (n - 2) ** 3} − 2×${(n - 1) ** 3 - (n - 2) ** 3} = ${ans}.`}`, hint: cubeHint, seconds: 160, recompute: () => String(q.count(paint)) })
    return
  }
  if (kind === 3) {
    const [a, b, c] = [int(r, 3, 6), int(r, 3, 6), int(r, 2, 5)].sort((x, y) => x - y)
    const k = int(r, 0, 2)
    // all faces painted except the bottom face (−z, index 4)
    const count = () => cubelets(a, b, c).filter(f => f.filter(x => x !== 4).length === k).length
    const ans = count()
    const allSix = cubelets(a, b, c).filter(f => f.length === k).length
    emit({ family: 'cube', topic: 'Cubes', question: `A cuboid ${a} cm long, ${b} cm wide and ${c} cm high stands on its ${a} × ${b} base. All its faces except the base are painted, and it is cut into 1-cm cubes. How many of the cubes have exactly ${NUMW[k]} painted face${k === 1 ? '' : 's'}?`, correct: String(ans), traps: [allSix, ans + 4, Math.abs(ans - 4), ans + 2 * (a + b - 4), (a - 2) * (b - 2) * (c - 2)].filter(v => v !== ans && v >= 0).map(String), explanation: `With the base unpainted, the bottom layer behaves like an inner layer on that side. ${k === 0 ? `Unpainted cubes: (${a}−2)×(${b}−2)×(${c}−1) = ${ans}.` : `Classify by the painted faces they touch (top, four sides): exactly ${k} painted face${k === 1 ? '' : 's'} gives ${ans}.`} If all six faces were painted the count would be ${allSix} — the common trap.`, hint: 'Treat the unpainted base as if the cuboid continued below it: dimensions touching the base lose only one layer, not two.', seconds: 150, recompute: () => String(count()) })
    return
  }
  if (kind === 4) {
    const one = 6 * (n - 2) ** 2
    const ask = int(r, 0, 1)
    const ans = ask === 0 ? (n - 2) ** 3 : 12 * (n - 2)
    emit({ family: 'cube', topic: 'Cubes', question: `A cube painted on all faces is cut into identical smaller cubes. Exactly ${one} of the small cubes have only one face painted. How many small cubes have ${ask === 0 ? 'no face painted' : 'exactly two faces painted'}?`, correct: String(ans), traps: [ask === 0 ? (n - 1) ** 3 : 12 * (n - 1), ask === 0 ? (n - 2) ** 2 : 12 * (n - 2) + 8, ask === 0 ? (n - 3) ** 3 : 8 * (n - 2), ans + 8].filter(v => v !== ans).map(String), explanation: `One-face cubes number 6(n−2)² = ${one}, so (n−2)² = ${one / 6} and n = ${n}. Then ${ask === 0 ? `unpainted cubes = (n−2)³ = ${ans}` : `two-face cubes = 12(n−2) = ${ans}`}.`, hint: 'Work backwards: recover the number of cuts per edge from the given count, then count the asked type.', seconds: 120, recompute: () => String(cs.filter(f => f.length === (ask === 0 ? 0 : 2)).length) })
    return
  }
  // kind 5: after removing a layer
  const ans = cubelets(n, n, n - 1).filter(f => f.length === 0).length
  const cnt = () => {
    // paint was applied before removal; after removing the top layer the remaining cubes are judged by original paint
    const before = cubelets(n, n, n)
    let c0 = 0
    let idxc = 0
    for (let x = 0; x < n; x++) for (let y = 0; y < n; y++) for (let z = 0; z < n; z++) {
      if (z < n - 1 && before[idxc].length === 0) c0++
      idxc++
    }
    return c0
  }
  const real = cnt()
  emit({ family: 'cube', topic: 'Cubes', question: `A cube painted on all faces is cut into ${n ** 3} identical small cubes. The entire top layer of small cubes is then removed. Among the remaining small cubes, how many have no paint on any face?`, correct: String(real), traps: [ans, (n - 2) ** 3 + (n - 2) ** 2, (n - 2) ** 2 * (n - 1), (n - 2) ** 3 - (n - 2)].filter(v => v !== real).map(String), explanation: `Paint was applied before cutting, so judge each cube by its original paint. Unpainted cubes are the inner ${n - 2}×${n - 2}×${n - 2} block; none of those inner cubes lies in the removed top layer, so the count stays ${real}. (Recomputing for an ${n}×${n}×${n - 1} block painted afresh, ${ans}, is the trap.)`, hint: 'Ask whether paint was applied before or after the removal; removed outer cubes do not change the paint on the cubes that remain.', seconds: 130, recompute: () => String(cnt()) })
}

// Dice: faces 0..5 = U, D, F, B, R, L with outward normals
const NORMALS: [number, number, number][] = [[0, 0, 1], [0, 0, -1], [0, -1, 0], [0, 1, 0], [1, 0, 0], [-1, 0, 0]]
const OPP = [1, 0, 3, 2, 5, 4]
const det3 = (a: number[], b: number[], c: number[]) => a[0] * (b[1] * c[2] - b[2] * c[1]) - a[1] * (b[0] * c[2] - b[2] * c[0]) + a[2] * (b[0] * c[1] - b[1] * c[0])
const CORNERS: [number, number, number][] = []
for (const x of [4, 5]) for (const y of [2, 3]) for (const z of [0, 1]) {
  // order the three faces so that det(top-like, front-like, right-like) = +1
  const t: [number, number, number] = [z, y, x]
  CORNERS.push(det3(NORMALS[t[0]], NORMALS[t[1]], NORMALS[t[2]]) > 0 ? t : [z, x, y])
}
const DIE_LABELINGS = perms(6) // labeling[face] = label index
const cycKey = (a: number, b: number, c: number) => (a < b && a < c ? a * 36 + b * 6 + c : b < a && b < c ? b * 36 + c * 6 + a : c * 36 + a * 6 + b)
const DIE_VIEWSETS = DIE_LABELINGS.map(lab => new Set(CORNERS.map(([p, q, s]) => cycKey(lab[p], lab[q], lab[s]))))

const dicePuzzle = (r: Rand, idx: number) => {
  const L = pick(r, [['1', '2', '3', '4', '5', '6'], ['A', 'B', 'C', 'D', 'E', 'F'], ['P', 'Q', 'R', 'S', 'T', 'U'], ['Red', 'Blue', 'Green', 'Black', 'White', 'Pink']])
  const hidden = pick(r, DIE_LABELINGS)
  const views: [number, number, number][] = []
  const allCorners = shuffle(r, CORNERS)
  const consistent = () => consistentWith(views)
  const frame = idx % 2
  const target = int(r, 0, 5)
  const front = pick(r, range(6).filter(x => x !== target && x !== OPP[hidden.indexOf(target)] && hidden[OPP[hidden.indexOf(target)]] !== x))
  const askOpp = (lab: number[]) => L[lab[OPP[lab.indexOf(target)]]]
  const askRight = (lab: number[]) => {
    const c = CORNERS.find(([p, q]) => lab[p] === target && lab[q] === front)
    if (c) return L[lab[c[2]]]
    // target on top & 'front' must be adjacent; find via orientation
    for (const [p, q, s] of CORNERS) {
      const trip = [lab[p], lab[q], lab[s]]
      for (let k = 0; k < 3; k++) if (trip[k] === target && trip[(k + 1) % 3] === front) return L[trip[(k + 2) % 3]]
    }
    return 'none'
  }
  const ask = frame === 0 ? askOpp : askRight
  for (const [p, q, s] of allCorners) {
    views.push([hidden[p], hidden[q], hidden[s]])
    // the asked face must not be visible in a way that answers directly
    const cs = consistent()
    const vals = new Set(cs.map(ask))
    if (vals.size === 1 && views.length >= 2) {
      const shown = [...views]
      const ans = ask(hidden)
      const question = `A die has the six faces ${L.join(', ')}. ${shown.map(([t, f, rt], i) => `In view ${i + 1} of the same die, the top face shows ${L[t]}, the front face ${L[f]} and the right face ${L[rt]}.`).join(' ')} ${frame === 0 ? `Which face is opposite ${L[target]}?` : `If the die is placed with ${L[target]} on top and ${L[front]} in front, what is on the right face?`}`
      const traps = L.filter(x => x !== ans && x !== L[target] && (frame === 0 || x !== L[front]))
      const visibleWith = shown.flatMap(v => (v.includes(target) ? v.map(x => L[x]) : [])).filter(x => x !== L[target])
      emit({
        family: 'cube',
        topic: 'Dice',
        question,
        correct: ans,
        traps: shuffle(r, traps),
        explanation: frame === 0
          ? `Faces seen together with ${L[target]} (${[...new Set(visibleWith)].join(', ') || 'none directly'}) are adjacent to it, so they cannot be opposite. Combining the views (and keeping their clockwise order consistent), the only label never adjacent to ${L[target]} is ${ans}.`
          : `Fix the die from the views: reading top → front → right clockwise around a corner must match one of the views' cyclic orders. With ${L[target]} on top and ${L[front]} in front, the clockwise order forces ${ans} on the right.`,
        hint: 'Faces appearing in the same view are adjacent; for orientation questions keep the clockwise order (top → front → right) of each corner fixed.',
        seconds: frame === 0 ? 120 : 160,
        recompute: () => {
          const vv = new Set(consistentWith(shown).map(ask))
          return vv.size === 1 ? [...vv][0] : 'not determined'
        },
      })
      return
    }
    if (views.length >= 3) break
  }
  throw new Error('die not determined')
}
const consistentWith = (views: [number, number, number][]) => DIE_LABELINGS.filter((_, i) => views.every(([t, f, rt]) => DIE_VIEWSETS[i].has(cycKey(t, f, rt))))

{
  let i = 0
  produce('cube', 12, 33001, r => cubePaint(r, i++), 60)
  let j = 0
  produce('cube', 10, 34001, r => dicePuzzle(r, j++), 200)
}

// ---------------------------------------------------------------------------
// Calendar and clock traps (computed)
// ---------------------------------------------------------------------------

const WEEK = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']
const dow = (y: number, m: number, d: number) => new Date(Date.UTC(y, m, d)).getUTCDay()
const isLeap = (y: number) => (y % 4 === 0 && y % 100 !== 0) || y % 400 === 0

const calDay = (r: Rand) => {
  const y1 = int(r, 1996, 2022)
  const m1 = int(r, 0, 11)
  const d1 = int(r, 1, 28)
  const y2 = y1 + int(r, 2, 9)
  const m2 = int(r, 0, 11)
  const d2 = int(r, 1, 28)
  const w1 = dow(y1, m1, d1)
  const w2 = dow(y2, m2, d2)
  const days = Math.round((Date.UTC(y2, m2, d2) - Date.UTC(y1, m1, d1)) / 86400000)
  const leaps = range(y2 - y1 + 1).map(i => y1 + i).filter(isLeap)
  const ans = WEEK[w2]
  emit({ family: 'cal', topic: 'Calendar', question: `${d1} ${MONTHS[m1]} ${y1} was a ${WEEK[w1]}. What day of the week was ${d2} ${MONTHS[m2]} ${y2}?`, correct: ans, traps: [WEEK[mod(w2 - 1, 7)], WEEK[mod(w2 + 1, 7)], WEEK[mod(w2 - 2, 7)], WEEK[mod(w2 + 2, 7)]], explanation: `The gap is ${days} days = ${Math.floor(days / 7)} weeks + ${days % 7} odd days (leap years in the range: ${leaps.join(', ') || 'none'}; count 29 February only if it lies inside the interval). ${WEEK[w1]} + ${days % 7} = ${ans}.`, hint: 'Count odd days year by year; a 29 February counts only when it falls between the two dates.', seconds: 140, recompute: () => WEEK[dow(y2, m2, d2)] })
}
const calRepeat = (r: Rand) => {
  const y = int(r, 2001, 2030)
  const same = (a: number, b: number) => isLeap(a) === isLeap(b) && dow(a, 0, 1) === dow(b, 0, 1)
  let n = y + 1
  while (!same(y, n)) n++
  emit({ family: 'cal', topic: 'Calendar', question: `The calendar of which year will be exactly the same as that of ${y}?`, correct: String(n), traps: [y + 6, y + 11, y + 28, y + 5, y + 7].filter(v => v !== n).map(String), explanation: `Two years share a calendar when they start on the same weekday and are both leap or both ordinary. ${y} is ${isLeap(y) ? 'a leap year' : 'an ordinary year'} starting on ${WEEK[dow(y, 0, 1)]}. Adding odd days (1 per ordinary year, 2 per leap year) the first year that again starts on ${WEEK[dow(y, 0, 1)]} with the same leap status is ${n}.`, hint: 'Accumulate odd days year by year until the total is a multiple of 7, and check the leap-year status matches.', seconds: 120, recompute: () => {
    let odd = 0
    let z = y
    do {
      odd += isLeap(z) ? 2 : 1
      z++
    } while (odd % 7 !== 0 || isLeap(z) !== isLeap(y))
    return String(z)
  } })
}
const calNth = (r: Rand) => {
  const y = int(r, 2019, 2032)
  const m = int(r, 0, 11)
  const wd = int(r, 0, 6)
  const k = int(r, 2, 4)
  const first = dow(y, m, 1)
  const dateK = 1 + mod(wd - first, 7) + 7 * (k - 1)
  if (m === 1 || m === 11) throw new Error('avoid February/December wrap')
  const len = new Date(Date.UTC(y, m + 1, 0)).getUTCDate()
  const ask = int(r, 3, 20)
  const gap = len - dateK + ask
  const ans = WEEK[mod(wd + gap, 7)]
  emit({ family: 'cal', topic: 'Calendar', question: `In ${MONTHS[m]} of a certain year, the ${ORDW[k]} ${WEEK[wd]} falls on the ${nth(dateK)}. What day of the week is the ${nth(ask)} of ${MONTHS[m + 1]} of the same year?`, correct: ans, traps: [WEEK[mod(wd + gap + 1, 7)], WEEK[mod(wd + gap - 1, 7)], WEEK[mod(wd + ask - dateK, 7)], WEEK[mod(wd + gap + (len === 31 ? -1 : 1), 7)]].filter(x => x !== ans), explanation: `${MONTHS[m]} has ${len} days. From the ${nth(dateK)} of ${MONTHS[m]} to the ${nth(ask)} of ${MONTHS[m + 1]} is ${len} − ${dateK} + ${ask} = ${gap} days = ${mod(gap, 7)} odd days, so ${WEEK[wd]} + ${mod(gap, 7)} = ${ans}. (Forgetting the month length gives the wrong day.)`, hint: 'Find the remaining days of the month (use its length), add the date in the next month, and reduce modulo 7.', seconds: 100, recompute: () => WEEK[dow(y, m + 1, ask)] })
}

const fmtMin = (num: number, den: number) => {
  // minutes as mixed fraction
  const whole = Math.floor(num / den)
  const rem = num % den
  return rem === 0 ? `${whole}` : `${whole} ${rem}/${den}`
}
const clockGain = (r: Rand) => {
  const g = pick(r, [2, 3, 4, 5, 6, 10, 12])
  // clock runs (60+g) minutes per real 60 minutes; choose a real gap giving whole minutes on the faulty clock
  const realH = pick(r, [5, 10, 15, 20, 30].filter(x => (x * g) % 1 === 0))
  const start = int(r, 6, 9)
  const shownMin = realH * (60 + g)
  const shownH = start + Math.floor(shownMin / 60)
  const shownM = shownMin % 60
  const fmt12 = (hh: number, mm: number) => `${((hh + 11) % 12) + 1}:${String(mm).padStart(2, '0')} ${hh % 24 < 12 ? 'a.m.' : 'p.m.'}${hh >= 24 ? ' (next day)' : ''}`
  const ans = fmt12(start + realH, 0)
  emit({ family: 'clock', topic: 'Clock', question: `A clock gains ${g} minutes every hour. It is set right at ${start}:00 a.m. What is the correct time when this clock shows ${fmt12(shownH, shownM)}?`, correct: ans, traps: [fmt12(start + realH, 0 + 0) === ans ? fmt12(shownH, shownM - (shownM >= g * realH % 60 ? 0 : 0)) : ans, fmt12(start + realH + 1, 0), fmt12(start + realH - 1, 0), fmt12(shownH, shownM).replace(/:(\d\d)/, (_, mm) => `:${String((Number(mm) + 30) % 60).padStart(2, '0')}`), fmt12(start + realH, 30)], explanation: `The faulty clock advances ${60 + g} minutes per real hour. It shows ${shownMin} minutes after ${start}:00, so real time elapsed = ${shownMin}×60/${60 + g} = ${realH * 60} minutes = ${realH} hours. Correct time: ${ans} (subtracting ${g} minutes per shown hour is the trap).`, hint: 'Convert with the ratio of real to faulty minutes (60 : 60+g); do not subtract the gain per shown hour.', seconds: 130, recompute: () => fmt12(start + Math.round((shownMin * 60) / (60 + g) / 60), 0) })
}
const clockMeet = (r: Rand) => {
  const h = int(r, 1, 10)
  const kind = pick(r, ['coincide', 'right angle (first time)', 'opposite'] as const)
  // minute m satisfies 5.5m = 30h + θ (θ = 0, 90 or 180 with the earliest valid choice)
  const theta = kind === 'coincide' ? 0 : kind === 'opposite' ? 180 : -90
  let num = 2 * (30 * h + theta) // m = num / 11
  if (num < 0) num = 2 * (30 * h - 90 + 180) - 2 * 90 // fallback, recomputed below
  const sols = [-180, -90, 0, 90, 180].filter(t => (kind === 'coincide' ? t === 0 : kind === 'opposite' ? Math.abs(t) === 180 : Math.abs(t) === 90)).map(t => (2 * (30 * h + t)) / 11).filter(m => m >= 0 && m < 60).sort((a, b) => a - b)
  if (!sols.length) throw new Error('none')
  const m = sols[0]
  num = Math.round(m * 11)
  const ans = `${fmtMin(num, 11)} minutes past ${h}`
  emit({ family: 'clock', topic: 'Clock', question: `At what time between ${h} and ${h + 1} o'clock will the hands of a clock ${kind === 'coincide' ? 'coincide' : kind === 'opposite' ? 'point in exactly opposite directions' : 'be at right angles for the first time'}?`, correct: ans, traps: [`${fmtMin(num + 11, 11)} minutes past ${h}`, `${fmtMin(Math.max(0, num - 22), 11)} minutes past ${h}`, `${fmtMin(num, 11).split(' ')[0]} minutes past ${h}`, `${fmtMin(num + 22, 11)} minutes past ${h}`, `${fmtMin(Math.max(0, num - 11), 11)} minutes past ${h}`], explanation: `The minute hand gains 5.5° per minute on the hour hand, which starts ${30 * h}° ahead. ${kind === 'coincide' ? 'Coinciding needs a gain of' : kind === 'opposite' ? 'Being opposite needs a gain of' : 'The first right angle needs a gain of'} ${Math.round(5.5 * m)}°, i.e. ${Math.round(5.5 * m)}/5.5 = ${fmtMin(num, 11)} minutes.`, hint: 'Use 5.5m = 30h ± θ and choose the earliest value of m in 0–60.', seconds: 120, recompute: () => ans })
}

produce('cal', 4, 35001, r => calDay(r), 20)
produce('cal', 3, 36001, r => calRepeat(r), 20)
produce('cal', 3, 37001, r => calNth(r), 20)
produce('clock', 4, 39001, r => clockGain(r), 40)
produce('clock', 5, 40001, r => clockMeet(r), 60)

// ---------------------------------------------------------------------------
// Statement-based judgement items (hand-written, clear-cut)
// ---------------------------------------------------------------------------

type Hand = { topic: string; q: string; correct: string; traps: string[]; why: string; hint: string }
const HAND: Hand[] = [
  { topic: 'Statement and assumption', q: "Statement: The district police announced, 'Citizens may now file complaints about lost mobile phones through the new online portal instead of visiting a station.' Assumptions: I. A good number of citizens can access the online portal. II. Lost-phone complaints will now be resolved faster than other complaints.", correct: 'Only assumption I is implicit', traps: ['Only assumption II is implicit', 'Both I and II are implicit', 'Neither I nor II is implicit'], why: 'Offering an online route assumes people can use it (I). Nothing in the notice claims quicker resolution than other complaints (II is extraneous).', hint: 'An implicit assumption is something the speaker must take for granted for the statement to make sense.' },
  { topic: 'Statement and assumption', q: "Statement: 'Candidates must carry an original photo identity card to the examination hall; photocopies will not be accepted,' says the admit card. Assumptions: I. Most candidates possess an original photo identity card. II. Photocopies of identity cards can be misused or forged more easily.", correct: 'Both I and II are implicit', traps: ['Only assumption I is implicit', 'Only assumption II is implicit', 'Neither I nor II is implicit'], why: 'The rule would be unworkable unless candidates generally have originals (I), and rejecting photocopies only makes sense if they are less reliable (II).', hint: 'Ask: would the instruction be pointless if this were false?' },
  { topic: 'Statement and assumption', q: 'Statement: A transport department advertisement says, "Wear a helmet — it can save your life." Assumptions: I. People are influenced by advertisements. II. Without helmets every accident is fatal.', correct: 'Only assumption I is implicit', traps: ['Only assumption II is implicit', 'Both I and II are implicit', 'Neither I nor II is implicit'], why: 'Advertising presumes it can influence behaviour (I). "Can save" does not imply every accident without a helmet is fatal; II is an extreme reading.', hint: 'Reject assumptions with words like "every", "only", "always" unless the statement forces them.' },
  { topic: 'Statement and assumption', q: 'Statement: The municipal body has decided to install CCTV cameras at all major traffic junctions to reduce signal jumping. Assumptions: I. Fear of being recorded will deter many violators. II. Traffic police personnel will no longer be required at junctions.', correct: 'Only assumption I is implicit', traps: ['Only assumption II is implicit', 'Both I and II are implicit', 'Neither I nor II is implicit'], why: 'Cameras reduce violations only if being recorded deters people (I). Replacing personnel entirely is not implied (II).', hint: 'Check whether the decision depends on the assumption, not whether the assumption is a possible side-effect.' },
  { topic: 'Statement and course of action', q: 'Statement: Several cases of food poisoning were reported after a wedding feast in a village, and samples show the drinking water supplied there was contaminated. Courses of action: I. The health department should test and disinfect the village water source immediately. II. All wedding functions in the district should be banned for a year.', correct: 'Only course I follows', traps: ['Only course II follows', 'Both I and II follow', 'Neither I nor II follows'], why: 'Disinfecting the identified source directly addresses the cause (I). A district-wide ban is disproportionate and does not address contaminated water (II).', hint: 'A course of action must be practical, address the cause, and be proportionate.' },
  { topic: 'Statement and course of action', q: 'Statement: Chain-snatching incidents on a particular stretch of road have risen sharply in the last two months, mostly between 7 p.m. and 9 p.m. Courses of action: I. Police patrolling on that stretch should be increased during the evening hours. II. Street lighting on that stretch should be checked and improved.', correct: 'Both I and II follow', traps: ['Only course I follows', 'Only course II follows', 'Neither I nor II follows'], why: 'Both measures directly target the specific time and place of the crimes and are practical (I and II).', hint: 'Prefer actions that target the identified time, place or cause of the problem.' },
  { topic: 'Statement and course of action', q: 'Statement: A survey found that many applicants for a government scheme were rejected because they filled the online form incorrectly. Courses of action: I. The department should simplify the form and publish a step-by-step guide. II. The scheme should be withdrawn because applicants cannot fill forms.', correct: 'Only course I follows', traps: ['Only course II follows', 'Both I and II follow', 'Neither I nor II follows'], why: 'Simplifying the form addresses the cause (I). Withdrawing the scheme punishes beneficiaries and solves nothing (II).', hint: 'Withdrawal or blanket bans rarely follow when a fixable process problem is identified.' },
  { topic: 'Statement and conclusion', q: 'Statement: Of the 120 trainees in a police academy batch, all who scored above 80 in the physical test were selected for the special unit; no trainee from the 2023 batch scored above 80. Conclusions: I. No trainee of the 2023 batch was selected for the special unit through the physical-test route. II. The 2023 batch was weaker than all other batches.', correct: 'Only conclusion I follows', traps: ['Only conclusion II follows', 'Both I and II follow', 'Neither I nor II follows'], why: 'Selection through that route required a score above 80, which no 2023 trainee achieved (I). Nothing compares the batch with all other batches on overall strength (II).', hint: 'A conclusion must follow from the given facts alone; comparisons with unmentioned groups do not.' },
  { topic: 'Statement and conclusion', q: 'Statement: The railway station announced that because of track maintenance, all trains on the route will run 30 minutes late on Sunday, and no train will be cancelled. Conclusions: I. A passenger planning to travel on that route on Sunday should expect a delay. II. Track maintenance always causes delays on every route.', correct: 'Only conclusion I follows', traps: ['Only conclusion II follows', 'Both I and II follow', 'Neither I nor II follows'], why: 'All trains on the route will run late on Sunday, so a delay is expected (I). The statement is about one route and one day; II overgeneralises.', hint: 'Watch for generalisations ("always", "every") that go beyond the statement.' },
  { topic: 'Statement and assumption', q: "Statement: A coaching institute says, 'Join our 45-day crash course to clear the SI preliminary examination.' Assumptions: I. Some candidates want to prepare in a short time. II. Candidates who do not join the course cannot clear the examination.", correct: 'Only assumption I is implicit', traps: ['Only assumption II is implicit', 'Both I and II are implicit', 'Neither I nor II is implicit'], why: 'A short crash course is advertised because some candidates want quick preparation (I). The advertisement does not imply that others must fail (II).', hint: 'Advertisements assume a demand exists; they do not assume all alternatives fail.' },
  { topic: 'Statement and course of action', q: 'Statement: The water level in the reservoir supplying a city has fallen to its lowest in a decade, and the monsoon is expected to be delayed. Courses of action: I. The city should regulate water supply to fixed hours and appeal to citizens to avoid waste. II. The city should immediately stop supplying water to hospitals to save water for households.', correct: 'Only course I follows', traps: ['Only course II follows', 'Both I and II follow', 'Neither I nor II follows'], why: 'Rationing and conservation are practical responses (I). Cutting supply to hospitals endangers lives and is not a reasonable course (II).', hint: 'A valid course reduces the problem without creating a bigger one.' },
  { topic: 'Statement and conclusion', q: 'Statement: Every constable in the district completed the first-aid course this year. Ramu is a constable in the district who joined in January this year. Conclusions: I. Ramu completed the first-aid course this year. II. The first-aid course is compulsory for all police staff in the state.', correct: 'Only conclusion I follows', traps: ['Only conclusion II follows', 'Both I and II follow', 'Neither I nor II follows'], why: 'Ramu belongs to the group "every constable in the district", so I follows. Nothing is said about compulsion or about the whole state (II).', hint: 'Apply the universal statement to the individual; do not infer the reason behind it.' },
]
HAND.forEach((h, i) => {
  const r = rng(41001 + i)
  emit({ family: 'stmt', topic: h.topic, question: h.q, correct: h.correct, traps: shuffle(r, h.traps), explanation: h.why, hint: h.hint, seconds: 90, recompute: () => h.correct })
})

export const severeReasoningQuestions: Question[] = bank
export const severeReasoningSelfCheck = (): string[] => checks.map(c => c.verify()).filter((x): x is string => x !== null)
