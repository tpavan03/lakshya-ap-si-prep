import type { Question } from "../data";
import { canonicalTopicFor } from "../topicTaxonomy";
import type { Attempt, QuestionReview } from "./examEngine";

/**
 * Post-test analysis computed only from what an Attempt already stores (the
 * full question copy, the selected option, result, seconds and marks per
 * question). Every block degrades gracefully for older attempts: no review →
 * no topic/time/difficulty blocks; no per-question seconds → no time block;
 * no `minutes` → time used is shown without an allowance.
 *
 * Nothing here estimates ranks, percentiles or official cut-offs.
 */

/** Accuracy (correct ÷ questions in the topic) at or above this is Strong. */
export const STRONG_ACCURACY = 75;
/** Accuracy below this is Weak; in between is Needs work. */
export const WEAK_ACCURACY = 50;
/** Wrong or skipped after more than this multiple of the target time. */
export const TIME_SINK_FACTOR = 1.5;
/** Wrong in less than this multiple of the target time. */
export const CARELESS_FACTOR = 0.4;
/** Skipped within this multiple of the target time (time was not wasted). */
export const GOOD_SKIP_FACTOR = 1;

export type TopicTag = "Strong" | "Needs work" | "Weak";
export const tagFor = (accuracy: number): TopicTag =>
  accuracy >= STRONG_ACCURACY
    ? "Strong"
    : accuracy < WEAK_ACCURACY
      ? "Weak"
      : "Needs work";

const pct = (part: number, whole: number) =>
  whole ? Math.round((part / whole) * 100) : 0;
const target = (q: Question) =>
  Number.isFinite(q.seconds) && q.seconds > 0 ? q.seconds : 60;

export type TopicRow = {
  subject: string;
  topic: string;
  correct: number;
  wrong: number;
  skipped: number;
  total: number;
  accuracy: number;
  avgSeconds: number;
  avgTarget: number;
  tag: TopicTag;
};
export type SubjectBlock = {
  subject: string;
  correct: number;
  total: number;
  accuracy: number;
  topics: TopicRow[];
};
export type Bucket = {
  ids: string[];
  count: number;
  seconds: number;
  marksLost: number;
};
export type TimeAnalysis = {
  timeSinks: Bucket;
  careless: Bucket;
  goodSkips: Bucket;
};
export type DifficultyRow = {
  difficulty: Question["difficulty"];
  correct: number;
  total: number;
  accuracy: number;
};
export type TrendPoint = {
  id: string;
  date: string;
  score: number;
  maxMarks: number;
  accuracy: number;
  avgSeconds: number;
};
export type Trend = {
  points: TrendPoint[];
  scoreChange: number;
  accuracyChange: number;
  avgSecondsChange: number;
};
export type ActionStep =
  | { kind: "topic"; subject: string; topic: string; title: string; reason: string }
  | { kind: "retry"; ids: string[]; title: string; reason: string };
export type Summary = {
  score: number;
  maxMarks: number;
  scorePercent: number;
  accuracy: number;
  attempted: number;
  skipped: number;
  total: number;
  secondsUsed: number;
  secondsAllowed: number | null;
};
export type AttemptAnalysis = {
  summary: Summary;
  subjects: SubjectBlock[];
  time: TimeAnalysis | null;
  difficulty: DifficultyRow[];
  trend: Trend | null;
  plan: ActionStep[];
};

export const reviewTopic = (a: Pick<Attempt, "examId">, r: QuestionReview) =>
  canonicalTopicFor(a.examId, r.question);

export function summarise(a: Attempt): Summary {
  const attempted = a.correct + a.wrong;
  return {
    score: a.score,
    maxMarks: a.maxMarks,
    scorePercent: pct(a.score, a.maxMarks),
    accuracy: pct(a.correct, attempted),
    attempted,
    skipped: a.unanswered,
    total: a.total,
    secondsUsed: a.seconds,
    secondsAllowed:
      typeof a.minutes === "number" && a.minutes > 0 ? a.minutes * 60 : null,
  };
}

