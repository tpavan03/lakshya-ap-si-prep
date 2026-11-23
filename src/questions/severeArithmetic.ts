import type { Question } from '../data'
import { assemblyKey, fmt, frac, gcd, int, lcm, money, options4, pick, rng, severe, shuffle, type Rand } from './severeKit'

/**
 * Severe arithmetic bank (ids `sva-<family>-f<frame>-<n>`).
 *
 * Each family has several structurally different frames (different unknowns,
 * chained steps, combined concepts). Parameters are drawn so the answer is
 * exact, the answer is computed in code, and the traps are the results of the
 * common wrong approaches. Counting and probability answers are obtained by
 * brute-force enumeration rather than formulae.
 */

type Draft = {
  topic: string
  question: string
  correct: string
  traps: string[]
  explanation: string
  hint: string
  seconds?: number
}
type Frame = (r: Rand) => Draft | null

const pc = (n: number) => `${fmt(n)}%`
const f4 = (n: number) => String(Number(n.toFixed(6)))
const names = ['Ravi', 'Sita', 'Kiran', 'Latha', 'Mohan', 'Nirmala', 'Prasad', 'Usha', 'Venu', 'Kavya', 'Imran', 'Deepa']
const two = (r: Rand) => {
  const [a, b] = shuffle(r, names)
  return [a, b] as const
}
const three = (r: Rand) => {
  const [a, b, c] = shuffle(r, names)
  return [a, b, c] as const
}
const isInt = (n: number) => Math.abs(n - Math.round(n)) < 1e-9
const nice = (n: number, places = 2) => isInt(n * 10 ** places)

// ---------------------------------------------------------------- percentages
const percentages: Frame[] = [
  r => {
    const p = pick(r, [20, 25, 30, 40, 50, 60]), q = pick(r, [5, 8, 10, 12, 15].filter(x => x < p))
    const cut = (p - q) / (100 + p) * 100
    if (!nice(cut)) return null
    const item = pick(r, ['cooking gas', 'petrol', 'edible oil', 'rice'])
    return {
      topic: 'Percentages',
      question: `The price of ${item} rises by ${p}%. A household is willing to let its monthly expenditure on ${item} rise by only ${q}%. By what percentage must it reduce consumption?`,
      correct: pc(cut),
      traps: [pc(p - q), pc(Number(((p - q) / (100 + q) * 100).toFixed(2))), pc(Number((p / (100 + p) * 100).toFixed(2)))],
      explanation: `Expenditure = price × consumption. New expenditure factor ${(100 + q) / 100} = ${(100 + p) / 100} × c, so c = ${100 + q}/${100 + p}. Reduction = 1 − ${100 + q}/${100 + p} = ${p - q}/${100 + p} = ${pc(cut)}. Subtracting ${p}−${q} ignores that the cut applies to the raised price base.`,
      hint: 'Write expenditure as a product of two factors and solve for the consumption factor.',
      seconds: 100,
    }
  },
  r => {
    const x = pick(r, [10, 20, 25, 40, 50, 60]), y = pick(r, [10, 20, 25, 30, 40, 50])
    const [a, b, c] = three(r)
    const ratio = (100 + x) * (100 - y) / 100 // A as % of C
    if (ratio === 100 || !nice(ratio)) return null
    const less = ratio < 100
    const gap = Math.abs(100 - ratio)
    return {
      topic: 'Percentages',
      question: `${a}'s salary is ${x}% more than ${b}'s, and ${b}'s salary is ${y}% less than ${c}'s. By what percentage is ${a}'s salary ${less ? 'less' : 'more'} than ${c}'s?`,
      correct: pc(gap),
      traps: [pc(Math.abs(x - y)), pc(Number((gap / ratio * 100).toFixed(2))), pc(Number((Math.abs(x - y) + x * y / 100).toFixed(2)))],
      explanation: `Take ${c} = 100. Then ${b} = ${100 - y} and ${a} = ${100 - y}×${(100 + x) / 100} = ${fmt(ratio)}. So ${a} is ${fmt(gap)} ${less ? 'below' : 'above'} ${c}'s 100, i.e. ${pc(gap)}. Netting ${x}% and ${y}% directly ignores that they act on different bases; dividing by ${a}'s salary uses the wrong base.`,
      hint: 'Fix the reference person (after “than”) at 100 and chain the multipliers.',
      seconds: 100,
    }
  },
  r => {
    const rates = shuffle(r, [10, 20, 25, 5, 15]).slice(0, 3)
    const signs = [1, -1, 1]
    const factor = rates.reduce((f, rate, i) => f * (100 + signs[i] * rate) / 100, 1)
    let initial = 0
    for (const candidate of [8000, 16000, 24000, 32000, 40000, 48000, 64000, 80000]) if (isInt(candidate * factor)) { initial = candidate; break }
    if (!initial) return null
    const final = initial * factor
    const naive = final / (1 + (rates[0] - rates[1] + rates[2]) / 100)
    return {
      topic: 'Percentages',
      question: `The population of a town increased by ${rates[0]}% in the first year, decreased by ${rates[1]}% in the second year and increased by ${rates[2]}% in the third year. If the population at the end of the third year is ${final.toLocaleString('en-IN')}, what was it at the start?`,
      correct: initial.toLocaleString('en-IN'),
      traps: [Math.round(naive).toLocaleString('en-IN'), Math.round(final * (1 - rates[0] / 100) * (1 + rates[1] / 100) * (1 - rates[2] / 100)).toLocaleString('en-IN'), Math.round(initial * (1 + (rates[2] - rates[1]) / 100)).toLocaleString('en-IN')],
      explanation: `Final = initial × ${(100 + rates[0]) / 100} × ${(100 - rates[1]) / 100} × ${(100 + rates[2]) / 100} = initial × ${fmt(factor)}. Initial = ${final}/${fmt(factor)} = ${initial}. Adding the rates (+${rates[0]}−${rates[1]}+${rates[2]}) or reversing each change by the same percentage gives the trap values.`,
      hint: 'Successive changes multiply; divide the final value by the combined factor.',
      seconds: 110,
    }
  },
  r => {
    const notVote = pick(r, [10, 20, 25]), invalid = pick(r, [5, 10, 20]), w = pick(r, [55, 60, 65, 70])
    const total = pick(r, [8000, 10000, 12000, 16000, 20000, 24000, 40000])
    const cast = total * (100 - notVote) / 100, valid = cast * (100 - invalid) / 100
    const margin = valid * (2 * w - 100) / 100
    if (!isInt(cast) || !isInt(valid) || !isInt(margin)) return null
    return {
      topic: 'Percentages',
      question: `In an election between two candidates, ${notVote}% of the registered voters did not vote and ${invalid}% of the votes cast were invalid. The winner received ${w}% of the valid votes and won by ${margin.toLocaleString('en-IN')} votes. How many voters were registered?`,
      correct: total.toLocaleString('en-IN'),
      traps: [Math.round(margin / ((2 * w - 100) / 100)).toLocaleString('en-IN'), Math.round(margin / ((2 * w - 100) / 100) / ((100 - invalid) / 100)).toLocaleString('en-IN'), Math.round(margin / (w / 100) / ((100 - invalid) / 100) / ((100 - notVote) / 100)).toLocaleString('en-IN')],
      explanation: `Valid votes = N × ${(100 - notVote) / 100} × ${(100 - invalid) / 100}. The margin is (${w}% − ${100 - w}%) = ${2 * w - 100}% of valid votes, so valid = ${margin}/${(2 * w - 100) / 100} = ${valid}. Then N = ${valid}/(${(100 - notVote) / 100}×${(100 - invalid) / 100}) = ${total}. Stopping at valid votes or at votes cast gives the traps.`,
      hint: 'The margin is the difference of the two shares of valid votes; then undo the invalid and non-voting layers.',
      seconds: 130,
    }
  },
  r => {
    const a = pick(r, [12, 15, 20, 24, 25, 30, 36, 40]), b = pick(r, [10, 16, 18, 20, 24, 30, 45, 50].filter(x => x !== a))
    // a% of X = b% of Y, Y - X = d
    const g = gcd(a, b), ux = b / g, uy = a / g
    if (ux === uy) return null
    const k = int(r, 3, 15) * 10
    const X = ux * k, Y = uy * k, d = Y - X
    return {
      topic: 'Percentages',
      question: `${a}% of a number X equals ${b}% of another number Y, and Y ${d > 0 ? 'exceeds X' : 'is less than X'} by ${Math.abs(d)}. What is X + Y?`,
      correct: String(X + Y),
      traps: [String(Math.abs(d) * (a + b) / Math.abs(a - b) + 10), String(Math.abs(d) * (a + b) / Math.abs(a - b) / 2), String(X * 2)],
      explanation: `${a}X = ${b}Y gives X:Y = ${b}:${a} = ${ux}:${uy}. The difference of ${Math.abs(ux - uy)} part(s) is ${Math.abs(d)}, so one part = ${k}. X = ${X}, Y = ${Y} and X + Y = ${X + Y}.`,
      hint: 'Convert the percentage equality into a ratio, then use the given difference.',
      seconds: 90,
    }
  },
]

// --------------------------------------------------------- profit, loss, discount
const profit: Frame[] = [
  r => {
    const w = pick(r, [800, 900, 960, 950, 875]), markup = pick(r, [0, 10, 20, 25]), disc = pick(r, [0, 4, 5, 10])
    if (markup === 0 && disc === 0) return null
    const factor = (1000 / w) * (100 + markup) / 100 * (100 - disc) / 100
    const gain = (factor - 1) * 100
    if (!nice(gain)) return null
    const wording = markup ? `marks his goods ${markup}% above cost price${disc ? ` and then gives a ${disc}% discount` : ''}` : `sells at a ${disc}% discount on cost price`
    return {
      topic: 'Profit, loss and discount',
      question: `A trader uses a false weight of ${w} g in place of 1 kg and ${wording}. What is his overall ${gain >= 0 ? 'profit' : 'loss'} percentage?`,
      correct: pc(Math.abs(gain)),
      traps: [pc(Math.abs((1000 - w) / 10 + markup - disc)), pc(Number(Math.abs(((1000 - w) / 1000 + 1) * (100 + markup) / 100 * (100 - disc) / 100 * 100 - 100).toFixed(2))), pc(Number(Math.abs((1000 - w) / w * 100).toFixed(2)))],
      explanation: `He charges for 1000 g but gives ${w} g, a factor of 1000/${w}. Price factor = ${(100 + markup) / 100}×${(100 - disc) / 100}. Overall = 1000/${w}×${fmt((100 + markup) * (100 - disc) / 10000)} = ${fmt(factor)}, i.e. ${pc(Math.abs(gain))} ${gain >= 0 ? 'profit' : 'loss'}. The weight gain must be taken on the ${w} g actually given, not on 1000 g.`,
      hint: 'Combine (claimed weight ÷ actual weight) with the price factors multiplicatively.',
      seconds: 120,
    }
  },
  r => {
    const d1 = pick(r, [10, 20, 25]), d2 = pick(r, [10, 20, 25, 5]), g = pick(r, [8, 12, 17, 20, 26, 35])
    const mark = ((100 + g) / ((100 - d1) * (100 - d2) / 100) - 1) * 100
    if (!nice(mark)) return null
    return {
      topic: 'Profit, loss and discount',
      question: `A retailer wants a ${g}% profit after allowing two successive discounts of ${d1}% and ${d2}% on the marked price. By what percentage above cost price must the goods be marked?`,
      correct: pc(mark),
      traps: [pc(g + d1 + d2), pc(g + d1 + d2 - d1 * d2 / 100), pc(Number(((100 + g) / (100 - d1 - d2) * 100 - 100).toFixed(2)))],
      explanation: `Selling price = M × ${(100 - d1) / 100} × ${(100 - d2) / 100} = M × ${fmt((100 - d1) * (100 - d2) / 10000)}. This must equal ${(100 + g) / 100} × CP, so M/CP = ${fmt((100 + g) / 100)}/${fmt((100 - d1) * (100 - d2) / 10000)} = ${fmt(1 + mark / 100)}, a mark-up of ${pc(mark)}. Adding the percentages ignores that discounts and profit act on different bases.`,
      hint: 'Equate marked price × discount factors to cost price × profit factor.',
      seconds: 110,
    }
  },
  r => {
    const p = pick(r, [10, 20, 25, 30, 40]), base = (100 + p) * (100 - p)
    const s = (base / gcd(base, 100 * 100)) * int(r, 1, 3) * 100
    const c1 = s * 100 / (100 + p), c2 = s * 100 / (100 - p)
    if (!isInt(c1) || !isInt(c2) || s > 200000) return null
    const loss = c1 + c2 - 2 * s
    return {
      topic: 'Profit, loss and discount',
      question: `Two second-hand motorcycles are sold for ${money(s)} each, one at a ${p}% profit and the other at a ${p}% loss. What is the overall profit or loss in rupees?`,
      correct: `Loss of ${money(loss)}`,
      traps: ['No profit, no loss', `Gain of ${money(loss)}`, `Loss of ${money(2 * s * p * p / 10000)}`],
      explanation: `Cost prices are ${s}×100/${100 + p} = ${money(c1)} and ${s}×100/${100 - p} = ${money(c2)}. Total cost ${money(c1 + c2)} exceeds total sale ${money(2 * s)} by ${money(loss)}. (The loss is ${p}²/100 = ${fmt(p * p / 100)}% of total cost, not of total sale.)`,
      hint: 'Equal selling prices with equal ± rates always give a loss; recover each cost price.',
      seconds: 110,
    }
  },
  r => {
    const x = int(r, 12, 25), extra = int(r, 3, 9), y = x + extra, disc = pick(r, [10, 20, 25])
    // SP of x articles = CP of y articles; with discount d on marked price
    const spPerCp = y / x
    const markup = (spPerCp / ((100 - disc) / 100) - 1) * 100
    if (!nice(markup)) return null
    return {
      topic: 'Profit, loss and discount',
      question: `After allowing a ${disc}% discount on the marked price, a shopkeeper finds that the selling price of ${x} articles equals the cost price of ${y} articles. By what percentage above cost had he marked the articles?`,
      correct: pc(markup),
      traps: [pc(Number(((y - x) / x * 100).toFixed(2))), pc(Number(((y - x) / x * 100 + disc).toFixed(2))), pc(Number(((y - x) / y * 100 + disc).toFixed(2)))],
      explanation: `SP/CP = ${y}/${x}, a profit of ${fmt((y - x) / x * 100)}%. Since SP = M × ${(100 - disc) / 100}, M/CP = (${y}/${x}) ÷ ${(100 - disc) / 100} = ${fmt(1 + markup / 100)}. Mark-up = ${pc(markup)}.`,
      hint: 'First find SP/CP from the article counts, then undo the discount.',
      seconds: 110,
    }
  },
  r => {
    const buyN = pick(r, [3, 4, 5, 6]), buyP = pick(r, [10, 12, 15, 20]), sellN = pick(r, [2, 3, 4, 5].filter(n => n !== buyN)), sellP = pick(r, [10, 12, 15, 20])
    const cp = buyP / buyN, sp = sellP / sellN, unit = sp - cp
    if (unit <= 0) return null
    const target = pick(r, [60, 90, 120, 150, 180, 240, 300])
    const count = target / unit
    if (!isInt(count)) return null
    return {
      topic: 'Profit, loss and discount',
      question: `A vendor buys oranges at ${buyN} for ₹${buyP} and sells them at ${sellN} for ₹${sellP}. How many oranges must he sell to earn a profit of ₹${target}?`,
      correct: String(count),
      traps: [String(Math.round(target / sp)), String(count * 2), String(count + lcm(buyN, sellN))],
      explanation: `Cost per orange = ${buyP}/${buyN} = ₹${fmt(cp)}; selling price per orange = ${sellP}/${sellN} = ₹${fmt(sp)}. Profit per orange = ₹${fmt(unit)}, so ₹${target} needs ${target}/${fmt(unit)} = ${count} oranges. (LCM ${lcm(buyN, sellN)} oranges yield ₹${fmt(unit * lcm(buyN, sellN))} — a quick check.)`,
      hint: 'Reduce both rates to one article, or work with the LCM of the two lot sizes.',
      seconds: 100,
    }
  },
]

