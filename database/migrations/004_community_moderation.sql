-- Community, player activity, moderation, notifications and admin audit.
-- Game identifiers are slugs because the curated browser catalog is currently code-backed.

CREATE TABLE IF NOT EXISTS user_favorites (
  user_id BIGINT UNSIGNED NOT NULL,
  game_slug VARCHAR(200) NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (user_id, game_slug),
  CONSTRAINT fk_favorite_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_favorites_created (created_at)
);

CREATE TABLE IF NOT EXISTS game_reviews (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  user_id BIGINT UNSIGNED NOT NULL,
  game_slug VARCHAR(200) NOT NULL,
  rating TINYINT UNSIGNED NOT NULL,
  review_text VARCHAR(2000),
  status ENUM('pending','approved','rejected') NOT NULL DEFAULT 'pending',
  reviewed_by BIGINT UNSIGNED NULL,
  reviewed_at TIMESTAMP NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_review_user_game (user_id, game_slug),
  CONSTRAINT fk_review_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_review_admin FOREIGN KEY (reviewed_by) REFERENCES users(id),
  CONSTRAINT chk_review_rating CHECK (rating BETWEEN 1 AND 5),
  INDEX idx_reviews_public (game_slug, status, created_at)
);

CREATE TABLE IF NOT EXISTS game_comments (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  user_id BIGINT UNSIGNED NOT NULL,
  game_slug VARCHAR(200) NOT NULL,
  parent_id BIGINT UNSIGNED NULL,
  body VARCHAR(2000) NOT NULL,
  status ENUM('pending','approved','rejected','hidden') NOT NULL DEFAULT 'pending',
  reviewed_by BIGINT UNSIGNED NULL,
  reviewed_at TIMESTAMP NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_comment_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_comment_parent FOREIGN KEY (parent_id) REFERENCES game_comments(id) ON DELETE CASCADE,
  CONSTRAINT fk_comment_admin FOREIGN KEY (reviewed_by) REFERENCES users(id),
  INDEX idx_comments_public (game_slug, status, created_at)
);

CREATE TABLE IF NOT EXISTS game_reports (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  reporter_id BIGINT UNSIGNED NOT NULL,
  game_slug VARCHAR(200) NOT NULL,
  reason ENUM('malware','copyright','broken','inappropriate','other') NOT NULL,
  details VARCHAR(2000) NOT NULL,
  status ENUM('open','in_review','resolved','dismissed') NOT NULL DEFAULT 'open',
  assigned_admin BIGINT UNSIGNED NULL,
  admin_notes VARCHAR(2000),
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  resolved_at TIMESTAMP NULL,
  CONSTRAINT fk_report_user FOREIGN KEY (reporter_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_report_admin FOREIGN KEY (assigned_admin) REFERENCES users(id),
  INDEX idx_reports_queue (status, created_at)
);

CREATE TABLE IF NOT EXISTS game_play_history (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  user_id BIGINT UNSIGNED NOT NULL,
  game_slug VARCHAR(200) NOT NULL,
  duration_seconds INT UNSIGNED NOT NULL DEFAULT 0,
  played_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_play_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_play_user_date (user_id, played_at)
);

CREATE TABLE IF NOT EXISTS user_notifications (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  user_id BIGINT UNSIGNED NOT NULL,
  notification_type VARCHAR(50) NOT NULL,
  title VARCHAR(180) NOT NULL,
  body VARCHAR(1000) NOT NULL,
  read_at TIMESTAMP NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_notification_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_notifications_unread (user_id, read_at, created_at)
);

CREATE TABLE IF NOT EXISTS admin_audit_logs (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  actor_id BIGINT UNSIGNED NOT NULL,
  action VARCHAR(80) NOT NULL,
  entity_type VARCHAR(80) NOT NULL,
  entity_id VARCHAR(128) NOT NULL,
  details JSON NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_audit_actor FOREIGN KEY (actor_id) REFERENCES users(id),
  INDEX idx_audit_actor_date (actor_id, created_at),
  INDEX idx_audit_entity (entity_type, entity_id)
);
