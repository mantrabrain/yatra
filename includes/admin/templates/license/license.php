<h1><?php echo __('License Manager', 'yatra') ?></h1>

<?php if ($message != '') { ?>
    <div id="message" class="updated notice notice-success "><p><?php echo esc_html($message); ?></p>
        <button type="button" class="notice-dismiss"><span class="screen-reader-text">Dismiss this notice.</span>
        </button>
    </div>
<?php } ?>
<form method="post" class="yatra-license-manager-form">
    <table class="yatra-license-manager-table">
        <thead>
        <tr>
            <th><?php echo __('Addon Name', 'yatra') ?></th>
            <th><?php echo __('License', 'yatra') ?></th>
            <th><?php echo __('Expire Date', 'yatra') ?></th>
            <th><?php echo __('Status', 'yatra') ?></th>
            <th><?php echo __('Message', 'yatra') ?></th>
        </tr>
        </thead>
        <tbody>
        <?php foreach ($addons as $addon_slug => $addon) {

            $license_details = get_option('yatra_license', array());

            $addon_license = isset($license_details[$addon_slug]) ? $license_details[$addon_slug] : array();

            $server_response = isset($addon_license['server_response']) ? $addon_license['server_response'] : array();

            $server_response = is_object($server_response) ? (array)$server_response : $server_response;

            $expired_date = isset($server_response['expires']) ? sanitize_text_field($server_response['expires']) : '';

            $display_license = isset($addon_license['license_key']) ? sanitize_text_field($addon_license['license_key']) : '';

            $display_license = '' != $display_license ? '**********' . substr($display_license, 5, 10) : '';

            $status = isset($addon_license['status']) ? sanitize_text_field($addon_license['status']) : '';

            $status = $status == '' ? 'inactive' : $status;

            $button_label = __('Deactivate', 'yatra');

            ?>
            <tr data-addon-slug="<?php echo esc_attr($addon_slug) ?>">
                <td><span class="product-name"><?php echo esc_html($addon['label']) ?></span>
                </td>
                <td class="license-column">
                    <div class="license-column-inner"> <?php
                        if ($display_license === '') {
                            ?>
                            <input type="text" name="<?php echo esc_attr($addon_slug) ?>_license"
                                   placeholder="<?php echo __('Please enter your license key here', 'yatra') ?>"
                            />
                            <?php
                        } else {
                            echo '<span class="display-text">' . esc_html($display_license) . '</span>';

                            echo '<span class="modify-license button button-secondary">' . __('Modify License', 'yatra') . '</span>';
                        }
                        if ($status === 'active') {
                            ?>
                            <button style="float:right;" type="button"
                                    class="button button-primary deactivate-license"><?php echo esc_html($button_label) ?></button>
                        <?php } ?>
                    </div>
                </td>
                <td>

                    <?php echo isset($expired_date) ? esc_html($expired_date) : '' ?>

                </td>
                <td>
                    <span class="status <?php echo esc_attr(strtolower($status)) ?>"><?php echo esc_html($status) ?></span>
                </td>
                <td style="max-width:250px;"><?php echo isset($addon_license['notice']) ? wp_kses($addon_license['notice'], array(
                        'a' => array('href' => array(), 'target' => array()),
                        'strong' => array()

                    )) : '' ?></td>


            </tr>
        <?php } ?>
        </tbody>
        <tfoot>
        <tr>
            <td colspan="5">
                <button class="button-primary" type="submit"
                        name="yatra_license_save_button"><?php echo __('Update', 'yatra'); ?></button>
            </td>
        </tr>

        </tfoot>
    </table>
    <?php
    wp_nonce_field('yatra_license_save_nonce');
    ?>
</form>