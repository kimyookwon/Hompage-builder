<?php

/**
 * 공개 게시판 라우터
 * Nginx에서 /boards/* 요청을 이 파일로 라우팅
 *
 * 경로 패턴:
 *   GET  /boards/{boardId}                  → 게시글 목록
 *   GET  /boards/{boardId}/posts/{postId}    → 게시글 상세
 *   POST /boards/{boardId}/posts/{postId}/comments → 댓글 작성
 */

define('BASE_PATH', dirname(__DIR__, 2));

require BASE_PATH . '/vendor/autoload.php';

use Dotenv\Dotenv;

$dotenv = Dotenv::createImmutable(BASE_PATH);
$dotenv->safeLoad();

header('Content-Type: text/html; charset=UTF-8');

// 초기 테마 적용 방지 깜빡임 (헤더 삽입 시 PHP에서 처리)
require BASE_PATH . '/config/database.php';

use App\Models\Board;
use App\Models\Post;
use App\Models\Comment;
use App\Models\SiteSettings;
use App\Utils\JwtHandler;

// URI 파싱
$uri    = parse_url($_SERVER['REQUEST_URI'] ?? '/', PHP_URL_PATH);
$method = $_SERVER['REQUEST_METHOD'] ?? 'GET';

// 패턴 매칭
// /boards/{boardId}
// /boards/{boardId}/posts/{postId}
// /boards/{boardId}/posts/{postId}/comments
preg_match('#^/boards/(\d+)(?:/posts/(\d+)(?:/comments)?)?/?$#', $uri ?? '', $matches);

$boardId = isset($matches[1]) ? (int) $matches[1] : null;
$postId  = isset($matches[2]) ? (int) $matches[2] : null;
$isComment = str_ends_with(rtrim($uri ?? '', '/'), '/comments');

if (!$boardId) {
  http_response_code(404);
  echo '<h1>404 - 페이지를 찾을 수 없습니다</h1>';
  exit;
}

// 사이트 설정
$settings = SiteSettings::get() ?? [];

// 게시판 조회
$board = Board::findById($boardId);
if (!$board) {
  http_response_code(404);
  echo '<h1>404 - 게시판을 찾을 수 없습니다</h1>';
  exit;
}

// 로그인 상태 확인 (JWT 쿠키 또는 세션)
$isLoggedIn  = false;
$currentUser = null;

$token = $_COOKIE['token'] ?? $_SERVER['HTTP_AUTHORIZATION'] ?? '';
$token = ltrim($token, 'Bearer ');
if ($token) {
  try {
    $payload = JwtHandler::verify($token);
    $isLoggedIn  = true;
    $currentUser = $payload;
  } catch (\Exception $e) {
    // 토큰 만료/무효 → 비로그인 처리
  }
}

// 읽기 권한 체크
$readPermission = $board['read_permission'] ?? 'public';
if ($readPermission === 'admin_only' && (!$isLoggedIn || ($currentUser->role ?? '') !== 'admin')) {
  http_response_code(403);
  echo '<h1>접근 권한이 없습니다.</h1>';
  exit;
}
if ($readPermission === 'user' && !$isLoggedIn) {
  http_response_code(403);
  header('Location: /login?redirect=' . urlencode($_SERVER['REQUEST_URI'] ?? '/'));
  exit;
}

// 쓰기/댓글 권한
$writePermission = $board['write_permission'] ?? 'user';
$canWrite = $isLoggedIn && ($writePermission === 'user' || ($currentUser->role ?? '') === 'admin');

// 댓글 작성 처리 (POST)
if ($method === 'POST' && $isComment && $postId) {
  if (!$canWrite) {
    http_response_code(403);
    echo '권한이 없습니다.';
    exit;
  }

  $content = trim($_POST['content'] ?? '');
  if (empty($content)) {
    http_response_code(422);
    echo '댓글 내용을 입력해주세요.';
    exit;
  }

  Comment::create($postId, (int) ($currentUser->sub ?? 0), $content);
  header('Location: /boards/' . $boardId . '/posts/' . $postId);
  exit;
}

// 게시글 상세
if ($postId) {
  $post = Post::findById($postId);
  if (!$post || (int) $post['board_id'] !== $boardId) {
    http_response_code(404);
    echo '<h1>404 - 게시글을 찾을 수 없습니다</h1>';
    exit;
  }

  $comments   = Comment::findByPost($postId);
  $canComment = $canWrite;

  include BASE_PATH . '/public/views/boards/post-detail.php';
  exit;
}

// 게시글 목록
$page       = max(1, (int) ($_GET['page'] ?? 1));
$limit      = 20;
$result     = Post::findByBoard($boardId, $page, $limit);
$posts      = $result['items'] ?? [];
$total      = $result['total'] ?? 0;
$totalPages = (int) ceil($total / $limit);

include BASE_PATH . '/public/views/boards/list.php';
