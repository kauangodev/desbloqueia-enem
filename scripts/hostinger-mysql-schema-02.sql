-- Additional tables present in the legacy Supabase schema.
-- This file is safe to import after hostinger-mysql-schema.sql.

CREATE TABLE IF NOT EXISTS assessment_attempts (
  id CHAR(36) PRIMARY KEY,
  user_id CHAR(36) NOT NULL,
  activity VARCHAR(32) NOT NULL,
  score INT UNSIGNED NOT NULL,
  total INT UNSIGNED NOT NULL,
  answers JSON NOT NULL,
  collection_id VARCHAR(120) NULL,
  completed_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  INDEX assessment_user_idx (user_id),
  CONSTRAINT assessment_user_fk FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS essay_submissions (
  id CHAR(36) PRIMARY KEY,
  user_id CHAR(36) NOT NULL,
  title VARCHAR(240) NOT NULL DEFAULT 'Redação sem título',
  prompt TEXT NOT NULL,
  essay LONGTEXT NOT NULL,
  status VARCHAR(24) NOT NULL DEFAULT 'pending',
  score SMALLINT UNSIGNED NULL,
  feedback JSON NULL,
  image_path VARCHAR(500) NULL,
  image_mime VARCHAR(120) NULL,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  INDEX essay_user_idx (user_id),
  CONSTRAINT essay_user_fk FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS account_access_fingerprints (
  user_id CHAR(36) NOT NULL,
  fingerprint_hash VARCHAR(255) NOT NULL,
  first_seen DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  last_seen DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  seen_count INT UNSIGNED NOT NULL DEFAULT 1,
  user_agent VARCHAR(500) NOT NULL DEFAULT '',
  PRIMARY KEY (user_id, fingerprint_hash),
  CONSTRAINT fingerprint_user_fk FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS support_tickets (
  id CHAR(36) PRIMARY KEY,
  user_id CHAR(36) NOT NULL,
  email VARCHAR(254) NOT NULL,
  subject VARCHAR(140) NOT NULL,
  message TEXT NOT NULL,
  status VARCHAR(24) NOT NULL DEFAULT 'open',
  priority VARCHAR(24) NOT NULL DEFAULT 'normal',
  admin_note TEXT NOT NULL,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  INDEX ticket_status_idx (status, updated_at),
  INDEX ticket_user_idx (user_id, created_at),
  CONSTRAINT ticket_user_fk FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS email_deliveries (
  id CHAR(36) PRIMARY KEY,
  order_id VARCHAR(160) NOT NULL UNIQUE,
  email VARCHAR(254) NOT NULL,
  status VARCHAR(32) NOT NULL DEFAULT 'pending',
  attempts INT UNSIGNED NOT NULL DEFAULT 0,
  next_attempt DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  leased_until DATETIME(3) NULL,
  provider_id VARCHAR(240) NULL,
  last_error TEXT NULL,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  INDEX delivery_email_idx (email),
  CONSTRAINT delivery_order_fk FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
