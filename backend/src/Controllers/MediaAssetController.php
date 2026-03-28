<?php

namespace App\Controllers;

use App\Models\MediaAsset;
use App\Middleware\AuthMiddleware;
use App\Utils\FileUploadHandler;
use App\Utils\ResponseHelper;

class MediaAssetController {
  // GET /api/media — 미디어 목록
  public function list(): void {
    AuthMiddleware::requireAdmin();

    $page  = max(1, (int) ($_GET['page']  ?? 1));
    $limit = min(100, max(1, (int) ($_GET['limit'] ?? 24)));

    $result = MediaAsset::findAll($page, $limit);
    ResponseHelper::paginated($result['items'], $result['total'], $page, $limit);
  }

  // POST /api/media/upload — 이미지 업로드
  public function upload(): void {
    $payload = AuthMiddleware::requireAdmin();

    if (empty($_FILES['file'])) {
      ResponseHelper::error('업로드할 파일이 없습니다.', 422);
    }

    try {
      $fileInfo = FileUploadHandler::handle($_FILES['file']);
      $asset = MediaAsset::create(
        $fileInfo['filename'],
        $fileInfo['file_url'],
        $fileInfo['mime_type'],
        $fileInfo['file_size'],
        (int) $payload->sub,
        $fileInfo['thumb_url'] ?? null
      );
      ResponseHelper::success($asset, 201);
    } catch (\RuntimeException $e) {
      ResponseHelper::error($e->getMessage(), 422);
    }
  }

  // DELETE /api/media/{id} — 미디어 삭제
  public function delete(string $id): void {
    AuthMiddleware::requireAdmin();

    $asset = MediaAsset::findById((int) $id);
    if (!$asset) {
      ResponseHelper::error('파일을 찾을 수 없습니다.', 404);
    }

    FileUploadHandler::delete($asset['file_url']);
    MediaAsset::delete((int) $id);
    ResponseHelper::success(['message' => '파일이 삭제되었습니다.']);
  }
}
