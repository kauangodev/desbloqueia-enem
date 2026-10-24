alter table public.essay_submissions
  alter column essay set default '';

alter table public.essay_submissions
  add column if not exists image_path text,
  add column if not exists image_mime text;

alter table public.essay_submissions drop constraint if exists essay_submissions_essay_check;
alter table public.essay_submissions add constraint essay_submissions_essay_check
  check (length(essay) between 0 and 12000 and (length(essay) >= 100 or image_path is not null));

create table if not exists public.support_tickets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  email text not null,
  subject text not null check (length(subject) between 3 and 140),
  message text not null check (length(message) between 10 and 4000),
  status text not null default 'open' check (status in ('open', 'in_progress', 'resolved')),
  priority text not null default 'normal' check (priority in ('normal', 'high')),
  admin_note text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.support_tickets enable row level security;
drop policy if exists support_tickets_own on public.support_tickets;
create policy support_tickets_own on public.support_tickets for select to authenticated
using (user_id = (select auth.uid()) or (select public.is_admin()));
drop policy if exists support_tickets_insert on public.support_tickets;
create policy support_tickets_insert on public.support_tickets for insert to authenticated
with check (user_id = (select auth.uid()));
drop policy if exists support_tickets_admin on public.support_tickets;
create policy support_tickets_admin on public.support_tickets for update to authenticated
using ((select public.is_admin())) with check ((select public.is_admin()));
create index if not exists support_tickets_status_idx on public.support_tickets(status, updated_at desc);
create index if not exists support_tickets_user_idx on public.support_tickets(user_id, created_at desc);

insert into storage.buckets (id, name, public)
values ('essays', 'essays', false)
on conflict (id) do nothing;

