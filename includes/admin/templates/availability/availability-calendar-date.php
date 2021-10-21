<div class="yatra-pricing-availability-calendar-date">
    <div class="yatra-field-row">
        <div class="yatra-field-wrap" data-wrap-id="yatra_availability_selected_date">
            <span class="yatra-avilability-daterange-picker dashicons dashicons-calendar"></span>
            <input autocomplete="off" class="widefat yatra_availability_selected_date"
                   id="yatra_availability_selected_date"
                   type="text"
                   value="<?php echo esc_attr($selected_dates['start'] . ' - ' . $selected_dates['end']); ?>"
                   data-start-date="<?php echo esc_attr($selected_dates['start']) ?>"
                   data-end-date="<?php echo esc_attr($selected_dates['end']) ?>"
            />

            <span class="yatra-tippy-tooltip dashicons dashicons-editor-help"
                  data-tippy-content="You can choose date range slot for availability."></span>
            <?php $availability_dates[] = $selected_dates; ?>
            <input autocomplete="off" class="widefat" id="yatra_availability_selected_date_ranges"
                   name="yatra_availability_selected_date_ranges"
                   type="hidden"
                   value="<?php echo esc_attr(json_encode($selected_dates)) ?>"/>


        </div>

    </div>

</div>