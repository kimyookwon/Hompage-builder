<?php

namespace App\Controllers;

use App\Config\Database;
use App\Utils\JwtHandler;
use App\Utils\PasswordHash;
use App\Utils\ResponseHelper;
use App\Middleware\AuthMiddleware;
use App\Middleware\RateLimitMiddleware;

class AuthController {
  // POST /api/auth/register — 자체 회원가입
  public function register(): void {
    // IP당 회원가입: 5회/시간
    $ip = $_SERVER['REMOTE_ADDR'] ?? 'unknown';
    RateLimitMiddleware::check("register_{$ip}", 5, 3600);
    RateLimitMiddleware::hit("register_{$ip}", 3600);

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

    // 이메일 인증 토큰 생성 및 발송
    $verifyToken = bin2hex(random_bytes(32));
    $pdo->prepare('UPDATE users SET email_verify_token = ? WHERE id = ?')
        ->execute([$verifyToken, $userId]);

    try {
      $siteUrl    = rtrim($_ENV['SITE_URL'] ?? 'http://localhost:3000', '/');
      $verifyLink = "{$siteUrl}/verify-email?token={$verifyToken}";

      $html = <<<HTML
<!DOCTYPE html>
<html lang="ko">
<head><meta charset="UTF-8"></head>
<body style="font-family:sans-serif;color:#222;max-width:540px;margin:0 auto;padding:24px;">
  <h2 style="font-size:18px;margin-bottom:8px;">이메일 인증</h2>
  <p style="color:#555;font-size:14px;margin-bottom:16px;">
    안녕하세요, <strong>{$name}</strong>님.<br>
    아래 버튼을 클릭하여 이메일 인증을 완료해주세요.
  </p>
  <p style="margin-top:20px;">
    <a href="{$verifyLink}"
       style="background:#3b82f6;color:#fff;padding:10px 22px;border-radius:6px;text-decoration:none;font-size:14px;">
      이메일 인증하기
    </a>
  </p>
  <p style="margin-top:16px;font-size:12px;color:#999;">
    링크가 작동하지 않으면 아래 URL을 브라우저에 붙여넣으세요:<br>
    <a href="{$verifyLink}" style="color:#3b82f6;">{$verifyLink}</a>
  </p>
  <hr style="border:none;border-top:1px solid #e5e7eb;margin:24px 0;">
  <p style="font-size:12px;color:#999;">이 메일은 자동 발송된 알림입니다.</p>
</body>
</html>
HTML;

      \App\Services\EmailService::send($email, $name, '이메일 인증 안내', $html);
    } catch (\Throwable) {
      // 이메일 발송 실패해도 회원가입은 성공 처리
    }

    $stmt = $pdo->prepare('SELECT id, email, name, avatar_url, role, oauth_provider, status, points, level, created_at, updated_at FROM users WHERE id = ?');
    $stmt->execute([$userId]);
    $newUser = $stmt->fetch();

    ResponseHelper::success([
      'token' => $token,
      'user' => $newUser,
    ], 201);
  }

  // GET /api/auth/verify-email?token= -- 이메일 인증 처리
  public function verifyEmail(): void {
    try {
      $token = trim($_GET['token'] ?? '');

      if (empty($token)) {
        ResponseHelper::error('인증 토큰이 필요합니다.', 400);
      }

      $pdo = Database::getInstance();

      // 토큰으로 사용자 조회
      $stmt = $pdo->prepare(
        'SELECT id, email_verified_at FROM users WHERE email_verify_token = ?'
      );
      $stmt->execute([$token]);
      $user = $stmt->fetch();

      if (!$user) {
        ResponseHelper::error('유효하지 않은 인증 토큰입니다.', 400);
      }

      // 이미 인증된 경우 -> 멱등 처리
      if ($user['email_verified_at'] !== null) {
        ResponseHelper::success(['message' => '이메일 인증이 완료되었습니다.']);
        return;
      }

      // 인증 완료 처리
      $pdo->prepare(
        'UPDATE users SET email_verified_at = NOW(), email_verify_token = NULL WHERE id = ?'
      )->execute([(int) $user['id']]);

      ResponseHelper::success(['message' => '이메일 인증이 완료되었습니다.']);
    } catch (\Throwable $e) {
      ResponseHelper::error('이메일 인증 처리에 실패했습니다.', 500);
    }
  }

  // POST /api/auth/login — 자체 로그인
  public function login(): void {
    // IP별 로그인 시도 제한: 10분 내 10회
    $ip = $_SERVER['REMOTE_ADDR'] ?? 'unknown';
    RateLimitMiddleware::check("login_{$ip}", 10, 600);
    RateLimitMiddleware::hit("login_{$ip}", 600);

    $data = json_decode(file_get_contents('php://input'), true);

    $email = trim($data['email'] ?? '');
    $password = $data['password'] ?? '';

    if (empty($email) || empty($password)) {
      ResponseHelper::error('이메일과 비밀번호를 입력해주세요.', 422);
    }

    $pdo = Database::getInstance();
    $stmt = $pdo->prepare('SELECT id, email, name, role, password_hash, status, totp_enabled FROM users WHERE email = ?');
    $stmt->execute([$email]);
    $user = $stmt->fetch();

    if (!$user || !PasswordHash::verify($password, $user['password_hash'] ?? '')) {
      ResponseHelper::error('이메일 또는 비밀번호가 올바르지 않습니다.', 401);
    }

    // 차단된 사용자 로그인 거부
    if ($user['status'] === 'blocked') {
      ResponseHelper::error('차단된 계정입니다. 관리자에게 문의해주세요.', 403);
    }

    // 로그인 성공 — Rate Limit 카운트 리셋
    RateLimitMiddleware::reset("login_{$ip}");

    // 2FA 활성화 사용자: 임시 토큰 발급 후 2차 인증 요구
    if (!empty($user['totp_enabled'])) {
      $tempToken = JwtHandler::generateCustom([
        'sub' => (int) $user['id'],
        'type' => '2fa_pending',
      ], 300); // 5분 유효

      ResponseHelper::success([
        'requires_2fa' => true,
        'temp_token' => $tempToken,
      ]);
      return;
    }

    $token = JwtHandler::generate((int) $user['id'], $user['role']);

    $stmt = $pdo->prepare('SELECT id, email, name, avatar_url, role, oauth_provider, status, points, level, created_at, updated_at FROM users WHERE id = ?');
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
    $stmt = $pdo->prepare('SELECT id, email, name, avatar_url, role, oauth_provider, status, points, level, created_at, updated_at FROM users WHERE id = ?');
    $stmt->execute([$payload->sub]);
    $user = $stmt->fetch();

    if (!$user) {
      ResponseHelper::error('사용자를 찾을 수 없습니다.', 404);
    }

    ResponseHelper::success($user);
  }
}
