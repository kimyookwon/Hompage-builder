<?php

namespace App\Models;

use App\Config\Database;

class Page {
  // 페이지 목록 조회 (페이지네이션 + 검색)
  public static function findAll(int $page, int $limit, string $search = ''): array {
    $pdo = Database::getInstance();
    $offset = ($page - 1) * $limit;

    if ($search !== '') {
      $like = "%{$search}%";
      $stmt = $pdo->prepare(
        'SELECT id, title, slug, is_published, created_at, updated_at FROM pages
         WHERE title LIKE ? OR slug LIKE ?
         ORDER BY created_at DESC LIMIT ? OFFSET ?'
      );
      $stmt->execute([$like, $like, $limit, $offset]);

      $countStmt = $pdo->prepare('SELECT COUNT(*) FROM pages WHERE title LIKE ? OR slug LIKE ?');
      $countStmt->execute([$like, $like]);
    } else {
      $stmt = $pdo->prepare(
        'SELECT id, title, slug, is_published, created_at, updated_at FROM pages
         ORDER BY created_at DESC LIMIT ? OFFSET ?'
      );
      $stmt->execute([$limit, $offset]);

      $countStmt = $pdo->prepare('SELECT COUNT(*) FROM pages');
      $countStmt->execute();
    }

    return [
      'items' => $stmt->fetchAll(),
      'total' => (int) $countStmt->fetchColumn(),
    ];
  }

  // 단일 페이지 조회 (ID)
  public static function findById(int $id): array|false {
    $pdo = Database::getInstance();
    $stmt = $pdo->prepare('SELECT * FROM pages WHERE id = ?');
    $stmt->execute([$id]);
    return $stmt->fetch();
  }

  // 단일 페이지 조회 (슬러그, 공개 페이지용)
  public static function findBySlug(string $slug): array|false {
    $pdo = Database::getInstance();
    $stmt = $pdo->prepare('SELECT * FROM pages WHERE slug = ? AND is_published = TRUE');
    $stmt->execute([$slug]);
    return $stmt->fetch();
  }

  // 슬러그 중복 확인
  public static function slugExists(string $slug, ?int $excludeId = null): bool {
    $pdo = Database::getInstance();
    if ($excludeId !== null) {
      $stmt = $pdo->prepare('SELECT id FROM pages WHERE slug = ? AND id != ?');
      $stmt->execute([$slug, $excludeId]);
    } else {
      $stmt = $pdo->prepare('SELECT id FROM pages WHERE slug = ?');
      $stmt->execute([$slug]);
    }
    return (bool) $stmt->fetch();
  }

  // 페이지 생성
  public static function create(string $title, string $slug): array {
    $pdo = Database::getInstance();
    $stmt = $pdo->prepare('INSERT INTO pages (title, slug) VALUES (?, ?)');
    $stmt->execute([$title, $slug]);
    $id = (int) $pdo->lastInsertId();
    return self::findById($id);
  }

  // 페이지 수정
  public static function update(int $id, array $data): array|false {
    $pdo = Database::getInstance();
    $fields = [];
    $values = [];

    if (isset($data['title'])) {
      $fields[] = 'title = ?';
      $values[] = $data['title'];
    }
    if (isset($data['slug'])) {
      $fields[] = 'slug = ?';
      $values[] = $data['slug'];
    }
    if (array_key_exists('seo_description', $data)) {
      $fields[] = 'seo_description = ?';
      $values[] = $data['seo_description'] ?: null;
    }
    if (array_key_exists('seo_og_image', $data)) {
      $fields[] = 'seo_og_image = ?';
      $values[] = $data['seo_og_image'] ?: null;
    }

    if (empty($fields)) return self::findById($id);

    $values[] = $id;
    $pdo->prepare('UPDATE pages SET ' . implode(', ', $fields) . ' WHERE id = ?')->execute($values);
    return self::findById($id);
  }

  // 발행 토글
  public static function togglePublish(int $id): array|false {
    $pdo = Database::getInstance();
    $pdo->prepare('UPDATE pages SET is_published = NOT is_published WHERE id = ?')->execute([$id]);
    return self::findById($id);
  }

  // 페이지 삭제
  public static function delete(int $id): bool {
    $pdo = Database::getInstance();
    $stmt = $pdo->prepare('DELETE FROM pages WHERE id = ?');
    $stmt->execute([$id]);
    return $stmt->rowCount() > 0;
  }
}
