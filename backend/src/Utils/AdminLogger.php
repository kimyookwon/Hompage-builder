<?php

namespace App\Utils;

use App\Config\Database;

// 관리자 활동 로그 기록 유틸리티
class AdminLogger {
  // 관리자 활동을 admin_logs 테이블에 기록
  public static function log(
    int $adminId,
    string $adminName,
    string $action,
    string $targetType,
    ?int $targetId = null,
    ?array $detail = null
  ): void {
    try {
      $pdo = Database::getInstance();
      $ip = $_SERVER['REMOTE_ADDR'] ?? 'unknown';
      $pdo->prepare(
        'INSERT INTO admin_logs (admin_id, admin_name, action, target_type, target_id, detail, ip)
         VALUES (?, ?, ?, ?, ?, ?, ?)'
      )->execute([
        $adminId, $adminName, $action, $targetType, $targetId,
        $detail ? json_encode($detail, JSON_UNESCAPED_UNICODE) : null,
        $ip
      ]);
    } catch (\Throwable) {
      // 로그 실패는 메인 로직에 영향 주지 않음
    }
  }

  // JWT payload에서 관리자 이름 조회 (payload에 name이 없으므로 DB 조회)
  public static function getAdminName(object $payload): string {
    try {
      $pdo = Database::getInstance();
      $stmt = $pdo->prepare('SELECT name FROM users WHERE id = ?');
      $stmt->execute([(int) $payload->sub]);
      $row = $stmt->fetch();
      return $row['name'] ?? 'admin';
    } catch (\Throwable) {
      return 'admin';
    }
  }
}
