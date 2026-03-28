<?php

namespace App\Controllers;

use App\Models\Board;
use App\Models\Post;
use App\Models\PostAttachment;
use App\Models\Tag;
use App\Middleware\AuthMiddleware;
use App\Utils\ResponseHelper;

class PostController {
  // GET /api/boards/{id}/posts — 게시글 목록
  public function list(string $boardId): void {
    $payload = null;
    $token = \App\Utils\JwtHandler::extractFromHeader();
    if ($token) {
      try { $payload = \App\Utils\JwtHandler::verify($token); } catch (\Exception) {}
    }

    $board = Board::findById((int) $boardId);
    if (!$board) ResponseHelper::error('게시판을 찾을 수 없습니다.', 404);

    // 읽기 권한 체크
    if ($board['read_permission'] === 'admin_only') {
      if (!$payload || $payload->role !== 'admin') ResponseHelper::error('접근 권한이 없습니다.', 403);
    } elseif ($board['read_permission'] === 'user') {
      if (!$payload) ResponseHelper::error('로그인이 필요합니다.', 401);
    }

    $page  = max(1, (int) ($_GET['page'] ?? 1));
    $limit = min(100, max(1, (int) ($_GET['limit'] ?? 20)));
    $search = trim($_GET['search'] ?? '');
    $sort  = in_array($_GET['sort'] ?? '', ['latest', 'views', 'comments']) ? $_GET['sort'] : 'latest';
    $tag   = trim($_GET['tag'] ?? '');

    // 태그 필터
    if ($tag !== '') {
      $result = Tag::findPostsByTag($tag, (int) $boardId, $page, $limit);
    } else {
      $result = Post::findByBoard((int) $boardId, $page, $limit, $search, $sort);
    }
    ResponseHelper::paginated($result['items'], $result['total'], $page, $limit);
  }

  // GET /api/posts/{id} — 게시글 상세
  public function show(string $id): void {
    $post = Post::findById((int) $id);
    if (!$post) ResponseHelper::error('게시글을 찾을 수 없습니다.', 404);

    $board = Board::findById((int) $post['board_id']);
    $payload = AuthMiddleware::tryAuth();

    if ($board['read_permission'] === 'admin_only' && (!$payload || $payload->role !== 'admin')) {
      ResponseHelper::error('접근 권한이 없습니다.', 403);
    }
    if ($board['read_permission'] === 'user' && !$payload) {
      ResponseHelper::error('로그인이 필요합니다.', 401);
    }

    // 조회수 증가 후 최신 데이터 반환
    Post::incrementViewCount((int) $id);
    $post = Post::findById((int) $id);

    // 좋아요 정보 병합
    $likeStatus = Post::getLikeStatus((int) $id, $payload ? (int) $payload->sub : null);
    $post['like_count'] = $likeStatus['like_count'];
    $post['liked']      = $likeStatus['liked'];

    // 이전/다음 게시글 정보 병합
    $adjacent = Post::getAdjacentPosts((int) $id, (int) $post['board_id']);
    $post['prev_post'] = $adjacent['prev'];
    $post['next_post'] = $adjacent['next'];

    // 북마크 여부 체크
    $post['bookmarked'] = false;
    if ($payload) {
      $pdo = \App\Config\Database::getInstance();
      $bmStmt = $pdo->prepare('SELECT COUNT(*) FROM post_bookmarks WHERE post_id = ? AND user_id = ?');
      $bmStmt->execute([(int) $id, (int) $payload->sub]);
      $post['bookmarked'] = (int) $bmStmt->fetchColumn() > 0;
    }

    // 첨부파일 + 태그 목록 포함
    $post['attachments'] = PostAttachment::findByPost((int) $id);
    $post['tags']        = Tag::findByPost((int) $id);

    ResponseHelper::success($post);
  }

  // POST /api/boards/{id}/posts — 게시글 작성
  public function create(string $boardId): void {
    $payload = AuthMiddleware::require();

    $board = Board::findById((int) $boardId);
    if (!$board) ResponseHelper::error('게시판을 찾을 수 없습니다.', 404);

    // 쓰기 권한 체크
    if ($board['write_permission'] === 'admin_only' && $payload->role !== 'admin') {
      ResponseHelper::error('작성 권한이 없습니다.', 403);
    }

    $data = json_decode(file_get_contents('php://input'), true);
    $title = trim($data['title'] ?? '');
    $content = trim($data['content'] ?? '');

    if (empty($title)) ResponseHelper::error('제목을 입력해주세요.', 422);
    if (empty($content)) ResponseHelper::error('내용을 입력해주세요.', 422);

    $thumbnailUrl = trim($data['thumbnail_url'] ?? '') ?: null;
    $tagNames     = is_array($data['tags'] ?? null) ? $data['tags'] : [];

    $post   = Post::create((int) $boardId, (int) $payload->sub, $title, $content, $thumbnailUrl);
    $tagIds = Tag::upsertMany($tagNames);
    Tag::syncPost((int) $post['id'], $tagIds);
    $post['tags'] = Tag::findByPost((int) $post['id']);

    ResponseHelper::success($post, 201);
  }

