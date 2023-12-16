<?php

include_once YATRA_ABSPATH . 'includes/hooks/yatra-template-hooks.php';
include_once YATRA_ABSPATH . 'includes/hooks/yatra-list-table-hooks.php';
include_once YATRA_ABSPATH . 'includes/hooks/yatra-log-handler-hooks.php';

if (!function_exists('yatra_checkout_login_register_fields')) {

    function yatra_checkout_login_register_fields()
    {

        if (is_user_logged_in()) {
            return;
        }

        if (!yatra_enable_guest_checkout()) {

            echo '<div class="yatra-checkout-login-registration-wrap yatra-row">';

            echo '<div class="yatra-col-md-6 yatra-col-xs-12 yatra-checkout-login-wrap">';

            yatra_get_template('myaccount/tmpl-form-login.php', array());

            echo '</div>';

            echo '<div class="yatra-col-md-6 yatra-col-xs-12 yatra-checkout-registration-wrap">';

            yatra_get_template('myaccount/tmpl-form-registration.php', array());

            echo '</div>';

            echo '</div>';
        }


    }

    add_action('yatra_checkout_before_form', 'yatra_checkout_login_register_fields', 17);
}

if (!function_exists('yatra_checkout_form_fields')) {

    function yatra_checkout_form_fields()
    {
        if (!is_user_logged_in() && yatra_enable_guest_checkout()) {

            Yatra_Checkout_Form::get_instance()->render();

        }
    }

    add_action('yatra_checkout_form_fields', 'yatra_checkout_form_fields', 10);
}

if (!function_exists('yatra_registration_form_fields')) {

    function yatra_registration_form_fields()
    {
        Yatra_Create_Account_Form::get_instance()->render();

    }
}
if (!function_exists('yatra_main_content_callback')) {
    function yatra_main_content_callback()
    {
        $main_class = 'yatra-site-main yatra-row';

        if (yatra_is_archive_page() && apply_filters('yatra_tour_archive_page_header', true)) {
            ?>
            <header class="yatra-page-header">
                <?php
                the_archive_title('<h1 class="yatra-page-title">', '</h1>');
                the_archive_description();
                ?>
            </header><!-- .page-header -->

            <?php

        }
        ?>
        <main id="yatra-main" class="<?php echo esc_attr($main_class); ?>">
            <?php
            Yatra_Content_Loop::loop();
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

$class .= yatra_is_archive_page() ? 'yatra-archive-tour' : '';

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


if (!function_exists('yatra_enquiry_form_fields')) {

    function yatra_enquiry_form_fields()
    {

        Yatra_Enquiry_Form::get_instance()->render();
    }

}

function yatra_book_now_button($availability, $selected_date)
{
    do_action('yatra_before_booking_button', $availability);

    $selected_date = yatra_format_date(strtotime($selected_date));

    if ($availability == "booking") {

        $book_now_text = get_option('yatra_booknow_button_text', __('Book now', 'yatra'));

        $book_now_text = str_replace('{selected_date}', $selected_date, $book_now_text);

        yatra_get_template('tour/book-now-button.php', array(

                'selected_date' => $selected_date,

                'book_now_text' => $book_now_text
            )
        );
    } else if ($availability == "enquiry") {

        $enquiry_button_text = get_option('yatra_enquiry_button_text', __('Send Enquiry', 'yatra'));

        yatra_get_template('tour/enquiry-button.php', array('selected_date' => $selected_date, 'enquiry_button_text'=>$enquiry_button_text));
    }

    do_action('yatra_after_booking_button', $availability);


}

if (!function_exists('yatra_before_page_content_callback')) {
function yatra_before_page_content_callback()
{

?>
<div id="yatra-page-wrapper" class="<?php echo esc_attr(yatra_get_page_wrapper_class()); ?>">
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
