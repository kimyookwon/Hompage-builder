<?php

namespace App\Controllers;

use App\Models\Post;
use App\Models\Comment;
use App\Models\Notification;
use App\Middleware\AuthMiddleware;
use App\Services\EmailService;
use App\Utils\PointHelper;
use App\Utils\ResponseHelper;

class CommentController {
  // GET /api/posts/{id}/comments — 댓글 목록
  public function list(string $postId): void {
    if (!Post::findById((int) $postId)) ResponseHelper::error('게시글을 찾을 수 없습니다.', 404);
    ResponseHelper::success(Comment::findByPost((int) $postId));
  }

  // POST /api/posts/{id}/comments — 댓글 작성 (로그인 필요)
  public function create(string $postId): void {
    $payload = AuthMiddleware::require();

    $post = Post::findById((int) $postId);
    if (!$post) ResponseHelper::error('게시글을 찾을 수 없습니다.', 404);

    $data = json_decode(file_get_contents('php://input'), true);
    $content = trim($data['content'] ?? '');
    if (empty($content)) ResponseHelper::error('댓글 내용을 입력해주세요.', 422);

    // 대댓글: parent_id 검증 (같은 게시글, 최상위 댓글만 허용)
    $parentId = isset($data['parent_id']) ? (int) $data['parent_id'] : null;
    $parent   = null;
    if ($parentId !== null) {
      $parent = Comment::findById($parentId);
      if (!$parent || (int) $parent['post_id'] !== (int) $postId) {
        ResponseHelper::error('잘못된 부모 댓글입니다.', 422);
      }
      if (!empty($parent['parent_id'])) {
        ResponseHelper::error('대댓글에는 답글을 달 수 없습니다.', 422);
      }
    }

    $comment   = Comment::create((int) $postId, (int) $payload->sub, $content, $parentId);

    // 댓글 작성 포인트 적립
    try {
      PointHelper::earn((int) $payload->sub, PointHelper::POINT_COMMENT, 'comment_create', (int) $comment['id']);
    } catch (\Throwable) {}

    $actorName = $comment['author_name'] ?? '누군가';
    $boardId   = (int) ($post['board_id'] ?? 0);
    $postTitle = $post['title'] ?? '';

    // 알림 발송 (비동기 처리 없이 동기 — 실패해도 응답에 영향 없음)
    try {
      $actorId = (int) $payload->sub;

      // 사이트 URL (이메일 링크용)
      $siteUrl   = rtrim($_ENV['SITE_URL'] ?? '', '/');
      $postUrl   = "{$siteUrl}/b/{$boardId}/{$postId}";

      if ($parentId !== null && $parent !== null) {
        // 대댓글 — 부모 댓글 작성자에게 알림 (자기 자신 제외)
        $parentAuthorId = (int) $parent['author_id'];
        if ($parentAuthorId !== $actorId) {
          Notification::create(
            $parentAuthorId, 'reply_to_comment',
            (int) $postId, $boardId, $postTitle, $actorName, (int) $comment['id']
          );
          // 이메일 알림 (부모 댓글 작성자 이메일 조회)
          $parentWithEmail = Comment::findByIdWithEmail($parentId);
          if ($parentWithEmail && !empty($parentWithEmail['author_email'])) {
            EmailService::sendReplyNotification(
              $parentWithEmail['author_email'],
              $parentWithEmail['author_name'],
              $postTitle, $actorName,
              mb_substr($content, 0, 200),
              $postUrl
            );
          }
        }
      } else {
        // 최상위 댓글 — 게시글 작성자에게 알림 (자기 자신 제외)
        $postAuthorId = (int) $post['author_id'];
        if ($postAuthorId !== $actorId) {
          Notification::create(
            $postAuthorId, 'comment_on_post',
            (int) $postId, $boardId, $postTitle, $actorName, (int) $comment['id']
          );
          // 이메일 알림 (게시글 작성자 이메일)
          if (!empty($post['author_email'])) {
            EmailService::sendCommentNotification(
              $post['author_email'],
              $post['author_name'],
              $postTitle, $actorName,
              mb_substr($content, 0, 200),
              $postUrl
            );
          }
        }
      }
    } catch (\Throwable) {
      // 알림 실패는 조용히 무시
    }

    ResponseHelper::success($comment, 201);
  }

  // GET /api/admin/comments — 전체 댓글 목록 (관리자 전용)
  public function adminList(): void {
    AuthMiddleware::requireAdmin();

    $page   = max(1, (int) ($_GET['page']  ?? 1));
    $limit  = min(100, max(1, (int) ($_GET['limit'] ?? 20)));
    $search = trim($_GET['search'] ?? '');
    $result = Comment::findAll($page, $limit, $search);
    ResponseHelper::paginated($result['items'], $result['total'], $page, $limit);
  }

  // PATCH /api/comments/{id} — 댓글 수정 (작성자만)
  public function update(string $id): void {
    $payload = AuthMiddleware::require();

    $comment = Comment::findById((int) $id);
    if (!$comment) ResponseHelper::error('댓글을 찾을 수 없습니다.', 404);

    // 작성자만 수정 가능
    if ((int) $comment['author_id'] !== (int) $payload->sub) {
      ResponseHelper::error('수정 권한이 없습니다.', 403);
    }

    $data = json_decode(file_get_contents('php://input'), true);
    $content = trim($data['content'] ?? '');
    if (empty($content)) ResponseHelper::error('댓글 내용을 입력해주세요.', 422);

    ResponseHelper::success(Comment::update((int) $id, $content));
  }

  // DELETE /api/comments/{id} — 댓글 삭제
  public function delete(string $id): void {
    $payload = AuthMiddleware::require();

    $comment = Comment::findById((int) $id);
    if (!$comment) ResponseHelper::error('댓글을 찾을 수 없습니다.', 404);

    // 작성자 또는 admin만 삭제 가능
    if ((int) $comment['author_id'] !== (int) $payload->sub && $payload->role !== 'admin') {
      ResponseHelper::error('삭제 권한이 없습니다.', 403);
    }

    Comment::delete((int) $id);
    ResponseHelper::success(['message' => '댓글이 삭제되었습니다.']);
  }
}
