# ARCHITECTURE.md

시스템 아키텍처 — Homepage Builder

## 전체 구조

```
┌─────────────────────────────────────────────────────────────┐
│                        클라이언트                            │
│  ┌─────────────────┐        ┌──────────────────────────┐   │
│  │  관리자 브라우저  │        │    방문자 브라우저         │   │
│  │  (Next.js SPA)  │        │  (Server-Side Rendered)  │   │
│  └────────┬────────┘        └──────────┬───────────────┘   │
└───────────┼─────────────────────────────┼───────────────────┘
            │ REST API (JSON)             │ HTTP (HTML)
            ▼                             ▼
┌───────────────────────────────────────────────────────────┐
│                      Nginx (Port 80)                       │
│  /api/* → index.php        /* → render.php                │
└────────────────────┬──────────────────┬────────────────────┘
                     │                  │
          ┌──────────▼──────┐  ┌───────▼────────┐
          │  PHP REST API   │  │  PHP Renderer  │
          │  (index.php)    │  │  (render.php)  │
          └──────────┬──────┘  └───────┬────────┘
                     │                  │
                     └────────┬─────────┘
                              │
                    ┌─────────▼─────────┐
                    │   MySQL 8.0        │
                    │  (homepage_db)     │
                    └───────────────────┘
```

## 백엔드 레이어

```
public/index.php
    └── Router (src/Router.php)
            └── Controller (src/Controllers/*.php)
                    ├── Middleware (src/Middleware/AuthMiddleware.php)
                    ├── Model (src/Models/*.php)
                    │       └── PDO (config/database.php)
                    └── Utils
                            ├── ResponseHelper.php  (JSON 응답)
                            ├── JwtHandler.php      (JWT 발급/검증)
                            ├── PasswordHash.php    (bcrypt)
                            └── FileUploadHandler.php
```

### 요청 흐름

```
HTTP 요청
  → Nginx
    → index.php (autoload, dotenv, error handler)
      → Router::dispatch()
        → 패턴 매칭 (GET /api/pages/{id})
          → AuthMiddleware::require() / requireAdmin()
            → Controller::action()
              → Model::query() (PDO)
                → ResponseHelper::success() / error()
                  → JSON 응답
```

## 프론트엔드 레이어

```
app/ (Next.js App Router)
├── layout.tsx              ← 루트 레이아웃
├── login/page.tsx          ← 로그인
└── admin/
    ├── page.tsx            ← 대시보드
    ├── pages/
    │   ├── page.tsx        ← 페이지 목록
    │   └── [id]/edit/page.tsx  ← 섹션 에디터
    ├── members/page.tsx    ← 회원 관리
    ├── boards/page.tsx     ← 게시판 관리
    └── settings/page.tsx   ← 사이트 설정

components/
├── AdminLayout.tsx         ← 인증 가드 + 레이아웃
├── AdminNav.tsx            ← 사이드바 네비게이션
├── editor/                 ← 페이지 에디터 컴포넌트
├── settings/               ← 사이트 설정 컴포넌트
└── ui/                     ← shadcn/ui 기본 컴포넌트

stores/
├── authStore.ts            ← JWT 토큰, 사용자 정보 (persist)
└── appStore.ts             ← 토스트 알림, 로딩 상태

lib/
└── api.ts                  ← fetch 래퍼 (자동 JWT 주입)
```

## 데이터베이스 스키마

```sql
users           -- 사용자 (id, email, name, role, status, oauth_provider)
pages           -- 페이지 (id, title, slug, is_published)
page_sections   -- 섹션 (id, page_id, type, format, content JSON, order)
boards          -- 게시판 (id, name, type, read_permission, write_permission)
posts           -- 게시글 (id, board_id, author_id, title, content)
comments        -- 댓글 (id, post_id, author_id, content)
site_settings   -- 사이트 설정 (id=1, logo_url, colors, gtm_code)
media_assets    -- 업로드 파일 (id, uploader_id, url, mime_type, size)
```

관계:
- `page_sections.page_id` → `pages.id` (CASCADE DELETE)
- `posts.board_id` → `boards.id` (CASCADE DELETE)
- `posts.author_id` → `users.id`
- `comments.post_id` → `posts.id` (CASCADE DELETE)
- `comments.author_id` → `users.id`

## API 설계 원칙

- 모든 응답: `{ success: true, data: T }` 또는 `{ success: false, error: string, code: number }`
- 페이지네이션: `{ success: true, data: { items: T[], pagination: { total, page, limit, totalPages } } }`
- 인증: `Authorization: Bearer <JWT>` 헤더
- JWT 만료: 24시간 (기본값)

## 공개 렌더러

```
방문자 → Nginx → render.php
              ↓
        Page::findBySlug($slug)
              ↓ (is_published=true인 경우만)
        PageSection::findByPage($id)
              ↓
        views/layout.php
              ↓
        views/sections/{type}.php  (header/container/banner/footer)
              ↓
        HTML 응답
```

섹션 타입별 PHP 템플릿이 `format` 값에 따라 다른 CSS 클래스를 적용:
- `bento` → `.bento-grid`, `.bento-card`
- `glassmorphism` → `.glass-card`, `.glass-bg`
- `organic` → `.organic-section`, `.organic-card`
- `text` → 기본 마크업
- `gallery` → 이미지 그리드

## 2026 UI 트렌드 CSS 구조

```
backend/public/css/
├── responsive.css          ← 컨테이너, 그리드, 네비게이션 반응형
├── dark-mode.css           ← CSS 변수 + 다크 테마
└── trends/
    ├── bento-grid.css      ← Bento Grid 레이아웃
    ├── glassmorphism.css   ← 유리 효과
    ├── organic-shapes.css  ← Blob, 비정형 경계
    └── micro-motions.css   ← 애니메이션, 호버 효과

backend/public/js/
└── darkmode.js             ← 테마 토글, reveal 애니메이션, 모바일 메뉴
```

## 보안 고려사항

| 항목 | 구현 방식 |
|------|-----------|
| 비밀번호 | bcrypt (cost=12) |
| 인증 | JWT (HS256, 24h) |
| SQL 인젝션 | PDO prepared statements |
| XSS | `htmlspecialchars()` (공개 렌더러) |
| CORS | Nginx + PHP 헤더, origin 화이트리스트 |
| 파일 업로드 | MIME 검사, 5MB 제한, 확장자 허용 목록 |
| 권한 검사 | Controller 진입 시 AuthMiddleware 실행 |
