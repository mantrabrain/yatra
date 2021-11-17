<?php

include_once YATRA_ABSPATH . 'includes/hooks/yatra-template-hooks.php';
include_once YATRA_ABSPATH . 'includes/hooks/yatra-list-table-hooks.php';
include_once YATRA_ABSPATH . 'includes/hooks/yatra-log-handler-hooks.php';

if (!function_exists('yatra_checkout_form_fields')) {

    function yatra_checkout_form_fields()
    {

        if (is_user_logged_in()) {

            echo '<h2>You are already logged in, please proceed to checkout.</h2>';

        } else {

            if (!yatra_enable_guest_checkout()) {

                yatra_get_template('myaccount/tmpl-form-login.php', array());

                echo '<h2>OR</h2>';

                yatra_get_template('myaccount/tmpl-form-registration.php', array());

            } else {

                Yatra_Checkout_Form::get_instance()->tour_checkout_form();
            }
        }
    }

    add_action('yatra_checkout_form_fields', 'yatra_checkout_form_fields');
}

if (!function_exists('yatra_registration_form_fields')) {

    function yatra_registration_form_fields()
    {
        Yatra_Checkout_Form::get_instance()->create_account_checkout_form_fields();

    }
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

if (!function_exists('yatra_main_content_callback')) {
    function yatra_main_content_callback()
    {
        ?>
        <main id="yatra-main" class="site-main yatra-site-main">

            <?php

            do_action('yatra_before_main_content_loop');

            Yatra_Content_Loop::loop();

            do_action('yatra_after_main_content_loop');

            ?>
        </main><!-- #main -->
        <?php
    }

    add_action('yatra_main_content', 'yatra_main_content_callback');
}


if (!function_exists('yatra_before_main_content_callback')) {

function yatra_before_main_content_callback()
{
$class = '';

$class .= is_post_type_archive('tour') ? 'yatra-archive-tour' : '';

$class .= is_singular('tour') ? 'yatra-single-tour' : '';

?>
<section class="yatra-content-area <?php echo esc_attr($class); ?>">
    <?php
    }

    add_action('yatra_before_main_content', 'yatra_before_main_content_callback');
    }

    if (!function_exists('yatra_after_main_content_callback')) {
    function yatra_after_main_content_callback()
    {
    ?></section>
<?php
}

add_action('yatra_after_main_content', 'yatra_after_main_content_callback');
}

if (!function_exists('yatra_after_main_content_loop_callback')) {
    function yatra_after_main_content_loop_callback()
    {
        if (!is_single()) {
            return;
        }

    }

    add_action('yatra_after_main_content_loop', 'yatra_after_main_content_loop_callback');
}

if (!function_exists('yatra_enquiry_form_fields')) {

    function yatra_enquiry_form_fields()
    {

        Yatra_Enquiry_Form::get_instance()->get_form();
    }

    add_action('yatra_checkout_form_fields', 'yatra_checkout_form_fields');
}

function yatra_book_now_button($availability)
{
    do_action('yatra_before_booking_button', $availability);

    if ($availability == "booking") {
        yatra_get_template('tour/book-now-button.php');
    } else if ($availability == "enquiry") {
        yatra_get_template('tour/enquiry-button.php');
    }

    do_action('yatra_after_booking_button', $availability);


}

if (!function_exists('yatra_before_page_content_callback')) {
function yatra_before_page_content_callback()
{
$class = 'yatra-page-wrapper';

$class = $class . ' ' . get_option('yatra_page_container_class');

if (!is_single()) {
    $class = $class . ' ' . get_option('yatra_archive_template', 'template-default');
}

$class = apply_filters('yatra_page_wrapper_class', $class);

?>
<div id="yatra-page-wrapper" class="<?php echo esc_attr($class); ?>">
    <?php
    }

    add_action('yatra_before_page_content', 'yatra_before_page_content_callback');
    }

    if (!function_exists('yatra_after_page_content_callback')) {
    function yatra_after_page_content_callback()
    {
    ?>
</div>
<?php
}

add_action('yatra_after_page_content', 'yatra_after_page_content_callback');
}


?>
