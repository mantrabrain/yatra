<?php
if (!defined('ABSPATH')) {
    exit;
}

// FAQ Section
// Expected variables: $trip
?>
<section class="yatra-trip-section" id="faq">
    <h2 class="yatra-trip-section-title">
        <?php echo yatra_svg_icon('info', 'yatra-trip-section-title-icon'); ?>
        <?php echo esc_html__('Frequently Asked Questions', 'yatra'); ?>
    </h2>
    <ul class="yatra-trip-faq">
        <?php foreach ($trip->faqs as $faq): ?>
            <?php
            $question = is_array($faq) ? ($faq['question'] ?? '') : (is_object($faq) ? ($faq->question ?? '') : '');
            $answer = is_array($faq) ? ($faq['answer'] ?? '') : (is_object($faq) ? ($faq->answer ?? '') : '');
            ?>
            <?php if (!empty($question) && !empty($answer)): ?>
                <li class="yatra-faq-item">
                    <h3 class="yatra-faq-question">
                        <?php echo esc_html($question); ?>
                        <?php echo yatra_svg_icon('chevron-down', 'yatra-faq-toggle'); ?>
                    </h3>
                    <div class="yatra-faq-answer">
                        <p><?php echo wp_kses_post($answer); ?></p>
                    </div>
                </li>
            <?php endif; ?>
        <?php endforeach; ?>
    </ul>
</section>
