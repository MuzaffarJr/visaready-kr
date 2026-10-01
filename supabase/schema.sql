-- VisaReady KR database blueprint.
-- Apply to a dedicated Supabase project after billing/project creation is confirmed.
-- All public-schema tables enable RLS and use least-privilege grants.

create table if not exists public.visa_flows (
  id text primary key,
  current_status text not null,
  target_action text not null,
  status text not null default 'draft'
    check (status in ('draft', 'verified', 'needs_review', 'deprecated')),
  last_verified_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.requirements (
  id text primary key,
  flow_id text not null references public.visa_flows(id) on delete cascade,
  korean_name text not null,
  requirement_type text not null
    check (requirement_type in ('required', 'conditional', 'optional')),
  explanation_key text not null,
  official_source_url text,
  source_title text,
  source_authority text,
  effective_from date,
  effective_to date,
  verification_status text not null default 'draft'
    check (verification_status in ('draft', 'verified', 'needs_review', 'deprecated')),
  last_verified_at timestamptz,
  rule_version integer not null default 1 check (rule_version > 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists requirements_flow_id_idx
  on public.requirements(flow_id);

create table if not exists public.requirement_translations (
  requirement_id text not null references public.requirements(id) on delete cascade,
  locale text not null check (locale in ('en', 'vi', 'zh-CN', 'uz', 'ko')),
  display_name text not null,
  explanation text,
  where_to_get text,
  primary key (requirement_id, locale)
);

create table if not exists public.rule_conditions (
  id uuid primary key default gen_random_uuid(),
  requirement_id text not null references public.requirements(id) on delete cascade,
  condition jsonb not null default '{}'::jsonb,
  priority integer not null default 100,
  enabled boolean not null default true,
  created_at timestamptz not null default now()
);

create index if not exists rule_conditions_requirement_id_idx
  on public.rule_conditions(requirement_id);

create table if not exists public.applications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  flow_id text not null references public.visa_flows(id),
  locale text not null default 'en',
  status text not null default 'in_progress'
    check (status in ('in_progress', 'ready', 'archived')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists applications_user_id_idx
  on public.applications(user_id);

create table if not exists public.application_answers (
  application_id uuid not null references public.applications(id) on delete cascade,
  question_key text not null,
  answer jsonb not null,
  updated_at timestamptz not null default now(),
  primary key (application_id, question_key)
);

create table if not exists public.application_checklist_items (
  application_id uuid not null references public.applications(id) on delete cascade,
  requirement_id text not null references public.requirements(id),
  is_ready boolean not null default false,
  updated_at timestamptz not null default now(),
  primary key (application_id, requirement_id)
);

alter table public.visa_flows enable row level security;
alter table public.requirements enable row level security;
alter table public.requirement_translations enable row level security;
alter table public.rule_conditions enable row level security;
alter table public.applications enable row level security;
alter table public.application_answers enable row level security;
alter table public.application_checklist_items enable row level security;

revoke all on public.visa_flows from anon, authenticated;
revoke all on public.requirements from anon, authenticated;
revoke all on public.requirement_translations from anon, authenticated;
revoke all on public.rule_conditions from anon, authenticated;
revoke all on public.applications from anon, authenticated;
revoke all on public.application_answers from anon, authenticated;
revoke all on public.application_checklist_items from anon, authenticated;

grant select on public.visa_flows to anon, authenticated;
grant select on public.requirements to anon, authenticated;
grant select on public.requirement_translations to anon, authenticated;
grant select on public.rule_conditions to anon, authenticated;

grant select, insert, update, delete on public.applications to authenticated;
grant select, insert, update, delete on public.application_answers to authenticated;
grant select, insert, update, delete on public.application_checklist_items to authenticated;

create policy "public can read verified visa flows"
on public.visa_flows for select
to anon, authenticated
using (status = 'verified');

create policy "public can read verified requirements"
on public.requirements for select
to anon, authenticated
using (verification_status = 'verified');

create policy "public can read translations for verified requirements"
on public.requirement_translations for select
to anon, authenticated
using (
  exists (
    select 1
    from public.requirements r
    where r.id = requirement_id
      and r.verification_status = 'verified'
  )
);

create policy "public can read active conditions for verified requirements"
on public.rule_conditions for select
to anon, authenticated
using (
  enabled
  and exists (
    select 1
    from public.requirements r
    where r.id = requirement_id
      and r.verification_status = 'verified'
  )
);

create policy "users can read own applications"
on public.applications for select
to authenticated
using ((select auth.uid()) = user_id);

create policy "users can insert own applications"
on public.applications for insert
to authenticated
with check ((select auth.uid()) = user_id);

create policy "users can update own applications"
on public.applications for update
to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

create policy "users can delete own applications"
on public.applications for delete
to authenticated
using ((select auth.uid()) = user_id);

create policy "users can read own answers"
on public.application_answers for select
to authenticated
using (
  exists (
    select 1
    from public.applications a
    where a.id = application_id
      and a.user_id = (select auth.uid())
  )
);

create policy "users can insert own answers"
on public.application_answers for insert
to authenticated
with check (
  exists (
    select 1
    from public.applications a
    where a.id = application_id
      and a.user_id = (select auth.uid())
  )
);

create policy "users can update own answers"
on public.application_answers for update
to authenticated
using (
  exists (
    select 1
    from public.applications a
    where a.id = application_id
      and a.user_id = (select auth.uid())
  )
)
with check (
  exists (
    select 1
    from public.applications a
    where a.id = application_id
      and a.user_id = (select auth.uid())
  )
);

create policy "users can delete own answers"
on public.application_answers for delete
to authenticated
using (
  exists (
    select 1
    from public.applications a
    where a.id = application_id
      and a.user_id = (select auth.uid())
  )
);

create policy "users can read own checklist"
on public.application_checklist_items for select
to authenticated
using (
  exists (
    select 1
    from public.applications a
    where a.id = application_id
      and a.user_id = (select auth.uid())
  )
);

create policy "users can insert own checklist"
on public.application_checklist_items for insert
to authenticated
with check (
  exists (
    select 1
    from public.applications a
    where a.id = application_id
      and a.user_id = (select auth.uid())
  )
);

create policy "users can update own checklist"
on public.application_checklist_items for update
to authenticated
using (
  exists (
    select 1
    from public.applications a
    where a.id = application_id
      and a.user_id = (select auth.uid())
  )
)
with check (
  exists (
    select 1
    from public.applications a
    where a.id = application_id
      and a.user_id = (select auth.uid())
  )
);

create policy "users can delete own checklist"
on public.application_checklist_items for delete
to authenticated
using (
  exists (
    select 1
    from public.applications a
    where a.id = application_id
      and a.user_id = (select auth.uid())
  )
);
