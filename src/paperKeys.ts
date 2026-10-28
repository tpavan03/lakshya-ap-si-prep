// 2018 AP SI Preliminary Paper I, Booklet C. Values are zero-based option indexes.
// Transcribed from the APSLPRB preliminary key and cross-checked against the solved copy (100/100).
export const ap2018PrelimsPaper1SetC = [
  2, 0, 1, 0, 2, 2, 2, 1, 0, 3, 0, 0, 1, 0, 2, 3, 1, 2, 3, 2,
  3, 0, 0, 0, 0, 3, 2, 0, 1, 2, 0, 1, 3, 3, 3, 1, 0, 3, 0, 0,
  1, 1, 3, 2, 3, 2, 3, 1, 2, 1, 3, 2, 3, 3, 0, 1, 0, 2, 0, 0,
  3, 1, 1, 2, 3, 1, 2, 0, 1, 3, 1, 1, 0, 3, 2, 3, 2, 3, 2, 3,
  0, 1, 3, 0, 0, 2, 2, 2, 0, 2, 1, 3, 0, 3, 2, 1, 3, 2, 1, 1,
] as const


// AP 2023: Booklet A from the board key embedded in the original scan,
// cross-checked 100/100 against the APSLPRB-hosted final key on 2026-10-28.
// NICL keys below are publisher answers to memory-based reconstructions.
export const ap2023PrelimsPaper1SetA = [
  1, 1, 3, 2, 3, 3, 3, 3, 0, 0, 2, 3, 1, 3, 1, 2, 0, 3, 0, 3,
  3, 3, 3, 1, 3, 1, 3, 1, 1, 1, 1, 3, 2, 2, 2, 2, 1, 1, 1, 1,
  2, 2, 3, 0, 2, 2, 1, 2, 3, 2, 3, 1, 0, 3, 2, 2, 0, 1, 1, 2,
  1, 3, 1, 2, 3, 3, 2, 2, 1, 2, 3, 2, 0, 2, 2, 0, 2, 1, 2, 1,
  3, 2, 3, 1, 2, 3, 1, 3, 2, 1, 0, 3, 3, 2, 0, 0, 2, 1, 2, 1,
] as const

export const nicl2024PublisherKey = [
  3, 1, 2, 2, 4, 4, 3, 1, 0, 1, 4, 0, 4, 0, 3, 1, 1, 2, 2, 0,
  4, 2, 3, 2, 0, 2, 4, 2, 1, 3, 4, 2, 3, 3, 4, 2, 2, 3, 3, 2,
  1, 3, 4, 0, 1, 2, 3, 4, 2, 3, 4, 0, 2, 0, 2, 4, 3, 1, 0, 2,
  1, 3, 4, 2, 0, 1, 3, 1, 1, 2, 4, 0, 3, 0, 1, 0, 4, 2, 1, 4,
  1, 0, 3, 2, 2, 4, 1, 3, 0, 2, 4, 1, 3, 1, 2, 3, 0, 1, 1, 0,
] as const

export const nicl2025PublisherKey = [
  3, 3, 3, 1, 2, 1, 4, 3, 4, 1, 0, 1, 2, 0, 4, 1, 3, 0, 1, 2,
  4, 3, 1, 2, 1, 1, 2, 4, 0, 1, 2, 2, 4, 1, 4, 3, 1, 0, 0, 2,
  3, 4, 4, 0, 3, 4, 1, 2, 3, 1, 3, 0, 1, 2, 1, 0, 3, 4, 0, 1,
  1, 1, 2, 4, 2, 0, 0, 4, 3, 3, 0, 2, 2, 0, 1, 1, 1, 0, 2, 2,
  1, 1, 1, 0, 3, 3, 2, 4, 4, 3, 0, 3, 1, 1, 2, 4, 4, 1, 2, 3,
] as const

// Booklet C verified from the 2023 Paper II scan cover. Final-key Q95
// accepts option 1 OR option 4; see alternatives in the key registry.
export const ap2023PrelimsPaper2SetC = [
  2, 1, 0, 2, 0, 3, 1, 2, 3, 3, 1, 3, 0, 0, 3, 0, 0, 3, 0, 3,
  0, 3, 3, 2, 1, 0, 0, 2, 3, 2, 0, 3, 2, 3, 1, 2, 1, 1, 2, 0,
  1, 2, 1, 2, 0, 1, 3, 0, 3, 1, 1, 0, 2, 1, 3, 3, 3, 2, 1, 0,
  2, 0, 1, 3, 1, 3, 1, 3, 0, 2, 0, 2, 1, 2, 1, 1, 0, 0, 0, 0,
  2, 1, 1, 3, 2, 2, 1, 0, 1, 0, 0, 3, 2, 2, 0, 0, 1, 3, 3, 0,
] as const

export type PaperAnswerKey = { answers: readonly number[]; label: string; alternatives?: Record<number, readonly number[]> }
export const paperAnswerKeys: Record<string, PaperAnswerKey> = {
  'ap-2018-prelims-1': { answers: ap2018PrelimsPaper1SetC, label: 'APSLPRB key · Booklet C' },
  'ap-2023-prelims-1': { answers: ap2023PrelimsPaper1SetA, label: 'APSLPRB final key · Booklet A · 100/100 cross-checked' },
  'ap-2023-prelims-2': { answers: ap2023PrelimsPaper2SetC, label: 'APSLPRB final key · Booklet C · Q95 accepts A or D', alternatives: { 94: [0, 3] } },
  'nicl-2024-prelims': { answers: nicl2024PublisherKey, label: 'BankersAdda publisher answers · memory-based' },
  'nicl-2025-prelims': { answers: nicl2025PublisherKey, label: 'Adda247 publisher answers · memory-based' },
}

export function acceptedPaperAnswers(key: PaperAnswerKey, index: number): readonly number[] {
  return key.alternatives?.[index] ?? [key.answers[index]]
}
export function paperAnswerMatches(key: PaperAnswerKey, index: number, answer: number | undefined): boolean {
  return answer !== undefined && acceptedPaperAnswers(key, index).includes(answer)
}
