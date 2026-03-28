<?php

/**
 * Rate Limit 미들웨어 테스트
 *
 * 실행: php tests/RateLimitTest.php
 */

define('BASE_PATH', dirname(__DIR__));
require BASE_PATH . '/vendor/autoload.php';

use App\Middleware\RateLimitMiddleware;

class RateLimitTest
{
  private int $passed = 0;
  private int $failed = 0;
  private string $logDir = '/var/www/backend/logs/ratelimit';
  private array $testKeys = [];

  private function assert(string $name, bool $condition, string $msg = ''): void
  {
    if ($condition) {
      echo "  [PASS] {$name}\n";
      $this->passed++;
    } else {
      echo "  [FAIL] {$name}" . ($msg ? ": {$msg}" : '') . "\n";
      $this->failed++;
    }
  }

  /**
   * setUp: 테스트 전 로그 디렉토리 생성
   */
  private function setUp(): void
  {
    // 로그 디렉토리 생성 (없으면)
    if (!is_dir($this->logDir)) {
      mkdir($this->logDir, 0755, true);
    }
  }

  /**
   * tearDown: 테스트 후 생성된 파일 정리
   */
  private function tearDown(): void
  {
    foreach ($this->testKeys as $key) {
      // 키를 안전한 파일명으로 변환 (RateLimitMiddleware와 동일 로직)
      $safeKey = preg_replace('/[^a-zA-Z0-9_\-]/', '_', $key);
      $filePath = $this->logDir . '/' . $safeKey . '.json';
      if (file_exists($filePath)) {
        @unlink($filePath);
      }
    }
    $this->testKeys = [];
  }

  /**
   * 테스트 1: 기본 hit/remaining 동작
   */
  public function testBasicHitAndRemaining(): void
  {
    echo "\n[테스트] Rate Limit — 기본 hit/remaining 동작\n";

    $this->setUp();
    $testKey = 'test_rate_limit_basic_' . time();
    $this->testKeys[] = $testKey;

    // 5회 hit
    for ($i = 0; $i < 5; $i++) {
      RateLimitMiddleware::hit($testKey, 3600);
    }

    // remaining 확인 (maxAttempts=10)
    $remaining = RateLimitMiddleware::remaining($testKey, 10);
    $this->assert(
      '5회 hit 후 remaining=5',
      $remaining === 5,
      "actual: {$remaining}"
    );

    // remaining 경계값: 0 이상이어야 함
    $this->assert(
      'remaining 값이 0 이상',
      $remaining >= 0,
      "actual: {$remaining}"
    );

    // reset 후 remaining 복원
    RateLimitMiddleware::reset($testKey);
    $remaining = RateLimitMiddleware::remaining($testKey, 10);
    $this->assert(
      'reset 후 remaining=10 복원',
      $remaining === 10,
      "actual: {$remaining}"
    );

    $this->tearDown();
  }

  /**
   * 테스트 2: 최대 횟수 초과 감지
   *
   * 주의: check() 메서드는 429 응답을 발생시키므로, 직접 호출 불가
   * 대신 hit/remaining으로 시뮬레이션
   */
  public function testMaxAttemptsExceeded(): void
  {
    echo "\n[테스트] Rate Limit — 최대 횟수 초과 감지\n";

    $this->setUp();
    $testKey = 'test_rate_limit_max_' . time();
    $this->testKeys[] = $testKey;

    $maxAttempts = 3;

    // maxAttempts=3일 때 4회 hit 후 remaining 확인
    for ($i = 0; $i < 4; $i++) {
      RateLimitMiddleware::hit($testKey, 3600);
    }

    $remaining = RateLimitMiddleware::remaining($testKey, $maxAttempts);

    // remaining이 0 이하면 초과 상태
    $this->assert(
      "maxAttempts={$maxAttempts}, 4회 hit 후 remaining <= 0",
      $remaining <= 0,
      "actual: {$remaining}"
    );

    // 정확히 3회 hit 후는 remaining=0
    RateLimitMiddleware::reset($testKey);
    for ($i = 0; $i < 3; $i++) {
      RateLimitMiddleware::hit($testKey, 3600);
    }
    $remaining = RateLimitMiddleware::remaining($testKey, $maxAttempts);
    $this->assert(
      "maxAttempts={$maxAttempts}, 3회 hit 후 remaining=0",
      $remaining === 0,
      "actual: {$remaining}"
    );

    $this->tearDown();
  }

  /**
   * 테스트 3: TTL 만료 후 리셋
   *
   * 짧은 TTL(1초)로 테스트하여 만료 후 remaining이 복원되는지 확인
   */
  public function testTtlExpiration(): void
  {
    echo "\n[테스트] Rate Limit — TTL 만료 후 리셋\n";

    $this->setUp();
    $testKey = 'test_rate_limit_ttl_' . time();
    $this->testKeys[] = $testKey;

    // 1초 TTL로 1회 hit
    RateLimitMiddleware::hit($testKey, 1);
    $remaining1 = RateLimitMiddleware::remaining($testKey, 10);
    $this->assert(
      '1회 hit 직후 remaining=9',
      $remaining1 === 9,
      "actual: {$remaining1}"
    );

    // 2초 대기 (TTL 만료)
    sleep(2);

    // TTL 만료 후 remaining 복원 확인
    $remaining2 = RateLimitMiddleware::remaining($testKey, 10);
    $this->assert(
      'TTL 만료 후 remaining=10 복원',
      $remaining2 === 10,
      "actual: {$remaining2}"
    );

    $this->tearDown();
  }

