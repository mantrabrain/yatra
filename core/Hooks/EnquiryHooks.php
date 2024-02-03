<?php

namespace Yatra\Core\Hooks;
class EnquiryHooks
{

    public static function init()
    {
        $self = new self;

        add_filter('yatra_after_enquiry_form_fields', array($self, 'recaptcha'));

    }

    public function recaptcha()
    {
        echo '<h1>Hello</h1><input type="text" name="g-recaptcha-hidden" class="yatra-recaptcha-hidden" style="position:absolute!important;clip:rect(0,0,0,0)!important;height:1px!important;width:1px!important;border:0!important;overflow:hidden!important;padding:0!important;margin:0!important;" required>';

    }
}