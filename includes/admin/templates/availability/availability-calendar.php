<?php
/* @var $pricing Yatra_Tour_Pricing */

?>
<div class="yatra-pricing-group-wrap-container">
    <fieldset>
        <legend><?php echo esc_html($pricing->getLabel()); ?></legend>

        <input value="<?php echo esc_attr($pricing->getLabel()); ?>"
               type="hidden"
               class="widefat"
               name="<?php echo $pricing_option_id . '[pricing_label]'; ?>"
        />
        <input value="<?php echo esc_attr($pricing->getDescription()); ?>"
               type="hidden"
               class="widefat"
               name="<?php echo $pricing_option_id . '[pricing_description]'; ?>"
        />
        <div class="yatra-field-row">

            <div class="yatra-field-wrap">
                <label for="<?php echo $pricing_option_id . '[pricing_per]'; ?>"><?php echo __('Price Per', 'yatra') ?>
                    <span class="yatra-tippy-tooltip dashicons dashicons-editor-help"
                          data-tippy-content="<?php echo __('Price Per', 'yatra') ?>"></span>
                </label>
                <select
                        class="widefat yatra_pricing_pricing_per"
                        id="<?php echo $pricing_option_id . '[pricing_per]'; ?>"
                        name="<?php echo $pricing_option_id . '[pricing_per]'; ?>">
                    <?php
                    $pricing_per_array = array(
                        'person' => __('Person', 'yatra'),
                        'group' => __('Group', 'yatra'),
                    );
                    foreach ($pricing_per_array as $group_id => $group_label) {
                        ?>
                        <option <?php selected($pricing->getPricingPer(), $group_id) ?>
                                value="<?php echo esc_attr($group_id) ?>"><?php echo esc_html($group_label) ?></option>
                    <?php } ?>


                </select>
            </div>
            <div class="yatra-field-wrap <?php echo $pricing->getPricingPer() === 'group' ? '' : 'yatra-hide'; ?> yatra_pricing_group_size">
                <label for="<?php echo $pricing_option_id . '[group_size]'; ?>"><?php echo __('Group Size', 'yatra') ?>
                    <span class="yatra-tippy-tooltip dashicons dashicons-editor-help"
                          data-tippy-content="<?php echo __('Number of people for one group', 'yatra') ?>"></span>
                </label>
                <input value="<?php echo esc_attr($pricing->getGroupSize()); ?>"
                       type="number"
                       class="widefat"
                       id="<?php echo $pricing_option_id . '[group_size]'; ?>"
                       name="<?php echo $pricing_option_id . '[group_size]'; ?>"
                       placeholder="<?php echo __('Number of people for one group', 'yatra') ?>"/>

            </div>

            <div class="yatra-field-wrap">
                <label for="<?php echo $pricing_option_id . '[regular_price]'; ?>"><?php echo sprintf(__('Regular Price (%s)', 'yatra'), $currency_symbol) ?></label>
                <input value="<?php echo esc_attr($pricing->getRegularPrice()); ?>"
                       class="widefat" id="<?php echo $pricing_option_id . '[regular_price]'; ?>"
                       name="<?php echo $pricing_option_id . '[regular_price]'; ?>" type="number"
                       placeholder="<?php echo sprintf(__('Please enter regular price (%s)', 'yatra'), $currency_symbol) ?>">
            </div>
            <div class="yatra-field-wrap">
                <label for="<?php echo $pricing_option_id . '[sales_price]'; ?>"><?php echo sprintf(__('Sales Price (%s)', 'yatra'), $currency_symbol) ?></label>
                <input value="<?php echo esc_attr($pricing->getSalesPrice()); ?>"
                       class="widefat" id="<?php echo $pricing_option_id . '[sales_price]'; ?>"
                       name="<?php echo $pricing_option_id . '[sales_price]'; ?>" type="number"
                       placeholder="<?php echo sprintf(__('Please enter sales price (%s)', 'yatra'), $currency_symbol) ?>">
            </div>
        </div>
        <div class="yatra-field-row">

            <div class="yatra-field-wrap yatra-hide">
                <label for="<?php echo $pricing_option_id . '[pricing_label]'; ?>"><?php echo __('Pricing Label', 'yatra') ?>
                    <span class="yatra-tippy-tooltip dashicons dashicons-editor-help"
                          data-tippy-content="<?php echo __('Pricing Label', 'yatra') ?>"></span>
                </label>
                <input value="<?php echo esc_attr($pricing->getLabel()); ?>"
                       class="widefat"
                       id="<?php echo $pricing_option_id . '[pricing_label]'; ?>"
                       name="<?php echo $pricing_option_id . '[pricing_label]'; ?>" type="hidden"
                       placeholder="<?php echo __('Enter pricing label. Ex. Adult Price', 'yatra') ?>"/>

            </div>


            <div class="yatra-field-wrap">
                <label for="<?php echo $pricing_option_id . '[minimum_pax]'; ?>"><?php echo __('Minimum People (Pax)', 'yatra') ?>

                    <span class="yatra-tippy-tooltip dashicons dashicons-editor-help"
                          data-tippy-content="<?php echo __('Minimum number of people per booking.', 'yatra') ?>"></span>
                </label>
                <input value="<?php echo esc_attr($pricing->getMinimumPax()); ?>"
                       type="number"
                       class="widefat"
                       id="<?php echo $pricing_option_id . '[minimum_pax]'; ?>"
                       name="<?php echo $pricing_option_id . '[minimum_pax]'; ?>"
                       placeholder="<?php echo __('Minimum number of people per booking', 'yatra') ?>"/>

            </div>

            <div class="yatra-field-wrap">
                <label for="<?php echo $pricing_option_id . '[maximum_pax]'; ?>"><?php echo __('Maximum People (Pax)', 'yatra') ?>
                    <span class="yatra-tippy-tooltip dashicons dashicons-editor-help"
                          data-tippy-content="<?php echo __('Maximum number of people per booking', 'yatra') ?>"></span>
                </label>
                <input value="<?php echo esc_attr($pricing->getMaximumPax()); ?>"
                       type="number"
                       class="widefat"
                       id="<?php echo $pricing_option_id . '[maximum_pax]'; ?>"
                       name="<?php echo $pricing_option_id . '[maximum_pax]'; ?>"
                       placeholder="<?php echo __('Maximum number of people per booking', 'yatra') ?>"/>

            </div>
        </div>
    </fieldset>
</div>