const weakestFirst = (x: TopicRow, y: TopicRow) =>
  x.accuracy - y.accuracy || y.wrong + y.skipped - (x.wrong + x.skipped) || y.total - x.total || x.topic.localeCompare(y.topic);

export function topicBreakdown(a: Attempt): SubjectBlock[] {
  const rows = new Map<string, TopicRow & { seconds: number; targets: number }>();
  for (const r of a.review) {
    const topic = reviewTopic(a, r);
    const key = `${r.question.subject}|${topic}`;
    const row =
      rows.get(key) ??
      { subject: r.question.subject, topic, correct: 0, wrong: 0, skipped: 0, total: 0, accuracy: 0, avgSeconds: 0, avgTarget: 0, tag: "Weak" as TopicTag, seconds: 0, targets: 0 };
    row.total++;
    if (r.result === "correct") row.correct++;
    else if (r.result === "wrong") row.wrong++;
    else row.skipped++;
    row.seconds += Math.max(0, r.seconds || 0);
    row.targets += target(r.question);
    rows.set(key, row);
  }
  const bySubject = new Map<string, TopicRow[]>();
  for (const { seconds, targets, ...row } of rows.values()) {
    row.accuracy = pct(row.correct, row.total);
    row.avgSeconds = Math.round(seconds / row.total);
    row.avgTarget = Math.round(targets / row.total);
    row.tag = tagFor(row.accuracy);
    bySubject.set(row.subject, [...(bySubject.get(row.subject) ?? []), row]);
  }
  return [...bySubject.entries()]
    .map(([subject, topics]) => {
      const correct = topics.reduce((s, t) => s + t.correct, 0),
        total = topics.reduce((s, t) => s + t.total, 0);
      return { subject, correct, total, accuracy: pct(correct, total), topics: topics.sort(weakestFirst) };
    })
    .sort((x, y) => x.accuracy - y.accuracy || x.subject.localeCompare(y.subject));
}

/** Marks a question could have earned but did not (a wrong answer also loses the penalty). */
export const marksLost = (a: Pick<Attempt, "marksPerCorrect">, r: QuestionReview) =>
  r.result === "correct" ? 0 : a.marksPerCorrect - r.marks;

export const isTimeSink = (r: QuestionReview) =>
  r.result !== "correct" && r.seconds > TIME_SINK_FACTOR * target(r.question);
export const isCareless = (r: QuestionReview) =>
  r.result === "wrong" && r.seconds > 0 && r.seconds < CARELESS_FACTOR * target(r.question);
export const isGoodSkip = (r: QuestionReview) =>
  r.result === "unanswered" && r.seconds <= GOOD_SKIP_FACTOR * target(r.question);

export function timeAnalysis(a: Attempt): TimeAnalysis | null {
  // Attempts saved without per-question timing cannot be bucketed honestly.
  if (!a.review.length || !a.review.some((r) => r.seconds > 0)) return null;
  const bucket = (test: (r: QuestionReview) => boolean): Bucket => {
    const items = a.review.filter(test);
    return {
      ids: items.map((r) => r.question.id),
      count: items.length,
      seconds: items.reduce((s, r) => s + r.seconds, 0),
      marksLost: Number(items.reduce((s, r) => s + marksLost(a, r), 0).toFixed(2)),
    };
  };
  return { timeSinks: bucket(isTimeSink), careless: bucket(isCareless), goodSkips: bucket(isGoodSkip) };
}

export function difficultyBreakdown(a: Attempt): DifficultyRow[] {
  return (["Hard", "Medium", "Easy"] as const)
    .map((difficulty) => {
      const items = a.review.filter((r) => r.question.difficulty === difficulty);
      const correct = items.filter((r) => r.result === "correct").length;
      return { difficulty, correct, total: items.length, accuracy: pct(correct, items.length) };
    })
    .filter((row) => row.total > 0);
}

