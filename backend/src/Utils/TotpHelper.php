<?php

namespace App\Utils;

/**
 * TOTP (Time-based One-Time Password) 유틸리티
 * RFC 6238 기반, 외부 패키지 없이 순수 PHP 구현
 */
class TotpHelper {
  private const PERIOD = 30;   // 코드 갱신 주기 (초)
  private const DIGITS = 6;    // 코드 자릿수
  private const BASE32_CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';

  /**
   * 32자 Base32 시크릿 생성
   */
  public static function generateSecret(): string {
    $secret = '';
    $bytes = random_bytes(20); // 160비트
    for ($i = 0; $i < 32; $i++) {
      $index = ord($bytes[$i % 20]) % 32;
      $secret .= self::BASE32_CHARS[$index];
    }
    return $secret;
  }

  /**
   * TOTP 코드 검증 (window 범위 내 허용)
   *
   * @param string $secret  Base32 인코딩된 시크릿
   * @param string $code    사용자가 입력한 6자리 코드
   * @param int    $window  허용 윈도우 (기본 +-1, 총 90초)
   */
  public static function verify(string $secret, string $code, int $window = 1): bool {
    if (strlen($code) !== self::DIGITS || !ctype_digit($code)) {
      return false;
    }

    $counter = (int) floor(time() / self::PERIOD);

    for ($i = -$window; $i <= $window; $i++) {
      $expected = self::computeCode($secret, $counter + $i);
      if (hash_equals($expected, $code)) {
        return true;
      }
    }

    return false;
  }

  /**
   * otpauth:// URI 생성 (QR 코드용)
   */
  public static function getUri(string $secret, string $email, string $issuer): string {
    $label = rawurlencode($issuer) . ':' . rawurlencode($email);
    $params = http_build_query([
      'secret' => $secret,
      'issuer' => $issuer,
      'algorithm' => 'SHA1',
      'digits' => self::DIGITS,
      'period' => self::PERIOD,
    ]);
    return "otpauth://totp/{$label}?{$params}";
  }

  /**
   * Base32 디코딩
   */
  private static function base32Decode(string $input): string {
    $input = strtoupper(rtrim($input, '='));
    $buffer = 0;
    $bitsLeft = 0;
    $output = '';

    for ($i = 0, $len = strlen($input); $i < $len; $i++) {
      $pos = strpos(self::BASE32_CHARS, $input[$i]);
      if ($pos === false) {
        continue; // 유효하지 않은 문자 무시
      }
      $buffer = ($buffer << 5) | $pos;
      $bitsLeft += 5;

      if ($bitsLeft >= 8) {
        $bitsLeft -= 8;
        $output .= chr(($buffer >> $bitsLeft) & 0xFF);
      }
    }

    return $output;
  }

  /**
   * TOTP 코드 계산 (HMAC-SHA1 기반)
   */
  private static function computeCode(string $secret, int $counter): string {
    $key = self::base32Decode($secret);

    // 카운터를 8바이트 빅엔디안으로 변환
    $counterBytes = pack('N*', 0, $counter);

    // HMAC-SHA1 계산
    $hash = hash_hmac('sha1', $counterBytes, $key, true);

    // Dynamic Truncation (RFC 4226)
    $offset = ord($hash[19]) & 0x0F;
    $binary = (
      ((ord($hash[$offset]) & 0x7F) << 24) |
      ((ord($hash[$offset + 1]) & 0xFF) << 16) |
      ((ord($hash[$offset + 2]) & 0xFF) << 8) |
      (ord($hash[$offset + 3]) & 0xFF)
    );

    $otp = $binary % (10 ** self::DIGITS);
    return str_pad((string) $otp, self::DIGITS, '0', STR_PAD_LEFT);
  }
}
