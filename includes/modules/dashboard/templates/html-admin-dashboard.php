<?php

if (!defined('ABSPATH')) {
    exit;
} ?>
<div class="wrap">
    <h2></h2>
    <div class="yatra-dashboard-heading">
        <h2><?php echo __('Yatra', 'yatra'); ?></h2>
        <p class="version"><?php echo esc_html(YATRA_VERSION); ?></p>
    </div>
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
                        <a href="<?php echo esc_url(admin_url('edit.php?post_type=tour&page=enquiries')) ?>">
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
                            <span class="dashicons dashicons-external"></span>
                            <?php echo __('Premium Addons/Extensions', 'yatra') ?></h2>
                    </div>
                    <div class="yatra-card-body">
                        <h2>
                            <a target="_blank"
                               href="https://mantrabrain.com/downloads/yatra-downloads/?ref=yatra-dashboard"><?php echo __('Yatra Downloads', 'yatra') ?></a>
                        </h2>
                        <p>
                            <?php echo __('Yatra Downloads is premium addon of Yatra free WordPress travel and tour plugin. This addon add features to add additional files so that anyone can download those files from frontend. It is useful for tour operator to add brochure, tour guidelines pdf file and other costing details files, and any kind of other additional files, so that anyone can easily download those files from website frontend.', 'yatra'); ?>
                        </p>
                        <h2>
                            <a target="_blank"
                               href="https://mantrabrain.com/downloads/yatra-services/?ref=yatra-dashboard"><?php echo __('Yatra Services', 'yatra') ?></a>
                        </h2>
                        <p>
                            <?php echo __('Yatra Services is premium addon of Yatra free WordPress travel and tour plugin. This addon
                            add features to add additional services for your tour packages. For example if you want to
                            add cleaning and other extra services along with your tour package ( Free Services or
                            Charged Services), this addon is useful for you. You can customize the pricing as per tour
                            package or individual person.', 'yatra'); ?>

                        </p>
                        <h2>
                            <a target="_blank"
                               href="https://mantrabrain.com/downloads/yatra-availability-conditions/?ref=yatra-dashboard"><?php echo __('Yatra Availability Conditions', 'yatra'); ?></a>
                        </h2>
                        <p><?php echo __('Yatra Availability Conditions is premium addon of Yatra free WordPress travel and tour plugin. This addon add features to add different types of conditional logic for your tour packages. For example if you want to make available for booking the tour package for weekend only or each sunday only or each month only, then this addon is for you. Simply you can add logic for the availability/enquiry only or for not availability. But make sure your condition will not conflict each other. If your custom condition conflict each other then the system will automatically apply the last added condition.', 'yatra'); ?></p>

                        <h2>
                            <a target="_blank"
                               href="https://mantrabrain.com/downloads/yatra-partial-payment/?ref=yatra-dashboard"><?php echo __('Yatra Partial Payment', 'yatra'); ?></a>
                        </h2>
                        <p><?php echo __('Yatra Partial Payment  is premium addon of Yatra free WordPress travel and tour plugin. This addon can be useful if you want to get amount partially from traveler. You can set how much money do you want to as deposit on percentage and you can simply use any of the payment gateway. Right now you can add first payment as deposit and remaining user can pay by themselves  via any of the payment gateway.', 'yatra'); ?></p>


                        <h2><a target="_blank"
                               href="https://mantrabrain.com/downloads/yatra-stripe/?ref=yatra-dashboard"><?php echo __('Yatra Stripe', 'yatra'); ?></a>
                        </h2>
                        <p><?php echo __('Yatra Stripe is premium addon of Yatra free WordPress travel and tour plugin. This is payment gateway of stripe.com which support different types of credit/debit cards. While booking the tour package on yatra plugin the traveller no need to go any of the payment gateway pages to pay the tour price. Any one can easily book the tour package via this premium payment gateway addon. But make sure you have already installed ssl on your website. ', 'yatra'); ?></p>

                        <h2>
                            <a target="_blank"
                               href="https://mantrabrain.com/downloads/yatra-authorizenet/?ref=yatra-dashboard"><?php echo __('Yatra Authorize.net', 'yatra'); ?></a>
                        </h2>
                        <p><?php echo __('Yatra Authorize.net  is premium addon of Yatra free WordPress travel and tour plugin. This is payment gateway addon for Yatra plugin. This is a gateway of authorize.net.  This gateway will support different types of credit/debit cards. Any one can book the tour package with their credit/debit card. You can check the supported currency and cards for this gateway from https://developer.authorize.net/api/reference/features/processor_support.html ', 'yatra'); ?></p>


                    </div>
                    <div class="yatra-card-footer"><a target="_blank"
                                                      href="https://mantrabrain.com/yatra-premium-extensions/?ref=yatra-dashboard">
                            <?php echo __('View All Addon/Extensions', 'yatra') ?></a></div>
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
                                                      href="https://mantrabrain.com/request-new-feature/?ref=yatra-dashboard">
                            <?php echo __('Send feature request', 'yatra') ?></a></div>
                </div>
            </div>
        </div>
        <div class="yatra-dashboard-sidebar">
            <div class="yatra-row-admin">
                <div class="yatra-dashboard-card yatra-card">
                    <div class="yatra-card-header"><h2>
                            <span class="dashicons dashicons-facebook-alt"></span>
                            <?php echo __('Facebook Community Group', 'yatra') ?></h2>
                    </div>
                    <div class="yatra-card-body"><p>
                            <?php echo sprintf(__('Join our facebook community group. You can post your query or share your thought and
                            questions about %sYatra WordPress plugin%s on the group.', 'yatra'), '<a target="_blank" href="https://mantrabrain.com/downloads/yatra-wordpress-travel-booking-system/?ref=yatra-dashboard">', '</a>'); ?>
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
                                                      href="https://docs.mantrabrain.com/yatra-wordpress-plugin/?ref=yatra-dashboard">
                            <?php echo __('Check Documentation', 'yatra') ?></a></div>
                </div>
            </div>
            <div class="yatra-row-admin">
                <div class="yatra-dashboard-card yatra-card">
                    <div class="yatra-card-header"><h2>
                            <span class="dashicons dashicons-buddicons-forums"></span>
                            <?php echo __('Support Forum', 'yatra') ?></h2>
                    </div>
                    <div class="yatra-card-body"><p>
                            <?php echo __('Post your questions and query about yatra WordPress plugin on our support forum.', 'yatra'); ?>
                        </p></div>
                    <div class="yatra-card-footer"><a target="_blank"
                                                      href="https://mantrabrain.com/support-forum/forum/yatra-wordpress-plugin/?ref=yatra-dashboard">
                            <?php echo __('View Support Forum', 'yatra') ?></a></div>
                </div>
            </div>
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

        </div>
    </div>
</div>
