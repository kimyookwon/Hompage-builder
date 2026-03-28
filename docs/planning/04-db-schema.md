# 04-db-schema.md — 데이터베이스 스키마

**작성일**: 2026-03-27
**버전**: v1.0
**프로젝트명**: 홈페이지 빌더 (Homepage Builder)

**DBMS**: MySQL 8.0+
**문자 집합**: utf8mb4 (이모지 지원)
**콜레이션**: utf8mb4_unicode_ci

---

## 1. ERD (Entity Relationship Diagram) — 텍스트 표현

```
┌─────────────────────┐
│      users          │
├─────────────────────┤
│ id (PK)             │
│ email               │──┐
│ password_hash       │  │
│ name                │  │
│ role (enum)         │  │
│ oauth_provider      │  │
│ oauth_id            │  │
│ status              │  │
│ created_at          │  │
│ updated_at          │  │
└─────────────────────┘  │
                         │
     ┌───────────────────┘
     │
     ├──────────────────────────────┐
     │                              │
     v                              v
┌─────────────────────┐    ┌─────────────────────┐
│      posts          │    │     comments        │
├─────────────────────┤    ├─────────────────────┤
│ id (PK)             │    │ id (PK)             │
│ board_id (FK)       │    │ post_id (FK)        │
│ author_id (FK)      │◄───│ author_id (FK)      │
│ title               │    │ content             │
│ content             │    │ created_at          │
│ created_at          │    │ updated_at          │
│ updated_at          │    └─────────────────────┘
└─────────────────────┘

┌─────────────────────┐
│      boards         │
├─────────────────────┤
│ id (PK)             │
│ name                │
│ type (enum)         │
│ read_permission     │
│ write_permission    │
│ created_at          │
│ updated_at          │
└─────────────────────┘

┌─────────────────────┐
│      pages          │
├─────────────────────┤
│ id (PK)             │
│ title               │
│ slug (UNIQUE)       │
│ is_published        │
│ created_at          │
│ updated_at          │
└─────────────────────┘
     │
     v
┌─────────────────────┐
│   page_sections     │
├─────────────────────┤
│ id (PK)             │
│ page_id (FK)        │
│ type (enum)         │
│ format (enum)       │
│ content (JSON)      │
│ order               │
│ created_at          │
│ updated_at          │
└─────────────────────┘

┌─────────────────────┐
│   site_settings     │
├─────────────────────┤
│ id (PK)             │
│ logo_url            │
│ primary_color       │
│ secondary_color     │
│ background_color    │
│ gtm_code            │
│ updated_at          │
└─────────────────────┘
```

---

## 2. 테이블 상세 정의

### 2.1 users (사용자)

**목적**: 회원 정보 저장 (자체 가입 + 소셜 로그인)

**CREATE TABLE**:
```sql
CREATE TABLE users (
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
```

**칼럼 상세**:

| 칼럼명 | 타입 | 제약 조건 | 설명 |
|--------|------|---------|------|
| id | BIGINT UNSIGNED | PK, AUTO_INCREMENT | 자동 증가 ID |
| email | VARCHAR(255) | NOT NULL, UNIQUE | 로그인용 이메일 |
| password_hash | VARCHAR(255) | NULL | bcrypt 해시 (소셜 로그인 시 NULL) |
| name | VARCHAR(100) | NOT NULL | 사용자 이름 |
| role | ENUM('admin', 'user') | NOT NULL, DEFAULT 'user' | 역할 (관리자/사용자) |
| oauth_provider | ENUM | NULL | 소셜 제공자 (google/kakao/naver) |
| oauth_id | VARCHAR(255) | NULL | 소셜 제공자의 사용자 ID |
| status | ENUM | NOT NULL, DEFAULT 'active' | 계정 상태 (활성/차단) |
| created_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | 가입일 |
| updated_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP ON UPDATE | 수정일 |

