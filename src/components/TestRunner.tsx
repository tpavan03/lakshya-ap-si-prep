import { fmt, time } from "../lib/format";
import { useCallback, useEffect, useRef, useState } from "react";
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
import {
  getQuizClock,
  scoreQuiz,
  type Attempt,
  type Quiz,
} from "../lib/examEngine";
import { ACTIVE_QUIZ_KEY } from "../lib/store";
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
  const live = useRef({ answers, seconds });
  useEffect(() => {
    live.current = { answers, seconds };
  }, [answers, seconds]);
  const finish = useCallback(() => {
    if (submitted.current) return;
    submitted.current = true;
    onSubmit(
      scoreQuiz(quiz, live.current.answers, live.current.seconds, Date.now()),
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
              {item.subject} / {item.topic}
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
}: {
  attempt: Attempt;
  onClose: () => void;
}) {
  const [filter, setFilter] = useState("all"),
    [limit, setLimit] = useState(15),
    items = a.review.filter((r) => filter === "all" || r.result === filter);
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
      <section className="report-summary">
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
      <section className="panel report-sections">
        <h2>Section breakdown</h2>
        {Object.entries(a.subjects).map(([subject, s]) => (
          <div className="report-subject" key={subject}>
            <strong>{subject}</strong>
            <span>
              {s.correct} correct · {s.wrong} wrong · {s.unanswered} blank
            </span>
            <b>
              {fmt(s.score)} / {s.total * a.marksPerCorrect}
            </b>
          </div>
        ))}
      </section>
      <div className="section-heading">
        <h2>Review every question</h2>
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
          </select>
        </label>
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
                {r.question.subject} / {r.question.topic}
              </span>
              <span className={`badge ${r.result}`}>
                {r.result} · {fmt(r.marks)} marks · {r.seconds}s
              </span>
            </div>
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
