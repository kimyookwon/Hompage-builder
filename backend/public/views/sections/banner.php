<?php
/** @var array $section */
$content  = $section['content'] ?? [];
$format   = $section['format'] ?? 'text';
$title    = $content['title'] ?? '';
$subtitle = $content['subtitle'] ?? '';
$ctaText  = $content['cta_text'] ?? '';
$ctaUrl   = $content['cta_url'] ?? '#';
$images   = $content['images'] ?? [];
?>

<?php if ($format === 'gallery'): ?>
<!-- 갤러리 배너 -->
<section class="section-py">
  <div class="container">
    <?php if ($title): ?>
      <h2 class="reveal" style="font-size:1.75rem;font-weight:700;text-align:center;margin-bottom:2rem;"><?= htmlspecialchars($title) ?></h2>
    <?php endif; ?>
    <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(240px,1fr));gap:1rem;" class="stagger-children">
      <?php foreach ($images as $img): ?>
        <div class="organic-frame hover-scale reveal" style="aspect-ratio:4/3;overflow:hidden;">
          <?php if (!empty($img['url'])): ?>
            <img src="<?= htmlspecialchars($img['url']) ?>" alt="<?= htmlspecialchars($img['alt'] ?? '') ?>"
                 style="width:100%;height:100%;object-fit:cover;">
          <?php else: ?>
            <div style="width:100%;height:100%;background:var(--surface-color);display:flex;align-items:center;justify-content:center;color:var(--text-muted);">
              이미지 없음
            </div>
          <?php endif; ?>
        </div>
      <?php endforeach; ?>
    </div>
  </div>
</section>

<?php elseif ($format === 'glassmorphism'): ?>
<!-- 글래스모피즘 배너 -->
<section class="section-py glass-bg" style="background:linear-gradient(135deg,var(--primary-color),var(--secondary-color));">
  <div class="container" style="position:relative;z-index:1;text-align:center;">
    <div class="glass-card animate-fade-in" style="max-width:640px;margin:0 auto;color:#fff;">
      <?php if ($title): ?>
        <h2 style="font-size:2rem;font-weight:800;margin-bottom:0.75rem;"><?= htmlspecialchars($title) ?></h2>
      <?php endif; ?>
      <?php if ($subtitle): ?>
        <p style="opacity:0.9;margin-bottom:1.5rem;line-height:1.6;"><?= nl2br(htmlspecialchars($subtitle)) ?></p>
      <?php endif; ?>
      <?php if ($ctaText): ?>
        <a href="<?= htmlspecialchars($ctaUrl) ?>" class="glass-btn btn-ripple"
           style="display:inline-block;color:#fff;font-weight:700;">
          <?= htmlspecialchars($ctaText) ?>
        </a>
      <?php endif; ?>
    </div>
  </div>
</section>

<?php else: ?>
<!-- 기본 CTA 배너 -->
<section class="section-py reveal" style="background:var(--primary-color);color:#fff;text-align:center;">
  <div class="container">
    <?php if ($title): ?>
      <h2 style="font-size:2rem;font-weight:800;margin-bottom:0.75rem;"><?= htmlspecialchars($title) ?></h2>
    <?php endif; ?>
    <?php if ($subtitle): ?>
      <p style="opacity:0.9;margin-bottom:1.5rem;"><?= nl2br(htmlspecialchars($subtitle)) ?></p>
    <?php endif; ?>
    <?php if ($ctaText): ?>
      <a href="<?= htmlspecialchars($ctaUrl) ?>"
         style="display:inline-block;background:#fff;color:var(--primary-color);padding:0.75rem 2.5rem;border-radius:0.5rem;font-weight:700;text-decoration:none;"
         class="hover-lift btn-ripple">
        <?= htmlspecialchars($ctaText) ?>
      </a>
    <?php endif; ?>
  </div>
</section>
<?php endif; ?>
