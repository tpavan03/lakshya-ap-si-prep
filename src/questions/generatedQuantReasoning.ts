import type { Question } from '../data'

type Difficulty = Question['difficulty']

const contexts = ['a recruitment camp', 'a district office', 'a training academy', 'a cooperative store', 'a public works unit', 'an examination centre']
const names = ['Anil', 'Bhavya', 'Charan', 'Divya', 'Farhan', 'Gowri', 'Harsha', 'Indu']

const gcd = (a: number, b: number): number => b ? gcd(b, a % b) : Math.abs(a)
const lcm = (a: number, b: number) => Math.abs(a * b) / gcd(a, b)
const fmt = (n: number) => Number.isInteger(n) ? String(n) : String(Number(n.toFixed(2)))
const money = (n: number) => `₹${Math.round(n).toLocaleString('en-IN')}`
const mod = (n: number, m: number) => ((n % m) + m) % m

const rotateOptions = (correct: string, distractors: string[], seed: number) => {
  const values = [correct, ...distractors.filter(value => value !== correct)]
  for (let bump = 1; values.length < 4; bump += 1) values.push(`${correct} (${bump})`)
  const four = values.slice(0, 4)
  const shift = seed % 4
  const options = [...four.slice(shift), ...four.slice(0, shift)]
  return { options, answer: options.indexOf(correct) }
}

const numericOptions = (correct: number, seed: number, unit = '', spread = 1) => {
  const steps = [spread, -spread, spread * 2, -spread * 2, spread * 3]
  const alternatives: number[] = []
  for (const step of steps) {
    const candidate = Number((correct + step).toFixed(2))
    if (candidate >= 0 && candidate !== correct && !alternatives.includes(candidate)) alternatives.push(candidate)
  }
  const render = (value: number) => `${fmt(value)}${unit}`
  return rotateOptions(render(correct), alternatives.slice(0, 3).map(render), seed)
}

const make = (
  id: string,
  subject: 'Arithmetic' | 'Reasoning',
  topic: string,
  question: string,
  choice: { options: string[]; answer: number },
  explanation: string,
  hint: string,
  seconds: number,
  difficulty: Difficulty,
): Question => ({
  id,
  subject,
  topic,
  question,
  options: choice.options,
  answer: choice.answer,
  explanation,
  hint,
  seconds,
  difficulty,
  source: 'Original generated practice · AP SI syllabus pattern',
})

const level = (i: number): Difficulty => i % 5 < 3 ? 'Hard' : i % 5 === 3 ? 'Medium' : 'Easy'
const seconds = (i: number, base = 75) => base + (level(i) === 'Hard' ? 35 : level(i) === 'Medium' ? 15 : 0)

const arithmetic: Question[] = []
const reasoning: Question[] = []

// Each family varies both its mathematical structure and its context. The fixed seed makes
// the bank reproducible while keeping every rendered item, option set and solution auditable.
for (let i = 0; i < 60; i += 1) {
  const p = 8 + (i % 9) * 2
  const q = 5 + (i % 7)
  const base = 500 + i * 25
  const final = base * (100 + p) / 100 * (100 - q) / 100
  const net = Number(((final / base - 1) * 100).toFixed(2))
  const choice = numericOptions(Math.abs(net), i, net >= 0 ? '% increase' : '% decrease', 0.5)
  arithmetic.push(make(`gqa-pct-${i}`, 'Arithmetic', 'Percentages', `At ${contexts[i % contexts.length]}, a monthly count of ${base} first rises by ${p}% and then falls by ${q}%. What is the magnitude and direction of the net percentage change?`, choice, `Using multipliers, the final count is ${base}×${100 + p}/100×${100 - q}/100 = ${fmt(final)}. Relative change = (${fmt(final)}−${base})/${base}×100 = ${fmt(net)}%, so the required magnitude is ${fmt(Math.abs(net))}% ${net >= 0 ? 'increase' : 'decrease'}.`, 'Successive percentage changes must be multiplied, not simply added.', seconds(i, 70), level(i)))
}

