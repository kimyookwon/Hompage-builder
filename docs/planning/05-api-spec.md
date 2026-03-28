# 05-api-spec.md — API 명세서

**작성일**: 2026-03-27
**버전**: v1.0
**프로젝트명**: 홈페이지 빌더 (Homepage Builder)

**Base URL**: `http://localhost:8000/api` (개발)
**프로토콜**: REST API
**데이터 포맷**: JSON
**인증**: JWT (Bearer Token)

---

## 1. 인증 (Authentication)

### 1.1 인증 방식

#### JWT (JSON Web Token)
- **타입**: Bearer Token
- **유효 기간**: 24시간
- **저장 위치**: localStorage (프론트엔드)
- **포맷**: `Authorization: Bearer <token>`

#### 토큰 발급 조건
- 자체 회원가입 시
- 자체 로그인 시
- 소셜 로그인 성공 시

#### 토큰 갱신 (Refresh Token)
- 구현: Phase 2 (현재는 단순 JWT만 사용)

---

### 1.2 HTTP 헤더

**모든 인증 필요 API**:
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Content-Type: application/json
```

---

## 2. 공통 응답 형식

### 2.1 성공 응답 (2xx)

**구조**:
```json
{
  "success": true,
  "data": { /* 실제 데이터 */ },
  "message": "작업 완료"
}
```

**예시 (회원 조회)**:
```json
{
  "success": true,
  "data": {
    "id": 1,
    "email": "user@example.com",
    "name": "John",
    "role": "user"
  },
  "message": "사용자 정보 조회 완료"
}
```

### 2.2 페이지네이션 응답

**구조**:
```json
{
  "success": true,
  "data": [
    { /* 항목 1 */ },
    { /* 항목 2 */ }
  ],
  "pagination": {
    "current_page": 1,
    "total_pages": 5,
    "total_items": 100,
    "limit": 20
  },
  "message": "데이터 조회 완료"
}
```

### 2.3 에러 응답 (4xx, 5xx)

**구조**:
```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "에러 설명",
    "details": { /* 추가 정보 */ }
  }
}
```

**예시 (이메일 중복)**:
```json
{
  "success": false,
  "error": {
    "code": "DUPLICATE_EMAIL",
    "message": "이미 가입된 이메일입니다.",
    "details": {
      "field": "email",
      "value": "user@example.com"
    }
  }
}
```

---

## 3. 에러 코드 정의

### 3.1 인증 관련 (4xx)

| 코드 | HTTP | 설명 |
|------|------|------|
| INVALID_CREDENTIALS | 401 | 이메일 또는 비밀번호가 틀림 |
| UNAUTHORIZED | 401 | 유효하지 않은 JWT 토큰 |
| TOKEN_EXPIRED | 401 | JWT 토큰 만료 |
| FORBIDDEN | 403 | 접근 권한 없음 (관리자 필수 등) |
| USER_BLOCKED | 403 | 차단된 사용자 |

### 3.2 검증 관련 (4xx)

| 코드 | HTTP | 설명 |
|------|------|------|
| VALIDATION_ERROR | 400 | 입력 값 검증 실패 |
| DUPLICATE_EMAIL | 409 | 이미 가입된 이메일 |
| DUPLICATE_SLUG | 409 | 이미 존재하는 URL 슬러그 |
| INVALID_COLOR_FORMAT | 400 | 유효하지 않은 컬러 형식 (HEX) |
| INVALID_PERMISSION | 400 | 유효하지 않은 권한 값 |

### 3.3 리소스 관련 (4xx)

| 코드 | HTTP | 설명 |
|------|------|------|
| NOT_FOUND | 404 | 리소스를 찾을 수 없음 |
| RESOURCE_IN_USE | 409 | 리소스가 사용 중 (삭제 불가) |

### 3.4 서버 관련 (5xx)

| 코드 | HTTP | 설명 |
|------|------|------|
| INTERNAL_SERVER_ERROR | 500 | 서버 내부 오류 |
| DATABASE_ERROR | 500 | 데이터베이스 오류 |
| EXTERNAL_API_ERROR | 502 | 외부 API 호출 실패 (OAuth 등) |

---

## 4. 인증 API

### 4.1 회원가입

**엔드포인트**: `POST /auth/register`

**설명**: 이메일 + 비밀번호로 새 계정 생성

**요청**:
```json
{
  "email": "user@example.com",
  "password": "SecurePass123!",
  "password_confirm": "SecurePass123!",
  "name": "John Doe"
}
```

**요청 검증**:
- email: 유효한 이메일 형식
- password: 8자 이상, 대소문자+숫자+특수문자 포함
- password_confirm: password와 일치
- name: 1자 이상 100자 이하

**성공 응답** (201 Created):
```json
{
  "success": true,
  "data": {
    "user": {
      "id": 1,
      "email": "user@example.com",
      "name": "John Doe",
      "role": "user"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  },
  "message": "회원가입이 완료되었습니다."
}
```

**에러 응답**:
- 400: VALIDATION_ERROR (입력 값 검증 실패)
- 409: DUPLICATE_EMAIL (이미 가입된 이메일)

---

### 4.2 로그인

**엔드포인트**: `POST /auth/login`

**설명**: 이메일 + 비밀번호로 로그인

**요청**:
```json
{
  "email": "user@example.com",
  "password": "SecurePass123!"
}
```

**성공 응답** (200 OK):
```json
{
  "success": true,
  "data": {
    "user": {
      "id": 1,
      "email": "user@example.com",
      "name": "John Doe",
      "role": "user"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  },
  "message": "로그인이 완료되었습니다."
}
```

**에러 응답**:
- 401: INVALID_CREDENTIALS (이메일 또는 비밀번호 틀림)
- 403: USER_BLOCKED (차단된 사용자)

---

### 4.3 Google 소셜 로그인

**엔드포인트**: `POST /auth/oauth/google/callback`

**설명**: Google OAuth 2.0 콜백 처리

**요청**:
```json
{
  "code": "4/0AY-..."
}
```

**처리 흐름**:
1. authorization code로 Google API 호출
2. 사용자 정보 (이메일, 이름) 조회
3. DB에서 (oauth_provider='google', oauth_id) 검색
4. 기존 사용자 → 로그인
5. 신규 사용자 → 자동 회원가입

**성공 응답** (200 OK):
```json
{
  "success": true,
  "data": {
    "user": {
      "id": 2,
      "email": "user@gmail.com",
      "name": "John Google",
      "role": "user",
      "oauth_provider": "google"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "is_new_user": true
  },
  "message": "Google 로그인이 완료되었습니다."
}
```

**에러 응답**:
- 401: UNAUTHORIZED (유효하지 않은 authorization code)
- 502: EXTERNAL_API_ERROR (Google API 호출 실패)

---

### 4.4 Kakao 소셜 로그인

**엔드포인트**: `POST /auth/oauth/kakao/callback`

**설명**: Kakao OAuth 2.0 콜백 처리

**요청**:
```json
{
  "code": "KCa1k7Hjd8..."
}
```

**성공 응답** (200 OK):
```json
{
  "success": true,
  "data": {
    "user": {
      "id": 3,
      "email": "user@kakao.com",
      "name": "John Kakao",
      "role": "user",
      "oauth_provider": "kakao"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "is_new_user": false
  },
  "message": "Kakao 로그인이 완료되었습니다."
}
```

---

### 4.5 Naver 소셜 로그인

**엔드포인트**: `POST /auth/oauth/naver/callback`

**설명**: Naver OAuth 2.0 콜백 처리

**요청**:
```json
{
  "code": "AFH47...",
  "state": "state_value"
}
```

**성공 응답** (200 OK):
```json
{
  "success": true,
  "data": {
    "user": {
      "id": 4,
      "email": "user@naver.com",
      "name": "John Naver",
      "role": "user",
      "oauth_provider": "naver"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "is_new_user": false
  },
  "message": "Naver 로그인이 완료되었습니다."
}
```

---

## 5. 사용자 API

### 5.1 회원 목록 조회

**엔드포인트**: `GET /users`

**권한**: Admin only

**쿼리 파라미터**:
```
?page=1&limit=50&search=john&sort=created_at
```

| 파라미터 | 타입 | 기본값 | 설명 |
|---------|------|--------|------|
| page | INT | 1 | 페이지 번호 (1부터 시작) |
| limit | INT | 50 | 페이지 크기 |
| search | STRING | - | 검색어 (이메일/이름) |
| sort | STRING | created_at | 정렬 기준 (email/created_at) |

**성공 응답** (200 OK):
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "email": "user1@example.com",
      "name": "User One",
      "role": "admin",
      "oauth_provider": null,
      "status": "active",
      "created_at": "2026-01-15T10:30:00Z"
    },
    {
      "id": 2,
      "email": "user2@gmail.com",
      "name": "User Two",
      "role": "user",
      "oauth_provider": "google",
      "status": "active",
      "created_at": "2026-01-20T14:45:00Z"
    }
  ],
  "pagination": {
    "current_page": 1,
    "total_pages": 2,
    "total_items": 100,
    "limit": 50
  },
  "message": "회원 목록 조회 완료"
}
```

---

### 5.2 회원 등급 변경

**엔드포인트**: `PATCH /users/{user_id}/role`

**권한**: Admin only

**요청**:
```json
{
  "role": "admin"
}
```

**성공 응답** (200 OK):
```json
{
  "success": true,
  "data": {
    "id": 2,
    "email": "user2@gmail.com",
    "name": "User Two",
    "role": "admin"
  },
  "message": "회원 등급이 변경되었습니다."
}
```

---

### 5.3 회원 차단

**엔드포인트**: `PATCH /users/{user_id}/status`

**권한**: Admin only

**요청**:
```json
{
  "status": "blocked"
}
```

**성공 응답** (200 OK):
```json
{
  "success": true,
  "data": {
    "id": 2,
    "email": "user2@gmail.com",
    "name": "User Two",
    "status": "blocked"
  },
  "message": "회원이 차단되었습니다."
}
```

---

## 6. 페이지 API

### 6.1 페이지 생성

**엔드포인트**: `POST /pages`

**권한**: Admin only

**요청**:
```json
{
  "title": "소개",
  "slug": "about"
}
```

**성공 응답** (201 Created):
```json
{
  "success": true,
  "data": {
    "id": 1,
    "title": "소개",
    "slug": "about",
    "is_published": false,
    "created_at": "2026-03-27T10:00:00Z"
  },
  "message": "페이지가 생성되었습니다."
}
```

**에러 응답**:
- 409: DUPLICATE_SLUG (이미 존재하는 슬러그)

---

### 6.2 페이지 목록 조회

**엔드포인트**: `GET /pages`

**권한**: Admin only

**쿼리 파라미터**: `?page=1&limit=20`

**성공 응답** (200 OK):
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "title": "소개",
      "slug": "about",
      "is_published": true,
      "section_count": 3,
      "created_at": "2026-03-27T10:00:00Z"
    }
  ],
  "pagination": {
    "current_page": 1,
    "total_pages": 1,
    "total_items": 1,
    "limit": 20
  },
  "message": "페이지 목록 조회 완료"
}
```

---

### 6.3 페이지 발행/숨김

**엔드포인트**: `PATCH /pages/{page_id}/publish`

**권한**: Admin only

**요청**:
```json
{
  "is_published": true
}
```

**성공 응답** (200 OK):
```json
{
  "success": true,
  "data": {
    "id": 1,
    "title": "소개",
    "slug": "about",
    "is_published": true
  },
  "message": "페이지가 발행되었습니다."
}
```

---

### 6.4 페이지 삭제

**엔드포인트**: `DELETE /pages/{page_id}`

**권한**: Admin only

**성공 응답** (204 No Content):
```
(본문 없음)
```

---

## 7. 섹션 API

### 7.1 섹션 추가

**엔드포인트**: `POST /pages/{page_id}/sections`

**권한**: Admin only

**요청**:
```json
{
  "type": "container",
  "format": "bento",
  "content": {
    "title": "우리의 서비스",
    "items": [
      {
        "title": "서비스 1",
        "description": "설명",
        "image_url": "https://...",
        "size": "large"
      }
    ]
  }
}
```

**성공 응답** (201 Created):
```json
{
  "success": true,
  "data": {
    "id": 1,
    "page_id": 1,
    "type": "container",
    "format": "bento",
    "order": 2,
    "content": { /* ... */ }
  },
  "message": "섹션이 추가되었습니다."
}
```

---

### 7.2 섹션 목록 조회

**엔드포인트**: `GET /pages/{page_id}/sections`

**권한**: Admin only

**성공 응답** (200 OK):
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "page_id": 1,
      "type": "header",
      "format": "text",
      "order": 0,
      "content": { /* ... */ }
    },
    {
      "id": 2,
      "page_id": 1,
      "type": "container",
      "format": "bento",
      "order": 1,
      "content": { /* ... */ }
    }
  ],
  "message": "섹션 목록 조회 완료"
}
```

---

### 7.3 섹션 정렬

**엔드포인트**: `PATCH /pages/{page_id}/sections/reorder`

**권한**: Admin only

**요청**:
```json
{
  "sections": [
    { "id": 1, "order": 0 },
    { "id": 3, "order": 1 },
    { "id": 2, "order": 2 }
  ]
}
```

**성공 응답** (200 OK):
```json
{
  "success": true,
  "data": null,
  "message": "섹션 순서가 변경되었습니다."
}
```

---

### 7.4 섹션 삭제

**엔드포인트**: `DELETE /sections/{section_id}`

**권한**: Admin only

**성공 응답** (204 No Content):
```
(본문 없음)
```

---

## 8. 사이트 설정 API

### 8.1 사이트 설정 조회

**엔드포인트**: `GET /site-settings`

**권한**: Admin only

**성공 응답** (200 OK):
```json
{
  "success": true,
  "data": {
    "logo_url": "https://cdn.example.com/logo.png",
    "primary_color": "#FF5733",
    "secondary_color": "#33FF57",
    "background_color": "#F5F5F5",
    "gtm_code": "GTM-XXXXXXX"
  },
  "message": "사이트 설정 조회 완료"
}
```

---

### 8.2 사이트 설정 업데이트

**엔드포인트**: `PATCH /site-settings`

**권한**: Admin only

**요청** (모든 필드 optional):
```json
{
  "logo_url": "https://cdn.example.com/new-logo.png",
  "primary_color": "#FF0000",
  "secondary_color": "#00FF00",
  "background_color": "#FFFFFF",
  "gtm_code": "GTM-YYYYYYY"
}
```

**성공 응답** (200 OK):
```json
{
  "success": true,
  "data": {
    "logo_url": "https://cdn.example.com/new-logo.png",
    "primary_color": "#FF0000",
    "secondary_color": "#00FF00",
    "background_color": "#FFFFFF",
    "gtm_code": "GTM-YYYYYYY"
  },
  "message": "사이트 설정이 업데이트되었습니다."
}
```

**에러 응답**:
- 400: INVALID_COLOR_FORMAT (HEX 형식 아님)

---

## 9. 게시판 API

### 9.1 게시판 생성

**엔드포인트**: `POST /boards`

**권한**: Admin only

**요청**:
```json
{
  "name": "공지사항",
  "type": "general",
  "read_permission": "public",
  "write_permission": "admin_only"
}
```

**성공 응답** (201 Created):
```json
{
  "success": true,
  "data": {
    "id": 1,
    "name": "공지사항",
    "type": "general",
    "read_permission": "public",
    "write_permission": "admin_only"
  },
  "message": "게시판이 생성되었습니다."
}
```

---

### 9.2 게시판 목록 조회

**엔드포인트**: `GET /boards`

**권한**: Admin only

**성공 응답** (200 OK):
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "name": "공지사항",
      "type": "general",
      "read_permission": "public",
      "write_permission": "admin_only",
      "post_count": 5
    },
    {
      "id": 2,
      "name": "자유게시판",
      "type": "general",
      "read_permission": "user",
      "write_permission": "user",
      "post_count": 12
    }
  ],
  "message": "게시판 목록 조회 완료"
}
```

---

## 10. 게시글 API

### 10.1 게시글 작성

**엔드포인트**: `POST /boards/{board_id}/posts`

**권한**: JWT (권한 기반)

**요청**:
```json
{
  "title": "첫 번째 게시글",
  "content": "# 제목\n\n게시글 본문입니다."
}
```

**성공 응답** (201 Created):
```json
{
  "success": true,
  "data": {
    "id": 1,
    "board_id": 1,
    "author_id": 2,
    "title": "첫 번째 게시글",
    "content": "# 제목\n\n게시글 본문입니다.",
    "created_at": "2026-03-27T15:00:00Z"
  },
  "message": "게시글이 작성되었습니다."
}
```

**에러 응답**:
- 401: UNAUTHORIZED (로그인 필수)
- 403: FORBIDDEN (권한 없음)

---

### 10.2 게시글 목록 조회

**엔드포인트**: `GET /boards/{board_id}/posts`

**권한**: 없음 (권한 기반)

**쿼리 파라미터**: `?page=1&limit=20`

**성공 응답** (200 OK):
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "title": "첫 번째 게시글",
      "author_name": "User Two",
      "created_at": "2026-03-27T15:00:00Z",
      "comment_count": 3
    },
    {
      "id": 2,
      "title": "두 번째 게시글",
      "author_name": "User One",
      "created_at": "2026-03-27T14:30:00Z",
      "comment_count": 0
    }
  ],
  "pagination": {
    "current_page": 1,
    "total_pages": 1,
    "total_items": 2,
    "limit": 20
  },
  "message": "게시글 목록 조회 완료"
}
```

