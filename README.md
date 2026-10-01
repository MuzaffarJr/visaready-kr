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

## Core architecture rule

AI is not the source of truth for immigration requirements.

Checklist generation is deterministic:

User answers → rules engine → canonical requirement IDs → localized presentation.

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
npm install
npm run dev
```

Then open `http://localhost:3000`.

## Quality checks

```bash
npm run typecheck
npm run lint
npm run build
```

## Environment

Copy `.env.example` to `.env.local` when the dedicated Supabase project is connected.

Never commit real secrets or service-role credentials.

## Database

The current secure schema blueprint is in:

```
supabase/schema.sql
```

It enables RLS on all exposed tables and separates public verified requirements from owner-only application data.
