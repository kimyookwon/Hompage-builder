<?php

namespace App\Controllers;

use App\Config\Database;
use App\Middleware\AuthMiddleware;
use App\Utils\ResponseHelper;

class SiteExportController {
  // GET /api/admin/export — 사이트 전체 구성 내보내기
  public function export(): void {
    AuthMiddleware::requireAdmin();

    $pdo = Database::getInstance();

    // 사이트 설정
    $siteSettings = $pdo->query('SELECT * FROM site_settings LIMIT 1')->fetch() ?: [];

    // 페이지 + 섹션
    $pages = $pdo->query('SELECT * FROM pages ORDER BY id')->fetchAll();
    foreach ($pages as &$page) {
      $stmt = $pdo->prepare('SELECT * FROM page_sections WHERE page_id = ? ORDER BY `order`');
      $stmt->execute([$page['id']]);
      $sections = $stmt->fetchAll();
      // JSON content 디코드
      foreach ($sections as &$section) {
        $section['content'] = json_decode($section['content'], true);
      }
      $page['sections'] = $sections;
    }

    // 게시판 구조 (게시글/댓글은 제외 — 콘텐츠 데이터)
    $boards = $pdo->query('SELECT id, name, type, read_permission, write_permission, created_at FROM boards ORDER BY id')->fetchAll();

    $export = [
      'version' => '1.0',
      'exported_at' => date('c'),
      'site_settings' => $siteSettings,
      'pages' => $pages,
      'boards' => $boards,
    ];

    // JSON 다운로드 헤더
    header('Content-Type: application/json; charset=utf-8');
    header('Content-Disposition: attachment; filename="site-export-' . date('Ymd-His') . '.json"');
    echo json_encode($export, JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);
    exit;
  }

  // POST /api/admin/import — 사이트 구성 가져오기
  public function import(): void {
    AuthMiddleware::requireAdmin();

    $raw = file_get_contents('php://input');
    $data = json_decode($raw, true);

    if (!$data || !isset($data['version'])) {
      ResponseHelper::error('유효하지 않은 내보내기 파일입니다.', 422);
    }

    $pdo = Database::getInstance();
    $pdo->beginTransaction();

    try {
      // 사이트 설정 복원
      if (!empty($data['site_settings'])) {
        $s = $data['site_settings'];
        $pdo->prepare(
          'INSERT INTO site_settings (logo_url, primary_color, secondary_color, background_color, gtm_code)
           VALUES (?, ?, ?, ?, ?)
           ON DUPLICATE KEY UPDATE
             logo_url = VALUES(logo_url),
             primary_color = VALUES(primary_color),
             secondary_color = VALUES(secondary_color),
             background_color = VALUES(background_color),
             gtm_code = VALUES(gtm_code)'
        )->execute([
          $s['logo_url'] ?? null,
          $s['primary_color'] ?? '#3b82f6',
          $s['secondary_color'] ?? '#8b5cf6',
          $s['background_color'] ?? '#ffffff',
          $s['gtm_code'] ?? null,
        ]);
      }

      // 페이지 + 섹션 복원 (slug 충돌 시 _imported 접미어)
      foreach (($data['pages'] ?? []) as $page) {
        $slug = $page['slug'];
        // slug 중복 확인
        $exists = $pdo->prepare('SELECT id FROM pages WHERE slug = ?');
        $exists->execute([$slug]);
        if ($exists->fetch()) {
          $slug = $slug . '-imported-' . time();
        }

        $stmt = $pdo->prepare(
          'INSERT INTO pages (title, slug, is_published, created_at, updated_at) VALUES (?, ?, ?, ?, ?)'
        );
        $stmt->execute([
          $page['title'],
          $slug,
          (int) ($page['is_published'] ?? 0),
          $page['created_at'] ?? date('Y-m-d H:i:s'),
          $page['updated_at'] ?? date('Y-m-d H:i:s'),
        ]);
        $newPageId = (int) $pdo->lastInsertId();

        foreach (($page['sections'] ?? []) as $section) {
          $pdo->prepare(
            'INSERT INTO page_sections (page_id, type, format, content, `order`, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)'
          )->execute([
            $newPageId,
            $section['type'],
            $section['format'],
            json_encode($section['content'], JSON_UNESCAPED_UNICODE),
            $section['order'] ?? 0,
            $section['created_at'] ?? date('Y-m-d H:i:s'),
            $section['updated_at'] ?? date('Y-m-d H:i:s'),
          ]);
        }
      }

      // 게시판 복원 (name 중복 시 덮어쓰지 않고 신규 추가)
      foreach (($data['boards'] ?? []) as $board) {
        $nameExists = $pdo->prepare('SELECT id FROM boards WHERE name = ?');
        $nameExists->execute([$board['name']]);
        if (!$nameExists->fetch()) {
          $pdo->prepare(
            'INSERT INTO boards (name, type, read_permission, write_permission) VALUES (?, ?, ?, ?)'
          )->execute([
            $board['name'],
            $board['type'] ?? 'general',
            $board['read_permission'] ?? 'user',
            $board['write_permission'] ?? 'user',
          ]);
        }
      }

      $pdo->commit();
      ResponseHelper::success(['message' => '사이트 구성을 성공적으로 가져왔습니다.']);

    } catch (\Exception $e) {
      $pdo->rollBack();
      ResponseHelper::error('가져오기 중 오류가 발생했습니다: ' . $e->getMessage(), 500);
    }
  }
}
