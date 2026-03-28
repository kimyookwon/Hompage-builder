-- 누락 컬럼 일괄 추가 (MySQL 호환 방식)
-- MySQL은 ADD COLUMN IF NOT EXISTS 미지원 → PROCEDURE로 처리

DROP PROCEDURE IF EXISTS add_column_if_not_exists;

DELIMITER $$
CREATE PROCEDURE add_column_if_not_exists(
  IN tbl VARCHAR(64),
  IN col VARCHAR(64),
  IN col_def TEXT
)
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = tbl AND COLUMN_NAME = col
  ) THEN
    SET @sql = CONCAT('ALTER TABLE `', tbl, '` ADD COLUMN `', col, '` ', col_def);
    PREPARE stmt FROM @sql;
    EXECUTE stmt;
    DEALLOCATE PREPARE stmt;
  END IF;
END$$
DELIMITER ;

-- ── pages: SEO 필드 ──────────────────────────────────────────
CALL add_column_if_not_exists('pages', 'seo_description', "VARCHAR(500) NULL AFTER is_published");
CALL add_column_if_not_exists('pages', 'seo_og_image',    "VARCHAR(1000) NULL AFTER seo_description");

-- ── posts: 공지/썸네일/조회수/좋아요 수 ──────────────────────
CALL add_column_if_not_exists('posts', 'is_notice',      "BOOLEAN NOT NULL DEFAULT FALSE AFTER content");
CALL add_column_if_not_exists('posts', 'thumbnail_url',  "VARCHAR(1000) NULL AFTER is_notice");
CALL add_column_if_not_exists('posts', 'view_count',     "INT UNSIGNED NOT NULL DEFAULT 0 AFTER thumbnail_url");
CALL add_column_if_not_exists('posts', 'like_count',     "INT UNSIGNED NOT NULL DEFAULT 0 AFTER view_count");

-- ── site_settings: 홈 슬러그/사이트명/공지 배너 ──────────────
CALL add_column_if_not_exists('site_settings', 'home_slug',       "VARCHAR(255) NULL");
CALL add_column_if_not_exists('site_settings', 'site_name',       "VARCHAR(100) NULL");
CALL add_column_if_not_exists('site_settings', 'notice_enabled',  "TINYINT(1) NOT NULL DEFAULT 0");
CALL add_column_if_not_exists('site_settings', 'notice_text',     "TEXT NULL");
CALL add_column_if_not_exists('site_settings', 'notice_color',    "VARCHAR(7) NOT NULL DEFAULT '#1d4ed8'");

-- ── boards: 설명/정렬 순서 ───────────────────────────────────
CALL add_column_if_not_exists('boards', 'description', "TEXT NULL AFTER name");
CALL add_column_if_not_exists('boards', 'sort_order',  "INT UNSIGNED NOT NULL DEFAULT 0");

-- ── comments: parent_id 타입 수정 (INT → BIGINT UNSIGNED) ───
-- 기존 FK/인덱스 제거 (존재 시)
DROP PROCEDURE IF EXISTS drop_fk_if_exists;
DELIMITER $$
CREATE PROCEDURE drop_fk_if_exists(IN tbl VARCHAR(64), IN fk_name VARCHAR(64))
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.TABLE_CONSTRAINTS
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = tbl AND CONSTRAINT_NAME = fk_name
  ) THEN
    SET @sql = CONCAT('ALTER TABLE `', tbl, '` DROP FOREIGN KEY `', fk_name, '`');
    PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;
  END IF;
END$$
DELIMITER ;

DROP PROCEDURE IF EXISTS drop_idx_if_exists;
DELIMITER $$
CREATE PROCEDURE drop_idx_if_exists(IN tbl VARCHAR(64), IN idx_name VARCHAR(64))
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.STATISTICS
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = tbl AND INDEX_NAME = idx_name
  ) THEN
    SET @sql = CONCAT('ALTER TABLE `', tbl, '` DROP INDEX `', idx_name, '`');
    PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;
  END IF;
END$$
DELIMITER ;

CALL drop_fk_if_exists('comments', 'fk_comments_parent');
CALL drop_idx_if_exists('comments', 'idx_comments_parent');
DROP PROCEDURE IF EXISTS drop_fk_if_exists;
DROP PROCEDURE IF EXISTS drop_idx_if_exists;

DROP PROCEDURE IF EXISTS fix_comments_parent_id;

DELIMITER $$
CREATE PROCEDURE fix_comments_parent_id()
BEGIN
  DECLARE col_type VARCHAR(64);
  SELECT DATA_TYPE INTO col_type
  FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME   = 'comments'
    AND COLUMN_NAME  = 'parent_id';

  IF col_type IS NOT NULL AND col_type != 'bigint' THEN
    ALTER TABLE comments MODIFY COLUMN parent_id BIGINT UNSIGNED NULL DEFAULT NULL;
  END IF;

  -- FK가 없으면 추가
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.TABLE_CONSTRAINTS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME   = 'comments'
      AND CONSTRAINT_NAME = 'fk_comments_parent'
  ) THEN
    ALTER TABLE comments
      ADD CONSTRAINT fk_comments_parent FOREIGN KEY (parent_id) REFERENCES comments(id) ON DELETE CASCADE,
      ADD INDEX idx_comments_parent (parent_id);
  END IF;
END$$
DELIMITER ;

CALL fix_comments_parent_id();
DROP PROCEDURE IF EXISTS fix_comments_parent_id;

-- ── post_attachments 테이블 생성 ─────────────────────────────
CREATE TABLE IF NOT EXISTS post_attachments (
  id          BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  post_id     BIGINT UNSIGNED NOT NULL,
  uploaded_by BIGINT UNSIGNED NOT NULL,
  file_name   VARCHAR(255)    NOT NULL,
  file_url    VARCHAR(1000)   NOT NULL,
  file_size   INT UNSIGNED    NOT NULL DEFAULT 0,
  mime_type   VARCHAR(127)    NOT NULL DEFAULT '',
  created_at  DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_attach_post    FOREIGN KEY (post_id)     REFERENCES posts(id)  ON DELETE CASCADE,
  CONSTRAINT fk_attach_uploader FOREIGN KEY (uploaded_by) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_attach_post (post_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ── notifications 테이블 생성 ────────────────────────────────
CREATE TABLE IF NOT EXISTS notifications (
  id           BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id      BIGINT UNSIGNED NOT NULL,
  type         ENUM('comment_on_post','reply_to_comment') NOT NULL,
  post_id      BIGINT UNSIGNED NOT NULL,
  comment_id   BIGINT UNSIGNED NULL,
  actor_name   VARCHAR(100)    NOT NULL DEFAULT '',
  post_title   VARCHAR(255)    NOT NULL DEFAULT '',
  board_id     BIGINT UNSIGNED NOT NULL,
  is_read      TINYINT(1)      NOT NULL DEFAULT 0,
  created_at   DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_notif_user (user_id, is_read, created_at),
  CONSTRAINT fk_notif_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ── post_likes 테이블 생성 (011이 실패했을 경우 대비) ───────────
CREATE TABLE IF NOT EXISTS post_likes (
  id         BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  post_id    BIGINT UNSIGNED NOT NULL,
  user_id    BIGINT UNSIGNED NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_post_user (post_id, user_id),
  FOREIGN KEY (post_id) REFERENCES posts(id)  ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id)  ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DROP PROCEDURE IF EXISTS add_column_if_not_exists;
