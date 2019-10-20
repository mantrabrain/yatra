<?php

defined('ABSPATH') || exit;

do_action('yatra_before_change_password_form'); ?>
<h2><?php echo __('Change Password', 'yatra'); ?></h2>
<form class="yatra-edit-account-form edit-account" action=""
      method="post">

    <?php do_action('yatra_my_account_change_password_form_fields'); ?>
    <div class="clear"></div>

    <p>
        <?php wp_nonce_field('yatra_change_user_password', 'yatra-change-user-password-nonce'); ?>
        <button type="submit" class="yatra-Button button button-primary" name="change_account_password"
                value="<?php esc_attr_e('Save changes', 'yatra'); ?>"><?php esc_html_e('Change Password', 'yatra'); ?></button>
        <input type="hidden" name="action" value="yatra_change_user_password"/>
    </p>

    <?php do_action('yatra_edit_account_form_end'); ?>
</form>

<?php do_action('yatra_after_chanage_password_form'); ?>
