-- 알림 테이블
CREATE TABLE notifications (
  id           INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id      INT UNSIGNED NOT NULL,                   -- 알림 받을 대상
  type         ENUM('comment_on_post', 'reply_to_comment') NOT NULL,
  post_id      INT UNSIGNED NOT NULL,                   -- 이동할 게시글
  comment_id   INT UNSIGNED NULL,                       -- 연관 댓글 (nullable)
  actor_name   VARCHAR(100) NOT NULL DEFAULT '',        -- 행위자 이름
  post_title   VARCHAR(255) NOT NULL DEFAULT '',        -- 게시글 제목
  board_id     INT UNSIGNED NOT NULL,                   -- 게시판 ID (링크 생성용)
  is_read      TINYINT(1)   NOT NULL DEFAULT 0,
  created_at   DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_notif_user     (user_id, is_read, created_at DESC),
  CONSTRAINT fk_notif_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
