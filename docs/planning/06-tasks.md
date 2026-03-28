# 08-tasks.md — 개발 태스크 목록

**작성일**: 2026-03-27
**버전**: v1.0
**프로젝트명**: 홈페이지 빌더 (Homepage Builder)
**총 Phase**: 4개
**총 Task**: 37개
**예상 소요 기간**: 8주

---

## 태스크 ID 규칙

| 형식 | 용도 | 예시 |
|------|------|------|
| `P{N}-T{X}` | 셋업 태스크 | P0-T1: PHP 초기화 |
| `P{N}-R{M}-T{X}` | Backend Resource API | P1-R2-T1: JWT 인증 API |
| `P{N}-S{M}-T{X}` | Frontend Screen | P2-S4-T1: 페이지 관리 UI |
| `P{N}-S{M}-V` | Screen Verification | P2-S4-V: 페이지 관리 검증 |

**담당자 매핑**:
- backend-specialist: P{N}-R{M}-T{X}
- frontend-specialist: P{N}-S{M}-T{X}, P{N}-S{M}-V
- fullstack-specialist: P{N}-T{X}
- test-specialist: 모든 태스크의 TDD 테스트 코드

---

## Phase 0: 프로젝트 셋업 (3개 태스크)

설계 문서 완성 후 개발 환경 구성. Phase 0 완료 후 Phase 1-4 병렬 시작 가능.

### P0-T1: PHP 프로젝트 초기화

- **담당**: fullstack-specialist
- **의존**: 없음
- **목적**: PHP 백엔드 프로젝트 기초 구성
- **세부 작업**:
  - Composer `composer.json` 생성 (php-dotenv, firebase/jwt 등 의존성)
  - 프로젝트 디렉토리 구조 생성: `api/`, `public/`, `views/`, `database/`
  - `.env.example` 작성 (DB 접속, JWT Secret, OAuth Keys)
  - `.htaccess` API 라우팅 설정 (PHP-FPM 호환)
  - 기본 Router 클래스 구현 (GET, POST, PATCH, DELETE)
  - 에러 핸들러 및 로깅 설정
- **파일**:
  - `backend/composer.json`
  - `backend/.env.example`
  - `backend/.htaccess`
  - `backend/api/Router.php`
  - `backend/src/Utils/Logger.php`
- **완료 조건**:
  - Composer 패키지 설치 완료
  - 라우터 기본 동작 확인
  - `.env` 파일로 환경 변수 로드 가능

### P0-T2: Next.js 관리자 앱 초기화

- **담당**: frontend-specialist
- **의존**: 없음
- **목적**: Next.js 관리자 SPA 기초 구성
- **세부 작업**:
  - `npx create-next-app@latest admin --typescript --tailwind --app-router`
  - shadcn/ui 설치 및 기본 컴포넌트 (Button, Input, Select, Modal, Card)
  - Zustand 설치 및 기본 스토어 구조 생성
  - React Hook Form + Zod 설치
  - 폴더 구조: `app/`, `components/`, `lib/`, `stores/`, `types/`, `hooks/`
  - API 클라이언트 유틸리티 (`lib/api.ts`)
  - 환경 변수 설정 (`.env.local.example`)
- **파일**:
  - `admin/package.json`
  - `admin/app/layout.tsx`
  - `admin/lib/api.ts`
  - `admin/stores/authStore.ts`
  - `admin/types/index.ts`
- **완료 조건**:
  - Next.js 개발 서버 `npm run dev` 정상 실행
  - shadcn/ui 컴포넌트 렌더링 확인
  - TypeScript 환경 정상 작동

### P0-T3: Docker Compose 개발 환경 구성

- **담당**: fullstack-specialist
- **의존**: P0-T1, P0-T2
- **목적**: 로컬 개발 환경 구성 (PHP + MySQL + Nginx)
- **세부 작업**:
  - `docker-compose.yml` 작성:
    - PHP 8.2 FPM 서비스
    - Nginx 서비스 (PHP 라우팅)
    - MySQL 8.0 서비스 (utf8mb4)
  - Dockerfile 작성 (PHP 의존성 설치)
  - 개발용 환경 변수 분리 (`.env.docker`)
  - 초기화 스크립트 (DB 마이그레이션)
  - 실행 가이드 문서
- **파일**:
  - `docker-compose.yml`
  - `Dockerfile` (PHP)
  - `nginx.conf`
  - `docs/SETUP.md`
- **완료 조건**:
  - `docker-compose up` 성공 실행
  - localhost:8000/api 접근 가능
  - MySQL 8.0 정상 실행 확인

---

## Phase 1: 공통 기반 — 인증 + 레이아웃 (7개 태스크)

인증 시스템 구축 및 관리자 UI 기초 레이아웃 완성. P1 완료 후 P2-P4 병렬 시작.

### P1-R1-T1: DB 스키마 마이그레이션

- **담당**: backend-specialist
- **의존**: P0-T3
- **Worktree**: `worktree/phase-1-db-schema`
- **브랜치**: `phase-1-db-schema`
- **목적**: 8개 테이블 생성 및 초기 데이터 삽입
- **세부 작업**:
  - SQL 마이그레이션 파일 작성:
    - `001_init_schema.sql` (8개 테이블)
    - `002_seed_data.sql` (초기 admin 계정, site_settings)
  - 테이블 정의:
    1. `users` (회원)
    2. `pages` (페이지)
    3. `page_sections` (페이지 섹션)
    4. `boards` (게시판)
    5. `posts` (게시글)
    6. `comments` (댓글)
    7. `site_settings` (사이트 설정)
    8. `media_assets` (미디어 자산)
  - 인덱스 및 외래키 설정
  - 마이그레이션 실행 스크립트
- **파일**:
  - `database/migrations/001_init_schema.sql`
  - `database/migrations/002_seed_data.sql`
  - `database/migrate.php`
- **TDD 테스트**:
  - 모든 테이블 존재 확인
  - 인덱스 생성 확인
  - 초기 데이터 검증
- **완료 조건**:
  - MySQL에 8개 테이블 정상 생성
  - 초기 admin 계정 생성 (email: admin@homepage.local)
  - 기본 site_settings 1개 행 생성

### P1-R2-T1: JWT 인증 API (자체 회원가입/로그인)

- **담당**: backend-specialist
- **의존**: P1-R1-T1
- **Worktree**: `worktree/phase-1-jwt-auth`
- **브랜치**: `phase-1-jwt-auth`
- **목적**: 자체 회원가입 및 JWT 기반 로그인 구현
- **세부 작업**:
  - JWT 토큰 생성/검증 유틸리티 (`src/Utils/JwtHandler.php`)
  - bcrypt 비밀번호 해시 유틸리티
  - 인증 미들웨어 (JWT 토큰 검증, Role 체크)
  - API 엔드포인트:
    - `POST /api/auth/register` (회원가입)
    - `POST /api/auth/login` (로그인)
    - `POST /api/auth/logout` (로그아웃 - 토큰 삭제)
    - `GET /api/auth/me` (현재 사용자 정보)
  - 요청/응답 유효성 검사
  - 에러 처리 (중복 이메일, 잘못된 비밀번호, 토큰 만료)
