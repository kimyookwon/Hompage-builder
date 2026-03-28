-- 초기 데이터 시드
-- 작성일: 2026-03-27

-- 초기 admin 계정 (비밀번호: Admin1234! — bcrypt 해시)
INSERT IGNORE INTO users (email, password_hash, name, role, status)
VALUES (
  'admin@homepage.local',
  '$2y$12$MQ1rhU/484jz0TOqx2A1Iud5UGp6oExA35f0HEtCsVaIX2UaFB3aK',
  '관리자',
  'admin',
  'active'
);

-- 기본 site_settings (단일 행)
INSERT IGNORE INTO site_settings (id, primary_color, secondary_color, background_color)
VALUES (1, '#000000', '#CCCCCC', '#FFFFFF');