// ---------------------------------------------------------- SI / CI
const interest: Frame[] = [
  r => {
    const rate = pick(r, [4, 5, 6, 8, 10, 12, 15, 20]), p = pick(r, [5000, 8000, 10000, 12500, 15000, 20000, 25000, 40000]), t = pick(r, [2, 3, 4, 5])
    const si = p * rate * t / 100, diff = p * rate * rate / 10000, ci = p * ((1 + rate / 100) ** 2 - 1)
    if (!nice(si) || !nice(diff) || !nice(ci)) return null
    const ask = pick(r, ['ci', 'diff'] as const)
    return {
      topic: 'Compound interest',
      question: `The simple interest on a sum for ${t} years at ${rate}% per annum is ${money(si)}. ${ask === 'ci' ? 'What is the compound interest (compounded annually) on the same sum at the same rate for 2 years?' : 'What is the difference between the compound interest (compounded annually) and the simple interest on the same sum at the same rate for 2 years?'}`,
      correct: ask === 'ci' ? `₹${fmt(ci)}` : `₹${fmt(diff)}`,
      traps: ask === 'ci' ? [`₹${fmt(si * 2 / t)}`, `₹${fmt(si * ((1 + rate / 100) ** 2 - 1) / (rate / 100))}`, `₹${fmt(si * 2 / t + diff * 2)}`] : [`₹${fmt(diff * t)}`, `₹${fmt(si * rate / 100)}`, `₹${fmt(diff * 2)}`],
      explanation: `Step 1: P = SI×100/(R×T) = ${si}×100/(${rate}×${t}) = ${money(p)}. Step 2: 2-year SI = ${fmt(p * rate * 2 / 100)}; 2-year CI = P[(1+R/100)² − 1] = ${fmt(ci)}. ${ask === 'diff' ? `Difference = P(R/100)² = ${fmt(diff)}.` : `CI = ₹${fmt(ci)}.`} Using the given ${t}-year SI directly (without first recovering P) is the trap.`,
      hint: 'Recover the principal from the SI first, then compound for two years.',
      seconds: 120,
    }
  },
  r => {
    const rate = pick(r, [5, 10, 20]), p = pick(r, [8000, 10000, 16000, 20000, 40000, 50000])
    const diff = p * (rate / 100) ** 2 * (3 + rate / 100)
    if (!nice(diff)) return null
    return {
      topic: 'Compound interest',
      question: `On a certain sum at ${rate}% per annum, compound interest (compounded annually) for 3 years exceeds simple interest for 3 years by ₹${fmt(diff)}. Find the sum.`,
      correct: money(p),
      traps: [money(diff / (rate / 100) ** 2), money(diff / (rate / 100) ** 2 / 3), money(diff / ((rate / 100) ** 2 * (2 + rate / 100)))],
      explanation: `For 3 years, CI − SI = P(r/100)²(3 + r/100) = P × ${f4((rate / 100) ** 2)} × ${fmt(3 + rate / 100)} = ${f4((rate / 100) ** 2 * (3 + rate / 100))}P. So P = ${fmt(diff)}/${f4((rate / 100) ** 2 * (3 + rate / 100))} = ${money(p)}. Using the 2-year formula is the main trap.`,
      hint: 'The three-year difference is P(r/100)²(3 + r/100), not 3 × the two-year difference.',
      seconds: 120,
    }
  },
  r => {
    const rate = pick(r, [5, 10, 20, 25]), p = pick(r, [6400, 8000, 12800, 16000, 25600, 32000, 40000])
    const a2r = p * (1 + rate / 100) ** 2, a3r = p * (1 + rate / 100) ** 3
    if (!isInt(a2r) || !isInt(a3r)) return null
    const a2 = Math.round(a2r), a3 = Math.round(a3r)
    const ask = pick(r, ['sum', 'rate'] as const)
    return {
      topic: 'Compound interest',
      question: `A sum at compound interest (compounded annually) amounts to ₹${a2.toLocaleString('en-IN')} in 2 years and ₹${a3.toLocaleString('en-IN')} in 3 years. What is the ${ask === 'sum' ? 'principal' : 'annual rate of interest'}?`,
      correct: ask === 'sum' ? money(p) : pc(rate),
      traps: ask === 'sum'
        ? [money(a2 - 2 * (a3 - a2)), money(a2 / (1 + rate / 100) + 100), money(a2 - (a3 - a2))]
        : [pc(Number(((a3 - a2) / a3 * 100).toFixed(2))), pc(rate / 2 + 2.5), pc(rate + 5)],
      explanation: `The third year's interest ${a3 - a2} is earned on ${a2}, so r = ${a3 - a2}/${a2}×100 = ${rate}%. The principal is ${a2}/(1.${String(rate).padStart(2, '0')})² = ${money(p)}. Taking the interest on ${a3} instead of ${a2}, or subtracting simple-interest steps backward, gives the traps.`,
      hint: 'Consecutive CI amounts differ by one year’s interest on the earlier amount.',
      seconds: 110,
    }
  },
  r => {
    const [rate, mult] = pick(r, [[10, 121 * 10], [20, 36 * 100], [5, 441 * 20], [25, 16 * 500]] as const)
    const k = int(r, 1, 4)
    const inst = mult * k
    const P = inst * (1 / (1 + rate / 100) + 1 / (1 + rate / 100) ** 2)
    if (!nice(P, 6) || !isInt(Number(P.toFixed(6)))) return null
    const principal = Math.round(P)
    return {
      topic: 'Compound interest',
      question: `A loan of ${money(principal)} is repaid in two equal annual instalments at ${rate}% per annum compound interest, the first instalment falling due one year after the loan. What is each instalment?`,
      correct: money(inst),
      traps: [money(principal * (1 + rate / 100) ** 2 / 2), money(principal / 2 * (1 + rate / 100)), money(principal * (1 + 2 * rate / 100) / 2)],
      explanation: `Present value of the instalments equals the loan: X/${f4(1 + rate / 100)} + X/${f4((1 + rate / 100) ** 2)} = ${principal}. With ${fmt(1 + rate / 100)} = ${frac(100 + rate, 100)}, this gives X × ${frac((100 + rate) * 100 + 100 * 100, (100 + rate) ** 2)} = ${principal}, so X = ${money(inst)}. Halving the two-year amount ignores that the first instalment stops interest early.`,
      hint: 'Discount each instalment back to the start and equate to the loan.',
      seconds: 150,
    }
  },
  r => {
    const n = int(r, 3, 8), k = pick(r, [2, 3]), years = pick(r, [2, 3])
    const multiple = k // at SI the sum becomes k times in n years → rate = (k-1)*100/n
    const rate = (k - 1) * 100 / n
    if (!isInt(rate) || rate > 40) return null
    const p = pick(r, [5000, 10000, 20000])
    const ci = p * ((1 + rate / 100) ** years - 1)
    if (!nice(ci)) return null
    return {
      topic: 'Compound interest',
      question: `At simple interest a sum becomes ${multiple} times itself in ${n} years. At the same rate, what is the compound interest (compounded annually) on ${money(p)} for ${years} years?`,
      correct: money(ci),
      traps: [money(p * rate * years / 100), money(p * (1 + rate / 100) ** years), money(p * ((1 + rate / 200) ** (years * 2) - 1))],
      explanation: `Becoming ${multiple} times means SI = ${k - 1}P in ${n} years, so rate = ${k - 1}×100/${n} = ${rate}% p.a. CI = ${p}×(${fmt(1 + rate / 100)}^${years} − 1) = ${money(ci)}. The traps are the simple interest, the amount, and half-yearly compounding.`,
      hint: 'Extract the rate from the SI condition, then compound.',
      seconds: 110,
    }
  },
]

// ---------------------------------------------------------- work and pipes
const work: Frame[] = [
  r => {
    const x = pick(r, [25, 50, 60, 100, 150]), d = int(r, 4, 20)
    const [a, b] = two(r)
    const bAlone = d * (200 + x) / 100, aAlone = d * (200 + x) / (100 + x)
    const askA = r() < 0.5
    if (!nice(askA ? aAlone : bAlone)) return null
    return {
      topic: 'Time and work',
      question: `${a} is ${x}% more efficient than ${b}. Working together they finish a job in ${d} days. How many days would ${askA ? a : b} alone take?`,
      correct: `${fmt(askA ? aAlone : bAlone)} days`,
      traps: [`${fmt(askA ? bAlone : aAlone)} days`, `${fmt(2 * d)} days`, `${fmt(d * (100 + x) / 100)} days`],
      explanation: `Let ${b}'s efficiency be 100 units/day; ${a}'s is ${100 + x}. Total work = ${d}×${200 + x} = ${d * (200 + x)} units. ${askA ? `${a} alone: ${d * (200 + x)}/${100 + x} = ${fmt(aAlone)}` : `${b} alone: ${d * (200 + x)}/100 = ${fmt(bAlone)}`} days.`,
      hint: 'Convert “x% more efficient” into per-day units and compute total work.',
      seconds: 90,
    }
  },
  r => {
    const ra = int(r, 1, 6), rb = int(r, 1, 6), rc = int(r, 1, 6)
    if (new Set([ra, rb, rc]).size < 3) return null
    const W = [ra + rb, rb + rc, rc + ra, ra, rb, rc, ra + rb + rc].reduce((acc, v) => lcm(acc, v), 1)
    if (W > 240) return null
    const [a, b, c] = three(r)
    const ask = pick(r, ['all', 'a', 'c'] as const)
    const ans = ask === 'all' ? W / (ra + rb + rc) : ask === 'a' ? W / ra : W / rc
    return {
      topic: 'Time and work',
      question: `${a} and ${b} together can finish a task in ${W / (ra + rb)} days, ${b} and ${c} together in ${W / (rb + rc)} days, and ${c} and ${a} together in ${W / (rc + ra)} days. How many days would ${ask === 'all' ? 'all three working together' : ask === 'a' ? `${a} alone` : `${c} alone`} take?`,
      correct: `${fmt(ans)} days`,
      traps: ask === 'all'
        ? [`${fmt(2 * W / (ra + rb + rc))} days`, `${fmt((W / (ra + rb) + W / (rb + rc) + W / (rc + ra)) / 3)} days`, `${fmt(W / (ra + rb + rc) + 1)} days`]
        : [`${fmt(ask === 'a' ? W / rb : W / ra)} days`, `${fmt(ask === 'a' ? W / rc : W / rb)} days`, `${fmt(ans * 2)} days`],
      explanation: `Take total work = LCM = ${W} units. Pair rates: ${a}+${b} = ${ra + rb}, ${b}+${c} = ${rb + rc}, ${c}+${a} = ${rc + ra}. Summing counts each person twice: 2(${a}+${b}+${c}) = ${2 * (ra + rb + rc)}, so all three = ${ra + rb + rc} units/day. ${a} = ${ra}, ${b} = ${rb}, ${c} = ${rc} units/day. Required time = ${fmt(ans)} days.`,
      hint: 'Add the three pair-rates and halve to get the combined rate.',
      seconds: 130,
    }
  },
  r => {
    const a = pick(r, [6, 8, 10, 12, 15]), b = pick(r, [9, 12, 15, 18, 20].filter(v => v !== a))
    const W = lcm(a, b), ra = W / a, rb = W / b
    const [p1, p2] = two(r)
    // alternate days starting with the first worker
    let done = 0, t = 0
    while (done < W) {
      const rate = t % 2 === 0 ? ra : rb
      if (done + rate >= W) { t += (W - done) / rate; done = W; break }
      done += rate; t += 1
    }
    const together = W / (ra + rb)
    return {
      topic: 'Time and work',
      question: `${p1} can complete a work in ${a} days and ${p2} in ${b} days. They work on alternate days, ${p1} working on the first day. In how many days will the work be completed?`,
      correct: `${fmt(t)} days`,
      traps: [`${fmt(together)} days`, `${fmt(2 * together)} days`, `${fmt(Math.ceil(t) + 1)} days`],
      explanation: `Take work = ${W} units: ${p1} does ${ra}/day and ${p2} ${rb}/day, i.e. ${ra + rb} units per 2-day cycle. Simulating cycle by cycle, ${W} units are completed after ${fmt(t)} days (the final day may need only part of that worker's daily output). ${fmt(together)} is the time working together, and doubling it (${fmt(2 * together)}) ignores who works on the final day.`,
      hint: 'Work in 2-day cycles, then finish the remainder with whoever works next.',
      seconds: 130,
    }
  },
  r => {
    const m = pick(r, [2, 3, 4]), w = pick(r, [3, 4, 5, 6].filter(v => v !== m)), d = pick(r, [12, 15, 20, 24, 30, 36, 40, 60])
    // m men = w women → man rate w, woman rate m. Work = m*w*d
    const W = m * w * d
    const M = int(r, 1, 4), F = int(r, 1, 5)
    const days = W / (M * w + F * m)
    if (!nice(days)) return null
    return {
      topic: 'Time and work',
      question: `${m} men or ${w} women can finish a job in ${d} days. In how many days will ${M} men and ${F} women together finish it?`,
      correct: `${fmt(days)} days`,
      traps: [`${fmt(d * (m + w) / (M + F) / 2)} days`, `${fmt(W / (M * m + F * w))} days`, `${fmt(days + 2)} days`],
      explanation: `${m} men = ${w} women, so 1 man = ${fmt(w / m)} women. Let a woman do ${m} units/day and a man ${w}. Work = ${m}×${w}×${d} = ${W} units. ${M} men + ${F} women do ${M * w + F * m} units/day; time = ${W}/${M * w + F * m} = ${fmt(days)} days. Swapping the conversion gives ${fmt(W / (M * m + F * w))}.`,
      hint: 'Express everyone in the same unit (all women or all men) before combining.',
      seconds: 110,
    }
  },
  r => {
    const t = pick(r, [4, 6, 8, 10, 12]), e = pick(r, [1, 2, 3, 4]), u = pick(r, [6, 8, 12, 15, 20, 24])
    const leak = t * (t + e) / e
    const cap = int(r, 2, 9) * 120
    const net = 1 / t + 1 / u - 1 / leak
    if (!nice(leak) || net <= 0) return null
    const both = 1 / net
    if (!nice(both)) return null
    const ask = pick(r, ['rate', 'both'] as const)
    return {
      topic: 'Pipes and cisterns',
      question: `Pipe A alone fills a ${cap}-litre tank in ${t} hours, but because of a leak it actually takes ${t + e} hours. ${ask === 'rate' ? 'At how many litres per hour does the leak drain?' : `If pipe B, which alone fills the empty tank in ${u} hours, is also opened along with A (the leak continuing), how long will the tank take to fill?`}`,
      correct: ask === 'rate' ? `${fmt(cap / leak)} litres/hour` : `${fmt(both)} hours`,
      traps: ask === 'rate' ? [`${fmt(cap / e)} litres/hour`, `${fmt(cap / (t + e))} litres/hour`, `${fmt(cap / t)} litres/hour`] : [`${fmt(1 / (1 / t + 1 / u))} hours`, `${fmt(t * u / (t + u) + e)} hours`, `${fmt(1 / (1 / (t + e) + 1 / u - 1 / leak))} hours`],
      explanation: `Leak rate = 1/${t} − 1/${t + e} = ${e}/${t * (t + e)} tank/hour, so the leak alone empties the tank in ${fmt(leak)} hours${ask === 'rate' ? ` = ${cap}/${fmt(leak)} = ${fmt(cap / leak)} litres/hour` : ''}. ${ask === 'both' ? `With A, B and the leak: 1/${t} + 1/${u} − 1/${fmt(leak)} per hour, so time = ${fmt(both)} hours. Using A's leak-affected rate 1/${t + e} and also subtracting the leak counts the leak twice.` : ''}`,
      hint: 'Isolate the leak’s rate from the two filling times, then combine all pipes.',
      seconds: 130,
    }
  },
  r => {
    const a = pick(r, [10, 12, 15, 20]), b = pick(r, [12, 15, 20, 30].filter(v => v !== a)), c = pick(r, [15, 20, 24, 30, 40, 60])
    const W = [a, b, c].reduce((x, y) => lcm(x, y), 1)
    const ra = W / a, rb = W / b, rc = W / c
    if (ra + rb - rc <= 0) return null
    const k = int(r, 1, 4)
    const filled = k * (ra + rb - rc)
    if (filled >= W) return null
    const rest = (W - filled) / (ra + rb)
    const total = k + rest
    if (!nice(total)) return null
    return {
      topic: 'Pipes and cisterns',
      question: `Pipes A and B fill a tank in ${a} and ${b} hours respectively, and pipe C empties the full tank in ${c} hours. All three are opened together; after ${k} hour${k > 1 ? 's' : ''} C is closed. How long does it take in all to fill the tank?`,
      correct: `${fmt(total)} hours`,
      traps: [`${fmt(W / (ra + rb - rc))} hours`, `${fmt(W / (ra + rb))} hours`, `${fmt(rest)} hours`],
      explanation: `Tank = ${W} units; A = ${ra}, B = ${rb}, C = −${rc} units/hour. In ${k} hour(s) with all open: ${k}×${ra + rb - rc} = ${filled} units. Remaining ${W - filled} units at ${ra + rb}/hour take ${fmt(rest)} hours. Total = ${fmt(total)} hours (the trap ${fmt(rest)} forgets the first ${k} hour(s)).`,
      hint: 'Split the timeline at the moment a pipe is closed.',
      seconds: 130,
    }
  },
]