- **파일**:
  - `backend/src/Utils/JwtHandler.php`
  - `backend/src/Utils/PasswordHash.php`
  - `backend/src/Middleware/AuthMiddleware.php`
  - `backend/src/Controllers/AuthController.php`
- **TDD 테스트** (test-specialist):
  - 회원가입 성공/실패 케이스
  - 로그인 성공/실패 케이스
  - JWT 토큰 생성 및 검증
  - 토큰 만료 처리
  - 차단된 사용자 로그인 거부
- **완료 조건**:
  - 자체 회원가입 가능 (JWT 자동 발급)
  - 로그인 성공 시 JWT 토큰 반환
  - JWT 미들웨어 통과/실패 동작
  - 테스트 커버리지 70% 이상

### P1-R3-T1: OAuth 소셜 로그인 API (Google, Kakao, Naver)

- **담당**: backend-specialist
- **의존**: P1-R2-T1
- **Worktree**: `worktree/phase-1-oauth`
- **브랜치**: `phase-1-oauth`
- **목적**: 3개 OAuth 제공자 통합 및 자동 회원가입
- **세부 작업**:
  - OAuth 핸들러 클래스 (`src/Services/OAuthService.php`)
  - 각 제공자별 구현:
    - Google OAuth 2.0
    - Kakao OAuth 2.0
    - Naver OAuth 2.0
  - API 엔드포인트:
    - `GET /api/auth/oauth/{provider}/redirect` (리다이렉트 URL 생성)
    - `POST /api/auth/oauth/{provider}/callback` (콜백 처리)
  - 신규 사용자 자동 가입 로직
  - 기존 사용자 연동 로직
  - 에러 처리 (유효하지 않은 authorization code)
- **파일**:
  - `backend/src/Services/OAuthService.php`
  - `backend/src/Controllers/OAuthController.php`
  - `.env.example` (OAuth Keys 추가)
- **TDD 테스트** (test-specialist):
  - OAuth authorization code 처리
  - 신규 사용자 자동 가입
  - 기존 사용자 연동
  - 제공자별 사용자 정보 매핑
- **완료 조건**:
  - Google/Kakao/Naver OAuth 리다이렉트 URL 생성
  - 콜백 처리 후 JWT 토큰 발급
  - 신규 사용자 자동 가입

### P1-S0-T1: Next.js 공통 AdminNav 레이아웃

- **담당**: frontend-specialist
- **의존**: P0-T2
- **Worktree**: `worktree/phase-1-admin-layout`
- **브랜치**: `phase-1-admin-layout`
- **목적**: 관리자 화면 공통 레이아웃 및 네비게이션 구성
- **세부 작업**:
  - AdminNav 사이드바 컴포넌트 (`components/AdminNav.tsx`)
  - 메뉴 항목:
    - 대시보드 (/admin)
    - 페이지 관리 (/admin/pages)
    - 게시판 관리 (/admin/boards)
    - 회원 관리 (/admin/members)
    - 시서스 관리 (/admin/settings)
  - AdminLayout 래퍼 컴포넌트 (`components/AdminLayout.tsx`)
  - JWT 인증 체크 (localStorage에서 토큰 검증)
  - 미인증 시 /login으로 자동 리다이렉트
  - API 클라이언트 유틸리티 강화 (`lib/api.ts`):
    - Authorization 헤더 자동 삽입
    - 에러 처리 (401 시 로그아웃)
  - Tailwind CSS 스타일링 (반응형)
- **파일**:
  - `admin/components/AdminNav.tsx`
  - `admin/components/AdminLayout.tsx`
  - `admin/lib/api.ts` (수정)
  - `admin/hooks/useAuth.ts`
- **완료 조건**:
  - 사이드바 렌더링 확인
  - 미인증 사용자 /login 리다이렉트
  - API 요청 시 JWT 헤더 자동 삽입
  - 반응형 디자인 (모바일/태블릿/데스크톱)

### P1-S0-T2: Next.js 공통 타입 및 스토어 정의

- **담당**: frontend-specialist
- **의존**: P1-S0-T1
- **Worktree**: `worktree/phase-1-types-store`
- **브랜치**: `phase-1-types-store`
- **목적**: 전역 TypeScript 타입 및 Zustand 스토어 정의
- **세부 작업**:
  - TypeScript 타입 정의 (`types/index.ts`):
    - User, Page, PageSection, Board, Post, Comment, SiteSettings
    - API 응답 타입
  - Zustand 스토어 구현:
    - `stores/authStore.ts` (JWT, 현재 사용자, 로그인/로그아웃)
    - `stores/appStore.ts` (로딩 상태, 알림 메시지)
  - Custom Hooks:
    - `hooks/useAuth.ts` (인증 관련)
    - `hooks/useApi.ts` (API 호출 래퍼)
- **파일**:
  - `admin/types/index.ts`
  - `admin/stores/authStore.ts`
  - `admin/stores/appStore.ts`
  - `admin/hooks/useAuth.ts`
  - `admin/hooks/useApi.ts`
- **완료 조건**:
  - 모든 타입 정의 완료
  - Zustand 스토어 정상 작동
  - Custom Hooks 사용 가능

### P1-S2-T1: 로그인 화면 UI (S02)

- **담당**: frontend-specialist
- **의존**: P1-R2-T1, P1-R3-T1, P1-S0-T2
- **Worktree**: `worktree/phase-1-login-screen`
- **브랜치**: `phase-1-login-screen`
- **목적**: 로그인/회원가입 페이지 UI 구현
- **세부 작업**:
  - `/login` 페이지 (`app/login/page.tsx`)
  - LoginForm 컴포넌트 (`components/auth/LoginForm.tsx`):
    - 이메일 입력 필드
    - 비밀번호 입력 필드
    - React Hook Form + Zod 검증
    - 로그인 버튼
    - 회원가입 링크
  - SocialLoginButtons 컴포넌트 (`components/auth/SocialLoginButtons.tsx`):
    - Google 로그인 버튼
    - Kakao 로그인 버튼
    - Naver 로그인 버튼
    - OAuth 리다이렉트 구현
  - 에러 메시지 표시
  - 성공 시 리다이렉트:
    - 관리자 → `/admin`
    - 일반 사용자 → `/`
  - Tailwind CSS 스타일링 (반응형)
- **파일**:
  - `admin/app/login/page.tsx`
  - `admin/components/auth/LoginForm.tsx`
  - `admin/components/auth/SocialLoginButtons.tsx`
