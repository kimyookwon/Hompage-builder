<?php

namespace App\Controllers;

use App\Services\UserService;
use App\Middleware\AuthMiddleware;
use App\Utils\AdminLogger;
use App\Utils\ResponseHelper;

class UserController {
  private UserService $userService;

  public function __construct() {
    $this->userService = new UserService();
  }

  // GET /api/users -- 회원 목록
  public function list(): void {
    AuthMiddleware::requireAdmin();

    $page = max(1, (int) ($_GET['page'] ?? 1));
    $limit = min(100, max(1, (int) ($_GET['limit'] ?? 20)));
    $search = trim($_GET['search'] ?? '');
    $role = $_GET['role'] ?? '';
    $status = $_GET['status'] ?? '';

    $result = $this->userService->list($page, $limit, $search, $role, $status);
    ResponseHelper::paginated($result['items'], $result['total'], $page, $limit);
  }

  // GET /api/users/{id} -- 회원 상세
  public function show(string $id): void {
    AuthMiddleware::requireAdmin();

    $user = $this->userService->findById((int) $id);
    ResponseHelper::success($user);
  }

  // PATCH /api/users/{id}/role -- 역할 변경
  public function updateRole(string $id): void {
    $payload = AuthMiddleware::requireAdmin();

    $data = json_decode(file_get_contents('php://input'), true);
    $role = $data['role'] ?? '';

    $result = $this->userService->updateRole((int) $id, $role);

    AdminLogger::log(
      (int) $payload->sub,
      AdminLogger::getAdminName($payload),
      'update_role', 'user', (int) $id,
      ['role' => $role]
    );

    ResponseHelper::success($result);
  }

  // PATCH /api/users/{id}/status -- 상태 변경
  public function updateStatus(string $id): void {
    $payload = AuthMiddleware::requireAdmin();

    $data = json_decode(file_get_contents('php://input'), true);
    $status = $data['status'] ?? '';

    $result = $this->userService->updateStatus((int) $id, $status);

    AdminLogger::log(
      (int) $payload->sub,
      AdminLogger::getAdminName($payload),
      'update_status', 'user', (int) $id,
      ['status' => $status]
    );

    ResponseHelper::success($result);
  }

  // GET /api/users/{id}/profile -- 공개 프로필 (인증 불필요)
  public function publicProfile(string $id): void {
    $result = $this->userService->publicProfile((int) $id);
    ResponseHelper::success($result);
  }

  // DELETE /api/users/{id} -- 강제 탈퇴
  public function delete(string $id): void {
    $payload = AuthMiddleware::requireAdmin();

    $this->userService->delete((int) $id);

    AdminLogger::log(
      (int) $payload->sub,
      AdminLogger::getAdminName($payload),
      'delete', 'user', (int) $id
    );

    ResponseHelper::success(['message' => '회원이 탈퇴 처리되었습니다.']);
  }

  // PATCH /api/users/{id}/password -- 관리자 비밀번호 초기화
  public function resetPassword(string $id): void {
    AuthMiddleware::requireAdmin();

    $data = json_decode(file_get_contents('php://input'), true);
    $newPassword = $data['new_password'] ?? '';

    $this->userService->resetPassword((int) $id, $newPassword);

    ResponseHelper::success(['message' => '비밀번호가 초기화되었습니다.']);
  }
}
