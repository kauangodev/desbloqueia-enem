-- Apply in a new Supabase project. Never place service_role credentials in a client.
create table public.profiles (id uuid primary key references auth.users(id) on delete cascade, email text unique not null, name text not null default '', role text not null default 'student' check(role in ('student','admin')));
create table public.products (id text primary key check(id in ('essencial','premium')), name text not null, description text not null default '', price_cents integer not null check(price_cents > 0), features jsonb not null default '[]');
insert into public.products values ('essencial','Essencial','Uma base clara para retomar o que importa.',1990,'["Resumos estratégicos por disciplina","Cronograma de estudos","40 exercícios comentados","Leitura na plataforma"]'), ('premium','Premium','Mais prática. Mais repertório. Tudo conectado.',3990,'["Tudo do Essencial","Kit completo de revisão com 87 páginas","Dois simulados compactos","Preparação para redação","Biblioteca navegável com 1.800 referências","7 resoluções autorais já disponíveis","Fichas e checklists para a reta final"]');
create table public.offers (plan text primary key references public.products(id), cakto_product_id text, cakto_offer_id text unique, checkout_url text, enabled boolean not null default false);
insert into public.offers(plan) values ('essencial'),('premium');
create table public.orders (id text primary key, email text not null, name text not null, plan text not null references public.products(id), amount numeric not null, status text not null, created_at timestamptz not null default now(), updated_at timestamptz not null default now());
create table public.payment_events (id text primary key, order_id text not null, event text not null, data jsonb not null, received_at timestamptz not null default now());
create table public.entitlements (order_id text primary key references public.orders(id), user_id uuid references public.profiles(id), email text not null, plan text not null references public.products(id), active boolean not null default false);
create table public.materials (id text primary key, title text not null, description text not null default '', category text not null, plan text not null references public.products(id), pages integer not null check(pages>0), cover text not null, storage_path text, published boolean not null default false, downloadable boolean not null default true, public_sample_url text, version integer not null default 1);
create table public.reading_progress (user_id uuid references public.profiles(id) on delete cascade, material_id text references public.materials(id), page integer not null check(page>0), updated_at timestamptz not null default now(), primary key(user_id,material_id));
create table public.study_progress (id uuid primary key default gen_random_uuid(), user_id uuid references public.profiles(id) on delete cascade, title text not null check(length(title) between 1 and 180), date date not null, done boolean not null default false);
create table public.email_deliveries (id uuid primary key default gen_random_uuid(), order_id text not null unique references public.orders(id), email text not null, status text not null default 'pending', attempts integer not null default 0, next_attempt timestamptz not null default now(), leased_until timestamptz, provider_id text, last_error text, created_at timestamptz not null default now());
create table public.support_settings (id boolean primary key default true check(id), name text not null default '', email text not null default '', whatsapp text not null default '', message text not null default 'Olá! Preciso de ajuda com o Desbloqueia ENEM.', hours text not null default '', enabled boolean not null default false, legal_name text not null default '', legal_document text not null default '');
insert into public.support_settings(id) values(true);
create table public.audit_logs (id bigint generated always as identity primary key, actor uuid, action text not null, target text, created_at timestamptz not null default now());
create table public.rate_limits (key text primary key, count integer not null, expires_at timestamptz not null);

create function public.is_admin() returns boolean language sql stable security definer set search_path=public as $$ select exists(select 1 from profiles where id=auth.uid() and role='admin') $$;
create function public.has_plan(p_plan text) returns boolean language sql stable security definer set search_path=public as $$ select public.is_admin() or exists(select 1 from entitlements where user_id=auth.uid() and active and (plan='premium' or plan=p_plan)) $$;
create function public.new_profile() returns trigger language plpgsql security definer set search_path=public as $$
begin
 insert into profiles(id,email,name) values(new.id,lower(new.email),coalesce(new.raw_user_meta_data->>'name',''));
 update entitlements set user_id=new.id where email=lower(new.email);
 return new;
end $$;
create trigger on_user_created after insert on auth.users for each row execute function public.new_profile();

