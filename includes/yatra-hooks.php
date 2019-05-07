<?php

if (!function_exists('yatra_checkout_form_fields')) {
    function yatra_checkout_form_fields()
    {
        Yatra_Forms::get_instance()->tour_checkout_form();
    }

    add_action('yatra_checkout_form_fields', 'yatra_checkout_form_fields');
}


if (!function_exists('register_yatra_session')) {
    function register_yatra_session()
    {
        if (!session_id()) {
            session_start();
        }
    }

    add_action('init', 'register_yatra_session');
}

?>