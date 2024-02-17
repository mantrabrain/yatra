<?php

if (!defined('ABSPATH')) {
    exit;
} ?>
<div class="wrap">
    <h2></h2>
    <div class="yatra-dashboard-wrap">

        <div class="yatra-dashboard-content">
            <div class="yatra-row-admin">
                <div class="yatra-dashboard-card yatra-card">
                    <div class="yatra-card-header"><h2>
                            <span class="dashicons dashicons-palmtree"></span>
                            <?php echo __('Tours', 'yatra') ?></h2>
                    </div>
                    <div class="yatra-card-body"><p class="count"><?php echo absint($tour_count); ?></p></div>
                    <div class="yatra-card-footer">
                        <a href="<?php echo esc_url(admin_url('edit.php?post_type=tour')) ?>">
                            <?php echo __('View All', 'yatra'); ?>
                        </a>
                    </div>
                </div>
                <div class="yatra-dashboard-card yatra-card">
                    <div class="yatra-card-header">

                        <h2>
                            <span class="dashicons dashicons-location"></span>
                            <?php echo __('Destinations', 'yatra') ?></h2>
                    </div>
                    <div class="yatra-card-body"><p class="count"><?php echo absint($destination_count); ?></p></div>
                    <div class="yatra-card-footer">
                        <a href="<?php echo esc_url(admin_url('edit-tags.php?taxonomy=destination&post_type=tour')) ?>">
                            <?php echo __('View All', 'yatra'); ?>
                        </a>
                    </div>
                </div>
                <div class="yatra-dashboard-card yatra-card">
                    <div class="yatra-card-header"><h2>
                            <span class="dashicons dashicons-universal-access"></span>
                            <?php echo __('Activities', 'yatra') ?></h2>
                    </div>
                    <div class="yatra-card-body"><p class="count"><?php echo absint($activity_count); ?></p></div>
                    <div class="yatra-card-footer">
                        <a href="<?php echo esc_url(admin_url('edit-tags.php?taxonomy=activity&post_type=tour')) ?>">
                            <?php echo __('View All', 'yatra'); ?>
                        </a>
                    </div>
                </div>
                <div class="yatra-dashboard-card yatra-card">
                    <div class="yatra-card-header"><h2>
                            <span class="dashicons dashicons-album"></span>
                            <?php echo __('Attributes', 'yatra') ?></h2>
                    </div>
                    <div class="yatra-card-body"><p class="count"><?php echo absint($attribute_count); ?></p></div>
                    <div class="yatra-card-footer">
                        <a href="<?php echo esc_url(admin_url('edit-tags.php?taxonomy=attributes&post_type=tour')) ?>">
                            <?php echo __('View All', 'yatra'); ?>
                        </a>
                    </div>
                </div>
            </div>
            <div class="yatra-row-admin">
                <div class="yatra-dashboard-card yatra-card">
                    <div class="yatra-card-header"><h2>
                            <span class="dashicons dashicons-buddicons-pm"></span>
                            <?php echo __('Enquiries', 'yatra') ?></h2>
                    </div>
                    <div class="yatra-card-body"><p class="count"><?php echo absint($enquiry_count); ?></p></div>
                    <div class="yatra-card-footer">
                        <a href="<?php echo esc_url(admin_url('admin.php?page=enquiries')) ?>">
                            <?php echo __('View All', 'yatra'); ?>
                        </a>
                    </div>
                </div>
                <div class="yatra-dashboard-card yatra-card">
                    <div class="yatra-card-header"><h2>
                            <span class="dashicons dashicons-businessperson"></span>
                            <?php echo __('Customers', 'yatra') ?></h2>
                    </div>
                    <div class="yatra-card-body"><p class="count"><?php echo absint($customer_count); ?></p></div>
                    <div class="yatra-card-footer">
                        <a href="<?php echo esc_url(admin_url('edit.php?post_type=yatra-customers')) ?>">
                            <?php echo __('View All', 'yatra'); ?>
                        </a>
                    </div>
                </div>
                <div class="yatra-dashboard-card yatra-card">
                    <div class="yatra-card-header"><h2>
                            <span class="dashicons dashicons-tickets-alt"></span>
                            <?php echo __('Coupons', 'yatra') ?></h2>
                    </div>
                    <div class="yatra-card-body"><p class="count"><?php echo absint($coupon_count); ?></p></div>
                    <div class="yatra-card-footer">
                        <a href="<?php echo esc_url(admin_url('edit.php?post_type=yatra-coupons')) ?>">
                            <?php echo __('View All', 'yatra'); ?>
                        </a>
                    </div>
                </div>
                <div class="yatra-dashboard-card yatra-card">
                    <div class="yatra-card-header"><h2>
                            <span class="dashicons dashicons-book"></span>
                            <?php echo __('Bookings', 'yatra') ?></h2>
                    </div>
                    <div class="yatra-card-body"><p class="count"><?php echo absint($booking_count); ?></p></div>
                    <div class="yatra-card-footer">
                        <a href="<?php echo esc_url(admin_url('edit.php?post_type=yatra-booking')) ?>">
                            <?php echo __('View All', 'yatra'); ?>
                        </a>
                    </div>
                </div>
            </div>
            <div class="yatra-row-admin">
                <div class="yatra-dashboard-card yatra-card">
                    <div class="yatra-card-header"><h2>
                            <span class="dashicons dashicons-lightbulb"></span>
                            <?php echo __('Feature Request', 'yatra') ?></h2>
                    </div>
                    <div class="yatra-card-body"><p>
                            <?php echo sprintf(__('If you would like to add a new feature on the yatra plugin or any of the addons you can send us a feature request. Our development team will check & validate your requested feature. If your requested feature passes the validation, then you will get that feature in the next upcoming versions of the plugin. You can send directly the request via email to %smantrabrain@gmail.com%s too.', 'yatra'), '<strong>', '</strong>'); ?>
                        </p></div>
                    <div class="yatra-card-footer"><a target="_blank"
                                                      href="https://wpyatra.com/roadmap/?ref=yatra-dashboard">
                            <?php echo __('Send feature request', 'yatra') ?></a></div>
                </div>
            </div>
        </div>
        <div class="yatra-dashboard-sidebar">
            <div class="yatra-row-admin">
                <div class="yatra-dashboard-card yatra-card">
                    <div class="yatra-card-header"><h2>
                            <span class="dashicons dashicons-format-video"></span>
                            <?php echo __('Video Introduction', 'yatra') ?></h2>
                    </div>
                    <div class="yatra-card-body">

                        <iframe style="width:100%;" height="315"
                                src="https://www.youtube.com/embed/URdGixOz760?controls=0"
                                title="Yatra Tutorial" frameborder="0"
                                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                allowfullscreen></iframe>

                    </div>
                    <div class="yatra-card-footer"><a target="_blank"
                                                      href="https://www.youtube.com/watch?v=URdGixOz760">
                            <?php echo __('Watch on youtube', 'yatra') ?></a></div>
                </div>
            </div>
            <div class="yatra-row-admin">
                <div class="yatra-dashboard-card yatra-card">
                    <div class="yatra-card-header"><h2>
                            <span class="dashicons dashicons-facebook-alt"></span>
                            <?php echo __('Facebook Community Group', 'yatra') ?></h2>
                    </div>
                    <div class="yatra-card-body"><p>
                            <?php echo sprintf(__('Join our facebook community group. You can post your query or share your thought and
                            questions about %sYatra WordPress plugin%s on the group.', 'yatra'), '<a target="_blank" href="https://wpyatra.com/?ref=yatra-dashboard">', '</a>'); ?>
                        </p></div>
                    <div class="yatra-card-footer"><a target="_blank"
                                                      href="https://www.facebook.com/groups/yatrawordpressplugin/">
                            <?php echo __('Join Yatra Facebook Community Group', 'yatra') ?></a></div>
                </div>
            </div>
            <div class="yatra-row-admin">
                <div class="yatra-dashboard-card yatra-card">
                    <div class="yatra-card-header"><h2>
                            <span class="dashicons dashicons-text-page"></span>
                            <?php echo __('Documentation', 'yatra') ?></h2>
                    </div>
                    <div class="yatra-card-body"><p>
                            <?php echo __('You can read documentation about yatra WordPress plugin.', 'yatra'); ?>
                        </p></div>
                    <div class="yatra-card-footer"><a target="_blank"
                                                      href="https://wpyatra.com/docs/yatra/?ref=yatra-dashboard">
                            <?php echo __('Check Documentation', 'yatra') ?></a></div>
                </div>
            </div>
        </div>
    </div>
</div>
