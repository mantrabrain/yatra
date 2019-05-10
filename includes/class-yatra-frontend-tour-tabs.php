<?php
defined('ABSPATH') || exit;
if (!class_exists('Yatra_Frontend_Tour_Tabs')) {

    class Yatra_Frontend_Tour_Tabs
    {

        public function __construct()
        {
            $yatra_frontend_tabs_config = yatra_frontend_tabs_config();

            foreach ($yatra_frontend_tabs_config as $config_key => $config_value) {

                $hook = 'yatra_frontend_tab_content_' . $config_key;

                $action = apply_filters('yatra_frontend_tab_content_callback', array($this, $config_key));

                add_action($hook, $action);
            }
        }

        public function overview($title)
        {

            $overview = yatra_entry_meta_for_frontend_single_tab('overview');

            yatra_get_template('tabs/tmpl-tab-overview.php',
                array(
                    'overview' => $overview,
                    'title' => $title
                )
            );

            the_content();

        }

        public function itinerary($title)
        {
            $itinerary = yatra_entry_meta_for_frontend_single_tab('itinerary');

            yatra_get_template('tabs/tmpl-tab-itinerary.php',
                array(
                    'itinerary' => $itinerary,
                    'title' => $title
                )
            );
        }

        public function cost_info($title)
        {
            $cost_info = yatra_entry_meta_for_frontend_single_tab('cost_info');

            yatra_get_template('tabs/tmpl-tab-cost-info.php',
                array(
                    'cost_info' => $cost_info,
                    'title' => $title
                )
            );
        }

        public function tour_facts($title)
        {

            $tour_facts = yatra_entry_meta_for_frontend_single_tab('tour_facts');

            yatra_get_template('tabs/tmpl-tab-tour-facts.php',
                array(
                    'tour_facts' => $tour_facts,
                    'title' => $title
                )
            );
        }
    }

    return new Yatra_Frontend_Tour_Tabs();
}