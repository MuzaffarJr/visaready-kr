# VisaReady KR

VisaReady KR is a multilingual Korean visa document checklist engine for foreigners in South Korea.

## MVP scope

Initial flows:

- D-2 visa extension
- D-2 → D-10 status change
- D-10 visa extension

Initial locales:

- English
- Vietnamese
- Simplified Chinese
- Uzbek

Korean terminology is stored with every canonical requirement.

## Current vertical slice

The first working product path is:

Landing → visa flow selection → contextual questionnaire → deterministic checklist → readiness progress.

Current requirement records are intentionally marked **demo / unverified**. They must not be represented as official filing requirements until they are mapped to verified Korean immigration sources.

## Documentation

- [Architecture](docs/ARCHITECTURE.md): module boundaries, rules domain, decisions, quality gates
- [Backlog](docs/BACKLOG.md): prioritised MVP tasks with acceptance criteria

## Core architecture rule

AI is not the source of truth for immigration requirements.

Checklist generation is deterministic:

User answers → versioned rule set → rules engine → checklist snapshot (pinned to the rule set version) → localized presentation.

The rules domain lives in `lib/rules/` and is framework-free. Production mode (`NEXT_PUBLIC_RULES_MODE=production`) only serves verified, currently effective rule sets; preview mode also serves drafts and labels the checklist as provisional.

AI may later explain or translate verified requirements, but it must not invent eligibility rules, deadlines, fees, or required documents.

## Stack

- Next.js
- React
- TypeScript
- Tailwind CSS
- Supabase (schema blueprint prepared; dedicated project pending)
- GitHub Actions

## Local development

```bash
npm ci
npm run dev
```

Then open `http://localhost:3000`.

## Quality checks

Requires Node 22.12+ (CI uses the version in `.nvmrc`).

```bash
npm run typecheck   # strict TypeScript
npm run lint        # zero warnings, rules-domain import boundary
npm test            # Vitest unit tests
npm run build
npm run test:e2e    # Playwright against the production build (run after build)
npm run check       # typecheck + lint + test + build
```

For E2E, install the browser once with `npx playwright install chromium`, or point
`PLAYWRIGHT_CHROMIUM_EXECUTABLE` at an existing Chromium.

## Environment

Copy `.env.example` to `.env.local` when the dedicated Supabase project is connected.

Never commit real secrets or service-role credentials.

## Database

The current secure schema blueprint is in:

```
supabase/schema.sql
```

It enables RLS on all exposed tables and separates public verified requirements from owner-only application data.
