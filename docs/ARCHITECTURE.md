# VisaReady KR architecture

Status: Phase 0 baseline, October 2026.

## 1. What the product must guarantee

VisaReady KR tells a foreign resident in Korea which documents to bring for a
specific immigration action. A wrong checklist costs the user a wasted visit to
the immigration office or a missed deadline, so the architecture is built around
three guarantees:

1. **Deterministic rules.** The checklist is computed from versioned rule data
   and the user's answers. AI never decides which document, fee or deadline
   applies. AI may later explain or translate a verified requirement.
2. **Verified before production.** A production checklist can only come from a
   rule set that is `verified`, currently effective, and cites an official
   source for every requirement and fee.
3. **No silent rewrites.** A generated checklist records the rule set version
   that produced it. When rules change, an existing application is compared
   with the new version and the user is shown what changed; it is never
   rewritten behind their back.

## 2. Shape: a modular monolith

One Next.js app, deployed to Vercel, with hard module boundaries inside it.
A single deployable is the right size for an MVP with one team; the boundaries
keep the rules core extractable if it ever needs to be served elsewhere
(mobile app, partner API).

```
app/                      UI routes (React, Next.js). Thin: no rule logic.
lib/checklist-service.ts  Application layer: binds the engine to config + clock.
lib/config.ts             Runtime configuration (rules mode).
lib/rules/                Rules domain. Framework-free TypeScript.
  types.ts                RuleSet, Requirement, Condition, Source, Fee, Snapshot
  engine.ts               selectRuleSet, generateChecklist, compareWithLatest
  validate.ts             validateRuleSet, validateRegistry, validateAnswers
  condition.ts            Declarative condition evaluator (all / any / not / equals)
  answers.ts              Parses raw input into typed answers
  dates.ts                Asia/Seoul calendar dates
  registry.ts             Flow catalogue and every published rule set version
  data/                   Rule set data, one file per flow
  __tests__/              Unit tests (Vitest)
e2e/                      Browser tests against the production build (Playwright)
supabase/schema.sql       Database blueprint (not applied yet, see section 6)
```

Dependency rule: `app → lib/checklist-service → lib/rules`. `lib/rules` imports
nothing outside itself; ESLint (`no-restricted-imports` in `eslint.config.mjs`)
fails the build if it imports React, Next.js, Supabase or `@/…`.

## 3. Rules domain

### Rule set

A `RuleSet` is one immutable version of the rules for one flow:

| Field | Purpose |
| --- | --- |
| `flowId`, `version` | Identity. A change is a new version, never an edit. |
| `status` | `draft` → `in_review` → `verified` → `deprecated` |
| `effectiveFrom`, `effectiveTo` | Window in Asia/Seoul dates; `effectiveTo` is exclusive |
| `verification` | `verifiedAt`, `verifiedBy`; required when `verified` |
| `sources` | Official documents (HiKorea, Ministry of Justice, immigration office) with URL, retrieval date and locator |
| `fees` | KRW amounts, each citing sources, optionally conditional |
| `questions` | The facts this flow needs (`boolean` or `choice`) |
| `requirements` | Documents with Korean and English names, `required` or `conditional` + condition, and source ids |
| `changelog` | What changed versus the previous version |

### Selection

`selectRuleSet(ruleSets, flowId, on, mode)`:

- `production`: only `verified` versions whose window contains `on`; the
  highest version wins. No match returns `no-ruleset`, and the UI hides the
  flow instead of showing unverified content.
- `preview`: also accepts `draft` and `in_review`, but a verified version still
  wins. Output is marked `provisional` and the UI says so.

The mode comes from `NEXT_PUBLIC_RULES_MODE` (`production` or anything else for
preview). Every flow is a draft today, so deployments run in preview.

### Generation and drift

`generateChecklist(ruleSet, answers, generatedAt)` validates answers first
(missing, unknown or mistyped answers are an error, never a guess), then
evaluates conditions and returns a `ChecklistSnapshot` that carries
`ruleSetVersion`, the answers, items with their sources, and fees.

`compareWithLatest(snapshot, latest)` re-runs the latest version on the stored
answers and returns `added` / `removed` requirement ids, or the list of new
questions the user must answer first. It does not mutate the snapshot.

### Validation

`validateRegistry` runs in the unit test suite against the shipped data, so CI
rejects a rule change that breaks any of these:

- unique versions per flow, unique ids inside a version
- valid dates, `effectiveTo` after `effectiveFrom`
- no overlapping effective windows between verified versions of one flow
- every condition reads a declared question
- every source reference resolves; sources use https
- verified versions cite at least one source per requirement and fee and carry
  a verification record

## 4. Decisions

**D1. Rule data lives in the repository, not the database (for the MVP).**
Rules are typed TypeScript data reviewed through pull requests, validated by
CI and versioned by git. This gives review, history and rollback for free and
avoids building an admin CMS before there are rules worth editing at scale.
Revisit when non-engineers need to publish rule changes weekly; at that point
the same `RuleSet` shape moves to a `rule_sets` table and the engine does not
change.

**D2. The engine is pure.** No clock, no environment, no I/O inside
`lib/rules`. The application layer passes the date and mode. This keeps every
rule behaviour unit-testable with plain fixtures.

**D3. Snapshots over references.** An application stores the full checklist
snapshot and its rule set version, not a live reference to requirement rows.
Storage is cheap; a silently changed checklist is not.

**D4. Test the production build end to end.** Playwright runs against
`next start`, which matches what users get and avoids dev-server process
leaks seen on Windows.

**D5. No web fonts at build time.** The app uses a system font stack, so
builds work offline and in locked-down CI. `turbopack.root` is pinned in
`next.config.ts` so a stray lockfile in a parent folder cannot change the
workspace root.

## 5. Quality gates

| Command | Checks |
| --- | --- |
| `npm run typecheck` | `strict`, `noUncheckedIndexedAccess`, `noImplicitReturns`, `noImplicitOverride`, `noFallthroughCasesInSwitch` |
| `npm run lint` | Next.js core-web-vitals + TypeScript rules, rules-domain import boundary, zero warnings |
| `npm test` | Vitest unit tests for the rules domain, including validation of shipped data |
| `npm run build` | Production build |
| `npm run test:e2e` | Playwright against the production build |
| `npm run check` | typecheck + lint + test + build |

CI (`.github/workflows/ci.yml`) runs all of the above with `npm ci` on the
committed lockfile, Node from `.nvmrc`, on pushes to `main` and `feature/**`
and on every pull request.

## 6. Known gaps (tracked in BACKLOG.md)

- **No rule set is verified.** All three flows are drafts migrated from the
  demo; no requirement cites a source and no fee is recorded. This is the
  critical path to launch, and it is research work, not code.
- **Database blueprint does not match D3.** `supabase/schema.sql` models
  requirements as live rows and links checklist items to `requirements.id`
  without pinning a rule set version. It must be revised before persistence
  ships (backlog P0-6).
- **No persistence.** Progress lives in React state and is lost on refresh.
- **No i18n.** The landing page advertises EN · VI · 中文 · UZ but only
  English exists.
- **One question per flow.** Real flows need more facts (program type,
  funding, part-time work, prior D-10 duration); which ones is an output of
  source research.
