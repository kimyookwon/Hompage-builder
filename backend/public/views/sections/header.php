<?php
/** @var array $section — PageSection 행 데이터 */
$content = $section['content'] ?? [];
$format  = $section['format'] ?? 'text';
$title   = $content['title'] ?? '';
$subtitle = $content['subtitle'] ?? '';
$ctaText  = $content['cta_text'] ?? '';
$ctaUrl   = $content['cta_url'] ?? '#';
$bgImage  = $content['bg_image'] ?? '';
?>

<?php if ($format === 'glassmorphism'): ?>
<!-- 글래스모피즘 헤더 -->
<header class="glass-bg section-py" style="min-height:100vh;display:flex;align-items:center;<?= $bgImage ? 'background-image:url(' . htmlspecialchars($bgImage) . ');background-size:cover;background-position:center;' : 'background:linear-gradient(135deg,var(--primary-color),var(--secondary-color));' ?>">
  <div class="container" style="position:relative;z-index:1;">
    <div class="glass-card animate-fade-in" style="max-width:720px;margin:0 auto;text-align:center;color:#fff;">
      <?php if ($title): ?>
        <h1 class="section-header__title text-balance"><?= nl2br(htmlspecialchars($title)) ?></h1>
      <?php endif; ?>
      <?php if ($subtitle): ?>
        <p class="section-header__subtitle"><?= nl2br(htmlspecialchars($subtitle)) ?></p>
      <?php endif; ?>
      <?php if ($ctaText): ?>
        <a href="<?= htmlspecialchars($ctaUrl) ?>" class="glass-btn btn-ripple" style="display:inline-block;color:#fff;">
          <?= htmlspecialchars($ctaText) ?>
        </a>
      <?php endif; ?>
    </div>
  </div>
</header>

<?php elseif ($format === 'organic'): ?>
<!-- 오가닉 헤더 -->
<header class="organic-section section-py" style="min-height:85vh;display:flex;align-items:center;background:var(--bg-color);">
  <div class="organic-decor organic-decor--1"></div>
  <div class="organic-decor organic-decor--2"></div>
  <div class="container" style="position:relative;z-index:1;text-align:center;">
    <?php if ($title): ?>
      <h1 class="section-header__title text-balance animate-fade-in"><?= nl2br(htmlspecialchars($title)) ?></h1>
    <?php endif; ?>
    <?php if ($subtitle): ?>
      <p class="section-header__subtitle animate-fade-in" style="animation-delay:100ms;"><?= nl2br(htmlspecialchars($subtitle)) ?></p>
    <?php endif; ?>
    <?php if ($ctaText): ?>
      <a href="<?= htmlspecialchars($ctaUrl) ?>" class="organic-btn btn-ripple animate-pop"
         style="display:inline-block;background:var(--primary-color);color:#fff;text-decoration:none;animation-delay:200ms;">
        <?= htmlspecialchars($ctaText) ?>
      </a>
    <?php endif; ?>
  </div>
</header>

<?php else: ?>
<!-- 기본 텍스트 헤더 -->
<header class="section-py" style="text-align:center;background:var(--bg-color);<?= $bgImage ? 'background-image:url(' . htmlspecialchars($bgImage) . ');background-size:cover;background-position:center;' : '' ?>">
  <div class="container">
    <?php if ($title): ?>
      <h1 class="section-header__title reveal"><?= nl2br(htmlspecialchars($title)) ?></h1>
    <?php endif; ?>
    <?php if ($subtitle): ?>
      <p class="section-header__subtitle reveal" style="animation-delay:100ms;"><?= nl2br(htmlspecialchars($subtitle)) ?></p>
    <?php endif; ?>
    <?php if ($ctaText): ?>
      <a href="<?= htmlspecialchars($ctaUrl) ?>" class="hover-lift reveal"
         style="display:inline-block;background:var(--primary-color);color:#fff;padding:0.75rem 2rem;border-radius:0.5rem;text-decoration:none;font-weight:600;animation-delay:200ms;">
        <?= htmlspecialchars($ctaText) ?>
      </a>
    <?php endif; ?>
  </div>
</header>
<?php endif; ?>
