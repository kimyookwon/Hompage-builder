<!DOCTYPE html>
<html lang="ko" data-theme="">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title><?= htmlspecialchars($post['title'] ?? '게시글') ?></title>

  <style>
    :root {
      --primary-color: <?= htmlspecialchars($settings['primary_color'] ?? '#3b82f6') ?>;
      --secondary-color: <?= htmlspecialchars($settings['secondary_color'] ?? '#8b5cf6') ?>;
      --bg-color: <?= htmlspecialchars($settings['background_color'] ?? '#ffffff') ?>;
    }
  </style>
  <link rel="stylesheet" href="/css/responsive.css">
  <link rel="stylesheet" href="/css/dark-mode.css">

  <script>
    (function(){
      var t=localStorage.getItem('site-theme');
      if(!t)t=window.matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light';
      document.documentElement.setAttribute('data-theme',t);
    })();
  </script>
</head>
<body>

<!-- 네비게이션 -->
<nav style="border-bottom:1px solid var(--border-color);padding:0.75rem 0;background:var(--nav-bg);">
  <div class="container" style="display:flex;align-items:center;justify-content:space-between;">
    <a href="/" style="font-weight:700;color:var(--primary-color);text-decoration:none;">홈페이지</a>
    <button id="dark-mode-toggle" class="dark-mode-toggle" aria-label="다크 모드 전환">
      <span class="dark-mode-toggle__icon">🌙</span>
    </button>
  </div>
</nav>

<main class="section-py">
  <div class="container" style="max-width:860px;">

    <!-- 뒤로가기 -->
    <a href="/boards/<?= (int) $board['id'] ?>"
       style="display:inline-flex;align-items:center;gap:0.4rem;color:var(--text-muted);text-decoration:none;font-size:0.875rem;margin-bottom:1.5rem;">
      ← <?= htmlspecialchars($board['name'] ?? '게시판') ?>으로 돌아가기
    </a>

    <!-- 게시글 -->
    <article style="border:1px solid var(--border-color);border-radius:0.75rem;overflow:hidden;background:var(--card-bg);margin-bottom:2rem;">
      <!-- 제목 영역 -->
      <div style="padding:1.75rem 2rem;border-bottom:1px solid var(--border-color);">
        <h1 style="font-size:1.4rem;font-weight:700;margin:0 0 0.75rem;">
          <?= htmlspecialchars($post['title']) ?>
        </h1>
        <p style="color:var(--text-muted);font-size:0.85rem;margin:0;">
          <?= htmlspecialchars($post['author_name']) ?>
          &middot;
          <?= date('Y년 m월 d일 H:i', strtotime($post['created_at'])) ?>
        </p>
      </div>

      <!-- 본문 -->
      <div style="padding:2rem;line-height:1.8;white-space:pre-wrap;word-break:break-word;">
        <?= nl2br(htmlspecialchars($post['content'])) ?>
      </div>
    </article>

    <!-- 댓글 섹션 -->
    <section>
      <h2 style="font-size:1rem;font-weight:700;margin-bottom:1.25rem;">
        댓글 <?= count($comments) ?>개
      </h2>

      <!-- 댓글 목록 -->
      <?php if (empty($comments)): ?>
        <p style="color:var(--text-muted);font-size:0.875rem;padding:1.5rem 0;">첫 댓글을 작성해보세요.</p>
      <?php else: ?>
        <div style="display:flex;flex-direction:column;gap:1rem;margin-bottom:1.5rem;">
          <?php foreach ($comments as $comment): ?>
            <div style="border:1px solid var(--border-color);border-radius:0.5rem;padding:1rem 1.25rem;background:var(--card-bg);">
              <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:0.5rem;">
                <span style="font-weight:600;font-size:0.9rem;"><?= htmlspecialchars($comment['author_name']) ?></span>
                <span style="color:var(--text-muted);font-size:0.8rem;"><?= date('Y.m.d H:i', strtotime($comment['created_at'])) ?></span>
              </div>
              <p style="margin:0;font-size:0.9rem;line-height:1.6;white-space:pre-wrap;"><?= nl2br(htmlspecialchars($comment['content'])) ?></p>
            </div>
          <?php endforeach; ?>
        </div>
      <?php endif; ?>

      <!-- 댓글 작성 폼 -->
      <?php if ($canComment): ?>
        <form method="POST" action="/boards/<?= (int) $board['id'] ?>/posts/<?= (int) $post['id'] ?>/comments">
          <input type="hidden" name="_token" value="<?= htmlspecialchars($csrfToken ?? '') ?>">
          <div style="border:1px solid var(--border-color);border-radius:0.5rem;overflow:hidden;background:var(--card-bg);">
            <textarea
              name="content"
              rows="3"
              placeholder="댓글을 입력하세요..."
              required
              style="width:100%;padding:1rem;border:none;background:transparent;color:var(--text-color);resize:none;font-size:0.9rem;font-family:inherit;outline:none;box-sizing:border-box;"
            ></textarea>
            <div style="display:flex;justify-content:flex-end;padding:0.75rem;border-top:1px solid var(--border-color);">
              <button type="submit"
                      style="background:var(--primary-color);color:#fff;border:none;padding:0.5rem 1.25rem;border-radius:0.375rem;font-weight:600;cursor:pointer;font-size:0.875rem;">
                댓글 작성
              </button>
            </div>
          </div>
        </form>
      <?php elseif (!$isLoggedIn): ?>
        <div style="text-align:center;padding:1.5rem;border:1px solid var(--border-color);border-radius:0.5rem;background:var(--card-bg);">
          <p style="color:var(--text-muted);margin:0 0 1rem;font-size:0.9rem;">댓글을 작성하려면 로그인이 필요합니다.</p>
          <a href="/login"
             style="display:inline-block;background:var(--primary-color);color:#fff;padding:0.5rem 1.5rem;border-radius:0.375rem;text-decoration:none;font-weight:600;font-size:0.875rem;">
            로그인
          </a>
        </div>
      <?php endif; ?>
    </section>

  </div>
</main>

<script src="/js/darkmode.js"></script>
</body>
</html>
