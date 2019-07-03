<?php
defined('ABSPATH') || exit;

// Load Helpers

include_once YATRA_ABSPATH . 'includes/helpers/yatra-country-helper.php';
include_once YATRA_ABSPATH . 'includes/helpers/yatra-currency-helper.php';
include_once YATRA_ABSPATH . 'includes/template-tags.php';


if (!function_exists('yatra_tour_tabs')) {
    function yatra_tour_tabs()
    {
        $tour_tabs_array = array(
            'options' => array(
                'title' => __('Options', 'yatra'),
                'icon' => '',
            ),
            'itinerary' => array(
                'title' => __('Itinerary', 'yatra'),
                'icon' => '',
            ),
            'cost_info' => array(
                'title' => __('Cost Info', 'yatra'),
                'icon' => '',
            ),
            'facts' => array(
                'title' => __('Facts', 'yatra'),
                'icon' => '',
            ),
            'faq' => array(
                'title' => __('FAQ', 'yatra'),
                'icon' => '',
            ),
        );

        return apply_filters('yatra_tour_tabs', $tour_tabs_array);
    }
}

if (!function_exists('yatra_tour_metabox_tabs')) {

    function yatra_tour_metabox_tabs()
    {
        $metabox_tabs = array(

            'tour-options' => array(
                'label' => __('Tour Options', 'yatra'),
                'config' => yatra_tour_general_configurations()
            ),
            'tour-attributes' => array(
                'label' => __('Attributes', 'yatra'),
                'config' => yatra_tour_attributes()
            ),
            'tour-tabs' => array(
                'label' => __('Tour Tabs', 'yatra'),
                'config' => yatra_tour_tab_configurations()
            ),
        );

        return apply_filters('yatra_tour_metabox_tabs', $metabox_tabs);
    }
}


if (!function_exists('yatra_set_session')) {

    function yatra_set_session($key = '', $value = '')
    {
        if (!session_id()) {
            session_start();
        }

        $yatra_session_id = "yatra_session";

        if (!empty($key) && !empty($value)) {

            $_SESSION[$yatra_session_id][$key] = $value;

            return true;
        }
        return false;

    }
}

if (!function_exists('yatra_get_session')) {

    function yatra_get_session($key = '')
    {

        $yatra_session_id = "yatra_session";

        if (!empty($key)) {

            if (isset($_SESSION[$yatra_session_id][$key])) {

                return $_SESSION[$yatra_session_id][$key];
            }

        }
        if (isset($_SESSION[$yatra_session_id])) {

            return $_SESSION[$yatra_session_id];
        }

        return array();

    }
}

if (!function_exists('yatra_clear_session')) {

    function yatra_clear_session($key = '')
    {
        if (!session_id()) {
            session_start();
        }

        $yatra_session_id = "yatra_session";

        if (!empty($key)) {

            if (isset($_SESSION[$yatra_session_id][$key])) {

                unset($_SESSION[$yatra_session_id][$key]);

                return true;
            }

        }
        if (isset($_SESSION[$yatra_session_id])) {

            unset($_SESSION[$yatra_session_id]);

            return true;
        }

        return false;

    }
}

if (!function_exists('yatra_get_template')) {

    function yatra_get_template($template_name, $args = array(), $template_path = '', $default_path = '')
    {
        $cache_key = sanitize_key(implode('-', array('template', $template_name, $template_path, $default_path)));
        $template = (string)wp_cache_get($cache_key, 'yatra');

        if (!$template) {
            $template = yatra_locate_template($template_name, $template_path, $default_path);
            wp_cache_set($cache_key, $template, 'yatra');
        }
        // Allow 3rd party plugin filter template file from their plugin.
        $filter_template = apply_filters('yatra_get_template', $template, $template_name, $args, $template_path, $default_path);

        if ($filter_template !== $template) {
            if (!file_exists($filter_template)) {
                /* translators: %s template */
                _doing_it_wrong(__FUNCTION__, sprintf(__('%s does not exist.', 'yatra'), '<code>' . $template . '</code>'), '1.0.1');
                return;
            }
            $template = $filter_template;
        }

        $action_args = array(
            'template_name' => $template_name,
            'template_path' => $template_path,
            'located' => $template,
            'args' => $args,
        );

        if (!empty($args) && is_array($args)) {
            if (isset($args['action_args'])) {
                _doing_it_wrong(
                    __FUNCTION__,
                    __('action_args should not be overwritten when calling yatra_get_template.', 'yatra'),
                    '1.0.0'
                );
                unset($args['action_args']);
            }
            extract($args); // @codingStandardsIgnoreLine
        }

        do_action('yatra_before_template_part', $action_args['template_name'], $action_args['template_path'], $action_args['located'], $action_args['args']);

        include $action_args['located'];

        do_action('yatra_after_template_part', $action_args['template_name'], $action_args['template_path'], $action_args['located'], $action_args['args']);
    }
}

if (!function_exists('yatra_locate_template')) {
    function yatra_locate_template($template_name, $template_path = '', $default_path = '')
    {
        if (!$template_path) {
            $template_path = yatra_instance()->template_path();
        }

        if (!$default_path) {
            $default_path = yatra_instance()->plugin_template_path();
        }

        // Look within passed path within the theme - this is priority.
        $template = locate_template(
            array(
                trailingslashit($template_path) . $template_name,
                $template_name,
            )
        );

        // Get default template/.
        if (!$template) {
            $template = $default_path . $template_name;
        }
        // Return what we found.
        return apply_filters('yatra_locate_template', $template, $template_name, $template_path);
    }
}