- **완료 조건**:
  - `/login` 페이지 정상 렌더링
  - 폼 검증 동작
  - 에러 메시지 표시
  - 반응형 디자인

### P1-S2-V: 로그인 화면 연결점 검증

- **담당**: frontend-specialist
- **의존**: P1-S2-T1
- **Worktree**: `worktree/phase-1-login-verification`
- **브랜치**: `phase-1-login-verification`
- **목적**: 로그인 화면과 백엔드 API 연동 검증
- **세부 작업**:
  - 자체 로그인 API 연결 테스트
  - OAuth 콜백 URL 처리 테스트
  - JWT 토큰 localStorage 저장 확인
  - 에러 메시지 표시 확인
  - 성공 후 리다이렉트 확인
  - 통합 테스트 (e2e)
- **파일**:
  - `admin/tests/auth/login.spec.ts` (Vitest 또는 Jest)
- **TDD 테스트** (test-specialist):
  - 자체 로그인 성공/실패
  - OAuth 리다이렉트
  - 토큰 저장/로드
- **완료 조건**:
  - 자체 로그인 API 응답 처리 확인
  - OAuth 콜백 정상 작동
  - 토큰 저장 확인
  - 에러 처리 확인

---

## Phase 2: 페이지 빌더 코어 (10개 태스크)

페이지 관리, 컨테이너 편집기, 공개 페이지 렌더링 구현.

### P2-R1-T1: Pages CRUD API (PHP)

- **담당**: backend-specialist
- **의존**: P1-R1-T1
- **Worktree**: `worktree/phase-2-pages-api`
- **브랜치**: `phase-2-pages-api`
- **목적**: 페이지 생성, 조회, 수정, 삭제 API 구현
- **세부 작업**:
  - Pages 컨트롤러 (`src/Controllers/PageController.php`)
  - API 엔드포인트:
    - `GET /api/pages` (목록, 페이지네이션, 검색)
    - `POST /api/pages` (생성)
    - `GET /api/pages/{id}` (상세)
    - `PATCH /api/pages/{id}` (수정)
    - `DELETE /api/pages/{id}` (삭제)
    - `PATCH /api/pages/{id}/publish` (발행 토글)
    - `GET /public/pages/{slug}` (공개 페이지 조회)
  - 권한 검증 (admin만 CRUD)
  - Slug 중복 검사
  - 페이지네이션 처리
- **파일**:
  - `backend/src/Controllers/PageController.php`
  - `backend/src/Models/Page.php`
- **TDD 테스트** (test-specialist):
  - CRUD 각 엔드포인트 테스트
  - 권한 검증 테스트
  - Slug 중복 검사
  - 페이지네이션
- **완료 조건**:
  - 페이지 CRUD 모두 동작
  - 권한 기반 접근 제어 작동
  - 공개 페이지 조회 가능

### P2-R2-T1: PageSections CRUD + Reorder API (PHP)

- **담당**: backend-specialist
- **의존**: P2-R1-T1
- **Worktree**: `worktree/phase-2-sections-api`
- **브랜치**: `phase-2-sections-api`
- **목적**: 페이지 섹션 관리 및 순서 변경 API
- **세부 작업**:
  - PageSections 컨트롤러 (`src/Controllers/PageSectionController.php`)
  - API 엔드포인트:
    - `GET /api/pages/{id}/sections` (섹션 목록, order 순서)
    - `POST /api/pages/{id}/sections` (섹션 추가)
    - `PATCH /api/sections/{id}` (섹션 수정)
    - `DELETE /api/sections/{id}` (섹션 삭제)
    - `PATCH /api/pages/{id}/sections/reorder` (순서 변경)
  - 권한 검증 (admin만)
  - Header/Footer 중복 검사
  - 트랜잭션 처리 (순서 변경 시)
- **파일**:
  - `backend/src/Controllers/PageSectionController.php`
  - `backend/src/Models/PageSection.php`
- **TDD 테스트** (test-specialist):
  - 섹션 CRUD 테스트
  - 순서 변경 테스트 (트랜잭션 원자성)
  - Header/Footer 중복 검사
- **완료 조건**:
  - 섹션 CRUD 모두 동작
  - 순서 변경 트랜잭션 처리
  - 포맷별 JSON 콘텐츠 저장/조회

### P2-R3-T1: MediaAssets API (파일 업로드, PHP)

- **담당**: backend-specialist
- **의존**: P1-R1-T1
- **Worktree**: `worktree/phase-2-media-api`
- **브랜치**: `phase-2-media-api`
- **목적**: 이미지 업로드 및 관리 API
- **세부 작업**:
  - MediaAssets 컨트롤러 (`src/Controllers/MediaAssetController.php`)
  - API 엔드포인트:
    - `POST /api/media/upload` (이미지 업로드)
    - `DELETE /api/media/{id}` (삭제)
  - 파일 검증:
    - 타입 검증 (image/jpeg, image/png, image/webp)
    - 크기 제한 (5MB)
  - 파일 저장 경로: `/public/uploads/{year}/{month}/{random}.ext`
  - URL 반환: `/uploads/{year}/{month}/{random}.ext`
  - 권한 검증 (admin만)
- **파일**:
  - `backend/src/Controllers/MediaAssetController.php`
  - `backend/src/Models/MediaAsset.php`
  - `backend/src/Utils/FileUploadHandler.php`
- **TDD 테스트** (test-specialist):
  - 파일 업로드 성공/실패
  - 파일 타입 검증
  - 파일 크기 검증
  - 파일 삭제
- **완료 조건**:
  - 이미지 업로드 가능
  - 파일 검증 동작
  - 파일 URL 반환

### P2-S4-T1: 페이지 관리 화면 (S04)

- **담당**: frontend-specialist
- **의존**: P2-R1-T1, P1-S0-T2
- **Worktree**: `worktree/phase-2-page-management`
- **브랜치**: `phase-2-page-management`
- **목적**: 관리자 페이지 관리 UI 구현
- **세부 작업**:
  - `/admin/pages` 페이지 (`app/admin/pages/page.tsx`)
  - PageListTable 컴포넌트:
    - 제목, 슬러그, 발행 여부, 섹션 수, 생성일, 작업
    - 발행 토글 (즉시 API 호출)
    - 수정 버튼 (편집기로 이동)
    - 삭제 버튼 (확인 모달)
  - PageCreateModal 컴포넌트:
    - 페이지 제목 입력
    - 슬러그 자동 생성 (title → slug)
    - 생성 버튼
  - DeleteConfirmModal 컴포넌트
  - 페이지네이션 UI
  - Tailwind CSS 스타일링
  - 반응형 디자인
- **파일**:
  - `admin/app/admin/pages/page.tsx`
  - `admin/components/pages/PageListTable.tsx`
  - `admin/components/pages/PageCreateModal.tsx`
  - `admin/components/common/DeleteConfirmModal.tsx`
