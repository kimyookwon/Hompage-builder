CREATE TABLE IF NOT EXISTS post_bookmarks (
  id         BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  post_id    BIGINT UNSIGNED NOT NULL,
  user_id    BIGINT UNSIGNED NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_bookmark (post_id, user_id),
  KEY idx_user_bookmarks (user_id)
);
