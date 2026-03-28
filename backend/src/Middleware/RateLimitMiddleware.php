<?php

namespace App\Middleware;

use App\Utils\ResponseHelper;

// IP별 파일 기반 Rate Limiting 미들웨어
class RateLimitMiddleware {
  private const LOG_DIR = '/var/www/backend/logs/ratelimit';

  // 시도 횟수 확인 - 초과 시 429 응답 후 종료
  public static function check(string $key, int $maxAttempts, int $windowSeconds): void {
    $data = self::load($key);
    $now = time();

    // 윈도우가 만료되었으면 초기화
    if ($data['reset_at'] <= $now) {
      // 새 윈도우 — 헤더만 전송
      header('X-RateLimit-Limit: ' . $maxAttempts);
      header('X-RateLimit-Remaining: ' . $maxAttempts);
      header('X-RateLimit-Reset: ' . ($now + $windowSeconds));
      return;
    }

    // Rate Limit 헤더 전송
    $remaining = max(0, $maxAttempts - $data['count']);
    header('X-RateLimit-Limit: ' . $maxAttempts);
    header('X-RateLimit-Remaining: ' . $remaining);
    header('X-RateLimit-Reset: ' . $data['reset_at']);

    // 최대 시도 횟수 초과 확인
    if ($data['count'] >= $maxAttempts) {
      ResponseHelper::error('요청이 너무 많습니다. 잠시 후 다시 시도해주세요.', 429);
    }
  }

  // 남은 시도 횟수 반환 (응답 헤더용)
  public static function remaining(string $key, int $maxAttempts): int {
    $data = self::load($key);
    $now = time();

    if ($data['reset_at'] <= $now) {
      return $maxAttempts;
    }

    return max(0, $maxAttempts - $data['count']);
  }

  // 특정 키 초기화 (로그인 성공 시 카운트 리셋)
  public static function reset(string $key): void {
    $filePath = self::filePath($key);
    if (file_exists($filePath)) {
      @unlink($filePath);
    }
  }

  // 사용자 ID 기반 키 생성 헬퍼
  public static function userKey(string $action, int $userId): string {
    return "user_{$action}_{$userId}";
  }

  // 카운트 증가 (성공/실패 관계없이 호출)
  public static function hit(string $key, int $windowSeconds): void {
    $data = self::load($key);
    $now = time();

    // 윈도우가 만료되었으면 새로 시작
    if ($data['reset_at'] <= $now) {
      $data = [
        'count' => 1,
        'reset_at' => $now + $windowSeconds,
      ];
    } else {
      $data['count']++;
    }

    self::save($key, $data);
  }

  // 키에 해당하는 JSON 파일 로드
  private static function load(string $key): array {
    $filePath = self::filePath($key);

    if (!file_exists($filePath)) {
      return ['count' => 0, 'reset_at' => 0];
    }

    $content = file_get_contents($filePath);
    if ($content === false) {
      return ['count' => 0, 'reset_at' => 0];
    }

    $data = json_decode($content, true);
    if (!is_array($data) || !isset($data['count'], $data['reset_at'])) {
      return ['count' => 0, 'reset_at' => 0];
    }

    return $data;
  }

  // JSON 파일에 저장
  private static function save(string $key, array $data): void {
    $dir = self::LOG_DIR;
    if (!is_dir($dir)) {
      mkdir($dir, 0755, true);
    }

    $filePath = self::filePath($key);
    file_put_contents($filePath, json_encode($data), LOCK_EX);
  }

  // 키를 안전한 파일명으로 변환
  private static function filePath(string $key): string {
    // 키에 포함될 수 있는 특수문자를 안전하게 해시
    $safeKey = preg_replace('/[^a-zA-Z0-9_\-]/', '_', $key);
    return self::LOG_DIR . '/' . $safeKey . '.json';
  }
}
