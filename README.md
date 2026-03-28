# Homepage Builder

코드 없이 홈페이지를 만드는 **멀티 사이트 빌더 플랫폼**

관리자 대시보드에서 페이지를 편집하고, 소스 코드 + DB를 복사하면 독립 사이트가 됩니다.

[![CI](https://github.com/kimyookwon/Hompage-builder/actions/workflows/ci.yml/badge.svg)](https://github.com/kimyookwon/Hompage-builder/actions/workflows/ci.yml)

---

## 기술 스택

| 영역 | 기술 |
|------|------|
| 백엔드 | PHP 8.2 (Vanilla + Composer) |
| 프론트엔드 | Next.js 15 + TypeScript + Tailwind CSS |
| 데이터베이스 | MySQL 8.0 |
| 인프라 | Docker Compose (PHP-FPM + Nginx + MySQL) |
| UI | shadcn/ui + Zustand |

---

## 주요 기능

- **페이지 빌더** — 헤더/배너/컨테이너/푸터 섹션 드래그 편집
- **게시판** — 공지/일반 게시글, 댓글, 첨부파일, 좋아요
- **회원 관리** — 역할 기반 권한 (admin/user), OAuth 로그인
- **사이트 설정** — 로고, 컬러 토큰, GTM 코드, 공지 배너
- **공개 렌더러** — PHP 템플릿 기반 SEO 최적화 페이지
- **다크 모드** — 시스템 설정 연동 + 플리커 방지
- **2026 UI 트렌드** — 벤토 그리드, 글라스모피즘, 오가닉 쉐이프, 마이크로모션

---

## 빠른 시작

### 사전 요구사항

- Docker 24.x + Docker Compose 2.x
- Node.js 20.x (어드민 개발 시)

### 1. 저장소 클론

```bash
git clone https://github.com/kimyookwon/Hompage-builder.git
cd Hompage-builder
```

### 2. 환경 변수 설정

```bash
cp backend/.env.example backend/.env
# backend/.env 편집 — JWT_SECRET, DB 비밀번호 변경
```

### 3. Docker 실행

```bash
docker compose up -d --build
```

### 4. DB 마이그레이션

```bash
docker compose exec php php /var/www/backend/database/migrate.php
```

### 5. 어드민 앱 실행

```bash
cd admin
cp .env.local.example .env.local
npm install
npm run dev
# http://localhost:3000
```

### 초기 계정

| 항목 | 값 |
|------|-----|
| 이메일 | `admin@homepage.local` |
| 비밀번호 | `Admin1234!` |

> **주의**: 프로덕션 배포 전 반드시 비밀번호 변경

---

## 프로젝트 구조

```
Hompage-builder/
├── backend/                # PHP 백엔드
│   ├── public/             # 웹 루트 (index.php, render.php)
│   ├── src/                # Controllers / Models / Services / Utils
│   ├── routes/             # API 라우트 정의
│   ├── database/           # 마이그레이션 (001~016)
│   └── tests/              # PHPUnit 테스트
├── admin/                  # Next.js 어드민 + 공개 페이지
│   ├── app/                # App Router 페이지
│   ├── components/         # 재사용 컴포넌트
│   ├── stores/             # Zustand 상태 관리
│   └── tests/              # Playwright E2E 테스트
├── nginx.conf              # Nginx 설정
├── docker-compose.yml      # Docker Compose
└── docs/                   # 아키텍처 / 배포 / API 문서
```

---

## API 엔드포인트

| 그룹 | 경로 |
|------|------|
| 인증 | `POST /api/auth/login`, `POST /api/auth/register` |
| 페이지 | `GET/POST /api/pages`, `PATCH /api/pages/:id` |
| 섹션 | `GET/POST /api/pages/:id/sections` |
| 게시판 | `GET/POST /api/boards`, `GET /api/boards/:id/posts` |
| 설정 | `GET/PUT /api/site-settings` |
| 공개 | `GET /public/pages/:slug`, `GET /public/boards/:id/posts` |

전체 API 명세: [`docs/planning/05-api-spec.md`](docs/planning/05-api-spec.md)

---

## 테스트

```bash
# PHP 백엔드 테스트
docker compose exec php sh -c "php /var/www/backend/vendor/bin/phpunit /var/www/backend/tests/ --testdox"

# Next.js TypeScript 검사
cd admin && npx tsc --noEmit

# Playwright E2E 테스트
cd admin && npx playwright test
```

| 테스트 | 결과 |
|--------|------|
| PHP (PHPUnit) | 22/22 통과 |
| Playwright E2E | 26/26 통과 |

---

## 배포

자세한 내용: [`docs/DEPLOY.md`](docs/DEPLOY.md)

### 프로덕션 체크리스트

- [ ] `APP_DEBUG=false`
- [ ] `JWT_SECRET` 강력한 랜덤 값
- [ ] DB 비밀번호 변경
- [ ] 초기 어드민 비밀번호 변경
- [ ] HTTPS 적용 (Let's Encrypt)
- [ ] `ALLOWED_ORIGINS` 실제 도메인으로 제한

---

## 문서

| 문서 | 경로 |
|------|------|
| 아키텍처 | [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) |
| 배포 가이드 | [`docs/DEPLOY.md`](docs/DEPLOY.md) |
| 설치 가이드 | [`docs/SETUP.md`](docs/SETUP.md) |
| API 명세 | [`docs/planning/05-api-spec.md`](docs/planning/05-api-spec.md) |
| DB 스키마 | [`docs/planning/04-db-schema.md`](docs/planning/04-db-schema.md) |
