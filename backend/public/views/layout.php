<!DOCTYPE html>
<html lang="ko" data-theme="">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <?php
    $siteName = $settings['site_name'] ?? '';
    $fullTitle = $pageTitle ?? '홈페이지';
    if ($siteName !== '' && $siteName !== null) {
      $fullTitle = $fullTitle . ' | ' . $siteName;
    }
  ?>
  <title><?= htmlspecialchars($fullTitle) ?></title>

  <!-- CSS 변수: 사이트 설정에서 주입 -->
  <style>
    :root {
      --primary-color: <?= htmlspecialchars($settings['primary_color'] ?? '#3b82f6') ?>;
      --secondary-color: <?= htmlspecialchars($settings['secondary_color'] ?? '#8b5cf6') ?>;
      --bg-color: <?= htmlspecialchars($settings['background_color'] ?? '#ffffff') ?>;
    }
  </style>

  <!-- 기본 스타일 -->
  <link rel="stylesheet" href="/css/responsive.css">
  <link rel="stylesheet" href="/css/dark-mode.css">

  <!-- 2026 UI 트렌드 CSS -->
  <link rel="stylesheet" href="/css/trends/bento-grid.css">
  <link rel="stylesheet" href="/css/trends/glassmorphism.css">
  <link rel="stylesheet" href="/css/trends/organic-shapes.css">
  <link rel="stylesheet" href="/css/trends/micro-motions.css">

  <!-- 다크 모드 깜빡임 방지 (head 맨 앞) -->
  <script>
    (function(){
      var t=localStorage.getItem('site-theme');
      if(!t)t=window.matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light';
      document.documentElement.setAttribute('data-theme',t);
    })();
  </script>

  <!-- GTM 스크립트 -->
  <?php if (!empty($settings['gtm_code'])): ?>
  <script async src="https://www.googletagmanager.com/gtm.js?id=<?= htmlspecialchars($settings['gtm_code']) ?>"></script>
  <script>
    window.dataLayer = window.dataLayer || [];
    function gtag(){dataLayer.push(arguments);}
    gtag('js', new Date());
    gtag('config', '<?= htmlspecialchars($settings['gtm_code']) ?>');
  </script>
  <?php endif; ?>
</head>
<body>

<!-- GTM noscript -->
<?php if (!empty($settings['gtm_code'])): ?>
<noscript>
  <iframe src="https://www.googletagmanager.com/ns.html?id=<?= htmlspecialchars($settings['gtm_code']) ?>"
          height="0" width="0" style="display:none;visibility:hidden"></iframe>
</noscript>
<?php endif; ?>

<!-- 공지 배너 -->
<?php if (!empty($settings['notice_enabled']) && !empty($settings['notice_text'])): ?>
<div class="notice-banner" style="
  background-color: <?= htmlspecialchars($settings['notice_color'] ?? '#1d4ed8') ?>;
  color: #ffffff;
  text-align: center;
  padding: 0.625rem 1rem;
  font-size: 0.875rem;
  position: relative;
">
  <?= htmlspecialchars($settings['notice_text']) ?>
  <button
    onclick="this.parentElement.style.display='none'"
    style="position:absolute;right:1rem;top:50%;transform:translateY(-50%);background:none;border:none;color:#fff;cursor:pointer;font-size:1rem;line-height:1;"
    aria-label="공지 닫기"
  >×</button>
</div>
<?php endif; ?>

<!-- 사이트 네비게이션 (헤더 섹션이 없는 경우 기본 표시) -->
<?php if (empty($sections) || !array_filter($sections, fn($s) => $s['type'] === 'header')): ?>
<nav class="site-nav glass-nav">
  <div class="container">
    <div class="site-nav">
      <?php if (!empty($settings['logo_url'])): ?>
        <a href="/">
          <img src="<?= htmlspecialchars($settings['logo_url']) ?>" alt="로고" style="height:40px;width:auto;">
        </a>
      <?php else: ?>
        <a href="/" style="font-size:1.25rem;font-weight:700;color:var(--primary-color);text-decoration:none;">홈페이지</a>
      <?php endif; ?>

      <button class="site-nav__hamburger" id="nav-hamburger" aria-label="메뉴 열기" aria-expanded="false">
        <span></span><span></span><span></span>
      </button>
    </div>
  </div>
</nav>
<?php endif; ?>

<!-- 페이지 섹션들 -->
<main>
  <?php foreach ($sections as $section): ?>
    <?php include __DIR__ . '/sections/' . $section['type'] . '.php'; ?>
  <?php endforeach; ?>
</main>

<!-- 다크 모드 토글 플로팅 버튼 -->
<button
  id="dark-mode-toggle"
  class="dark-mode-toggle"
  style="position:fixed;bottom:1.5rem;right:1.5rem;z-index:999;"
  aria-label="다크 모드로 전환"
>
  <span class="dark-mode-toggle__icon">🌙</span>
</button>

<script src="/js/darkmode.js"></script>
</body>
</html>