if (!function_exists('yatra_single_tour_tabs')) {

    function yatra_single_tour_tabs()
    {
        global $post;


    }
}

if (!function_exists('yatra_get_checkout_page')) {

    function yatra_get_checkout_page($get_permalink = false)
    {

        $page_id = absint(get_option('yatra_checkout_page'));

        if ($page_id < 1) {

            global $wpdb;

            $page_id = $wpdb->get_var('SELECT ID FROM ' . $wpdb->prefix . 'posts WHERE post_content LIKE "%[yatra_checkout]%" AND post_parent = 0');
        }

        $page_permalink = get_permalink($page_id);

        if ($get_permalink) {

            return $page_permalink;
        }

        return $page_id;


    }
}

if (!function_exists('yatra_get_booking_statuses')) {

    function yatra_get_booking_statuses()
    {
        return apply_filters(
            'yatra_booking_statuses', array(
                'yatra-pending' => __('Pending', 'yatra'),
                'yatra-processing' => __('Processing', 'yatra'),
                'yatra-on-hold' => __('On Hold', 'yatra'),
                'yatra-completed' => __('Completed', 'yatra'),
                'yatra-cancelled' => __('Cancelled', 'yatra')
            )
        );

    }
}

if (!function_exists('yatra_the_posts_navigation')) :
    /**
     * Documentation for function.
     */
    function yatra_the_posts_navigation()
    {
        the_post_navigation(array(
            'prev_text' => '<span class="screen-reader-text">' . esc_html__('Previous Post', 'yatra') . '</span><span class="nav-title">%title</span>',
            'next_text' => '<span class="screen-reader-text">' . esc_html__('Next Post', 'yatra') . '</span><span class="nav-title">%title</span>',
        ));
    }
endif;

if (!function_exists('yatra_get_template_part')) {

    function yatra_get_template_part($slug, $name = '')
    {
        $path = "{$slug}.php";

        if ('' !== $name) {

            $path = "{$slug}-{$name}.php";
        }
        $template = yatra_locate_template($path, false, false);

        require $template;

    }

}
if (!function_exists('yatra_posted_by')) :
    /**
     * Prints HTML with meta information about theme author.
     */
    function yatra_posted_by()
    {
        printf(
        /* translators: 1: SVG icon. 2: post author, only visible to screen readers. 3: author link. */
            '<span class="byline"><span class="screen-reader-text">%1$s</span><span class="author vcard"><a class="url fn n" href="%2$s">%3$s</a></span></span>',
            __('Posted by', 'yatra'),
            esc_url(get_author_posts_url(get_the_author_meta('ID'))),
            esc_html(get_the_author())
        );
    }
endif;

if (!function_exists('yatra_posted_on')) :
    /**
     * Prints HTML with meta information for the current post-date/time.
     */
    function yatra_posted_on()
    {
        $time_string = '<time class="entry-date published updated" datetime="%1$s">%2$s</time>';
        if (get_the_time('U') !== get_the_modified_time('U')) {
            $time_string = '<time class="entry-date published" datetime="%1$s">%2$s</time><time class="updated" datetime="%3$s">%4$s</time>';
        }

        $time_string = sprintf(
            $time_string,
            esc_attr(get_the_date(DATE_W3C)),
            esc_html(get_the_date()),
            esc_attr(get_the_modified_date(DATE_W3C)),
            esc_html(get_the_modified_date())
        );

        printf(
            '<span class="posted-on"><a href="%1$s" rel="bookmark">%2$s</a></span>',
            esc_url(get_permalink()),
            $time_string
        );
    }
endif;

if (!function_exists('yatra_entry_meta')) {

    function yatra_entry_meta()
    {
        ?>
        <div class="entry-meta">
            <?php yatra_posted_by(); ?>
            <?php yatra_posted_on(); ?>
            <?php
            // Edit post link.
            edit_post_link(
                sprintf(
                    wp_kses(
                    /* translators: %s: Name of current post. Only visible to screen readers. */
                        __('Edit <span class="screen-reader-text">%s</span>', 'yatra'),
                        array(
                            'span' => array(
                                'class' => array(),
                            ),
                        )
                    ),
                    get_the_title()
                ),
                '<span class="edit-link">',
                '</span>'
            );
            ?>
        </div><!-- .meta-info -->
        <?php
    }

}


/**
 * Get permalink settings
 *
 * @since  1.0.0
 * @return array
 */
function yatra_get_permalink_structure()
{

    $permalinks = wp_parse_args(
        (array)get_option('yatra_permalinks', array()),
        array(
            'yatra_tour_base' => '',
            'yatra_destination_base' => '',
            'yatra_activity_base' => '',
        )
    );

    // Ensure rewrite slugs are set.
    $permalinks['yatra_tour_base'] = untrailingslashit(empty($permalinks['yatra_tour_base']) ? 'tour' : $permalinks['yatra_tour_base']);
    $permalinks['yatra_destination_base'] = untrailingslashit(empty($permalinks['yatra_destination_base']) ? 'destination' : $permalinks['yatra_destination_base']);
    $permalinks['yatra_activity_base'] = untrailingslashit(empty($permalinks['yatra_activity_base']) ? 'activity' : $permalinks['yatra_activity_base']);
    return $permalinks;
}