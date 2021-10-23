<div class="yatra-pricing-availability-calendar-date">
    <div class="yatra-field-row">
        <div class="yatra-field-wrap" data-wrap-id="yatra_availability_selected_date">
            <span class="yatra-avilability-daterange-picker dashicons dashicons-calendar"></span>
            <input autocomplete="off" class="widefat yatra_availability_selected_date"
                   id="yatra_availability_selected_date"
                   type="text"
                   value="<?php echo esc_attr($selected_dates['start'] . ' - ' . $selected_dates['end']); ?>"
                   data-start-date="<?php echo esc_attr($selected_dates['start']) ?>"
                   data-end-date="<?php echo esc_attr($selected_dates['end']) ?>" readonly
            />

            <span class="yatra-tippy-tooltip dashicons dashicons-editor-help"
                  data-tippy-content="You can change the date range to save below data."></span>
            <?php $availability_dates[] = $selected_dates; ?>
            <input autocomplete="off" class="widefat" id="yatra_availability_selected_date_ranges"
                   name="yatra_availability_selected_date_ranges"
                   type="hidden"
                   value="<?php echo esc_attr(json_encode($selected_dates)) ?>"/>


        </div>

        <div class="yatra-field-wrap"><label
                    for="yatra_availability[activate]"><?php echo esc_html__('Activate', 'yatra') ?></label>
            <div class="yatra-switch-control-wrap">
                <label class="yatra-switch-control">
                    <input class="widefat yatra_availability_activate"
                           id="yatra_availability[activate]"
                           name="yatra_availability[activate]" type="checkbox"
                           value="1" <?php checked(true, $active_status) ?>>
                    <span class="slider round" data-on="yes" data-off="no"></span>
                </label>
            </div>
            <span class="yatra-tippy-tooltip dashicons dashicons-editor-help"
                  data-tippy-content="<?php echo esc_attr__('Activate the following options to the date for selected tour. If you disable this option pricing settings will applied from tour pricing options.', 'yatra') ?>"></span>
        </div>

    </div>

</div>