<?php

// 헬스체크 (DB, 디스크, 메모리, 업로드 디렉토리 상태)
$router->get('/api/health', function (): void {
  $overallStatus = 'ok';
  $httpCode = 200;

  // --- DB 체크 ---
  $dbCheck = ['status' => 'error', 'latency_ms' => 0, 'version' => null];
  try {
    $pdo = \App\Config\Database::getInstance();
    $start = microtime(true);
    $row = $pdo->query('SELECT VERSION() AS v')->fetch();
    $latency = (microtime(true) - $start) * 1000;
    $dbCheck = [
      'status'     => 'ok',
      'latency_ms' => round($latency, 1),
      'version'    => $row['v'] ?? null,
    ];
  } catch (\Throwable $e) {
    $dbCheck['status'] = 'error';
    $overallStatus = 'error';
    $httpCode = 503;
    // Sentry 에러 보고 (연동 시)
    if (class_exists(\App\Utils\SentryBootstrap::class)) {
      \App\Utils\SentryBootstrap::captureException($e);
    }
  }

  // --- 디스크 체크 ---
  $uploadPath = __DIR__ . '/../public/uploads';
  $diskPath = realpath($uploadPath) ?: __DIR__;
  $freeBytes = @disk_free_space($diskPath);
  $totalBytes = @disk_total_space($diskPath);
  $freeGb = $freeBytes !== false ? round($freeBytes / 1073741824, 1) : 0;
  $totalGb = $totalBytes !== false ? round($totalBytes / 1073741824, 1) : 0;
  $usagePercent = ($totalBytes && $totalBytes > 0)
    ? round((1 - $freeBytes / $totalBytes) * 100)
    : 0;

  $diskStatus = 'ok';
  if ($usagePercent >= 95) {
    $diskStatus = 'critical';
    if ($overallStatus !== 'error') $overallStatus = 'degraded';
  } elseif ($usagePercent >= 90) {
    $diskStatus = 'warn';
    if ($overallStatus !== 'error') $overallStatus = 'degraded';
  }

  $diskCheck = [
    'status'        => $diskStatus,
    'free_gb'       => $freeGb,
    'total_gb'      => $totalGb,
    'usage_percent' => (int) $usagePercent,
  ];

  // --- 메모리 체크 ---
  $phpMemory = memory_get_usage(true);
  $phpPeak = memory_get_peak_usage(true);
  $limitStr = ini_get('memory_limit');
  $limitMb = 128; // 기본값
  if (preg_match('/^(\d+)(M|G|K)?$/i', $limitStr, $m)) {
    $val = (int) $m[1];
    $unit = strtoupper($m[2] ?? 'M');
    $limitMb = match ($unit) {
      'G' => $val * 1024,
      'K' => $val / 1024,
      default => $val,
    };
  }

  $memoryCheck = [
    'status'        => 'ok',
    'php_memory_mb' => round($phpMemory / 1048576, 1),
    'php_peak_mb'   => round($phpPeak / 1048576, 1),
    'php_limit_mb'  => (int) $limitMb,
  ];

  // --- 업로드 디렉토리 체크 ---
  $uploadWritable = is_dir($uploadPath) && is_writable($uploadPath);
  $uploadStatus = $uploadWritable ? 'ok' : 'warn';
  if ($uploadStatus === 'warn' && $overallStatus === 'ok') {
    $overallStatus = 'degraded';
  }

  $uploadCheck = [
    'status'   => $uploadStatus,
    'writable' => $uploadWritable,
  ];

  // --- 응답 ---
  http_response_code($httpCode);
  header('Content-Type: application/json');
  echo json_encode([
    'success' => $overallStatus !== 'error',
    'data' => [
      'status'    => $overallStatus,
      'version'   => $_ENV['APP_VERSION'] ?? '1.0.0',
      'timestamp' => date('c'),
      'checks'    => [
        'database'   => $dbCheck,
        'disk'       => $diskCheck,
        'memory'     => $memoryCheck,
        'upload_dir' => $uploadCheck,
      ],
    ],
  ]);
});

// ─── OG 메타태그 ────────────────────────────────────────
$router->get('/api/og', [\App\Controllers\OgController::class, 'index']);

