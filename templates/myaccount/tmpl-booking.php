<?php
/**
 * My Orders - Deprecated
 *
 * @deprecated 2.6.0 this template file is no longer used. My Account shortcode uses bookings.php.
 */

if (!defined('ABSPATH')) {
    exit;
}

$my_booking_columns = apply_filters('yatra_my_account_my_booking_columns', array(
    'booking-id' => __('ID', 'yatra'),
    'booking-code' => __('Booking Code', 'yatra'),
    'booking-date' => __('Date', 'yatra'),
    'booking-status' => __('Status', 'yatra'),
    'booking-total' => __('Total', 'yatra'),
//    'booking-actions' => '&nbsp;',
));


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
        <?php foreach ($booking_details as $booking) :

            $item_count = $booking->number_of_tours;
            ?>
            <tr class="booking">
                <?php foreach ($my_booking_columns as $column_id => $column_name) : ?>
                    <td class="<?php echo esc_attr($column_id); ?>" data-title="<?php echo esc_attr($column_name); ?>">
                        <?php if (has_action('yatra_my_account_my_booking_column_' . $column_id)) : ?>
                            <?php do_action('yatra_my_account_my_booking_column_' . $column_id, $booking); ?>

                        <?php elseif ('booking-id' === $column_id) : ?>
                            <a href="<?php echo  add_query_arg(array(
                                'page_type' => 'bookings',
                                'booking_id' => absint($booking->booking_id),
                            ), get_permalink());?>">
                                <?php echo _x('#', 'hash before booking number', 'yatra') . $booking->booking_id;

                                ?>
                            </a>
                        <?php elseif ('booking-code' === $column_id) : ?>
                            <a data-attr="<?php echo $booking->booking_id;?>" href="<?php echo add_query_arg(array(
                                'page_type' => 'bookings',
                                'booking_id' => absint($booking->booking_id),
                            ), get_permalink());?>">
                                <?php echo esc_html($booking->booking_code);

                                ?>
                            </a>

                        <?php elseif ('booking-date' === $column_id) : ?>
                            <time datetime="<?php echo esc_attr('date'); ?>"><?php echo esc_html($booking->booking_date); ?></time>

                        <?php elseif ('booking-status' === $column_id) : ?>
                            <?php echo esc_html($booking->booking_status); ?>

                        <?php elseif ('booking-total' === $column_id) : ?>
                            <?php
                            /* translators: 1: formatted booking total 2: total booking items */
                            printf(_n('%1$s for %2$s tour', '%1$s for %2$s tours', $item_count, 'yatra'), $booking->booking_currency_symbol . '' . $booking->booking_total, $item_count);
                            ?>

                        <?php elseif ('booking-actions' === $column_id) : ?>
                            <?php
                            $actions = array();

                            if (!empty($actions)) {
                                foreach ($actions as $key => $action) {
                                    echo '<a href="' . esc_url($action['url']) . '" class="button ' . sanitize_html_class($key) . '">' . esc_html($action['name']) . '</a>';
                                }
                            }
                            ?>
                        <?php endif; ?>
                    </td>
                <?php endforeach; ?>
            </tr>
        <?php endforeach; ?>
        </tbody>
    </table>
<?php endif; ?>
