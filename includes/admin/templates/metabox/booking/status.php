<div class="yatra-booking-status-meta-content">
    <?php
    $booking_statuses = yatra_get_booking_statuses();
    ?>

    <p class="flex">
        <label for="yatra_booking_status"><strong><?php esc_html_e('Booking Status', 'yatra'); ?>
                : </strong></label>
        <select id="yatra_booking_status" name="yatra_booking_status">
            <?php foreach ($booking_statuses as $status_key => $status_label) : ?>
                <option value="<?php echo esc_attr($status_key); ?>" <?php selected($status_key, $current_status); ?>>
                    <?php echo esc_html($status_label); ?>
                </option>
            <?php endforeach; ?>
        </select>
    </p>
    <p class="flex">
        <label for="yatra_gross_price"><strong>Gross Booking Price: </strong></label>
        <span><?php echo esc_html(yatra_get_price($currency, $total_gross_price)); ?></span>
    </p>
    <p class="flex">
        <label for="yatra_coupon_code"><strong>Coupon Code: </strong></label>
        <span><strong><?php echo esc_html($discount_code); ?></strong></span>
    </p>
    <p class="flex">
        <label for="yatra_coupon_amount"><strong>Coupon Amount: </strong></label>
        <span><?php echo esc_html(yatra_get_price($currency, $discount_amount)); ?></span>
    </p>
    <p class="flex">
        <label for="yatra_gross_price"><strong>Net Booking Price: </strong></label>
        <span><?php echo esc_html(yatra_get_price($currency, $total_net_price)); ?></span>
    </p>
</div>
<div id="major-publishing-actions">
    <div id="publishing-action">
        <input type="submit" name="save" id="publish" class="button button-primary button-large"
               value="<?php echo esc_attr__('Update Booking Status', 'yatra') ?>"></div>
    <input type="hidden" value="<?php echo wp_create_nonce('yatra_booking_post_type_metabox_nonce') ?>"
           name="yatra_booking_post_type_metabox_nonce"/>
    <div class="clear"></div>
</div>