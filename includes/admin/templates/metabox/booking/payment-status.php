<div class="yatra-payment-status-meta-content">
    <?php

    $payment = new Yatra_Payment();

    $all_payment_info = $payment->get_all_info(get_the_ID());


    foreach ($all_payment_info as $payment_id => $info) {

        $currency = $info['currency_code'];

        $currency_symbol = yatra_get_current_currency_symbol($currency);
        ?>
        <div class="yatra-payment-item">
            <h2><?php echo esc_html__('Payment - #') . absint($payment_id) ?></h2>
            <p class="flex">
                <label for="yatra_payment_gateway"><strong>Payment Gateway: </strong></label>
                <span><?php echo esc_html($info['payment_gateway']) ?></span>
            </p>
            <p class="flex">
                <label for="yatra_payment_gateway"><strong>Paid Amount: </strong></label>
                <span><?php echo esc_html(yatra_get_price($currency_symbol, $info['paid_amount'])) ?></span>
            </p>
            <p class="flex">
                <label for="yatra_payment_gateway"><strong>Due Amount: </strong></label>
                <span><?php echo esc_html(yatra_get_price($currency_symbol, $info['due_amount'])) ?></span>
            </p>
        </div>
        <?php

    }
    ?>


</div>
