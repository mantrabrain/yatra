<div class="yatra-enquiry-btn-wrapper enquiry-btn">
    <?php
    $enquiry_button_text = $enquiry_button_text ?? __('Send Enquiry', 'yatra');
    ?>
    <button type="button" class="yatra-button button yatra-enquiry-now-btn"
            data-text="<?php echo esc_attr($enquiry_button_text); ?>"
            data-tour-id="<?php the_ID(); ?>"><?php echo esc_html($enquiry_button_text); ?></button>
</div>