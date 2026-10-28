import { time } from "../lib/format";
import { useCallback, useEffect, useState } from "react";
import { Clock3, Download, Play } from "lucide-react";
import type { ExamId } from "../lib/examEngine";
import { Dialog } from "./ui";
import {
  emptyWritingDraft,
  normalizeWritingDraft,
  writingStorageKey,
  type WritingDraft,
} from "../lib/writingDraft";

const passage =
  "Insurance spreads the financial consequences of uncertain losses across a pool of policyholders. Its value depends not only on the size of that pool but also on the quality of information shared by everyone involved. If applicants conceal important facts, insurers may price risk incorrectly. If insurers use complicated wording, customers may buy protection that does not match their needs. Digital services can reduce the time needed to issue policies and settle claims, but they can also exclude people who lack reliable access or confidence online. A useful insurance system therefore combines clear communication, fair risk assessment and accessible assistance. Technology supports these goals when it makes decisions easier to understand and gives people a practical way to correct errors. It fails when speed becomes a substitute for accountability.";
export function WritingDesk({
  examId,
  language,
  storageScope,
  onClose,
}: {
  examId: ExamId;
  language: string;
  storageScope: string;
  onClose: () => void;
}) {
  const storageKey = writingStorageKey(storageScope, examId, language);
  return (
    <WritingSession
      key={storageKey}
      storageKey={storageKey}
      examId={examId}
      language={language}
      onClose={onClose}
    />
  );
}
function WritingSession({
  examId,
  language,
  storageKey: key,
  onClose,
}: {
  examId: ExamId;
  language: string;
  storageKey: string;
  onClose: () => void;
}) {
  const minutes = examId === "nicl-ao" ? 30 : 180,
    [draft, setDraft] = useState<WritingDraft>(() => {
      try {
        return normalizeWritingDraft(
          JSON.parse(localStorage.getItem(key) ?? "null"),
        );
      } catch {
        return emptyWritingDraft();
      }
    }),
    [now, setNow] = useState(Date.now),
    [prompt, setPrompt] = useState(0),
    [feedback, setFeedback] = useState(""),
    [storageError, setStorageError] = useState(""),
    [resetConfirm, setResetConfirm] = useState(false),
    [closeConfirm, setCloseConfirm] = useState(false);
  const left = Math.max(
      0,
      Math.ceil(((draft.expiresAt ?? now + minutes * 60000) - now) / 1000),
    ),
    locked = !draft.startedAt || draft.submitted || left === 0;
  const saveDraft = useCallback(() => {
    try {
      localStorage.setItem(key, JSON.stringify(draft));
      setStorageError("");
      return true;
    } catch {
      setStorageError(
        "Your draft could not be saved on this device. Your text remains in this open session. Export your responses to keep a copy.",
      );
      return false;
    }
  }, [draft, key]);
  useEffect(() => {
    let cancelled = false;
    queueMicrotask(() => {
      if (!cancelled) saveDraft();
    });
    return () => {
      cancelled = true;
    };
  }, [saveDraft]);
  const requestClose = () => {
    if (saveDraft()) onClose();
    else setCloseConfirm(true);
  };
  useEffect(() => {
    const id = setInterval(() => {
      const n = Date.now();
      setNow(n);
      setDraft((d) =>
        d.expiresAt && n >= d.expiresAt && !d.submitted
          ? { ...d, submitted: true }
          : d,
      );
    }, 500);
    return () => clearInterval(id);
  }, []);
  const prompts =
    examId === "nicl-ao"
      ? [
          "Essay: Discuss how insurers can improve access without weakening responsible risk assessment. Practise a clear introduction, argument, counterargument and conclusion.",
          "Précis: Give the passage below an appropriate title and reduce it to about one third of its length without changing its meaning.",
          "Comprehension: (1) What information problem does the passage identify? (2) How can digital services exclude customers? (3) What three qualities define a useful insurance system?",
        ]
      : [
          "Essay / report: Explain the role of community trust in effective policing. Include an introduction, evidence-based arguments and a conclusion.",
          "Précis: Summarise the supplied passage to about one third of its length and add a title.",
          "Comprehension & translation: Identify the central argument and translate the final three sentences into your chosen language.",
        ];
  const download = () => {
    const url = URL.createObjectURL(
        new Blob(
          [
            `Exam Prep King · ${language}\n\n${prompts.map((p, i) => `${p}\n\n${draft.answers[i] ?? ""}`).join("\n\n")}`,
          ],
          { type: "text/plain;charset=utf-8" },
        ),
      ),
      a = document.createElement("a");
    a.href = url;
    a.download = `${examId}-writing.txt`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };
  return (
    <Dialog
      title={`${language} writing desk`}
      onClose={requestClose}
      className="writing-dialog"
    >
      <div className="dialog-body">
        {storageError && (
          <p className="message error" role="alert">
            {storageError}
          </p>
        )}
        <div className="writing-status">
          <span className="badge">
            Original practice prompts ·{" "}
            {examId === "nicl-ao"
              ? "30 marks · 10 per task"
              : "100-mark qualifying paper practice"}
          </span>
          <strong>
            <Clock3 size={17} /> {time(left)}
          </strong>
        </div>
        <p>
          Drafts save on this device. Use the rubric to self-review; no
          automatic score or official question claim.{" "}
          {language !== "English" &&
            "Write your responses in Telugu or Urdu using your preferred keyboard."}
        </p>
        {!draft.startedAt ? (
          <button
            className="primary-button"
            onClick={() => {
              const n = Date.now();
              setNow(n);
              setDraft((d) => ({
                ...d,
                startedAt: n,
                expiresAt: n + minutes * 60000,
              }));
            }}
          >
            <Play size={16} /> Start {minutes}-minute practice
          </button>
        ) : (
          <span className="badge">
            {draft.submitted
              ? "Practice submitted · responses locked"
              : "Timer running · continues after exit"}
          </span>
        )}
        <div className="stage-tabs">
          {["Essay", "Précis", "Comprehension"].map((p, i) => (
            <button
              key={p}
              className={prompt === i ? "active" : ""}
              onClick={() => setPrompt(i)}
            >
              {p}
            </button>
          ))}
        </div>
        <h3>{prompts[prompt]}</h3>
        {prompt > 0 && (
          <blockquote className="writing-passage">{passage}</blockquote>
        )}
        <label>
          Your response
          <textarea
            className="resize-none"
            style={{ resize: "none" }}
            rows={12}
            value={draft.answers[prompt] ?? ""}
            disabled={locked}
            placeholder="Start the timer to begin writing…"
            onChange={(e) =>
              setDraft((d) => ({
                ...d,
                answers: d.answers.map((a, i) =>
                  i === prompt ? e.target.value : a,
                ),
              }))
            }
          />
        </label>
        <p className="results-count">
          {
            (draft.answers[prompt] ?? "").trim().split(/\s+/).filter(Boolean)
              .length
          }{" "}
          words · saved locally
        </p>
        <div className="button-row">
          <button className="secondary-button" onClick={download}>
            <Download size={16} /> Export responses
          </button>
          {draft.startedAt && !draft.submitted && (
            <button
              className="primary-button"
              onClick={() => {
                setDraft((d) => ({ ...d, submitted: true }));
                setFeedback(
                  "Responses submitted. Use the rubric below to review and export your draft.",
                );
              }}
            >
              Submit writing practice
            </button>
          )}
          {draft.submitted && (
            <button
              className="secondary-button"
              onClick={() => setResetConfirm(true)}
            >
              Start a fresh session
            </button>
          )}
        </div>
        {feedback && (
          <p className="message" role="status">
            {feedback}
          </p>
        )}
        <section className="writing-rubric">
          <h3>Self-review rubric</h3>
          <ul>
            <li>
              <strong>Relevance:</strong> Did every paragraph answer the prompt?
            </li>
            <li>
              <strong>Structure:</strong> Is the argument organized and concise?
            </li>
            <li>
              <strong>Accuracy:</strong> Did the précis preserve the original
              meaning?
            </li>
            <li>
              <strong>Language:</strong> Check grammar, clarity, spelling and
              transitions.
            </li>
          </ul>
        </section>
      </div>
      {resetConfirm && (
        <Dialog
          title="Start a fresh writing session?"
          onClose={() => setResetConfirm(false)}
        >
          <div className="dialog-body">
            <p>
              This replaces your saved responses for this paper. Export them
              first if you want to keep a copy.
            </p>
            <div className="button-row">
              <button
                autoFocus
                className="secondary-button"
                onClick={() => setResetConfirm(false)}
              >
                Keep responses
              </button>
              <button className="secondary-button" onClick={download}>
                <Download size={16} /> Export responses
              </button>
              <button
                className="danger-button"
                onClick={() => {
                  setDraft(emptyWritingDraft());
                  setPrompt(0);
                  setResetConfirm(false);
                  setFeedback("A fresh writing session is ready.");
                }}
              >
                Replace with fresh session
              </button>
            </div>
          </div>
        </Dialog>
      )}
      {closeConfirm && (
        <Dialog
          title="Close without saving?"
          onClose={() => setCloseConfirm(false)}
        >
          <div className="dialog-body">
            <p>
              This device could not save your latest responses. Export them
              before closing to avoid losing your work.
            </p>
            <div className="button-row">
              <button
                autoFocus
                className="secondary-button"
                onClick={() => setCloseConfirm(false)}
              >
                Keep writing open
              </button>
              <button className="secondary-button" onClick={download}>
                <Download size={16} /> Export responses
              </button>
              <button className="danger-button" onClick={onClose}>
                Close without saving
              </button>
            </div>
          </div>
        </Dialog>
      )}
    </Dialog>
  );
}
