<?php

namespace App\Controllers;

use App\Config\Database;
use App\Services\EmailService;
use App\Utils\ResponseHelper;

class PasswordResetController {
  // POST /api/auth/forgot-password — 재설정 이메일 발송
  public function requestReset(): void {
    $data  = json_decode(file_get_contents('php://input'), true);
    $email = trim($data['email'] ?? '');

    if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
      ResponseHelper::error('유효한 이메일을 입력해주세요.', 422);
    }

    $pdo = Database::getInstance();

    // 사용자 존재 여부 확인 (보안: 존재 여부 노출 방지 — 항상 200 반환)
    $user = $pdo->prepare('SELECT id, name FROM users WHERE email = ? AND status = ?');
    $user->execute([$email, 'active']);
    $userRow = $user->fetch();

    if ($userRow) {
      // 이전 토큰 무효화 (이메일당 하나만 유효)
      $pdo->prepare('DELETE FROM password_reset_tokens WHERE email = ?')
          ->execute([$email]);

      // 보안 토큰 생성 (32바이트 → 64자 hex)
      $rawToken  = bin2hex(random_bytes(32));
      $expiresAt = date('Y-m-d H:i:s', time() + 3600); // 1시간

      $pdo->prepare(
        'INSERT INTO password_reset_tokens (email, token, expires_at) VALUES (?, ?, ?)'
      )->execute([$email, $rawToken, $expiresAt]);

      // 이메일 발송
      $siteUrl   = rtrim($_ENV['SITE_URL'] ?? 'http://localhost:3000', '/');
      $resetLink = "{$siteUrl}/reset-password?token={$rawToken}";
      $name      = $userRow['name'];

      $html = <<<HTML
<!DOCTYPE html>
<html lang="ko">
<head><meta charset="UTF-8"></head>
<body style="font-family:sans-serif;color:#222;max-width:540px;margin:0 auto;padding:24px;">
  <h2 style="font-size:18px;margin-bottom:8px;">비밀번호 재설정</h2>
  <p style="color:#555;font-size:14px;margin-bottom:16px;">
    안녕하세요, <strong>{$name}</strong>님.<br>
    아래 버튼을 클릭하여 비밀번호를 재설정하세요.<br>
    이 링크는 <strong>1시간</strong> 동안 유효합니다.
  </p>
  <p style="margin-top:20px;">
    <a href="{$resetLink}"
       style="background:#3b82f6;color:#fff;padding:10px 22px;border-radius:6px;text-decoration:none;font-size:14px;">
      비밀번호 재설정
    </a>
  </p>
  <p style="margin-top:16px;font-size:12px;color:#999;">
    링크가 작동하지 않으면 아래 URL을 브라우저에 붙여넣으세요:<br>
    <a href="{$resetLink}" style="color:#3b82f6;">{$resetLink}</a>
  </p>
  <hr style="border:none;border-top:1px solid #e5e7eb;margin:24px 0;">
  <p style="font-size:12px;color:#999;">
    본인이 요청하지 않았다면 이 이메일을 무시하세요.
  </p>
</body>
</html>
HTML;

      EmailService::send($email, $name, '비밀번호 재설정 안내', $html);
    }

    // 존재 여부 노출 방지 — 항상 동일한 응답
    ResponseHelper::success(['message' => '이메일이 전송되었습니다. 받은 편지함을 확인해주세요.']);
  }

  // POST /api/auth/reset-password — 새 비밀번호 설정
  public function resetPassword(): void {
    $data     = json_decode(file_get_contents('php://input'), true);
    $token    = trim($data['token'] ?? '');
    $password = $data['password'] ?? '';

    if (empty($token)) {
      ResponseHelper::error('유효하지 않은 요청입니다.', 422);
    }
    if (mb_strlen($password) < 8) {
      ResponseHelper::error('비밀번호는 8자 이상이어야 합니다.', 422);
    }

    $pdo = Database::getInstance();

    // 토큰 검증 (미사용 + 미만료)
    $stmt = $pdo->prepare(
      'SELECT * FROM password_reset_tokens
       WHERE token = ? AND used_at IS NULL AND expires_at > NOW()'
    );
    $stmt->execute([$token]);
    $tokenRow = $stmt->fetch();

    if (!$tokenRow) {
      ResponseHelper::error('토큰이 유효하지 않거나 만료되었습니다.', 400);
    }

    $email = $tokenRow['email'];

    // 사용자 조회
    $userStmt = $pdo->prepare('SELECT id FROM users WHERE email = ? AND status = ?');
    $userStmt->execute([$email, 'active']);
    $userRow = $userStmt->fetch();

    if (!$userRow) {
      ResponseHelper::error('사용자를 찾을 수 없습니다.', 404);
    }

    // 비밀번호 업데이트
    $hashed = password_hash($password, PASSWORD_BCRYPT);
    $pdo->prepare('UPDATE users SET password = ? WHERE id = ?')
        ->execute([$hashed, $userRow['id']]);

    // 토큰 사용 처리 (단일 사용)
    $pdo->prepare('UPDATE password_reset_tokens SET used_at = NOW() WHERE token = ?')
        ->execute([$token]);

    // 해당 이메일의 나머지 토큰 정리
    $pdo->prepare('DELETE FROM password_reset_tokens WHERE email = ? AND token != ?')
        ->execute([$email, $token]);

    ResponseHelper::success(['message' => '비밀번호가 성공적으로 변경되었습니다.']);
  }

  // GET /api/auth/reset-password/verify?token= — 토큰 유효성 사전 확인
  public function verifyToken(): void {
    $token = trim($_GET['token'] ?? '');

    if (empty($token)) {
      ResponseHelper::error('토큰이 없습니다.', 422);
    }

    $pdo  = Database::getInstance();
    $stmt = $pdo->prepare(
      'SELECT email FROM password_reset_tokens
       WHERE token = ? AND used_at IS NULL AND expires_at > NOW()'
    );
    $stmt->execute([$token]);
    $row = $stmt->fetch();

    if (!$row) {
      ResponseHelper::error('토큰이 유효하지 않거나 만료되었습니다.', 400);
    }

    // 이메일 마스킹 (보안)
    $email  = $row['email'];
    $parts  = explode('@', $email);
    $masked = mb_substr($parts[0], 0, 2) . '***@' . ($parts[1] ?? '');

    ResponseHelper::success(['email' => $masked]);
  }
}
