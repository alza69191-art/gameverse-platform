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
