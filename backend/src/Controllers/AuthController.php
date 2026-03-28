<?php

namespace App\Controllers;

use App\Services\AuthService;
use App\Utils\ResponseHelper;
use App\Middleware\AuthMiddleware;
use App\Middleware\RateLimitMiddleware;

class AuthController {
  private AuthService $authService;

  public function __construct() {
    $this->authService = new AuthService();
  }

  // POST /api/auth/register -- 자체 회원가입
  public function register(): void {
    // IP당 회원가입: 5회/시간
    $ip = $_SERVER['REMOTE_ADDR'] ?? 'unknown';
    RateLimitMiddleware::check("register_{$ip}", 5, 3600);
    RateLimitMiddleware::hit("register_{$ip}", 3600);

    $data = json_decode(file_get_contents('php://input'), true);

    $email = trim($data['email'] ?? '');
    $password = $data['password'] ?? '';
    $name = trim($data['name'] ?? '');

    $result = $this->authService->register($email, $password, $name);

    ResponseHelper::success($result, 201);
  }

  // GET /api/auth/verify-email?token= -- 이메일 인증 처리
  public function verifyEmail(): void {
    try {
      $token = trim($_GET['token'] ?? '');
      $result = $this->authService->verifyEmail($token);
      ResponseHelper::success($result);
    } catch (\Throwable $e) {
      ResponseHelper::error('이메일 인증 처리에 실패했습니다.', 500);
    }
  }

  // POST /api/auth/login -- 자체 로그인
  public function login(): void {
    // IP별 로그인 시도 제한: 10분 내 10회
    $ip = $_SERVER['REMOTE_ADDR'] ?? 'unknown';
    RateLimitMiddleware::check("login_{$ip}", 10, 600);
    RateLimitMiddleware::hit("login_{$ip}", 600);

    $data = json_decode(file_get_contents('php://input'), true);

    $email = trim($data['email'] ?? '');
    $password = $data['password'] ?? '';

    $result = $this->authService->login($email, $password);

    // 로그인 성공 -- Rate Limit 카운트 리셋
    RateLimitMiddleware::reset("login_{$ip}");

    ResponseHelper::success($result);
  }

  // POST /api/auth/logout -- 로그아웃 (클라이언트에서 토큰 삭제 안내)
  public function logout(): void {
    AuthMiddleware::require();
    ResponseHelper::success(['message' => '로그아웃되었습니다.']);
  }

  // GET /api/auth/me -- 현재 사용자 정보
  public function me(): void {
    $payload = AuthMiddleware::require();

    $user = $this->authService->me((int) $payload->sub);

    if (!$user) {
      ResponseHelper::error('사용자를 찾을 수 없습니다.', 404);
    }

    ResponseHelper::success($user);
  }
}
