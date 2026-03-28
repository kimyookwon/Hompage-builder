<?php

/**
 * 북마크 기능 테스트
 *
 * 실행: php tests/BookmarkTest.php
 */

define('BASE_PATH', dirname(__DIR__));
require BASE_PATH . '/vendor/autoload.php';

use Dotenv\Dotenv;

$dotenv = Dotenv::createImmutable(BASE_PATH);
$dotenv->safeLoad();

class BookmarkTest
{
  private \PDO $pdo;
  private int $passed = 0;
  private int $failed = 0;

  // 테스트 픽스처 ID
  private ?int $testUserId = null;
  private ?int $anotherUserId = null;
  private ?int $testBoardId = null;
  private array $testPostIds = [];

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
    // 이전 실행에서 남은 데이터 정리 (모든 경우 정리)
    $this->pdo->exec("DELETE FROM post_bookmarks WHERE post_id IN (SELECT id FROM posts WHERE board_id IN (SELECT id FROM boards WHERE description = '북마크 테스트용'))");
    $this->pdo->exec("DELETE FROM posts WHERE board_id IN (SELECT id FROM boards WHERE description = '북마크 테스트용')");
    $this->pdo->exec("DELETE FROM boards WHERE description = '북마크 테스트용'");
    $this->pdo->exec("DELETE FROM users WHERE email IN ('bookmark_test@example.com', 'another_bookmark@example.com')");

    // 테스트 사용자 생성
    $this->pdo->prepare(
      "INSERT INTO users (email, name, password_hash, role, status) VALUES (?, ?, ?, 'user', 'active')"
    )->execute(['bookmark_test@example.com', '북마크테스터', password_hash('test1234', PASSWORD_BCRYPT)]);
    $this->testUserId = (int) $this->pdo->lastInsertId();

    // 다른 사용자 생성
    $this->pdo->prepare(
      "INSERT INTO users (email, name, password_hash, role, status) VALUES (?, ?, ?, 'user', 'active')"
    )->execute(['another_bookmark@example.com', '다른사용자', password_hash('test1234', PASSWORD_BCRYPT)]);
    $this->anotherUserId = (int) $this->pdo->lastInsertId();

    // 테스트 게시판 생성
    $this->pdo->prepare(
      "INSERT INTO boards (name, description, read_permission) VALUES (?, ?, 'public')"
    )->execute(['북마크테스트', '북마크 테스트용']);
    $this->testBoardId = (int) $this->pdo->lastInsertId();

