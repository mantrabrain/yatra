<table>
    <thead>
    <tr>
        <th>Product Name</th>
        <th>Product License</th>
        <th>Expire Date</th>
        <th>Status</th>
    </tr>
    </thead>
    <tbody>
    <?php foreach ($addons as $addon_slug => $addon) {

        $license_sample = array(
            'yatra-services' => array(
                'expire_date' => '2021-10-22',
                'license_key' => 'kslkdkakasdkfasdlkfaksdfasdfasdf',
                'status' => 'Active'
            ));
        $license = get_option('yatra_license', $license_sample);

        $addon_license = isset($license_sample[$addon_slug]) ? $license_sample[$addon_slug] : array();

        ?>
        <tr>
            <td><?php echo esc_html($addon['label']) ?></td>
            <td><?php echo isset($addon_license['license_key']) ? esc_html($addon_license['license_key']) : '' ?></td>
            <td><?php echo isset($addon_license['expire_date']) ? esc_html($addon_license['expire_date']) : '' ?></td>
            <td><?php echo isset($addon_license['status']) ? esc_html($addon_license['status']) : '' ?></td>

        </tr>
    <?php } ?>
    </tbody>
</table>
<?php

echo '<pre>';
print_r($addons);
echo '</pre>';