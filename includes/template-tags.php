<?php

defined('ABSPATH') || exit;
if (!function_exists('yatra_get_taxonomy_term_lists')) {
    function yatra_get_taxonomy_term_lists($post_id, $taxonomy = '', $return = false, $icon = '')
    {
        ob_start();
        /* translators: used between list items, there is a space after the comma. */
        $terms = get_the_term_list($post_id, $taxonomy, '', __(',&nbsp;', 'yatra'));

        $icon_html = $icon !== '' ? '<i class="icon ' . esc_attr($icon) . '"></i> ' : '';

        if ($terms) {
            printf(
            /* translators: 1: Taxonomy name 2: SVG icon. 3: posted in label, only visible to screen readers.*/
                '<span class="yatra-cat-links %1$s-links"><span class="screen-reader-text">%2$s</span>%3$s%4$s</span>',
                ($taxonomy),
                ucwords($taxonomy),
                $icon_html,
                $terms
            ); // WPCS: XSS OK.
        }
        $content = ob_get_clean();
        if ($return) {
            return $content;
        }
        echo $content;
    }
}

if (!function_exists('yatra_entry_header')) {

    function yatra_entry_header()
    {
        ?>
        <header class="yatra-tour-header">
            <?php
            if (is_sticky() && is_home() && !is_paged()) {
                printf('<span class="sticky-post">%s</span>', _x('Featured', 'post', 'yatra'));
            }
            if (is_singular()) :
                the_title('<h1 class="yatra-tour-title">', '</h1>');
            else :
                the_title(sprintf('<h2 class="yatra-tour-title"><a href="%s" rel="bookmark">', esc_url(get_permalink())), '</a></h2>');
            endif;
            ?>
        </header><!-- .yatra-tour-header -->
        <?php
    }
}

if (!function_exists('yatra_tour_thumbnail')) {

    function yatra_tour_thumbnail($size = "post-thumbnail")
    {
        ?>
        <figure class="tour-thumbnail">
            <?php if (!is_singular('tour')){ ?>
            <a class="tour-thumbnail-inner" href="<?php the_permalink(); ?>" aria-hidden="true" tabindex="-1">
                <?php }
                the_post_thumbnail($size);
                if (!is_singular('tour')){
                ?>
            </a>
        <?php } ?>
        </figure>
        <?php
    }
}

if (!function_exists('yatra_entry_post_content')) {

    function yatra_entry_post_content()
    {
        ?>
        <div class="yatra-tour-content">
            <?php
            the_excerpt();
            ?>
        </div><!-- .yatra-tour-content -->
        <?php
    }
}


if (!function_exists('yatra_get_current_currency_symbol')) {

    function yatra_get_current_currency_symbol($currency = '')
    {
        $currency = $currency === '' ? yatra_get_current_currency() : $currency;

        $symbol_type = get_option('yatra_currency_symbol_type', 'symbol');

        if ($symbol_type === 'code') {

            return $currency;

        }
        return yatra_get_currency_symbol($currency);
    }
}

if (!function_exists('yatra_get_current_currency')) {

    function yatra_get_current_currency()
    {
        return get_option('yatra_currency', 'USD');
    }
}

if (!function_exists('yatra_entry_meta_for_frontend_archive')) {

    function yatra_entry_meta_for_frontend_archive($post_id)
    {

        $currency_symbol = yatra_get_current_currency_symbol();

        $regular_yatra_tour_meta_regular_price = get_post_meta($post_id, 'yatra_tour_meta_regular_price', true);

        $yatra_tour_meta_sales_price = get_post_meta($post_id, 'yatra_tour_meta_sales_price', true);

        $yatra_tour_meta_tour_country = get_post_meta($post_id, 'yatra_tour_meta_tour_country', true);

        $yatra_tour_meta_regular_price_string = $currency_symbol . $regular_yatra_tour_meta_regular_price;

        $meta_frontend = array(
            array(
                'icon' => 'fa fa-users',
                'text' => '{{yatra_tour_maximum_number_of_traveller}}',

            ),
            array(
                'icon' => 'fa fa-chair',
                'text' => '{{yatra_tour_minimum_pax}}',

            )

        );
        if (!empty($yatra_tour_meta_tour_country)) {

            $country_string = '';


            foreach ($yatra_tour_meta_tour_country as $country_item) {

                $country = yatra_get_countries($country_item);


                $country_string .= $country . ', ';
            }
            $country_string = trim($country_string, ', ');

            $meta_frontend[] =
                array(
                    'icon' => 'fa fa-globe',
                    'text' => $country_string,

                );

        }

        return apply_filters(
            'yatra_entry_meta_frontend',
            $meta_frontend
        );

    }
}

