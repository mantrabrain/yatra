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

                <?php

                $this->tour_info($yatra_booking_meta);
                //$this->pricing_info($yatra_booking_meta);
                $this->customer_info($booking_id, $args, $yatra_tour_customer_info, $yatra_booking_meta_params);
                ?>


            </div>
            <?php

        }

        public function tour_info($yatra_booking_meta)
        {
            $yatra_booking_meta = !is_array($yatra_booking_meta) ? array() : $yatra_booking_meta;

            foreach ($yatra_booking_meta as $id => $booking) {

                echo '<div class="yatra-booking-tour-information">';

                $this->tour_item($booking);

                $this->pricing_header();

                $this->pricing_item($booking, $id);

                $this->pricing_footer();

                do_action('yatra_tour_booking_info_loop', $id, $booking);

                echo '</div>';
            }
        }

        public function tour_item($booking)
        {
          
            echo '<div class="yatra-tour-booking-info-item">';
            echo '<h2 class="tour-name">Tour: ' . esc_html($booking['yatra_tour_name']) . '</h2>';
            echo '<span class="booking-date">Booked Date: ' . esc_html($booking['yatra_selected_date']) . '</span>';
            echo '<span class="price">Booking Total: ' . esc_html(yatra_get_price($booking['yatra_currency_symbol'], $booking['total_tour_price'])) . '</span>';
            echo '</div>';

        }

        public function pricing_header()
        {
            ?>
            <table class="yatra-booking-meta-info">
            <thead>
            <tr>
                <th><?php echo __('Number of person', 'yatra'); ?></th>
                <th><?php echo __('Pricing Label', 'yatra'); ?></th>
                <th><?php echo __('Regular Price', 'yatra'); ?></th>
                <th><?php echo __('Sales Price', 'yatra'); ?></th>
                <th><?php echo __('Price Per', 'yatra'); ?></th>
                <th><?php echo __('Group Size', 'yatra'); ?></th>
                <th><?php echo __('Toal Price', 'yatra'); ?></th>
            </tr>
            </thead>
            <tbody>
            <?php

        }

        public function pricing_item($booking, $id)
        {
            $yatra_pricing = isset($booking['yatra_pricing']) ? $booking['yatra_pricing'] : array();

            $number_of_person = isset($booking['number_of_person']) ? $booking['number_of_person'] : 1;

            $yatra_tour_name = isset($booking['yatra_tour_name']) ? $booking['yatra_tour_name'] : '';

            $total_tour_price = isset($booking['total_tour_price']) ? $booking['total_tour_price'] : null;

            $yatra_currency_symbol = isset($booking['yatra_currency_symbol']) ? $booking['yatra_currency_symbol'] : '';

            $durations = $booking['yatra_selected_date'];

            if (is_array($yatra_pricing) && (!$yatra_pricing instanceof Yatra_Tour_Pricing)) {

                $multiple_pricing_index = 0;

                /* @var $pricing Yatra_Tour_Pricing */
                foreach ($yatra_pricing as $pricing) {


                    $variable_pricing_per = $pricing->getPricingPer();

                    $variable_group_size = $variable_pricing_per == "person" ? null : $pricing->getGroupSize();

                    $person = isset($number_of_person[$pricing->getID()]) ? $number_of_person[$pricing->getID()] : '';

                    $this->generate_table_row(
                        $yatra_tour_name,
                        $person,
                        $pricing->getLabel(),
                        yatra_get_price($yatra_currency_symbol, $pricing->getRegularPrice()),
                        yatra_get_price($yatra_currency_symbol, $pricing->getSalesPrice()),
                        $variable_pricing_per,
                        $variable_group_size,
                        yatra_get_price($yatra_currency_symbol, $total_tour_price),
                        $durations,
                        $id,
                        array('index' => $multiple_pricing_index, 'count' => count($yatra_pricing))
                    );
                    $multiple_pricing_index++;
                }
            } else {

                /* @var $yatra_pricing Yatra_Tour_Pricing */

                $this->generate_table_row(
                    $yatra_tour_name,
                    $number_of_person,
                    $yatra_pricing->getLabel(),
                    yatra_get_price($yatra_currency_symbol, $yatra_pricing->getRegularPrice()),
                    yatra_get_price($yatra_currency_symbol, $yatra_pricing->getSalesPrice()),
                    $yatra_pricing->getPricingPer(),
                    $yatra_pricing->getGroupSize(),
                    yatra_get_price($yatra_currency_symbol, $total_tour_price),
                    $durations,
                    $id
                );
            }

        }

        public function pricing_footer()
        {
            ?>
            </tbody>
            </table>
            <?php

        }

        public function customer_info($booking_id, $args, $yatra_tour_customer_info, $yatra_booking_meta_params)
        {
            ?>
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
                <td><span><?php echo esc_html($number_of_person) ?></span></td>
                <td><span><?php echo esc_html($pricing_label) ?></span></td>
                <td><span><?php echo esc_html($regular_price) ?></span></td>
                <td><span><?php echo esc_html($sales_price) ?></span></td>
                <td><span><?php echo esc_html($price_per) ?></span></td>
                <td><span><?php echo esc_html($group_size) ?></span></td>
                <?php if ($index == 0 || ($index == '' && $count == '')) {
                    ?>
                    <td <?php echo $row_merge_text; ?>><span><?php echo esc_html($total_price) ?></span></td>
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