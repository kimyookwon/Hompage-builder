-- pages 테이블에 SEO 필드 추가
-- 작성일: 2026-03-28

ALTER TABLE pages
  ADD COLUMN IF NOT EXISTS seo_description VARCHAR(500) NULL COMMENT 'SEO 메타 설명' AFTER is_published,
  ADD COLUMN IF NOT EXISTS seo_og_image VARCHAR(1000) NULL COMMENT 'OG 이미지 URL' AFTER seo_description;
