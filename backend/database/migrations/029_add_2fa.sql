-- 2FA (TOTP) 이중 인증 컬럼 추가
ALTER TABLE users
  ADD COLUMN totp_secret VARCHAR(64) DEFAULT NULL AFTER password_hash,
  ADD COLUMN totp_enabled TINYINT(1) NOT NULL DEFAULT 0 AFTER totp_secret;
