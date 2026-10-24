create table if not exists public.assessment_attempts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  activity text not null check (activity in ('exercicios','simulado-1','simulado-2')),
  score integer not null check (score >= 0),
  total integer not null check (total > 0),
  answers jsonb not null default '{}'::jsonb,
  completed_at timestamptz not null default now()
);
alter table public.assessment_attempts enable row level security;
drop policy if exists assessment_attempts_own on public.assessment_attempts;
create policy assessment_attempts_own on public.assessment_attempts for all to authenticated
using (user_id = (select auth.uid()) or (select public.is_admin()))
with check (user_id = (select auth.uid()));
create index if not exists assessment_attempts_user_idx on public.assessment_attempts(user_id, completed_at desc);
