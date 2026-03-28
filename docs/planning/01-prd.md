# 01-prd.md — 제품 요구사항 정의서 (PRD)

**작성일**: 2026-03-27
**버전**: v1.0
**프로젝트명**: 홈페이지 빌더 (Homepage Builder)

---

## 1. 프로젝트 개요

### 1.1 제품명 및 슬로건
**제품명**: 홈페이지 빌더 (Homepage Builder)
**슬로건**: "코드 없이 만들고, 복사만 하면 독립 사이트가 되다"

### 1.2 프로젝트 설명
관리자가 코드를 작성하지 않고 직관적인 관리자 대시보드를 통해 페이지를 생성·편집할 수 있으며, 전체 소스 코드와 데이터베이스를 복사하면 즉시 독립된 멀티 사이트로 운영할 수 있는 빌더 플랫폼입니다.

### 1.3 비즈니스 목표
- **단기 목표**: MVP 빠른 출시 (스코프 최소화)
- **중기 목표**: 자체 운영 및 반복 사용을 통한 수익성 검증
- **장기 목표**: 상용화 추진 (SaaS 모델 가능)

### 1.4 타겟 사용자
| 사용자군 | 설명 | 예상 수요 |
|---------|------|---------|
| **소규모 기업/스타트업** | 웹사이트 필요하나 개발 예산 제한 | 높음 |
| **프리랜서 개발자/에이전시** | 다중 클라이언트 사이트 신속 제작 | 매우 높음 |
| **개인 크리에이터/블로거** | 개인 포트폴리오/블로그 관리 | 중간 |

---

## 2. 핵심 가치 제안

### 2.1 경쟁 우위
1. **무한 복사/재사용 구조**
   - 소스 코드 + DB 스키마 템플릿화로 언제든 신규 사이트 생성 가능
   - 타 빌더 대비 확장성 극대화

2. **2026 트렌드 UI 자동 적용**
   - Bento Grid, Glassmorphism, Organic Shapes 등 최신 디자인 포맷 제공
   - 코드 없이 최신 UI 적용 가능

3. **통합 커뮤니티 기능**
   - 소셜 로그인 (Google, Kakao, Naver) + 자체 가입
   - 무한 게시판 생성 및 권한 관리
   - 댓글 기능

---

## 3. 핵심 기능 (우선순위 순)

### Phase 1: MVP (필수)
| 우선순위 | 기능 | 설명 |
|---------|------|------|
| **P0** | 회원 관리 | 소셜 로그인, 자체 가입, 권한 분리 (Admin/User) |
| **P0** | 페이지 관리 | 무한 페이지 생성, URL 슬러그, 노출 여부 |
| **P0** | 컨테이너 레이아웃 관리 | 헤더/컨테이너/배너/푸터 무한 추가, 드래그 정렬 |
| **P0** | 컨테이너 포맷 선택 | Bento, Glassmorphism, Organic Shapes, Text, Gallery |
| **P0** | 시서스 관리 | 로고, 디자인 토큰, GTM 코드, API 키 설정 |
| **P0** | 게시판 관리 | 무한 생성, 읽기/쓰기 권한 설정, 게시글 CRUD |

### Phase 2: MVP 확장 (선택)
| 우선순위 | 기능 | 설명 |
|---------|------|------|
| **P1** | 댓글 시스템 | 게시글별 댓글 (계층형) |
| **P1** | 미디어 라이브러리 | 이미지/파일 업로드 및 관리 |
| **P1** | SEO + GTM 자동화 | 메타 태그, GTM 코드 자동 삽입 |
| **P1** | 다크 모드 | 기기 설정 연동 자동 다크 모드 |

### Phase 3: 고급 기능 (추후)
| 우선순위 | 기능 | 설명 |
|---------|------|------|
| **P2** | 분석 대시보드 | 방문자 통계, 게시글 조회수 |
| **P2** | 이메일 알림 | 새 댓글, 회원가입 승인 알림 |
| **P2** | 버전 관리 | 페이지 히스토리, 롤백 |

---

## 4. 기술 스택

| 계층 | 기술 | 설명 |
|------|------|------|
| **백엔드** | PHP (Vanilla) + MySQL | 가볍고 빠른 MVP 개발 |
| **관리자 프론트엔드** | Next.js + React + TypeScript | 반응형 SPA |
| **공개 페이지** | PHP 템플릿 렌더링 | SEO-friendly, 빠른 로딩 |
| **스타일링** | Tailwind CSS | 반응형 CSS |
| **인증** | OAuth 2.0 (Google, Kakao, Naver) + JWT | 소셜 로그인 + 자체 인증 |
| **아키텍처** | REST API (PHP) + SPA Admin (Next.js) 하이브리드 | 유연한 확장 |

---

## 5. 비기능 요구사항

