<?php

namespace App\Models;

use App\Config\Database;

class Post {
  // 게시판의 게시글 목록 (공지 상단 고정 + 검색 + 정렬 지원)
  public static function findByBoard(int $boardId, int $page, int $limit, string $search = '', string $sort = 'latest'): array {
    $pdo = Database::getInstance();
    $offset = ($page - 1) * $limit;

    $searchSql = $search !== '' ? 'AND (p.title LIKE ? OR p.content LIKE ?)' : '';
    $searchParams = $search !== '' ? ["%{$search}%", "%{$search}%"] : [];

    // 정렬 기준 (공지는 항상 상단 고정)
    $orderSql = match ($sort) {
      'views'    => 'p.is_notice DESC, p.view_count DESC, p.created_at DESC',
      'comments' => 'p.is_notice DESC, comment_count DESC, p.created_at DESC',
      default    => 'p.is_notice DESC, p.created_at DESC',
    };

    $stmt = $pdo->prepare(
      "SELECT p.*, u.name AS author_name,
              (SELECT COUNT(*) FROM comments c WHERE c.post_id = p.id) AS comment_count
       FROM posts p
       JOIN users u ON u.id = p.author_id
       WHERE p.board_id = ? {$searchSql}
       ORDER BY {$orderSql}
       LIMIT ? OFFSET ?"
    );
    $stmt->execute(array_merge([$boardId], $searchParams, [$limit, $offset]));

    $countStmt = $pdo->prepare("SELECT COUNT(*) FROM posts WHERE board_id = ? {$searchSql}");
    $countStmt->execute(array_merge([$boardId], $searchParams));

    return ['items' => $stmt->fetchAll(), 'total' => (int) $countStmt->fetchColumn()];
  }

  // 좋아요 토글 (없으면 추가, 있으면 제거) — [liked, like_count] 반환
  public static function toggleLike(int $postId, int $userId): array {
    $pdo = Database::getInstance();

    $check = $pdo->prepare('SELECT id FROM post_likes WHERE post_id = ? AND user_id = ?');
    $check->execute([$postId, $userId]);

    if ($check->fetch()) {
      $pdo->prepare('DELETE FROM post_likes WHERE post_id = ? AND user_id = ?')->execute([$postId, $userId]);
      $liked = false;
    } else {
      $pdo->prepare('INSERT INTO post_likes (post_id, user_id) VALUES (?, ?)')->execute([$postId, $userId]);
      $liked = true;
    }

    $countStmt = $pdo->prepare('SELECT COUNT(*) FROM post_likes WHERE post_id = ?');
    $countStmt->execute([$postId]);

    return ['liked' => $liked, 'like_count' => (int) $countStmt->fetchColumn()];
  }

  // 특정 사용자의 좋아요 여부 + 좋아요 수 조회
  public static function getLikeStatus(int $postId, ?int $userId): array {
    $pdo = Database::getInstance();

    $countStmt = $pdo->prepare('SELECT COUNT(*) FROM post_likes WHERE post_id = ?');
    $countStmt->execute([$postId]);
    $likeCount = (int) $countStmt->fetchColumn();

    $liked = false;
    if ($userId !== null) {
      $check = $pdo->prepare('SELECT id FROM post_likes WHERE post_id = ? AND user_id = ?');
      $check->execute([$postId, $userId]);
      $liked = (bool) $check->fetch();
    }

    return ['liked' => $liked, 'like_count' => $likeCount];
  }

  // 공지 여부 토글
  public static function toggleNotice(int $id): array|false {
    $pdo = Database::getInstance();
    $pdo->prepare('UPDATE posts SET is_notice = NOT is_notice WHERE id = ?')->execute([$id]);
    return self::findById($id);
  }

  // 내 게시글 목록
  public static function findByUser(int $userId, int $page, int $limit): array {
    $pdo = Database::getInstance();
    $offset = ($page - 1) * $limit;

    $stmt = $pdo->prepare(
      'SELECT p.id, p.title, p.created_at, b.id AS board_id, b.name AS board_name,
              (SELECT COUNT(*) FROM comments c WHERE c.post_id = p.id) AS comment_count
       FROM posts p
       JOIN boards b ON b.id = p.board_id
       WHERE p.author_id = ?
       ORDER BY p.created_at DESC
       LIMIT ? OFFSET ?'
    );
    $stmt->execute([$userId, $limit, $offset]);

    $countStmt = $pdo->prepare('SELECT COUNT(*) FROM posts WHERE author_id = ?');
    $countStmt->execute([$userId]);

    return ['items' => $stmt->fetchAll(), 'total' => (int) $countStmt->fetchColumn()];
  }

