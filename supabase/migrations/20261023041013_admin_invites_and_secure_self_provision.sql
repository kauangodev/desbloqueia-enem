-- An invite is an allow-list entry, not an Auth account. The account is created
-- only after the owner proves possession of the invited email through a magic link.
create table public.admin_invites (
  email text primary key check (email = lower(email)),
  name text not null default '',
  active boolean not null default true,
  created_at timestamptz not null default now()
);

alter table public.admin_invites enable row level security;

create or replace function public.new_profile() returns trigger
language plpgsql
security definer
set search_path=public
as $$
declare
  v_email text := lower(new.email);
  v_invite public.admin_invites%rowtype;
begin
  select * into v_invite
  from public.admin_invites
  where email = v_email and active;

  insert into public.profiles(id,email,name,role)
  values(
    new.id,
    v_email,
    coalesce(nullif(new.raw_user_meta_data->>'name', ''), v_invite.name, ''),
    case when v_invite.email is not null then 'admin' else 'student' end
  );

  update public.entitlements set user_id=new.id where email=v_email;
  return new;
end
$$;

revoke all on table public.admin_invites from public, anon, authenticated;
revoke all on function public.new_profile() from public, anon, authenticated;

create index if not exists orders_email_idx on public.orders(email);
create index if not exists orders_created_at_idx on public.orders(created_at desc);
create index if not exists entitlements_email_idx on public.entitlements(email);
create index if not exists email_deliveries_email_idx on public.email_deliveries(email);
