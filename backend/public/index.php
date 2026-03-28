<?php

// 자동 로더 로드
require_once __DIR__ . '/../vendor/autoload.php';

use App\Router;
use Dotenv\Dotenv;

// 환경 변수 로드
$dotenv = Dotenv::createImmutable(__DIR__ . '/..');
$dotenv->load();

// 에러 핸들러 설정
set_error_handler(function (int $errno, string $errstr, string $errfile, int $errline): bool {
  if (!(error_reporting() & $errno)) {
    return false;
  }
  throw new \ErrorException($errstr, 0, $errno, $errfile, $errline);
});

// 글로벌 예외 핸들러
set_exception_handler(function (\Throwable $e): void {
  http_response_code(500);
  header('Content-Type: application/json');
  $debug = ($_ENV['APP_DEBUG'] ?? 'false') === 'true';
  echo json_encode([
    'success' => false,
    'error' => $debug ? $e->getMessage() : '서버 내부 오류가 발생했습니다.',
    'code' => 500,
  ]);
});

// CORS 처리
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, PATCH, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
  http_response_code(204);
  exit;
}

// 라우터 초기화 및 실행
$router = new Router();
require_once __DIR__ . '/../routes/api-routes.php';
$router->dispatch();
