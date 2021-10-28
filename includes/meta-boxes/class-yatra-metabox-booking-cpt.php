<?php
if (!class_exists('Yatra_Metabox_Booking_CPT')) {

    class Yatra_Metabox_Booking_CPT extends Yatra_Metabox_Base
    {

        function __construct()
        {
            add_action('add_meta_boxes', array($this, 'metabox_form'));

            add_action('save_post', array($this, 'save'));


        }

        public function metabox_config($key = null, $get_merge_all_field = false)
        {

            $config = array();

            return $config;
        }

        /**
         * Adds metabox for trip pricing.
         *
         * @since 1.0.0
         */
        public function metabox_form()
        {

            remove_meta_box('submitdiv', 'yatra-booking', 'side');

            $screens = array('yatra-booking');

            foreach ($screens as $screen) {
                add_meta_box(
                    'booking_meta_information',
                    __('Booking Additional Information', 'yatra'),
                    array($this, 'callback'),
                    $screen,
                    'normal',
                    'high'
                );
            }
        }

        // Tab for notice listing and settings
        public function callback($args)
        {
            $booking_id = $args->ID;

            $yatra_booking_meta_params = get_post_meta($booking_id, 'yatra_booking_meta_params', true);

            $yatra_booking_meta = get_post_meta($booking_id, 'yatra_booking_meta', true);

            $yatra_tour_customer_info = isset($yatra_booking_meta_params['yatra_tour_customer_info']) ? $yatra_booking_meta_params['yatra_tour_customer_info'] : array();

            ?>
            <div class="yatra-booking-meta-information">
                <h2><?php echo __('Tour Information', 'yatra'); ?></h2>
                <table class="yatra-booking-meta-info">
                    <tr>
                        <th><?php echo __('Tour', 'yatra'); ?></th>
                        <th><?php echo __('Number of person', 'yatra'); ?></th>
                        <th><?php echo __('Pricing Label', 'yatra'); ?></th>
                        <th><?php echo __('Regular Price', 'yatra'); ?></th>
                        <th><?php echo __('Sales Price', 'yatra'); ?></th>
                        <th><?php echo __('Price Per', 'yatra'); ?></th>
                        <th><?php echo __('Group Size', 'yatra'); ?></th>
                        <th><?php echo __('Toal Price', 'yatra'); ?></th>
                        <th><?php echo __('Durations', 'yatra'); ?></th>
                    </tr>
                    <?php
                    $yatra_booking_meta = !is_array($yatra_booking_meta) ? array() : $yatra_booking_meta;


                    foreach ($yatra_booking_meta as $id => $booking) {


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
                        $yatra_tour_meta_tour_fixed_departure = isset($booking['yatra_tour_meta_tour_fixed_departure']) ? (boolean)$booking['yatra_tour_meta_tour_fixed_departure'] : false;
                        $yatra_tour_meta_tour_start_date = isset($booking['yatra_tour_meta_tour_start_date']) ? $booking['yatra_tour_meta_tour_start_date'] : '';
                        $yatra_tour_meta_tour_end_date = isset($booking['yatra_tour_meta_tour_end_date']) ? $booking['yatra_tour_meta_tour_end_date'] : '';
                        $yatra_multiple_pricing = isset($booking['yatra_multiple_pricing']) ? $booking['yatra_multiple_pricing'] : '';
                        $yatra_multiple_pricing = is_array($yatra_multiple_pricing) && @count($yatra_multiple_pricing) > 0 ? $yatra_multiple_pricing : null;

                        if (!$yatra_tour_meta_tour_fixed_departure) {
                            $durations = absint($yatra_tour_meta_tour_duration_days) . ' Days ' . absint($yatra_tour_meta_tour_duration_nights) . ' Nights';
                        } else {
                            $durations = esc_html($yatra_tour_meta_tour_start_date) . ' to ' . esc_html($yatra_tour_meta_tour_end_date);
                        }
                        if (is_array($yatra_multiple_pricing) && !is_null($yatra_multiple_pricing)) {

                            $multiple_pricing_index = 0;

                            foreach ($yatra_multiple_pricing as $pricing_id => $pricing) {

                                $variable_pricing_per = isset($pricing['pricing_per']) ? $pricing['pricing_per'] : '';
                                $variable_group_size = isset($pricing['group_size']) ? $pricing['group_size'] : '';
                                $variable_group_size = $variable_pricing_per == '' ? absint($yatra_tour_meta_group_size) : absint($variable_group_size);
                                $variable_group_size = $variable_group_size == 0 ? 1 : $variable_group_size;
                                $variable_pricing_per = $variable_pricing_per === '' ? $yatra_tour_meta_price_per : $variable_pricing_per;

                                $this->generate_table_row(
                                    $yatra_tour_name,
                                    $number_of_person[$pricing_id],
                                    $pricing['pricing_label'],
                                    $yatra_currency_symbol . $pricing['regular_price'],
                                    $yatra_currency_symbol . $pricing['sales_price'],
                                    $variable_pricing_per,
                                    $variable_group_size,
                                    $yatra_currency_symbol . $total_tour_price,
                                    $durations,
                                    $id,
                                    array('index' => $multiple_pricing_index, 'count' => count($yatra_multiple_pricing))
                                );
                                $multiple_pricing_index++;
                            }
                        } else {


                            $this->generate_table_row(
                                $yatra_tour_name,
                                $number_of_person,
                                'pricing label',
                                $yatra_currency_symbol . $yatra_tour_meta_regular_price,
                                $yatra_currency_symbol . $yatra_tour_meta_sales_price,
                                $yatra_tour_meta_price_per,
                                $yatra_tour_meta_group_size,
                                $yatra_currency_symbol . $total_tour_price,
                                $durations,
                                $id
                            );
                        }
                    } ?>
                </table>

                <h2><?php echo __('Booking Customer Information', 'yatra'); ?></h2>
                <table class="yatra-booking-meta-customer-info" cellpadding="0" cellspacing="0">
                    <tr>
                        <th><?php echo __('Fullname', 'yatra'); ?></th>
                        <th><?php echo __('Email', 'yatra'); ?></th>
                        <th><?php echo __('Country', 'yatra'); ?></th>
                        <th><?php echo __('Phone', 'yatra'); ?></th>
                        <th><?php echo __('Total Booking Price', 'yatra'); ?></th>
                        <th><?php echo __('Booking Code', 'yatra'); ?></th>

                    </tr>
                    <?php
                    echo '<tr>';

                    $fullname = isset($yatra_tour_customer_info['fullname']) ? $yatra_tour_customer_info['fullname'] : '';
                    $email = isset($yatra_tour_customer_info['email']) ? $yatra_tour_customer_info['email'] : '';
                    $country = isset($yatra_tour_customer_info['country']) ? $yatra_tour_customer_info['country'] : '';
                    $phone_number = isset($yatra_tour_customer_info['phone_number']) ? $yatra_tour_customer_info['phone_number'] : '';
                    $total_booking_price = isset($yatra_booking_meta_params['total_booking_price']) ? $yatra_booking_meta_params['total_booking_price'] : '';
                    $currency_symbol = isset($yatra_booking_meta_params['currency_symbol']) ? $yatra_booking_meta_params['currency_symbol'] : '';
                    $booking_code = isset($yatra_booking_meta_params['booking_code']) ? $yatra_booking_meta_params['booking_code'] : '';


                    // Fullname
                    echo '<td>';

                    echo '<span>' . esc_html($fullname) . '</span>';

                    echo '</td>';

                    // Email
                    echo '<td>';

                    echo '<span>' . esc_html($email) . '</span>';

                    echo '</td>';

                    // Country
                    echo '<td>';

                    if (!empty($country)) {
                        echo '<span>' . esc_html(yatra_get_countries($country)) . '</span>';
                    }

                    echo '</td>';

                    // Phone
                    echo '<td>';

                    echo '<span>' . esc_html($phone_number) . '</span>';

                    echo '</td>';

                    // Total Booking Price
                    echo '<td>';

                    echo '<span>' . esc_html($currency_symbol) . absint($total_booking_price) . '</span>';

                    echo '</td>';

                    // Booking Code
                    echo '<td>';

                    echo '<span>' . esc_html($booking_code) . '</span>';

                    echo '</td>';

                    echo '<tr>';
                    ?>
                </table>
                <div style="clear:both; margin-top:20px;"></div>
                <label><strong><?php echo __('Booking Status', 'yatra') ?></strong></label>
                <?php
                $current_status = $args->post_status;
                $booking_status = yatra_get_booking_statuses();

                ?>
                <select name="yatra_booking_status" cellpadding="0" cellspacing="0">
                    <?php foreach ($booking_status as $status_key => $status) {
                        $selected = $status_key == $current_status ? 'selected="selected"' : '';
                        echo '<option ' . $selected . ' value="' . esc_attr($status_key) . '">' . esc_html($status) . '</option>';
                    } ?>
                </select>
                <input name="save" type="submit" class="button button-primary button-large" id="publish" value="Update">

                <input type="hidden" value="<?php echo wp_create_nonce('yatra_booking_post_type_metabox_nonce') ?>"
                       name="yatra_booking_post_type_metabox_nonce"/>

                <?php
                $payment_log = get_post_meta($booking_id, 'yatra_payment_message', true);
                if ($payment_log != '' && !empty($payment_log)) {
                    ?>
                    <h2><?php echo __('Payment Log', 'yatra') ?></h2>
                    <div class="yatra-booking-payment-information">
                        <p><?php
                            echo esc_html($payment_log);
                            ?></p>
                    </div>
                <?php } ?>
            </div>
            <?php

        }

        public function generate_table_row(
            $tour_title,
            $number_of_person,
            $pricing_label,
            $regular_price,
            $sales_price,
            $price_per,
            $group_size,
            $total_price,
            $durations,
            $id,
            $multiple_pricing = array()
        )
        {
            $index = isset($multiple_pricing['index']) ? absint($multiple_pricing['index']) : '';
            $count = isset($multiple_pricing['count']) ? absint($multiple_pricing['count']) : '';
            $row_merge_text = $index == '' && $count == '' ? '' : ' rowspan="' . absint($count) . '" ';
            $row_class = $index == 0 || $index == '' ? 'new-item' : '';
            ?>
            <tr class="<?php echo esc_attr($row_class); ?>">
                <?php
                if (FALSE === get_post_status($id) || "trash" === get_post_status($id)) {
                    $tour_url_attribute = '';
                } else {
                    $tour_url_attribute = 'href="' . esc_url(admin_url('post.php?post=' . absint($id)) . '&action=edit') . '" ';
                }
                if ($index == 0 || ($index == '' && $count == '')) {
                    ?>
                    <td <?php echo $row_merge_text; ?>>
                        <?php echo '<a ' . $tour_url_attribute . '>' . esc_html($tour_title) . '</a>';
                        ?>
                    </td>
                    <?php
                }
                ?>
                <td><span><?php echo absint($number_of_person) ?></span></td>
                <td><span><?php echo esc_html($pricing_label) ?></span></td>
                <td><span><?php echo esc_html($regular_price) ?></span></td>
                <td><span><?php echo esc_html($sales_price) ?></span></td>
                <td><span><?php echo esc_html($price_per) ?></span></td>
                <td><span><?php echo esc_html($group_size) ?></span></td>
                <?php if ($index == 0 || ($index == '' && $count == '')) {
                    ?>
                    <td <?php echo $row_merge_text; ?>><span><?php echo esc_html($total_price) ?></span></td>
                    <td <?php echo $row_merge_text; ?>><span><?php echo esc_html($durations) ?></span></td>
                <?php } ?>

            </tr>
            <?php
        }

        /**
         * When the post is saved, saves our custom data.
         *
         * @param int $post_id The ID of the post being saved.
         */
        public function save($post_id)
        {
            $nonce = isset($_POST['yatra_booking_post_type_metabox_nonce']) ? ($_POST['yatra_booking_post_type_metabox_nonce']) : '';

            if (isset($_POST['yatra_booking_post_type_metabox_nonce'])) {

                $is_valid_nonce = wp_verify_nonce($nonce, 'yatra_booking_post_type_metabox_nonce');

                if ($is_valid_nonce) {

                    $post_status = isset($_POST['yatra_booking_status']) ? $_POST['yatra_booking_status'] : '';

                    $booking_statuses = array_keys(yatra_get_booking_statuses());

                    if (in_array($post_status, $booking_statuses)) {

                        if (!wp_is_post_revision($post_id)) {

                            // unhook this function so it doesn't loop infinitely
                            remove_action('save_post', array($this, 'save'));

                            yatra_update_booking_status($post_id, $post_status);
                            // re-hook this function
                            add_action('save_post', array($this, 'save'));
                        }

                    }
                }
            }

        }


    }
}