# Exam Prep King interaction contract

Business evidence: current user request, `docs/exam-sources.md`, `src/lib/examEngine.ts`, and existing `supabase/migrations/001_user_state.sql`.

| Capability | Canonical owner | Source of truth | Allowed variants | Verification |
|---|---|---|---|---|
| Select/Listbox | Native select | DESIGN.md | OS-owned popup | browser keyboard checks |
| Date | Native date input | DESIGN.md | personal target only | profile browser check |
| Form | Labeled native controls with inline errors | This contract | custom test / profile / auth | browser tests |
| Scrollbar | src/index.css | DESIGN.md | palette geometry only | computed style check |
| Toast | Inline role=status feedback | This contract | success / error / sync | browser tests |
| CRUD | Store helpers | src/lib/store.ts | exam-scoped attempts / import | engine tests |
| Dialog | src/components/ui.tsx | This contract | confirmation / settings / test | keyboard and focus checks |

Exam choice scopes paper lists, tests, bookmarks, attempts and performance. Existing v1/v2 AP progress migrates into AP SI; NICL starts independently. Existing Supabase user_state payload and row authorization remain the backend contract. Import validates before replacing data, and requires confirmation. No service credentials belong in the client.

Prelims and Mains use one stage selector and one test-card system. Each paper exposes 30 numbered mocks in six-card pages with explicit counts, completion and retake states; paper/page state survives refresh through URL parameters. Paper archive filter labels stay above full-height controls, and search clearing is immediate. The 2017 NICL archive uses its historical composite 60-minute clock; 2024/2025 retain separate section clocks. Simulation question counts, section durations and marking come from sourced blueprints. Practice exposes configurable subjects, topics, difficulty, length and time. Full simulations refuse insufficient pools. Hints and worked solutions are available in practice/review; simulations reveal explanations only after submission. NICL section windows use absolute deadlines; reload, backgrounding and section navigation cannot reset time. Attempt submission is idempotent. Exit retains a resumable timed attempt.

Use native dialog for modal focus containment, Escape and focus restoration. Submit requires confirmation and shows answered/review counts. Navigation is buttons inside the application with persistent exam/view/stage URL state. Search clearing is immediate. Long question lists use Load more. All operations have empty/error states and no browser alert/confirm/prompt.

Readiness reports observed accuracy and marks, never an invented rank. Descriptive writing is timed and saved with a self-review rubric, not falsely machine-graded. Personal targets never masquerade as official examination dates.
