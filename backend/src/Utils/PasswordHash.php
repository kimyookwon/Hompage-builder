<?php

namespace App\Utils;

class PasswordHash {
  // bcrypt 해시 생성 (cost=12)
  public static function hash(string $password): string {
    return password_hash($password, PASSWORD_BCRYPT, ['cost' => 12]);
  }

  // 비밀번호 검증
  public static function verify(string $password, string $hash): bool {
    return password_verify($password, $hash);
  }
}
