<?php

namespace App\Middleware;

use App\Utils\JwtHandler;
use App\Utils\ResponseHelper;
use Firebase\JWT\ExpiredException;

class AuthMiddleware {
  // JWT 토큰 검증 — 실패 시 401 반환하고 종료
  public static function require(): object {
    $token = JwtHandler::extractFromHeader();

    if ($token === null) {
      ResponseHelper::error('인증 토큰이 필요합니다.', 401);
    }

    try {
      $payload = JwtHandler::verify($token);
    } catch (ExpiredException) {
      ResponseHelper::error('토큰이 만료되었습니다.', 401);
    } catch (\Exception) {
      ResponseHelper::error('유효하지 않은 토큰입니다.', 401);
    }

    return $payload;
  }

  // 관리자 권한 확인
  public static function requireAdmin(): object {
    $payload = self::require();

    if ($payload->role !== 'admin') {
      ResponseHelper::error('관리자 권한이 필요합니다.', 403);
    }

    return $payload;
  }
}