if (!function_exists('yatra_entry_meta_options')) {

    function yatra_entry_meta_options($post_id = 0)
    {
        $post_id = $post_id > 0 ? $post_id : get_the_id();

        $yatra_tour_meta_tour_days = get_post_meta($post_id, 'yatra_tour_meta_tour_duration_days', true);

        $yatra_tour_meta_tour_nights = get_post_meta($post_id, 'yatra_tour_meta_tour_duration_nights', true);

        $duration_string = '';

        if ($yatra_tour_meta_tour_days != '') {

            $duration_string .= $yatra_tour_meta_tour_days . ' ' . __("Days", 'yatra') . ' ';

        }
        if ($yatra_tour_meta_tour_nights != '') {

            $duration_string .= $yatra_tour_meta_tour_nights . ' ' . __("Nights", 'yatra');

        }
        if ($yatra_tour_meta_tour_nights == '' && $yatra_tour_meta_tour_days == '') {

            $duration_string = __('N/A', 'yatra');

        }

        echo '<div class="yatra-tour-meta">';

        yatra_get_taxonomy_term_lists($post_id, 'activity', false, 'fa fa-universal-access');

        yatra_get_taxonomy_term_lists($post_id, 'destination', false, 'fas fa-map-marker-alt');

        echo '<span class="yatra-tour-duration"><i class="icon fa fa-clock"></i>' . esc_html($duration_string) . '</span>';

        echo '</div>';

    }
}
if (!function_exists('yatra_tour_tab_configurations')) {

    function yatra_tour_tab_configurations($config_key = null)
    {
        $all_tab_configs = yatra_tour_tab_default_configurations();

        $available_tabs = yatra_frontend_tabs_available_options();

        $final_available_tabs = array();

        $yatra_tour_tabs_additional_types = yatra_tour_tabs_additional_types();

        foreach ($available_tabs as $tab_index => $tab) {

            $type = $tab['type'] ?? $tab_index;

            if (isset($all_tab_configs[$type])) {

                $final_available_tabs[$type] = $all_tab_configs[$type];

                $final_available_tabs[$type]['label'] = $tab['label'] ?? '';

                $final_available_tabs[$type]['options'][$type . '_label']['default'] = $tab['label'] ?? '';

                $final_available_tabs[$type]['options'][$type . '_visibility']['default'] = $tab['visibility'] && boolval($tab['visibility']);

                $final_available_tabs[$type]['icon'] = $tab['icon'] ?? '';


            } else {


                if (in_array("text", $yatra_tour_tabs_additional_types)) {

                    $final_available_tabs[$tab_index] = array(
                        'label' => $tab['label'] ?? '',
                        'icon' => $tab['icon'] ?? '',
                        'type' => $type,
                        'options' =>
                            array(
                                $tab_index . '_visibility' => array(
                                    'name' => $tab_index . '_visibility',
                                    'title' => '',
                                    'type' => 'hidden',
                                    'default' => $tab['visibility'] && boolval($tab['visibility']),
                                ),
                                $tab_index . '_label' => array(
                                    'name' => $tab_index . '_label',
                                    'title' => __('Label Text', 'yatra'),
                                    'type' => 'text',
                                    'default' => $tab['label'] ?? '',
                                ),
                                $tab_index . '_content' => array(
                                    'name' => $tab_index . '_content',
                                    'title' => __('Content', 'yatra'),
                                    'type' => 'textarea',
                                    'editor' => true
                                )
                            ),

                    );
                }

            }

        }

        if (!is_null($config_key)) {

            if (isset($final_available_tabs[$config_key])) {

                return $final_available_tabs[$config_key];
            }
        }

        return $final_available_tabs;


    }
}

