# DEPLOY.md

배포 가이드 — Homepage Builder

## 목차

1. [사전 요구사항](#사전-요구사항)
2. [Docker Compose 배포](#docker-compose-배포)
3. [환경 변수 설정](#환경-변수-설정)
4. [DB 마이그레이션](#db-마이그레이션)
5. [어드민 앱 빌드 및 배포](#어드민-앱-빌드-및-배포)
6. [프로덕션 체크리스트](#프로덕션-체크리스트)
7. [업데이트 방법](#업데이트-방법)

---

## 사전 요구사항

| 항목 | 최소 버전 |
|------|-----------|
| Docker | 24.x |
| Docker Compose | 2.x |
| Node.js (어드민 빌드 시) | 20.x |
| 서버 RAM | 1GB |

---

## Docker Compose 배포

### 1. 저장소 클론

```bash
git clone <repo-url> homepage-builder
cd homepage-builder
```

### 2. 환경 변수 설정

```bash
cp backend/.env.example backend/.env
# 아래 "환경 변수 설정" 섹션 참고하여 .env 편집
```

### 3. 컨테이너 실행

```bash
docker compose up -d --build
```

### 4. DB 마이그레이션

```bash
docker compose exec php php /var/www/database/migrate.php
```

### 5. 동작 확인

```bash
curl http://localhost/api/settings
# {"success":true,"data":{...}} 응답 확인
```

---

## 환경 변수 설정

`backend/.env` 필수 항목:

```dotenv
# 데이터베이스
DB_HOST=mysql
DB_PORT=3306
DB_NAME=homepage_db
DB_USER=homepage_user
DB_PASS=<강력한_비밀번호>

# JWT
JWT_SECRET=<최소_32자_랜덤_문자열>
JWT_EXPIRY=86400

# 앱 모드 (프로덕션에서는 false)
APP_DEBUG=false

# CORS (어드민/공개 도메인 콤마 구분)
ALLOWED_ORIGINS=https://admin.yourdomain.com,https://yourdomain.com

# OAuth (선택)
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
KAKAO_CLIENT_ID=
KAKAO_CLIENT_SECRET=
NAVER_CLIENT_ID=
NAVER_CLIENT_SECRET=
OAUTH_REDIRECT_BASE=https://yourdomain.com
```

JWT_SECRET 생성:

```bash
openssl rand -base64 48
```

---

## DB 마이그레이션

마이그레이션 스크립트는 `database/migrations/` 내 SQL 파일을 순서대로 실행합니다.

```bash
# 최초 실행 (테이블 생성 + 초기 데이터)
docker compose exec php php /var/www/database/migrate.php

# 초기 어드민 계정
# Email: admin@homepage.local
# Password: Admin1234!  (반드시 변경)
```

---

## 어드민 앱 빌드 및 배포

### 옵션 A — Vercel / Netlify

```bash
cd admin
cp .env.local.example .env.local
# NEXT_PUBLIC_API_URL=https://yourdomain.com 설정

npm install
npm run build
# Vercel: vercel deploy --prod
```

### 옵션 B — 서버 직접 배포 (PM2)

```bash
cd admin
npm install
npm run build

# PM2로 실행
npm install -g pm2
pm2 start npm --name "admin" -- start
pm2 save
pm2 startup
```

### 옵션 C — Docker 포함

`docker-compose.yml`에 admin 서비스 추가:

```yaml
admin:
  image: node:20-alpine
  working_dir: /app
  volumes:
    - ./admin:/app
  command: sh -c "npm install && npm run build && npm start"
  ports:
    - "3000:3000"
  environment:
    NEXT_PUBLIC_API_URL: http://nginx
```

---

## 프로덕션 체크리스트

- [ ] `APP_DEBUG=false` 설정
- [ ] `JWT_SECRET` 강력한 랜덤 값으로 변경
- [ ] DB 비밀번호 변경
- [ ] 초기 어드민 비밀번호 변경 (`Admin1234!` → 강력한 비밀번호)
- [ ] HTTPS 적용 (Let's Encrypt 권장)
- [ ] `ALLOWED_ORIGINS` 실제 도메인으로 제한
- [ ] Nginx `server_name` 실제 도메인으로 변경
- [ ] 업로드 디렉토리 퍼미션 확인 (`backend/public/uploads` → 755)
- [ ] 로그 로테이션 설정

### HTTPS 설정 (Certbot)

```bash
apt install certbot python3-certbot-nginx
certbot --nginx -d yourdomain.com -d admin.yourdomain.com
```

---

## 업데이트 방법

```bash
git pull origin main

# 백엔드 재빌드
docker compose up -d --build php

# 마이그레이션 실행 (신규 마이그레이션 파일이 있는 경우)
docker compose exec php php /var/www/database/migrate.php

# 어드민 앱 재빌드
cd admin && npm run build
```
