import type { PaperAttemptProgress } from "../components/PaperArchive";
import type { PreviousPaper } from "../pyq";
import { paperAnswerKeys, paperAnswerMatches } from "../paperKeys";

/** Absolute-clock state: reloads and background tabs never extend a deadline. */
export function getPaperAttemptState(
  paper: PreviousPaper,
  progress: PaperAttemptProgress,
  now: number,
) {
  const nicl = paper.examId === "nicl-ao";
  const sectionalTiming = nicl && paper.sectionalTiming !== false;
  const count = paper.questions ?? 100;
  const key = paperAnswerKeys[paper.id];
  const started = typeof progress.startedAt === "number";
  const duration = (paper.minutes ?? 180) * 60;
  const elapsed = started
    ? Math.max(0, Math.floor((now - progress.startedAt!) / 1000))
    : 0;
  const sectionIndex = sectionalTiming
    ? Math.min(2, Math.floor(elapsed / 1200))
    : 0;
  const lower =
    sectionalTiming && !progress.submitted ? [0, 30, 65][sectionIndex] : 0;
  const upper =
    sectionalTiming && !progress.submitted
      ? [29, 64, 99][sectionIndex]
      : count - 1;
  const current = Math.min(upper, Math.max(lower, progress.current ?? 0));
  const selected = progress.answers[String(current)];
  const answered = Object.entries(progress.answers).filter(
    ([id, answer]) =>
      /^\d+$/.test(id) &&
      Number(id) < count &&
      Number.isInteger(answer) &&
      answer >= 0 &&
      answer < (paper.options ?? 4),
  ).length;
  const correct =
    key?.answers.reduce(
      (sum, _answer, index) =>
        sum +
        (paperAnswerMatches(key, index, progress.answers[String(index)])
          ? 1
          : 0),
      0,
    ) ?? 0;
  const wrong = answered - correct;
  const score = key ? correct - (nicl ? wrong * 0.25 : 0) : undefined;
  const remaining = started
    ? Math.max(
        0,
        Math.ceil(
          ((progress.expiresAt ?? progress.startedAt! + duration * 1000) -
            now) /
            1000,
        ),
      )
    : duration;
  const sectionRemaining = sectionalTiming
    ? Math.min(remaining, Math.max(0, (sectionIndex + 1) * 1200 - elapsed))
    : remaining;
  return {
    nicl,
    sectionalTiming,
    count,
    key,
    started,
    sectionIndex,
    lower,
    upper,
    current,
    selected,
    answered,
    correct,
    wrong,
    score,
    remaining,
    sectionRemaining,
  };
}

export function recordPaperAnswer(
  paper: PreviousPaper,
  progress: PaperAttemptProgress,
  index: number,
  option: number,
  now = Date.now(),
): PaperAttemptProgress {
  const state = getPaperAttemptState(paper, progress, now);
  if (
    !state.started ||
    state.remaining === 0 ||
    progress.submitted ||
    index < state.lower ||
    index > state.upper ||
    !Number.isInteger(index) ||
    !Number.isInteger(option) ||
    option < 0 ||
    option >= (paper.options ?? 4)
  )
    return progress;
  return {
    ...progress,
    current: index,
    answers: { ...progress.answers, [String(index)]: option },
  };
}