// ---------------------------------------------------------- speed, trains, boats
const kmh = (ms: number) => ms * 18 / 5
const motion: Frame[] = [
  r => {
    const v1 = pick(r, [15, 20, 25, 30]), v2 = pick(r, [5, 10, 15].filter(v => v < v1)) // m/s
    const t1 = pick(r, [8, 9, 10, 12, 15])
    const S = (v1 + v2) * t1, t2 = S / (v1 - v2)
    const L1 = Math.round(S * pick(r, [0.4, 0.5, 0.6]) / 10) * 10, L2 = S - L1
    if (!isInt(t2) || L2 <= 0) return null
    return {
      topic: 'Trains',
      question: `Two trains of lengths ${L1} m and ${L2} m cross each other completely in ${t1} seconds when moving in opposite directions and in ${t2} seconds when moving in the same direction. What is the speed of the faster train?`,
      correct: `${fmt(kmh(v1))} km/h`,
      traps: [`${fmt(kmh(v2))} km/h`, `${fmt(kmh(v1 + v2))} km/h`, `${fmt(v1)} km/h`],
      explanation: `Combined length ${S} m. Opposite: v₁ + v₂ = ${S}/${t1} = ${v1 + v2} m/s. Same direction: v₁ − v₂ = ${S}/${t2} = ${v1 - v2} m/s. So v₁ = ${v1} m/s = ${v1}×18/5 = ${fmt(kmh(v1))} km/h. Forgetting the m/s→km/h conversion gives ${v1}.`,
      hint: 'Relative speeds add in opposite directions and subtract in the same direction.',
      seconds: 130,
    }
  },
  r => {
    const v = pick(r, [10, 15, 20, 25]), t1 = pick(r, [8, 10, 12, 15, 18]), L = v * t1
    const P = pick(r, [100, 150, 200, 250, 300]), t2 = (L + P) / v
    const u = pick(r, [1, 2, 3, 5].filter(x => x < v))
    const tMan = L / (v - u)
    if (!isInt(t2) || !nice(tMan)) return null
    return {
      topic: 'Trains',
      question: `A train passes a signal post in ${t1} seconds and a ${P} m long platform in ${t2} seconds. How long will it take to pass a man walking at ${fmt(kmh(u))} km/h in the same direction as the train?`,
      correct: `${fmt(tMan)} seconds`,
      traps: [`${fmt(L / (v + u))} seconds`, `${fmt(t1)} seconds`, `${fmt((L + P) / (v - u))} seconds`],
      explanation: `Platform minus post: ${P} m extra takes ${t2 - t1} s, so speed = ${P}/${t2 - t1} = ${v} m/s and length = ${v}×${t1} = ${L} m. Man's speed = ${fmt(kmh(u))}×5/18 = ${u} m/s. Relative speed (same direction) = ${v - u} m/s; time = ${L}/${v - u} = ${fmt(tMan)} s.`,
      hint: 'Get the train’s speed and length from the two crossings, then use relative speed.',
      seconds: 140,
    }
  },
  r => {
    const [t1, t2] = pick(r, [[4, 9], [9, 16], [4, 25], [16, 25], [9, 4], [1, 4], [16, 9]] as const)
    const s1 = Math.sqrt(t2), s2 = Math.sqrt(t1) // speed ratio = sqrt(t2/t1)
    const k = pick(r, [6, 8, 10, 12, 15, 20])
    const meet = Math.sqrt(t1 * t2)
    const D = (s1 + s2) * k * meet
    const [a, b] = two(r)
    return {
      topic: 'Time and distance',
      question: `${a} and ${b} start at the same time from towns P and Q respectively, travelling towards each other. After meeting, ${a} takes ${t1} hours to reach Q and ${b} takes ${t2} hours to reach P. If ${a}'s speed is ${s1 * k} km/h, what is the distance PQ?`,
      correct: `${fmt(D)} km`,
      traps: [`${fmt(s1 * k * (t1 + t2))} km`, `${fmt((s1 * k + s1 * k * t1 / t2) * meet)} km`, `${fmt(D / 2)} km`, `${fmt(s1 * k * meet)} km`],
      explanation: `Speed ratio after meeting = √t₂ : √t₁ = √${t2} : √${t1} = ${s1}:${s2}, so ${b}'s speed = ${s2 * k} km/h. Time to meet = √(t₁t₂) = √${t1 * t2} = ${meet} h. PQ = (${s1 * k} + ${s2 * k}) × ${meet} = ${fmt(D)} km. Taking the speed ratio as t₂:t₁ (without square roots) gives a listed trap.`,
      hint: 'Two results chain here: speeds ∝ √(other’s remaining time) and meeting time = √(t₁t₂).',
      seconds: 140,
    }
  },
  r => {
    const v1 = pick(r, [30, 40, 45, 48, 50]), v2 = pick(r, [40, 50, 60, 72, 75].filter(v => v > v1))
    const late = pick(r, [5, 10, 12, 15, 20]), early = pick(r, [5, 6, 10, 15])
    const D = v1 * v2 * (late + early) / 60 / (v2 - v1)
    if (!nice(D)) return null
    return {
      topic: 'Time and distance',
      question: `Travelling at ${v1} km/h, an inspector reaches the court ${late} minutes late; travelling at ${v2} km/h, he reaches ${early} minutes early. What is the distance to the court?`,
      correct: `${fmt(D)} km`,
      traps: [`${fmt(v1 * v2 * Math.abs(late - early) / 60 / (v2 - v1))} km`, `${fmt(v1 * v2 * (late + early) / (v2 - v1))} km`, `${fmt(D * 2)} km`],
      explanation: `The two journey times differ by ${late}+${early} = ${late + early} minutes = ${frac(late + early, 60)} h. D/${v1} − D/${v2} = ${frac(late + early, 60)} ⇒ D = ${v1}×${v2}×${frac(late + early, 60)}/(${v2}−${v1}) = ${fmt(D)} km. Subtracting the minutes instead of adding them, or not converting minutes to hours, gives the traps.`,
      hint: 'Late and early are on opposite sides of the scheduled time, so the time gap is their sum.',
      seconds: 110,
    }
  },
  r => {
    const up = pick(r, [4, 5, 6, 8, 9, 10]), down = pick(r, [8, 10, 12, 15, 16, 18].filter(v => v > up + 1))
    const D1 = up * int(r, 1, 4), D2 = down * int(r, 1, 4)
    const D3 = up * int(r, 1, 4), D4 = down * int(r, 1, 4)
    const T1 = D1 / up + D2 / down, T2 = D3 / up + D4 / down
    // check equations independent
    if (D1 * D4 === D2 * D3) return null
    const ask = pick(r, ['stream', 'still'] as const)
    const ans = ask === 'stream' ? (down - up) / 2 : (down + up) / 2
    if (!nice(ans)) return null
    return {
      topic: 'Boats and streams',
      question: `A boat goes ${D1} km upstream and ${D2} km downstream in ${fmt(T1)} hours; it goes ${D3} km upstream and ${D4} km downstream in ${fmt(T2)} hours. What is the speed of the ${ask === 'stream' ? 'stream' : 'boat in still water'}?`,
      correct: `${fmt(ans)} km/h`,
      traps: [`${fmt(ask === 'stream' ? (down + up) / 2 : (down - up) / 2)} km/h`, `${fmt(ask === 'stream' ? down - up : down + up)} km/h`, `${fmt(ask === 'stream' ? up / 2 : down)} km/h`],
      explanation: `Let 1/u and 1/d be the hours per km upstream and downstream: ${D1}/u + ${D2}/d = ${fmt(T1)} and ${D3}/u + ${D4}/d = ${fmt(T2)}. Solving gives u = ${up} km/h and d = ${down} km/h. Still water = (d+u)/2 = ${fmt((down + up) / 2)}; stream = (d−u)/2 = ${fmt((down - up) / 2)}.`,
      hint: 'Treat 1/upstream and 1/downstream speeds as the unknowns of two linear equations.',
      seconds: 150,
    }
  },
  r => {
    const L = pick(r, [300, 400, 500, 600, 800, 1200]), v1 = pick(r, [4, 5, 6, 8, 10]), v2 = pick(r, [2, 3, 4, 5, 6].filter(v => v < v1))
    const same = r() < 0.5
    const first = L / (same ? v1 - v2 : v1 + v2)
    const atStart = lcm(L / v1 * 1000, L / v2 * 1000) / 1000
    if (!nice(first) || !nice(L / v1) || !nice(L / v2)) return null
    const ask = pick(r, ['first', 'start'] as const)
    return {
      topic: 'Time and distance',
      question: `Two athletes start together from the same point on a circular track of ${L} m, running ${same ? 'in the same direction' : 'in opposite directions'} at ${v1} m/s and ${v2} m/s. After how many seconds will they first meet ${ask === 'first' ? 'anywhere on the track' : 'again at the starting point'}?`,
      correct: `${fmt(ask === 'first' ? first : atStart)} seconds`,
      traps: ask === 'first'
        ? [`${fmt(L / (same ? v1 + v2 : v1 - v2))} seconds`, `${fmt(atStart)} seconds`, `${fmt(L / v1)} seconds`]
        : [`${fmt(first)} seconds`, `${fmt(L / v1 * (L / v2))} seconds`, `${fmt(L / v2)} seconds`],
      explanation: ask === 'first'
        ? `They close the gap at the relative speed ${same ? `${v1}−${v2}` : `${v1}+${v2}`} = ${same ? v1 - v2 : v1 + v2} m/s and first meet after covering one lap relative to each other: ${L}/${same ? v1 - v2 : v1 + v2} = ${fmt(first)} s.`
        : `Lap times are ${fmt(L / v1)} s and ${fmt(L / v2)} s. They are both at the start together after LCM(${fmt(L / v1)}, ${fmt(L / v2)}) = ${fmt(atStart)} s; the direction does not matter for this question.`,
      hint: 'Meeting anywhere uses relative speed; meeting at the start uses the LCM of lap times.',
      seconds: 110,
    }
  },
  r => {
    const v1 = pick(r, [30, 40, 60]), v2 = pick(r, [20, 40, 45, 60, 90].filter(v => v !== v1))
    const avg = 2 * v1 * v2 / (v1 + v2)
    const T = pick(r, [5, 6, 7.5, 8, 10, 12]), halt = pick(r, [0.5, 1, 1.5, 2])
    const D = avg * T / 2
    if (!nice(D) || !nice(avg)) return null
    const ask = pick(r, ['dist', 'avg'] as const)
    const overall = 2 * D / (T + halt)
    if (ask === 'avg' && !nice(overall)) return null
    return {
      topic: 'Time and distance',
      question: ask === 'dist'
        ? `A patrol van goes from the station to a village at ${v1} km/h, halts there for ${fmt(halt)} hour(s), and returns along the same road at ${v2} km/h. If it is back ${fmt(T + halt)} hours after leaving, how far is the village?`
        : `A patrol van goes ${fmt(D)} km from the station to a village at ${v1} km/h, halts there for ${fmt(halt)} hour(s), and returns along the same road at ${v2} km/h. What is its average speed for the whole outing, including the halt?`,
      correct: ask === 'dist' ? `${fmt(D)} km` : `${fmt(overall)} km/h`,
      traps: ask === 'dist' ? [`${fmt(avg * (T + halt) / 2)} km`, `${fmt((v1 + v2) / 2 * T / 2)} km`, `${fmt(avg * T)} km`] : [`${fmt(avg)} km/h`, `${fmt((v1 + v2) / 2)} km/h`, `${fmt(2 * D / (T + 2 * halt))} km/h`],
      explanation: `Driving time = ${ask === 'dist' ? `${fmt(T + halt)} − ${fmt(halt)} = ${fmt(T)}` : `${fmt(D)}/${v1} + ${fmt(D)}/${v2} = ${fmt(T)}`} h. Over equal distances the driving average is 2v₁v₂/(v₁+v₂) = ${fmt(avg)} km/h (not ${fmt((v1 + v2) / 2)}). ${ask === 'dist' ? `Round trip = ${fmt(avg)}×${fmt(T)} = ${fmt(avg * T)} km, so one way = ${fmt(D)} km. Forgetting to remove the halt gives ${fmt(avg * (T + halt) / 2)} km.` : `Including the halt, average = ${fmt(2 * D)}/(${fmt(T)} + ${fmt(halt)}) = ${fmt(overall)} km/h.`}`,
      hint: 'Separate driving time from halt time; equal distances use the harmonic mean.',
      seconds: 130,
    }
  },
]

// ---------------------------------------------------------- mixtures
const mixtures: Frame[] = [
  r => {
    const V = pick(r, [20, 40, 50, 60, 80, 100]), x = pick(r, [4, 5, 8, 10, 20].filter(v => v < V / 2)), n = pick(r, [2, 3])
    const milk = V * (1 - x / V) ** n
    if (!nice(milk, 4)) return null
    const ask = pick(r, ['milk', 'water', 'ratio'] as const)
    const water = V - milk
    const ratio = () => { const a = Math.round(milk * 10000), b = Math.round(water * 10000), g = gcd(a, b); return `${a / g}:${b / g}` }
    const correct = ask === 'milk' ? `${fmt(milk)} litres` : ask === 'water' ? `${fmt(water)} litres` : ratio()
    const naiveMilk = V - n * x
    return {
      topic: 'Mixtures and alligation',
      question: `A container holds ${V} litres of pure milk. ${x} litres are drawn out and replaced with water; this operation is performed ${n === 2 ? 'twice' : 'three times'} in all. ${ask === 'milk' ? 'How much milk remains?' : ask === 'water' ? 'How much water does the container now hold?' : 'What is the final ratio of milk to water?'}`,
      correct,
      traps: ask === 'milk' ? [`${fmt(naiveMilk)} litres`, `${fmt(V * (1 - x / V) ** (n + 1))} litres`, `${fmt(V * (1 - x / V) ** (n - 1))} litres`]
        : ask === 'water' ? [`${fmt(n * x)} litres`, `${fmt(V - V * (1 - x / V) ** (n + 1))} litres`, `${fmt(milk)} litres`]
          : [`${naiveMilk / gcd(naiveMilk, n * x)}:${n * x / gcd(naiveMilk, n * x)}`, `${(() => { const m2 = Math.round(V * (1 - x / V) ** (n - 1) * 10000), w2 = V * 10000 - m2, g = gcd(m2, w2); return `${m2 / g}:${w2 / g}` })()}`, `${(() => { const a = Math.round(water * 10000), b = Math.round(milk * 10000), g = gcd(a, b); return `${a / g}:${b / g}` })()}`],
      explanation: `Each replacement keeps a fraction (1 − ${x}/${V}) = ${fmt(1 - x / V)} of the milk. After ${n} operations milk = ${V}×${fmt(1 - x / V)}^${n} = ${fmt(milk)} L and water = ${fmt(water)} L. Subtracting ${x} L each time (${fmt(naiveMilk)} L) ignores that later draws also remove water.`,
      hint: 'Repeated replacement: final = initial × (1 − removed/total)ⁿ.',
      seconds: 120,
    }
  },
  r => {
    const a = int(r, 2, 7), b = int(r, 1, 5), c = int(r, 1, 5), d = int(r, 2, 7)
    if (gcd(a, b) !== 1 || gcd(c, d) !== 1 || a * d <= b * c) return null
    const k = int(r, 2, 8), M = (a + b) * k
    // add water w: a k : (b k + w) = c : d → w = (a k d / c) - b k
    const w = a * k * d / c - b * k
    if (!nice(w) || w <= 0) return null
    return {
      topic: 'Mixtures and alligation',
      question: `${M} litres of a mixture contain milk and water in the ratio ${a}:${b}. How much water must be added to make the ratio ${c}:${d}?`,
      correct: `${fmt(w)} litres`,
      traps: [`${fmt(M * d / (c + d) - b * k)} litres`, `${fmt(Math.abs(d - b) * k)} litres`, `${fmt(w + k)} litres`],
      explanation: `Milk = ${M}×${a}/${a + b} = ${a * k} L stays fixed. For milk:water = ${c}:${d}, water must be ${a * k}×${d}/${c} = ${fmt(a * k * d / c)} L. It is ${b * k} L now, so add ${fmt(w)} L. Keeping total volume fixed instead of milk is the common error.`,
      hint: 'Anchor on the component that does not change.',
      seconds: 100,
    }
  },
  r => {
    const low = pick(r, [120, 150, 180, 200, 240]), high = pick(r, [260, 300, 320, 360, 400].filter(v => v > low + 40)), g = pick(r, [10, 20, 25])
    const mean = pick(r, Array.from({ length: (high - low) / 10 - 1 }, (_, i) => low + 10 * (i + 1)))
    const sell = mean * (100 + g) / 100
    if (!isInt(sell)) return null
    const x = high - mean, y = mean - low, h = gcd(x, y)
    return {
      topic: 'Mixtures and alligation',
      question: `Two varieties of tea costing ₹${low}/kg and ₹${high}/kg are blended and the blend is sold at ₹${sell}/kg to earn a ${g}% profit. In what ratio were the cheaper and dearer varieties mixed?`,
      correct: `${x / h}:${y / h}`,
      traps: [`${y / h}:${x / h}`, (() => { const p = high - sell, q = sell - low; if (p <= 0) return `${x / h + 1}:${y / h}`; const z = gcd(p, q); return `${p / z}:${q / z}` })(), `${x / h}:${y / h + 1}`],
      explanation: `Cost price of the blend = ${sell}×100/${100 + g} = ₹${mean}/kg. By alligation, cheaper:dearer = (${high}−${mean}):(${mean}−${low}) = ${x}:${y} = ${x / h}:${y / h}. Using the selling price ₹${sell} as the mean is the trap.`,
      hint: 'Convert the selling price to the blend’s cost price before applying alligation.',
      seconds: 110,
    }
  },
  r => {
    const [a, b] = pick(r, [[3, 1], [2, 1], [5, 3], [4, 1], [3, 2]] as const), [c, d] = pick(r, [[1, 1], [1, 2], [2, 3], [1, 3], [3, 5]] as const)
    const m = int(r, 1, 4), n = int(r, 1, 4)
    // mix vessel1 (a:b) with vessel2 (c:d) in volumes m:n
    const milk = m * a / (a + b) + n * c / (c + d), water = m * b / (a + b) + n * d / (c + d)
    const L = (a + b) * (c + d) * 60
    const mi = Math.round(milk * L), wa = Math.round(water * L), g = gcd(mi, wa)
    if (m === n) return null
    return {
      topic: 'Mixtures and alligation',
      question: `Vessel P contains milk and water in the ratio ${a}:${b}; vessel Q contains them in the ratio ${c}:${d}. If P and Q are mixed in the volume ratio ${m}:${n}, what is the ratio of milk to water in the result?`,
      correct: `${mi / g}:${wa / g}`,
      traps: [`${(m * a + n * c) / gcd(m * a + n * c, m * b + n * d)}:${(m * b + n * d) / gcd(m * a + n * c, m * b + n * d)}`, `${(a + c) / gcd(a + c, b + d)}:${(b + d) / gcd(a + c, b + d)}`, `${wa / g}:${mi / g}`],
      explanation: `Milk = ${m}×${a}/${a + b} + ${n}×${c}/${c + d}; water = ${m}×${b}/${a + b} + ${n}×${d}/${c + d}. This simplifies to ${mi / g}:${wa / g}. Adding the ratio terms directly ignores the different vessel totals.`,
      hint: 'Convert each ratio to fractions of its vessel before mixing.',
      seconds: 120,
    }
  },
]

