<?php

namespace App\Utils;

class ResponseHelper {
  // snake_case 키를 camelCase로 재귀 변환
  // $skipKeys: 해당 키의 값은 변환하지 않고 그대로 유지 (e.g. content JSON)
  private const OPAQUE_KEYS = ['content'];

  public static function toCamel(mixed $data, bool $isOpaque = false): mixed {
    if (is_array($data)) {
      // 순차 배열이면 각 요소만 변환 (오파크 여부 전달)
      if (array_is_list($data)) {
        return array_map(fn($item) => self::toCamel($item, $isOpaque), $data);
      }
      // 오파크 컨텍스트(content 내부)이면 키 변환 없이 값만 유지
      if ($isOpaque) {
        return $data;
      }
      // 연관 배열이면 키도 변환
      $result = [];
      foreach ($data as $key => $value) {
        $camelKey = lcfirst(str_replace('_', '', ucwords((string) $key, '_')));
        $childOpaque = in_array($key, self::OPAQUE_KEYS, true);
        $result[$camelKey] = self::toCamel($value, $childOpaque);
      }
      return $result;
    }
    return $data;
  }

  // 성공 응답 반환
  public static function success(mixed $data = null, int $statusCode = 200): void {
    http_response_code($statusCode);
    echo json_encode([
      'success' => true,
      'data' => self::toCamel($data),
    ], JSON_UNESCAPED_UNICODE);
    exit;
  }

  // 실패 응답 반환
  public static function error(string $message, int $statusCode = 400): void {
    http_response_code($statusCode);
    echo json_encode([
      'success' => false,
      'error' => $message,
      'code' => $statusCode,
    ], JSON_UNESCAPED_UNICODE);
    exit;
  }

  // 페이지네이션 응답 반환
  public static function paginated(array $items, int $total, int $page, int $limit): void {
    http_response_code(200);
    echo json_encode([
      'success' => true,
      'data' => [
        'items' => self::toCamel($items),
        'pagination' => [
          'total' => $total,
          'page' => $page,
          'limit' => $limit,
          'totalPages' => (int) ceil($total / $limit),
        ],
      ],
    ], JSON_UNESCAPED_UNICODE);
    exit;
  }
}
