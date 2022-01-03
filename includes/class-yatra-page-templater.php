<?php
if (!class_exists('Yatra_Page_Templater')) {
    class Yatra_Page_Templater
    {
        /**
         * A reference to an instance of this class.
         */
        private static $instance;


        /**
         * Returns an instance of this class.
         */
        public static function get_instance()
        {
            if (null == self::$instance) {
                self::$instance = new self();
            }
            return self::$instance;
        }

        /**
         * Initializes the plugin by setting filters and administration functions.
         */
        private function __construct()
        {
            add_filter('template_include', array($this, 'page_template'));


        }

        function page_template($template_path)
        {
            $yatra_template_path = yatra()->template_path();

            $yatra_plugin_template_path = yatra()->plugin_template_path();

            $yatra_template_file = '';

            if (is_post_type_archive('tour')) {

                $yatra_template_file = 'archive-tour.php';

            }
            if (yatra_is_search_page()) {

                $yatra_template_file = 'search-tour.php';
            }
            if (is_singular('tour')) {

                $yatra_template_file = 'single-tour.php';

            }
            if (is_tax('destination')) {

                $yatra_template_file = 'taxonomy-destination.php';

            }
            if (is_tax('activity')) {

                $yatra_template_file = 'taxonomy-activity.php';

            }

            if ('' != $yatra_template_file && !is_null($yatra_template_file)) {

                if ($theme_file = locate_template(array("{$yatra_template_path}{$yatra_template_file}"))) {
                    $template_path = $theme_file;
                } else {
                    $template_path = "{$yatra_plugin_template_path}{$yatra_template_file}";
                }
            }


            return $template_path;
        }

        public function is_template($template_path)
        {

            //Get template name
            $template = basename($template_path);

            //Check if template is taxonomy-event-venue.php
            //Check if template is taxonomy-event-venue-{term-slug}.php
            if (1 == preg_match('/^taxonomy-destination((-(\S*))?).php/', $template))
                return true;

            return false;
        }
    }

}
return Yatra_Page_Templater::get_instance();
