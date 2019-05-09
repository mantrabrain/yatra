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

    function yatra_post_thumbnail()
    {
        ?>
        <figure class="post-thumbnail">
            <a class="post-thumbnail-inner" href="<?php the_permalink(); ?>" aria-hidden="true" tabindex="-1">
                <?php the_post_thumbnail('post-thumbnail'); ?>
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

if (!function_exists('yatra_entry_meta_for_frontend')) {

    function yatra_entry_meta_for_frontend()
    {

        $currency = get_option('yatra_currency');

        $currency_symbol = yatra_get_currency_symbols($currency);

        $meta_frontend = array(

            '0' => array(
                'icon' => 'fa fa-money',
                'text' => 'Price: ' . $currency_symbol . '{{yatra_tour_meta_tour_price}}'
            ),
            '1' => array(
                'icon' => 'fa fa-clock-o',
                'text' => 'Duration: {{yatra_tour_meta_tour_duration_days}} days and {{yatra_tour_meta_tour_duration_nights}} nights'
            ),
            '2' => array(
                'icon' => 'fa fa-calendar-check-o',
                'text' => 'Starting location: {{yatra_tour_meta_tour_starts_at}}'
            ),
            '3' => array(
                'icon' => 'fa fa-calendar-check-o',
                'text' => 'Ending location: {{yatra_tour_meta_tour_ends_at}}'
            ),
            '4' => array(
                'icon' => 'fa fa-users',
                'text' => 'Best sessions: {{yatra_tour_meta_tour_best_season}}'
            )
        );

        return apply_filters(
            'yatra_entry_meta_frontend',
            $meta_frontend
        );

    }
}
if (!function_exists('yatra_entry_meta_attributes')) {

    function yatra_entry_meta_attributes()
    {
        $post_id = get_the_id();

        $meta_frontend = yatra_entry_meta_for_frontend();

        $list = '';

        foreach ($meta_frontend as $value) {

            $icon = isset($value['icon']) ? $value['icon'] : '';

            $text = isset($value['text']) ? $value['text'] : '';

            preg_match_all("~\{\{\s*(.*?)\s*\}\}~", $text, $matches);

            $matches = isset($matches[1]) ? $matches[1] : array();

            foreach ($matches as $match) {

                $text_id = sanitize_text_field($match);

                $text_option = get_post_meta($post_id, $text_id, true);

                $text = str_replace('{{' . $match . '}}', $text_option, $text);
            }

            $list .= '<li><i class="' . esc_attr($icon) . '"></i>&nbsp;' . esc_html($text) . '</li>';
        }

        echo '<ul>';

        echo $list;

        echo '</ul>';

    }
}