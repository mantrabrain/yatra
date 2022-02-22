<?php

class Yatra_Payment
{
    public function payment_statuses()
    {
        return array(
            'processing' => __('Pending', 'yatra'),
            'publish' => __('Completed', 'yatra'),
            'hold' => __('On Hold', 'yatra'),
            'refunded' => __('Refunded', 'yatra'),
            'failed' => __('Failed', 'yatra')
        );
    }

    public function create($booking_id, $payment_gateway)
    {

        if (!$booking_id || $booking_id < 1) {
            return;
        }
        $booking = get_post($booking_id);

        $booking_status = $booking->post_status ?? '';

        if (!in_array($booking_status, array('yatra-pending', 'yatra-processing'))) {

            return;
        }

        $booking_details = new Yatra_Tour_Booking($booking_id);

        $all_booking_details = $booking_details->get_all_booking_details();

        $title = 'Payment - #' . $booking_id;

        $paid_amount = $this->get_total_paid_amount($booking_id);

        $total_amount = $booking_details->get_total(true);

        $due_amount = ($total_amount - $paid_amount) > 0 ? ($total_amount - $paid_amount) : 0;

        $all_payment_info = $this->get_all_info($booking_id);

        $installment = is_array($all_payment_info) ? (count($all_payment_info) + 1) : 1;

        $payment_type = floatval($paid_amount) > 0 ? 'partial' : 'full';

        $post_array = apply_filters('yatra_before_payment_created', array(
            'post_title' => $title,
            'post_content' => '',
            'post_status' => 'processing',
            'post_slug' => uniqid(),
            'post_type' => 'yatra-payment',
            'meta_input' => array(
                'booking_details' => $all_booking_details,
                'payment_gateway' => $payment_gateway,
                'total_amount' => $total_amount,
                'currency_code' => $booking_details->get_currency_code(),
                'paid_amount' => $paid_amount,
                'payable_amount' => $due_amount,
                'due_amount' => $due_amount,
                'payment_type' => $payment_type,
                'booking_id' => $booking_id,
                'installment' => $installment,
                'transaction_id' => '',
            )
        ));


        return wp_insert_post($post_array);

    }

    public function get_all_info($booking_id, $payment_type = 'any', $include_booking_details = true)
    {
        $posts = get_posts(array(
            'numberposts' => -1,
            'meta_key' => 'booking_id',
            'meta_value' => $booking_id,
            'post_type' => 'yatra-payment',
            'post_status' => sanitize_text_field($payment_type),
            'order' => 'ASC',

        ));
        $payment_info = array();
        $all_status = $this->payment_statuses();
        foreach ($posts as $post) {

            $payment_id = $post->ID;
            $status = $post->post_status;
            $status = $all_status[$status] ?? __('Pending', 'yatra');
            $payment_info[$payment_id] = [
                'title' => $post->post_title . '[' . $payment_id . ']',
                'payment_gateway' => get_post_meta($payment_id, 'payment_gateway', true),
                'total_amount' => get_post_meta($payment_id, 'total_amount', true),
                'currency_code' => get_post_meta($payment_id, 'currency_code', true),
                'paid_amount' => get_post_meta($payment_id, 'paid_amount', true),
                'payable_amount' => get_post_meta($payment_id, 'payable_amount', true),
                'due_amount' => get_post_meta($payment_id, 'due_amount', true),
                'payment_type' => get_post_meta($payment_id, 'payment_type', true),
                'booking_id' => get_post_meta($payment_id, 'booking_id', true),
                'installment' => get_post_meta($payment_id, 'installment', true),
                'transaction_id' => get_post_meta($payment_id, 'transaction_id', true),
                'status' => $status,
                'payment_date' => $post->post_date
            ];

            if ($include_booking_details) {
                $payment_info[$payment_id]['booking_details'] = get_post_meta($payment_id, 'booking_details', true);
            }
        }
        return $payment_info;
    }

    public function get_total_paid_amount($booking_id)
    {
        $total_paid_amount = 0;

        $all_payments_by_booking_id = get_posts(array(
            'numberposts' => -1,
            'meta_key' => 'booking_id',
            'meta_value' => $booking_id,
            'post_type' => 'yatra-payment',
            'post_status' => 'publish'
        ));

        if (!is_wp_error($all_payments_by_booking_id)) {

            foreach ($all_payments_by_booking_id as $payment) {

                if ($payment->post_status === 'publish') {

                    $id = $payment->ID;

                    $total_paid = floatval(get_post_meta($id, 'paid_amount', true));

                    $total_paid_amount += $total_paid;
                }

            }
        }
        return $total_paid_amount;
    }

    public function get_net_due_amount($payment_id)
    {
        $booking_id = $this->get_booking_id($payment_id);

        $booking_details = new Yatra_Tour_Booking($booking_id);

        $paid_amount = $this->get_total_paid_amount($booking_id);

        $total_amount = $booking_details->get_total(true);

        return ($total_amount - $paid_amount) > 0 ? ($total_amount - $paid_amount) : 0;

    }

    public function get_gateway($payment_id)
    {
        return get_post_meta($payment_id, 'payment_gateway', true);
    }

    public function get_total_amount($payment_id)
    {
        return get_post_meta($payment_id, 'total_amount', true);
    }

    public function get_currency_code($payment_id)
    {
        return get_post_meta($payment_id, 'currency_code', true);
    }

    public function get_paid_amount($payment_id)
    {
        return get_post_meta($payment_id, 'paid_amount', true);
    }

    public function get_payable_amount($payment_id)
    {
        return floatval(get_post_meta($payment_id, 'payable_amount', true));
    }

    public function get_due_amount($payment_id)
    {
        return get_post_meta($payment_id, 'due_amount', true);
    }

    public function get_payment_type($payment_id)
    {
        return get_post_meta($payment_id, 'payment_type', true);
    }

    public function get_booking_id($payment_id)
    {
        return get_post_meta($payment_id, 'booking_id', true);
    }

    public function get_installment_id($payment_id)
    {
        return get_post_meta($payment_id, 'installment', true);
    }

    public function get_status($payment_id)
    {
        return get_post_status($payment_id);
    }

    public function transaction_id($payment_id)
    {
        return get_post_meta($payment_id, 'transaction_id', true);
    }

    public function update_status($payment_id, $status)
    {
        $all_status = $this->payment_statuses();

        if (isset($all_status[$status])) {

            $arg['ID'] = $payment_id;

            $arg['post_status'] = $status;

            wp_update_post($arg);
        }

    }

    public function update_transaction_id($payment_id, $transaction_id = '')
    {
        if ($transaction_id != '') {

            update_post_meta($payment_id, 'transaction_id', sanitize_text_field($transaction_id));
        }

    }

    public function update_paid_amount($payment_id, $paid_amount)
    {
        return update_post_meta($payment_id, 'paid_amount', floatval($paid_amount));
    }

    public function update_due_amount($payment_id, $due_amount)
    {
        return update_post_meta($payment_id, 'due_amount', floatval($due_amount));
    }


}