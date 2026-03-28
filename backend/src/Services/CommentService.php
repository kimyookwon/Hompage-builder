<?php

namespace App\Services;

use App\Models\Comment;
use App\Models\Notification;
use App\Models\Post;
use App\Services\EmailService;
use App\Utils\PointHelper;
use App\Utils\ResponseHelper;

// 댓글 관련 비즈니스 로직 서비스
class CommentService {
  // 댓글 목록 조회
  public function list(int $postId): array {
    $post = Post::findById($postId);
    if (!$post) {
      ResponseHelper::error('게시글을 찾을 수 없습니다.', 404);
    }

    return Comment::findByPost($postId);
  }

  // 전체 댓글 목록 (관리자용, 페이지네이션)
  public function adminList(int $page, int $limit, string $search): array {
    return Comment::findAll($page, $limit, $search);
  }

  // 댓글 생성 (대댓글 검증 + 포인트 + 알림 + 이메일)
  public function create(int $postId, int $authorId, array $data): array {
    $post = Post::findById($postId);
    if (!$post) {
      ResponseHelper::error('게시글을 찾을 수 없습니다.', 404);
    }

    $content = trim($data['content'] ?? '');
    if (empty($content)) {
      ResponseHelper::error('댓글 내용을 입력해주세요.', 422);
    }

    // 대댓글: parent_id 검증 (같은 게시글, 최상위 댓글만 허용)
    $parentId = isset($data['parent_id']) ? (int) $data['parent_id'] : null;
    $parent   = null;
    if ($parentId !== null) {
      $parent = Comment::findById($parentId);
      if (!$parent || (int) $parent['post_id'] !== $postId) {
        ResponseHelper::error('잘못된 부모 댓글입니다.', 422);
      }
      if (!empty($parent['parent_id'])) {
        ResponseHelper::error('대댓글에는 답글을 달 수 없습니다.', 422);
      }
    }

    $comment = Comment::create($postId, $authorId, $content, $parentId);

    // 댓글 작성 포인트 적립
    try {
      PointHelper::earn($authorId, PointHelper::POINT_COMMENT, 'comment_create', (int) $comment['id']);
    } catch (\Throwable) {}

    // 알림 발송 (실패해도 응답에 영향 없음)
    $this->sendNotifications($comment, $post, $parent, $authorId, $content, $postId);

    return $comment;
  }

  // 댓글 수정 (작성자만 허용)
  public function update(int $id, int $userId, bool $isAdmin, array $data): array {
    $comment = Comment::findById($id);
    if (!$comment) {
      ResponseHelper::error('댓글을 찾을 수 없습니다.', 404);
    }

    // 작성자만 수정 가능
    if ((int) $comment['author_id'] !== $userId) {
      ResponseHelper::error('수정 권한이 없습니다.', 403);
    }

    $content = trim($data['content'] ?? '');
    if (empty($content)) {
      ResponseHelper::error('댓글 내용을 입력해주세요.', 422);
    }

    return Comment::update($id, $content);
  }

  // 댓글 삭제 (작성자 또는 admin)
  public function delete(int $id, int $userId, bool $isAdmin): void {
    $comment = Comment::findById($id);
    if (!$comment) {
      ResponseHelper::error('댓글을 찾을 수 없습니다.', 404);
    }

    // 작성자 또는 admin만 삭제 가능
    if ((int) $comment['author_id'] !== $userId && !$isAdmin) {
      ResponseHelper::error('삭제 권한이 없습니다.', 403);
    }

    Comment::delete($id);
  }

  // 알림 발송 (인앱 + 이메일)
  private function sendNotifications(
    array $comment,
    array $post,
    ?array $parent,
    int $actorId,
    string $content,
    int $postId
  ): void {
    try {
      $actorName = $comment['author_name'] ?? '누군가';
      $boardId   = (int) ($post['board_id'] ?? 0);
      $postTitle = $post['title'] ?? '';

      // 사이트 URL (이메일 링크용)
      $siteUrl = rtrim($_ENV['SITE_URL'] ?? '', '/');
      $postUrl = "{$siteUrl}/b/{$boardId}/{$postId}";

      $parentId = isset($comment['parent_id']) ? (int) $comment['parent_id'] : null;

      if ($parentId !== null && $parent !== null) {
        // 대댓글 -- 부모 댓글 작성자에게 알림 (자기 자신 제외)
        $parentAuthorId = (int) $parent['author_id'];
        if ($parentAuthorId !== $actorId) {
          Notification::create(
            $parentAuthorId, 'reply_to_comment',
            $postId, $boardId, $postTitle, $actorName, (int) $comment['id']
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
        // 최상위 댓글 -- 게시글 작성자에게 알림 (자기 자신 제외)
        $postAuthorId = (int) $post['author_id'];
        if ($postAuthorId !== $actorId) {
          Notification::create(
            $postAuthorId, 'comment_on_post',
            $postId, $boardId, $postTitle, $actorName, (int) $comment['id']
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
  }
}
