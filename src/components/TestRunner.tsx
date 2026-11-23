import { fmt, time } from "../lib/format";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Clock3,
  Flag,
  HelpCircle,
  ShieldCheck,
  X,
} from "lucide-react";
import type { Question } from "../data";
import { readinessBenchmarks } from "../exam";
import {
  analyseAttempt,
  CARELESS_FACTOR,
  isCareless,
  isTimeSink,
  reviewTopic,
  STRONG_ACCURACY,
  TIME_SINK_FACTOR,
  WEAK_ACCURACY,
} from "../lib/attemptAnalysis";
import {
  createPracticeQuiz,
  EXAMS,
  getQuizClock,
  scoreQuiz,
  type Attempt,
  type Quiz,
  type Stream,
} from "../lib/examEngine";
import { ACTIVE_QUIZ_KEY } from "../lib/store";
import { canonicalTopicFor } from "../topicTaxonomy";
import { Dialog, Empty, PageHead } from "./ui";

export function TestRunner({
  quiz,
  onSubmit,
  onExit,
}: {
  quiz: Quiz;
  onSubmit: (a: Attempt) => void;
  onExit: () => void;
}) {
  const [now, setNow] = useState(Date.now),
    [index, setIndex] = useState(quiz.index ?? 0),
    [answers, setAnswers] = useState<Record<string, number>>(
      quiz.answers ?? {},
    ),
    [marked, setMarked] = useState<string[]>(quiz.marked ?? []),
    [seconds, setSeconds] = useState<Record<string, number>>(
      quiz.secondsByQuestion ?? {},
    ),
    [hint, setHint] = useState(false),
    [confirm, setConfirm] = useState(false),
    [storageError, setStorageError] = useState(""),
    submitted = useRef(false);
  const clock = getQuizClock(quiz, now),
    allowed = new Set(clock.allowedItemIds),
    effectiveIndex = allowed.has(quiz.items[index]?.id)
      ? index
      : Math.max(
          0,
          quiz.items.findIndex((q) => allowed.has(q.id)),
        ),
    item = quiz.items[effectiveIndex],
    section = quiz.sections[clock.currentSectionIndex];
  const live = useRef({ answers, seconds, marked });
  useEffect(() => {
    live.current = { answers, seconds, marked };
  }, [answers, seconds, marked]);
  const finish = useCallback(() => {
    if (submitted.current) return;
    submitted.current = true;
    onSubmit(
      scoreQuiz(
        { ...quiz, marked: live.current.marked },
        live.current.answers,
        live.current.seconds,
        Date.now(),
      ),
    );
  }, [onSubmit, quiz]);
  useEffect(() => {
    const timer = window.setInterval(() => {
      setNow(Date.now());
      if (getQuizClock(quiz).isFinished) finish();
    }, 250);
    return () => clearInterval(timer);
  }, [quiz, finish]);
  useEffect(() => {
    const timer = window.setInterval(() => {
      if (
        document.visibilityState === "visible" &&
        getQuizClock(quiz).allowedItemIds.includes(item.id)
      )
        setSeconds((s) => ({ ...s, [item.id]: (s[item.id] ?? 0) + 1 }));
    }, 1000);
    return () => clearInterval(timer);
  }, [item.id, quiz]);
  const saveSnapshot = useCallback(() => {
    try {
      localStorage.setItem(
        ACTIVE_QUIZ_KEY,
        JSON.stringify({
          ...quiz,
          index: effectiveIndex,
          answers,
          marked,
          secondsByQuestion: seconds,
        }),
      );
      setStorageError("");
      return true;
    } catch {
      setStorageError(
        "This test could not be saved on your device. Your answers remain in this open test. Retry Save & exit, or submit to view your results.",
      );
      return false;
    }
  }, [answers, effectiveIndex, marked, quiz, seconds]);
  useEffect(() => {
    if (!submitted.current) saveSnapshot();
  }, [saveSnapshot]);
  const safeExit = () => {
    if (saveSnapshot()) onExit();
  };
  const move = (i: number) => {
    if (getQuizClock(quiz).allowedItemIds.includes(quiz.items[i]?.id)) {
      setIndex(i);
      setHint(false);
    }
  };
  const choose = (i: number) => {
    if (getQuizClock(quiz).allowedItemIds.includes(item.id))
      setAnswers((a) => ({ ...a, [item.id]: i }));
  };
  const clearAnswer = () => {
    if (getQuizClock(quiz).allowedItemIds.includes(item.id))
      setAnswers((a) => {
        const n = { ...a };
        delete n[item.id];
        return n;
      });
  };
  const toggleMark = () => {
    if (getQuizClock(quiz).allowedItemIds.includes(item.id))
      setMarked((a) =>
        a.includes(item.id)
          ? a.filter((id) => id !== item.id)
          : [...a, item.id],
      );
  };
  const answered = Object.keys(answers).length;
  return (
    <Dialog title={quiz.title} onClose={safeExit} className="runner-dialog">
      {storageError && (
        <p className="message error" role="alert">
          {storageError}
        </p>
      )}
      <header className="runner-header">
        <span className="badge blue">
          <ShieldCheck size={14} />
          {quiz.mode === "exam" ? "Exam simulation" : "Practice"}
        </span>
        <span>
          +{quiz.marksPerCorrect} correct ·{" "}
          {quiz.negativeMark ? `−${quiz.negativeMark}` : "0"} wrong
        </span>
        <div
          className={`runner-timer ${clock.sectionRemainingSeconds < 60 ? "urgent" : ""}`}
          role="timer"
          aria-label="Time remaining"
        >
          <Clock3 size={19} />
          <strong>{time(clock.sectionRemainingSeconds)}</strong>
          <small>
            {quiz.sectionalTiming ? "section remaining" : "remaining"}
          </small>
        </div>
        <button className="secondary-button compact" onClick={safeExit}>
          Save & exit
        </button>
      </header>
      {quiz.sectionalTiming && (
        <div className="runner-sections" aria-label="Timed sections">
          {quiz.sections.map((s, i) => (
            <span
              className={
                i === clock.currentSectionIndex
                  ? "active"
                  : i < clock.currentSectionIndex
                    ? "expired"
                    : ""
              }
              key={s.id}
            >
              {i < clock.currentSectionIndex ? (
                <Check size={14} />
              ) : (
                <Clock3 size={14} />
              )}{" "}
              {s.title} · {s.durationSeconds / 60} min
            </span>
          ))}
        </div>
      )}
      <div className="runner-layout">
        <main className="runner-question">
          <div className="question-meta">
            <span>
              {item.subject} / {canonicalTopicFor(quiz.examId, item)}
            </span>
            <span>
              {quiz.mode === "practice"
                ? `${item.difficulty} · target ${item.seconds}s`
                : section?.title}
            </span>
          </div>
          <span className="question-index">
            QUESTION {effectiveIndex + 1} <span>OF {quiz.items.length}</span>
          </span>
          <h2>{item.question}</h2>
          <div
            className="answer-options"
            role="group"
            aria-label="Answer options"
          >
            {item.options.map((o, i) => (
              <button
                key={i}
                className={answers[item.id] === i ? "selected" : ""}
                aria-pressed={answers[item.id] === i}
                onClick={() => choose(i)}
              >
                <span>{String.fromCharCode(65 + i)}</span>
                <div>{o}</div>
                {answers[item.id] === i && <Check size={19} />}
              </button>
            ))}
          </div>
          {hint && quiz.mode === "practice" && (
            <div className="hint">
              <HelpCircle size={18} />
              <p>{item.hint}</p>
            </div>
          )}
          <div className="runner-tools">
            {quiz.mode === "practice" && (
              <button className="text-button" onClick={() => setHint(!hint)}>
                <HelpCircle size={16} />
                {hint ? "Hide hint" : "Show hint"}
              </button>
            )}
            <button
              className={`text-button ${marked.includes(item.id) ? "flagged" : ""}`}
              aria-pressed={marked.includes(item.id)}
              onClick={toggleMark}
            >
              <Flag size={16} />
              {marked.includes(item.id)
                ? "Marked for review"
                : "Mark for review"}
            </button>
            <button
              className="text-button"
              disabled={answers[item.id] === undefined}
              onClick={clearAnswer}
            >
              Clear answer
            </button>
          </div>
          <div className="runner-navigation">
            <button
              className="secondary-button"
              disabled={!allowed.has(quiz.items[effectiveIndex - 1]?.id)}
              onClick={() => move(effectiveIndex - 1)}
            >
              <ArrowLeft size={16} /> Previous
            </button>
            {allowed.has(quiz.items[effectiveIndex + 1]?.id) ? (
              <button
                className="primary-button"
                onClick={() => move(effectiveIndex + 1)}
              >
                Save & next <ArrowRight size={16} />
              </button>
            ) : (
              <span className="section-end">
                {quiz.sectionalTiming &&
                clock.currentSectionIndex < quiz.sections.length - 1
                  ? "Next section opens when this timer ends."
                  : "You have reached the last question."}
              </span>
            )}
          </div>
        </main>
        <aside className="runner-palette">
          <div className="section-heading">
            <h3>Question navigator</h3>
            <span>
              {answered}/{quiz.items.length}
            </span>
          </div>
          <div className="palette-legend">
            <span>✓ Answered</span>
            <span>⚑ Marked</span>
            <span>□ Unanswered</span>
          </div>
          <div className="palette">
            {quiz.items.map((q, i) => (
              <button
                key={q.id}
                aria-label={`Question ${i + 1}${answers[q.id] !== undefined ? ", answered" : ""}${marked.includes(q.id) ? ", marked for review" : ""}`}
                aria-current={i === effectiveIndex ? "step" : undefined}
                disabled={!allowed.has(q.id)}
                onClick={() => move(i)}
                className={`${i === effectiveIndex ? "active" : ""} ${answers[q.id] !== undefined ? "answered" : ""} ${marked.includes(q.id) ? "marked" : ""}`}
              >
                {i + 1}
              </button>
            ))}
          </div>
          {quiz.sectionalTiming && (
            <p className="palette-note">
              Other sections are locked. Total time left:{" "}
              {time(clock.remainingSeconds)}.
            </p>
          )}
          <button
            className="primary-button full"
            onClick={() => setConfirm(true)}
          >
            Submit test <ArrowRight size={16} />
          </button>
        </aside>
      </div>
      {confirm && (
        <Dialog title="Submit this test?" onClose={() => setConfirm(false)}>
          <div className="dialog-body">
            <p>
              You answered{" "}
              <strong>
                {answered} of {quiz.items.length}
              </strong>{" "}
              questions. <strong>{marked.length}</strong> are marked for review.
              Submitting finishes this attempt and reveals the solutions.
            </p>
            <div className="button-row">
              <button
                autoFocus
                className="secondary-button"
                onClick={() => setConfirm(false)}
              >
                Keep working
              </button>
              <button className="primary-button" onClick={finish}>
                Submit & view results
              </button>
            </div>
          </div>
        </Dialog>
      )}
    </Dialog>
  );
}