for (let i = 0; i < 60; i += 1) {
  const a = 3 + i % 7, b = 5 + (i * 2) % 9, c = 4 + (i * 3) % 8
  const multiplier = 8 + i % 6
  const total = (a + b + c) * multiplier
  const target = b * multiplier
  const choice = numericOptions(target, i + 1, '', multiplier)
  arithmetic.push(make(`gqa-ratio-${i}`, 'Arithmetic', 'Ratio and proportion', `${names[i % names.length]}, ${names[(i + 1) % names.length]} and ${names[(i + 2) % names.length]} share ${total} verification files in the ratio ${a}:${b}:${c}. How many files does the second person receive?`, choice, `The ratio has ${a + b + c} parts, so one part is ${total}/${a + b + c} = ${multiplier}. The second share is ${b}×${multiplier} = ${target}.`, 'Add the ratio terms, find one part, then take the required share.', seconds(i, 55), level(i)))
}

for (let i = 0; i < 60; i += 1) {
  const n = 6 + i % 7, oldAvg = 24 + i % 13, removed = 16 + (i * 3) % 19, added = 31 + (i * 5) % 23
  const newAvg = Number((oldAvg + (added - removed) / n).toFixed(2))
  const choice = numericOptions(newAvg, i + 2, '', 1 / n)
  arithmetic.push(make(`gqa-avg-${i}`, 'Arithmetic', 'Average', `The average score of ${n} trainees is ${oldAvg}. A score of ${removed} is corrected to ${added}. What is the corrected average?`, choice, `Original total = ${n}×${oldAvg}. The correction increases it by ${added}−${removed} = ${added - removed}. New average = ${oldAvg}+${added - removed}/${n} = ${fmt(newAvg)}.`, 'A correction changes the total only by new value minus old value.', seconds(i, 55), level(i)))
}

for (let i = 0; i < 60; i += 1) {
  const cp = 400 + 40 * (i % 15), profit = 10 + 2 * (i % 8), discount = 8 + 2 * (i % 7)
  const sp = cp * (100 + profit) / 100
  const mp = sp * 100 / (100 - discount)
  const rounded = Math.round(mp)
  const choice = numericOptions(rounded, i + 3, '', 10)
  arithmetic.push(make(`gqa-pl-${i}`, 'Arithmetic', 'Profit, loss and discount', `A supplier buys equipment for ${money(cp)}, wants a ${profit}% profit, and announces a ${discount}% discount on the marked price. To the nearest rupee, what marked price should be printed?`, choice, `Required selling price = ${money(cp)}×${100 + profit}/100 = ${money(sp)}. Since this is ${100 - discount}% of marked price, marked price = ${fmt(sp)}×100/${100 - discount} = ${money(rounded)} to the nearest rupee.`, 'Move from cost price to selling price, then undo the discount.', seconds(i, 75), level(i)))
}

for (let i = 0; i < 60; i += 1) {
  const principal = 3000 + 500 * (i % 12), rate = 5 + i % 9, years = 2 + i % 5
  const amount = principal * (1 + rate * years / 100)
  const choice = numericOptions(amount, i, '', 100)
  arithmetic.push(make(`gqa-si-${i}`, 'Arithmetic', 'Simple interest', `A welfare advance of ${money(principal)} carries simple interest at ${rate}% per annum for ${years} years. What total amount is payable?`, choice, `Interest = ${principal}×${rate}×${years}/100 = ${money(principal * rate * years / 100)}. Adding principal gives ${money(amount)}.`, 'Use SI = PRT/100, then add the principal.', seconds(i, 55), level(i)))
}

for (let i = 0; i < 60; i += 1) {
  const principal = 5000 + 1000 * (i % 10), rate = 5 + i % 6, years = 2 + i % 3
  const amount = Number((principal * ((100 + rate) / 100) ** years).toFixed(2))
  const interest = Number((amount - principal).toFixed(2))
  const choice = numericOptions(interest, i + 1, '', 50)
  arithmetic.push(make(`gqa-ci-${i}`, 'Arithmetic', 'Compound interest', `${money(principal)} is deposited at ${rate}% compound interest per annum for ${years} years. What compound interest accrues, rounded to two decimals?`, choice, `Amount = ${principal}×(1+${rate}/100)^${years} = ${fmt(amount)}. Compound interest = ${fmt(amount)}−${principal} = ${fmt(interest)}.`, 'Apply the annual growth factor once for each year, then subtract principal.', seconds(i, 80), level(i)))
}

