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
                    ));


                    $image_path = file_exists(YATRA_ABSPATH . 'assets/admin/images/' . $addon['image']) ? YATRA_PLUGIN_URI . '/assets/admin/images/' . $addon['image'] : YATRA_PLUGIN_URI . '/assets/admin/images/addons/placeholder.png';

                    ?>
                    <div class="addon-container">
                        <div class="addon-item">
                            <div class="details wpforms-clear" style="">
                                <img src="<?php echo esc_attr($image_path) ?>"
                                     alt="<?php echo esc_attr($addon['title']) ?> logo">
                                <h5 class="addon-name">
                                    <a href="https://wpyatra.com/pricing/?utm_source=WordPress&utm_campaign=Yatra Free Plugin&utm_medium=addons&utm_content=<?php echo esc_attr($addon['title']) ?>"
                                       title="Learn more" target="_blank" rel="noopener noreferrer"
                                       class="addon-link"><?php
                                        echo esc_html($addon['title']);
                                        ?></a></h5>
                                <p class="addon-desc">
                                    <?php echo esc_html($addon['excerpt']); ?>
                                </p>
                            </div>
                            <div class="actions wpforms-clear">
                                <div class="upgrade-button">
                                    <a href="https://wpyatra.com/pricing/?utm_source=WordPress&utm_campaign=Yatra Free Plugin&utm_medium=addons&utm_content=<?php echo esc_attr($addon['title']) ?>"
                                       target="_blank" rel="noopener noreferrer"
                                       class="wpforms-btn wpforms-btn-green wpforms-upgrade-modal">
                                        Upgrade Now </a>
                                </div>
                            </div>
                        </div>
                    </div>
                <?php } ?>
            </div>
        </div>
    </div>
</div>