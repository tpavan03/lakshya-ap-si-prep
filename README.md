# Exam Prep King

A preparation desk for **AP Police SI** and **NICL AO Generalist / Information Technology Specialist**, built with React, TypeScript, Vite, Capacitor and the existing Supabase backend.

[Open the app](https://lakshya-ap-si-prep.vercel.app) · [Android releases](https://github.com/tpavan03/lakshya-ap-si-prep/releases)

## Preparation routes

- AP SI Civil: separate 100-question / 180-minute Prelims papers and 200-question / 180-minute Mains objective papers, plus language writing practice.
- NICL common Prelims: English 30, Reasoning 35, Quant 35; 20 minutes per section.
- NICL Generalist Mains: five 50-question sections, 180 minutes total.
- NICL IT Mains: five common 40-question sections plus 50 professional IT questions, using the specialist section timings.
- NICL objective marking: +1 correct, −0.25 wrong, 0 unanswered. Descriptive English is a separate 30-minute qualifying practice desk with essay, précis and comprehension.
- Thirty visibly numbered mock tests per paper, strict full-paper coverage, hard-weighted and topic-diverse selection, resume across reloads, review flags, absolute section deadlines, detailed post-test answers and subject reports.
- Custom practice by subjects, topic, difficulty, count and time, including saved questions and mistakes.

Patterns are sourced from the 2026 notifications in [exam sources](docs/exam-sources.md). Simulations contain **editorially authored practice**, not historical questions. AP Civil weighting is explicit; AR merit weighting differs. No fabricated ranks, cutoffs or exam dates are shown.

## Content and original papers

The existing AP library has 4,631 questions. NICL adds 627 original questions across quantitative aptitude, reasoning, English, general awareness, computer knowledge and IT professional knowledge, plus seven study chapters. Parameterized question families are disclosed; those variants are not different historical papers.

The archive retains 24 SI records and adds three NICL publisher reconstructions. Three AP original scans have matched booklet-specific keys, including the amended dual answer for 2023 Paper II Q95. NICL 2017/2024/2025 papers are explicitly **memory-based**, retain visible source solutions. The 2024/2025 papers use matched publisher keys; 2017 has a full source PDF and manual answer-sheet review with its historical composite timer. Other original scans have timed manual answer sheets when timing is verified; no score is invented without a matching key. See [paper provenance](docs/paper-provenance.md).

## Local development and checks

```bash
npm ci
cp .env.example .env.local
npm run dev
```

Configure the same existing Supabase URL and publishable key in `.env.local`. Without configuration, the app runs locally; with configuration, signed-out users can also choose **Explore on this device**. Never place a service-role key in the browser.

```bash
npm run lint
npm test
npm run validate:bank
npm run validate:papers
npm run test:e2e
npm run build
```

Browser tests expect the dev server at `http://127.0.0.1:5173` and Chrome at `/opt/google/chrome/chrome`; override `APP_URL` and `CHROME_BIN` as needed. They cover exact section locks, reload recovery, submission, legacy migration, writing drafts, mobile layout and axe accessibility checks. DESIGN.md and UX-CONTRACT.md record the shared design and behavior.

## Progress and existing backend

The established `apsi-command:v1` local key and Supabase `user_state` table remain in use. Legacy AP data migrates into the AP exam; NICL progress is separate and attempts record Generalist/IT stream identity. Existing rows need no migration. Sign-in keeps per-account ownership, blocks uploads before hydration and serializes writes. JSON backups include both exams; old Lakshya backups remain importable.

Writing drafts and active tests stay on the device. Account-scoped writing drafts prevent another signed-in candidate seeing them. Export before clearing browser data.

**Backend verification on 28 October 2026:** the existing Supabase project is restored; refreshing PostgREST's cache made the existing table available without a migration. Auth health/settings return **200**, with Google and email enabled. Disposable authenticated users passed **insert, upsert and reload** for both exam namespaces, while cross-account reads/writes and anonymous writes were blocked. All test users and rows were removed. See [`docs/backend-verification.md`](docs/backend-verification.md) for exact results and the remaining OAuth/device verification limits.

## Android

```bash
npm run android:apk
```

Requires JDK 21, Android SDK/platform 35 and accepted SDK licenses. Output: `android/app/build/outputs/apk/debug/app-debug.apk`. Package `com.tpavan.lakshya` and OAuth callback `com.tpavan.lakshya://login-callback` are preserved. Keep that callback in Supabase’s redirect allowlist.

Version 2.0.0 uses a persistent debug signing key. The earlier published APK was signed elsewhere and its private key was unavailable here: export your existing progress before uninstalling the old APK and installing this build. New builds signed with the persisted key can update this version.

The GitHub Android workflow uses repository variables `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY`, and secret `ANDROID_DEBUG_KEYSTORE_BASE64`. It runs manually or on version tags and uploads the APK as a build artifact.

## Existing Vercel project

Deployment targets the existing `lakshya-ap-si-prep` project and production domain. No replacement frontend or Supabase database is created. Direct deployment uses `npx vercel --prod --yes` from the linked checkout.

Automatic deployment from GitHub requires both a `tpavan03` Login Connection in Vercel and repository access through the Vercel GitHub app. The account connection is now accepted, but `vercel git connect` still reports missing repository access. Authorize the Vercel GitHub app for this repository, then link it in the existing Vercel project's Git settings. Current production has already been deployed directly; pushes alone will not redeploy until that repository connection succeeds.
