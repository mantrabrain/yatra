<?php
if (!class_exists('Yatra_Metabox_Tour_CPT')) {

    class Yatra_Metabox_Tour_CPT extends Yatra_Metabox_Base
    {

        function __construct()
        {
            add_action('add_meta_boxes', array($this, 'metabox_form'));

            add_action('save_post', array($this, 'save'));


        }

        public function metabox_config($key = null, $get_merge_all_field = false)
        {


            /*$configurations = array(
                'tour-options' => array(
                    'yatra_tour_meta_tour_price' => array(
                        'name' => 'yatra_tour_meta_tour_price',
                        'title' => sprintf(__('Tour Price(%s)', 'yatra'), $currency_symbols),
                        'type' => 'number',
                        'wrap_class' => 'yatra-left',
                        'extra_attributes' => array(
                            'placeholder' => sprintf(__('Tour Price (%s)', 'yatra'), $currency_symbols),
                        ),
                        'row_start' => true,
                    ), 'yatra_tour_meta_tour_duration_days' => array(
                        'name' => 'yatra_tour_meta_tour_duration_days',
                        'title' => esc_html__('Tour Duration Days', 'yatra'),
                        'type' => 'number',
                        'wrap_class' => 'yatra-right',
                        'extra_attributes' => array(
                            'placeholder' => __('Number of days', 'yatra'),
                        ),
                        'row_end' => true,

                    ), 'yatra_tour_meta_tour_duration_nights' => array(
                        'name' => 'yatra_tour_meta_tour_duration_nights',
                        'title' => esc_html__('Tour Duration Nights', 'yatra'),
                        'type' => 'number',
                        'wrap_class' => 'yatra-left',
                        'extra_attributes' => array(
                            'placeholder' => __('Number of nights', 'yatra'),
                        ),
                        'row_start' => true,

                    ), 'yatra_tour_meta_tour_country' => array(
                        'name' => 'yatra_tour_meta_tour_country',
                        'title' => esc_html__('Country', 'yatra'),
                        'type' => 'select',
                        'wrap_class' => 'yatra-right',
                        'extra_attributes' => array(
                            'placeholder' => __('Number of nights', 'yatra'),
                        ),
                        'options' => $countries,
                        'default' => 'NP',
                        'is_multiple' => true,
                        'select2' => true,
                        'row_end' => true,

                    ), 'yatra_tour_meta_tour_max_altitude' => array(
                        'name' => 'yatra_tour_meta_tour_max_altitude',
                        'title' => esc_html__('Max altitude', 'yatra'),
                        'type' => 'number',
                        'wrap_class' => 'yatra-left',
                        'extra_attributes' => array(
                            'placeholder' => __('Max altitude', 'yatra'),
                        ),
                        'row_start' => true,

                    ), 'yatra_tour_meta_tour_starts_at' => array(
                        'name' => 'yatra_tour_meta_tour_starts_at',
                        'title' => esc_html__('Starts at', 'yatra'),
                        'type' => 'text',
                        'wrap_class' => 'yatra-right',
                        'extra_attributes' => array(
                            'placeholder' => __('Please type start location address.', 'yatra'),
                        ),
                        'row_end' => true,

                    ), 'yatra_tour_meta_tour_ends_at' => array(
                        'name' => 'yatra_tour_meta_tour_ends_at',
                        'title' => esc_html__('Ends at', 'yatra'),
                        'type' => 'text',
                        'wrap_class' => 'yatra-left',
                        'extra_attributes' => array(
                            'placeholder' => __('Please type end location address.', 'yatra'),
                        ),
                        'row_start' => true,

                    ), 'yatra_tour_meta_tour_route' => array(
                        'name' => 'yatra_tour_meta_tour_route',
                        'title' => esc_html__('Route', 'yatra'),
                        'type' => 'text',
                        'wrap_class' => 'yatra-right',
                        'extra_attributes' => array(
                            'placeholder' => __('Tour Route.', 'yatra'),
                        ),
                        'row_end' => true,

                    ), 'yatra_tour_meta_tour_best_season' => array(
                        'name' => 'yatra_tour_meta_tour_best_season',
                        'title' => esc_html__('Best Season', 'yatra'),
                        'type' => 'text',
                        'wrap_class' => 'yatra-left',
                        'extra_attributes' => array(
                            'placeholder' => __('Best season, month. Eg. Jan,Feb etc.', 'yatra'),
                        )
                    )
                ),
                'tour-itinerary' => array(
                    'yatra_itineray_detail' => array(
                        'name' => 'yatra_itineray_detail',
                        'title' => esc_html__('Itinerary Description', 'yatra'),
                        'type' => 'textarea',
                        'extra_attributes' => array(
                            'rows' => 10
                        ),
                        'editor' => true,
                        'allowed_tags' => array(
                            'p' => array(),
                            'em' => array(),
                            'strong' => array(),
                            'img' => array(
                                'src' => array(),
                                'title' => array(),
                            ),
                            'a' => array(
                                'href' => array(),
                            ),
                        )
                    )
                ),
                'tour-cost' => array(
                    'yatra_cost_included' => array(
                        'name' => 'yatra_cost_included',
                        'title' => esc_html__('Cost Included', 'yatra'),
                        'type' => 'textarea',
                        'extra_attributes' => array(
                            'rows' => 10
                        ),
                        'row_start' => true,
                        'wrap_class' => 'yatra-left',
                        'editor' => true,
                        'allowed_tags' => array(
                            'p' => array(),
                            'ul' => array(),
                            'ol' => array(),
                            'li' => array(),
                            'em' => array(),
                            'strong' => array(),
                            'a' => array(
                                'href' => array(),
                            ),
                        )
                    ), 'yatra_cost_excluded' => array(
                        'name' => 'yatra_cost_excluded',
                        'title' => esc_html__('Cost Excluded', 'yatra'),
                        'type' => 'textarea',
                        'extra_attributes' => array(
                            'rows' => 10
                        ),
                        'row_end' => true,
                        'wrap_class' => 'yatra-right',
                        'editor' => true,
                        'allowed_tags' => array(
                            'p' => array(),
                            'ul' => array(),
                            'ol' => array(),
                            'li' => array(),
                            'em' => array(),
                            'strong' => array(),
                            'a' => array(
                                'href' => array(),
                            ),
                        )
                    )
                ),
                'tour-facts' => array(
                    'yatra_facts_detail' => array(
                        'name' => 'yatra_facts_detail',
                        'title' => esc_html__('Facts Description', 'yatra'),
                        'type' => 'textarea',
                        'extra_attributes' => array(
                            'rows' => 10
                        ),
                        'editor' => true,
                        'allowed_tags' => array(
                            'p' => array(),
                            'em' => array(),
                            'strong' => array(),
                            'img' => array(
                                'src' => array(),
                                'title' => array(),
                            ),
                            'a' => array(
                                'href' => array(),
                            ),
                        )
                    )
                ),
            );*/
            $configurations = array();

            $yatra_metabox_tabs_keys = yatra_tour_metabox_tabs();
            echo '<pre>';
            print_r($yatra_metabox_tabs_keys);
            exit;

            $config = array();

            foreach ($yatra_metabox_tabs_keys as $yatra_key) {

                if (isset($configurations[$yatra_key])) {

                    $config[$yatra_key] = $configurations[$yatra_key];
                }
            }
            if (!empty($key) && isset($config[$key])) {

                return $config[$key];
            }
            if ($get_merge_all_field) {

                $return_field_values = array();

                $field_only_values = array_values($config);

                foreach ($field_only_values as $field_values) {

                    foreach ($field_values as $single_key => $single_value) {

                        $return_field_values[$single_key] = $single_value;
                    }
                }
                return $return_field_values;
            }


            return $config;
        }

        /**
         * Adds metabox for trip pricing.
         *
         * @since 1.0.0
         */
        public function metabox_form()
        {
            $screens = array('tour');

            foreach ($screens as $screen) {
                add_meta_box(
                    'tour_meta_information',
                    __('Tour Additional Information', 'yatra'),
                    array($this, 'callback'),
                    $screen,
                    'normal',
                    'high'
                );
            }
        }

        // Tab for notice listing and settings
        public function callback($args)
        {


            $metabox_tabs = yatra_tour_metabox_tabs();


            ?>
            <div class="yatra-tabs">

                <ul class="mb-tab-list">
                    <?php foreach ($metabox_tabs as $tab_key => $tab) { ?>
                        <li><a href="#<?php echo esc_attr($tab_key); ?>"><?php echo esc_html($tab['label']); ?></a></li>
                    <?php } ?>
                </ul>
                <?php

                $index = 0;

                foreach ($metabox_tabs as $tab_content_key => $tab_content) {
                    $index++;
                    ?>
                    <section id="<?php echo esc_attr($tab_content_key); ?>" style="display:none;"
                             class="yatra-tab-section">
                        <?php

                        $configs = isset($tab_content['config']) ? $tab_content['config'] : array();

                        switch ($tab_content_key) {

                            case "tour-options":
                                $this->tour_options($configs, $tab_content_key);

                                break;

                            case "tour-attributes":
                                $this->tour_attributes($configs, $tab_content_key);

                                break;

                            case "tour-tabs":
                                $this->tour_tabs($configs, $tab_content_key);

                                break;
                        }
                        ?>
                    </section>
                <?php } ?>
                <input type="hidden" value="<?php echo wp_create_nonce('yatra_tour_post_type_metabox_nonce') ?>"
                       name="yatra_tour_cpt_meta_nonce"/>
            </div>
            <?php
        }

        /**
         * When the post is saved, saves our custom data.
         *
         * @param int $post_id The ID of the post being saved.
         */
        public function save($post_id)
        {
            /*
             * We need to verify this came from our screen and with proper authorization,
             * because the save_post action can be triggered at other times.
             */
            $nonce = isset($_POST['yatra_tour_cpt_meta_nonce']) ? ($_POST['yatra_tour_cpt_meta_nonce']) : '';

            if (isset($_POST['yatra_tour_cpt_meta_nonce'])) {

                $is_valid_nonce = wp_verify_nonce($nonce, 'yatra_tour_post_type_metabox_nonce');

                if ($is_valid_nonce) {

                    $metabox_tabs = yatra_tour_metabox_tabs();

                    foreach ($metabox_tabs as $tab_content_key => $tab_content) {

                        $configs = isset($tab_content['config']) ? $tab_content['config'] : array();

                        switch ($tab_content_key) {

                            case "tour-options":
                                $this->save_tour_options($configs, $post_id);

                                break;

                            case "tour-attributes":


                                break;

                            case "tour-tabs":
                                $this->save_tour_tabs($configs, $post_id);
                                break;
                        }
                    }
                }
            }
        }

        private function save_tour_options($configs = array(), $post_id)
        {
            foreach ($configs as $field_key => $field) {

                $field_value = isset($_POST[$field_key]) ? $_POST[$field_key] : '';

                $valid_field_value = $this->sanitize($field_value, $field);

                update_post_meta($post_id, $field_key, $valid_field_value);
            }
        }

        private function save_tour_tabs($configs = array(), $post_id)
        {
            /*
                        echo '<pre>';
                        print_r($_POST);
                        exit;*/

            foreach ($configs as $config) {

                $options = isset($config['options']) ? $config['options'] : array();

                foreach ($options as $option => $option_field) {

                    $field_key = isset($option_field['name']) ? $option_field['name'] : '';

                    $type = isset($option_field['type']) ? $option_field['type'] : '';

                    if (!empty($field_key)) {

                        if ($type != 'repeator') {

                            $field_value = isset($_POST[$field_key]) ? $_POST[$field_key] : '';

                            $valid_field_value = $this->sanitize($field_value, $option_field);

                            update_post_meta($post_id, $field_key, $valid_field_value);

                        } else {

                            $repeator_options = isset($option_field['options']) ? $option_field['options'] : array();

                            $repeator = isset($_POST[$field_key]) ? $_POST[$field_key] : array();

                            $repeator_array = isset($repeator_options[0]) ? $repeator_options[0] : array();

                            $final_field_value = array();

                            foreach ($repeator as $repeator_key => $repeator_value) {

                                $valid_field_value_array = array();

                                foreach ($repeator_value as $single_repeator_value) {

                                    if (isset($repeator_array[$repeator_key])) {

                                        $valid_field_value = $this->sanitize($single_repeator_value, $repeator_array[$repeator_key]);

                                        array_push($valid_field_value_array, $valid_field_value);

                                    }

                                }
                                $final_field_value[$field_key][$repeator_key] = $valid_field_value_array;


                            }

                            if (isset($final_field_value[$field_key])) {

                                update_post_meta($post_id, $field_key, $final_field_value[$field_key]);
                            }


                        }

                    }

                }
            }
        }

        private function tour_options($configs = array(), $tab_content_key)
        {
            foreach ($configs as $field) {
                $this->metabox_html($field);
            }

        }

        private function tour_attributes($configs = array(), $tab_content_key)
        {
            $fields = array();
            foreach ($configs as $config_key => $value) {
                $fields[$config_key] = isset($value['label']) ? $value['label'] : '';
            }

            $tour_attribute_field = array(
                'name' => $tab_content_key,
                'title' => sprintf(__('Tour Attributes', 'yatra')),
                'type' => 'select',
                'options' => $fields
            );
            $this->metabox_html($tour_attribute_field);
        }

        private function tour_tabs($configs = array(), $tab_content_key)
        {

            echo '<ul  class="mb-meta-vertical-tab">';

            $index = 0;

            global $post;

            $post_id = $post->ID;

            $tour_tabs_ordering = get_post_meta($post_id, 'tour_tabs_ordering', true);

            $tour_tabs_ordering_array = explode(',', $tour_tabs_ordering);

            $config_array_keys = array_keys($configs);

            $array_diff = array_diff($config_array_keys, $tour_tabs_ordering_array);

            $final_ordered_config_keys = $tour_tabs_ordering_array;

            if (count($array_diff) > 0) {

                $final_ordered_config_keys = array_merge($tour_tabs_ordering_array, $array_diff);
            }

            $active_tab_config = '';

            foreach ($final_ordered_config_keys as $config) {

                if (isset($configs[$config])) {

                    $setting = $configs[$config];

                    $class = $index === 0 ? 'active' : '';

                    if ($index === 0) {

                        $active_tab_config = $config;
                    }

                    $icon = isset($setting['icon']) ? '<span class="' . esc_attr($setting['icon']) . '"></span>' : '';

                    echo '<li class="' . $class . '" data-tab-content="' . $config . '">' . $icon . $setting['label'] . '</li>';

                    $index++;
                }
            }


            echo '</ul>';

            echo '<div class="mb-meta-vertical-tab-content">';

            foreach ($configs as $config_key => $setting_value) {

                $class = 'mb-meta-vertical-tab-content-item';

                $class .= $config_key === $active_tab_config ? ' active' : '';

                echo '<div class="' . $class . '" data-tab-content="' . $config_key . '">';

                foreach ($setting_value as $setting_key => $setting_args) {

                    switch ($setting_key) {

                        case "label":
                            echo "<h2>{$setting_args}</h2>";
                            break;

                        case "options":
                            foreach ($setting_args as $option) {
                                $this->metabox_html($option);
                            }
                            break;

                    }

                }


                echo '</div>';
            }
            echo '</div>';

        }


    }
}