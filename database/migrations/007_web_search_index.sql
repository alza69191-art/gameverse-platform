-- GameVerse searchable web index. Stores page metadata and extracted text, not full HTML.
CREATE TABLE IF NOT EXISTS web_sites (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  host VARCHAR(255) NOT NULL,
  root_url VARCHAR(2048) NOT NULL,
  status ENUM('queued','active','paused','blocked','error') NOT NULL DEFAULT 'queued',
  crawl_delay_seconds INT UNSIGNED NOT NULL DEFAULT 2,
  pages_indexed INT UNSIGNED NOT NULL DEFAULT 0,
  last_crawled_at TIMESTAMP NULL,
  last_error VARCHAR(500) NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_web_sites_host(host),
  KEY idx_web_sites_status(status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS web_pages (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  site_id BIGINT UNSIGNED NOT NULL,
  canonical_url VARCHAR(2048) NOT NULL,
  title VARCHAR(500) NOT NULL DEFAULT '',
  description VARCHAR(1000) NOT NULL DEFAULT '',
  content_text MEDIUMTEXT NOT NULL,
  language_code VARCHAR(12) NULL,
  http_status SMALLINT UNSIGNED NOT NULL DEFAULT 200,
  content_hash CHAR(64) NOT NULL,
  crawl_status ENUM('indexed','noindex','gone','error') NOT NULL DEFAULT 'indexed',
  last_crawled_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_web_pages_url(canonical_url(768)),
  KEY idx_web_pages_site(site_id),
  KEY idx_web_pages_title(title(191)),
  KEY idx_web_pages_crawled(last_crawled_at),
  CONSTRAINT fk_web_pages_site FOREIGN KEY (site_id) REFERENCES web_sites(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS web_crawl_queue (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  site_id BIGINT UNSIGNED NOT NULL,
  page_url VARCHAR(2048) NOT NULL,
  priority SMALLINT NOT NULL DEFAULT 0,
  status ENUM('pending','processing','done','failed','skipped') NOT NULL DEFAULT 'pending',
  attempts TINYINT UNSIGNED NOT NULL DEFAULT 0,
  available_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_web_crawl_url(page_url(768)),
  KEY idx_web_crawl_ready(status, available_at, priority),
  CONSTRAINT fk_web_crawl_site FOREIGN KEY (site_id) REFERENCES web_sites(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
