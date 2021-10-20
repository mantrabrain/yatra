<div class="yatra-pricing-availability-calendar-date">
    <div class="yatra-field-row">
        <div class="yatra-field-wrap" data-wrap-id="yatra_availability_selected_date">
            <span class="yatra-avilability-daterange-picker dashicons dashicons-calendar"></span>
            <select class="widefat yatra_availability_date" id="yatra_availability_selected_date"
                    name="yatra_availability_selected_date">
                <option selected data-date-start="<?php echo esc_attr($selected_dates['start']) ?>"
                        data-date-end="<?php echo esc_attr($selected_dates['end']) ?>"
                        value="<?php echo esc_attr(json_encode($selected_dates)) ?>"
                ><?php echo esc_html($selected_dates['start'] . ' - ' . $selected_dates['end']); ?>
                </option>

                <?php foreach ($availability_dates as $date) { ?>
                    <option value="<?php echo esc_attr(json_encode($date)) ?>"
                            data-date-start="<?php echo esc_attr($date['start']) ?>"
                            data-date-end="<?php echo esc_attr($date['end']) ?>"
                    ><?php echo esc_html($date['start'] . ' - ' . $date['end']); ?>
                    </option>
                <?php } ?>


            </select>
            <span class="yatra-tippy-tooltip dashicons dashicons-editor-help"
                  data-tippy-content="You can choose date range slot for availability."></span>
            <?php $availability_dates[] = $selected_dates; ?>
            <input autocomplete="off" class="widefat" id="yatra_availability_dates"
                   name="yatra_availability_dates"
                   type="hidden"
                   value="<?php echo esc_attr(json_encode($availability_dates)) ?>"/>


        </div>

    </div>

</div>