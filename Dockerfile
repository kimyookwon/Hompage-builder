FROM php:8.2-fpm-alpine

# 시스템 의존성 설치
RUN apk add --no-cache \
  curl \
  libpng-dev \
  libjpeg-turbo-dev \
  libwebp-dev \
  oniguruma-dev \
  libxml2-dev \
  zip \
  unzip

# GD — JPEG + WebP 지원 명시적 설정
RUN docker-php-ext-configure gd \
  --with-jpeg=/usr/include \
  --with-webp=/usr/include

# PHP 확장 설치
RUN docker-php-ext-install \
  pdo \
  pdo_mysql \
  mbstring \
  exif \
  pcntl \
  bcmath \
  gd

# OPcache 확장 설치
RUN docker-php-ext-install opcache

# OPcache + FPM pool 설정 복사
COPY docker/php/opcache.ini /usr/local/etc/php/conf.d/opcache.ini
COPY docker/php/www.conf /usr/local/etc/php-fpm.d/www.conf

# FPM 슬로 로그 디렉토리
RUN mkdir -p /var/log/php-fpm

# Composer 설치
COPY --from=composer:2.7 /usr/bin/composer /usr/bin/composer

# 작업 디렉토리 설정
WORKDIR /var/www/backend

# Composer 의존성 설치 (캐시 최적화)
COPY backend/composer.json backend/composer.lock* ./
RUN composer install --no-dev --optimize-autoloader --no-interaction 2>/dev/null || \
    composer install --no-dev --optimize-autoloader --no-interaction

# 소스 코드 복사
COPY backend/ .

# 로그 디렉토리 생성 및 권한 설정
RUN mkdir -p /var/www/backend/logs \
  && mkdir -p /var/www/backend/public/uploads \
  && chown -R www-data:www-data /var/www/backend \
  && chmod -R 755 /var/www/backend \
  && chmod -R 775 /var/www/backend/logs \
  && chmod -R 775 /var/www/backend/public/uploads

USER www-data

EXPOSE 9000
