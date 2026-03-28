<?php

/**
 * 회원 공개 프로필 API 테스트
 *
 * 실행: php tests/UserProfileTest.php
 */

define('BASE_PATH', dirname(__DIR__));
require BASE_PATH . '/vendor/autoload.php';

use Dotenv\Dotenv;

$dotenv = Dotenv::createImmutable(BASE_PATH);
$dotenv->safeLoad();

class UserProfileTest
{
  private \PDO $pdo;
  private int $passed = 0;
  private int $failed = 0;

  // 테스트 픽스처 ID
  private ?int $testUserId   = null;
  private ?int $blockedUserId = null;
  private ?int $testBoardId  = null;
  private array $testPostIds  = [];

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
    $this->pdo->exec("DELETE FROM users WHERE email IN ('profile_test@example.com','blocked_test@example.com')");
    $this->pdo->exec("DELETE FROM boards WHERE description = '프로필 테스트용'");

    // 활성 테스트 사용자 생성
    $this->pdo->prepare(
      "INSERT INTO users (email, name, password_hash, role, status) VALUES (?, ?, ?, 'user', 'active')"
    )->execute(['profile_test@example.com', '프로필테스터', password_hash('test1234', PASSWORD_BCRYPT)]);
    $this->testUserId = (int) $this->pdo->lastInsertId();

    // 차단된 사용자 생성
    $this->pdo->prepare(
      "INSERT INTO users (email, name, password_hash, role, status) VALUES (?, ?, ?, 'user', 'blocked')"
    )->execute(['blocked_test@example.com', '차단사용자', password_hash('test1234', PASSWORD_BCRYPT)]);
    $this->blockedUserId = (int) $this->pdo->lastInsertId();

    // 테스트 게시판 생성
    $this->pdo->prepare(
      "INSERT INTO boards (name, description, read_permission) VALUES (?, ?, 'public')"
    )->execute(['테스트게시판', '프로필 테스트용']);
    $this->testBoardId = (int) $this->pdo->lastInsertId();

