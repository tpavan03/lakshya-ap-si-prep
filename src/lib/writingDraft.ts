import type { ExamId } from "./examEngine";

export type WritingDraft = {
  answers: string[];
  startedAt?: number;
  expiresAt?: number;
  submitted?: boolean;
};
export const emptyWritingDraft = (): WritingDraft => ({
  answers: ["", "", ""],
});

/** Account identities are encoded separately so neither accounts nor paper names can collide. */
export const writingStorageKey = (
  storageScope: string,
  examId: ExamId,
  language: string,
) =>
  `exam-prep-king:writing:${encodeURIComponent(storageScope)}:${examId}:${encodeURIComponent(language)}`;

export function normalizeWritingDraft(raw: unknown): WritingDraft {
  if (!raw || typeof raw !== "object") return emptyWritingDraft();
  const value = raw as Partial<WritingDraft>;
  const rawAnswers = Array.isArray(value.answers) ? value.answers : [];
  const answers = Array.from({ length: 3 }, (_, i) =>
    typeof rawAnswers[i] === "string" ? rawAnswers[i] : "",
  );
  const startedAt =
    typeof value.startedAt === "number" &&
    Number.isFinite(value.startedAt) &&
    value.startedAt > 0
      ? value.startedAt
      : undefined;
  const expiresAt =
    startedAt &&
    typeof value.expiresAt === "number" &&
    Number.isFinite(value.expiresAt) &&
    value.expiresAt > startedAt
      ? value.expiresAt
      : undefined;
  return {
    answers,
    startedAt: expiresAt ? startedAt : undefined,
    expiresAt,
    submitted: value.submitted === true,
  };
}
