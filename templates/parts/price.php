<div class="yatra-tour-price">
    <?php
    $tour_pricing = yatra_get_minimum_tour_pricing($yatra_tour_id);
    ?>
    <p><span><?php echo __('From ', 'yatra') ?></span>
        <?php if (floatval($tour_pricing['sales_price']) < 1) { ?>
            <span class="sales-price free"><?php echo __("Free", 'yatra'); ?></span>
        <?php } else { ?>
            <?php if (floatval($tour_pricing['sales_price']) != floatval($tour_pricing['regular_price'])) { ?>
                <del class="regular-price"><?php echo yatra_get_price(yatra_get_current_currency_symbol(), $tour_pricing['regular_price']) ?></del>
            <?php } ?>
            <span class="sales-price"><?php echo yatra_get_price(yatra_get_current_currency_symbol(), $tour_pricing['sales_price']) ?></span>
        <?php } ?>
    </p>
</div>