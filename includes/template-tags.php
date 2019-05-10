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

if (!function_exists('yatra_entry_meta_for_frontend_archive')) {

    function yatra_entry_meta_for_frontend_archive()
    {

        $currency = get_option('yatra_currency');

        $currency_symbol = yatra_get_currency_symbols($currency);

        $meta_frontend = array(

            array(
                'icon' => 'fa fa-money',
                'text' => $currency_symbol . '{{yatra_tour_meta_tour_price}}',
                'title' => __('Price', 'yatra')

            ),
            array(
                'icon' => 'fa fa-clock-o',
                'text' => '{{yatra_tour_meta_tour_duration_days}} days and {{yatra_tour_meta_tour_duration_nights}} nights',
                'title' => __('Duration', 'yatra')

            ),
            array(
                'icon' => 'fa fa-calendar-check-o',
                'text' => '{{yatra_tour_meta_tour_starts_at}}',
                'title' => __('Starting location', 'yatra')

            ),
            array(
                'icon' => 'fa fa-calendar-check-o',
                'text' => '{{yatra_tour_meta_tour_ends_at}}',
                'title' => __('Ending location', 'yatra')

            ),
            array(
                'icon' => 'fa fa-users',
                'text' => '{{yatra_tour_meta_tour_best_season}}',
                'title' => __('Best sessions', 'yatra')

            )
        );

        return apply_filters(
            'yatra_entry_meta_frontend',
            $meta_frontend
        );

    }
}


if (!function_exists('yatra_entry_meta_for_frontend_single_tab')) {

    function yatra_entry_meta_for_frontend_single_tab($key = '')
    {

        $post_id = get_the_id();

        if (empty($key)) {
            return;
        }
        $currency = get_option('yatra_currency');

        $country = get_post_meta($post_id, 'yatra_tour_meta_tour_country', true);

        $country_array = array_values(yatra_get_countries($country));

        $country_text = implode(',', $country_array);

        $currency_symbol = yatra_get_currency_symbols($currency);

        $meta_frontend_for_tabs = array(

            'overview' => array(
                array(
                    'icon' => 'fa fa-money',
                    'text' => $currency_symbol . '{{yatra_tour_meta_tour_price}}',
                    'title' => __('Tour Price', 'yatra')
                ),
                array(
                    'icon' => 'fa fa-money',
                    'text' => $country_text,
                    'title' => __('Country', 'yatra')
                ),
                array(
                    'icon' => 'fa fa-money',
                    'text' => '{{yatra_tour_meta_tour_max_altitude}}',
                    'title' => __('Max altitude', 'yatra')
                ),
                array(
                    'icon' => 'fa fa-clock-o',
                    'text' => 'Duration: {{yatra_tour_meta_tour_duration_days}} days and {{yatra_tour_meta_tour_duration_nights}} nights',
                    'title' => 'Trip Code'
                ),
                array(
                    'icon' => 'fa fa-calendar-check-o',
                    'text' => '{{yatra_tour_meta_tour_starts_at}}',
                    'title' => __('Starts at', 'yatra')
                ),
                array(
                    'icon' => 'fa fa-calendar-check-o',
                    'text' => '{{yatra_tour_meta_tour_ends_at}}',
                    'title' => __('Ends at', 'yatra')
                ),
                array(
                    'icon' => 'fa fa-users',
                    'text' => '{{yatra_tour_meta_tour_best_season}}',
                    'title' => __('Best sessions', 'yatra')
                ), array(
                    'icon' => 'fa fa-users',
                    'text' => '{{yatra_tour_meta_tour_route}}',
                    'title' => __('Tour Route', 'yatra')
                )
            ), 'itinerary' => array(
                array(
                    'icon' => 'fa fa-users',
                    'text' => '{{yatra_itineray_detail}}',
                    'title' => __('Tour Route', 'yatra')
                )
            ), 'cost_info' => array(
                array(
                    'icon' => 'fa fa-users',
                    'text' => '{{yatra_cost_included}}',
                    'title' => __('Cost Included', 'yatra'),
                    'id' => 'cost_included'
                ), array(
                    'icon' => 'fa fa-users',
                    'text' => '{{yatra_cost_excluded}}',
                    'title' => __('Cost Excluded', 'yatra'),
                    'id' => 'cost_excluded'
                )
            ), 'tour_facts' => array(
                array(
                    'icon' => 'fa fa-users',
                    'text' => '{{yatra_facts_detail}}',
                    'title' => __('Tour Route', 'yatra')
                )
            )
        );

        if (!isset($meta_frontend_for_tabs[$key])) {

            return;
        }
        $meta_frontend_for_tabs = apply_filters(

            'yatra_entry_meta_frontend_single_tab',

            $meta_frontend_for_tabs
        );

        $meta_frontend = $meta_frontend_for_tabs[$key];

        $list = array();

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

            $list_array =

                array(
                    'icon' => $icon,
                    'text' => $text,
                    'title' => $title,
                    'id' => isset($value['id']) ? $value['id'] : ''
                );
            $list[] = $list_array;
        }

        return $list;
    }
}


if (!function_exists('yatra_entry_meta_attributes')) {

    function yatra_entry_meta_attributes()
    {
        $post_id = get_the_id();

        $meta_frontend = yatra_entry_meta_for_frontend_archive();

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

            $list .= '<li><i class="' . esc_attr($icon) . '"></i>&nbsp;<strong>' . esc_html($title) . ': </strong>' . esc_html($text) . '</li>';
        }

        echo '<ul>';

        echo $list;

        echo '</ul>';

    }
}

if (!function_exists('yatra_frontend_tabs_config')) {

    function yatra_frontend_tabs_config()
    {
        $frontend_tabs_config = array(

            'overview' => __('Overview', 'yatra'),
            'itinerary' => __('Itinerary', 'yatra'),
            'cost_info' => __('Cost Info', 'yatra'),
            'tour_facts' => __('Tour Facts', 'yatra'),
        );
        return apply_filters('frontend_tabs_configurations', $frontend_tabs_config);
    }
}


if (!function_exists('yatra_frontend_tabs')) {

    function yatra_frontend_tabs()
    {

        $frontend_tabs_config = yatra_frontend_tabs_config();

        ?>
        <div class="yatra-tabs">

            <ul>
                <?php foreach ($frontend_tabs_config as $tab_key => $tab) { ?>
                    <li><a href="#<?php echo esc_attr($tab_key); ?>"><?php echo esc_html($tab); ?></a></li>
                <?php } ?>
            </ul>
            <?php
            $loop_index = 0;
            foreach ($frontend_tabs_config as $tab_content_key => $tab_content) { ?>
                <section id="<?php echo esc_attr($tab_content_key); ?>"
                         class="yatra-tab-content" <?php if ($loop_index > 0) { ?> aria-hidden="true" <?php } ?>>
                    <div class="tab-inner">
                        <?php
                        do_action('yatra_frontend_tab_content_' . $tab_content_key, $tab_content)
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