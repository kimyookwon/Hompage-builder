# 03-feature-spec.md — 기능 명세서

**작성일**: 2026-03-27
**버전**: v1.0
**프로젝트명**: 홈페이지 빌더 (Homepage Builder)

---

## 1. 회원 관리 (User Management)

### 1.1 회원가입

**기능명**: 자체 회원가입 (이메일 + 비밀번호)

**관련 스토리**: US-013

**상세 스펙**:

| 항목 | 내용 |
|------|------|
| **입력** | 이메일, 비밀번호, 비밀번호 확인, 이름 |
| **처리 로직** | 1. 이메일 중복 검사 (DB 조회)<br>2. 비밀번호 유효성 검사 (8자 이상, 대소문자+숫자+특수문자)<br>3. bcrypt로 해시 처리<br>4. users 테이블에 INSERT<br>5. JWT 토큰 자동 발급 |
| **출력** | JWT 토큰, 사용자 정보 (id, email, name, role) |
| **예외 처리** | 이메일 중복 → 400 Bad Request<br>비밀번호 미흡 → 400 Bad Request<br>DB 오류 → 500 Internal Server Error |
| **성공 응답** | 201 Created + JWT 토큰 |

**API 엔드포인트**: `POST /api/auth/register`

---

### 1.2 자체 로그인

**기능명**: 이메일 + 비밀번호 로그인

**관련 스토리**: US-013

**상세 스펙**:

| 항목 | 내용 |
|------|------|
| **입력** | 이메일, 비밀번호 |
| **처리 로직** | 1. users 테이블에서 이메일로 사용자 조회<br>2. bcrypt로 비밀번호 비교<br>3. 차단 상태 확인 (status = 'blocked')<br>4. JWT 토큰 발급 (유효 기간: 24시간) |
| **출력** | JWT 토큰, 사용자 정보 |
| **예외 처리** | 이메일 미존재 → 401 Unauthorized<br>비밀번호 오류 → 401 Unauthorized<br>차단된 사용자 → 403 Forbidden |
| **성공 응답** | 200 OK + JWT 토큰 |

**API 엔드포인트**: `POST /api/auth/login`

---

### 1.3 소셜 로그인 (Google, Kakao, Naver)

**기능명**: OAuth 2.0 기반 소셜 로그인

**관련 스토리**: US-012

**상세 스펙**:

| 항목 | 내용 |
|------|------|
| **입력** | OAuth provider (google/kakao/naver), authorization code |
| **처리 로직** | 1. Authorization code를 access token으로 교환<br>2. 소셜 제공자의 사용자 정보 API 호출<br>3. users 테이블에서 (oauth_provider, oauth_id) 조회<br>4. 기존 사용자 → 기존 계정 로그인<br>5. 신규 사용자 → 자동 회원가입 후 로그인<br>6. JWT 토큰 발급 |
| **출력** | JWT 토큰, 사용자 정보, is_new_user (boolean) |
| **예외 처리** | 유효하지 않은 authorization code → 401 Unauthorized<br>소셜 제공자 API 오류 → 500 Internal Server Error |
| **성공 응답** | 200 OK + JWT 토큰 |

**API 엔드포인트**:
- `POST /api/auth/oauth/google/callback`
- `POST /api/auth/oauth/kakao/callback`
- `POST /api/auth/oauth/naver/callback`

**처리 흐름** (프론트엔드):
```
1. 소셜 로그인 버튼 클릭
2. OAuth 제공자 로그인 페이지로 리다이렉트
3. 사용자 인증 후 authorization code 받음
4. 백엔드 callback 엔드포인트에 code 전송
5. JWT 토큰 수신, localStorage 저장
6. 관리자 대시보드 또는 공개 사이트로 리다이렉트
```

---

### 1.4 회원 조회 (Admin)

**기능명**: 회원 목록 조회 (관리자 전용)

**관련 스토리**: US-008

**상세 스펙**:

| 항목 | 내용 |
|------|------|
| **입력** | 페이지 번호 (page), 페이지 크기 (limit=50), 검색어 (search), 정렬 (sort=email/created_at) |
| **처리 로직** | 1. 관리자 권한 확인 (role = 'admin')<br>2. users 테이블 검색 + 페이지네이션<br>3. 소셜 연동 정보 포함 (oauth_provider, oauth_id)<br>4. 총 개수 반환 |
| **출력** | 회원 배열 (id, email, name, oauth_provider, created_at, status) |
| **예외 처리** | 관리자 아님 → 403 Forbidden |
| **성공 응답** | 200 OK + 회원 목록, 총 개수, 현재 페이지 |

