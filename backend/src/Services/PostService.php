<?php

namespace App\Services;

use App\Config\Database;
use App\Models\Board;
use App\Models\Post;
use App\Models\PostAttachment;
use App\Models\Tag;
use App\Utils\AdminLogger;
use App\Utils\PointHelper;
use App\Utils\ResponseHelper;

// 게시글 관련 비즈니스 로직 서비스
class PostService {
  // 인기 게시글 목록 조회
  public function popular(string $type, ?int $boardId, int $limit): array {
    $orderCol = $type === 'likes' ? 'p.like_count' : 'p.view_count';

    $where  = '';
    $params = [];
    if ($boardId !== null) {
      $where = 'WHERE p.board_id = ?';
      $params[] = $boardId;
    }

    $pdo = Database::getInstance();
    $sql = "SELECT p.id, p.title, p.view_count, p.like_count, p.created_at,
                   u.name AS author_name, b.id AS board_id, b.name AS board_name,
                   (SELECT COUNT(*) FROM comments c WHERE c.post_id = p.id) AS comment_count
            FROM posts p
            JOIN users u ON u.id = p.author_id
            JOIN boards b ON b.id = p.board_id
            {$where}
            ORDER BY {$orderCol} DESC
            LIMIT ?";
    $params[] = $limit;

    $stmt = $pdo->prepare($sql);
    $stmt->execute($params);

    return $stmt->fetchAll();
  }

  // 게시글 목록 조회 (게시판별, 페이지네이션, 필터, 태그)
  public function list(
    int $boardId,
    int $page,
    int $limit,
    string $search,
    string $sort,
    string $tag
  ): array {
    if ($tag !== '') {
      return Tag::findPostsByTag($tag, $boardId, $page, $limit);
    }
    return Post::findByBoard($boardId, $page, $limit, $search, $sort);
  }

  // 게시글 상세 조회 + 조회수 증가 + 부가 정보 병합
  public function show(int $id, ?int $viewerId): array {
    $post = Post::findById($id);
    if (!$post) {
      ResponseHelper::error('게시글을 찾을 수 없습니다.', 404);
    }

    // 조회수 증가 후 최신 데이터 반환
    Post::incrementViewCount($id);
    $post = Post::findById($id);

    // 좋아요 정보 병합
    $likeStatus = Post::getLikeStatus($id, $viewerId);
    $post['like_count'] = $likeStatus['like_count'];
    $post['liked']      = $likeStatus['liked'];

    // 이전/다음 게시글 정보 병합
    $adjacent = Post::getAdjacentPosts($id, (int) $post['board_id']);
    $post['prev_post'] = $adjacent['prev'];
    $post['next_post'] = $adjacent['next'];

    // 북마크 여부 체크
    $post['bookmarked'] = false;
    if ($viewerId !== null) {
      $pdo = Database::getInstance();
      $bmStmt = $pdo->prepare('SELECT COUNT(*) FROM post_bookmarks WHERE post_id = ? AND user_id = ?');
      $bmStmt->execute([$id, $viewerId]);
      $post['bookmarked'] = (int) $bmStmt->fetchColumn() > 0;
    }

    // 첨부파일 + 태그 목록 포함
    $post['attachments'] = PostAttachment::findByPost($id);
    $post['tags']        = Tag::findByPost($id);

    return $post;
  }

  // 게시글 생성 (유효성 검사 + 태그 + 포인트 적립)
  public function create(int $boardId, int $authorId, array $data): array {
    $title   = trim($data['title'] ?? '');
    $content = trim($data['content'] ?? '');

    if (empty($title)) {
      ResponseHelper::error('제목을 입력해주세요.', 422);
    }
    if (empty($content)) {
      ResponseHelper::error('내용을 입력해주세요.', 422);
    }

    $thumbnailUrl = trim($data['thumbnail_url'] ?? '') ?: null;
    $tagNames     = is_array($data['tags'] ?? null) ? $data['tags'] : [];

    $post   = Post::create($boardId, $authorId, $title, $content, $thumbnailUrl);
    $tagIds = Tag::upsertMany($tagNames);
    Tag::syncPost((int) $post['id'], $tagIds);
    $post['tags'] = Tag::findByPost((int) $post['id']);

    // 게시글 작성 포인트 적립
    try {
      PointHelper::earn($authorId, PointHelper::POINT_POST_CREATE, 'post_create', (int) $post['id']);
    } catch (\Throwable) {}

    return $post;
  }

