# 사용법 가이드

Homepage Builder를 처음 실행하거나 일상적으로 운영할 때 참고하는 실전 가이드입니다.

---

## 목차

1. [최초 실행 (첫 셋업)](#1-최초-실행-첫-셋업)
2. [일상적인 시작/종료](#2-일상적인-시작종료)
3. [관리자 앱 실행](#3-관리자-앱-실행)
4. [초기 계정 정보](#4-초기-계정-정보)
5. [API 동작 확인](#5-api-동작-확인)
6. [자주 발생하는 문제 해결](#6-자주-발생하는-문제-해결)
7. [데이터 관리](#7-데이터-관리)
8. [컨테이너 관리 명령어](#8-컨테이너-관리-명령어)

---

## 1. 최초 실행 (첫 셋업)

프로젝트를 처음 받았거나 완전 초기화 후 시작할 때 아래 순서로 진행합니다.

### 1-1. 백엔드 .env 설정

```bash
cd backend
cp .env.example .env
```

`.env` 파일을 열어 아래 값으로 수정합니다:

```dotenv
DB_HOST=mysql
DB_PORT=3306
DB_DATABASE=homepage_builder
DB_USERNAME=homepage_user
DB_PASSWORD=homepage_password
JWT_SECRET=docker-dev-jwt-secret-change-in-production
```

> **주의**: `DB_HOST`는 반드시 `mysql`로 설정해야 합니다 (Docker 내부 서비스명).

### 1-2. Composer 의존성 미리 설치

Docker 볼륨 마운트 시 `vendor/` 폴더가 컨테이너 빌드 결과를 덮어쓰기 때문에, 로컬에서 먼저 설치합니다.

```bash
cd backend
composer install --no-dev
```

> PHP + Composer가 로컬에 없는 경우 [1-2 대안](#1-2-대안-composer가-없을-때) 참고.

### 1-3. Docker 빌드 및 실행

```bash
# 프로젝트 루트에서 실행
cd ..
docker-compose up --build -d
```

### 1-4. DB 마이그레이션 확인

MySQL은 `docker-entrypoint-initdb.d`에 마운트된 SQL 파일을 최초 실행 시 자동으로 실행합니다.
테이블과 초기 데이터가 들어갔는지 확인합니다:

```bash
docker exec homepage_mysql mysql -uhomepage_user -phomepage_password homepage_builder -e "SHOW TABLES;"
```

정상 결과:
```
Tables_in_homepage_builder
boards
comments
media_assets
page_sections
pages
posts
site_settings
users
```

### 1-5. 동작 확인

```bash
curl http://localhost:8000/api/auth/me
# → {"success":false,"error":"인증 토큰이 필요합니다.","code":401}
```

401 응답이 오면 정상입니다.

---

### 1-2 대안: Composer가 없을 때

로컬에 PHP/Composer가 없는 경우, Docker 컨테이너 안에서 설치합니다:

```bash
# 먼저 컨테이너를 실행한 뒤
docker-compose up -d

# 컨테이너 내부에서 Composer 설치
docker exec homepage_php composer install --no-dev --optimize-autoloader
```

---

## 2. 일상적인 시작/종료

### 시작

```bash
# Docker Desktop이 실행 중이어야 함
docker-compose up -d
```

### 종료

```bash
docker-compose down
```

### 재시작 (코드 변경 없음)

```bash
docker-compose restart
```

### 재빌드 (Dockerfile 또는 Composer 의존성 변경 시)

```bash
docker-compose up --build -d
```

---

## 3. 관리자 앱 실행

백엔드 컨테이너와 별개로 Next.js 개발 서버를 로컬에서 실행합니다.

```bash
cd admin

# 최초 1회: 의존성 설치
npm install

# 환경 변수 확인 (.env.local)
cat .env.local
# NEXT_PUBLIC_API_URL=http://localhost:8000/api

# 개발 서버 시작
npm run dev
```

브라우저에서 `http://localhost:3000` 접속.

> Docker 컨테이너(`http://localhost:8000`)가 먼저 실행 중이어야 로그인이 됩니다.

---

## 4. 초기 계정 정보

| 항목 | 값 |
|------|-----|
| 이메일 | `admin@homepage.local` |
| 비밀번호 | `Admin1234!` |
| 권한 | 관리자 (admin) |

> 프로덕션 배포 전에 반드시 비밀번호를 변경하세요.

### 비밀번호 변경 방법

```bash
# 새 해시 생성
docker exec homepage_php php -r "echo password_hash('새비밀번호', PASSWORD_BCRYPT, ['cost'=>12]);"

# DB 업데이트 (PHP 스크립트 사용)
docker exec homepage_php php -r "
\$pdo = new PDO('mysql:host=mysql;dbname=homepage_builder;charset=utf8mb4', 'homepage_user', 'homepage_password');
\$hash = password_hash('새비밀번호', PASSWORD_BCRYPT, ['cost'=>12]);
\$pdo->prepare('UPDATE users SET password_hash=? WHERE email=?')->execute([\$hash, 'admin@homepage.local']);
echo 'OK';
"
```

---

## 5. API 동작 확인

### 로그인 및 토큰 발급

```bash
curl -s -X POST http://localhost:8000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@homepage.local","password":"Admin1234!"}'
```

응답 예시:
```json
{
  "success": true,
  "data": {
    "token": "eyJ0eXAiOiJKV1Qi...",
    "user": { "id": 1, "email": "admin@homepage.local", "role": "admin" }
  }
}
```

### 토큰으로 API 호출

```bash
TOKEN="위에서_받은_token_값"

# 내 정보
curl http://localhost:8000/api/auth/me -H "Authorization: Bearer $TOKEN"

# 대시보드 통계
curl http://localhost:8000/api/admin/stats -H "Authorization: Bearer $TOKEN"

# 게시판 목록
curl http://localhost:8000/api/boards -H "Authorization: Bearer $TOKEN"

# 페이지 목록
curl http://localhost:8000/api/pages -H "Authorization: Bearer $TOKEN"

# 사이트 설정
curl http://localhost:8000/api/site-settings -H "Authorization: Bearer $TOKEN"
```

### 주요 API 엔드포인트 목록

| 메서드 | 경로 | 설명 | 권한 |
|--------|------|------|------|
| POST | `/api/auth/login` | 로그인 | 없음 |
| GET | `/api/auth/me` | 내 정보 | 로그인 |
| GET | `/api/admin/stats` | 대시보드 통계 | 관리자 |
| GET | `/api/pages` | 페이지 목록 | 로그인 |
| POST | `/api/pages` | 페이지 생성 | 관리자 |
| GET | `/api/boards` | 게시판 목록 | 로그인 |
| GET | `/api/users` | 회원 목록 | 관리자 |
| GET | `/api/site-settings` | 사이트 설정 조회 | 로그인 |
| PUT | `/api/site-settings` | 사이트 설정 수정 | 관리자 |
| POST | `/api/media/upload` | 파일 업로드 | 관리자 |

---

## 6. 자주 발생하는 문제 해결

### 문제 1: `vendor/autoload.php` 없음

```
Fatal error: require_once(...vendor/autoload.php): Failed to open stream
```

**원인**: Docker 볼륨 마운트(`./backend:/var/www/backend`)가 컨테이너 빌드 결과를 덮어씁니다.

**해결**:
```bash
docker exec homepage_php composer install --no-dev --optimize-autoloader
```

재발 방지를 위해 로컬에서 미리 설치:
```bash
cd backend && composer install --no-dev
```

---

### 문제 2: `Class "App\Config\Database" not found`

**원인**: `composer.json`의 autoload가 `App\\` → `src/`로 설정되어 있는데, `src/Config/Database.php`가 없는 경우.

**해결**:
```bash
# src/Config/ 디렉토리 생성
mkdir -p backend/src/Config

# config/database.php를 src/Config/Database.php로 복사
cp backend/config/database.php backend/src/Config/Database.php

# autoload 재생성
docker exec homepage_php composer dump-autoload -o
```

---

### 문제 3: 로그인 실패 — "이메일 또는 비밀번호가 올바르지 않습니다"

**원인**: 시드 파일의 bcrypt 해시가 실제 비밀번호와 불일치할 수 있습니다.

**해결**: [비밀번호 변경 방법](#비밀번호-변경-방법) 참고하여 해시를 직접 갱신합니다.

---

### 문제 4: `DB_HOST=localhost` 설정 오류

```
데이터베이스 연결에 실패했습니다: SQLSTATE[HY000] [2002] Connection refused
```

**원인**: `backend/.env`의 `DB_HOST`가 `localhost`로 되어 있습니다. Docker 네트워크 내에서는 서비스명을 사용해야 합니다.

**해결**: `backend/.env`에서 수정:
```dotenv
DB_HOST=mysql   # localhost가 아닌 mysql
```

---

### 문제 5: Docker Desktop이 실행되지 않음

```
error during connect: open //./pipe/dockerDesktopLinuxEngine: The system cannot find the file specified.
```

**해결**: Docker Desktop을 먼저 시작한 후 컨테이너를 실행합니다.
트레이 아이콘에 고래 아이콘이 나타나면 준비 완료입니다.

---

### 문제 6: MySQL 초기 데이터가 없음

Docker MySQL은 **볼륨이 이미 존재하면** `docker-entrypoint-initdb.d` SQL을 다시 실행하지 않습니다.

**해결**: 볼륨을 삭제하고 재실행합니다.
```bash
docker-compose down -v   # 볼륨 포함 삭제 (데이터 전부 초기화)
docker-compose up -d
```

---

## 7. 데이터 관리

### DB 직접 접속

```bash
docker exec -it homepage_mysql mysql -uhomepage_user -phomepage_password homepage_builder
```

### DB 백업

```bash
docker exec homepage_mysql mysqldump -uhomepage_user -phomepage_password homepage_builder > backup_$(date +%Y%m%d).sql
```

### DB 복원

```bash
docker exec -i homepage_mysql mysql -uhomepage_user -phomepage_password homepage_builder < backup_20260328.sql
```

### 업로드 파일 위치

```
backend/public/uploads/   ← 이미지/파일 업로드 저장 위치
```

---

## 8. 컨테이너 관리 명령어

```bash
# 실행 중인 컨테이너 상태 확인
docker-compose ps

# PHP 컨테이너 로그 실시간 확인
docker-compose logs -f php

# Nginx 접근 로그
docker-compose logs -f nginx

# MySQL 로그
docker-compose logs -f mysql

# PHP 컨테이너 내부 접속 (셸)
docker exec -it homepage_php sh

# MySQL 컨테이너 내부 접속
docker exec -it homepage_mysql sh

# 컨테이너 재시작 (단일)
docker-compose restart php

# 전체 종료 (데이터 유지)
docker-compose down

# 전체 초기화 (데이터 포함 삭제)
docker-compose down -v
```

---

## 서비스 URL 요약

| 서비스 | URL |
|--------|-----|
| 관리자 앱 | http://localhost:3000 |
| 공개 사이트 | http://localhost:8000 |
| API | http://localhost:8000/api |
| MySQL | localhost:3306 |
