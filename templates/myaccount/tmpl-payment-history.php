<?php
if (!defined('ABSPATH')) {
    exit;
}

$payment_history_columns = apply_filters('yatra_my_account_payment_history_columns', array(
    'payment_id' => __('Payment ID', 'yatra'),
    'payment_gateway' => __('Gateway', 'yatra'),
    'date' => __('Date', 'yatra'),
    'booking_id' => __('Booking ID', 'yatra'),
    'payable_amount' => __('Amount', 'yatra'),
    'status' => __('Payment Status', 'yatra')
));

if (count($payment_details) < 1) {
    echo '<h2>You haven\'t made any payment yet.</h2>';
    return;
}

if ($payment_details) : ?>

    <h2><?php echo apply_filters('yatra_my_account_my_payment_history_title', __('Payment History', 'yatra')); ?></h2>

    <table class="yatra-booking-table payment-history-table">

        <thead>
        <tr>
            <?php foreach ($payment_history_columns as $column_id => $column_name) : ?>
                <th class="<?php echo esc_attr($column_id); ?>"><span
                            class="nobr"><?php echo esc_html($column_name); ?></span></th>
            <?php endforeach; ?>
        </tr>
        </thead>

        <tbody>
        <?php

        foreach ($payment_details as $payment_id => $payment_detail) :
            $currency = $payment_detail['currency_code'];
            $currency_symbol = yatra_get_current_currency_symbol($currency);
            $checkout_page_permalink = add_query_arg(array(
                'booking_id' => absint($payment_detail['booking_id']),
            ), yatra_get_checkout_page(true));
            ?>
            <tr class="booking">
                <?php foreach ($payment_history_columns as $column_id => $column_name) : ?>
                    <td class="<?php echo esc_attr($column_id); ?>" data-title="<?php echo esc_attr($column_name); ?>">
                        <?php if (has_action('yatra_my_account_payment_history_column_' . $column_id)) : ?>
                            <?php do_action('yatra_my_account_payment_history_column_' . $column_id, $booking); ?>

                        <?php elseif ('payment_id' === $column_id) : ?>

                            <span><?php echo absint($payment_id) ?></span>
                        <?php elseif ('payment_gateway' === $column_id) : ?>
                            <span><?php echo esc_attr($payment_detail['payment_gateway']); ?></span>

                        <?php elseif ('date' === $column_id) : ?>
                            <time title="<?php echo esc_attr(yatra_get_date(false, $payment_detail['payment_date'])) ?>"
                                  datetime="<?php echo esc_attr('date'); ?>"><?php echo esc_html(yatra_get_date(true, $payment_detail['payment_date'])); ?></time>

                        <?php elseif ('booking_id' === $column_id) : ?>
                            <a href="<?php echo add_query_arg(array(
                                'page_type' => 'bookings',
                                'booking_id' => absint($payment_detail['booking_id']),
                            ), get_permalink()); ?>">
                                <?php echo _x('#', 'hash before booking number', 'yatra') . $payment_detail['booking_id'];

                                ?>
                            </a>
                        <?php elseif ('payable_amount' === $column_id) : ?>
                            <span><?php echo esc_html(yatra_get_price($currency_symbol, $payment_detail['payable_amount'])); ?></span>
                        <?php elseif ('status' === $column_id) : ?>
                            <div class="yatra-account-payment-status">
                                <span><?php echo esc_html($payment_detail['status']) ?></span>
                            </div>
                        <?php endif; ?>
                    </td>
                <?php endforeach; ?>
            </tr>
        <?php endforeach; ?>
        </tbody>
    </table>
<?php endif; ?>
