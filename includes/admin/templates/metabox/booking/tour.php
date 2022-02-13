<div class="yatra-admin-booking-metabox-wrap postbox">
    <div class="yatra-box-data-head postbox-header">
        <h2 class="heading"><?php echo isset($booking['yatra_tour_name']) ? esc_html($booking['yatra_tour_name']) : ''; ?></h2>
    </div>
    <?php $currency_symbol = yatra_get_current_currency_symbol($meta['yatra_currency']); ?>
    <div class="yatra-box-data-content inside">
        <div class="yatra-booking-item-summary">

            <div class="yatra-booking-single-field clearfix">
                <span class="yatra-admin-head">Booking Date :</span>
                <span class="yatra-admin-tail"><?php echo esc_html($meta['booking_date']) ?></span>
            </div>

            <div class="yatra-booking-single-field clearfix">
                <span class="yatra-admin-head">Tour :</span>
                <span class="yatra-admin-tail"><a
                            href="<?php echo esc_attr(get_permalink(absint($booking['yatra_tour_id']))) ?>"
                            target="_blank"><?php echo esc_html($booking['yatra_tour_name']) ?></a></span>
            </div>
            <div class="yatra-booking-single-field clearfix">
                <span class="yatra-admin-head">Travel Date :</span>
                <span class="yatra-admin-tail"><?php echo esc_html($booking['yatra_selected_date']) ?></span>
            </div>
            <?php

            ?>
        </div>
        <?php

        $instance->pricing_header();

        $instance->pricing_item($booking, $booking['yatra_tour_id']);

        $instance->pricing_footer();
        ?>
    </div>
</div>


