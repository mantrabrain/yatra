<div id="yatra-tour-cart-edit-form-fields" class="yatra-tour-cart-edit-form-fields">

    <?php

    $currency_symbol = yatra_get_current_currency_symbol();

    yatra_cart_edit_item($yatra_booking_pricing_info, $currency_symbol, $tour_id, $number_of_person);

    ?>

</div>