-- Keep the production administrator allow-list reproducible across restores.
insert into public.admin_invites (email, name, active)
values ('kauango.dev@gmail.com', 'Kauan', true)
on conflict (email) do update
set name = excluded.name,
    active = true;
