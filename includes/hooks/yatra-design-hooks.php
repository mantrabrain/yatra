<?php

class Yatra_Design_Hooks
{
    public function __construct()
    {
        add_action('wp_head', array($this, 'dynamic_css'), 10);
    }

    public function hex2rgba($color, $opacity = false)
    {

        $default = 'rgb(0,0,0)';

        //Return default if no color provided
        if (empty($color))
            return $default;

        //Sanitize $color if "#" is provided
        if ($color[0] == '#') {
            $color = substr($color, 1);
        }

        //Check if color has 6 or 3 characters and get values
        if (strlen($color) == 6) {
            $hex = array($color[0] . $color[1], $color[2] . $color[3], $color[4] . $color[5]);
        } elseif (strlen($color) == 3) {
            $hex = array($color[0] . $color[0], $color[1] . $color[1], $color[2] . $color[2]);
        } else {
            return $default;
        }

        //Convert hexadec to rgb
        $rgb = array_map('hexdec', $hex);

        //Check if opacity is set(rgba or rgb)
        if ($opacity) {
            if (abs($opacity) > 1)
                $opacity = 1.0;
            $output = 'rgba(' . implode(",", $rgb) . ',' . $opacity . ')';
        } else {
            $output = 'rgb(' . implode(",", $rgb) . ')';
        }

        //Return rgb(a) color string
        return $output;
    }

    public function minify_css($css = '')
    {

        // Return if no CSS
        if (!$css) return;

        // Normalize whitespace
        $css = preg_replace('/\s+/', ' ', $css);

        // Remove ; before }
        $css = preg_replace('/;(?=\s*})/', '', $css);

        // Remove space after , : ; { } */ >
        $css = preg_replace('/(,|:|;|\{|}|\*\/|>) /', '$1', $css);

        // Remove space before , ; { }
        $css = preg_replace('/ (,|;|\{|})/', '$1', $css);

        // Strips leading 0 on decimal values (converts 0.5px into .5px)
        $css = preg_replace('/(:| )0\.([0-9]+)(%|em|ex|px|in|cm|mm|pt|pc)/i', '${1}.${2}${3}', $css);

        // Strips units if value is 0 (converts 0px to 0)
        $css = preg_replace('/(:| )(\.?)0(%|em|ex|px|in|cm|mm|pt|pc)/i', '${1}0', $css);

        // Trim
        $css = trim($css);

        // Return minified CSS
        return $css;

    }

    public function dynamic_css()
    {

        $all_dynamic_css = '';

        $all_dynamic_css .= $this->primary_color();
        $all_dynamic_css .= $this->availability_color();

        if ($all_dynamic_css != '') {

            $all_dynamic_css = $this->minify_css($all_dynamic_css);

            ?>

            <style type="text/css" class="yatra-dynamic-css">

                <?php echo $all_dynamic_css ; ?>

            </style>

            <?php
        }
    }

    private function primary_color()
    {


        $primary_color = esc_attr(get_option('yatra_design_primary_color', '#1abc9c'));

        if ($primary_color == '#1abc9c' || is_null($primary_color) || '' === $primary_color) {

            return '';
        }
        ob_start();
        ?>
        :root {
        --yatra_primary_color: <?php echo esc_attr($primary_color); ?>;
        --yatra_primary_color_opacity: <?php echo esc_attr($this->hex2rgba($primary_color, 0.06)) ?>;
        }
        <?php
        return ob_get_clean();
    }

    public function availability_color()
    {
        if (!is_singular('tour')) {
            return '';
        }
        $booking = esc_attr(get_option('yatra_available_for_booking_color', '#2f582b'));
        $enquiry = esc_attr(get_option('yatra_available_for_enquiry_only_color', '#008bb5'));
        $not_available = esc_attr(get_option('yatra_not_available_for_booking_enquiry_color', '#aaa'));
        ob_start();
        if ($booking != '#2f582b' && !is_null($booking) && '' !== $booking) {

            ?>
            .yatra-tour-booking-form-section .yatra-calendar-booking-indicator-lists li.booking:before,
            .yatra-calendar-date-listing ul.yatra-calendar-listing li span.yatra-availability-booking:after{
            background-color: <?php echo $booking; ?>;
            }
            .day.yatra-availability-booking,
            .yatra-calendar-date-listing ul.yatra-calendar-listing li span.yatra-availability-booking{
            border-bottom-color: <?php echo $booking; ?>!important;
            }
            <?php
        }
        if ($enquiry != '#2f582b' && !is_null($enquiry) && '' !== $enquiry) {

            ?>
            .yatra-tour-booking-form-section .yatra-calendar-booking-indicator-lists li.enquery:before,
            .yatra-calendar-date-listing ul.yatra-calendar-listing li span.yatra-availability-enquiry:after{
            background-color: <?php echo $enquiry; ?>;
            }
            .day.yatra-availability-enquiry,
            .yatra-calendar-date-listing ul.yatra-calendar-listing li span.yatra-availability-enquiry{
            border-bottom-color: <?php echo $enquiry; ?>!important;
            }
            <?php
        }
        if ($not_available != '#aaa' && !is_null($not_available) && '' !== $not_available) {

            ?>
            .yatra-tour-booking-form-section .yatra-calendar-booking-indicator-lists li.not-available:before,
            .yatra-calendar-date-listing ul.yatra-calendar-listing li span.yatra-availability-none:after{
            background-color: <?php echo $not_available; ?>;
            }
            .day.yatra-availability-none,
            .yatra-calendar-date-listing ul.yatra-calendar-listing li span.yatra-availability-none{
            border-bottom-color: <?php echo $not_available; ?>!important;
            }
            <?php
        }
        return ob_get_clean();
    }
}

new Yatra_Design_Hooks ();
