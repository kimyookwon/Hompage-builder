CREATE TABLE IF NOT EXISTS reports (
  id          BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  comment_id  BIGINT UNSIGNED NOT NULL,
  reporter_id BIGINT UNSIGNED NOT NULL,
  reason      ENUM('spam','abuse','inappropriate','other') NOT NULL DEFAULT 'other',
  status      ENUM('pending','reviewed','dismissed') NOT NULL DEFAULT 'pending',
  note        TEXT NULL,
  created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_report (comment_id, reporter_id),
  KEY idx_status (status)
);