- **완료 조건**:
  - 페이지 목록 렌더링
  - 발행 토글 동작
  - 페이지 생성 모달 동작
  - 삭제 확인 모달 동작

### P2-S5-T1: 컨테이너 편집기 (S05)

- **담당**: frontend-specialist
- **의존**: P2-R1-T1, P2-R2-T1, P1-S0-T2
- **Worktree**: `worktree/phase-2-container-editor`
- **브랜치**: `phase-2-container-editor`
- **목적**: 페이지 섹션 편집 UI 및 미리보기
- **세부 작업**:
  - `/admin/pages/{page_id}/edit` 페이지 (`app/admin/pages/[id]/edit/page.tsx`)
  - 3패널 레이아웃:
    - 좌측: SectionTree (섹션 목록, 드래그 정렬 dnd-kit)
    - 중앙: SectionEditor (폼 입력)
    - 우측: PreviewPanel (반응형 미리보기)
  - SectionTree 컴포넌트:
    - 헤더/컨테이너/배너/푸터 목록
    - 드래그 정렬 (dnd-kit 라이브러리)
    - AddSectionButton
  - AddSectionModal:
    - 섹션 타입 선택 (header/container/banner/footer)
    - 포맷 선택 (bento/glassmorphism/organic/text/gallery)
    - 생성 버튼
  - SectionEditor:
    - 포맷별 폼 렌더링:
      - Bento: title, items[] (각 item: title, description, image_url, size)
      - Glassmorphism: background_image, title, description, cards[]
      - Organic: title, items[]
      - Text: title, subtitle, body, align
      - Gallery: title, images[] (각 image: url, alt, caption)
    - 자동 저장 (debounce 1000ms)
  - PreviewPanel:
    - 반응형 토글 (mobile 375px / tablet 768px / desktop 1200px)
    - 실시간 미리보기
  - 파일 업로드 통합 (MediaAssets API)
- **파일**:
  - `admin/app/admin/pages/[id]/edit/page.tsx`
  - `admin/components/editor/SectionTree.tsx`
  - `admin/components/editor/AddSectionModal.tsx`
  - `admin/components/editor/SectionEditor.tsx`
  - `admin/components/editor/SectionFormatEditor.tsx` (포맷별 폼)
  - `admin/components/editor/PreviewPanel.tsx`
  - `admin/components/editor/ImageUploader.tsx`
- **외부 라이브러리**:
  - `@dnd-kit/core`, `@dnd-kit/utilities` (드래그 정렬)
- **TDD 테스트** (test-specialist):
  - 섹션 추가/삭제/정렬 API 연결
  - 폼 검증
  - 자동 저장 debounce
- **완료 조건**:
  - 페이지 편집기 렌더링
  - 섹션 드래그 정렬 동작
  - 포맷별 폼 렌더링
  - 미리보기 실시간 반영
  - 자동 저장 동작

### P2-S1-T1: 공개 홈페이지 PHP 렌더러 (S01)

- **담당**: backend-specialist
- **의존**: P2-R1-T1, P2-R2-T1
- **Worktree**: `worktree/phase-2-public-renderer`
- **브랜치**: `phase-2-public-renderer`
- **목적**: 관리자 구성 페이지를 공개 HTML로 렌더링
- **세부 작업**:
  - `/public/index.php` (메인 진입점, slug 라우팅)
  - 페이지 조회 로직:
    - URL slug 파싱
    - DB에서 page + sections 조회
    - is_published=true 확인
  - 섹션별 HTML 렌더링 (PHP 템플릿):
    - `/views/sections/bento.php`
    - `/views/sections/glassmorphism.php`
    - `/views/sections/organic.php`
    - `/views/sections/text.php`
    - `/views/sections/gallery.php`
  - CSS 변수 주입:
    - `--primary-color`, `--secondary-color`, `--background-color`
    - site_settings에서 읽어서 주입
  - 다크모드 JS 스크립트:
    - `prefers-color-scheme` 감지
    - 토글 버튼 (실시간 전환)
    - localStorage 저장
  - GTM 코드 자동 삽입 (site_settings.gtm_code)
  - 반응형 CSS (mobile < 768px, tablet < 1024px)
  - SEO 메타 태그 (초기: 기본값, Phase 2에서 개선)
- **파일**:
  - `public/index.php`
  - `public/views/layout.php` (메인 레이아웃)
  - `public/views/sections/bento.php`
  - `public/views/sections/glassmorphism.php`
  - `public/views/sections/organic.php`
  - `public/views/sections/text.php`
  - `public/views/sections/gallery.php`
  - `public/css/global.css` (2026 트렌드 CSS)
  - `public/js/darkmode.js`
- **CSS 프레임워크**:
  - Tailwind CSS (또는 inline CSS로 생성)
  - 2026 트렌드 스타일:
    - Bento Grid: CSS Grid `grid-template-columns: repeat(auto-fit, ...)`
    - Glassmorphism: `backdrop-filter: blur(...)`, `background: rgba(..., 0.3)`
    - Organic Shapes: SVG path 또는 border-radius 조합
- **완료 조건**:
  - 슬러그별 페이지 렌더링
  - 포맷별 CSS 적용
  - 디자인 토큰 반영
  - 다크모드 토글
  - GTM 코드 삽입

### P2-S4-V: 페이지 관리 연결점 검증

- **담당**: frontend-specialist
- **의존**: P2-S4-T1
- **Worktree**: `worktree/phase-2-page-management-verification`
- **브랜치**: `phase-2-page-management-verification`
- **목적**: 페이지 관리 화면과 백엔드 API 연동 검증
- **세부 작업**:
  - 페이지 목록 조회 API 연결 테스트
  - 발행 토글 즉시 반영 테스트
  - 페이지 생성 후 목록 갱신 테스트
  - 페이지 삭제 후 목록 갱신 테스트
- **파일**:
  - `admin/tests/pages/page-list.spec.ts`
- **TDD 테스트** (test-specialist):
  - API 연결 검증
  - UI 상태 동기화
- **완료 조건**:
  - 모든 API 연결 확인
  - UI 반영 확인

### P2-S5-V: 컨테이너 편집기 연결점 검증

- **담당**: frontend-specialist
- **의존**: P2-S5-T1
- **Worktree**: `worktree/phase-2-container-editor-verification`
- **브랜치**: `phase-2-container-editor-verification`
- **목적**: 컨테이너 편집기와 백엔드 API 연동 검증
- **세부 작업**:
  - 섹션 추가 API 연결 테스트
  - 섹션 삭제 API 연결 테스트
  - 섹션 정렬 API 연결 테스트
  - 미리보기 데이터 반영 테스트
  - 이미지 업로드 연동 테스트
