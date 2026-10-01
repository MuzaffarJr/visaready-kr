# VisaReady KR MVP backlog

Prioritised for a first real launch: one verified flow used by real D-2
students, rather than three provisional flows. Each task is sized to fit one
pull request (S ≤ half a day, M ≤ two days) and has acceptance criteria an
agent or reviewer can check.

**MVP definition of done:** at least one flow runs in `production` rules mode
with every requirement and fee citing an official source; a user can finish
the flow in Uzbek or English, keep their progress, and print the checklist
with Korean document names for the immigration office.

## Phase 0 (done in this branch)

- [x] Rules domain module: versioned rule sets, sources, fees, conditions, verification record
- [x] Pure engine: `selectRuleSet`, `generateChecklist`, `compareWithLatest`
- [x] Rule data validation in CI (`validateRegistry` over shipped data)
- [x] Production / preview rules mode; provisional labelling in the UI
- [x] Data-driven questionnaire (any number of boolean or choice questions)
- [x] Strict TypeScript, zero-warning lint, framework-free boundary for `lib/rules`
- [x] Vitest unit tests (26) and Playwright E2E against the production build (3)
- [x] CI on `npm ci` + committed lockfile, Node pinned via `.nvmrc`
- [x] `turbopack.root` pinned, system font stack (offline builds)

## P0 progress

- [x] P0-4 governance: `CODEOWNERS`, PR template with rule-change checklist, `npm run rules:report` in the CI job summary
- [x] P0-5 landing copy now matches what exists (no unshipped language claims)
- [x] P0-7 disclaimer and privacy note in the site footer; checklist shows the verification date or "provisional"
- [x] P0-8 security headers (CSP, HSTS, frame, referrer, permissions), checked by E2E with a no-console-error happy path
- [x] P1-2 (pulled forward) local persistence: snapshot + progress in localStorage, resume without answers, "rules updated" banner that never rewrites the checklist until the user accepts; covered by E2E
- [x] P0-1 research draft for D-2 extension in `docs/research/d2-extension.md` (fee, legal basis and core documents confirmed from official pages; money-proof amounts and GPA/attendance waivers still unconfirmed)
- [x] P0-2 D-2 extension v2 encoded from that research as `draft` (9/9 requirements cite sources, KRW 60,000 fee); v1 untouched
- [x] Law search (`/law`): Immigration Act ko + en, 150 aligned articles, Uzbek/Korean/English queries and article references, verbatim text with version warning
- [ ] P0-9 load the **current** Immigration Act, Enforcement Decree and Enforcement Rules (with 별표 5의2) from law.go.kr into the law corpus; the supplied PDFs are the 2016 version
- [ ] P0-10 HiKorea guide snapshots: fetch the relevant 체류민원 pages from an allowed network, store text + retrieval date + content hash, index them next to the law
- [ ] P0-3 human review: open Annex 5-2 directly, get the current MOJ student guideline and residence-status manual from HiKorea, resolve the conflicts listed in the research note, then promote v2 to `verified`

## P0: required before any real user sees a checklist

| ID | Task | Size | Acceptance |
| --- | --- | --- | --- |
| P0-1 | **Source research for D-2 extension.** Collect the current HiKorea / Ministry of Justice requirement list and fee for 체류기간 연장 (D-2), including conditional documents by program type (degree vs language), funding and part-time work. Record URL, retrieval date and section for each. | M (research) | A filled research note in `docs/research/d2-extension.md`; every requirement and the fee map to a source; open questions listed. |
| P0-2 | **Encode D-2 extension v2 from P0-1.** New `RuleSet` version with real questions, conditions, sources, fees; status `in_review`. | S | `validateRegistry` passes; unit tests cover each condition branch; v1 untouched. |
| P0-3 | **Human verification and promotion.** A second reviewer checks v2 against sources (ideally confirmed with an immigration office or 1345 call), sets `verified` + `verification`. | S | PR includes reviewer name and date; `selectRuleSet(..., "production")` returns v2. |
| P0-4 | **Rule change governance.** `CODEOWNERS` for `lib/rules/data/`, PR template with a rule-change checklist (sources cited, changelog written, old version untouched), and `npm run rules:report` that prints status, effective window and source coverage per flow. | S | Report runs in CI and is attached to the job summary. |
| P0-5 | **Remove claims the product cannot back.** Landing page shows "4 launch languages" and EN · VI · 中文 · UZ while only English exists. Make copy match reality until P1-1 ships. | S | No user-facing claim without an implementation behind it. |
| P0-6 | **Revise the Supabase blueprint to snapshots.** `applications` gets `rule_set_version`; checklist stored as a snapshot (`jsonb`) plus per-item ready state; drop public requirement tables (rules live in the repo, decision D1). Keep RLS owner-only. | M | Schema reviewed; RLS policies tested with two users in a local Supabase. |
| P0-7 | **Legal and safety copy.** Disclaimer ("preparation aid, not legal advice"), last-verified date on every checklist, privacy notice. | S | Shown on checklist and footer; reviewed by owner. |
| P0-8 | **Security headers.** CSP, `Referrer-Policy`, `X-Content-Type-Options`, `Permissions-Policy` via `next.config.ts` headers. | S | E2E asserts headers on `/`; no CSP violations in the happy path. |