// ---------------------------------------------------------- counting & probability (brute force)
const permsOf = (letters: string[]): string[] => {
  const out = new Set<string>()
  const used = new Array(letters.length).fill(false)
  const cur: string[] = []
  const go = () => {
    if (cur.length === letters.length) { out.add(cur.join('')); return }
    const seen = new Set<string>()
    for (let i = 0; i < letters.length; i++) {
      if (used[i] || seen.has(letters[i])) continue
      seen.add(letters[i]); used[i] = true; cur.push(letters[i]); go(); cur.pop(); used[i] = false
    }
  }
  go()
  return [...out]
}
const combos = <T>(items: T[], k: number): T[][] => {
  const out: T[][] = []
  const go = (start: number, cur: T[]) => {
    if (cur.length === k) { out.push([...cur]); return }
    for (let i = start; i < items.length; i++) { cur.push(items[i]); go(i + 1, cur); cur.pop() }
  }
  go(0, [])
  return out
}
const VOWELS = new Set('AEIOU'.split(''))
const counting: Frame[] = [
  r => {
    const word = pick(r, ['BALLOON', 'SUCCESS', 'PROPOSAL', 'OFFICER', 'GUNTUR', 'DIRECTOR', 'ARRANGE', 'TELUGU', 'KURNOOL', 'NELLORE', 'CHITTOOR', 'POLICE', 'CONSTABLE'])
    if (word.length > 8) return null
    const all = permsOf(word.split(''))
    const cond = pick(r, ['together', 'apart', 'startend', 'order'] as const)
    const test = (s: string) => {
      if (cond === 'together') { const idx = [...s].map((ch, i) => VOWELS.has(ch) ? i : -1).filter(i => i >= 0); return idx[idx.length - 1] - idx[0] === idx.length - 1 }
      if (cond === 'apart') { for (let i = 1; i < s.length; i++) if (VOWELS.has(s[i]) && VOWELS.has(s[i - 1])) return false; return true }
      if (cond === 'startend') return !VOWELS.has(s[0]) && VOWELS.has(s[s.length - 1])
      const vs = [...s].filter(ch => VOWELS.has(ch)).join(''), sorted = [...vs].sort().join('')
      return vs === sorted
    }
    const count = all.filter(test).length
    const vowelCount = [...word].filter(ch => VOWELS.has(ch)).length
    if (vowelCount < 2 || count === 0 || count === all.length) return null
    const phrase = cond === 'together' ? 'all the vowels come together' : cond === 'apart' ? 'no two vowels are adjacent' : 'the word begins with a consonant and ends with a vowel'
    const fullPhrase = cond === 'order' ? 'the vowels appear in alphabetical order (left to right)' : phrase
    const fact = (n: number): number => (n <= 1 ? 1 : n * fact(n - 1))
    return {
      topic: 'Permutation and combination',
      question: `In how many distinct ways can the letters of the word ${word} be arranged so that ${fullPhrase}?`,
      correct: String(count),
      traps: [String(all.length), String(count * 2), String(cond === 'order' ? Math.round(all.length / vowelCount) : count + fact(vowelCount))],
      explanation: `${word} has ${word.length} letters with repeats ${[...new Set(word)].filter(ch => word.split(ch).length > 2).map(ch => `${ch}×${word.split(ch).length - 1}`).join(', ') || 'none'}; total distinct arrangements = ${all.length}. Counting only those in which ${fullPhrase} gives ${count}. ${cond === 'together' ? 'Treat the vowels as one block, arrange the block with the consonants, then arrange inside the block, dividing by repeated letters at each stage.' : cond === 'apart' ? 'Arrange consonants first, then place the vowels in distinct gaps, dividing by repeats.' : cond === 'order' ? 'Of the vowel orderings, only the alphabetical one is allowed; account for repeated vowels.' : 'Fix the two ends from the allowed letters, then arrange the middle, dividing by repeats.'}`,
      hint: 'Handle the restriction first, then divide by factorials of repeated letters.',
      seconds: 150,
    }
  },
  r => {
    const men = int(r, 4, 7), women = int(r, 3, 6), k = pick(r, [3, 4, 5]), atLeast = int(r, 1, 2)
    const people = [...Array.from({ length: men }, (_, i) => `M${i}`), ...Array.from({ length: women }, (_, i) => `W${i}`)]
    const conflict = r() < 0.5
    const ok = (team: string[]) => team.filter(p => p.startsWith('W')).length >= atLeast && (!conflict || !(team.includes('M0') && team.includes('W0')))
    const all = combos(people, k)
    const count = all.filter(ok).length
    const noConflict = all.filter(t => t.filter(p => p.startsWith('W')).length >= atLeast).length
    return {
      topic: 'Permutation and combination',
      question: `A team of ${k} is to be chosen from ${men} men and ${women} women so that it has at least ${atLeast} wom${atLeast > 1 ? 'en' : 'an'}${conflict ? '; moreover, a particular man and a particular woman refuse to serve together' : ''}. In how many ways can the team be chosen?`,
      correct: String(count),
      traps: conflict ? [String(noConflict), String(all.length - (all.length - noConflict)), String(count + 1 + Math.floor(count / 10))] : [String(all.length), String(all.length - count + 1), String(count + women)],
      explanation: `Total teams of ${k} from ${men + women} = ${all.length}. Those with at least ${atLeast} wom${atLeast > 1 ? 'en' : 'an'}: ${noConflict} (sum over the allowed numbers of women, or total minus teams with fewer).${conflict ? ` Remove teams containing both the specified man and woman: ${noConflict - count} such teams, leaving ${count}.` : ''}`,
      hint: '“At least” is often fastest as total minus the forbidden cases.',
      seconds: 140,
    }
  },
  r => {
    const n = int(r, 6, 8)
    const variant = pick(r, ['pairNotC', 'apartBothSidesC', 'oppositeOrNot'] as const)
    if (variant === 'oppositeOrNot' && n % 2) return null
    // Fix person 0 (A) at seat 0 to remove rotations; enumerate the rest.
    const rest = Array.from({ length: n - 1 }, (_, i) => i + 1)
    const perms: number[][] = []
    const go = (cur: number[], left: number[]) => { if (!left.length) { perms.push(cur); return } left.forEach((x, i) => go([...cur, x], [...left.slice(0, i), ...left.slice(i + 1)])) }
    go([0], rest)
    const adj = (p: number[], x: number, y: number) => { const i = p.indexOf(x), j = p.indexOf(y); return (i - j + n) % n === 1 || (j - i + n) % n === 1 }
    const test = (p: number[]) => variant === 'pairNotC' ? adj(p, 0, 1) && !adj(p, 2, 0) && !adj(p, 2, 1)
      : variant === 'apartBothSidesC' ? !adj(p, 0, 1) && adj(p, 2, 0) && adj(p, 2, 1)
        : !adj(p, 0, 1) && (p.indexOf(0) - p.indexOf(1) + n) % n !== n / 2
    const count = perms.filter(test).length
    const fact = (x: number): number => (x <= 1 ? 1 : x * fact(x - 1))
    const label = variant === 'pairNotC' ? 'officers A and B must sit together but officer C must not sit next to either of them'
      : variant === 'apartBothSidesC' ? 'A and B must not sit next to each other, yet C must sit between them with both as immediate neighbours'
        : 'A and B must neither sit next to each other nor directly opposite each other'
    const pairTogether = 2 * fact(n - 2)
    return {
      topic: 'Permutation and combination',
      question: `${n} officers, including A, B and C, are to be seated around a circular table (rotations of one seating are the same). In how many ways can they be seated if ${label}?`,
      correct: String(count),
      traps: [String(pairTogether), String(fact(n - 1) - pairTogether), String(count * n), String(count * 2)],
      explanation: `Fix A's seat to remove rotations; the other ${n - 1} can be arranged in (${n}−1)! = ${fact(n - 1)} ways. ${variant === 'pairNotC' ? `A–B together: 2×(${n}−2)! = ${pairTogether}. From these remove seatings where C is beside the AB block on either side: 2×2×(${n}−3)! = ${4 * fact(n - 3)}. Result ${count}.` : variant === 'apartBothSidesC' ? `Glue A–C–B (or B–C–A) into one block: 2×(${n}−3)! = ${count}. Since C is between them, A and B are automatically not adjacent.` : `A–B adjacent: ${pairTogether}; directly opposite (fix A, B takes the one opposite seat): (${n}−2)! = ${fact(n - 2)}. Result ${fact(n - 1)} − ${pairTogether} − ${fact(n - 2)} = ${count}.`} Using n! instead of (n−1)! multiplies by ${n}.`,
      hint: 'Fix one person to kill rotations, count the block, then subtract the forbidden neighbourhoods.',
      seconds: 150,
    }
  },
  r => {
    const digits = shuffle(r, [0, 1, 2, 3, 4, 5, 6, 7, 8, 9]).slice(0, int(r, 5, 6)).sort((a, b) => a - b)
    if (!digits.includes(0)) digits[0] = 0
    const len = 4
    const rule = pick(r, ['div5', 'even', 'gt', 'div4'] as const)
    const threshold = 3000 + int(r, 0, 4) * 1000
    const nums: number[] = []
    const go = (cur: number[]) => {
      if (cur.length === len) { if (cur[0] !== 0) nums.push(Number(cur.join(''))); return }
      for (const dgt of digits) if (!cur.includes(dgt)) go([...cur, dgt])
    }
    go([])
    const test = (x: number) => rule === 'div5' ? x % 5 === 0 : rule === 'even' ? x % 2 === 0 : rule === 'gt' ? x > threshold : x % 4 === 0
    const count = nums.filter(test).length
    if (count === 0) return null
    const label = rule === 'div5' ? 'divisible by 5' : rule === 'even' ? 'even' : rule === 'gt' ? `greater than ${threshold}` : 'divisible by 4'
    const allowZeroLead = (() => { let c = 0; const g2 = (cur: number[]) => { if (cur.length === len) { const x = Number(cur.join('')); if (test(x)) c++; return } for (const dg of digits) if (!cur.includes(dg)) g2([...cur, dg]) }; g2([]); return c })()
    return {
      topic: 'Permutation and combination',
      question: `How many 4-digit numbers ${label} can be formed using the digits ${digits.join(', ')} if no digit is repeated?`,
      correct: String(count),
      traps: [String(allowZeroLead === count ? count + digits.length : allowZeroLead), String(nums.length), String(Math.round(nums.length / (rule === 'div5' ? 5 : rule === 'even' ? 2 : rule === 'div4' ? 4 : 2)))],
      explanation: `Of the ${nums.length} valid 4-digit numbers (leading digit not 0), exactly ${count} are ${label}. Split by the restricted position first (${rule === 'gt' ? 'the thousands digit' : 'the units digit'}), handling 0 separately because it cannot lead.${allowZeroLead !== count ? ` Ignoring the leading-zero restriction gives ${allowZeroLead}.` : ''}`,
      hint: 'Fill the restricted place first, and treat the digit 0 as a separate case.',
      seconds: 140,
    }
  },
]
const probability: Frame[] = [
  r => {
    const red = int(r, 2, 6), blue = int(r, 2, 6), green = int(r, 1, 5)
    const balls = [...Array(red).fill('R'), ...Array(blue).fill('B'), ...Array(green).fill('G')].map((c, i) => `${c}${i}`)
    const k = pick(r, [2, 3])
    const all = combos(balls, k)
    const ev = pick(r, ['atleastRed', 'allSame', 'allDiff', 'exactlyOneBlue'] as const)
    if (ev === 'allDiff' && k !== 3) return null
    const test = (c: string[]) => {
      const cs = c.map(x => x[0])
      if (ev === 'atleastRed') return cs.includes('R')
      if (ev === 'allSame') return new Set(cs).size === 1
      if (ev === 'allDiff') return new Set(cs).size === 3
      return cs.filter(x => x === 'B').length === 1
    }
    const fav = all.filter(test).length
    if (fav === 0) return null
    const label = ev === 'atleastRed' ? 'at least one is red' : ev === 'allSame' ? 'all are of the same colour' : ev === 'allDiff' ? 'all three are of different colours' : 'exactly one is blue'
    const withRep = (() => { let f = 0, t = 0; const cols = ['R', 'B', 'G'], w: Record<string, number> = { R: red, B: blue, G: green }; const go = (cur: string[], wt: number) => { if (cur.length === k) { t += wt; if (test(cur)) f += wt; return } for (const c of cols) go([...cur, c], wt * w[c]) }; go([], 1); return frac(f, t) })()
    return {
      topic: 'Probability',
      question: `A box has ${red} red, ${blue} blue and ${green} green balls. ${k} balls are drawn together at random. What is the probability that ${label}?`,
      correct: frac(fav, all.length),
      traps: [withRep, frac(Math.max(1, fav - 1), all.length), frac(all.length - fav || 1, all.length)],
      explanation: `Total selections = C(${red + blue + green},${k}) = ${all.length}. Favourable selections in which ${label} = ${fav}. Probability = ${fav}/${all.length} = ${frac(fav, all.length)}. The trap ${withRep} treats the draws as with replacement.`,
      hint: 'Drawing together means without replacement: count combinations.',
      seconds: 130,
    }
  },
  r => {
    const dice = pick(r, [2, 3])
    const ev = pick(r, ['sumPrime', 'sumAtLeast', 'distinct', 'maxIs'] as const)
    const target = dice === 2 ? int(r, 8, 10) : int(r, 12, 14)
    const maxVal = int(r, 4, 6)
    const outcomes: number[][] = []
    const go = (cur: number[]) => { if (cur.length === dice) { outcomes.push(cur); return } for (let f = 1; f <= 6; f++) go([...cur, f]) }
    go([])
    const isPrime = (x: number) => x > 1 && [...Array(x).keys()].slice(2).every(d => x % d !== 0)
    const test = (o: number[]) => {
      const s = o.reduce((a, b) => a + b, 0)
      if (ev === 'sumPrime') return isPrime(s)
      if (ev === 'sumAtLeast') return s >= target
      if (ev === 'distinct') return new Set(o).size === dice
      return Math.max(...o) === maxVal
    }
    const fav = outcomes.filter(test).length
    const label = ev === 'sumPrime' ? 'the sum of the numbers is prime' : ev === 'sumAtLeast' ? `the sum is at least ${target}` : ev === 'distinct' ? 'all the numbers shown are different' : `the largest number shown is exactly ${maxVal}`
    const unordered = (() => { const set = new Set(outcomes.map(o => [...o].sort().join(''))); const favSet = new Set(outcomes.filter(test).map(o => [...o].sort().join(''))); return frac(favSet.size, set.size) })()
    return {
      topic: 'Probability',
      question: `${dice === 2 ? 'Two' : 'Three'} fair dice are thrown together. What is the probability that ${label}?`,
      correct: frac(fav, outcomes.length),
      traps: [unordered, frac(outcomes.length - fav, outcomes.length), frac(fav + (dice === 2 ? 1 : 6), outcomes.length)],
      explanation: `There are 6^${dice} = ${outcomes.length} equally likely ordered outcomes, of which ${fav} satisfy “${label}”. Probability = ${frac(fav, outcomes.length)}. Counting unordered outcomes (${unordered}) is wrong because they are not equally likely.${ev === 'maxIs' ? ` Shortcut: ${maxVal}^${dice} − ${maxVal - 1}^${dice} = ${fav}.` : ''}`,
      hint: 'Count ordered outcomes; use the complement when “at least” or “even” makes it easier.',
      seconds: 120,
    }
  },
  r => {
    const pa = pick(r, [[1, 2], [1, 3], [2, 3], [3, 4], [2, 5], [3, 5]] as const), pb = pick(r, [[1, 4], [1, 2], [2, 3], [1, 3], [3, 5], [4, 5]] as const)
    const [a, b] = two(r)
    const A = pa[0] / pa[1], B = pb[0] / pb[1]
    const ev = pick(r, ['atleast', 'exactly', 'onlyA'] as const)
    const den = pa[1] * pb[1]
    const num = ev === 'atleast' ? den - (pa[1] - pa[0]) * (pb[1] - pb[0]) : ev === 'exactly' ? pa[0] * (pb[1] - pb[0]) + (pa[1] - pa[0]) * pb[0] : pa[0] * (pb[1] - pb[0])
    if (A === B) return null
    const label = ev === 'atleast' ? 'at least one of them solves it' : ev === 'exactly' ? 'exactly one of them solves it' : `${a} solves it but ${b} does not`
    return {
      topic: 'Probability',
      question: `The probabilities that ${a} and ${b} independently solve a problem are ${pa[0]}/${pa[1]} and ${pb[0]}/${pb[1]}. What is the probability that ${label}?`,
      correct: frac(num, den),
      traps: [frac(pa[0] * pb[1] + pb[0] * pa[1], den) === frac(num, den) ? frac(pa[0] * pb[0], den) : frac(Math.min(pa[0] * pb[1] + pb[0] * pa[1], den * 2), den), frac(pa[0] * pb[0], den) === frac(num, den) ? frac((pa[1] - pa[0]) * (pb[1] - pb[0]), den) : frac(pa[0] * pb[0], den), frac((pa[1] - pa[0]) * (pb[1] - pb[0]), den) === frac(num, den) ? frac(den - num, den) : frac((pa[1] - pa[0]) * (pb[1] - pb[0]), den)],
      explanation: `P(${a}) = ${pa[0]}/${pa[1]}, P(${b}) = ${pb[0]}/${pb[1]}; failures ${pa[1] - pa[0]}/${pa[1]} and ${pb[1] - pb[0]}/${pb[1]}. ${ev === 'atleast' ? `P(at least one) = 1 − P(both fail) = 1 − ${(pa[1] - pa[0]) * (pb[1] - pb[0])}/${den}` : ev === 'exactly' ? `P(exactly one) = P(A)P(B′) + P(A′)P(B) = ${pa[0] * (pb[1] - pb[0])}/${den} + ${(pa[1] - pa[0]) * pb[0]}/${den}` : `P(A and not B) = ${pa[0]}/${pa[1]} × ${pb[1] - pb[0]}/${pb[1]}`} = ${frac(num, den)}. Simply adding the two probabilities double-counts the case where both succeed.`,
      hint: 'For independent events multiply; for “at least one” use 1 − P(none).',
      seconds: 100,
    }
  },
]

