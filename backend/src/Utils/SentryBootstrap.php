<?php

namespace App\Utils;

/**
 * Sentry PHP SDK 부트스트랩
 * SENTRY_DSN 환경변수가 설정되어 있을 때만 활성화됩니다.
 */
class SentryBootstrap
{
  /**
   * Sentry 초기화
   * DSN이 비어있으면 아무 작업도 하지 않습니다.
   */
  public static function init(): void
  {
    $dsn = $_ENV['SENTRY_DSN'] ?? '';
    if (empty($dsn)) {
      return;
    }

    \Sentry\init([
      'dsn'                => $dsn,
      'environment'        => $_ENV['APP_ENV'] ?? 'production',
      'release'            => $_ENV['APP_VERSION'] ?? '1.0.0',
      'traces_sample_rate' => (float) ($_ENV['SENTRY_TRACES_RATE'] ?? 0.1),
      'before_send'        => function (\Sentry\Event $event): ?\Sentry\Event {
        // 개발 환경에서는 전송하지 않음
        if (($_ENV['APP_ENV'] ?? 'production') === 'development') {
          return null;
        }
        return $event;
      },
    ]);
  }

  /**
   * 수동 에러 캡처 (try/catch 외부에서 호출)
   */
  public static function captureException(\Throwable $e): void
  {
    if (empty($_ENV['SENTRY_DSN'] ?? '')) {
      return;
    }
    \Sentry\captureException($e);
  }
}
