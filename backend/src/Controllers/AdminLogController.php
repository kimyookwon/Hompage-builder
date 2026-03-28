<?php

namespace App\Controllers;

use App\Config\Database;
use App\Middleware\AuthMiddleware;
use App\Utils\ResponseHelper;

// 관리자 활동 로그 조회 컨트롤러
class AdminLogController {
  // GET /api/admin/logs — 관리자 활동 로그 목록
  public function list(): void {
    AuthMiddleware::requireAdmin();

    $page   = max(1, (int) ($_GET['page'] ?? 1));
    $limit  = min(100, max(1, (int) ($_GET['limit'] ?? 50)));
    $offset = ($page - 1) * $limit;

    // 필터 파라미터
    $adminId    = !empty($_GET['admin_id']) ? (int) $_GET['admin_id'] : null;
    $action     = trim($_GET['action'] ?? '');
    $targetType = trim($_GET['target_type'] ?? '');

    $where  = [];
    $params = [];

    if ($adminId !== null) {
      $where[]  = 'admin_id = ?';
      $params[] = $adminId;
    }
    if ($action !== '') {
      $where[]  = 'action = ?';
      $params[] = $action;
    }
    if ($targetType !== '') {
      $where[]  = 'target_type = ?';
      $params[] = $targetType;
    }

    $whereClause = count($where) > 0 ? 'WHERE ' . implode(' AND ', $where) : '';

    $pdo = Database::getInstance();

    // 전체 건수
    $countStmt = $pdo->prepare("SELECT COUNT(*) FROM admin_logs {$whereClause}");
    $countStmt->execute($params);
    $total = (int) $countStmt->fetchColumn();

    // 목록 조회
    $stmt = $pdo->prepare(
      "SELECT id, admin_id, admin_name, action, target_type, target_id, detail, ip, created_at
       FROM admin_logs
       {$whereClause}
       ORDER BY created_at DESC
       LIMIT ? OFFSET ?"
    );
    $stmt->execute(array_merge($params, [$limit, $offset]));
    $items = $stmt->fetchAll();

    // detail JSON 파싱
    foreach ($items as &$item) {
      if ($item['detail'] !== null) {
        $item['detail'] = json_decode($item['detail'], true);
      }
    }
    unset($item);

    ResponseHelper::paginated($items, $total, $page, $limit);
  }
}
