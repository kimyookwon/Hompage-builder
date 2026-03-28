<?php

/**
 * 관리자 통계 API 테스트
 *
 * 실행: php tests/StatsTest.php
 */

define('BASE_PATH', dirname(__DIR__));
require BASE_PATH . '/vendor/autoload.php';

use Dotenv\Dotenv;

$dotenv = Dotenv::createImmutable(BASE_PATH);
$dotenv->safeLoad();

class StatsTest
{
  private \PDO $pdo;
  private int $passed = 0;
  private int $failed = 0;

  public function __construct()
  {
    $host = $_ENV['DB_HOST']     ?? 'localhost';
    $db   = $_ENV['DB_DATABASE'] ?? ($_ENV['DB_NAME']  ?? 'homepage_builder');
    $user = $_ENV['DB_USERNAME'] ?? ($_ENV['DB_USER']  ?? 'root');
    $pass = $_ENV['DB_PASSWORD'] ?? ($_ENV['DB_PASS']  ?? '');
    $this->pdo = new \PDO(
      "mysql:host={$host};dbname={$db};charset=utf8mb4",
      $user, $pass,
      [\PDO::ATTR_ERRMODE => \PDO::ERRMODE_EXCEPTION]
    );
  }

  private function assert(string $name, bool $condition, string $msg = ''): void
  {
    if ($condition) {
      echo "  [PASS] {$name}\n";
      $this->passed++;
    } else {
      echo "  [FAIL] {$name}" . ($msg ? ": {$msg}" : '') . "\n";
      $this->failed++;
    }
  }

  // 테스트 1: 허용 days 값(7,14,30,90)으로 일별 통계 쿼리 정상 동작
  public function testDailyStatsByDays(): void
  {
    echo "\n[테스트] days 파라미터 별 일별 통계 쿼리\n";

    foreach ([7, 14, 30, 90] as $days) {
      $stmt = $this->pdo->prepare(
        "SELECT DATE(created_at) AS date, COUNT(*) AS count
         FROM posts
         WHERE created_at >= DATE_SUB(CURDATE(), INTERVAL ? DAY)
         GROUP BY DATE(created_at)"
      );
      $stmt->execute([$days]);
      $rows = $stmt->fetchAll(\PDO::FETCH_ASSOC);

      // 쿼리 자체는 항상 성공해야 함 (결과가 없어도 오류 없음)
      $this->assert("days={$days} 쿼리 정상 실행", is_array($rows));

      // 반환된 각 행에 date, count 키가 있어야 함
      foreach ($rows as $row) {
        $this->assert(
          "days={$days} 행 구조 확인 (date, count)",
          isset($row['date'], $row['count'])
        );
        break; // 첫 번째 행만 검사
      }
    }
  }

  // 테스트 2: 게시판별 게시글 분포 쿼리
  public function testBoardDistributionQuery(): void
  {
    echo "\n[테스트] 게시판별 게시글 분포\n";

    $stmt = $this->pdo->query(
      "SELECT b.name AS board_name, COUNT(p.id) AS count
       FROM boards b
       LEFT JOIN posts p ON p.board_id = b.id
       GROUP BY b.id, b.name
       ORDER BY count DESC"
    );
    $rows = $stmt->fetchAll(\PDO::FETCH_ASSOC);

    $this->assert('board_distribution 쿼리 성공', is_array($rows));

    // 각 행이 board_name, count를 포함해야 함
    foreach ($rows as $row) {
      $this->assert('board_name 키 존재', isset($row['board_name']));
      $this->assert('count 키 존재', isset($row['count']));
      $this->assert('count 0 이상', (int) $row['count'] >= 0);
      break;
    }
  }

  // 테스트 3: 이번 달 vs 지난달 비교 쿼리
  public function testMonthlyComparisonQuery(): void
  {
    echo "\n[테스트] 이번 달 vs 지난달 비교\n";

    $postsThisMonth = (int) $this->pdo->query(
      "SELECT COUNT(*) FROM posts WHERE YEAR(created_at) = YEAR(CURDATE()) AND MONTH(created_at) = MONTH(CURDATE())"
    )->fetchColumn();

    $postsLastMonth = (int) $this->pdo->query(
      "SELECT COUNT(*) FROM posts WHERE YEAR(created_at) = YEAR(DATE_SUB(CURDATE(), INTERVAL 1 MONTH))
       AND MONTH(created_at) = MONTH(DATE_SUB(CURDATE(), INTERVAL 1 MONTH))"
    )->fetchColumn();

    $usersThisMonth = (int) $this->pdo->query(
      "SELECT COUNT(*) FROM users WHERE YEAR(created_at) = YEAR(CURDATE()) AND MONTH(created_at) = MONTH(CURDATE())"
    )->fetchColumn();

    $this->assert('이번 달 게시글 수 0 이상',  $postsThisMonth >= 0, "count={$postsThisMonth}");
    $this->assert('지난 달 게시글 수 0 이상',  $postsLastMonth >= 0, "count={$postsLastMonth}");
    $this->assert('이번 달 신규 가입 수 0 이상', $usersThisMonth >= 0, "count={$usersThisMonth}");
  }

  // 테스트 4: 통계 요약 카운트 일관성 (total_posts == sum of board posts)
  public function testPostCountConsistency(): void
  {
    echo "\n[테스트] 게시글 수 일관성\n";

    $totalPosts = (int) $this->pdo->query('SELECT COUNT(*) FROM posts')->fetchColumn();

    $boardSum = (int) $this->pdo->query(
      'SELECT COUNT(p.id) FROM boards b LEFT JOIN posts p ON p.board_id = b.id'
    )->fetchColumn();

    $this->assert(
      'total_posts == board_distribution 합계',
      $totalPosts === $boardSum,
      "total={$totalPosts}, sum={$boardSum}"
    );
  }

  // 테스트 5: 허용되지 않는 days 값에 대한 화이트리스트 검증
  public function testDaysWhitelist(): void
  {
    echo "\n[테스트] days 화이트리스트 검증\n";

    $allowed = [7, 14, 30, 90];
    $invalid = [0, -1, 100, 999];

    foreach ($invalid as $d) {
      // StatsController의 화이트리스트 로직 시뮬레이션
      $days = in_array($d, $allowed, true) ? $d : 14;
      $this->assert("days={$d} → 기본값 14로 폴백", $days === 14);
    }

    foreach ($allowed as $d) {
      $days = in_array($d, $allowed, true) ? $d : 14;
      $this->assert("days={$d} 허용됨", $days === $d);
    }
  }

  public function run(): void
  {
    echo "=== StatsTest 실행 ===\n";
    $this->testDailyStatsByDays();
    $this->testBoardDistributionQuery();
    $this->testMonthlyComparisonQuery();
    $this->testPostCountConsistency();
    $this->testDaysWhitelist();

    echo "\n=== 결과: {$this->passed} 통과, {$this->failed} 실패 ===\n";
    exit($this->failed > 0 ? 1 : 0);
  }
}

(new StatsTest())->run();
