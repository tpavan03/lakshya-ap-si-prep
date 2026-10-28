import { fmt } from "../lib/format";
import { useRef, useState } from "react";
import {
  ArrowRight,
  BookOpen,
  Brain,
  Check,
  ChevronRight,
  Clock3,
  ExternalLink,
  FileCheck2,
  FileText,
  Flame,
  GraduationCap,
  Play,
  Search,
  Settings2,
  ShieldCheck,
  Sparkles,
  Target,
  X,
} from "lucide-react";
import type { Question } from "../data";
import { topics } from "../data";
import { niclTopics, niclTheoryChapters } from "../niclTheory";
import { theoryChapters } from "../theory";
import type { View } from "../App";
import {
  EXAMS,
  getBlueprints,
  createExamQuiz,
  createPracticeQuiz,
  type ExamId,
  type Stage,
  type Stream,
  type Quiz,
  type Attempt,
} from "../lib/examEngine";
import type { ExamProgress } from "../lib/store";
import { Dialog, Empty, PageHead } from "./ui";
import { WritingDesk } from "./WritingDesk";

export function Dashboard({
  name,
  examId,
  stream,
  bank,
  progress,
  onNavigate,
  onDaily,
  onStage,
}: {
  name: string;
  examId: ExamId;
  stream: Stream;
  bank: Question[];
  progress: ExamProgress;
  onNavigate: (v: View) => void;
  onDaily: () => void;
  onStage: (s: Stage) => void;
}) {
  const attempts = progress.attempts.filter(
      (a) => examId === "ap-si" || (a.stream ?? "generalist") === stream,
    ),
    total = attempts.reduce((n, a) => n + a.total, 0),
    correct = attempts.reduce((n, a) => n + a.correct, 0),
    minutes = attempts.reduce((n, a) => n + a.seconds / 60, 0);
  return (
    <>
      <PageHead
        eyebrow={`${EXAMS[examId].shortName} / ${examId === "nicl-ao" ? (stream === "it" ? "IT SPECIALIST" : "GENERALIST") : "CIVIL TRACK"}`}
        title={`Make today count, ${name}.`}
        copy="A little more clarity. A little more confidence. One session at a time."
      />
      <section className="hero-panel">
        <div className="hero-copy">
          <span className="hero-tag">
            <Sparkles size={15} /> YOUR DAILY EDGE
          </span>
          <h2>
            Train with purpose.
            <br />
            <span>Show up prepared.</span>
          </h2>
          <p>
            Ten questions. A real time limit. Detailed solutions to turn every
            mistake into your next strength.
          </p>
          <div className="hero-actions">
            <button className="primary-button" onClick={onDaily}>
              <Play size={17} fill="currentColor" /> Start daily challenge
            </button>
            <button
              className="text-button"
              onClick={() => onNavigate("practice")}
            >
              Build your own test <ArrowRight size={16} />
            </button>
          </div>
        </div>
        <div
          className="hero-dial"
          aria-label="Daily challenge: 10 questions, 12 minutes"
        >
          <div className="dial-orbit">
            <span>FOCUS SESSION</span>
            <strong>
              10<span>Q</span>
            </strong>
            <small>12 MINUTES · YOUR NEXT STEP</small>
          </div>
          <div className="dial-note">
            <Target size={16} /> Small sessions. Serious progress.
          </div>
        </div>
      </section>
      <div className="metric-grid">
        {[
          {
            icon: FileCheck2,
            value: fmt(attempts.length),
            label: "Tests completed",
            note: "In this exam & stream",
          },
          {
            icon: Brain,
            value: fmt(total),
            label: "Questions in completed tests",
            note: "Includes unanswered questions",
          },
          {
            icon: Target,
            value: `${total ? Math.round((correct / total) * 100) : 0}%`,
            label: "Correct / all questions",
            note: "Unanswered questions included",
          },
          {
            icon: Clock3,
            value: fmt(Math.round(minutes)),
            label: "Minutes invested",
            note: "Your focused study time",
          },
        ].map((m) => (
          <article className="metric" key={m.label}>
            <span className="metric-icon">
              <m.icon size={20} />
            </span>
            <strong>{m.value}</strong>
            <span>{m.label}</span>
            <small>{m.note}</small>
          </article>
        ))}
      </div>
      <div className="section-heading">
        <div>
          <span className="eyebrow">KNOW YOUR ROUTE</span>
          <h2>One exam. A clear plan.</h2>
        </div>
        <span className="badge">{fmt(bank.length)} practice questions</span>
      </div>
      <div className="runway">
        {(["prelims", "mains"] as Stage[]).map((s, i) => {
          const blueprints = getBlueprints(examId, s, stream);
          return (
            <button
              className={`runway-card ${s}`}
              key={s}
              onClick={() => onStage(s)}
            >
              <span className="runway-step">
                {i === 0 ? "QUALIFY" : "ADVANCE"}
              </span>
              <span className="runway-icon">
                {s === "prelims" ? (
                  <Target size={24} />
                ) : (
                  <GraduationCap size={24} />
                )}
              </span>
              <h3>{s === "prelims" ? "Prelims" : "Mains"}</h3>
              <p>
                {examId === "ap-si"
                  ? s === "prelims"
                    ? "Two objective papers to build your foundation."
                    : "Final written papers and qualifying language practice."
                  : s === "prelims"
                    ? "English, reasoning and quant. Every section timed."
                    : stream === "it"
                      ? "Six sections, including IT professional knowledge."
                      : "Five objective sections, then descriptive English."}
              </p>
              <div>
                {blueprints.map((b) => (
                  <span key={b.id}>
                    {b.questions} Q · {b.minutes} min
                  </span>
                ))}
              </div>
              <strong>
                Explore {s} <ArrowRight size={17} />
              </strong>
            </button>
          );
        })}
        <article className="runway-card practice">
          <span className="runway-step">SHARPEN</span>
          <span className="runway-icon">
            <Brain size={24} />
          </span>
          <h3>Your practice. Your rules.</h3>
          <p>
            Choose topics, difficulty and time. Revisit mistakes or make a set
            from your saved questions.
          </p>
          <div>
            <span>Topic drills</span>
            <span>Mistake practice</span>
          </div>
          <button
            className="text-button"
            onClick={() => onNavigate("practice")}
          >
            Create a practice set <ArrowRight size={17} />
          </button>
        </article>
      </div>
      <div className="dashboard-bottom">
        <section className="panel">
          <div className="section-heading">
            <h3>Keep the momentum</h3>
            <Flame size={20} />
          </div>
          {attempts.length ? (
            <div className="recent-list">
              {attempts.slice(0, 3).map((a) => (
                <div key={a.id}>
                  <span className="result-dot">
                    <Check size={17} />
                  </span>
                  <div>
                    <strong>{a.title}</strong>
                    <small>
                      {new Date(a.date).toLocaleDateString("en-IN")} ·{" "}
                      {Math.round(a.seconds / 60)} minutes
                    </small>
                  </div>
                  <b>
                    {fmt(a.score)}
                    <small> / {a.maxMarks}</small>
                  </b>
                </div>
              ))}
            </div>
          ) : (
            <Empty
              title="Your first attempt is a fresh start."
              copy="Complete a daily challenge to begin your performance record."
              action="Take the challenge"
              onAction={onDaily}
            />
          )}
        </section>
        <section className="source-card">
          <ShieldCheck size={26} />
          <h3>Confidence starts with a source.</h3>
          <p>
            Study original AP scans and clearly labeled NICL memory-based
            papers. Practice questions always show their editorial origin.
          </p>
          <button className="text-button" onClick={() => onNavigate("papers")}>
            Open previous papers <ArrowRight size={16} />
          </button>
        </section>
      </div>
    </>
  );
}