for (let i = 0; i < 60; i += 1) {
  const x = 8 + i % 9, y = 12 + (i * 2) % 11
  const together = Number((x * y / (x + y)).toFixed(2))
  const choice = numericOptions(together, i + 2, ' days', 0.5)
  arithmetic.push(make(`gqa-work-${i}`, 'Arithmetic', 'Time and work', `${names[i % names.length]} can audit a file set in ${x} days and ${names[(i + 3) % names.length]} can audit it in ${y} days. Working together at constant rates, how many days do they need?`, choice, `Combined daily rate = 1/${x}+1/${y} = ${x + y}/${x * y}. Time is its reciprocal, ${x * y}/${x + y} = ${fmt(together)} days.`, 'Add one-day work rates and take the reciprocal.', seconds(i, 75), level(i)))
}

for (let i = 0; i < 60; i += 1) {
  const fillA = 8 + i % 7, fillB = 12 + i % 9, drain = lcm(fillA, fillB) + 12 + i % 10
  const rate = 1 / fillA + 1 / fillB - 1 / drain
  const time = Number((1 / rate).toFixed(2))
  const choice = numericOptions(time, i + 3, ' hours', 0.5)
  arithmetic.push(make(`gqa-pipes-${i}`, 'Arithmetic', 'Pipes and cisterns', `Two inlet pipes fill a tank in ${fillA} and ${fillB} hours, while a leak empties a full tank in ${drain} hours. If all three operate together, how long will an empty tank take to fill?`, choice, `Net hourly fill = 1/${fillA}+1/${fillB}−1/${drain} = ${fmt(rate)}. The filling time is 1/${fmt(rate)} = ${fmt(time)} hours.`, 'Add inlet rates and subtract the leak rate.', seconds(i, 85), level(i)))
}

for (let i = 0; i < 60; i += 1) {
  const train = 120 + 10 * (i % 13), platform = 150 + 15 * (i % 11), speedKmh = 36 + 9 * (i % 7)
  const speedMs = speedKmh * 5 / 18
  const time = Number(((train + platform) / speedMs).toFixed(2))
  const choice = numericOptions(time, i, ' seconds', 2)
  arithmetic.push(make(`gqa-train-${i}`, 'Arithmetic', 'Trains', `A ${train} m train moving at ${speedKmh} km/h must completely clear a ${platform} m platform. How many seconds does the crossing take?`, choice, `It covers ${train}+${platform} = ${train + platform} m. Speed = ${speedKmh}×5/18 = ${fmt(speedMs)} m/s. Time = ${train + platform}/${fmt(speedMs)} = ${fmt(time)} seconds.`, 'Use train length plus platform length and convert speed to m/s.', seconds(i, 75), level(i)))
}

for (let i = 0; i < 60; i += 1) {
  const still = 10 + i % 8, stream = 2 + i % 4, distance = lcm(still + stream, still - stream) * (i + 2)
  const time = Number((distance / (still + stream) + distance / (still - stream)).toFixed(2))
  const choice = numericOptions(time, i + 1, ' hours', 0.5)
  arithmetic.push(make(`gqa-boat-${i}`, 'Arithmetic', 'Boats and streams', `A patrol boat moves at ${still} km/h in still water and the current is ${stream} km/h. How long does it take to travel ${distance} km downstream and return the same distance upstream?`, choice, `Downstream speed = ${still}+${stream} = ${still + stream}; upstream speed = ${still}−${stream} = ${still - stream}. Total time = ${distance}/${still + stream}+${distance}/${still - stream} = ${fmt(time)} hours.`, 'Current helps downstream and opposes upstream; add the two travel times.', seconds(i, 85), level(i)))
}

for (let i = 0; i < 60; i += 1) {
  const low = 30 + i % 11, high = 50 + i % 13, mean = low + 4 + i % Math.max(2, high - low - 5)
  const left = high - mean, right = mean - low
  const d = gcd(left, right), x = left / d, y = right / d
  const choice = rotateOptions(`${x}:${y}`, [`${y}:${x}`, `${x + 1}:${y}`, `${x}:${y + 1}`], i)
  arithmetic.push(make(`gqa-mix-${i}`, 'Arithmetic', 'Mixtures and alligation', `Grain costing ${money(low)}/kg is mixed with grain costing ${money(high)}/kg to obtain a blend worth ${money(mean)}/kg. In what ratio should cheaper and dearer grain be mixed?`, choice, `By alligation, cheaper:dearer = (${high}−${mean}):(${mean}−${low}) = ${left}:${right} = ${x}:${y}.`, 'Cross-subtract the mean price from the two component prices.', seconds(i, 65), level(i)))
}