// ---------------------------------------------------------- mensuration
const PI = 22 / 7
const mensuration: Frame[] = [
  r => {
    const R = pick(r, [6, 7, 9, 12, 14, 21]), rc = pick(r, [1, 2, 3, 3.5, 7].filter(v => v < R)), h = pick(r, [2, 3, 4, 6, 7, 14])
    const n = (4 / 3 * R ** 3) / (1 / 3 * rc ** 2 * h)
    if (!isInt(n)) return null
    const shape = pick(r, ['cones', 'cylinders'] as const)
    const count = shape === 'cones' ? n : n / 3
    if (!isInt(count)) return null
    return {
      topic: 'Mensuration',
      question: `A solid metal sphere of radius ${R} cm is melted and recast into solid ${shape} of base radius ${fmt(rc)} cm and height ${h} cm, with no wastage. How many ${shape} are obtained?`,
      correct: String(count),
      traps: [fmt(shape === 'cones' ? count / 3 : count * 3), String(Math.round((R / rc) ** 2 * (R / h))), String(Math.round(4 * R ** 2 / (rc * h * 2)))],
      explanation: `Volume of sphere = (4/3)π(${R})³. Each ${shape === 'cones' ? 'cone = (1/3)πr²h' : 'cylinder = πr²h'} = ${shape === 'cones' ? '(1/3)' : ''}π(${fmt(rc)})²(${h}). Number = (4/3×${R ** 3}) ÷ (${shape === 'cones' ? '1/3×' : ''}${fmt(rc ** 2)}×${h}) = ${count}. π cancels, so no approximation is needed.`,
      hint: 'Equate volumes; π cancels out.',
      seconds: 110,
    }
  },
  r => {
    const L = pick(r, [40, 50, 60, 80, 100]), B = pick(r, [20, 30, 40, 45, 50].filter(v => v < L)), w = pick(r, [1, 1.5, 2, 2.5, 3, 5])
    const inside = r() < 0.5
    const area = inside ? L * B - (L - 2 * w) * (B - 2 * w) : (L + 2 * w) * (B + 2 * w) - L * B
    const rate = pick(r, [12, 15, 20, 25, 40, 50])
    const cost = area * rate
    if (!nice(cost)) return null
    return {
      topic: 'Mensuration',
      question: `A rectangular parade ground measures ${L} m × ${B} m. A path ${fmt(w)} m wide runs all round it ${inside ? 'on the inside' : 'on the outside'}. What will it cost to pave the path at ₹${rate} per m²?`,
      correct: money(cost),
      traps: [money((inside ? (L * B - (L - w) * (B - w)) : ((L + w) * (B + w) - L * B)) * rate), money(2 * (L + B) * w * rate), money((inside ? ((L + 2 * w) * (B + 2 * w) - L * B) : (L * B - (L - 2 * w) * (B - 2 * w))) * rate)],
      explanation: `${inside ? `Inner rectangle = (${L}−${2 * w})×(${B}−${2 * w}); path = ${L * B} − ${(L - 2 * w) * (B - 2 * w)} = ${fmt(area)} m²` : `Outer rectangle = (${L}+${2 * w})×(${B}+${2 * w}); path = ${(L + 2 * w) * (B + 2 * w)} − ${L * B} = ${fmt(area)} m²`}. Cost = ${fmt(area)}×${rate} = ${money(cost)}. Perimeter × width (${fmt(2 * (L + B) * w)} m²) miscounts the four corner squares.`,
      hint: 'A path of width w changes each dimension by 2w; the corners must be counted once.',
      seconds: 120,
    }
  },
  r => {
    const R = pick(r, [6, 7, 9, 12, 14]), h = pick(r, [10, 14, 20, 21, 28]), n = int(r, 2, 12), rb = pick(r, [1, 1.5, 2, 3, 3.5].filter(v => v < R / 2))
    const rise = n * (4 / 3) * rb ** 3 / (R ** 2)
    if (!nice(rise, 3)) return null
    return {
      topic: 'Mensuration',
      question: `A cylindrical jar of radius ${fmt(R)} cm and height ${h} cm is partly filled with water. ${n} solid spherical balls of radius ${fmt(rb)} cm are dropped in and are fully submerged without overflow. By how much does the water level rise?`,
      correct: `${fmt(Number(rise.toFixed(3)))} cm`,
      traps: [`${fmt(Number((n * (4 / 3) * rb ** 3 / R ** 2 * 3).toFixed(3)))} cm`, `${fmt(Number((n * 4 * rb ** 2 / R ** 2).toFixed(3)))} cm`, `${fmt(Number((rise / n).toFixed(3)))} cm`],
      explanation: `Volume displaced = ${n}×(4/3)π(${fmt(rb)})³. Rise h satisfies π(${fmt(R)})²h = that volume, so h = ${n}×(4/3)×${f4(rb ** 3)}/${fmt(R ** 2)} = ${fmt(Number(rise.toFixed(3)))} cm. The jar's height is irrelevant.`,
      hint: 'Displaced volume = base area of the jar × rise in level.',
      seconds: 120,
    }
  },
  r => {
    const x = pick(r, [10, 20, 25, 30, 50]), y = pick(r, [10, 20, 25, 30, 40])
    const shape = pick(r, ['cylinder', 'cone'] as const)
    const up = r() < 0.5
    const factor = (1 + x / 100) ** 2 * (up ? 1 + y / 100 : 1 - y / 100)
    const change = (factor - 1) * 100
    if (!nice(change)) return null
    return {
      topic: 'Mensuration',
      question: `The radius of a ${shape} is increased by ${x}% and its height is ${up ? 'increased' : 'decreased'} by ${y}%. What is the percentage change in its volume?`,
      correct: `${change >= 0 ? 'Increase' : 'Decrease'} of ${pc(Math.abs(change))}`,
      traps: [`${change >= 0 ? 'Increase' : 'Decrease'} of ${pc(Math.abs(2 * x + (up ? y : -y)))}`, `${change >= 0 ? 'Decrease' : 'Increase'} of ${pc(Math.abs(change))}`, `${(1 + x / 100) * (up ? 1 + y / 100 : 1 - y / 100) >= 1 ? 'Increase' : 'Decrease'} of ${pc(Math.abs(Number((((1 + x / 100) * (up ? 1 + y / 100 : 1 - y / 100) - 1) * 100).toFixed(2))))}`],
      explanation: `Volume ∝ r²h for a ${shape}. New/old = (${fmt(1 + x / 100)})² × ${fmt(up ? 1 + y / 100 : 1 - y / 100)} = ${f4(factor)}, a change of ${pc(Math.abs(change))} (${change >= 0 ? 'increase' : 'decrease'}). Squaring the radius factor is essential; the ⅓ for a cone cancels.`,
      hint: 'Volume scales with r²·h: multiply the factors, square the radius factor.',
      seconds: 90,
    }
  },
  r => {
    const a = pick(r, [6, 12, 18, 24, 30, 36]), ask = pick(r, ['ring', 'circMinusTri', 'inGivenArea'] as const)
    const perimeter = 3 * a
    if (ask === 'ring') return {
      topic: 'Geometry',
      question: `An equilateral triangle has perimeter ${perimeter} cm. What is the area of the ring-shaped region between its circumcircle and its incircle?`,
      correct: `${fmt(a * a / 4)}π cm²`,
      traps: [`${fmt(a * a / 3)}π cm²`, `${fmt(a * a / 12)}π cm²`, `${fmt(perimeter * perimeter / 4)}π cm²`],
      explanation: `Side = ${perimeter}/3 = ${a} cm. R = a/√3 ⇒ R² = ${a * a}/3 = ${fmt(a * a / 3)}; r = a/(2√3) ⇒ r² = ${fmt(a * a / 12)}. Ring area = π(R² − r²) = π(${fmt(a * a / 3)} − ${fmt(a * a / 12)}) = ${fmt(a * a / 4)}π cm² (in fact always πa²/4). Using the perimeter as the side is the trap.`,
      hint: 'Find the side, then R = a/√3 and r = a/(2√3); subtract the areas.',
      seconds: 120,
    }
    if (ask === 'circMinusTri') return {
      topic: 'Geometry',
      question: `An equilateral triangle of perimeter ${perimeter} cm is inscribed in a circle. What is the area of the circle lying outside the triangle?`,
      correct: `(${fmt(a * a / 3)}π − ${fmt(a * a / 4)}√3) cm²`,
      traps: [`(${fmt(a * a / 12)}π − ${fmt(a * a / 4)}√3) cm²`, `(${fmt(a * a / 3)}π − ${fmt(a * a / 2)}√3) cm²`, `(${fmt(a * a / 3)}π − ${fmt(a * a / 4)}) cm²`],
      explanation: `Side = ${a} cm. Circumradius R = a/√3, so circle area = π${a * a}/3 = ${fmt(a * a / 3)}π. Triangle area = (√3/4)a² = ${fmt(a * a / 4)}√3. Outside = (${fmt(a * a / 3)}π − ${fmt(a * a / 4)}√3) cm². Using the incircle radius or ½a² for the triangle are the traps.`,
      hint: 'Inscribed triangle ⇒ the circle is its circumcircle (R = a/√3).',
      seconds: 120,
    }
    const triArea = a * a / 4
    return {
      topic: 'Geometry',
      question: `The area of an equilateral triangle is ${fmt(triArea)}√3 cm². What is the circumference of its incircle?`,
      correct: `${fmt(a / 3)}√3π cm`,
      traps: [`${fmt(2 * a / 3)}√3π cm`, `${fmt(a / 6)}√3π cm`, `${fmt(a)}π cm`],
      explanation: `(√3/4)a² = ${fmt(triArea)}√3 ⇒ a² = ${a * a} ⇒ a = ${a}. Inradius r = a/(2√3) = ${a}√3/6. Circumference = 2πr = ${a}√3π/3 = ${fmt(a / 3)}√3π cm. Using the circumradius doubles it.`,
      hint: 'Area → side → inradius → circumference.',
      seconds: 120,
    }
  },
  r => {
    const R = pick(r, [7, 14, 21, 28, 35]), rin = pick(r, [3.5, 7, 14, 10.5].filter(v => v < R)), h = pick(r, [10, 14, 20, 21, 30])
    const vol = PI * (R ** 2 - rin ** 2) * h
    const density = pick(r, [5, 8, 10])
    if (!nice(vol)) return null
    const ask = pick(r, ['vol', 'mass'] as const)
    return {
      topic: 'Mensuration',
      question: `A hollow metal pipe is ${h} cm long, with external radius ${R} cm and internal radius ${fmt(rin)} cm. Using π = 22/7, ${ask === 'vol' ? 'what is the volume of metal in it?' : `what is its mass if the metal weighs ${density} g per cm³?`}`,
      correct: ask === 'vol' ? `${fmt(vol)} cm³` : `${fmt(vol * density / 1000)} kg`,
      traps: ask === 'vol' ? [`${fmt(PI * (R - rin) ** 2 * h)} cm³`, `${fmt(PI * R ** 2 * h)} cm³`, `${fmt(2 * PI * (R - rin) * h)} cm³`] : [`${fmt(PI * (R - rin) ** 2 * h * density / 1000)} kg`, `${fmt(vol * density / 100)} kg`, `${fmt(PI * R ** 2 * h * density / 1000)} kg`],
      explanation: `Metal volume = π(R² − r²)h = 22/7×(${R ** 2} − ${fmt(rin ** 2)})×${h} = ${fmt(vol)} cm³.${ask === 'mass' ? ` Mass = ${fmt(vol)}×${density} g = ${fmt(vol * density / 1000)} kg.` : ''} Using (R − r)² instead of R² − r² is the classic trap.`,
      hint: 'Hollow cylinder volume = π(R² − r²)h.',
      seconds: 110,
    }
  },
]

