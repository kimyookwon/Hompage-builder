-- 사용자 프로필 아바타 URL 컬럼 추가
ALTER TABLE users ADD COLUMN avatar_url VARCHAR(500) NULL DEFAULT NULL AFTER name;
