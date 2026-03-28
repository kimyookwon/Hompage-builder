<?php

namespace App\Models;

use App\Config\Database;

class PageSection {
  private const UNIQUE_SECTION_TYPES = ['header', 'footer'];

  // 페이지의 섹션 목록 조회 (order 순서)
  public static function findByPage(int $pageId): array {
    $pdo = Database::getInstance();
    $stmt = $pdo->prepare(
      'SELECT * FROM page_sections WHERE page_id = ? ORDER BY `order` ASC'
    );
    $stmt->execute([$pageId]);
    $rows = $stmt->fetchAll();

    // content JSON 디코딩
    return array_map(function ($row) {
      $row['content'] = json_decode($row['content'], true);
      return $row;
    }, $rows);
  }

  // 섹션 단일 조회
  public static function findById(int $id): array|false {
    $pdo = Database::getInstance();
    $stmt = $pdo->prepare('SELECT * FROM page_sections WHERE id = ?');
    $stmt->execute([$id]);
    $row = $stmt->fetch();
    if ($row) {
      $row['content'] = json_decode($row['content'], true);
    }
    return $row;
  }

  // 해당 페이지에 header/footer 중복 여부 확인
  public static function typeExistsInPage(int $pageId, string $type, ?int $excludeId = null): bool {
    if (!in_array($type, self::UNIQUE_SECTION_TYPES)) return false;

    $pdo = Database::getInstance();
    if ($excludeId !== null) {
      $stmt = $pdo->prepare('SELECT id FROM page_sections WHERE page_id = ? AND type = ? AND id != ?');
      $stmt->execute([$pageId, $type, $excludeId]);
    } else {
      $stmt = $pdo->prepare('SELECT id FROM page_sections WHERE page_id = ? AND type = ?');
      $stmt->execute([$pageId, $type]);
    }
    return (bool) $stmt->fetch();
  }

  // 섹션 추가
  public static function create(int $pageId, string $type, string $format, array $content): array {
    $pdo = Database::getInstance();

    // 새 섹션의 order 값: 현재 최대값 + 1
    $stmt = $pdo->prepare('SELECT COALESCE(MAX(`order`), -1) + 1 FROM page_sections WHERE page_id = ?');
    $stmt->execute([$pageId]);
    $order = (int) $stmt->fetchColumn();

    $stmt = $pdo->prepare(
      'INSERT INTO page_sections (page_id, type, format, content, `order`) VALUES (?, ?, ?, ?, ?)'
    );
    $stmt->execute([$pageId, $type, $format, json_encode($content, JSON_UNESCAPED_UNICODE), $order]);
    return self::findById((int) $pdo->lastInsertId());
  }

  // 섹션 수정
  public static function update(int $id, array $data): array|false {
    $pdo = Database::getInstance();
    $fields = [];
    $values = [];

    if (isset($data['format'])) {
      $fields[] = 'format = ?';
      $values[] = $data['format'];
    }
    if (isset($data['content'])) {
      $fields[] = 'content = ?';
      $values[] = json_encode($data['content'], JSON_UNESCAPED_UNICODE);
    }

    if (!empty($fields)) {
      $values[] = $id;
      $pdo->prepare('UPDATE page_sections SET ' . implode(', ', $fields) . ' WHERE id = ?')->execute($values);
    }

    return self::findById($id);
  }

  // 섹션 삭제
  public static function delete(int $id): bool {
    $pdo = Database::getInstance();
    $stmt = $pdo->prepare('DELETE FROM page_sections WHERE id = ?');
    $stmt->execute([$id]);
    return $stmt->rowCount() > 0;
  }

  // 섹션 순서 변경 (트랜잭션)
  public static function reorder(int $pageId, array $orderedIds): void {
    $pdo = Database::getInstance();
    $pdo->beginTransaction();

    try {
      $stmt = $pdo->prepare('UPDATE page_sections SET `order` = ? WHERE id = ? AND page_id = ?');
      foreach ($orderedIds as $order => $sectionId) {
        $stmt->execute([$order, $sectionId, $pageId]);
      }
      $pdo->commit();
    } catch (\Exception $e) {
      $pdo->rollBack();
      throw $e;
    }
  }
}
