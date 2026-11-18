-- Server-side revocable sessions. Session secrets are never stored in plaintext.
CREATE TABLE IF NOT EXISTS user_sessions (
  token_hash CHAR(64) NOT NULL PRIMARY KEY,
  user_id BIGINT UNSIGNED NOT NULL,
  expires_at DATETIME NOT NULL,
  revoked_at TIMESTAMP NULL,
  last_seen_at TIMESTAMP NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_session_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_sessions_user_expiry (user_id, expires_at),
  INDEX idx_sessions_expiry (expires_at)
);
