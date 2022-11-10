<div id="admin-editor-yatra-tour" class="yatra-admin-editor yatra-box-data">
    <div class="yatra-box-data-head yatra-admin-row">
        <h3 class="heading"><?php echo esc_html($title); ?> -
            <label for="yatra_tour_meta_tour_type">
                <select id="yatra_tour_meta_tour_type" name="yatra_tour_meta_tour_type">
                    <?php
                    $tour_type = get_post_meta(get_the_ID(), 'yatra_tour_meta_tour_type', true);
                    $tour_types = yatra_get_tour_types();
                    ?>
                    <optgroup label="Tour Type">
                        <?php foreach ($tour_types as $type_id => $type_label) { ?>
                            <option value="<?php echo esc_attr($type_id) ?>" <?php selected($type_id, $tour_type) ?>><?php echo esc_html($type_label) ?></option>
                        <?php } ?>
                    </optgroup>
                </select>
            </label>
            <?php
            $is_disable_booking = (boolean)get_post_meta(get_the_ID(), 'yatra_tour_meta_disable_booking', true);
            ?>
            <label for="yatra_tour_meta_disable_booking">
                <span class="yatra-tippy-tooltip"
                      data-tippy-content="<?php esc_attr_e('This option let you enable/disable booking option for this tour package. Booking calendar will be hidden if you enable this option. User can only send enquiry.', 'yatra'); ?>"><?php echo esc_html__('Disable booking? ', 'yatra') ?></span>
                <input type="checkbox" id="yatra_tour_meta_disable_booking"
                       name="yatra_tour_meta_disable_booking" <?php checked(true, $is_disable_booking) ?>
                       value="1"/>
            </label>
        </h3>
    </div>
    <div class="yatra-box-data-content">
        <div class="yatra-box-body-content">
            <?php
            do_action('yatra_tour_meta_body_content');
            ?>
        </div>
    </div>
</div>