  // 최근 게시글 (대시보드용)
  public static function findRecent(int $limit = 10): array {
    $pdo = Database::getInstance();
    $stmt = $pdo->prepare(
      'SELECT p.id, p.title, p.created_at, u.name AS author_name,
              b.name AS board_name,
              (SELECT COUNT(*) FROM comments c WHERE c.post_id = p.id) AS comment_count
       FROM posts p
       JOIN users u ON u.id = p.author_id
       JOIN boards b ON b.id = p.board_id
       ORDER BY p.created_at DESC
       LIMIT ?'
    );
    $stmt->execute([$limit]);
    return $stmt->fetchAll();
  }

  // 조회수 증가 (원자적 UPDATE)
  public static function incrementViewCount(int $id): void {
    $pdo = Database::getInstance();
    $pdo->prepare('UPDATE posts SET view_count = view_count + 1 WHERE id = ?')->execute([$id]);
  }

  // 단일 게시글 조회
  public static function findById(int $id): array|false {
    $pdo = Database::getInstance();
    $stmt = $pdo->prepare(
      'SELECT p.*, u.name AS author_name FROM posts p
       JOIN users u ON u.id = p.author_id WHERE p.id = ?'
    );
    $stmt->execute([$id]);
    return $stmt->fetch();
  }

  // 게시글 작성
  public static function create(int $boardId, int $authorId, string $title, string $content, ?string $thumbnailUrl = null): array {
    $pdo = Database::getInstance();
    $pdo->prepare('INSERT INTO posts (board_id, author_id, title, content, thumbnail_url) VALUES (?, ?, ?, ?, ?)')
        ->execute([$boardId, $authorId, $title, $content, $thumbnailUrl]);
    return self::findById((int) $pdo->lastInsertId());
  }

  // 게시글 수정 ($thumbnailUrl = false이면 기존값 유지, null이면 제거, string이면 변경)
  public static function update(int $id, string $title, string $content, string|null|false $thumbnailUrl = false): array|false {
    $pdo = Database::getInstance();
    if ($thumbnailUrl === false) {
      $pdo->prepare('UPDATE posts SET title = ?, content = ? WHERE id = ?')
          ->execute([$title, $content, $id]);
    } else {
      $pdo->prepare('UPDATE posts SET title = ?, content = ?, thumbnail_url = ? WHERE id = ?')
          ->execute([$title, $content, $thumbnailUrl, $id]);
    }
    return self::findById($id);
  }

  // 같은 게시판 내 이전/다음 게시글 (공지 제외, 작성일 기준)
  public static function getAdjacentPosts(int $id, int $boardId): array {
    $pdo = Database::getInstance();

    // 이전 글: 현재보다 먼저 작성된 것 중 가장 최근
    $prevStmt = $pdo->prepare(
      'SELECT id, title FROM posts
       WHERE board_id = ? AND id < ? AND is_notice = 0
       ORDER BY id DESC LIMIT 1'
    );
    $prevStmt->execute([$boardId, $id]);

    // 다음 글: 현재보다 나중에 작성된 것 중 가장 오래된
    $nextStmt = $pdo->prepare(
      'SELECT id, title FROM posts
       WHERE board_id = ? AND id > ? AND is_notice = 0
       ORDER BY id ASC LIMIT 1'
    );
    $nextStmt->execute([$boardId, $id]);

    return [
      'prev' => $prevStmt->fetch() ?: null,
      'next' => $nextStmt->fetch() ?: null,
    ];
  }

  // 게시글 삭제
  public static function delete(int $id): bool {
    $pdo = Database::getInstance();
    $stmt = $pdo->prepare('DELETE FROM posts WHERE id = ?');
    $stmt->execute([$id]);
    return $stmt->rowCount() > 0;
  }
}
