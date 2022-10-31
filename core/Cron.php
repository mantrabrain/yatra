<?php

namespace Yatra\Core;

class Cron
{

    /**
     * Init WordPress hook
     *
     * @since 2.1.12
     * @see Cron::weekly_events()
     */
    public static function init()
    {
        $self = new self;
        add_filter('cron_schedules', array($self, 'add_schedules'));
        add_action('wp', array($self, 'schedule_events'));
    }

    /**
     * Registers new cron schedules
     *
     * @param array $schedules
     * @return array
     * @since 2.1.12
     *
     */
    public function add_schedules($schedules = array())
    {
        /*Adds once weekly to the existing schedules*/
        $schedules['weekly'] = array(
            'interval' => 604800,
            'display' => __('Once Weekly', 'yatra'),
        );

        return $schedules;
    }

    /**
     * Schedules our events
     *
     * @return void
     * @since 2.1.12
     */
    public function schedule_events()
    {
        $this->weekly_events();
        $this->daily_events();
    }

    /**
     * Schedule weekly events
     *
     * @access private
     * @return void
     * @since 2.1.12
     */
    private function weekly_events()
    {
        if (!wp_next_scheduled('yatra_weekly_scheduled_events')) {
            wp_schedule_event(time(), 'weekly', 'yatra_weekly_scheduled_events');
        }
    }

    /**
     * Schedule daily events
     *
     * @access private
     * @return void
     * @since 2.1.12
     */
    private function daily_events()
    {
        if (!wp_next_scheduled('yatra_daily_scheduled_events')) {
            wp_schedule_event(time(), 'daily', 'yatra_daily_scheduled_events');
        }
    }

}
