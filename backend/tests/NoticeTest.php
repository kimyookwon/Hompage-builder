<?php

/**
 * 사이트 공지 시스템 테스트
 *
 * 실행: php tests/NoticeTest.php
 */

define('BASE_PATH', dirname(__DIR__));
require BASE_PATH . '/vendor/autoload.php';

use Dotenv\Dotenv;

$dotenv = Dotenv::createImmutable(BASE_PATH);
$dotenv->safeLoad();

class NoticeTest
{
  private \PDO $pdo;
  private int $passed = 0;
  private int $failed = 0;

  // 테스트 픽스처 ID
  private array $testNoticeIds = [];

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
    $this->pdo->exec("DELETE FROM site_notices WHERE title LIKE 'TEST_%'");
  }

  // 테스트용 픽스처 정리
  private function tearDown(): void
  {
    if ($this->testNoticeIds) {
      $placeholders = implode(',', array_fill(0, count($this->testNoticeIds), '?'));
      $this->pdo->prepare("DELETE FROM site_notices WHERE id IN ({$placeholders})")
                ->execute($this->testNoticeIds);
    }
  }

  // 테스트 1: site_notices 테이블 스키마 검증
  public function testNoticesTableSchema(): void
  {
    echo "\n[테스트] site_notices 테이블 스키마\n";

    // 테이블 존재 확인
    $stmt = $this->pdo->query(
      "SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES
       WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'site_notices'"
    );
    $table = $stmt->fetch();
    $this->assert('site_notices 테이블 존재', $table !== false);

    // 필수 컬럼 검증
    $requiredColumns = ['id', 'title', 'content', 'type', 'is_active', 'starts_at', 'ends_at', 'sort_order', 'created_at'];
    foreach ($requiredColumns as $col) {
      $stmt = $this->pdo->query(
        "SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS
         WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'site_notices' AND COLUMN_NAME = '{$col}'"
      );
      $column = $stmt->fetch();
      $this->assert("컬럼 존재: {$col}", $column !== false);
    }
  }

  // 테스트 2: 공지 생성 및 조회
  public function testCreateAndRetrieveNotice(): void
  {
    echo "\n[테스트] 공지 생성 및 조회\n";

    $title = 'TEST_공지 제목';
    $content = '공지 내용입니다';
    $type = 'info';
    $isActive = 1;

    $stmt = $this->pdo->prepare(
      "INSERT INTO site_notices (title, content, type, is_active) VALUES (?, ?, ?, ?)"
    );
    $stmt->execute([$title, $content, $type, $isActive]);
    $noticeId = (int) $this->pdo->lastInsertId();
    $this->testNoticeIds[] = $noticeId;

    $this->assert('공지 INSERT 성공', $noticeId > 0);

    // 조회 검증
    $stmt = $this->pdo->prepare("SELECT * FROM site_notices WHERE id = ?");
    $stmt->execute([$noticeId]);
    $notice = $stmt->fetch(\PDO::FETCH_ASSOC);

    $this->assert('공지 조회 성공', $notice !== false);
    $this->assert('title 정확', $notice['title'] === $title);
    $this->assert('content 정확', $notice['content'] === $content);
    $this->assert('type 정확', $notice['type'] === $type);
    $this->assert('is_active 정확', (int) $notice['is_active'] === $isActive);
    $this->assert('created_at 설정', !empty($notice['created_at']));
  }

  // 테스트 3: is_active=0인 공지는 공개 목록에서 제외
  public function testInactiveNoticeNotReturned(): void
  {
    echo "\n[테스트] 비활성 공지 제외\n";

    // 활성 공지
    $stmt = $this->pdo->prepare(
      "INSERT INTO site_notices (title, content, type, is_active) VALUES (?, ?, ?, ?)"
    );
    $stmt->execute(['TEST_활성', '내용', 'info', 1]);
    $activeId = (int) $this->pdo->lastInsertId();
    $this->testNoticeIds[] = $activeId;

    // 비활성 공지
    $stmt->execute(['TEST_비활성', '내용', 'info', 0]);
    $inactiveId = (int) $this->pdo->lastInsertId();
    $this->testNoticeIds[] = $inactiveId;

    // 공개 조회 쿼리
    $stmt = $this->pdo->prepare(
      "SELECT id FROM site_notices
       WHERE is_active = 1 AND (starts_at IS NULL OR starts_at <= NOW()) AND (ends_at IS NULL OR ends_at >= NOW())
       AND title LIKE 'TEST_%' ORDER BY sort_order ASC"
    );
    $stmt->execute();
    $notices = $stmt->fetchAll(\PDO::FETCH_ASSOC);
    $noticeIds = array_column($notices, 'id');

    $this->assert('활성 공지 포함', in_array($activeId, $noticeIds));
    $this->assert('비활성 공지 제외', !in_array($inactiveId, $noticeIds));
  }

  // 테스트 4: ends_at 과거인 공지는 공개 목록에서 제외
  public function testExpiredNoticeNotReturned(): void
  {
    echo "\n[테스트] 만료된 공지 제외\n";

    // 유효한 기간 공지
    $validEndsAt = date('Y-m-d H:i:s', strtotime('+1 day'));
    $stmt = $this->pdo->prepare(
      "INSERT INTO site_notices (title, content, type, is_active, starts_at, ends_at)
       VALUES (?, ?, ?, ?, ?, ?)"
    );
    $stmt->execute(['TEST_유효', '내용', 'info', 1, NULL, $validEndsAt]);
    $validId = (int) $this->pdo->lastInsertId();
    $this->testNoticeIds[] = $validId;

    // 만료된 공지
    $expiredEndsAt = date('Y-m-d H:i:s', strtotime('-1 day'));
    $stmt->execute(['TEST_만료', '내용', 'info', 1, NULL, $expiredEndsAt]);
    $expiredId = (int) $this->pdo->lastInsertId();
    $this->testNoticeIds[] = $expiredId;

    // 공개 조회 쿼리
    $stmt = $this->pdo->prepare(
      "SELECT id FROM site_notices
       WHERE is_active = 1 AND (starts_at IS NULL OR starts_at <= NOW()) AND (ends_at IS NULL OR ends_at >= NOW())
       AND title LIKE 'TEST_%' ORDER BY sort_order ASC"
    );
    $stmt->execute();
    $notices = $stmt->fetchAll(\PDO::FETCH_ASSOC);
    $noticeIds = array_column($notices, 'id');

    $this->assert('유효한 공지 포함', in_array($validId, $noticeIds));
    $this->assert('만료된 공지 제외', !in_array($expiredId, $noticeIds));
  }

  // 테스트 5: starts_at 미래인 공지는 공개 목록에서 제외
  public function testFutureNoticeNotReturned(): void
  {
    echo "\n[테스트] 미래 공지 제외\n";

    // 즉시 시작 공지
    $stmt = $this->pdo->prepare(
      "INSERT INTO site_notices (title, content, type, is_active, starts_at, ends_at)
       VALUES (?, ?, ?, ?, ?, ?)"
    );
    $stmt->execute(['TEST_즉시', '내용', 'info', 1, NULL, NULL]);
    $immediateId = (int) $this->pdo->lastInsertId();
    $this->testNoticeIds[] = $immediateId;

    // 미래 시작 공지
    $futureStartsAt = date('Y-m-d H:i:s', strtotime('+1 day'));
    $stmt->execute(['TEST_미래', '내용', 'info', 1, $futureStartsAt, NULL]);
    $futureId = (int) $this->pdo->lastInsertId();
    $this->testNoticeIds[] = $futureId;

    // 공개 조회 쿼리
    $stmt = $this->pdo->prepare(
      "SELECT id FROM site_notices
       WHERE is_active = 1 AND (starts_at IS NULL OR starts_at <= NOW()) AND (ends_at IS NULL OR ends_at >= NOW())
       AND title LIKE 'TEST_%' ORDER BY sort_order ASC"
    );
    $stmt->execute();
    $notices = $stmt->fetchAll(\PDO::FETCH_ASSOC);
    $noticeIds = array_column($notices, 'id');

    $this->assert('즉시 공지 포함', in_array($immediateId, $noticeIds));
    $this->assert('미래 공지 제외', !in_array($futureId, $noticeIds));
  }

  // 테스트 6: is_active 토글
  public function testToggleIsActive(): void
  {
    echo "\n[테스트] is_active 토글\n";

    $stmt = $this->pdo->prepare(
      "INSERT INTO site_notices (title, content, type, is_active) VALUES (?, ?, ?, ?)"
    );
    $stmt->execute(['TEST_토글', '내용', 'info', 1]);
    $noticeId = (int) $this->pdo->lastInsertId();
    $this->testNoticeIds[] = $noticeId;

    // 초기 상태 확인
    $stmt = $this->pdo->prepare("SELECT is_active FROM site_notices WHERE id = ?");
    $stmt->execute([$noticeId]);
    $initial = (int) $stmt->fetchColumn();
    $this->assert('초기 is_active=1', $initial === 1);

    // 비활성화
    $this->pdo->prepare("UPDATE site_notices SET is_active = 0 WHERE id = ?")->execute([$noticeId]);
    $stmt->execute([$noticeId]);
    $toggled = (int) $stmt->fetchColumn();
    $this->assert('토글 후 is_active=0', $toggled === 0);

    // 다시 활성화
    $this->pdo->prepare("UPDATE site_notices SET is_active = 1 WHERE id = ?")->execute([$noticeId]);
    $stmt->execute([$noticeId]);
    $retoggled = (int) $stmt->fetchColumn();
    $this->assert('재토글 후 is_active=1', $retoggled === 1);
  }

  // 테스트 7: type ENUM 검증
  public function testNoticeTypeValues(): void
  {
    echo "\n[테스트] type ENUM 허용값\n";

    $validTypes = ['info', 'warning', 'error', 'success'];

    foreach ($validTypes as $type) {
      try {
        $stmt = $this->pdo->prepare(
          "INSERT INTO site_notices (title, content, type, is_active) VALUES (?, ?, ?, ?)"
        );
        $stmt->execute(["TEST_{$type}", '내용', $type, 1]);
        $id = (int) $this->pdo->lastInsertId();
        $this->testNoticeIds[] = $id;
        $this->assert("type='{$type}' 허용", true);
      } catch (\Exception $e) {
        $this->assert("type='{$type}' 허용", false, $e->getMessage());
      }
    }

    // 허용되지 않는 type 테스트
    try {
      $stmt = $this->pdo->prepare(
        "INSERT INTO site_notices (title, content, type, is_active) VALUES (?, ?, ?, ?)"
      );
      $stmt->execute(['TEST_invalid', '내용', 'invalid_type', 1]);
      $this->assert("허용되지 않는 type 거부", false, "예외가 발생해야 함");
    } catch (\Exception $e) {
      $this->assert("허용되지 않는 type 거부", true);
    }
  }

  // 테스트 8: sort_order 정렬
  public function testSortOrderApplied(): void
  {
    echo "\n[테스트] sort_order 정렬\n";

    // sort_order 다른 공지 3개 생성
    $stmt = $this->pdo->prepare(
      "INSERT INTO site_notices (title, content, type, is_active, sort_order) VALUES (?, ?, ?, ?, ?)"
    );
    $stmt->execute(['TEST_order_3', '내용', 'info', 1, 3]);
    $id3 = (int) $this->pdo->lastInsertId();
    $this->testNoticeIds[] = $id3;

    $stmt->execute(['TEST_order_1', '내용', 'info', 1, 1]);
    $id1 = (int) $this->pdo->lastInsertId();
    $this->testNoticeIds[] = $id1;

    $stmt->execute(['TEST_order_2', '내용', 'info', 1, 2]);
    $id2 = (int) $this->pdo->lastInsertId();
    $this->testNoticeIds[] = $id2;

    // sort_order 오름차순 정렬
    $stmt = $this->pdo->prepare(
      "SELECT id FROM site_notices
       WHERE title LIKE 'TEST_order_%' AND is_active = 1
       ORDER BY sort_order ASC"
    );
    $stmt->execute();
    $ordered = array_column($stmt->fetchAll(\PDO::FETCH_ASSOC), 'id');

    $this->assert('sort_order 정렬 1위', $ordered[0] === $id1);
    $this->assert('sort_order 정렬 2위', $ordered[1] === $id2);
    $this->assert('sort_order 정렬 3위', $ordered[2] === $id3);
  }

  public function run(): void
  {
    echo "=== NoticeTest 실행 ===\n";
    $this->setUp();

    try {
      $this->testNoticesTableSchema();
      $this->testCreateAndRetrieveNotice();
      $this->testInactiveNoticeNotReturned();
      $this->testExpiredNoticeNotReturned();
      $this->testFutureNoticeNotReturned();
      $this->testToggleIsActive();
      $this->testNoticeTypeValues();
      $this->testSortOrderApplied();
    } finally {
      $this->tearDown();
    }

    echo "\n=== 결과: {$this->passed} 통과, {$this->failed} 실패 ===\n";
    exit($this->failed > 0 ? 1 : 0);
  }
}

(new NoticeTest())->run();
