-- Jornada Grátis + Pix (aditiva e repetível). NÃO altera nem remove nada de orders/payment_events/entitlements (Cakto).
-- Prévia/backup: faça `mysqldump` das tabelas users, orders, payment_events e entitlements antes de aplicar.
-- Volta: as tabelas novas podem ser descartadas sem afetar o legado; as colunas novas em users são anuláveis.

create table if not exists pix_offers (
  code varchar(40) primary key,
  tier varchar(16) not null,
  version int unsigned not null default 1,
  cents int unsigned not null,
  currency char(3) not null default 'BRL',
  status varchar(16) not null default 'rascunho',
  valid_from date null,
  valid_until date null,
  receiver_name varchar(160) not null default '',
  copy_paste text null,
  review_minutes int unsigned not null default 1440,
  activated_by char(36) null,
  activated_at datetime(3) null,
  created_at datetime(3) not null default current_timestamp(3),
  updated_at datetime(3) not null default current_timestamp(3) on update current_timestamp(3),
  index pix_offers_tier_idx (tier, status)
) engine=InnoDB default charset=utf8mb4 collate=utf8mb4_unicode_ci;

create table if not exists pix_orders (
  id char(36) primary key,
  user_id char(36) not null,
  offer_code varchar(40) not null,
  offer_version int unsigned not null,
  expected_cents int unsigned not null,
  status varchar(24) not null default 'aguardando_pix',
  expires_at datetime(3) not null,
  notified_at datetime(3) null,
  bank_ref varchar(64) null,
  confirmed_by char(36) null,
  confirmed_at datetime(3) null,
  created_at datetime(3) not null default current_timestamp(3),
  updated_at datetime(3) not null default current_timestamp(3) on update current_timestamp(3),
  unique key pix_orders_bank_ref_uq (bank_ref),
  index pix_orders_user_idx (user_id, created_at),
  index pix_orders_status_idx (status, created_at),
  constraint pix_orders_user_fk foreign key (user_id) references users(id)
) engine=InnoDB default charset=utf8mb4 collate=utf8mb4_unicode_ci;

create table if not exists pix_order_events (
  id bigint unsigned primary key auto_increment,
  order_id char(36) not null,
  actor char(36) null,
  event varchar(40) not null,
  detail json null,
  created_at datetime(3) not null default current_timestamp(3),
  index pix_order_events_order_idx (order_id, created_at)
) engine=InnoDB default charset=utf8mb4 collate=utf8mb4_unicode_ci;

create table if not exists auth_identities (
  provider varchar(24) not null,
  subject varchar(190) not null,
  user_id char(36) not null,
  created_at datetime(3) not null default current_timestamp(3),
  primary key (provider, subject),
  index auth_identities_user_idx (user_id),
  constraint auth_identities_user_fk foreign key (user_id) references users(id)
) engine=InnoDB default charset=utf8mb4 collate=utf8mb4_unicode_ci;

-- Colunas novas em users: use o bloco abaixo apenas se ainda não existirem (MySQL 8.0.29+ aceita IF NOT EXISTS; senão rode uma a uma).
alter table users add column if not exists signup_source varchar(16) null;
alter table users add column if not exists terms_version varchar(24) null;
alter table users add column if not exists terms_accepted_at datetime(3) null;
alter table users add column if not exists marketing_optin boolean not null default false;
alter table users add column if not exists last_login_at datetime(3) null;
