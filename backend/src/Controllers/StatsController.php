<?php

namespace App\Controllers;

use App\Config\Database;
use App\Middleware\AuthMiddleware;
use App\Utils\ResponseHelper;

class StatsController {
  // GET /api/admin/stats — 대시보드 통계
  public function index(): void {
    AuthMiddleware::requireAdmin();

    $pdo = Database::getInstance();

    $stats = [
      'total_users' => (int) $pdo->query('SELECT COUNT(*) FROM users')->fetchColumn(),
      'blocked_users' => (int) $pdo->query("SELECT COUNT(*) FROM users WHERE status = 'blocked'")->fetchColumn(),
      'total_posts' => (int) $pdo->query('SELECT COUNT(*) FROM posts')->fetchColumn(),
      'total_comments' => (int) $pdo->query('SELECT COUNT(*) FROM comments')->fetchColumn(),
      'total_pages' => (int) $pdo->query('SELECT COUNT(*) FROM pages')->fetchColumn(),
      'published_pages' => (int) $pdo->query('SELECT COUNT(*) FROM pages WHERE is_published = TRUE')->fetchColumn(),
    ];

    // 최근 게시글 10개
    $recent = $pdo->query(
      'SELECT p.id, p.title, p.created_at, u.name AS author_name, b.name AS board_name,
              (SELECT COUNT(*) FROM comments c WHERE c.post_id = p.id) AS comment_count
       FROM posts p
       JOIN users u ON u.id = p.author_id
       JOIN boards b ON b.id = p.board_id
       ORDER BY p.created_at DESC LIMIT 10'
    )->fetchAll();

    // 최근 14일 일별 통계
    $dailyPosts = $pdo->query(
      "SELECT DATE(created_at) AS date, COUNT(*) AS count
       FROM posts
       WHERE created_at >= DATE_SUB(CURDATE(), INTERVAL 13 DAY)
       GROUP BY DATE(created_at)"
    )->fetchAll();

    $dailyUsers = $pdo->query(
      "SELECT DATE(created_at) AS date, COUNT(*) AS count
       FROM users
       WHERE created_at >= DATE_SUB(CURDATE(), INTERVAL 13 DAY)
       GROUP BY DATE(created_at)"
    )->fetchAll();

    $dailyComments = $pdo->query(
      "SELECT DATE(created_at) AS date, COUNT(*) AS count
       FROM comments
       WHERE created_at >= DATE_SUB(CURDATE(), INTERVAL 13 DAY)
       GROUP BY DATE(created_at)"
    )->fetchAll();

    // 날짜 키로 변환
    $toMap = fn(array $rows) => array_column($rows, 'count', 'date');
    $postsMap = $toMap($dailyPosts);
    $usersMap = $toMap($dailyUsers);
    $commentsMap = $toMap($dailyComments);

    // 최근 14일 날짜 배열 생성
    $dailyStats = [];
    for ($i = 13; $i >= 0; $i--) {
      $date = date('Y-m-d', strtotime("-{$i} days"));
      $dailyStats[] = [
        'date'     => $date,
        'posts'    => (int) ($postsMap[$date] ?? 0),
        'users'    => (int) ($usersMap[$date] ?? 0),
        'comments' => (int) ($commentsMap[$date] ?? 0),
      ];
    }

    ResponseHelper::success([
      'stats'        => $stats,
      'recent_posts' => $recent,
      'daily_stats'  => $dailyStats,
    ]);
  }
}
