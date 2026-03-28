-- 이메일 인증 컬럼 추가
ALTER TABLE users
  ADD COLUMN email_verified_at DATETIME DEFAULT NULL AFTER email,
  ADD COLUMN email_verify_token VARCHAR(64) DEFAULT NULL AFTER email_verified_at;