if (!function_exists('yatra_tour_tab_default_configurations')) {

    function yatra_tour_tab_default_configurations()
    {

        $tab_config = array(
            'overview' => array(
                'label' => __('Overview', 'yatra'),
                'icon' => 'fas fa-atom',
                'options' =>
                    array(
                        'overview_visibility' => array(
                            'name' => 'overview_visibility',
                            'title' => '',
                            'type' => 'hidden',
                            'default' => true,
                        ),
                        'overview_label' => array(
                            'name' => 'overview_label',
                            'title' => __('Label Text', 'yatra'),
                            'type' => 'text',
                            'default' => __('Overview', 'yatra'),
                        ),
                        'overview_description' => array(
                            'name' => 'overview_description',
                            'title' => __('Overview Description', 'yatra'),
                            'type' => 'textarea',
                            'editor' => true
                        )
                    ),

            ),
            'itinerary' => array(
                'label' => __('Itinerary', 'yatra'),
                'icon' => 'fas fa-gopuram',
                'options' =>
                    array(
                        'itinerary_visibility' => array(
                            'name' => 'itinerary_visibility',
                            'title' => '',
                            'type' => 'hidden',
                            'default' => true,
                        ),
                        'itinerary_label' => array(
                            'name' => 'itinerary_label',
                            'title' => __('Label', 'yatra'),
                            'type' => 'text',
                            'default' => __('Itinerary', 'yatra'),

                        ),
                        'itinerary_repeator' => array(
                            'name' => 'itinerary_repeator',
                            'type' => 'repeator',
                            'options' => array(
                                array(
                                    'itinerary_heading' => array(
                                        'name' => 'itinerary_heading',
                                        'title' => __('Heading', 'yatra'),
                                        'type' => 'text',
                                        'default' => __('Day {index} ', 'yatra'),
                                        'class' => 'mb-repeator-heading-input',
                                    ),
                                    'itinerary_title' => array(
                                        'name' => 'itinerary_title',
                                        'title' => __('Title', 'yatra'),
                                        'type' => 'text',
                                    ),
                                    'itinerary_details' => array(
                                        'name' => 'itinerary_details',
                                        'title' => __('Details', 'yatra'),
                                        'type' => 'textarea',
                                        'editor' => true
                                    )
                                )
                            )
                        )

                    )
            ),
            'cost_info' => array(
                'label' => __('Cost Info', 'yatra'),
                'icon' => 'fa fa-dollar-sign',
                'options' =>
                    array(
                        'cost_info_visibility' => array(
                            'name' => 'cost_info_visibility',
                            'title' => '',
                            'type' => 'hidden',
                            'default' => true,
                        ),
                        'cost_info_label' => array(
                            'name' => 'cost_info_label',
                            'title' => __('Label', 'yatra'),
                            'type' => 'text',
                            'default' => __('Cost Info', 'yatra'),
                        ),
                        'cost_info_price_includes_title' => array(
                            'name' => 'cost_info_price_includes_title',
                            'title' => __('Price includes title', 'yatra'),
                            'type' => 'text',
                            'default' => __('Price includes', 'yatra'),
                        ),
                        'cost_info_price_includes_description' => array(
                            'name' => 'cost_info_price_includes_description',
                            'title' => __('Price include description', 'yatra'),
                            'type' => 'textarea',
                            'description' => __('Type enter to show in new list.', 'yatra'),
                            'editor' => true
                        ),
                        'cost_info_price_excludes_title' => array(
                            'name' => 'cost_info_price_excludes_title',
                            'title' => __('Price excludes title', 'yatra'),
                            'type' => 'text',
                            'default' => __('Price excludes', 'yatra'),
                        ),
                        'cost_info_price_excludes_description' => array(
                            'name' => 'cost_info_price_excludes_description',
                            'title' => __('Price excludes description', 'yatra'),
                            'type' => 'textarea',
                            'description' => __('Type enter to show in new list.', 'yatra'),
                            'editor' => true
                        )
                    ),
            ),
            'faq' => array(
                'label' => __('FAQ', 'yatra'),
                'icon' => 'fas fa-comment-dots',
                'options' =>
                    array(
                        'faq_visibility' => array(
                            'name' => 'faq_visibility',
                            'title' => '',
                            'type' => 'hidden',
                            'default' => true,
                        ),
                        'faq_label' => array(
                            'name' => 'faq_label',
                            'title' => __('Label', 'yatra'),
                            'type' => 'text',
                            'default' => __('FAQ', 'yatra'),

                        ),
                        'faq_repeator' => array(
                            'name' => 'faq_repeator',
                            'type' => 'repeator',
                            'options' => array(
                                array(
                                    'faq_heading' => array(
                                        'name' => 'faq_heading',
                                        'title' => __('FAQ Heading', 'yatra'),
                                        'type' => 'text',
                                        'default' => __('FAQ {index} ', 'yatra'),
                                        'class' => 'mb-repeator-heading-input'
                                    ),
                                    'faq_description' => array(
                                        'name' => 'faq_description',
                                        'title' => __('Description', 'yatra'),
                                        'type' => 'textarea',
                                        'editor' => true
                                    )
                                )
                            )
                        )

                    )

            ),
            'map' => array(
                'label' => __('Map', 'yatra'),
                'icon' => 'fas fa-directions',
                'options' =>
                    array(
                        'map_visibility' => array(
                            'name' => 'map_visibility',
                            'title' => '',
                            'type' => 'hidden',
                            'default' => true,
                        ),
                        'map_label' => array(
                            'name' => 'map_label',
                            'title' => __('Label', 'yatra'),
                            'type' => 'text',
                            'default' => __('Map', 'yatra'),

                        ),
                        'yatra_tour_meta_map_content' => array(
                            'name' => 'yatra_tour_meta_map_content',
                            'title' => __('Map Content', 'yatra'),
                            'type' => 'textarea',
                            'editor' => true,
                            'allow-html' => true
                        )
                    ),
            ),
            'gallery' => array(
                'label' => __('Gallery', 'yatra'),
                'icon' => 'fas fa-images',
                'options' =>
                    array(
                        'gallery_visibility' => array(
                            'name' => 'gallery_visibility',
                            'title' => '',
                            'type' => 'hidden',
                            'default' => true,
                        ),
                        'gallery_label' => array(
                            'name' => 'gallery_label',
                            'title' => __('Label', 'yatra'),
                            'type' => 'text',
                            'default' => __('Gallery', 'yatra'),

                        ),
                        'yatra_tour_meta_gallery' => array(
                            'name' => 'yatra_tour_meta_gallery',
                            'title' => __('Gallery', 'yatra'),
                            'type' => 'gallery',
                        )
                    ),
            ),
        );

        return apply_filters('yatra_tour_tab_configurations', $tab_config);

    }
}