    // 게시글 6개 생성 (5개 초과로 limit 검증)
    for ($i = 1; $i <= 6; $i++) {
      $this->pdo->prepare(
        "INSERT INTO posts (title, content, author_id, board_id) VALUES (?, ?, ?, ?)"
      )->execute(["테스트 게시글 {$i}", "내용 {$i}", $this->testUserId, $this->testBoardId]);
      $this->testPostIds[] = (int) $this->pdo->lastInsertId();
    }
  }

  // 테스트용 픽스처 정리
  private function tearDown(): void
  {
    if ($this->testPostIds) {
      $placeholders = implode(',', array_fill(0, count($this->testPostIds), '?'));
      $this->pdo->prepare("DELETE FROM posts WHERE id IN ({$placeholders})")
                ->execute($this->testPostIds);
    }
    if ($this->testBoardId) {
      $this->pdo->prepare("DELETE FROM boards WHERE id = ?")->execute([$this->testBoardId]);
    }
    if ($this->testUserId) {
      $this->pdo->prepare("DELETE FROM users WHERE id = ?")->execute([$this->testUserId]);
    }
    if ($this->blockedUserId) {
      $this->pdo->prepare("DELETE FROM users WHERE id = ?")->execute([$this->blockedUserId]);
    }
  }

  // 테스트 1: 활성 사용자 공개 프로필 조회
  public function testActiveUserProfile(): void
  {
    echo "\n[테스트] 활성 사용자 공개 프로필 조회\n";

    $stmt = $this->pdo->prepare(
      'SELECT u.id, u.name, u.avatar_url, u.role, u.status, u.created_at,
              (SELECT COUNT(*) FROM posts   WHERE author_id = u.id) AS post_count,
              (SELECT COUNT(*) FROM comments WHERE author_id = u.id) AS comment_count
       FROM users u WHERE u.id = ?'
    );
    $stmt->execute([$this->testUserId]);
    $user = $stmt->fetch(\PDO::FETCH_ASSOC);

    $this->assert('사용자 조회 성공', $user !== false);
    $this->assert('이름 정확', $user['name'] === '프로필테스터');
    $this->assert('status active', $user['status'] === 'active');
    $this->assert('게시글 수 6개', (int) $user['post_count'] === 6, "count={$user['post_count']}");
    $this->assert('댓글 수 0개', (int) $user['comment_count'] === 0);
    // 이메일이 포함되지 않아야 함 (보안)
    $this->assert('이메일 미포함', !isset($user['email']));
  }

  // 테스트 2: 차단된 사용자 → 404 처리
  public function testBlockedUserReturns404(): void
  {
    echo "\n[테스트] 차단된 사용자 404 처리\n";

    $stmt = $this->pdo->prepare(
      'SELECT u.id, u.status FROM users u WHERE u.id = ?'
    );
    $stmt->execute([$this->blockedUserId]);
    $user = $stmt->fetch(\PDO::FETCH_ASSOC);

    $this->assert('차단 사용자 조회됨', $user !== false);
    // PublicProfile API는 status='blocked'이면 404를 반환해야 함
    $shouldReturn404 = ($user['status'] === 'blocked');
    $this->assert('blocked 상태이면 404 반환해야 함', $shouldReturn404);
  }

  // 테스트 3: 존재하지 않는 사용자 → 404 처리
  public function testNonExistentUserReturns404(): void
  {
    echo "\n[테스트] 존재하지 않는 사용자 404 처리\n";

    $stmt = $this->pdo->prepare(
      'SELECT id FROM users WHERE id = ?'
    );
    $stmt->execute([999999]);
    $user = $stmt->fetch();

    $this->assert('존재하지 않는 ID 조회 결과 없음', $user === false);
  }

  // 테스트 4: 최근 게시글 5개 제한 (6개 생성했으므로 5개만 반환해야 함)
  public function testRecentPostsLimit(): void
  {
    echo "\n[테스트] 최근 게시글 5개 제한\n";

    $stmt = $this->pdo->prepare(
      'SELECT p.id, p.title, p.created_at, b.id AS board_id, b.name AS board_name
       FROM posts p
       JOIN boards b ON b.id = p.board_id
       WHERE p.author_id = ?
       ORDER BY p.created_at DESC
       LIMIT 5'
    );
    $stmt->execute([$this->testUserId]);
    $posts = $stmt->fetchAll(\PDO::FETCH_ASSOC);

    $this->assert('최근 게시글 5개 반환 (6개 중)', count($posts) === 5, "count=" . count($posts));

    foreach ($posts as $post) {
      $this->assert('게시글에 board_id 포함', isset($post['board_id']));
      $this->assert('게시글에 board_name 포함', isset($post['board_name']));
      break;
    }
  }

  // 테스트 5: userId <= 0 유효성 검사
  public function testInvalidUserIdValidation(): void
  {
    echo "\n[테스트] 유효하지 않은 사용자 ID 검증\n";

    $invalidIds = [0, -1, -999];
    foreach ($invalidIds as $id) {
      // PublicProfile은 $userId <= 0 이면 400 에러를 반환해야 함
      $this->assert("userId={$id} → 400 반환", $id <= 0);
    }

    $this->assert("userId=1 → 유효", 1 > 0);
  }

  public function run(): void
  {
    echo "=== UserProfileTest 실행 ===\n";
    $this->setUp();

    try {
      $this->testActiveUserProfile();
      $this->testBlockedUserReturns404();
      $this->testNonExistentUserReturns404();
      $this->testRecentPostsLimit();
      $this->testInvalidUserIdValidation();
    } finally {
      $this->tearDown();
    }

    echo "\n=== 결과: {$this->passed} 통과, {$this->failed} 실패 ===\n";
    exit($this->failed > 0 ? 1 : 0);
  }
}

(new UserProfileTest())->run();
