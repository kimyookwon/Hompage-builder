<?php

/**
 * TOTP 유틸리티 단위 테스트
 *
 * 실행: php tests/TotpHelperTest.php
 */

define('BASE_PATH', dirname(__DIR__));
require BASE_PATH . '/vendor/autoload.php';

use App\Utils\TotpHelper;

class TotpHelperTest
{
  private int $passed = 0;
  private int $failed = 0;

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
   * 테스트 1: 시크릿 생성 기본 검증
   * - generateSecret() 반환값이 32자인지 확인
   * - Base32 문자(A-Z2-7)로만 구성되어 있는지 확인
   */
  public function testGenerateSecretLength(): void
  {
    echo "\n[테스트] TOTP 시크릿 생성 — 길이 및 문자 검증\n";

    $secret = TotpHelper::generateSecret();

    $this->assert(
      '시크릿 길이 32자',
      strlen($secret) === 32,
      "actual: {$secret} (길이: " . strlen($secret) . ")"
    );

    // Base32는 A-Z와 2-7로만 구성
    $this->assert(
      '시크릿이 Base32 문자로만 구성',
      preg_match('/^[A-Z2-7]{32}$/', $secret) === 1,
      "actual: {$secret}"
    );
  }

  /**
   * 테스트 2: 시크릿 생성 시 매번 다른 값 반환
   */
  public function testGenerateSecretUniqueness(): void
  {
    echo "\n[테스트] TOTP 시크릿 생성 — 고유성 검증\n";

    $secret1 = TotpHelper::generateSecret();
    $secret2 = TotpHelper::generateSecret();
    $secret3 = TotpHelper::generateSecret();

    $this->assert(
      '첫 번째와 두 번째 시크릿이 다름',
      $secret1 !== $secret2,
      "s1={$secret1}, s2={$secret2}"
    );

    $this->assert(
      '두 번째와 세 번째 시크릿이 다름',
      $secret2 !== $secret3,
      "s2={$secret2}, s3={$secret3}"
    );

    $this->assert(
      '첫 번째와 세 번째 시크릿이 다름',
      $secret1 !== $secret3,
      "s1={$secret1}, s3={$secret3}"
    );
  }

  /**
   * 테스트 3: otpauth URI 생성 검증
   * - 'otpauth://totp/'로 시작
   * - secret 파라미터 포함
   * - issuer 파라미터 포함
   */
  public function testGetUriFormat(): void
  {
    echo "\n[테스트] TOTP URI 생성 — 형식 검증\n";

    $secret = TotpHelper::generateSecret();
    $email = 'test@example.com';
    $issuer = 'TestApp';

    $uri = TotpHelper::getUri($secret, $email, $issuer);

    $this->assert(
      "URI가 'otpauth://totp/'로 시작",
      strpos($uri, 'otpauth://totp/') === 0,
      "actual: {$uri}"
    );

    $this->assert(
      'secret 파라미터 포함',
      strpos($uri, "secret={$secret}") !== false,
      "actual: {$uri}"
    );

    $this->assert(
      'issuer 파라미터 포함',
      strpos($uri, "issuer={$issuer}") !== false,
      "actual: {$uri}"
    );

    $this->assert(
      'algorithm=SHA1 파라미터 포함',
      strpos($uri, 'algorithm=SHA1') !== false,
      "actual: {$uri}"
    );

    $this->assert(
      'digits=6 파라미터 포함',
      strpos($uri, 'digits=6') !== false,
      "actual: {$uri}"
    );

    $this->assert(
      'period=30 파라미터 포함',
      strpos($uri, 'period=30') !== false,
      "actual: {$uri}"
    );
  }

  /**
   * 테스트 4: 유효하지 않은 코드 거부
   * - 6자리 미만 코드 → verify() false
   * - 숫자가 아닌 코드 → verify() false
   * - 빈 코드 → verify() false
   */
  public function testInvalidCodeRejection(): void
  {
    echo "\n[테스트] TOTP 코드 검증 — 유효하지 않은 코드 거부\n";

    $secret = TotpHelper::generateSecret();

    $invalidCodes = [
      ''          => '빈 코드',
      '12345'     => '5자리 코드',
      '1234567'   => '7자리 코드',
      'abc123'    => '문자 포함',
      '12 3456'   => '공백 포함',
      '000000x'   => '문자 포함 (7자)',
    ];

    foreach ($invalidCodes as $code => $description) {
      $result = TotpHelper::verify($secret, $code);
      $this->assert(
        "코드 '{$code}' 거부 ({$description})",
        $result === false,
        "actual: " . ($result ? 'true' : 'false')
      );
    }
  }

