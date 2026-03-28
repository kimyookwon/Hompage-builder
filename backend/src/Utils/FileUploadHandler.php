<?php

namespace App\Utils;

class FileUploadHandler {
  private const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
  private const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
  private const UPLOAD_BASE = __DIR__ . '/../../../public/uploads';

  // 파일 업로드 처리 — 검증 후 저장 경로 반환
  public static function handle(array $file): array {
    if ($file['error'] !== UPLOAD_ERR_OK) {
      throw new \RuntimeException('파일 업로드 중 오류가 발생했습니다.');
    }

    if ($file['size'] > self::MAX_FILE_SIZE) {
      throw new \RuntimeException('파일 크기는 5MB를 초과할 수 없습니다.');
    }

    $mimeType = mime_content_type($file['tmp_name']);
    if (!in_array($mimeType, self::ALLOWED_MIME_TYPES)) {
      throw new \RuntimeException('jpeg, png, webp 형식의 이미지만 업로드 가능합니다.');
    }

    $ext = match ($mimeType) {
      'image/jpeg' => 'jpg',
      'image/png' => 'png',
      'image/webp' => 'webp',
    };

    $year = date('Y');
    $month = date('m');
    $randomName = bin2hex(random_bytes(16)) . '.' . $ext;
    $relativePath = "uploads/{$year}/{$month}/{$randomName}";
    $absolutePath = self::UPLOAD_BASE . "/{$year}/{$month}";

    if (!is_dir($absolutePath)) {
      mkdir($absolutePath, 0755, true);
    }

    if (!move_uploaded_file($file['tmp_name'], "{$absolutePath}/{$randomName}")) {
      throw new \RuntimeException('파일 저장에 실패했습니다.');
    }

    return [
      'filename' => $file['name'],
      'file_url' => '/' . $relativePath,
      'mime_type' => $mimeType,
      'file_size' => $file['size'],
    ];
  }

  // 파일 시스템에서 파일 삭제
  public static function delete(string $fileUrl): void {
    $path = self::UPLOAD_BASE . str_replace('/uploads', '', $fileUrl);
    if (file_exists($path)) {
      unlink($path);
    }
  }
}
