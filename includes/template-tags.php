<?php

defined('ABSPATH') || exit;
if (!function_exists('yatra_get_taxonomy_term_lists')) {
    function yatra_get_taxonomy_term_lists($post_id, $taxonomy = '')
    {
        /* translators: used between list items, there is a space after the comma. */
        $terms = get_the_term_list($post_id, $taxonomy, '', __(', ', 'yatra'));

        if ($terms) {
            printf(
            /* translators: 1: SVG icon. 2: posted in label, only visible to screen readers. 3: list of categories. */
                '<span class="cat-links"><span class="screen-reader-text">%1$s</span>%2$s</span>',
                __('Posted in', 'yatra'),
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


        $meta_frontend = array(

            array(
                'icon' => 'fa fa-money',
                'text' => $yatra_tour_meta_regular_price_string,
                'title' => __('Price', 'yatra')

            ),
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
                'text' => '{{yatra_tour_meta_tour_duration_days}} days and {{yatra_tour_meta_tour_duration_nights}} nights',
                'title' => __('Duration', 'yatra')

            ),
            /*array(
                'icon' => 'fa fa-calendar-check-o',
                'text' => '{{yatra_tour_meta_tour_starts_at}}',
                'title' => __('Starting location', 'yatra')

            ),
            array(
                'icon' => 'fa fa-calendar-check-o',
                'text' => '{{yatra_tour_meta_tour_ends_at}}',
                'title' => __('Ending location', 'yatra')

            ),*/

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

    function yatra_entry_meta_options()
    {
        $post_id = get_the_id();

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
        echo '<ul>';

        echo $list;

        echo '</ul>';

    }
}
if (!function_exists('yatra_tour_tab_configurations')) {

    function yatra_tour_tab_configurations()
    {

        $tab_config = array(
            'overview' => array(
                'label' => __('Overview', 'yatra'),
                'icon' => 'fa fa-atom',
                'options' =>
                    array(
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
                        'cost_info_label' => array(
                            'name' => 'cost_info_label',
                            'title' => __('Label', 'yatra'),
                            'type' => 'text',
                            'default' => __('Cost Info', 'yatra'),
                        ),
                        'cost_info_price_includes_title' => array(
                            'name' => 'cost_info_price_includes_title',
                            'title' => __('Title', 'yatra'),
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
                'wrap_class' => 'yatra-left',
            ),
            array(
                'name' => 'add_tour_attribute',
                'type' => 'button',
                'default' => sprintf(__('Add New', 'yatra')),
                'wrap_class' => 'yatra-right'

            )
        );
        return apply_filters('yatra_tour_attributes', $tour_attributes);
    }
}


if (!function_exists('yatra_tour_general_configurations')) {

    function yatra_tour_general_configurations()
    {
        $currency = get_option('yatra_currency');

        $currency_symbols = yatra_get_currency_symbols($currency);

        $countries = yatra_get_countries();

        $tour_options = array(
            'yatra_tour_meta_price_per' => array(
                'name' => 'yatra_tour_meta_price_per',
                'title' => __('Price Per', 'yatra'),
                'type' => 'select',
                'wrap_class' => 'yatra-left',
                'row_start' => true,
                'options' => array(
                    'person' => __('Person', 'yatra'),
                    'group' => __('Group', 'yatra')
                ),
            ), 'yatra_tour_meta_group_size' => array(
                'name' => 'yatra_tour_meta_group_size',
                'title' => __('Group Size', 'yatra'),
                'type' => 'number',
                'wrap_class' => 'yatra-right',
                'extra_attributes' => array(
                    'placeholder' => __('Group Size', 'yatra'),
                ),
                'row_end' => true,
            ),
            'yatra_tour_meta_regular_price' => array(
                'name' => 'yatra_tour_meta_regular_price',
                'title' => sprintf(__('Tour Price- Regular (%s)', 'yatra'), $currency_symbols),
                'type' => 'number',
                'wrap_class' => 'yatra-left',
                'extra_attributes' => array(
                    'placeholder' => sprintf(__('Tour Price - Regular (%s)', 'yatra'), $currency_symbols),
                ),
                'row_start' => true,
            ),
            'yatra_tour_meta_sales_price' => array(
                'name' => 'yatra_tour_meta_sales_price',
                'title' => sprintf(__('Tour Price- Sales Price (%s)', 'yatra'), $currency_symbols),
                'type' => 'number',
                'wrap_class' => 'yatra-right',
                'extra_attributes' => array(
                    'placeholder' => sprintf(__('Tour Price - Sales Price (%s). Leave it empty if you do not want to show sales price.', 'yatra'), $currency_symbols),
                ),
                'row_end' => true,
            ),
            'yatra_tour_meta_tour_duration_days' => array(
                'name' => 'yatra_tour_meta_tour_duration_days',
                'title' => esc_html__('Tour Duration Days', 'yatra'),
                'type' => 'number',
                'wrap_class' => 'yatra-left',
                'extra_attributes' => array(
                    'placeholder' => __('Number of days', 'yatra'),
                ),
                'row_start' => true,

            ),
            'yatra_tour_meta_tour_duration_nights' => array(
                'name' => 'yatra_tour_meta_tour_duration_nights',
                'title' => esc_html__('Tour Duration Nights', 'yatra'),
                'type' => 'number',
                'wrap_class' => 'yatra-right',
                'extra_attributes' => array(
                    'placeholder' => __('Number of nights', 'yatra'),
                ),
                'row_end' => true,

            ),
            'yatra_tour_meta_tour_country' => array(
                'name' => 'yatra_tour_meta_tour_country',
                'title' => esc_html__('Country', 'yatra'),
                'type' => 'select',
                'wrap_class' => 'yatra-left',
                'extra_attributes' => array(
                    'placeholder' => __('Country', 'yatra'),
                ),
                'options' => $countries,
                'default' => 'NP',
                'is_multiple' => true,
                'select2' => true,
                'row_start' => true,

            ),
            'yatra_tour_meta_tour_tabs_ordering' => array(
                'name' => 'yatra_tour_meta_tour_tabs_ordering',
                'type' => 'hidden',

            ),
        );
        return apply_filters('yatra_tour_general_configurations', $tour_options);
    }
}


if (!function_exists('yatra_frontend_tabs_config')) {

    function yatra_frontend_tabs_config()
    {

        $post_id = get_the_ID();

        $yatra_tour_meta_tour_tabs_ordering = get_post_meta($post_id, 'yatra_tour_meta_tour_tabs_ordering', true);

        $yatra_tour_meta_tour_tabs_ordering_array = explode(',', $yatra_tour_meta_tour_tabs_ordering);

        $configs = yatra_tour_tab_configurations();

        $config_array_keys = array_keys($configs);

        $array_diff = array_diff($config_array_keys, $yatra_tour_meta_tour_tabs_ordering_array);

        $final_ordered_config_keys = $yatra_tour_meta_tour_tabs_ordering_array;

        if (count($array_diff) > 0) {

            $final_ordered_config_keys = array_merge($yatra_tour_meta_tour_tabs_ordering_array, $array_diff);
        }

        $frontend_tabs_config = array();

        $active_tab_config = '';

        foreach ($final_ordered_config_keys as $config) {

            if (isset($configs[$config])) {

                $setting = $configs[$config];

                $label = get_post_meta($post_id, $config . '_label', true);

                $label = empty($label) ? $setting['label'] : $label;

                $frontend_tabs_config [$config] = $label;

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

        ?>
        <div class="yatra-tabs">

            <ul class="yatra-tab-wrap">
                <?php foreach ($frontend_tabs_config as $tab_key => $tab) { ?>
                    <li class="item"><a
                                href="#<?php echo esc_attr($tab_key); ?>"><?php if (isset($yatra_tour_tab_configurations[$tab_key]) && isset($yatra_tour_tab_configurations[$tab_key]['icon'])) {
                                echo !empty($yatra_tour_tab_configurations[$tab_key]['icon']) ? '<span class="' . esc_attr($yatra_tour_tab_configurations[$tab_key]['icon']) . '"></span>' : '';
                            }
                            echo esc_html($tab); ?></a></li>
                <?php } ?>
            </ul>
            <?php
            $loop_index = 0;
            foreach ($frontend_tabs_config as $tab_content_key => $tab_content) { ?>
                <section id="<?php echo esc_attr($tab_content_key); ?>"
                         class="yatra-tab-content" <?php if ($loop_index > 0) { ?> aria-hidden="true" <?php } ?>>
                    <div class="tab-inner">
                        <?php
                        do_action('yatra_frontend_tab_content_' . $tab_content_key, $tab_content, $post)
                        ?>
                    </div>
                </section>
                <?php
                $loop_index++;
            } ?>

        </div>
        <?php
    }
}
if (!function_exists('yatra_frontend_options')) {
    function yatra_frontend_options()
    {
        $post_id = get_the_ID();
        $yatra_tour_meta_price_per = get_post_meta($post_id, 'yatra_tour_meta_price_per', true);
        $yatra_tour_meta_group_size = get_post_meta($post_id, 'yatra_tour_meta_group_size', true);
        $yatra_tour_meta_regular_price = get_post_meta($post_id, 'yatra_tour_meta_regular_price', true);
        $yatra_tour_meta_sales_price = get_post_meta($post_id, 'yatra_tour_meta_sales_price', true);
        $yatra_tour_meta_tour_duration_days = get_post_meta($post_id, 'yatra_tour_meta_tour_duration_days', true);
        $yatra_tour_meta_tour_duration_nights = get_post_meta($post_id, 'yatra_tour_meta_tour_duration_nights', true);
        $yatra_tour_meta_tour_country = get_post_meta($post_id, 'yatra_tour_meta_tour_country', true);


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
        ?>
        <h3><?php echo __('Options', 'yatra') ?></h3>
        <table>
            <tr>
                <th><?php echo __('Price per', 'yatra') ?></th>
                <td><?php echo esc_html(ucwords($yatra_tour_meta_price_per)) ?></td>
            </tr>
            <tr>
                <th><?php echo __('Group Size', 'yatra') ?></th>
                <td><?php echo absint($yatra_tour_meta_group_size) ?></td>
            </tr>
            <tr>
                <th><?php echo __('Price', 'yatra') ?></th>
                <td><?php echo $price_string; ?></td>
            </tr>
            <tr>
                <th><?php echo __('Tour Duration', 'yatra') ?></th>
                <td><?php echo absint($yatra_tour_meta_tour_duration_days); ?>
                    Days <?php echo absint($yatra_tour_meta_tour_duration_nights) ?> Nights
                </td>
            </tr>
            <tr>
                <th><?php echo __('Country', 'yatra') ?></th>
                <td><?php echo esc_html($country_string); ?></td>
            </tr>
        </table>

        <?php

        $tour_meta_custom_attributes = get_post_meta($post_id, 'tour_meta_custom_attributes', true);
        if (count($tour_meta_custom_attributes) > 0) {
            echo '<h3>' . __('Attributes', 'yatra') . '</h3>';
            $yatra_tour_attribute_type_options = yatra_tour_attribute_type_options();
            ?>
            <table>
                <?php foreach ($tour_meta_custom_attributes as $term_id => $content) {
                    $term = get_term($term_id);
                    $field_key = get_term_meta($term_id, 'attribute_field_type', true);
                    $field = isset($yatra_tour_attribute_type_options[$field_key]) ? $yatra_tour_attribute_type_options[$field_key] : array();
                    $field_option = isset($field['options']) ? $field['options'] : array();
                    if (isset($term->name)) {
                        ?>
                        <tr>
                            <th><?php echo esc_html($term->name) ?></th>
                            <td><?php

                                foreach ($content as $content_key => $content_value) {

                                    $type = isset($field_option[$content_key]['type']) ? $field_option[$content_key]['type'] : '';

                                    $value = '';

                                    if (count($field_option) > 0) {

                                        switch ($type) {
                                            case    "text":
                                                $value = esc_html($content_value);
                                                break;
                                            case    "textarea":
                                                $value = esc_html($content_value);
                                                break;

                                            case "number":
                                                $value = absint($content_value);
                                                break;
                                            case "shortcode":
                                                $value = do_shortcode($content_value);
                                                break;


                                        }

                                        echo '<p>' . ($value) . '</p>';
                                    }
                                }
                                ?></td>
                        </tr>

                        <?php
                    }
                } ?>
            </table>

            <?php
        }

    }
}