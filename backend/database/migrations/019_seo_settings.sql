-- SEO 관련 사이트 설정 컬럼 추가
ALTER TABLE site_settings
  ADD COLUMN site_url VARCHAR(255) NULL COMMENT '사이트 기본 URL (sitemap 생성용)',
  ADD COLUMN robots_txt TEXT NULL COMMENT '커스텀 robots.txt 내용';
