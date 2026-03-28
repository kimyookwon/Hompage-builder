<?php

namespace App\Controllers;

use App\Config\Database;
use App\Models\Post;
use App\Models\Comment;
use App\Models\User;
use App\Models\Notification;
use App\Middleware\AuthMiddleware;
use App\Utils\ResponseHelper;
use App\Utils\PasswordHash;

class ProfileController {
  // PATCH /api/me — 프로필 이름 수정
  public function update(): void {
    $payload = AuthMiddleware::require();

    $data = json_decode(file_get_contents('php://input'), true);
    $name = trim($data['name'] ?? '');

    if (empty($name)) ResponseHelper::error('이름을 입력해주세요.', 422);
    if (mb_strlen($name) > 50) ResponseHelper::error('이름은 50자 이하로 입력해주세요.', 422);

    $user = User::updateName((int) $payload->sub, $name);
    if (!$user) ResponseHelper::error('회원 정보를 찾을 수 없습니다.', 404);

    ResponseHelper::success($user);
  }

  // PATCH /api/me/password — 비밀번호 변경
  public function updatePassword(): void {
    $payload = AuthMiddleware::require();

    $data = json_decode(file_get_contents('php://input'), true);
    $current = $data['current_password'] ?? '';
    $newPassword = $data['new_password'] ?? '';

    if (empty($current)) ResponseHelper::error('현재 비밀번호를 입력해주세요.', 422);
    if (strlen($newPassword) < 8) ResponseHelper::error('새 비밀번호는 8자 이상이어야 합니다.', 422);

    $pdo = Database::getInstance();
    $stmt = $pdo->prepare('SELECT password_hash FROM users WHERE id = ?');
    $stmt->execute([$payload->sub]);
    $user = $stmt->fetch();

    if (!$user || !PasswordHash::verify($current, $user['password_hash'] ?? '')) {
      ResponseHelper::error('현재 비밀번호가 올바르지 않습니다.', 401);
    }

    $hash = PasswordHash::hash($newPassword);
    $pdo->prepare('UPDATE users SET password_hash = ? WHERE id = ?')->execute([$hash, $payload->sub]);

    ResponseHelper::success(['message' => '비밀번호가 변경되었습니다.']);
  }

  // PATCH /api/me/avatar — 아바타 URL 변경
  public function updateAvatar(): void {
    $payload = AuthMiddleware::require();

    $data = json_decode(file_get_contents('php://input'), true);
    // null 허용 (아바타 제거)
    $avatarUrl = isset($data['avatar_url']) ? trim($data['avatar_url']) : null;

    if ($avatarUrl !== null && !filter_var($avatarUrl, FILTER_VALIDATE_URL)) {
      ResponseHelper::error('올바른 이미지 URL이 아닙니다.', 422);
    }

    $user = User::updateAvatar((int) $payload->sub, $avatarUrl ?: null);
    if (!$user) ResponseHelper::error('회원 정보를 찾을 수 없습니다.', 404);

    ResponseHelper::success($user);
  }

  // DELETE /api/me — 회원 탈퇴
  public function withdraw(): void {
    $payload = AuthMiddleware::require();

    // 관리자는 탈퇴 불가 (사이트 관리자 보호)
    if ($payload->role === 'admin') {
      ResponseHelper::error('관리자 계정은 탈퇴할 수 없습니다.', 403);
    }

    $data = json_decode(file_get_contents('php://input'), true);
    $confirm = $data['confirm'] ?? '';

    if ($confirm !== 'WITHDRAW') {
      ResponseHelper::error('탈퇴 확인 값이 올바르지 않습니다.', 422);
    }

    User::delete((int) $payload->sub);
    ResponseHelper::success(['message' => '탈퇴가 완료되었습니다.']);
  }

