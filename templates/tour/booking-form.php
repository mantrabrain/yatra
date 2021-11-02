<?php
/* @var Yatra_Tour_Dates $yatra_booking_pricing_info */
?>
<form method="post" id="yatra-tour-booking-form-fields" action="<?php echo admin_url('admin-ajax.php') ?>">

    <input type="hidden" name="action" value="yatra_tour_add_to_cart"/>
    <input type="hidden" name="yatra_nonce" value="<?php echo wp_create_nonce('wp_yatra_tour_add_to_cart_nonce'); ?>"/>
    <input type="hidden" name="tour_id" value="<?php echo get_the_ID(); ?>"/>
    <div class="yatra-form-fields yatra_tour_start_date">
        <input type="hidden" name="yatra_tour_start_date" class="yatra-booking-calendar-choosen-date" readonly
               placeholder="<?php echo __('Please pick the date', 'yatra') ?>"/>
    </div>
    <div class="yatra-calendar-wrap">

    </div>
    <div class="yatra-tour-booking-pricing-wrap">
        <?php

        do_action('yatra_tour_booking_pricing_content', $yatra_booking_pricing_info, $pricing_type, get_the_ID());

        ?>

    </div>
</form>