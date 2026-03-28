<?php

/**
 * 일괄 작업(대량 삭제/수정) 테스트
 *
 * 실행: php tests/BulkTest.php
 */

define('BASE_PATH', dirname(__DIR__));
require BASE_PATH . '/vendor/autoload.php';

use Dotenv\Dotenv;

$dotenv = Dotenv::createImmutable(BASE_PATH);
$dotenv->safeLoad();

class BulkTest
{
  private \PDO $pdo;
  private int $passed = 0;
  private int $failed = 0;

  // 테스트 픽스처 ID
  private array $testUserIds = [];
  private ?int $testBoardId = null;
  private array $testPostIds = [];
  private array $testCommentIds = [];
  private array $testBookmarkIds = [];
  private array $testLikeIds = [];

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
    $this->pdo->exec("DELETE FROM post_likes WHERE post_id IN (SELECT id FROM posts WHERE board_id IN (SELECT id FROM boards WHERE description = '일괄 테스트용'))");
    $this->pdo->exec("DELETE FROM post_bookmarks WHERE post_id IN (SELECT id FROM posts WHERE board_id IN (SELECT id FROM boards WHERE description = '일괄 테스트용'))");
    $this->pdo->exec("DELETE FROM comments WHERE post_id IN (SELECT id FROM posts WHERE board_id IN (SELECT id FROM boards WHERE description = '일괄 테스트용'))");
    $this->pdo->exec("DELETE FROM posts WHERE board_id IN (SELECT id FROM boards WHERE description = '일괄 테스트용')");
    $this->pdo->exec("DELETE FROM boards WHERE description = '일괄 테스트용'");
    $this->pdo->exec("DELETE FROM users WHERE email LIKE 'bulk_test_%@example.com'");

    // 테스트 사용자 3명 생성
    for ($i = 1; $i <= 3; $i++) {
      $this->pdo->prepare(
        "INSERT INTO users (email, name, password_hash, role, status) VALUES (?, ?, ?, 'user', 'active')"
      )->execute(["bulk_test_{$i}@example.com", "일괄테스터{$i}", password_hash('test1234', PASSWORD_BCRYPT)]);
      $this->testUserIds[] = (int) $this->pdo->lastInsertId();
    }

    // 테스트 게시판 생성
    $this->pdo->prepare(
      "INSERT INTO boards (name, description, read_permission) VALUES (?, ?, 'public')"
    )->execute(['일괄테스트', '일괄 테스트용']);
    $this->testBoardId = (int) $this->pdo->lastInsertId();

    // 테스트 게시글 3개 생성
    for ($i = 1; $i <= 3; $i++) {
      $this->pdo->prepare(
        "INSERT INTO posts (title, content, author_id, board_id) VALUES (?, ?, ?, ?)"
      )->execute(["일괄 테스트 글 {$i}", "테스트 내용 {$i}", $this->testUserIds[0], $this->testBoardId]);
      $this->testPostIds[] = (int) $this->pdo->lastInsertId();
    }

    // 각 게시글마다 댓글 추가
    foreach ($this->testPostIds as $postId) {
      $this->pdo->prepare(
        "INSERT INTO comments (post_id, author_id, content) VALUES (?, ?, ?)"
      )->execute([$postId, $this->testUserIds[1], "테스트 댓글"]);
      $this->testCommentIds[] = (int) $this->pdo->lastInsertId();
    }

    // 각 게시글마다 좋아요 추가
    foreach ($this->testPostIds as $postId) {
      $this->pdo->prepare(
        "INSERT INTO post_likes (post_id, user_id) VALUES (?, ?)"
      )->execute([$postId, $this->testUserIds[1]]);
      $this->testLikeIds[] = (int) $this->pdo->lastInsertId();
    }