export function StageTabs({
  stage,
  onChange,
}: {
  stage: Stage;
  onChange: (s: Stage) => void;
}) {
  return (
    <div className="stage-tabs" aria-label="Exam stage">
      {(["prelims", "mains"] as Stage[]).map((s) => (
        <button
          key={s}
          className={stage === s ? "active" : ""}
          aria-pressed={stage === s}
          onClick={() => onChange(s)}
        >
          {s === "prelims" ? <Target size={17} /> : <GraduationCap size={17} />}{" "}
          {s === "prelims" ? "Prelims" : "Mains"}
        </button>
      ))}
    </div>
  );
}
export function Tests({
  storageScope,
  examId,
  stream,
  stage,
  setStage,
  bank,
  onStart,
  onError,
}: {
  storageScope: string;
  examId: ExamId;
  stream: Stream;
  stage: Stage;
  setStage: (s: Stage) => void;
  bank: Question[];
  onStart: (q: Quiz) => void;
  onError: (e: string) => void;
}) {
  const [seed, setSeed] = useState(1),
    [writing, setWriting] = useState<string | null>(null),
    [preview, setPreview] = useState<Quiz | null>(null),
    blueprints = getBlueprints(examId, stage, stream);
  const prepare = (id: string) => {
    try {
      setPreview(createExamQuiz(examId, stage, id, seed, bank));
    } catch (e) {
      onError((e as Error).message);
    }
  };
  return (
    <>
      <PageHead
        eyebrow="TEST SERIES"
        title="Rehearse the real thing."
        copy="Full-length simulations use the exam’s question counts, marking and time limits. Every set includes a detailed post-test review."
      />
      <StageTabs stage={stage} onChange={setStage} />
      <div className="pattern-notice">
        <ShieldCheck size={20} />
        <p>{EXAMS[examId].patternNote}</p>
        <a href={EXAMS[examId].officialUrl} target="_blank" rel="noreferrer">
          Source <ExternalLink size={14} />
        </a>
      </div>
      <div className="test-toolbar">
        <span>Original practice · Pattern-aligned simulations</span>
        <label>
          Test edition
          <select
            aria-label="Test edition"
            value={seed}
            onChange={(e) => setSeed(Number(e.target.value))}
          >
            {Array.from({ length: 30 }, (_, i) => (
              <option key={i} value={i + 1}>
                {String(i + 1).padStart(2, "0")}
              </option>
            ))}
          </select>
        </label>
      </div>
      <div className="test-grid">
        {blueprints.map((b) => (
          <article className="test-card" key={b.id}>
            <div className="test-card-top">
              <span className="badge blue">
                {stage === "prelims" ? "PRELIMS" : "MAINS"}
              </span>
              <span>EDITION {String(seed).padStart(2, "0")}</span>
            </div>
            <div className="test-symbol">
              <FileCheck2 size={28} />
            </div>
            <h2>{b.title}</h2>
            <div className="test-facts">
              <span>
                <FileText size={15} />
                {b.questions} questions
              </span>
              <span>
                <Clock3 size={15} />
                {b.minutes} minutes
              </span>
              <span>
                {b.negativeMark ? `−${b.negativeMark} / wrong` : "No deduction"}
              </span>
            </div>
            <div className="test-sections">
              {b.sections.map((s) => (
                <div key={s.id}>
                  <span>{s.title}</span>
                  <strong>
                    {s.questions} Q <small>· {s.minutes} min</small>
                  </strong>
                </div>
              ))}
            </div>
            <button
              className="primary-button full"
              onClick={() => prepare(b.id)}
            >
              View instructions <ArrowRight size={16} />
            </button>
            <small className="test-note">
              Stable edition for repeat comparison · New edition, new selection
            </small>
          </article>
        ))}
      </div>
      {stage === "mains" && (
        <section className="writing-card">
          <div>
            <span className="eyebrow">QUALIFYING LANGUAGE PAPERS</span>
            <h2>Give your writing its own practice.</h2>
            <p>
              {examId === "nicl-ao"
                ? "30 minutes · Essay, précis and comprehension · 30 marks. Qualifying; use the rubric to review your work."
                : "180 minutes per language paper · English and Telugu / Urdu · 100 marks each, qualifying. Save drafts and practise against the clock."}
            </p>
          </div>
          <div>
            <button
              className="secondary-button"
              onClick={() => setWriting("English")}
            >
              English writing <ArrowRight size={15} />
            </button>
            {examId === "ap-si" && (
              <button
                className="secondary-button"
                onClick={() => setWriting("Telugu / Urdu")}
              >
                Telugu / Urdu <ArrowRight size={15} />
              </button>
            )}
          </div>
        </section>
      )}
      {preview && (
        <Dialog title="Before you start" onClose={() => setPreview(null)}>
          <div className="dialog-body">
            <span className="badge blue">
              {EXAMS[examId].shortName}
              {examId === "nicl-ao"
                ? ` · ${stream === "it" ? "IT Specialist" : "Generalist"}`
                : " · Civil"}
            </span>
            <h3>{preview.title}</h3>
            <p>
              {preview.items.length} questions · {preview.minutes} minutes · +1
              correct ·{" "}
              {preview.negativeMark
                ? `−${preview.negativeMark} wrong`
                : "0 wrong"}{" "}
              · 0 unanswered.
            </p>
            <ul className="instruction-list">
              <li>
                The timer starts when you choose Start test and continues after
                exit or reload.
              </li>
              {preview.sectionalTiming && (
                <li>
                  Sections unlock in order. You cannot return to an expired
                  section or carry unused time forward.
                </li>
              )}
              <li>
                No hints or explanations during the simulation. Mark questions
                for review within the available section.
              </li>
              <li>
                Submit early or let the timer submit automatically. Your score
                and worked review follow.
              </li>
            </ul>
            <button
              className="primary-button full"
              onClick={() => {
                onStart(preview);
                setPreview(null);
              }}
            >
              <Play size={17} /> Start test
            </button>
          </div>
        </Dialog>
      )}
      {writing && (
        <WritingDesk
          storageScope={storageScope}
          examId={examId}
          language={writing}
          onClose={() => setWriting(null)}
        />
      )}
    </>
  );
}

