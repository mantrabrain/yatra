<?php
/**
 * My Account Dashboard
 *
 */

if (!defined('ABSPATH')) {
    exit; // Exit if accessed directly
}

?>

    <table class="yatra-account-dashboard">
        <tr>
            <td colspan="2">
                <div class="yatra-account-gravatar">
                    <img src="<?php echo esc_url($profile_info->gravatar); ?>"/>
                </div>
            </td>
        </tr>

        <tr>
            <th><?php echo __('Name', 'yatra') ?></th>
            <td><?php echo esc_html($profile_info->fullname); ?></td>
        </tr>
        <tr>
            <th><?php echo __('Date of Birth', 'yatra') ?></th>
            <td><?php echo esc_html($profile_info->dob); ?></td>
        </tr>

        <tr>
            <th><?php echo __('Email', 'yatra') ?></th>
            <td><?php echo esc_html($profile_info->email); ?></td>
        </tr>

        <tr>
            <th><?php echo __('Contact Address', 'yatra') ?></th>
            <td><?php echo esc_html($profile_info->contact_address); ?></td>
        </tr>

        <tr>
            <th><?php echo __('Gender', 'yatra') ?></th>
            <td><?php echo esc_html($profile_info->gender); ?></td>
        </tr>

        <tr>
            <th><?php echo __('Country', 'yatra') ?></th>
            <td><?php echo esc_html($profile_info->country); ?></td>
        </tr>

        <tr>
            <th><?php echo __('Phone', 'yatra') ?></th>
            <td><?php echo esc_html($profile_info->phone); ?></td>
        </tr>
    </table>

<?php
/**
 * My Account dashboard.
 *
 */
do_action('yatra_account_dashboard');



