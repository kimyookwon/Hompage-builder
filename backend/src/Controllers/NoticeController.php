<?php

namespace App\Controllers;

use App\Config\Database;
use App\Middleware\AuthMiddleware;
use App\Utils\ResponseHelper;

class NoticeController {
  // GET /api/notices -- 현재 활성 공지 목록 (공개, 인증 불필요)
  public function list(): void {
    try {
      $pdo = Database::getInstance();

      $stmt = $pdo->query(
        "SELECT id, title, content, type, starts_at, ends_at, sort_order, created_at
         FROM site_notices
         WHERE is_active = 1
           AND (starts_at IS NULL OR starts_at <= NOW())
           AND (ends_at IS NULL OR ends_at >= NOW())
         ORDER BY sort_order ASC, created_at DESC"
      );

      ResponseHelper::success($stmt->fetchAll());
    } catch (\Throwable $e) {
      ResponseHelper::error('공지 목록 조회에 실패했습니다.', 500);
    }
  }

  // GET /api/admin/notices -- 관리자 전체 공지 목록
  public function adminList(): void {
    AuthMiddleware::requireAdmin();

    try {
      $pdo = Database::getInstance();

      $page  = max(1, (int) ($_GET['page'] ?? 1));
      $limit = min(50, max(1, (int) ($_GET['limit'] ?? 20)));
      $offset = ($page - 1) * $limit;

      $stmt = $pdo->prepare(
        'SELECT * FROM site_notices ORDER BY sort_order ASC, created_at DESC LIMIT ? OFFSET ?'
      );
      $stmt->execute([$limit, $offset]);
      $items = $stmt->fetchAll();

      $total = (int) $pdo->query('SELECT COUNT(*) FROM site_notices')->fetchColumn();

      ResponseHelper::paginated($items, $total, $page, $limit);
    } catch (\Throwable $e) {
      ResponseHelper::error('공지 목록 조회에 실패했습니다.', 500);
    }
  }

  // POST /api/admin/notices -- 공지 생성
  public function create(): void {
    AuthMiddleware::requireAdmin();

    try {
      $data = json_decode(file_get_contents('php://input'), true);

      $title   = trim($data['title'] ?? '');
      $content = trim($data['content'] ?? '');
      $type    = $data['type'] ?? 'info';

      if (empty($title)) ResponseHelper::error('제목을 입력해주세요.', 422);
      if (empty($content)) ResponseHelper::error('내용을 입력해주세요.', 422);
      if (!in_array($type, ['info', 'warning', 'error', 'success'], true)) {
        ResponseHelper::error('올바른 공지 유형을 선택해주세요.', 422);
      }

      $startsAt  = !empty($data['starts_at']) ? $data['starts_at'] : null;
      $endsAt    = !empty($data['ends_at']) ? $data['ends_at'] : null;
      $sortOrder = (int) ($data['sort_order'] ?? 0);

      $pdo = Database::getInstance();
      $stmt = $pdo->prepare(
        'INSERT INTO site_notices (title, content, type, starts_at, ends_at, sort_order)
         VALUES (?, ?, ?, ?, ?, ?)'
      );
      $stmt->execute([$title, $content, $type, $startsAt, $endsAt, $sortOrder]);

      $id = (int) $pdo->lastInsertId();
      $row = $pdo->prepare('SELECT * FROM site_notices WHERE id = ?');
      $row->execute([$id]);

      ResponseHelper::success($row->fetch(), 201);
    } catch (\Throwable $e) {
      ResponseHelper::error('공지 생성에 실패했습니다.', 500);
    }
  }

