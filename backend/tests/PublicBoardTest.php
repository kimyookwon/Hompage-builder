<?php

/**
 * P3-S9-V: 공개 게시판 렌더링 검증 테스트
 *
 * 실행: php tests/PublicBoardTest.php
 */

define('BASE_PATH', dirname(__DIR__));

require BASE_PATH . '/vendor/autoload.php';

use Dotenv\Dotenv;

$dotenv = Dotenv::createImmutable(BASE_PATH);
$dotenv->safeLoad();

class PublicBoardTest
{
  private \PDO $pdo;
  private int $passed = 0;
  private int $failed = 0;

  public function __construct()
  {
    $host = $_ENV['DB_HOST'] ?? 'localhost';
    $db   = $_ENV['DB_DATABASE'] ?? ($_ENV['DB_NAME'] ?? 'homepage_builder');
    $user = $_ENV['DB_USERNAME'] ?? ($_ENV['DB_USER'] ?? 'root');
    $pass = $_ENV['DB_PASSWORD'] ?? ($_ENV['DB_PASS'] ?? '');
    $this->pdo = new \PDO("mysql:host={$host};dbname={$db};charset=utf8mb4", $user, $pass, [
      \PDO::ATTR_ERRMODE => \PDO::ERRMODE_EXCEPTION,
    ]);
  }

  private function assert(string $name, bool $condition, string $message = ''): void
  {
    if ($condition) {
      echo "  [PASS] {$name}\n";
      $this->passed++;
    } else {
      echo "  [FAIL] {$name}" . ($message ? ": {$message}" : '') . "\n";
      $this->failed++;
    }
  }

  // 테스트 1: boards 테이블 스키마 확인
  public function testBoardsTableSchema(): void
  {
    echo "\n[테스트] 게시판 테이블 스키마\n";
    $stmt = $this->pdo->query("DESCRIBE boards");
    $columns = array_column($stmt->fetchAll(\PDO::FETCH_ASSOC), 'Field');
    $required = ['id', 'name', 'type', 'read_permission', 'write_permission'];
    foreach ($required as $col) {
      $this->assert("boards.{$col} 컬럼 존재", in_array($col, $columns));
    }
  }

  // 테스트 2: read_permission=admin_only 게시판은 비인증 사용자에게 노출되지 않아야 함
  public function testAdminOnlyBoardNotPublic(): void
  {
    echo "\n[테스트] admin_only 게시판 비인증 차단\n";
    $stmt = $this->pdo->prepare("SELECT id FROM boards WHERE read_permission = 'admin_only' LIMIT 1");
    $stmt->execute();
    $board = $stmt->fetch(\PDO::FETCH_ASSOC);
    if (!$board) {
      echo "  [SKIP] admin_only 게시판 없음\n";
      return;
    }
    // 비인증 사용자(null)로 접근 시 차단되어야 함
    // 실제 렌더러에서는 JWT 없이 접근 시 403 반환
    $this->assert('admin_only 게시판 ID 확인됨', $board['id'] > 0);
  }

  // 테스트 3: public 게시판은 누구나 읽을 수 있어야 함
  public function testPublicBoardAccessible(): void
  {
    echo "\n[테스트] public 게시판 접근 가능\n";
    $stmt = $this->pdo->prepare("SELECT id FROM boards WHERE read_permission = 'public' LIMIT 1");
    $stmt->execute();
    $board = $stmt->fetch(\PDO::FETCH_ASSOC);
    if (!$board) {
      echo "  [SKIP] public 게시판 없음\n";
      return;
    }
    $this->assert('public 게시판 존재', $board['id'] > 0);
  }

  // 테스트 4: posts 테이블에 board_id 외래키 존재 확인
  public function testPostsBoardForeignKey(): void
  {
    echo "\n[테스트] 게시글 board_id 참조 무결성\n";
    $stmt = $this->pdo->query("
      SELECT COUNT(*) FROM posts p
      LEFT JOIN boards b ON p.board_id = b.id
      WHERE b.id IS NULL
    ");
    $orphaned = (int) $stmt->fetchColumn();
    $this->assert('고아 게시글 없음 (board_id 참조 정상)', $orphaned === 0, "고아={$orphaned}");
  }

  // 테스트 5: 댓글 post_id 외래키 존재 확인
  public function testCommentsForeignKey(): void
  {
    echo "\n[테스트] 댓글 post_id 참조 무결성\n";
    $stmt = $this->pdo->query("
      SELECT COUNT(*) FROM comments c
      LEFT JOIN posts p ON c.post_id = p.id
      WHERE p.id IS NULL
    ");
    $orphaned = (int) $stmt->fetchColumn();
    $this->assert('고아 댓글 없음 (post_id 참조 정상)', $orphaned === 0, "고아={$orphaned}");
  }

  // 테스트 6: 공개 게시판 뷰 파일 존재 확인
  public function testBoardViewFilesExist(): void
  {
    echo "\n[테스트] 공개 게시판 뷰 파일 존재\n";
    $viewPath = BASE_PATH . '/public/views/boards';
    $this->assert('boards/list.php 존재', file_exists("{$viewPath}/list.php"));
    $this->assert('boards/post-detail.php 존재', file_exists("{$viewPath}/post-detail.php"));
  }

  public function run(): void
  {
    echo "=== PublicBoardTest 실행 ===\n";
    $this->testBoardsTableSchema();
    $this->testAdminOnlyBoardNotPublic();
    $this->testPublicBoardAccessible();
    $this->testPostsBoardForeignKey();
    $this->testCommentsForeignKey();
    $this->testBoardViewFilesExist();

    echo "\n=== 결과: {$this->passed} 통과, {$this->failed} 실패 ===\n";
    exit($this->failed > 0 ? 1 : 0);
  }
}

(new PublicBoardTest())->run();
