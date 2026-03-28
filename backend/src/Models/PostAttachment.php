<?php

namespace App\Models;

use App\Config\Database;

class PostAttachment {
  // 게시글의 첨부파일 목록
  public static function findByPost(int $postId): array {
    $pdo = Database::getInstance();
    $stmt = $pdo->prepare(
      'SELECT id, post_id, file_name, file_url, file_size, mime_type, created_at
       FROM post_attachments WHERE post_id = ? ORDER BY id ASC'
    );
    $stmt->execute([$postId]);
    return $stmt->fetchAll();
  }

  // 단일 첨부파일 조회
  public static function findById(int $id): array|false {
    $pdo = Database::getInstance();
    $stmt = $pdo->prepare('SELECT * FROM post_attachments WHERE id = ?');
    $stmt->execute([$id]);
    return $stmt->fetch();
  }

  // 첨부파일 등록
  public static function create(
    int    $postId,
    int    $uploadedBy,
    string $fileName,
    string $fileUrl,
    int    $fileSize,
    string $mimeType
  ): array {
    $pdo = Database::getInstance();
    $pdo->prepare(
      'INSERT INTO post_attachments (post_id, uploaded_by, file_name, file_url, file_size, mime_type)
       VALUES (?, ?, ?, ?, ?, ?)'
    )->execute([$postId, $uploadedBy, $fileName, $fileUrl, $fileSize, $mimeType]);

    return self::findById((int) $pdo->lastInsertId());
  }

  // 첨부파일 삭제
  public static function delete(int $id): bool {
    $pdo = Database::getInstance();
    $stmt = $pdo->prepare('DELETE FROM post_attachments WHERE id = ?');
    $stmt->execute([$id]);
    return $stmt->rowCount() > 0;
  }
}