**API 엔드포인트**: `GET /api/users?page=1&limit=50&search=&sort=created_at`

---

### 1.5 회원 등급 변경

**기능명**: 회원의 역할(role) 변경 (관리자 전용)

**관련 스토리**: US-009

**상세 스펙**:

| 항목 | 내용 |
|------|------|
| **입력** | user_id, new_role (admin/user) |
| **처리 로직** | 1. 관리자 권한 확인<br>2. users 테이블의 role 업데이트<br>3. 변경 내역 기록 (로그, Phase 2) |
| **출력** | 업데이트된 사용자 정보 |
| **예외 처리** | 관리자 아님 → 403 Forbidden<br>사용자 미존재 → 404 Not Found |
| **성공 응답** | 200 OK + 사용자 정보 |

**API 엔드포인트**: `PATCH /api/users/{user_id}/role`

---

### 1.6 회원 차단

**기능명**: 특정 회원을 차단하여 모든 접근 제한

**관련 스토리**: US-009

**상세 스펙**:

| 항목 | 내용 |
|------|------|
| **입력** | user_id |
| **처리 로직** | 1. 관리자 권한 확인<br>2. users 테이블의 status를 'blocked'로 변경<br>3. 기존 JWT 토큰은 만료 시까지 유효 (무효화 별도 구현 필요, Phase 2) |
| **출력** | 업데이트된 사용자 정보 |
| **예외 처리** | 관리자 아님 → 403 Forbidden<br>사용자 미존재 → 404 Not Found |
| **성공 응답** | 200 OK + 사용자 정보 (status = 'blocked') |

**API 엔드포인트**: `PATCH /api/users/{user_id}/status`

---

## 2. 페이지 관리 (Page Management)

### 2.1 페이지 생성

**기능명**: 새로운 페이지 생성

**관련 스토리**: US-001

**상세 스펙**:

| 항목 | 내용 |
|------|------|
| **입력** | 페이지 제목 (title), URL 슬러그 (slug) |
| **처리 로직** | 1. 관리자 권한 확인<br>2. slug 중복 검사<br>3. slug가 URL 안전 문자만 포함 확인 (^[a-z0-9-]+$)<br>4. pages 테이블에 INSERT (is_published=false)<br>5. 기본 헤더 섹션 자동 생성 |
| **출력** | 생성된 페이지 정보 (id, title, slug, is_published, created_at) |
| **예외 처리** | slug 중복 → 409 Conflict<br>관리자 아님 → 403 Forbidden |
| **성공 응답** | 201 Created |

**API 엔드포인트**: `POST /api/pages`

**Request Body**:
```json
{
  "title": "소개",
  "slug": "about"
}
```

---

### 2.2 페이지 목록 조회

**기능명**: 생성한 페이지 목록 조회

**관련 스토리**: US-001, US-002

**상세 스펙**:

| 항목 | 내용 |
|------|------|
| **입력** | 페이지 번호 (page), 페이지 크기 (limit=20) |
| **처리 로직** | 1. 관리자 권한 확인<br>2. pages 테이블 조회 (페이지네이션, created_at DESC)<br>3. 각 페이지의 섹션 개수 포함 |
| **출력** | 페이지 배열 (id, title, slug, is_published, section_count, created_at) |
| **예외 처리** | 관리자 아님 → 403 Forbidden |
| **성공 응답** | 200 OK + 페이지 목록 |

**API 엔드포인트**: `GET /api/pages?page=1&limit=20`

---

### 2.3 페이지 발행 및 숨김

**기능명**: 페이지의 노출 여부 토글

**관련 스토리**: US-002

**상세 스펙**:

| 항목 | 내용 |
|------|------|
| **입력** | page_id, is_published (boolean) |
| **처리 로직** | 1. 관리자 권한 확인<br>2. pages 테이블의 is_published 업데이트 |
| **출력** | 업데이트된 페이지 정보 |
| **예외 처리** | 페이지 미존재 → 404 Not Found<br>관리자 아님 → 403 Forbidden |
| **성공 응답** | 200 OK |

**API 엔드포인트**: `PATCH /api/pages/{page_id}/publish`

---

### 2.4 페이지 삭제

**기능명**: 페이지와 관련된 모든 데이터 삭제

**관련 스토리**: US-003

**상세 스펙**:

