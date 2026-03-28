<?php

namespace App\Controllers;

use App\Config\Database;

class RssController {
  // GET /b/{boardId}/feed.rss — 게시판 RSS 2.0 피드
  public function boardFeed(string $boardId): void {
    $pdo = Database::getInstance();

    // 게시판 조회 (공개만)
    $boardStmt = $pdo->prepare(
      "SELECT id, name, description FROM boards
       WHERE id = ? AND read_permission = 'public'"
    );
    $boardStmt->execute([(int) $boardId]);
    $board = $boardStmt->fetch();

    if (!$board) {
      http_response_code(404);
      echo '<?xml version="1.0"?><error>Board not found</error>';
      return;
    }

    // 사이트 설정
    $settings = $pdo->query('SELECT site_url, site_name FROM site_settings WHERE id = 1')->fetch();
    $proto    = (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off') ? 'https' : 'http';
    $host     = $_SERVER['HTTP_HOST'] ?? 'localhost';
    $baseUrl  = rtrim($settings['site_url'] ?? "{$proto}://{$host}", '/');
    $siteName = $settings['site_name'] ?? '홈페이지';

    // 최근 게시글 20개
    $postStmt = $pdo->prepare(
      "SELECT p.id, p.title, p.content, p.created_at, u.name AS author_name
       FROM posts p
       JOIN users u ON u.id = p.author_id
       WHERE p.board_id = ?
       ORDER BY p.created_at DESC
       LIMIT 20"
    );
    $postStmt->execute([(int) $boardId]);
    $posts = $postStmt->fetchAll();

    $boardUrl  = "{$baseUrl}/b/{$boardId}";
    $boardName = htmlspecialchars($board['name'], ENT_XML1, 'UTF-8');
    $boardDesc = htmlspecialchars($board['description'] ?? $board['name'], ENT_XML1, 'UTF-8');
    $siteNameX = htmlspecialchars($siteName, ENT_XML1, 'UTF-8');
    $buildDate = date('r');

    header('Content-Type: application/rss+xml; charset=UTF-8');
    echo '<?xml version="1.0" encoding="UTF-8"?>' . "\n";
    echo '<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">' . "\n";
    echo "<channel>\n";
    echo "  <title>{$boardName} — {$siteNameX}</title>\n";
    echo "  <link>{$boardUrl}</link>\n";
    echo "  <description>{$boardDesc}</description>\n";
    echo "  <language>ko</language>\n";
    echo "  <lastBuildDate>{$buildDate}</lastBuildDate>\n";
    echo '  <atom:link href="' . htmlspecialchars("{$baseUrl}/b/{$boardId}/feed.rss", ENT_XML1, 'UTF-8') . '" rel="self" type="application/rss+xml"/>' . "\n";

    foreach ($posts as $post) {
      $postUrl   = "{$baseUrl}/b/{$boardId}/{$post['id']}";
      $title     = htmlspecialchars($post['title'], ENT_XML1, 'UTF-8');
      $author    = htmlspecialchars($post['author_name'], ENT_XML1, 'UTF-8');
      $pubDate   = date('r', strtotime($post['created_at']));
      // 본문 미리보기 — 마크다운 이미지/URL 제거 후 200자
      $excerpt   = self::makeExcerpt($post['content'], 200);
      $desc      = htmlspecialchars($excerpt, ENT_XML1, 'UTF-8');

      echo "  <item>\n";
      echo "    <title>{$title}</title>\n";
      echo "    <link>{$postUrl}</link>\n";
      echo "    <guid isPermaLink=\"true\">{$postUrl}</guid>\n";
      echo "    <pubDate>{$pubDate}</pubDate>\n";
      echo "    <author>{$author}</author>\n";
      echo "    <description>{$desc}</description>\n";
      echo "  </item>\n";
    }

    echo "</channel>\n</rss>";
  }

  private static function makeExcerpt(string $text, int $maxLen): string {
    $clean = preg_replace('/!\[[^\]]*\]\([^\)]*\)/', '', $text);   // 이미지 태그 제거
    $clean = preg_replace('/https?:\/\/\S+/', '', $clean ?? $text); // URL 제거
    $clean = preg_replace('/[#*`>_~\[\]]+/', '', $clean ?? '');     // 마크다운 기호 제거
    $clean = preg_replace('/\s+/', ' ', trim($clean ?? ''));
    return mb_substr($clean, 0, $maxLen) . (mb_strlen($clean) > $maxLen ? '...' : '');
  }
}
