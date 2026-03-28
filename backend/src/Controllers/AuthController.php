<?php

namespace App\Controllers;

use App\Config\Database;
use App\Utils\JwtHandler;
use App\Utils\PasswordHash;
use App\Utils\ResponseHelper;
use App\Middleware\AuthMiddleware;

class AuthController {
  // POST /api/auth/register — 자체 회원가입
  public function register(): void {
    $data = json_decode(file_get_contents('php://input'), true);

    $email = trim($data['email'] ?? '');
    $password = $data['password'] ?? '';
    $name = trim($data['name'] ?? '');

    // 입력값 검증
    if (empty($email) || !filter_var($email, FILTER_VALIDATE_EMAIL)) {
      ResponseHelper::error('유효한 이메일을 입력해주세요.', 422);
    }
    if (strlen($password) < 8) {
      ResponseHelper::error('비밀번호는 8자 이상이어야 합니다.', 422);
    }
    if (empty($name)) {
      ResponseHelper::error('이름을 입력해주세요.', 422);
    }

    $pdo = Database::getInstance();

    // 이메일 중복 확인
    $stmt = $pdo->prepare('SELECT id FROM users WHERE email = ?');
    $stmt->execute([$email]);
    if ($stmt->fetch()) {
      ResponseHelper::error('이미 사용 중인 이메일입니다.', 409);
    }

    // 사용자 생성
    $hash = PasswordHash::hash($password);
    $stmt = $pdo->prepare(
      'INSERT INTO users (email, password_hash, name, role) VALUES (?, ?, ?, ?)'
    );
    $stmt->execute([$email, $hash, $name, 'user']);
    $userId = (int) $pdo->lastInsertId();

    $token = JwtHandler::generate($userId, 'user');

    $stmt = $pdo->prepare('SELECT id, email, name, avatar_url, role, oauth_provider, status, created_at, updated_at FROM users WHERE id = ?');
    $stmt->execute([$userId]);
    $newUser = $stmt->fetch();

    ResponseHelper::success([
      'token' => $token,
      'user' => $newUser,
    ], 201);
  }

  // POST /api/auth/login — 자체 로그인
  public function login(): void {
    $data = json_decode(file_get_contents('php://input'), true);

    $email = trim($data['email'] ?? '');
    $password = $data['password'] ?? '';

    if (empty($email) || empty($password)) {
      ResponseHelper::error('이메일과 비밀번호를 입력해주세요.', 422);
    }

    $pdo = Database::getInstance();
    $stmt = $pdo->prepare('SELECT id, email, name, role, password_hash, status FROM users WHERE email = ?');
    $stmt->execute([$email]);
    $user = $stmt->fetch();

    if (!$user || !PasswordHash::verify($password, $user['password_hash'] ?? '')) {
      ResponseHelper::error('이메일 또는 비밀번호가 올바르지 않습니다.', 401);
    }

    // 차단된 사용자 로그인 거부
    if ($user['status'] === 'blocked') {
      ResponseHelper::error('차단된 계정입니다. 관리자에게 문의해주세요.', 403);
    }

    $token = JwtHandler::generate((int) $user['id'], $user['role']);

    $stmt = $pdo->prepare('SELECT id, email, name, avatar_url, role, oauth_provider, status, created_at, updated_at FROM users WHERE id = ?');
    $stmt->execute([(int) $user['id']]);
    $fullUser = $stmt->fetch();

    ResponseHelper::success([
      'token' => $token,
      'user' => $fullUser,
    ]);
  }

  // POST /api/auth/logout — 로그아웃 (클라이언트에서 토큰 삭제 안내)
  public function logout(): void {
    AuthMiddleware::require();
    ResponseHelper::success(['message' => '로그아웃되었습니다.']);
  }

  // GET /api/auth/me — 현재 사용자 정보
  public function me(): void {
    $payload = AuthMiddleware::require();

    $pdo = Database::getInstance();
    $stmt = $pdo->prepare('SELECT id, email, name, avatar_url, role, oauth_provider, status, created_at, updated_at FROM users WHERE id = ?');
    $stmt->execute([$payload->sub]);
    $user = $stmt->fetch();

    if (!$user) {
      ResponseHelper::error('사용자를 찾을 수 없습니다.', 404);
    }

    ResponseHelper::success($user);
  }
}
