<?php

namespace App\Models;

use App\Config\Database;

class Board {
  // 게시판 목록 (게시글 수 포함, sort_order 순 정렬)
  public static function findAll(): array {
    $pdo = Database::getInstance();
    $stmt = $pdo->query(
      'SELECT b.*, COUNT(p.id) AS post_count
       FROM boards b
       LEFT JOIN posts p ON p.board_id = b.id
       GROUP BY b.id
       ORDER BY b.sort_order ASC, b.created_at ASC'
    );
    return $stmt->fetchAll();
  }

  // 공개 게시판 목록 (read_permission = 'public', sort_order 순 정렬)
  public static function findPublic(): array {
    $pdo = Database::getInstance();
    $stmt = $pdo->query(
      "SELECT b.*, COUNT(p.id) AS post_count
       FROM boards b
       LEFT JOIN posts p ON p.board_id = b.id
       WHERE b.read_permission = 'public'
       GROUP BY b.id
       ORDER BY b.sort_order ASC, b.created_at ASC"
    );
    return $stmt->fetchAll();
  }

  // 전체 게시판 수
  public static function count(): int {
    $pdo = Database::getInstance();
    return (int) $pdo->query('SELECT COUNT(*) FROM boards')->fetchColumn();
  }

  // 순서 변경 (위/아래 swap)
  public static function move(int $id, string $direction): void {
    $pdo = Database::getInstance();

    $current = $pdo->prepare('SELECT id, sort_order FROM boards WHERE id = ?');
    $current->execute([$id]);
    $row = $current->fetch();
    if (!$row) return;

    $currentOrder = (int) $row['sort_order'];

    if ($direction === 'up') {
      // 바로 위 게시판 (sort_order가 더 작은 것 중 가장 큰 것)
      $stmt = $pdo->prepare(
        'SELECT id, sort_order FROM boards WHERE sort_order < ? ORDER BY sort_order DESC LIMIT 1'
      );
    } else {
      // 바로 아래 게시판 (sort_order가 더 큰 것 중 가장 작은 것)
      $stmt = $pdo->prepare(
        'SELECT id, sort_order FROM boards WHERE sort_order > ? ORDER BY sort_order ASC LIMIT 1'
      );
    }
    $stmt->execute([$currentOrder]);
    $target = $stmt->fetch();
    if (!$target) return;

    // sort_order 교환
    $pdo->prepare('UPDATE boards SET sort_order = ? WHERE id = ?')
        ->execute([(int) $target['sort_order'], $id]);
    $pdo->prepare('UPDATE boards SET sort_order = ? WHERE id = ?')
        ->execute([$currentOrder, (int) $target['id']]);
  }

  // 단일 게시판 조회
  public static function findById(int $id): array|false {
    $pdo = Database::getInstance();
    $stmt = $pdo->prepare('SELECT * FROM boards WHERE id = ?');
    $stmt->execute([$id]);
    return $stmt->fetch();
  }

  // 게시판 생성
  public static function create(string $name, string $type, string $readPermission, string $writePermission, ?string $description = null): array {
    $pdo = Database::getInstance();
    $pdo->prepare(
      'INSERT INTO boards (name, description, type, read_permission, write_permission) VALUES (?, ?, ?, ?, ?)'
    )->execute([$name, $description, $type, $readPermission, $writePermission]);
    return self::findById((int) $pdo->lastInsertId());
  }

  // 게시판 수정
  public static function update(int $id, array $data): array|false {
    $pdo = Database::getInstance();
    $fields = [];
    $values = [];

    foreach (['name', 'description', 'type', 'read_permission', 'write_permission'] as $field) {
      if (array_key_exists($field, $data)) {
        $fields[] = "{$field} = ?";
        $values[] = $data[$field];
      }
    }

    if (!empty($fields)) {
      $values[] = $id;
      $pdo->prepare('UPDATE boards SET ' . implode(', ', $fields) . ' WHERE id = ?')->execute($values);
    }

    return self::findById($id);
  }

  // 게시판 삭제 (게시글 CASCADE)
  public static function delete(int $id): bool {
    $pdo = Database::getInstance();
    $stmt = $pdo->prepare('DELETE FROM boards WHERE id = ?');
    $stmt->execute([$id]);
    return $stmt->rowCount() > 0;
  }
}