- **파일**:
  - `admin/tests/editor/container-editor.spec.ts`
- **TDD 테스트** (test-specialist):
  - API 연결 검증
  - 드래그 정렬 동작
  - 미리보기 동기화
- **완료 조건**:
  - 모든 API 연결 확인
  - 섹션 정렬 동작 확인
  - 미리보기 실시간 반영 확인

### P2-S1-V: 공개 홈페이지 연결점 검증

- **담당**: backend-specialist
- **의존**: P2-S1-T1
- **Worktree**: `worktree/phase-2-public-renderer-verification`
- **브랜치**: `phase-2-public-renderer-verification`
- **목적**: 공개 홈페이지 렌더링 검증
- **세부 작업**:
  - 슬러그별 페이지 렌더링 테스트
  - 포맷별 CSS 적용 확인
  - 디자인 토큰 반영 확인
  - 다크모드 토글 테스트
  - GTM 코드 삽입 확인
  - 미발행 페이지 접근 차단 테스트
- **파일**:
  - `backend/tests/PublicPageTest.php`
- **TDD 테스트** (test-specialist):
  - 페이지 렌더링
  - 포맷별 CSS 검증
  - 접근 권한
- **완료 조건**:
  - 슬러그별 페이지 정상 렌더링
  - 포맷별 스타일 적용 확인
  - 미발행 페이지 404 반환

---

## Phase 3: 회원 + 게시판 관리 (14개 태스크)

회원 관리, 게시판/게시글, 댓글 기능 구현. P3은 P2와 병렬 진행 가능.

### P3-R1-T1: Users CRUD API (PHP)

- **담당**: backend-specialist
- **의존**: P1-R2-T1
- **Worktree**: `worktree/phase-3-users-api`
- **브랜치**: `phase-3-users-api`
- **목적**: 회원 관리 API 구현
- **세부 작업**:
  - Users 컨트롤러 (`src/Controllers/UserController.php`)
  - API 엔드포인트:
    - `GET /api/users` (목록, 페이지네이션, 검색, 필터)
    - `GET /api/users/{id}` (상세)
    - `PATCH /api/users/{id}/role` (역할 변경)
    - `PATCH /api/users/{id}/status` (상태 변경)
    - `DELETE /api/users/{id}` (강제 탈퇴)
  - 권한 검증 (admin만)
  - 검색/필터: email, name, role, status
  - 페이지네이션
- **파일**:
  - `backend/src/Controllers/UserController.php`
  - `backend/src/Models/User.php`
- **TDD 테스트** (test-specialist):
  - 역할 변경 권한 테스트
  - 상태 변경 권한 테스트
  - 검색/필터 테스트
- **완료 조건**:
  - 회원 CRUD 모두 동작
  - 권한 기반 접근 제어
  - 검색/필터 동작

### P3-R2-T1: Boards CRUD API (PHP)

- **담당**: backend-specialist
- **의존**: P1-R1-T1
- **Worktree**: `worktree/phase-3-boards-api`
- **브랜치**: `phase-3-boards-api`
- **목적**: 게시판 관리 API
- **세부 작업**:
  - Boards 컨트롤러 (`src/Controllers/BoardController.php`)
  - API 엔드포인트:
    - `GET /api/boards` (목록)
    - `POST /api/boards` (생성)
    - `PATCH /api/boards/{id}` (수정)
    - `DELETE /api/boards/{id}` (삭제 + 게시글 CASCADE)
  - 권한 검증 (admin만)
  - 게시글 수 함께 반환
- **파일**:
  - `backend/src/Controllers/BoardController.php`
  - `backend/src/Models/Board.php`
- **TDD 테스트** (test-specialist):
  - CRUD 테스트
  - CASCADE 삭제 테스트
- **완료 조건**:
  - 게시판 CRUD 동작
  - 권한 검증 작동

### P3-R3-T1: Posts CRUD API (PHP)

- **담당**: backend-specialist
- **의존**: P3-R2-T1, P1-R2-T1
- **Worktree**: `worktree/phase-3-posts-api`
- **브랜치**: `phase-3-posts-api`
- **목적**: 게시글 관리 API
- **세부 작업**:
  - Posts 컨트롤러 (`src/Controllers/PostController.php`)
  - API 엔드포인트:
    - `GET /api/boards/{id}/posts` (목록, 페이지네이션)
    - `GET /api/posts/{id}` (상세)
    - `POST /api/boards/{id}/posts` (작성, 권한 검증)
    - `DELETE /api/posts/{id}` (삭제, 작성자 또는 admin만)
  - 권한 검증:
    - read_permission에 따른 조회 제한
    - write_permission에 따른 작성 제한
    - 작성자 또는 admin만 삭제 가능
  - 댓글 수 함께 반환
- **파일**:
  - `backend/src/Controllers/PostController.php`
  - `backend/src/Models/Post.php`
- **TDD 테스트** (test-specialist):
  - CRUD 테스트
  - 권한별 작성 테스트
  - 권한별 조회 테스트
- **완료 조건**:
  - 게시글 CRUD 동작
  - 권한 기반 접근 제어

### P3-R4-T1: Comments API (PHP)

- **담당**: backend-specialist
- **의존**: P3-R3-T1
- **Worktree**: `worktree/phase-3-comments-api`
- **브랜치**: `phase-3-comments-api`
- **목적**: 댓글 기능 API
- **세부 작업**:
  - Comments 컨트롤러 (`src/Controllers/CommentController.php`)
  - API 엔드포인트:
    - `GET /api/posts/{id}/comments` (목록)
    - `POST /api/posts/{id}/comments` (작성, 권한 검증)
    - `DELETE /api/comments/{id}` (삭제, 작성자 또는 admin만)
  - 권한 검증 (로그인 사용자만 작성)
- **파일**:
  - `backend/src/Controllers/CommentController.php`
  - `backend/src/Models/Comment.php`
- **TDD 테스트** (test-specialist):
  - 댓글 작성/삭제 테스트
  - 권한 검증
- **완료 조건**:
  - 댓글 CRUD 동작
  - 권한 검증 작동

### P3-R5-T1: 관리자 통계 API (PHP)

- **담당**: backend-specialist
- **의존**: P3-R1-T1, P3-R2-T1, P3-R3-T1
- **Worktree**: `worktree/phase-3-stats-api`
- **브랜치**: `phase-3-stats-api`
- **목적**: 대시보드 통계 데이터 제공
- **세부 작업**:
  - Stats 컨트롤러 (`src/Controllers/StatsController.php`)
  - API 엔드포인트:
    - `GET /api/admin/stats` (총 게시글/회원/댓글 수, 차단 회원 수)
  - 권한 검증 (admin만)
  - 캐싱 고려
- **파일**:
  - `backend/src/Controllers/StatsController.php`
- **완료 조건**:
  - 통계 API 동작
  - 권한 검증 작동