// ---------------------------------------------------------- number system (computed)
const modPow = (b: number, e: number, m: number) => {
  let result = 1n, base = BigInt(b) % BigInt(m), exp = BigInt(e)
  const M = BigInt(m)
  while (exp > 0n) { if (exp & 1n) result = result * base % M; base = base * base % M; exp >>= 1n }
  return Number(result)
}
const divisors = (n: number) => { const out: number[] = []; for (let d = 1; d * d <= n; d++) if (n % d === 0) { out.push(d); if (d * d !== n) out.push(n / d) } return out.sort((a, b) => a - b) }
const numbers: Frame[] = [
  r => {
    const a = pick(r, [2, 3, 5, 7, 11, 13, 17]), m = pick(r, [7, 11, 13, 17, 19].filter(v => v !== a)), e = int(r, 50, 999)
    const b = pick(r, [0, 0, 3, 5, 4, 6])
    const f = b ? int(r, 20, 300) : 0
    const rem = (modPow(a, e, m) + (b ? modPow(b, f, m) : 0)) % m
    const wrong1 = modPow(a, e % m, m), wrong2 = (modPow(a, e - 1, m) + (b ? modPow(b, f, m) : 0)) % m
    return {
      topic: 'Number system',
      question: `What is the remainder when ${a}^${e}${b ? ` + ${b}^${f}` : ''} is divided by ${m}?`,
      correct: String(rem),
      traps: [String(wrong1), String(wrong2), String((rem + 1) % m), String((rem + m - 1) % m)],
      explanation: `Find the cycle of powers modulo ${m}. ${a}^k mod ${m} repeats with period dividing ${m - 1} (Fermat), so ${a}^${e} ≡ ${a}^${e % (m - 1)} ≡ ${modPow(a, e, m)} (mod ${m}).${b ? ` Likewise ${b}^${f} ≡ ${modPow(b, f, m)}. Sum ≡ ${rem}.` : ''} Reducing the exponent modulo ${m} instead of the cycle length gives ${wrong1}.`,
      hint: 'Reduce the exponent using the remainder cycle (or Fermat: aᵖ⁻¹ ≡ 1 mod p).',
      seconds: 120,
    }
  },
  r => {
    const ds = shuffle(r, [4, 5, 6, 8, 9, 10, 12, 15, 16, 18]).slice(0, 3)
    const k = int(r, 1, 3)
    const L = ds.reduce((x, y) => lcm(x, y), 1)
    if (ds.some(d => d <= k)) return null
    const variant = pick(r, ['smallest', 'largest4', 'smallest4'] as const)
    let ans: number
    if (variant === 'smallest') ans = L - k
    else if (variant === 'largest4') ans = Math.floor((9999 + k) / L) * L - k
    else ans = Math.ceil((1000 + k) / L) * L - k
    if (ans <= 0 || (variant !== 'smallest' && (ans < 1000 || ans > 9999))) return null
    return {
      topic: 'Number system',
      question: `What is the ${variant === 'smallest' ? 'smallest positive number' : variant === 'largest4' ? 'largest 4-digit number' : 'smallest 4-digit number'} which, when divided by ${ds.join(', ')} leaves remainders ${ds.map(d => d - k).join(', ')} respectively?`,
      correct: String(ans),
      traps: [String(ans + 2 * k), String(variant === 'smallest' ? L + k : ans + L), String(variant === 'smallest' ? ds.reduce((a, b) => a * b, 1) - k : ans - L)],
      explanation: `In each case divisor − remainder = ${k}, so the number is ${k} less than a common multiple: N = LCM(${ds.join(', ')})×t − ${k} = ${L}t − ${k}. ${variant === 'smallest' ? `t = 1 gives ${ans}.` : variant === 'largest4' ? `The largest such value ≤ 9999 is ${ans}.` : `The smallest such value ≥ 1000 is ${ans}.`}`,
      hint: 'When (divisor − remainder) is constant, the number is LCM×t minus that constant.',
      seconds: 110,
    }
  },
  r => {
    const p = [2, 3, 5, 7]
    const exps = p.map(() => int(r, 0, 4))
    const N = p.reduce((acc, pr, i) => acc * pr ** exps[i], 1)
    if (N < 100 || N > 200000) return null
    const ds = divisors(N)
    const ask = pick(r, ['count', 'odd', 'even', 'square'] as const)
    const val = ask === 'count' ? ds.length : ask === 'odd' ? ds.filter(d => d % 2).length : ask === 'even' ? ds.filter(d => d % 2 === 0).length : ds.filter(d => Number.isInteger(Math.sqrt(d))).length
    if ((ask === 'even' || ask === 'odd') && exps[0] === 0) return null
    const label = ask === 'count' ? 'positive divisors (factors)' : ask === 'odd' ? 'odd divisors' : ask === 'even' ? 'even divisors' : 'divisors that are perfect squares'
    return {
      topic: 'Number system',
      question: `How many ${label} does ${N.toLocaleString('en-IN')} have?`,
      correct: String(val),
      traps: [String(ask === 'count' ? exps.reduce((a, e) => a * Math.max(e, 1), 1) : ds.length), String(val + 2), String(ask === 'count' ? exps.reduce((a, e) => a + e, 0) + 1 : Math.max(1, val - 1))],
      explanation: `${N} = ${p.map((pr, i) => (exps[i] ? `${pr}^${exps[i]}` : '')).filter(Boolean).join(' × ')}. ${ask === 'count' ? `Number of divisors = ${exps.filter(e => e).map(e => `(${e}+1)`).join('×')} = ${val}.` : ask === 'odd' ? `Odd divisors ignore the factor 2: ${exps.slice(1).filter(e => e).map(e => `(${e}+1)`).join('×') || '1'} = ${val}.` : ask === 'even' ? `Even divisors = total − odd = ${ds.length} − ${ds.length - val} = ${val}.` : `A square divisor uses even exponents: ${exps.filter(e => e).map(e => `(⌊${e}/2⌋+1)`).join('×')} = ${val}.`}`,
      hint: 'Prime-factorise first; divisor counts come from the exponents.',
      seconds: 100,
    }
  },
  r => {
    const n = int(r, 60, 600)
    const [d, factors] = pick(r, [[6, [[2, 1], [3, 1]]], [12, [[2, 2], [3, 1]]], [15, [[3, 1], [5, 1]]], [18, [[2, 1], [3, 2]]], [20, [[2, 2], [5, 1]]], [10, [[2, 1], [5, 1]]], [36, [[2, 2], [3, 2]]], [45, [[3, 2], [5, 1]]]] as Array<[number, Array<[number, number]>]>)
    const leg = (p: number) => { let k = 0; for (let q = p; q <= n; q *= p) k += Math.floor(n / q); return k }
    const parts = factors.map(([p, e]) => [p, e, leg(p), Math.floor(leg(p) / e)] as const)
    const ans = Math.min(...parts.map(x => x[3]))
    const wrongPrime = parts.map(x => x[2]).find(v => v !== ans) ?? ans + 1
    return {
      topic: 'Number system',
      question: `What is the largest integer k such that ${d}^k divides ${n}! (the product 1×2×…×${n})?`,
      correct: String(ans),
      traps: [String(wrongPrime), String(Math.floor(n / d)), String(Math.max(...parts.map(x => x[3]))), String(ans + 1)],
      explanation: `${d} = ${factors.map(([p, e]) => (e > 1 ? `${p}^${e}` : String(p))).join(' × ')}. By Legendre's formula, ${parts.map(([p, e, l, q]) => `the power of ${p} in ${n}! is ${l}${e > 1 ? `, giving ⌊${l}/${e}⌋ = ${q} copies of ${p}^${e}` : ''}`).join('; ')}. The scarcer factor limits k, so k = ${ans}. Dividing ${n} by ${d}, or using the more plentiful prime, are the traps.`,
      hint: 'Factorise the divisor; for each prime power find its count in n!, and take the minimum.',
      seconds: 130,
    }
  },
  r => {
    // 5-digit number  a x b c y  divisible by 72 or 88 etc, count of (x,y) or find x+y
    const div = pick(r, [72, 36, 45, 88, 99, 24])
    const base = [int(r, 1, 9), -1, int(r, 0, 9), int(r, 0, 9), -1]
    const sols: Array<[number, number]> = []
    for (let x = 0; x <= 9; x++) for (let y = 0; y <= 9; y++) { const v = Number(base.map(d => (d === -1 ? 'D' : String(d))).join('').replace('D', String(x)).replace('D', String(y))); if (v % div === 0) sols.push([x, y]) }
    if (sols.length === 0 || sols.length > 3) return null
    const shown = base.map((d, i) => (d === -1 ? (i === 1 ? 'x' : 'y') : String(d))).join('')
    const ask = sols.length === 1 ? 'sum' : 'count'
    return {
      topic: 'Number system',
      question: ask === 'sum'
        ? `The five-digit number ${shown} (x and y are digits) is divisible by ${div}. What is x + y?`
        : `For how many pairs of digits (x, y) is the five-digit number ${shown} divisible by ${div}?`,
      correct: ask === 'sum' ? String(sols[0][0] + sols[0][1]) : String(sols.length),
      traps: ask === 'sum' ? [String(sols[0][0] + sols[0][1] + 9 > 18 ? sols[0][0] + sols[0][1] - 9 : sols[0][0] + sols[0][1] + 9), String(Math.abs(sols[0][0] - sols[0][1])), String(sols[0][0] * sols[0][1] || 1)] : [String(sols.length + 1), String(sols.length + 2), '0'],
      explanation: `${div} = ${div === 72 ? '8×9' : div === 36 ? '4×9' : div === 45 ? '5×9' : div === 88 ? '8×11' : div === 99 ? '9×11' : '8×3'} with coprime factors, so test both rules. Checking all digit pairs, the valid ${sols.length === 1 ? 'pair is' : 'pairs are'} ${sols.map(([x, y]) => `(x=${x}, y=${y})`).join(', ')}.`,
      hint: 'Split the divisor into coprime factors and apply each divisibility rule.',
      seconds: 130,
    }
  },
  r => {
    const h = pick(r, [6, 8, 12, 15, 16, 18]), k = pick(r, [6, 10, 12, 15, 30, 35, 42])
    const product = h * h * k
    let pairs = 0
    for (let a = 1; a * a <= k; a++) if (k % a === 0 && gcd(a, k / a) === 1) pairs++
    return {
      topic: 'HCF and LCM',
      question: `The product of two positive numbers is ${product.toLocaleString('en-IN')} and their HCF is ${h}. How many such pairs of numbers are possible?`,
      correct: String(pairs),
      traps: [divisors(k).length / 2, pairs + 1, divisors(k).length, pairs * 2, pairs + 2].map(v => String(Math.ceil(v))),
      explanation: `Write the numbers as ${h}a and ${h}b with HCF(a, b) = 1. Then ${h}²ab = ${product} ⇒ ab = ${k}. Co-prime factor pairs of ${k}: ${(() => { const out: string[] = []; for (let a = 1; a * a <= k; a++) if (k % a === 0 && gcd(a, k / a) === 1) out.push(`(${a}, ${k / a})`); return out.join(', ') })()} — that is ${pairs} pair(s). Pairs like those sharing a factor would raise the HCF.`,
      hint: 'Divide out HCF²; the remaining factors must be split into co-prime pairs.',
      seconds: 110,
    }
  },
]

// ---------------------------------------------------------- ages, partnership, average, ratio
const agesEtc: Frame[] = [
  r => {
    const A = int(r, 24, 60), B = int(r, 8, 40)
    const t = int(r, 3, 10), s = int(r, 3, 12)
    if (B >= A || B - t <= 0) return null
    const g1 = gcd(A - t, B - t), g2 = gcd(A + s, B + s)
    const [a, b, c, d] = [(A - t) / g1, (B - t) / g1, (A + s) / g2, (B + s) / g2]
    if (a * d === b * c || a > 15 || c > 15) return null
    const [p1, p2] = two(r)
    const ask = pick(r, ['sum', 'diff', 'older'] as const)
    const ans = ask === 'sum' ? A + B : ask === 'diff' ? A - B : A
    return {
      topic: 'Ages',
      question: `${t} years ago the ratio of the ages of ${p1} and ${p2} was ${a}:${b}. ${s} years from now it will be ${c}:${d}. What is ${ask === 'sum' ? 'the sum of their present ages' : ask === 'diff' ? 'the difference between their ages' : `${p1}'s present age`}?`,
      correct: `${ans} years`,
      traps: [`${ask === 'sum' ? A + B - 2 * t : ask === 'diff' ? A - B + t : A - t} years`, `${ask === 'sum' ? A + B + 2 * s : ask === 'diff' ? (A - B) * 2 : A + s} years`, `${ask === 'sum' ? (a + b) * g1 : ask === 'diff' ? c - d : B} years`],
      explanation: `Let the ages ${t} years ago be ${a}k and ${b}k. Then (${a}k + ${t + s}) : (${b}k + ${t + s}) = ${c}:${d}, so ${d}(${a}k + ${t + s}) = ${c}(${b}k + ${t + s}) ⇒ k = ${g1}. Present ages: ${p1} = ${A}, ${p2} = ${B}. Required: ${ans} years.`,
      hint: 'Use one variable for the earlier ratio and shift both ages by the full time gap.',
      seconds: 140,
    }
  },
  r => {
    const capA = pick(r, [20, 30, 40, 45, 50, 60]) * 1000, capB = pick(r, [24, 30, 36, 48, 60, 72]) * 1000
    const join = int(r, 2, 6), withdraw = pick(r, [0, 5000, 10000, 15000])
    const monthW = int(r, 4, 8)
    const [a, b] = two(r)
    const aCap = withdraw ? capA * monthW + (capA - withdraw) * (12 - monthW) : capA * 12
    const bCap = capB * (12 - join)
    const g = gcd(aCap, bCap)
    const ra = aCap / g, rb = bCap / g
    if (ra + rb > 60) return null
    const unit = pick(r, [500, 1000, 1200, 1500, 2000])
    const P = (ra + rb) * unit
    const bShare = rb * unit
    return {
      topic: 'Partnership',
      question: `${a} starts a business with ${money(capA)}. ${b} joins after ${join} months with ${money(capB)}.${withdraw ? ` ${a} withdraws ${money(withdraw)} at the end of month ${monthW}.` : ''} Out of a year-end profit of ${money(P)}, what is ${b}'s share?`,
      correct: money(bShare),
      traps: [money(P * capB / (capA + capB)), money(P - bShare), money(P * capB * 12 / (capB * 12 + aCap))],
      explanation: `Capital × months: ${a} = ${withdraw ? `${capA}×${monthW} + ${capA - withdraw}×${12 - monthW}` : `${capA}×12`} = ${aCap}; ${b} = ${capB}×${12 - join} = ${bCap}. Ratio = ${ra}:${rb}. ${b}'s share = ${P}×${rb}/${ra + rb} = ${money(bShare)}.`,
      hint: 'Profit is shared in the ratio of capital × time, segment by segment.',
      seconds: 130,
    }
  },
  r => {
    const n = int(r, 10, 30), avg = int(r, 25, 50), d = pick(r, [1, 2, 3, 4])
    const score = avg + d * (n + 1)
    const ask = pick(r, ['score', 'newavg'] as const)
    return {
      topic: 'Average',
      question: ask === 'score'
        ? `A batsman has a certain average after ${n} innings. In the ${n + 1}th innings he scores some runs, raising his average by ${d} to ${avg + d}. How many runs did he score in the ${n + 1}th innings?`
        : `A batsman scores ${score} runs in his ${n + 1}th innings and thereby increases his average by ${d}. What is his average after the ${n + 1}th innings?`,
      correct: ask === 'score' ? String(score) : String(avg + d),
      traps: ask === 'score' ? [String(avg + d * n), String(avg + d + d * n + d), String(avg + d)] : [String(avg), String(Math.round((score - d) / (n + 1)) === avg + d ? avg + 2 * d : Math.round((score - d) / (n + 1))), String(avg + d + n)],
      explanation: `Let the old average be a. ${n}a + S = ${n + 1}(a + ${d}) ⇒ S = a + ${d * (n + 1)}. ${ask === 'score' ? `Here a = ${avg + d}−${d} = ${avg}, so S = ${avg} + ${d * (n + 1)} = ${score}.` : `With S = ${score}: a = ${score} − ${d * (n + 1)} = ${avg}; new average = ${avg + d}.`} The new innings must cover the old average plus ${d} for each of the ${n + 1} innings.`,
      hint: 'New score = old average + (rise × new number of innings).',
      seconds: 100,
    }
  },
  r => {
    const N = int(r, 20, 60), A = int(r, 30, 70), right = int(r, 40, 95), wrong = right + pick(r, [-27, -18, 9, 18, 36, 45])
    const removed = int(r, 20, 99)
    const total = N * A - wrong + right - removed
    const newAvg = total / (N - 1)
    if (!nice(newAvg) || wrong <= 0) return null
    return {
      topic: 'Average',
      question: `The average of ${N} observations was calculated as ${A}. It was then found that one observation, ${right}, had been recorded as ${wrong}. After correcting it, the observation ${removed} is discarded as an outlier. What is the new average of the remaining observations?`,
      correct: fmt(newAvg),
      traps: [fmt((N * A - wrong + right) / N), fmt((N * A + wrong - right - removed) / (N - 1)), fmt((N * A - wrong + right - removed) / N)],
      explanation: `Recorded total = ${N}×${A} = ${N * A}. Correction: −${wrong} + ${right} ⇒ ${N * A - wrong + right}. Discard ${removed}: ${total} over ${N - 1} observations = ${fmt(newAvg)}. Reversing the correction, or keeping ${N} as the divisor, gives the traps.`,
      hint: 'Work with totals: fix the error, remove the item, then divide by the new count.',
      seconds: 110,
    }
  },
  r => {
    const [i1, i2] = pick(r, [[3, 2], [4, 3], [5, 4], [5, 3], [7, 5], [9, 7]] as const), [e1, e2] = pick(r, [[5, 3], [2, 1], [3, 2], [7, 4], [4, 3]] as const)
    const s = pick(r, [2000, 2500, 3000, 4000, 5000, 6000])
    // incomes i1 k, i2 k; expenditures e1 m, e2 m; savings both s
    // i1 k - e1 m = s ; i2 k - e2 m = s → k(i1 e2 - i2 e1) = s(e2 - e1)
    const det = i1 * e2 - i2 * e1
    if (det === 0) return null
    const k = s * (e2 - e1) / det, m = (i1 * k - s) / e1
    if (k <= 0 || m <= 0 || !isInt(k) || !isInt(m)) return null
    const [a, b] = two(r)
    return {
      topic: 'Ratio and proportion',
      question: `The incomes of ${a} and ${b} are in the ratio ${i1}:${i2} and their expenditures in the ratio ${e1}:${e2}. If each saves ${money(s)} a month, what is ${a}'s monthly income?`,
      correct: money(i1 * k),
      traps: [money(i2 * k), money(e1 * m), money(i1 * s / Math.abs(i1 - i2))],
      explanation: `Income = ${i1}k, ${i2}k; expenditure = ${e1}m, ${e2}m. ${i1}k − ${e1}m = ${s} and ${i2}k − ${e2}m = ${s}. Solving: k = ${k}, m = ${m}. ${a}'s income = ${i1}×${k} = ${money(i1 * k)}.`,
      hint: 'Use two multipliers (one per ratio) and equate the savings.',
      seconds: 130,
    }
  },
  r => {
    const denoms = shuffle(r, [[1, '₹1'], [2, '₹2'], [5, '₹5'], [10, '₹10']] as const).slice(0, 3)
    const ratio = denoms.map(() => int(r, 1, 6))
    const k = int(r, 3, 20)
    const value = denoms.reduce((s, [v], i) => s + v * ratio[i] * k, 0)
    const target = int(r, 0, 2)
    return {
      topic: 'Ratio and proportion',
      question: `A bag contains ${denoms.map(d => d[1]).join(', ')} coins in the ratio ${ratio.join(':')} by number. If their total value is ${money(value)}, how many ${denoms[target][1]} coins are there?`,
      correct: String(ratio[target] * k),
      traps: [String(Math.round(value * ratio[target] / ratio.reduce((a, b) => a + b, 0) / denoms[target][0])), String(ratio[target] * k * denoms[target][0] === ratio[target] * k ? ratio[target] * k + k : ratio[target] * k * denoms[target][0]), String(Math.round(value * ratio[target] / ratio.reduce((a, b) => a + b, 0)))],
      explanation: `Value ratio = ${denoms.map(([v], i) => `${v}×${ratio[i]}`).join(' : ')} = ${denoms.map(([v], i) => v * ratio[i]).join(':')}, total ${denoms.reduce((s, [v], i) => s + v * ratio[i], 0)} units of value per set. ${value}/${denoms.reduce((s, [v], i) => s + v * ratio[i], 0)} = ${k} sets, so ${denoms[target][1]} coins = ${ratio[target]}×${k} = ${ratio[target] * k}. Splitting the value in the count ratio is the trap.`,
      hint: 'Convert the count ratio into a value ratio before dividing the total value.',
      seconds: 110,
    }
  },
]

