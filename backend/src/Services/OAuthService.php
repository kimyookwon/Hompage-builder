<?php

namespace App\Services;

use App\Config\Database;
use App\Utils\JwtHandler;

class OAuthService {
  // 소셜 로그인 리다이렉트 URL 생성
  public function getRedirectUrl(string $provider): string {
    return match ($provider) {
      'google' => $this->buildGoogleUrl(),
      'kakao' => $this->buildKakaoUrl(),
      'naver' => $this->buildNaverUrl(),
      default => throw new \InvalidArgumentException("지원하지 않는 OAuth 제공자입니다: {$provider}"),
    };
  }

  // OAuth 콜백 처리 — 사용자 조회 또는 자동 가입 후 JWT 반환
  public function handleCallback(string $provider, string $code, ?string $redirectUri = null): array {
    $userInfo = match ($provider) {
      'google' => $this->fetchGoogleUser($code, $redirectUri),
      'kakao' => $this->fetchKakaoUser($code, $redirectUri),
      'naver' => $this->fetchNaverUser($code, $redirectUri),
      default => throw new \InvalidArgumentException("지원하지 않는 OAuth 제공자입니다: {$provider}"),
    };

    $user = $this->findOrCreateUser($provider, $userInfo);
    $token = JwtHandler::generate((int) $user['id'], $user['role']);

    return ['token' => $token, 'user' => $user];
  }

  // 기존 소셜 사용자 조회 또는 신규 가입
  private function findOrCreateUser(string $provider, array $userInfo): array {
    $pdo = Database::getInstance();

    $stmt = $pdo->prepare('SELECT id, email, name, role, status FROM users WHERE oauth_provider = ? AND oauth_id = ?');
    $stmt->execute([$provider, $userInfo['oauth_id']]);
    $user = $stmt->fetch();

    if ($user) {
      if ($user['status'] === 'blocked') {
        throw new \RuntimeException('차단된 계정입니다.');
      }
      return $user;
    }

    // 이메일로 기존 계정 확인 (연동)
    $stmt = $pdo->prepare('SELECT id, email, name, role, status FROM users WHERE email = ?');
    $stmt->execute([$userInfo['email']]);
    $existing = $stmt->fetch();

    if ($existing) {
      // 기존 계정에 소셜 연동
      $stmt = $pdo->prepare('UPDATE users SET oauth_provider = ?, oauth_id = ? WHERE id = ?');
      $stmt->execute([$provider, $userInfo['oauth_id'], $existing['id']]);
      return $existing;
    }

    // 신규 사용자 자동 가입
    $stmt = $pdo->prepare(
      'INSERT INTO users (email, name, role, oauth_provider, oauth_id) VALUES (?, ?, ?, ?, ?)'
    );
    $stmt->execute([
      $userInfo['email'],
      $userInfo['name'],
      'user',
      $provider,
      $userInfo['oauth_id'],
    ]);

    return [
      'id' => (int) $pdo->lastInsertId(),
      'email' => $userInfo['email'],
      'name' => $userInfo['name'],
      'role' => 'user',
    ];
  }

  private function buildGoogleUrl(): string {
    $params = http_build_query([
      'client_id' => $_ENV['GOOGLE_CLIENT_ID'],
      'redirect_uri' => $_ENV['GOOGLE_REDIRECT_URI'],
      'response_type' => 'code',
      'scope' => 'openid email profile',
    ]);
    return 'https://accounts.google.com/o/oauth2/v2/auth?' . $params;
  }

  private function buildKakaoUrl(): string {
    $params = http_build_query([
      'client_id' => $_ENV['KAKAO_CLIENT_ID'],
      'redirect_uri' => $_ENV['KAKAO_REDIRECT_URI'],
      'response_type' => 'code',
    ]);
    return 'https://kauth.kakao.com/oauth/authorize?' . $params;
  }

  private function buildNaverUrl(): string {
    $params = http_build_query([
      'client_id' => $_ENV['NAVER_CLIENT_ID'],
      'redirect_uri' => $_ENV['NAVER_REDIRECT_URI'],
      'response_type' => 'code',
      'state' => bin2hex(random_bytes(16)),
    ]);
    return 'https://nid.naver.com/oauth2.0/authorize?' . $params;
  }

  private function fetchGoogleUser(string $code, ?string $redirectUri = null): array {
    $tokenRes = $this->httpPost('https://oauth2.googleapis.com/token', [
      'code' => $code,
      'client_id' => $_ENV['GOOGLE_CLIENT_ID'],
      'client_secret' => $_ENV['GOOGLE_CLIENT_SECRET'],
      'redirect_uri' => $redirectUri ?? $_ENV['GOOGLE_REDIRECT_URI'],
      'grant_type' => 'authorization_code',
    ]);

    $userRes = $this->httpGetWithBearer('https://www.googleapis.com/oauth2/v3/userinfo', $tokenRes['access_token']);

    return [
      'oauth_id' => $userRes['sub'],
      'email' => $userRes['email'],
      'name' => $userRes['name'],
    ];
  }

  private function fetchKakaoUser(string $code, ?string $redirectUri = null): array {
    $tokenRes = $this->httpPost('https://kauth.kakao.com/oauth/token', [
      'code' => $code,
      'client_id' => $_ENV['KAKAO_CLIENT_ID'],
      'client_secret' => $_ENV['KAKAO_CLIENT_SECRET'],
      'redirect_uri' => $redirectUri ?? $_ENV['KAKAO_REDIRECT_URI'],
      'grant_type' => 'authorization_code',
    ]);

    $userRes = $this->httpGetWithBearer('https://kapi.kakao.com/v2/user/me', $tokenRes['access_token']);

    return [
      'oauth_id' => (string) $userRes['id'],
      'email' => $userRes['kakao_account']['email'] ?? '',
      'name' => $userRes['kakao_account']['profile']['nickname'] ?? '카카오 사용자',
    ];
  }

  private function fetchNaverUser(string $code, ?string $redirectUri = null): array {
    $tokenRes = $this->httpPost('https://nid.naver.com/oauth2.0/token', [
      'code' => $code,
      'client_id' => $_ENV['NAVER_CLIENT_ID'],
      'client_secret' => $_ENV['NAVER_CLIENT_SECRET'],
      'redirect_uri' => $redirectUri ?? $_ENV['NAVER_REDIRECT_URI'],
      'grant_type' => 'authorization_code',
    ]);

    $userRes = $this->httpGetWithBearer('https://openapi.naver.com/v1/nid/me', $tokenRes['access_token']);

    return [
      'oauth_id' => $userRes['response']['id'],
      'email' => $userRes['response']['email'],
      'name' => $userRes['response']['name'],
    ];
  }

  private function httpPost(string $url, array $data): array {
    $ch = curl_init($url);
    curl_setopt_array($ch, [
      CURLOPT_POST => true,
      CURLOPT_POSTFIELDS => http_build_query($data),
      CURLOPT_RETURNTRANSFER => true,
      CURLOPT_HTTPHEADER => ['Content-Type: application/x-www-form-urlencoded'],
    ]);
    $response = curl_exec($ch);
    curl_close($ch);
    return json_decode($response, true);
  }

  private function httpGetWithBearer(string $url, string $accessToken): array {
    $ch = curl_init($url);
    curl_setopt_array($ch, [
      CURLOPT_RETURNTRANSFER => true,
      CURLOPT_HTTPHEADER => ["Authorization: Bearer {$accessToken}"],
    ]);
    $response = curl_exec($ch);
    curl_close($ch);
    return json_decode($response, true);
  }
}
