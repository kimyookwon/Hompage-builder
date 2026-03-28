<?php

namespace App\Utils;

use Firebase\JWT\JWT;
use Firebase\JWT\Key;
use Firebase\JWT\ExpiredException;

class JwtHandler {
  private static string $algorithm = 'HS256';

  // JWT 토큰 생성
  public static function generate(int $userId, string $role): string {
    $secret = $_ENV['JWT_SECRET'] ?? 'default-secret';
    $expiry = (int) ($_ENV['JWT_EXPIRY'] ?? 86400);

    $payload = [
      'iss' => $_ENV['APP_URL'] ?? 'http://localhost',
      'iat' => time(),
      'exp' => time() + $expiry,
      'sub' => $userId,
      'role' => $role,
    ];

    return JWT::encode($payload, $secret, self::$algorithm);
  }

  // JWT 토큰 검증 및 페이로드 반환
  public static function verify(string $token): object {
    $secret = $_ENV['JWT_SECRET'] ?? 'default-secret';
    return JWT::decode($token, new Key($secret, self::$algorithm));
  }

  // Authorization 헤더에서 Bearer 토큰 추출
  public static function extractFromHeader(): ?string {
    $header = $_SERVER['HTTP_AUTHORIZATION'] ?? '';
    if (str_starts_with($header, 'Bearer ')) {
      return substr($header, 7);
    }
    return null;
  }
}