for (let i = 0; i < 60; i += 1) {
  const capA = 10 + i % 9, capB = 12 + (i * 2) % 11, monthsA = 6 + i % 7, monthsB = 5 + (i * 3) % 8
  const ratioA = capA * monthsA, ratioB = capB * monthsB, totalProfit = (ratioA + ratioB) * 100
  const bShare = ratioB * 100
  const choice = numericOptions(bShare, i + 2, '', 500)
  arithmetic.push(make(`gqa-partner-${i}`, 'Arithmetic', 'Partnership', `${names[i % names.length]} invests ${money(capA * 1000)} for ${monthsA} months and ${names[(i + 1) % names.length]} invests ${money(capB * 1000)} for ${monthsB} months. If profit is ${money(totalProfit)}, what is the second investor’s share?`, choice, `Profit ratio = ${capA}×${monthsA}:${capB}×${monthsB} = ${ratioA}:${ratioB}. Since total profit was chosen as ${ratioA + ratioB} parts of ₹100, the second share is ${money(bShare)}.`, 'Divide profit in the ratio capital × time.', seconds(i, 80), level(i)))
}

for (let i = 0; i < 60; i += 1) {
  const child = 10 + i % 12, gap = 22 + i % 10, years = 4 + i % 7
  const ratio = Number(((child + gap + years) / (child + years)).toFixed(2))
  const choice = numericOptions(ratio, i + 3, ':1', 0.25)
  arithmetic.push(make(`gqa-age-${i}`, 'Arithmetic', 'Ages', `A parent is ${gap} years older than a child who is now ${child}. What will the ratio of the parent’s age to the child’s age be after ${years} years?`, choice, `After ${years} years their ages are ${child + gap + years} and ${child + years}. The ratio is ${child + gap + years}/${child + years} = ${fmt(ratio)}:1.`, 'Add the same number of years to both present ages.', seconds(i, 55), level(i)))
}

for (let i = 0; i < 60; i += 1) {
  const radius = 7 + i % 9, height = 10 + (i * 2) % 13
  const volume = Number((22 / 7 * radius * radius * height).toFixed(2))
  const choice = numericOptions(volume, i, ' cm³', 22)
  arithmetic.push(make(`gqa-mens-${i}`, 'Arithmetic', 'Mensuration', `A cylindrical evidence container has internal radius ${radius} cm and height ${height} cm. Using π = 22/7, what is its capacity in cubic centimetres?`, choice, `Capacity = πr²h = 22/7×${radius}²×${height} = ${fmt(volume)} cm³.`, 'Use cylinder volume πr²h and retain the stated value of π.', seconds(i, 70), level(i)))
}

for (let i = 0; i < 60; i += 1) {
  const a = 5 + i % 9, b = 7 + (i * 2) % 10
  const hyp = Math.sqrt(a * a + b * b), area = a * b / 2
  const choice = numericOptions(area, i + 1, ' cm²', 2.5)
  arithmetic.push(make(`gqa-geo-${i}`, 'Arithmetic', 'Geometry', `A right triangular plot has perpendicular sides ${a} cm and ${b} cm (its hypotenuse is about ${fmt(hyp)} cm). What is its area?`, choice, `Area of a right triangle = 1/2×${a}×${b} = ${fmt(area)} cm². The hypotenuse information is not needed.`, 'Use only the perpendicular base and height.', seconds(i, 55), level(i)))
}

for (let i = 0; i < 60; i += 1) {
  const divisor = 7 + i % 12, exponent = 5 + i % 11, base = 2 + i % 7
  let remainder = 1
  for (let k = 0; k < exponent; k += 1) remainder = remainder * base % divisor
  const choice = numericOptions(remainder, i + 2, '', 1)
  arithmetic.push(make(`gqa-rem-${i}`, 'Arithmetic', 'Number system', `What is the remainder when ${base}^${exponent} is divided by ${divisor}?`, choice, `Reduce after every multiplication modulo ${divisor}. Repeating ${exponent} times gives ${base}^${exponent} ≡ ${remainder} (mod ${divisor}), so the remainder is ${remainder}.`, 'Build the power through its repeating remainder cycle.', seconds(i, 75), level(i)))
}

