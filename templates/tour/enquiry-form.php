<form method="post" id="yatra-tour-enquiry-form-fields" action="<?php echo admin_url('admin-ajax.php') ?>">
    <input type="hidden" name="action" value="yatra_tour_enquiry"/>
    <input type="hidden" name="yatra_nonce" value="<?php echo wp_create_nonce('wp_yatra_tour_enquiry_nonce'); ?>"/>
    <input type="hidden" name="tour_id" value="<?php echo get_the_ID(); ?>"/>
    <fieldset>
        <div class="yatra-tour-enquiry-form-wrap">

            <?php do_action('yatra_enquiry_form_fields');

            yatra_privacy_agreement('yatra_enquiry_form_show_agree_to_privacy_policy');
            yatra_terms_agreement('yatra_enquiry_form_show_agree_to_terms_policy');
            ?>

        </div>
        <div class="yatra-enquiry-submit-btn-wrapper">
            <button type="submit" class="yatra-button button yatra-enquiry-submit-now-btn"
            ><?php
                echo esc_html(get_option('yatra_enquiry_button_text', __('Send Enquiry', 'yatra')));
                ?>
            </button>
        </div>
    </fieldset>
</form>