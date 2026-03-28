-- 태그 테이블
CREATE TABLE IF NOT EXISTS tags (
  id         BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name       VARCHAR(50)  NOT NULL UNIQUE COMMENT '태그명 (소문자, 하이픈 허용)',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_name (name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 게시글-태그 연결 테이블
CREATE TABLE IF NOT EXISTS post_tags (
  post_id BIGINT UNSIGNED NOT NULL,
  tag_id  BIGINT UNSIGNED NOT NULL,
  PRIMARY KEY (post_id, tag_id),
  FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE,
  FOREIGN KEY (tag_id)  REFERENCES tags(id)  ON DELETE CASCADE,
  INDEX idx_tag_id (tag_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
