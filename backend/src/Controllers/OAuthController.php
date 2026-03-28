<?php

namespace App\Controllers;

use App\Services\OAuthService;
use App\Utils\ResponseHelper;

class OAuthController {
  private OAuthService $oauthService;

  public function __construct() {
    $this->oauthService = new OAuthService();
  }

  // GET /api/auth/oauth/{provider}/redirect — OAuth 리다이렉트 URL 반환
  public function redirect(string $provider): void {
    try {
      $url = $this->oauthService->getRedirectUrl($provider);
      ResponseHelper::success(['redirect_url' => $url]);
    } catch (\InvalidArgumentException $e) {
      ResponseHelper::error($e->getMessage(), 400);
    }
  }

  // POST /api/auth/oauth/{provider}/callback — 콜백 처리 및 JWT 발급
  public function callback(string $provider): void {
    $data = json_decode(file_get_contents('php://input'), true);
    $code = $data['code'] ?? '';
    // 프론트엔드에서 사용한 redirect_uri (토큰 교환 시 동일해야 함)
    $redirectUri = $data['redirect_uri'] ?? null;

    if (empty($code)) {
      ResponseHelper::error('authorization code가 필요합니다.', 422);
    }

    try {
      $result = $this->oauthService->handleCallback($provider, $code, $redirectUri);
      ResponseHelper::success($result);
    } catch (\InvalidArgumentException $e) {
      ResponseHelper::error($e->getMessage(), 400);
    } catch (\RuntimeException $e) {
      ResponseHelper::error($e->getMessage(), 403);
    }
  }
}
