<?php

// 헬스체크 (DB 연결 상태 포함)
$router->get('/api/health', function (): void {
  $dbStatus = 'error';
  $dbVersion = null;
  try {
    $pdo = \App\Config\Database::getInstance();
    $row = $pdo->query('SELECT VERSION() AS v')->fetch();
    $dbStatus = 'ok';
    $dbVersion = $row['v'] ?? null;
  } catch (\Throwable $e) {
    $dbStatus = 'error';
  }
  $status = $dbStatus === 'ok' ? 'ok' : 'degraded';
  http_response_code($status === 'ok' ? 200 : 503);
  header('Content-Type: application/json');
  echo json_encode([
    'success' => $status === 'ok',
    'data' => [
      'status'     => $status,
      'db'         => $dbStatus,
      'db_version' => $dbVersion,
      'timestamp'  => date('c'),
    ],
  ]);
});

// ─── 검색 ───────────────────────────────────────────────
$router->get('/api/search', [\App\Controllers\SearchController::class, 'index']);

// ─── 인증 ───────────────────────────────────────────────
$router->post('/api/auth/register', [\App\Controllers\AuthController::class, 'register']);
$router->post('/api/auth/login', [\App\Controllers\AuthController::class, 'login']);
$router->post('/api/auth/logout', [\App\Controllers\AuthController::class, 'logout']);
$router->get('/api/auth/me', [\App\Controllers\AuthController::class, 'me']);
$router->get('/api/auth/oauth/{provider}/redirect', [\App\Controllers\OAuthController::class, 'redirect']);
$router->post('/api/auth/oauth/{provider}/callback', [\App\Controllers\OAuthController::class, 'callback']);

// ─── 페이지 ─────────────────────────────────────────────
$router->get('/api/pages', [\App\Controllers\PageController::class, 'list']);
$router->post('/api/pages', [\App\Controllers\PageController::class, 'create']);
$router->get('/api/pages/{id}', [\App\Controllers\PageController::class, 'show']);
$router->patch('/api/pages/{id}', [\App\Controllers\PageController::class, 'update']);
$router->delete('/api/pages/{id}', [\App\Controllers\PageController::class, 'delete']);
$router->patch('/api/pages/{id}/publish', [\App\Controllers\PageController::class, 'togglePublish']);
$router->post('/api/pages/{id}/duplicate', [\App\Controllers\PageController::class, 'duplicate']);
$router->get('/api/pages/{id}/preview', [\App\Controllers\PageController::class, 'preview']);
$router->get('/public/pages/{slug}', [\App\Controllers\PageController::class, 'showPublic']);

// ─── 페이지 섹션 ─────────────────────────────────────────
$router->get('/api/pages/{id}/sections', [\App\Controllers\PageSectionController::class, 'list']);
$router->post('/api/pages/{id}/sections', [\App\Controllers\PageSectionController::class, 'create']);
$router->patch('/api/pages/{id}/sections/reorder', [\App\Controllers\PageSectionController::class, 'reorder']);
$router->patch('/api/sections/{id}', [\App\Controllers\PageSectionController::class, 'update']);
$router->delete('/api/sections/{id}', [\App\Controllers\PageSectionController::class, 'delete']);

// ─── 미디어 ─────────────────────────────────────────────
$router->get('/api/media', [\App\Controllers\MediaAssetController::class, 'list']);
$router->post('/api/media/upload', [\App\Controllers\MediaAssetController::class, 'upload']);
$router->delete('/api/media/{id}', [\App\Controllers\MediaAssetController::class, 'delete']);

// ─── 마이페이지 ──────────────────────────────────────────
$router->patch('/api/me', [\App\Controllers\ProfileController::class, 'update']);
$router->patch('/api/me/password', [\App\Controllers\ProfileController::class, 'updatePassword']);
$router->patch('/api/me/avatar', [\App\Controllers\ProfileController::class, 'updateAvatar']);
$router->delete('/api/me', [\App\Controllers\ProfileController::class, 'withdraw']);
$router->get('/api/me/posts', [\App\Controllers\ProfileController::class, 'posts']);
$router->get('/api/me/comments', [\App\Controllers\ProfileController::class, 'comments']);
$router->get('/api/me/notifications', [\App\Controllers\ProfileController::class, 'notifications']);

