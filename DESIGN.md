---
version: alpha
name: Exam Prep King
colors:
  primary: '#2354d1'
  ink: '#172649'
  muted: '#586781'
  background: '#f3f6fc'
  surface: '#ffffff'
  accent: '#f5bc52'
  success: '#14775a'
  danger: '#b83445'
typography:
  display:
    fontFamily: 'Outfit, sans-serif'
  body:
    fontFamily: 'Public Sans, sans-serif'
rounded:
  card: '20px'
  button: '10px'
spacing:
  unit: '4px'
components:
  button:
    height: '44px'
    backgroundColor: '{colors.primary}'
    textColor: '#ffffff'
  text:
    textColor: '{colors.ink}'
  caption:
    textColor: '{colors.muted}'
  crown:
    textColor: '{colors.accent}'
  correct:
    textColor: '{colors.success}'
  incorrect:
    textColor: '{colors.danger}'
---
# Exam Prep King

## Overview
An exam training cockpit for Indian graduate recruitment aspirants studying on phones and laptops. Product register. The signature is the exam runway: a connected Prelims → Mains route with paper-specific test cards. The user authorized the Lakshya rebrand and multi-exam expansion. Preserve the Android application ID and existing accounts.

## Colors
Runtime source of truth is `src/index.css`; the tokens above map directly to its primary, ink, muted, background, surface, accent, success and danger custom properties. Royal blue identifies actions; gold identifies the crown and milestones. Navy navigation gives the study area a quiet boundary. Green means correct, red means incorrect, and both require text or icons. Avoid decorative gradients and invented performance claims.

## Typography
Outfit supplies compact, confident headings. Public Sans supplies readable question text and controls. Fonts are bundled for APK/offline use; system sans-serif is the fallback. English UI with en-IN formatting; original PDFs retain source languages, with Unicode script fallbacks.

## Layout
248px desktop navigation, a bounded 1240px content column, and generous question-reading measure. Collapse navigation on mobile, preserve all test actions, and allow the question palette its own scroll region. Natural document scrolling for study pages. Cards use a 4px spacing unit and consistent 20px radius.

## Elevation & Depth
Subtle card shadows only; overlays are distinct and the active test has an uninterrupted workspace. Reduced motion disables transitions. No ambient animation.

## Shapes
20px cards, 10px controls, pill metadata. The crown icon belongs to the brand, not every card. Lucide icons always accompany clear labels on primary actions.

## Components
Shared page headers, buttons, badges, native selects and a native-dialog based modal. Native selects deliberately use OS popup behavior. Test runner owns scoring and section timers through examEngine. Reports share the same correct/wrong/unanswered vocabulary as the runner. Test series expose 30 numbered mock cards per paper, six per page, with a total count, visible page buttons and completion/score states. Paper archive search and native selects use labeled grid fields with natural height, app typography and a compact source note; original source details remain expandable. All owned scroll regions inherit the global scrollbar tokens.

## Do's and Don'ts
Show the paper identity, source quality, question count and time before starting. Keep editorial practice and memory-based reconstructions visibly distinct from original papers. Never invent official cutoffs, ranks, current affairs, verification dates or specialist coverage. Avoid hero images, celebratory clutter and making a full simulation silently shorter when the bank is insufficient.
