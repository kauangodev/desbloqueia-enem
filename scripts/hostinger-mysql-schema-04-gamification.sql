-- Gamificação idempotente para o MySQL da Hostinger.
-- Eventos são a fonte de verdade; o mesmo usuário não pontua duas vezes para
-- a mesma atividade e regra.
create table if not exists gamification_events (
  id char(36) primary key,
  user_id char(36) not null,
  event_key varchar(191) not null,
  event_type varchar(64) not null,
  source_id varchar(191) not null,
  xp int unsigned not null,
  rule_version varchar(32) not null default '2026-10-27',
  occurred_at datetime(3) not null default current_timestamp(3),
  unique key gamification_event_once (user_id, event_key),
  index gamification_user_date (user_id, occurred_at),
  constraint gamification_user_fk foreign key (user_id) references users(id) on delete cascade
) engine=InnoDB default charset=utf8mb4 collate=utf8mb4_unicode_ci;

create table if not exists gamification_goals (
  user_id char(36) primary key,
  daily_target int unsigned not null default 1,
  weekly_target int unsigned not null default 5,
  updated_at datetime(3) not null default current_timestamp(3) on update current_timestamp(3),
  constraint gamification_goals_user_fk foreign key (user_id) references users(id) on delete cascade
) engine=InnoDB default charset=utf8mb4 collate=utf8mb4_unicode_ci;

