-- Restrict privileged helpers and optimize the most common authorization lookups.
revoke all on function public.is_admin() from public, anon;
grant execute on function public.is_admin() to authenticated, service_role;

revoke all on function public.has_plan(text) from public, anon;
grant execute on function public.has_plan(text) to authenticated, service_role;

revoke all on function public.new_profile() from public, anon, authenticated;

create index if not exists entitlements_plan_idx on public.entitlements(plan);
create index if not exists entitlements_user_id_idx on public.entitlements(user_id);
create index if not exists materials_plan_idx on public.materials(plan);
create index if not exists orders_plan_idx on public.orders(plan);
create index if not exists reading_progress_material_id_idx on public.reading_progress(material_id);
create index if not exists study_progress_user_id_idx on public.study_progress(user_id);

drop policy if exists profiles_read on public.profiles;
create policy profiles_read on public.profiles
for select to authenticated
using(id = (select auth.uid()) or (select public.is_admin()));

drop policy if exists orders_read on public.orders;
create policy orders_read on public.orders
for select to authenticated
using(
  (select public.is_admin())
  or email = (select email from public.profiles where id = (select auth.uid()))
);

drop policy if exists entitlements_read on public.entitlements;
create policy entitlements_read on public.entitlements
for select to authenticated
using(user_id = (select auth.uid()) or (select public.is_admin()));

drop policy if exists materials_read on public.materials;
create policy materials_read on public.materials
for select to authenticated
using((select public.is_admin()) or (published and (select public.has_plan(plan))));

drop policy if exists progress_read on public.reading_progress;
create policy progress_read on public.reading_progress
for select to authenticated
using(user_id = (select auth.uid()));

drop policy if exists progress_insert on public.reading_progress;
create policy progress_insert on public.reading_progress
for insert to authenticated
with check(
  user_id = (select auth.uid())
  and exists(
    select 1
    from public.materials
    where id = material_id
      and published
      and (select public.has_plan(plan))
      and reading_progress.page <= pages
  )
);

drop policy if exists progress_update on public.reading_progress;
create policy progress_update on public.reading_progress
for update to authenticated
using(user_id = (select auth.uid()))
with check(
  user_id = (select auth.uid())
  and exists(
    select 1
    from public.materials
    where id = material_id
      and published
      and (select public.has_plan(plan))
      and reading_progress.page <= pages
  )
);

drop policy if exists study_own on public.study_progress;
create policy study_own on public.study_progress
for all to authenticated
using(user_id = (select auth.uid()))
with check(user_id = (select auth.uid()) and (select public.has_plan('essencial')));
