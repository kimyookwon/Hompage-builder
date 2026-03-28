<?php

namespace App\Controllers;

use App\Models\Board;
use App\Middleware\AuthMiddleware;
use App\Utils\ResponseHelper;

class BoardController {
  // GET /api/boards — 게시판 목록 (관리자: 전체, 그 외: 공개 게시판만)
  public function list(): void {
    $payload = null;
    $token = \App\Utils\JwtHandler::extractFromHeader();
    if ($token) {
      try { $payload = \App\Utils\JwtHandler::verify($token); } catch (\Exception) {}
    }

    if ($payload && $payload->role === 'admin') {
      ResponseHelper::success(Board::findAll());
    } else {
      ResponseHelper::success(Board::findPublic());
    }
  }

  // GET /api/boards/{id} — 게시판 단일 조회 (공개 읽기 가능)
  public function show(string $id): void {
    $board = Board::findById((int) $id);
    if (!$board) ResponseHelper::error('게시판을 찾을 수 없습니다.', 404);
    ResponseHelper::success($board);
  }

  // POST /api/boards — 게시판 생성
  public function create(): void {
    AuthMiddleware::requireAdmin();

    $data = json_decode(file_get_contents('php://input'), true);
    $name = trim($data['name'] ?? '');
    $type = $data['type'] ?? 'general';
    $readPermission = $data['read_permission'] ?? 'user';
    $writePermission = $data['write_permission'] ?? 'user';
    $description = isset($data['description']) ? trim($data['description']) : null;

    if (empty($name)) ResponseHelper::error('게시판 이름을 입력해주세요.', 422);
    if (!in_array($type, ['general', 'gallery'])) ResponseHelper::error('유효하지 않은 타입입니다.', 422);
    if (!in_array($readPermission, ['admin_only', 'user', 'public'])) ResponseHelper::error('유효하지 않은 읽기 권한입니다.', 422);
    if (!in_array($writePermission, ['admin_only', 'user'])) ResponseHelper::error('유효하지 않은 쓰기 권한입니다.', 422);

    ResponseHelper::success(Board::create($name, $type, $readPermission, $writePermission, $description ?: null), 201);
  }

  // PATCH /api/boards/{id} — 게시판 수정
  public function update(string $id): void {
    AuthMiddleware::requireAdmin();

    $board = Board::findById((int) $id);
    if (!$board) ResponseHelper::error('게시판을 찾을 수 없습니다.', 404);

    $data = json_decode(file_get_contents('php://input'), true);
    ResponseHelper::success(Board::update((int) $id, $data));
  }

  // PATCH /api/boards/{id}/move — 순서 이동 (up/down)
  public function move(string $id): void {
    AuthMiddleware::requireAdmin();

    $board = Board::findById((int) $id);
    if (!$board) ResponseHelper::error('게시판을 찾을 수 없습니다.', 404);

    $data = json_decode(file_get_contents('php://input'), true);
    $direction = $data['direction'] ?? '';
    if (!in_array($direction, ['up', 'down'])) {
      ResponseHelper::error('direction은 up 또는 down이어야 합니다.', 422);
    }

    Board::move((int) $id, $direction);
    ResponseHelper::success(Board::findAll());
  }

  // DELETE /api/boards/{id} — 게시판 삭제
  public function delete(string $id): void {
    AuthMiddleware::requireAdmin();

    $board = Board::findById((int) $id);
    if (!$board) ResponseHelper::error('게시판을 찾을 수 없습니다.', 404);

    Board::delete((int) $id);
    ResponseHelper::success(['message' => '게시판이 삭제되었습니다.']);
  }
}
