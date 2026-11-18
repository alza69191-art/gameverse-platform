-- GameVerse developer submissions and upload quarantine.
-- Apply once to the existing TiDB database after backing it up.

CREATE TABLE IF NOT EXISTS developer_applications (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  user_id BIGINT UNSIGNED NOT NULL,
  studio_name VARCHAR(160) NOT NULL,
  portfolio_url VARCHAR(2048),
  contact_email VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  status ENUM('pending','approved','rejected') NOT NULL DEFAULT 'pending',
  reviewed_by BIGINT UNSIGNED NULL,
  review_notes TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  reviewed_at TIMESTAMP NULL,
  UNIQUE KEY uq_developer_application_user (user_id),
  CONSTRAINT fk_dev_application_user FOREIGN KEY (user_id) REFERENCES users(id),
  CONSTRAINT fk_dev_application_reviewer FOREIGN KEY (reviewed_by) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS game_uploads (
  id CHAR(36) NOT NULL PRIMARY KEY,
  developer_id BIGINT UNSIGNED NOT NULL,
  object_key VARCHAR(512) NOT NULL UNIQUE,
  original_filename VARCHAR(255) NOT NULL,
  game_title VARCHAR(180) NOT NULL,
  game_slug VARCHAR(200) NOT NULL,
  game_description TEXT NOT NULL,
  game_type ENUM('download') NOT NULL DEFAULT 'download',
  content_type VARCHAR(120) NOT NULL,
  size_bytes BIGINT UNSIGNED NOT NULL,
  upload_status ENUM('initiated','uploaded','failed') NOT NULL DEFAULT 'initiated',
  sha256 CHAR(64),
  scan_status ENUM('pending','clean','infected','error') NOT NULL DEFAULT 'pending',
  review_status ENUM('pending','approved','rejected') NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  scanned_at TIMESTAMP NULL,
  reviewed_at TIMESTAMP NULL,
  reviewed_by BIGINT UNSIGNED NULL,
  review_notes TEXT,
  CONSTRAINT fk_game_upload_developer FOREIGN KEY (developer_id) REFERENCES users(id),
  CONSTRAINT fk_game_upload_reviewer FOREIGN KEY (reviewed_by) REFERENCES users(id),
  INDEX idx_game_upload_queue (scan_status, review_status, created_at)
);
