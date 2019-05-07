<?php

defined('ABSPATH') || exit;
if (!function_exists('yatra_get_taxonomy_term_lists')) {
    function yatra_get_taxonomy_term_lists($post_id, $taxonomy = '')
    {
        /* translators: used between list items, there is a space after the comma. */
        $terms = get_the_term_list($post_id, $taxonomy,'',__(', ', 'yatra'));

        if ($terms) {
            printf(
            /* translators: 1: SVG icon. 2: posted in label, only visible to screen readers. 3: list of categories. */
                '<span class="cat-links">%1$s<span class="screen-reader-text">%2$s</span>%3$s</span>',
                twentynineteen_get_icon_svg('archive', 16),
                __('Posted in', 'twentynineteen'),
                $terms
            ); // WPCS: XSS OK.
        }

//        /* translators: used between list items, there is a space after the comma. */
//        $tags_list = get_the_tag_list('', __(', ', 'twentynineteen'));
//        if ($tags_list) {
//            printf(
//            /* translators: 1: SVG icon. 2: posted in label, only visible to screen readers. 3: list of tags. */
//                '<span class="tags-links">%1$s<span class="screen-reader-text">%2$s </span>%3$s</span>',
//                twentynineteen_get_icon_svg('tag', 16),
//                __('Tags:', 'twentynineteen'),
//                $tags_list
//            ); // WPCS: XSS OK.
//        }
    }
}