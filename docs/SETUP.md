# 개발 환경 설정 가이드

## 사전 요구사항

- [Docker Desktop](https://www.docker.com/products/docker-desktop/) 설치
- [Node.js 20+](https://nodejs.org/) (관리자 앱 로컬 개발 시)
- [PHP 8.2+](https://www.php.net/) + [Composer](https://getcomposer.org/) (백엔드 로컬 개발 시)

---

## 1. 전체 환경 Docker로 실행 (권장)

```bash
# 1. 저장소 클론
git clone <repo-url>
cd Hompage_builder

# 2. Docker 환경 시작
docker-compose up --build

# 3. API 확인
curl http://localhost:8000/api/health
# → {"success":true,"data":{"status":"ok","timestamp":"..."}}
```

| 서비스 | URL |
|--------|-----|
| PHP API | http://localhost:8000/api |
| MySQL | localhost:3306 |

---

## 2. 관리자 앱 로컬 개발 서버

```bash
cd admin

# 환경 변수 설정
cp .env.local.example .env.local

# 의존성 설치 (최초 1회)
npm install

# 개발 서버 시작
npm run dev
# → http://localhost:3000
```

---

## 3. DB 마이그레이션 (Docker 내부)

```bash
# Docker 컨테이너 내부에서 마이그레이션 실행
docker-compose exec php php database/migrate.php
```

---

## 4. 백엔드 Composer 의존성 설치 (로컬 개발)

```bash
cd backend
composer install
cp .env.example .env
# .env 파일에서 DB 정보 수정
```

---

## 5. 컨테이너 관리

```bash
# 백그라운드 실행
docker-compose up -d

# 로그 확인
docker-compose logs -f php
docker-compose logs -f nginx

# 컨테이너 중지
docker-compose down

# 볼륨 포함 완전 초기화
docker-compose down -v
```

---

## 디렉토리 구조

```
Hompage_builder/
├── backend/          # PHP 백엔드
│   ├── config/       # DB 설정
│   ├── src/          # 소스 코드 (Router, Controllers, Services 등)
│   ├── routes/       # API 라우트 정의
│   ├── database/     # 마이그레이션 SQL
│   └── public/       # Nginx 웹루트 (index.php)
├── admin/            # Next.js 관리자 앱
├── docker-compose.yml
├── Dockerfile        # PHP 이미지
├── nginx.conf        # Nginx 설정
└── .env.docker       # Docker 환경 변수
```
