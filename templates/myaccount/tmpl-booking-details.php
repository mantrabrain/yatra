<?php
/**
 * My Orders - Deprecated
 *
 * @deprecated 2.6.0 this template file is no longer used. My Account shortcode uses bookings.php.
 */

if (!defined('ABSPATH')) {
    exit;
}

?>
<a href="<?php echo add_query_arg(array(
    'page_type' => 'bookings',
), get_permalink()); ?>"><span style="font-size:20px;" class="fa fa-arrow-alt-circle-left"></span></a>
<h2><?php echo __('Booking Details', 'yatra'); ?></h2>

<table class="yatra-booking-table my_account_booking_details">
    <thead>
    <tr style="text-align:left">
        <th><?php echo __('Tour', 'yatra'); ?></th>
        <th><?php echo __('Date', 'yatra'); ?></th>
        <th><?php echo __('Pricing Details', 'yatra'); ?></th>
        <th><?php echo __('Total Price', 'yatra'); ?></th>

    </tr>
    </thead>
    <tbody>
    <?php

    foreach ($yatra_booking_meta as $id => $booking) {

        echo '<tr>';
        $pricing = isset($booking['yatra_pricing']) ? $booking['yatra_pricing'] : array();
        $yatra_tour_name = isset($booking['yatra_tour_name']) ? $booking['yatra_tour_name'] : '';
        $yatra_tour_meta_regular_price = isset($booking['yatra_tour_meta_regular_price']) ? $booking['yatra_tour_meta_regular_price'] : '';
        $yatra_tour_meta_sales_price = isset($booking['yatra_tour_meta_sales_price']) ? $booking['yatra_tour_meta_sales_price'] : '';
        $yatra_tour_meta_group_size = isset($booking['yatra_tour_meta_group_size']) ? $booking['yatra_tour_meta_group_size'] : '';
        $yatra_tour_meta_price_per = isset($booking['yatra_tour_meta_price_per']) ? $booking['yatra_tour_meta_price_per'] : '';
        $number_of_person = isset($booking['number_of_person']) ? $booking['number_of_person'] : '';
        $total_tour_price = isset($booking['total_tour_price']) ? $booking['total_tour_price'] : yatra_get_final_tour_price($id, $number_of_person);
        $yatra_tour_meta_tour_duration_nights = isset($booking['yatra_tour_meta_tour_duration_nights']) ? $booking['yatra_tour_meta_tour_duration_nights'] : '';
        $yatra_tour_meta_tour_duration_days = isset($booking['yatra_tour_meta_tour_duration_days']) ? $booking['yatra_tour_meta_tour_duration_days'] : '';
        $yatra_currency_symbol = isset($booking['yatra_currency_symbol']) ? $booking['yatra_currency_symbol'] : '';


        // Tour Name
        echo '<td>';


        echo '<a target="_blank" href="' . esc_url(get_permalink(absint($id))) . '">' . esc_html($yatra_tour_name) . '</a>';

        echo '</td>';

        // Booking Date
        echo '<td>';

        echo '<span>';

        echo isset($booking['yatra_selected_date']) ? esc_html($booking['yatra_selected_date']) : '';


        echo '</span>';

        echo '</td>';


        // pricing details

        echo '<td>';

        echo '<button class="yatra-tippy-tooltip" data-tippy-content="' . yatra_pricing_html($pricing, $yatra_currency_symbol, $number_of_person) . '">';

        echo '<span class="fa fa-info"></span>';

        echo '</button>';

        echo '</td>';

        // Total Tour Price
        echo '<td>';

        echo '<span>' . esc_html(yatra_get_price($yatra_currency_symbol, $total_tour_price)) . '</span>';

        echo '</td>';

        echo '<tr>';
    } ?>
    </tbody>
</table>