  // 게시글 수정 (권한 검증 + 유효성 검사 + 태그 동기화)
  public function update(int $id, int $userId, bool $isAdmin, array $data): array {
    $post = Post::findById($id);
    if (!$post) {
      ResponseHelper::error('게시글을 찾을 수 없습니다.', 404);
    }

    // 작성자 또는 admin만 수정 가능
    if ((int) $post['author_id'] !== $userId && !$isAdmin) {
      ResponseHelper::error('수정 권한이 없습니다.', 403);
    }

    $title   = trim($data['title'] ?? '');
    $content = trim($data['content'] ?? '');

    if (empty($title)) {
      ResponseHelper::error('제목을 입력해주세요.', 422);
    }
    if (empty($content)) {
      ResponseHelper::error('내용을 입력해주세요.', 422);
    }

    $thumbnailUrl = array_key_exists('thumbnail_url', $data) ? ($data['thumbnail_url'] ?: null) : false;
    $tagNames     = is_array($data['tags'] ?? null) ? $data['tags'] : null;

    $updated = Post::update($id, $title, $content, $thumbnailUrl);

    // 태그가 전달된 경우에만 업데이트
    if ($tagNames !== null) {
      $tagIds = Tag::upsertMany($tagNames);
      Tag::syncPost($id, $tagIds);
    }
    $updated['tags'] = Tag::findByPost($id);

    return $updated;
  }

  // 게시글 삭제 (권한 검증)
  public function delete(int $id, int $userId, bool $isAdmin): void {
    $post = Post::findById($id);
    if (!$post) {
      ResponseHelper::error('게시글을 찾을 수 없습니다.', 404);
    }

    // 작성자 또는 admin만 삭제 가능
    if ((int) $post['author_id'] !== $userId && !$isAdmin) {
      ResponseHelper::error('삭제 권한이 없습니다.', 403);
    }

    Post::delete($id);
  }

  // 공지 토글
  public function toggleNotice(int $id): array {
    $post = Post::findById($id);
    if (!$post) {
      ResponseHelper::error('게시글을 찾을 수 없습니다.', 404);
    }

    return Post::toggleNotice($id);
  }

  // 좋아요 토글 (포인트 적립 포함)
  public function toggleLike(int $postId, int $userId): array {
    $post = Post::findById($postId);
    if (!$post) {
      ResponseHelper::error('게시글을 찾을 수 없습니다.', 404);
    }

    $result = Post::toggleLike($postId, $userId);

    // 좋아요 시 게시글 작성자에게 포인트 적립 (자기 자신 제외)
    if ($result['liked']) {
      try {
        $authorId = (int) $post['author_id'];
        if ($authorId !== $userId) {
          PointHelper::earn($authorId, PointHelper::POINT_LIKE_RECEIVED, 'like_received', $postId);
        }
      } catch (\Throwable) {}
    }

    return $result;
  }

  // 북마크 토글
  public function toggleBookmark(int $postId, int $userId): array {
    $post = Post::findById($postId);
    if (!$post) {
      ResponseHelper::error('게시글을 찾을 수 없습니다.', 404);
    }

    $pdo = Database::getInstance();
    $check = $pdo->prepare('SELECT id FROM post_bookmarks WHERE post_id = ? AND user_id = ?');
    $check->execute([$postId, $userId]);

    if ($check->fetch()) {
      $pdo->prepare('DELETE FROM post_bookmarks WHERE post_id = ? AND user_id = ?')
        ->execute([$postId, $userId]);
      return ['bookmarked' => false];
    }

    $pdo->prepare('INSERT INTO post_bookmarks (post_id, user_id) VALUES (?, ?)')
      ->execute([$postId, $userId]);
    return ['bookmarked' => true];
  }

  // 게시판 읽기 권한 검증
  public function checkReadPermission(array $board, ?object $payload): void {
    if ($board['read_permission'] === 'admin_only') {
      if (!$payload || $payload->role !== 'admin') {
        ResponseHelper::error('접근 권한이 없습니다.', 403);
      }
    } elseif ($board['read_permission'] === 'user') {
      if (!$payload) {
        ResponseHelper::error('로그인이 필요합니다.', 401);
      }
    }
  }

  // 게시판 쓰기 권한 검증
  public function checkWritePermission(array $board, object $payload): void {
    if ($board['write_permission'] === 'admin_only' && $payload->role !== 'admin') {
      ResponseHelper::error('작성 권한이 없습니다.', 403);
    }
  }
}
