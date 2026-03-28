<?php

namespace App\Controllers;

use App\Config\Database;
use App\Middleware\AuthMiddleware;
use App\Utils\ResponseHelper;

class StatsController {
  /** 허용되는 기간(일) 목록 */
  private const ALLOWED_DAYS = [7, 14, 30, 90];

  // GET /api/admin/stats?days=14 — 대시보드 통계
  public function index(): void {
    AuthMiddleware::requireAdmin();

    $pdo = Database::getInstance();

    // 기간 파라미터 (기본 14일, 허용: 7/14/30/90)
    $days = (int) ($_GET['days'] ?? 14);
    if (!in_array($days, self::ALLOWED_DAYS, true)) {
      $days = 14;
    }
    $interval = $days - 1;

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

    // 일별 통계 (동적 기간)
    $dailyPosts = $pdo->prepare(
      "SELECT DATE(created_at) AS date, COUNT(*) AS count
       FROM posts
       WHERE created_at >= DATE_SUB(CURDATE(), INTERVAL :interval DAY)
       GROUP BY DATE(created_at)"
    );
    $dailyPosts->execute(['interval' => $interval]);
    $dailyPosts = $dailyPosts->fetchAll();

    $dailyUsers = $pdo->prepare(
      "SELECT DATE(created_at) AS date, COUNT(*) AS count
       FROM users
       WHERE created_at >= DATE_SUB(CURDATE(), INTERVAL :interval DAY)
       GROUP BY DATE(created_at)"
    );
    $dailyUsers->execute(['interval' => $interval]);
    $dailyUsers = $dailyUsers->fetchAll();

    $dailyComments = $pdo->prepare(
      "SELECT DATE(created_at) AS date, COUNT(*) AS count
       FROM comments
       WHERE created_at >= DATE_SUB(CURDATE(), INTERVAL :interval DAY)
       GROUP BY DATE(created_at)"
    );
    $dailyComments->execute(['interval' => $interval]);
    $dailyComments = $dailyComments->fetchAll();

    // 날짜 키로 변환
    $toMap = fn(array $rows) => array_column($rows, 'count', 'date');
    $postsMap = $toMap($dailyPosts);
    $usersMap = $toMap($dailyUsers);
    $commentsMap = $toMap($dailyComments);

    // 날짜 배열 생성 (동적 기간)
    $dailyStats = [];
    for ($i = $interval; $i >= 0; $i--) {
      $date = date('Y-m-d', strtotime("-{$i} days"));
      $dailyStats[] = [
        'date'     => $date,
        'posts'    => (int) ($postsMap[$date] ?? 0),
        'users'    => (int) ($usersMap[$date] ?? 0),
        'comments' => (int) ($commentsMap[$date] ?? 0),
      ];
    }

    // 게시판별 게시글 분포
    $boardDist = $pdo->query(
      "SELECT b.name AS board_name, COUNT(p.id) AS count
       FROM boards b
       LEFT JOIN posts p ON p.board_id = b.id
       GROUP BY b.id, b.name
       ORDER BY count DESC"
    )->fetchAll();

    $boardDistribution = array_map(fn(array $row) => [
      'boardName' => $row['board_name'],
      'count'     => (int) $row['count'],
    ], $boardDist);

    // 이번 달 vs 지난달 비교
    $thisMonthStart = date('Y-m-01');
    $lastMonthStart = date('Y-m-01', strtotime('-1 month'));
    $lastMonthEnd = date('Y-m-t', strtotime('-1 month'));

    $stmtPostsThis = $pdo->prepare(
      "SELECT COUNT(*) FROM posts WHERE created_at >= :start"
    );
    $stmtPostsThis->execute(['start' => $thisMonthStart]);
    $postsThisMonth = (int) $stmtPostsThis->fetchColumn();

    $stmtPostsLast = $pdo->prepare(
      "SELECT COUNT(*) FROM posts WHERE created_at >= :start AND created_at <= :end"
    );
    $stmtPostsLast->execute(['start' => $lastMonthStart, 'end' => $lastMonthEnd . ' 23:59:59']);
    $postsLastMonth = (int) $stmtPostsLast->fetchColumn();

    $stmtUsersThis = $pdo->prepare(
      "SELECT COUNT(*) FROM users WHERE created_at >= :start"
    );
    $stmtUsersThis->execute(['start' => $thisMonthStart]);
    $usersThisMonth = (int) $stmtUsersThis->fetchColumn();

    $stmtUsersLast = $pdo->prepare(
      "SELECT COUNT(*) FROM users WHERE created_at >= :start AND created_at <= :end"
    );
    $stmtUsersLast->execute(['start' => $lastMonthStart, 'end' => $lastMonthEnd . ' 23:59:59']);
    $usersLastMonth = (int) $stmtUsersLast->fetchColumn();

    $monthlyComparison = [
      'postsThisMonth' => $postsThisMonth,
      'postsLastMonth' => $postsLastMonth,
      'usersThisMonth' => $usersThisMonth,
      'usersLastMonth' => $usersLastMonth,
    ];

    ResponseHelper::success([
      'stats'              => $stats,
      'recent_posts'       => $recent,
      'daily_stats'        => $dailyStats,
      'board_distribution' => $boardDistribution,
      'monthly_comparison' => $monthlyComparison,
    ]);
  }
}
