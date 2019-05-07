<?php
defined('ABSPATH') || exit;

if (!isset($checkout->ID)) {

    echo '<p>Your tour cart is empty. Please select any of the booking first.</p>';
    return;
}

?>
<form method="post" action="<?php echo admin_url('admin-ajax.php'); ?>"><?php

    do_action('yatra_checkout_form_fields');
    ?>
    <input type="hidden" name="yatra_nonce" value="<?php echo wp_create_nonce('wp_yatra_book_selected_tour_nonce') ?>"/>
    <input type="hidden" name="action" value="yatra_book_selected_tour"/>
    <input type="hidden" name="yatra_tour_id" value="<?php echo absint($checkout->ID); ?>"/>
    <input type="submit" name="yatra_checkout_submit" value="Order Booking"/>
</form>
