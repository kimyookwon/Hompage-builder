-- 게시판 설명 필드 추가
ALTER TABLE boards
  ADD COLUMN IF NOT EXISTS description TEXT NULL COMMENT '게시판 설명' AFTER name;
