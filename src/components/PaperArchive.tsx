import { useEffect, useRef, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  BookOpenCheck,
  Check,
  Clock3,
  ExternalLink,
  FileKey2,
  FileText,
  Search,
  ShieldCheck,
  X,
} from "lucide-react";
import {
  niclPapers,
  previousPapers,
  type PreviousPaper,
  type PaperStage,
  type PaperStatus,
} from "../pyq";
import {
  acceptedPaperAnswers,
  paperAnswerKeys,
  paperAnswerMatches,
} from "../paperKeys";
import { getPaperAttemptState, recordPaperAnswer } from "../lib/paperAttempt";

export type PaperAttemptProgress = {
  answers: Record<string, number>;
  current: number;
  submitted?: boolean;
  startedAt?: number;
  expiresAt?: number;
  submittedAt?: number;
  marked?: number[];
};
type Props = {
  examId?: "ap-si" | "nicl-ao";
  stage?: "prelims" | "mains";
  progress: Record<string, PaperAttemptProgress>;
  onProgress: (paperId: string, value: PaperAttemptProgress) => void;
};
const statusClass: Record<PaperStatus, string> = {
  Official: "official",
  "Verified mirror": "mirror",
  "Community scan": "community",
  "Reference only": "reference",
  "Memory-based": "memory",
};
const stageName = (stage?: "prelims" | "mains"): "All" | PaperStage =>
  stage === "prelims" ? "Prelims" : stage === "mains" ? "Final written" : "All";

export function PaperArchive(props: Props) {
  return (
    <PaperArchiveContent
      key={`${props.examId ?? "ap-si"}:${props.stage ?? "all"}`}
      {...props}
    />
  );
}

