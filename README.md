<div align="center">
  <img src="public/lakshya-banner.svg" alt="Lakshya AP SI Prep Desk" width="100%" />
</div>

<p align="center">
  <a href="https://lakshya-ap-si-prep.vercel.app"><strong>Open the live preparation desk →</strong></a>
  ·
  <a href="https://github.com/tpavan03/lakshya-ap-si-prep/releases/latest"><strong>Download the Android APK →</strong></a>
</p>

# Lakshya · AP SI Prep Desk

A focused, local-first preparation workspace for the Andhra Pradesh Police Sub Inspector examination. Lakshya turns the official syllabus into a daily workflow: learn a concept, solve timed questions, review errors, and measure readiness.

## What is inside

- Official 2026 exam profile with direct SLPRB notification access
- Concept maps and trusted source links for every major syllabus area
- 411 original practice questions with hints, worked explanations, difficulty, and target time
- 113 hard questions organised into topic challenges with strict combined timers
- Paper-level AP archive with direct paper/key links, stage filters, provenance labels, and review status
- Persistent split-screen attempt mode for the verified 2018 Prelims Paper I Booklet C scan and its 100-entry official key
- Official Kerala and Rajasthan SI papers with answer keys for topic-wise training
- 411 unique original questions across all five subject groups
- 50 deterministic, hard-heavy mock-test blueprints: 40 sectionals and 10 full 100-question simulations
- Full-screen timer, question palette, answer state, hints, and review flags
- Daily activity, streak, accuracy, subject diagnosis, and category-aware readiness
- Browser persistence plus JSON export/import for backups

## Current content status

The current release contains 411 reviewed, original questions, including 113 hard items across Arithmetic, Reasoning, General Studies, AP Focus and English. Hard Practice groups them by topic and derives each challenge timer from the editorial solve-time targets. Every mock selects hard questions first, fills the remaining blueprint with medium and foundation checks, and avoids repetition inside that attempt. Each numbered mock remains reproducible on retry; questions may reappear across different numbered mocks so performance can be compared against a stable editorial bank.

The PYQ catalogue currently indexes 16 AP archive records: 13 retrievable question-paper records and three older key-only records covering the surviving 2008(2), 2011, 2016, 2018 and 2023 material. The 2016, 2018 and 2023 prelims and final-written objective papers represent 1,800 questions; the 2011 community scan raises visible paper coverage to about 2,000 questions. Eight government-hosted Kerala and Rajasthan papers provide additional practice. The first interactive companion covers the full 2018 Prelims Paper I Booklet C: the 100-option key was transcribed from the APSLPRB key and cross-checked 100/100 against a separate solved copy. Its answer state and last question are stored with the rest of the user profile.

Lakshya does not claim a complete 20–25 year official AP SI archive because one could not be verified and AP SI recruitment was not conducted every year. The catalogue counts distinct papers rather than Set A/B/C/D reorderings. It distinguishes official sources, verified mirrors, community scans and surviving answer-key records. PDFs remain linked to their source; interactive imports are released only after question order, options and booklet-specific keys are checked. Commercial books such as R.S. Aggarwal are linked as references and are not copied.

## Run locally

```bash
npm install
npm run dev
```

Production checks:

```bash
npm run lint
npm run build
```

## Android app

Download the current APK from [GitHub Releases](https://github.com/tpavan03/lakshya-ap-si-prep/releases/latest). Android may ask you to allow installs from your browser or file manager the first time you sideload it.

To rebuild the APK, install Android Studio or the Android SDK plus JDK 21, then run:

```bash
npm run android:apk
```

The generated file is `android/app/build/outputs/apk/debug/app-debug.apk`. Google login returns to the app through the `com.tpavan.lakshya://login-callback` deep link. Add that exact URL to **Supabase → Authentication → URL Configuration → Redirect URLs** for native sign-in.

## Storage and future sync

Progress is stored in `localStorage` under `apsi-command:v1`. Use **Profile → Export JSON** for a portable backup. When Supabase environment variables are present, email magic-link or Google login automatically syncs the same state into an RLS-protected per-user row. Each Google account receives its own isolated progress record, shared between the website and Android app. Run [`supabase/migrations/001_user_state.sql`](supabase/migrations/001_user_state.sql) in the project SQL editor before enabling cloud sync.

## Source policy

The current exam profile links to the [official APSLPRB 2026 notification](https://slprb.ap.gov.in/2026_PDFS/SLPRB_AP_SI_Notification_2026.pdf). Foundation resources link to NCERT, the Legislative Department, RBI, NDMA, AP Government, and other primary sources. Every imported paper should carry its exam, year, state, source URL, verification status, and rights status.

## Technology

React 19 · TypeScript · Vite · Capacitor · Supabase · Lucide · CSS · Vercel

---

This is an independent preparation tool and is not affiliated with APSLPRB. Candidates should rely on the official board notice for recruitment rules and amendments.
