import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type Dispatch,
  type SetStateAction,
} from "react";
import {
  ArrowRight,
  BookOpen,
  Brain,
  ChartNoAxesCombined,
  ChevronRight,
  Crown,
  Download,
  ExternalLink,
  FileCheck2,
  GraduationCap,
  History,
  LayoutDashboard,
  LogOut,
  Menu,
  Settings2,
  ShieldCheck,
  Upload,
  X,
  Clock3,
} from "lucide-react";
import { questions } from "./data";
import { niclQuestions } from "./questions/nicl";
import { useCloudSync } from "./hooks/useCloudSync";
import { PaperArchive } from "./components/PaperArchive";
import { Dialog } from "./components/ui";
import { TestRunner, AttemptReport } from "./components/TestRunner";
import {
  Dashboard,
  Tests,
  Practice,
  Learn,
  Performance,
} from "./components/ExamPages";
import {
  EXAMS,
  createPracticeQuiz,
  startQuiz,
  type ExamId,
  type Stage,
  type Stream,
  type Quiz,
  type Attempt,
} from "./lib/examEngine";
import {
  loadStore,
  normalizeStore,
  saveAttempt,
  createDefaultStore,
  STORAGE_KEY,
  ACTIVE_QUIZ_KEY,
  type Store,
  type ExamProgress,
} from "./lib/store";
import "./App.css";

export type View =
  "dashboard" | "tests" | "practice" | "papers" | "learn" | "reports";
const navigation = [
  { id: "dashboard", label: "Study desk", icon: LayoutDashboard },
  { id: "tests", label: "Test series", icon: FileCheck2 },
  { id: "practice", label: "Custom practice", icon: Brain },
  { id: "papers", label: "Previous papers", icon: History },
  { id: "learn", label: "Learn & revise", icon: BookOpen },
  { id: "reports", label: "Performance", icon: ChartNoAxesCombined },
] as const;
const params = new URLSearchParams(window.location.search);
const readQuiz = (): Quiz | null => {
  try {
    const q = JSON.parse(localStorage.getItem(ACTIVE_QUIZ_KEY) ?? "null");
    return q?.id &&
      Array.isArray(q.items) &&
      q.items.length &&
      q.sections?.length
      ? q
      : null;
  } catch {
    return null;
  }
};

