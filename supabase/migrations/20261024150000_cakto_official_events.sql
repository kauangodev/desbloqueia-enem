-- Align payment state transitions with the official Cakto webhook catalogue.
-- This migration is additive and keeps the existing event idempotency key.
create or replace function public.receive_payment(p_event text, p_data jsonb) returns void language plpgsql security definer set search_path=public as $$
declare
  v_plan text;
  v_status text;
  v_id text:=p_data->>'id';
  v_email text:=lower(trim(p_data->'customer'->>'email'));
  v_key text:=v_id||':'||p_event;
  v_user uuid;
  v_amount numeric;
begin
 if p_event not in (
   'purchase_approved','purchase_refused','refund','refund_requested','chargeback',
   'dispute_defense_requested','purchase_email_failed','pix_gerado','boleto_gerado',
   'picpay_gerado','openfinance_nubank_gerado','subscription_created',
   'subscription_renewed','subscription_renewal_refused','subscription_paused',
   'subscription_resumed','subscription_late','subscription_late_recovered',
   'subscription_canceled'
 ) then raise exception 'unsupported event'; end if;
 select plan into v_plan from offers
 where cakto_product_id=p_data->'product'->>'id'
   and cakto_offer_id=p_data->'offer'->>'id';
 if v_plan is null then raise exception 'unknown offer'; end if;
 if p_event in ('purchase_approved','subscription_created','subscription_renewed','subscription_resumed','subscription_late_recovered')
   and p_data->>'status' not in ('paid','active') then raise exception 'not paid'; end if;
 v_amount:=coalesce(nullif(p_data->>'amount','')::numeric, nullif(p_data->>'baseAmount','')::numeric, 0);
 perform pg_advisory_xact_lock(hashtext(v_id));
 if exists(select 1 from payment_events where id=v_key) then return; end if;
 select status into v_status from orders where id=v_id;
 if exists(select 1 from orders where id=v_id and (email<>v_email or plan<>v_plan)) then raise exception 'order identity mismatch'; end if;
 v_status:=case
   when v_status in ('refunded','chargedback') then v_status
   when p_event='refund' then 'refunded'
   when p_event='chargeback' then 'chargedback'
   when p_event='subscription_canceled' then 'canceled'
   when p_event='subscription_paused' then 'paused'
   when p_event in ('subscription_late','subscription_renewal_refused') then 'late'
   when p_event in ('purchase_approved','subscription_created','subscription_renewed','subscription_resumed','subscription_late_recovered') then 'paid'
   when p_event='purchase_refused' then 'refused'
   else 'pending'
 end;
 insert into payment_events(id,order_id,event,data) values(v_key,v_id,p_event,p_data);
 insert into orders(id,email,name,plan,amount,status) values(v_id,v_email,p_data->'customer'->>'name',v_plan,v_amount,v_status)
 on conflict(id) do update set status=excluded.status,
 amount=case when p_event in ('purchase_approved','subscription_created','subscription_renewed','subscription_resumed','subscription_late_recovered') and excluded.amount>0 then excluded.amount else orders.amount end,
 name=coalesce(nullif(excluded.name,''),orders.name),updated_at=now();
 select id into v_user from profiles where email=v_email;
 insert into entitlements(order_id,user_id,email,plan,active) values(v_id,v_user,v_email,v_plan,v_status='paid')
 on conflict(order_id) do update set active=excluded.active;
 if v_status='paid' then
   insert into email_deliveries(order_id,email) values(v_id,v_email) on conflict(order_id) do nothing;
 else
   update email_deliveries set status='canceled' where order_id=v_id and status<>'accepted';
 end if;
end $$;

revoke all on function public.receive_payment(text,jsonb) from public,anon,authenticated;
grant execute on function public.receive_payment(text,jsonb) to service_role;

