<?php

namespace App\Controllers;

use App\Config\Database;
use App\Utils\ResponseHelper;

class SearchController {
  // GET /api/search?q=&page=&limit=
  public function index(): void {
    $q     = trim($_GET['q'] ?? '');
    $page  = max(1, (int) ($_GET['page'] ?? 1));
    $limit = min(20, max(1, (int) ($_GET['limit'] ?? 10)));

    if ($q === '') {
      ResponseHelper::success(['items' => [], 'total' => 0, 'page' => 1, 'totalPages' => 0]);
      return;
    }

    try {
      $pdo    = Database::getInstance();
      $offset = ($page - 1) * $limit;

      // FULLTEXT(ngram) 우선 시도 — 2자 미만 키워드는 LIKE 폴백
      $useFulltext = mb_strlen($q) >= 2;
      $rows  = [];
      $total = 0;

      if ($useFulltext) {
        // MATCH...AGAINST Boolean Mode: 관련성 내림차순, 최신순 보조 정렬
        $ftQuery = '"' . str_replace('"', '', $q) . '"';
        $stmt = $pdo->prepare(
          "SELECT p.id, p.title, p.content, p.created_at,
                  u.name AS author_name,
                  b.id AS board_id, b.name AS board_name,
                  (SELECT COUNT(*) FROM comments c WHERE c.post_id = p.id) AS comment_count,
                  p.view_count,
                  MATCH(p.title, p.content) AGAINST (? IN BOOLEAN MODE) AS relevance
           FROM posts p
           JOIN users u ON u.id = p.author_id
           JOIN boards b ON b.id = p.board_id
           WHERE b.read_permission IN ('public', 'user')
             AND MATCH(p.title, p.content) AGAINST (? IN BOOLEAN MODE)
           ORDER BY relevance DESC, p.created_at DESC
           LIMIT ? OFFSET ?"
        );
        $stmt->execute([$ftQuery, $ftQuery, $limit, $offset]);
        $rows = $stmt->fetchAll();

        $countStmt = $pdo->prepare(
          "SELECT COUNT(*) FROM posts p
           JOIN boards b ON b.id = p.board_id
           WHERE b.read_permission IN ('public', 'user')
             AND MATCH(p.title, p.content) AGAINST (? IN BOOLEAN MODE)"
        );
        $countStmt->execute([$ftQuery]);
        $total = (int) $countStmt->fetchColumn();

        // FULLTEXT 결과 없으면 LIKE 폴백
        if ($total === 0) {
          $useFulltext = false;
        }
      }

      if (!$useFulltext) {
        // LIKE 폴백 (짧은 키워드 또는 FULLTEXT 무결과 시)
        $like  = "%{$q}%";
        $stmt = $pdo->prepare(
          "SELECT p.id, p.title, p.content, p.created_at,
                  u.name AS author_name,
                  b.id AS board_id, b.name AS board_name,
                  (SELECT COUNT(*) FROM comments c WHERE c.post_id = p.id) AS comment_count,
                  p.view_count
           FROM posts p
           JOIN users u ON u.id = p.author_id
           JOIN boards b ON b.id = p.board_id
           WHERE b.read_permission IN ('public', 'user')
             AND (p.title LIKE ? OR p.content LIKE ?)
           ORDER BY p.created_at DESC
           LIMIT ? OFFSET ?"
        );
        $stmt->execute([$like, $like, $limit, $offset]);
        $rows = $stmt->fetchAll();

        $countStmt = $pdo->prepare(
          "SELECT COUNT(*) FROM posts p
           JOIN boards b ON b.id = p.board_id
           WHERE b.read_permission IN ('public', 'user')
             AND (p.title LIKE ? OR p.content LIKE ?)"
        );
        $countStmt->execute([$like, $like]);
        $total = (int) $countStmt->fetchColumn();
      }

      // 본문 미리보기 — 검색어 주변 80자
      $items = array_map(function (array $row) use ($q): array {
        $excerpt = self::makeExcerpt($row['content'], $q, 80);
        return [
          'id'           => (int) $row['id'],
          'title'        => $row['title'],
          'excerpt'      => $excerpt,
          'boardId'      => (int) $row['board_id'],
          'boardName'    => $row['board_name'],
          'authorName'   => $row['author_name'],
          'commentCount' => (int) $row['comment_count'],
          'viewCount'    => (int) $row['view_count'],
          'createdAt'    => $row['created_at'],
        ];
      }, $rows);

      ResponseHelper::success([
        'items'      => $items,
        'total'      => $total,
        'page'       => $page,
        'totalPages' => (int) ceil($total / $limit),
      ]);
    } catch (\Throwable $e) {
      ResponseHelper::error('검색 중 오류가 발생했습니다.', 500);
    }
  }

  /** 본문에서 검색어 주변 텍스트 추출 */
  private static function makeExcerpt(string $text, string $keyword, int $radius): string {
    // 마크다운 이미지/URL 제거
    $clean = preg_replace('/!\[[^\]]*\]\([^\)]*\)/', '', $text);
    $clean = preg_replace('/https?:\/\/\S+/', '', $clean ?? $text);
    $clean = preg_replace('/\s+/', ' ', $clean ?? '');
    $clean = trim($clean ?? '');

    $pos = mb_stripos($clean, $keyword);
    if ($pos === false) {
      return mb_substr($clean, 0, $radius * 2) . (mb_strlen($clean) > $radius * 2 ? '…' : '');
    }

    $start = max(0, $pos - $radius);
    $len   = mb_strlen($keyword) + $radius * 2;
    $piece = mb_substr($clean, $start, $len);

    if ($start > 0) $piece = '…' . $piece;
    if ($start + $len < mb_strlen($clean)) $piece .= '…';

    return $piece;
  }
}
