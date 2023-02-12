<?php

namespace Yatra\Core\Admin\Emails;

class EmailTemplates
{

    public static function get_header()
    {
        yatra_get_template('emails/header.php');

    }

    public static function get_footer()
    {
        yatra_get_template('emails/footer.php');
    }

    public static function get_content($args = [], $type = 'booking')
    {
        ob_start();

        switch ($type) {
            case "booking":
                yatra_get_template('emails/booking/notification.php', $args);
                break;
            case "enquiry":
                yatra_get_template('emails/enquiry/enquiry.php', $args);
                break;
        }
        return ob_get_clean();

    }

    public static function get_template($content)
    {
        ob_start();

        self::get_header();

        echo $content;

        self::get_footer();

        return ob_get_clean();

    }
}