<div class="yatra-admin-booking-metabox-wrap postbox">
    <div class="yatra-box-data-head postbox-header">
        <h2 class="heading"><?php echo __('Booking Details', 'yatra') ?></h2>
    </div>
    <?php $currency_symbol = yatra_get_current_currency_symbol($meta['yatra_currency']); ?>
    <div class="yatra-box-data-content inside">
        <?php
        foreach ($booking_meta as $id => $booking) {

            $number_of_person = isset($booking['number_of_person']) ? $booking['number_of_person'] : '';

            $person_count = is_array($number_of_person) ? array_sum($number_of_person) : absint($number_of_person);

            $yatra_tour_meta_tour_duration_nights = isset($booking['yatra_tour_meta_tour_duration_nights']) ? $booking['yatra_tour_meta_tour_duration_nights'] : '';

            $yatra_tour_meta_tour_duration_days = isset($booking['yatra_tour_meta_tour_duration_days']) ? $booking['yatra_tour_meta_tour_duration_days'] : '';

            $duration_string = '' != $yatra_tour_meta_tour_duration_days ? $yatra_tour_meta_tour_duration_days . ' days ' : '';

            $duration_string .= '' != $yatra_tour_meta_tour_duration_nights ? $yatra_tour_meta_tour_duration_nights . ' nights' : '';

            $duration_string = '' != $duration_string ? __('Duration: ', 'yatra') . $duration_string : '';

            $total_tour_price = !isset($booking['total_tour_final_price']) ? $booking['total_tour_price'] : $booking['total_tour_final_price'];

            echo '<div class="yatra-booking-detail-item">';
            ?>
            <h3><?php echo esc_html__('Tour Price', 'yatra'); ?>
                [ <a
                        href="<?php echo esc_attr(get_permalink(absint($booking['yatra_tour_id']))) ?>"
                        target="_blank"><?php echo esc_html($booking['yatra_tour_name']) ?></a> ]
            </h3>

            <div class="yatra-booking-meta-item-row">

                <span class="tour-date"><?php echo esc_html__('Travel Date : ', 'yatra') ?><?php echo esc_html($booking['yatra_selected_date']) ?></span>
                <span class="person-count"><?php echo esc_html__('Persons : ', 'yatra') ?><?php echo esc_html($person_count) ?></span>
                <span class="tour-durations"><?php echo esc_html($duration_string) ?></span>
                <span class="total-price">
                 <span><?php echo esc_html__('Total Price : ', 'yatra') ?><?php echo esc_html(yatra_get_price($currency_symbol, $total_tour_price)) ?></span>    </span>

            </div>
            <?php

            /**
             * @var $instance Yatra_Metabox_Booking_CPT
             */
            $instance->pricing_header();

            $instance->pricing_item($booking, $booking['yatra_tour_id']);

            $instance->pricing_footer();

            do_action('yatra_tour_booking_info_loop', $id, $booking);

            echo '</div>';
        }
        ?>
    </div>
</div>


