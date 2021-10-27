<div class="yatra-enquiry-btn-wrapper enquiry-btn">
    <?php $button_text = get_option('yatra_enquiry_button_text', __('Get Enquiry', 'yatra')); ?>
    <button type="submit" class="btn primary-btn yatra-enquiry-now-btn"
            data-text="<?php echo esc_attr($button_text); ?>"
            data-tour-id="<?php the_ID(); ?>"><?php echo esc_html($button_text); ?></button>
</div>