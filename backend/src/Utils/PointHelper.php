<?php

namespace App\Utils;

use App\Config\Database;

/**
 * 회원 포인트 적립/차감 + 레벨 자동 계산
 */
class PointHelper {
  const POINT_POST_CREATE   = 10;
  const POINT_COMMENT       = 3;
  const POINT_LIKE_RECEIVED = 2;

  // 레벨 기준표: [최소 포인트 => 레벨]
  private const LEVEL_TABLE = [
    1000 => 5,
    600  => 4,
    300  => 3,
    100  => 2,
    0    => 1,
  ];

  /**
   * 포인트 적립 + 레벨 업데이트
   */
  public static function earn(int $userId, int $points, string $reason, ?int $refId = null): void {
    $pdo = Database::getInstance();

    // 포인트 로그 기록
    $stmt = $pdo->prepare(
      'INSERT INTO point_logs (user_id, points, reason, ref_id) VALUES (?, ?, ?, ?)'
    );
    $stmt->execute([$userId, $points, $reason, $refId]);

    // 사용자 포인트 합산 후 레벨 재계산
    $pdo->prepare('UPDATE users SET points = points + ? WHERE id = ?')
        ->execute([$points, $userId]);

    // 현재 포인트 조회
    $currentStmt = $pdo->prepare('SELECT points FROM users WHERE id = ?');
    $currentStmt->execute([$userId]);
    $currentPoints = (int) $currentStmt->fetchColumn();

    // 레벨 업데이트
    $newLevel = self::calcLevel($currentPoints);
    $pdo->prepare('UPDATE users SET level = ? WHERE id = ?')
        ->execute([$newLevel, $userId]);
  }

  /**
   * 포인트 기준 레벨 계산
   * 0~99: 1, 100~299: 2, 300~599: 3, 600~999: 4, 1000+: 5
   */
  public static function calcLevel(int $points): int {
    foreach (self::LEVEL_TABLE as $threshold => $level) {
      if ($points >= $threshold) {
        return $level;
      }
    }
    return 1;
  }
}