function PaperArchiveContent({
  examId = "ap-si",
  stage: initialStage,
  progress,
  onProgress,
}: Props) {
  const [scope, setScope] = useState<"Target exam" | "Other states">(
    "Target exam",
  );
  const [stage, setStage] = useState<"All" | PaperStage>(
    stageName(initialStage),
  );
  const [year, setYear] = useState<"All" | number>("All");
  const [query, setQuery] = useState("");
  const [activePaperId, setActivePaperId] = useState<string | null>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const isNicl = examId === "nicl-ao";
  const catalogue = isNicl ? niclPapers : previousPapers;
  const scoped = catalogue.filter(
    (paper) =>
      isNicl ||
      (scope === "Target exam"
        ? paper.state === "Andhra Pradesh"
        : paper.state !== "Andhra Pradesh"),
  );
  const years = [...new Set(scoped.map((paper) => paper.year))].sort(
    (a, b) => b - a,
  );
  const filtered = scoped.filter(
    (paper) =>
      (stage === "All" || paper.stage === stage) &&
      (year === "All" || paper.year === year) &&
      `${paper.title} ${paper.subject} ${paper.paper} ${paper.year} ${paper.languages.join(" ")}`
        .toLowerCase()
        .includes(query.trim().toLowerCase()),
  );
  const activePaper = catalogue.find((paper) => paper.id === activePaperId);
  const openPaper = (id: string | null) => {
    setActivePaperId(id);
    window.scrollTo({ top: 0, behavior: "auto" });
  };
  const targetPapers = catalogue.filter(
    (paper) => isNicl || paper.state === "Andhra Pradesh",
  );
  const questionCount = targetPapers.reduce(
    (sum, paper) => sum + (paper.questions ?? 0),
    0,
  );
  if (activePaper)
    return (
      <PaperCompanion
        key={activePaper.id}
        paper={activePaper}
        progress={progress[activePaper.id] ?? { answers: {}, current: 0 }}
        onChange={(value) => onProgress(activePaper.id, value)}
        onClose={() => openPaper(null)}
      />
    );
  return (
    <>
      <div className="page-head pyq-page-head">
        <div>
          <span className="eyebrow">
            {isNicl ? "NICL AO" : "AP SI"} · Paper archive
          </span>
          <h1>Train with the paper. Keep the difficulty.</h1>
          <p>
            {isNicl
              ? "Complete publisher reconstructions, clearly labelled as memory-based. Record answers and practise with separate section timers."
              : "Complete original scans, original question order and booklet-specific keys. Practice questions are never substituted for a previous-year paper."}
          </p>
        </div>
        <a
          className="secondary-button"
          href={
            isNicl
              ? "https://nationalinsurance.nic.co.in/recruitment"
              : "https://slprb.ap.gov.in/"
          }
          target="_blank"
          rel="noreferrer"
        >
          <ExternalLink size={16} /> Recruitment board
        </a>
      </div>
      <section className="pyq-summary" aria-label="Paper library summary">
        <div>
          <strong>{targetPapers.length}</strong>
          <span>archive records</span>
          <small>
            {isNicl ? "Publisher reconstructions" : "Papers and surviving keys"}
          </small>
        </div>
        <div>
          <strong>{questionCount.toLocaleString("en-IN")}</strong>
          <span>questions in source papers</span>
          <small>Complete papers, without simplifying</small>
        </div>
        <div>
          <strong>
            {targetPapers.filter((paper) => paperAnswerKeys[paper.id]).length}
          </strong>
          <span>matched answer sheets</span>
          <small>Key provenance shown in each attempt</small>
        </div>
        <div>
          <strong>
            {
              targetPapers.filter(
                (paper) => paper.paperUrl && paper.questions && paper.minutes,
              ).length
            }
          </strong>
          <span>timed paper companions</span>
          <small>Saved answers and absolute deadlines</small>
        </div>
      </section>
      <section className="archive-callout">
        <div>
          <ShieldCheck size={22} />
          <div>
            <strong>
              {isNicl
                ? "Memory-based means reconstructed"
                : "Original papers, honest coverage"}
            </strong>
            <p>
              {isNicl
                ? "These are publisher reconstructions, not NICL-released booklets or official keys. Solutions are visible inside the source PDFs. Use full simulations in Tests for a closed-answer exam experience."
                : "Source PDFs remain intact. A score appears only when the exact booklet key is available. Other scans have timed answer sheets for manual review, without an invented score."}
            </p>
          </div>
        </div>
      </section>
      <div className="pyq-controls">
        {!isNicl && (
          <div className="scope-tabs" aria-label="Paper source">
            <button
              className={scope === "Target exam" ? "active" : ""}
              onClick={() => {
                setScope("Target exam");
                setStage(stageName(initialStage));
                setYear("All");
              }}
            >
              Andhra Pradesh
            </button>
            <button
              className={scope === "Other states" ? "active" : ""}
              onClick={() => {
                setScope("Other states");
                setStage("Other-state");
                setYear("All");
              }}
            >
              Other-state SI
            </button>
          </div>
        )}
        <div className="pyq-filter-row">
          <label className="search-box">
            <Search size={17} />
            <input
              ref={searchRef}
              aria-label="Search papers"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search year, paper or subject"
            />
            {query && (
              <button
                type="button"
                aria-label="Clear paper search"
                onClick={() => {
                  setQuery("");
                  searchRef.current?.focus();
                }}
              >
                <X size={15} />
              </button>
            )}
          </label>
          <label className="archive-select">
            <span>Stage</span>
            <select
              value={stage}
              onChange={(event) =>
                setStage(event.target.value as "All" | PaperStage)
              }
            >
              {(
                [
                  "All",
                  "Prelims",
                  "Final written",
                  ...(!isNicl ? ["Other-state"] : []),
                ] as Array<"All" | PaperStage>
              ).map((option) => (
                <option key={option} value={option}>
                  {option === "Final written"
                    ? "Mains / final written"
                    : option}
                </option>
              ))}
            </select>
          </label>
          <label className="archive-select">
            <span>Year</span>
            <select
              value={year}
              onChange={(event) =>
                setYear(
                  event.target.value === "All"
                    ? "All"
                    : Number(event.target.value),
                )
              }
            >
              <option>All</option>
              {years.map((item) => (
                <option key={item}>{item}</option>
              ))}
            </select>
          </label>
        </div>
      </div>
      <div className="catalog-heading">
        <div>
          <span className="eyebrow">
            {isNicl
              ? "NICL AO · Common Prelims"
              : scope === "Target exam"
                ? "Andhra Pradesh"
                : "Extra practice"}
          </span>
          <h2>
            {isNicl
              ? "Memory-based paper catalogue"
              : "Original paper catalogue"}
          </h2>
        </div>
        <span role="status">{filtered.length} records shown</span>
      </div>
      <div className="pyq-catalog">
        {filtered.map((paper) => (
          <article className="pyq-card" key={paper.id}>
            <div className="paper-card-top">
              <span className="paper-year">{paper.year}</span>
              <div className="paper-badges">
                <em className={`provenance-badge ${statusClass[paper.status]}`}>
                  {paper.status === "Official" && <Check size={11} />}{" "}
                  {paper.status}
                </em>
                {progress[paper.id]?.startedAt && (
                  <em className="reader-badge">
                    {progress[paper.id]?.submitted
                      ? "Completed"
                      : "In progress"}
                  </em>
                )}
              </div>
            </div>
            <span className="paper-kicker">
              {paper.stage === "Final written"
                ? "Mains / final written"
                : paper.stage}{" "}
              · {paper.paper}
              {paper.booklet ? ` · Booklet ${paper.booklet}` : ""}
            </span>
            <h3>{paper.title}</h3>
            <p className="paper-subject">{paper.subject}</p>
            <div className="paper-facts">
              {paper.questions && (
                <span>
                  <FileText size={14} />
                  {paper.questions} questions
                </span>
              )}
              {paper.minutes && (
                <span>
                  <Clock3 size={14} />
                  {paper.minutes} minutes
                </span>
              )}
              <span>{paper.languages.join(" + ")}</span>
              {paper.examDate && <span>{paper.examDate}</span>}
            </div>
            {paper.note && <p className="paper-note">{paper.note}</p>}
            <div className="paper-actions">
              {paper.paperUrl && paper.questions && paper.minutes && (
                <button
                  className="primary-button compact"
                  onClick={() => openPaper(paper.id)}
                >
                  <BookOpenCheck size={15} />
                  {progress[paper.id]?.submitted
                    ? "Review attempt"
                    : progress[paper.id]?.startedAt
                      ? "Resume paper"
                      : "Attempt paper"}
                </button>
              )}
              {paper.paperUrl && (
                <a
                  className="secondary-button compact"
                  href={paper.paperUrl}
                  target="_blank"
                  rel="noreferrer"
                >
                  <FileText size={15} /> Source PDF
                </a>
              )}
              {paper.answerKeyUrl && (
                <a
                  className="secondary-button compact"
                  href={paper.answerKeyUrl}
                  target="_blank"
                  rel="noreferrer"
                >
                  <FileKey2 size={15} />
                  {paper.status === "Memory-based"
                    ? "Publisher solutions"
                    : "Answer key"}
                </a>
              )}
              {paper.sourceUrl && (
                <a
                  className="paper-source-link"
                  href={paper.sourceUrl}
                  target="_blank"
                  rel="noreferrer"
                >
                  Source <ExternalLink size={13} />
                </a>
              )}
            </div>
            <div className="reader-progress">
              <BookOpenCheck size={16} />
              <span>
                {paperAnswerKeys[paper.id] ? (
                  <>
                    <strong>Matched key available</strong>{" "}
                    {paperAnswerKeys[paper.id].label}
                  </>
                ) : paper.paperUrl && paper.questions && paper.minutes ? (
                  <>
                    <strong>Timed answer sheet</strong> Manual review; automatic
                    score unavailable.
                  </>
                ) : (
                  <>
                    <strong>Archive reference</strong> Full booklet or timing
                    not verified for interactive use.
                  </>
                )}
              </span>
            </div>
          </article>
        ))}
      </div>
      {!filtered.length && (
        <div className="empty-state compact-empty">
          <FileText size={28} />
          <h2>
            {isNicl && stage === "Final written"
              ? "No verified NICL Mains paper located yet."
              : "No matching papers."}
          </h2>
          <p>
            {isNicl && stage === "Final written"
              ? "Use Mains simulations for your selected stream. Newly written questions and another insurer’s papers are never labelled NICL PYQs."
              : "Try another year, clear the search or change the stage."}
          </p>
          <button
            className="secondary-button"
            onClick={() => {
              setStage("All");
              setYear("All");
              setQuery("");
            }}
          >
            Show all papers
          </button>
        </div>
      )}
      <div className="citation-guide">
        <span>PROVENANCE</span>
        <div>
          <em className="official">Official</em> Government-hosted
        </div>
        <div>
          <em className="mirror">Verified mirror</em> Board-paper scan
        </div>
        <div>
          <em className="community">Community scan</em> Community-hosted
        </div>
        <div>
          <em className="memory">Memory-based</em> Publisher reconstruction
        </div>
      </div>
    </>
  );
}