if (!function_exists('yatra_tour_attribute_type_options')) {

    function yatra_tour_attribute_type_options()
    {

        $tour_attributes = array(

            'text_field' => array(
                'label' => __('Text Field', 'yatra'),
                'options' =>
                    array(
                        'content' => array(
                            'name' => 'content',
                            'title' => __('Content', 'yatra'),
                            'placeholder' => __('Default value for text field.', 'yatra'),
                            'description' => __('Default value for text field.', 'yatra'),
                            'type' => 'text',


                        )
                    ),
            ),
            'number_field' => array(
                'label' => __('Number Field', 'yatra'),
                'options' =>
                    array(

                        'content' => array(
                            'name' => 'content',
                            'title' => __('Default value for number field.', 'yatra'),
                            'placeholder' => __('Default value for number field.', 'yatra'),
                            'description' => __('Default value for number field.', 'yatra'),
                            'type' => 'number',
                        )
                    ),
            ),
            'textarea_field' => array(
                'label' => __('Textarea Field', 'yatra'),
                'options' =>
                    array(

                        'content' => array(
                            'name' => 'content',
                            'title' => __('Default value for textarea field.', 'yatra'),
                            'placeholder' => __('Default value for textarea field.', 'yatra'),
                            'description' => __('Default value for textarea field.', 'yatra'),
                            'type' => 'textarea',

                        )
                    ),
            ),
            'shortcode_field' => array(
                'label' => __('Shortcode Field', 'yatra'),
                'options' =>
                    array(
                        'shortcode' => array(
                            'name' => 'shortcode',
                            'title' => __('Shortcode', 'yatra'),
                            'placeholder' => __('Default value for shortcode field.', 'yatra'),
                            'description' => __('Default value for shortcode field.', 'yatra'),
                            'type' => 'shortcode',


                        )
                    ),
            ),
            /* 'dropdown_field' => array(
                 'label' => __('Dropdown Field', 'yatra'),
                 'options' =>
                     array(
                         'content' => array(
                             'name' => 'content',
                             'title' => __('Default value for select(drop-down) field. Enter drop-down values separated by commas.', 'yatra'),
                             'placeholder' => __('Default value for select(drop-down) field. Enter drop-down values separated by commas.', 'yatra'),
                             'description' => __('Default value for select(drop-down) field. Enter drop-down values separated by commas.', 'yatra'),
                             'type' => 'textarea',



                         )
                     ),
             )*/
        );
        return apply_filters('yatra_tour_attribute_type_options', $tour_attributes);
    }
}


if (!function_exists('yatra_tour_attributes_list')) {
    function yatra_tour_attributes_list()
    {
        $terms = get_terms(array(
            'taxonomy' => 'attributes',
            'hide_empty' => false

        ));

        $fields = array();

        $number_of_tour_attributes = apply_filters('number_of_tour_attributes', 5);

        foreach ($terms as $term_key => $term_value) {
            if (isset($term_value->term_id)) {
                $fields[$term_value->term_id] = $term_value->name;
                if (count($fields) === $number_of_tour_attributes && $number_of_tour_attributes !== -1) {
                    break;
                }
            }
        }

        return $fields;

    }
}
if (!function_exists('yatra_tour_attributes')) {
    function yatra_tour_attributes()
    {
        $tour_attributes = array(
            array(
                'name' => 'tour_attributes',
                'title' => sprintf(__('Tour Attributes', 'yatra')),
                'type' => 'select',
                'options' => yatra_tour_attributes_list(),
            ),
            array(
                'name' => 'add_tour_attribute',
                'type' => 'button',
                'default' => sprintf(__('Add New', 'yatra')),

            )
        );
        return apply_filters('yatra_tour_attributes', $tour_attributes);
    }
}


