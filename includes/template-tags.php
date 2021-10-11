<?php

defined('ABSPATH') || exit;
if (!function_exists('yatra_get_taxonomy_term_lists')) {
    function yatra_get_taxonomy_term_lists($post_id, $taxonomy = '')
    {
        /* translators: used between list items, there is a space after the comma. */
        $terms = get_the_term_list($post_id, $taxonomy, '', __(', ', 'yatra'));

        if ($terms) {
            printf(
            /* translators: 1: Taxonomy name 2: SVG icon. 3: posted in label, only visible to screen readers.*/
                '<span class="cat-links %1$s-links"><span class="screen-reader-text">%2$s</span>%3$s</span>',
                ($taxonomy),
                ucwords($taxonomy),
                $terms
            ); // WPCS: XSS OK.
        }

//        /* translators: used between list items, there is a space after the comma. */
//        $tags_list = get_the_tag_list('', __(', ', 'yatra'));
//        if ($tags_list) {
//            printf(
//            /* translators: 1: SVG icon. 2: posted in label, only visible to screen readers. 3: list of tags. */
//                '<span class="tags-links">%1$s<span class="screen-reader-text">%2$s </span>%3$s</span>',
//                yatra_get_icon_svg('tag', 16),
//                __('Tags:', 'yatra'),
//                $tags_list
//            ); // WPCS: XSS OK.
//        }
    }
}

if (!function_exists('yatra_entry_header')) {

    function yatra_entry_header()
    {
        ?>
        <header class="entry-header">
            <?php
            if (is_sticky() && is_home() && !is_paged()) {
                printf('<span class="sticky-post">%s</span>', _x('Featured', 'post', 'yatra'));
            }
            if (is_singular()) :
                the_title('<h1 class="entry-title">', '</h1>');
            else :
                the_title(sprintf('<h2 class="entry-title"><a href="%s" rel="bookmark">', esc_url(get_permalink())), '</a></h2>');
            endif;
            ?>
            <div class="entry-meta">
                <?php
                yatra_get_taxonomy_term_lists(get_the_ID(), 'destination');
                ?></div>
        </header><!-- .entry-header -->
        <?php
    }
}

if (!function_exists('yatra_post_thumbnail')) {

    function yatra_post_thumbnail($size = "post-thumbnail")
    {
        ?>
        <figure class="post-thumbnail">
            <a class="post-thumbnail-inner" href="<?php the_permalink(); ?>" aria-hidden="true" tabindex="-1">
                <?php the_post_thumbnail($size); ?>
            </a>
        </figure>
        <?php
    }
}

if (!function_exists('yatra_entry_post_content')) {

    function yatra_entry_post_content()
    {
        ?>
        <div class="entry-content">
            <?php
            the_excerpt();
            ?>
        </div><!-- .entry-content -->
        <?php
    }
}

if (!function_exists('yatra_entry_footer')) {

    function yatra_entry_footer()
    {
        ?>
        <div class="entry-footer">
            <?php
            yatra_posted_by();
            yatra_posted_on();
            yatra_get_taxonomy_term_lists(get_the_ID(), 'destination'); ?>
        </div>
        <?php
    }
}

