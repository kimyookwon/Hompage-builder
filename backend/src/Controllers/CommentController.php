<?php

namespace App\Controllers;

use App\Middleware\AuthMiddleware;
use App\Middleware\RateLimitMiddleware;
use App\Services\CommentService;
use App\Utils\ResponseHelper;

class CommentController {
  private CommentService $commentService;

  public function __construct() {
    $this->commentService = new CommentService();
  }

  // GET /api/posts/{id}/comments -- 댓글 목록
  public function list(string $postId): void {
    $comments = $this->commentService->list((int) $postId);
    ResponseHelper::success($comments);
  }

  // POST /api/posts/{id}/comments -- 댓글 작성 (로그인 필요)
  public function create(string $postId): void {
    $payload = AuthMiddleware::require();

    // 사용자당 댓글 작성: 30회/시간
    RateLimitMiddleware::check(RateLimitMiddleware::userKey('comment_create', (int) $payload->sub), 30, 3600);
    RateLimitMiddleware::hit(RateLimitMiddleware::userKey('comment_create', (int) $payload->sub), 3600);

    $data = json_decode(file_get_contents('php://input'), true);
    $comment = $this->commentService->create((int) $postId, (int) $payload->sub, $data);
    ResponseHelper::success($comment, 201);
  }

  // GET /api/admin/comments -- 전체 댓글 목록 (관리자 전용)
  public function adminList(): void {
    AuthMiddleware::requireAdmin();

    $page   = max(1, (int) ($_GET['page']  ?? 1));
    $limit  = min(100, max(1, (int) ($_GET['limit'] ?? 20)));
    $search = trim($_GET['search'] ?? '');

    $result = $this->commentService->adminList($page, $limit, $search);
    ResponseHelper::paginated($result['items'], $result['total'], $page, $limit);
  }

  // PATCH /api/comments/{id} -- 댓글 수정 (작성자만)
  public function update(string $id): void {
    $payload = AuthMiddleware::require();

    $data = json_decode(file_get_contents('php://input'), true);
    $updated = $this->commentService->update(
      (int) $id,
      (int) $payload->sub,
      $payload->role === 'admin',
      $data
    );
    ResponseHelper::success($updated);
  }

  // DELETE /api/comments/{id} -- 댓글 삭제
  public function delete(string $id): void {
    $payload = AuthMiddleware::require();

    $this->commentService->delete((int) $id, (int) $payload->sub, $payload->role === 'admin');
    ResponseHelper::success(['message' => '댓글이 삭제되었습니다.']);
  }
}
