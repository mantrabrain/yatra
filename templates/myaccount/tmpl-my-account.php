<?php


defined('ABSPATH') || exit;

/**
 * My Account template
 *
 * @since 2.0.4
 */
do_action('yatra_account_navigation'); ?>

<div class="yatra-my-account-content <?php echo esc_attr($class) ?>">
    <?php
    do_action('yatra_before_account_content');
    /**
     * My Account content.
     *
     * @since 2.0.4
     */
    do_action('yatra_account_content');
    ?>
</div>
