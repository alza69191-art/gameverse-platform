-- Authentication abuse protection buckets. Keys are HMAC hashes, not raw IPs or emails.
CREATE TABLE IF NOT EXISTS rate_limit_buckets (
  bucket_key CHAR(64) NOT NULL PRIMARY KEY,
  window_start DATETIME NOT NULL,
  hits INT UNSIGNED NOT NULL DEFAULT 0,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_rate_limit_updated (updated_at)
);
