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

-- Colunas novas em users, de forma PORTÁVEL (MySQL e MariaDB): ADD COLUMN IF NOT EXISTS só existe no MariaDB, então cada coluna
-- é verificada em information_schema e só então adicionada. Repetível: rodar de novo não altera nada.
set @exists := (select count(*) from information_schema.columns where table_schema = database() and table_name = 'users' and column_name = 'signup_source');
set @ddl := if(@exists = 0, 'alter table users add column signup_source varchar(16) null', 'select 1');
prepare stmt from @ddl; execute stmt; deallocate prepare stmt;
set @exists := (select count(*) from information_schema.columns where table_schema = database() and table_name = 'users' and column_name = 'terms_version');
set @ddl := if(@exists = 0, 'alter table users add column terms_version varchar(24) null', 'select 1');
prepare stmt from @ddl; execute stmt; deallocate prepare stmt;
set @exists := (select count(*) from information_schema.columns where table_schema = database() and table_name = 'users' and column_name = 'terms_accepted_at');
set @ddl := if(@exists = 0, 'alter table users add column terms_accepted_at datetime(3) null', 'select 1');
prepare stmt from @ddl; execute stmt; deallocate prepare stmt;
set @exists := (select count(*) from information_schema.columns where table_schema = database() and table_name = 'users' and column_name = 'marketing_optin');
set @ddl := if(@exists = 0, 'alter table users add column marketing_optin boolean not null default false', 'select 1');
prepare stmt from @ddl; execute stmt; deallocate prepare stmt;
set @exists := (select count(*) from information_schema.columns where table_schema = database() and table_name = 'users' and column_name = 'last_login_at');
set @ddl := if(@exists = 0, 'alter table users add column last_login_at datetime(3) null', 'select 1');
prepare stmt from @ddl; execute stmt; deallocate prepare stmt;
