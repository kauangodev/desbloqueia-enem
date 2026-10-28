-- Destination schema for the Hostinger migration.
-- Passwords are intentionally not imported; users will reset them after cutover.
create table if not exists users (
  id char(36) primary key,
  email varchar(254) not null unique,
  name varchar(160) not null default '',
  password_hash varchar(255) null,
  role enum('student','admin') not null default 'student',
  admin_role varchar(32) not null default 'administrator',
  account_status varchar(16) not null default 'active',
  suspended_at datetime(3) null,
  email_verified_at datetime(3) null,
  reset_token_hash char(64) null unique,
  reset_token_expires_at datetime(3) null,
  created_at datetime(3) not null default current_timestamp(3),
  updated_at datetime(3) not null default current_timestamp(3) on update current_timestamp(3)
) engine=InnoDB default charset=utf8mb4 collate=utf8mb4_unicode_ci;

create table if not exists admin_invites (
  email varchar(254) primary key,
  name varchar(160) not null default '',
  active boolean not null default true,
  token_hash char(64) null unique,
  expires_at datetime(3) null,
  role varchar(32) not null default 'administrator',
  status varchar(24) not null default 'pending',
  invited_by char(36) null,
  accepted_at datetime(3) null,
  last_sent_at datetime(3) null,
  delivery_status varchar(32) not null default 'not_attempted',
  delivery_attempts int unsigned not null default 0,
  last_attempt_at datetime(3) null,
  last_error_kind varchar(32) null,
  last_attempt_id char(36) null,
  provider_message_id varchar(160) null,
  updated_at datetime(3) not null default current_timestamp(3) on update current_timestamp(3),
  created_at datetime(3) not null default current_timestamp(3)
) engine=InnoDB default charset=utf8mb4 collate=utf8mb4_unicode_ci;

create table if not exists products (
  id varchar(32) primary key,
  name varchar(160) not null,
  description text not null,
  price_cents int unsigned not null,
  features json not null
) engine=InnoDB default charset=utf8mb4 collate=utf8mb4_unicode_ci;

create table if not exists offers (
  plan varchar(32) primary key,
  cakto_product_id varchar(160) null,
  cakto_offer_id varchar(160) null unique,
  checkout_url text null,
  enabled boolean not null default false,
  constraint offers_product_fk foreign key (plan) references products(id)
) engine=InnoDB default charset=utf8mb4 collate=utf8mb4_unicode_ci;

create table if not exists orders (
  id varchar(160) primary key,
  email varchar(254) not null,
  name varchar(160) not null,
  plan varchar(32) not null,
  amount decimal(12,2) not null default 0,
  status varchar(32) not null,
  created_at datetime(3) not null default current_timestamp(3),
  updated_at datetime(3) not null default current_timestamp(3) on update current_timestamp(3),
  index orders_email_idx (email),
  constraint orders_product_fk foreign key (plan) references products(id)
) engine=InnoDB default charset=utf8mb4 collate=utf8mb4_unicode_ci;

create table if not exists payment_events (
  id varchar(320) primary key,
  order_id varchar(160) not null,
  event varchar(64) not null,
  data json not null,
  received_at datetime(3) not null default current_timestamp(3),
  index payment_events_order_idx (order_id)
) engine=InnoDB default charset=utf8mb4 collate=utf8mb4_unicode_ci;

create table if not exists entitlements (
  order_id varchar(160) primary key,
  user_id char(36) null,
  email varchar(254) not null,
  plan varchar(32) not null,
  active boolean not null default false,
  index entitlements_email_idx (email),
  index entitlements_user_idx (user_id),
  constraint entitlements_user_fk foreign key (user_id) references users(id),
  constraint entitlements_product_fk foreign key (plan) references products(id)
) engine=InnoDB default charset=utf8mb4 collate=utf8mb4_unicode_ci;

create table if not exists materials (
  id varchar(160) primary key,
  title varchar(240) not null,
  description text not null,
  category varchar(120) not null,
  plan varchar(32) not null,
  pages int unsigned not null,
  cover varchar(500) not null,
  storage_path varchar(500) null,
  published boolean not null default false,
  downloadable boolean not null default true,
  public_sample_url varchar(500) null,
  version int unsigned not null default 1,
  index materials_plan_idx (plan),
  constraint materials_product_fk foreign key (plan) references products(id)
) engine=InnoDB default charset=utf8mb4 collate=utf8mb4_unicode_ci;

create table if not exists reading_progress (
  user_id char(36) not null,
  material_id varchar(160) not null,
  page int unsigned not null,
  updated_at datetime(3) not null default current_timestamp(3) on update current_timestamp(3),
  primary key (user_id, material_id),
  constraint reading_user_fk foreign key (user_id) references users(id) on delete cascade,
  constraint reading_material_fk foreign key (material_id) references materials(id)
) engine=InnoDB default charset=utf8mb4 collate=utf8mb4_unicode_ci;

create table if not exists study_progress (
  id char(36) primary key,
  user_id char(36) not null,
  title varchar(180) not null,
  date_value date not null,
  done boolean not null default false,
  constraint study_user_fk foreign key (user_id) references users(id) on delete cascade
) engine=InnoDB default charset=utf8mb4 collate=utf8mb4_unicode_ci;

create table if not exists support_settings (
  id tinyint unsigned primary key,
  name varchar(160) not null default '',
  email varchar(254) not null default '',
  whatsapp varchar(40) not null default '',
  message text not null,
  hours varchar(240) not null default '',
  enabled boolean not null default false,
  legal_name varchar(240) not null default '',
  legal_document varchar(80) not null default ''
) engine=InnoDB default charset=utf8mb4 collate=utf8mb4_unicode_ci;

create table if not exists audit_logs (
  id bigint unsigned primary key auto_increment,
  actor char(36) null,
  action varchar(160) not null,
  target varchar(500) null,
  created_at datetime(3) not null default current_timestamp(3),
  index audit_actor_idx (actor)
) engine=InnoDB default charset=utf8mb4 collate=utf8mb4_unicode_ci;

create table if not exists storage_files (
  id char(36) primary key,
  storage_path varchar(500) not null unique,
  mime_type varchar(120) not null,
  size_bytes bigint unsigned not null,
  sha256 char(64) not null,
  local_path varchar(800) not null,
  created_at datetime(3) not null default current_timestamp(3)
) engine=InnoDB default charset=utf8mb4 collate=utf8mb4_unicode_ci;
