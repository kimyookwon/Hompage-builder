<?php

namespace App\Controllers;

use App\Models\Page;
use App\Models\PageSection;
use App\Middleware\AuthMiddleware;
use App\Utils\ResponseHelper;

class PageSectionController {
  // GET /api/pages/{id}/sections — 섹션 목록
  public function list(string $pageId): void {
    AuthMiddleware::requireAdmin();

    if (!Page::findById((int) $pageId)) {
      ResponseHelper::error('페이지를 찾을 수 없습니다.', 404);
    }

    $sections = PageSection::findByPage((int) $pageId);
    ResponseHelper::success($sections);
  }

  // POST /api/pages/{id}/sections — 섹션 추가
  public function create(string $pageId): void {
    AuthMiddleware::requireAdmin();

    if (!Page::findById((int) $pageId)) {
      ResponseHelper::error('페이지를 찾을 수 없습니다.', 404);
    }

    $data = json_decode(file_get_contents('php://input'), true);
    $type = $data['type'] ?? '';
    $format = $data['format'] ?? '';
    $content = $data['content'] ?? [];

    $validTypes = ['header', 'container', 'banner', 'footer'];
    $validFormats = ['bento', 'glassmorphism', 'organic', 'text', 'gallery'];

    if (!in_array($type, $validTypes)) {
      ResponseHelper::error('유효하지 않은 섹션 타입입니다.', 422);
    }
    if (!in_array($format, $validFormats)) {
      ResponseHelper::error('유효하지 않은 섹션 포맷입니다.', 422);
    }

    // header/footer 중복 검사
    if (PageSection::typeExistsInPage((int) $pageId, $type)) {
      ResponseHelper::error("{$type} 섹션은 페이지당 하나만 추가할 수 있습니다.", 409);
    }

    $section = PageSection::create((int) $pageId, $type, $format, $content);
    ResponseHelper::success($section, 201);
  }

  // PATCH /api/sections/{id} — 섹션 수정
  public function update(string $id): void {
    AuthMiddleware::requireAdmin();

    $section = PageSection::findById((int) $id);
    if (!$section) {
      ResponseHelper::error('섹션을 찾을 수 없습니다.', 404);
    }

    $data = json_decode(file_get_contents('php://input'), true);
    $updated = PageSection::update((int) $id, $data);
    ResponseHelper::success($updated);
  }

  // DELETE /api/sections/{id} — 섹션 삭제
  public function delete(string $id): void {
    AuthMiddleware::requireAdmin();

    $section = PageSection::findById((int) $id);
    if (!$section) {
      ResponseHelper::error('섹션을 찾을 수 없습니다.', 404);
    }

    PageSection::delete((int) $id);
    ResponseHelper::success(['message' => '섹션이 삭제되었습니다.']);
  }

  // PATCH /api/pages/{id}/sections/reorder — 순서 변경
  public function reorder(string $pageId): void {
    AuthMiddleware::requireAdmin();

    if (!Page::findById((int) $pageId)) {
      ResponseHelper::error('페이지를 찾을 수 없습니다.', 404);
    }

    $data = json_decode(file_get_contents('php://input'), true);
    $orderedIds = $data['ids'] ?? [];

    if (empty($orderedIds) || !is_array($orderedIds)) {
      ResponseHelper::error('정렬할 섹션 ID 배열이 필요합니다.', 422);
    }

    PageSection::reorder((int) $pageId, $orderedIds);
    ResponseHelper::success(PageSection::findByPage((int) $pageId));
  }
}
