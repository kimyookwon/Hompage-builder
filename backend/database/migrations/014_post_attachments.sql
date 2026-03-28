-- 게시글 첨부파일 테이블
CREATE TABLE post_attachments (
  id          INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  post_id     INT UNSIGNED NOT NULL,
  uploaded_by INT UNSIGNED NOT NULL,
  file_name   VARCHAR(255)  NOT NULL,
  file_url    VARCHAR(1000) NOT NULL,
  file_size   INT UNSIGNED  NOT NULL DEFAULT 0,   -- bytes
  mime_type   VARCHAR(127)  NOT NULL DEFAULT '',
  created_at  DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_attach_post FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE,
  INDEX idx_attach_post (post_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