  // PATCH /api/admin/notices/{id} -- 공지 수정
  public function update(string $id): void {
    AuthMiddleware::requireAdmin();

    try {
      $pdo = Database::getInstance();

      $check = $pdo->prepare('SELECT id FROM site_notices WHERE id = ?');
      $check->execute([(int) $id]);
      if (!$check->fetch()) ResponseHelper::error('공지를 찾을 수 없습니다.', 404);

      $data = json_decode(file_get_contents('php://input'), true);

      $fields = [];
      $params = [];

      if (isset($data['title'])) {
        $title = trim($data['title']);
        if (empty($title)) ResponseHelper::error('제목을 입력해주세요.', 422);
        $fields[] = 'title = ?';
        $params[] = $title;
      }
      if (isset($data['content'])) {
        $content = trim($data['content']);
        if (empty($content)) ResponseHelper::error('내용을 입력해주세요.', 422);
        $fields[] = 'content = ?';
        $params[] = $content;
      }
      if (isset($data['type'])) {
        if (!in_array($data['type'], ['info', 'warning', 'error', 'success'], true)) {
          ResponseHelper::error('올바른 공지 유형을 선택해주세요.', 422);
        }
        $fields[] = 'type = ?';
        $params[] = $data['type'];
      }
      if (array_key_exists('starts_at', $data)) {
        $fields[] = 'starts_at = ?';
        $params[] = !empty($data['starts_at']) ? $data['starts_at'] : null;
      }
      if (array_key_exists('ends_at', $data)) {
        $fields[] = 'ends_at = ?';
        $params[] = !empty($data['ends_at']) ? $data['ends_at'] : null;
      }
      if (isset($data['sort_order'])) {
        $fields[] = 'sort_order = ?';
        $params[] = (int) $data['sort_order'];
      }
      if (isset($data['is_active'])) {
        $fields[] = 'is_active = ?';
        $params[] = (int) (bool) $data['is_active'];
      }

      if (empty($fields)) ResponseHelper::error('수정할 항목이 없습니다.', 422);

      $params[] = (int) $id;
      $pdo->prepare('UPDATE site_notices SET ' . implode(', ', $fields) . ' WHERE id = ?')
          ->execute($params);

      $row = $pdo->prepare('SELECT * FROM site_notices WHERE id = ?');
      $row->execute([(int) $id]);

      ResponseHelper::success($row->fetch());
    } catch (\Throwable $e) {
      if (str_contains($e->getMessage(), '공지를')) throw $e;
      ResponseHelper::error('공지 수정에 실패했습니다.', 500);
    }
  }

  // DELETE /api/admin/notices/{id} -- 공지 삭제
  public function delete(string $id): void {
    AuthMiddleware::requireAdmin();

    try {
      $pdo = Database::getInstance();

      $check = $pdo->prepare('SELECT id FROM site_notices WHERE id = ?');
      $check->execute([(int) $id]);
      if (!$check->fetch()) ResponseHelper::error('공지를 찾을 수 없습니다.', 404);

      $pdo->prepare('DELETE FROM site_notices WHERE id = ?')->execute([(int) $id]);

      ResponseHelper::success(['message' => '공지가 삭제되었습니다.']);
    } catch (\Throwable $e) {
      ResponseHelper::error('공지 삭제에 실패했습니다.', 500);
    }
  }

  // PATCH /api/admin/notices/{id}/toggle -- 활성/비활성 토글
  public function toggle(string $id): void {
    AuthMiddleware::requireAdmin();

    try {
      $pdo = Database::getInstance();

      $check = $pdo->prepare('SELECT id, is_active FROM site_notices WHERE id = ?');
      $check->execute([(int) $id]);
      $notice = $check->fetch();
      if (!$notice) ResponseHelper::error('공지를 찾을 수 없습니다.', 404);

      $newActive = $notice['is_active'] ? 0 : 1;
      $pdo->prepare('UPDATE site_notices SET is_active = ? WHERE id = ?')
          ->execute([$newActive, (int) $id]);

      $row = $pdo->prepare('SELECT * FROM site_notices WHERE id = ?');
      $row->execute([(int) $id]);

      ResponseHelper::success($row->fetch());
    } catch (\Throwable $e) {
      ResponseHelper::error('공지 상태 변경에 실패했습니다.', 500);
    }
  }
}
