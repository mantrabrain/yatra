<?php
include_once YATRA_ABSPATH . 'includes/hooks/yatra-template-hooks.php';

if (!function_exists('yatra_checkout_form_fields')) {

    function yatra_checkout_form_fields()
    {
        if (!yatra_enable_guest_checkout()) {

            if (!is_user_logged_in()) {

                yatra_get_template('myaccount/tmpl-form-login.php', array());

                echo '<h2>OR</h2>';

                yatra_get_template('myaccount/tmpl-form-registration.php', array());

            } else {

                echo '<h2>You are already loged in, please proceed to checkout.</h2>';

            }

        } else {

            Yatra_Checkout_Form::get_instance()->tour_checkout_form();
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
        <main id="main" class="site-main yatra-site-main">

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

        ?><section id="primary" class="content-area yatra-content-area <?php echo esc_attr($class); ?>">
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

function yatra_book_now_button()
{ ?>
    <div class="yatra-book-btn-wrapper book-btn">
        <?php $book_now_text = get_option('yatra_booknow_button_text', __('Book now', 'yatra')); ?>
        <button type="submit" class="btn primary-btn yatra-book-now-btn"
                data-text="<?php echo esc_attr($book_now_text); ?>"
                data-loading-text="<?php echo esc_attr(get_option('yatra_booknow_loading_text', __('Loading....', 'yatra'))) ?>"
                data-tour-id="<?php the_ID(); ?>"><?php echo esc_html($book_now_text); ?></button>
    </div>
    <?php
}

if (!function_exists('yatra_before_page_content_callback')) {
    function yatra_before_page_content_callback()
    {
        $class = apply_filters('yatra_page_wrapper_class', 'yatra-page-wrapper');

        $class = $class . ' ' . get_option('yatra_page_container_class');

        if (!is_single()) {
            $class = $class . ' ' . get_option('yatra_archive_template', 'template-default');
        }
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