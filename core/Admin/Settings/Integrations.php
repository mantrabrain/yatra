<?php

namespace Yatra\Core\Admin\Settings;


/**
 * Integrations
 */
class Integrations extends \Yatra_Admin_Settings_Base
{

    /**
     * Constructor.
     */
    public function __construct()
    {
        $this->id = 'integrations';
        $this->label = __('Integrations', 'yatra');

        parent::__construct();
    }

    /**
     * Get sections.
     *
     * @return array
     */
    public function get_sections()
    {
        $sections = array(
            '' => __('CAPTCHA Integration', 'yatra'),
        );

        return apply_filters('yatra_get_sections_' . $this->id, $sections);
    }

    /**
     * Output the settings.
     */
    public function output()
    {
        global $current_section;

        $settings = $this->get_settings($current_section);

        \Yatra_Admin_Settings::output_fields($settings);
    }

    /**
     * Save settings.
     */
    public function save()
    {
        global $current_section;

        $settings = $this->get_settings($current_section);
        \Yatra_Admin_Settings::save_fields($settings);

        if ($current_section) {
            do_action('yatra_update_options_' . $this->id . '_' . $current_section);
        }
    }

    private function get_captcha_language()
    {


        return [

            "ar" => "Arabic",
            "af" => "Afrikaans",
            "am" => "Amharic",
            "hy" => "Armenian",
            "az" => "Azerbaijani",
            "eu" => "Basque",
            "bn" => "Bengali",
            "bg" => "Bulgarian",
            "ca" => "Catalan",
            "zh-HK" => "Chinese (Hong Kong)",
            "zh-CN" => "Chinese (Simplified)",
            "zh-TW" => "Chinese (Traditional)",
            "hr" => "Croatian",
            "cs" => "Czech",
            "da" => "Danish",
            "nl" => "Dutch *",
            "en-GB" => "English (UK)",
            "en" => "English (US) *",
            "et" => "Estonian",
            "fil" => "Filipino",
            "fi" => "Finnish",
            "fr" => "French *",
            "fr-CA" => "French (Canadian)",
            "gl" => "Galician",
            "ka" => "Georgian",
            "de" => "German *",
            "de-AT" => "German (Austria)",
            "de-CH" => "German (Switzerland)",
            "el" => "Greek",
            "gu" => "Gujarati",
            "iw" => "Hebrew",
            "hi" => "Hindi",
            "hu" => "Hungarain",
            "is" => "Icelandic",
            "id" => "Indonesian",
            "it" => "Italian *",
            "ja" => "Japanese",
            "kn" => "Kannada",
            "ko" => "Korean",
            "lo" => "Laothian",
            "lv" => "Latvian",
            "lt" => "Lithuanian",
            "ms" => "Malay",
            "ml" => "Malayalam",
            "mr" => "Marathi",
            "mn" => "Mongolian",
            "no" => "Norwegian",
            "fa" => "Persian",
            "pl" => "Polish",
            "pt" => "Portuguese *",
            "pt-BR" => "Portuguese (Brazil)",
            "pt-PT" => "Portuguese (Portugal)",
            "ro" => "Romanian",
            "ru" => "Russian",
            "sr" => "Serbian",
            "si" => "Sinhalese",
            "sk" => "Slovak",
            "sl" => "Slovenian",
            "es" => "Spanish *",
            "es-419" => "Spanish (Latin America)",
            "sw" => "Swahili",
            "sv" => "Swedish",
            "ta" => "Tamil",
            "te" => "Telugu",
            "th" => "Thai",
            "tr" => "Turkish",
            "uk" => "Ukrainian",
            "ur" => "Urdu",
            "vi" => "Vietnamese",
            "zu" => "Zulu",
        ];


    }

    /**
     * Get settings array.
     *
     * @param string $current_section Current section name.
     * @return array
     */
    public function get_settings($current_section = '')
    {


        $language = $this->get_captcha_language();


        return apply_filters('yatra_get_settings_' . $this->id, array(
            array(
                'title' => __('CAPTCHA Settings', 'yatra'),
                'type' => 'title',
                'desc' => '',
                'id' => 'yatra_checkout_captcha_options',
            ),
            array(
                'title' => __('CAPTCHA type', 'yatra'),
                'desc' => sprintf(__('Get detailed of %s reCAPTCHA %s', 'yatra'), "<a target='_blank' href='https://www.google.com/recaptcha/about/'>", '</a>'),
                'id' => 'yatra_integration_captcha_type',
                'type' => 'select',
                'default' => 'recaptcha_v3',
                'options' => array(
                    'recaptcha_v3' => 'reCAPTCHA v3'
                )
            ),
            array(
                'title' => __('Enable CAPTCHA on enquiry form', 'yatra'),
                'desc' => __('Enable CAPTCHA on enquiry form', 'yatra'),
                'id' => 'yatra_integration_captcha_on_enquiry_form',
                'type' => 'checkbox',
                'default' => 'no',
            ),
            array(
                'title' => __('Enable CAPTCHA on booking form', 'yatra'),
                'desc' => __('Enable CAPTCHA on booking form', 'yatra'),
                'id' => 'yatra_integration_captcha_on_booking_form',
                'type' => 'checkbox',
                'default' => 'no',
            ),
            array(
                'title' => __('Site Key', 'yatra'),
                'desc' => sprintf(__('Make sure to use the correct site key for the CAPTCHA to avoid issues with form submission. Get %s reCAPTCHA Site Key%s', 'yatra'), "<a target='_blank' href='https://www.google.com/recaptcha/about/'>", '</a>'),
                'id' => 'yatra_integration_captcha_site_key',
                'type' => 'text',
                'default' => '',
            ),
            array(
                'title' => __('Secret Key', 'yatra'),
                'desc' => sprintf(__('Make sure to use the correct secret key for the CAPTCHA to avoid issues with form submission. Get %s reCAPTCHA Site Key%s', 'yatra'), "<a target='_blank' href='https://www.google.com/recaptcha/about/'>", '</a>'),
                'id' => 'yatra_integration_captcha_secret_key',
                'type' => 'text',
                'default' => '',
            ),
            array(
                'title' => __('Threshold Score', 'yatra'),
                'id' => 'yatra_integration_captcha_v3_threshold_score',
                'type' => 'number',
                'default' => '0.4',
                'custom_attributes' => array(
                    'max' => '1',
                    'min' => '0',
                    'step' => '0.1'
                )
            ),
//            array(
//                'title' => __('CAPTCHA Language', 'yatra'),
//                'id' => 'yatra_integration_captcha_language',
//                'type' => 'select',
//                'default' => 'en',
//                'options' => $language
//            ),
            array(
                'type' => 'sectionend',
                'id' => 'yatra_checkout_captcha_options',
            ),

        ), $current_section);
    }
}