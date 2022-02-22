<div class="yatra-payment-status-meta-content">
    <?php

    $payment = new Yatra_Payment();

    $all_payment_info = $payment->get_all_info(get_the_ID());

    foreach ($all_payment_info as $payment_id => $info) {

        $due_amount = $payment->get_net_due_amount($payment_id);

        $currency = $info['currency_code'];

        $currency_symbol = yatra_get_current_currency_symbol($currency);
        ?>
        <div class="yatra-payment-item">
            <h2><?php echo esc_html__('Payment - #', 'yatra') . absint($payment_id) ?></h2>
            <p class="flex">
                <label for="yatra_payment_gateway"><strong>Payment Gateway: </strong></label>
                <span><?php echo esc_html($info['payment_gateway']) ?></span>
            </p>
            <p class="flex">
                <label for="yatra_payment_gateway"><strong>Transaction ID: </strong></label>
                <span><?php echo esc_html($info['transaction_id']) ?></span>
            </p>
            <p class="flex">
                <label for="yatra_payment_gateway"><strong>Paid Amount: </strong></label>
                <span><?php echo esc_html(yatra_get_price($currency_symbol, $info['paid_amount'])) ?></span>
            </p>
            <p class="flex">
                <label for="yatra_payment_gateway"><strong>Due Amount: </strong></label>
                <span><?php echo esc_html(yatra_get_price($currency_symbol, $info['due_amount'])) ?></span>
            </p>
            <p class="flex">
                <label for="yatra_payment_gateway"><strong>Payment Status: </strong></label>
                <span><?php echo esc_html($info['status']) ?></span>
            </p>
        </div>
        <?php

    }
    ?>


</div>
