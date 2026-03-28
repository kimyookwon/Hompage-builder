<?php

namespace App\Controllers;

use App\Services\BoardService;
use App\Middleware\AuthMiddleware;
use App\Utils\AdminLogger;
use App\Utils\JwtHandler;
use App\Utils\ResponseHelper;

class BoardController {
  private BoardService $boardService;

  public function __construct() {
    $this->boardService = new BoardService();
  }

  // GET /api/boards -- 게시판 목록 (관리자: 전체, 그 외: 공개 게시판만)
  public function list(): void {
    $payload = null;
    $token = JwtHandler::extractFromHeader();
    if ($token) {
      try { $payload = JwtHandler::verify($token); } catch (\Exception) {}
    }

    $result = $this->boardService->list($payload);
    ResponseHelper::success($result);
  }

  // GET /api/boards/{id} -- 게시판 단일 조회 (공개 읽기 가능)
  public function show(string $id): void {
    $board = $this->boardService->show((int) $id);
    ResponseHelper::success($board);
  }

  // POST /api/boards -- 게시판 생성
  public function create(): void {
    $payload = AuthMiddleware::requireAdmin();

    $data = json_decode(file_get_contents('php://input'), true);
    $board = $this->boardService->create($data);

    AdminLogger::log(
      (int) $payload->sub,
      AdminLogger::getAdminName($payload),
      'create', 'board', (int) $board['id']
    );

    ResponseHelper::success($board, 201);
  }

  // PATCH /api/boards/{id} -- 게시판 수정
  public function update(string $id): void {
    $payload = AuthMiddleware::requireAdmin();

    $data = json_decode(file_get_contents('php://input'), true);
    $result = $this->boardService->update((int) $id, $data);

    AdminLogger::log(
      (int) $payload->sub,
      AdminLogger::getAdminName($payload),
      'update', 'board', (int) $id
    );

    ResponseHelper::success($result);
  }

  // PATCH /api/boards/{id}/move -- 순서 이동 (up/down)
  public function move(string $id): void {
    AuthMiddleware::requireAdmin();

    $data = json_decode(file_get_contents('php://input'), true);
    $direction = $data['direction'] ?? '';

    $result = $this->boardService->move((int) $id, $direction);
    ResponseHelper::success($result);
  }

  // DELETE /api/boards/{id} -- 게시판 삭제
  public function delete(string $id): void {
    $payload = AuthMiddleware::requireAdmin();

    $this->boardService->delete((int) $id);

    AdminLogger::log(
      (int) $payload->sub,
      AdminLogger::getAdminName($payload),
      'delete', 'board', (int) $id
    );

    ResponseHelper::success(['message' => '게시판이 삭제되었습니다.']);
  }
}
