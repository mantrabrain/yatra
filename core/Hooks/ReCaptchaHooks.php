<?php

namespace Yatra\Core\Hooks;
class ReCaptchaHooks
{

    public static function init()
    {
        $self = new self;

        add_filter('yatra_after_enquiry_form_fields', array($self, 'enquiry_recaptcha'));
        add_filter('yatra_enquiry_response_before_saved', array($self, 'enquiry_validate_captcha'));


        add_filter('yatra_checkout_after_form_fields', array($self, 'booking_recaptcha'));
        add_filter('yatra_before_booking_process', array($self, 'booking_validate_captcha'));

    }

    public function enquiry_recaptcha()
    {
        if (get_option('yatra_integration_captcha_on_enquiry_form', 'no') === 'yes') {

            $this->recaptcha();
        }
    }

    public function enquiry_validate_captcha($valid_data)
    {
        if (get_option('yatra_integration_captcha_on_enquiry_form', 'no') === 'yes') {

            $this->validate_captcha();
        }
    }

    public function booking_recaptcha()
    {
        if (get_option('yatra_integration_captcha_on_booking_form', 'no') === 'yes') {
            $this->recaptcha();
        }
    }

    public function booking_validate_captcha()
    {
        if (get_option('yatra_integration_captcha_on_booking_form', 'no') === 'yes') {
            $this->validate_captcha();
        }
    }

    public function recaptcha()
    {

        wp_enqueue_script('yatra-recaptcha');

        $site_key = get_option('yatra_integration_captcha_site_key', '');

        $recaptcha_inline = 'var YatraRecaptcha = function(){grecaptcha.execute("' . esc_html($site_key) . '",{action:"yatra"}).then(function(token){var f=document.getElementsByName("yatra_recaptcha");for(var i=0;i<f.length;i++){f[i].value = token;}});};grecaptcha.ready(YatraRecaptcha);setInterval(YatraRecaptcha, 110000);';

        $recaptcha_inline .= 'grecaptcha.ready(function(){grecaptcha.execute("' . esc_html($site_key) . '",{action:"yatra"}).then(function(token){var f=document.getElementsByName("yatra_recaptcha");for(var i=0;i<f.length;i++){f[i].value = token;}});});';

        wp_add_inline_script('yatra-recaptcha', $recaptcha_inline);

        echo '<input type="hidden" name="yatra_recaptcha" value="">';

    }

    public function validate_captcha()
    {
        $secret_key = get_option('yatra_integration_captcha_secret_key', '');

        $token = !empty($_POST['yatra_recaptcha']) ? yatra_clean(wp_unslash($_POST['yatra_recaptcha'])) : false;

        $raw_response = wp_safe_remote_get('https://www.google.com/recaptcha/api/siteverify?secret=' . $secret_key . '&response=' . $token);


        $error = '';
        if (!is_wp_error($raw_response)) {
            $response = json_decode(wp_remote_retrieve_body($raw_response));

            // Check reCAPTCHA response.
            if (empty($response->success) || ($response->score <= get_option('yatra_integration_captcha_v3_threshold_score', apply_filters('yatra_integration_captcha_v3_threshold_score', '0.5')))) {
                if (isset($response->score)) {
                    $error .= ' (' . esc_html($response->score) . ')';
                } else {
                    $error .= __('Captcha, validation error! Please refresh the page and try again.', 'yatra');
                }

            }
        }
        if ($error !== '') {
            yatra()->yatra_error->add('yatra_booking_errors', $error);

        }

    }
}