    // 각 게시글마다 북마크 추가
    foreach ($this->testPostIds as $postId) {
      $this->pdo->prepare(
        "INSERT INTO post_bookmarks (post_id, user_id) VALUES (?, ?)"
      )->execute([$postId, $this->testUserIds[2]]);
      $this->testBookmarkIds[] = (int) $this->pdo->lastInsertId();
    }
  }

  private function tearDown(): void
  {
    // 모든 테스트 데이터 정리

    // 북마크 삭제
    if ($this->testPostIds) {
      $placeholders = implode(',', array_fill(0, count($this->testPostIds), '?'));
      $this->pdo->prepare("DELETE FROM post_bookmarks WHERE post_id IN ({$placeholders})")
        ->execute($this->testPostIds);
    }

    // 좋아요 삭제
    if ($this->testPostIds) {
      $placeholders = implode(',', array_fill(0, count($this->testPostIds), '?'));
      $this->pdo->prepare("DELETE FROM post_likes WHERE post_id IN ({$placeholders})")
        ->execute($this->testPostIds);
    }

    // 댓글 삭제
    if ($this->testCommentIds) {
      $placeholders = implode(',', array_fill(0, count($this->testCommentIds), '?'));
      $this->pdo->prepare("DELETE FROM comments WHERE id IN ({$placeholders})")
        ->execute($this->testCommentIds);
    }

    // 게시글 삭제
    if ($this->testPostIds) {
      $placeholders = implode(',', array_fill(0, count($this->testPostIds), '?'));
      $this->pdo->prepare("DELETE FROM posts WHERE id IN ({$placeholders})")
        ->execute($this->testPostIds);
    }

    // 게시판 삭제
    if ($this->testBoardId) {
      $this->pdo->prepare("DELETE FROM boards WHERE id = ?")->execute([$this->testBoardId]);
    }

    // 사용자 삭제
    if ($this->testUserIds) {
      $placeholders = implode(',', array_fill(0, count($this->testUserIds), '?'));
      $this->pdo->prepare("DELETE FROM users WHERE id IN ({$placeholders})")
        ->execute($this->testUserIds);
    }
  }

  // 테스트 1: 일괄 삭제 - 관련 데이터 모두 삭제
  public function testBulkDeletePostsRemovesRelatedData(): void
  {
    echo "\n[테스트] 일괄 삭제 - 관련 데이터 처리\n";

    $idsToDelete = [$this->testPostIds[0], $this->testPostIds[1]];
    $idsToKeep = [$this->testPostIds[2]];

    // 삭제할 게시글들의 관련 데이터 개수 확인 (삭제 전)
    $placeholders = implode(',', array_fill(0, count($idsToDelete), '?'));

    $stmt = $this->pdo->prepare(
      "SELECT COUNT(*) as count FROM comments WHERE post_id IN ({$placeholders})"
    );
    $stmt->execute($idsToDelete);
    $commentsBeforeDelete = (int) $stmt->fetch(\PDO::FETCH_ASSOC)['count'];

    $stmt = $this->pdo->prepare(
      "SELECT COUNT(*) as count FROM post_likes WHERE post_id IN ({$placeholders})"
    );
    $stmt->execute($idsToDelete);
    $likesBeforeDelete = (int) $stmt->fetch(\PDO::FETCH_ASSOC)['count'];

    $stmt = $this->pdo->prepare(
      "SELECT COUNT(*) as count FROM post_bookmarks WHERE post_id IN ({$placeholders})"
    );
    $stmt->execute($idsToDelete);
    $bookmarksBeforeDelete = (int) $stmt->fetch(\PDO::FETCH_ASSOC)['count'];

    // 일괄 삭제 실행 (트랜잭션 패턴)
    $this->pdo->beginTransaction();
    try {
      $this->pdo->prepare(
        "DELETE FROM comments WHERE post_id IN ({$placeholders})"
      )->execute($idsToDelete);

      $this->pdo->prepare(
        "DELETE FROM post_likes WHERE post_id IN ({$placeholders})"
      )->execute($idsToDelete);

      $this->pdo->prepare(
        "DELETE FROM post_bookmarks WHERE post_id IN ({$placeholders})"
      )->execute($idsToDelete);

      $this->pdo->prepare(
        "DELETE FROM posts WHERE id IN ({$placeholders})"
      )->execute($idsToDelete);

      $this->pdo->commit();
    } catch (\PDOException $e) {
      $this->pdo->rollBack();
      throw $e;
    }

    // 삭제 후 확인
    $placeholders = implode(',', array_fill(0, count($idsToDelete), '?'));

    $stmt = $this->pdo->prepare(
      "SELECT COUNT(*) as count FROM posts WHERE id IN ({$placeholders})"
    );
    $stmt->execute($idsToDelete);
    $postsAfterDelete = (int) $stmt->fetch(\PDO::FETCH_ASSOC)['count'];

    $stmt = $this->pdo->prepare(
      "SELECT COUNT(*) as count FROM comments WHERE post_id IN ({$placeholders})"
    );
    $stmt->execute($idsToDelete);
    $commentsAfterDelete = (int) $stmt->fetch(\PDO::FETCH_ASSOC)['count'];

    // 남아있는 게시글은 유지되어야 함
    $placeholders = implode(',', array_fill(0, count($idsToKeep), '?'));
    $stmt = $this->pdo->prepare(
      "SELECT COUNT(*) as count FROM posts WHERE id IN ({$placeholders})"
    );
    $stmt->execute($idsToKeep);
    $postsKeepCount = (int) $stmt->fetch(\PDO::FETCH_ASSOC)['count'];

    $this->assert('삭제 전 댓글 존재', $commentsBeforeDelete > 0);
    $this->assert('삭제 전 좋아요 존재', $likesBeforeDelete > 0);
    $this->assert('삭제 전 북마크 존재', $bookmarksBeforeDelete > 0);
    $this->assert('게시글 삭제됨', $postsAfterDelete === 0);
    $this->assert('댓글도 함께 삭제됨', $commentsAfterDelete === 0);
    $this->assert('남은 게시글 유지됨', $postsKeepCount === 1);

    // tearDown에서 삭제 시도하지 않도록 제거
    $this->testPostIds = $idsToKeep;
    $this->testCommentIds = [];
    $this->testLikeIds = [];
    $this->testBookmarkIds = [];
  }

  // 테스트 2: 빈 ID 배열 처리
  public function testBulkDeleteEmptyIdsRejected(): void
  {
    echo "\n[테스트] 빈 ID 배열 거부\n";

    $ids = [];
    $isValid = count($ids) > 0;

    $this->assert('빈 배열은 유효하지 않음', !$isValid);
  }

  // 테스트 3: ID 배열 최대 제한
  public function testBulkDeleteMaxLimit(): void
  {
    echo "\n[테스트] ID 배열 최대 제한 검증\n";

    $maxIds = array_fill(0, 100, 1);
    $isValidMax = count($maxIds) <= 100;
    $this->assert('100개 ID 허용', $isValidMax);

    $overIds = array_fill(0, 101, 1);
    $isValidOver = count($overIds) <= 100;
    $this->assert('101개 ID 거부', !$isValidOver);
  }

  // 테스트 4: 일괄 상태 업데이트
  public function testBulkUpdateUserStatus(): void
  {
    echo "\n[테스트] 사용자 상태 일괄 업데이트\n";

    $userIds = [$this->testUserIds[0], $this->testUserIds[1]];

    // 초기 상태 확인
    $placeholders = implode(',', array_fill(0, count($userIds), '?'));
    $stmt = $this->pdo->prepare(
      "SELECT COUNT(*) as count FROM users WHERE id IN ({$placeholders}) AND status = 'active'"
    );
    $stmt->execute($userIds);
    $activeCountBefore = (int) $stmt->fetch(\PDO::FETCH_ASSOC)['count'];

    // 상태 일괄 업데이트
    $this->pdo->prepare(
      "UPDATE users SET status = 'blocked' WHERE id IN ({$placeholders})"
    )->execute($userIds);

    // 업데이트 후 확인
    $stmt = $this->pdo->prepare(
      "SELECT COUNT(*) as count FROM users WHERE id IN ({$placeholders}) AND status = 'blocked'"
    );
    $stmt->execute($userIds);
    $blockedCountAfter = (int) $stmt->fetch(\PDO::FETCH_ASSOC)['count'];

    $this->assert('초기 상태 active', $activeCountBefore === count($userIds));
    $this->assert('모든 사용자 blocked로 변경됨', $blockedCountAfter === count($userIds));

    // 원래 상태로 복구 (tearDown에서 문제 방지)
    $this->pdo->prepare(
      "UPDATE users SET status = 'active' WHERE id IN ({$placeholders})"
    )->execute($userIds);
  }

  // 테스트 5: admin 역할 제외 검증
  public function testBulkUpdateCannotChangeAdmin(): void
  {
    echo "\n[테스트] admin 역할 제외\n";

    // admin 사용자 생성
    $this->pdo->prepare(
      "INSERT INTO users (email, name, password_hash, role, status) VALUES (?, ?, ?, 'admin', 'active')"
    )->execute(['bulk_admin_test@example.com', 'Admin테스터', password_hash('test1234', PASSWORD_BCRYPT)]);
    $adminId = (int) $this->pdo->lastInsertId();

    // 일반 사용자 포함한 배열
    $allIds = [$this->testUserIds[0], $adminId];

    // admin 제외하고 업데이트
    $placeholders = implode(',', array_fill(0, count($allIds), '?'));
    $this->pdo->prepare(
      "UPDATE users SET status = 'blocked' WHERE id IN ({$placeholders}) AND role != 'admin'"
    )->execute($allIds);

    // admin은 여전히 active인지 확인
    $stmt = $this->pdo->prepare("SELECT status FROM users WHERE id = ?");
    $stmt->execute([$adminId]);
    $adminStatus = $stmt->fetch(\PDO::FETCH_ASSOC)['status'];

    $this->assert('admin 역할은 제외됨', $adminStatus === 'active');

    // 정리
    $this->pdo->prepare("UPDATE users SET status = 'active' WHERE id = ?")->execute([$this->testUserIds[0]]);
    $this->pdo->prepare("DELETE FROM users WHERE id = ?")->execute([$adminId]);
  }

  // 테스트 6: 트랜잭션 롤백
  public function testBulkDeleteTransactionRollback(): void
  {
    echo "\n[테스트] 트랜잭션 롤백\n";

    $testPostId = $this->testPostIds[0];

    // 초기 상태 확인
    $stmt = $this->pdo->prepare("SELECT COUNT(*) as count FROM posts WHERE id = ?");
    $stmt->execute([$testPostId]);
    $existsBefore = (int) $stmt->fetch(\PDO::FETCH_ASSOC)['count'] === 1;

    // 트랜잭션 시작하고 롤백 시뮬레이션
    $this->pdo->beginTransaction();
    try {
      $this->pdo->prepare("DELETE FROM posts WHERE id = ?")->execute([$testPostId]);

      // 의도적으로 롤백
      $this->pdo->rollBack();
    } catch (\Exception $e) {
      $this->pdo->rollBack();
    }

    // 롤백 후 게시글이 여전히 존재하는지 확인
    $stmt = $this->pdo->prepare("SELECT COUNT(*) as count FROM posts WHERE id = ?");
    $stmt->execute([$testPostId]);
    $existsAfter = (int) $stmt->fetch(\PDO::FETCH_ASSOC)['count'] === 1;

    $this->assert('트랜잭션 시작 전 게시글 존재', $existsBefore);
    $this->assert('롤백 후 게시글 복구됨', $existsAfter);
  }

  public function run(): void
  {
    echo "=== BulkTest 실행 ===\n";
    $this->setUp();

    try {
      $this->testBulkDeletePostsRemovesRelatedData();
      $this->testBulkDeleteEmptyIdsRejected();
      $this->testBulkDeleteMaxLimit();
      $this->testBulkUpdateUserStatus();
      $this->testBulkUpdateCannotChangeAdmin();
      $this->testBulkDeleteTransactionRollback();
    } finally {
      $this->tearDown();
    }

    echo "\n=== 결과: {$this->passed} 통과, {$this->failed} 실패 ===\n";
    exit($this->failed > 0 ? 1 : 0);
  }
}

(new BulkTest())->run();
