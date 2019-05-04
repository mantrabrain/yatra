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
            if (get_post_type() == 'tour') {
                if (is_single()) {
                    if ($theme_file = locate_template(array('single-tour.php'))) {
                        $template_path = $theme_file;
                    } else {
                        $template_path = YATRA_ABSPATH . 'includes/templates/single-tour.php';
                    }
                }
                if (is_archive()) {

                    if ($theme_file = locate_template(array('archive-tour.php'))) {
                        $template_path = $theme_file;
                    } else {
                        $template_path = YATRA_ABSPATH . 'includes/templates/archive-tour.php';
                    }
                }
                if (is_tax('destination')) {
                    if ($theme_file = locate_template(array('taxonomy-destination.php'))) {
                        $template_path = $theme_file;
                    } else {
                        $template_path = YATRA_ABSPATH . 'includes/templates/taxonomy-destination.php';
                    }
                }
                if (is_tax('activities')) {
                    if ($theme_file = locate_template(array('taxonomy-activities.php'))) {
                        $template_path = $theme_file;
                    } else {
                        $template_path = YATRA_ABSPATH . 'includes/templates/taxonomy-activities.php';
                    }
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