// ─── 검색 ───────────────────────────────────────────────
$router->get('/api/search/suggest', [\App\Controllers\SearchController::class, 'suggest']);
$router->get('/api/search', [\App\Controllers\SearchController::class, 'index']);

// ─── 인증 ───────────────────────────────────────────────
$router->post('/api/auth/register', [\App\Controllers\AuthController::class, 'register']);
$router->post('/api/auth/login', [\App\Controllers\AuthController::class, 'login']);
$router->post('/api/auth/logout', [\App\Controllers\AuthController::class, 'logout']);
$router->get('/api/auth/me', [\App\Controllers\AuthController::class, 'me']);
$router->get('/api/auth/verify-email', [\App\Controllers\AuthController::class, 'verifyEmail']);
$router->post('/api/auth/forgot-password', [\App\Controllers\PasswordResetController::class, 'requestReset']);
$router->post('/api/auth/reset-password', [\App\Controllers\PasswordResetController::class, 'resetPassword']);
$router->get('/api/auth/reset-password/verify', [\App\Controllers\PasswordResetController::class, 'verifyToken']);
$router->get('/api/auth/oauth/{provider}/redirect', [\App\Controllers\OAuthController::class, 'redirect']);
$router->post('/api/auth/oauth/{provider}/callback', [\App\Controllers\OAuthController::class, 'callback']);

// ─── 2FA (TOTP) ────────────────────────────────────────────
$router->post('/api/auth/2fa/setup', [\App\Controllers\TwoFactorController::class, 'setup']);
$router->post('/api/auth/2fa/confirm', [\App\Controllers\TwoFactorController::class, 'confirm']);
$router->delete('/api/auth/2fa', [\App\Controllers\TwoFactorController::class, 'disable']);
$router->post('/api/auth/2fa/login', [\App\Controllers\TwoFactorController::class, 'login']);

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
$router->get('/api/me/points', [\App\Controllers\ProfileController::class, 'pointHistory']);
$router->patch('/api/me', [\App\Controllers\ProfileController::class, 'update']);
$router->patch('/api/me/password', [\App\Controllers\ProfileController::class, 'updatePassword']);
$router->patch('/api/me/avatar', [\App\Controllers\ProfileController::class, 'updateAvatar']);
$router->delete('/api/me', [\App\Controllers\ProfileController::class, 'withdraw']);
$router->get('/api/me/posts', [\App\Controllers\ProfileController::class, 'posts']);
$router->get('/api/me/comments', [\App\Controllers\ProfileController::class, 'comments']);
$router->get('/api/me/notifications', [\App\Controllers\ProfileController::class, 'notifications']);

// ─── 회원 ───────────────────────────────────────────────
$router->get('/api/users', [\App\Controllers\UserController::class, 'list']);
$router->get('/api/users/{id}/profile', [\App\Controllers\UserController::class, 'publicProfile']);
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

// ─── 태그 ───────────────────────────────────────────────
$router->get('/api/boards/{id}/tags', function (string $boardId): void {
  $tags = \App\Models\Tag::popular((int) $boardId, 30);
  \App\Utils\ResponseHelper::success($tags);
});
$router->get('/api/tags/popular', function (): void {
  $tags = \App\Models\Tag::popular(null, 30);
  \App\Utils\ResponseHelper::success($tags);
});

// ─── 인기 게시글 ────────────────────────────────────────
$router->get('/api/posts/popular', [\App\Controllers\PostController::class, 'popular']);

// ─── 게시글 ─────────────────────────────────────────────
$router->get('/api/boards/{id}/posts', [\App\Controllers\PostController::class, 'list']);
$router->post('/api/boards/{id}/posts', [\App\Controllers\PostController::class, 'create']);
$router->get('/api/posts/{id}', [\App\Controllers\PostController::class, 'show']);
$router->patch('/api/posts/{id}', [\App\Controllers\PostController::class, 'update']);
$router->post('/api/posts/{id}/like', [\App\Controllers\PostController::class, 'like']);
$router->patch('/api/posts/{id}/notice', [\App\Controllers\PostController::class, 'toggleNotice']);
$router->delete('/api/posts/{id}', [\App\Controllers\PostController::class, 'delete']);

