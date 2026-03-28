<?php

namespace App\Controllers;

use App\Config\Database;
use App\Models\User;
use App\Middleware\AuthMiddleware;
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
    AuthMiddleware::requireAdmin();

    $data = json_decode(file_get_contents('php://input'), true);
    $role = $data['role'] ?? '';

    if (!in_array($role, ['admin', 'user'])) {
      ResponseHelper::error('유효하지 않은 역할입니다.', 422);
    }

    $user = User::findById((int) $id);
    if (!$user) ResponseHelper::error('회원을 찾을 수 없습니다.', 404);

    ResponseHelper::success(User::updateRole((int) $id, $role));
  }

  // PATCH /api/users/{id}/status — 상태 변경
  public function updateStatus(string $id): void {
    AuthMiddleware::requireAdmin();

    $data = json_decode(file_get_contents('php://input'), true);
    $status = $data['status'] ?? '';

    if (!in_array($status, ['active', 'blocked'])) {
      ResponseHelper::error('유효하지 않은 상태입니다.', 422);
    }

    $user = User::findById((int) $id);
    if (!$user) ResponseHelper::error('회원을 찾을 수 없습니다.', 404);

    ResponseHelper::success(User::updateStatus((int) $id, $status));
  }

  // DELETE /api/users/{id} — 강제 탈퇴
  public function delete(string $id): void {
    AuthMiddleware::requireAdmin();

    $user = User::findById((int) $id);
    if (!$user) ResponseHelper::error('회원을 찾을 수 없습니다.', 404);

    User::delete((int) $id);
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
