<?php
$action = get_post_type_archive_link('tour');
?>
<form method="get" class="yatra-search-module-form"
      action="<?php echo esc_url($action); ?>"
      data-search-type="<?php echo esc_attr($search_type) ?>">

    <?php if (strpos($action, "post_type=tour") !== false) {
        echo '<input type="hidden" name="post_type" value="tour"/>';
    } ?>
    <div class="yatra-search-module">

        <?php if ($search_type === 'regular') { ?>
            <div class="yatra-search-module-item yatra-search-text" data-name="s">
                <div class="yatra-search-item-fields">
                    <input type="text" class="input-field" name="s"
                           placeholder="<?php echo esc_attr__('Type search keyword here..', 'yatra'); ?>"/>
                </div>
            </div>
        <?php } else { ?>
            <div class="yatra-search-module-item yatra-search-destination" data-name="filter_destination">
                <div class="search-title">
                    <span class="yatra-icon fa fa-map-marker-alt"></span>
                    <span class="label"><?php echo esc_html__('Destination', 'yatra'); ?></span>
                </div>
                <div class="yatra-search-item-fields">
                    <input type="hidden" class="input-field"/>
                    <span class="input-placeholder"><?php echo esc_html__('Pick a destination', 'yatra'); ?></span>
                    <div class="yatra-search-model">
                        <?php $destinations = yatra_get_terms_by_id('destination');

                        echo '<ul class="yatra-search-taxonomy">';

                        foreach ($destinations as $destination) {

                            echo '<li data-slug="' . esc_attr($destination->slug) . '">';

                            echo '<label>' . esc_html($destination->name) . '</label>';

                            echo '<span class="count">' . esc_html($destination->count) . '</span>';

                            echo '</li>';
                        }
                        echo '</ul>';
                        ?>

                    </div>
                </div>
            </div>
            <div class="yatra-search-module-item yatra-search-activity" data-name="filter_activity">
                <div class="search-title">
                    <span class="yatra-icon fa fa-universal-access"></span>
                    <span class="label"><?php echo esc_html__('Activities', 'yatra'); ?></span>
                </div>
                <div class="yatra-search-item-fields">
                    <input type="hidden" class="input-field"/>
                    <span class="input-placeholder"><?php echo esc_html__('Choose an activity', 'yatra'); ?></span>
                    <div class="yatra-search-model">
                        <?php $activities = yatra_get_terms_by_id('activity');

                        echo '<ul class="yatra-search-taxonomy">';

                        foreach ($activities as $activity) {

                            echo '<li data-slug="' . esc_attr($activity->slug) . '">';

                            echo '<label>' . esc_html($activity->name) . '</label>';

                            echo '<span class="count">' . esc_html($activity->count) . '</span>';

                            echo '</li>';
                        }
                        echo '</ul>';
                        ?>

                    </div>
                </div>

            </div>
            <div class="yatra-search-module-item yatra-search-duration">
                <div class="search-title">
                    <span class="yatra-icon fa fa-clock"></span>
                    <span class="label"><?php echo esc_html__('Duration', 'yatra'); ?></span>
                </div>
                <div class="yatra-search-item-fields">
                    <span class="input-placeholder"><?php echo esc_html__('Trip duration', 'yatra'); ?></span>
                    <input type="hidden" class="input-field"/>
                    <div class="yatra-search-model">
                        <div class="yatra-search-model-inner">
                            <div class="yatra-slider-wrap">
                                <input type="hidden" id="yatra-search-days-slider-min" data-name="min_days"/>
                                <input type="hidden" id="yatra-search-days-slider-max" data-name="max_days"/>
                                <div id="yatra-search-days-slider"></div>
                            </div>
                            <div class="slider-content">
                                <span class="min-days"><?php echo absint($min_days) . ' ' . __('Days', 'yatra') ?></span>
                                <span class="max-days"><?php echo absint($max_days) . ' ' . __('Days', 'yatra') ?></span>
                            </div>
                        </div>
                    </div>
                </div>

            </div>
            <div class="yatra-search-module-item yatra-search-price">
                <div class="search-title">
                    <span class="yatra-icon fa fa-dollar-sign"></span>
                    <span class="label"><?php echo esc_html__('Budget', 'yatra'); ?></span>
                </div>
                <div class="yatra-search-item-fields">
                    <span class="input-placeholder"><?php echo esc_html__('Your budget range', 'yatra'); ?></span>
                    <div class="yatra-search-model">
                        <div class="yatra-search-model-inner">
                            <div class="yatra-slider-wrap">
                                <input type="hidden" id="yatra-search-price-slider-min" data-name="min_price"/>
                                <input type="hidden" id="yatra-search-price-slider-max" data-name="max_price"/>
                                <div id="yatra-search-price-slider"></div>
                            </div>
                            <div class="slider-content">
                                <span class="min-price"><?php echo yatra_get_price(yatra_get_current_currency_symbol(), $min_price) ?></span>
                                <span class="max-price"><?php echo yatra_get_price(yatra_get_current_currency_symbol(), $max_price) ?></span>
                            </div>
                        </div>
                    </div>
                </div>

            </div>
        <?php } ?>

        <div class="yatra-search-submit">
            <button type="submit">
                <span class="yatra-icon fa fa-magnifying-glass"></span>
                Search
            </button>
        </div>
    </div>
</form>