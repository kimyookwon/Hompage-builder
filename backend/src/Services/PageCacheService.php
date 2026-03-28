<?php

namespace App\Services;

class PageCacheService {
  private const CACHE_DIR = __DIR__ . '/../../../cache/pages';
  private const TTL       = 600; // 초 (10분)

  // 캐시된 HTML 반환 — 만료됐거나 없으면 null
  public static function get(string $slug): ?string {
    $path = self::path($slug);
    if (!file_exists($path)) {
      return null;
    }
    if (time() - filemtime($path) > self::TTL) {
      @unlink($path);
      return null;
    }
    return file_get_contents($path) ?: null;
  }

  // HTML을 캐시 파일에 저장
  public static function set(string $slug, string $html): void {
    $dir = self::CACHE_DIR;
    if (!is_dir($dir)) {
      mkdir($dir, 0755, true);
    }
    file_put_contents(self::path($slug), $html, LOCK_EX);
  }

  // 특정 슬러그 캐시 삭제
  public static function delete(string $slug): void {
    $path = self::path($slug);
    if (file_exists($path)) {
      @unlink($path);
    }
  }

  // 전체 페이지 캐시 삭제
  public static function flush(): int {
    $dir = self::CACHE_DIR;
    if (!is_dir($dir)) {
      return 0;
    }
    $count = 0;
    foreach (glob("{$dir}/*.html") ?: [] as $file) {
      @unlink($file);
      $count++;
    }
    return $count;
  }

  // 캐시 통계 (파일 수, 총 크기)
  public static function stats(): array {
    $dir = self::CACHE_DIR;
    if (!is_dir($dir)) {
      return ['count' => 0, 'size_bytes' => 0];
    }
    $files = glob("{$dir}/*.html") ?: [];
    $size  = array_sum(array_map('filesize', $files));
    return ['count' => count($files), 'size_bytes' => (int) $size];
  }

  private static function path(string $slug): string {
    // 슬러그를 안전한 파일명으로 변환
    $safe = preg_replace('/[^a-z0-9\-_]/', '_', strtolower($slug));
    return self::CACHE_DIR . "/{$safe}.html";
  }
}
