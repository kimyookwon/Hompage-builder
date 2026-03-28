<?php

require_once __DIR__ . '/../vendor/autoload.php';

use Dotenv\Dotenv;

// 환경 변수 로드
$dotenv = Dotenv::createImmutable(__DIR__ . '/..');
$dotenv->load();

$host = $_ENV['DB_HOST'] ?? 'localhost';
$port = $_ENV['DB_PORT'] ?? '3306';
$dbname = $_ENV['DB_DATABASE'] ?? 'homepage_builder';
$username = $_ENV['DB_USERNAME'] ?? 'root';
$password = $_ENV['DB_PASSWORD'] ?? '';

try {
  $pdo = new PDO(
    "mysql:host={$host};port={$port};dbname={$dbname};charset=utf8mb4",
    $username,
    $password,
    [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]
  );

  $migrationsDir = __DIR__ . '/migrations';
  $files = glob($migrationsDir . '/*.sql');
  sort($files);

  foreach ($files as $file) {
    $filename = basename($file);
    echo "실행 중: {$filename}\n";

    $sql = file_get_contents($file);
    // 세미콜론 기준으로 분리하여 개별 실행
    $statements = array_filter(
      array_map('trim', explode(';', $sql)),
      fn($s) => !empty($s) && !str_starts_with(ltrim($s), '--')
    );

    foreach ($statements as $statement) {
      $pdo->exec($statement);
    }

    echo "완료: {$filename}\n";
  }

  echo "\n마이그레이션 성공!\n";
} catch (PDOException $e) {
  echo "마이그레이션 실패: " . $e->getMessage() . "\n";
  exit(1);
}
