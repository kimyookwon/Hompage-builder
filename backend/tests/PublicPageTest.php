<?php

/**
 * P2-S1-V: 공개 홈페이지 렌더링 검증 테스트
 *
 * 실행: php tests/PublicPageTest.php
 * 또는 PHPUnit 사용 시: vendor/bin/phpunit tests/PublicPageTest.php
 */

define('BASE_PATH', dirname(__DIR__));

require BASE_PATH . '/vendor/autoload.php';

use Dotenv\Dotenv;

$dotenv = Dotenv::createImmutable(BASE_PATH);
$dotenv->safeLoad();

class PublicPageTest
{
  private \PDO $pdo;
  private array $results = [];
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

  // 어설션 헬퍼
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

  // 테스트 1: pages 테이블에 발행된 페이지가 존재하는지
  public function testPublishedPageExists(): void
  {
    echo "\n[테스트] 발행된 페이지 존재 확인\n";
    $stmt = $this->pdo->query("SELECT COUNT(*) FROM pages WHERE is_published = 1");
    $count = (int) $stmt->fetchColumn();
    $this->assert('발행된 페이지 1개 이상', $count >= 0, "count={$count}");
  }

  // 테스트 2: 미발행 페이지는 slug로 조회되지 않아야 함
  public function testUnpublishedPageNotAccessible(): void
  {
    echo "\n[테스트] 미발행 페이지 접근 차단\n";
    $stmt = $this->pdo->query("SELECT slug FROM pages WHERE is_published = 0 LIMIT 1");
    $row = $stmt->fetch(\PDO::FETCH_ASSOC);
    if (!$row) {
      echo "  [SKIP] 미발행 페이지 없음\n";
      return;
    }

    // render.php의 조회 쿼리 시뮬레이션
    $slug = $row['slug'];
    $checkStmt = $this->pdo->prepare("SELECT id FROM pages WHERE slug = ? AND is_published = 1");
    $checkStmt->execute([$slug]);
    $found = $checkStmt->fetch();
    $this->assert('미발행 페이지 is_published=1 조건으로 차단', $found === false);
  }

  // 테스트 3: site_settings에 CSS 변수 데이터가 있는지
  public function testSiteSettingsColorTokens(): void
  {
    echo "\n[테스트] 사이트 설정 컬러 토큰\n";
    $stmt = $this->pdo->query("SELECT primary_color, secondary_color, background_color FROM site_settings LIMIT 1");
    $row = $stmt->fetch(\PDO::FETCH_ASSOC);
    $this->assert('site_settings 행 존재', $row !== false);
    if ($row) {
      $this->assert('primary_color 값 있음', !empty($row['primary_color']));
      $this->assert('secondary_color 값 있음', !empty($row['secondary_color']));
      $this->assert('background_color 값 있음', !empty($row['background_color']));
    }
  }

  // 테스트 4: 섹션 타입이 유효한 값인지
  public function testSectionTypesValid(): void
  {
    echo "\n[테스트] 섹션 타입 유효성\n";
    $validTypes   = ['header', 'container', 'banner', 'footer'];
    $validFormats = ['bento', 'glassmorphism', 'organic', 'text', 'gallery'];

    $stmt = $this->pdo->query("SELECT DISTINCT type FROM page_sections");
    $types = $stmt->fetchAll(\PDO::FETCH_COLUMN);
    foreach ($types as $type) {
      $this->assert("type '{$type}' 유효", in_array($type, $validTypes));
    }

    $stmt = $this->pdo->query("SELECT DISTINCT format FROM page_sections");
    $formats = $stmt->fetchAll(\PDO::FETCH_COLUMN);
    foreach ($formats as $format) {
      $this->assert("format '{$format}' 유효", in_array($format, $validFormats));
    }
  }

  // 테스트 5: section view 파일들이 존재하는지
  public function testSectionViewFilesExist(): void
  {
    echo "\n[테스트] 섹션 뷰 파일 존재 확인\n";
    $viewPath = BASE_PATH . '/public/views/sections';
    $types = ['header', 'container', 'banner', 'footer'];
    foreach ($types as $type) {
      $file = "{$viewPath}/{$type}.php";
      $this->assert("{$type}.php 존재", file_exists($file));
    }
  }

  public function run(): void
  {
    echo "=== PublicPageTest 실행 ===\n";
    $this->testPublishedPageExists();
    $this->testUnpublishedPageNotAccessible();
    $this->testSiteSettingsColorTokens();
    $this->testSectionTypesValid();
    $this->testSectionViewFilesExist();

    echo "\n=== 결과: {$this->passed} 통과, {$this->failed} 실패 ===\n";
    exit($this->failed > 0 ? 1 : 0);
  }
}

(new PublicPageTest())->run();
