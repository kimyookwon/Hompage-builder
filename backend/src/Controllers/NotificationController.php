<?php

namespace App\Controllers;

use App\Models\Notification;
use App\Middleware\AuthMiddleware;
use App\Utils\ResponseHelper;

class NotificationController {
  // GET /api/notifications — 내 알림 목록
  public function index(): void {
    $payload = AuthMiddleware::require();
    $limit   = min(50, max(1, (int) ($_GET['limit'] ?? 30)));
    $list    = Notification::findByUser((int) $payload->sub, $limit);
    ResponseHelper::success($list);
  }

  // GET /api/notifications/unread-count — 읽지 않은 알림 수
  public function unreadCount(): void {
    $payload = AuthMiddleware::require();
    $count   = Notification::unreadCount((int) $payload->sub);
    ResponseHelper::success(['count' => $count]);
  }

  // PATCH /api/notifications/{id}/read — 단일 읽음 처리
  public function markRead(string $id): void {
    $payload = AuthMiddleware::require();
    Notification::markRead((int) $id, (int) $payload->sub);
    ResponseHelper::success(['message' => '읽음 처리되었습니다.']);
  }

  // PATCH /api/notifications/read-all — 전체 읽음 처리
  public function markAllRead(): void {
    $payload = AuthMiddleware::require();
    Notification::markAllRead((int) $payload->sub);
    ResponseHelper::success(['message' => '모두 읽음 처리되었습니다.']);
  }
}
