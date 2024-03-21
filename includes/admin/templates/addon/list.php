<div id="yatra-admin-addons" class="wrap yatra-admin-wrap yatra-admin-addons-wrap">
    <h1 class="page-title">
        <span>Yatra Premium Addon/Extensions</span>
        <a href="https://wpyatra.com/extensions/?utm_source=WordPress&utm_campaign=Yatra Free Plugin&utm_medium=view-all-addons"
           target="_blank" rel="noopener noreferrer"
           class="button button-primary yatra-btn-orange">View All Premium Extensions</a>
    </h1>
    <div class="yatra-admin-content">
        <div id="yatra-admin-addons-list">
            <div class="list">

                <?php foreach ($addons as $addon) {
                    $addon = wp_parse_args($addon, array(
                        'title' => '',
                        'excerpt' => '',
                        'image' => '',
                        'slug' => '',
                        'name' => '',
                    ));

                    $license = $licenses[$addon['slug']] ?? array();

                    $status = $license['status'] ?? '';

                    $image_path = file_exists(YATRA_ABSPATH . 'assets/admin/images/' . $addon['image']) ? YATRA_PLUGIN_URI . '/assets/admin/images/' . $addon['image'] : YATRA_PLUGIN_URI . '/assets/admin/images/addons/placeholder.png';

                    ?>
                    <div class="addon-container">
                        <div class="addon-item">
                            <div class="details yatra-clear" style="">
                                <img src="<?php echo esc_attr($image_path) ?>"
                                     alt="<?php echo esc_attr($addon['title']) ?> logo">
                                <h5 class="addon-name">
                                    <a href="https://wpyatra.com/extensions/<?php echo esc_attr(str_replace('yatra-','',$addon['slug'])) ?>/?utm_source=WordPress&utm_campaign=Yatra Free Plugin&utm_medium=addons&utm_content=<?php echo esc_attr($addon['title']) ?>"
                                       title="Learn more about <?php echo esc_attr($addon['name']); ?>" target="_blank"
                                       rel="noopener noreferrer"
                                       class="addon-link"><?php
                                        echo esc_html($addon['title']);
                                        ?></a></h5>
                                <p class="addon-desc">
                                    <?php echo esc_html($addon['excerpt']); ?>
                                </p>
                            </div>
                            <div class="actions yatra-clear">

                                <?php

                                $plugin_file_slug = $addon['plugin_file'] ?? $addon['slug'];

                                $addon = (object)$addon;


                                ?>

                                <div class="status column-status">
                                    <strong><?php esc_html_e('Status: ', 'yatra'); ?></strong>
                                    <?php if (is_plugin_active($plugin_file_slug . '/' . $plugin_file_slug . '.php')) : ?>
                                        <span class="status-label status-active"><?php esc_html_e('Activated', 'yatra'); ?></span>
                                    <?php elseif (file_exists(WP_PLUGIN_DIR . '/' . $plugin_file_slug . '/' . $plugin_file_slug . '.php')) : ?>
                                        <span class="status-label status-inactive"><?php esc_html_e('Inactive', 'yatra'); ?></span>
                                    <?php else : ?>
                                        <span class="status-label status-install-now"><?php esc_html_e('Not Installed', 'yatra'); ?></span>
                                    <?php endif; ?>
                                </div>
                                <div class="upgrade-button action-button">
                                    <?php if (is_plugin_active($plugin_file_slug . '/' . $plugin_file_slug . '.php')) : ?>
                                        <?php
                                        /* translators: %s: Add-on title */
                                        $aria_label = sprintf(esc_html__('Deactivate %s now', 'yatra'), $addon->title);
                                        $plugin_file = plugin_basename($plugin_file_slug . '/' . $plugin_file_slug . '.php');
                                        $url = wp_nonce_url(
                                            add_query_arg(
                                                array(
                                                    //'page' => 'yatra-addons',
                                                    'action' => 'deactivate',
                                                    'plugin' => $plugin_file,
                                                ),
                                                admin_url('plugins.php')
                                            ),
                                            'deactivate-plugin_' . $plugin_file
                                        );
                                        ?>
                                        <a class="button button-secondary deactivate-now"
                                           href="<?php echo esc_url($url); ?>"
                                           aria-label="<?php echo esc_attr($aria_label); ?>"><?php esc_html_e('Deactivate', 'yatra'); ?></a>
                                    <?php elseif (file_exists(WP_PLUGIN_DIR . '/' . $plugin_file_slug . '/' . $plugin_file_slug . '.php')) : ?>
                                        <?php
                                        /* translators: %s: Add-on title */
                                        $aria_label = sprintf(esc_html__('Activate %s now', 'yatra'), $addon->title);
                                        $plugin_file = plugin_basename($plugin_file_slug . '/' . $plugin_file_slug . '.php');
                                        $url = wp_nonce_url(
                                            add_query_arg(
                                                array(
                                                    // 'page' => 'yatra-addons',
                                                    'action' => 'activate',
                                                    'plugin' => $plugin_file,
                                                ),
                                                admin_url('plugins.php')
                                            ),
                                            'activate-plugin_' . $plugin_file
                                        );
                                        ?>
                                        <a class="button button-primary activate-now"
                                           href="<?php echo esc_url($url); ?>"
                                           aria-label="<?php echo esc_attr($aria_label); ?>"><?php esc_html_e('Activate', 'yatra'); ?></a>
                                    <?php else : ?>
                                        <?php
                                        /* translators: %s: Add-on title */
                                        $aria_label = sprintf(esc_html__('Install %s now', 'yatra'), $addon->title);
                                        ?>
                                        <a href="https://wpyatra.com/pricing/?utm_source=WordPress&utm_campaign=Yatra Free Plugin&utm_medium=addons&utm_content=<?php echo esc_attr($addon->title) ?>"
                                           target="_blank" rel="noopener noreferrer"
                                           class="button button-primary yatra-btn-green">
                                            Upgrade Now </a>

                                    <?php endif; ?>
                                </div>


                            </div>
                        </div>
                    </div>
                <?php } ?>
            </div>
        </div>
    </div>
</div>