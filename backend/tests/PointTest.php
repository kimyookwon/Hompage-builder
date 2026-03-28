<?php

/**
 * 회원 포인트 및 레벨 시스템 테스트
 *
 * 실행: php tests/PointTest.php
 */

define('BASE_PATH', dirname(__DIR__));
require BASE_PATH . '/vendor/autoload.php';

use Dotenv\Dotenv;
use App\Utils\PointHelper;

$dotenv = Dotenv::createImmutable(BASE_PATH);
$dotenv->safeLoad();

class PointTest
{
  private \PDO $pdo;
  private int $passed = 0;
  private int $failed = 0;

  // 테스트 픽스처 ID
  private ?int $testUserId = null;
  private array $testLogIds = [];

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

  // 테스트용 픽스처 생성
  private function setUp(): void
  {
    // 이전 실행에서 남은 픽스처 정리 (멱등 보장)
    $stmt = $this->pdo->prepare("SELECT id FROM users WHERE email = 'point_test@example.com'");
    $stmt->execute();
    $existingUser = $stmt->fetch();

    if ($existingUser) {
      $existingId = (int) $existingUser['id'];
      // 기존 사용자의 로그 정리
      $this->pdo->prepare("DELETE FROM point_logs WHERE user_id = ?")->execute([$existingId]);
      // 기존 사용자 삭제
      $this->pdo->prepare("DELETE FROM users WHERE id = ?")->execute([$existingId]);
    }

    // 테스트 사용자 생성 (points=0, level=1)
    $this->pdo->prepare(
      "INSERT INTO users (email, name, password_hash, role, status, points, level)
       VALUES (?, ?, ?, 'user', 'active', 0, 1)"
    )->execute(['point_test@example.com', '포인트테스터', password_hash('test1234', PASSWORD_BCRYPT)]);
    $this->testUserId = (int) $this->pdo->lastInsertId();
  }

  // 테스트용 픽스처 정리
  private function tearDown(): void
  {
    if ($this->testLogIds) {
      $placeholders = implode(',', array_fill(0, count($this->testLogIds), '?'));
      $this->pdo->prepare("DELETE FROM point_logs WHERE id IN ({$placeholders})")
                ->execute($this->testLogIds);
    }
    if ($this->testUserId) {
      $this->pdo->prepare("DELETE FROM users WHERE id = ?")->execute([$this->testUserId]);
    }
  }

  // 테스트 1: users 테이블 points, level 컬럼 확인
  public function testUsersTableHasPointColumns(): void
  {
    echo "\n[테스트] users 테이블 포인트 컬럼\n";

    $requiredColumns = ['points', 'level'];
    foreach ($requiredColumns as $col) {
      $stmt = $this->pdo->query(
        "SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS
         WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'users' AND COLUMN_NAME = '{$col}'"
      );
      $column = $stmt->fetch();
      $this->assert("컬럼 존재: {$col}", $column !== false);
    }
  }

  // 테스트 2: point_logs 테이블 스키마 확인
  public function testPointLogsTableSchema(): void
  {
    echo "\n[테스트] point_logs 테이블 스키마\n";

    // 테이블 존재 확인
    $stmt = $this->pdo->query(
      "SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES
       WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'point_logs'"
    );
    $table = $stmt->fetch();
    $this->assert('point_logs 테이블 존재', $table !== false);

    // 필수 컬럼 검증
    $requiredColumns = ['id', 'user_id', 'points', 'reason', 'ref_id', 'created_at'];
    foreach ($requiredColumns as $col) {
      $stmt = $this->pdo->query(
        "SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS
         WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'point_logs' AND COLUMN_NAME = '{$col}'"
      );
      $column = $stmt->fetch();
      $this->assert("컬럼 존재: {$col}", $column !== false);
    }
  }

  // 테스트 3: PointHelper::calcLevel() 레벨 계산 (경계값)
  public function testCalcLevel(): void
  {
    echo "\n[테스트] PointHelper::calcLevel() 경계값\n";

    // 클래스 로드 확인
    $this->assert('PointHelper 클래스 존재', class_exists('App\\Utils\\PointHelper'));

    // calcLevel 메서드 존재
    $this->assert('calcLevel 메서드 존재', method_exists('App\\Utils\\PointHelper', 'calcLevel'));

    $testCases = [
      [0, 1],
      [99, 1],
      [100, 2],
      [299, 2],
      [300, 3],
      [599, 3],
      [600, 4],
      [999, 4],
      [1000, 5],
      [9999, 5],
    ];

    foreach ($testCases as [$points, $expectedLevel]) {
      $level = PointHelper::calcLevel($points);
      $this->assert(
        "calcLevel({$points}) = {$expectedLevel}",
        $level === $expectedLevel,
        "expected={$expectedLevel}, got={$level}"
      );
    }
  }