// ─── 북마크 ─────────────────────────────────────────────
$router->post('/api/posts/{id}/bookmark', [\App\Controllers\PostController::class, 'bookmark']);
$router->get('/api/me/bookmarks', [\App\Controllers\ProfileController::class, 'bookmarks']);

// ─── 첨부파일 ────────────────────────────────────────────
$router->post('/api/posts/{id}/attachments', [\App\Controllers\AttachmentController::class, 'upload']);
$router->delete('/api/attachments/{id}', [\App\Controllers\AttachmentController::class, 'delete']);
$router->get('/api/attachments/{id}/download', [\App\Controllers\AttachmentController::class, 'download']);

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

// ─── 댓글 신고 ──────────────────────────────────────────
$router->post('/api/comments/{id}/report', [\App\Controllers\ReportController::class, 'create']);
$router->get('/api/admin/reports', [\App\Controllers\ReportController::class, 'adminList']);
$router->patch('/api/admin/reports/{id}', [\App\Controllers\ReportController::class, 'adminUpdate']);

// ─── 관리자 일괄 작업 ────────────────────────────────────
$router->post('/api/admin/posts/bulk', [\App\Controllers\BulkController::class, 'deletePosts']);
$router->post('/api/admin/users/bulk', [\App\Controllers\BulkController::class, 'updateUsersStatus']);

// ─── 관리자 일괄 이메일 ──────────────────────────────────
$router->post('/api/admin/bulk-mail', [\App\Controllers\BulkMailController::class, 'send']);

// ─── 첨부파일 통계 (관리자) ──────────────────────────────
$router->get('/api/admin/attachments', [\App\Controllers\AttachmentController::class, 'adminStats']);

// ─── 공지 시스템 ────────────────────────────────────────
$router->get('/api/notices', [\App\Controllers\NoticeController::class, 'list']);
$router->get('/api/admin/notices', [\App\Controllers\NoticeController::class, 'adminList']);
$router->post('/api/admin/notices', [\App\Controllers\NoticeController::class, 'create']);
$router->patch('/api/admin/notices/{id}', [\App\Controllers\NoticeController::class, 'update']);
$router->delete('/api/admin/notices/{id}', [\App\Controllers\NoticeController::class, 'delete']);
$router->patch('/api/admin/notices/{id}/toggle', [\App\Controllers\NoticeController::class, 'toggle']);

// ─── 관리자 활동 로그 ────────────────────────────────────
$router->get('/api/admin/logs', [\App\Controllers\AdminLogController::class, 'list']);

// ─── 통계 ───────────────────────────────────────────────
$router->get('/api/admin/stats', [\App\Controllers\StatsController::class, 'index']);

// ─── 사이트 내보내기/가져오기 ──────────────────────────────
$router->get('/api/admin/export', [\App\Controllers\SiteExportController::class, 'export']);
$router->post('/api/admin/import', [\App\Controllers\SiteExportController::class, 'import']);

// ─── 사이트 설정 ─────────────────────────────────────────
$router->get('/api/site-settings', [\App\Controllers\SiteSettingsController::class, 'show']);
$router->patch('/api/site-settings', [\App\Controllers\SiteSettingsController::class, 'update']);

// ─── SEO (sitemap / robots) ──────────────────────────────
$router->get('/sitemap.xml', [\App\Controllers\SeoController::class, 'sitemap']);
$router->get('/robots.txt', [\App\Controllers\SeoController::class, 'robots']);

// ─── RSS 피드 ────────────────────────────────────────────
$router->get('/b/{id}/feed.rss', [\App\Controllers\RssController::class, 'boardFeed']);

// ─── 페이지 캐시 관리 ────────────────────────────────────
$router->delete('/api/admin/cache', function (): void {
  \App\Middleware\AuthMiddleware::requireAdmin();
  $count = \App\Services\PageCacheService::flush();
  \App\Utils\ResponseHelper::success(['flushed' => $count]);
});
$router->get('/api/admin/cache/stats', function (): void {
  \App\Middleware\AuthMiddleware::requireAdmin();
  \App\Utils\ResponseHelper::success(\App\Services\PageCacheService::stats());
});
