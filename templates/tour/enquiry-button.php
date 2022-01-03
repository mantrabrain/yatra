<div class="yatra-enquiry-btn-wrapper enquiry-btn">
    <?php $button_text = get_option('yatra_enquiry_button_text', __('Send Enquiry', 'yatra')); ?>
    <button type="button" class="yatra-button button yatra-enquiry-now-btn"
            data-text="<?php echo esc_attr($button_text); ?>"
            data-tour-id="<?php the_ID(); ?>"><?php echo esc_html($button_text); ?></button>
</div>