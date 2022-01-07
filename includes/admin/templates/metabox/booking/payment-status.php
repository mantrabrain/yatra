<div class="yatra-booking-status-meta-content">
    <?php

    $payment = new Yatra_Payment();

    $all_payment_info = $payment->get_booking_id(get_the_ID());

    echo '<pre>';
    print_r($all_payment_info);
    echo '</pre>';


    // $payment->create(get_the_ID(), 'paypal', 'full');

    ?>


</div>
