-- One-time first-admin bootstrap audit trail.
CREATE TABLE IF NOT EXISTS admin_bootstrap_events (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  target_user_id BIGINT UNSIGNED NOT NULL,
  target_email VARCHAR(255) NOT NULL,
  source VARCHAR(80) NOT NULL DEFAULT 'manual_cli',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_bootstrap_target FOREIGN KEY (target_user_id) REFERENCES users(id),
  INDEX idx_bootstrap_target (target_user_id, created_at)
);