### P3-R6-T1: SiteSettings CRUD API (PHP)

- **담당**: backend-specialist
- **의존**: P1-R1-T1, P2-R3-T1
- **Worktree**: `worktree/phase-3-settings-api`
- **브랜치**: `phase-3-settings-api`
- **목적**: 사이트 설정 API (로고, 컬러, GTM 코드)
- **세부 작업**:
  - SiteSettings 컨트롤러 (`src/Controllers/SiteSettingsController.php`)
  - API 엔드포인트:
    - `GET /api/site-settings` (조회)
    - `PATCH /api/site-settings` (수정)
  - 로고 업로드 연동 (media_assets 사용)
  - 권한 검증 (admin만)
  - 캐싱 (메모리에 로드)
- **파일**:
  - `backend/src/Controllers/SiteSettingsController.php`
  - `backend/src/Models/SiteSettings.php`
- **완료 조건**:
  - 설정 조회/수정 동작
  - 로고 업로드 연동

### P3-S3-T1: 관리자 대시보드 화면 (S03)

- **담당**: frontend-specialist
- **의존**: P3-R5-T1, P1-S0-T1
- **Worktree**: `worktree/phase-3-admin-dashboard`
- **브랜치**: `phase-3-admin-dashboard`
- **목적**: 관리자 홈 대시보드 UI
- **세부 작업**:
  - `/admin` 페이지 (`app/admin/page.tsx`)
  - StatsCards 컴포넌트 (4개):
    - 게시글 수
    - 회원 수
    - 댓글 수
    - 차단 회원 수
  - RecentPostsTable 컴포넌트:
    - 최신 10개 게시글
    - 제목, 작성자, 게시판, 댓글 수, 날짜
  - QuickLinks 컴포넌트:
    - 새 페이지 생성 버튼
    - 게시판 관리 링크
    - 회원 조회 링크
  - Tailwind CSS 스타일링
- **파일**:
  - `admin/app/admin/page.tsx`
  - `admin/components/dashboard/StatsCards.tsx`
  - `admin/components/dashboard/RecentPostsTable.tsx`
  - `admin/components/dashboard/QuickLinks.tsx`
- **완료 조건**:
  - 대시보드 렌더링
  - 통계 데이터 표시
  - 최근 게시글 목록

### P3-S7-T1: 회원 관리 화면 (S07)

- **담당**: frontend-specialist
- **의존**: P3-R1-T1, P1-S0-T2
- **Worktree**: `worktree/phase-3-member-management`
- **브랜치**: `phase-3-member-management`
- **목적**: 회원 관리 UI
- **세부 작업**:
  - `/admin/members` 페이지 (`app/admin/members/page.tsx`)
  - MemberSearchFilter 컴포넌트:
    - 검색어 입력 (email, name)
    - 상태 필터 (active, blocked)
    - 정렬 (email, created_at)
  - MemberTable 컴포넌트:
    - 이메일, 이름, 소셜뱃지 (Google/Kakao/Naver), 역할, 상태
    - 역할 드롭다운 (admin/user) - 즉시 API 호출
    - 상태 드롭다운 (active/blocked) - 즉시 API 호출
    - 변경 전 확인 모달
  - MemberDetailModal 컴포넌트
  - Tailwind CSS 스타일링
- **파일**:
  - `admin/app/admin/members/page.tsx`
  - `admin/components/members/MemberSearchFilter.tsx`
  - `admin/components/members/MemberTable.tsx`
  - `admin/components/members/MemberDetailModal.tsx`
- **완료 조건**:
  - 회원 목록 렌더링
  - 검색/필터 동작
  - 역할/상태 변경 동작

### P3-S8-T1: 게시판 관리 화면 (S08)

- **담당**: frontend-specialist
- **의존**: P3-R2-T1, P3-R3-T1, P1-S0-T2
- **Worktree**: `worktree/phase-3-board-management`
- **브랜치**: `phase-3-board-management`
- **목적**: 게시판 관리 UI
- **세부 작업**:
  - `/admin/boards` 페이지 (`app/admin/boards/page.tsx`)
  - BoardListTable 컴포넌트:
    - 게시판명, 게시글 수, 읽기 권한, 쓰기 권한, 작업
    - 수정 버튼 (모달)
    - 삭제 버튼 (확인 모달)
    - 게시글 목록 보기 버튼
  - BoardFormModal 컴포넌트:
    - 게시판명 입력
    - 타입 선택 (general/gallery)
    - 읽기 권한 선택 (admin_only/user/public)
    - 쓰기 권한 선택 (admin_only/user)
  - `/admin/boards/{id}/posts` 서브페이지:
    - 게시글 목록 (PostTable)
    - 검색/필터
  - Tailwind CSS 스타일링
- **파일**:
  - `admin/app/admin/boards/page.tsx`
  - `admin/app/admin/boards/[id]/posts/page.tsx`
  - `admin/components/boards/BoardListTable.tsx`
  - `admin/components/boards/BoardFormModal.tsx`
  - `admin/components/boards/PostTable.tsx`
- **완료 조건**:
  - 게시판 목록 렌더링
  - 게시판 생성/수정/삭제 동작
  - 게시글 목록 표시

### P3-S9-T1: 공개 게시판 PHP 페이지 (S09)

- **담당**: backend-specialist
- **의존**: P3-R3-T1, P3-R4-T1
- **Worktree**: `worktree/phase-3-public-board`
- **브랜치**: `phase-3-public-board`
- **목적**: 공개 게시판 페이지 렌더링
- **세부 작업**:
  - `/public/boards/{board_id}.php` 페이지
  - 권한 기반 렌더링 (read_permission 체크)
  - PostListTable:
    - 제목, 작성자, 날짜, 댓글 수
    - 클릭 시 상세 모달
  - PostDetailModal:
    - 게시글 상세 내용
    - 댓글 목록 및 작성
    - 권한 기반 댓글 쓰기 (write_permission 체크)
  - CommentList + CommentForm
  - 로그인 유도 (비로그인 시)
  - Tailwind CSS 스타일링
- **파일**:
  - `public/boards/{board_id}.php`
  - `public/views/post-detail.php`
  - `public/views/comment-section.php`
- **완료 조건**:
  - 게시판 페이지 렌더링
  - 권한 기반 표시
  - 댓글 작성 동작

### P3-S3-V: 관리자 대시보드 연결점 검증

- **담당**: frontend-specialist
- **의존**: P3-S3-T1
- **Worktree**: `worktree/phase-3-dashboard-verification`
- **브랜치**: `phase-3-dashboard-verification`
- **목적**: 대시보드 API 연결 검증
- **세부 작업**:
  - 통계 API 연결 테스트
  - 최근 게시글 API 연결 테스트
- **파일**:
  - `admin/tests/dashboard/dashboard.spec.ts`
