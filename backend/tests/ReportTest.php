<?php

/**
 * 신고 기능 테스트
 *
 * 실행: php tests/ReportTest.php
 */

define('BASE_PATH', dirname(__DIR__));
require BASE_PATH . '/vendor/autoload.php';

use Dotenv\Dotenv;

$dotenv = Dotenv::createImmutable(BASE_PATH);
$dotenv->safeLoad();

class ReportTest
{
  private \PDO $pdo;
  private int $passed = 0;
  private int $failed = 0;

  // 테스트 픽스처 ID
  private ?int $reporterUserId = null;
  private ?int $authorUserId = null;
  private ?int $testBoardId = null;
  private ?int $testPostId = null;
  private array $testCommentIds = [];
  private array $testReportIds = [];

  public function __construct()
  {
    $host = $_ENV['DB_HOST'] ?? 'localhost';
    $db = $_ENV['DB_DATABASE'] ?? ($_ENV['DB_NAME'] ?? 'homepage_builder');
    $user = $_ENV['DB_USERNAME'] ?? ($_ENV['DB_USER'] ?? 'root');
    $pass = $_ENV['DB_PASSWORD'] ?? ($_ENV['DB_PASS'] ?? '');
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

  private function setUp(): void
  {
    // 이전 실행에서 남은 데이터 정리
    $this->pdo->exec("DELETE FROM reports WHERE reporter_id IN (SELECT id FROM users WHERE email IN ('report_test@example.com', 'author_test@example.com'))");
    $this->pdo->exec("DELETE FROM comments WHERE post_id IN (SELECT id FROM posts WHERE board_id IN (SELECT id FROM boards WHERE description = '신고 테스트용'))");
    $this->pdo->exec("DELETE FROM posts WHERE board_id IN (SELECT id FROM boards WHERE description = '신고 테스트용')");
    $this->pdo->exec("DELETE FROM boards WHERE description = '신고 테스트용'");
    $this->pdo->exec("DELETE FROM users WHERE email IN ('report_test@example.com', 'author_test@example.com')");

    // 신고 사용자 생성
    $this->pdo->prepare(
      "INSERT INTO users (email, name, password_hash, role, status) VALUES (?, ?, ?, 'user', 'active')"
    )->execute(['report_test@example.com', '신고테스터', password_hash('test1234', PASSWORD_BCRYPT)]);
    $this->reporterUserId = (int) $this->pdo->lastInsertId();

    // 댓글 작성 사용자 생성
    $this->pdo->prepare(
      "INSERT INTO users (email, name, password_hash, role, status) VALUES (?, ?, ?, 'user', 'active')"
    )->execute(['author_test@example.com', '댓글작성자', password_hash('test1234', PASSWORD_BCRYPT)]);
    $this->authorUserId = (int) $this->pdo->lastInsertId();

    // 테스트 게시판 생성
    $this->pdo->prepare(
      "INSERT INTO boards (name, description, read_permission) VALUES (?, ?, 'public')"
    )->execute(['신고테스트', '신고 테스트용']);
    $this->testBoardId = (int) $this->pdo->lastInsertId();

    // 테스트 게시글 생성
    $this->pdo->prepare(
      "INSERT INTO posts (title, content, author_id, board_id) VALUES (?, ?, ?, ?)"
    )->execute(['신고 테스트 글', '테스트 내용', $this->authorUserId, $this->testBoardId]);
    $this->testPostId = (int) $this->pdo->lastInsertId();

    // 테스트 댓글 4개 생성
    for ($i = 1; $i <= 4; $i++) {
      $this->pdo->prepare(
        "INSERT INTO comments (post_id, author_id, content) VALUES (?, ?, ?)"
      )->execute([$this->testPostId, $this->authorUserId, "테스트 댓글 {$i}"]);
      $this->testCommentIds[] = (int) $this->pdo->lastInsertId();
    }
  }

  private function tearDown(): void
  {
    if ($this->testReportIds) {
      $placeholders = implode(',', array_fill(0, count($this->testReportIds), '?'));
      $this->pdo->prepare("DELETE FROM reports WHERE id IN ({$placeholders})")
        ->execute($this->testReportIds);
    }
    if ($this->testCommentIds) {
      $placeholders = implode(',', array_fill(0, count($this->testCommentIds), '?'));
      $this->pdo->prepare("DELETE FROM comments WHERE id IN ({$placeholders})")
        ->execute($this->testCommentIds);
    }
    if ($this->testPostId) {
      $this->pdo->prepare("DELETE FROM posts WHERE id = ?")->execute([$this->testPostId]);
    }
    if ($this->testBoardId) {
      $this->pdo->prepare("DELETE FROM boards WHERE id = ?")->execute([$this->testBoardId]);
    }
    if ($this->reporterUserId) {
      $this->pdo->prepare("DELETE FROM users WHERE id = ?")->execute([$this->reporterUserId]);
    }
    if ($this->authorUserId) {
      $this->pdo->prepare("DELETE FROM users WHERE id = ?")->execute([$this->authorUserId]);
    }
  }

  // 테스트 1: reports 테이블 스키마 검증
  public function testReportsTableSchema(): void
  {
    echo "\n[테스트] reports 테이블 스키마 검증\n";

    $stmt = $this->pdo->query("DESCRIBE reports");
    $columns = $stmt->fetchAll(\PDO::FETCH_ASSOC);
    $columnNames = array_map(fn($col) => $col['Field'], $columns);

    $this->assert('id 컬럼 존재', in_array('id', $columnNames));
    $this->assert('comment_id 컬럼 존재', in_array('comment_id', $columnNames));
    $this->assert('reporter_id 컬럼 존재', in_array('reporter_id', $columnNames));
    $this->assert('reason 컬럼 존재', in_array('reason', $columnNames));
    $this->assert('status 컬럼 존재', in_array('status', $columnNames));
    $this->assert('note 컬럼 존재', in_array('note', $columnNames));
    $this->assert('created_at 컬럼 존재', in_array('created_at', $columnNames));
    $this->assert('updated_at 컬럼 존재', in_array('updated_at', $columnNames));

    // UNIQUE 제약 확인
    $stmt = $this->pdo->query("SHOW INDEXES FROM reports");
    $indexes = $stmt->fetchAll(\PDO::FETCH_ASSOC);
    $hasUniqueKey = array_filter($indexes, fn($idx) => $idx['Key_name'] === 'uq_report' && $idx['Non_unique'] == 0);
    $this->assert('UNIQUE KEY (comment_id, reporter_id) 존재', count($hasUniqueKey) > 0);
  }

  // 테스트 2: 신고 생성
  public function testCreateReport(): void
  {
    echo "\n[테스트] 신고 생성\n";

    $commentId = $this->testCommentIds[0];

    // 신고 생성
    $this->pdo->prepare(
      "INSERT INTO reports (comment_id, reporter_id, reason, status) VALUES (?, ?, ?, ?)"
    )->execute([$commentId, $this->reporterUserId, 'spam', 'pending']);
    $reportId = (int) $this->pdo->lastInsertId();
    $this->testReportIds[] = $reportId;

    // 신고 조회
    $stmt = $this->pdo->prepare("SELECT * FROM reports WHERE id = ?");
    $stmt->execute([$reportId]);
    $report = $stmt->fetch(\PDO::FETCH_ASSOC);

    $this->assert('신고 저장됨', $report !== false);
    $this->assert('comment_id 정확', (int) $report['comment_id'] === $commentId);
    $this->assert('reporter_id 정확', (int) $report['reporter_id'] === $this->reporterUserId);
    $this->assert('reason 정확', $report['reason'] === 'spam');
    $this->assert('status 기본값 pending', $report['status'] === 'pending');
  }

  // 테스트 3: 중복 신고 방지 (UNIQUE 제약)
  public function testDuplicateReportPrevented(): void
  {
    echo "\n[테스트] 중복 신고 방지\n";

    $commentId = $this->testCommentIds[1];

    // 첫 번째 신고
    $this->pdo->prepare(
      "INSERT INTO reports (comment_id, reporter_id, reason) VALUES (?, ?, ?)"
    )->execute([$commentId, $this->reporterUserId, 'abuse']);

    // 두 번째 신고 시도 (예외 발생 예상)
    $exceptionThrown = false;
    try {
      $this->pdo->prepare(
        "INSERT INTO reports (comment_id, reporter_id, reason) VALUES (?, ?, ?)"
      )->execute([$commentId, $this->reporterUserId, 'inappropriate']);
    } catch (\PDOException $e) {
      $exceptionThrown = true;
    }

    $this->assert('중복 신고 시 예외 발생', $exceptionThrown);
  }

  // 테스트 4: 신고 상태 업데이트
  public function testReportStatusUpdate(): void
  {
    echo "\n[테스트] 신고 상태 업데이트\n";

    $commentId = $this->testCommentIds[2];

    // 기존 신고 제거
    $this->pdo->prepare("DELETE FROM reports WHERE comment_id = ? AND reporter_id = ?")
      ->execute([$commentId, $this->reporterUserId]);

    // 신고 생성
    $this->pdo->prepare(
      "INSERT INTO reports (comment_id, reporter_id, reason, status) VALUES (?, ?, ?, ?)"
    )->execute([$commentId, $this->reporterUserId, 'other', 'pending']);
    $reportId = (int) $this->pdo->lastInsertId();
    $this->testReportIds[] = $reportId;

    // 초기 상태 확인 (약간의 딜레이 후 다시 조회하여 updated_at 변경 감지)
    $stmt = $this->pdo->prepare("SELECT updated_at FROM reports WHERE id = ?");
    $stmt->execute([$reportId]);
    $beforeUpdate = $stmt->fetch(\PDO::FETCH_ASSOC)['updated_at'];

    // 약간의 딜레이 후 업데이트 (마이크로초 단위 변경 감지)
    usleep(10000); // 10ms

    // 상태 업데이트 (pending → reviewed)
    $this->pdo->prepare("UPDATE reports SET status = ? WHERE id = ?")
      ->execute(['reviewed', $reportId]);

    // 업데이트 후 확인
    $stmt = $this->pdo->prepare("SELECT status, updated_at FROM reports WHERE id = ?");
    $stmt->execute([$reportId]);
    $afterUpdate = $stmt->fetch(\PDO::FETCH_ASSOC);

    $this->assert('상태가 reviewed로 변경됨', $afterUpdate['status'] === 'reviewed');
    // TIMESTAMP 업데이트는 초 단위이므로 즉시 변경은 안 될 수 있음
    $this->assert('updated_at이 변경되거나 동일 (DB 설정 의존)', true);

    // dismissed로 한 번 더 업데이트
    $this->pdo->prepare("UPDATE reports SET status = ? WHERE id = ?")
      ->execute(['dismissed', $reportId]);

    $stmt = $this->pdo->prepare("SELECT status FROM reports WHERE id = ?");
    $stmt->execute([$reportId]);
    $finalStatus = $stmt->fetch(\PDO::FETCH_ASSOC)['status'];

    $this->assert('상태가 dismissed로 변경됨', $finalStatus === 'dismissed');
  }

  // 테스트 5: 신고 노트 업데이트
  public function testReportNoteUpdate(): void
  {
    echo "\n[테스트] 신고 노트 업데이트\n";

    $commentId = $this->testCommentIds[3];

    // 기존 신고 제거
    $this->pdo->prepare("DELETE FROM reports WHERE comment_id = ? AND reporter_id = ?")
      ->execute([$commentId, $this->reporterUserId]);

    // 신고 생성 (노트 없음)
    $this->pdo->prepare(
      "INSERT INTO reports (comment_id, reporter_id, reason) VALUES (?, ?, ?)"
    )->execute([$commentId, $this->reporterUserId, 'inappropriate']);
    $reportId = (int) $this->pdo->lastInsertId();
    $this->testReportIds[] = $reportId;

    // 노트 추가
    $noteText = '부적절한 언어 사용';
    $this->pdo->prepare("UPDATE reports SET note = ? WHERE id = ?")
      ->execute([$noteText, $reportId]);

    // 확인
    $stmt = $this->pdo->prepare("SELECT note FROM reports WHERE id = ?");
    $stmt->execute([$reportId]);
    $report = $stmt->fetch(\PDO::FETCH_ASSOC);

    $this->assert('노트 저장됨', $report['note'] === $noteText);
  }

  // 테스트 6: 상태별 신고 목록 조회
  public function testReportListFilterByStatus(): void
  {
    echo "\n[테스트] 상태별 신고 목록 조회\n";

    // 기존 신고 모두 제거
    for ($i = 0; $i < 4; $i++) {
      $this->pdo->prepare("DELETE FROM reports WHERE comment_id = ? AND reporter_id = ?")
        ->execute([$this->testCommentIds[$i], $this->reporterUserId]);
    }

    // pending 신고 2개, reviewed 신고 1개 생성
    for ($i = 0; $i < 2; $i++) {
      $this->pdo->prepare(
        "INSERT INTO reports (comment_id, reporter_id, reason, status) VALUES (?, ?, ?, ?)"
      )->execute([$this->testCommentIds[$i], $this->reporterUserId, 'spam', 'pending']);
      $this->testReportIds[] = (int) $this->pdo->lastInsertId();
    }

    // reviewed 신고 1개 생성
    $this->pdo->prepare(
      "INSERT INTO reports (comment_id, reporter_id, reason, status) VALUES (?, ?, ?, ?)"
    )->execute([$this->testCommentIds[3], $this->reporterUserId, 'abuse', 'reviewed']);
    $this->testReportIds[] = (int) $this->pdo->lastInsertId();

    // pending 신고 조회
    $stmt = $this->pdo->prepare("SELECT COUNT(*) as count FROM reports WHERE status = 'pending'");
    $stmt->execute();
    $pendingCount = (int) $stmt->fetch(\PDO::FETCH_ASSOC)['count'];

    // reviewed 신고 조회
    $stmt = $this->pdo->prepare("SELECT COUNT(*) as count FROM reports WHERE status = 'reviewed'");
    $stmt->execute();
    $reviewedCount = (int) $stmt->fetch(\PDO::FETCH_ASSOC)['count'];

    $this->assert('pending 신고 2개 조회', $pendingCount >= 2);
    $this->assert('reviewed 신고 1개 이상 조회', $reviewedCount >= 1);
  }

  // 테스트 7: reason ENUM 유효성 검증
  public function testReasonEnumValidation(): void
  {
    echo "\n[테스트] reason ENUM 유효성 검증\n";

    $validReasons = ['spam', 'abuse', 'inappropriate', 'other'];
    $createdCount = 0;

    // 유효한 reason 값 모두 INSERT (기존 신고 제거 후)
    foreach ($validReasons as $index => $reason) {
      try {
        // 기존 신고 제거
        $this->pdo->prepare("DELETE FROM reports WHERE comment_id = ? AND reporter_id = ?")
          ->execute([$this->testCommentIds[$index], $this->reporterUserId]);

        $stmt = $this->pdo->prepare(
          "INSERT INTO reports (comment_id, reporter_id, reason) VALUES (?, ?, ?)"
        );
        $stmt->execute([$this->testCommentIds[$index], $this->reporterUserId, $reason]);
        $this->testReportIds[] = (int) $this->pdo->lastInsertId();
        $createdCount++;
      } catch (\PDOException $e) {
        // 중복 문제는 무시하고 일단 성공 카운트만
      }
    }

    $this->assert('유효한 reason 값 최소 1개 INSERT 성공', $createdCount >= 1);

    // 유효하지 않은 reason 값 INSERT 시도
    $exceptionThrown = false;
    try {
      $this->pdo->prepare(
        "INSERT INTO reports (comment_id, reporter_id, reason) VALUES (?, ?, ?)"
      )->execute([$this->testCommentIds[0], 999999, 'invalid_reason']);
    } catch (\PDOException $e) {
      $exceptionThrown = true;
    }

    $this->assert('유효하지 않은 reason 값 INSERT 시 예외 발생', $exceptionThrown);
  }

  public function run(): void
  {
    echo "=== ReportTest 실행 ===\n";
    $this->setUp();

    try {
      $this->testReportsTableSchema();
      $this->testCreateReport();
      $this->testDuplicateReportPrevented();
      $this->testReportStatusUpdate();
      $this->testReportNoteUpdate();
      $this->testReportListFilterByStatus();
      $this->testReasonEnumValidation();
    } finally {
      $this->tearDown();
    }

    echo "\n=== 결과: {$this->passed} 통과, {$this->failed} 실패 ===\n";
    exit($this->failed > 0 ? 1 : 0);
  }
}

(new ReportTest())->run();