if (!function_exists('yatra_tour_general_configurations')) {

    function yatra_tour_general_configurations()
    {

        $countries = yatra_get_countries();

        $tour_options = array(
            'yatra_tour_meta_tour_fixed_departure' => array(
                'name' => 'yatra_tour_meta_tour_fixed_departure',
                'title' => esc_html__('Fixed Departure', 'yatra'),
                'type' => 'switch',
                'description' => esc_html__('This option let you enable/disable fix depdeparture option for this tour package. ', 'yatra'),
                //'wrap_class' => 'yatra-right',
                //'row_end' => true,

            ),

            'yatra_tour_meta_availability_date_ranges' => array(
                'name' => 'yatra_tour_meta_availability_date_ranges',
                'title' => esc_html__('Tour Availability Date Ranges', 'yatra'),
                'description' => esc_html__('You can choose date range slot for this tour availability. Do not add any date range slot to show this tour on all dates.', 'yatra'),
                'type' => 'date_range',
                'visibility_condition' => array(
                    'yatra_tour_meta_tour_fixed_departure' => true
                )
                //'row_start' => true,

            ),
            'yatra_tour_meta_tour_duration_days' => array(
                'name' => 'yatra_tour_meta_tour_duration_days',
                'title' => esc_html__('Tour Duration Days', 'yatra'),
                'description' => esc_html__('Total duration days for this tour', 'yatra'),
                'type' => 'number',
                // 'wrap_class' => 'yatra-left',
                'extra_attributes' => array(
                    'placeholder' => __('Number of days', 'yatra'),
                ),


                //'row_start' => true,

            ),
            'yatra_tour_meta_tour_duration_nights' => array(
                'name' => 'yatra_tour_meta_tour_duration_nights',
                'title' => esc_html__('Tour Duration Nights', 'yatra'),
                'type' => 'number',
                //'wrap_class' => 'yatra-right',
                'extra_attributes' => array(
                    'placeholder' => __('Number of nights', 'yatra'),
                ),
                ///'row_end' => true,

            ),
            'yatra_tour_meta_tour_country' => array(
                'name' => 'yatra_tour_meta_tour_country',
                'title' => esc_html__('Country', 'yatra'),
                'type' => 'select',
                //'wrap_class' => 'yatra-left',
                'extra_attributes' => array(
                    'placeholder' => __('Country', 'yatra'),
                ),
                'options' => $countries,
                'default' => 'NP',
                'is_multiple' => true,
                'select2' => true,
                //'row_start' => true,

            ),
            'yatra_tour_meta_tour_featured' => array(
                'name' => 'yatra_tour_meta_tour_featured',
                'title' => esc_html__('Feature this tour', 'yatra'),
                'type' => 'switch',
                'description' => esc_html__('This option let you enable/disable feature option for this tour package. ', 'yatra'),

                //'wrap_class' => 'yatra-right',
                //'row_end' => true,

            ),
            'yatra_tour_minimum_pax' => array(
                'name' => 'yatra_tour_minimum_pax',
                'title' => esc_html__('Minimum People (Pax)', 'yatra'),
                'description' => esc_html__('Minimum number of people per booking. Leave it blank to ignore minimum limit per booking.', 'yatra'),
                'type' => 'number',
                // 'wrap_class' => 'yatra-left',
                'extra_attributes' => array(
                    'placeholder' => __('Minimum number of people per booking', 'yatra'),
                ),

            ),
            'yatra_tour_maximum_pax' => array(
                'name' => 'yatra_tour_maximum_pax',
                'title' => esc_html__('Maximum People (Pax)', 'yatra'),
                'description' => esc_html__('Maximum number of people per booking. Leave it blank to ignore maximum limit per booking.', 'yatra'),
                'type' => 'number',
                // 'wrap_class' => 'yatra-left',
                'extra_attributes' => array(
                    'placeholder' => __('Maximum number of people per booking', 'yatra'),
                ),

            ),


            'yatra_tour_maximum_number_of_traveller' => array(
                'name' => 'yatra_tour_maximum_number_of_traveller',
                'title' => esc_html__('Maximum number of traveller', 'yatra'),
                'description' => esc_html__('Maximum number of traveller', 'yatra'),
                'type' => 'number',
                // 'wrap_class' => 'yatra-left',
                'extra_attributes' => array(
                    'placeholder' => __('Maximum number of traveller for this tour package.', 'yatra'),
                )

            ),

            'yatra_tour_meta_tour_tabs_ordering' => array(
                'name' => 'yatra_tour_meta_tour_tabs_ordering',
                'type' => 'hidden',
                'default' => yatra_frontend_tour_tabs_ordering('string')
            ),

            'yatra_tour_meta_tour_admin_active_tab' => array(
                'name' => 'yatra_tour_meta_tour_admin_active_tab',
                'type' => 'hidden',
                'default' => 'general'

            ),
            'yatra_tour_meta_tour_admin_subtab_active_tab' => array(
                'name' => 'yatra_tour_meta_tour_admin_subtab_active_tab',
                'type' => 'hidden',
                'default' => 'overview'
            ),
        );
        return apply_filters('yatra_tour_general_configurations', $tour_options);
    }
}

