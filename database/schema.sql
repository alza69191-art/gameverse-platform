-- GameVerse initial schema (MySQL / TiDB compatible)
CREATE TABLE IF NOT EXISTS users (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  email VARCHAR(255) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  display_name VARCHAR(100) NOT NULL,
  role ENUM('player','developer','admin') NOT NULL DEFAULT 'player',
  status ENUM('active','suspended','pending') NOT NULL DEFAULT 'active',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS games (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  developer_id BIGINT UNSIGNED NOT NULL,
  title VARCHAR(180) NOT NULL,
  slug VARCHAR(200) NOT NULL UNIQUE,
  description TEXT NOT NULL,
  official_url VARCHAR(2048),
  privacy_policy_url VARCHAR(2048),
  game_type ENUM('browser','download','both') NOT NULL,
  status ENUM('draft','pending_review','approved','rejected','suspended') NOT NULL DEFAULT 'draft',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_games_developer FOREIGN KEY (developer_id) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS game_versions (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  game_id BIGINT UNSIGNED NOT NULL,
  version VARCHAR(40) NOT NULL,
  platform VARCHAR(40) NOT NULL,
  download_url VARCHAR(2048),
  file_size_bytes BIGINT UNSIGNED,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_versions_game FOREIGN KEY (game_id) REFERENCES games(id)
);

CREATE TABLE IF NOT EXISTS review_events (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  game_id BIGINT UNSIGNED NOT NULL,
  admin_id BIGINT UNSIGNED,
  decision ENUM('submitted','approved','rejected','changes_requested') NOT NULL,
  notes TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_review_game FOREIGN KEY (game_id) REFERENCES games(id)
);


-- Public game categories and the many-to-many relation to games.
CREATE TABLE IF NOT EXISTS game_categories (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  name_ar VARCHAR(80) NOT NULL,
  slug VARCHAR(100) NOT NULL UNIQUE,
  sort_order INT NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT TRUE
);

CREATE TABLE IF NOT EXISTS game_category_map (
  game_id BIGINT UNSIGNED NOT NULL,
  category_id BIGINT UNSIGNED NOT NULL,
  PRIMARY KEY (game_id, category_id),
  CONSTRAINT fk_game_category_game FOREIGN KEY (game_id) REFERENCES games(id) ON DELETE CASCADE,
  CONSTRAINT fk_game_category_category FOREIGN KEY (category_id) REFERENCES game_categories(id) ON DELETE CASCADE
);

-- External game listings are discovery links until GameVerse has redistribution rights.
CREATE TABLE IF NOT EXISTS catalog_sources (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  source_name VARCHAR(180) NOT NULL,
  source_url VARCHAR(2048) NOT NULL,
  content_kind ENUM('game','asset','engine','library') NOT NULL,
  license_name VARCHAR(120),
  license_url VARCHAR(2048),
  redistribution_allowed BOOLEAN NOT NULL DEFAULT FALSE,
  verification_status ENUM('unverified','verified','restricted','rejected') NOT NULL DEFAULT 'unverified',
  verified_at TIMESTAMP NULL,
  notes TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS asset_resources (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  source_id BIGINT UNSIGNED NOT NULL,
  title VARCHAR(180) NOT NULL,
  asset_type ENUM('2d','3d','audio','ui','font','other') NOT NULL,
  resource_url VARCHAR(2048) NOT NULL,
  license_name VARCHAR(120),
  license_url VARCHAR(2048),
  attribution TEXT,
  redistribution_allowed BOOLEAN NOT NULL DEFAULT FALSE,
  review_status ENUM('pending','approved','rejected') NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_asset_source FOREIGN KEY (source_id) REFERENCES catalog_sources(id)
);

-- Authentication and abuse-prevention tables required by lib/auth.ts and lib/rate-limit.ts.
CREATE TABLE IF NOT EXISTS user_sessions (
  token_hash CHAR(64) NOT NULL PRIMARY KEY,
  user_id BIGINT UNSIGNED NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  revoked_at TIMESTAMP NULL,
  last_seen_at TIMESTAMP NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  KEY idx_user_sessions_user (user_id),
  KEY idx_user_sessions_expiry (expires_at),
  CONSTRAINT fk_user_sessions_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS rate_limit_buckets (
  bucket_key CHAR(64) NOT NULL PRIMARY KEY,
  window_start TIMESTAMP NOT NULL,
  hits INT UNSIGNED NOT NULL DEFAULT 0,
  KEY idx_rate_limit_window (window_start)
);
