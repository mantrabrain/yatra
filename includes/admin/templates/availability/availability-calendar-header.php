<div class="yatra-pricing-availability-calendar-header">

    <input value="<?php echo esc_attr($start_date); ?>" type="hidden" id="yatra_availability_selected_start_date"
           name="yatra_availability_selected_start_date"/>
    <input value="<?php echo esc_attr($end_date); ?>" type="hidden" id="yatra_availability_selected_end_date"
           name="yatra_availability_selected_end_date"/>

     <input value="<?php echo esc_attr($pricing_type); ?>"
           type="hidden"
           id="yatra_availability[pricing_type]"
           name="yatra_availability[pricing_type]"/>

    <input value="<?php echo esc_attr($tour_id); ?>"
           type="hidden"
           id="yatra_tour_id"
           name="yatra_tour_id"
    />

    <div class="yatra-field-row">
        <div class="yatra-field-wrap">
            <label for="yatra_availability[max_traveller]">Max. Traveller &nbsp;
            </label>
            <input value="10" type="number" class="widefat" id="yatra_availability[max_traveller]"
                   name="yatra_availability[max_traveller]"/>
            <span
                    class="yatra-tippy-tooltip dashicons dashicons-editor-help"
                    data-tippy-content="Number of people for one group for this pricing option."></span>
        </div>
        <div class="yatra-field-wrap"><label
                    for="yatra_availability[user_tour_settings]">Use Tour Settings</label>
            <div class="yatra-switch-control-wrap">
                <label class="yatra-switch-control">
                    <input class="widefat" id="yatra_availability[user_tour_settings]"
                           name="yatra_availability[user_tour_settings]" type="checkbox" value="1" checked="checked">
                    <span class="slider round" data-on="yes" data-off="no"></span>
                </label>
            </div>
            <span class="yatra-tippy-tooltip dashicons dashicons-editor-help"
                  data-tippy-content="This option let you enable/disable total max number of traveller limit for this tour"></span>
        </div>
        <div class="yatra-field-wrap"><label
                    for="yatra_availability[availability_for]">Availability for</label>
            <select class="widefat yatra_availability_for" id="yatra_availability[availability_for]"
                    name="yatra_availability[availability_for]">
                <option value=""></option>
                <option selected="selected" value="enquiry">For Enquiry</option>
                <option value="booking">For Booking</option>
                <option value="none">Not Available</option>


            </select>
            <span class="yatra-tippy-tooltip dashicons dashicons-editor-help"
                  data-tippy-content="This option let you enable/disable total max number of traveller limit for this tour"></span>
        </div>
    </div>
</div>