  /**
   * 테스트 4: userKey 헬퍼 메서드
   *
   * userKey()가 올바른 형식을 반환하는지 확인
   */
  public function testUserKeyFormat(): void
  {
    echo "\n[테스트] Rate Limit — userKey() 헬퍼\n";

    $action = 'login';
    $userId = 123;
    $key = RateLimitMiddleware::userKey($action, $userId);

    $expected = "user_{$action}_{$userId}";
    $this->assert(
      "userKey('{$action}', {$userId}) 형식",
      $key === $expected,
      "expected: {$expected}, actual: {$key}"
    );

    // 다양한 action 테스트
    $actions = ['login', 'register', '2fa'];
    foreach ($actions as $act) {
      $k = RateLimitMiddleware::userKey($act, 456);
      $exp = "user_{$act}_456";
      $this->assert(
        "userKey('{$act}', 456) = '{$exp}'",
        $k === $exp,
        "actual: {$k}"
      );
    }
  }

  /**
   * 테스트 5: 동일 키에 대한 hit 누적
   */
  public function testConsecutiveHits(): void
  {
    echo "\n[테스트] Rate Limit — 연속 hit 누적\n";

    $this->setUp();
    $testKey = 'test_rate_limit_consecutive_' . time();
    $this->testKeys[] = $testKey;

    $maxAttempts = 10;

    // 1-10회까지 hit하면서 remaining 확인
    for ($i = 1; $i <= 10; $i++) {
      RateLimitMiddleware::hit($testKey, 3600);
      $remaining = RateLimitMiddleware::remaining($testKey, $maxAttempts);
      $expected = $maxAttempts - $i;

      $this->assert(
        "hit {$i}회 후 remaining={$expected}",
        $remaining === $expected,
        "actual: {$remaining}"
      );
    }

    $this->tearDown();
  }

  /**
   * 테스트 6: reset() 후 상태 확인
   */
  public function testResetClearsState(): void
  {
    echo "\n[테스트] Rate Limit — reset() 상태 초기화\n";

    $this->setUp();
    $testKey = 'test_rate_limit_reset_' . time();
    $this->testKeys[] = $testKey;

    // 여러 번 hit
    for ($i = 0; $i < 8; $i++) {
      RateLimitMiddleware::hit($testKey, 3600);
    }

    $remaining1 = RateLimitMiddleware::remaining($testKey, 10);
    $this->assert(
      '8회 hit 후 remaining=2',
      $remaining1 === 2,
      "actual: {$remaining1}"
    );

    // reset 호출
    RateLimitMiddleware::reset($testKey);

    $remaining2 = RateLimitMiddleware::remaining($testKey, 10);
    $this->assert(
      'reset 후 remaining=10',
      $remaining2 === 10,
      "actual: {$remaining2}"
    );

    $this->tearDown();
  }

  /**
   * 테스트 7: 다중 키 독립성
   *
   * 서로 다른 키에 대한 hit이 독립적으로 동작하는지 확인
   */
  public function testMultipleKeysIndependence(): void
  {
    echo "\n[테스test] Rate Limit — 다중 키 독립성\n";

    $this->setUp();
    $testKey1 = 'test_rate_limit_key1_' . time();
    $testKey2 = 'test_rate_limit_key2_' . time();
    $this->testKeys = [$testKey1, $testKey2];

    // key1에 5회, key2에 3회 hit
    for ($i = 0; $i < 5; $i++) {
      RateLimitMiddleware::hit($testKey1, 3600);
    }
    for ($i = 0; $i < 3; $i++) {
      RateLimitMiddleware::hit($testKey2, 3600);
    }

    $remaining1 = RateLimitMiddleware::remaining($testKey1, 10);
    $remaining2 = RateLimitMiddleware::remaining($testKey2, 10);

    $this->assert(
      'key1 remaining=5',
      $remaining1 === 5,
      "actual: {$remaining1}"
    );

    $this->assert(
      'key2 remaining=7',
      $remaining2 === 7,
      "actual: {$remaining2}"
    );

    $this->tearDown();
  }

  public function run(): void
  {
    echo "=== RateLimitTest 실행 ===\n";
    $this->testBasicHitAndRemaining();
    $this->testMaxAttemptsExceeded();
    $this->testTtlExpiration();
    $this->testUserKeyFormat();
    $this->testConsecutiveHits();
    $this->testResetClearsState();
    $this->testMultipleKeysIndependence();

    echo "\n=== 결과: {$this->passed} 통과, {$this->failed} 실패 ===\n";
    exit($this->failed > 0 ? 1 : 0);
  }
}

(new RateLimitTest())->run();
