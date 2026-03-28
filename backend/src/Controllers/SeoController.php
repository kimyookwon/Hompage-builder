<?php

namespace App\Controllers;

use App\Config\Database;

class SeoController {
  // GET /sitemap.xml — 공개 페이지 + 게시글 기반 사이트맵 동적 생성
  public function sitemap(): void {
    $pdo = Database::getInstance();

    // 사이트 기본 URL
    $settingsRow = $pdo->query('SELECT site_url FROM site_settings WHERE id = 1')->fetch();
    $baseUrl = rtrim($settingsRow['site_url'] ?? '', '/');
    if ($baseUrl === '') {
      // 요청 호스트 기반 추론 (site_url 미설정 시)
      $proto   = (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off') ? 'https' : 'http';
      $host    = $_SERVER['HTTP_HOST'] ?? 'localhost';
      $baseUrl = "{$proto}://{$host}";
    }

    $urls = [];

    // ① 공개된 페이지 (slug 기반)
    $pages = $pdo->query(
      "SELECT slug, updated_at FROM pages WHERE is_published = 1 ORDER BY updated_at DESC"
    )->fetchAll();
    foreach ($pages as $page) {
      $urls[] = [
        'loc'     => "{$baseUrl}/p/" . rawurlencode($page['slug']),
        'lastmod' => substr($page['updated_at'], 0, 10),
        'priority' => '0.8',
      ];
    }

    // ② 공개 게시판의 게시글 (read_permission = 'public')
    $posts = $pdo->query(
      "SELECT p.id, p.updated_at
       FROM posts p
       JOIN boards b ON b.id = p.board_id
       WHERE b.read_permission = 'public'
       ORDER BY p.updated_at DESC
       LIMIT 1000"
    )->fetchAll();
    foreach ($posts as $post) {
      $urls[] = [
        'loc'      => "{$baseUrl}/b/" . (int) $post['id'],
        'lastmod'  => substr($post['updated_at'], 0, 10),
        'priority' => '0.6',
      ];
    }

    // ③ 게시판 목록 페이지 (read_permission = 'public')
    $boards = $pdo->query(
      "SELECT id, updated_at FROM boards WHERE read_permission = 'public' ORDER BY sort_order"
    )->fetchAll();
    foreach ($boards as $board) {
      $urls[] = [
        'loc'      => "{$baseUrl}/boards",
        'lastmod'  => substr($board['updated_at'] ?? date('Y-m-d'), 0, 10),
        'priority' => '0.5',
      ];
      break; // /boards 는 단일 URL
    }

    // XML 출력
    header('Content-Type: application/xml; charset=UTF-8');
    header('X-Robots-Tag: noindex');
    echo '<?xml version="1.0" encoding="UTF-8"?>' . "\n";
    echo '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">' . "\n";
    // 홈 페이지
    echo self::urlEntry("{$baseUrl}/", date('Y-m-d'), '1.0');
    foreach ($urls as $url) {
      echo self::urlEntry($url['loc'], $url['lastmod'], $url['priority']);
    }
    echo '</urlset>';
  }

  // GET /robots.txt — 커스텀 또는 기본 robots.txt
  public function robots(): void {
    $pdo = Database::getInstance();
    $row = $pdo->query('SELECT robots_txt, site_url FROM site_settings WHERE id = 1')->fetch();

    $proto   = (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off') ? 'https' : 'http';
    $host    = $_SERVER['HTTP_HOST'] ?? 'localhost';
    $baseUrl = rtrim($row['site_url'] ?? "{$proto}://{$host}", '/');

    $custom = trim($row['robots_txt'] ?? '');
    if ($custom !== '') {
      $content = $custom;
    } else {
      $content = "User-agent: *\nAllow: /\nDisallow: /api/\nDisallow: /admin\n\nSitemap: {$baseUrl}/sitemap.xml";
    }

    header('Content-Type: text/plain; charset=UTF-8');
    echo $content;
  }

  private static function urlEntry(string $loc, string $lastmod, string $priority): string {
    $loc = htmlspecialchars($loc, ENT_XML1 | ENT_QUOTES, 'UTF-8');
    return "  <url>\n"
      . "    <loc>{$loc}</loc>\n"
      . "    <lastmod>{$lastmod}</lastmod>\n"
      . "    <priority>{$priority}</priority>\n"
      . "  </url>\n";
  }
}
