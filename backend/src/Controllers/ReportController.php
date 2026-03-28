<?php

namespace App\Controllers;

use App\Config\Database;
use App\Middleware\AuthMiddleware;
use App\Middleware\RateLimitMiddleware;
use App\Utils\AdminLogger;
use App\Utils\ResponseHelper;

class ReportController {
  private const VALID_REASONS  = ['spam', 'abuse', 'inappropriate', 'other'];
  private const VALID_STATUSES = ['pending', 'reviewed', 'dismissed'];

  // POST /api/comments/{id}/report — 댓글 신고 접수
  public function create(string $commentId): void {
    $payload = AuthMiddleware::require();

    // 사용자당 신고: 10회/시간
    RateLimitMiddleware::check(RateLimitMiddleware::userKey('report', (int) $payload->sub), 10, 3600);
    RateLimitMiddleware::hit(RateLimitMiddleware::userKey('report', (int) $payload->sub), 3600);

    $pdo = Database::getInstance();

    // 댓글 존재 확인
    $comment = $pdo->prepare('SELECT id FROM comments WHERE id = ?');
    $comment->execute([(int) $commentId]);
    if (!$comment->fetch()) {
      ResponseHelper::error('댓글을 찾을 수 없습니다.', 404);
    }

    $data   = json_decode(file_get_contents('php://input'), true);
    $reason = trim($data['reason'] ?? 'other');

    if (!in_array($reason, self::VALID_REASONS, true)) {
      ResponseHelper::error('유효하지 않은 신고 사유입니다.', 422);
    }

    // 중복 신고 확인
    $dup = $pdo->prepare('SELECT id FROM reports WHERE comment_id = ? AND reporter_id = ?');
    $dup->execute([(int) $commentId, (int) $payload->sub]);
    if ($dup->fetch()) {
      ResponseHelper::error('이미 신고한 댓글입니다.', 422);
    }

    $pdo->prepare(
      'INSERT INTO reports (comment_id, reporter_id, reason) VALUES (?, ?, ?)'
    )->execute([(int) $commentId, (int) $payload->sub, $reason]);

    $id = (int) $pdo->lastInsertId();
    $stmt = $pdo->prepare('SELECT * FROM reports WHERE id = ?');
    $stmt->execute([$id]);

    ResponseHelper::success($stmt->fetch(), 201);
  }

  // GET /api/admin/reports — 신고 목록 (관리자)
  public function adminList(): void {
    AuthMiddleware::requireAdmin();
    $pdo = Database::getInstance();

    $page   = max(1, (int) ($_GET['page']  ?? 1));
    $limit  = min(100, max(1, (int) ($_GET['limit'] ?? 20)));
    $offset = ($page - 1) * $limit;
    $status = trim($_GET['status'] ?? '');

    $where  = '';
    $params = [];
    if ($status !== '' && in_array($status, self::VALID_STATUSES, true)) {
      $where  = 'WHERE r.status = ?';
      $params = [$status];
    }

    $stmt = $pdo->prepare(
      "SELECT r.*,
              c.content   AS comment_content,
              cu.name     AS comment_author_name,
              ru.name     AS reporter_name
       FROM reports r
       JOIN comments c ON c.id = r.comment_id
       JOIN users cu   ON cu.id = c.user_id
       JOIN users ru   ON ru.id = r.reporter_id
       {$where}
       ORDER BY r.created_at DESC
       LIMIT ? OFFSET ?"
    );
    $stmt->execute(array_merge($params, [$limit, $offset]));
    $items = $stmt->fetchAll();

    $countStmt = $pdo->prepare("SELECT COUNT(*) FROM reports r {$where}");
    $countStmt->execute($params);
    $total = (int) $countStmt->fetchColumn();

    ResponseHelper::paginated($items, $total, $page, $limit);
  }

  // PATCH /api/admin/reports/{id} — 신고 처리 (관리자)
  public function adminUpdate(string $id): void {
    $payload = AuthMiddleware::requireAdmin();
    $pdo = Database::getInstance();

    $report = $pdo->prepare('SELECT * FROM reports WHERE id = ?');
    $report->execute([(int) $id]);
    if (!$report->fetch()) {
      ResponseHelper::error('신고를 찾을 수 없습니다.', 404);
    }

    $data   = json_decode(file_get_contents('php://input'), true);
    $status = trim($data['status'] ?? '');
    $note   = isset($data['note']) ? trim($data['note']) : null;

    if (!in_array($status, self::VALID_STATUSES, true)) {
      ResponseHelper::error('유효하지 않은 상태입니다.', 422);
    }

    if ($note !== null) {
      $pdo->prepare('UPDATE reports SET status = ?, note = ? WHERE id = ?')
          ->execute([$status, $note, (int) $id]);
    } else {
      $pdo->prepare('UPDATE reports SET status = ? WHERE id = ?')
          ->execute([$status, (int) $id]);
    }

    AdminLogger::log(
      (int) $payload->sub,
      AdminLogger::getAdminName($payload),
      'update_status', 'report', (int) $id,
      ['status' => $status]
    );

    $stmt = $pdo->prepare('SELECT * FROM reports WHERE id = ?');
    $stmt->execute([(int) $id]);

    ResponseHelper::success($stmt->fetch());
  }
}