for (let i = 0; i < 60; i += 1) {
  const x = 3 + i % 11, sum = 2 * x + 3 + i % 5, product = x * (sum - x)
  const other = sum - x
  const choice = numericOptions(other, i + 3, '', 1)
  arithmetic.push(make(`gqa-alg-${i}`, 'Arithmetic', 'Algebra', `Two positive numbers have sum ${sum} and product ${product}. If one number is ${x}, what is the other number?`, choice, `Let the other number be y. From x+y=${sum}, y=${sum}−${x}=${other}; checking, ${x}×${other}=${product}.`, 'Use the sum first and verify with the product.', seconds(i, 55), level(i)))
}

for (let i = 0; i < 60; i += 1) {
  const red = 3 + i % 6, blue = 4 + (i * 2) % 7, green = 2 + (i * 3) % 5, total = red + blue + green
  const numerator = red + blue, d = gcd(numerator, total)
  const correctFraction = `${numerator / d}/${total / d}`
  const distractors = [`${red}/${total}`, `${blue}/${total}`, `${green}/${total}`, `${numerator}/${total + 1}`, `${Math.max(1, numerator - 1)}/${total}`]
    .filter((value, index, all) => value !== correctFraction && all.indexOf(value) === index)
  const choice = rotateOptions(correctFraction, distractors.slice(0, 3), i)
  arithmetic.push(make(`gqa-prob-${i}`, 'Arithmetic', 'Probability', `A bag contains ${red} red, ${blue} blue and ${green} green tokens. One token is drawn at random. What is the probability that it is red or blue?`, choice, `Favourable tokens = ${red}+${blue}=${numerator}; total = ${total}. Probability = ${numerator}/${total} = ${numerator / d}/${total / d}.`, 'For mutually exclusive colours, add their counts before dividing by total.', seconds(i, 55), level(i)))
}

// Reasoning: 15 independent families, each exercising a different inference skill.
for (let i = 0; i < 60; i += 1) {
  const start = 2 + i, delta = 2 + i % 6
  const seq = [start]
  for (let k = 1; k < 5; k += 1) seq.push(seq[k - 1] + delta + 2 * (k - 1))
  const next = seq[4] + delta + 8
  const choice = numericOptions(next, i, '', 2)
  reasoning.push(make(`gqr-series-${i}`, 'Reasoning', 'Number series', `Complete the series: ${seq.join(', ')}, ?`, choice, `The successive differences are ${[0, 1, 2, 3].map(k => delta + 2 * k).join(', ')}; the next difference is ${delta + 8}. Thus ${seq[4]}+${delta + 8}=${next}.`, 'Compare consecutive differences and then compare those differences.', seconds(i, 60), level(i)))
}

for (let i = 0; i < 60; i += 1) {
  const first = 1 + i % 8, jump = 2 + i % 4
  const positions = Array.from({ length: 5 }, (_, k) => mod(first - 1 + jump * k + k * (k - 1) / 2, 26) + 1)
  const nextPos = mod(positions[4] - 1 + jump + 4, 26) + 1
  const letters = positions.map(p => String.fromCharCode(64 + p))
  const correct = String.fromCharCode(64 + nextPos)
  const choice = rotateOptions(correct, [1, 2, 3].map(d => String.fromCharCode(65 + mod(nextPos - 1 + d, 26))), i + 1)
  reasoning.push(make(`gqr-alpha-${i}`, 'Reasoning', 'Alphabet series', `On sequence card ${i + 1}, which letter continues the pattern ${letters.join(', ')}, ?`, choice, `Alphabet jumps are +${jump}, +${jump + 1}, +${jump + 2}, +${jump + 3}; the next is +${jump + 4}. Applying it cyclically to ${letters[4]} gives ${correct}.`, 'Convert letters to positions and inspect the changing jumps.', seconds(i, 60), level(i)))
}

for (let i = 0; i < 60; i += 1) {
  const words = ['PATROL', 'REPORT', 'SIGNAL', 'GUARD', 'CRIME', 'BADGE']
  const word = words[i % words.length], shift = 1 + i % 5
  const encode = (value: string, amount: number) => [...value].map(ch => String.fromCharCode(65 + mod(ch.charCodeAt(0) - 65 + amount, 26))).join('')
  const correct = encode(word, shift)
  const choice = rotateOptions(correct, [encode(word, shift + 1), encode(word, -shift), [...correct].reverse().join('')], i + 2)
  reasoning.push(make(`gqr-code-${i}`, 'Reasoning', 'Coding-decoding', `In a code, every letter is shifted ${shift} place${shift > 1 ? 's' : ''} forward cyclically (Z returns to A). How is ${word} written?`, choice, `${word.split('').map(ch => `${ch}→${encode(ch, shift)}`).join(', ')}, giving ${correct}.`, 'Apply the same cyclic alphabet shift to every letter.', seconds(i, 55), level(i)))
}