| 항목 | 내용 |
|------|------|
| **입력** | page_id |
| **처리 로직** | 1. 관리자 권한 확인<br>2. 페이지의 모든 섹션 삭제 (CASCADE)<br>3. pages 테이블에서 DELETE |
| **출력** | 없음 |
| **예외 처리** | 페이지 미존재 → 404 Not Found<br>관리자 아님 → 403 Forbidden |
| **성공 응답** | 204 No Content |

**API 엔드포인트**: `DELETE /api/pages/{page_id}`

---

## 3. 컨테이너 & 섹션 관리 (Container & Section Management)

### 3.1 섹션 추가

**기능명**: 페이지에 헤더/컨테이너/배너/푸터 섹션 추가

**관련 스토리**: US-005

**상세 스펙**:

| 항목 | 내용 |
|------|------|
| **입력** | page_id, type (header/container/banner/footer), format (bento/glassmorphism/organic/text/gallery), content (JSON) |
| **처리 로직** | 1. 관리자 권한 확인<br>2. 해당 페이지 존재 확인<br>3. 타입별 제한 확인 (header/footer는 각 1개만 가능)<br>4. 마지막 섹션의 order 조회 후 +1<br>5. page_sections 테이블에 INSERT |
| **출력** | 생성된 섹션 정보 |
| **예외 처리** | 페이지 미존재 → 404 Not Found<br>header/footer 중복 → 400 Bad Request<br>관리자 아님 → 403 Forbidden |
| **성공 응답** | 201 Created |

**API 엔드포인트**: `POST /api/pages/{page_id}/sections`

**Request Body**:
```json
{
  "type": "container",
  "format": "bento",
  "content": {
    "title": "섹션 제목",
    "description": "설명",
    "items": []
  }
}
```

---

### 3.2 섹션 목록 조회

**기능명**: 특정 페이지의 모든 섹션 조회

**관련 스토리**: US-005

**상세 스펙**:

| 항목 | 내용 |
|------|------|
| **입력** | page_id |
| **처리 로직** | 1. 관리자 권한 확인<br>2. page_sections 테이블 조회 (order ASC)<br>3. 각 섹션의 상세 정보 반환 |
| **출력** | 섹션 배열 (id, type, format, content, order) |
| **예외 처리** | 페이지 미존재 → 404 Not Found<br>관리자 아님 → 403 Forbidden |
| **성공 응답** | 200 OK |

**API 엔드포인트**: `GET /api/pages/{page_id}/sections`

---

### 3.3 섹션 정렬

**기능명**: 드래그 앤 드롭으로 섹션 순서 변경

**관련 스토리**: US-005

**상세 스펙**:

| 항목 | 내용 |
|------|------|
| **입력** | page_id, section_orders (배열: [{id, order}]) |
| **처리 로직** | 1. 관리자 권한 확인<br>2. 모든 섹션의 order 값 일괄 업데이트<br>3. 트랜잭션으로 처리하여 원자성 보장 |
| **출력** | 없음 |
| **예외 처리** | 관리자 아님 → 403 Forbidden |
| **성공 응답** | 200 OK |

**API 엔드포인트**: `PATCH /api/pages/{page_id}/sections/reorder`

**Request Body**:
```json
{
  "sections": [
    { "id": 1, "order": 1 },
    { "id": 3, "order": 2 },
    { "id": 2, "order": 3 }
  ]
}
```

---

### 3.4 섹션 삭제

**기능명**: 특정 섹션 삭제

**관련 스토리**: US-005

**상세 스펙**:

| 항목 | 내용 |
|------|------|
| **입력** | section_id |
| **처리 로직** | 1. 관리자 권한 확인<br>2. header/footer 타입은 삭제 불가 (비즈니스 로직)<br>3. page_sections 테이블에서 DELETE |
| **출력** | 없음 |
| **예외 처리** | 섹션 미존재 → 404 Not Found<br>header/footer 삭제 시도 → 400 Bad Request |
| **성공 응답** | 204 No Content |

**API 엔드포인트**: `DELETE /api/sections/{section_id}`

---

## 4. 컨테이너 포맷 (Container Formats)

### 4.1 Bento Grid (벤토 그리드)

**설명**: 다양한 크기의 그리드 레이아웃

**콘텐츠 구조**:
```json
{
  "type": "container",
  "format": "bento",
  "content": {
    "title": "제목",
    "items": [
      {
        "id": 1,
        "title": "항목 1",
        "description": "설명",
        "image_url": "...",
        "size": "large"  // small, medium, large
      }
    ]
  }
}
```

---

### 4.2 Glassmorphism (글래스모피즘)

**설명**: 반투명 유리 효과의 현대적 디자인