export function Practice({
  examId,
  stream,
  bank,
  progress,
  onStart,
  onSave,
}: {
  examId: ExamId;
  stream: Stream;
  bank: Question[];
  progress: ExamProgress;
  onStart: (q: Quiz) => void;
  onSave: (id: string) => void;
}) {
  const [subjects, setSubjects] = useState<string[]>([]),
    [topic, setTopic] = useState("All"),
    [difficulty, setDifficulty] = useState("All"),
    [count, setCount] = useState(20),
    [minutes, setMinutes] = useState(20),
    [source, setSource] = useState("all"),
    [search, setSearch] = useState(""),
    [visible, setVisible] = useState(10),
    [error, setError] = useState(""),
    [open, setOpen] = useState("");
  const searchRef = useRef<HTMLInputElement>(null),
    subjectList = [...new Set(bank.map((q) => q.subject))],
    mistakes = new Set(
      progress.attempts
        .filter(
          (a) => (a.stream ?? "generalist") === stream || examId === "ap-si",
        )
        .flatMap((a) =>
          a.review
            .filter((r) => r.result === "wrong")
            .map((r) => r.question.id),
        ),
    ),
    topicList = [
      ...new Set(
        bank
          .filter((q) => !subjects.length || subjects.includes(q.subject))
          .map((q) => q.topic),
      ),
    ].sort(),
    filtered = bank.filter(
      (q) =>
        (!subjects.length || subjects.includes(q.subject)) &&
        (topic === "All" || q.topic === topic) &&
        (difficulty === "All" || q.difficulty === difficulty) &&
        (source === "all" ||
          (source === "saved"
            ? progress.saved.includes(q.id)
            : mistakes.has(q.id))) &&
        `${q.question} ${q.topic}`.toLowerCase().includes(search.toLowerCase()),
    );
  const start = () => {
    setError("");
    try {
      onStart(
        createPracticeQuiz({
          examId,
          stream,
          pool: filtered,
          count,
          minutes,
          title: `${EXAMS[examId].shortName} · ${topic === "All" ? "Custom practice" : topic}`,
        }),
      );
    } catch (e) {
      setError((e as Error).message);
    }
  };
  return (
    <>
      <PageHead
        eyebrow="CUSTOM PRACTICE"
        title="Build the test you need."
        copy="Target a weakness, raise the difficulty, or turn your mistakes into a fresh practice session."
      />
      <div className="practice-layout">
        <section className="panel test-builder">
          <div className="section-heading">
            <h2>Your practice recipe</h2>
            <Settings2 size={20} />
          </div>
          <span className="field-label">
            Subjects <small>Leave empty for all</small>
          </span>
          <div className="subject-checks">
            {subjectList.map((s) => (
              <label key={s}>
                <input
                  type="checkbox"
                  checked={subjects.includes(s)}
                  onChange={() => {
                    setSubjects((a) =>
                      a.includes(s) ? a.filter((x) => x !== s) : [...a, s],
                    );
                    setTopic("All");
                    setVisible(10);
                  }}
                />
                {s}
              </label>
            ))}
          </div>
          <div className="form-grid">
            <label>
              Topic
              <select
                value={topic}
                onChange={(e) => {
                  setTopic(e.target.value);
                  setVisible(10);
                }}
              >
                <option>All</option>
                {topicList.map((t) => (
                  <option key={t}>{t}</option>
                ))}
              </select>
            </label>
            <label>
              Difficulty
              <select
                value={difficulty}
                onChange={(e) => {
                  setDifficulty(e.target.value);
                  setVisible(10);
                }}
              >
                {["All", "Easy", "Medium", "Hard"].map((d) => (
                  <option key={d}>{d}</option>
                ))}
              </select>
            </label>
            <label>
              Questions
              <input
                type="number"
                min={1}
                max={250}
                value={count}
                onChange={(e) => setCount(Number(e.target.value))}
              />
            </label>
            <label>
              Time (minutes)
              <input
                type="number"
                min={1}
                max={360}
                value={minutes}
                onChange={(e) => setMinutes(Number(e.target.value))}
              />
            </label>
          </div>
          <label>
            Question pool
            <select value={source} onChange={(e) => setSource(e.target.value)}>
              <option value="all">All practice questions</option>
              <option value="wrong">My mistakes ({mistakes.size})</option>
              <option value="saved">
                Saved questions ({progress.saved.length})
              </option>
            </select>
          </label>
          <div className="builder-summary">
            <strong>{fmt(filtered.length)}</strong>
            <span>matching questions available</span>
            <small>
              {examId === "nicl-ao"
                ? "NICL scoring: +1 correct, −0.25 wrong."
                : "AP scoring: +1 correct, no deduction."}{" "}
              Hints available in practice.
            </small>
          </div>
          {error && (
            <p className="message error" role="alert">
              {error}
            </p>
          )}
          <button
            className="primary-button full"
            disabled={!filtered.length}
            onClick={start}
          >
            <Play size={17} /> Start custom test
          </button>
        </section>
        <section className="practice-library">
          <div className="section-heading">
            <h2>Explore the question bank</h2>
            <span className="badge">Original practice</span>
          </div>
          <div className="search-box">
            <Search size={18} />
            <input
              ref={searchRef}
              aria-label="Search practice questions"
              placeholder="Search questions or topics…"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setVisible(10);
              }}
            />
            {search && (
              <button
                className="icon-button"
                aria-label="Clear search"
                onClick={() => {
                  setSearch("");
                  searchRef.current?.focus();
                }}
              >
                <X size={16} />
              </button>
            )}
          </div>
          <p className="results-count">
            Showing {Math.min(visible, filtered.length)} of{" "}
            {fmt(filtered.length)} questions
          </p>
          {!filtered.length && (
            <Empty
              title="No questions match this recipe."
              copy="Clear your search or choose another topic. Saved questions and mistakes appear after you use them."
            />
          )}
          {filtered.slice(0, visible).map((q, i) => (
            <article className="question-card" key={q.id}>
              <div className="question-meta">
                <span>
                  {q.subject} / {q.topic}
                </span>
                <span className={`badge ${q.difficulty.toLowerCase()}`}>
                  {q.difficulty}
                </span>
              </div>
              <h3>
                <span>{String(i + 1).padStart(2, "0")}.</span> {q.question}
              </h3>
              <ol type="A" className="preview-options">
                {q.options.map((o, j) => (
                  <li key={j}>{o}</li>
                ))}
              </ol>
              <div className="question-actions">
                <button
                  className="text-button"
                  aria-expanded={open === q.id}
                  onClick={() => setOpen(open === q.id ? "" : q.id)}
                >
                  {open === q.id ? "Hide solution" : "Show worked solution"}{" "}
                  <ChevronRight size={15} />
                </button>
                <button
                  className={`text-button ${progress.saved.includes(q.id) ? "saved" : ""}`}
                  onClick={() => onSave(q.id)}
                >
                  {progress.saved.includes(q.id) ? "Saved ✓" : "Save question"}
                </button>
              </div>
              {open === q.id && (
                <div className="solution">
                  <strong>
                    Answer {String.fromCharCode(65 + q.answer)} ·{" "}
                    {q.options[q.answer]}
                  </strong>
                  <p>{q.explanation}</p>
                </div>
              )}
              <small className="provenance">
                {q.source} · target {q.seconds}s
              </small>
            </article>
          ))}
          {visible < filtered.length && (
            <button
              className="secondary-button full"
              onClick={() => setVisible((n) => n + 10)}
            >
              Load 10 more questions
            </button>
          )}
        </section>
      </div>
    </>
  );
}

