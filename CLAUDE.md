# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

---

## 프로젝트 개요

**홈페이지 빌더** — 관리자 대시보드로 페이지를 코드 없이 편집하고, 소스 코드 + DB를 복사하면 독립 사이트가 되는 멀티 사이트 빌더 플랫폼.

- **백엔드**: PHP (Vanilla, Composer) — `backend/`
- **관리자 프론트엔드**: Next.js + TypeScript + Tailwind CSS — `admin/`
- **공개 페이지**: PHP 템플릿 렌더링
- **DB**: MySQL 8.0 (utf8mb4)
- **인프라**: Docker Compose (PHP-FPM + Nginx + MySQL)

---

## 개발 환경 시작

```bash
# 전체 개발 환경 실행
docker-compose up

# API 접근 확인
# http://localhost:8000/api

# 관리자 앱 개발 서버
cd admin && npm run dev
# http://localhost:3000

# DB 마이그레이션
cd backend && php database/migrate.php
```

---

## 태스크 구조 (개발 진행 단계)

전체 태스크는 `docs/planning/06-tasks.md`에 정의되어 있음.

| Phase | 내용 | 의존성 |
|-------|------|--------|
| **P0** | 프로젝트 셋업 (PHP 초기화, Next.js 초기화, Docker) | 없음 |
| **P1** | 인증 + 관리자 레이아웃 | P0 완료 후 |
| **P2** | 페이지/컨테이너/사이트 설정 UI | P1 완료 후 |
| **P3** | 게시판/회원/미디어 관리 | P2 일부 완료 후 |
| **P4** | 공개 페이지 렌더링 + OAuth | P3 완료 후 |

태스크 ID 규칙:
- `P{N}-T{X}` — 셋업 태스크 (fullstack-specialist)
- `P{N}-R{M}-T{X}` — Backend API (backend-specialist)
- `P{N}-S{M}-T{X}` — Frontend 화면 (frontend-specialist)

---

## 아키텍처

### 백엔드 레이어드 구조

```
backend/
├── public/index.php       # 단일 진입점 (라우터)
├── routes/api-routes.php  # 라우트 정의
├── controllers/           # 요청 처리 (컨트롤러)
├── services/              # 비즈니스 로직
├── models/                # 데이터 모델
├── middleware/            # JWT 인증, CORS
├── utils/                 # JwtHandler, ResponseHelper
├── config/database.php    # DB 연결 설정
└── database/migrations/   # SQL 마이그레이션 파일
```

Controller → Service → Model 레이어 순서로 의존. 서비스 간 직접 참조 금지.

### API 응답 형식 (반드시 준수)

```json
// 성공
{ "success": true, "data": { ... } }

// 실패
{ "success": false, "error": "메시지", "code": 400 }
```

`ResponseHelper::success($data)` / `ResponseHelper::error($message, $code)` 사용.

### 인증 흐름

1. `POST /api/auth/login` → JWT 발급 (유효기간 24h)
2. 클라이언트: `localStorage`에 저장, `Authorization: Bearer <token>` 헤더 전송
3. 서버: `auth-middleware.php`에서 토큰 검증 + Role 체크

### 프론트엔드 구조

```
admin/
├── app/                   # Next.js App Router (레이아웃, 페이지)
├── components/            # 재사용 컴포넌트 (shadcn/ui 기반)
├── stores/                # Zustand 상태 관리 (authStore 등)
├── lib/api.ts             # API 클라이언트 유틸리티
├── hooks/                 # Custom Hooks
└── types/                 # TypeScript 타입 정의
```

---

## 코딩 컨벤션

### 공통
- 들여쓰기: **2칸**
- 변수/함수: `camelCase` | 클래스: `PascalCase` | 상수: `UPPER_SNAKE_CASE`
- 파일명: `kebab-case` (PHP, TS 모두)
- 주석: 비즈니스 로직만, 코드가 명확하면 생략

### PHP
- `namespace Controllers;`, `namespace Services;` 등 네임스페이스 필수
- 모든 컨트롤러 메서드에 `try/catch` + `ResponseHelper` 사용
- `any` 타입에 해당하는 `mixed` 타입 사용 금지 — 명시적 타입 선언

### TypeScript/React
- `any` 타입 사용 금지
- 컴포넌트: PascalCase + `.tsx` 확장자
- 상태관리: Zustand (`stores/` 디렉토리)
- 폼: React Hook Form + Zod 조합
- 반응형 필수 (Tailwind breakpoint 활용)

---

## 설계 문서 위치

| 문서 | 경로 |
|------|------|
| PRD (제품 요구사항) | `docs/planning/01-prd.md` |
| 사용자 스토리 | `docs/planning/02-user-stories.md` |
| 기능 명세 | `docs/planning/03-feature-spec.md` |
| DB 스키마 | `docs/planning/04-db-schema.md` |
| API 명세 | `docs/planning/05-api-spec.md` |
| 화면 명세 | `docs/planning/06-screens.md` |
| 태스크 목록 | `docs/planning/06-tasks.md` |
| 코딩 컨벤션 | `docs/planning/07-coding-convention.md` |
| 도메인 리소스 | `specs/domain/resources.yaml` |
| 화면 YAML 명세 | `specs/screens/s0{N}-*.yaml` |
