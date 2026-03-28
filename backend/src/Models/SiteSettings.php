<?php

namespace App\Models;

use App\Config\Database;

class SiteSettings {
  // 설정 조회 (항상 id=1)
  public static function get(): array|false {
    $pdo = Database::getInstance();
    $stmt = $pdo->query('SELECT * FROM site_settings WHERE id = 1');
    return $stmt->fetch();
  }

  // 설정 수정
  public static function update(array $data): array|false {
    $pdo = Database::getInstance();
    $fields = [];
    $values = [];

    foreach (['site_name', 'logo_url', 'primary_color', 'secondary_color', 'background_color', 'gtm_code', 'home_slug', 'notice_enabled', 'notice_text', 'notice_color', 'site_url', 'robots_txt'] as $field) {
      if (array_key_exists($field, $data)) {
        $fields[] = "{$field} = ?";
        $values[] = $data[$field];
      }
    }

    if (!empty($fields)) {
      $pdo->prepare('UPDATE site_settings SET ' . implode(', ', $fields) . ' WHERE id = 1')->execute($values);
    }

    return self::get();
  }
}