const directionName = (x: number, y: number) => y > 0 ? (x > 0 ? 'north-east' : x < 0 ? 'north-west' : 'north') : y < 0 ? (x > 0 ? 'south-east' : x < 0 ? 'south-west' : 'south') : x > 0 ? 'east' : 'west'
for (let i = 0; i < 60; i += 1) {
  const north = 5 + i % 9, east = 6 + (i * 2) % 11, south = 2 + (i * 3) % north, west = 1 + (i * 5) % east
  const x = east - west, y = north - south, dist = Number(Math.sqrt(x * x + y * y).toFixed(2)), dir = directionName(x, y)
  const correct = `${fmt(dist)} m ${dir}`
  const choice = rotateOptions(correct, [`${fmt(Math.abs(x) + Math.abs(y))} m ${dir}`, `${fmt(dist)} m ${directionName(-x, y)}`, `${fmt(dist)} m ${directionName(x, -y)}`], i + 3)
  reasoning.push(make(`gqr-dir-${i}`, 'Reasoning', 'Directions', `A cadet walks ${north} m north, ${east} m east, ${south} m south and ${west} m west. What is the cadet’s straight-line distance and direction from the start?`, choice, `Net displacement is ${x} m east and ${y} m north. Distance = √(${x}²+${y}²) = ${fmt(dist)} m, in the ${dir} direction.`, 'Cancel opposite movements, then use Pythagoras on the net components.', seconds(i, 75), level(i)))
}

for (let i = 0; i < 60; i += 1) {
  const total = 35 + i % 31, top = 5 + (i * 3) % 20, bottom = total - top + 1
  const choice = numericOptions(bottom, i, 'th', 1)
  reasoning.push(make(`gqr-rank-${i}`, 'Reasoning', 'Ranking', `In a merit list of ${total} candidates, ${names[i % names.length]} is ${top}th from the top. What is the rank from the bottom?`, choice, `Bottom rank = total−top rank+1 = ${total}−${top}+1 = ${bottom}.`, 'Add the two ranks and subtract one because the candidate is counted twice.', seconds(i, 45), level(i)))
}

const kinCases = [
  ['mother’s brother', 'maternal uncle'], ['father’s sister', 'paternal aunt'], ['mother’s mother', 'maternal grandmother'],
  ['father’s father', 'paternal grandfather'], ['sister’s son', 'nephew'], ['brother’s daughter', 'niece'],
] as const
for (let i = 0; i < 60; i += 1) {
  const [relation, correct] = kinCases[i % kinCases.length]
  const alternatives = ['maternal uncle', 'paternal aunt', 'maternal grandmother', 'paternal grandfather', 'nephew', 'niece'].filter(x => x !== correct)
  const choice = rotateOptions(correct, alternatives.slice(i % 3, i % 3 + 3), i + 1)
  reasoning.push(make(`gqr-blood-${i}`, 'Reasoning', 'Blood relations', `Candidate ${101 + i}, ${names[i % names.length]}, points to a person and says, “That person is my ${relation}.” How is that person related to ${names[i % names.length]}?`, choice, `Following the relationship phrase directly, ${relation} means ${correct}.`, 'Resolve the possessive chain from the speaker outward, one link at a time.', seconds(i, 50), level(i)))
}

const syllogisms = [
  { s: 'All inspectors are officers. No officer is a minor.', c: 'No inspector is a minor.', e: 'Inspectors lie wholly inside officers, which do not overlap minors.' },
  { s: 'Some runners are swimmers. All swimmers are trained.', c: 'Some runners are trained.', e: 'The runners who are swimmers inherit the trained property.' },
  { s: 'No files are toys. Some records are files.', c: 'Some records are not toys.', e: 'The records that are files cannot be toys.' },
  { s: 'All maps are documents. All documents are records.', c: 'All maps are records.', e: 'The universal chain maps → documents → records is transitive.' },
  { s: 'Some guards are athletes. No athlete is careless.', c: 'Some guards are not careless.', e: 'Those guards who are athletes fall under the no-careless rule.' },
] as const
for (let i = 0; i < 60; i += 1) {
  const item = syllogisms[i % syllogisms.length]
  const correct = 'Conclusion follows'
  const choice = rotateOptions(correct, ['Conclusion does not follow', 'Statements are inconsistent', 'Possibility alone follows'], i + 2)
  reasoning.push(make(`gqr-syll-${i}`, 'Reasoning', 'Syllogism', `Statements: ${item.s} Proposed conclusion: “${item.c}” Which assessment is valid? [Set ${i + 1}]`, choice, `${item.e} Therefore the proposed conclusion necessarily follows.`, 'Draw only the stated set inclusions and exclusions; do not assume converse relations.', seconds(i, 65), level(i)))
}