- **완료 조건**:
  - API 연결 확인
  - 데이터 표시 확인

### P3-S7-V: 회원 관리 연결점 검증

- **담당**: frontend-specialist
- **의존**: P3-S7-T1
- **Worktree**: `worktree/phase-3-member-verification`
- **브랜치**: `phase-3-member-verification`
- **목적**: 회원 관리 API 연결 검증
- **세부 작업**:
  - 회원 목록 조회 API 연결 테스트
  - 역할/상태 변경 즉시 반영 테스트
- **파일**:
  - `admin/tests/members/member-list.spec.ts`
- **완료 조건**:
  - API 연결 확인
  - UI 상태 동기화 확인

### P3-S8-V: 게시판 관리 연결점 검증

- **담당**: frontend-specialist
- **의존**: P3-S8-T1
- **Worktree**: `worktree/phase-3-board-verification`
- **브랜치**: `phase-3-board-verification`
- **목적**: 게시판 관리 API 연결 검증
- **세부 작업**:
  - 게시판 생성 후 공개 페이지 반영 테스트
  - 게시판 권한 설정 테스트
- **파일**:
  - `admin/tests/boards/board-list.spec.ts`
- **완료 조건**:
  - API 연결 확인
  - 공개 페이지 반영 확인

### P3-S9-V: 공개 게시판 연결점 검증

- **담당**: backend-specialist
- **의존**: P3-S9-T1
- **Worktree**: `worktree/phase-3-public-board-verification`
- **브랜치**: `phase-3-public-board-verification`
- **목적**: 공개 게시판 렌더링 검증
- **세부 작업**:
  - 권한 없는 사용자 차단 테스트
  - 댓글 작성 권한 검증 테스트
- **파일**:
  - `backend/tests/PublicBoardTest.php`
- **완료 조건**:
  - 권한 기반 렌더링 확인
  - 댓글 권한 검증 확인

---

## Phase 4: 시서스 관리 + 통합 최적화 (4개 태스크)

사이트 설정 UI, 2026 UI 트렌드 CSS 완성, 배포 가이드 문서화.

### P4-S6-T1: 시서스 관리 화면 (S06)

- **담당**: frontend-specialist
- **의존**: P3-R6-T1, P2-R3-T1, P1-S0-T2
- **Worktree**: `worktree/phase-4-settings-screen`
- **브랜치**: `phase-4-settings-screen`
- **목적**: 사이트 설정 관리 UI
- **세부 작업**:
  - `/admin/settings` 페이지 (`app/admin/settings/page.tsx`)
  - LogoUploader 컴포넌트:
    - 드래그앤드롭 또는 클릭 업로드
    - 5MB 제한
    - 미리보기
  - ColorTokenPicker 컴포넌트:
    - 주색(primary) 선택
    - 보조색(secondary) 선택
    - 배경색(background) 선택
    - 실시간 미리보기
    - 헥스 입력 또는 컬러 픽커
  - GtmCodeInput 컴포넌트:
    - GTM Container ID 또는 전체 스크립트
  - OAuthSettings 컴포넌트:
    - Google API 키 입력
    - Kakao API 키 입력
    - Naver API 키 입력
    - 저장 버튼
  - 자동 저장 (debounce)
  - Tailwind CSS 스타일링
- **파일**:
  - `admin/app/admin/settings/page.tsx`
  - `admin/components/settings/LogoUploader.tsx`
  - `admin/components/settings/ColorTokenPicker.tsx`
  - `admin/components/settings/GtmCodeInput.tsx`
  - `admin/components/settings/OAuthSettings.tsx`
- **완료 조건**:
  - 설정 화면 렌더링
  - 로고 업로드 동작
  - 컬러 선택 동작
  - 설정 저장 동작

### P4-S6-V: 시서스 관리 연결점 검증

- **담당**: frontend-specialist
- **의존**: P4-S6-T1
- **Worktree**: `worktree/phase-4-settings-verification`
- **브랜치**: `phase-4-settings-verification`
- **목적**: 설정 변경이 공개 페이지에 즉시 반영되는지 검증
- **세부 작업**:
  - 컬러 변경 후 공개 페이지 즉시 반영 테스트
  - 로고 변경 후 공개 페이지 반영 테스트
- **파일**:
  - `admin/tests/settings/site-settings.spec.ts`
- **완료 조건**:
  - 컬러 변경 반영 확인
  - 로고 변경 반영 확인

### P4-T1: 2026 UI 트렌드 통합 CSS

- **담당**: frontend-specialist
- **의존**: P2-S1-T1
- **Worktree**: `worktree/phase-4-ui-trends-css`
- **브랜치**: `phase-4-ui-trends-css`
- **목적**: 2026 트렌드 UI 스타일 완성
- **세부 작업**:
  - Bento Grid CSS:
    - CSS Grid 레이아웃
    - 다양한 크기 조합
    - 반응형 breakpoint
  - Glassmorphism CSS:
    - `backdrop-filter: blur(10px)`
    - `background: rgba(255, 255, 255, 0.25)`
    - 테두리 (border: 1px solid rgba(255, 255, 255, 0.18))
  - Organic Shapes CSS:
    - 부드러운 border-radius 조합
    - SVG path 또는 clip-path
  - 마이크로 모션 (animation):
    - 버튼 hover 효과
    - 상태 전환 animation
    - transition 설정
  - 다크모드 CSS 변수 세트:
    - `--dark-primary-color`
    - `--dark-secondary-color`
    - `--dark-background-color`
    - `--dark-text-color`
  - 반응형 미디어 쿼리:
    - mobile: < 768px
    - tablet: 768px - 1024px
    - desktop: > 1024px
- **파일**:
  - `public/css/trends/bento-grid.css`
  - `public/css/trends/glassmorphism.css`
  - `public/css/trends/organic-shapes.css`
  - `public/css/trends/micro-motions.css`
  - `public/css/dark-mode.css`
  - `public/css/responsive.css`
- **완료 조건**:
  - 모든 포맷 CSS 완성
  - 반응형 동작 확인
  - 다크모드 CSS 변수 적용

### P4-T2: 무한 복사/재사용 구조 문서화

- **담당**: fullstack-specialist
- **의존**: P4-S6-V
- **Worktree**: `worktree/phase-4-deployment-docs`
- **브랜치**: `phase-4-deployment-docs`
- **목적**: 새로운 독립 사이트 생성 절차 문서화
- **세부 작업**:
  - `DEPLOY.md` 문서 작성:
    - 개요
    - 전제 조건 (PHP 8.2, MySQL 8.0, Node.js)
    - 단계별 절차:
      1. DB 스키마 복사 (`001_init_schema.sql` 실행)
      2. 초기 데이터 삽입 (admin 계정 생성)
      3. PHP 프로젝트 소스 복사
      4. Next.js 관리자 프로젝트 복사
      5. 환경 변수 설정 (`.env`, `.env.local`)
      6. 의존성 설치 (composer install, npm install)
      7. 개발 서버 실행 (docker-compose up)
    - 환경 변수 체크리스트:
      - DB_HOST, DB_NAME, DB_USER, DB_PASS
      - JWT_SECRET
      - OAuth 제공자 API 키 (Google, Kakao, Naver)
      - APP_URL (프론트엔드 주소)
    - 트러블슈팅
    - FAQ
  - `ARCHITECTURE.md` 문서:
    - 프로젝트 구조
    - 레이어드 아키텍처 설명
    - API 흐름
    - 데이터베이스 관계도