if (!function_exists('yatra_tour_pricing_configurations')) {

    function yatra_tour_pricing_configurations()
    {
        $currency = yatra_get_current_currency();

        $currency_symbols = yatra_get_currency_symbol($currency);

        $tour_options = array(
            'yatra_tour_meta_price_per' => array(
                'name' => 'yatra_tour_meta_price_per',
                'title' => __('Price Per', 'yatra'),
                'type' => 'select',
                //'wrap_class' => 'yatra-left',
                //'row_start' => true,
                'options' => array(
                    'person' => __('Person', 'yatra'),
                    'group' => __('Group', 'yatra')
                ),

            ), 'yatra_tour_meta_group_size' => array(
                'name' => 'yatra_tour_meta_group_size',
                'title' => __('Group Size', 'yatra'),
                'type' => 'number',
                //'wrap_class' => 'yatra-right',
                'extra_attributes' => array(
                    'placeholder' => __('Group Size', 'yatra'),
                ),
                'visibility_condition' => array(
                    'yatra_tour_meta_price_per' => 'group'
                ),
                // 'row_end' => true,
            ),
            'yatra_tour_meta_regular_price' => array(
                'name' => 'yatra_tour_meta_regular_price',
                'title' => sprintf(__('Tour Price- Regular (%s)', 'yatra'), $currency_symbols),
                'type' => 'number',
                //'wrap_class' => 'yatra-left',
                'extra_attributes' => array(
                    'placeholder' => sprintf(__('Tour Price - Regular (%s)', 'yatra'), $currency_symbols),
                ),
                //'row_start' => true,
            ),
            'yatra_tour_meta_sales_price' => array(
                'name' => 'yatra_tour_meta_sales_price',
                'title' => sprintf(__('Tour Price- Sales Price (%s)', 'yatra'), $currency_symbols),
                'type' => 'number',
                //'wrap_class' => 'yatra-right',
                'extra_attributes' => array(
                    'placeholder' => sprintf(__('Tour Price - Sales Price (%s). Leave it empty if you do not want to show sales price.', 'yatra'), $currency_symbols),
                ),
                //'row_end' => true,
            ),
            'yatra_tour_meta_pricing_label' => array(
                'name' => 'yatra_tour_meta_pricing_label',
                'title' => __('Pricing Label', 'yatra'),
                'type' => 'text',
                'default' => __('Guest', 'yatra'),
                'extra_attributes' => array(
                    'placeholder' => __('Pricing Label', 'yatra'),
                ),
                //'row_end' => true,
            ),
            'yatra_tour_meta_pricing_description' => array(
                'name' => 'yatra_tour_meta_pricing_description',
                'title' => __('Pricing Description', 'yatra'),
                'type' => 'text',
                //'wrap_class' => 'yatra-right',
                'extra_attributes' => array(
                    'placeholder' => __('Pricing Description', 'yatra'),
                ),
                //'row_end' => true,
            )
        );
        return apply_filters('yatra_tour_general_configurations', $tour_options);
    }
}


if (!function_exists('yatra_frontend_tabs_config')) {

    function yatra_frontend_tabs_config()
    {

        $post_id = get_the_ID();

        $yatra_tour_meta_tour_tabs_ordering_array = yatra_frontend_tour_tabs_ordering('array', $post_id);

        $configs = yatra_tour_tab_configurations();

        $config_array_keys = array_keys($configs);

        $array_diff = array_diff($config_array_keys, $yatra_tour_meta_tour_tabs_ordering_array);

        $final_ordered_config_keys = $yatra_tour_meta_tour_tabs_ordering_array;

        if (count($array_diff) > 0) {

            $final_ordered_config_keys = array_merge($yatra_tour_meta_tour_tabs_ordering_array, $array_diff);
        }

        $frontend_tabs_config = array();

        foreach ($final_ordered_config_keys as $config) {

            if (isset($configs[$config])) {

                if (yatra_has_tab_visible($config, $post_id)) {

                    $setting = $configs[$config];

                    $label = get_post_meta($post_id, $config . '_label', true);

                    $label = empty($label) ? $setting['label'] : $label;

                    $frontend_tabs_config [$config] = $label;
                }

            }
        }


        return apply_filters('frontend_tabs_configurations', $frontend_tabs_config);
    }
}


