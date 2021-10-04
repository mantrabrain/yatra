<?php

defined('ABSPATH') || exit;

do_action('yatra_before_edit_account_form'); ?>
<h2><?php echo __('Edit Account Details', 'yatra'); ?></h2>
<form class="yatra-edit-account-form edit-account" action=""
      method="post" <?php do_action('yatra_edit_account_form_tag'); ?> >

    <?php do_action('yatra_my_account_edit_profile_form_fields'); ?>
    <div class="clear"></div>

    <p>
        <?php wp_nonce_field('yatra_save_account_details', 'yatra-save-account-details-nonce'); ?>
        <button type="submit" class="yatra-Button button button-primary" name="save_account_details"
                value="<?php esc_attr_e('Save changes', 'yatra'); ?>"><?php esc_html_e('Save changes', 'yatra'); ?></button>
        <input type="hidden" name="action" value="yatra_save_account_details"/>
    </p>

    <?php do_action('yatra_edit_account_form_end'); ?>
</form>

<?php do_action('yatra_after_edit_account_form'); ?>