export function Learn({
  examId,
  stream,
  onPractice,
}: {
  examId: ExamId;
  stream: Stream;
  onPractice: () => void;
}) {
  const list =
      examId === "ap-si"
        ? topics
        : niclTopics.filter(
            (t) => stream === "it" || t.subject !== "IT Professional Knowledge",
          ),
    chapters = examId === "ap-si" ? theoryChapters : niclTheoryChapters,
    [open, setOpen] = useState(list[0]?.id ?? "");
  return (
    <>
      <PageHead
        eyebrow="LEARN & REVISE"
        title="Understand it. Then make it stick."
        copy="Concepts, worked examples and revision notes organized around your target exam."
        action={
          <button className="secondary-button" onClick={onPractice}>
            Put it into practice <ArrowRight size={16} />
          </button>
        }
      />
      <div className="learn-layout">
        <nav className="learn-nav" aria-label="Study chapters">
          {list.map((t) => (
            <button
              key={t.id}
              onClick={() => setOpen(t.id)}
              className={open === t.id ? "active" : ""}
            >
              <BookOpen size={17} />
              <span>{t.title}</span>
              <ChevronRight size={14} />
            </button>
          ))}
        </nav>
        <section className="panel chapter">
          {(() => {
            const t = list.find((t) => t.id === open) ?? list[0],
              c = chapters.find((c) => c.topicId === t?.id);
            if (!t)
              return (
                <Empty
                  title="Study chapters are being organized."
                  copy="Use the practice bank while chapters are prepared."
                />
              );
            return (
              <>
                <span className="eyebrow">{t.subject}</span>
                <h2>{t.title}</h2>
                <p className="chapter-intro">{c?.overview ?? t.description}</p>
                {c ? (
                  <>
                    <div className="concept-sections">
                      {c.sections.map((s) => (
                        <article key={s.title}>
                          <h3>{s.title}</h3>
                          <ul>
                            {s.concepts.map((v, i) => (
                              <li key={i}>{v}</li>
                            ))}
                          </ul>
                        </article>
                      ))}
                    </div>
                    {c.formulae.length > 0 && (
                      <>
                        <h3 className="chapter-label">Formulae & rules</h3>
                        <div className="formula-grid">
                          {c.formulae.map((f) => (
                            <article key={f.label}>
                              <span>{f.label}</span>
                              <strong>{f.expression}</strong>
                              <p>{f.explanation}</p>
                            </article>
                          ))}
                        </div>
                      </>
                    )}
                    <h3 className="chapter-label">Worked examples</h3>
                    {c.workedExamples.map((e, i) => (
                      <article className="worked-example" key={i}>
                        <span className="eyebrow">EXAMPLE {i + 1}</span>
                        <h4>{e.problem}</h4>
                        <ol>
                          {e.steps.map((s, j) => (
                            <li key={j}>{s}</li>
                          ))}
                        </ol>
                        <strong>{e.answer}</strong>
                      </article>
                    ))}
                    <div className="revision-grid">
                      <article>
                        <h3>Watch for these traps</h3>
                        <ul>
                          {c.traps.map((s, i) => (
                            <li key={i}>{s}</li>
                          ))}
                        </ul>
                      </article>
                      <article>
                        <h3>Quick revision</h3>
                        <ul>
                          {c.revision.map((s, i) => (
                            <li key={i}>{s}</li>
                          ))}
                        </ul>
                      </article>
                    </div>
                  </>
                ) : (
                  <ul>
                    {t.concepts.map((s) => (
                      <li key={s}>{s}</li>
                    ))}
                  </ul>
                )}
                <h3 className="chapter-label">Read from the source</h3>
                <div className="source-links">
                  {t.sources.map((s) => (
                    <a
                      key={s.label}
                      href={s.url}
                      target="_blank"
                      rel="noreferrer"
                    >
                      <span>
                        <strong>{s.label}</strong>
                        <small>{s.note}</small>
                      </span>
                      <ExternalLink size={16} />
                    </a>
                  ))}
                </div>
              </>
            );
          })()}
        </section>
      </div>
    </>
  );
}

