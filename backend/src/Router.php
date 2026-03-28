<?php

namespace App;

class Router {
  private array $routes = [];

  // GET 라우트 등록
  public function get(string $path, callable|array $handler): void {
    $this->addRoute('GET', $path, $handler);
  }

  // POST 라우트 등록
  public function post(string $path, callable|array $handler): void {
    $this->addRoute('POST', $path, $handler);
  }

  // PATCH 라우트 등록
  public function patch(string $path, callable|array $handler): void {
    $this->addRoute('PATCH', $path, $handler);
  }

  // DELETE 라우트 등록
  public function delete(string $path, callable|array $handler): void {
    $this->addRoute('DELETE', $path, $handler);
  }

  // PUT 라우트 등록
  public function put(string $path, callable|array $handler): void {
    $this->addRoute('PUT', $path, $handler);
  }

  private function addRoute(string $method, string $path, callable|array $handler): void {
    $this->routes[] = [
      'method' => $method,
      'path' => $path,
      'handler' => $handler,
    ];
  }

  // 요청 URI와 매칭되는 라우트를 찾아 핸들러 실행
  public function dispatch(): void {
    $method = $_SERVER['REQUEST_METHOD'];
    $uri = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);

    foreach ($this->routes as $route) {
      if ($route['method'] !== $method) {
        continue;
      }

      $pattern = $this->buildPattern($route['path']);
      if (preg_match($pattern, $uri, $matches)) {
        // URL 파라미터 추출 (숫자 인덱스 제거)
        $params = array_filter($matches, fn($key) => !is_int($key), ARRAY_FILTER_USE_KEY);
        $this->callHandler($route['handler'], array_values($params));
        return;
      }
    }

    // 매칭되는 라우트 없음
    http_response_code(404);
    echo json_encode([
      'success' => false,
      'error' => '요청한 엔드포인트를 찾을 수 없습니다.',
      'code' => 404,
    ]);
  }

  // 라우트 경로를 정규식 패턴으로 변환 ({id} → (?P<id>[^/]+))
  private function buildPattern(string $path): string {
    $pattern = preg_replace('/\{(\w+)\}/', '(?P<$1>[^/]+)', $path);
    return '#^' . $pattern . '$#';
  }

  private function callHandler(callable|array $handler, array $params): void {
    if (is_callable($handler)) {
      call_user_func_array($handler, $params);
    } elseif (is_array($handler) && count($handler) === 2) {
      [$class, $method] = $handler;
      $instance = new $class();
      call_user_func_array([$instance, $method], $params);
    }
  }
}
