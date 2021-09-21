<?php


class Yatra_Widgets
{
    public function __construct()
    {
        $this->includes();
        add_action('widgets_init', array($this, 'init_widgets'));


    }

    function init_widgets()
    {
        register_widget('Yatra_Activity_Widget');
        register_widget('Yatra_Destination_Widget');
        register_widget('Yatra_Discount_Deals_Widget');
        register_widget('Yatra_Tour_Widget');


    }


    public function includes()
    {
        require YATRA_ABSPATH . 'includes/widgets/class-yatra-activity-widget.php';
        require YATRA_ABSPATH . 'includes/widgets/class-yatra-destination-widget.php';
        require YATRA_ABSPATH . 'includes/widgets/class-yatra-discount-deals-widget.php';
        require YATRA_ABSPATH . 'includes/widgets/class-yatra-tour-widget.php';


    }

}

new Yatra_Widgets();