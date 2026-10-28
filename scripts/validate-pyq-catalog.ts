import { paperAnswerKeys } from '../src/paperKeys'
import { niclPapers, previousPapers } from '../src/pyq'

const failures: string[] = []
const ids = new Set<string>()

const catalogue = [...previousPapers, ...niclPapers]
for (const paper of catalogue) {
  if (ids.has(paper.id)) failures.push(`Duplicate paper id: ${paper.id}`)
  ids.add(paper.id)
  if (!paper.paperUrl && !paper.answerKeyUrl) failures.push(`${paper.id} has neither a paper nor a key URL`)
  if (paper.interactive === 'Ready' && (!paper.paperUrl || !paper.answerKeyUrl || !paperAnswerKeys[paper.id])) {
    failures.push(`${paper.id} is reader-ready without a paper, key source and matched key`)
  }
  if (paper.questions !== undefined && paper.questions <= 0) failures.push(`${paper.id} has an invalid question count`)
  const key = paperAnswerKeys[paper.id]
  if (key && key.answers.length !== paper.questions) failures.push(`${paper.id} key length does not match source question count`)
  if (key?.answers.some(answer => !Number.isInteger(answer) || answer < 0 || answer >= (paper.options ?? 4))) failures.push(`${paper.id} key contains an invalid option`)
  if (key?.alternatives) for (const [index, answers] of Object.entries(key.alternatives)) {
    if (Number(index) < 0 || Number(index) >= key.answers.length || !answers.length || answers.some(answer => !Number.isInteger(answer) || answer < 0 || answer >= (paper.options ?? 4))) failures.push(`${paper.id} has an invalid multi-answer amendment`)
  }
  for (const url of [paper.paperUrl, paper.answerKeyUrl, paper.sourceUrl, paper.readerUrl].filter(Boolean)) {
    try { if (new URL(url!).protocol !== 'https:') failures.push(`${paper.id} has a non-HTTPS source`) }
    catch { failures.push(`${paper.id} has an invalid source URL`) }
  }
  if (paper.examId === 'nicl-ao' && paper.status !== 'Memory-based') failures.push(`${paper.id} must preserve its publisher-reconstruction label`)
}

if (failures.length) {
  console.error(failures.join('\n'))
  process.exit(1)
}

const ap = previousPapers.filter(paper => paper.state === 'Andhra Pradesh')
const external = previousPapers.filter(paper => paper.state !== 'Andhra Pradesh')
console.log(`Validated ${previousPapers.length} PYQ records (${ap.length} AP, ${external.length} other-state).`)
console.log(`Validated ${niclPapers.length} clearly labelled NICL publisher reconstructions.`)
console.log(`Validated ${Object.keys(paperAnswerKeys).length} matched answer keys with source question counts.`)

