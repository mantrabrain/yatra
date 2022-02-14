<?php
if (!class_exists('Yatra_Metabox_Booking_CPT')) {

    class Yatra_Metabox_Booking_CPT extends Yatra_Metabox_Base
    {
        private $screen_id = 'yatra-booking';

        function __construct()
        {
            add_action('add_meta_boxes', array($this, 'metabox_form'));

            add_action('save_post', array($this, 'save'));

            add_action('do_meta_boxes', array($this, 'remove_metabox'), 1, 3);


        }

        public function remove_metabox($post_type, $context, $post)
        {
            if ($this->screen_id === $post_type) {
                remove_meta_box('postcustom', $post_type, $context);
            }
        }

        function booking_status()
        {
            global $post;

            if (get_post_type($post) !== $this->screen_id) {
                return;
            }

            $current_status = $post->post_status;

            $booking = new Yatra_Tour_Booking($post->ID);

            $coupon = $booking->get_coupon();

            $currency = yatra_get_current_currency_symbol($booking->get_currency_code());

            $discount_amount = $coupon['calculated_value'] ?? 0;

            $discount_code = $coupon['code'] ?? '';

            $total_gross_price = $booking->get_total(false);

            $total_net_price = $booking->get_total();

            yatra_load_admin_template('metabox.booking.status', array(
                'currency' => $currency,
                'discount_amount' => $discount_amount,
                'discount_code' => $discount_code,
                'total_gross_price' => $total_gross_price,
                'total_net_price' => $total_net_price,
                'current_status' => $current_status
            ));

        }

        public function payment_information()
        {
            global $post;

            if (get_post_type($post) !== $this->screen_id) {
                return;
            }

            yatra_load_admin_template('metabox.booking.payment-status', array());

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
            $current_screen = get_current_screen();

            if (isset($current_screen)) {

                if (isset($current_screen->action)) {

                    if ($current_screen->action === "add") {

                        return;
                    }
                }
            }

            remove_meta_box('submitdiv', $this->screen_id, 'side');

            add_meta_box('yatra_booking_status_metabox', __('Booking Status', 'yatra'), array($this, 'booking_status'), $this->screen_id, 'side');

            add_meta_box('yatra_payment_information_metabox', __('Payment Information', 'yatra'), array($this, 'payment_information'), $this->screen_id, 'side');

            add_action('edit_form_after_editor', array($this, 'booking_details'));
        }

        public function booking_details($post)
        {

            global $post;

            if (get_post_type($post) !== $this->screen_id) {
                return;
            }

            $booking_id = $post->ID;

            $yatra_booking_meta_params = get_post_meta($booking_id, 'yatra_booking_meta_params', true);

            $yatra_booking_meta = get_post_meta($booking_id, 'yatra_booking_meta', true);

            $yatra_booking_meta = !is_array($yatra_booking_meta) ? array() : $yatra_booking_meta;

            echo '<div class="yatra-admin-booking-wrap">';

            echo '<div class="yatra-admin-booking-information">';

            yatra_load_admin_template('metabox.booking.tour', array(
                    'booking_meta' => $yatra_booking_meta,
                    'meta' => $yatra_booking_meta_params,
                    'instance' => $this
                )
            );

            echo '</div>';
            echo '<div class="yatra-admin-customer-information">';
            yatra_load_admin_template('metabox.booking.customer-info', array(

                    'info' => $yatra_booking_meta_params,
                    'customer' => $yatra_booking_meta_params['yatra_tour_customer_info'] ?? array()

                )
            );
            echo '</div>';
            echo '</div>';

        }


        public function pricing_header()
        {
            ?>
            <table class="yatra-booking-meta-info">
            <thead>
            <tr>
                <th><?php echo __('Pricing Label', 'yatra'); ?></th>
                <th><?php echo __('Number Of Person', 'yatra'); ?></th>
                <th><?php echo __('Regular Price', 'yatra'); ?></th>
                <th><?php echo __('Sales Price', 'yatra'); ?></th>
                <th><?php echo __('Price Per', 'yatra'); ?></th>
                <th><?php echo __('Group Size', 'yatra'); ?></th>
                <th><?php echo __('Total Price', 'yatra'); ?></th>
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

            $currency = isset($booking['yatra_currency']) ? $booking['yatra_currency'] : '';

            $yatra_currency_symbol = yatra_get_current_currency_symbol($currency);

            $durations = isset($booking['yatra_selected_date']) ? $booking['yatra_selected_date'] : '';

            if (is_array($yatra_pricing) && (!$yatra_pricing instanceof Yatra_Tour_Pricing)) {

                $multiple_pricing_index = 0;

                /* @var $pricing Yatra_Tour_Pricing */
                foreach ($yatra_pricing as $pricing) {


                    $variable_pricing_per = $pricing->getPricingPer();

                    $variable_group_size = $variable_pricing_per == "person" ? null : $pricing->getGroupSize();

                    $person = isset($number_of_person[$pricing->getID()]) ? $number_of_person[$pricing->getID()] : '';

                    $regular_price = $pricing->getRegularPrice() == '' ? 'N/A' : yatra_get_price($yatra_currency_symbol, $pricing->getRegularPrice());
                    $sales_price = $pricing->getSalesPrice() == '' ? 'N/A' : yatra_get_price($yatra_currency_symbol, $pricing->getSalesPrice());

                    $this->generate_table_row(
                        $yatra_tour_name,
                        $person,
                        $pricing->getLabel(),
                        $regular_price,
                        $sales_price,
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

                $regular_price = $yatra_pricing->getRegularPrice() == '' ? 'N/A' : yatra_get_price($yatra_currency_symbol, $yatra_pricing->getRegularPrice());
                $sales_price = $yatra_pricing->getSalesPrice() == '' ? 'N/A' : yatra_get_price($yatra_currency_symbol, $yatra_pricing->getSalesPrice());

                $this->generate_table_row(
                    $yatra_tour_name,
                    $number_of_person,
                    $yatra_pricing->getLabel(),
                    $regular_price,
                    $sales_price,
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
                <td><span><?php echo esc_html($pricing_label) ?></span></td>
                <td><span><?php echo esc_html($number_of_person) ?></span></td>
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