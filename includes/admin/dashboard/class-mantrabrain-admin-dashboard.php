<?php
/**
 * MantraBrain
 *
 * @package WordPress
 * @subpackage Mantrabrain Starter Sites
 * @author Mantrabrain <mantrabrain.com>
 *
 * This source file is subject to the GNU GENERAL PUBLIC LICENSE (GPL 3.0)
 * that is bundled with this package in the file LICENSE.txt.
 * It is also available through the world-wide-web at this URL:
 * http://www.gnu.org/licenses/gpl-3.0.txt
 */

if (!class_exists('Mantrabrain_Admin_Dashboard')) {
    /**
     * Wordpress Admin Dashboard Management
     *
     * @since 1.0.0
     */
    class Mantrabrain_Admin_Dashboard
    {
        /**
         * Products URL
         *
         * @var string
         * @access protected
         * @since 1.0.0
         */
        static protected $_products_feed = 'https://mantrabrain.com/latest-updates/feeds/';

        static protected $_blog_feed = 'https://mantrabrain.com/blog/feed/';

        static protected $_themes_url = 'https://mantrabrain.com/wordpress-themes/?utm_source=dashboard&utm_medium=widget&utm_campaign=userdashboard';

        static protected $_blog_url = 'https://mantrabrain.com/blog/?utm_source=dashboard&utm_medium=widget&utm_campaign=userdashboard';

        static protected $_main_site = 'https://mantrabrain.com/?utm_source=dashboard&utm_medium=widget&utm_campaign=userdashboard';

        /**
         * Dashboard widget setup
         *
         * @return void
         * @since 1.0.0
         * @access public
         */
        public static function dashboard_widget_setup()
        {
            $widget_key = 'mantrabrain_dashboard_blog_news';

            wp_add_dashboard_widget('mantrabrain_dashboard_blog_news', __('Latest News From MantraBrain Blog', 'yatra'), 'Mantrabrain_Admin_Dashboard::dashboard_blog_news');

            global $wp_meta_boxes;

            // Make to top
            $normal_dashboard = $wp_meta_boxes['dashboard']['normal']['core'];
            $widget_instance = array($widget_key => $normal_dashboard[$widget_key]);
            unset($normal_dashboard[$widget_key]);
            $sorted_dashboard = \array_merge($widget_instance, $normal_dashboard);

            $wp_meta_boxes['dashboard']['normal']['core'] = $sorted_dashboard;
        }

        /**
         * Blog news Widget
         *
         * @return void
         * @since 1.0.0
         * @access public
         */
        public static function dashboard_blog_news()
        {
            $args = array('show_author' => 0, 'show_date' => 1, 'show_summary' => 0, 'items' => 10);
            $feed = static::$_blog_feed;
            wp_widget_rss_output($feed, $args);
            $urls = array(
                'theme_url' => array(
                    'text' => __('New Themes', 'yatra'),
                    'url' => static::$_themes_url,
                    'screen_reader_text' => __('opens in a new tab', 'yatra'),
                    'icon' => 'dashicons dashicons-external'
                ),
                'blog_url' => array(
                    'text' => __('Blog Posts', 'yatra'),
                    'url' => static::$_blog_url,
                    'screen_reader_text' => __('opens in a new tab', 'yatra'),
                    'icon' => 'dashicons dashicons-external'
                ), 'main_site_url' => array(
                    'text' => __('Main Site', 'yatra'),
                    'url' => static::$_main_site,
                    'screen_reader_text' => __('opens in a new tab', 'yatra'),
                    'icon' => 'dashicons dashicons-external'
                )
            );

            echo '<p class="community-events-footer">';

            $total_url_count = count($urls);

            $url_index = 0;

            foreach ($urls as $url_content) {

                $url_index++;

                echo '<a href="' . $url_content['url'] . '" target="_blank">';

                echo esc_html($url_content['text']);

                echo '<span class="screen-reader-text">(' . esc_html($url_content['screen_reader_text']) . ')</span> <span aria-hidden="true" class="' . esc_attr($url_content['icon']) . '"></span>';

                echo '</a>';


                echo $url_index != $total_url_count ? ' | ' : '';
            }
            echo '</p>';

        }

    }

    if (apply_filters('mantrabrain_show_dashboard_widgets', true)) {

        add_action('wp_dashboard_setup', 'Mantrabrain_Admin_Dashboard::dashboard_widget_setup');
    }
}

