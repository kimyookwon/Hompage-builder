-- 비밀번호 재설정 토큰 테이블
CREATE TABLE IF NOT EXISTS password_reset_tokens (
  id         BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  email      VARCHAR(255) NOT NULL COMMENT '요청한 이메일',
  token      VARCHAR(64)  NOT NULL UNIQUE COMMENT 'SHA-256 해시 토큰',
  expires_at DATETIME     NOT NULL COMMENT '만료 시각 (1시간)',
  used_at    DATETIME     NULL COMMENT '사용된 시각 (단일 사용 보장)',
  created_at DATETIME     DEFAULT CURRENT_TIMESTAMP,

  INDEX idx_email     (email),
  INDEX idx_token     (token),
  INDEX idx_expires   (expires_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
