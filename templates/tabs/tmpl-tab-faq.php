<h3 class="tab-title"><?php echo esc_html($title); ?><span class="fa fa-minus"></span></h3>
<ul class="yatra-list yatra-faq-list">
    <?php

    foreach ($faqs as $faqs_item) {

        echo '<li class="yatra-list-item">';

        echo '<div class="yatra-faq-list-item">';

        echo '<h4 class="yatra-heading faq-heading">' . esc_html($faqs_item['faq_heading']) .'<span class="icon fa fa-minus"></span></h4>';

        echo '<div class="yatra-content faq-content">';

        echo '<h4 class="faq-title">'.esc_html($faqs_item['faq_heading']).'</h4>';

        echo '<div class="faq-details">'.($faqs_item['faq_description']).'</div>';

        echo '</div>';

        echo '</div>';

        echo '</li>';
    }
    ?>
</ul>
