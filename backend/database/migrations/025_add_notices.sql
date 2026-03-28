-- 사이트 공지 시스템 테이블
CREATE TABLE IF NOT EXISTS site_notices (
  id         BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  title      VARCHAR(255) NOT NULL,
  content    TEXT NOT NULL,
  type       ENUM("info","warning","error","success") NOT NULL DEFAULT "info",
  is_active  TINYINT(1) NOT NULL DEFAULT 1,
  starts_at  DATETIME NULL,
  ends_at    DATETIME NULL,
  sort_order INT UNSIGNED NOT NULL DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  KEY idx_active (is_active)
);
