create table if not exists public.essay_submissions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  title text not null default 'Redação sem título',
  prompt text not null,
  essay text not null check (length(essay) between 100 and 12000),
  status text not null default 'pending' check (status in ('pending','completed','failed')),
  score integer check (score is null or (score between 0 and 1000)),
  feedback jsonb,
  created_at timestamptz not null default now()
);
alter table public.essay_submissions enable row level security;
drop policy if exists essay_submissions_own on public.essay_submissions;
create policy essay_submissions_own on public.essay_submissions for all to authenticated
using (user_id = (select auth.uid()) or (select public.is_admin()))
with check (user_id = (select auth.uid()) or (select public.is_admin()));
create index if not exists essay_submissions_user_idx on public.essay_submissions(user_id, created_at desc);

create table if not exists public.account_access_fingerprints (
  user_id uuid not null references public.profiles(id) on delete cascade,
  fingerprint_hash text not null,
  first_seen timestamptz not null default now(),
  last_seen timestamptz not null default now(),
  seen_count integer not null default 1,
  user_agent text not null default '',
  primary key(user_id, fingerprint_hash)
);
alter table public.account_access_fingerprints enable row level security;
drop policy if exists access_fingerprints_admin on public.account_access_fingerprints;
create policy access_fingerprints_admin on public.account_access_fingerprints for select to authenticated
using ((select public.is_admin()) or user_id = (select auth.uid()));
create index if not exists access_fingerprints_user_idx on public.account_access_fingerprints(user_id, last_seen desc);

create or replace function public.record_access_fingerprint(p_user_id uuid, p_fingerprint_hash text, p_user_agent text) returns void language plpgsql security definer set search_path=public as $$
begin
  if p_user_id <> auth.uid() and not public.is_admin() then
    raise exception 'access denied';
  end if;
  insert into public.account_access_fingerprints(user_id, fingerprint_hash, user_agent)
  values (p_user_id, p_fingerprint_hash, left(coalesce(p_user_agent, ''), 500))
  on conflict (user_id, fingerprint_hash) do update set seen_count = account_access_fingerprints.seen_count + 1, last_seen = now(), user_agent = excluded.user_agent;
end;
$$;
revoke all on function public.record_access_fingerprint(uuid,text,text) from public, anon, authenticated;
grant execute on function public.record_access_fingerprint(uuid,text,text) to authenticated, service_role;
