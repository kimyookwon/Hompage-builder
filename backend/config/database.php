<?php

namespace App\Config;

use PDO;
use PDOException;

class Database {
  private static ?PDO $instance = null;

  // 싱글톤 PDO 인스턴스 반환
  public static function getInstance(): PDO {
    if (self::$instance === null) {
      $host = $_ENV['DB_HOST'] ?? 'localhost';
      $port = $_ENV['DB_PORT'] ?? '3306';
      $dbname = $_ENV['DB_DATABASE'] ?? 'homepage_builder';
      $username = $_ENV['DB_USERNAME'] ?? 'root';
      $password = $_ENV['DB_PASSWORD'] ?? '';

      try {
        self::$instance = new PDO(
          "mysql:host={$host};port={$port};dbname={$dbname};charset=utf8mb4",
          $username,
          $password,
          [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            PDO::ATTR_EMULATE_PREPARES => false,
          ]
        );
      } catch (PDOException $e) {
        throw new \RuntimeException('데이터베이스 연결에 실패했습니다: ' . $e->getMessage());
      }
    }

    return self::$instance;
  }

  // 테스트용 인스턴스 초기화
  public static function reset(): void {
    self::$instance = null;
  }
}
