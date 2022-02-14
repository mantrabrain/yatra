<?php
if (!defined('ABSPATH')) {
    exit;
}

?>
<div class="yatra-account-booking-details-header">
    <a href="<?php echo add_query_arg(array(
        'page_type' => 'bookings',
    ), get_permalink()); ?>"><span style="font-size:20px;" class="fa fa-arrow-alt-circle-left"></span></a>
    <h2><?php echo __('Booking Details', 'yatra'); ?></h2>
</div>
<div class="yatra-booking-table my_account_booking_details">
    <?php

    do_action('yatra_account_bookings_item_endpoint', $yatra_booking_meta);

    ?>
</div>