if (!function_exists('yatra_frontend_tabs')) {

    function yatra_frontend_tabs()
    {
        global $post;

        $frontend_tabs_config = yatra_frontend_tabs_config();

        $yatra_tour_tab_configurations = yatra_tour_tab_configurations();

        $yatra_setting_layouts_single_tour_tab_layout = get_option('yatra_setting_layouts_single_tour_tab_layout', '');

        $layout_class = 'yatra-tabs';

        $layout_class .= $yatra_setting_layouts_single_tour_tab_layout === 'heading_and_content' ? ' heading-and-content' : '';

        echo '<div class="' . esc_attr($layout_class) . '" id="yatra-tour-tabs">';

        if ($yatra_setting_layouts_single_tour_tab_layout === 'heading_and_content') {

            foreach ($frontend_tabs_config as $tab_content_key => $tab_content_title) {

                echo '<div class="yatra-tab-item ' . esc_attr($tab_content_key) . '">';

                $config = $yatra_tour_tab_configurations[$tab_content_key] ?? '';

                $icon = '';

                if (isset($config['icon']) && '' != $config['icon']) {
                    $icon = '<span class="tab-icon ' . esc_attr($yatra_tour_tab_configurations[$tab_content_key]['icon']) . '"></span> ';
                }

                echo '<div class="yatra-tab-content">';

                do_action('yatra_frontend_tab_content_' . $tab_content_key, $tab_content_title, array(
                    'post' => $post,
                    'tab_content_key' => $tab_content_key,
                    'icon' => $icon
                ));
                echo '</div>';

                echo '</div>';
            }
        } else {

            ?>
            <ul class="yatra-tab-wrap">
                <?php foreach ($frontend_tabs_config as $tab_key => $tab) {

                    ?>
                    <li class="item"><a
                                href="#<?php echo esc_attr($tab_key); ?>"><?php if (isset($yatra_tour_tab_configurations[$tab_key]) && isset($yatra_tour_tab_configurations[$tab_key]['icon'])) {
                                echo !empty($yatra_tour_tab_configurations[$tab_key]['icon']) ? '<span class="icon ' . esc_attr($yatra_tour_tab_configurations[$tab_key]['icon']) . '"></span>' : '';
                            }
                            echo esc_html($tab); ?></a></li>
                <?php } ?>
            </ul>
            <?php
            $loop_index = 0;
            foreach ($frontend_tabs_config as $tab_content_key => $tab_content_title) { ?>
                <section id="<?php echo esc_attr($tab_content_key); ?>"
                         class="yatra-tab-content" <?php if ($loop_index > 0) { ?> aria-hidden="true" <?php } ?>>
                    <div class="tab-inner">
                        <?php

                        do_action('yatra_frontend_tab_content_' . $tab_content_key, $tab_content_title, array(
                            'post' => $post,
                            'tab_content_key' => $tab_content_key,
                            'icon' => ''
                        ))
                        ?>
                    </div>
                </section>
                <?php
                $loop_index++;
            } ?>


            <?php
        }
        echo ' </div>';
    }
}

if (!function_exists('yatra_tour_custom_attributes')) {
    function yatra_tour_custom_attributes()
    {
        $all_args = array();
        $post_id = get_the_ID();
        $tour_meta_custom_attributes = get_post_meta($post_id, 'tour_meta_custom_attributes', true);
        if (count($tour_meta_custom_attributes) > 0) {
            $yatra_tour_attribute_type_options = yatra_tour_attribute_type_options();
            foreach ($tour_meta_custom_attributes as $term_id => $content) {
                $term = get_term($term_id);
                $field_key = get_term_meta($term_id, 'attribute_field_type', true);
                $icon = get_term_meta($term_id, 'icon', true);
                $icon = '' === ($icon) ? 'fa fa-hashtag' : $icon;
                $field = $yatra_tour_attribute_type_options[$field_key] ?? array();
                $field_option = $field['options'] ?? array();
                if (isset($term->name)) {
                    foreach ($content as $content_key => $content_value) {

                        $type = isset($field_option[$content_key]['type']) ? $field_option[$content_key]['type'] : '';

                        if ($type != '') {
                            $type_index = in_array($type, array('text', 'number')) ? 'text_number' : '';
                            $type_index = in_array($type, array('shortcode', 'textarea')) ? 'textarea_shortcode' : $type_index;

                            $all_args[$type_index][] = array(
                                'title' => $term->name,
                                'content' => $content_value,
                                'type' => $type,
                                'icon' => $icon

                            );
                        }

                    }
                }
            }
        }
        return $all_args;
    }
}

