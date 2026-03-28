<?php

namespace App\Controllers;

use App\Config\Database;
use App\Middleware\AuthMiddleware;
use App\Utils\AdminLogger;
use App\Utils\ResponseHelper;

class BulkController {
  // POST /api/admin/posts/bulk — 게시글 일괄 삭제
  public function deletePosts(): void {
    $payload = AuthMiddleware::requireAdmin();

    $data = json_decode(file_get_contents('php://input'), true);
    $ids  = $data['ids'] ?? [];

    if (!is_array($ids) || count($ids) === 0) {
      ResponseHelper::error('삭제할 게시글 ID를 입력해주세요.', 422);
    }
    if (count($ids) > 100) {
      ResponseHelper::error('한 번에 최대 100개까지 삭제할 수 있습니다.', 422);
    }

    // 정수 변환 + 중복 제거
    $ids = array_unique(array_map('intval', $ids));
    $placeholders = implode(',', array_fill(0, count($ids), '?'));

    $pdo = Database::getInstance();
    $pdo->beginTransaction();

    try {
      // 관련 데이터 먼저 삭제
      $pdo->prepare("DELETE FROM comments WHERE post_id IN ({$placeholders})")->execute($ids);
      $pdo->prepare("DELETE FROM post_likes WHERE post_id IN ({$placeholders})")->execute($ids);
      $pdo->prepare("DELETE FROM post_bookmarks WHERE post_id IN ({$placeholders})")->execute($ids);
      $pdo->prepare("DELETE FROM post_attachments WHERE post_id IN ({$placeholders})")->execute($ids);

      // 태그 연결 삭제 (post_tags 테이블이 있는 경우)
      try {
        $pdo->prepare("DELETE FROM post_tags WHERE post_id IN ({$placeholders})")->execute($ids);
      } catch (\Exception) {
        // post_tags 테이블이 없으면 무시
      }

      // 게시글 삭제
      $stmt = $pdo->prepare("DELETE FROM posts WHERE id IN ({$placeholders})");
      $stmt->execute($ids);
      $deletedCount = $stmt->rowCount();

      $pdo->commit();

      AdminLogger::log(
        (int) $payload->sub,
        AdminLogger::getAdminName($payload),
        'bulk_delete', 'post', null,
        ['ids' => $ids, 'count' => $deletedCount]
      );

      ResponseHelper::success([
        'deleted_count' => $deletedCount,
        'message'       => "{$deletedCount}개 게시글이 삭제되었습니다.",
      ]);
    } catch (\Exception $e) {
      $pdo->rollBack();
      ResponseHelper::error('일괄 삭제 중 오류가 발생했습니다.', 500);
    }
  }

  // POST /api/admin/users/bulk — 회원 일괄 상태 변경
  public function updateUsersStatus(): void {
    $payload = AuthMiddleware::requireAdmin();

    $data   = json_decode(file_get_contents('php://input'), true);
    $ids    = $data['ids'] ?? [];
    $status = trim($data['status'] ?? '');

    if (!is_array($ids) || count($ids) === 0) {
      ResponseHelper::error('변경할 회원 ID를 입력해주세요.', 422);
    }
    if (count($ids) > 100) {
      ResponseHelper::error('한 번에 최대 100명까지 변경할 수 있습니다.', 422);
    }
    if (!in_array($status, ['active', 'blocked'], true)) {
      ResponseHelper::error('유효하지 않은 상태입니다. (active 또는 blocked)', 422);
    }

    $ids = array_unique(array_map('intval', $ids));

    $pdo = Database::getInstance();

    // admin 계정은 변경 대상에서 제외
    $placeholders = implode(',', array_fill(0, count($ids), '?'));
    $adminCheck = $pdo->prepare(
      "SELECT id FROM users WHERE id IN ({$placeholders}) AND role = 'admin'"
    );
    $adminCheck->execute($ids);
    $adminIds = $adminCheck->fetchAll(\PDO::FETCH_COLUMN);

    if (count($adminIds) > 0) {
      ResponseHelper::error('관리자 계정의 상태는 변경할 수 없습니다.', 403);
    }

    $stmt = $pdo->prepare(
      "UPDATE users SET status = ? WHERE id IN ({$placeholders}) AND role != 'admin'"
    );
    $stmt->execute(array_merge([$status], $ids));
    $updatedCount = $stmt->rowCount();

    AdminLogger::log(
      (int) $payload->sub,
      AdminLogger::getAdminName($payload),
      'bulk_status', 'user', null,
      ['status' => $status, 'count' => $updatedCount]
    );

    ResponseHelper::success([
      'updated_count' => $updatedCount,
      'message'       => "{$updatedCount}명의 상태가 '{$status}'로 변경되었습니다.",
    ]);
  }
}