  // PATCH /api/posts/{id} — 게시글 수정
  public function update(string $id): void {
    $payload = AuthMiddleware::require();

    $post = Post::findById((int) $id);
    if (!$post) ResponseHelper::error('게시글을 찾을 수 없습니다.', 404);

    // 작성자 또는 admin만 수정 가능
    if ((int) $post['author_id'] !== (int) $payload->sub && $payload->role !== 'admin') {
      ResponseHelper::error('수정 권한이 없습니다.', 403);
    }

    $data = json_decode(file_get_contents('php://input'), true);
    $title = trim($data['title'] ?? '');
    $content = trim($data['content'] ?? '');

    if (empty($title)) ResponseHelper::error('제목을 입력해주세요.', 422);
    if (empty($content)) ResponseHelper::error('내용을 입력해주세요.', 422);

    $thumbnailUrl = array_key_exists('thumbnail_url', $data) ? ($data['thumbnail_url'] ?: null) : false;
    $tagNames     = is_array($data['tags'] ?? null) ? $data['tags'] : null;

    $updated = Post::update((int) $id, $title, $content, $thumbnailUrl);

    // 태그가 전달된 경우에만 업데이트
    if ($tagNames !== null) {
      $tagIds = Tag::upsertMany($tagNames);
      Tag::syncPost((int) $id, $tagIds);
    }
    $updated['tags'] = Tag::findByPost((int) $id);

    ResponseHelper::success($updated);
  }

  // POST /api/posts/{id}/like — 좋아요 토글 (로그인 필요)
  public function like(string $id): void {
    $payload = AuthMiddleware::require();

    $post = Post::findById((int) $id);
    if (!$post) ResponseHelper::error('게시글을 찾을 수 없습니다.', 404);

    $result = Post::toggleLike((int) $id, (int) $payload->sub);
    ResponseHelper::success($result);
  }

  // PATCH /api/posts/{id}/notice — 공지 토글 (admin만)
  public function toggleNotice(string $id): void {
    $payload = AuthMiddleware::requireAdmin();

    $post = Post::findById((int) $id);
    if (!$post) ResponseHelper::error('게시글을 찾을 수 없습니다.', 404);

    ResponseHelper::success(Post::toggleNotice((int) $id));
  }

  // DELETE /api/posts/{id} — 게시글 삭제
  public function delete(string $id): void {
    $payload = AuthMiddleware::require();

    $post = Post::findById((int) $id);
    if (!$post) ResponseHelper::error('게시글을 찾을 수 없습니다.', 404);

    // 작성자 또는 admin만 삭제 가능
    if ((int) $post['author_id'] !== (int) $payload->sub && $payload->role !== 'admin') {
      ResponseHelper::error('삭제 권한이 없습니다.', 403);
    }

    Post::delete((int) $id);
    ResponseHelper::success(['message' => '게시글이 삭제되었습니다.']);
  }

  // POST /api/posts/{id}/bookmark — 북마크 토글
  public function bookmark(string $id): void {
    $payload = AuthMiddleware::require();

    $post = Post::findById((int) $id);
    if (!$post) ResponseHelper::error('게시글을 찾을 수 없습니다.', 404);

    $pdo = \App\Config\Database::getInstance();
    $check = $pdo->prepare('SELECT id FROM post_bookmarks WHERE post_id = ? AND user_id = ?');
    $check->execute([(int) $id, (int) $payload->sub]);

    if ($check->fetch()) {
      $pdo->prepare('DELETE FROM post_bookmarks WHERE post_id = ? AND user_id = ?')
          ->execute([(int) $id, (int) $payload->sub]);
      ResponseHelper::success(['bookmarked' => false]);
    } else {
      $pdo->prepare('INSERT INTO post_bookmarks (post_id, user_id) VALUES (?, ?)')
          ->execute([(int) $id, (int) $payload->sub]);
      ResponseHelper::success(['bookmarked' => true]);
    }
  }
}
