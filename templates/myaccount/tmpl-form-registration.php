<?php


if (!defined('ABSPATH')) {
    exit; // Exit if accessed directly.
}

do_action('yatra_before_customer_registration_form'); ?>


<h2><?php esc_html_e('Register', 'yatra'); ?></h2>

<form class="yatra-form yatra-form-registration registration" method="post">

    <?php do_action('yatra_registration_form_start'); ?>

    <p class="form-row">
        <?php wp_nonce_field('yatra-registration', 'yatra-registration-nonce'); ?>
        <button type="submit" class="yatra-button button yatra-form-registration__submit" name="registration"
                value="<?php esc_attr_e('Register', 'yatra'); ?>"><?php esc_html_e('Register', 'yatra'); ?></button>
    </p>


    <?php do_action('yatra_registration_form_end'); ?>

</form>


<?php do_action('yatra_after_customer_registration_form'); ?>
