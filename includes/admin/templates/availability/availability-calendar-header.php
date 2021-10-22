<div class="yatra-pricing-availability-calendar-header">

    <fieldset>
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
                <label for="yatra_availability[max_travellers]">Max. Traveller &nbsp;
                </label>
                <input value="<?php echo esc_attr($yatra_availability['max_travellers']) ?>" type="number"
                       class="widefat" id="yatra_availability[max_travellers]"
                       name="yatra_availability[max_travellers]"/>
                <span
                        class="yatra-tippy-tooltip dashicons dashicons-editor-help"
                        data-tippy-content="Number of people for one group for this pricing option."></span>
            </div>

            <div class="yatra-field-wrap"><label
                        for="yatra_availability[availability_for]">Availability for</label>
                <?php
                $yatra_availability_for = array(
                    'booking' => __('For Booking', 'yatra'),
                    'enquiry' => __('For Enquiry Only', 'yatra'),
                    'none' => __('Not Available', 'yatra'),
                );
                ?>
                <select class="widefat yatra_availability_for" id="yatra_availability[availability_for]"
                        name="yatra_availability[availability_for]">
                    <?php foreach ($yatra_availability_for as $single_availability_for_key => $single_availability_for) { ?>
                        <option value="<?php echo esc_attr($single_availability_for_key); ?>" <?php selected($single_availability_for_key, $yatra_availability['availability_for']) ?>><?php

                            echo esc_html($single_availability_for);
                            ?>
                        </option>
                    <?php } ?>


                </select>
                <span class="yatra-tippy-tooltip dashicons dashicons-editor-help"
                      data-tippy-content="This option let you enable/disable total max number of traveller limit for this tour"></span>
            </div>
        </div>
    </fieldset>
</div>