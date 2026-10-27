-- Primeiro acesso administrativo. Executar uma única vez no banco de produção.
ALTER TABLE users
  ADD COLUMN must_change_password BOOLEAN NOT NULL DEFAULT FALSE;
