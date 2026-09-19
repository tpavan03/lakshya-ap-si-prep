import type { Question, Subject } from '../data'

export type KnowledgeFact = {
  topic: string
  label: string
  value: string
  clue: string
  explanation: string
  source: string
}

const rotateAnswer = (options: string[], answer: number, seed: number) => {
  const shift = seed % options.length
  return {
    options: [...options.slice(shift), ...options.slice(0, shift)],
    answer: (answer - shift + options.length) % options.length,
  }
}

/**
 * Produces seven independently answerable exam-style retrieval and association
 * questions from every reviewed fact. Compound forms deliberately draw their
 * distractors from the same syllabus topic, making guessing by category harder.
 */
export const buildKnowledgeQuestions = (
  prefix: string,
  subject: Subject,
  facts: KnowledgeFact[],
): Question[] => {
  const grouped = new Map<string, KnowledgeFact[]>()
  for (const fact of facts) grouped.set(fact.topic, [...(grouped.get(fact.topic) ?? []), fact])

  const result: Question[] = []
  facts.forEach((fact, factIndex) => {
    const pool = grouped.get(fact.topic) ?? []
    if (pool.length < 4) throw new Error(`${fact.topic} needs at least four knowledge facts`)
    const position = pool.indexOf(fact)
    const at = (offset: number) => pool[(position + offset) % pool.length]
    const peers = [fact, at(1), at(2), at(3)]
    const id = (variant: number) => `${prefix}${String(factIndex + 1).padStart(3, '0')}v${variant}`
    const make = (
      variant: number,
      question: string,
      rawOptions: string[],
      rawAnswer: number,
      explanation: string,
      hint: string,
      difficulty: Question['difficulty'],
      seconds: number,
    ) => {
      const rotated = rotateAnswer(rawOptions, rawAnswer, factIndex + variant)
      result.push({
        id: id(variant), subject, topic: fact.topic, question,
        options: rotated.options, answer: rotated.answer, explanation, hint,
        difficulty, seconds, source: fact.source,
      })
    }

    make(1, `Which description is correctly associated with “${fact.label}”?`, peers.map(item => item.value), 0,
      fact.explanation, `Recall the defining feature of ${fact.label}.`, 'Medium', 55)
    make(2, `Which term, place, institution or event is best identified by this description: “${fact.value}”?`, peers.map(item => item.label), 0,
      fact.explanation, `Work backwards from the description within ${fact.topic}.`, 'Medium', 60)
    make(3, `${fact.clue} Which option does the clue identify?`, peers.map(item => item.label), 0,
      fact.explanation, `Link every part of the clue before choosing.`, 'Hard', 70)

    const correctPairs = [
      `${fact.label} — ${fact.value}`,
      `${at(1).label} — ${at(2).value}`,
      `${at(2).label} — ${at(3).value}`,
      `${at(3).label} — ${at(1).value}`,
    ]
    make(4, `With reference to ${fact.topic}, which pair is correctly matched?`, correctPairs, 0,
      `${fact.label} is correctly paired with ${fact.value}. ${fact.explanation}`, 'Check both halves of every pair.', 'Hard', 75)

    const incorrectPairs = [
      `${fact.label} — ${at(1).value}`,
      `${at(1).label} — ${at(1).value}`,
      `${at(2).label} — ${at(2).value}`,
      `${at(3).label} — ${at(3).value}`,
    ]
    make(5, `Three of the following ${fact.topic} pairs are accurate. Which pair is NOT accurately matched?`, incorrectPairs, 0,
      `${fact.label} should be matched with ${fact.value}, not ${at(1).value}.`, 'Eliminate the three exact associations first.', 'Hard', 80)

    make(6,
      `Consider the statements: 1. ${fact.label} is associated with ${fact.value}. 2. ${at(1).label} is associated with ${at(2).value}. Which is correct?`,
      ['1 only', '2 only', 'Both 1 and 2', 'Neither 1 nor 2'], 0,
      `Statement 1 is correct. Statement 2 swaps two entries: ${at(1).label} is associated with ${at(1).value}.`,
      'Verify each statement independently; one contains a same-topic swap.', 'Hard', 85)

    make(7,
      `A candidate writes this revision note: “${fact.clue}” Which completion makes the note factually precise?`,
      peers.map(item => `${item.label}: ${item.value}`), 0,
      `${fact.label}: ${fact.value}. ${fact.explanation}`, 'Prefer the option that satisfies every clue, not just one keyword.', 'Hard', 85)
  })
  return result
}
