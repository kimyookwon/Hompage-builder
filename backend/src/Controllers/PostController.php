<?php

namespace App\Controllers;

use App\Models\Board;
use App\Middleware\AuthMiddleware;
use App\Middleware\RateLimitMiddleware;
use App\Services\PostService;
use App\Utils\AdminLogger;
use App\Utils\ResponseHelper;

class PostController {
  private PostService $postService;

  public function __construct() {
    $this->postService = new PostService();
  }

  // GET /api/posts/popular -- 인기 게시글 목록
  public function popular(): void {
    try {
      $type    = in_array($_GET['type'] ?? '', ['views', 'likes']) ? $_GET['type'] : 'views';
      $boardId = !empty($_GET['board_id']) ? (int) $_GET['board_id'] : null;
      $limit   = min(20, max(1, (int) ($_GET['limit'] ?? 10)));

      $result = $this->postService->popular($type, $boardId, $limit);
      ResponseHelper::success($result);
    } catch (\Throwable $e) {
      ResponseHelper::error('인기 게시글 조회에 실패했습니다.', 500);
    }
  }

  // GET /api/boards/{id}/posts -- 게시글 목록
  public function list(string $boardId): void {
    $payload = null;
    $token = \App\Utils\JwtHandler::extractFromHeader();
    if ($token) {
      try { $payload = \App\Utils\JwtHandler::verify($token); } catch (\Exception) {}
    }

    $board = Board::findById((int) $boardId);
    if (!$board) ResponseHelper::error('게시판을 찾을 수 없습니다.', 404);

    // 읽기 권한 체크
    $this->postService->checkReadPermission($board, $payload);

    $page   = max(1, (int) ($_GET['page'] ?? 1));
    $limit  = min(100, max(1, (int) ($_GET['limit'] ?? 20)));
    $search = trim($_GET['search'] ?? '');
    $sort   = in_array($_GET['sort'] ?? '', ['latest', 'views', 'comments']) ? $_GET['sort'] : 'latest';
    $tag    = trim($_GET['tag'] ?? '');

    $result = $this->postService->list((int) $boardId, $page, $limit, $search, $sort, $tag);
    ResponseHelper::paginated($result['items'], $result['total'], $page, $limit);
  }

  // GET /api/posts/{id} -- 게시글 상세
  public function show(string $id): void {
    $payload = AuthMiddleware::tryAuth();

    // 게시판 읽기 권한 체크 (show 내부에서 post를 조회하므로 별도 처리)
    $post = \App\Models\Post::findById((int) $id);
    if ($post) {
      $board = Board::findById((int) $post['board_id']);
      if ($board) {
        $this->postService->checkReadPermission($board, $payload);
      }
    }

    $viewerId = $payload ? (int) $payload->sub : null;
    $result = $this->postService->show((int) $id, $viewerId);
    ResponseHelper::success($result);
  }

  // POST /api/boards/{id}/posts -- 게시글 작성
  public function create(string $boardId): void {
    $payload = AuthMiddleware::require();

    // 사용자당 게시글 작성: 10회/시간
    RateLimitMiddleware::check(RateLimitMiddleware::userKey('post_create', (int) $payload->sub), 10, 3600);
    RateLimitMiddleware::hit(RateLimitMiddleware::userKey('post_create', (int) $payload->sub), 3600);

    $board = Board::findById((int) $boardId);
    if (!$board) ResponseHelper::error('게시판을 찾을 수 없습니다.', 404);

    // 쓰기 권한 체크
    $this->postService->checkWritePermission($board, $payload);

    $data = json_decode(file_get_contents('php://input'), true);
    $post = $this->postService->create((int) $boardId, (int) $payload->sub, $data);
    ResponseHelper::success($post, 201);
  }

  // PATCH /api/posts/{id} -- 게시글 수정
  public function update(string $id): void {
    $payload = AuthMiddleware::require();

    $data = json_decode(file_get_contents('php://input'), true);
    $updated = $this->postService->update(
      (int) $id,
      (int) $payload->sub,
      $payload->role === 'admin',
      $data
    );
    ResponseHelper::success($updated);
  }

  // POST /api/posts/{id}/like -- 좋아요 토글 (로그인 필요)
  public function like(string $id): void {
    $payload = AuthMiddleware::require();

    $result = $this->postService->toggleLike((int) $id, (int) $payload->sub);
    ResponseHelper::success($result);
  }

  // PATCH /api/posts/{id}/notice -- 공지 토글 (admin만)
  public function toggleNotice(string $id): void {
    $payload = AuthMiddleware::requireAdmin();

    $result = $this->postService->toggleNotice((int) $id);

    AdminLogger::log(
      (int) $payload->sub,
      AdminLogger::getAdminName($payload),
      'toggle_notice', 'post', (int) $id
    );

    ResponseHelper::success($result);
  }

  // DELETE /api/posts/{id} -- 게시글 삭제
  public function delete(string $id): void {
    $payload = AuthMiddleware::require();

    $this->postService->delete((int) $id, (int) $payload->sub, $payload->role === 'admin');

    // 관리자가 삭제한 경우 로그 기록
    if ($payload->role === 'admin') {
      AdminLogger::log(
        (int) $payload->sub,
        AdminLogger::getAdminName($payload),
        'delete', 'post', (int) $id
      );
    }

    ResponseHelper::success(['message' => '게시글이 삭제되었습니다.']);
  }

  // POST /api/posts/{id}/bookmark -- 북마크 토글
  public function bookmark(string $id): void {
    $payload = AuthMiddleware::require();

    $result = $this->postService->toggleBookmark((int) $id, (int) $payload->sub);
    ResponseHelper::success($result);
  }
}
