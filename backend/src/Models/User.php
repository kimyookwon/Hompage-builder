<?php

namespace App\Models;

use App\Config\Database;

class User {
  // 회원 목록 조회 (페이지네이션 + 검색 + 필터)
  public static function findAll(int $page, int $limit, string $search = '', string $role = '', string $status = ''): array {
    $pdo = Database::getInstance();
    $offset = ($page - 1) * $limit;
    $conditions = [];
    $params = [];

    if ($search !== '') {
      $conditions[] = '(email LIKE ? OR name LIKE ?)';
      $params[] = "%{$search}%";
      $params[] = "%{$search}%";
    }
    if ($role !== '') {
      $conditions[] = 'role = ?';
      $params[] = $role;
    }
    if ($status !== '') {
      $conditions[] = 'status = ?';
      $params[] = $status;
    }

    $where = $conditions ? 'WHERE ' . implode(' AND ', $conditions) : '';

    $stmt = $pdo->prepare(
      "SELECT id, email, name, avatar_url, role, oauth_provider, status, created_at, updated_at FROM users {$where} ORDER BY created_at DESC LIMIT ? OFFSET ?"
    );
    $stmt->execute([...$params, $limit, $offset]);

    $countStmt = $pdo->prepare("SELECT COUNT(*) FROM users {$where}");
    $countStmt->execute($params);

    return ['items' => $stmt->fetchAll(), 'total' => (int) $countStmt->fetchColumn()];
  }

  // 단일 회원 조회
  public static function findById(int $id): array|false {
    $pdo = Database::getInstance();
    $stmt = $pdo->prepare('SELECT id, email, name, avatar_url, role, oauth_provider, status, created_at, updated_at FROM users WHERE id = ?');
    $stmt->execute([$id]);
    return $stmt->fetch();
  }

  // 역할 변경
  public static function updateRole(int $id, string $role): array|false {
    $pdo = Database::getInstance();
    $pdo->prepare('UPDATE users SET role = ? WHERE id = ?')->execute([$role, $id]);
    return self::findById($id);
  }

  // 상태 변경 (active / blocked)
  public static function updateStatus(int $id, string $status): array|false {
    $pdo = Database::getInstance();
    $pdo->prepare('UPDATE users SET status = ? WHERE id = ?')->execute([$status, $id]);
    return self::findById($id);
  }

  // 이름 변경
  public static function updateName(int $id, string $name): array|false {
    $pdo = Database::getInstance();
    $pdo->prepare('UPDATE users SET name = ? WHERE id = ?')->execute([$name, $id]);
    return self::findById($id);
  }

  // 아바타 URL 변경
  public static function updateAvatar(int $id, string|null $avatarUrl): array|false {
    $pdo = Database::getInstance();
    $pdo->prepare('UPDATE users SET avatar_url = ? WHERE id = ?')->execute([$avatarUrl, $id]);
    return self::findById($id);
  }

  // 회원 삭제
  public static function delete(int $id): bool {
    $pdo = Database::getInstance();
    $stmt = $pdo->prepare('DELETE FROM users WHERE id = ?');
    $stmt->execute([$id]);
    return $stmt->rowCount() > 0;
  }
}
