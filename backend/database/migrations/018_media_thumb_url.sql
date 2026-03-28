-- media_assets 테이블에 썸네일 URL 컬럼 추가
ALTER TABLE media_assets
  ADD COLUMN thumb_url VARCHAR(500) NULL AFTER file_url;
