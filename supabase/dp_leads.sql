-- Run once in the Supabase SQL editor (any existing project, e.g. your marketplace project).
-- Stores sign-ups from the free-sample landing page.
--
-- Safe-by-design: the sign-up function uses only the project's PUBLIC "anon" key, and this
-- script lets that key do exactly one thing on this table: add a new row. It cannot read,
-- change or delete anything. Your service-role key is never needed and never leaves Supabase.

create table if not exists public.dp_leads (
  id         uuid primary key default gen_random_uuid(),
  email      text not null unique check (email = lower(email) and length(email) <= 254),
  source     text not null default 'step3-sample',
  consent    boolean not null default false check (consent),
  created_at timestamptz not null default now()
);

alter table public.dp_leads enable row level security;

-- Start from nothing, then grant the single permission needed.
revoke all on public.dp_leads from anon, authenticated;
grant insert (email, source, consent) on public.dp_leads to anon;

drop policy if exists "dp_leads: public sign-up (insert only)" on public.dp_leads;
create policy "dp_leads: public sign-up (insert only)"
  on public.dp_leads
  for insert
  to anon
  with check (
    consent is true
    and source = 'step3-sample'
    and email = lower(email)
    and length(email) <= 254
  );

-- There are deliberately NO select/update/delete policies.
-- To read your list: Supabase dashboard -> Table Editor -> dp_leads (you are logged in as owner),
-- or run:  select email, created_at from public.dp_leads order by created_at;
-- To export: Table Editor -> dp_leads -> Export to CSV.
