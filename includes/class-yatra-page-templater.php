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
            if (is_embed()) {
                return $template_path;
            }


            $yatra_template_path = yatra()->template_path();

            $yatra_plugin_template_path = yatra()->plugin_template_path();

            $yatra_template_file = '';

            if (is_post_type_archive('tour') && !self::has_block_template('archive-tour')) {

                $yatra_template_file = 'archive-tour.php';

            }
            if (yatra_is_search_page()) {

                $yatra_template_file = 'search-tour.php';
            }
            if (is_singular('tour') && !self::has_block_template('single-tour')) {

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

        public static function has_block_template($template_name)
        {
            if (!$template_name) {
                return false;
            }

            $has_template = false;
            $template_filename = $template_name . '.html';
            // Since Gutenberg 12.1.0, the conventions for block templates directories have changed,
            // we should check both these possible directories for backwards-compatibility.
            $possible_templates_dirs = array('templates', 'block-templates');

            // Combine the possible root directory names with either the template directory
            // or the stylesheet directory for child themes, getting all possible block templates
            // locations combinations.
            $filepath = DIRECTORY_SEPARATOR . 'templates' . DIRECTORY_SEPARATOR . $template_filename;
            $legacy_filepath = DIRECTORY_SEPARATOR . 'block-templates' . DIRECTORY_SEPARATOR . $template_filename;
            $possible_paths = array(
                get_stylesheet_directory() . $filepath,
                get_stylesheet_directory() . $legacy_filepath,
                get_template_directory() . $filepath,
                get_template_directory() . $legacy_filepath,
            );

            // Check the first matching one.
            foreach ($possible_paths as $path) {
                if (is_readable($path)) {
                    $has_template = true;
                    break;
                }
            }

            /**
             * Filters the value of the result of the block template check.
             *
             * @param boolean $has_template value to be filtered.
             * @param string $template_name The name of the template.
             * @since x.x.x
             *
             */
            return (bool)apply_filters('yatra_has_block_template', $has_template, $template_name);
        }
    }

}
return Yatra_Page_Templater::get_instance();
