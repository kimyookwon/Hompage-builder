<?php

namespace App\Controllers;

use App\Config\Database;
use App\Models\SiteSettings;
use App\Utils\ResponseHelper;

// OG 메타태그 정보 제공 컨트롤러
class OgController {
  // GET /api/og?url=/b/{boardId}/{postId} -- OG 메타 정보 반환
  public function index(): void {
    try {
      $url = trim($_GET['url'] ?? '');

      if (empty($url)) {
        $this->defaultOg($url);
        return;
      }

      // URL에서 boardId, postId 파싱
      if (!preg_match('#^/b/(\d+)/(\d+)#', $url, $matches)) {
        $this->defaultOg($url);
        return;
      }

      $boardId = (int) $matches[1];
      $postId  = (int) $matches[2];

      $pdo = Database::getInstance();

      // 게시글 + 작성자 + 게시판 JOIN 조회
      $stmt = $pdo->prepare(
        'SELECT p.id, p.title, p.content, p.thumbnail_url, p.created_at,
                u.name AS author_name,
                b.id AS board_id, b.name AS board_name, b.read_permission
         FROM posts p
         JOIN users u ON u.id = p.author_id
         JOIN boards b ON b.id = p.board_id
         WHERE p.id = ? AND p.board_id = ?'
      );
      $stmt->execute([$postId, $boardId]);
      $post = $stmt->fetch();

      // 게시글 없거나 비공개 게시판 -> 기본 OG
      if (!$post || $post['read_permission'] === 'admin_only') {
        $this->defaultOg($url);
        return;
      }

      // 사이트명 조회
      $settings = SiteSettings::get();
      $siteName = $settings['site_name'] ?? '홈페이지';

      // 본문에서 HTML 태그 제거 후 앞 160자 추출
      $plainContent = strip_tags($post['content'] ?? '');
      $description  = mb_strlen($plainContent) > 160
        ? mb_substr($plainContent, 0, 160) . '...'
        : $plainContent;

      // 첨부 이미지 조회 (첫 번째 이미지)
      $image = $post['thumbnail_url'] ?? null;
      if (!$image) {
        $imgStmt = $pdo->prepare(
          'SELECT file_url FROM post_attachments
           WHERE post_id = ? AND mime_type LIKE ?
           ORDER BY id ASC LIMIT 1'
        );
        $imgStmt->execute([$postId, 'image/%']);
        $imgRow = $imgStmt->fetch();
        $image  = $imgRow['file_url'] ?? null;
      }

      // ISO 8601 형식 변환
      $publishedAt = $post['created_at']
        ? date('c', strtotime($post['created_at']))
        : null;

      ResponseHelper::success([
        'title'       => "{$post['title']} | {$post['board_name']}",
        'description' => $description,
        'image'       => $image,
        'url'         => "/b/{$boardId}/{$postId}",
        'type'        => 'article',
        'site_name'   => $siteName,
        'author'      => $post['author_name'],
        'published_at' => $publishedAt,
      ]);
    } catch (\Throwable $e) {
      ResponseHelper::error('OG 정보 조회에 실패했습니다.', 500);
    }
  }

  // 기본 사이트 OG 반환 (게시글이 없거나 비공개)
  private function defaultOg(string $url): void {
    $settings = SiteSettings::get();
    $siteName = $settings['site_name'] ?? '홈페이지';

    ResponseHelper::success([
      'title'       => $siteName,
      'description' => $siteName,
      'image'       => $settings['logo_url'] ?? null,
      'url'         => $url ?: '/',
      'type'        => 'website',
      'site_name'   => $siteName,
      'author'      => null,
      'published_at' => null,
    ]);
  }
}
