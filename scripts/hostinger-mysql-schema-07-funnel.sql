-- Eventos de negócio do funil (aditiva e repetível). Sem e-mail, sem respostas de estudo, sem dados de pagamento.
-- Volta: a tabela pode ser descartada sem afetar nada mais.
create table if not exists funnel_events (
  id bigint unsigned primary key auto_increment,
  name varchar(32) not null,
  visitor_id char(36) null,
  user_id char(36) null,
  order_id char(36) null,
  dedupe_key varchar(80) null,
  params json null,
  created_at datetime(3) not null default current_timestamp(3),
  -- um mesmo evento de servidor por conta/pedido (ex.: 1 purchase_confirmed por pedido, 1 first_study_completed por aluno)
  unique key funnel_events_dedupe_uq (name, dedupe_key),
  index funnel_events_name_idx (name, created_at),
  index funnel_events_visitor_idx (visitor_id, name)
) engine=InnoDB default charset=utf8mb4 collate=utf8mb4_unicode_ci;