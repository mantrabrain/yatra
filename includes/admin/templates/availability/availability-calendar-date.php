<div class="yatra-pricing-availability-calendar-date">
    <div class="yatra-field-row">
        <div class="yatra-field-wrap" data-wrap-id="yatra_tour_meta_availability">
            <span class="yatra-avilability-daterange-picker dashicons dashicons-calendar"></span>
            <select class="widefat yatra_availability_date" id="yatra_multiple_pricing[_x4h9zjsns][pricing_per]"
                    name="yatra_multiple_pricing[_x4h9zjsns][pricing_per]">
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
            <input autocomplete="off" class="widefat" id="yatra_tour_meta_availability"
                   name="yatra_tour_meta_availability"
                   type="hidden"
                   value="[{&quot;start&quot;:&quot;2021-10-23&quot;,&quot;end&quot;:&quot;2021-12-01&quot;}]">


        </div>

    </div>

</div>