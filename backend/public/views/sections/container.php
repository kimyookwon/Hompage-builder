<?php
/** @var array $section */
$content = $section['content'] ?? [];
$format  = $section['format'] ?? 'text';
$title   = $content['title'] ?? '';
$body    = $content['body'] ?? '';
$items   = $content['items'] ?? [];
?>

<?php if ($format === 'bento'): ?>
<!-- 벤토 그리드 컨테이너 -->
<section class="section-py" style="background:var(--surface-color, var(--bg-color));">
  <div class="container">
    <?php if ($title): ?>
      <h2 class="reveal" style="font-size:2rem;font-weight:700;text-align:center;margin-bottom:0.5rem;"><?= htmlspecialchars($title) ?></h2>
    <?php endif; ?>
    <?php if ($body): ?>
      <p class="reveal" style="text-align:center;opacity:0.7;margin-bottom:2.5rem;max-width:600px;margin-left:auto;margin-right:auto;"><?= nl2br(htmlspecialchars($body)) ?></p>
    <?php endif; ?>
    <div class="bento-grid stagger-children">
      <?php foreach ($items as $i => $item): ?>
        <?php
          $variants = ['', '--wide', '--accent', '--primary', '--dark'];
          $variant  = $variants[$i % count($variants)];
        ?>
        <div class="bento-card<?= $variant ?> reveal hover-lift">
          <?php if (!empty($item['icon'])): ?>
            <span class="bento-card__icon"><?= htmlspecialchars($item['icon']) ?></span>
          <?php endif; ?>
          <?php if (!empty($item['title'])): ?>
            <h3 class="bento-card__title"><?= htmlspecialchars($item['title']) ?></h3>
          <?php endif; ?>
          <?php if (!empty($item['body'])): ?>
            <p class="bento-card__body"><?= nl2br(htmlspecialchars($item['body'])) ?></p>
          <?php endif; ?>
        </div>
      <?php endforeach; ?>
    </div>
  </div>
</section>

<?php elseif ($format === 'glassmorphism'): ?>
<!-- 글래스모피즘 컨테이너 -->
<section class="section-py glass-bg" style="background:linear-gradient(135deg,rgba(var(--primary-rgb,59,130,246),0.08),rgba(var(--secondary-rgb,139,92,246),0.08));">
  <div class="container" style="position:relative;z-index:1;">
    <?php if ($title): ?>
      <h2 class="reveal" style="font-size:2rem;font-weight:700;text-align:center;margin-bottom:2.5rem;"><?= htmlspecialchars($title) ?></h2>
    <?php endif; ?>
    <div class="grid grid--3 stagger-children">
      <?php foreach ($items as $item): ?>
        <div class="glass-card reveal">
          <?php if (!empty($item['title'])): ?>
            <h3 style="font-weight:600;margin-bottom:0.5rem;"><?= htmlspecialchars($item['title']) ?></h3>
          <?php endif; ?>
          <?php if (!empty($item['body'])): ?>
            <p style="opacity:0.8;font-size:0.9rem;line-height:1.6;"><?= nl2br(htmlspecialchars($item['body'])) ?></p>
          <?php endif; ?>
        </div>
      <?php endforeach; ?>
    </div>
  </div>
</section>

<?php elseif ($format === 'organic'): ?>
<!-- 오가닉 컨테이너 -->
<section class="organic-section section-py" style="background:var(--bg-color);position:relative;overflow:hidden;">
  <div class="organic-decor organic-decor--1"></div>
  <div class="organic-decor organic-decor--2"></div>
  <div class="container" style="position:relative;z-index:1;">
    <?php if ($title): ?>
      <h2 class="reveal" style="font-size:2rem;font-weight:700;text-align:center;margin-bottom:0.5rem;"><?= htmlspecialchars($title) ?></h2>
    <?php endif; ?>
    <?php if ($body): ?>
      <p class="reveal" style="text-align:center;opacity:0.7;margin-bottom:2.5rem;max-width:600px;margin-left:auto;margin-right:auto;"><?= nl2br(htmlspecialchars($body)) ?></p>
    <?php endif; ?>
    <div class="grid grid--3 stagger-children">
      <?php foreach ($items as $item): ?>
        <div class="organic-card reveal hover-lift">
          <?php if (!empty($item['icon'])): ?>
            <span style="font-size:2rem;margin-bottom:0.75rem;display:block;"><?= htmlspecialchars($item['icon']) ?></span>
          <?php endif; ?>
          <?php if (!empty($item['title'])): ?>
            <h3 style="font-weight:600;margin-bottom:0.5rem;"><?= htmlspecialchars($item['title']) ?></h3>
          <?php endif; ?>
          <?php if (!empty($item['body'])): ?>
            <p style="opacity:0.75;font-size:0.9rem;line-height:1.6;"><?= nl2br(htmlspecialchars($item['body'])) ?></p>
          <?php endif; ?>
        </div>
      <?php endforeach; ?>
    </div>
  </div>
</section>

<?php else: ?>
<!-- 기본 텍스트 컨테이너 -->
<section class="section-py">
  <div class="container">
    <?php if ($title): ?>
      <h2 class="reveal" style="font-size:1.75rem;font-weight:700;margin-bottom:1rem;"><?= htmlspecialchars($title) ?></h2>
    <?php endif; ?>
    <?php if ($body): ?>
      <div class="reveal" style="line-height:1.8;max-width:720px;"><?= nl2br(htmlspecialchars($body)) ?></div>
    <?php endif; ?>
    <?php if ($items): ?>
      <div class="grid grid--2 reveal" style="margin-top:2rem;">
        <?php foreach ($items as $item): ?>
          <div class="hover-lift" style="border:1px solid var(--border-color);border-radius:1rem;padding:1.5rem;">
            <?php if (!empty($item['title'])): ?>
              <h3 style="font-weight:600;margin-bottom:0.5rem;"><?= htmlspecialchars($item['title']) ?></h3>
            <?php endif; ?>
            <?php if (!empty($item['body'])): ?>
              <p style="opacity:0.75;font-size:0.9rem;"><?= nl2br(htmlspecialchars($item['body'])) ?></p>
            <?php endif; ?>
          </div>
        <?php endforeach; ?>
      </div>
    <?php endif; ?>
  </div>
</section>
<?php endif; ?>
