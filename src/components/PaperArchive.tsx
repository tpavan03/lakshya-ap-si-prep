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
import { PageHead } from "./ui";
import "./PaperArchive.css";

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
  onTests?: () => void;
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
  onTests,
}: Props) {
  const isNicl = examId === "nicl-ao",
    catalogue = isNicl ? niclPapers : previousPapers;
  const [scope, setScope] = useState<"Target exam" | "Other states">(
    "Target exam",
  );
  const [stage, setStage] = useState<"All" | PaperStage>(
    stageName(initialStage),
  );
  const [year, setYear] = useState<"All" | number>("All"),
    [query, setQuery] = useState("");
  const [activePaperId, setActivePaperId] = useState<string | null>(null);
  const searchRef = useRef<HTMLInputElement>(null);
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
  const targetPapers = catalogue.filter(
      (paper) => isNicl || paper.state === "Andhra Pradesh",
    ),
    availablePapers = targetPapers.filter((paper) => paper.paperUrl);
  const questionCount = availablePapers.reduce(
    (sum, paper) => sum + (paper.questions ?? 0),
    0,
  );
  const resetFilters = () => {
    setStage("All");
    setYear("All");
    setQuery("");
  };
  const openPaper = (id: string | null) => {
    setActivePaperId(id);
    window.scrollTo({ top: 0, behavior: "instant" });
  };
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
    <div className="paper-library">
      <PageHead
        eyebrow={`${isNicl ? "NICL AO" : "AP SI"} / PREVIOUS PAPERS`}
        title="Pick a year. Practise the whole paper."
        copy={
          isNicl
            ? "Previous NICL AO papers reconstructed by publishers, with each complete question set kept together."
            : "Original AP SI scans, source links and booklet-specific answer sheets in one place."
        }
        action={
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
            <ExternalLink size={16} /> Official recruitment page
          </a>
        }
      />
      <section
        className="paper-library-stats"
        aria-label="Paper library summary"
      >
        <div>
          <span className="paper-stat-icon">
            <FileText size={20} />
          </span>
          <div>
            <strong>{availablePapers.length}</strong>
            <span>
              {isNicl ? "Previous exam papers" : "Question-paper scans"}
            </span>
            <small>
              {isNicl
                ? "Publisher memory-based reconstructions"
                : `${targetPapers.length} archive records, including surviving keys`}
            </small>
          </div>
        </div>
        <div>
          <span className="paper-stat-icon">
            <BookOpenCheck size={20} />
          </span>
          <div>
            <strong>{questionCount.toLocaleString("en-IN")}</strong>
            <span>Questions across source papers</span>
            <small>Complete sets kept at their source difficulty</small>
          </div>
        </div>
        <div>
          <span className="paper-stat-icon">
            <FileKey2 size={20} />
          </span>
          <div>
            <strong>
              {targetPapers.filter((paper) => paperAnswerKeys[paper.id]).length}
            </strong>
            <span>Papers with matched scoring keys</span>
            <small>Other papers support manual review</small>
          </div>
        </div>
      </section>
      <section className="paper-library-note" aria-label="About paper sources">
        <ShieldCheck size={21} />
        <div>
          <strong>
            {isNicl
              ? "A quick note about NICL papers"
              : "Know exactly what you are practising"}
          </strong>
          <p>
            {isNicl
              ? "These are memory-based reconstructions, not official NICL booklets. Publisher solutions are visible in the PDFs."
              : "Source scans stay intact. Automatic scores are available only when the matching booklet key has been verified."}
          </p>
        </div>
        {onTests && (
          <button className="text-button" onClick={onTests}>
            Try an exam simulation <ArrowRight size={16} />
          </button>
        )}
      </section>
      <section
        className="paper-filter-panel"
        aria-label="Filter previous papers"
      >
        {!isNicl && (
          <div className="paper-scope-tabs" aria-label="Paper source">
            {(["Target exam", "Other states"] as const).map((value) => (
              <button
                key={value}
                aria-pressed={scope === value}
                className={scope === value ? "active" : ""}
                onClick={() => {
                  setScope(value);
                  setStage(
                    value === "Other states"
                      ? "Other-state"
                      : stageName(initialStage),
                  );
                  setYear("All");
                }}
              >
                {value === "Target exam"
                  ? "AP SI papers"
                  : "Other-state SI papers"}
              </button>
            ))}
          </div>
        )}
        <div className="paper-filter-grid">
          <label className="paper-search-field">
            <span>Search papers</span>
            <div className="search-box">
              <Search size={18} />
              <input
                ref={searchRef}
                aria-label="Search papers"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Year, paper or subject…"
              />
              {query && (
                <button
                  type="button"
                  className="icon-button"
                  aria-label="Clear paper search"
                  onClick={() => {
                    setQuery("");
                    searchRef.current?.focus();
                  }}
                >
                  <X size={16} />
                </button>
              )}
            </div>
          </label>
          <label className="paper-filter-select">
            <span>Stage</span>
            <select
              value={stage}
              onChange={(event) =>
                setStage(event.target.value as "All" | PaperStage)
              }
            >
              <option value="All">All stages</option>
              <option value="Prelims">Prelims</option>
              <option value="Final written">Mains / final written</option>
              {!isNicl && <option value="Other-state">Other-state SI</option>}
            </select>
          </label>
          <label className="paper-filter-select">
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
              <option value="All">All years</option>
              {years.map((value) => (
                <option key={value} value={value}>
                  {value}
                </option>
              ))}
            </select>
          </label>
        </div>
        {(query || stage !== "All" || year !== "All") && (
          <button
            className="text-button paper-clear-filters"
            onClick={resetFilters}
          >
            Clear filters <X size={13} />
          </button>
        )}
      </section>
      <div className="paper-library-heading">
        <div>
          <span className="eyebrow">
            {isNicl
              ? "NICL AO · COMMON PRELIMS"
              : scope === "Target exam"
                ? "ANDHRA PRADESH"
                : "EXTRA SI PRACTICE"}
          </span>
          <h2>Choose a previous paper</h2>
        </div>
        <span role="status">
          {filtered.length} {isNicl ? "papers" : "archive items"} shown
        </span>
      </div>
      <div className="paper-library-grid">
        {filtered.map((paper) => {
          const saved = progress[paper.id],
            key = paperAnswerKeys[paper.id],
            timed = Boolean(paper.paperUrl && paper.questions && paper.minutes);
          return (
            <article className="paper-library-card" key={paper.id}>
              <div className="paper-library-card-top">
                <span className="paper-library-year">{paper.year}</span>
                <span
                  className={`badge paper-source-badge ${statusClass[paper.status]}`}
                >
                  {paper.status === "Official" && <Check size={12} />}{" "}
                  {paper.status}
                </span>
              </div>
              <span className="paper-library-stage">
                {paper.stage === "Final written"
                  ? "Mains / final written"
                  : paper.stage}{" "}
                · {paper.paper}
                {paper.booklet ? ` · Booklet ${paper.booklet}` : ""}
              </span>
              <h3>{paper.title}</h3>
              <p className="paper-library-subject">{paper.subject}</p>
              <div className="paper-library-facts">
                {paper.questions && (
                  <span>
                    <FileText size={15} />
                    {paper.questions} questions
                  </span>
                )}
                {paper.minutes && (
                  <span>
                    <Clock3 size={15} />
                    {paper.minutes} minutes
                  </span>
                )}
                <span>{paper.languages.join(" + ")}</span>
                {paper.examDate && <span>{paper.examDate}</span>}
              </div>
              <div className="paper-library-scoring">
                <ShieldCheck size={16} />
                <span>
                  <strong>
                    {key
                      ? "Scored answer sheet available"
                      : timed
                        ? "Timed answer sheet · manual review"
                        : "Source reference"}
                  </strong>
                  {key
                    ? "Matched to this source’s question order."
                    : timed
                      ? "The matching automatic scoring key is not available."
                      : "Open the source for the available paper or key."}
                </span>
                {saved?.startedAt && (
                  <span
                    className={`badge ${saved.submitted ? "correct" : "blue"}`}
                  >
                    {saved.submitted ? "Completed" : "In progress"}
                  </span>
                )}
              </div>
              <div className="paper-library-actions">
                {timed && (
                  <button
                    className="primary-button"
                    onClick={() => openPaper(paper.id)}
                  >
                    <PlayPaperIcon />
                    {saved?.submitted
                      ? "Review attempt"
                      : saved?.startedAt
                        ? "Resume paper"
                        : "Attempt paper"}
                  </button>
                )}
                {paper.paperUrl && (
                  <a
                    className="secondary-button"
                    href={paper.paperUrl}
                    target="_blank"
                    rel="noreferrer"
                  >
                    <FileText size={15} /> Source PDF
                  </a>
                )}
                {paper.answerKeyUrl && (
                  <a
                    className="text-button"
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
              </div>
              <details className="paper-source-details">
                <summary>Source details</summary>
                {paper.note && <p>{paper.note}</p>}
                {paper.sourceUrl && (
                  <a href={paper.sourceUrl} target="_blank" rel="noreferrer">
                    View source page <ExternalLink size={13} />
                  </a>
                )}
                {key && <p>{key.label}</p>}
              </details>
            </article>
          );
        })}
      </div>
      {!filtered.length && (
        <div className="empty-state">
          <FileText size={30} />
          <h2>
            {isNicl && stage === "Final written"
              ? "No verified NICL Mains paper located yet."
              : "No matching papers."}
          </h2>
          <p>
            {isNicl && stage === "Final written"
              ? "Use the Mains test series for your selected stream. Other insurers’ papers are never labelled as NICL PYQs."
              : "Try another year or stage, or clear the search."}
          </p>
          <button className="secondary-button" onClick={resetFilters}>
            Show all papers
          </button>
        </div>
      )}
      <details className="paper-provenance-guide">
        <summary>
          <ShieldCheck size={17} /> How paper sources are labelled
        </summary>
        <dl>
          <div>
            <dt>Official</dt>
            <dd>A government-hosted paper or key.</dd>
          </div>
          <div>
            <dt>Verified mirror</dt>
            <dd>A board-paper scan hosted by another source.</dd>
          </div>
          <div>
            <dt>Community scan</dt>
            <dd>A scan hosted by the community.</dd>
          </div>
          <div>
            <dt>Memory-based</dt>
            <dd>
              A publisher reconstruction; wording and keys are not NICL-issued.
            </dd>
          </div>
        </dl>
      </details>
    </div>
  );
}
function PlayPaperIcon() {
  return <BookOpenCheck size={16} />;
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
            ? key
              ? "Publisher reconstruction, not an official NICL paper. Solutions are visible in the PDF. Grading uses the publisher key, with −0.25 per wrong answer."
              : "Publisher reconstruction, not an official NICL paper. Solutions are visible in the PDF. Your answers are saved for manual review; no automatic score is calculated."
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
                {sectionalTiming
                  ? " · 3 separately timed sections"
                  : nicl
                    ? " · One composite timer"
                    : ""}
              </strong>
              <p>
                The timer continues when you leave or reload. Answers save
                automatically.
                {sectionalTiming
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
            {sectionalTiming
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
