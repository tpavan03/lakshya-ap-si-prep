import type { PaperAttemptProgress } from "../components/PaperArchive";
import type { Attempt, ExamId, ScoreRow } from "./examEngine";

// Keep the established key and Supabase payload row: upgrading does not strand existing AP progress.
export const STORAGE_KEY = "apsi-command:v1";
export const ACTIVE_QUIZ_KEY = "exam-prep-king:active-quiz:v1";
export type Profile = {
  name: string;
  category: string;
  examDate: string;
  dailyMinutes: number;
};
export type Daily = {
  date: string;
  questions: number;
  correct: number;
  minutes: number;
};
export type ExamProgress = {
  attempts: Attempt[];
  daily: Daily[];
  saved: string[];
  pyqProgress: Record<string, PaperAttemptProgress>;
};
export type Store = {
  version: 3;
  activeExam: ExamId;
  profile: Profile;
  exams: Record<ExamId, ExamProgress>;
};

const emptyProgress = (): ExamProgress => ({
  attempts: [],
  daily: [],
  saved: [],
  pyqProgress: {},
});
export function createDefaultStore(): Store {
  return {
    version: 3,
    activeExam: "ap-si",
    profile: {
      name: "Aspirant",
      category: "OC / EWS",
      examDate: "",
      dailyMinutes: 120,
    },
    exams: { "ap-si": emptyProgress(), "nicl-ao": emptyProgress() },
  };
}
export const defaultStore = createDefaultStore();

const object = (value: unknown): Record<string, unknown> =>
  value !== null && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
const finite = (value: unknown, fallback = 0) =>
  typeof value === "number" && Number.isFinite(value) ? value : fallback;
const strings = (value: unknown) =>
  Array.isArray(value)
    ? [
        ...new Set(
          value.filter((item): item is string => typeof item === "string"),
        ),
      ]
    : [];
const text = (value: unknown, fallback: string) =>
  typeof value === "string" ? value : fallback;

function normalizeAttempt(
  raw: unknown,
  examId: ExamId,
  index: number,
): Attempt | null {
  const value = object(raw);
  if (
    typeof value.title !== "string" ||
    !Number.isFinite(value.total) ||
    finite(value.total) <= 0
  )
    return null;
  const total = Math.max(1, Math.trunc(finite(value.total)));
  const correct = Math.max(
    0,
    Math.min(total, Math.trunc(finite(value.correct, finite(value.score)))),
  );
  const wrong = Math.max(
    0,
    Math.min(total - correct, Math.trunc(finite(value.wrong))),
  );
  const subjects: Record<string, ScoreRow> = {};
  for (const [subject, rawScore] of Object.entries(object(value.subjects))) {
    const score = object(rawScore),
      subjectTotal = Math.max(0, finite(score.total)),
      subjectCorrect = Math.max(
        0,
        Math.min(subjectTotal, finite(score.correct)),
      );
    const subjectWrong = Math.max(
      0,
      Math.min(subjectTotal - subjectCorrect, finite(score.wrong)),
    );
    subjects[subject] = {
      total: subjectTotal,
      correct: subjectCorrect,
      wrong: subjectWrong,
      unanswered: subjectTotal - subjectCorrect - subjectWrong,
      score: finite(score.score, subjectCorrect),
    };
  }
  const date = text(value.date, new Date(0).toISOString());
  return {
    id: text(value.id, `legacy-${examId}-${index}`),
    examId,
    title: value.title,
    date: Number.isFinite(Date.parse(date)) ? date : new Date(0).toISOString(),
    mode: value.mode === "exam" ? "exam" : "practice",
    stage:
      value.stage === "prelims" || value.stage === "mains"
        ? value.stage
        : undefined,
    stream:
      examId === "nicl-ao"
        ? value.stream === "it"
          ? "it"
          : "generalist"
        : undefined,
    blueprintId:
      typeof value.blueprintId === "string" ? value.blueprintId : undefined,
    score: finite(value.score),
    maxMarks: finite(value.maxMarks, total),
    correct,
    wrong,
    unanswered: total - correct - wrong,
    total,
    accuracy: finite(
      value.accuracy,
      correct + wrong
        ? Math.round((correct / (correct + wrong)) * 100)
        : Math.round((correct / total) * 100),
    ),
    seconds: Math.max(0, finite(value.seconds)),
    negativeMark: Math.max(0, finite(value.negativeMark)),
    marksPerCorrect: Math.max(0, finite(value.marksPerCorrect, 1)),
    subjects,
    sections: object(value.sections) as Record<string, ScoreRow>,
    review: Array.isArray(value.review)
      ? (value.review.filter((item) => {
          const row = object(item),
            question = object(row.question);
          return (
            typeof question.id === "string" &&
            typeof question.question === "string" &&
            Array.isArray(question.options) &&
            ["correct", "wrong", "unanswered"].includes(String(row.result))
          );
        }) as Attempt["review"])
      : [],
  };
}