// ─── 회원 ───────────────────────────────────────────────
$router->get('/api/users', [\App\Controllers\UserController::class, 'list']);
$router->get('/api/users/{id}', [\App\Controllers\UserController::class, 'show']);
$router->patch('/api/users/{id}/role', [\App\Controllers\UserController::class, 'updateRole']);
$router->patch('/api/users/{id}/status', [\App\Controllers\UserController::class, 'updateStatus']);
$router->delete('/api/users/{id}', [\App\Controllers\UserController::class, 'delete']);
$router->patch('/api/users/{id}/password', [\App\Controllers\UserController::class, 'resetPassword']);

// ─── 게시판 ─────────────────────────────────────────────
$router->get('/api/boards', [\App\Controllers\BoardController::class, 'list']);
$router->post('/api/boards', [\App\Controllers\BoardController::class, 'create']);
$router->get('/api/boards/{id}', [\App\Controllers\BoardController::class, 'show']);
$router->patch('/api/boards/{id}', [\App\Controllers\BoardController::class, 'update']);
$router->patch('/api/boards/{id}/move', [\App\Controllers\BoardController::class, 'move']);
$router->delete('/api/boards/{id}', [\App\Controllers\BoardController::class, 'delete']);

// ─── 게시글 ─────────────────────────────────────────────
$router->get('/api/boards/{id}/posts', [\App\Controllers\PostController::class, 'list']);
$router->post('/api/boards/{id}/posts', [\App\Controllers\PostController::class, 'create']);
$router->get('/api/posts/{id}', [\App\Controllers\PostController::class, 'show']);
$router->patch('/api/posts/{id}', [\App\Controllers\PostController::class, 'update']);
$router->post('/api/posts/{id}/like', [\App\Controllers\PostController::class, 'like']);
$router->patch('/api/posts/{id}/notice', [\App\Controllers\PostController::class, 'toggleNotice']);
$router->delete('/api/posts/{id}', [\App\Controllers\PostController::class, 'delete']);

// ─── 첨부파일 ────────────────────────────────────────────
$router->post('/api/posts/{id}/attachments', [\App\Controllers\AttachmentController::class, 'upload']);
$router->delete('/api/attachments/{id}', [\App\Controllers\AttachmentController::class, 'delete']);

// ─── 댓글 ───────────────────────────────────────────────
$router->get('/api/posts/{id}/comments', [\App\Controllers\CommentController::class, 'list']);
$router->post('/api/posts/{id}/comments', [\App\Controllers\CommentController::class, 'create']);
$router->patch('/api/comments/{id}', [\App\Controllers\CommentController::class, 'update']);
$router->delete('/api/comments/{id}', [\App\Controllers\CommentController::class, 'delete']);
$router->get('/api/admin/comments', [\App\Controllers\CommentController::class, 'adminList']);

// ─── 알림 ───────────────────────────────────────────────
$router->get('/api/notifications', [\App\Controllers\NotificationController::class, 'index']);
$router->get('/api/notifications/unread-count', [\App\Controllers\NotificationController::class, 'unreadCount']);
$router->patch('/api/notifications/read-all', [\App\Controllers\NotificationController::class, 'markAllRead']);
$router->patch('/api/notifications/{id}/read', [\App\Controllers\NotificationController::class, 'markRead']);

// ─── 통계 ───────────────────────────────────────────────
$router->get('/api/admin/stats', [\App\Controllers\StatsController::class, 'index']);

// ─── 사이트 내보내기/가져오기 ──────────────────────────────
$router->get('/api/admin/export', [\App\Controllers\SiteExportController::class, 'export']);
$router->post('/api/admin/import', [\App\Controllers\SiteExportController::class, 'import']);

// ─── 사이트 설정 ─────────────────────────────────────────
$router->get('/api/site-settings', [\App\Controllers\SiteSettingsController::class, 'show']);
$router->patch('/api/site-settings', [\App\Controllers\SiteSettingsController::class, 'update']);
