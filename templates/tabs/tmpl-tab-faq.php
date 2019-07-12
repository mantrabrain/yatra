<h3><?php echo esc_html($title); ?></h3>
<ul class="yatra-faq-list">
    <?php

    foreach ($faqs as $faqs_item) {

        echo '<li>';

        echo '<div class="yatra-faq-list-item">';

        echo '<h4>' . esc_html($faqs_item['faq_heading']) . '</h4>';

        echo '<div class="faq-title">'.esc_html($faqs_item['faq_heading']).'</div>';

        echo '<div class="faq-details">'.($faqs_item['faq_description']).'</div>';

        echo '</div>';

        echo '</li>';
    }
    ?>
</ul>
