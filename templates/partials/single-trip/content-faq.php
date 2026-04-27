<?php
if (!defined('ABSPATH')) {
    exit;
}
?>
<section class="yatra-trip-section" id="faq" itemscope itemtype="https://schema.org/FAQPage">
    <script type="application/ld+json">
    {
        "@context": "https://schema.org",
        "@type": "FAQPage",
        "mainEntity": [
            <?php
            $faq_items = [];
            $faqs = $trip->getFaqs();
            foreach ($faqs as $index => $faq) {
                $question = is_object($faq) ? ($faq->title ?? '') : ($faq['question'] ?? '');
                $answer = is_object($faq) ? ($faq->description ?? '') : ($faq['answer'] ?? '');
                
                if (!empty($question) && !empty($answer)) {
                    $faq_items[] = [
                        '@type' => 'Question',
                        'name' => esc_html($question),
                        'acceptedAnswer' => [
                            '@type' => 'Answer',
                            'text' => wp_kses_post($answer)
                        ]
                    ];
                }
            }
            
            if (!empty($faq_items)) {
                echo json_encode($faq_items, JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);
            }
            ?>
        ]
    }
    </script>
    <div class="faq-header">
        <h2 class="yatra-trip-section-title">
            <?php yatra_render_tab_icon($tab->icon ?? null, 'help-circle', 'yatra-trip-section-title-icon', $tab->label ?? __('FAQ', 'yatra')); ?>
            <?php echo esc_html(isset($tab->label) ? $tab->label : __('Frequently Asked Questions', 'yatra')); ?>
        </h2>
        <div class="faq-controls">
            <button type="button" class="faq-toggle-btn" id="faq-toggle-all">
                <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24" class="toggle-icon expand-icon" aria-hidden="true">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4"/>
                </svg>
                <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24" class="toggle-icon collapse-icon" aria-hidden="true">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 9V4.5M9 9H4.5M9 9L3.75 3.75M9 15v4.5M9 15H4.5M9 15l-5.25 5.25M15 9h4.5M15 9V4.5M15 9l5.25-5.25M15 15h4.5M15 15v4.5m0-4.5l5.25 5.25"/>
                </svg>
                <span class="toggle-text"><?php echo esc_html__('Expand All', 'yatra'); ?></span>
            </button>
        </div>
    </div>
    
    <div class="faq-container" itemscope itemtype="https://schema.org/FAQ">
        <meta itemprop="about" content="<?php echo esc_attr($trip->getTitle()); ?>">
        <?php foreach ($faqs as $index => $faq): ?>
            <?php
            $question = is_object($faq) ? ($faq->title ?? '') : '';
            $answer = is_object($faq) ? ($faq->description ?? '') : '';
            
            if (empty($question) && is_array($faq)) {
                $question = $faq['question'] ?? '';
                $answer = $faq['answer'] ?? '';
            }
            ?>
            <?php if (!empty($question) && !empty($answer)): ?>
                <div class="faq-item" itemscope itemtype="https://schema.org/Question">
                    <button type="button" class="faq-question" itemprop="text" aria-expanded="false">
                        <?php echo esc_html($question); ?>
                        <svg class="faq-arrow" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
                            <path d="M19 9l-7 7-7-7"/>
                        </svg>
                    </button>
                    <div class="faq-answer" itemscope itemtype="https://schema.org/Answer" itemprop="acceptedAnswer">
                        <div itemprop="text"><?php echo wp_kses_post($answer); ?></div>
                        <meta itemprop="position" content="<?php echo $index + 1; ?>">
                    </div>
                </div>
            <?php endif; ?>
        <?php endforeach; ?>
        <?php if (empty($faqs)): ?>
            <div class="yatra-no-faqs">
                <p class="text-gray-500 text-center py-8">
                    <?php echo esc_html__('No frequently asked questions available for this trip.', 'yatra'); ?>
                </p>
            </div>
        <?php endif; ?>
    </div>
</section>

<script>
(function () {
    let faqIsAllExpanded = false;
    const yatraFaqI18n = {
        expandAll: <?php echo wp_json_encode(__('Expand All', 'yatra')); ?>,
        collapseAll: <?php echo wp_json_encode(__('Collapse All', 'yatra')); ?>
    };

    function toggleFAQ(button) {
        var item = button.closest('.faq-item');
        if (!item) return;
        document.querySelectorAll('#faq .faq-item').forEach(function (other) {
            if (other !== item) {
                other.classList.remove('active');
                var oq = other.querySelector('.faq-question');
                if (oq) oq.setAttribute('aria-expanded', 'false');
            }
        });
        item.classList.toggle('active');
        var open = item.classList.contains('active');
        button.setAttribute('aria-expanded', open ? 'true' : 'false');
    }

    function toggleAll() {
        var toggleBtn = document.getElementById('faq-toggle-all');
        if (!toggleBtn) return;
        var items = document.querySelectorAll('#faq .faq-item');
        var toggleText = toggleBtn.querySelector('.toggle-text');
        if (faqIsAllExpanded) {
            items.forEach(function (item) {
                item.classList.remove('active');
                var q = item.querySelector('.faq-question');
                if (q) q.setAttribute('aria-expanded', 'false');
            });
            toggleBtn.classList.remove('is-all-expanded');
            if (toggleText) toggleText.textContent = yatraFaqI18n.expandAll;
        } else {
            items.forEach(function (item) {
                item.classList.add('active');
                var q = item.querySelector('.faq-question');
                if (q) q.setAttribute('aria-expanded', 'true');
            });
            toggleBtn.classList.add('is-all-expanded');
            if (toggleText) toggleText.textContent = yatraFaqI18n.collapseAll;
        }
        faqIsAllExpanded = !faqIsAllExpanded;
    }

    document.addEventListener('DOMContentLoaded', function () {
        document.querySelectorAll('#faq .faq-question').forEach(function (btn) {
            btn.addEventListener('click', function () {
                toggleFAQ(btn);
            });
        });
        var toggleBtn = document.getElementById('faq-toggle-all');
        if (toggleBtn) {
            toggleBtn.addEventListener('click', toggleAll);
        }
    });
})();
</script>