for (let i = 0; i < 60; i += 1) {
  const n = 5 + i, start = 2 + i % 4, target = start + 2 + i % (Math.min(n, 12) - 2)
  const before = target - 1
  const choice = numericOptions(before, i + 3, '', 1)
  reasoning.push(make(`gqr-order-${i}`, 'Reasoning', 'Order and sequence', `Tasks T1 to T${n + start} are completed in numerical order. If the sequence begins at T${start}, how many tasks are completed before T${target}?`, choice, `The completed tasks before T${target} are T${start} through T${target - 1}, a count of ${target}−${start} = ${target - start}.`, 'Count positions relative to the stated starting task.', seconds(i, 45), level(i)))
}

for (let i = 0; i < 60; i += 1) {
  const year = 2024 + i, offset = (i * 3 + 2) % 7
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
  const startDay = days[offset], dayGap = 20 + i % 20, target = days[(offset + dayGap % 7) % 7]
  const choice = rotateOptions(target, [1, 2, 3].map(d => days[(offset + dayGap + d) % 7]), i)
  reasoning.push(make(`gqr-cal-${i}`, 'Reasoning', 'Calendar', `In a scheduling exercise, 1 January ${year} is stipulated to be ${startDay}. What weekday is ${dayGap + 1} January of that year?`, choice, `The later date is ${dayGap} days after 1 January. Since ${dayGap} mod 7 = ${dayGap % 7}, move ${dayGap % 7} weekdays forward from ${startDay} to get ${target}.`, 'Use the difference between date numbers, then reduce it modulo 7.', seconds(i, 55), level(i)))
}

for (let i = 0; i < 60; i += 1) {
  const hour = 1 + i % 11, minute = (i * 5) % 60
  const hAngle = 30 * hour + 0.5 * minute, mAngle = 6 * minute
  const raw = Math.abs(hAngle - mAngle), angle = Math.min(raw, 360 - raw)
  const choice = numericOptions(angle, i + 1, '°', 2.5)
  reasoning.push(make(`gqr-clock-${i}`, 'Reasoning', 'Clock', `What is the smaller angle between the hands of a correct clock at ${hour}:${String(minute).padStart(2, '0')}?`, choice, `Hour-hand angle = 30×${hour}+0.5×${minute} = ${fmt(hAngle)}°. Minute-hand angle = 6×${minute} = ${fmt(mAngle)}°. The smaller separation is ${fmt(angle)}°.`, 'The hour hand advances 0.5° per minute; compare both positions from 12.', seconds(i, 65), level(i)))
}

for (let i = 0; i < 60; i += 1) {
  const n = 3 + i % 6, exactTwo = 12 * Math.max(0, n - 2)
  const choice = numericOptions(exactTwo, i + 2, '', Math.max(1, n - 2))
  reasoning.push(make(`gqr-cube-${i}`, 'Reasoning', 'Cubes', `A cube with edge ${n * (i + 2)} cm is painted on all six faces and cut into cubes of edge ${i + 2} cm. How many small cubes have exactly two painted faces?`, choice, `There are ${n * (i + 2)}/${i + 2}=${n} pieces per edge. Exactly-two-face cubes lie on edges but exclude corners. Each of 12 edges contributes ${n}−2=${n - 2}, so total = 12×${n - 2}=${exactTwo}.`, 'First find pieces per edge, then count non-corner pieces on all 12 edges.', seconds(i, 65), level(i)))
}