**콘텐츠 구조**:
```json
{
  "type": "container",
  "format": "glassmorphism",
  "content": {
    "background_image": "...",
    "title": "제목",
    "description": "설명",
    "cards": [...]
  }
}
```

---

### 4.3 Organic Shapes (유기적 형태)

**설명**: 부드러운 곡선의 유기적 형태

**콘텐츠 구조**:
```json
{
  "type": "container",
  "format": "organic",
  "content": {
    "title": "제목",
    "items": [...]
  }
}
```

---

### 4.4 Text (텍스트)

**설명**: 텍스트 기반 섹션 (제목 + 본문)

**콘텐츠 구조**:
```json
{
  "type": "container",
  "format": "text",
  "content": {
    "title": "제목",
    "subtitle": "부제목",
    "body": "본문 내용",
    "align": "left"  // left, center, right
  }
}
```

---

### 4.5 Gallery (갤러리)

**설명**: 이미지 갤러리 레이아웃

**콘텐츠 구조**:
```json
{
  "type": "container",
  "format": "gallery",
  "content": {
    "title": "갤러리",
    "images": [
      {
        "url": "...",
        "alt": "이미지 설명",
        "caption": "캡션"
      }
    ]
  }
}
```

---

## 5. 시서스 관리 (Site Settings)

### 5.1 시서스 조회

**기능명**: 사이트 설정 조회

**관련 스토리**: US-006, US-007, US-014

**상세 스펙**:

| 항목 | 내용 |
|------|------|
| **입력** | 없음 |
| **처리 로직** | 1. 관리자 권한 확인<br>2. site_settings 테이블 조회 |
| **출력** | 설정 정보 (logo_url, primary_color, secondary_color, background_color, gtm_code) |
| **예외 처리** | 관리자 아님 → 403 Forbidden |
| **성공 응답** | 200 OK |

**API 엔드포인트**: `GET /api/site-settings`

---

### 5.2 시서스 업데이트

**기능명**: 사이트 설정 변경 (로고, 컬러, GTM 코드)

**관련 스토리**: US-006, US-007, US-014

**상세 스펙**:

