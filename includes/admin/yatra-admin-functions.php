<?php


if (!function_exists('yatra_load_admin_template')) {

    function yatra_load_admin_template($template = null, $variables = array(), $include_once = false)
    {
        $variables = (array)$variables;

        $variables = apply_filters('yatra_load_admin_template_variables', $variables);

        extract($variables);

        $isLoad = apply_filters('should_yatra_load_admin_template', true, $template, $variables);

        if (!$isLoad) {

            return;
        }

        do_action('yatra_load_admin_template_before', $template, $variables);

        if ($include_once) {

            include_once yatra_get_admin_template($template);

        } else {

            include yatra_get_admin_template($template);
        }
        do_action('yatra_load_admin_template_after', $template, $variables);
    }
}

if (!function_exists('yatra_get_admin_template')) {

    function yatra_get_admin_template($template = null)
    {
        if (!$template) {
            return false;
        }
        $template = str_replace('.', DIRECTORY_SEPARATOR, $template);

        $template_location = YATRA_ABSPATH . "includes/admin/templates/{$template}.php";

        if (!file_exists($template_location)) {

            echo '<div class="yatra-notice-warning"> ' . __(sprintf('The file you are trying to load is not exists in your theme or yatra plugins location, if you are a developer and extending yatra plugin, please create a php file at location %s ', "<code>{$template_location}</code>"), 'yatra') . ' </div>';
        }


        return apply_filters('yatra_get_admin_template_path', $template_location, $template);
    }
}
