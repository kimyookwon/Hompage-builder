<?php

namespace App\Services;

use App\Models\Board;
use App\Utils\JwtHandler;
use App\Utils\ResponseHelper;

class BoardService {
  // 게시판 목록 (관리자: 전체, 그 외: 공개 게시판만)
  public function list(?object $payload): array {
    if ($payload && $payload->role === 'admin') {
      return Board::findAll();
    }
    return Board::findPublic();
  }

  // 게시판 단일 조회
  public function show(int $id): array|false {
    $board = Board::findById($id);
    if (!$board) {
      ResponseHelper::error('게시판을 찾을 수 없습니다.', 404);
    }
    return $board;
  }

  // 게시판 생성
  public function create(array $data): array {
    $name = trim($data['name'] ?? '');
    $type = $data['type'] ?? 'general';
    $readPermission = $data['read_permission'] ?? 'user';
    $writePermission = $data['write_permission'] ?? 'user';
    $description = isset($data['description']) ? trim($data['description']) : null;

    // 입력값 검증
    if (empty($name)) {
      ResponseHelper::error('게시판 이름을 입력해주세요.', 422);
    }
    if (!in_array($type, ['general', 'gallery'])) {
      ResponseHelper::error('유효하지 않은 타입입니다.', 422);
    }
    if (!in_array($readPermission, ['admin_only', 'user', 'public'])) {
      ResponseHelper::error('유효하지 않은 읽기 권한입니다.', 422);
    }
    if (!in_array($writePermission, ['admin_only', 'user'])) {
      ResponseHelper::error('유효하지 않은 쓰기 권한입니다.', 422);
    }

    return Board::create($name, $type, $readPermission, $writePermission, $description ?: null);
  }

  // 게시판 수정
  public function update(int $id, array $data): array|false {
    $board = Board::findById($id);
    if (!$board) {
      ResponseHelper::error('게시판을 찾을 수 없습니다.', 404);
    }

    return Board::update($id, $data);
  }

  // 게시판 삭제
  public function delete(int $id): void {
    $board = Board::findById($id);
    if (!$board) {
      ResponseHelper::error('게시판을 찾을 수 없습니다.', 404);
    }

    Board::delete($id);
  }

  // 게시판 순서 이동 (up/down)
  public function move(int $id, string $direction): array {
    $board = Board::findById($id);
    if (!$board) {
      ResponseHelper::error('게시판을 찾을 수 없습니다.', 404);
    }

    if (!in_array($direction, ['up', 'down'])) {
      ResponseHelper::error('direction은 up 또는 down이어야 합니다.', 422);
    }

    Board::move($id, $direction);
    return Board::findAll();
  }
}