create function public.receive_payment(p_event text, p_data jsonb) returns void language plpgsql security definer set search_path=public as $$
declare v_plan text; v_status text; v_id text:=p_data->>'id'; v_email text:=lower(p_data->'customer'->>'email'); v_key text:=v_id||':'||p_event; v_user uuid;
begin
 if p_event not in ('purchase_approved','purchase_refused','refund','chargeback','pix_gerado','boleto_gerado','picpay_gerado') then raise exception 'unsupported event'; end if;
 select plan into v_plan from offers where cakto_product_id=p_data->'product'->>'id' and cakto_offer_id=p_data->'offer'->>'id';
 if v_plan is null then raise exception 'unknown offer'; end if;
 if p_event='purchase_approved' and p_data->>'status'<>'paid' then raise exception 'not paid'; end if;
 perform pg_advisory_xact_lock(hashtext(v_id));
 if exists(select 1 from payment_events where id=v_key) then return; end if;
 select status into v_status from orders where id=v_id;
 if exists(select 1 from orders where id=v_id and (email<>v_email or plan<>v_plan)) then raise exception 'order identity mismatch'; end if;
 v_status:=case when v_status in ('refunded','chargedback') then v_status when p_event='refund' then 'refunded' when p_event='chargeback' then 'chargedback' when v_status='paid' or p_event='purchase_approved' then 'paid' when p_event='purchase_refused' then 'refused' else 'pending' end;
 insert into payment_events(id,order_id,event,data) values(v_key,v_id,p_event,p_data);
 insert into orders(id,email,name,plan,amount,status) values(v_id,v_email,p_data->'customer'->>'name',v_plan,(p_data->>'amount')::numeric,v_status)
 on conflict(id) do update set status=excluded.status,updated_at=now();
 select id into v_user from profiles where email=v_email;
 insert into entitlements(order_id,user_id,email,plan,active) values(v_id,v_user,v_email,v_plan,v_status='paid') on conflict(order_id) do update set active=excluded.active;
 if v_status='paid' then insert into email_deliveries(order_id,email) values(v_id,v_email) on conflict(order_id) do nothing;
 else update email_deliveries set status='canceled' where order_id=v_id and status<>'accepted'; end if;
end $$;
revoke all on function public.receive_payment(text,jsonb) from public,anon,authenticated;
grant execute on function public.receive_payment(text,jsonb) to service_role;

create function public.take_rate_limit(p_key text,p_limit integer,p_seconds integer) returns boolean language plpgsql security definer set search_path=public as $$
declare v_count integer;
begin
 insert into rate_limits(key,count,expires_at) values(p_key,1,now()+make_interval(secs=>p_seconds)) on conflict(key) do update set count=case when rate_limits.expires_at<now() then 1 else rate_limits.count+1 end,expires_at=case when rate_limits.expires_at<now() then now()+make_interval(secs=>p_seconds) else rate_limits.expires_at end returning count into v_count;
 return v_count<=p_limit;
end $$;
revoke all on function public.take_rate_limit(text,integer,integer) from public,anon,authenticated;
grant execute on function public.take_rate_limit(text,integer,integer) to service_role;
create function public.claim_emails() returns setof public.email_deliveries language sql security definer set search_path=public as $$
 update email_deliveries set leased_until=now()+interval '5 minutes', attempts=attempts+1
 where id in (select id from email_deliveries where status in ('pending','failed') and attempts<8 and next_attempt<=now() and (leased_until is null or leased_until<now()) order by created_at limit 10 for update skip locked) returning *;
$$;
revoke all on function public.claim_emails() from public,anon,authenticated;
grant execute on function public.claim_emails() to service_role;

alter table profiles enable row level security;
alter table products enable row level security;
alter table offers enable row level security;
alter table orders enable row level security;
alter table payment_events enable row level security;
alter table entitlements enable row level security;
alter table materials enable row level security;
alter table reading_progress enable row level security;
alter table study_progress enable row level security;
alter table email_deliveries enable row level security;
alter table support_settings enable row level security;
alter table audit_logs enable row level security;
alter table rate_limits enable row level security;
create policy profiles_read on profiles for select to authenticated using(id=auth.uid() or public.is_admin());
create policy products_read on products for select using(true);
create policy support_read on support_settings for select using(true);
create policy orders_read on orders for select to authenticated using(public.is_admin() or email=(select email from profiles where id=auth.uid()));
create policy entitlements_read on entitlements for select to authenticated using(user_id=auth.uid() or public.is_admin());
create policy materials_read on materials for select to authenticated using(public.is_admin() or (published and public.has_plan(plan)));
create policy progress_read on reading_progress for select to authenticated using(user_id=auth.uid());
create policy progress_insert on reading_progress for insert to authenticated with check(user_id=auth.uid() and exists(select 1 from materials where id=material_id and published and public.has_plan(plan) and reading_progress.page<=pages));
create policy progress_update on reading_progress for update to authenticated using(user_id=auth.uid()) with check(user_id=auth.uid() and exists(select 1 from materials where id=material_id and published and public.has_plan(plan) and reading_progress.page<=pages));
create policy study_own on study_progress for all to authenticated using(user_id=auth.uid()) with check(user_id=auth.uid() and public.has_plan('essencial'));
create policy offers_admin on offers for all to authenticated using(public.is_admin()) with check(public.is_admin());
create policy products_admin on products for all to authenticated using(public.is_admin()) with check(public.is_admin());
create policy materials_admin on materials for all to authenticated using(public.is_admin()) with check(public.is_admin());
create policy support_admin on support_settings for all to authenticated using(public.is_admin()) with check(public.is_admin());
create policy delivery_admin on email_deliveries for select to authenticated using(public.is_admin());
create policy event_admin on payment_events for select to authenticated using(public.is_admin());
create policy audit_admin on audit_logs for select to authenticated using(public.is_admin());

-- No authenticated object SELECT policy: signed URLs are issued only after server authorization.
insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types) values('materials','materials',false,52428800,array['application/pdf']) on conflict(id) do nothing;
