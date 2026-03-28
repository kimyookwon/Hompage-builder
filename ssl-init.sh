#!/bin/bash
# ─────────────────────────────────────────────────────────────────────────────
# ssl-init.sh — Let's Encrypt SSL 인증서 최초 발급 스크립트
#
# 사용법:
#   1. nginx.prod.conf에서 server_name을 실제 도메인으로 변경
#   2. .env.prod 파일 준비
#   3. ./ssl-init.sh your-domain.com admin@your-domain.com
# ─────────────────────────────────────────────────────────────────────────────
set -euo pipefail

DOMAIN="${1:-}"
EMAIL="${2:-}"

if [ -z "$DOMAIN" ] || [ -z "$EMAIL" ]; then
  echo "사용법: ./ssl-init.sh <도메인> <이메일>"
  echo "예시:   ./ssl-init.sh example.com admin@example.com"
  exit 1
fi

echo "=== SSL 인증서 발급: $DOMAIN ==="

# ── Step 1: nginx.prod.conf 도메인 치환 ────────────────────────────────────
echo "[1/4] nginx.prod.conf 도메인 설정..."
sed -i "s/your-domain\.com/$DOMAIN/g" nginx.prod.conf
echo "  server_name → $DOMAIN www.$DOMAIN"

# ── Step 2: HTTP only 임시 Nginx 실행 (Certbot 인증용) ─────────────────────
echo "[2/4] HTTP 모드로 Nginx 임시 기동..."
# SSL 없이 80 포트만 사용하는 임시 설정
cat > /tmp/nginx-init.conf << EOF
server {
  listen 80;
  server_name $DOMAIN www.$DOMAIN;
  location /.well-known/acme-challenge/ {
    root /var/www/certbot;
  }
  location / {
    return 200 'SSL init in progress';
    add_header Content-Type text/plain;
  }
}
EOF

docker run -d --name nginx-init \
  -p 80:80 \
  -v /tmp/nginx-init.conf:/etc/nginx/conf.d/default.conf \
  -v certbot-www:/var/www/certbot \
  nginx:1.25-alpine

# ── Step 3: Certbot 인증서 발급 ────────────────────────────────────────────
echo "[3/4] Certbot 인증서 발급..."
docker run --rm \
  -v certbot-conf:/etc/letsencrypt \
  -v certbot-www:/var/www/certbot \
  certbot/certbot certonly \
    --webroot \
    --webroot-path=/var/www/certbot \
    --email "$EMAIL" \
    --agree-tos \
    --no-eff-email \
    -d "$DOMAIN" \
    -d "www.$DOMAIN"

# 임시 Nginx 중지
docker stop nginx-init && docker rm nginx-init

# ── Step 4: 프로덕션 스택 실행 ─────────────────────────────────────────────
echo "[4/4] 프로덕션 스택 시작..."
docker compose -f docker-compose.prod.yml up -d

echo ""
echo "=== 완료 ==="
echo "  https://$DOMAIN 에서 확인하세요."
echo "  인증서 자동 갱신: Certbot 컨테이너가 12시간마다 갱신 시도합니다."
