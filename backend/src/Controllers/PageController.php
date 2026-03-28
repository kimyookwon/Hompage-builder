<?php

namespace App\Controllers;

use App\Models\Page;
use App\Models\PageSection;
use App\Models\SiteSettings;
use App\Middleware\AuthMiddleware;
use App\Utils\ResponseHelper;

class PageController {
  // GET /api/pages — 페이지 목록 (페이지네이션)
  public function list(): void {
    AuthMiddleware::requireAdmin();

    $page = max(1, (int) ($_GET['page'] ?? 1));
    $limit = min(100, max(1, (int) ($_GET['limit'] ?? 20)));
    $search = trim($_GET['search'] ?? '');

    $result = Page::findAll($page, $limit, $search);
    ResponseHelper::paginated($result['items'], $result['total'], $page, $limit);
  }

  // POST /api/pages — 페이지 생성
  public function create(): void {
    AuthMiddleware::requireAdmin();

    $data = json_decode(file_get_contents('php://input'), true);
    $title = trim($data['title'] ?? '');
    $slug = trim($data['slug'] ?? '');

    if (empty($title)) {
      ResponseHelper::error('페이지 제목을 입력해주세요.', 422);
    }
    if (empty($slug)) {
      // 슬러그 자동 생성 (영문 소문자 + 하이픈)
      $slug = strtolower(preg_replace('/[^a-zA-Z0-9]+/', '-', $title));
      $slug = trim($slug, '-');
    }
    if (!preg_match('/^[a-z0-9-]+$/', $slug)) {
      ResponseHelper::error('슬러그는 영문 소문자, 숫자, 하이픈만 사용할 수 있습니다.', 422);
    }
    if (Page::slugExists($slug)) {
      ResponseHelper::error('이미 사용 중인 슬러그입니다.', 409);
    }

    $page = Page::create($title, $slug);
    ResponseHelper::success($page, 201);
  }

  // GET /api/pages/{id} — 페이지 상세
  public function show(string $id): void {
    AuthMiddleware::requireAdmin();

    $page = Page::findById((int) $id);
    if (!$page) {
      ResponseHelper::error('페이지를 찾을 수 없습니다.', 404);
    }
    ResponseHelper::success($page);
  }

  // PATCH /api/pages/{id} — 페이지 수정
  public function update(string $id): void {
    AuthMiddleware::requireAdmin();

    $page = Page::findById((int) $id);
    if (!$page) {
      ResponseHelper::error('페이지를 찾을 수 없습니다.', 404);
    }

    $data = json_decode(file_get_contents('php://input'), true);

    if (isset($data['slug'])) {
      $data['slug'] = trim($data['slug']);
      if (!preg_match('/^[a-z0-9-]+$/', $data['slug'])) {
        ResponseHelper::error('슬러그는 영문 소문자, 숫자, 하이픈만 사용할 수 있습니다.', 422);
      }
      if (Page::slugExists($data['slug'], (int) $id)) {
        ResponseHelper::error('이미 사용 중인 슬러그입니다.', 409);
      }
    }

    // SEO 필드 화이트리스트 처리
    $allowed = ['title', 'slug', 'seo_description', 'seo_og_image'];
    $filtered = array_intersect_key($data, array_flip($allowed));

    $updated = Page::update((int) $id, $filtered);
    ResponseHelper::success($updated);
  }

  // DELETE /api/pages/{id} — 페이지 삭제
  public function delete(string $id): void {
    AuthMiddleware::requireAdmin();

    $page = Page::findById((int) $id);
    if (!$page) {
      ResponseHelper::error('페이지를 찾을 수 없습니다.', 404);
    }

    Page::delete((int) $id);
    ResponseHelper::success(['message' => '페이지가 삭제되었습니다.']);
  }

  // PATCH /api/pages/{id}/publish — 발행 토글
  public function togglePublish(string $id): void {
    AuthMiddleware::requireAdmin();

    $page = Page::findById((int) $id);
    if (!$page) {
      ResponseHelper::error('페이지를 찾을 수 없습니다.', 404);
    }

    $updated = Page::togglePublish((int) $id);
    ResponseHelper::success($updated);
  }

  // POST /api/pages/{id}/duplicate — 페이지 복제
  public function duplicate(string $id): void {
    AuthMiddleware::requireAdmin();

    $original = Page::findById((int) $id);
    if (!$original) ResponseHelper::error('페이지를 찾을 수 없습니다.', 404);

    // 복제 slug 생성 (중복 회피)
    $baseSlug = $original['slug'] . '-copy';
    $slug = $baseSlug;
    $suffix = 1;
    while (Page::slugExists($slug)) {
      $slug = $baseSlug . '-' . $suffix++;
    }

    $newPage = Page::create('(사본) ' . $original['title'], $slug);

    // 섹션 복제 (order는 create 내부에서 순차 자동 생성)
    $sections = PageSection::findByPage((int) $id);
    foreach ($sections as $section) {
      PageSection::create(
        (int) $newPage['id'],
        $section['type'],
        $section['format'],
        (array) $section['content']
      );
    }

    ResponseHelper::success($newPage, 201);
  }

  // GET /public/pages/{slug} — 공개 페이지 조회 (인증 불필요, 섹션 + 사이트설정 포함)
  public function showPublic(string $slug): void {
    $page = Page::findBySlug($slug);
    if (!$page) {
      ResponseHelper::error('페이지를 찾을 수 없습니다.', 404);
    }

    $sections = PageSection::findByPage((int) $page['id']);
    $siteSettings = SiteSettings::get();

    ResponseHelper::success([
      'page'          => $page,
      'sections'      => $sections,
      'site_settings' => $siteSettings ?: [],
    ]);
  }

  // GET /api/pages/{id}/preview — 어드민 미리보기 (미발행 포함)
  public function preview(string $id): void {
    AuthMiddleware::requireAdmin();

    $page = Page::findById((int) $id);
    if (!$page) {
      ResponseHelper::error('페이지를 찾을 수 없습니다.', 404);
    }

    $sections = PageSection::findByPage((int) $id);
    $siteSettings = SiteSettings::get();

    ResponseHelper::success([
      'page'          => $page,
      'sections'      => $sections,
      'site_settings' => $siteSettings ?: [],
    ]);
  }
}