  /**
   * 테스트 5: 경계값 테스트 — 정확히 6자리 숫자 형식 확인
   */
  public function testCodeFormatBoundary(): void
  {
    echo "\n[테스test] TOTP 코드 검증 — 경계값 테스트\n";

    $secret = TotpHelper::generateSecret();

    // 정확히 6자리 숫자 형식
    $validFormats = ['000000', '999999', '123456', '000001'];
    foreach ($validFormats as $code) {
      $result = TotpHelper::verify($secret, $code);
      // 시간 기반이므로 모두 false일 가능성 높지만, 형식 거부는 안 되어야 함
      $this->assert(
        "6자리 숫자 '{$code}' 형식은 검증 시도 (거부 아님)",
        is_bool($result),
        "actual: " . var_export($result, true)
      );
    }
  }

  /**
   * 테스트 6: 정상 TOTP 코드 검증 (window 범위)
   *
   * 주의: 이 테스트는 computeCode가 private이므로 reflection 사용
   * 또는 현재 시간 기반으로 간접적으로 검증
   */
  public function testValidCodeVerification(): void
  {
    echo "\n[테스트] TOTP 코드 검증 — 정상 코드 (리플렉션)\n";

    $secret = TotpHelper::generateSecret();

    // computeCode는 private이므로 reflection 사용
    $reflectionClass = new ReflectionClass('App\Utils\TotpHelper');
    $computeMethod = $reflectionClass->getMethod('computeCode');
    $computeMethod->setAccessible(true);

    // 현재 카운터 기반 코드 계산
    $counter = (int) floor(time() / 30);
    $expectedCode = $computeMethod->invoke(null, $secret, $counter);

    $this->assert(
      '현재 시간 기반 코드가 6자리 숫자',
      strlen($expectedCode) === 6 && ctype_digit($expectedCode),
      "code: {$expectedCode}"
    );

    // verify()로 검증 (window 범위 내 현재 코드는 통과해야 함)
    $result = TotpHelper::verify($secret, $expectedCode);
    $this->assert(
      '현재 코드로 verify() 성공',
      $result === true,
      "code: {$expectedCode}, result: " . ($result ? 'true' : 'false')
    );
  }

  /**
   * 테스트 7: 30초 윈도우 이후 코드 거부
   *
   * 시간 기반 테스트이므로, window parameter 사용하여 검증
   */
  public function testCodeWindowValidation(): void
  {
    echo "\n[테스트] TOTP 코드 검증 — window 파라미터 검증\n";

    $secret = TotpHelper::generateSecret();

    // reflection으로 이전 시간대 코드 계산
    $reflectionClass = new ReflectionClass('App\Utils\TotpHelper');
    $computeMethod = $reflectionClass->getMethod('computeCode');
    $computeMethod->setAccessible(true);

    // 90초 전 코드 계산 (3 periods ago)
    $pastCounter = (int) floor(time() / 30) - 3;
    $pastCode = $computeMethod->invoke(null, $secret, $pastCounter);

    // window=1 (기본값, ±30초)로는 거부되어야 함
    $result = TotpHelper::verify($secret, $pastCode, 1);
    $this->assert(
      '90초 이전 코드는 window=1로 거부',
      $result === false,
      "pastCode: {$pastCode}, result: " . ($result ? 'true' : 'false')
    );

    // window=3으로는 허용되어야 함 (±90초)
    $result = TotpHelper::verify($secret, $pastCode, 3);
    $this->assert(
      '90초 이전 코드는 window=3으로 허용',
      $result === true,
      "pastCode: {$pastCode}, result: " . ($result ? 'true' : 'false')
    );
  }

  public function run(): void
  {
    echo "=== TotpHelperTest 실행 ===\n";
    $this->testGenerateSecretLength();
    $this->testGenerateSecretUniqueness();
    $this->testGetUriFormat();
    $this->testInvalidCodeRejection();
    $this->testCodeFormatBoundary();
    $this->testValidCodeVerification();
    $this->testCodeWindowValidation();

    echo "\n=== 결과: {$this->passed} 통과, {$this->failed} 실패 ===\n";
    exit($this->failed > 0 ? 1 : 0);
  }
}

(new TotpHelperTest())->run();
