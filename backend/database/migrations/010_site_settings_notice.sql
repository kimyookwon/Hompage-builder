-- 사이트 공지 배너 필드 추가
ALTER TABLE site_settings
  ADD COLUMN IF NOT EXISTS notice_enabled TINYINT(1) NOT NULL DEFAULT 0 COMMENT '공지 배너 활성화 여부',
  ADD COLUMN IF NOT EXISTS notice_text TEXT NULL COMMENT '공지 배너 텍스트',
  ADD COLUMN IF NOT EXISTS notice_color VARCHAR(7) NOT NULL DEFAULT '#1d4ed8' COMMENT '공지 배너 배경색';