**인덱스**:
- `PRIMARY KEY (id)`: 기본 키
- `UNIQUE KEY (email)`: 이메일 중복 방지
- `UNIQUE KEY (oauth_provider, oauth_id)`: 소셜 계정 중복 방지
- `INDEX (oauth_provider)`: 소셜 제공자별 검색 최적화

---

### 2.2 pages (페이지)

**목적**: 사이트 페이지 저장

**CREATE TABLE**:
```sql
CREATE TABLE pages (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(255) NOT NULL COMMENT '페이지 제목',
  slug VARCHAR(255) NOT NULL UNIQUE COMMENT 'URL 슬러그 (예: /about)',
  is_published BOOLEAN DEFAULT FALSE COMMENT '발행 여부',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  INDEX idx_slug (slug),
  INDEX idx_is_published (is_published)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

**칼럼 상세**:

| 칼럼명 | 타입 | 제약 조건 | 설명 |
|--------|------|---------|------|
| id | BIGINT UNSIGNED | PK, AUTO_INCREMENT | 페이지 ID |
| title | VARCHAR(255) | NOT NULL | 페이지 제목 (노출X, 관리용) |
| slug | VARCHAR(255) | NOT NULL, UNIQUE | URL 슬러그 (예: about, products) |
| is_published | BOOLEAN | DEFAULT FALSE | 공개 여부 (true=공개, false=임시) |
| created_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | 생성일 |
| updated_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP ON UPDATE | 수정일 |

**인덱스**:
- `UNIQUE KEY (slug)`: URL 중복 방지 + 빠른 조회

---

### 2.3 page_sections (페이지 섹션)

**목적**: 페이지 내 컨테이너/헤더/배너/푸터 섹션 저장

**CREATE TABLE**:
```sql
CREATE TABLE page_sections (
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
```

**칼럼 상세**:

| 칼럼명 | 타입 | 제약 조건 | 설명 |
|--------|------|---------|------|
| id | BIGINT UNSIGNED | PK, AUTO_INCREMENT | 섹션 ID |
| page_id | BIGINT UNSIGNED | NOT NULL, FK | 페이지 ID |
| type | ENUM | NOT NULL | 섹션 타입 (header/container/banner/footer) |
| format | ENUM | NOT NULL | 포맷 (bento/glassmorphism/organic/text/gallery) |
| content | JSON | NOT NULL | 섹션 콘텐츠 (JSON 형식) |
| order | INT | NOT NULL, DEFAULT 0 | 표시 순서 (낮을수록 위) |
| created_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | 생성일 |
| updated_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP ON UPDATE | 수정일 |

**인덱스**:
- `FOREIGN KEY (page_id)`: CASCADE 삭제 (페이지 삭제 시 자동 삭제)
- `INDEX (page_id, order)`: 페이지의 섹션 순서대로 조회 최적화

**content JSON 예시**:
```json
{
  "title": "섹션 제목",
  "subtitle": "부제목",
  "description": "설명",
  "items": [
    {
      "id": 1,
      "title": "항목 1",
      "image_url": "https://...",
      "size": "large"
    }
  ]
}
```

---

### 2.4 boards (게시판)

**목적**: 게시판 정보 저장

**CREATE TABLE**:
```sql
CREATE TABLE boards (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL COMMENT '게시판 이름',
  type ENUM('general', 'gallery') NOT NULL DEFAULT 'general' COMMENT '게시판 타입',
  read_permission ENUM('admin_only', 'user', 'public') NOT NULL DEFAULT 'user' COMMENT '읽기 권한',
  write_permission ENUM('admin_only', 'user') NOT NULL DEFAULT 'user' COMMENT '쓰기 권한',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

**칼럼 상세**:

| 칼럼명 | 타입 | 제약 조건 | 설명 |
|--------|------|---------|------|
| id | BIGINT UNSIGNED | PK, AUTO_INCREMENT | 게시판 ID |
| name | VARCHAR(100) | NOT NULL | 게시판 이름 |
| type | ENUM | NOT NULL, DEFAULT 'general' | 게시판 타입 (일반/갤러리) |
| read_permission | ENUM | NOT NULL, DEFAULT 'user' | 읽기 권한 (admin_only/user/public) |
| write_permission | ENUM | NOT NULL, DEFAULT 'user' | 쓰기 권한 (admin_only/user) |
| created_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | 생성일 |
| updated_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP ON UPDATE | 수정일 |

---

### 2.5 posts (게시글)

**목적**: 게시판의 게시글 저장

**CREATE TABLE**:
```sql
CREATE TABLE posts (
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
```

**칼럼 상세**:

| 칼럼명 | 타입 | 제약 조건 | 설명 |
|--------|------|---------|------|
| id | BIGINT UNSIGNED | PK, AUTO_INCREMENT | 게시글 ID |
| board_id | BIGINT UNSIGNED | NOT NULL, FK | 게시판 ID |
| author_id | BIGINT UNSIGNED | NOT NULL, FK | 작성자 ID |
| title | VARCHAR(255) | NOT NULL | 게시글 제목 |
| content | LONGTEXT | NOT NULL | 게시글 본문 (마크다운 또는 HTML) |
| created_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | 작성일 |
| updated_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP ON UPDATE | 수정일 |

**인덱스**:
- `FOREIGN KEY (board_id)`: CASCADE 삭제
- `FOREIGN KEY (author_id)`: CASCADE 삭제
- `INDEX (board_id, created_at)`: 게시판별 최신 게시글 조회 최적화

---

### 2.6 comments (댓글)

**목적**: 게시글의 댓글 저장

**CREATE TABLE**:
```sql
CREATE TABLE comments (
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
```

**칼럼 상세**:

| 칼럼명 | 타입 | 제약 조건 | 설명 |
|--------|------|---------|------|
| id | BIGINT UNSIGNED | PK, AUTO_INCREMENT | 댓글 ID |
| post_id | BIGINT UNSIGNED | NOT NULL, FK | 게시글 ID |
| author_id | BIGINT UNSIGNED | NOT NULL, FK | 작성자 ID |
| content | TEXT | NOT NULL | 댓글 내용 |
| created_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | 작성일 |
| updated_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP ON UPDATE | 수정일 |

---

### 2.7 site_settings (사이트 설정)

**목적**: 전역 사이트 설정 저장 (로고, 컬러, GTM 코드 등)

**CREATE TABLE**:
```sql
CREATE TABLE site_settings (
  id INT UNSIGNED PRIMARY KEY DEFAULT 1 COMMENT '단일 행 (id=1 고정)',
  logo_url VARCHAR(500) COMMENT '로고 이미지 URL',
  primary_color VARCHAR(7) DEFAULT '#000000' COMMENT '주 컬러 (HEX, 예: #FF5733)',
  secondary_color VARCHAR(7) DEFAULT '#CCCCCC' COMMENT '보조 컬러',
  background_color VARCHAR(7) DEFAULT '#FFFFFF' COMMENT '배경 컬러',
  gtm_code VARCHAR(255) COMMENT 'GTM Container ID 또는 전체 스크립트',
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 초기 데이터 삽입
INSERT INTO site_settings (id) VALUES (1);
```

**칼럼 상세**:

| 칼럼명 | 타입 | 제약 조건 | 설명 |
|--------|------|---------|------|
| id | INT UNSIGNED | PK, DEFAULT 1 | 고정값 (단일 행 보장) |
| logo_url | VARCHAR(500) | NULL | 로고 이미지 URL |
| primary_color | VARCHAR(7) | DEFAULT '#000000' | 주 컬러 (HEX 형식) |
| secondary_color | VARCHAR(7) | DEFAULT '#CCCCCC' | 보조 컬러 (HEX 형식) |
| background_color | VARCHAR(7) | DEFAULT '#FFFFFF' | 배경 컬러 (HEX 형식) |
| gtm_code | VARCHAR(255) | NULL | GTM Container ID 또는 스크립트 |
| updated_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP ON UPDATE | 마지막 수정일 |

**특징**:
- 단일 행 저장소 (id=1 고정)
- UPDATE 쿼리로만 수정 가능
- 쿼리: `UPDATE site_settings SET primary_color = '#FF5733' WHERE id = 1`

---

### 2.8 media_assets (미디어 자산) — Phase 2

**목적**: 업로드된 이미지/파일 저장 (추후 구현)

**CREATE TABLE**:
```sql
CREATE TABLE media_assets (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  filename VARCHAR(255) NOT NULL COMMENT '파일명',
  file_url VARCHAR(500) NOT NULL COMMENT '파일 URL (CDN)',
  mime_type VARCHAR(50) COMMENT 'MIME 타입 (image/jpeg 등)',
  file_size BIGINT COMMENT '파일 크기 (bytes)',
  uploaded_by BIGINT UNSIGNED NOT NULL COMMENT '업로드한 사용자 ID',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  FOREIGN KEY (uploaded_by) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_uploaded_by (uploaded_by),
  INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

---

## 3. 관계 정의

### 3.1 1:N 관계

| 부모 테이블 | 자식 테이블 | 관계 | CASCADE |
|----------|----------|------|--------|
| users | posts | 1:N (작성자) | CASCADE DELETE |
| users | comments | 1:N (댓글 작성자) | CASCADE DELETE |
| pages | page_sections | 1:N (페이지의 섹션) | CASCADE DELETE |
| boards | posts | 1:N (게시판의 게시글) | CASCADE DELETE |
| posts | comments | 1:N (게시글의 댓글) | CASCADE DELETE |

### 3.2 특이사항

- **users 테이블**:
  - 자체 가입 사용자: `password_hash` 저장, `oauth_provider/oauth_id` NULL
  - 소셜 로그인 사용자: `password_hash` NULL, `oauth_provider/oauth_id` 저장
  - 동일 이메일로 여러 소셜 계정 연동 가능

- **page_sections 테이블**:
  - `format`과 `content` 구조가 일대일 대응 (포맷별 JSON 스키마 정의 필요)
  - `order` 값은 같은 페이지 내에서 중복 가능 (정렬 시 1씩 증가)

- **site_settings 테이블**:
  - 싱글톤 패턴 (항상 1개 행만 존재)
  - 캐싱 권장 (메모리에 로드 후 참조)

---

## 4. 마이그레이션 스크립트 (초기화)

### 4.1 전체 스키마 생성 스크립트

**파일**: `database/migrations/001_init_schema.sql`

```sql
-- 1. users 테이블
CREATE TABLE IF NOT EXISTS users (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  email VARCHAR(255) NOT NULL UNIQUE,
  password_hash VARCHAR(255),
  name VARCHAR(100) NOT NULL,
  role ENUM('admin', 'user') NOT NULL DEFAULT 'user',
  oauth_provider ENUM('google', 'kakao', 'naver'),
  oauth_id VARCHAR(255),
  status ENUM('active', 'blocked') NOT NULL DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_email (email),
  UNIQUE KEY uq_oauth (oauth_provider, oauth_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. pages 테이블
CREATE TABLE IF NOT EXISTS pages (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  slug VARCHAR(255) NOT NULL UNIQUE,
  is_published BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_slug (slug),
  INDEX idx_is_published (is_published)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. page_sections 테이블
CREATE TABLE IF NOT EXISTS page_sections (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  page_id BIGINT UNSIGNED NOT NULL,
  type ENUM('header', 'container', 'banner', 'footer') NOT NULL,
  format ENUM('bento', 'glassmorphism', 'organic', 'text', 'gallery') NOT NULL,
  content JSON NOT NULL,
  `order` INT NOT NULL DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (page_id) REFERENCES pages(id) ON DELETE CASCADE,
  INDEX idx_page_id (page_id),
  INDEX idx_page_order (page_id, `order`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 4. boards 테이블
CREATE TABLE IF NOT EXISTS boards (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  type ENUM('general', 'gallery') NOT NULL DEFAULT 'general',
  read_permission ENUM('admin_only', 'user', 'public') NOT NULL DEFAULT 'user',
  write_permission ENUM('admin_only', 'user') NOT NULL DEFAULT 'user',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 5. posts 테이블
CREATE TABLE IF NOT EXISTS posts (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  board_id BIGINT UNSIGNED NOT NULL,
  author_id BIGINT UNSIGNED NOT NULL,
  title VARCHAR(255) NOT NULL,
  content LONGTEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (board_id) REFERENCES boards(id) ON DELETE CASCADE,
  FOREIGN KEY (author_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_board_id (board_id),
  INDEX idx_author_id (author_id),
  INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 6. comments 테이블
CREATE TABLE IF NOT EXISTS comments (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  post_id BIGINT UNSIGNED NOT NULL,
  author_id BIGINT UNSIGNED NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE,
  FOREIGN KEY (author_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_post_id (post_id),
  INDEX idx_author_id (author_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 7. site_settings 테이블
CREATE TABLE IF NOT EXISTS site_settings (
  id INT UNSIGNED PRIMARY KEY DEFAULT 1,
  logo_url VARCHAR(500),
  primary_color VARCHAR(7) DEFAULT '#000000',
  secondary_color VARCHAR(7) DEFAULT '#CCCCCC',
  background_color VARCHAR(7) DEFAULT '#FFFFFF',
  gtm_code VARCHAR(255),
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO site_settings (id) VALUES (1) ON DUPLICATE KEY UPDATE id = 1;
```

---

## 5. 인덱싱 전략

### 5.1 주요 인덱스

| 테이블 | 인덱스명 | 칼럼 | 목적 |
|--------|---------|------|------|
| users | PRIMARY | id | 기본 키 |
| users | UNIQUE | email | 중복 방지 + 빠른 조회 |
| users | UNIQUE | (oauth_provider, oauth_id) | 소셜 계정 중복 방지 |
| pages | UNIQUE | slug | URL 조회 최적화 |
| pages | INDEX | is_published | 공개 페이지 조회 최적화 |
| page_sections | INDEX | (page_id, order) | 페이지의 섹션 순서대로 조회 |
| posts | INDEX | (board_id, created_at) | 게시판의 최신 게시글 조회 |
| posts | INDEX | author_id | 사용자가 작성한 게시글 조회 |
| comments | INDEX | post_id | 게시글의 댓글 조회 |

### 5.2 쿼리 최적화 팁

**페이지와 섹션 함께 조회**:
```sql
SELECT p.*, ps.*
FROM pages p
LEFT JOIN page_sections ps ON p.id = ps.page_id
WHERE p.slug = 'about'
ORDER BY ps.order ASC;
```

**게시판별 게시글 목록 (페이지네이션)**:
```sql
SELECT p.id, p.title, u.name, p.created_at, COUNT(c.id) AS comment_count
FROM posts p
LEFT JOIN users u ON p.author_id = u.id
LEFT JOIN comments c ON p.id = c.post_id
WHERE p.board_id = 1
GROUP BY p.id
ORDER BY p.created_at DESC
LIMIT 20 OFFSET 0;
```

---

## 6. 데이터 타입 선택 사유

| 타입 | 사용처 | 이유 |
|------|--------|------|
| BIGINT UNSIGNED | 주요 ID | 최대 약 18조 개 레코드 지원 |
| VARCHAR(255) | 제목, 이메일 등 | 대부분의 문자열에 충분 |
| LONGTEXT | 게시글 본문 | 최대 4GB 텍스트 저장 |
| JSON | 섹션 콘텐츠 | 구조화된 데이터 (유연성 + 성능) |
| ENUM | 역할, 타입 등 | 고정값 집합 (메모리 효율) |
| TIMESTAMP | 날짜/시간 | 자동 타임존 처리 |

---

## 7. 참고 자료

- [Feature Specification](./03-feature-spec.md)
- [API Specification](./05-api-spec.md)
- [Screen Mapping](./06-screens.md)
