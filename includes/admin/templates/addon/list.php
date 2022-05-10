<div id="wpforms-admin-addons" class="wrap wpforms-admin-wrap">
    <h1 class="page-title">
        WPForms Addons <input type="search" placeholder="Search Addons" id="wpforms-admin-addons-search">
    </h1>
    <div class="notice wpforms-notice notice-info" id="wpforms-notice-1" style="display: block;"><p><strong>WPForms
                Addons are a PRO feature</strong></p>
        <p>Please upgrade to PRO to unlock our addons, advanced form fields, and more!</p>
        <p>
            <a href="https://wpforms.com/lite-upgrade/?discount=LITEUPGRADE&amp;utm_source=WordPress&amp;utm_campaign=liteplugin&amp;utm_medium=addons"
               class="wpforms-btn wpforms-btn-orange wpforms-btn-md" rel="noopener noreferrer">
                Upgrade Now
            </a>
        </p></div>
    <div class="wpforms-admin-content">
        <div id="wpforms-admin-addons-list">
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
                            <div class="details wpforms-clear" style="">
                                <img src="<?php echo esc_attr($image_path) ?>"
                                     alt="<?php echo esc_attr($addon['title']) ?> logo">
                                <h5 class="addon-name">
                                    <a href="https://wpyatra.com/yatra-premium-extensions/<?php echo esc_attr($addon['slug']) ?>/?utm_source=WordPress&utm_campaign=Yatra Free Plugin&utm_medium=addons&utm_content=<?php echo esc_attr($addon['title']) ?>"
                                       title="Learn more about <?php echo esc_attr($addon['name']); ?>" target="_blank"
                                       rel="noopener noreferrer"
                                       class="addon-link"><?php
                                        echo esc_html($addon['title']);
                                        ?></a></h5>
                                <p class="addon-desc">
                                    <?php echo esc_html($addon['excerpt']); ?>
                                </p>
                            </div>
                            <div class="actions wpforms-clear">
                                <div class="upgrade-button">

                                </div>
                                <?php $addon = (object)$addon;
                                $license_plan = 'helo';
                                ?>

                                <div class="status column-status">
                                    <strong><?php esc_html_e('Status:', 'everest-forms'); ?></strong>
                                    <?php if (is_plugin_active($addon->slug . '/' . $addon->slug . '.php')) : ?>
                                        <span class="status-label status-active"><?php esc_html_e('Activated', 'everest-forms'); ?></span>
                                    <?php elseif (file_exists(WP_PLUGIN_DIR . '/' . $addon->slug . '/' . $addon->slug . '.php')) : ?>
                                        <span class="status-label status-inactive"><?php esc_html_e('Inactive', 'everest-forms'); ?></span>
                                    <?php else : ?>
                                        <span class="status-label status-install-now"><?php esc_html_e('Not Installed', 'everest-forms'); ?></span>
                                    <?php endif; ?>
                                </div>
                                <div class="upgrade-button action-button">
                                    <?php if (is_plugin_active($addon->slug . '/' . $addon->slug . '.php')) : ?>
                                        <?php
                                        /* translators: %s: Add-on title */
                                        $aria_label = sprintf(esc_html__('Deactivate %s now', 'everest-forms'), $addon->title);
                                        $plugin_file = plugin_basename($addon->slug . '/' . $addon->slug . '.php');
                                        $url = wp_nonce_url(
                                            add_query_arg(
                                                array(
                                                    'page' => 'evf-addons',
                                                    'action' => 'deactivate',
                                                    'plugin' => $plugin_file,
                                                ),
                                                admin_url('admin.php')
                                            ),
                                            'deactivate-plugin_' . $plugin_file
                                        );
                                        ?>
                                        <a class="button button-secondary deactivate-now"
                                           href="<?php echo esc_url($url); ?>"
                                           aria-label="<?php echo esc_attr($aria_label); ?>"><?php esc_html_e('Deactivate', 'everest-forms'); ?></a>
                                    <?php elseif (file_exists(WP_PLUGIN_DIR . '/' . $addon->slug . '/' . $addon->slug . '.php')) : ?>
                                        <?php
                                        /* translators: %s: Add-on title */
                                        $aria_label = sprintf(esc_html__('Activate %s now', 'everest-forms'), $addon->title);
                                        $plugin_file = plugin_basename($addon->slug . '/' . $addon->slug . '.php');
                                        $url = wp_nonce_url(
                                            add_query_arg(
                                                array(
                                                    'page' => 'evf-addons',
                                                    'action' => 'activate',
                                                    'plugin' => $plugin_file,
                                                ),
                                                admin_url('admin.php')
                                            ),
                                            'activate-plugin_' . $plugin_file
                                        );
                                        ?>
                                        <a class="button button-primary activate-now"
                                           href="<?php echo esc_url($url); ?>"
                                           aria-label="<?php echo esc_attr($aria_label); ?>"><?php esc_html_e('Activate', 'everest-forms'); ?></a>
                                    <?php else : ?>
                                        <?php
                                        /* translators: %s: Add-on title */
                                        $aria_label = sprintf(esc_html__('Install %s now', 'everest-forms'), $addon->title);
                                        ?>
                                        <a href="https://wpyatra.com/pricing/?utm_source=WordPress&utm_campaign=Yatra Free Plugin&utm_medium=addons&utm_content=<?php echo esc_attr($addon->title) ?>"
                                           target="_blank" rel="noopener noreferrer"
                                           class="button button-primary wpforms-btn-green">
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