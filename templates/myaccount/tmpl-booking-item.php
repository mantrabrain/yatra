<?php

$pricing = isset($booking['yatra_pricing']) ? $booking['yatra_pricing'] : array();

$number_of_person = isset($booking['number_of_person']) ? $booking['number_of_person'] : '';

$person_count = is_array($number_of_person) ? array_sum($number_of_person) : absint($number_of_person);

$total_tour_price = !isset($booking['total_tour_final_price']) ? $booking['total_tour_price'] : $booking['total_tour_final_price'];

$yatra_tour_meta_tour_duration_nights = isset($booking['yatra_tour_meta_tour_duration_nights']) ? $booking['yatra_tour_meta_tour_duration_nights'] : '';

$yatra_tour_meta_tour_duration_days = isset($booking['yatra_tour_meta_tour_duration_days']) ? $booking['yatra_tour_meta_tour_duration_days'] : '';

$currency = isset($booking['yatra_currency']) ? $booking['yatra_currency'] : '';

$yatra_currency_symbol = $currency != '' ? yatra_get_current_currency_symbol($currency) : '';

$duration_string = '' != $yatra_tour_meta_tour_duration_days ? $yatra_tour_meta_tour_duration_days . ' days ' : '';

$duration_string .= '' != $yatra_tour_meta_tour_duration_nights ? $yatra_tour_meta_tour_duration_nights . ' nights' : '';

$duration_string = '' != $duration_string ? __('Duration: ', 'yatra') . $duration_string : '';

?>
<div class="yatra-account-booking-item-row-wrap">
    <h3 class="tour-title">
        <?php
        echo esc_html__('Tour Price', 'yatra');
        echo ' [ <a target="_blank" href="' . esc_url(get_permalink(absint($id))) . '">' . esc_html($booking['yatra_tour_name']) . '</a> ]';
        ?>
    </h3>
    <div class="yatra-account-booking-item-row">

        <span class="tour-date">
        <?php
        echo isset($booking['yatra_selected_date']) ? __('Date: ', 'yatra') . esc_html($booking['yatra_selected_date']) : '';

        ?>
    </span>
        <span class="person-count"><?php echo __('Persons: ', 'yatra') . esc_html($person_count) ?></span>
        <span class="tour-durations">
        <?php
        echo esc_html($duration_string);
        ?>
    </span>
        <span class="total-price">
        <?php
        echo '<span>' . __('Total Price: ', 'yatra') . esc_html(yatra_get_price($yatra_currency_symbol, $total_tour_price)) . '</span>';

        ?>
    </span>

    </div>
    <div class="yatra-booking-pricing-additional-services-wrap">
        <div class="yatra-booking-pricing-table-wrap">

            <table class="yatra-booking-pricing-table">
                <thead>
                <tr>
                    <th><?php echo esc_html__('Number of person', 'yatra') ?></th>
                    <th><?php echo esc_html__('Pricing Label', 'yatra') ?></th>
                    <th><?php echo esc_html__('Regular Price', 'yatra') ?></th>
                    <th><?php echo esc_html__('Sales Price', 'yatra') ?></th>
                    <th><?php echo esc_html__('Price Per', 'yatra') ?></th>
                    <th><?php echo esc_html__('Group Size', 'yatra') ?></th>
                    <th><?php echo esc_html__('Total Price', 'yatra') ?></th>
                </tr>
                </thead>
                <tbody>
                <?php

                if ($pricing instanceof Yatra_Tour_Pricing) {

                    yatra_get_template('myaccount/pricing-item.php',
                        array('pricing' => $pricing,
                            'number_of_person' => $number_of_person,
                            'currency' => $yatra_currency_symbol,
                            'total_price' => $booking['total_tour_price'],
                            'count' => 1,
                            'merge' => false
                        ));

                } else {

                    $merge = true;

                    foreach ($pricing as $pricing_item) {

                        if ($pricing_item instanceof Yatra_Tour_Pricing) {

                            $person = is_array($number_of_person) && isset($number_of_person[$pricing_item->getID()]) ? $number_of_person[$pricing_item->getID()] : '';

                            yatra_get_template('myaccount/pricing-item.php',
                                array(
                                    'pricing' => $pricing_item,
                                    'number_of_person' => $person,
                                    'currency' => $yatra_currency_symbol,
                                    'total_price' => $booking['total_tour_price'],
                                    'count' => count($pricing),
                                    'merge' => $merge
                                ));
                            if ($merge) {
                                $merge = false;
                            }
                        }

                    }
                }
                ?>
                </tbody>
            </table>
        </div>
        <?php
        do_action('yatra_myaccount_tour_booking_item', $id, $booking);
        ?>
    </div>
</div>