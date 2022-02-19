<?php
if (!defined('ABSPATH')) {
    exit;
}

$my_booking_columns = apply_filters('yatra_my_account_my_booking_columns', array(
    'booking-code' => __('Booking Code', 'yatra'),
    'booking-date' => __('Booking Date', 'yatra'),
    'booking-status' => __('Status', 'yatra'),
    'booking-total' => __('Total', 'yatra'),
    'payment-status' => __('Payment Status', 'yatra')
));

if (count($booking_details) < 1) {
    echo '<h2>You haven\'t made any booking yet.</h2>';
    return;
}
if ($booking_details) : ?>

    <h2><?php echo apply_filters('yatra_my_account_my_booking_title', __('Recent Bookings', 'yatra')); ?></h2>

    <table class="yatra-booking-table my_account_booking">

        <thead>
        <tr>
            <?php foreach ($my_booking_columns as $column_id => $column_name) : ?>
                <th class="<?php echo esc_attr($column_id); ?>"><span
                            class="nobr"><?php echo esc_html($column_name); ?></span></th>
            <?php endforeach; ?>
        </tr>
        </thead>

        <tbody>
        <?php

        foreach ($booking_details as $booking) :

            $checkout_page_permalink = add_query_arg(array(
                'booking_id' => absint($booking->booking_id),
            ), yatra_get_checkout_page(true));

            $item_count = $booking->number_of_tours;
            ?>
            <tr class="booking">
                <?php foreach ($my_booking_columns as $column_id => $column_name) : ?>
                    <td class="<?php echo esc_attr($column_id); ?>" data-title="<?php echo esc_attr($column_name); ?>">
                        <?php if (has_action('yatra_my_account_my_booking_column_' . $column_id)) : ?>
                            <?php do_action('yatra_my_account_my_booking_column_' . $column_id, $booking); ?>

                        <?php elseif ('booking-id' === $column_id) : ?>
                            <a href="<?php echo add_query_arg(array(
                                'page_type' => 'bookings',
                                'booking_id' => absint($booking->booking_id),
                            ), get_permalink()); ?>">
                                <?php echo _x('#', 'hash before booking number', 'yatra') . $booking->booking_id;

                                ?>
                            </a>
                        <?php elseif ('booking-code' === $column_id) : ?>
                            <a data-attr="<?php echo $booking->booking_id; ?>" href="<?php echo add_query_arg(array(
                                'page_type' => 'bookings',
                                'booking_id' => absint($booking->booking_id),
                            ), get_permalink()); ?>">
                                <?php echo esc_html($booking->booking_code);

                                ?>
                            </a>

                        <?php elseif ('booking-date' === $column_id) : ?>
                            <time title="<?php echo esc_attr(yatra_get_date(false, $booking->booking_date)) ?>"
                                  datetime="<?php echo esc_attr('date'); ?>"><?php echo esc_html(yatra_get_date(true, $booking->booking_date)); ?></time>

                        <?php elseif ('booking-status' === $column_id) : ?>
                            <?php echo '<span class="booking-status ' . esc_attr(strtolower($booking->booking_status_key)) . '">' . esc_html($booking->booking_status) . '</span>'; ?>

                        <?php elseif ('booking-total' === $column_id) : ?>
                            <?php
                            /* translators: 1: formatted booking total 2: total booking items */
                            printf(_n('%1$s for %2$s tour', '%1$s for %2$s tours', $item_count, 'yatra'), yatra_get_price($booking->booking_currency_symbol, $booking->booking_total), $item_count);
                            ?>

                        <?php elseif ('payment-status' === $column_id) : ?>
                            <div class="yatra-account-payment-status">
                                <?php
                                echo '<p>' . esc_html($booking->payment_status) . '</p>';
                                if ($booking->payment_status_key === 'pending' && (in_array($booking->booking_status_key, array('pending', 'processing', 'on-hold')))) {
                                    echo '<a class="yatra-booking-payment-action fas fa-dollar-sign" title="' . esc_attr($booking->make_payment_text) . '" href="' . $checkout_page_permalink . '"></a>';
                                }
                                ?>
                            </div>
                        <?php endif; ?>
                    </td>
                <?php endforeach; ?>
            </tr>
        <?php endforeach; ?>
        </tbody>
    </table>
<?php endif; ?>