export function AttemptReport({
  attempt: a,
  onClose,
  history = [],
  category,
  bank = [],
  stream,
  onStart,
}: {
  attempt: Attempt;
  onClose: () => void;
  /** Saved attempts of the same exam, for the same-paper trend. */
  history?: readonly Attempt[];
  /** Profile category, for the app's own AP SI readiness benchmark. */
  category?: string;
  /** Current question bank, for one-tap topic practice. */
  bank?: readonly Question[];
  stream?: Stream;
  onStart?: (quiz: Quiz) => void;
}) {
  const analysis = useMemo(() => analyseAttempt(a, history), [a, history]);
  const { summary, subjects, time: timing, difficulty, trend, plan } = analysis;
  const [filter, setFilter] = useState("all"),
    [topicFilter, setTopicFilter] = useState("all"),
    [limit, setLimit] = useState(15),
    [planError, setPlanError] = useState("");
  const marked = new Set(a.marked ?? []);
  const topicsInAttempt = [
    ...new Set(a.review.map((r) => reviewTopic(a, r))),
  ].sort();
  const items = a.review.filter(
    (r) =>
      (filter === "all" ||
        (filter === "timesink"
          ? isTimeSink(r)
          : filter === "careless"
            ? isCareless(r)
            : filter === "marked"
              ? marked.has(r.question.id)
              : r.result === filter)) &&
      (topicFilter === "all" || reviewTopic(a, r) === topicFilter),
  );
  const benchmark =
    a.examId === "ap-si" && category ? readinessBenchmarks[category] : undefined;
  const startTopic = (subject: string, topic: string) => {
    setPlanError("");
    try {
      const pool = bank.filter(
        (q) => q.subject === subject && canonicalTopicFor(a.examId, q) === topic,
      );
      onStart?.(
        createPracticeQuiz({
          examId: a.examId,
          stream,
          pool,
          count: Math.min(20, pool.length),
          minutes: 25,
          title: `${EXAMS[a.examId].shortName} · ${topic} drill`,
        }),
      );
    } catch (e) {
      setPlanError((e as Error).message);
    }
  };
  const retry = (ids: string[]) => {
    setPlanError("");
    try {
      const pool = a.review
        .map((r) => r.question)
        .filter((q) => ids.includes(q.id));
      onStart?.(
        createPracticeQuiz({
          examId: a.examId,
          stream,
          pool,
          questionIds: ids,
          count: pool.length,
          minutes: Math.max(
            5,
            Math.ceil(pool.reduce((s, q) => s + (q.seconds || 60), 0) / 60),
          ),
          title: `${EXAMS[a.examId].shortName} · Retry missed questions`,
        }),
      );
    } catch (e) {
      setPlanError((e as Error).message);
    }
  };
  const tagClass = (tag: string) =>
    tag === "Strong" ? "correct" : tag === "Weak" ? "wrong" : "medium";
  const maxTrend = trend
    ? Math.max(...trend.points.map((p) => p.maxMarks), 1)
    : 1;
  const signed = (n: number, unit = "") =>
    `${n > 0 ? "+" : n < 0 ? "−" : "±"}${fmt(Math.abs(n))}${unit}`;
  return (
    <>
      <PageHead
        eyebrow="YOUR TEST REPORT"
        title={a.title}
        copy={`${new Date(a.date).toLocaleString("en-IN")} · ${Math.round(a.seconds / 60)} min · ${a.mode === "exam" ? "Exam simulation" : "Practice"}`}
        action={
          <button className="secondary-button" onClick={onClose}>
            <ArrowLeft size={16} /> All attempts
          </button>
        }
      />
      <section className="report-summary" aria-label="Score summary">
        <div className="report-mark">
          <span>NET MARKS</span>
          <strong>
            {fmt(a.score)}
            <small> / {a.maxMarks}</small>
          </strong>
          <p>
            {a.negativeMark
              ? `Includes −${a.negativeMark} per wrong answer`
              : "No negative marking applied"}
          </p>
        </div>
        <div>
          <Check size={21} />
          <strong>{a.correct}</strong>
          <span>Correct</span>
        </div>
        <div>
          <X size={21} />
          <strong>{a.wrong}</strong>
          <span>Wrong</span>
        </div>
        <div>
          <Clock3 size={21} />
          <strong>{a.unanswered}</strong>
          <span>Unanswered</span>
        </div>
      </section>
      <section className="panel analysis-block" aria-labelledby="summary-h">
        <h2 id="summary-h">Summary</h2>
        <dl className="analysis-facts">
          <div>
            <dt>Score</dt>
            <dd>
              {fmt(summary.score)} / {summary.maxMarks} ({summary.scorePercent}%)
            </dd>
          </div>
          <div>
            <dt>Accuracy</dt>
            <dd>{summary.accuracy}% of attempted</dd>
          </div>
          <div>
            <dt>Attempted</dt>
            <dd>
              {summary.attempted} of {summary.total} · {summary.skipped} skipped
            </dd>
          </div>
          <div>
            <dt>Time used</dt>
            <dd>
              {time(summary.secondsUsed)}
              {summary.secondsAllowed !== null &&
                ` of ${time(summary.secondsAllowed)} allowed`}
            </dd>
          </div>
          {benchmark !== undefined && (
            <div>
              <dt>Readiness benchmark ({category})</dt>
              <dd>
                {benchmark}% ·{" "}
                {summary.scorePercent >= benchmark
                  ? "met in this attempt"
                  : `${benchmark - summary.scorePercent} points below`}
              </dd>
            </div>
          )}
        </dl>
        {benchmark !== undefined && (
          <p className="analysis-note">
            The benchmark is this app’s own practice target for your profile
            category, not an official cut-off, rank or percentile.
          </p>
        )}
      </section>
      {subjects.length > 0 && (
        <section className="panel analysis-block" aria-labelledby="topics-h">
          <h2 id="topics-h">Subject and topic breakdown</h2>
          <p className="analysis-note">
            Weakest first. Strong: {STRONG_ACCURACY}% or more correct · Needs
            work: {WEAK_ACCURACY}–{STRONG_ACCURACY - 1}% · Weak: below{" "}
            {WEAK_ACCURACY}%.
          </p>
          {subjects.map((s) => (
            <div className="analysis-subject" key={s.subject}>
              <h3>
                {s.subject}{" "}
                <span>
                  {s.correct}/{s.total} correct · {s.accuracy}%
                </span>
              </h3>
              <ul className="topic-rows">
                {s.topics.map((t) => (
                  <li key={t.topic}>
                    <div className="topic-row-head">
                      <strong>{t.topic}</strong>
                      <span className={`badge ${tagClass(t.tag)}`}>{t.tag}</span>
                    </div>
                    <div
                      className="meter"
                      role="img"
                      aria-label={`${t.accuracy}% correct`}
                    >
                      <span style={{ width: `${t.accuracy}%` }} />
                    </div>
                    <small>
                      {t.correct} correct · {t.wrong} wrong · {t.skipped}{" "}
                      skipped · {t.accuracy}% · {t.avgSeconds}s average vs{" "}
                      {t.avgTarget}s target
                    </small>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </section>
      )}
      {timing && (
        <section className="panel analysis-block" aria-labelledby="time-h">
          <h2 id="time-h">Time analysis</h2>
          <ul className="analysis-buckets">
            <li>
              <strong>Time sinks</strong>
              <b>{timing.timeSinks.count}</b>
              <small>
                Wrong or skipped after more than {TIME_SINK_FACTOR}× the target
                time · {time(timing.timeSinks.seconds)} spent ·{" "}
                {fmt(timing.timeSinks.marksLost)} marks lost
              </small>
            </li>
            <li>
              <strong>Careless errors</strong>
              <b>{timing.careless.count}</b>
              <small>
                Wrong in under {CARELESS_FACTOR}× the target time ·{" "}
                {fmt(timing.careless.marksLost)} marks lost
              </small>
            </li>
            <li>
              <strong>Good skips</strong>
              <b>{timing.goodSkips.count}</b>
              <small>
                Left blank within the target time, so no time was wasted ·{" "}
                {fmt(timing.goodSkips.marksLost)} marks not earned, no penalty
              </small>
            </li>
          </ul>
        </section>
      )}
      {difficulty.length > 0 && (
        <section className="panel analysis-block" aria-labelledby="diff-h">
          <h2 id="diff-h">Difficulty breakdown</h2>
          <ul className="topic-rows">
            {difficulty.map((d) => (
              <li key={d.difficulty}>
                <div className="topic-row-head">
                  <strong>{d.difficulty}</strong>
                  <span className={`badge ${d.difficulty.toLowerCase()}`}>
                    {d.accuracy}%
                  </span>
                </div>
                <div
                  className="meter"
                  role="img"
                  aria-label={`${d.accuracy}% correct on ${d.difficulty} questions`}
                >
                  <span style={{ width: `${d.accuracy}%` }} />
                </div>
                <small>
                  {d.correct} of {d.total} correct
                </small>
              </li>
            ))}
          </ul>
        </section>
      )}
      {trend && (
        <section className="panel analysis-block" aria-labelledby="trend-h">
          <h2 id="trend-h">Trend on this paper</h2>
          <p className="analysis-note">
            Versus your previous attempt: score {signed(trend.scoreChange)},
            accuracy {signed(trend.accuracyChange, " pts")}, average time{" "}
            {signed(trend.avgSecondsChange, "s")} per question.
          </p>
          <ol
            className="trend-bars"
            aria-label="Score in recent attempts, oldest first"
          >
            {trend.points.map((p, i) => (
              <li
                key={p.id}
                className={i === trend.points.length - 1 ? "current" : ""}
              >
                <span
                  className="trend-bar"
                  style={{
                    height: `${Math.max(4, (Math.max(0, p.score) / maxTrend) * 100)}%`,
                  }}
                />
                <small>
                  {fmt(p.score)}
                  <span className="sr-only">
                    {" "}
                    marks, {p.accuracy}% accuracy, {p.avgSeconds}s per question,{" "}
                    {new Date(p.date).toLocaleDateString("en-IN")}
                  </span>
                </small>
                <small aria-hidden="true">
                  {new Date(p.date).toLocaleDateString("en-IN", {
                    day: "numeric",
                    month: "short",
                  })}
                </small>
              </li>
            ))}
          </ol>
        </section>
      )}
      {a.review.length > 0 && (
        <section className="panel analysis-block" aria-labelledby="plan-h">
          <h2 id="plan-h">Action plan</h2>
          {plan.length ? (
            <ol className="action-plan">
              {plan.map((step) => (
                <li
                  key={
                    step.kind === "topic"
                      ? `${step.subject}|${step.topic}`
                      : "retry"
                  }
                >
                  <div>
                    <strong>{step.title}</strong>
                    <p>{step.reason}</p>
                  </div>
                  {onStart && (
                    <button
                      className="secondary-button"
                      onClick={() =>
                        step.kind === "topic"
                          ? startTopic(step.subject, step.topic)
                          : retry(step.ids)
                      }
                    >
                      {step.kind === "topic"
                        ? "Start 20-question drill"
                        : "Retry missed questions"}
                      <ArrowRight size={16} />
                    </button>
                  )}
                </li>
              ))}
            </ol>
          ) : (
            <p className="analysis-note">
              Every question was correct. Take the next paper in the series.
            </p>
          )}
          {planError && (
            <p className="analysis-error" role="alert">
              {planError}
            </p>
          )}
        </section>
      )}
      <div className="section-heading review-filters">
        <h2>Review every question</h2>
        <div className="review-filter-fields">
          <label>
            Show
            <select
              value={filter}
              onChange={(e) => {
                setFilter(e.target.value);
                setLimit(15);
              }}
            >
              <option value="all">All questions</option>
              <option value="wrong">Wrong answers</option>
              <option value="unanswered">Unanswered</option>
              <option value="correct">Correct answers</option>
              {timing && <option value="timesink">Time sinks</option>}
              {timing && <option value="careless">Careless errors</option>}
              {a.marked && <option value="marked">Marked for review</option>}
            </select>
          </label>
          {topicsInAttempt.length > 1 && (
            <label>
              Topic
              <select
                value={topicFilter}
                onChange={(e) => {
                  setTopicFilter(e.target.value);
                  setLimit(15);
                }}
              >
                <option value="all">All topics</option>
                {topicsInAttempt.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </label>
          )}
        </div>
      </div>
      {!a.review.length ? (
        <Empty
          title="This older attempt has a summary only."
          copy="Question-level review is saved for all new attempts."
        />
      ) : !items.length ? (
        <Empty
          title="No questions in this category."
          copy="Change the review filter to see the rest of your attempt."
        />
      ) : (
        items.slice(0, limit).map((r, i) => (
          <article
            className={`question-card review-card ${r.result}`}
            key={r.question.id}
          >
            <div className="question-meta">
              <span>
                {r.question.subject} / {reviewTopic(a, r)}
              </span>
              <span className={`badge ${r.result}`}>
                {r.result} · {fmt(r.marks)} marks · {r.seconds}s
              </span>
            </div>
            <p className="review-timing">
              Your time {r.seconds}s · target {r.question.seconds}s
              {isTimeSink(r) && " · time sink"}
              {isCareless(r) && " · rushed"}
              {marked.has(r.question.id) && " · marked for review"}
            </p>
            <h3>
              {i + 1}. {r.question.question}
            </h3>
            <div className="review-options">
              {r.question.options.map((o, j) => (
                <div
                  key={j}
                  className={
                    j === r.question.answer
                      ? "correct"
                      : j === r.selected
                        ? "wrong"
                        : ""
                  }
                >
                  <span>{String.fromCharCode(65 + j)}.</span>
                  {o}
                  {j === r.question.answer ? (
                    <strong>
                      <Check size={15} /> Correct answer
                    </strong>
                  ) : j === r.selected ? (
                    <strong>
                      <X size={15} /> Your answer
                    </strong>
                  ) : null}
                </div>
              ))}
            </div>
            {r.selected === null && <p>You left this question unanswered.</p>}
            <div className="solution">
              <strong>Worked solution</strong>
              <p>{r.question.explanation}</p>
            </div>
            <small className="provenance">{r.question.source}</small>
          </article>
        ))
      )}
      {limit < items.length && (
        <button
          className="secondary-button full"
          onClick={() => setLimit((n) => n + 15)}
        >
          Load more solutions
        </button>
      )}
    </>
  );
}
