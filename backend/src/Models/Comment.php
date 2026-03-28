<?php

namespace App\Models;

use App\Config\Database;

class Comment {
  // 전체 댓글 목록 (관리자용, 게시글/게시판 정보 포함)
  public static function findAll(int $page, int $limit, string $search = ''): array {
    $pdo = Database::getInstance();
    $offset = ($page - 1) * $limit;

    $where  = '';
    $params = [];

    if ($search !== '') {
      $where    = 'WHERE (c.content LIKE ? OR u.name LIKE ? OR p.title LIKE ?)';
      $like     = '%' . $search . '%';
      $params   = [$like, $like, $like];
    }

    $stmt = $pdo->prepare(
      "SELECT c.id, c.content, c.created_at,
              u.name AS author_name,
              p.id   AS post_id,
              p.title AS post_title,
              b.id   AS board_id,
              b.name AS board_name
       FROM comments c
       JOIN users u  ON u.id = c.author_id
       JOIN posts p  ON p.id = c.post_id
       JOIN boards b ON b.id = p.board_id
       {$where}
       ORDER BY c.created_at DESC
       LIMIT ? OFFSET ?"
    );
    $stmt->execute([...$params, $limit, $offset]);

    $countStmt = $pdo->prepare(
      "SELECT COUNT(*) FROM comments c
       JOIN users u ON u.id = c.author_id
       JOIN posts p ON p.id = c.post_id
       {$where}"
    );
    $countStmt->execute($params);

    return [
      'items' => $stmt->fetchAll(),
      'total' => (int) $countStmt->fetchColumn(),
    ];
  }

  // 게시글의 댓글 목록 (parent_id 포함, 최상위 먼저 + 대댓글 순)
  public static function findByPost(int $postId): array {
    $pdo = Database::getInstance();
    $stmt = $pdo->prepare(
      'SELECT c.id, c.post_id, c.parent_id, c.author_id, c.content,
              c.created_at, c.updated_at,
              u.name AS author_name, u.avatar_url AS author_avatar_url
       FROM comments c
       JOIN users u ON u.id = c.author_id
       WHERE c.post_id = ?
       ORDER BY COALESCE(c.parent_id, c.id) ASC, c.id ASC'
    );
    $stmt->execute([$postId]);
    return $stmt->fetchAll();
  }

  // 단일 댓글 조회
  public static function findById(int $id): array|false {
    $pdo = Database::getInstance();
    $stmt = $pdo->prepare('SELECT * FROM comments WHERE id = ?');
    $stmt->execute([$id]);
    return $stmt->fetch();
  }

  // 댓글 작성 (parent_id 지정 시 대댓글)
  public static function create(int $postId, int $authorId, string $content, ?int $parentId = null): array {
    $pdo = Database::getInstance();
    $pdo->prepare('INSERT INTO comments (post_id, parent_id, author_id, content) VALUES (?, ?, ?, ?)')
        ->execute([$postId, $parentId, $authorId, $content]);
    return self::findByIdWithAuthor((int) $pdo->lastInsertId());
  }

  // 댓글 수정
  public static function update(int $id, string $content): array|false {
    $pdo = Database::getInstance();
    $pdo->prepare('UPDATE comments SET content = ? WHERE id = ?')->execute([$content, $id]);
    return self::findByIdWithAuthor($id);
  }

  // 작성자 이름 포함 단일 댓글 조회
  public static function findByIdWithAuthor(int $id): array|false {
    $pdo = Database::getInstance();
    $stmt = $pdo->prepare(
      'SELECT c.*, u.name AS author_name, u.avatar_url AS author_avatar_url FROM comments c
       JOIN users u ON u.id = c.author_id WHERE c.id = ?'
    );
    $stmt->execute([$id]);
    return $stmt->fetch();
  }

  // 내 댓글 목록 (마이페이지용)
  public static function findByUser(int $userId, int $page, int $limit): array {
    $pdo    = Database::getInstance();
    $offset = ($page - 1) * $limit;

    $stmt = $pdo->prepare(
      'SELECT c.id, c.content, c.created_at,
              p.id AS post_id, p.title AS post_title,
              b.id AS board_id, b.name AS board_name
       FROM comments c
       JOIN posts  p ON p.id = c.post_id
       JOIN boards b ON b.id = p.board_id
       WHERE c.author_id = ?
       ORDER BY c.created_at DESC
       LIMIT ? OFFSET ?'
    );
    $stmt->execute([$userId, $limit, $offset]);

    $countStmt = $pdo->prepare('SELECT COUNT(*) FROM comments WHERE author_id = ?');
    $countStmt->execute([$userId]);

    return ['items' => $stmt->fetchAll(), 'total' => (int) $countStmt->fetchColumn()];
  }

  // 댓글 삭제
  public static function delete(int $id): bool {
    $pdo = Database::getInstance();
    $stmt = $pdo->prepare('DELETE FROM comments WHERE id = ?');
    $stmt->execute([$id]);
    return $stmt->rowCount() > 0;
  }
}
