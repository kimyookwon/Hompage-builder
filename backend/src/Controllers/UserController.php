<?php

namespace App\Controllers;

use App\Config\Database;
use App\Models\User;
use App\Models\Post;
use App\Middleware\AuthMiddleware;
use App\Utils\AdminLogger;
use App\Utils\PasswordHash;
use App\Utils\ResponseHelper;

class UserController {
  // GET /api/users — 회원 목록
  public function list(): void {
    AuthMiddleware::requireAdmin();

    $page = max(1, (int) ($_GET['page'] ?? 1));
    $limit = min(100, max(1, (int) ($_GET['limit'] ?? 20)));
    $search = trim($_GET['search'] ?? '');
    $role = $_GET['role'] ?? '';
    $status = $_GET['status'] ?? '';

    $validRoles = ['admin', 'user', ''];
    $validStatuses = ['active', 'blocked', ''];

    if (!in_array($role, $validRoles)) $role = '';
    if (!in_array($status, $validStatuses)) $status = '';

    $result = User::findAll($page, $limit, $search, $role, $status);
    ResponseHelper::paginated($result['items'], $result['total'], $page, $limit);
  }

  // GET /api/users/{id} — 회원 상세
  public function show(string $id): void {
    AuthMiddleware::requireAdmin();

    $user = User::findById((int) $id);
    if (!$user) ResponseHelper::error('회원을 찾을 수 없습니다.', 404);
    ResponseHelper::success($user);
  }

  // PATCH /api/users/{id}/role — 역할 변경
  public function updateRole(string $id): void {
    $payload = AuthMiddleware::requireAdmin();

    $data = json_decode(file_get_contents('php://input'), true);
    $role = $data['role'] ?? '';

    if (!in_array($role, ['admin', 'user'])) {
      ResponseHelper::error('유효하지 않은 역할입니다.', 422);
    }

    $user = User::findById((int) $id);
    if (!$user) ResponseHelper::error('회원을 찾을 수 없습니다.', 404);

    $result = User::updateRole((int) $id, $role);

    AdminLogger::log(
      (int) $payload->sub,
      AdminLogger::getAdminName($payload),
      'update_role', 'user', (int) $id,
      ['role' => $role]
    );

    ResponseHelper::success($result);
  }

  // PATCH /api/users/{id}/status — 상태 변경
  public function updateStatus(string $id): void {
    $payload = AuthMiddleware::requireAdmin();

    $data = json_decode(file_get_contents('php://input'), true);
    $status = $data['status'] ?? '';

    if (!in_array($status, ['active', 'blocked'])) {
      ResponseHelper::error('유효하지 않은 상태입니다.', 422);
    }

    $user = User::findById((int) $id);
    if (!$user) ResponseHelper::error('회원을 찾을 수 없습니다.', 404);

    $result = User::updateStatus((int) $id, $status);

    AdminLogger::log(
      (int) $payload->sub,
      AdminLogger::getAdminName($payload),
      'update_status', 'user', (int) $id,
      ['status' => $status]
    );

    ResponseHelper::success($result);
  }

  // GET /api/users/{id}/profile — 공개 프로필 (인증 불필요)
  public function publicProfile(string $id): void {
    $userId = (int) $id;
    if ($userId <= 0) {
      ResponseHelper::error('유효하지 않은 사용자 ID입니다.', 400);
    }

    $pdo = Database::getInstance();

    // 사용자 기본 정보 + 게시글·댓글 수를 단일 쿼리로 조회 (4쿼리 → 2쿼리)
    $stmt = $pdo->prepare(
      'SELECT u.id, u.name, u.avatar_url, u.role, u.status, u.created_at,
              (SELECT COUNT(*) FROM posts   WHERE author_id = u.id) AS post_count,
              (SELECT COUNT(*) FROM comments WHERE author_id = u.id) AS comment_count
       FROM users u WHERE u.id = ?'
    );
    $stmt->execute([$userId]);
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
    $recentPostsStmt->execute([$userId]);
    $recentPosts = $recentPostsStmt->fetchAll();

    ResponseHelper::success([
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
    ]);
  }

  // DELETE /api/users/{id} — 강제 탈퇴
  public function delete(string $id): void {
    $payload = AuthMiddleware::requireAdmin();

    $user = User::findById((int) $id);
    if (!$user) ResponseHelper::error('회원을 찾을 수 없습니다.', 404);

    User::delete((int) $id);

    AdminLogger::log(
      (int) $payload->sub,
      AdminLogger::getAdminName($payload),
      'delete', 'user', (int) $id
    );

    ResponseHelper::success(['message' => '회원이 탈퇴 처리되었습니다.']);
  }

  // PATCH /api/users/{id}/password — 관리자 비밀번호 초기화
  public function resetPassword(string $id): void {
    AuthMiddleware::requireAdmin();

    $userId = (int) $id;
    if ($userId <= 0) ResponseHelper::error('잘못된 사용자 ID입니다.', 400);

    $data = json_decode(file_get_contents('php://input'), true);
    $newPassword = $data['new_password'] ?? '';

    if (strlen($newPassword) < 8) {
      ResponseHelper::error('비밀번호는 8자 이상이어야 합니다.', 422);
    }

    $pdo = Database::getInstance();

    // 사용자 존재 확인
    $stmt = $pdo->prepare('SELECT id, role FROM users WHERE id = ?');
    $stmt->execute([$userId]);
    $target = $stmt->fetch();

    if (!$target) ResponseHelper::error('사용자를 찾을 수 없습니다.', 404);

    $hash = PasswordHash::hash($newPassword);
    $pdo->prepare('UPDATE users SET password_hash = ?, updated_at = NOW() WHERE id = ?')
        ->execute([$hash, $userId]);

    ResponseHelper::success(['message' => '비밀번호가 초기화되었습니다.']);
  }
}
