<form method="post" id="yatra-tour-enquiry-form-fields" action="<?php echo admin_url('admin-ajax.php') ?>">
    <input type="hidden" name="action" value="yatra_tour_enquiry"/>
    <input type="hidden" name="yatra_nonce" value="<?php echo wp_create_nonce('wp_yatra_tour_enquiry_nonce'); ?>"/>
    <input type="hidden" name="tour_id" value="<?php echo get_the_ID(); ?>"/>
    <div class="yatra-tour-enquiry-form-wrap">
        <?php do_action('yatra_enquiry_form_fields'); ?>
    </div>
</form>