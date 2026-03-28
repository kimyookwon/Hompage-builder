<?php

/**
 * 공개 홈페이지 렌더러
 * Nginx에서 /api/* 외의 모든 요청을 이 파일로 라우팅
 */

define('BASE_PATH', dirname(__DIR__));

require BASE_PATH . '/vendor/autoload.php';

use Dotenv\Dotenv;

$dotenv = Dotenv::createImmutable(BASE_PATH);
$dotenv->safeLoad();

// 다크 모드 플리커 방지를 위해 Content-Type만 미리 설정
header('Content-Type: text/html; charset=UTF-8');

require BASE_PATH . '/config/database.php';

use App\Models\Page;
use App\Models\PageSection;
use App\Models\SiteSettings;
use App\Services\PageCacheService;

// 사이트 설정 로드
$settings = SiteSettings::get() ?? [];

// URI에서 슬러그 추출
$uri  = parse_url($_SERVER['REQUEST_URI'] ?? '/', PHP_URL_PATH);
$slug = trim($uri ?? '', '/');

// 루트(/) 접근 시 home_slug 설정으로 리다이렉트
if ($slug === '') {
  $homeSlug = $settings['home_slug'] ?? '';
  $slug = ($homeSlug !== '' && $homeSlug !== null) ? $homeSlug : 'home';
  // home_slug가 명시적으로 설정된 경우에만 301 리다이렉트
  if ($homeSlug !== '' && $homeSlug !== null) {
    header('Location: /' . ltrim($homeSlug, '/'), true, 301);
    exit;
  }
}

// 페이지 조회 (공개된 페이지만)
$page = Page::findBySlug($slug);

if (!$page || !$page['is_published']) {
  http_response_code(404);
  $pageTitle = '404 - 페이지를 찾을 수 없습니다';
  $sections  = [];
  include BASE_PATH . '/public/views/layout.php';
  exit;
}

// ── 페이지 캐시 확인 ─────────────────────────────────────
$cached = PageCacheService::get($slug);
if ($cached !== null) {
  echo $cached;
  exit;
}

// 섹션 로드 및 정렬
$rawSections = PageSection::findByPage((int) $page['id']);
$sections = array_map(function (array $s): array {
  $s['content'] = is_string($s['content'])
    ? (json_decode($s['content'], true) ?? [])
    : ($s['content'] ?? []);
  return $s;
}, $rawSections);

usort($sections, static fn($a, $b) => (int) $a['order'] <=> (int) $b['order']);

$pageTitle = $page['title'];

// 출력 버퍼링으로 캐시 저장
ob_start();
include BASE_PATH . '/public/views/layout.php';
$html = ob_get_clean();
PageCacheService::set($slug, $html);
echo $html;