## P1: MVP launch

| ID | Task | Size | Acceptance |
| --- | --- | --- | --- |
| P1-1 | **i18n for en and uz.** Locale routing, message catalogues for UI copy and requirement text keyed by `requirementId` + rule set version; Korean names always shown. vi and zh-CN follow once translators are available. | M | Switching locale keeps answers; missing translation falls back to English and is reported by a test. |
| P1-2 | **Local persistence.** Save the `ChecklistSnapshot` and ready-state in `localStorage` (no account needed). On load, run `compareWithLatest` and show a "rules updated" banner with added/removed items. | M | Refresh keeps progress; a fixture v2 triggers the banner in E2E. |
| P1-3 | **Printable checklist.** Print stylesheet / PDF with Korean and localized names, sources and fee, for the office visit. | S | Print preview fits A4; E2E checks the print media query renders items. |
| P1-4 | **Encode and verify D-2 → D-10 and D-10 extension.** Same P0-1…P0-3 loop per flow. | M each | Both flows available in production mode. |
| P1-5 | **Product analytics.** Privacy-friendly events: `flow_selected`, `questionnaire_completed`, `checklist_generated`, `item_marked_ready`, `checklist_printed`. No answers or PII in payloads. | S | Funnel visible in the dashboard; payload schema unit-tested. |
| P1-6 | **Error monitoring.** Sentry (or Vercel equivalent) for client and server errors, with source maps. | S | A thrown test error appears with a readable stack. |
| P1-7 | **Deploy pipeline.** Vercel preview per PR, production on `main` with `NEXT_PUBLIC_RULES_MODE=production`. | S | Preview URL posted on PRs; production hides unverified flows. |
| P1-8 | **Accessibility pass.** Keyboard flow, focus rings, progress announced to screen readers, contrast AA. | S | axe check in E2E reports no serious violations. |

## P2: after launch

| ID | Task | Size |
| --- | --- | --- |
| P2-1 | Accounts with Supabase (magic link) and server-side snapshot sync, using the P0-6 schema | M |
| P2-2 | Deadline reminders (residence card expiry minus N days) by email | M |
| P2-3 | Source monitoring: scheduled job that fetches cited source pages and opens an issue when content hash changes | M |
| P2-4 | AI explanation layer: explains a verified requirement in the user's language, grounded only on the cited source; never adds requirements | M |
| P2-5 | Partner channel: university international offices embed or link a pre-filled flow | M |
| P2-6 | More flows (E-7, F-2-7) driven by demand data from P1-5 | M each |

## Validation track (runs in parallel with P0)

The product risk is not technical. Before P1, test the core hypothesis:
*international students in Korea will use and trust a checklist tool over
asking seniors, university offices or KakaoTalk groups.*

- Interview 8–10 D-2 students (Uzbek and Vietnamese communities first) about
  their last extension: what went wrong, where they looked, what they would pay
  or share.
- Put the preview build in front of 3 of them and watch them complete it.
- **Go** to P1 if most interviewees report at least one wasted visit or
  missing document and complete the preview flow without help. **Rethink** if
  the university office already solves this reliably for them.
