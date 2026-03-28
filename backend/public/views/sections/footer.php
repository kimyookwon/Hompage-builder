<?php
/** @var array $section */
$content   = $section['content'] ?? [];
$copyright = $content['copyright'] ?? '';
$links     = $content['links'] ?? [];
$columns   = $content['columns'] ?? [];
?>

<footer class="site-footer">
  <div class="container">

    <?php if ($columns): ?>
    <!-- 다단 푸터 -->
    <div class="site-footer__grid" style="margin-bottom:2.5rem;">
      <?php foreach ($columns as $col): ?>
        <div>
          <?php if (!empty($col['title'])): ?>
            <h4 style="font-weight:600;margin-bottom:1rem;font-size:0.95rem;"><?= htmlspecialchars($col['title']) ?></h4>
          <?php endif; ?>
          <?php if (!empty($col['links'])): ?>
            <ul style="list-style:none;padding:0;margin:0;display:flex;flex-direction:column;gap:0.5rem;">
              <?php foreach ($col['links'] as $link): ?>
                <li>
                  <a href="<?= htmlspecialchars($link['url'] ?? '#') ?>"
                     class="link-underline"
                     style="color:var(--text-muted);text-decoration:none;font-size:0.875rem;">
                    <?= htmlspecialchars($link['label'] ?? '') ?>
                  </a>
                </li>
              <?php endforeach; ?>
            </ul>
          <?php endif; ?>
        </div>
      <?php endforeach; ?>
    </div>
    <?php endif; ?>

    <!-- 하단 바 -->
    <div style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:1rem;padding-top:1.5rem;border-top:1px solid var(--border-color);">
      <p style="font-size:0.85rem;color:var(--text-muted);margin:0;">
        <?= htmlspecialchars($copyright ?: '© ' . date('Y') . ' All rights reserved.') ?>
      </p>

      <?php if ($links): ?>
        <nav>
          <ul style="list-style:none;padding:0;margin:0;display:flex;gap:1.25rem;">
            <?php foreach ($links as $link): ?>
              <li>
                <a href="<?= htmlspecialchars($link['url'] ?? '#') ?>"
                   class="link-underline"
                   style="color:var(--text-muted);text-decoration:none;font-size:0.85rem;">
                  <?= htmlspecialchars($link['label'] ?? '') ?>
                </a>
              </li>
            <?php endforeach; ?>
          </ul>
        </nav>
      <?php endif; ?>
    </div>

  </div>
</footer>