function PaperCompanion({
  paper,
  progress,
  onChange,
  onClose,
}: {
  paper: PreviousPaper;
  progress: PaperAttemptProgress;
  onChange: (value: PaperAttemptProgress) => void;
  onClose: () => void;
}) {
  const [now, setNow] = useState(Date.now);
  const dialog = useRef<HTMLDialogElement>(null);
  const [confirmation, setConfirmation] = useState<"submit" | "reset">(
    "submit",
  );
  const autoSubmittedFor = useRef<number | null>(null);
  const {
    nicl,
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
  } = getPaperAttemptState(paper, progress, now);
  const marked = progress.marked ?? [],
    duration = (paper.minutes ?? 180) * 60;
  const update = (patch: Partial<PaperAttemptProgress>) =>
    onChange({ ...progress, ...patch });
  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);
  useEffect(() => {
    if (
      progress.startedAt &&
      !progress.submitted &&
      remaining === 0 &&
      autoSubmittedFor.current !== progress.startedAt
    ) {
      autoSubmittedFor.current = progress.startedAt;
      onChange({
        ...progress,
        submitted: true,
        submittedAt: progress.expiresAt ?? Date.now(),
      });
    }
  }, [onChange, progress, remaining]);
  const choose = (option: number) => {
    onChange(recordPaperAnswer(paper, progress, current, option));
  };
  const move = (next: number) =>
    update({ current: Math.min(upper, Math.max(lower, next)) });
  const ask = (action: "submit" | "reset") => {
    setConfirmation(action);
    dialog.current?.showModal();
  };
  const confirm = () => {
    dialog.current?.close();
    if (confirmation === "reset") {
      autoSubmittedFor.current = null;
      onChange({ answers: {}, current: 0, marked: [] });
      return;
    }
    update({ submitted: true, submittedAt: Date.now() });
  };
  const start = () => {
    const startTime = Date.now();
    setNow(startTime);
    update({
      startedAt: startTime,
      expiresAt: startTime + duration * 1000,
      submitted: false,
    });
  };
  const timeText = (seconds: number) =>
    `${String(Math.floor(seconds / 60)).padStart(2, "0")}:${String(seconds % 60).padStart(2, "0")}`;
  return (
    <section className="paper-reader-shell">
      <header className="paper-reader-head">
        <div>
          <button className="reader-back" onClick={onClose}>
            <ArrowLeft size={16} /> Paper library
          </button>
          <span className="eyebrow">
            {nicl ? "Memory-based paper companion" : "Original scan companion"}
          </span>
          <h1>{paper.title}</h1>
          <p>
            {paper.paper}
            {paper.booklet ? ` · Booklet ${paper.booklet}` : ""} ·{" "}
            {paper.examDate}
          </p>
        </div>
        <div className="reader-score">
          <strong>
            {progress.submitted && key
              ? `${score}/${count}`
              : `${answered}/${count}`}
          </strong>
          <span>
            {progress.submitted
              ? key
                ? "net marks"
                : "answers saved · manual review"
              : "answered"}
          </span>
        </div>
      </header>
      <div className="paper-reader-notice">
        <ShieldCheck size={17} />
        <p>
          {nicl
            ? "Publisher reconstruction, not an official NICL paper. Solutions are visible in the PDF. Grading uses the publisher key, with −0.25 per wrong answer."
            : key
              ? `The complete scan stays unchanged. Grading uses ${key.label}. No negative marking.`
              : "Use the unchanged scan with this timed answer sheet. No matched booklet key is available: saved answers require manual review, without an automatic score."}
        </p>
        <a href={paper.paperUrl} target="_blank" rel="noreferrer">
          Open PDF <ExternalLink size={13} />
        </a>
      </div>
      {!started && !progress.submitted && (
        <div className="archive-callout">
          <div>
            <Clock3 size={22} />
            <div>
              <strong>
                {paper.minutes}-minute timed attempt
                {nicl ? " · 3 separately timed sections" : ""}
              </strong>
              <p>
                The timer continues when you leave or reload. Answers save
                automatically.
                {nicl
                  ? " Each section closes after 20 minutes; only the current section can be answered."
                  : ""}
              </p>
            </div>
          </div>
          <button className="primary-button" onClick={start}>
            Start timed attempt <ArrowRight size={16} />
          </button>
        </div>
      )}
      {started && !progress.submitted && (
        <div className="paper-reader-notice" role="status">
          <Clock3 size={18} />
          <strong>
            {nicl
              ? `${["English", "Reasoning", "Quantitative aptitude"][sectionIndex]} · ${timeText(sectionRemaining)} left in section`
              : `${timeText(remaining)} remaining`}
          </strong>
          <span>
            {nicl
              ? ` · ${timeText(remaining)} total remaining · +1 / −0.25`
              : " · +1 correct / 0 wrong"}
          </span>
        </div>
      )}
      {progress.submitted && (
        <div className="archive-callout" role="status">
          <div>
            <Check size={22} />
            <div>
              <strong>
                {key
                  ? `${correct} correct · ${wrong} wrong · ${count - answered} unanswered`
                  : `${answered} answers saved for manual review`}
              </strong>
              <p>
                {key
                  ? `Key: ${key.label}. ${nicl ? `${wrong * 0.25} marks deducted.` : "No negative marking."}`
                  : "Compare the same booklet and question order against the source key before estimating a score."}
              </p>
            </div>
          </div>
        </div>
      )}
      <div className="paper-reader-layout">
        <div className="paper-frame-wrap">
          <iframe
            src={
              paper.readerUrl ??
              `${paper.paperUrl}#page=${paper.id.startsWith("ap-2023-prelims-") ? 3 : 1}`
            }
            title={`${paper.title} source PDF`}
          />
          <p>
            Preview blocked or unavailable?{" "}
            <a href={paper.paperUrl} target="_blank" rel="noreferrer">
              Open the complete source PDF in a new tab
            </a>
            . Your answer sheet stays here.
          </p>
        </div>
        <aside className="answer-sheet">
          <div className="answer-sheet-head">
            <div>
              <span>
                {paper.booklet
                  ? `BOOKLET ${paper.booklet}`
                  : nicl
                    ? "PUBLISHER QUESTION ORDER"
                    : "SOURCE QUESTION ORDER"}
              </span>
              <strong>Question {current + 1}</strong>
            </div>
            <small>{answered} answered</small>
          </div>
          <div className="answer-palette">
            {Array.from({ length: count }, (_, index) => (
              <button
                key={index}
                aria-label={`Question ${index + 1}${marked.includes(index) ? ", marked for review" : ""}${progress.answers[String(index)] !== undefined ? ", answered" : ""}`}
                aria-current={index === current ? "step" : undefined}
                disabled={
                  started &&
                  !progress.submitted &&
                  (index < lower || index > upper)
                }
                onClick={() => move(index)}
                className={`${index === current ? "active" : ""} ${progress.answers[String(index)] !== undefined ? "answered" : ""} ${marked.includes(index) ? "marked" : ""} ${progress.submitted && key && paperAnswerMatches(key, index, progress.answers[String(index)]) ? "correct" : ""} ${progress.submitted && key && progress.answers[String(index)] !== undefined && !paperAnswerMatches(key, index, progress.answers[String(index)]) ? "wrong" : ""}`}
              >
                {index + 1}
              </button>
            ))}
          </div>
          <div className="answer-choice">
            <span>
              {progress.submitted
                ? "Your recorded answer"
                : "Choose your answer"}
            </span>
            <div>
              {Array.from({ length: paper.options ?? 4 }, (_, index) => (
                <button
                  key={index}
                  aria-pressed={selected === index}
                  onClick={() => choose(index)}
                  disabled={!started || progress.submitted || remaining === 0}
                  className={`${selected === index ? "selected" : ""} ${progress.submitted && key && acceptedPaperAnswers(key, current).includes(index) ? "correct" : ""} ${progress.submitted && key && selected === index && !paperAnswerMatches(key, current, selected) ? "wrong" : ""}`}
                >
                  <strong>{String.fromCharCode(65 + index)}</strong>
                  <small>Option {index + 1}</small>
                </button>
              ))}
            </div>
          </div>
          {!progress.submitted && started && (
            <div className="reader-nav">
              <button
                disabled={selected === undefined || remaining === 0}
                onClick={() => {
                  const answers = { ...progress.answers };
                  delete answers[String(current)];
                  update({ answers });
                }}
              >
                Clear answer
              </button>
              <button
                aria-pressed={marked.includes(current)}
                disabled={remaining === 0}
                onClick={() =>
                  update({
                    marked: marked.includes(current)
                      ? marked.filter((index) => index !== current)
                      : [...marked, current],
                  })
                }
              >
                {marked.includes(current) ? "Unmark review" : "Mark for review"}
              </button>
            </div>
          )}
          {progress.submitted && key && (
            <div className="official-answer">
              <Check size={18} />
              <div>
                <strong>
                  {nicl ? "Publisher" : "Board-key"} answer:{" "}
                  {acceptedPaperAnswers(key, current)
                    .map((answer) => String.fromCharCode(65 + answer))
                    .join(" or ")}
                </strong>
                <p>
                  {key.label}.{" "}
                  {selected === undefined
                    ? "You left this question unanswered."
                    : paperAnswerMatches(key, current, selected)
                      ? "Your answer matches the key."
                      : "Your answer differs from the key."}
                </p>
                <a
                  href={paper.answerKeyUrl ?? paper.paperUrl}
                  target="_blank"
                  rel="noreferrer"
                >
                  Review source key <ExternalLink size={12} />
                </a>
              </div>
            </div>
          )}
          <div className="reader-nav">
            <button
              disabled={current === lower}
              onClick={() => move(current - 1)}
            >
              <ArrowLeft size={14} /> Previous
            </button>
            <button
              disabled={current === upper}
              onClick={() => move(current + 1)}
            >
              Next <ArrowRight size={14} />
            </button>
          </div>
          {progress.submitted ? (
            <button className="retry-paper" onClick={() => ask("reset")}>
              Reset this paper
            </button>
          ) : started ? (
            <button className="submit-paper" onClick={() => ask("submit")}>
              Submit & review <ArrowRight size={15} />
            </button>
          ) : (
            <button className="submit-paper" onClick={start}>
              Start timer <Clock3 size={15} />
            </button>
          )}
        </aside>
      </div>
      <dialog ref={dialog} aria-labelledby="paper-confirm-title">
        <div className="panel">
          <h2 id="paper-confirm-title">
            {confirmation === "reset"
              ? "Reset this paper attempt?"
              : "Submit this paper?"}
          </h2>
          <p>
            {confirmation === "reset"
              ? "This clears the saved answers, review flags and timer for this paper."
              : `${answered} answered · ${count - answered} unanswered. Answers cannot be edited after submission.`}
          </p>
          <div className="paper-actions">
            <button
              className="secondary-button"
              onClick={() => dialog.current?.close()}
              autoFocus
            >
              Keep working
            </button>
            <button className="primary-button" onClick={confirm}>
              {confirmation === "reset" ? "Reset attempt" : "Submit paper"}
            </button>
          </div>
        </div>
      </dialog>
    </section>
  );
}
