-- posts 테이블에 공지 여부 + 썸네일 컬럼 추가
-- 작성일: 2026-03-28

ALTER TABLE posts
  ADD COLUMN IF NOT EXISTS is_notice BOOLEAN NOT NULL DEFAULT FALSE COMMENT '공지 여부' AFTER content,
  ADD COLUMN IF NOT EXISTS thumbnail_url VARCHAR(1000) NULL COMMENT '갤러리용 썸네일 URL' AFTER is_notice,
  ADD INDEX IF NOT EXISTS idx_is_notice (board_id, is_notice);
