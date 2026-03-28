#!/bin/bash
# ─────────────────────────────────────────────────────────────────────────────
# deploy.sh — 프로덕션 배포 스크립트
# 사용법: ./deploy.sh [--skip-build] [--skip-migrate]
# ─────────────────────────────────────────────────────────────────────────────
set -euo pipefail

SKIP_BUILD=false
SKIP_MIGRATE=false

for arg in "$@"; do
  case $arg in
    --skip-build)   SKIP_BUILD=true ;;
    --skip-migrate) SKIP_MIGRATE=true ;;
  esac
done

# 필수 파일 확인
if [ ! -f ".env.prod" ]; then
  echo "[오류] .env.prod 파일이 없습니다. .env.prod.example 을 복사하여 설정하세요."
  exit 1
fi
if [ ! -f "admin/.env.prod" ]; then
  echo "[오류] admin/.env.prod 파일이 없습니다. admin/.env.prod.example 을 복사하여 설정하세요."
  exit 1
fi

echo "=== 홈페이지 빌더 프로덕션 배포 ==="
echo "[1/5] 최신 코드 동기화..."
git pull origin main

if [ "$SKIP_BUILD" = false ]; then
  echo "[2/5] Docker 이미지 빌드..."
  docker compose -f docker-compose.prod.yml build --no-cache
else
  echo "[2/5] 빌드 스킵"
fi

echo "[3/5] 컨테이너 재시작 (무중단)..."
docker compose -f docker-compose.prod.yml up -d --remove-orphans

echo "[4/5] 서비스 헬스체크 대기..."
RETRIES=12
until docker inspect --format='{{.State.Health.Status}}' homepage_php 2>/dev/null | grep -q "healthy"; do
  RETRIES=$((RETRIES - 1))
  if [ $RETRIES -eq 0 ]; then
    echo "[경고] PHP 컨테이너 헬스체크 타임아웃 — 로그 확인: docker logs homepage_php"
    break
  fi
  echo "  PHP 준비 대기 중... (남은 시도: $RETRIES)"
  sleep 5
done

if [ "$SKIP_MIGRATE" = false ]; then
  echo "[5/5] DB 마이그레이션 실행..."
  docker compose -f docker-compose.prod.yml exec -T php php database/migrate.php
else
  echo "[5/5] 마이그레이션 스킵"
fi

echo ""
echo "=== 배포 완료 ==="
echo "  컨테이너 상태: docker compose -f docker-compose.prod.yml ps"
echo "  PHP 로그:      docker logs homepage_php"
echo "  Nginx 로그:    docker logs homepage_nginx"