- **파일**:
  - `docs/DEPLOY.md`
  - `docs/ARCHITECTURE.md`
- **완료 조건**:
  - 배포 가이드 완성
  - 환경 변수 체크리스트 작성
  - 새로운 사이트 생성 절차 명확화

---

## 의존성 그래프 및 병렬 실행 계획

```
Phase 0 (순차):
  P0-T1 → P0-T2 → P0-T3

Phase 1 (병렬 가능):
  P1-R1-T1 (완료 후)
    ├─ P1-R2-T1
    │   └─ P1-R3-T1
    └─ P1-S0-T1 (독립 병렬)

  P1-R2-T1 완료 후:
    ├─ P1-S0-T2
    │   ├─ P1-S2-T1
    │   │   └─ P1-S2-V
    └─ P1-R3-T1

Phase 2 (병렬 가능, P1과 병렬):
  P2-R1-T1 → P2-R2-T1
             ├─ P2-R3-T1 (독립)
             └─ P2-S4-T1 → P2-S4-V
             └─ P2-S5-T1 → P2-S5-V

  P2-S1-T1 → P2-S1-V

Phase 3 (병렬 가능, P2와 병렬):
  P3-R1-T1
  P3-R2-T1 → P3-R3-T1 → P3-R4-T1
  P3-R5-T1 (독립)
  P3-R6-T1

  P3-S3-T1 → P3-S3-V
  P3-S7-T1 → P3-S7-V
  P3-S8-T1 → P3-S8-V
  P3-S9-T1 → P3-S9-V

Phase 4 (P3 완료 후):
  P4-S6-T1 → P4-S6-V
  P4-T1 (독립, P2 완료 후)
  P4-T2 (마지막, P4-S6-V 완료 후)
```

---

## Phase별 예상 완료 기준

### Phase 0 (1주) ✅ 완료
- [x] PHP 프로젝트 기초 구성 완료
- [x] Next.js 관리자 앱 기초 구성 완료
- [x] Docker Compose 개발 환경 정상 동작

### Phase 1 (2주) ✅ 완료
- [x] DB 스키마 8개 테이블 생성
- [x] JWT 인증 API 완성
- [x] OAuth 3개 제공자 통합 완료
- [x] AdminNav + 공통 타입/스토어 완성
- [x] 로그인 화면 완성 및 백엔드 연동 검증

### Phase 2 (2주) ✅ 완료
- [x] Pages CRUD API 완성
- [x] PageSections CRUD + Reorder API 완성
- [x] MediaAssets API 완성
- [x] 페이지 관리 UI 완성
- [x] 컨테이너 편집기 완성
- [x] 공개 홈페이지 렌더러 완성 (5가지 포맷)
- [x] 모든 API 연동 검증

### Phase 3 (2주) ✅ 완료
- [x] Users, Boards, Posts, Comments API 완성
- [x] 관리자 대시보드 완성
- [x] 회원 관리 화면 완성
- [x] 게시판 관리 화면 완성
- [x] 공개 게시판 페이지 완성
- [x] 모든 화면 API 연동 검증

### Phase 4 (1주) ✅ 완료
- [x] 사이트 설정 관리 화면 완성 (OAuth 포함)
- [x] 2026 UI 트렌드 CSS 완성
- [x] 배포 가이드 및 아키텍처 문서 작성
- [x] 최종 통합 테스트 및 버그 수정 (snake_case→camelCase, nginx, docker)

---

## 총 소요 기간

| Phase | 기간 | 누적 |
|-------|------|------|
| P0 | 1주 | 1주 |
| P1 | 2주 | 3주 |
| P2 (P1과 병렬) | 2주 | 5주 |
| P3 (P2와 병렬) | 2주 | 7주 |
| P4 | 1주 | 8주 |

**예상 총 소요 기간**: 8주

---

## 담당자 배치 시뮬레이션

- **backend-specialist**: P0-T1 → P1-R1-T1 → P1-R2-T1 → P1-R3-T1 → P2-R1-T1 (병렬) → P2-R2-T1 → P2-R3-T1 → P2-S1-T1 → P3-R1-T1 (병렬) → ... → P4-T2
- **frontend-specialist**: P0-T2 → P1-S0-T1 → P1-S0-T2 → P1-S2-T1 → P1-S2-V (병렬) → P2-S4-T1 (병렬) → P2-S5-T1 → P3-S3-T1 (병렬) → ... → P4-S6-T1 → P4-T1 (병렬)
- **fullstack-specialist**: P0-T3 → P4-T2
- **test-specialist**: 모든 Phase에서 TDD 테스트 코드 작성 (병렬)

---

## 참고 문서

- [01-prd.md](./01-prd.md) — 제품 요구사항 정의서
- [02-user-stories.md](./02-user-stories.md) — 사용자 스토리
- [03-feature-spec.md](./03-feature-spec.md) — 기능 명세서
- [04-db-schema.md](./04-db-schema.md) — 데이터베이스 스키마
- [05-api-spec.md](./05-api-spec.md) — API 명세서
- [06-screens.md](./06-screens.md) — 화면 목록 및 매핑
- [07-coding-convention.md](./07-coding-convention.md) — 코딩 컨벤션

---

## 주요 규칙

### Worktree 및 브랜치 관리
- Phase 1+ 모든 태스크는 **worktree** 및 **브랜치**를 사용
- 형식: `worktree/phase-{N}-{feature}` → 브랜치 `phase-{N}-{feature}`
- **specialist는 태스크를 구현하고, Phase 병합은 orchestrator가 수행**

### TDD 규칙
- 모든 API 태스크에는 최소 50% 이상의 단위 테스트 작성
- 테스트는 test-specialist가 담당
- 성공/실패/예외 케이스 모두 포함

### 커밋 규칙
- 태스크 완료 시: `[P{N}-{ID}] 태스크 완료: 설명`
- 예: `[P1-R2-T1] 태스크 완료: JWT 인증 API 구현`

### 완료 조건
- 모든 API는 REST 스펙 준수
- 모든 UI는 반응형 디자인 포함
- 모든 기능은 에러 처리 포함
- 모든 태스크는 연결점 검증(V) 완료
