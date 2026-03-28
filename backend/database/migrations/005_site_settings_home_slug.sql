-- site_settings에 홈 슬러그 필드 추가
ALTER TABLE site_settings
  ADD COLUMN IF NOT EXISTS home_slug VARCHAR(255) NULL COMMENT '루트(/) 접속 시 리다이렉트할 공개 페이지 슬러그';
