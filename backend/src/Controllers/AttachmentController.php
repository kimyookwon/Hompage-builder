<?php

namespace App\Controllers;

use App\Models\Post;
use App\Models\PostAttachment;
use App\Middleware\AuthMiddleware;
use App\Utils\ResponseHelper;

// 허용 MIME 타입 (이미지 + 문서 + 압축)
const ALLOWED_MIME_TYPES = [
  'image/jpeg', 'image/png', 'image/webp', 'image/gif',
  'application/pdf',
  'application/zip', 'application/x-zip-compressed',
  'application/x-rar-compressed', 'application/x-7z-compressed',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.ms-powerpoint',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'text/plain',
  'video/mp4', 'video/webm',
];

const MAX_FILE_SIZE = 20 * 1024 * 1024; // 20MB

class AttachmentController {
  // POST /api/posts/{id}/attachments — 첨부파일 업로드 (로그인 필요)
  public function upload(string $postId): void {
    $payload = AuthMiddleware::require();

    $post = Post::findById((int) $postId);
    if (!$post) ResponseHelper::error('게시글을 찾을 수 없습니다.', 404);

    // 작성자 또는 관리자만 첨부 가능
    if ((int) $post['author_id'] !== (int) $payload->sub && $payload->role !== 'admin') {
      ResponseHelper::error('첨부파일을 추가할 권한이 없습니다.', 403);
    }

    if (empty($_FILES['file'])) {
      ResponseHelper::error('파일을 선택해주세요.', 422);
    }

    $file = $_FILES['file'];

    if ($file['error'] !== UPLOAD_ERR_OK) {
      ResponseHelper::error('파일 업로드 중 오류가 발생했습니다.', 500);
    }

    if ($file['size'] > MAX_FILE_SIZE) {
      ResponseHelper::error('파일 크기는 20MB 이하여야 합니다.', 422);
    }

    // MIME 타입 검증 (finfo로 실제 타입 확인)
    $finfo = finfo_open(FILEINFO_MIME_TYPE);
    $mimeType = finfo_file($finfo, $file['tmp_name']);
    finfo_close($finfo);

    if (!in_array($mimeType, ALLOWED_MIME_TYPES, true)) {
      ResponseHelper::error('허용되지 않는 파일 형식입니다.', 422);
    }

    // 업로드 디렉토리
    $uploadDir = __DIR__ . '/../../public/uploads/attachments/';
    if (!is_dir($uploadDir)) {
      mkdir($uploadDir, 0755, true);
    }

    $ext      = pathinfo($file['name'], PATHINFO_EXTENSION);
    $safeName = preg_replace('/[^a-zA-Z0-9._-]/', '_', $file['name']);
    $unique   = uniqid('', true) . '_' . $safeName;
    $dest     = $uploadDir . $unique;

    if (!move_uploaded_file($file['tmp_name'], $dest)) {
      ResponseHelper::error('파일 저장에 실패했습니다.', 500);
    }

    $apiBase = rtrim($_ENV['APP_URL'] ?? 'http://localhost:8000', '/');
    $fileUrl = $apiBase . '/uploads/attachments/' . $unique;

    $attachment = PostAttachment::create(
      (int) $postId,
      (int) $payload->sub,
      $file['name'],
      $fileUrl,
      (int) $file['size'],
      $mimeType
    );

    ResponseHelper::success($attachment, 201);
  }

  // DELETE /api/attachments/{id} — 첨부파일 삭제 (작성자 또는 관리자)
  public function delete(string $id): void {
    $payload = AuthMiddleware::require();

    $attachment = PostAttachment::findById((int) $id);
    if (!$attachment) ResponseHelper::error('첨부파일을 찾을 수 없습니다.', 404);

    $post = Post::findById((int) $attachment['post_id']);
    $isPostAuthor = $post && (int) $post['author_id'] === (int) $payload->sub;

    if (!$isPostAuthor && $payload->role !== 'admin') {
      ResponseHelper::error('삭제 권한이 없습니다.', 403);
    }

    // 실제 파일 삭제
    $uploadDir = __DIR__ . '/../../public/uploads/attachments/';
    $fileName  = basename(parse_url($attachment['file_url'], PHP_URL_PATH));
    $filePath  = $uploadDir . $fileName;
    if (file_exists($filePath)) {
      @unlink($filePath);
    }

    PostAttachment::delete((int) $id);
    ResponseHelper::success(['message' => '삭제되었습니다.']);
  }

  // GET /api/attachments/{id}/download — 다운로드 (카운트 증가 후 리다이렉트)
  public function download(string $id): void {
    $attachment = PostAttachment::findById((int) $id);
    if (!$attachment) ResponseHelper::error('첨부파일을 찾을 수 없습니다.', 404);

    // 다운로드 카운트 증가
    $pdo = \App\Config\Database::getInstance();
    $pdo->prepare('UPDATE post_attachments SET download_count = download_count + 1 WHERE id = ?')
        ->execute([(int) $id]);

    // 리다이렉트
    http_response_code(301);
    header('Location: ' . $attachment['file_url']);
    exit;
  }

  // GET /api/admin/attachments — 첨부파일 다운로드 통계 (관리자)
  public function adminStats(): void {
    AuthMiddleware::requireAdmin();

    $page   = max(1, (int) ($_GET['page']  ?? 1));
    $limit  = min(100, max(1, (int) ($_GET['limit'] ?? 20)));
    $offset = ($page - 1) * $limit;

    $sort  = in_array($_GET['sort'] ?? '', ['download_count', 'file_size', 'created_at'])
      ? $_GET['sort'] : 'created_at';
    $order = strtolower($_GET['order'] ?? 'desc') === 'asc' ? 'ASC' : 'DESC';

    $pdo = \App\Config\Database::getInstance();

    $stmt = $pdo->prepare(
      "SELECT a.*, p.title AS post_title, u.name AS uploader_name
       FROM post_attachments a
       JOIN posts p ON p.id = a.post_id
       JOIN users u ON u.id = a.uploaded_by
       ORDER BY a.{$sort} {$order}
       LIMIT ? OFFSET ?"
    );
    $stmt->execute([$limit, $offset]);
    $items = $stmt->fetchAll();

    $countStmt = $pdo->query('SELECT COUNT(*) FROM post_attachments');
    $total = (int) $countStmt->fetchColumn();

    ResponseHelper::paginated($items, $total, $page, $limit);
  }
}
