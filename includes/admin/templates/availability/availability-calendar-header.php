<div class="yatra-pricing-availability-calendar-header">
    <div class="yatra-field-row">
        <div class="yatra-field-wrap" data-wrap-id="yatra_tour_meta_availability">
            <span class="yatra-daterange-picker dashicons dashicons-calendar"></span>
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
        <div class="yatra-field-wrap  yatra_pricing_group_size">
            <label for="yatra_multiple_pricing[_umxtp8hpg][group_size]">Max. Traveller &nbsp;
            </label>
            <input value="10" type="number" class="widefat" id="yatra_multiple_pricing[_umxtp8hpg][group_size]"
                   name="yatra_multiple_pricing[_umxtp8hpg][group_size]" placeholder="Number of people for one group">
            <span
                    class="yatra-tippy-tooltip dashicons dashicons-editor-help"
                    data-tippy-content="Number of people for one group for this pricing option."></span>
        </div>
    </div>
    <div class="yatra-field-row">

        <div class="yatra-field-wrap" data-wrap-id="yatra_tour_enable_max_num_of_traveller"><label
                    for="yatra_tour_enable_max_num_of_traveller">Use Tour Settings</label>
            <div class="yatra-switch-control-wrap">
                <label class="yatra-switch-control">
                    <input class="widefat" id="yatra_tour_enable_max_num_of_traveller"
                           name="yatra_tour_enable_max_num_of_traveller" type="checkbox" value="1" checked="checked">
                    <span class="slider round" data-on="yes" data-off="no"></span>
                </label>
            </div>
            <span class="yatra-tippy-tooltip dashicons dashicons-editor-help"
                  data-tippy-content="This option let you enable/disable total max number of traveller limit for this tour"></span>
        </div>
        <div class="yatra-field-wrap" data-wrap-id="yatra_tour_enable_max_num_of_traveller"><label
                    for="yatra_tour_enable_max_num_of_traveller">Availability for</label>
            <select class="widefat yatra_availability_for" id="yatra_multiple_pricing[_x4h9zjsns][pricing_per]"
                    name="yatra_multiple_pricing[_x4h9zjsns][pricing_per]">
                <option value=""></option>
                <option selected="selected" value="person">For Enquiry</option>
                <option value="group">For Booking</option>
                <option value="group">Not Available</option>


            </select>
            <span class="yatra-tippy-tooltip dashicons dashicons-editor-help"
                  data-tippy-content="This option let you enable/disable total max number of traveller limit for this tour"></span>
        </div>
    </div>
</div>