export default function App() {
  const [store, setStore] = useState<Store>(() => {
      const s = loadStore();
      if (params.get("exam") === "nicl-ao") s.activeExam = "nicl-ao";
      return s;
    }),
    [view, setView] = useState<View>(
      navigation.some((n) => n.id === params.get("view"))
        ? (params.get("view") as View)
        : "dashboard",
    ),
    [stage, setStage] = useState<Stage>(
      params.get("stage") === "mains" ? "mains" : "prelims",
    ),
    [stream, setStream] = useState<Stream>(
      params.get("stream") === "it" ? "it" : "generalist",
    );
  const [quiz, setQuiz] = useState<Quiz | null>(null),
    [resume, setResume] = useState<Quiz | null>(readQuiz),
    [report, setReport] = useState<Attempt | null>(null),
    [settings, setSettings] = useState(false),
    [mobile, setMobile] = useState(false),
    [error, setError] = useState(""),
    [guest, setGuest] = useState(false);
  const cloudSetter = useCallback<Dispatch<SetStateAction<Store>>>(
    (value) =>
      setStore((current) =>
        normalizeStore(typeof value === "function" ? value(current) : value),
      ),
    [],
  );
  const cloud = useCloudSync(store, cloudSetter, {
      createEmptyValue: createDefaultStore,
    }),
    examId = store.activeExam,
    exam = EXAMS[examId],
    progress = store.exams[examId],
    bank =
      examId === "ap-si"
        ? questions
        : niclQuestions.filter(
            (q) => stream === "it" || q.subject !== "IT Professional Knowledge",
          );
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
    } catch {
      queueMicrotask(() =>
        setError(
          "Browser storage is full. Export your progress in Settings before clearing any data.",
        ),
      );
    }
  }, [store]);
  useEffect(() => {
    const p = new URLSearchParams({
      ...Object.fromEntries(new URLSearchParams(window.location.search)),
      exam: examId,
      view,
      stage,
      ...(examId === "nicl-ao" ? { stream } : {}),
    });
    window.history.replaceState(null, "", `?${p}`);
    document.title = `${navigation.find((n) => n.id === view)?.label} · ${exam.shortName} · Exam Prep King`;
  }, [exam.shortName, examId, stage, stream, view]);
  const navigate = (next: View) => {
    setView(next);
    setMobile(false);
    setError("");
    window.scrollTo({ top: 0, behavior: "instant" });
  };
  const changeExam = (next: ExamId) => {
    setStore((s) => ({ ...s, activeExam: next }));
    setReport(null);
    setStage("prelims");
    setMobile(false);
    setError("");
  };
  const updateProgress = (fn: (p: ExamProgress) => ExamProgress) =>
    setStore((s) => ({
      ...s,
      exams: { ...s.exams, [examId]: fn(s.exams[examId]) },
    }));
  const begin = (q: Quiz) => {
    if (resume) {
      setError("Resume or submit your saved test before starting another one.");
      return;
    }
    const active = startQuiz(q);
    try {
      localStorage.setItem(ACTIVE_QUIZ_KEY, JSON.stringify(active));
      setError("");
    } catch {
      setError(
        "This test cannot be saved because browser storage is full. Keep the test open and export your progress before clearing data.",
      );
    }
    setQuiz(active);
    setResume(active);
  };
  const submit = (attempt: Attempt) => {
    setStore((s) => saveAttempt(s, attempt));
    localStorage.removeItem(ACTIVE_QUIZ_KEY);
    setQuiz(null);
    setResume(null);
    setReport(attempt);
    setView("reports");
  };
  const daily = () => {
    try {
      begin(
        createPracticeQuiz({
          examId,
          stream,
          pool: bank,
          title: `${exam.shortName} · Daily challenge`,
          count: 10,
          minutes: 12,
          seed: Number(
            new Date().toISOString().slice(0, 10).replaceAll("-", ""),
          ),
        }),
      );
    } catch (e) {
      setError((e as Error).message);
    }
  };
  if (!cloud.authReady)
    return (
      <main className="loading-screen">
        <Crown size={36} />
        <h1>Exam Prep King</h1>
        <p role="status">Restoring your study desk…</p>
      </main>
    );
  if (cloud.cloudConfigured && !cloud.user && !guest)
    return <Login cloud={cloud} onGuest={() => setGuest(true)} />;
  const sidebar = (
    <>
      <a
        className="brand"
        href="?view=dashboard"
        aria-label="Exam Prep King home"
      >
        <span className="brand-mark">
          <Crown size={25} />
        </span>
        <span>
          Exam Prep{" "}
          <strong>
            King<span className="brand-period">.</span>
          </strong>
        </span>
      </a>
      <div className="sidebar-label">YOUR EXAM</div>
      <div className="exam-switcher">
        {(["ap-si", "nicl-ao"] as ExamId[]).map((id) => (
          <button
            key={id}
            onClick={() => changeExam(id)}
            className={id === examId ? "selected" : ""}
          >
            <span className={`exam-icon ${id}`}>
              {id === "ap-si" ? (
                <ShieldCheck size={18} />
              ) : (
                <GraduationCap size={18} />
              )}
            </span>
            <span>
              <strong>{EXAMS[id].shortName}</strong>
              <small>
                {id === "ap-si"
                  ? "Andhra Pradesh Police"
                  : "National Insurance"}
              </small>
            </span>
            <ChevronRight size={15} />
          </button>
        ))}
      </div>
      {examId === "nicl-ao" && (
        <label className="sidebar-stream">
          NICL stream
          <select
            value={stream}
            onChange={(e) => {
              setStream(e.target.value as Stream);
              setReport(null);
            }}
          >
            <option value="generalist">Generalist</option>
            <option value="it">IT Specialist</option>
          </select>
        </label>
      )}
      <div className="sidebar-label">PREPARATION</div>
      <nav aria-label="Main navigation">
        {navigation.map((n) => (
          <button
            key={n.id}
            onClick={() => navigate(n.id)}
            aria-current={view === n.id ? "page" : undefined}
            className={view === n.id ? "active" : ""}
          >
            <n.icon size={19} />
            {n.label}
            {view === n.id && <span className="nav-dot" />}
          </button>
        ))}
      </nav>
      <div className="sidebar-source">
        <ShieldCheck size={21} />
        <strong>Prepare with provenance.</strong>
        <p>Original papers. Honest sources. Progress that belongs to you.</p>
        <a href={exam.officialUrl} target="_blank" rel="noreferrer">
          Official notification <ExternalLink size={13} />
        </a>
      </div>
      <button
        className="sidebar-settings"
        onClick={() => {
          setSettings(true);
          setMobile(false);
        }}
      >
        <Settings2 size={18} /> Profile & backup
      </button>
      <small className="sidebar-version">EXAM PREP KING / 2.0.1</small>
    </>
  );
  return (
    <div className="app-shell">
      <a href="#main-content" className="skip-link">
        Skip to content
      </a>
      <aside className="sidebar">{sidebar}</aside>
      {mobile && (
        <Dialog
          title="Navigation"
          onClose={() => setMobile(false)}
          className="mobile-navigation"
        >
          {sidebar}
        </Dialog>
      )}
      <main className="main">
        <header className="topbar">
          <button
            className="icon-button mobile-menu"
            aria-label="Open navigation"
            onClick={() => setMobile(true)}
          >
            <Menu size={22} />
          </button>
          <div className="breadcrumbs">
            <span>My preparation</span>
            <ChevronRight size={14} />
            <strong>{exam.shortName}</strong>
            {examId === "nicl-ao" && (
              <>
                <ChevronRight size={14} />
                <span>{stream === "it" ? "IT Specialist" : "Generalist"}</span>
              </>
            )}
          </div>
          <div className="topbar-right">
            <span className={`sync-status ${cloud.syncState}`} role="status">
              <i />
              {cloud.user
                ? cloud.syncState === "synced"
                  ? "Cloud saved"
                  : cloud.syncState === "error"
                    ? "Sync failed"
                    : cloud.syncState === "saving"
                      ? "Saving…"
                      : "Loading…"
                : "Saved on device"}
            </span>
            <button
              className="avatar"
              aria-label="Open profile settings"
              onClick={() => setSettings(true)}
            >
              {store.profile.name.slice(0, 1).toUpperCase()}
            </button>
          </div>
        </header>
        <div className="content" id="main-content">
          {error && (
            <div className="message error" role="alert">
              {error}
              <button
                className="icon-button"
                aria-label="Dismiss message"
                onClick={() => setError("")}
              >
                <X size={16} />
              </button>
            </div>
          )}
          {resume && !quiz && (
            <div className="resume-banner">
              <Clock3 size={20} />
              <div>
                <strong>A test is waiting for you</strong>
                <span>
                  {resume.title} · its timer continues while you’re away.
                </span>
              </div>
              <button
                className="primary-button compact"
                onClick={() => setQuiz(readQuiz() ?? resume)}
              >
                Resume test <ArrowRight size={15} />
              </button>
            </div>
          )}
          {view === "dashboard" && (
            <Dashboard
              name={store.profile.name}
              examId={examId}
              stream={stream}
              bank={bank}
              progress={progress}
              onNavigate={navigate}
              onDaily={daily}
              onStage={(s) => {
                setStage(s);
                navigate("tests");
              }}
            />
          )}
          {view === "tests" && (
            <Tests
              storageScope={cloud.user?.id ?? "guest"}
              key={`${examId}-${stream}`}
              examId={examId}
              stream={stream}
              stage={stage}
              setStage={setStage}
              bank={bank}
              attempts={progress.attempts}
              onStart={begin}
              onError={setError}
            />
          )}
          {view === "practice" && (
            <Practice
              key={`${examId}-${stream}`}
              examId={examId}
              stream={stream}
              bank={bank}
              progress={progress}
              onStart={begin}
              onSave={(id) =>
                updateProgress((p) => ({
                  ...p,
                  saved: p.saved.includes(id)
                    ? p.saved.filter((s) => s !== id)
                    : [...p.saved, id],
                }))
              }
            />
          )}{" "}
          {view === "papers" && (
            <PaperArchive
              key={`${examId}-${stream}`}
              examId={examId}
              onTests={() => navigate("tests")}
              progress={progress.pyqProgress}
              onProgress={(id, value) =>
                updateProgress((p) => ({
                  ...p,
                  pyqProgress: { ...p.pyqProgress, [id]: value },
                }))
              }
            />
          )}{" "}
          {view === "learn" && (
            <Learn
              key={`${examId}-${stream}`}
              examId={examId}
              stream={stream}
              onPractice={() => navigate("practice")}
            />
          )}{" "}
          {view === "reports" &&
            (report ? (
              <AttemptReport attempt={report} onClose={() => setReport(null)} />
            ) : (
              <Performance
                progress={progress}
                stream={stream}
                examId={examId}
                onReview={setReport}
                onPractice={() => navigate("practice")}
              />
            ))}
        </div>
        <footer className="app-footer">
          <span>Every focused session counts.</span>
          <span>
            Independent preparation · {examId === "ap-si" ? "APSLPRB" : "NICL"}{" "}
            is the authority for exam rules.
          </span>
        </footer>
      </main>
      {settings && (
        <Settings
          store={store}
          setStore={setStore}
          cloud={cloud}
          onClose={() => setSettings(false)}
          onSignOut={async () => {
            try {
              await cloud.signOut();
            } catch {
              setError("Sign-out failed. Check your connection and try again.");
              setSettings(false);
              return;
            }
            setGuest(false);
            localStorage.removeItem(ACTIVE_QUIZ_KEY);
            setQuiz(null);
            setResume(null);
            setSettings(false);
          }}
        />
      )}
      {quiz && (
        <TestRunner
          quiz={quiz}
          onSubmit={submit}
          onExit={() => {
            setResume(readQuiz());
            setQuiz(null);
          }}
        />
      )}
    </div>
  );
}

