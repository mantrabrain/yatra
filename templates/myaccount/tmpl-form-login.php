<?php


if (!defined('ABSPATH')) {
    exit; // Exit if accessed directly.
}

do_action('yatra_before_customer_login_form'); ?>


<h2><?php esc_html_e('Login', 'yatra'); ?></h2>

<form class="yatra-form yatra-form-login login" method="post">

    <?php do_action('yatra_login_form_start'); ?>

    <div class="yatra-field-wrap">
        <p>
            <label for="username"><?php esc_html_e('Username or email address', 'yatra'); ?>&nbsp;<span
                        class="required">*</span></label>
            <input type="text" class="yatra-input yatra-input--text input-text" name="username" id="username"
                   autocomplete="username"
                   value="<?php echo (!empty($_POST['username'])) ? esc_attr(wp_unslash($_POST['username'])) : ''; ?>"/><?php // @codingStandardsIgnoreLine ?>
        </p>
    </div>
    <div class="yatra-field-wrap">
        <p>
            <label for="password"><?php esc_html_e('Password', 'yatra'); ?>&nbsp;<span
                        class="required">*</span></label>
            <input class="yatra-input yatra-input--text input-text" type="password" name="password"
                   id="password" autocomplete="current-password"/>
        </p>
    </div>

    <?php do_action('yatra_login_form'); ?>

    <p class="form-row">
        <label class="yatra-form__label yatra-form__label-for-checkbox yatra-form-login__rememberme">
            <input class="yatra-form__input yatra-form__input-checkbox" name="rememberme" type="checkbox"
                   id="rememberme" value="forever"/> <span><?php esc_html_e('Remember me', 'yatra'); ?></span>
        </label>
        <?php wp_nonce_field('yatra-login', 'yatra-login-nonce'); ?>
        <button type="submit" class="yatra-button button yatra-form-login__submit" name="login"
                value="<?php esc_attr_e('Log in', 'yatra'); ?>"><?php esc_html_e('Log in', 'yatra'); ?></button>
    </p>
    <p class="yatra-LostPassword lost_password">
        <a href="<?php echo esc_url(wp_lostpassword_url()); ?>"><?php esc_html_e('Lost your password?', 'yatra'); ?></a>
    </p>

    <?php do_action('yatra_login_form_end'); ?>

</form>


<?php do_action('yatra_after_customer_login_form'); ?>
