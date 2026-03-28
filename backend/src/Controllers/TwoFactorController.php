<?php

namespace App\Controllers;

use App\Config\Database;
use App\Utils\JwtHandler;
use App\Utils\TotpHelper;
use App\Utils\PasswordHash;
use App\Utils\ResponseHelper;
use App\Middleware\AuthMiddleware;

/**
 * 2FA (TOTP) 이중 인증 컨트롤러
 */
class TwoFactorController {
  /**
   * POST /api/auth/2fa/setup -- 2FA 설정 시작
   * 시크릿 생성 후 QR 코드용 URI 반환
   */
  public function setup(): void {
    try {
      $payload = AuthMiddleware::require();
      $userId = $payload->sub;

      $pdo = Database::getInstance();

      // 이미 활성화된 경우 거부
      $stmt = $pdo->prepare('SELECT totp_enabled, email FROM users WHERE id = ?');
      $stmt->execute([$userId]);
      $user = $stmt->fetch();

      if (!$user) {
        ResponseHelper::error('사용자를 찾을 수 없습니다.', 404);
      }

      if ($user['totp_enabled']) {
        ResponseHelper::error('2FA가 이미 활성화되어 있습니다.', 422);
      }

      // 시크릿 생성 및 저장 (아직 활성화하지 않음)
      $secret = TotpHelper::generateSecret();
      $stmt = $pdo->prepare('UPDATE users SET totp_secret = ? WHERE id = ?');
      $stmt->execute([$secret, $userId]);

      $issuer = $_ENV['APP_NAME'] ?? 'HomepageBuilder';
      $uri = TotpHelper::getUri($secret, $user['email'], $issuer);

      ResponseHelper::success([
        'secret' => $secret,
        'uri' => $uri,
      ]);
    } catch (\Throwable $e) {
      ResponseHelper::error('2FA 설정 중 오류가 발생했습니다.', 500);
    }
  }

  /**
   * POST /api/auth/2fa/confirm -- 코드 검증 후 2FA 활성화
   */
  public function confirm(): void {
    try {
      $payload = AuthMiddleware::require();
      $userId = $payload->sub;

      $data = json_decode(file_get_contents('php://input'), true);
      $code = trim($data['code'] ?? '');

      if (empty($code)) {
        ResponseHelper::error('인증 코드를 입력해주세요.', 422);
      }

      $pdo = Database::getInstance();
      $stmt = $pdo->prepare('SELECT totp_secret, totp_enabled FROM users WHERE id = ?');
      $stmt->execute([$userId]);
      $user = $stmt->fetch();

      if (!$user || empty($user['totp_secret'])) {
        ResponseHelper::error('먼저 2FA 설정을 시작해주세요.', 422);
      }

      if ($user['totp_enabled']) {
        ResponseHelper::error('2FA가 이미 활성화되어 있습니다.', 422);
      }

      // TOTP 코드 검증
      if (!TotpHelper::verify($user['totp_secret'], $code)) {
        ResponseHelper::error('인증 코드가 올바르지 않습니다.', 401);
      }

      // 활성화
      $stmt = $pdo->prepare('UPDATE users SET totp_enabled = 1 WHERE id = ?');
      $stmt->execute([$userId]);

      ResponseHelper::success(['message' => '2FA가 활성화되었습니다.']);
    } catch (\Throwable $e) {
      ResponseHelper::error('2FA 활성화 중 오류가 발생했습니다.', 500);
    }
  }

  /**
   * DELETE /api/auth/2fa -- 2FA 비활성화 (비밀번호 재확인 필요)
   */
  public function disable(): void {
    try {
      $payload = AuthMiddleware::require();
      $userId = $payload->sub;

      $data = json_decode(file_get_contents('php://input'), true);
      $password = $data['password'] ?? '';

      if (empty($password)) {
        ResponseHelper::error('비밀번호를 입력해주세요.', 422);
      }

      $pdo = Database::getInstance();
      $stmt = $pdo->prepare('SELECT password_hash, totp_enabled FROM users WHERE id = ?');
      $stmt->execute([$userId]);
      $user = $stmt->fetch();

      if (!$user) {
        ResponseHelper::error('사용자를 찾을 수 없습니다.', 404);
      }

      if (!$user['totp_enabled']) {
        ResponseHelper::error('2FA가 활성화되어 있지 않습니다.', 422);
      }

      // 비밀번호 재확인
      if (!PasswordHash::verify($password, $user['password_hash'])) {
        ResponseHelper::error('비밀번호가 올바르지 않습니다.', 401);
      }

      // 비활성화: 시크릿 삭제 + 플래그 해제
      $stmt = $pdo->prepare('UPDATE users SET totp_enabled = 0, totp_secret = NULL WHERE id = ?');
      $stmt->execute([$userId]);

      ResponseHelper::success(['message' => '2FA가 비활성화되었습니다.']);
    } catch (\Throwable $e) {
      ResponseHelper::error('2FA 비활성화 중 오류가 발생했습니다.', 500);
    }
  }

  /**
   * POST /api/auth/2fa/login -- 로그인 2차 인증
   * temp_token + TOTP 코드로 정식 JWT 발급
   */
  public function login(): void {
    try {
      $data = json_decode(file_get_contents('php://input'), true);
      $tempToken = $data['temp_token'] ?? '';
      $code = trim($data['code'] ?? '');

      if (empty($tempToken) || empty($code)) {
        ResponseHelper::error('임시 토큰과 인증 코드를 입력해주세요.', 422);
      }

      // 임시 토큰 검증
      try {
        $payload = JwtHandler::verify($tempToken);
      } catch (\Exception) {
        ResponseHelper::error('임시 토큰이 만료되었거나 유효하지 않습니다.', 401);
      }

      // 토큰 타입 확인 (2fa_pending만 허용)
      if (!isset($payload->type) || $payload->type !== '2fa_pending') {
        ResponseHelper::error('유효하지 않은 토큰 유형입니다.', 401);
      }

      $userId = $payload->sub;
      $pdo = Database::getInstance();

      // 사용자 및 TOTP 시크릿 조회
      $stmt = $pdo->prepare(
        'SELECT id, email, name, avatar_url, role, oauth_provider, status, points, level, totp_secret, totp_enabled, created_at, updated_at FROM users WHERE id = ?'
      );
      $stmt->execute([$userId]);
      $user = $stmt->fetch();

      if (!$user || !$user['totp_enabled'] || empty($user['totp_secret'])) {
        ResponseHelper::error('2FA 정보를 확인할 수 없습니다.', 400);
      }

      // TOTP 코드 검증
      if (!TotpHelper::verify($user['totp_secret'], $code)) {
        ResponseHelper::error('인증 코드가 올바르지 않습니다.', 401);
      }

      // 정식 JWT 발급
      $token = JwtHandler::generate((int) $user['id'], $user['role']);

      // 응답에서 민감 정보 제거
      unset($user['totp_secret'], $user['totp_enabled']);

      ResponseHelper::success([
        'token' => $token,
        'user' => $user,
      ]);
    } catch (\Throwable $e) {
      ResponseHelper::error('2FA 로그인 중 오류가 발생했습니다.', 500);
    }
  }
}