export function Performance({
  progress,
  examId,
  stream,
  onReview,
  onPractice,
}: {
  progress: ExamProgress;
  examId: ExamId;
  stream: Stream;
  onReview: (a: Attempt) => void;
  onPractice: () => void;
}) {
  const attempts = progress.attempts.filter(
      (a) => examId === "ap-si" || (a.stream ?? "generalist") === stream,
    ),
    [limit, setLimit] = useState(15),
    map: Record<string, { correct: number; total: number }> = {};
  attempts.forEach((a) =>
    Object.entries(a.subjects).forEach(([s, r]) => {
      map[s] ??= { correct: 0, total: 0 };
      map[s].correct += r.correct;
      map[s].total += r.total;
    }),
  );
  const rows = Object.entries(map).sort(
    (a, b) => a[1].correct / a[1].total - b[1].correct / b[1].total,
  );
  return (
    <>
      <PageHead
        eyebrow="PERFORMANCE"
        title="Let your results guide the next session."
        copy="Your actual scores, subject strengths and answer reviews. No invented ranks or predicted cutoffs."
      />
      {!attempts.length ? (
        <Empty
          title="Your progress starts with one test."
          copy="Complete a practice set or simulation to see marks, timing and a question-by-question review."
          action="Create a practice test"
          onAction={onPractice}
        />
      ) : (
        <>
          <div className="performance-grid">
            <section className="panel">
              <span className="eyebrow">REVISION PRIORITY</span>
              <h2>Your subjects, weakest first.</h2>
              <div className="subject-bars">
                {rows.map(([s, r]) => (
                  <div key={s}>
                    <div>
                      <strong>{s}</strong>
                      <span>
                        {r.correct}/{r.total} ·{" "}
                        {Math.round((r.correct / r.total) * 100)}%
                      </span>
                    </div>
                    <div className="bar">
                      <i style={{ width: `${(r.correct / r.total) * 100}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </section>
            <section className="source-card">
              <Target size={26} />
              <h2>Train the gap.</h2>
              <p>
                Open Custom practice and choose “My mistakes” to revisit the
                concepts that cost you marks.
              </p>
              <button className="primary-button" onClick={onPractice}>
                Practise mistakes <ArrowRight size={16} />
              </button>
            </section>
          </div>
          <section className="panel attempt-history">
            <div className="section-heading">
              <h2>Your test history</h2>
              <span className="badge">{attempts.length} attempts</span>
            </div>
            {attempts.slice(0, limit).map((a) => (
              <button
                className="attempt-row"
                key={a.id}
                onClick={() => onReview(a)}
              >
                <span className="attempt-score">
                  {fmt(a.score)}
                  <small>/{a.maxMarks}</small>
                </span>
                <span>
                  <strong>{a.title}</strong>
                  <small>
                    {new Date(a.date).toLocaleString("en-IN")} ·{" "}
                    {Math.round(a.seconds / 60)} min · {a.correct} correct /{" "}
                    {a.wrong} wrong
                  </small>
                </span>
                <span className="badge">
                  {a.mode === "exam" ? "Simulation" : "Practice"}
                </span>
                <ChevronRight size={18} />
              </button>
            ))}
            {limit < attempts.length && (
              <button
                className="secondary-button"
                onClick={() => setLimit((n) => n + 15)}
              >
                Load more attempts
              </button>
            )}
          </section>
        </>
      )}
    </>
  );
}
