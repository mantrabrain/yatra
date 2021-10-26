<?php
/* @var Yatra_Tour_Dates $yatra_booking_pricing_info */
?>
<form method="post" id="yatra-tour-booking-form-fields" action="<?php echo admin_url('admin-ajax.php') ?>">

    <input type="hidden" name="action" value="yatra_tour_add_to_cart"/>
    <input type="hidden" name="yatra_nonce" value="<?php echo wp_create_nonce('wp_yatra_tour_add_to_cart_nonce'); ?>"/>
    <input type="hidden" name="tour_id" value="<?php echo get_the_ID(); ?>"/>
    <div class="yatra-form-fields yatra_tour_start_date">
        <span class="fa fa-calendar-alt"></span>
        <input type="text" name="yatra_tour_start_date"/>
    </div>
    <?php
    $pricing = $yatra_booking_pricing_info->getPricing();;
    if ($pricing instanceof Yatra_Tour_Pricing) {

        yatra_get_template('parts/booking-pricing-item.php',
            array(
                'pricing_type' => $pricing_type,
                'yatra_booking_pricing' => $pricing,
            )
        );
    } else {

        foreach ($pricing as $booking_pricing_args) {
            yatra_get_template('parts/booking-pricing-item.php',
                array(
                    'pricing_type' => $pricing_type,
                    'yatra_booking_pricing' => $booking_pricing_args,
                )
            );
        }
    }

    yatra_book_now_button()
    ?>

</form>