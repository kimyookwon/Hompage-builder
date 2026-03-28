# DEPLOY.md

배포 가이드 — Homepage Builder

## 목차

1. [사전 요구사항](#사전-요구사항)
2. [개발 환경](#개발-환경)
3. [프로덕션 배포 (Docker)](#프로덕션-배포-docker)
4. [HTTPS 설정](#https-설정)
5. [DB 마이그레이션](#db-마이그레이션)
6. [프로덕션 체크리스트](#프로덕션-체크리스트)
7. [업데이트 방법](#업데이트-방법)
8. [DB 백업 및 복구](#db-백업-및-복구)

---

## 사전 요구사항

| 항목 | 최소 버전 |
|------|-----------|
| Docker | 24.x |
| Docker Compose | 2.x |
| 서버 RAM | 2GB |
| 디스크 | 20GB |

---

## 개발 환경

```bash
# 저장소 클론
git clone https://github.com/kimyookwon/Hompage-builder.git
cd Hompage-builder

# 백엔드 환경 변수 (기본값으로 동작)
cp backend/.env.example backend/.env

# Docker 실행
docker compose up -d

# DB 마이그레이션
docker compose exec php php /var/www/backend/database/migrate.php

# Next.js 어드민 개발 서버
cd admin && cp .env.local.example .env.local && npm install && npm run dev
# http://localhost:3000
```

초기 계정: `admin@homepage.local` / `Admin1234!`

---

## 프로덕션 배포 (Docker)

### 1. 저장소 클론

```bash
git clone https://github.com/kimyookwon/Hompage-builder.git
cd Hompage-builder
```

### 2. 환경 변수 설정

```bash
# 백엔드
cp .env.prod.example .env.prod
vi .env.prod   # DB_PASSWORD, JWT_SECRET, APP_URL, ALLOWED_ORIGINS 필수 변경

# Next.js 어드민
cp admin/.env.prod.example admin/.env.prod
vi admin/.env.prod   # NEXT_PUBLIC_API_URL, NEXT_PUBLIC_SITE_URL 도메인 변경
```

**JWT_SECRET 생성:**
```bash
openssl rand -base64 48
```

### 3. nginx.prod.conf 도메인 수정

```bash
sed -i 's/your-domain.com/실제도메인.com/g' nginx.prod.conf
```

### 4. 컨테이너 빌드 및 실행

```bash
docker compose -f docker-compose.prod.yml up -d --build
```

### 5. DB 마이그레이션

```bash
docker compose -f docker-compose.prod.yml exec php \
  php /var/www/backend/database/migrate.php
```

### 6. 동작 확인

```bash
curl https://실제도메인.com/api/site-settings
# {"success":true,"data":{...}} 응답 확인
```

---

## HTTPS 설정

### Let's Encrypt 최초 발급

```bash
# 1. HTTP 전용 nginx 먼저 실행 (인증서 발급용)
docker compose -f docker-compose.prod.yml up -d nginx certbot

# 2. 인증서 발급
docker compose -f docker-compose.prod.yml run --rm certbot \
  certonly --webroot --webroot-path=/var/www/certbot \
  -d 실제도메인.com -d www.실제도메인.com \
  --email your@email.com --agree-tos --no-eff-email

# 3. 전체 재시작
docker compose -f docker-compose.prod.yml restart nginx
```

### 자동 갱신

Certbot 컨테이너가 12시간마다 자동 갱신합니다 (`docker-compose.prod.yml` 포함).

---

## DB 마이그레이션

마이그레이션 스크립트는 `database/migrations/` SQL 파일을 번호 순서대로 실행합니다.

```bash
# 개발 환경
docker compose exec php php /var/www/backend/database/migrate.php

# 프로덕션 환경
docker compose -f docker-compose.prod.yml exec php \
  php /var/www/backend/database/migrate.php
```

초기 어드민 계정:
- Email: `admin@homepage.local`
- Password: `Admin1234!` → **반드시 변경**

---

## 프로덕션 체크리스트

- [ ] `APP_DEBUG=false` 설정
- [ ] `JWT_SECRET` 강력한 랜덤 값 (48자+)
- [ ] `DB_PASSWORD` / `MYSQL_ROOT_PASSWORD` 변경
- [ ] 초기 어드민 비밀번호 변경
- [ ] HTTPS 인증서 발급 완료
- [ ] `ALLOWED_ORIGINS` 실제 도메인으로 제한
- [ ] `nginx.prod.conf` 도메인 변경
- [ ] 업로드 볼륨 백업 설정
- [ ] 로그 로테이션 설정

---

## 업데이트 방법

```bash
git pull origin main

# 컨테이너 재빌드
docker compose -f docker-compose.prod.yml up -d --build

# 신규 마이그레이션 적용
docker compose -f docker-compose.prod.yml exec php \
  php /var/www/backend/database/migrate.php
```

---

## DB 백업 및 복구

### 백업

```bash
# 개발 환경
docker compose exec mysql \
  mysqldump -u homepage_user -phomepage_password homepage_builder \
  > backup_$(date +%Y%m%d_%H%M%S).sql

# 프로덕션 환경 (크론 등록 권장: 매일 새벽 2시)
docker compose -f docker-compose.prod.yml exec mysql \
  mysqldump -u${DB_USERNAME} -p${DB_PASSWORD} ${DB_DATABASE} \
  > /backups/backup_$(date +%Y%m%d_%H%M%S).sql
```

### 복구

```bash
docker compose -f docker-compose.prod.yml exec -T mysql \
  mysql -u${DB_USERNAME} -p${DB_PASSWORD} ${DB_DATABASE} \
  < backup_20260101_020000.sql
```

### 자동 백업 크론 (서버)

```bash
# crontab -e
0 2 * * * cd /path/to/Hompage-builder && \
  docker compose -f docker-compose.prod.yml exec -T mysql \
  mysqldump -uhomepage_user -pPASSWORD homepage_builder \
  > /backups/db_$(date +\%Y\%m\%d).sql && \
  find /backups -name "db_*.sql" -mtime +30 -delete
```
