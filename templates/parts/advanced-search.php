<form method="get" class="yatra-search-module-form"
      action="<?php echo esc_url(get_post_type_archive_link('tour')); ?>">
    <div class="yatra-search-module">
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
                <span class="input-placeholder"><?php echo esc_html__('Choose a activity', 'yatra'); ?></span>
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
                <span class="input-placeholder">Pick a destination</span>
                <input type="hidden" readonly placeholder="<?php echo esc_attr__('Pick trip duration', 'yatra'); ?>"/>
            </div>

        </div>
        <div class="yatra-search-module-item yatra-search-price">
            <div class="search-title">
                <span class="yatra-icon fa fa-dollar-sign"></span>
                <span class="label"><?php echo esc_html__('Budget', 'yatra'); ?></span>
            </div>
            <div class="yatra-search-item-fields">
                <span class="input-placeholder">Pick a destination</span>
                <input type="hidden" readonly placeholder="<?php echo esc_attr__('Your budget range', 'yatra'); ?>"/>
            </div>

        </div>
        <div class="yatra-search-submit">
            <button type="submit">
                <span class="yatra-icon fa fa-magnifying-glass"></span>
                Search
            </button>
        </div>
    </div>
</form>