-- 홈페이지 빌더 초기 스키마 마이그레이션
-- 작성일: 2026-03-27
-- 버전: v1.0

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- 1. users (회원)
CREATE TABLE IF NOT EXISTS users (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  email VARCHAR(255) NOT NULL UNIQUE COMMENT '이메일 (로그인 ID)',
  password_hash VARCHAR(255) COMMENT 'bcrypt 해시 (소셜 로그인은 NULL)',
  name VARCHAR(100) NOT NULL COMMENT '사용자명',
  role ENUM('admin', 'user') NOT NULL DEFAULT 'user' COMMENT '역할',
  oauth_provider ENUM('google', 'kakao', 'naver') COMMENT '소셜 제공자',
  oauth_id VARCHAR(255) COMMENT '소셜 제공자의 사용자 ID',
  status ENUM('active', 'blocked') NOT NULL DEFAULT 'active' COMMENT '계정 상태',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  INDEX idx_email (email),
  INDEX idx_oauth_provider (oauth_provider),
  UNIQUE KEY uq_oauth (oauth_provider, oauth_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. pages (페이지)
CREATE TABLE IF NOT EXISTS pages (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(255) NOT NULL COMMENT '페이지 제목',
  slug VARCHAR(255) NOT NULL UNIQUE COMMENT 'URL 슬러그',
  is_published BOOLEAN DEFAULT FALSE COMMENT '발행 여부',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  INDEX idx_slug (slug),
  INDEX idx_is_published (is_published)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. page_sections (페이지 섹션)
CREATE TABLE IF NOT EXISTS page_sections (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  page_id BIGINT UNSIGNED NOT NULL COMMENT '페이지 ID',
  type ENUM('header', 'container', 'banner', 'footer') NOT NULL COMMENT '섹션 타입',
  format ENUM('bento', 'glassmorphism', 'organic', 'text', 'gallery') NOT NULL COMMENT '표시 포맷',
  content JSON NOT NULL COMMENT '섹션 콘텐츠 (JSON)',
  `order` INT NOT NULL DEFAULT 0 COMMENT '표시 순서',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  FOREIGN KEY (page_id) REFERENCES pages(id) ON DELETE CASCADE,
  INDEX idx_page_id (page_id),
  INDEX idx_page_order (page_id, `order`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 4. boards (게시판)
CREATE TABLE IF NOT EXISTS boards (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL COMMENT '게시판 이름',
  type ENUM('general', 'gallery') NOT NULL DEFAULT 'general' COMMENT '게시판 타입',
  read_permission ENUM('admin_only', 'user', 'public') NOT NULL DEFAULT 'user' COMMENT '읽기 권한',
  write_permission ENUM('admin_only', 'user') NOT NULL DEFAULT 'user' COMMENT '쓰기 권한',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 5. posts (게시글)
CREATE TABLE IF NOT EXISTS posts (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  board_id BIGINT UNSIGNED NOT NULL COMMENT '게시판 ID',
  author_id BIGINT UNSIGNED NOT NULL COMMENT '작성자 ID',
  title VARCHAR(255) NOT NULL COMMENT '제목',
  content LONGTEXT NOT NULL COMMENT '본문 내용',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  FOREIGN KEY (board_id) REFERENCES boards(id) ON DELETE CASCADE,
  FOREIGN KEY (author_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_board_id (board_id),
  INDEX idx_author_id (author_id),
  INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 6. comments (댓글)
CREATE TABLE IF NOT EXISTS comments (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  post_id BIGINT UNSIGNED NOT NULL COMMENT '게시글 ID',
  author_id BIGINT UNSIGNED NOT NULL COMMENT '작성자 ID',
  content TEXT NOT NULL COMMENT '댓글 내용',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE,
  FOREIGN KEY (author_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_post_id (post_id),
  INDEX idx_author_id (author_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 7. site_settings (사이트 설정) — 단일 행
CREATE TABLE IF NOT EXISTS site_settings (
  id INT UNSIGNED PRIMARY KEY DEFAULT 1 COMMENT '단일 행 (id=1 고정)',
  logo_url VARCHAR(500) COMMENT '로고 이미지 URL',
  primary_color VARCHAR(7) DEFAULT '#000000' COMMENT '주 컬러 (HEX)',
  secondary_color VARCHAR(7) DEFAULT '#CCCCCC' COMMENT '보조 컬러',
  background_color VARCHAR(7) DEFAULT '#FFFFFF' COMMENT '배경 컬러',
  gtm_code VARCHAR(255) COMMENT 'GTM Container ID',
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 8. media_assets (미디어 자산)
CREATE TABLE IF NOT EXISTS media_assets (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  filename VARCHAR(255) NOT NULL COMMENT '파일명',
  file_url VARCHAR(500) NOT NULL COMMENT '파일 URL',
  mime_type VARCHAR(50) COMMENT 'MIME 타입',
  file_size BIGINT COMMENT '파일 크기 (bytes)',
  uploaded_by BIGINT UNSIGNED NOT NULL COMMENT '업로드한 사용자 ID',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  FOREIGN KEY (uploaded_by) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_uploaded_by (uploaded_by),
  INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

SET FOREIGN_KEY_CHECKS = 1;