    // 테스트 게시글 3개 생성
    for ($i = 1; $i <= 3; $i++) {
      $this->pdo->prepare(
        "INSERT INTO posts (title, content, author_id, board_id) VALUES (?, ?, ?, ?)"
      )->execute(["북마크 테스트 글 {$i}", "테스트 내용 {$i}", $this->testUserId, $this->testBoardId]);
      $this->testPostIds[] = (int) $this->pdo->lastInsertId();
    }
  }

  private function tearDown(): void
  {
    if ($this->testPostIds) {
      $placeholders = implode(',', array_fill(0, count($this->testPostIds), '?'));
      $this->pdo->prepare("DELETE FROM post_bookmarks WHERE post_id IN ({$placeholders})")
        ->execute($this->testPostIds);
      $this->pdo->prepare("DELETE FROM posts WHERE id IN ({$placeholders})")
        ->execute($this->testPostIds);
    }
    if ($this->testBoardId) {
      $this->pdo->prepare("DELETE FROM boards WHERE id = ?")->execute([$this->testBoardId]);
    }
    if ($this->testUserId) {
      $this->pdo->prepare("DELETE FROM users WHERE id = ?")->execute([$this->testUserId]);
    }
    if ($this->anotherUserId) {
      $this->pdo->prepare("DELETE FROM users WHERE id = ?")->execute([$this->anotherUserId]);
    }
  }

  // 테스트 1: post_bookmarks 테이블 스키마 검증
  public function testBookmarksTableSchema(): void
  {
    echo "\n[테스트] post_bookmarks 테이블 스키마 검증\n";

    $stmt = $this->pdo->query("DESCRIBE post_bookmarks");
    $columns = $stmt->fetchAll(\PDO::FETCH_ASSOC);
    $columnNames = array_map(fn($col) => $col['Field'], $columns);

    $this->assert('id 컬럼 존재', in_array('id', $columnNames));
    $this->assert('post_id 컬럼 존재', in_array('post_id', $columnNames));
    $this->assert('user_id 컬럼 존재', in_array('user_id', $columnNames));
    $this->assert('created_at 컬럼 존재', in_array('created_at', $columnNames));

    // UNIQUE 제약 확인
    $stmt = $this->pdo->query("SHOW INDEXES FROM post_bookmarks");
    $indexes = $stmt->fetchAll(\PDO::FETCH_ASSOC);
    $hasUniqueKey = array_filter($indexes, fn($idx) => $idx['Key_name'] === 'uq_bookmark' && $idx['Non_unique'] == 0);
    $this->assert('UNIQUE KEY (post_id, user_id) 존재', count($hasUniqueKey) > 0);
  }

  // 테스트 2: 북마크 추가 (INSERT)
  public function testBookmarkToggleInsert(): void
  {
    echo "\n[테스트] 북마크 추가\n";

    $postId = $this->testPostIds[0];

    // 북마크 추가
    $this->pdo->prepare(
      "INSERT INTO post_bookmarks (post_id, user_id) VALUES (?, ?)"
    )->execute([$postId, $this->testUserId]);

    // 확인
    $stmt = $this->pdo->prepare(
      "SELECT COUNT(*) as count FROM post_bookmarks WHERE post_id = ? AND user_id = ?"
    );
    $stmt->execute([$postId, $this->testUserId]);
    $result = $stmt->fetch(\PDO::FETCH_ASSOC);

    $this->assert('북마크 저장됨', (int) $result['count'] === 1);
  }

  // 테스트 3: 북마크 삭제 (DELETE)
  public function testBookmarkToggleDelete(): void
  {
    echo "\n[테스트] 북마크 삭제\n";

    $postId = $this->testPostIds[1];

    // 먼저 북마크 추가
    $this->pdo->prepare(
      "INSERT INTO post_bookmarks (post_id, user_id) VALUES (?, ?)"
    )->execute([$postId, $this->testUserId]);

    // 북마크 삭제
    $stmt = $this->pdo->prepare(
      "DELETE FROM post_bookmarks WHERE post_id = ? AND user_id = ?"
    );
    $stmt->execute([$postId, $this->testUserId]);

    // 확인
    $stmt = $this->pdo->prepare(
      "SELECT COUNT(*) as count FROM post_bookmarks WHERE post_id = ? AND user_id = ?"
    );
    $stmt->execute([$postId, $this->testUserId]);
    $result = $stmt->fetch(\PDO::FETCH_ASSOC);

    $this->assert('북마크 삭제됨', (int) $result['count'] === 0);
  }

  // 테스트 4: 중복 북마크 방지 (UNIQUE 제약)
  public function testDuplicateBookmarkPrevented(): void
  {
    echo "\n[테스트] 중복 북마크 방지\n";

    $postId = $this->testPostIds[0];

    // 먼저 기존 북마크 제거 (다른 테스트에서 남을 수 있음)
    $this->pdo->prepare(
      "DELETE FROM post_bookmarks WHERE post_id = ? AND user_id = ?"
    )->execute([$postId, $this->testUserId]);

    // 첫 번째 삽입
    $this->pdo->prepare(
      "INSERT INTO post_bookmarks (post_id, user_id) VALUES (?, ?)"
    )->execute([$postId, $this->testUserId]);

    // 두 번째 삽입 시도 (예외 발생 예상)
    $exceptionThrown = false;
    try {
      $this->pdo->prepare(
        "INSERT INTO post_bookmarks (post_id, user_id) VALUES (?, ?)"
      )->execute([$postId, $this->testUserId]);
    } catch (\PDOException $e) {
      $exceptionThrown = true;
    }

    $this->assert('중복 삽입 시 예외 발생', $exceptionThrown);
  }

  // 테스트 5: 사용자가 북마크한 게시글 목록 조회
  public function testBookmarkListByUser(): void
  {
    echo "\n[테스트] 사용자 북마크 목록 조회\n";

    $postId1 = $this->testPostIds[0];
    $postId2 = $this->testPostIds[1];

    // 기존 북마크 제거
    $this->pdo->prepare("DELETE FROM post_bookmarks WHERE post_id = ? AND user_id = ?")
      ->execute([$postId1, $this->testUserId]);
    $this->pdo->prepare("DELETE FROM post_bookmarks WHERE post_id = ? AND user_id = ?")
      ->execute([$postId2, $this->testUserId]);

    // 2개의 게시글 북마크
    $this->pdo->prepare("INSERT INTO post_bookmarks (post_id, user_id) VALUES (?, ?)")
      ->execute([$postId1, $this->testUserId]);
    $this->pdo->prepare("INSERT INTO post_bookmarks (post_id, user_id) VALUES (?, ?)")
      ->execute([$postId2, $this->testUserId]);

    // 북마크 목록 조회
    $stmt = $this->pdo->prepare(
      "SELECT p.id, p.title, b.id as board_id, b.name as board_name
       FROM post_bookmarks pb
       JOIN posts p ON p.id = pb.post_id
       JOIN boards b ON b.id = p.board_id
       WHERE pb.user_id = ?
       ORDER BY pb.created_at DESC"
    );
    $stmt->execute([$this->testUserId]);
    $bookmarks = $stmt->fetchAll(\PDO::FETCH_ASSOC);

    $this->assert('북마크 2개 조회됨', count($bookmarks) === 2);
    if (count($bookmarks) > 0) {
      $this->assert('게시글 ID 포함', isset($bookmarks[0]['id']));
      $this->assert('게시글 제목 포함', isset($bookmarks[0]['title']));
      $this->assert('게시판 ID 포함', isset($bookmarks[0]['board_id']));
      $this->assert('게시판 이름 포함', isset($bookmarks[0]['board_name']));
    }
  }

  // 테스트 6: 게시글 삭제 시 북마크도 애플리케이션 로직으로 삭제
  public function testBookmarkDeletedWhenPostDeleted(): void
  {
    echo "\n[테스트] 게시글 삭제 시 북마크 삭제 (애플리케이션 로직)\n";

    $postId = $this->testPostIds[2];

    // 기존 북마크 제거
    $this->pdo->prepare("DELETE FROM post_bookmarks WHERE post_id = ? AND user_id = ?")
      ->execute([$postId, $this->testUserId]);

    // 북마크 추가
    $this->pdo->prepare("INSERT INTO post_bookmarks (post_id, user_id) VALUES (?, ?)")
      ->execute([$postId, $this->testUserId]);

    // 게시글 삭제 전 북마크 확인
    $stmt = $this->pdo->prepare("SELECT COUNT(*) as count FROM post_bookmarks WHERE post_id = ?");
    $stmt->execute([$postId]);
    $beforeDelete = (int) $stmt->fetch(\PDO::FETCH_ASSOC)['count'];

    // BulkController 또는 PostController의 삭제 로직 시뮬레이션:
    // 1. 관련 북마크 삭제
    $this->pdo->prepare("DELETE FROM post_bookmarks WHERE post_id = ?")->execute([$postId]);
    // 2. 게시글 삭제
    $this->pdo->prepare("DELETE FROM posts WHERE id = ?")->execute([$postId]);

    // 게시글 삭제 후 북마크 확인
    $stmt = $this->pdo->prepare("SELECT COUNT(*) as count FROM post_bookmarks WHERE post_id = ?");
    $stmt->execute([$postId]);
    $afterDelete = (int) $stmt->fetch(\PDO::FETCH_ASSOC)['count'];

    $this->assert('게시글 삭제 전 북마크 1개', $beforeDelete === 1);
    $this->assert('게시글 삭제 후 북마크 0개 (애플리케이션 로직)', $afterDelete === 0);

    // testPostIds에서 제거 (tearDown에서 재삭제 시도 방지)
    $this->testPostIds = array_filter($this->testPostIds, fn($id) => $id !== $postId);
  }

  // 테스트 7: 여러 사용자의 북마크 독립성
  public function testBookmarkIsolationByUser(): void
  {
    echo "\n[테스트] 사용자별 북마크 독립성\n";

    $postId = $this->testPostIds[0];

    // 기존 북마크 제거
    $this->pdo->prepare("DELETE FROM post_bookmarks WHERE post_id = ? AND user_id = ?")
      ->execute([$postId, $this->testUserId]);
    $this->pdo->prepare("DELETE FROM post_bookmarks WHERE post_id = ? AND user_id = ?")
      ->execute([$postId, $this->anotherUserId]);

    // 첫 번째 사용자 북마크
    $this->pdo->prepare("INSERT INTO post_bookmarks (post_id, user_id) VALUES (?, ?)")
      ->execute([$postId, $this->testUserId]);

    // 두 번째 사용자도 동일 게시글 북마크 (중복이 아님 - user_id가 다르므로)
    $this->pdo->prepare("INSERT INTO post_bookmarks (post_id, user_id) VALUES (?, ?)")
      ->execute([$postId, $this->anotherUserId]);

    // 전체 북마크 개수 확인
    $stmt = $this->pdo->prepare("SELECT COUNT(*) as count FROM post_bookmarks WHERE post_id = ?");
    $stmt->execute([$postId]);
    $totalCount = (int) $stmt->fetch(\PDO::FETCH_ASSOC)['count'];

    $this->assert('동일 게시글에 2개 사용자 북마크', $totalCount === 2);
  }

  public function run(): void
  {
    echo "=== BookmarkTest 실행 ===\n";
    $this->setUp();

    try {
      $this->testBookmarksTableSchema();
      $this->testBookmarkToggleInsert();
      $this->testBookmarkToggleDelete();
      $this->testDuplicateBookmarkPrevented();
      $this->testBookmarkListByUser();
      $this->testBookmarkDeletedWhenPostDeleted();
      $this->testBookmarkIsolationByUser();
    } finally {
      $this->tearDown();
    }

    echo "\n=== 결과: {$this->passed} 통과, {$this->failed} 실패 ===\n";
    exit($this->failed > 0 ? 1 : 0);
  }
}

(new BookmarkTest())->run();