function Login({
  cloud,
  onGuest,
}: {
  cloud: ReturnType<typeof useCloudSync<Store>>;
  onGuest: () => void;
}) {
  const [email, setEmail] = useState(""),
    [message, setMessage] = useState(""),
    [busy, setBusy] = useState(false);
  const login = async (google = false) => {
    if (busy) return;
    if (!google && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setMessage("Enter a valid email address.");
      return;
    }
    setBusy(true);
    setMessage("");
    try {
      const error = google
        ? await cloud.signInWithGoogle()
        : await cloud.signInWithEmail(email.trim());
      setMessage(
        error ??
          (google
            ? "Opening Google sign-in…"
            : "Check your email for your sign-in link."),
      );
    } catch {
      setMessage("Could not connect. Check your connection and try again.");
    } finally {
      setBusy(false);
    }
  };
  return (
    <main className="login-page">
      <section className="login-story">
        <div className="brand">
          <span className="brand-mark">
            <Crown />
          </span>
          <span>
            Exam Prep <strong>King.</strong>
          </span>
        </div>
        <span className="eyebrow">BUILT FOR YOUR NEXT CHAPTER</span>
        <h1>
          Big ambitions.
          <br />
          Daily progress.
          <br />
          <em>Your next rank starts here.</em>
        </h1>
        <p>
          One focused desk for AP SI and NICL AO. Learn deeply, practise
          deliberately, and walk into your exam ready.
        </p>
        <div className="login-exams">
          <span>
            <ShieldCheck size={18} /> AP Police SI
          </span>
          <span>
            <GraduationCap size={18} /> NICL AO · Generalist & IT
          </span>
        </div>
      </section>
      <section className="login-entry">
        <div className="login-card">
          <span className="eyebrow">YOUR PREPARATION, CONNECTED</span>
          <h2>Welcome to your study desk.</h2>
          <p>
            Sign in to keep your questions, scores and revision history together
            across devices.
          </p>
          <button
            className="primary-button full"
            onClick={() => void login(true)}
            disabled={busy}
          >
            Continue with Google <ArrowRight size={17} />
          </button>
          <div className="divider">or use your email</div>
          <form
            noValidate
            onSubmit={(e) => {
              e.preventDefault();
              void login();
            }}
          >
            <label>
              Email address
              <input
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
              />
            </label>
            <button className="secondary-button full" disabled={busy}>
              {busy ? "Connecting…" : "Send sign-in link"}
            </button>
          </form>
          {message && (
            <p className="message" role="status">
              {message}
            </p>
          )}
          <button className="text-button guest-button" onClick={onGuest}>
            Explore on this device <ArrowRight size={15} />
          </button>
          <small>Guest progress stays on this device. Sign in to sync.</small>
        </div>
      </section>
    </main>
  );
}

