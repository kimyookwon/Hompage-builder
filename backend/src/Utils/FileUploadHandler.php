<?php

namespace App\Utils;

class FileUploadHandler {
  private const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
  private const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB (원본 기준, 최적화 전)
  private const UPLOAD_BASE = __DIR__ . '/../../../public/uploads';
  private const MAX_DIMENSION = 1920;   // 최대 가로/세로 픽셀
  private const THUMB_WIDTH   = 480;    // 썸네일 가로 픽셀
  private const WEBP_QUALITY  = 82;     // WebP 압축 품질 (0-100)
  private const JPEG_QUALITY  = 85;     // JPEG 압축 품질 (0-100)

  // 파일 업로드 처리 — 검증 → 리사이즈 → WebP 변환 → 저장
  public static function handle(array $file): array {
    if ($file['error'] !== UPLOAD_ERR_OK) {
      throw new \RuntimeException('파일 업로드 중 오류가 발생했습니다.');
    }

    if ($file['size'] > self::MAX_FILE_SIZE) {
      throw new \RuntimeException('파일 크기는 10MB를 초과할 수 없습니다.');
    }

    $mimeType = mime_content_type($file['tmp_name']);
    if (!in_array($mimeType, self::ALLOWED_MIME_TYPES)) {
      throw new \RuntimeException('jpeg, png, webp 형식의 이미지만 업로드 가능합니다.');
    }

    $year  = date('Y');
    $month = date('m');
    $base  = bin2hex(random_bytes(16));
    $dir   = self::UPLOAD_BASE . "/{$year}/{$month}";

    if (!is_dir($dir)) {
      mkdir($dir, 0755, true);
    }

    // GD를 통한 최적화 가능 여부 확인
    $gdAvailable = extension_loaded('gd') && self::gdSupports($mimeType);

    if ($gdAvailable) {
      return self::processWithGd($file, $mimeType, $dir, $base, $year, $month);
    }

    // GD 미지원 — 원본 그대로 저장 (폴백)
    return self::saveOriginal($file, $mimeType, $dir, $base, $year, $month);
  }

  // GD로 리사이즈 + WebP 변환 처리
  private static function processWithGd(
    array  $file,
    string $mimeType,
    string $dir,
    string $base,
    string $year,
    string $month
  ): array {
    $src = self::createGdImage($file['tmp_name'], $mimeType);
    if ($src === false) {
      return self::saveOriginal($file, $mimeType, $dir, $base, $year, $month);
    }

    $origW = imagesx($src);
    $origH = imagesy($src);

    // 최대 크기 초과 시 리사이즈
    [$newW, $newH] = self::calcDimensions($origW, $origH, self::MAX_DIMENSION);
    if ($newW !== $origW || $newH !== $origH) {
      $resized = self::resizeImage($src, $origW, $origH, $newW, $newH);
      imagedestroy($src);
      $src = $resized;
    }

    // 메인 이미지 — WebP로 저장
    $mainName = $base . '.webp';
    $mainPath = "{$dir}/{$mainName}";
    imagewebp($src, $mainPath, self::WEBP_QUALITY);

    // 썸네일 생성 (가로 480px)
    [$thumbW, $thumbH] = self::calcDimensions($newW, $newH, self::THUMB_WIDTH);
    $thumb = self::resizeImage($src, $newW, $newH, $thumbW, $thumbH);
    $thumbName = $base . '_thumb.webp';
    $thumbPath = "{$dir}/{$thumbName}";
    imagewebp($thumb, $thumbPath, self::WEBP_QUALITY);
    imagedestroy($thumb);
    imagedestroy($src);

    $fileSize = filesize($mainPath) ?: 0;

    return [
      'filename'  => $file['name'],
      'file_url'  => "/uploads/{$year}/{$month}/{$mainName}",
      'thumb_url' => "/uploads/{$year}/{$month}/{$thumbName}",
      'mime_type' => 'image/webp',
      'file_size' => $fileSize,
      'width'     => $newW,
      'height'    => $newH,
    ];
  }

  // GD 미지원 폴백 — 원본 저장
  private static function saveOriginal(
    array  $file,
    string $mimeType,
    string $dir,
    string $base,
    string $year,
    string $month
  ): array {
    $ext = match ($mimeType) {
      'image/jpeg' => 'jpg',
      'image/png'  => 'png',
      'image/webp' => 'webp',
    };
    $name = $base . '.' . $ext;
    if (!move_uploaded_file($file['tmp_name'], "{$dir}/{$name}")) {
      throw new \RuntimeException('파일 저장에 실패했습니다.');
    }
    return [
      'filename'  => $file['name'],
      'file_url'  => "/uploads/{$year}/{$month}/{$name}",
      'thumb_url' => null,
      'mime_type' => $mimeType,
      'file_size' => $file['size'],
    ];
  }

  // MIME 타입에 맞는 GD 이미지 리소스 생성
  private static function createGdImage(string $path, string $mimeType): \GdImage|false {
    return match ($mimeType) {
      'image/jpeg' => imagecreatefromjpeg($path),
      'image/png'  => imagecreatefrompng($path),
      'image/webp' => imagecreatefromwebp($path),
      default      => false,
    };
  }

  // GD가 해당 MIME 타입을 지원하는지 확인
  private static function gdSupports(string $mimeType): bool {
    $types = imagetypes();
    return match ($mimeType) {
      'image/jpeg' => (bool) ($types & IMG_JPEG),
      'image/png'  => (bool) ($types & IMG_PNG),
      'image/webp' => (bool) ($types & IMG_WEBP),
      default      => false,
    };
  }

  // 비율 유지 리사이즈 — 최대 크기(maxDim) 초과 시 축소
  private static function calcDimensions(int $w, int $h, int $maxDim): array {
    if ($w <= $maxDim && $h <= $maxDim) {
      return [$w, $h];
    }
    if ($w >= $h) {
      return [$maxDim, (int) round($h * $maxDim / $w)];
    }
    return [(int) round($w * $maxDim / $h), $maxDim];
  }

  // 트루컬러 이미지 리사이즈 (투명도 보존)
  private static function resizeImage(
    \GdImage $src,
    int $srcW, int $srcH,
    int $dstW, int $dstH
  ): \GdImage {
    $dst = imagecreatetruecolor($dstW, $dstH);
    // PNG 투명 채널 보존
    imagealphablending($dst, false);
    imagesavealpha($dst, true);
    $transparent = imagecolorallocatealpha($dst, 0, 0, 0, 127);
    imagefilledrectangle($dst, 0, 0, $dstW, $dstH, $transparent);
    imagecopyresampled($dst, $src, 0, 0, 0, 0, $dstW, $dstH, $srcW, $srcH);
    return $dst;
  }

  // 파일 시스템에서 파일 삭제 (썸네일 포함)
  public static function delete(string $fileUrl): void {
    $path = self::UPLOAD_BASE . str_replace('/uploads', '', $fileUrl);
    if (file_exists($path)) {
      unlink($path);
    }
    // _thumb 파일도 같이 삭제
    $thumbPath = preg_replace('/(\.\w+)$/', '_thumb$1', $path);
    if ($thumbPath && file_exists($thumbPath)) {
      unlink($thumbPath);
    }
  }
}