function normalizeProgress(raw: unknown, examId: ExamId): ExamProgress {
  const value = object(raw);
  const attempts = Array.isArray(value.attempts)
    ? value.attempts
        .map((item, index) => normalizeAttempt(item, examId, index))
        .filter((item): item is Attempt => item !== null)
    : [];
  const daily = Array.isArray(value.daily)
    ? value.daily
        .map((item) => {
          const row = object(item);
          return {
            date: text(row.date, ""),
            questions: Math.max(0, finite(row.questions)),
            correct: Math.max(0, finite(row.correct)),
            minutes: Math.max(0, finite(row.minutes)),
          };
        })
        .filter((row) => /^\d{4}-\d{2}-\d{2}$/.test(row.date))
    : [];
  const pyqProgress: Record<string, PaperAttemptProgress> = {};
  for (const [paperId, rawProgress] of Object.entries(
    object(value.pyqProgress),
  )) {
    const progress = object(rawProgress),
      answers: Record<string, number> = {};
    for (const [questionId, answer] of Object.entries(object(progress.answers)))
      if (
        Number.isInteger(answer) &&
        finite(answer) >= 0 &&
        finite(answer) <= 4
      )
        answers[questionId] = answer as number;
    pyqProgress[paperId] = {
      ...progress,
      answers,
      current: Math.max(0, Math.trunc(finite(progress.current))),
      submitted: progress.submitted === true,
    };
  }
  return { attempts, daily, saved: strings(value.saved), pyqProgress };
}

/** Accept both the established Lakshya payload and the exam-scoped v3 payload. */
export function normalizeStore(raw: unknown): Store {
  const value = object(raw),
    initial = createDefaultStore(),
    profile = object(value.profile),
    exams = object(value.exams);
  return {
    version: 3,
    activeExam: value.activeExam === "nicl-ao" ? "nicl-ao" : "ap-si",
    profile: {
      name: text(profile.name, initial.profile.name),
      category: text(profile.category, initial.profile.category),
      examDate: text(profile.examDate, ""),
      dailyMinutes: Math.max(
        15,
        Math.min(1440, finite(profile.dailyMinutes, 120)),
      ),
    },
    exams: {
      "ap-si": normalizeProgress(exams["ap-si"] ?? value, "ap-si"),
      "nicl-ao": normalizeProgress(exams["nicl-ao"], "nicl-ao"),
    },
  };
}

export function loadStore(): Store {
  try {
    return normalizeStore(
      JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "null"),
    );
  } catch {
    return createDefaultStore();
  }
}

export function localDateKey(now = new Date()) {
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
}
/** Pure and idempotent: duplicate submit/expiry callbacks cannot record an attempt twice. */
export function saveAttempt(store: Store, attempt: Attempt): Store {
  const progress = store.exams[attempt.examId];
  if (progress.attempts.some((existing) => existing.id === attempt.id))
    return store;
  const date = localDateKey(new Date(attempt.date)),
    minutes = Math.max(1, Math.round(attempt.seconds / 60));
  const existing = progress.daily.find((day) => day.date === date);
  const daily = existing
    ? progress.daily.map((day) =>
        day.date === date
          ? {
              ...day,
              questions: day.questions + attempt.total,
              correct: day.correct + attempt.correct,
              minutes: day.minutes + minutes,
            }
          : day,
      )
    : [
        ...progress.daily,
        { date, questions: attempt.total, correct: attempt.correct, minutes },
      ];
  return {
    ...store,
    exams: {
      ...store.exams,
      [attempt.examId]: {
        ...progress,
        attempts: [attempt, ...progress.attempts],
        daily,
      },
    },
  };
}