function Settings({
  store,
  setStore,
  cloud,
  onClose,
  onSignOut,
}: {
  store: Store;
  setStore: Dispatch<SetStateAction<Store>>;
  cloud: ReturnType<typeof useCloudSync<Store>>;
  onClose: () => void;
  onSignOut: () => Promise<void>;
}) {
  const [message, setMessage] = useState(""),
    [pending, setPending] = useState<Store | null>(null),
    file = useRef<HTMLInputElement>(null);
  const update = (key: string, value: string | number) =>
    setStore((s) => ({ ...s, profile: { ...s.profile, [key]: value } }));
  const exportData = () => {
    const url = URL.createObjectURL(
        new Blob([JSON.stringify(store, null, 2)], {
          type: "application/json",
        }),
      ),
      a = document.createElement("a");
    a.href = url;
    a.download = `exam-prep-king-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };
  const importData = async (f?: File) => {
    if (!f) return;
    try {
      if (f.size > 20_000_000)
        throw new Error(
          "This file is too large. Choose an exported progress backup.",
        );
      const value = JSON.parse(await f.text());
      if (
        !value ||
        (!value.exams && !Array.isArray(value.attempts)) ||
        !value.profile
      )
        throw new Error(
          "Choose a valid Exam Prep King or Lakshya progress backup.",
        );
      setPending(normalizeStore(value));
    } catch (e) {
      setMessage((e as Error).message);
    }
    if (file.current) file.current.value = "";
  };
  return (
    <Dialog title="Profile & backup" onClose={onClose}>
      <div className="dialog-body settings-body">
        <div className="cloud-summary">
          <ShieldCheck size={22} />
          <div>
            <strong>{cloud.user?.email ?? "Studying on this device"}</strong>
            <small>
              {cloud.user
                ? `Cloud status: ${cloud.syncState}`
                : "Export a backup to keep a portable copy."}
            </small>
          </div>
        </div>
        <label>
          Your name
          <input
            value={store.profile.name}
            onChange={(e) => update("name", e.target.value)}
          />
        </label>
        <div className="form-grid">
          <label>
            Personal target date
            <input
              type="date"
              value={store.profile.examDate}
              onChange={(e) => update("examDate", e.target.value)}
            />
          </label>
          <label>
            Daily study target (min)
            <input
              type="number"
              min={15}
              max={1440}
              value={store.profile.dailyMinutes}
              onChange={(e) =>
                update(
                  "dailyMinutes",
                  Math.max(15, Math.min(1440, Number(e.target.value))),
                )
              }
            />
          </label>
        </div>
        <small>
          This is your personal planning date, not an official exam date.
        </small>
        <div className="backup-box">
          <h3>Your progress, portable.</h3>
          <p>
            Export includes both exams, attempts and saved questions. Lakshya
            backups can be imported too.
          </p>
          <div className="button-row">
            <button className="secondary-button" onClick={exportData}>
              <Download size={16} /> Export JSON
            </button>
            <button
              className="secondary-button"
              onClick={() => file.current?.click()}
            >
              <Upload size={16} /> Import backup
            </button>
            <input
              ref={file}
              type="file"
              hidden
              accept=".json,application/json"
              onChange={(e) => void importData(e.target.files?.[0])}
            />
          </div>
        </div>
        {pending && (
          <div className="message">
            <strong>Replace your current progress?</strong>
            <p>
              This imports {pending.exams["ap-si"].attempts.length} AP SI and{" "}
              {pending.exams["nicl-ao"].attempts.length} NICL attempts. Export
              your current data first if you want to keep it.
            </p>
            <div className="button-row">
              <button
                className="secondary-button"
                onClick={() => setPending(null)}
              >
                Cancel import
              </button>
              <button
                className="danger-button"
                onClick={() => {
                  setStore(pending);
                  setPending(null);
                  setMessage("Backup imported.");
                }}
              >
                Replace with backup
              </button>
            </div>
          </div>
        )}
        {message && (
          <p className="message" role="status">
            {message}
          </p>
        )}
        <div className="button-row">
          {cloud.user && (
            <>
              <button
                className="secondary-button"
                onClick={() => void cloud.syncNow()}
              >
                Sync now
              </button>
              <button className="text-button" onClick={() => void onSignOut()}>
                <LogOut size={16} /> Sign out
              </button>
            </>
          )}
          <button className="primary-button" onClick={onClose}>
            Done
          </button>
        </div>
      </div>
    </Dialog>
  );
}