for (let i = 0; i < 60; i += 1) {
  const a = 40 + i % 20, b = 35 + (i * 2) % 18, both = 10 + i % 12, neither = 5 + i % 9
  const total = a + b - both + neither
  const onlyA = a - both
  const choice = numericOptions(onlyA, i + 3, '', 2)
  reasoning.push(make(`gqr-venn-${i}`, 'Reasoning', 'Venn diagrams', `Among ${total} candidates, ${a} study Arithmetic, ${b} study Reasoning, ${both} study both, and ${neither} study neither. How many study only Arithmetic?`, choice, `Only Arithmetic = all Arithmetic−both = ${a}−${both}=${onlyA}. The total and neither values provide a consistency check.`, 'Subtract the intersection from the Arithmetic set.', seconds(i, 60), level(i)))
}

for (let i = 0; i < 60; i += 1) {
  const a = 3 + i % 7, b = 4 + (i * 2) % 9, n = lcm(a, b) * (2 + i % 4)
  const correct = 'Both statements together are sufficient'
  const choice = rotateOptions(correct, ['Statement I alone is sufficient', 'Statement II alone is sufficient', 'Even both statements are insufficient'], i)
  reasoning.push(make(`gqr-ds-${i}`, 'Reasoning', 'Data sufficiency', `What is the positive integer N? I. N is a multiple of ${a} and ${b}. II. N is less than ${n + lcm(a, b)} but at least ${n}. [Case ${i + 1}]`, choice, `I says N is a multiple of LCM(${a},${b})=${lcm(a, b)} but allows many values. II gives an interval but allows many integers. Together, the interval [${n}, ${n + lcm(a, b)}) contains exactly one multiple of ${lcm(a, b)}, namely ${n}.`, 'Find the LCM, then test how many of its multiples lie in the stated interval.', seconds(i, 85), level(i)))
}

for (let i = 0; i < 60; i += 1) {
  const gain = 2 + i % 8, hours = 6 + (i * 3) % 19, interval = 2 + i % 4
  const gained = Number((hours / interval * gain).toFixed(2))
  const choice = numericOptions(gained, i + 1, ' minutes', 1)
  reasoning.push(make(`gqr-clockgain-${i}`, 'Reasoning', 'Clock', `A faulty clock gains ${gain} minutes every ${interval} hours. If it is set correctly now, how many minutes ahead will it be after ${hours} real hours?`, choice, `Number of ${interval}-hour periods = ${hours}/${interval}. Gain = ${hours}/${interval}×${gain} = ${fmt(gained)} minutes.`, 'Scale the stated gain in direct proportion to elapsed real time.', seconds(i, 55), level(i)))
}

for (let i = 0; i < 60; i += 1) {
  const inputs = Array.from({ length: 5 }, (_, k) => 11 + Math.floor(i / 20) * 100 + mod(i * 7 + k * 13, 70))
  const sorted = [...inputs].sort((a, b) => a - b)
  const correct = sorted[2]
  const choice = numericOptions(correct, i + 2, '', 2)
  reasoning.push(make(`gqr-machine-${i}`, 'Reasoning', 'Input-output', `A machine arranges the input ${inputs.join(' ')} in ascending order by repeatedly placing the smallest remaining value at the next left position. Which value occupies the middle position when processing ends?`, choice, `Ascending order is ${sorted.join(', ')}. With five entries, the third value is the middle one: ${correct}.`, 'Complete the selection-style ordering, then take position three.', seconds(i, 55), level(i)))
}

for (let i = 0; i < 60; i += 1) {
  const people = 5 + i % 4, first = 1 + i % people, second = 1 + (i * 2 + 1) % people
  const apart = Math.min(mod(second - first, people), mod(first - second, people))
  const choice = numericOptions(apart, i + 3, ' seat gaps', 1)
  reasoning.push(make(`gqr-circle-${i}`, 'Reasoning', 'Circular arrangement', `Number ${people} seats clockwise from 1 to ${people} around a circle. What is the smaller number of seat-to-seat gaps between seat ${first} and seat ${second}? [Arrangement ${i + 1}]`, choice, `Clockwise gaps = ${mod(second - first, people)} and anticlockwise gaps = ${mod(first - second, people)}. The smaller is ${apart}.`, 'On a circle, compare clockwise and anticlockwise distances modulo the number of seats.', seconds(i, 55), level(i)))
}

export const generatedQuantReasoningQuestions: Question[] = [...arithmetic, ...reasoning]

export const generatedQuantReasoningStats = {
  arithmetic: arithmetic.length,
  reasoning: reasoning.length,
  total: arithmetic.length + reasoning.length,
}
