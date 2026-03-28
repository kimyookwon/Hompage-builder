# 배포 가이드

## 사전 요구사항

| 항목 | 버전 |
|------|------|
| Docker | 24.0+ |
| Docker Compose | v2.20+ |
| Git | 2.x |
| 도메인 | A 레코드 → 서버 IP |

---

## 1. 서버 초기 설정

```bash
# 코드 클론
git clone https://github.com/your-org/homepage-builder.git /srv/homepage
cd /srv/homepage

# 환경 변수 설정
cp .env.prod.example .env.prod
cp admin/.env.prod.example admin/.env.prod

# 필수 값 수정 (아래 항목)
nano .env.prod
```

### `.env.prod` 필수 수정 항목

```env
APP_URL=https://your-domain.com
DB_PASSWORD=강한비밀번호
MYSQL_ROOT_PASSWORD=루트비밀번호
JWT_SECRET=openssl rand -base64 48 으로 생성한 값
ALLOWED_ORIGINS=https://your-domain.com
```

### `admin/.env.prod` 필수 수정 항목

```env
NEXT_PUBLIC_API_URL=https://your-domain.com/api
NEXT_PUBLIC_SITE_URL=https://your-domain.com
```

---

## 2. SSL 인증서 발급 (최초 1회)

```bash
chmod +x ssl-init.sh
./ssl-init.sh your-domain.com admin@your-domain.com
```

이후 Certbot 컨테이너가 12시간마다 자동 갱신합니다.

---

## 3. GitHub Actions CI/CD 설정

### 필요한 GitHub Secrets

저장소 **Settings → Secrets and variables → Actions**에서 추가:

| Secret 이름 | 설명 | 예시 |
|-------------|------|------|
| `DEPLOY_HOST` | 서버 IP 또는 도메인 | `192.168.1.1` |
| `DEPLOY_USER` | SSH 사용자명 | `ubuntu` |
| `DEPLOY_SSH_KEY` | SSH 개인키 (PEM 전체) | `-----BEGIN OPENSSH...` |
| `DEPLOY_PORT` | SSH 포트 (기본 22) | `22` |
| `DEPLOY_PATH` | 코드 경로 | `/srv/homepage` |
| `NEXT_PUBLIC_API_URL` | API URL | `https://example.com/api` |
| `NEXT_PUBLIC_SITE_URL` | 사이트 URL | `https://example.com` |

### SSH 키 생성

```bash
# 배포 전용 키쌍 생성
ssh-keygen -t ed25519 -C "github-actions-deploy" -f ~/.ssh/deploy_key -N ""

# 공개키를 서버에 등록
cat ~/.ssh/deploy_key.pub >> ~/.ssh/authorized_keys

# 개인키를 GitHub Secret DEPLOY_SSH_KEY에 등록
cat ~/.ssh/deploy_key
```

### 파이프라인 흐름

```
push to main
    │
    ▼
[CI] php-test + nextjs-build + e2e-test
    │  (모두 통과 시)
    ▼
[CD] SSH 접속 → git pull → docker build → docker up → migrate
```

---

## 4. 수동 배포

```bash
# 전체 배포
./deploy.sh

# 빌드 없이 재시작만
./deploy.sh --skip-build

# 마이그레이션 없이 배포
./deploy.sh --skip-migrate
```

---

## 5. 운영 명령어

```bash
# 컨테이너 상태 확인
docker compose -f docker-compose.prod.yml ps

# 로그 확인
docker logs homepage_php    --tail 100 -f
docker logs homepage_nginx  --tail 100 -f
docker logs homepage_admin  --tail 100 -f
docker logs homepage_mysql  --tail 100 -f

# DB 접속
docker compose -f docker-compose.prod.yml exec mysql \
  mysql -u homepage_user -p homepage_builder

# PHP 컨테이너 접속
docker compose -f docker-compose.prod.yml exec php sh

# 마이그레이션만 실행
docker compose -f docker-compose.prod.yml exec php php database/migrate.php
```

---

## 6. 배포 체크리스트

### 최초 배포

- [ ] 도메인 A 레코드 서버 IP로 설정
- [ ] `.env.prod` 모든 필수값 입력
- [ ] `admin/.env.prod` 입력
- [ ] `ssl-init.sh` 실행 → SSL 인증서 발급 확인
- [ ] `https://your-domain.com/api/health` 응답 확인
- [ ] 관리자 계정 생성 확인
- [ ] GitHub Secrets 7개 등록

### 운영 중 배포 (CI/CD)

- [ ] main 브랜치에 push → CI 통과 확인 (GitHub Actions)
- [ ] CD 워크플로우 자동 실행 확인
- [ ] `/api/health` 응답 확인
- [ ] 주요 기능 스모크 테스트 (로그인, 게시글 작성)

### 장애 대응

```bash
# 컨테이너 재시작
docker compose -f docker-compose.prod.yml restart php

# 전체 재시작
docker compose -f docker-compose.prod.yml down && \
docker compose -f docker-compose.prod.yml up -d

# 이전 이미지로 롤백
git log --oneline -5          # 되돌릴 커밋 확인
git checkout <commit-hash>    # 코드 롤백
./deploy.sh --skip-migrate    # 재배포
```
