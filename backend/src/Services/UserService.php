<?php

namespace App\Services;

use App\Config\Database;
use App\Models\User;
use App\Utils\PasswordHash;
use App\Utils\ResponseHelper;

class UserService {
  // 회원 목록 (필터/페이지네이션)
  public function list(int $page, int $limit, string $search, string $role, string $status): array {
    $validRoles = ['admin', 'user', ''];
    $validStatuses = ['active', 'blocked', ''];

    if (!in_array($role, $validRoles)) $role = '';
    if (!in_array($status, $validStatuses)) $status = '';

    return User::findAll($page, $limit, $search, $role, $status);
  }

  // 회원 상세
  public function findById(int $id): array|false {
    $user = User::findById($id);
    if (!$user) {
      ResponseHelper::error('회원을 찾을 수 없습니다.', 404);
    }
    return $user;
  }

  // 역할 변경
  public function updateRole(int $id, string $role): array|false {
    if (!in_array($role, ['admin', 'user'])) {
      ResponseHelper::error('유효하지 않은 역할입니다.', 422);
    }

    $user = User::findById($id);
    if (!$user) {
      ResponseHelper::error('회원을 찾을 수 없습니다.', 404);
    }

    return User::updateRole($id, $role);
  }

  // 상태 변경
  public function updateStatus(int $id, string $status): array|false {
    if (!in_array($status, ['active', 'blocked'])) {
      ResponseHelper::error('유효하지 않은 상태입니다.', 422);
    }

    $user = User::findById($id);
    if (!$user) {
      ResponseHelper::error('회원을 찾을 수 없습니다.', 404);
    }

    return User::updateStatus($id, $status);
  }

  // 회원 삭제
  public function delete(int $id): void {
    $user = User::findById($id);
    if (!$user) {
      ResponseHelper::error('회원을 찾을 수 없습니다.', 404);
    }

    User::delete($id);
  }

  // 비밀번호 초기화
  public function resetPassword(int $id, string $newPassword): void {
    if ($id <= 0) {
      ResponseHelper::error('잘못된 사용자 ID입니다.', 400);
    }
    if (strlen($newPassword) < 8) {
      ResponseHelper::error('비밀번호는 8자 이상이어야 합니다.', 422);
    }

    $pdo = Database::getInstance();

    // 사용자 존재 확인
    $stmt = $pdo->prepare('SELECT id, role FROM users WHERE id = ?');
    $stmt->execute([$id]);
    $target = $stmt->fetch();

    if (!$target) {
      ResponseHelper::error('사용자를 찾을 수 없습니다.', 404);
    }

    $hash = PasswordHash::hash($newPassword);
    $pdo->prepare('UPDATE users SET password_hash = ?, updated_at = NOW() WHERE id = ?')
        ->execute([$hash, $id]);
  }

  // 공개 프로필 조회
  public function publicProfile(int $id): array {
    if ($id <= 0) {
      ResponseHelper::error('유효하지 않은 사용자 ID입니다.', 400);
    }

    $pdo = Database::getInstance();

    // 사용자 기본 정보 + 게시글/댓글 수 조회
    $stmt = $pdo->prepare(
      'SELECT u.id, u.name, u.avatar_url, u.role, u.status, u.created_at,
              (SELECT COUNT(*) FROM posts   WHERE author_id = u.id) AS post_count,
              (SELECT COUNT(*) FROM comments WHERE author_id = u.id) AS comment_count
       FROM users u WHERE u.id = ?'
    );
    $stmt->execute([$id]);
    $user = $stmt->fetch();

    // 존재하지 않거나 차단된 사용자는 404 반환
    if (!$user || $user['status'] === 'blocked') {
      ResponseHelper::error('사용자를 찾을 수 없습니다.', 404);
    }

    $postCount    = (int) $user['post_count'];
    $commentCount = (int) $user['comment_count'];

    // 최근 게시글 5개 조회 (게시판명 포함)
    $recentPostsStmt = $pdo->prepare(
      'SELECT p.id, p.title, p.created_at, b.id AS board_id, b.name AS board_name
       FROM posts p
       JOIN boards b ON b.id = p.board_id
       WHERE p.author_id = ?
       ORDER BY p.created_at DESC
       LIMIT 5'
    );
    $recentPostsStmt->execute([$id]);
    $recentPosts = $recentPostsStmt->fetchAll();

    return [
      'id'           => (int) $user['id'],
      'name'         => $user['name'],
      'avatarUrl'    => $user['avatar_url'],
      'role'         => $user['role'],
      'createdAt'    => $user['created_at'],
      'postCount'    => $postCount,
      'commentCount' => $commentCount,
      'recentPosts'  => array_map(fn($p) => [
        'id'        => (int) $p['id'],
        'title'     => $p['title'],
        'boardName' => $p['board_name'],
        'boardId'   => (int) $p['board_id'],
        'createdAt' => $p['created_at'],
      ], $recentPosts),
    ];
  }
}