if (!function_exists('yatra_get_current_currency_symbol')) {
    function yatra_get_current_currency_symbol()
    {
        $currency = get_option('yatra_currency');

        $currency_symbol = yatra_get_currency_symbols($currency);

        return $currency_symbol;
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

        if ((int)$yatra_tour_meta_sales_price > 0) {

            $yatra_tour_meta_regular_price_string = '<del>' . $yatra_tour_meta_regular_price_string . '</del> &nbsp;' . $currency_symbol . $yatra_tour_meta_sales_price;;

        }

        $yatra_tour_meta_tour_fixed_departure = get_post_meta($post_id, 'yatra_tour_meta_tour_fixed_departure', true);

        if ((boolean)$yatra_tour_meta_tour_fixed_departure && !is_null($yatra_tour_meta_tour_fixed_departure)) {
            $tour_duration = '{{yatra_tour_meta_tour_start_date}} to {{yatra_tour_meta_tour_end_date}}';
        } else {
            $tour_duration = '{{yatra_tour_meta_tour_duration_days}} days and {{yatra_tour_meta_tour_duration_nights}} nights';
        }

        $meta_frontend = array(
            array(
                'icon' => 'fa fa-user',
                'text' => '{{yatra_tour_meta_price_per}}',
                'title' => __('Price Per', 'yatra')

            ), array(
                'icon' => 'fa fa-user-circle',
                'text' => '{{yatra_tour_meta_group_size}}',
                'title' => __('Group Size', 'yatra')

            ),
            array(
                'icon' => 'fa fa-clock-o',
                'text' => $tour_duration,
                'title' => __('Duration', 'yatra')

            ),

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
                    'icon' => 'fa fa-map',
                    'text' => $country_string,
                    'title' => __('Country', 'yatra')

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

        $meta_frontend = yatra_entry_meta_for_frontend_archive($post_id);

        $list = '';

        foreach ($meta_frontend as $value) {

            $icon = isset($value['icon']) ? $value['icon'] : '';

            $text = isset($value['text']) ? $value['text'] : '';

            $title = isset($value['title']) ? $value['title'] : '';

            preg_match_all("~\{\{\s*(.*?)\s*\}\}~", $text, $matches);

            $matches = isset($matches[1]) ? $matches[1] : array();

            foreach ($matches as $match) {

                $text_id = sanitize_text_field($match);

                $text_option = get_post_meta($post_id, $text_id, true);

                $text = str_replace('{{' . $match . '}}', $text_option, $text);
            }

            $list .= '<li><i class="' . esc_attr($icon) . '"></i>&nbsp;<strong>' . esc_html($title) . ': </strong>' . ($text) . '</li>';
        }
        echo '<ul class="yatra-tour-meta-options">';

        echo $list;

        echo '</ul>';

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
                'icon' => 'fa fa-atom',
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
                'icon' => 'fa fa-gopuram',
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
                'icon' => 'fa fa-comment-dots',
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
                'icon' => 'fa fa-directions',
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
                'icon' => 'fa fa-images',
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
                            'placeholder' => __('Default value for text field.', 'yatra'),
                            'description' => __('Default value for text field.', 'yatra'),
                            'type' => 'shortcode',
                            'wrap_class' => 'yatra-left',


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
                //'wrap_class' => 'yatra-right',
                //'row_end' => true,

            ),
            'yatra_tour_meta_tour_start_date' => array(
                'name' => 'yatra_tour_meta_tour_start_date',
                'title' => esc_html__('Start Date', 'yatra'),
                'description' => esc_html__('Start Date', 'yatra'),
                'type' => 'date',
                // 'wrap_class' => 'yatra-left',
                'extra_attributes' => array(
                    'placeholder' => __('Tour Start Date', 'yatra'),
                ),
                'visibility_condition' => array(
                    'yatra_tour_meta_tour_fixed_departure' => true
                )
                //'row_start' => true,

            ),
            'yatra_tour_meta_tour_end_date' => array(
                'name' => 'yatra_tour_meta_tour_end_date',
                'title' => esc_html__('End Date', 'yatra'),
                'description' => esc_html__('End Date', 'yatra'),
                'type' => 'date',
                // 'wrap_class' => 'yatra-left',
                'extra_attributes' => array(
                    'placeholder' => __('Tour End Date', 'yatra'),
                ),
                'visibility_condition' => array(
                    'yatra_tour_meta_tour_fixed_departure' => true
                )
                //'row_start' => true,

            ), 'yatra_tour_meta_tour_duration_days' => array(
                'name' => 'yatra_tour_meta_tour_duration_days',
                'title' => esc_html__('Tour Duration Days', 'yatra'),
                'description' => esc_html__('Total duration days for this tour', 'yatra'),
                'type' => 'number',
                // 'wrap_class' => 'yatra-left',
                'extra_attributes' => array(
                    'placeholder' => __('Number of days', 'yatra'),
                ),
                'visibility_condition' => array(
                    'yatra_tour_meta_tour_fixed_departure' => false
                )


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
                'visibility_condition' => array(
                    'yatra_tour_meta_tour_fixed_departure' => false
                )
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
                //'wrap_class' => 'yatra-right',
                //'row_end' => true,

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
        $currency = get_option('yatra_currency');

        $currency_symbols = yatra_get_currency_symbols($currency);

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
                'conditional_and_display' =>

                    array(array('yatra_tour_meta_price_per', '=', 'group')),
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

if (!function_exists('yatra_tour_custom_attributes_template')) {
    function yatra_tour_custom_attributes_template()
    {
        $post_id = get_the_ID();
        $tour_meta_custom_attributes = get_post_meta($post_id, 'tour_meta_custom_attributes', true);
        if (count($tour_meta_custom_attributes) > 0) {
            echo '<h3>' . esc_html(get_option('yatra_custom_attributes_title_text', 'Attributes')) . '</h3>';
            $yatra_tour_attribute_type_options = yatra_tour_attribute_type_options();
            ?>
            <table>
                <?php foreach ($tour_meta_custom_attributes as $term_id => $content) {
                    $term = get_term($term_id);
                    $field_key = get_term_meta($term_id, 'attribute_field_type', true);
                    $field = $yatra_tour_attribute_type_options[$field_key] ?? array();
                    $field_option = $field['options'] ?? array();
                    if (isset($term->name)) {
                        $args['term'] = $term;
                        $args['content'] = $content;
                        $args['field_option'] = $field_option;
                        yatra_get_template('parts/additional/attributes.php', $args);
                    }
                } ?>
            </table>

            <?php
        }

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
        $yatra_tour_meta_tour_fixed_departure = get_post_meta($post_id, 'yatra_tour_meta_tour_fixed_departure', true);
        $yatra_tour_meta_tour_start_date = get_post_meta($post_id, 'yatra_tour_meta_tour_start_date', true);
        $yatra_tour_meta_tour_end_date = get_post_meta($post_id, 'yatra_tour_meta_tour_end_date', true);

        $yatra_tour_meta_tour_fixed_departure = $yatra_tour_meta_tour_fixed_departure == 1 ? true : false;


        $currency = get_option('yatra_currency');

        $currency_symbol = yatra_get_currency_symbols($currency);

        if (!empty($yatra_tour_meta_tour_country)) {

            $country_string = '';


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
        if ($yatra_tour_meta_tour_fixed_departure) {
            $tour_duration_string = $yatra_tour_meta_tour_start_date . ' to ' . $yatra_tour_meta_tour_end_date;
        }
        $additional_info = array(
            'price_per' => ucwords($yatra_tour_meta_price_per),
            'group_size' => $yatra_tour_meta_group_size,
            'price' => $price_string,
            'tour_duration' => $tour_duration_string,
            'country' => $country_string
        );
        return $additional_info;

    }
}
