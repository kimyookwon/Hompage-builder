-- site_settings에 사이트명 추가
ALTER TABLE site_settings
  ADD COLUMN IF NOT EXISTS site_name VARCHAR(100) NULL COMMENT '사이트 이름 (헤더/탭 타이틀에 표시)';
