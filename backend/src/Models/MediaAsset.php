<?php

namespace App\Models;

use App\Config\Database;

class MediaAsset {
  // 미디어 파일 생성 (썸네일 URL 포함)
  public static function create(string $filename, string $fileUrl, string $mimeType, int $fileSize, int $uploadedBy, ?string $thumbUrl = null): array {
    $pdo = Database::getInstance();
    $stmt = $pdo->prepare(
      'INSERT INTO media_assets (filename, file_url, thumb_url, mime_type, file_size, uploaded_by) VALUES (?, ?, ?, ?, ?, ?)'
    );
    $stmt->execute([$filename, $fileUrl, $thumbUrl, $mimeType, $fileSize, $uploadedBy]);
    $id = (int) $pdo->lastInsertId();

    $stmt = $pdo->prepare('SELECT * FROM media_assets WHERE id = ?');
    $stmt->execute([$id]);
    return $stmt->fetch();
  }

  // 미디어 파일 목록 조회 (최신순)
  public static function findAll(int $page, int $limit): array {
    $pdo = Database::getInstance();
    $offset = ($page - 1) * $limit;

    $stmt = $pdo->prepare(
      'SELECT * FROM media_assets ORDER BY created_at DESC LIMIT ? OFFSET ?'
    );
    $stmt->execute([$limit, $offset]);

    $countStmt = $pdo->query('SELECT COUNT(*) FROM media_assets');

    return [
      'items' => $stmt->fetchAll(),
      'total' => (int) $countStmt->fetchColumn(),
    ];
  }

  // 미디어 파일 조회
  public static function findById(int $id): array|false {
    $pdo = Database::getInstance();
    $stmt = $pdo->prepare('SELECT * FROM media_assets WHERE id = ?');
    $stmt->execute([$id]);
    return $stmt->fetch();
  }

  // 미디어 파일 삭제
  public static function delete(int $id): bool {
    $pdo = Database::getInstance();
    $stmt = $pdo->prepare('DELETE FROM media_assets WHERE id = ?');
    $stmt->execute([$id]);
    return $stmt->rowCount() > 0;
  }
}
