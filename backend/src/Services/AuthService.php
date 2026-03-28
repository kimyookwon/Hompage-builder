<?php

namespace App\Services;

use App\Config\Database;
use App\Utils\JwtHandler;
use App\Utils\PasswordHash;
use App\Utils\ResponseHelper;

class AuthService {
  // 회원가입 (이메일 중복 확인 + 사용자 생성 + JWT 발급 + 인증 이메일 발송)
  public function register(string $email, string $password, string $name): array {
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

    $this->sendVerificationEmail($email, $name, $verifyToken);

    $stmt = $pdo->prepare('SELECT id, email, name, avatar_url, role, oauth_provider, status, points, level, created_at, updated_at FROM users WHERE id = ?');
    $stmt->execute([$userId]);
    $newUser = $stmt->fetch();

    return [
      'token' => $token,
      'user' => $newUser,
    ];
  }

  // 로그인 (비밀번호 검증 + 2FA 분기 + JWT 발급)
  public function login(string $email, string $password): array {
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

    // 2FA 활성화 사용자: 임시 토큰 발급 후 2차 인증 요구
    if (!empty($user['totp_enabled'])) {
      $tempToken = JwtHandler::generateCustom([
        'sub' => (int) $user['id'],
        'type' => '2fa_pending',
      ], 300); // 5분 유효

      return [
        'requires_2fa' => true,
        'temp_token' => $tempToken,
      ];
    }

    $token = JwtHandler::generate((int) $user['id'], $user['role']);

    $stmt = $pdo->prepare('SELECT id, email, name, avatar_url, role, oauth_provider, status, points, level, created_at, updated_at FROM users WHERE id = ?');
    $stmt->execute([(int) $user['id']]);
    $fullUser = $stmt->fetch();

    return [
      'token' => $token,
      'user' => $fullUser,
    ];
  }

  // 현재 사용자 정보 조회
  public function me(int $userId): array|false {
    $pdo = Database::getInstance();
    $stmt = $pdo->prepare('SELECT id, email, name, avatar_url, role, oauth_provider, status, points, level, created_at, updated_at FROM users WHERE id = ?');
    $stmt->execute([$userId]);
    return $stmt->fetch();
  }

  // 이메일 인증 처리
  public function verifyEmail(string $token): array {
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
      return ['message' => '이메일 인증이 완료되었습니다.'];
    }

    // 인증 완료 처리
    $pdo->prepare(
      'UPDATE users SET email_verified_at = NOW(), email_verify_token = NULL WHERE id = ?'
    )->execute([(int) $user['id']]);

    return ['message' => '이메일 인증이 완료되었습니다.'];
  }

  // 인증 이메일 발송 (내부 헬퍼)
  private function sendVerificationEmail(string $email, string $name, string $verifyToken): void {
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

      EmailService::send($email, $name, '이메일 인증 안내', $html);
    } catch (\Throwable) {
      // 이메일 발송 실패해도 회원가입은 성공 처리
    }
  }
}
