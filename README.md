# 홈페이지 빌더

> 관리자 대시보드에서 코드 없이 페이지를 편집하고, 소스 코드 + DB를 복사하면 독립 사이트가 되는 **멀티 사이트 빌더 플랫폼**

[![CI](https://github.com/kimyookwon/Hompage-builder/actions/workflows/ci.yml/badge.svg)](https://github.com/kimyookwon/Hompage-builder/actions/workflows/ci.yml)

## 목차

- [주요 기능](#주요-기능)
- [기술 스택](#기술-스택)
- [시작하기](#시작하기)
- [프로젝트 구조](#프로젝트-구조)
- [API 엔드포인트 요약](#api-엔드포인트-요약)
- [환경 변수](#환경-변수)
- [테스트](#테스트)
- [배포](#배포)
- [설계 문서](#설계-문서)
- [라이선스](#라이선스)

---

## 주요 기능

- **관리자 대시보드** — 통계, 차트, 실시간 모니터링
- **페이지 빌더** — 섹션 기반 드래그 편집 (헤더, 배너, 컨테이너, 푸터)
- **게시판 시스템** — CRUD 작업, 댓글, 답글, 좋아요, 북마크, 태그, RSS 피드
- **회원 관리** — 역할 기반 권한, OAuth (Google, Kakao, Naver), 2FA (TOTP)
- **미디어 관리** — 파일 업로드/삭제, 이미지 최적화
- **실시간 알림** — 댓글/답글 작성 시 이메일 + 앱 내 알림 (PHPMailer SMTP)
- **검색 기능** — MySQL FULLTEXT 검색 + 자동완성
- **공지사항 & 신고 시스템** — 배너형 공지, 댓글 신고 및 관리
- **관리자 활동 로그** — 모든 관리 작업 기록
- **시스템 모니터링** — 헬스체크, 디스크/메모리/DB 상태 확인, Sentry 통합
- **공개 페이지 렌더링** — PHP 템플릿 기반 SEO 최적화
- **사이트 설정** — 로고, 컬러 토큰, GTM 코드 관리
- **다크 모드** — 시스템 설정 연동, 플리커 방지
- **UI/UX 트렌드** — 벤토 그리드, 글라스모피즘, 오가닉 쉐이프, 마이크로모션

---

## 기술 스택

| 영역 | 기술 |
|------|------|
| **백엔드** | PHP 8.2 (Vanilla + Composer), MySQL 8.0, JWT 인증 |
| **프론트엔드** | Next.js 15, React 19, TypeScript, Tailwind CSS |
| **UI 라이브러리** | shadcn/ui |
| **상태 관리** | Zustand |
| **폼 관리** | React Hook Form + Zod 검증 |
| **인프라** | Docker Compose, Nginx, PHP-FPM |
| **CI/CD** | GitHub Actions |
| **모니터링** | Sentry |

---

## 시작하기

### 사전 요구사항

- Docker 24.x 이상 + Docker Compose 2.x 이상
- Node.js 20.x 이상 (어드민 개발 시)
- Git

### 1. 저장소 클론

```bash
git clone https://github.com/kimyookwon/Hompage-builder.git
cd Hompage-builder
```

### 2. 환경 변수 설정

```bash
# 백엔드 환경 변수
cp backend/.env.example backend/.env

# 프론트엔드 환경 변수
cp admin/.env.local.example admin/.env.local
```

**backend/.env** 필수 수정 항목:
- `DB_PASSWORD` — MySQL 비밀번호 변경
- `JWT_SECRET` — 강력한 랜덤 값으로 변경 (또는 `openssl rand -base64 48` 사용)
- `MAIL_*` — 이메일 알림 사용 시 SMTP 설정 (선택사항)
- `GOOGLE_CLIENT_ID`, `KAKAO_CLIENT_ID`, `NAVER_CLIENT_ID` — OAuth 사용 시 설정

### 3. Docker 실행

```bash
docker compose up -d --build
```

컨테이너 상태 확인:

```bash
docker compose ps
```

예상 출력:
```
CONTAINER ID   IMAGE                          STATUS
xxx            homepage_php                   Up (healthy)
xxx            nginx:1.25-alpine              Up
xxx            mysql:8.0                      Up (healthy)
```

### 4. DB 마이그레이션

```bash
docker compose exec php php /var/www/backend/database/migrate.php
```

성공 메시지: `✓ All migrations completed successfully`

### 5. 어드민 앱 개발 서버

새 터미널에서:

```bash
cd admin
npm install
npm run dev
```

어드민 앱: http://localhost:3000

### 초기 계정

| 항목 | 값 |
|------|------|
| 이메일 | `admin@homepage.local` |
| 비밀번호 | `Admin1234!` |

> **경고**: 프로덕션 배포 전 반드시 비밀번호 변경

### 서비스 주소

| 서비스 | URL | 용도 |
|--------|-----|------|
| API | http://localhost:8000/api | REST API 엔드포인트 |
| Swagger | http://localhost:8000/api/docs | API 대화형 문서 (준비 중) |
| 어드민 | http://localhost:3000 | 관리자 대시보드 |
| 공개 페이지 | http://localhost:3000/pages/[slug] | 렌더링된 페이지 |
| 헬스체크 | http://localhost:8000/api/health | 시스템 상태 |

---

## 프로젝트 구조

```
Hompage-builder/
├── backend/                    # PHP 백엔드
│   ├── public/
│   │   ├── index.php          # API 진입점
│   │   ├── render.php         # 공개 페이지 렌더러
│   │   └── uploads/           # 사용자 업로드 파일
│   ├── src/
│   │   ├── Controllers/       # 요청 처리 (45+ 엔드포인트)
│   │   ├── Services/          # 비즈니스 로직
│   │   ├── Models/            # 데이터 모델 + ORM
│   │   ├── Middleware/        # JWT, CORS, 인증
│   │   ├── Utils/             # 헬퍼 함수
│   │   └── Config/            # DB 설정
│   ├── routes/
│   │   └── api-routes.php     # 라우트 정의
│   ├── database/
│   │   └── migrations/        # 16개 마이그레이션 파일
│   └── tests/                 # PHPUnit 테스트 (22/22 통과)
│
├── admin/                      # Next.js 어드민 + 공개 페이지
│   ├── app/
│   │   ├── (auth)/           # 로그인/회원가입 페이지
│   │   ├── (admin)/          # 어드민 페이지 (레이아웃 포함)
│   │   ├── pages/            # 공개 페이지 렌더링
│   │   └── api/              # 내부 API 라우트
│   ├── components/            # 재사용 컴포넌트 (shadcn/ui)
│   ├── stores/                # Zustand 상태 관리
│   ├── lib/
│   │   └── api.ts            # API 클라이언트
│   ├── hooks/                 # Custom React Hooks
│   ├── types/                 # TypeScript 타입
│   └── tests/                 # Playwright E2E (26/26 통과)
│
├── docs/
│   ├── planning/              # 설계 문서
│   │   ├── 01-prd.md         # 제품 요구사항
│   │   ├── 02-user-stories.md
│   │   ├── 03-feature-spec.md
│   │   ├── 04-db-schema.md
│   │   ├── 05-api-spec.md    # API 명세
│   │   └── 06-screens.md     # UI 화면 명세
│   ├── deployment.md          # 배포 가이드
│   └── openapi.yaml           # OpenAPI 3.0 명세
│
├── nginx.conf                 # Nginx 설정
├── docker-compose.yml         # 개발 환경
├── docker-compose.prod.yml    # 프로덕션 환경
├── Dockerfile                 # PHP 이미지
└── README.md                  # 이 파일
```

---

## API 엔드포인트 요약

전체 명세: [`docs/openapi.yaml`](docs/openapi.yaml) (OpenAPI 3.0)

### 그룹별 엔드포인트

| 그룹 | 메서드 | 엔드포인트 | 설명 |
|------|--------|----------|------|
| **인증** | POST | `/api/auth/register` | 회원가입 |
| | POST | `/api/auth/login` | 로그인 |
| | POST | `/api/auth/logout` | 로그아웃 |
| | GET | `/api/auth/me` | 현재 사용자 정보 |
| | POST | `/api/auth/oauth/{provider}/callback` | OAuth 콜백 |
| | POST | `/api/auth/2fa/setup` | 2FA 설정 (TOTP) |
| **페이지** | GET | `/api/pages` | 페이지 목록 |
| | POST | `/api/pages` | 페이지 생성 |
| | GET | `/api/pages/{id}` | 페이지 상세 |
| | PATCH | `/api/pages/{id}` | 페이지 수정 |
| | DELETE | `/api/pages/{id}` | 페이지 삭제 |
| | PATCH | `/api/pages/{id}/publish` | 공개/비공개 전환 |
| | GET | `/public/pages/{slug}` | 공개 페이지 렌더링 |
| **섹션** | GET | `/api/pages/{id}/sections` | 섹션 목록 |
| | POST | `/api/pages/{id}/sections` | 섹션 생성 |
| | PATCH | `/api/sections/{id}` | 섹션 수정 |
| | PATCH | `/api/pages/{id}/sections/reorder` | 섹션 순서 변경 |
| **게시판** | GET | `/api/boards` | 게시판 목록 |
| | POST | `/api/boards` | 게시판 생성 |
| | PATCH | `/api/boards/{id}` | 게시판 수정 |
| **게시글** | GET | `/api/boards/{id}/posts` | 게시글 목록 |
| | POST | `/api/boards/{id}/posts` | 게시글 생성 |
| | GET | `/api/posts/{id}` | 게시글 상세 |
| | PATCH | `/api/posts/{id}` | 게시글 수정 |
| | DELETE | `/api/posts/{id}` | 게시글 삭제 |
| | POST | `/api/posts/{id}/like` | 좋아요 토글 |
| | POST | `/api/posts/{id}/bookmark` | 북마크 토글 |
| **댓글** | GET | `/api/posts/{id}/comments` | 댓글 목록 |
| | POST | `/api/posts/{id}/comments` | 댓글 작성 |
| | PATCH | `/api/comments/{id}` | 댓글 수정 |
| | DELETE | `/api/comments/{id}` | 댓글 삭제 |
| **회원** | GET | `/api/users` | 회원 목록 (관리자) |
| | GET | `/api/users/{id}` | 회원 상세 (관리자) |
| | PATCH | `/api/me` | 프로필 수정 |
| | PATCH | `/api/me/password` | 비밀번호 변경 |
| **알림** | GET | `/api/notifications` | 알림 목록 |
| | PATCH | `/api/notifications/{id}/read` | 알림 읽음 표시 |
| **미디어** | GET | `/api/media` | 미디어 목록 |
| | POST | `/api/media/upload` | 파일 업로드 |
| | DELETE | `/api/media/{id}` | 파일 삭제 |
| **검색** | GET | `/api/search` | 게시글 검색 |
| | GET | `/api/search/suggest` | 자동완성 제안 |
| **관리자** | GET | `/api/admin/stats` | 대시보드 통계 |
| | GET | `/api/admin/logs` | 활동 로그 |
| | GET | `/api/admin/reports` | 신고 관리 |
| **시스템** | GET | `/api/health` | 헬스체크 |

**총 엔드포인트**: 60개 이상

---

## 환경 변수

### backend/.env

```env
# 앱 설정
APP_ENV=development              # development / production
APP_DEBUG=true                   # false 권장 (프로덕션)
APP_URL=http://localhost:8000
APP_VERSION=1.0.0

# 데이터베이스
DB_HOST=mysql                    # Docker Compose 에서는 'mysql'
DB_PORT=3306
DB_DATABASE=homepage_builder
DB_USERNAME=homepage_user
DB_PASSWORD=변경_필수!            # 강력한 비밀번호로 변경

# JWT 인증
JWT_SECRET=변경_필수!             # openssl rand -base64 48 으로 생성
JWT_EXPIRY=86400                # 24시간

# 이메일 알림 (선택사항 — 댓글 알림 발송)
SITE_URL=http://localhost:3000
MAIL_HOST=smtp.gmail.com         # SMTP 서버
MAIL_PORT=587
MAIL_USERNAME=your-email@gmail.com
MAIL_PASSWORD=your-app-password  # Gmail 앱 비밀번호
MAIL_ENCRYPTION=tls
MAIL_FROM=your-email@gmail.com
MAIL_FROM_NAME=홈페이지 알림

# OAuth 설정 (선택사항)
GOOGLE_CLIENT_ID=your-client-id
GOOGLE_CLIENT_SECRET=your-secret
GOOGLE_REDIRECT_URI=http://localhost:8000/api/auth/oauth/google/callback

KAKAO_CLIENT_ID=your-client-id
KAKAO_CLIENT_SECRET=your-secret
KAKAO_REDIRECT_URI=http://localhost:8000/api/auth/oauth/kakao/callback

NAVER_CLIENT_ID=your-client-id
NAVER_CLIENT_SECRET=your-secret
NAVER_REDIRECT_URI=http://localhost:8000/api/auth/oauth/naver/callback

# Sentry 에러 추적 (선택사항)
SENTRY_DSN=
SENTRY_TRACES_RATE=0.1
```

### admin/.env.local

```env
# API 서버 URL (개발: localhost:8000, 프로덕션: 실제 도메인)
NEXT_PUBLIC_API_URL=http://localhost:8000/api

# 공개 사이트 URL (Open Graph 메타데이터 생성용)
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

---

## 테스트

### PHP 백엔드 테스트 (PHPUnit)

```bash
# 모든 테스트 실행
docker compose exec php sh -c "php /var/www/backend/vendor/bin/phpunit /var/www/backend/tests/ --testdox"

# 특정 테스트 파일만
docker compose exec php sh -c "php /var/www/backend/vendor/bin/phpunit /var/www/backend/tests/AuthControllerTest.php"

# 코드 커버리지 리포트
docker compose exec php sh -c "php /var/www/backend/vendor/bin/phpunit /var/www/backend/tests/ --coverage-html=coverage"
```

**결과**: 22/22 테스트 통과

### TypeScript 타입 체크

```bash
cd admin
npx tsc --noEmit
```

### Playwright E2E 테스트

```bash
cd admin

# 모든 테스트 실행
npx playwright test

# UI 모드로 실행
npx playwright test --ui

# 테스트 리포트 보기
npx playwright show-report
```

**결과**: 26/26 테스트 통과

### GitHub Actions CI

자동으로 `main` 브랜치에 푸시하면:
1. PHP 테스트 실행
2. Next.js 빌드 + TypeScript 검사
3. E2E 테스트 실행
4. 모두 통과 시 프로덕션 배포 (CD)

---

## 배포

### 자세한 배포 가이드

[docs/deployment.md](docs/deployment.md)

### 프로덕션 배포 체크리스트

- [ ] `APP_DEBUG=false`
- [ ] `JWT_SECRET` 강력한 랜덤 값으로 변경
- [ ] DB 비밀번호 변경
- [ ] 초기 어드민 비밀번호 변경
- [ ] HTTPS 적용 (Let's Encrypt)
- [ ] `ALLOWED_ORIGINS` 실제 도메인으로 제한
- [ ] `NEXT_PUBLIC_API_URL` 실제 도메인 URL로 변경
- [ ] Sentry DSN 설정 (선택사항)

### 빠른 배포 명령어

```bash
# 수동 배포 (풀 빌드)
./deploy.sh

# 빌드 없이 재시작만
./deploy.sh --skip-build

# 마이그레이션 없이 배포
./deploy.sh --skip-migrate
```

### 운영 명령어

```bash
# 컨테이너 상태 확인
docker compose -f docker-compose.prod.yml ps

# 실시간 로그 확인
docker logs homepage_php --tail 100 -f
docker logs homepage_nginx --tail 100 -f

# DB 접속
docker compose -f docker-compose.prod.yml exec mysql \
  mysql -u homepage_user -p homepage_builder

# PHP 컨테이너 쉘 접속
docker compose -f docker-compose.prod.yml exec php sh

# 마이그레이션 수동 실행
docker compose -f docker-compose.prod.yml exec php php database/migrate.php
```

### 장애 대응

```bash
# 컨테이너 재시작
docker compose -f docker-compose.prod.yml restart php

# 전체 재시작
docker compose -f docker-compose.prod.yml down && \
docker compose -f docker-compose.prod.yml up -d

# 이전 버전으로 롤백
git log --oneline -5          # 되돌릴 커밋 확인
git checkout <commit-hash>    # 코드 롤백
./deploy.sh --skip-migrate    # 재배포
```

---

## 설계 문서

| 문서 | 경로 | 내용 |
|------|------|------|
| PRD | [docs/planning/01-prd.md](docs/planning/01-prd.md) | 제품 요구사항 |
| 사용자 스토리 | [docs/planning/02-user-stories.md](docs/planning/02-user-stories.md) | 사용 사례 |
| 기능 명세 | [docs/planning/03-feature-spec.md](docs/planning/03-feature-spec.md) | 상세 기능 정의 |
| DB 스키마 | [docs/planning/04-db-schema.md](docs/planning/04-db-schema.md) | 데이터베이스 구조 |
| API 명세 | [docs/planning/05-api-spec.md](docs/planning/05-api-spec.md) | REST API 요청/응답 |
| UI 화면 | [docs/planning/06-screens.md](docs/planning/06-screens.md) | 화면 레이아웃 |
| 코딩 컨벤션 | [docs/planning/07-coding-convention.md](docs/planning/07-coding-convention.md) | 개발 규칙 |
| **OpenAPI** | [**docs/openapi.yaml**](docs/openapi.yaml) | **API 자동화 문서** |
| 배포 가이드 | [docs/deployment.md](docs/deployment.md) | 프로덕션 배포 |

---

## 주요 구현 사항

### 백엔드 (PHP)

- 단일 진입점 라우터 (`public/index.php`)
- 레이어드 아키텍처: Controller → Service → Model
- JWT 기반 인증 (24시간 유효)
- CORS 미들웨어
- 글로벌 에러 핸들링
- 데이터 검증 (Validator)
- 트랜잭션 처리 (DB 무결성)
- 이메일 알림 (PHPMailer SMTP)
- OAuth 통합 (Google, Kakao, Naver)
- 2FA (TOTP 기반)
- FULLTEXT 검색
- 페이지 캐싱
- SEO (Sitemap, Robots.txt, RSS)
- 헬스 체크 (DB, 디스크, 메모리)

### 프론트엔드 (Next.js)

- App Router 기반 페이지 라우팅
- Zustand 상태 관리 (authStore, boardStore 등)
- React Hook Form + Zod 폼 검증
- shadcn/ui 기반 재사용 컴포넌트
- Tailwind CSS 반응형 디자인
- 마크다운 에디터 (toolbar + split preview)
- 실시간 알림 (Socket.IO 준비)
- Dark mode 지원 (next-themes)
- TypeScript 전체 적용 (any 타입 금지)
- Sentry 에러 추적
- Playwright E2E 테스트

### DB (MySQL)

- utf8mb4 인코딩
- 16개 마이그레이션 파일
- 외래키 제약조건
- 인덱싱 (FULLTEXT, UNIQUE)
- 감시 트리거 (created_at, updated_at)

---

## 문제 해결

### API 연결 안 될 때

```bash
# Docker 네트워크 확인
docker compose ps

# API 헬스 체크
curl http://localhost:8000/api/health

# 마이그레이션 다시 실행
docker compose exec php php /var/www/backend/database/migrate.php
```

### DB 비밀번호 재설정

```bash
# .env 수정 후
docker compose down
docker volume rm hompage-builder_mysql_data  # 데이터 초기화 (주의!)
docker compose up -d
docker compose exec php php /var/www/backend/database/migrate.php
```

### 포트 충돌

```bash
# 기존 프로세스 확인
lsof -i :8000  # API 포트
lsof -i :3000  # 어드민 포트
lsof -i :3306  # DB 포트

# 프로세스 강제 종료
kill -9 <PID>
```

---

## 라이선스

MIT

---

## 연락처

이 프로젝트에 대한 질문이나 제안은 GitHub Issues를 통해 등록해주세요.
