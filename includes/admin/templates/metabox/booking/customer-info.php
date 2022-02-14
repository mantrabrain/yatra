<div class="yatra-admin-booking-metabox-wrap postbox">
    <div class="yatra-box-data-head postbox-header">
        <h2 class="heading"><?php echo __('Customer Information', 'yatra') ?></h2>
    </div>
    <?php

    $currency_symbol = yatra_get_current_currency_symbol($info['yatra_currency']); ?>
    <div class="yatra-box-data-content inside">
        <div class="yatra-booking-item-summary">

            <div class="yatra-booking-single-field clearfix">
                <span class="yatra-admin-head"><?php echo esc_html__('Fullname :', 'yatra') ?></span>
                <span class="yatra-admin-tail"><?php echo isset($customer['fullname']) ? esc_html($customer['fullname']) : 'N/A'; ?></span>
            </div>

            <div class="yatra-booking-single-field clearfix">
                <span class="yatra-admin-head"><?php echo esc_html__('Email :', 'yatra') ?></span>
                <span class="yatra-admin-tail"><?php echo isset($customer['email']) ? esc_html($customer['email']) : 'N/A'; ?></span>

            </div>
            <div class="yatra-booking-single-field clearfix">
                <span class="yatra-admin-head"><?php echo esc_html__('Country :', 'yatra') ?></span>
                <span class="yatra-admin-tail"><?php echo isset($customer['country']) ? esc_html(yatra_get_countries($customer['country'])) : 'N/A'; ?></span>
            </div>
            <div class="yatra-booking-single-field clearfix">
                <span class="yatra-admin-head"><?php echo esc_html__('Booking Date :', 'yatra') ?></span>
                <span class="yatra-admin-tail"><?php echo isset($info['booking_date']) ? esc_html(yatra_get_date(false, $info['booking_date'])) : 'N/A'; ?></span>
            </div>
            <div class="yatra-booking-single-field clearfix">
                <span class="yatra-admin-head"><?php echo esc_html__('Booking Code :', 'yatra') ?></span>
                <span class="yatra-admin-tail"><?php echo esc_html(get_the_title()) ?></span>
            </div>
            <div class="yatra-booking-single-field clearfix">
                <span class="yatra-admin-head"><?php echo esc_html__('Gross Booking Price :', 'yatra') ?></span>
                <span class="yatra-admin-tail"><?php echo isset($info['total_booking_gross_price']) ? yatra_get_price($currency_symbol, $info['total_booking_gross_price']) : 'N/A'; ?></span>
            </div>
            <div class="yatra-booking-single-field clearfix">
                <span class="yatra-admin-head"><?php echo esc_html__('Net Booking Price :', 'yatra') ?></span>
                <span class="yatra-admin-tail"><?php echo isset($info['total_booking_net_price']) ? yatra_get_price($currency_symbol, $info['total_booking_net_price']) : 'N/A'; ?></span>
            </div>
            <?php

            ?>
        </div>

    </div>
</div>


