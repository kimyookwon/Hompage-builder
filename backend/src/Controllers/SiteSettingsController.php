<?php

namespace App\Controllers;

use App\Models\SiteSettings;
use App\Middleware\AuthMiddleware;
use App\Utils\ResponseHelper;

class SiteSettingsController {
  // GET /api/site-settings — 설정 조회 (공개: 홈 슬러그 리다이렉트에 사용)
  public function show(): void {
    ResponseHelper::success(SiteSettings::get());
  }

  // PATCH /api/site-settings — 설정 수정
  public function update(): void {
    AuthMiddleware::requireAdmin();

    $data = json_decode(file_get_contents('php://input'), true);

    // HEX 컬러 형식 검증
    foreach (['primary_color', 'secondary_color', 'background_color'] as $field) {
      if (isset($data[$field]) && !preg_match('/^#[0-9A-Fa-f]{6}$/', $data[$field])) {
        ResponseHelper::error("{$field}는 유효한 HEX 컬러(#RRGGBB)여야 합니다.", 422);
      }
    }

    ResponseHelper::success(SiteSettings::update($data));
  }
}