| 항목 | 내용 |
|------|------|
| **입력** | logo_url (optional), primary_color (optional), secondary_color (optional), background_color (optional), gtm_code (optional) |
| **처리 로직** | 1. 관리자 권한 확인<br>2. 컬러 값 유효성 검사 (HEX 형식: #RRGGBB)<br>3. site_settings 테이블 UPDATE<br>4. 변경 사항 캐시 무효화 |
| **출력** | 업데이트된 설정 정보 |
| **예외 처리** | 관리자 아님 → 403 Forbidden<br>유효하지 않은 컬러 형식 → 400 Bad Request |
| **성공 응답** | 200 OK |

**API 엔드포인트**: `PATCH /api/site-settings`

**Request Body**:
```json
{
  "logo_url": "https://...",
  "primary_color": "#FF5733",
  "secondary_color": "#33FF57",
  "background_color": "#F5F5F5",
  "gtm_code": "GTM-XXXXXXX"
}
```

---

## 6. 게시판 관리 (Board Management)

### 6.1 게시판 생성

**기능명**: 새로운 게시판 생성

**관련 스토리**: US-010

**상세 스펙**:

| 항목 | 내용 |
|------|------|
| **입력** | name, type (general/gallery), read_permission (admin_only/user/public), write_permission (admin_only/user) |
| **처리 로직** | 1. 관리자 권한 확인<br>2. boards 테이블에 INSERT |
| **출력** | 생성된 게시판 정보 |
| **예외 처리** | 관리자 아님 → 403 Forbidden |
| **성공 응답** | 201 Created |

**API 엔드포인트**: `POST /api/boards`

---

### 6.2 게시판 목록 조회

**기능명**: 모든 게시판 목록 조회

**관련 스토리**: US-010

**상세 스펙**:

| 항목 | 내용 |
|------|------|
| **입력** | 없음 |
| **처리 로직** | 1. 관리자 권한 확인<br>2. boards 테이블 조회 |
| **출력** | 게시판 배열 (id, name, type, read_permission, write_permission, post_count) |
| **예외 처리** | 관리자 아님 → 403 Forbidden |
| **성공 응답** | 200 OK |

**API 엔드포인트**: `GET /api/boards`

---

## 7. 게시글 & 댓글 관리 (Post & Comment Management)

### 7.1 게시글 작성

**기능명**: 게시판에 게시글 작성 (권한 기반)

**관련 스토리**: US-011

**상세 스펙**:

| 항목 | 내용 |
|------|------|
| **입력** | board_id, title, content, images (optional) |
| **처리 로직** | 1. 사용자 인증 확인 (JWT 토큰)<br>2. 게시판의 write_permission 확인<br>3. 권한 있으면 posts 테이블에 INSERT<br>4. 권한 없으면 403 Forbidden 반환 |
| **출력** | 생성된 게시글 정보 (id, title, content, author_id, created_at) |
| **예외 처리** | 비인증 사용자 → 401 Unauthorized<br>권한 없음 → 403 Forbidden<br>게시판 미존재 → 404 Not Found |
| **성공 응답** | 201 Created |

**API 엔드포인트**: `POST /api/boards/{board_id}/posts`

---

### 7.2 게시글 목록 조회 (공개)

**기능명**: 게시판의 게시글 목록 조회 (권한 기반)

**관련 스토리**: US-011

**상세 스펙**:

| 항목 | 내용 |
|------|------|
| **입력** | board_id, page (default=1), limit (default=20) |
| **처리 로직** | 1. 게시판의 read_permission 확인<br>2. public → 모두 조회 가능<br>3. user → 로그인 필수<br>4. admin_only → 관리자만 조회<br>5. posts 테이블 조회 (페이지네이션, created_at DESC) |
| **출력** | 게시글 배열 (id, title, author_name, created_at, comment_count) |
| **예외 처리** | 권한 없음 → 403 Forbidden |
| **성공 응답** | 200 OK |

**API 엔드포인트**: `GET /api/boards/{board_id}/posts?page=1&limit=20`

---

### 7.3 게시글 상세 조회

**기능명**: 게시글의 상세 내용 조회

**상세 스펙**:

| 항목 | 내용 |
|------|------|
| **입력** | post_id |
| **처리 로직** | 1. 게시판의 read_permission 확인<br>2. posts 테이블에서 조회<br>3. 댓글 목록 함께 반환 |
| **출력** | 게시글 정보 (id, title, content, author_id, author_name, created_at, updated_at, comments[]) |
| **예외 처리** | 게시글 미존재 → 404 Not Found<br>권한 없음 → 403 Forbidden |
| **성공 응답** | 200 OK |

**API 엔드포인트**: `GET /api/posts/{post_id}`

---

## 8. API 엔드포인트 목록 (요약)

| HTTP 메서드 | 엔드포인트 | 설명 | 인증 | 권한 |
|-----------|-----------|------|------|------|
| POST | /api/auth/register | 회원가입 | 없음 | 모두 |
| POST | /api/auth/login | 자체 로그인 | 없음 | 모두 |
| POST | /api/auth/oauth/{provider}/callback | 소셜 로그인 | 없음 | 모두 |
| GET | /api/users | 회원 목록 | JWT | Admin |
| PATCH | /api/users/{user_id}/role | 회원 등급 변경 | JWT | Admin |
| PATCH | /api/users/{user_id}/status | 회원 차단 | JWT | Admin |
| POST | /api/pages | 페이지 생성 | JWT | Admin |
| GET | /api/pages | 페이지 목록 | JWT | Admin |
| PATCH | /api/pages/{page_id}/publish | 페이지 발행 | JWT | Admin |
| DELETE | /api/pages/{page_id} | 페이지 삭제 | JWT | Admin |
| POST | /api/pages/{page_id}/sections | 섹션 추가 | JWT | Admin |
| GET | /api/pages/{page_id}/sections | 섹션 목록 | JWT | Admin |
| PATCH | /api/pages/{page_id}/sections/reorder | 섹션 정렬 | JWT | Admin |
| DELETE | /api/sections/{section_id} | 섹션 삭제 | JWT | Admin |
| GET | /api/site-settings | 시서스 조회 | JWT | Admin |
| PATCH | /api/site-settings | 시서스 업데이트 | JWT | Admin |
| POST | /api/boards | 게시판 생성 | JWT | Admin |
| GET | /api/boards | 게시판 목록 | JWT | Admin |
| POST | /api/boards/{board_id}/posts | 게시글 작성 | JWT | 권한 기반 |
| GET | /api/boards/{board_id}/posts | 게시글 목록 | JWT (optional) | 권한 기반 |
| GET | /api/posts/{post_id} | 게시글 상세 | JWT (optional) | 권한 기반 |

---

## 9. 참고 자료

- [API Specification](./05-api-spec.md)
- [Database Schema](./04-db-schema.md)
- [Screen Mapping](./06-screens.md)