---

### 10.3 게시글 상세 조회

**엔드포인트**: `GET /posts/{post_id}`

**권한**: 없음 (권한 기반)

**성공 응답** (200 OK):
```json
{
  "success": true,
  "data": {
    "id": 1,
    "title": "첫 번째 게시글",
    "content": "# 제목\n\n게시글 본문입니다.",
    "author_id": 2,
    "author_name": "User Two",
    "created_at": "2026-03-27T15:00:00Z",
    "updated_at": "2026-03-27T15:00:00Z",
    "comments": [
      {
        "id": 1,
        "author_name": "User One",
        "content": "좋은 글 감사합니다!",
        "created_at": "2026-03-27T15:30:00Z"
      }
    ]
  },
  "message": "게시글 조회 완료"
}
```

---

## 11. 공개 API (비로그인 사용자)

### 11.1 공개 페이지 조회

**엔드포인트**: `GET /public/pages/{slug}`

**권한**: 없음

**설명**: URL 슬러그로 공개 페이지 조회 (렌더링용)

**성공 응답** (200 OK):
```json
{
  "success": true,
  "data": {
    "id": 1,
    "title": "소개",
    "slug": "about",
    "site_settings": {
      "logo_url": "https://...",
      "primary_color": "#FF5733",
      "secondary_color": "#33FF57",
      "background_color": "#F5F5F5",
      "gtm_code": "GTM-XXXXXXX"
    },
    "sections": [
      {
        "type": "header",
        "format": "text",
        "content": { /* ... */ }
      }
    ]
  },
  "message": "페이지 조회 완료"
}
```

---

## 12. 요청 유효성 검사

### 12.1 공통 규칙

| 필드 | 규칙 | 에러 |
|------|------|------|
| email | 유효한 이메일 형식 | VALIDATION_ERROR |
| password | 8자 이상, 대소문자+숫자+특수문자 | VALIDATION_ERROR |
| name | 1-100자 | VALIDATION_ERROR |
| slug | ^[a-z0-9-]+$ | VALIDATION_ERROR |
| color | ^#[0-9A-F]{6}$ (HEX 형식) | INVALID_COLOR_FORMAT |
| role | admin 또는 user | INVALID_PERMISSION |

---

## 13. 참고 자료

- [Feature Specification](./03-feature-spec.md)
- [Database Schema](./04-db-schema.md)
- [Screen Mapping](./06-screens.md)