  // 테스트 4: 포인트 적립 및 레벨 업데이트
  public function testEarnPointsAndLevelUpdate(): void
  {
    echo "\n[테스트] 포인트 적립 및 레벨 업데이트\n";

    // 초기 상태 확인
    $stmt = $this->pdo->prepare("SELECT points, level FROM users WHERE id = ?");
    $stmt->execute([$this->testUserId]);
    $initial = $stmt->fetch(\PDO::FETCH_ASSOC);

    $this->assert('초기 points=0', (int) $initial['points'] === 0);
    $this->assert('초기 level=1', (int) $initial['level'] === 1);

    // 포인트 적립 (100포인트 → 레벨 2)
    PointHelper::earn($this->testUserId, 100, 'TEST_earn_level2');

    $stmt->execute([$this->testUserId]);
    $after1 = $stmt->fetch(\PDO::FETCH_ASSOC);

    $this->assert('포인트 적립 100', (int) $after1['points'] === 100);
    $this->assert('레벨 업 2', (int) $after1['level'] === 2);

    // 추가 포인트 (200포인트 더 → 총 300 → 레벨 3)
    PointHelper::earn($this->testUserId, 200, 'TEST_earn_level3');

    $stmt->execute([$this->testUserId]);
    $after2 = $stmt->fetch(\PDO::FETCH_ASSOC);

    $this->assert('포인트 누적 300', (int) $after2['points'] === 300);
    $this->assert('레벨 업 3', (int) $after2['level'] === 3);
  }

  // 테스트 5: 포인트 로그 reason 필드
  public function testPointLogReason(): void
  {
    echo "\n[테스트] 포인트 로그 reason 필드\n";

    $reason = 'TEST_comment_create_specific';
    PointHelper::earn($this->testUserId, 10, $reason);

    // 특정 reason으로 로그 조회
    $stmt = $this->pdo->prepare(
      "SELECT id, reason FROM point_logs WHERE user_id = ? AND reason = ? LIMIT 1"
    );
    $stmt->execute([$this->testUserId, $reason]);
    $log = $stmt->fetch(\PDO::FETCH_ASSOC);

    $this->testLogIds[] = (int) $log['id'];

    $this->assert('로그 생성됨', $log !== false);
    $this->assert('reason 정확', $log !== false && $log['reason'] === $reason);
  }

  // 테스트 6: 여러 번의 포인트 적립 누적
  public function testMultipleEarnsAccumulate(): void
  {
    echo "\n[테스트] 여러 번 포인트 적립 누적\n";

    // 현재 포인트 초기화 (이전 테스트 격리)
    $this->pdo->prepare("UPDATE users SET points = 0, level = 1 WHERE id = ?")->execute([$this->testUserId]);

    $amounts = [10, 20, 30, 40];
    $total = 0;

    foreach ($amounts as $amount) {
      PointHelper::earn($this->testUserId, $amount, "TEST_accumulate_{$amount}");
      $total += $amount;
    }

    $stmt = $this->pdo->prepare("SELECT points FROM users WHERE id = ?");
    $stmt->execute([$this->testUserId]);
    $current = (int) $stmt->fetchColumn();

    $this->assert(
      '여러 번 적립 누적',
      $current === $total,
      "expected={$total}, got={$current}"
    );

    // 로그 4개 생성 확인
    $stmt = $this->pdo->prepare(
      "SELECT COUNT(*) as cnt FROM point_logs WHERE user_id = ? AND reason LIKE 'TEST_accumulate_%'"
    );
    $stmt->execute([$this->testUserId]);
    $logCount = (int) $stmt->fetchColumn();

    $this->assert('로그 4개 생성', $logCount === 4, "count={$logCount}");
  }

  // 테스트 7: 포인트 상수값 확인
  public function testEarnPointConstants(): void
  {
    echo "\n[테스트] 포인트 상수값\n";

    // 반사로 상수 확인
    $reflection = new \ReflectionClass(PointHelper::class);
    $constants = $reflection->getConstants();

    $this->assert(
      'POINT_POST_CREATE = 10',
      isset($constants['POINT_POST_CREATE']) && $constants['POINT_POST_CREATE'] === 10,
      "value=" . ($constants['POINT_POST_CREATE'] ?? 'undefined')
    );

    $this->assert(
      'POINT_COMMENT = 3',
      isset($constants['POINT_COMMENT']) && $constants['POINT_COMMENT'] === 3,
      "value=" . ($constants['POINT_COMMENT'] ?? 'undefined')
    );

    $this->assert(
      'POINT_LIKE_RECEIVED = 2',
      isset($constants['POINT_LIKE_RECEIVED']) && $constants['POINT_LIKE_RECEIVED'] === 2,
      "value=" . ($constants['POINT_LIKE_RECEIVED'] ?? 'undefined')
    );
  }

  public function run(): void
  {
    echo "=== PointTest 실행 ===\n";
    $this->setUp();

    try {
      $this->testUsersTableHasPointColumns();
      $this->testPointLogsTableSchema();
      $this->testCalcLevel();
      $this->testEarnPointsAndLevelUpdate();
      $this->testPointLogReason();
      $this->testMultipleEarnsAccumulate();
      $this->testEarnPointConstants();
    } finally {
      $this->tearDown();
    }

    echo "\n=== 결과: {$this->passed} 통과, {$this->failed} 실패 ===\n";
    exit($this->failed > 0 ? 1 : 0);
  }
}

(new PointTest())->run();
