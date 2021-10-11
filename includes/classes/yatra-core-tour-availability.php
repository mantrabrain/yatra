<?php

class Yatra_Core_Tour_Availability
{
    public function __construct()
    {

        add_action('yatra_availability_page_output', array($this, 'output'));

        add_action('admin_enqueue_scripts', array($this, 'load_admin_scripts'), 11);

    }

    public function load_admin_scripts()
    {
        $screen = get_current_screen();

        $screen_id = isset($screen->id) ? $screen->id : '';

        if ($screen_id != 'tour_page_yatra-availability') {
            return;
        }
        wp_enqueue_style('yatra-availability-style', YATRA_PLUGIN_URI . '/assets/admin/css/availability.css', array(
            'yatra-fullcalendar-css'
        ), YATRA_VERSION);
        wp_enqueue_script('yatra-availability-script', YATRA_PLUGIN_URI . '/assets/admin/js/availability.js', array('yatra-fullcalendar-js'), YATRA_VERSION);

    }

    public function output()
    {


        echo '<br/>';

        echo '<br/>';

        $this->calendar();
    }

    private function calendar()
    {
        echo '<div  id="yatra-availability-calendar">';


        echo '</div>';

    }
}

new Yatra_Core_Tour_Availability();