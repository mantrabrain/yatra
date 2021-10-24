<div class="yatra-pricing-group-wrap-container">

    <div class="yatra-pricing-group-wrap">
        <span type="button" class="pricing-delete dashicons dashicons-trash"></span>
        <div class="yatra-field-wrap">
            <label for="<?php echo $pricing_option_id . '[pricing_label]'; ?>"><?php echo __('Pricing Label', 'yatra') ?></label>
            <input value="<?php echo esc_attr($multiple_pricing ['pricing_label']); ?>"
                   class="widefat"
                   id="<?php echo $pricing_option_id . '[pricing_label]'; ?>"
                   name="<?php echo $pricing_option_id . '[pricing_label]'; ?>" type="text"
                   placeholder="<?php echo __('Enter pricing label. Ex. Adult Price', 'yatra') ?>"/>
            <span class="yatra-tippy-tooltip dashicons dashicons-editor-help"
                  data-tippy-content="<?php echo __('Pricing Label', 'yatra') ?>"></span>
        </div>

        <div class="yatra-field-wrap">
            <label for="<?php echo $pricing_option_id . '[pricing_description]'; ?>"><?php echo __('Description', 'yatra') ?></label>
            <input value="<?php echo esc_attr($multiple_pricing ['pricing_description']); ?>"
                   class="widefat"
                   id="<?php echo $pricing_option_id . '[pricing_description]'; ?>"
                   name="<?php echo $pricing_option_id . '[pricing_description]'; ?>" type="text"
                   placeholder="<?php echo __('Ex: Age Between age 16 to 18', 'yatra') ?>"/>
            <span class="yatra-tippy-tooltip dashicons dashicons-editor-help"
                  data-tippy-content="<?php echo __('Pricing Description', 'yatra') ?>"></span>
        </div>

        <div class="yatra-field-wrap">
            <label for="<?php echo $pricing_option_id . '[minimum_pax]'; ?>"><?php echo __('Minimum People (Pax)', 'yatra') ?></label>
            <input value="<?php echo esc_attr($multiple_pricing ['minimum_pax']); ?>"
                   type="number"
                   class="widefat"
                   id="<?php echo $pricing_option_id . '[minimum_pax]'; ?>"
                   name="<?php echo $pricing_option_id . '[minimum_pax]'; ?>"
                   placeholder="<?php echo __('Minimum number of people per booking', 'yatra') ?>"/>
            <span class="yatra-tippy-tooltip dashicons dashicons-editor-help"
                  data-tippy-content="<?php echo __('Minimum number of people per booking for this pricing. Leave it blank to use this tour\'s minimum people (pax) ( From General & Date Settings ).', 'yatra') ?>"></span>
        </div>

        <div class="yatra-field-wrap">
            <label for="<?php echo $pricing_option_id . '[maximum_pax]'; ?>"><?php echo __('Maximum People (Pax)', 'yatra') ?></label>
            <input value="<?php echo esc_attr($multiple_pricing ['maximum_pax']); ?>"
                   type="number"
                   class="widefat"
                   id="<?php echo $pricing_option_id . '[maximum_pax]'; ?>"
                   name="<?php echo $pricing_option_id . '[maximum_pax]'; ?>"
                   placeholder="<?php echo __('Maximum number of people per booking', 'yatra') ?>"/>
            <span class="yatra-tippy-tooltip dashicons dashicons-editor-help"
                  data-tippy-content="<?php echo __('Maximum number of people per booking for this pricing. Leave it blank to use this tour\'s maximum people (pax) ( From General & Date Settings ).', 'yatra') ?>"></span>
        </div>

        <div class="yatra-field-wrap">
            <label for="<?php echo $pricing_option_id . '[pricing_per]'; ?>"><?php echo __('Price Per', 'yatra') ?></label>
            <select
                    class="widefat yatra_multiple_pricing_price_per"
                    id="<?php echo $pricing_option_id . '[pricing_per]'; ?>"
                    name="<?php echo $pricing_option_id . '[pricing_per]'; ?>">
                <?php
                $price_per_array = array(
                    '' => __('Use Tours price Per', 'yatra'),
                    'person' => __('Person', 'yatra'),
                    'group' => __('Group', 'yatra'),
                );

                foreach ($price_per_array as $group_id => $group_label) {
                    ?>
                    <option <?php selected($multiple_pricing ['pricing_per'], $group_id) ?>
                            value="<?php echo esc_attr($group_id) ?>"><?php echo esc_html($group_label) ?></option>
                <?php } ?>


            </select>
        </div>
        <div class="yatra-field-wrap <?php echo $multiple_pricing ['pricing_per'] === 'group' ? '' : 'yatra-hide'; ?> yatra_multiple_pricing_group_size">
            <label for="<?php echo $pricing_option_id . '[group_size]'; ?>"><?php echo __('Group Size', 'yatra') ?></label>
            <input value="<?php echo esc_attr($multiple_pricing ['group_size']); ?>"
                   type="number"
                   class="widefat"
                   id="<?php echo $pricing_option_id . '[group_size]'; ?>"
                   name="<?php echo $pricing_option_id . '[group_size]'; ?>"
                   placeholder="<?php echo __('Number of people for one group', 'yatra') ?>"/>
            <span class="yatra-tippy-tooltip dashicons dashicons-editor-help"
                  data-tippy-content="<?php echo __('Number of people for one group for this pricing option.', 'yatra') ?>"></span>
        </div>

        <div class="yatra-field-wrap">
            <label for="<?php echo $pricing_option_id . '[regular_price]'; ?>"><?php echo sprintf(__('Regular Price (%s)', 'yatra'), $currency_symbol) ?></label>
            <input value="<?php echo esc_attr($multiple_pricing ['regular_price']); ?>"
                   class="widefat" id="<?php echo $pricing_option_id . '[regular_price]'; ?>"
                   name="<?php echo $pricing_option_id . '[regular_price]'; ?>" type="number"
                   placeholder="<?php echo sprintf(__('Please enter regular price (%s)', 'yatra'), $currency_symbol) ?>">
        </div>
        <div class="yatra-field-wrap">
            <label for="<?php echo $pricing_option_id . '[sales_price]'; ?>"><?php echo sprintf(__('Sales Price (%s)', 'yatra'), $currency_symbol) ?></label>
            <input value="<?php echo esc_attr($multiple_pricing ['sales_price']); ?>"
                   class="widefat" id="<?php echo $pricing_option_id . '[sales_price]'; ?>"
                   name="<?php echo $pricing_option_id . '[sales_price]'; ?>" type="number"
                   placeholder="<?php echo sprintf(__('Please enter sales price (%s)', 'yatra'), $currency_symbol) ?>">
        </div>
        <input type="hidden"
               name="<?php echo $pricing_option_id . '[option_id]'; ?>" value="<?php echo esc_attr($id); ?>"
        />
    </div>
</div>
