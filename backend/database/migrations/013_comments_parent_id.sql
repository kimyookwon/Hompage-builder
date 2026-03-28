-- 댓글 대댓글 지원: parent_id (최대 1단계 중첩)
ALTER TABLE comments ADD COLUMN parent_id INT NULL DEFAULT NULL AFTER post_id;
ALTER TABLE comments ADD CONSTRAINT fk_comments_parent FOREIGN KEY (parent_id) REFERENCES comments(id) ON DELETE CASCADE;
ALTER TABLE comments ADD INDEX idx_comments_parent (parent_id);
