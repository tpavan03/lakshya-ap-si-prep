import { ap2018PrelimsPaper1SetC } from '../src/paperKeys'
import { previousPapers } from '../src/pyq'

const failures: string[] = []
const ids = new Set<string>()

for (const paper of previousPapers) {
  if (ids.has(paper.id)) failures.push(`Duplicate paper id: ${paper.id}`)
  ids.add(paper.id)
  if (!paper.paperUrl && !paper.answerKeyUrl) failures.push(`${paper.id} has neither a paper nor a key URL`)
  if (paper.interactive === 'Ready' && (!paper.paperUrl || !paper.readerUrl || !paper.answerKeyUrl)) {
    failures.push(`${paper.id} is reader-ready without paper, reader and answer-key URLs`)
  }
  if (paper.questions !== undefined && paper.questions <= 0) failures.push(`${paper.id} has an invalid question count`)
}

if (ap2018PrelimsPaper1SetC.length !== 100) failures.push('2018 Paper I Set C must have exactly 100 answers')
if (ap2018PrelimsPaper1SetC.some(answer => answer < 0 || answer > 3)) failures.push('2018 Paper I Set C contains an invalid option')

if (failures.length) {
  console.error(failures.join('\n'))
  process.exit(1)
}

const ap = previousPapers.filter(paper => paper.state === 'Andhra Pradesh')
const external = previousPapers.filter(paper => paper.state !== 'Andhra Pradesh')
console.log(`Validated ${previousPapers.length} PYQ records (${ap.length} AP, ${external.length} other-state).`)
console.log('Validated 2018 Prelims Paper I Set C: 100 official-key answers.')

