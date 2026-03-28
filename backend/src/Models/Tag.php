<?php

namespace App\Models;

use App\Config\Database;

class Tag {
  // 태그명 배열로 태그 ID 배열 반환 (없으면 생성)
  public static function upsertMany(array $names): array {
    if (empty($names)) return [];
    $pdo = Database::getInstance();
    $ids = [];
    foreach ($names as $name) {
      $name = self::normalize($name);
      if ($name === '') continue;
      // 중복이면 무시하고 ID만 가져옴
      $pdo->prepare('INSERT IGNORE INTO tags (name) VALUES (?)')->execute([$name]);
      $stmt = $pdo->prepare('SELECT id FROM tags WHERE name = ?');
      $stmt->execute([$name]);
      $row = $stmt->fetch();
      if ($row) $ids[] = (int) $row['id'];
    }
    return array_unique($ids);
  }

  // 게시글에 태그 연결 (기존 연결 교체)
  public static function syncPost(int $postId, array $tagIds): void {
    $pdo = Database::getInstance();
    $pdo->prepare('DELETE FROM post_tags WHERE post_id = ?')->execute([$postId]);
    if (empty($tagIds)) return;
    $placeholders = implode(',', array_fill(0, count($tagIds), '(?,?)'));
    $values = [];
    foreach ($tagIds as $tagId) {
      $values[] = $postId;
      $values[] = $tagId;
    }
    $pdo->prepare("INSERT INTO post_tags (post_id, tag_id) VALUES {$placeholders}")->execute($values);
  }

  // 게시글의 태그 목록 반환
  public static function findByPost(int $postId): array {
    $pdo = Database::getInstance();
    $stmt = $pdo->prepare(
      'SELECT t.id, t.name FROM tags t
       JOIN post_tags pt ON pt.tag_id = t.id
       WHERE pt.post_id = ?
       ORDER BY t.name'
    );
    $stmt->execute([$postId]);
    return $stmt->fetchAll();
  }

  // 특정 태그의 게시글 목록 (게시판 필터)
  public static function findPostsByTag(string $tagName, int $boardId, int $page, int $limit): array {
    $pdo    = Database::getInstance();
    $offset = ($page - 1) * $limit;
    $name   = self::normalize($tagName);

    $stmt = $pdo->prepare(
      "SELECT p.id, p.title, p.created_at, p.view_count,
              u.name AS author_name,
              (SELECT COUNT(*) FROM comments c WHERE c.post_id = p.id) AS comment_count
       FROM posts p
       JOIN users u ON u.id = p.author_id
       JOIN post_tags pt ON pt.post_id = p.id
       JOIN tags t ON t.id = pt.tag_id
       WHERE p.board_id = ? AND t.name = ?
       ORDER BY p.created_at DESC
       LIMIT ? OFFSET ?"
    );
    $stmt->execute([$boardId, $name, $limit, $offset]);
    $items = $stmt->fetchAll();

    $countStmt = $pdo->prepare(
      "SELECT COUNT(*) FROM posts p
       JOIN post_tags pt ON pt.post_id = p.id
       JOIN tags t ON t.id = pt.tag_id
       WHERE p.board_id = ? AND t.name = ?"
    );
    $countStmt->execute([$boardId, $name]);
    return ['items' => $items, 'total' => (int) $countStmt->fetchColumn()];
  }

  // 인기 태그 (전체 또는 게시판별)
  public static function popular(?int $boardId = null, int $limit = 20): array {
    $pdo = Database::getInstance();
    if ($boardId !== null) {
      $stmt = $pdo->prepare(
        "SELECT t.name, COUNT(*) AS count
         FROM tags t
         JOIN post_tags pt ON pt.tag_id = t.id
         JOIN posts p ON p.id = pt.post_id
         WHERE p.board_id = ?
         GROUP BY t.id, t.name
         ORDER BY count DESC
         LIMIT ?"
      );
      $stmt->execute([$boardId, $limit]);
    } else {
      $stmt = $pdo->prepare(
        "SELECT t.name, COUNT(*) AS count
         FROM tags t
         JOIN post_tags pt ON pt.tag_id = t.id
         GROUP BY t.id, t.name
         ORDER BY count DESC
         LIMIT ?"
      );
      $stmt->execute([$limit]);
    }
    return $stmt->fetchAll();
  }

  // 태그명 정규화: 소문자, 공백→하이픈, 특수문자 제거, 최대 30자
  public static function normalize(string $name): string {
    $name = mb_strtolower(trim($name));
    $name = preg_replace('/\s+/', '-', $name) ?? $name;
    $name = preg_replace('/[^\p{L}\p{N}\-]/u', '', $name) ?? $name;
    return mb_substr($name, 0, 30);
  }
}
