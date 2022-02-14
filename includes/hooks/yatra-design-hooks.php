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

        if ($primary_color == '#1abc9c') {

            return '';
        }
        ob_start();
        ?>
        .yatra-tour-additional-info .yatra-tour-additional-info-item .icon-wrap,
        .yatra-tour-attribute-info .yatra-tour-additional-text-number .yatra-attribute-item .attribute-icon,
        .yatra-tabs > ul li a[data-aria-selected], .yatra-tabs > ul li a:hover, .yatra-tabs > ul li.active a, .yatra-tabs > ul li.active:hover a, .yatra-tabs > ul li a:hover,
        .yatra-tour-info-pricing-wrap .tour-info-pricing-content p,
        .yatra-tour-filter-sidebar .yatra-tour-filter-sidebar-inner .yatra-sidebar-filter-field ul.yatra-terms-list li span.show-more, .yatra-tour-filter-sidebar .yatra-tour-filter-sidebar-inner .yatra-sidebar-filter-field ul.yatra-terms-list li span.show-less,
        .yatra-tabs .yatra-tab-content .cost-info-half h4{
            color: <?php echo $primary_color; ?>;
        }
        .yatra-tour-filter-sidebar .yatra-tour-filter-sidebar-inner .yatra-sidebar-filter-field.price .yatra-slider-wrap .ui-slider .ui-slider-handle, .yatra-tour-filter-sidebar .yatra-tour-filter-sidebar-inner .yatra-sidebar-filter-field.days .yatra-slider-wrap .ui-slider .ui-slider-handle,
        .yatra-tour-filter-sidebar .yatra-tour-filter-sidebar-inner .yatra-sidebar-filter-field.price .yatra-slider-wrap .ui-slider .ui-slider-handle:before, .yatra-tour-filter-sidebar .yatra-tour-filter-sidebar-inner .yatra-sidebar-filter-field.days .yatra-slider-wrap .ui-slider .ui-slider-handle:before,
        .yatra-tour-filter-sidebar .yatra-tour-filter-sidebar-inner .yatra-sidebar-filter-field.price #yatra-price-slider .ui-slider-range, .yatra-tour-filter-sidebar .yatra-tour-filter-sidebar-inner .yatra-sidebar-filter-field.price #yatra-days-slider .ui-slider-range, .yatra-tour-filter-sidebar .yatra-tour-filter-sidebar-inner .yatra-sidebar-filter-field.days #yatra-price-slider .ui-slider-range, .yatra-tour-filter-sidebar .yatra-tour-filter-sidebar-inner .yatra-sidebar-filter-field.days #yatra-days-slider .ui-slider-range,
        .yatra-page-wrapper.yatra-tour-archive-display-mode-list .yatra-archive-tour .yatra-tour-single-item span.yatra-featured-tour,
        .yatra-page-wrapper.yatra-tour-archive-display-mode-grid .yatra-tour-single-item .yatra-tour-single-item-inner span.yatra-featured-tour{
            background:<?php echo $primary_color; ?>;
        }
        .yatra-tabs > ul,
        .yatra-calendar thead td, .yatra-calendar thead th,
        .yatra-tour-info-pricing-wrap .tour-info-pricing-header,
        .yatra-calendar td.active
        {
            background:<?php echo $this->hex2rgba($primary_color, 0.06) ?>;
        }
        .yatra-tour-info-pricing-wrap,
        .yatra-tour-filter-sidebar .yatra-tour-filter-sidebar-inner .yatra-sidebar-filter-field.price .yatra-slider-wrap .ui-slider .ui-slider-handle:after, .yatra-tour-filter-sidebar .yatra-tour-filter-sidebar-inner .yatra-sidebar-filter-field.days .yatra-slider-wrap .ui-slider .ui-slider-handle:after{
            border-top-color:<?php echo $primary_color; ?>;
        }
        .yatra-tabs .yatra-tab-content .cost-info-half h4{
            border-bottom-color:<?php echo $primary_color; ?>;

        }
        .yatra-destination-wrap .yatra-destination-item .yatra-item-inner:hover h2.destination-title,
        .yatra-activity-wrap .yatra-activity-item .yatra-item-inner:hover h2.activity-title{
            background: linear-gradient(to bottom, rgba(0, 0, 0, 0) 0%, <?php echo $primary_color; ?> 100%)
        }
        <?php
        return ob_get_clean();
    }
}

new Yatra_Design_Hooks ();