if (!function_exists('yatra_tour_custom_attributes_template')) {


    function yatra_tour_custom_attributes_template()
    {
        $all_args = yatra_tour_custom_attributes();


        if (count($all_args) > 0) {

            foreach ($all_args as $arg_type => $arg_item) {

                foreach ($arg_item as $item_index => $item) {

                    $type = $item['type'];

                    switch ($arg_type) {
                        case "text_number":

                            if ($item_index === 0) {
                                echo '<div class="yatra-tour-additional-text-number">';
                            }

                            if (($item_index + 1) % 4 === 1) {

                                echo '<div class="yatra-flex-row">';
                            }
                            yatra_get_template("tour/attributes-{$type}.php", $item);


                            if (count($arg_item) === ($item_index + 1) || (($item_index + 1) % 4 === 0)) {

                                echo '</div>';

                            }

                            if (count($arg_item) === ($item_index + 1)) {


                                echo '</div>';
                            }
                            break;
                        case "textarea_shortcode":
                            yatra_get_template("tour/attributes-{$type}.php", $item);
                            break;


                    }


                }
            }

        }


        /*if (count($short_code_args) > 0) {

            echo '<div class="yatra-tour-additional-info-shortcode">';

            foreach ($short_code_args as $shortcode_content) {
                yatra_get_template("tour/attributes-shortcode.php", $shortcode_content);
            }
            echo '</div>';

        }*/

    }
}
if (!function_exists('yatra_tour_additional_info')) {
    function yatra_tour_additional_info()
    {
        $post_id = get_the_ID();
        $yatra_tour_meta_price_per = get_post_meta($post_id, 'yatra_tour_meta_price_per', true);
        $yatra_tour_meta_group_size = get_post_meta($post_id, 'yatra_tour_meta_group_size', true);
        $yatra_tour_meta_regular_price = get_post_meta($post_id, 'yatra_tour_meta_regular_price', true);
        $yatra_tour_meta_sales_price = get_post_meta($post_id, 'yatra_tour_meta_sales_price', true);
        $yatra_tour_meta_tour_duration_days = get_post_meta($post_id, 'yatra_tour_meta_tour_duration_days', true);
        $yatra_tour_meta_tour_duration_nights = get_post_meta($post_id, 'yatra_tour_meta_tour_duration_nights', true);
        $yatra_tour_meta_tour_country = get_post_meta($post_id, 'yatra_tour_meta_tour_country', true);
        $yatra_tour_maximum_number_of_traveller = get_post_meta($post_id, 'yatra_tour_maximum_number_of_traveller', true);
        $yatra_tour_minimum_pax = get_post_meta($post_id, 'yatra_tour_minimum_pax', true);


        $currency = yatra_get_current_currency();

        $currency_symbol = yatra_get_currency_symbol($currency);

        $country_string = '';

        if (!empty($yatra_tour_meta_tour_country)) {

            foreach ($yatra_tour_meta_tour_country as $country_item) {

                $country = yatra_get_countries($country_item);

                $country_string .= $country . ', ';
            }
            $country_string = trim($country_string, ', ');

            $meta_frontend[] =
                array(
                    'icon' => 'fa fa-map',
                    'text' => $country_string,
                    'title' => __('Country', 'yatra')

                );

        }
        $price_string = $currency_symbol . absint($yatra_tour_meta_regular_price);
        if ($yatra_tour_meta_sales_price > 0) {

            $price_string = '<del>' . $price_string . '</del> &nbsp;' . $currency_symbol . $yatra_tour_meta_sales_price;
        }

        $tour_duration_string = '';

        if ('' != $yatra_tour_meta_tour_duration_days) {

            $tour_duration_string = absint($yatra_tour_meta_tour_duration_days) . ' Days ';
        }
        if ('' != $yatra_tour_meta_tour_duration_nights) {

            $tour_duration_string .= absint($yatra_tour_meta_tour_duration_nights) . ' Nights ';
        }

        $additional_info = array(
            'pricing_per' => ucwords($yatra_tour_meta_price_per),
            'group_size' => $yatra_tour_meta_group_size,
            'price' => $price_string,
            'tour_duration' => $tour_duration_string,
            'country' => $country_string,
            'max_travellers' => $yatra_tour_maximum_number_of_traveller,
            'min_pax' => $yatra_tour_minimum_pax
        );
        return $additional_info;

    }
}
