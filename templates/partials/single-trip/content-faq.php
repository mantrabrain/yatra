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
            <?php yatra_render_tab_icon($tab->icon ?? null, 'help-circle', 'yatra-trip-section-title-icon', $tab->label ?? 'FAQ'); ?>
            <?php echo esc_html(isset($tab->label) ? $tab->label : __('Frequently Asked Questions', 'yatra')); ?>
        </h2>
        <div class="faq-controls">
            <button type="button" class="faq-toggle-btn" id="faq-toggle-all">
                <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24" class="toggle-icon expand-icon">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4"/>
                </svg>
                <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24" class="toggle-icon collapse-icon" style="display: none;">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 9V4.5M9 9H4.5M9 9L3.75 3.75M9 15v4.5M9 15H4.5M9 15l-5.25 5.25M15 9h4.5M15 9V4.5M15 9l5.25-5.25M15 15h4.5M15 15v4.5m0-4.5l5.25 5.25"/>
                </svg>
                <span class="toggle-text">Expand All</span>
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
        <?php if (empty($trip->faqs) || !is_array($trip->faqs)): ?>
            <div class="yatra-no-faqs">
                <p class="text-gray-500 text-center py-8">
                    <?php echo esc_html__('No frequently asked questions available for this trip.', 'yatra'); ?>
                </p>
            </div>
        <?php endif; ?>
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

// FAQ Toggle All functionality
let faqIsAllExpanded = false;

function toggleAll() {
    const toggleBtn = document.getElementById('faq-toggle-all');
    const expandIcon = toggleBtn.querySelector('.expand-icon');
    const collapseIcon = toggleBtn.querySelector('.collapse-icon');
    const toggleText = toggleBtn.querySelector('.toggle-text');
    
    if (faqIsAllExpanded) {
        // Collapse all
        document.querySelectorAll('.faq-item').forEach(item => {
            const answer = item.querySelector('.faq-answer');
            const arrow = item.querySelector('.faq-arrow');
            
            item.classList.remove('active');
            answer.style.maxHeight = '0';
            arrow.style.transform = 'rotate(0deg)';
        });
        
        // Update button to show expand state
        expandIcon.style.display = 'block';
        collapseIcon.style.display = 'none';
        toggleText.textContent = 'Expand All';
    } else {
        // Expand all
        document.querySelectorAll('.faq-item').forEach(item => {
            const answer = item.querySelector('.faq-answer');
            const arrow = item.querySelector('.faq-arrow');
            
            item.classList.add('active');
            answer.style.maxHeight = answer.scrollHeight + 'px';
            arrow.style.transform = 'rotate(180deg)';
        });
        
        // Update button to show collapse state
        expandIcon.style.display = 'none';
        collapseIcon.style.display = 'block';
        toggleText.textContent = 'Collapse All';
    }
    
    faqIsAllExpanded = !faqIsAllExpanded;
}

// Initialize FAQ toggle button
document.addEventListener('DOMContentLoaded', function() {
    const toggleBtn = document.getElementById('faq-toggle-all');
    if (toggleBtn) {
        toggleBtn.addEventListener('click', toggleAll);
    }
});
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
