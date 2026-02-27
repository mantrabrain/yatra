<?php
if (!defined('ABSPATH')) {
    exit;
}
?>
<?php if (!empty($trip->faqs) && is_array($trip->faqs)): ?>
<section class="yatra-trip-section" id="faq" itemscope itemtype="https://schema.org/FAQPage">
    <script type="application/ld+json">
    {
        "@context": "https://schema.org",
        "@type": "FAQPage",
        "mainEntity": [
            <?php
            $faq_items = [];
            foreach ($trip->faqs as $index => $faq) {
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
            <?php echo yatra_svg_icon('help-circle', 'yatra-trip-section-title-icon'); ?>
            <?php echo esc_html__('Frequently Asked Questions', 'yatra'); ?>
        </h2>
        <div class="faq-controls">
            <button class="faq-btn" onclick="expandAll()" aria-label="<?php esc_attr_e('Expand all FAQ items', 'yatra'); ?>">
                <svg class="faq-btn-arrow" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M19 9l-7 7-7-7"/>
                </svg>
                <?php esc_html_e('Expand All', 'yatra'); ?>
            </button>
            <button class="faq-btn" onclick="collapseAll()" aria-label="<?php esc_attr_e('Collapse all FAQ items', 'yatra'); ?>">
                <svg class="faq-btn-arrow" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M19 9l-7 7-7-7"/>
                </svg>
                <?php esc_html_e('Collapse All', 'yatra'); ?>
            </button>
        </div>
    </div>
    
    <div class="faq-container" itemscope itemtype="https://schema.org/FAQ">
        <meta itemprop="about" content="<?php echo esc_attr($trip->title); ?>">
        <?php foreach ($trip->faqs as $index => $faq): ?>
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
                    <button class="faq-question" onclick="toggleFAQ(this)" itemprop="text" aria-expanded="false">
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
    </div>
</section>

<script>
function toggleFAQ(button) {
    const item = button.parentElement;
    const answer = item.querySelector('.faq-answer');
    const arrow = button.querySelector('.faq-arrow');
    
    // Close others
    document.querySelectorAll('.faq-item').forEach(other => {
        if (other !== item) {
            other.classList.remove('active');
            other.querySelector('.faq-answer').style.maxHeight = '0';
            other.querySelector('.faq-arrow').style.transform = 'rotate(0deg)';
        }
    });
    
    // Toggle current
    item.classList.toggle('active');
    
    if (item.classList.contains('active')) {
        answer.style.maxHeight = answer.scrollHeight + 'px';
        arrow.style.transform = 'rotate(180deg)';
    } else {
        answer.style.maxHeight = '0';
        arrow.style.transform = 'rotate(0deg)';
    }
}

function expandAll() {
    document.querySelectorAll('.faq-item').forEach(item => {
        const answer = item.querySelector('.faq-answer');
        const arrow = item.querySelector('.faq-arrow');
        
        item.classList.add('active');
        answer.style.maxHeight = answer.scrollHeight + 'px';
        arrow.style.transform = 'rotate(180deg)';
    });
}

function collapseAll() {
    document.querySelectorAll('.faq-item').forEach(item => {
        const answer = item.querySelector('.faq-answer');
        const arrow = item.querySelector('.faq-arrow');
        
        item.classList.remove('active');
        answer.style.maxHeight = '0';
        arrow.style.transform = 'rotate(0deg)';
    });
}
</script>

<style>
.faq-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 20px;
    flex-wrap: wrap;
    gap: 16px;
}

.faq-controls {
    display: flex;
    gap: 8px;
}

.faq-btn {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 6px 12px;
    background: #ffffff;
    border: 1px solid #e5e7eb;
    border-radius: 6px;
    font-size: 13px;
    color: #6b7280;
    cursor: pointer;
    transition: all 0.2s ease;
}

.faq-btn:hover {
    background: #f9fafb;
    border-color: #d1d5db;
    color: #374151;
}

.faq-btn svg {
    flex-shrink: 0;
}

.faq-btn-arrow {
    color: #9ca3af;
    transition: transform 0.3s ease;
}

.faq-container {
    max-width: 800px;
    margin: 0 auto;
    border: 1px solid #e5e7eb;
    border-radius: 8px;
    overflow: hidden;
}

.faq-item {
    border-bottom: 1px solid #e5e7eb;
}

.faq-item:last-child {
    border-bottom: none;
}

.faq-question {
    width: 100%;
    background: none;
    border: none;
    padding: 16px 20px;
    text-align: left;
    font-size: 15px;
    font-weight: 500;
    color: #374151;
    cursor: pointer;
    display: flex;
    justify-content: space-between;
    align-items: center;
    transition: background-color 0.2s ease;
}

.faq-question:hover {
    background: #f9fafb;
}

.faq-item.active .faq-question {
    background: #f9fafb;
    font-weight: 600;
}

.faq-arrow {
    color: #9ca3af;
    transition: transform 0.3s ease;
    flex-shrink: 0;
    margin-left: 12px;
}

.faq-item.active .faq-arrow {
    color: #6b7280;
}

.faq-answer {
    max-height: 0;
    overflow: hidden;
    transition: max-height 0.3s ease;
    background: #f9fafb;
    padding: 0 20px;
    color: #6b7280;
    line-height: 1.5;
    font-size: 14px;
}

.faq-item.active .faq-answer {
    padding: 0 20px 16px 20px;
}

.faq-answer p {
    margin: 0 0 8px 0;
}

.faq-answer p:last-child {
    margin-bottom: 0;
}

.faq-answer ul,
.faq-answer ol {
    margin: 8px 0;
    padding-left: 16px;
}

.faq-answer li {
    margin-bottom: 4px;
}

/* Mobile responsive */
@media (max-width: 768px) {
    .faq-header {
        flex-direction: column;
        align-items: flex-start;
        gap: 12px;
    }
    
    .faq-controls {
        width: 100%;
        justify-content: flex-start;
    }
    
    .faq-question {
        padding: 14px 16px;
        font-size: 14px;
    }
    
    .faq-answer {
        font-size: 13px;
    }
    
    .faq-item.active .faq-answer {
        padding: 0 16px 14px 16px;
    }
}
</style>
<?php endif; ?>
