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
            <th>Product Name</th>
            <th>Product License</th>
            <th>Expire Date</th>
            <th>Status</th>
            <th>Notice</th>
        </tr>
        </thead>
        <tbody>
        <?php foreach ($addons as $addon_slug => $addon) {
            $license_sample = array(
                'yatra-services' => array(
                    'expire_date' => '2021-10-22',
                    'license_key' => '',//'c7c40e988e2b3517eebc1a4fd5cf35fa',
                    'status' => 'inactive',
                    'notice' => __('Currently Active', 'yatra'),
                    'id' => 12323,

                ));
            $license = get_option('yatra_license', $license_sample);

            $addon_license = isset($license_sample[$addon_slug]) ? $license_sample[$addon_slug] : array();

            $display_license = isset($addon_license['license_key']) ? sanitize_text_field($addon_license['license_key']) : '';

            $display_license = '' != $display_license ? '**********' . substr($display_license, 5, 10) : '';
            ?>
            <tr>
                <td><span class="product-name"><?php echo esc_html($addon['label']) ?></span></td>
                <td><?php
                    if ($display_license === '') {
                        ?>
                        <input type="text" name="<?php echo esc_attr($addon_slug) ?>_license"
                               placeholder="<?php echo __('Please enter your license key here', 'yatra') ?>"
                               style="width: 100%"/>
                        <?php
                    } else {
                        echo esc_html($display_license);
                    }
                    ?></td>
                <td>

                    <?php echo isset($addon_license['expire_date']) ? esc_html($addon_license['expire_date']) : '' ?>

                </td>
                <td>
                    <span class="status <?php echo esc_attr(strtolower($addon_license['status'])) ?>"><?php echo isset($addon_license['status']) ? esc_html($addon_license['status']) : '' ?></span>
                </td>
                <td><?php echo isset($addon_license['notice']) ? esc_html($addon_license['notice']) : '' ?></td>


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