<h3 class="tab-title"><?php echo wp_kses($icon, array(
        'span' => array('class' => array())
    )) ?><?php echo esc_html($title); ?><span class="yatra-icon fa fa-plus"></span></h3>
<div class="faq-section">
    <div class="yatra-tab-section-inner">
        <ul class="yatra-list yatra-faq-list">
            <?php

            foreach ($faqs as $faqs_item) {

                echo '<li class="yatra-list-item">';

                echo '<div class="yatra-faq-list-item">';

                echo '<h4 class="yatra-heading faq-heading">' . esc_html($faqs_item['faq_heading']) . '<span class="yatra-icon fa fa-plus"></span></h4>';

                echo '<div class="yatra-content faq-content" style="display:none">';

                echo '<div class="faq-details">' . do_shortcode(wpautop($faqs_item['faq_description'])) . '</div>';

                echo '</div>';

                echo '</div>';

                echo '</li>';
            }
            ?>
        </ul>
    </div>
</div>