// ---------------------------------------------------------- quadratic comparison
type Rel = 'x > y' | 'x < y' | 'x ≥ y' | 'x ≤ y' | 'x = y or no relation can be established'
const relation = (X: number[], Y: number[]): Rel => {
  const minX = Math.min(...X), maxX = Math.max(...X), minY = Math.min(...Y), maxY = Math.max(...Y)
  if (minX === maxX && minY === maxY && minX === minY) return 'x = y or no relation can be established'
  if (minX > maxY) return 'x > y'
  if (maxX < minY) return 'x < y'
  if (minX >= maxY) return 'x ≥ y'
  if (maxX <= minY) return 'x ≤ y'
  return 'x = y or no relation can be established'
}
const quadText = (v: string, r1: number, r2: number, lead: number) => {
  const b = -(r1 + r2) * lead, c = r1 * r2 * lead
  const term = (coef: number, s: string, first = false) => coef === 0 ? '' : `${coef < 0 ? (first ? '−' : ' − ') : first ? '' : ' + '}${Math.abs(coef) === 1 && s ? '' : Math.abs(coef)}${s}`
  return `${term(lead, `${v}²`, true)}${term(b, v)}${term(c, '')} = 0`
}
const quadratics: Frame[] = [
  r => {
    const pickRoots = () => { const a = int(r, -9, 9), b = int(r, -9, 9); return [a, b] }
    const [x1, x2] = pickRoots(), [y1, y2] = pickRoots()
    if (x1 === 0 && x2 === 0) return null
    const lx = pick(r, [1, 1, 2]), ly = pick(r, [1, 1, 3])
    const rel = relation([x1, x2], [y1, y2])
    const all: Rel[] = ['x > y', 'x < y', 'x ≥ y', 'x ≤ y', 'x = y or no relation can be established']
    const traps = shuffle(r, all.filter(v => v !== rel))
    return {
      topic: 'Quadratic equations',
      question: `Solve both equations and compare the roots.\nI. ${quadText('x', x1, x2, lx)}\nII. ${quadText('y', y1, y2, ly)}`,
      correct: rel,
      traps,
      explanation: `I factorises to roots x = ${[...new Set([x1, x2])].join(', ')}; II to roots y = ${[...new Set([y1, y2])].join(', ')}. Compare every x with every y: ${rel === 'x = y or no relation can be established' ? 'some pairs give x > y and others x < y (or the comparison is mixed), so no single relation holds' : `in every pairing ${rel}`}. Comparing only the larger roots is the usual mistake.`,
      hint: 'Find all roots, then check the relation for every x–y pair.',
      seconds: 100,
    }
  },
  r => {
    const k = pick(r, [4, 9, 16, 25, 36, 49, 64, 81, 144, 169, 196, 225])
    const s = Math.sqrt(k)
    const [y1, y2] = [int(r, -12, 15), int(r, -12, 15)]
    const rel = relation([s, -s], [y1, y2])
    const sqrtVersion = r() < 0.5
    const X = sqrtVersion ? [s] : [s, -s]
    const rel2 = relation(X, [y1, y2])
    const all: Rel[] = ['x > y', 'x < y', 'x ≥ y', 'x ≤ y', 'x = y or no relation can be established']
    const correct = sqrtVersion ? rel2 : rel
    return {
      topic: 'Quadratic equations',
      question: `Compare x and y.\nI. ${sqrtVersion ? `x = √${k}` : `x² = ${k}`}\nII. ${quadText('y', y1, y2, 1)}`,
      correct,
      traps: shuffle(r, all.filter(v => v !== correct)),
      explanation: `${sqrtVersion ? `√${k} denotes only the principal (non-negative) root, so x = ${s}.` : `x² = ${k} gives x = ±${s}.`} II gives y = ${[...new Set([y1, y2])].join(', ')}. Checking every pair: ${correct}. ${sqrtVersion ? `Taking x = ±${s} here would be wrong.` : `Forgetting x = −${s} is the trap.`}`,
      hint: 'x² = k has two roots; √k has one.',
      seconds: 90,
    }
  },
]

// ---------------------------------------------------------- DI tables & caselets
const years = ['2019', '2020', '2021', '2022', '2023']
const di: Frame[] = [
  r => {
    const cats = shuffle(r, ['Cybercrime', 'Theft', 'Traffic', 'Fraud', 'Assault']).slice(0, 3)
    // A bounded random walk keeps the series realistic (no 300 → 75 → 365 swings).
    const data: number[][] = [cats.map(() => int(r, 30, 90) * 5)]
    for (let y = 1; y < years.length; y++) data.push(data[y - 1].map(v => Math.max(50, Math.round(v * (1 + int(r, -25, 35) / 100) / 5) * 5)))
    const table = `Cases registered in a district (by type):\nYear | ${cats.join(' | ')}\n${years.map((y, i) => `${y} | ${data[i].join(' | ')}`).join('\n')}`
    const q = pick(r, ['growth', 'ratio', 'avgShare', 'maxGrowth', 'pctOfTotal'] as const)
    const c = int(r, 0, 2), y1 = int(r, 0, 3), y2 = int(r, y1 + 1, 4)
    if (q === 'growth') {
      const g = (data[y2][c] - data[y1][c]) / data[y1][c] * 100
      if (!nice(g, 1)) return null
      return { topic: 'Data interpretation', question: `${table}\nBy what percentage did ${cats[c]} cases change from ${years[y1]} to ${years[y2]}?`, correct: `${g >= 0 ? 'Increase' : 'Decrease'} of ${pc(Math.abs(g))}`, traps: [`${g >= 0 ? 'Increase' : 'Decrease'} of ${pc(Number(Math.abs((data[y2][c] - data[y1][c]) / data[y2][c] * 100).toFixed(1)))}`, `${g >= 0 ? 'Decrease' : 'Increase'} of ${pc(Math.abs(g))}`, `${g >= 0 ? 'Increase' : 'Decrease'} of ${pc(Math.abs(data[y2][c] - data[y1][c]) / 10)}`], explanation: `Change = ${data[y2][c]} − ${data[y1][c]} = ${data[y2][c] - data[y1][c]} on the base year ${years[y1]} value ${data[y1][c]}: ${fmt(g)}%. Using the later year as base is the trap.`, hint: 'Percentage change uses the earlier value as the base.', seconds: 110 }
    }
    if (q === 'ratio') {
      const sA = data[y1][c] + data[y2][c], other = (c + 1) % 3, sB = data[y1][other] + data[y2][other], g = gcd(sA, sB)
      return { topic: 'Data interpretation', question: `${table}\nWhat is the ratio of total ${cats[c]} cases in ${years[y1]} and ${years[y2]} together to total ${cats[other]} cases in the same two years?`, correct: `${sA / g}:${sB / g}`, traps: [`${sB / g}:${sA / g}`, (() => { const a2 = data[y1][c] + data[y2][other], b2 = data[y1][other] + data[y2][c], h = gcd(a2, b2); return `${a2 / h}:${b2 / h}` })(), (() => { const a3 = data[y1][c], b3 = data[y1][other], h = gcd(a3, b3); return `${a3 / h}:${b3 / h}` })()], explanation: `${cats[c]}: ${data[y1][c]} + ${data[y2][c]} = ${sA}. ${cats[other]}: ${data[y1][other]} + ${data[y2][other]} = ${sB}. Ratio = ${sA}:${sB} = ${sA / g}:${sB / g}.`, hint: 'Add within each category first, then simplify.', seconds: 100 }
    }
    if (q === 'avgShare') {
      const avg = data.reduce((s, row) => s + row[c], 0) / 5
      const cnt = data.filter(row => row[c] > avg).length
      return { topic: 'Data interpretation', question: `${table}\nIn how many of the five years were ${cats[c]} cases above that category's five-year average?`, correct: String(cnt), traps: [0, 1, 2, 3, 4, 5].filter(v => v !== cnt).sort((p, q) => Math.abs(p - cnt) - Math.abs(q - cnt)).map(String), explanation: `Average ${cats[c]} = (${data.map(row => row[c]).join(' + ')})/5 = ${fmt(avg)}. Years strictly above it: ${years.filter((_, i) => data[i][c] > avg).join(', ') || 'none'}.`, hint: 'Compute the mean once, then compare each year.', seconds: 100 }
    }
    if (q === 'maxGrowth') {
      const growth = years.slice(1).map((_, i) => (data[i + 1][c] - data[i][c]) / data[i][c])
      const best = growth.indexOf(Math.max(...growth))
      const absBest = years.slice(1).map((_, i) => data[i + 1][c] - data[i][c]).reduce((bi, v, i, arr) => (v > arr[bi] ? i : bi), 0)
      if (growth.filter(g => g === growth[best]).length > 1 || growth[best] <= 0) return null
      const traps = years.slice(1).filter((_, i) => i !== best).map(y => y)
      const preferred = absBest !== best ? [years[absBest + 1], ...traps.filter(t => t !== years[absBest + 1])] : traps
      return { topic: 'Data interpretation', question: `${table}\nIn which year did ${cats[c]} cases show the highest percentage increase over the previous year?`, correct: years[best + 1], traps: preferred, explanation: `Year-on-year % change for ${cats[c]}: ${years.slice(1).map((y, i) => `${y}: ${fmt(growth[i] * 100)}%`).join(', ')}. Highest = ${years[best + 1]}.${absBest !== best ? ` The largest absolute rise (${years[absBest + 1]}) is a trap: a smaller base can give a bigger percentage.` : ''}`, hint: 'Compare percentage, not absolute, increases.', seconds: 130 }
    }
    const tot = data[y1].reduce((a, b) => a + b, 0)
    const share = data[y1][c] / tot * 100
    if (!nice(share, 1)) return null
    return { topic: 'Data interpretation', question: `${table}\nWhat percentage of all cases in ${years[y1]} were ${cats[c]} cases?`, correct: pc(Number(share.toFixed(1))), traps: [pc(Number((data[y1][c] / data.reduce((s, row) => s + row[c], 0) * 100).toFixed(1))), pc(Number((data[y1][c] / (tot - data[y1][c]) * 100).toFixed(1))), pc(Number((share + 5).toFixed(1)))], explanation: `Total in ${years[y1]} = ${data[y1].join(' + ')} = ${tot}. Share = ${data[y1][c]}/${tot}×100 = ${fmt(share)}%. Dividing by the five-year ${cats[c]} total or by the other categories only gives the traps.`, hint: 'Identify the correct whole (row total) before dividing.', seconds: 100 }
  },
  r => {
    const N = pick(r, [1200, 1500, 1800, 2000, 2400, 3000, 3600])
    const w = pick(r, [30, 35, 40, 45, 55, 60]), gw = pick(r, [40, 50, 60, 70, 75, 80]), gm = pick(r, [30, 40, 50, 60, 65, 75])
    const women = N * w / 100, men = N - women
    const gwN = women * gw / 100, gmN = men * gm / 100
    if (![women, gwN, gmN].every(isInt)) return null
    const ask = pick(r, ['ngMen', 'gradShare', 'womenAmongGrad', 'diff'] as const)
    const ans = ask === 'ngMen' ? String(men - gmN) : ask === 'gradShare' ? pc(Number(((gwN + gmN) / N * 100).toFixed(2))) : ask === 'womenAmongGrad' ? pc(Number((gwN / (gwN + gmN) * 100).toFixed(2))) : String(Math.abs((women - gwN) - (men - gmN)))
    const traps = ask === 'ngMen' ? [String(gmN), String(N - gwN - gmN), String(men - gwN)] : ask === 'gradShare' ? [pc((gw + gm) / 2), pc(gw), pc(gm)] : ask === 'womenAmongGrad' ? [pc(w), pc(gw), pc(Number((gwN / N * 100).toFixed(2)))] : [String(Math.abs(gwN - gmN)), String(Math.abs(women - men)), String(N - gwN - gmN)]
    return {
      topic: 'Data interpretation',
      question: `Caselet: A police training centre has ${N.toLocaleString('en-IN')} trainees, of whom ${w}% are women. ${gw}% of the women and ${gm}% of the men are graduates. ${ask === 'ngMen' ? 'How many men are not graduates?' : ask === 'gradShare' ? 'What percentage of all trainees are graduates?' : ask === 'womenAmongGrad' ? 'What percentage of the graduates are women?' : 'What is the difference between the numbers of non-graduate women and non-graduate men?'}`,
      correct: ans,
      traps,
      explanation: `Women = ${women}, men = ${men}. Graduate women = ${gwN}, graduate men = ${gmN}; non-graduates: women ${women - gwN}, men ${men - gmN}. ${ask === 'gradShare' ? `Graduates = ${gwN + gmN} of ${N} = ${ans}; averaging ${gw}% and ${gm}% ignores unequal group sizes.` : ask === 'womenAmongGrad' ? `Women among graduates = ${gwN}/${gwN + gmN} = ${ans}.` : `Required value = ${ans}.`}`,
      hint: 'Convert every percentage to a count using its own base group.',
      seconds: 120,
    }
  },
  r => {
    const depts = shuffle(r, ['Civil', 'AR', 'Traffic', 'CID', 'Special Branch']).slice(0, 4)
    const total = pick(r, [2400, 3600, 4800, 6000, 7200])
    let shares = depts.map(() => int(r, 10, 40))
    const s = shares.reduce((a, b) => a + b, 0)
    shares = shares.map(v => Math.round(v * 100 / s / 5) * 5)
    const diff = 100 - shares.reduce((a, b) => a + b, 0)
    shares[0] += diff
    if (shares.some(v => v <= 0)) return null
    const femalePct = depts.map(() => pick(r, [10, 15, 20, 25, 30, 40]))
    const strengths = shares.map(v => total * v / 100)
    const females = strengths.map((v, i) => v * femalePct[i] / 100)
    if (!strengths.every(isInt) || !females.every(isInt)) return null
    const table = `Total personnel: ${total.toLocaleString('en-IN')}\nWing | Share of personnel | Women in wing\n${depts.map((d, i) => `${d} | ${shares[i]}% | ${femalePct[i]}%`).join('\n')}`
    const ask = pick(r, ['menIn', 'ratioWomen', 'womenOverall'] as const)
    const [i, j] = shuffle(r, [0, 1, 2, 3]).slice(0, 2)
    if (ask === 'menIn') return { topic: 'Data interpretation', question: `${table}\nHow many men are there in the ${depts[i]} and ${depts[j]} wings together?`, correct: String(strengths[i] - females[i] + strengths[j] - females[j]), traps: [String(females[i] + females[j]), String(strengths[i] + strengths[j]), String(Math.round(total * (100 - femalePct[i]) / 100 * shares[i] / 100) + Math.round(total * (100 - femalePct[i]) / 100 * shares[j] / 100) + (femalePct[i] === femalePct[j] ? 10 : 0))], explanation: `${depts[i]}: ${strengths[i]} personnel, ${females[i]} women ⇒ ${strengths[i] - females[i]} men. ${depts[j]}: ${strengths[j]} personnel, ${females[j]} women ⇒ ${strengths[j] - females[j]} men. Total men = ${strengths[i] - females[i] + strengths[j] - females[j]}.`, hint: 'Each wing’s women-% applies to that wing’s strength only.', seconds: 130 }
    if (ask === 'ratioWomen') { const g = gcd(females[i], females[j]); return { topic: 'Data interpretation', question: `${table}\nWhat is the ratio of women in the ${depts[i]} wing to women in the ${depts[j]} wing?`, correct: `${females[i] / g}:${females[j] / g}`, traps: [(() => { const h = gcd(femalePct[i], femalePct[j]); return `${femalePct[i] / h}:${femalePct[j] / h}` })(), `${females[j] / g}:${females[i] / g}`, (() => { const h = gcd(shares[i], shares[j]); return `${shares[i] / h}:${shares[j] / h}` })()], explanation: `Women: ${depts[i]} = ${shares[i]}% × ${femalePct[i]}% of ${total} = ${females[i]}; ${depts[j]} = ${females[j]}. Ratio = ${females[i] / g}:${females[j] / g}. Comparing the women-percentages alone ignores wing size.`, hint: 'Ratio of counts = (share × women-%) for each wing.', seconds: 120 } }
    const totalWomen = females.reduce((a, b) => a + b, 0)
    return { topic: 'Data interpretation', question: `${table}\nWhat percentage of the total personnel are women?`, correct: pc(Number((totalWomen / total * 100).toFixed(2))), traps: [pc(femalePct.reduce((a, b) => a + b, 0) / 4), pc(Number((totalWomen / total * 100 + 2.5).toFixed(2))), pc(Math.max(...femalePct))], explanation: `Women = ${females.join(' + ')} = ${totalWomen}. As a share of ${total}: ${fmt(totalWomen / total * 100)}%. The simple average of the wing percentages (${fmt(femalePct.reduce((a, b) => a + b, 0) / 4)}%) ignores the different wing sizes.`, hint: 'Weight each wing’s percentage by its size.', seconds: 130 }
  },
  r => {
    // Lengthy multi-variable caselet in the bank-mains style: every fact feeds the next.
    const [a, b] = pick(r, [[3, 2], [5, 3], [4, 3], [7, 5], [5, 4]] as const)
    const unit = pick(r, [40, 60, 80, 100, 120])
    const P = a * unit * 10, Q = b * unit * 10
    const wP = pick(r, [20, 25, 30, 40]), more = pick(r, [10, 20, 25, 50])
    const womenP = P * wP / 100, womenQ = womenP * (100 + more) / 100
    const offW = pick(r, [10, 20, 25, 40]), offAll = pick(r, [15, 20, 25, 30])
    const officers = (P + Q) * offAll / 100, womenOfficers = (womenP + womenQ) * offW / 100
    const menOfficers = officers - womenOfficers, men = P + Q - womenP - womenQ
    if (![womenP, womenQ, officers, womenOfficers].every(isInt) || womenQ >= Q || menOfficers <= 0) return null
    const ask = pick(r, ['menOfficersPct', 'menQ', 'ratioWomen'] as const)
    const intro = `Caselet: Two police units P and Q together have ${(P + Q).toLocaleString('en-IN')} personnel in the ratio ${a}:${b}. ${wP}% of P's personnel are women, and Q has ${more}% more women than P. Across both units, ${offAll}% of all personnel are officers, and ${offW}% of all the women are officers.`
    if (ask === 'menOfficersPct') {
      const v = menOfficers / men * 100
      if (!nice(v)) return null
      return { topic: 'Data interpretation', question: `${intro}\nWhat percentage of the men (both units together) are officers?`, correct: pc(v), traps: [pc(Number((menOfficers / (P + Q) * 100).toFixed(2))), pc(offAll - offW > 0 ? offAll - offW : offAll + offW), pc(Number((officers / men * 100).toFixed(2)))], explanation: `P = ${P}, Q = ${Q}. Women: P = ${womenP}, Q = ${womenP}×${(100 + more) / 100} = ${womenQ}; total women ${womenP + womenQ}, men ${men}. Officers = ${offAll}% of ${P + Q} = ${officers}; women officers = ${offW}% of ${womenP + womenQ} = ${womenOfficers}; men officers = ${menOfficers}. Share = ${menOfficers}/${men} = ${pc(v)}. Dividing by all personnel instead of men is the trap.`, hint: 'Build the women counts unit by unit, then split officers into women and men.', seconds: 180 }
    }
    if (ask === 'menQ') return { topic: 'Data interpretation', question: `${intro}\nHow many men are there in unit Q?`, correct: String(Q - womenQ), traps: [String(Q - womenP), String(Q - Q * wP / 100 * (100 + more) / 100), String(P - womenP)], explanation: `Q = ${b}/${a + b} × ${P + Q} = ${Q}. Women in P = ${wP}% of ${P} = ${womenP}; women in Q are ${more}% more = ${womenQ}. Men in Q = ${Q} − ${womenQ} = ${Q - womenQ}. Applying "${wP}% + ${more}%" to Q's own strength is the trap.`, hint: '“More women than P” is relative to P’s count of women, not to Q’s strength.', seconds: 150 }
    const g = gcd(womenOfficers, menOfficers)
    return { topic: 'Data interpretation', question: `${intro}\nWhat is the ratio of women officers to men officers?`, correct: `${womenOfficers / g}:${menOfficers / g}`, traps: [`${menOfficers / g}:${womenOfficers / g}`, (() => { const x = womenOfficers, y = officers, h = gcd(x, y); return `${x / h}:${y / h}` })(), (() => { const x = offW, y = offAll, h = gcd(x, y); return `${x / h}:${y / h}` })()], explanation: `Women = ${womenP} + ${womenQ} = ${womenP + womenQ}; women officers = ${womenOfficers}. All officers = ${officers}, so men officers = ${menOfficers}. Ratio = ${womenOfficers}:${menOfficers} = ${womenOfficers / g}:${menOfficers / g}. Comparing women officers with all officers is the trap.`, hint: 'Officers overall minus women officers gives men officers.', seconds: 170 }
  },
]