### 5.1 성능
- 페이지 로딩 시간: 2초 이내 (First Contentful Paint)
- API 응답 시간: 500ms 이내
- 동시 사용자 수: 초기 100명 이상 지원

### 5.2 보안
- 모든 API 통신 HTTPS 필수
- JWT 토큰 기반 인증 (만료: 24시간)
- 사용자 권한 기반 접근 제어 (RBAC)
- SQL Injection, XSS 방지 필수
- 비밀번호 bcrypt 해시 저장

### 5.3 확장성
- 게시판, 페이지, 컨테이너 무한 생성 가능
- 멀티 사이트 운영 지원 (DB 복사로 독립 사이트 생성)

### 5.4 사용성
- 반응형 디자인 (모바일, 태블릿, 데스크톱)
- 직관적인 드래그 앤 드롭 인터페이스
- 다크 모드 지원

### 5.5 가용성
- 서버 가동 시간: 99%
- 정기 백업 (일일 1회 이상)

---

## 6. 데이터베이스 개요

### 6.1 주요 테이블
```
users
├── id (PK)
├── email (UNIQUE)
├── password_hash
├── name
├── role (admin, user)
├── oauth_provider (google, kakao, naver, null)
├── oauth_id
└── created_at, updated_at

boards
├── id (PK)
├── name
├── type (general, gallery)
├── read_permission (admin, user, public)
├── write_permission (admin, user, public)
└── created_at

posts
├── id (PK)
├── board_id (FK)
├── author_id (FK)
├── title
├── content
└── created_at, updated_at

pages
├── id (PK)
├── title
├── slug (UNIQUE)
├── is_published
└── created_at, updated_at

page_sections
├── id (PK)
├── page_id (FK)
├── type (header, container, banner, footer)
├── format (bento, glassmorphism, organic, text, gallery)
├── content (JSON)
├── order
└── created_at

site_settings
├── id (PK)
├── logo_url
├── primary_color
├── secondary_color
├── background_color
├── gtm_code
└── updated_at
```

---

## 7. 화면 목록 (하이레벨)

| 화면 ID | 화면명 | 타입 | 주요 기능 |
|---------|--------|------|---------|
| S01 | 공개 홈페이지 | Public | 관리자가 구성한 컨테이너 렌더링, 다크모드 토글 |
| S02 | 로그인 | Auth | 이메일/비밀번호 로그인, 소셜 로그인 (3종) |
| S03 | 관리자 대시보드 (홈) | Admin | 통계, 최근 게시글, 빠른 링크 |
| S04 | 페이지 관리 | Admin | 페이지 CRUD, URL 슬러그, 노출 설정 |
| S05 | 컨테이너 편집기 | Admin | 섹션 추가/정렬, 포맷 선택, 미리보기 |
| S06 | 시서스 관리 | Admin | 로고, 컬러, GTM, API 키 설정 |
| S07 | 회원 관리 | Admin | 회원 목록, 소셜 연동, 등급 변경/차단 |
| S08 | 게시판 관리 | Admin | 게시판 CRUD, 권한 설정 |
| S09 | 공개 게시판 | Public | 게시글 목록/읽기/작성, 댓글 |

---

## 8. 범위 외 항목 (Out of Scope)

- 결제/결제 게이트웨이 통합 (Phase 3 이상)
- 고급 분석 대시보드 (Phase 3 이상)
- 모바일 앱 (웹 반응형으로 대응)
- 실시간 협업 편집 (Phase 3 이상)
- AI 기반 콘텐츠 생성 (추후 검토)
- 다국어 지원 (초기는 한국어만)

---

## 9. 성공 기준

1. **기술적 성공**
   - MVP 기능 모두 완성 (P0 목록)
   - API 응답 시간 평균 500ms 이내
   - 단위 테스트 커버리지 70% 이상

2. **비즈니스 성공**
   - MVP 출시 완료
   - 자체 운영 사이트 3개 이상 관리 가능 검증

3. **사용자 만족도**
   - 관리자 UI 직관성 평가 점수 4/5 이상

---

## 10. 일정 및 마일스톤

| 마일스톤 | 목표 | 예상 기간 |
|---------|------|---------|
| **M1: 설계 완료** | PRD, 스크린, DB 스키마, API 명세 완성 | 1주 |
| **M2: 백엔드 개발** | API 개발, 테스트 완료 | 3주 |
| **M3: 프론트엔드 개발** | 관리자 대시보드 완성 | 2주 |
| **M4: 통합 테스트** | 전체 기능 통합 테스트 | 1주 |
| **M5: MVP 출시** | 프로덕션 배포 | 1주 |

**전체 예상 기간**: 8주

---

## 11. 참고 자료

- [User Stories Document](./02-user-stories.md)
- [Feature Specification](./03-feature-spec.md)
- [Database Schema](./04-db-schema.md)
- [API Specification](./05-api-spec.md)
- [Screen Mapping](./06-screens.md)
- [Coding Convention](./07-coding-convention.md)
