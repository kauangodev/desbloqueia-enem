-- Registers the production Cakto products created for the ENEM 2026 launch.
-- Offers remain disabled until Supabase, transactional email and fulfillment
-- have been configured and a complete homologation purchase has passed.
update public.offers
set cakto_product_id = '6ff97951-a03a-4bed-bbe5-62c88031c0fc',
    cakto_offer_id = '3biievb',
    checkout_url = 'https://pay.cakto.com.br/3biievb_1233750',
    enabled = true
where plan = 'essencial';

update public.offers
set cakto_product_id = 'e1fc994d-6000-41d4-9b08-5af47ec3ce07',
    cakto_offer_id = '3fq7t2s',
    checkout_url = 'https://pay.cakto.com.br/3fq7t2s_1233753',
    enabled = true
where plan = 'premium';

