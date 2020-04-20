<div class="yatra-pricing-group-wrap-container">

    <div class="yatra-pricing-group-wrap">
        <span type="button" class="pricing-delete dashicons dashicons-trash"></span>
        <div class="yatra-field-wrap">
            <label for="<?php echo $pricing_option_id . '[pricing_label]'; ?>"><?php echo __('Pricing Label', 'yatri') ?></label>
            <input value="<?php echo esc_attr($multiple_pricing ['pricing_label']); ?>"
                   class="widefat"
                   id="<?php echo $pricing_option_id . '[pricing_label]'; ?>"
                   name="<?php echo $pricing_option_id . '[pricing_label]'; ?>" type="text"
                   placeholder="<?php echo __('Enter pricing label. Ex. Adult Price', 'yatri') ?>"/>
        </div>

        <div class="yatra-field-wrap">
            <label for="<?php echo $pricing_option_id . '[regular_price]'; ?>"><?php echo sprintf(__('Regular Price (%s)', 'yatra'), $currency_symbol) ?></label>
            <input value="<?php echo esc_attr($multiple_pricing ['regular_price']); ?>"
                   class="widefat" id="<?php echo $pricing_option_id . '[regular_price]'; ?>"
                   name="<?php echo $pricing_option_id . '[regular_price]'; ?>" type="text"
                   placeholder="<?php echo sprintf(__('Please enter regular price (%s)', 'yatra'), $currency_symbol) ?>">
        </div>
        <div class="yatra-field-wrap">
            <label for="<?php echo $pricing_option_id . '[sales_price]'; ?>"><?php echo sprintf(__('Sales Price (%s)', 'yatra'), $currency_symbol) ?></label>
            <input value="<?php echo esc_attr($multiple_pricing ['sales_price']); ?>"
                   class="widefat" id="<?php echo $pricing_option_id . '[sales_price]'; ?>"
                   name="<?php echo $pricing_option_id . '[sales_price]'; ?>" type="text"
                   placeholder="<?php echo sprintf(__('Please enter sales price (%s)', 'yatra'), $currency_symbol) ?>">
        </div>
        <input type="hidden"
               name="<?php echo $pricing_option_id . '[option_id]'; ?>" value="<?php echo esc_attr($id); ?>"
        />
    </div>
</div>
