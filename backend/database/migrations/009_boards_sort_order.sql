-- 게시판 표시 순서 컬럼 추가
ALTER TABLE boards
  ADD COLUMN IF NOT EXISTS sort_order INT UNSIGNED NOT NULL DEFAULT 0 COMMENT '표시 순서' AFTER description;

-- 기존 게시판에 created_at 순서 기반으로 sort_order 초기화
SET @row_num = 0;
UPDATE boards SET sort_order = (@row_num := @row_num + 1) ORDER BY created_at ASC;
