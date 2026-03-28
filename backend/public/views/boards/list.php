<!DOCTYPE html>
<html lang="ko" data-theme="">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title><?= htmlspecialchars($board['name'] ?? '게시판') ?></title>

  <style>
    :root {
      --primary-color: <?= htmlspecialchars($settings['primary_color'] ?? '#3b82f6') ?>;
      --secondary-color: <?= htmlspecialchars($settings['secondary_color'] ?? '#8b5cf6') ?>;
      --bg-color: <?= htmlspecialchars($settings['background_color'] ?? '#ffffff') ?>;
    }
  </style>
  <link rel="stylesheet" href="/css/responsive.css">
  <link rel="stylesheet" href="/css/dark-mode.css">
  <link rel="stylesheet" href="/css/trends/micro-motions.css">

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
    <a href="/" style="font-weight:700;color:var(--primary-color);text-decoration:none;">
      <?php if (!empty($settings['logo_url'])): ?>
        <img src="<?= htmlspecialchars($settings['logo_url']) ?>" alt="로고" style="height:32px;width:auto;">
      <?php else: ?>
        홈페이지
      <?php endif; ?>
    </a>
    <button id="dark-mode-toggle" class="dark-mode-toggle" aria-label="다크 모드 전환">
      <span class="dark-mode-toggle__icon">🌙</span>
    </button>
  </div>
</nav>

<!-- 게시판 헤더 -->
<div style="border-bottom:1px solid var(--border-color);padding:2rem 0;background:var(--surface-color);">
  <div class="container">
    <h1 style="font-size:1.75rem;font-weight:700;margin:0 0 0.25rem;">
      <?= htmlspecialchars($board['name'] ?? '게시판') ?>
    </h1>
    <p style="color:var(--text-muted);font-size:0.875rem;margin:0;">총 <?= (int) $total ?> 개의 게시글</p>
  </div>
</div>

<!-- 게시글 목록 -->
<main class="section-py">
  <div class="container">

    <?php if (empty($posts)): ?>
      <p style="text-align:center;padding:4rem 0;color:var(--text-muted);">게시글이 없습니다.</p>
    <?php else: ?>
      <div style="border:1px solid var(--border-color);border-radius:0.75rem;overflow:hidden;">
        <?php foreach ($posts as $i => $post): ?>
          <a href="/boards/<?= (int) $board['id'] ?>/posts/<?= (int) $post['id'] ?>"
             class="hover-lift"
             style="display:block;padding:1.25rem 1.5rem;text-decoration:none;color:var(--text-color);<?= $i > 0 ? 'border-top:1px solid var(--border-color);' : '' ?>background:var(--card-bg);transition:background 0.15s;">
            <div style="display:flex;align-items:flex-start;justify-content:space-between;gap:1rem;">
              <div style="flex:1;min-width:0;">
                <p style="font-weight:600;margin:0 0 0.35rem;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">
                  <?= htmlspecialchars($post['title']) ?>
                </p>
                <p style="font-size:0.8rem;color:var(--text-muted);margin:0;">
                  <?= htmlspecialchars($post['author_name']) ?>
                  &middot;
                  <?= date('Y.m.d', strtotime($post['created_at'])) ?>
                  <?php if ((int) $post['comment_count'] > 0): ?>
                    &middot; 댓글 <?= (int) $post['comment_count'] ?>
                  <?php endif; ?>
                </p>
              </div>
            </div>
          </a>
        <?php endforeach; ?>
      </div>

      <!-- 페이지네이션 -->
      <?php if ($totalPages > 1): ?>
        <div style="display:flex;align-items:center;justify-content:center;gap:0.5rem;margin-top:2rem;">
          <?php if ($page > 1): ?>
            <a href="?page=<?= $page - 1 ?>"
               style="padding:0.4rem 0.9rem;border:1px solid var(--border-color);border-radius:0.375rem;text-decoration:none;color:var(--text-color);font-size:0.875rem;background:var(--card-bg);">
              이전
            </a>
          <?php endif; ?>
          <span style="font-size:0.875rem;color:var(--text-muted);"><?= $page ?> / <?= $totalPages ?></span>
          <?php if ($page < $totalPages): ?>
            <a href="?page=<?= $page + 1 ?>"
               style="padding:0.4rem 0.9rem;border:1px solid var(--border-color);border-radius:0.375rem;text-decoration:none;color:var(--text-color);font-size:0.875rem;background:var(--card-bg);">
              다음
            </a>
          <?php endif; ?>
        </div>
      <?php endif; ?>
    <?php endif; ?>

    <!-- 글쓰기 버튼 (로그인 + 쓰기 권한 있는 경우) -->
    <?php if ($canWrite): ?>
      <div style="margin-top:1.5rem;text-align:right;">
        <a href="/boards/<?= (int) $board['id'] ?>/write"
           style="display:inline-block;background:var(--primary-color);color:#fff;padding:0.6rem 1.5rem;border-radius:0.5rem;text-decoration:none;font-weight:600;font-size:0.9rem;">
          글쓰기
        </a>
      </div>
    <?php endif; ?>

  </div>
</main>

<script src="/js/darkmode.js"></script>
</body>
</html>
