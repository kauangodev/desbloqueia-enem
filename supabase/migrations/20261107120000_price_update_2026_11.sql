-- Novos preços públicos (pagamento único): Essencial R$ 10,90 e Premium R$ 19,90.
-- A Cakto (ofertas 3biievb e 3fq7t2s) e a tabela products devem refletir os mesmos valores.
-- Pedidos já realizados mantêm o valor cobrado na época; apenas novas contratações usam estes preços.
update public.products set price_cents = 1090 where id = 'essencial';
update public.products set price_cents = 1990 where id = 'premium';