const avgSeconds = (a: Attempt) =>
  a.total ? Math.round(a.seconds / a.total) : 0;
const point = (a: Attempt): TrendPoint => ({
  id: a.id,
  date: a.date,
  score: a.score,
  maxMarks: a.maxMarks,
  accuracy: pct(a.correct, a.correct + a.wrong),
  avgSeconds: avgSeconds(a),
});

/**
 * Same-paper trend: earlier attempts of the same exam blueprint (exam mode)
 * or, for practice, of the same title. Oldest first, ending with `a`.
 */
export function trendFor(a: Attempt, history: readonly Attempt[], limit = 6): Trend | null {
  const same = (b: Attempt) =>
    b.id !== a.id &&
    b.examId === a.examId &&
    b.mode === a.mode &&
    (a.blueprintId ? b.blueprintId === a.blueprintId : !b.blueprintId && b.title === a.title) &&
    Date.parse(b.date) <= Date.parse(a.date);
  const prior = history
    .filter(same)
    .sort((x, y) => Date.parse(x.date) - Date.parse(y.date))
    .slice(-(limit - 1));
  if (!prior.length) return null;
  const points = [...prior.map(point), point(a)];
  const last = points[points.length - 2], now = points[points.length - 1];
  return {
    points,
    scoreChange: Number((now.score - last.score).toFixed(2)),
    accuracyChange: now.accuracy - last.accuracy,
    avgSecondsChange: now.avgSeconds - last.avgSeconds,
  };
}

export function actionPlan(a: Attempt, subjects: SubjectBlock[], time: TimeAnalysis | null): ActionStep[] {
  const steps: ActionStep[] = [];
  const weak = subjects
    .flatMap((s) => s.topics)
    .filter((t) => t.tag !== "Strong")
    .sort(weakestFirst);
  const topicStep = (t: TopicRow): ActionStep => ({
    kind: "topic",
    subject: t.subject,
    topic: t.topic,
    title: `Drill ${t.topic}`,
    reason: `${t.correct}/${t.total} correct (${t.accuracy}%, ${t.tag.toLowerCase()})${t.avgSeconds > t.avgTarget * TIME_SINK_FACTOR ? `, and ${t.avgSeconds}s per question against a ${t.avgTarget}s target` : ""}. A hard-first set of 20 targets it.`,
  });
  weak.slice(0, 2).forEach((t) => steps.push(topicStep(t)));
  const missed = a.review.filter((r) => r.result !== "correct").map((r) => r.question.id);
  if (missed.length) {
    const notes: string[] = [];
    if (time?.careless.count) notes.push(`${time.careless.count} rushed (careless) error${time.careless.count === 1 ? "" : "s"}`);
    if (time?.timeSinks.count) notes.push(`${time.timeSinks.count} time sink${time.timeSinks.count === 1 ? "" : "s"}`);
    steps.push({
      kind: "retry",
      ids: missed,
      title: "Retry the questions you missed",
      reason: `${missed.length} question${missed.length === 1 ? "" : "s"} wrong or skipped${notes.length ? `, including ${notes.join(" and ")}` : ""}. Re-solve each one, then read its worked solution.`,
    });
  }
  for (const t of weak.slice(2)) {
    if (steps.length >= 3) break;
    steps.push(topicStep(t));
  }
  return steps.slice(0, 3);
}

export function analyseAttempt(a: Attempt, history: readonly Attempt[] = []): AttemptAnalysis {
  const subjects = a.review.length ? topicBreakdown(a) : [];
  const time = timeAnalysis(a);
  return {
    summary: summarise(a),
    subjects,
    time,
    difficulty: a.review.length ? difficultyBreakdown(a) : [],
    trend: trendFor(a, history),
    plan: a.review.length ? actionPlan(a, subjects, time) : [],
  };
}
