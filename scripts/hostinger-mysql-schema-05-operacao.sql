-- Operação 2º Domingo: estado do aluno (tentativas, favoritos, leituras, plano, sessões e simulados).
-- Migração ADITIVA e idempotente: não altera tabelas existentes. Aplicar no MySQL da Hostinger antes de publicar a área.
create table if not exists operacao_state (
  user_id char(36) not null,
  kind varchar(32) not null,
  ref varchar(191) not null,
  data longtext not null,
  created_at datetime(3) not null default current_timestamp(3),
  updated_at datetime(3) not null default current_timestamp(3) on update current_timestamp(3),
  primary key (user_id, kind, ref),
  index operacao_state_kind (user_id, kind, updated_at),
  constraint operacao_state_user_fk foreign key (user_id) references users(id) on delete cascade
) engine=InnoDB default charset=utf8mb4 collate=utf8mb4_unicode_ci;