  // GET /api/me/posts — 내 게시글 목록
  public function posts(): void {
    $payload = AuthMiddleware::require();

    $page  = max(1, (int) ($_GET['page']  ?? 1));
    $limit = min(50, max(1, (int) ($_GET['limit'] ?? 20)));

    $result = Post::findByUser((int) $payload->sub, $page, $limit);
    ResponseHelper::paginated($result['items'], $result['total'], $page, $limit);
  }

  // GET /api/me/comments — 내 댓글 목록
  public function comments(): void {
    $payload = AuthMiddleware::require();

    $page  = max(1, (int) ($_GET['page']  ?? 1));
    $limit = min(50, max(1, (int) ($_GET['limit'] ?? 20)));

    $result = Comment::findByUser((int) $payload->sub, $page, $limit);
    ResponseHelper::paginated($result['items'], $result['total'], $page, $limit);
  }

  // GET /api/me/notifications — 내 알림 목록 (마이페이지용, 페이지네이션)
  public function notifications(): void {
    $payload = AuthMiddleware::require();

    $page  = max(1, (int) ($_GET['page']  ?? 1));
    $limit = min(50, max(1, (int) ($_GET['limit'] ?? 20)));

    // Notification::findByUser는 단순 limit만 지원하므로 직접 쿼리
    $pdo    = \App\Config\Database::getInstance();
    $offset = ($page - 1) * $limit;

    $stmt = $pdo->prepare(
      'SELECT * FROM notifications WHERE user_id = ?
       ORDER BY created_at DESC LIMIT ? OFFSET ?'
    );
    $stmt->execute([$payload->sub, $limit, $offset]);
    $items = $stmt->fetchAll();

    $countStmt = $pdo->prepare('SELECT COUNT(*) FROM notifications WHERE user_id = ?');
    $countStmt->execute([$payload->sub]);
    $total = (int) $countStmt->fetchColumn();

    ResponseHelper::paginated($items, $total, $page, $limit);
  }

  // GET /api/me/points -- 내 포인트 내역
  public function pointHistory(): void {
    $payload = AuthMiddleware::require();

    $page  = max(1, (int) ($_GET['page']  ?? 1));
    $limit = min(50, max(1, (int) ($_GET['limit'] ?? 20)));
    $offset = ($page - 1) * $limit;

    $pdo = Database::getInstance();

    $stmt = $pdo->prepare(
      'SELECT id, points, reason, ref_id, created_at
       FROM point_logs
       WHERE user_id = ?
       ORDER BY created_at DESC
       LIMIT ? OFFSET ?'
    );
    $stmt->execute([(int) $payload->sub, $limit, $offset]);
    $items = $stmt->fetchAll();

    $countStmt = $pdo->prepare('SELECT COUNT(*) FROM point_logs WHERE user_id = ?');
    $countStmt->execute([(int) $payload->sub]);
    $total = (int) $countStmt->fetchColumn();

    ResponseHelper::paginated($items, $total, $page, $limit);
  }

  // GET /api/me/bookmarks — 내 북마크 목록
  public function bookmarks(): void {
    $payload = AuthMiddleware::require();

    $page  = max(1, (int) ($_GET['page']  ?? 1));
    $limit = min(50, max(1, (int) ($_GET['limit'] ?? 20)));
    $offset = ($page - 1) * $limit;

    $pdo = Database::getInstance();

    $stmt = $pdo->prepare(
      'SELECT p.id, p.title, b.id AS board_id, b.name AS board_name, bm.created_at
       FROM post_bookmarks bm
       JOIN posts p ON p.id = bm.post_id
       JOIN boards b ON b.id = p.board_id
       WHERE bm.user_id = ?
       ORDER BY bm.created_at DESC
       LIMIT ? OFFSET ?'
    );
    $stmt->execute([(int) $payload->sub, $limit, $offset]);
    $items = $stmt->fetchAll();

    $countStmt = $pdo->prepare('SELECT COUNT(*) FROM post_bookmarks WHERE user_id = ?');
    $countStmt->execute([(int) $payload->sub]);
    $total = (int) $countStmt->fetchColumn();

    ResponseHelper::paginated($items, $total, $page, $limit);
  }
}