// ---------------------------------------------------------- data sufficiency (enumerated)
type DSCase = { grid: number[][]; target: (v: number[]) => number; s1: (v: number[]) => boolean; s2: (v: number[]) => boolean; text: string; t1: string; t2: string; topic: string; why: string }
const DS_OPTIONS = ['Statement I alone is sufficient, but II alone is not', 'Statement II alone is sufficient, but I alone is not', 'Each statement alone is sufficient', 'Both statements together are needed', 'Even both statements together are not sufficient'] as const
const dsCases: Array<(r: Rand) => DSCase | null> = [
  r => {
    const A = int(r, 20, 50), B = int(r, 5, A - 4)
    const grid: number[][] = []
    // A wide grid so that a ratio alone never looks sufficient merely because multiples run out.
    for (let a = 1; a <= 240; a++) for (let b = 1; b <= 240; b++) grid.push([a, b])
    const ratioG = gcd(A, B)
    const kind1 = pick(r, ['ratio', 'diff', 'sumAgo'] as const), kind2 = pick(r, ['diff', 'sum', 'ratioFuture', 'ratio'] as const)
    const t = int(r, 2, 5)
    const mk = (kind: string): [(v: number[]) => boolean, string] => {
      if (kind === 'ratio') return [v => v[0] * (B / ratioG) === v[1] * (A / ratioG), `The ratio of their present ages is ${A / ratioG}:${B / ratioG}.`]
      if (kind === 'diff') return [v => v[0] - v[1] === A - B, `P is ${A - B} years older than Q.`]
      if (kind === 'sum') return [v => v[0] + v[1] === A + B, `The sum of their present ages is ${A + B} years.`]
      if (kind === 'sumAgo') return [v => v[0] + v[1] - 2 * t === A + B - 2 * t, `${t} years ago the sum of their ages was ${A + B - 2 * t} years.`]
      const g = gcd(A + t, B + t)
      return [v => (v[0] + t) * ((B + t) / g) === (v[1] + t) * ((A + t) / g), `After ${t} years the ratio of their ages will be ${(A + t) / g}:${(B + t) / g}.`]
    }
    if (kind1 === kind2) return null
    const [s1, t1] = mk(kind1), [s2, t2] = mk(kind2)
    return { grid, target: v => v[0], s1, s2, text: 'What is the present age of P?', t1, t2, topic: 'Data sufficiency', why: `True ages: P = ${A}, Q = ${B}.` }
  },
  r => {
    const v = int(r, 8, 30), L = v * int(r, 5, 20)
    const grid: number[][] = []
    for (let l = 50; l <= 700; l += 10) for (let s = 1; s <= 40; s++) grid.push([l, s])
    if (L > 700 || L % 10) return null
    const P = pick(r, [100, 150, 200, 250, 300]), u = pick(r, [2, 3, 4].filter(x => x < v))
    const pool: Array<[(x: number[]) => boolean, string]> = [
      [x => x[0] === x[1] * (L / v), `The train crosses a pole in ${L / v} seconds.`],
      [x => (x[0] + P) === x[1] * ((L + P) / v), `The train crosses a ${P} m platform in ${(L + P) / v} seconds.`],
      [x => x[1] === v, `The speed of the train is ${fmt(v * 18 / 5)} km/h.`],
      [x => x[0] * (v - u) === L * (x[1] - u), `It passes a man walking at ${fmt(u * 18 / 5)} km/h in its direction in ${fmt(L / (v - u))} seconds.`],
    ]
    if (!isInt((L + P) / v) || !nice(L / (v - u))) return null
    const [i, j] = shuffle(r, [0, 1, 2, 3]).slice(0, 2)
    const ask = pick(r, ['len', 'speed'] as const)
    return { grid, target: x => (ask === 'len' ? x[0] : x[1]), s1: pool[i][0], s2: pool[j][0], text: `What is the ${ask === 'len' ? 'length' : 'speed'} of the train? (Length is a whole number of metres in tens; speed is a whole number of m/s.)`, t1: pool[i][1], t2: pool[j][1], topic: 'Data sufficiency', why: `Actual: length ${L} m, speed ${v} m/s.` }
  },
  r => {
    const t = int(r, 1, 9), u = int(r, 0, 9)
    const N = 10 * t + u
    const grid: number[][] = []
    for (let a = 1; a <= 9; a++) for (let b = 0; b <= 9; b++) grid.push([a, b])
    const pool: Array<[(x: number[]) => boolean, string]> = [
      [x => x[0] + x[1] === t + u, `The sum of its digits is ${t + u}.`],
      [x => x[0] - x[1] === t - u, `The tens digit ${t - u >= 0 ? 'exceeds' : 'is less than'} the units digit by ${Math.abs(t - u)}.`],
      [x => (10 * x[1] + x[0]) - (10 * x[0] + x[1]) === 10 * u + t - N, `Reversing its digits ${10 * u + t - N >= 0 ? 'increases' : 'decreases'} the number by ${Math.abs(10 * u + t - N)}.`],
      [x => x[0] * x[1] === t * u, `The product of its digits is ${t * u}.`],
      [x => (10 * x[0] + x[1]) % 9 === N % 9 && (10 * x[0] + x[1]) % 2 === N % 2, `The number leaves remainder ${N % 9} when divided by 9 and is ${N % 2 ? 'odd' : 'even'}.`],
    ]
    const [i, j] = shuffle(r, [0, 1, 2, 3, 4]).slice(0, 2)
    return { grid, target: x => 10 * x[0] + x[1], s1: pool[i][0], s2: pool[j][0], text: 'What is the two-digit number?', t1: pool[i][1], t2: pool[j][1], topic: 'Data sufficiency', why: `The number is ${N}.` }
  },
  r => {
    const cp = int(r, 10, 80) * 50, g = pick(r, [10, 20, 25, 30, 40, 50]), sp = cp * (100 + g) / 100
    const d = pick(r, [10, 20, 25]), mp = sp * 100 / (100 - d)
    if (!isInt(sp) || !isInt(mp)) return null
    const grid: number[][] = []
    for (let c = 500; c <= 4000; c += 50) for (let m = 500; m <= 8000; m += 25) grid.push([c, m])
    const pool: Array<[(x: number[]) => boolean, string]> = [
      [x => x[1] * (100 - d) === x[0] * (100 + g), `After a ${d}% discount on the marked price the article is sold at a ${g}% profit.`],
      [x => x[1] === mp, `The marked price is ${money(mp)}.`],
      [x => x[1] * (100 - d) / 100 - x[0] === sp - cp, `The ${d}% discount sale yields a profit of ${money(sp - cp)}.`],
      [x => x[1] - x[0] === mp - cp, `The marked price is ${money(mp - cp)} above the cost price.`],
    ]
    const [i, j] = shuffle(r, [0, 1, 2, 3]).slice(0, 2)
    return { grid, target: x => x[0], s1: pool[i][0], s2: pool[j][0], text: 'What is the cost price of the article? (Prices are multiples of ₹25.)', t1: pool[i][1], t2: pool[j][1], topic: 'Data sufficiency', why: `Actual: cost ${money(cp)}, marked ${money(mp)}.` }
  },
]
const dataSufficiency: Frame[] = dsCases.map(build => (r: Rand): Draft | null => {
  const c = build(r)
  if (!c) return null
  const values = (pred: (v: number[]) => boolean) => new Set(c.grid.filter(pred).map(c.target))
  const v1 = values(c.s1), v2 = values(c.s2), both = values(v => c.s1(v) && c.s2(v))
  if (both.size === 0) return null
  const one = v1.size === 1, twoOk = v2.size === 1, together = both.size === 1
  const idx = one && twoOk ? 2 : one ? 0 : twoOk ? 1 : together ? 3 : 4
  const correct = DS_OPTIONS[idx]
  const unique = (s: Set<number>) => (s.size === 1 ? `a single value (${[...s][0]})` : 'more than one value')
  return {
    topic: c.topic,
    question: `${c.text}\nI. ${c.t1}\nII. ${c.t2}\nWhich of the following is correct?`,
    correct,
    traps: shuffle(r, DS_OPTIONS.filter((_, i) => i !== idx)),
    explanation: `${c.why} Statement I alone allows ${unique(v1)}; statement II alone allows ${unique(v2)}; together they allow ${unique(both)}. Hence: ${correct}. Do not solve fully — only decide whether a unique answer is forced.`,
    hint: 'Test each statement alone first; combine only if neither suffices.',
    seconds: 120,
  }
})

// ---------------------------------------------------------- assembly
export const SEVERE_ARITHMETIC_FAMILIES: Array<[string, Frame[], number]> = [
  ['pct', percentages, 30],
  ['pl', profit, 30],
  ['int', interest, 30],
  ['work', work, 36],
  ['tsd', motion, 49],
  ['mix', mixtures, 24],
  ['pnc', counting, 28],
  ['prob', probability, 24],
  ['mens', mensuration, 36],
  ['num', numbers, 36],
  ['ratio', agesEtc, 48],
  ['quad', quadratics, 24],
  ['di', di, 48],
  ['ds', dataSufficiency, 24],
]

const build = (): Question[] => {
  const out: Question[] = []
  const stems = new Set<string>()
  SEVERE_ARITHMETIC_FAMILIES.forEach(([key, frames, count], familyIndex) => {
    const r = rng(0x5eed + familyIndex * 7919)
    let made = 0, attempts = 0
    const perFrame = frames.map(() => 0)
    while (made < count) {
      if (++attempts > count * 400) throw new Error(`sva-${key}: could only build ${made}/${count} (frame ${made % frames.length} stalls)`)
      const frameIndex = made % frames.length
      const draft = frames[frameIndex](r)
      if (!draft) continue
      let choice
      try {
        choice = options4(draft.correct, draft.traps, made * 3 + familyIndex)
      } catch {
        continue
      }
      // Both the literal stem and the assembler's ASCII key must be new.
      const stemKey = assemblyKey(draft.question, [])
      if (stems.has(draft.question) || stems.has(stemKey)) continue
      stems.add(draft.question)
      stems.add(stemKey)
      made++
      perFrame[frameIndex]++
      out.push(severe({
        // The frame is part of the id so paper assembly can cap one frame per paper.
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

export const severeArithmeticQuestions: Question[] = build()
