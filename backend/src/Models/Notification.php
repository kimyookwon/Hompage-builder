<?php

namespace App\Models;

use App\Config\Database;

class Notification {
  /** 알림 생성 */
  public static function create(
    int    $userId,
    string $type,
    int    $postId,
    int    $boardId,
    string $postTitle,
    string $actorName,
    ?int   $commentId = null
  ): void {
    // 자기 자신의 행동에는 알림 생성 안 함
    $pdo = Database::getInstance();

    // 중복 알림 방지 (같은 게시글+댓글에 이미 unread 알림 있으면 skip)
    if ($commentId !== null) {
      $dup = $pdo->prepare(
        'SELECT id FROM notifications WHERE user_id=? AND comment_id=? AND is_read=0 LIMIT 1'
      );
      $dup->execute([$userId, $commentId]);
      if ($dup->fetch()) return;
    }

    $pdo->prepare(
      'INSERT INTO notifications
         (user_id, type, post_id, board_id, post_title, actor_name, comment_id)
       VALUES (?, ?, ?, ?, ?, ?, ?)'
    )->execute([$userId, $type, $postId, $boardId, $postTitle, $actorName, $commentId]);
  }

  /** 사용자의 알림 목록 (최신 30개) */
  public static function findByUser(int $userId, int $limit = 30): array {
    $pdo = Database::getInstance();
    $stmt = $pdo->prepare(
      'SELECT * FROM notifications WHERE user_id = ?
       ORDER BY created_at DESC LIMIT ?'
    );
    $stmt->execute([$userId, $limit]);
    return $stmt->fetchAll();
  }

  /** 읽지 않은 알림 수 */
  public static function unreadCount(int $userId): int {
    $pdo = Database::getInstance();
    $stmt = $pdo->prepare('SELECT COUNT(*) FROM notifications WHERE user_id=? AND is_read=0');
    $stmt->execute([$userId]);
    return (int) $stmt->fetchColumn();
  }

  /** 단일 알림 읽음 처리 */
  public static function markRead(int $id, int $userId): void {
    $pdo = Database::getInstance();
    $pdo->prepare('UPDATE notifications SET is_read=1 WHERE id=? AND user_id=?')
        ->execute([$id, $userId]);
  }

  /** 전체 읽음 처리 */
  public static function markAllRead(int $userId): void {
    $pdo = Database::getInstance();
    $pdo->prepare('UPDATE notifications SET is_read=1 WHERE user_id=?')
        ->execute([$userId]);
  }
}
