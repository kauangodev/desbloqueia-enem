-- Additive migration for the real Hostinger MySQL database.
-- Safe to run more than once. It does not delete users, history or entitlements.
DELIMITER $$
CREATE PROCEDURE godev_add_column_if_missing()
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = 'users' AND column_name = 'admin_role') THEN
    ALTER TABLE users ADD COLUMN admin_role varchar(32) NOT NULL DEFAULT 'administrator';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = 'users' AND column_name = 'account_status') THEN
    ALTER TABLE users ADD COLUMN account_status varchar(16) NOT NULL DEFAULT 'active';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = 'users' AND column_name = 'suspended_at') THEN
    ALTER TABLE users ADD COLUMN suspended_at datetime(3) NULL;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = 'admin_invites' AND column_name = 'token_hash') THEN
    ALTER TABLE admin_invites ADD COLUMN token_hash char(64) NULL;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = 'admin_invites' AND column_name = 'expires_at') THEN
    ALTER TABLE admin_invites ADD COLUMN expires_at datetime(3) NULL;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = 'admin_invites' AND column_name = 'role') THEN
    ALTER TABLE admin_invites ADD COLUMN role varchar(32) NOT NULL DEFAULT 'administrator';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = 'admin_invites' AND column_name = 'status') THEN
    ALTER TABLE admin_invites ADD COLUMN status varchar(24) NOT NULL DEFAULT 'pending';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = 'admin_invites' AND column_name = 'invited_by') THEN
    ALTER TABLE admin_invites ADD COLUMN invited_by char(36) NULL;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = 'admin_invites' AND column_name = 'accepted_at') THEN
    ALTER TABLE admin_invites ADD COLUMN accepted_at datetime(3) NULL;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = 'admin_invites' AND column_name = 'last_sent_at') THEN
    ALTER TABLE admin_invites ADD COLUMN last_sent_at datetime(3) NULL;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = 'admin_invites' AND column_name = 'updated_at') THEN
    ALTER TABLE admin_invites ADD COLUMN updated_at datetime(3) NOT NULL DEFAULT current_timestamp(3) ON UPDATE current_timestamp(3);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.statistics WHERE table_schema = DATABASE() AND table_name = 'admin_invites' AND index_name = 'admin_invites_token_hash_uq') THEN
    ALTER TABLE admin_invites ADD UNIQUE KEY admin_invites_token_hash_uq (token_hash);
  END IF;
END$$
DELIMITER ;
CALL godev_add_column_if_missing();
DROP PROCEDURE godev_add_column_if_missing;

UPDATE users SET admin_role = 'owner' WHERE role = 'admin' AND (admin_role IS NULL OR admin_role = '');
UPDATE admin_invites SET status = CASE WHEN active = 1 THEN 'pending' ELSE 'revoked' END WHERE status IS NULL OR status = '';
