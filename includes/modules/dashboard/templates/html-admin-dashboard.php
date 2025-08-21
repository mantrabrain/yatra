<?php

if (!defined('ABSPATH')) {
    exit;
} ?>

<div class="wrap yatra-dashboard-modern">
    <!-- Hero Section -->
    <div class="yatra-dashboard-hero">
        <div class="yatra-hero-content">
            <div class="yatra-hero-text">
                <h1><?php echo __('Welcome to Yatra Dashboard', 'yatra'); ?></h1>
                <p><?php echo __('Manage your travel business efficiently with real-time insights and quick actions.', 'yatra'); ?></p>
            </div>
            <div class="yatra-hero-actions">
                <a href="<?php echo esc_url(admin_url('post-new.php?post_type=tour')); ?>" class="yatra-btn yatra-btn-primary">
                    <span class="dashicons dashicons-plus-alt2"></span>
                    <?php echo __('Add New Tour', 'yatra'); ?>
                </a>
                <a href="<?php echo esc_url(admin_url('edit.php?post_type=tour')); ?>" class="yatra-btn yatra-btn-secondary">
                    <span class="dashicons dashicons-admin-generic"></span>
                    <?php echo __('Manage Tours', 'yatra'); ?>
                </a>
            </div>
        </div>
        <div class="yatra-hero-stats">
            <div class="yatra-stat-item">
                <span class="yatra-stat-number"><?php echo absint($tour_count); ?></span>
                <span class="yatra-stat-label"><?php echo __('Active Tours', 'yatra'); ?></span>
            </div>
            <div class="yatra-stat-item">
                <span class="yatra-stat-number"><?php echo absint($booking_count); ?></span>
                <span class="yatra-stat-label"><?php echo __('Total Bookings', 'yatra'); ?></span>
            </div>
            <div class="yatra-stat-item">
                <span class="yatra-stat-number"><?php echo absint($customer_count); ?></span>
                <span class="yatra-stat-label"><?php echo __('Customers', 'yatra'); ?></span>
            </div>
        </div>
    </div>

    <!-- Main Dashboard Content -->
    <div class="yatra-dashboard-main">
        <!-- Statistics Cards -->
        <div class="yatra-stats-grid">
            <div class="yatra-stat-card">
                <div class="yatra-stat-card-icon tours">
                    <span class="dashicons dashicons-palmtree"></span>
                </div>
                <div class="yatra-stat-card-content">
                    <h3><?php echo __('Tours', 'yatra'); ?></h3>
                    <div class="yatra-stat-number"><?php echo absint($tour_count); ?></div>
                    <a href="<?php echo esc_url(admin_url('edit.php?post_type=tour')); ?>" class="yatra-stat-link">
                        <?php echo __('View All Tours', 'yatra'); ?>
                        <span class="dashicons dashicons-arrow-right-alt"></span>
                    </a>
                </div>
            </div>

            <div class="yatra-stat-card">
                <div class="yatra-stat-card-icon destinations">
                    <span class="dashicons dashicons-location"></span>
                </div>
                <div class="yatra-stat-card-content">
                    <h3><?php echo __('Destinations', 'yatra'); ?></h3>
                    <div class="yatra-stat-number"><?php echo absint($destination_count); ?></div>
                    <a href="<?php echo esc_url(admin_url('edit-tags.php?taxonomy=destination&post_type=tour')); ?>" class="yatra-stat-link">
                        <?php echo __('Manage Destinations', 'yatra'); ?>
                        <span class="dashicons dashicons-arrow-right-alt"></span>
                    </a>
                </div>
            </div>

            <div class="yatra-stat-card">
                <div class="yatra-stat-card-icon activities">
                    <span class="dashicons dashicons-universal-access"></span>
                </div>
                <div class="yatra-stat-card-content">
                    <h3><?php echo __('Activities', 'yatra'); ?></h3>
                    <div class="yatra-stat-number"><?php echo absint($activity_count); ?></div>
                    <a href="<?php echo esc_url(admin_url('edit-tags.php?taxonomy=activity&post_type=tour')); ?>" class="yatra-stat-link">
                        <?php echo __('Manage Activities', 'yatra'); ?>
                        <span class="dashicons dashicons-arrow-right-alt"></span>
                    </a>
                </div>
            </div>

            <div class="yatra-stat-card">
                <div class="yatra-stat-card-icon attributes">
                    <span class="dashicons dashicons-album"></span>
                </div>
                <div class="yatra-stat-card-content">
                    <h3><?php echo __('Attributes', 'yatra'); ?></h3>
                    <div class="yatra-stat-number"><?php echo absint($attribute_count); ?></div>
                    <a href="<?php echo esc_url(admin_url('edit-tags.php?taxonomy=attributes&post_type=tour')); ?>" class="yatra-stat-link">
                        <?php echo __('Manage Attributes', 'yatra'); ?>
                        <span class="dashicons dashicons-arrow-right-alt"></span>
                    </a>
                </div>
            </div>

            <div class="yatra-stat-card">
                <div class="yatra-stat-card-icon enquiries">
                    <span class="dashicons dashicons-buddicons-pm"></span>
                </div>
                <div class="yatra-stat-card-content">
                    <h3><?php echo __('Enquiries', 'yatra'); ?></h3>
                    <div class="yatra-stat-number"><?php echo absint($enquiry_count); ?></div>
                    <a href="<?php echo esc_url(admin_url('admin.php?page=enquiries')); ?>" class="yatra-stat-link">
                        <?php echo __('View Enquiries', 'yatra'); ?>
                        <span class="dashicons dashicons-arrow-right-alt"></span>
                    </a>
                </div>
            </div>

            <div class="yatra-stat-card">
                <div class="yatra-stat-card-icon customers">
                    <span class="dashicons dashicons-businessperson"></span>
                </div>
                <div class="yatra-stat-card-content">
                    <h3><?php echo __('Customers', 'yatra'); ?></h3>
                    <div class="yatra-stat-number"><?php echo absint($customer_count); ?></div>
                    <a href="<?php echo esc_url(admin_url('edit.php?post_type=yatra-customers')); ?>" class="yatra-stat-link">
                        <?php echo __('View Customers', 'yatra'); ?>
                        <span class="dashicons dashicons-arrow-right-alt"></span>
                    </a>
                </div>
            </div>

            <div class="yatra-stat-card">
                <div class="yatra-stat-card-icon coupons">
                    <span class="dashicons dashicons-tickets-alt"></span>
                </div>
                <div class="yatra-stat-card-content">
                    <h3><?php echo __('Coupons', 'yatra'); ?></h3>
                    <div class="yatra-stat-number"><?php echo absint($coupon_count); ?></div>
                    <a href="<?php echo esc_url(admin_url('edit.php?post_type=yatra-coupons')); ?>" class="yatra-stat-link">
                        <?php echo __('Manage Coupons', 'yatra'); ?>
                        <span class="dashicons dashicons-arrow-right-alt"></span>
                    </a>
                </div>
            </div>

            <div class="yatra-stat-card">
                <div class="yatra-stat-card-icon bookings">
                    <span class="dashicons dashicons-calendar-alt"></span>
                </div>
                <div class="yatra-stat-card-content">
                    <h3><?php echo __('Bookings', 'yatra'); ?></h3>
                    <div class="yatra-stat-number"><?php echo absint($booking_count); ?></div>
                    <a href="<?php echo esc_url(admin_url('edit.php?post_type=yatra-booking')); ?>" class="yatra-stat-link">
                        <?php echo __('View Bookings', 'yatra'); ?>
                        <span class="dashicons dashicons-arrow-right-alt"></span>
                    </a>
                </div>
            </div>
        </div>

        <!-- Quick Actions Section -->
        <div class="yatra-quick-actions">
            <h2><?php echo __('Quick Actions', 'yatra'); ?></h2>
            <div class="yatra-actions-grid">
                <a href="<?php echo esc_url(admin_url('post-new.php?post_type=tour')); ?>" class="yatra-action-card">
                    <span class="dashicons dashicons-plus-alt2"></span>
                    <h3><?php echo __('Add New Tour', 'yatra'); ?></h3>
                    <p><?php echo __('Create a new tour package', 'yatra'); ?></p>
                </a>
                <a href="<?php echo esc_url(admin_url('edit.php?post_type=yatra-booking')); ?>" class="yatra-action-card">
                    <span class="dashicons dashicons-calendar-alt"></span>
                    <h3><?php echo __('View Bookings', 'yatra'); ?></h3>
                    <p><?php echo __('Check recent bookings', 'yatra'); ?></p>
                </a>
                <a href="<?php echo esc_url(admin_url('admin.php?page=yatra-settings')); ?>" class="yatra-action-card">
                    <span class="dashicons dashicons-admin-settings"></span>
                    <h3><?php echo __('Settings', 'yatra'); ?></h3>
                    <p><?php echo __('Configure plugin settings', 'yatra'); ?></p>
                </a>
                <a href="<?php echo esc_url(admin_url('edit-tags.php?taxonomy=destination&post_type=tour')); ?>" class="yatra-action-card">
                    <span class="dashicons dashicons-location"></span>
                    <h3><?php echo __('Destinations', 'yatra'); ?></h3>
                    <p><?php echo __('Manage tour destinations', 'yatra'); ?></p>
                </a>
            </div>
        </div>

        <!-- Recent Activity Section -->
        <div class="yatra-recent-activity">
            <h2><?php echo __('Recent Activity', 'yatra'); ?></h2>
            <div class="yatra-activity-list">
                <?php
                // Get recent tours
                $recent_tours = get_posts(array(
                    'post_type' => 'tour',
                    'posts_per_page' => 5,
                    'post_status' => 'publish'
                ));
                
                if (!empty($recent_tours)) : ?>
                    <div class="yatra-activity-section">
                        <h3><?php echo __('Recent Tours', 'yatra'); ?></h3>
                        <div class="yatra-activity-items">
                            <?php foreach ($recent_tours as $tour) : ?>
                                <div class="yatra-activity-item">
                                    <div class="yatra-activity-icon">
                                        <span class="dashicons dashicons-palmtree"></span>
                                    </div>
                                    <div class="yatra-activity-content">
                                        <h4><?php echo esc_html($tour->post_title); ?></h4>
                                        <p><?php echo __('Published', 'yatra'); ?>: <?php echo get_the_date('', $tour->ID); ?></p>
                                    </div>
                                    <div class="yatra-activity-action">
                                        <a href="<?php echo esc_url(get_edit_post_link($tour->ID)); ?>" class="yatra-btn-small">
                                            <?php echo __('Edit', 'yatra'); ?>
                                        </a>
                                    </div>
                                </div>
                            <?php endforeach; ?>
                        </div>
                    </div>
                <?php endif; ?>

                <?php
                // Get recent bookings
                $recent_bookings = get_posts(array(
                    'post_type' => 'yatra-booking',
                    'posts_per_page' => 5,
                    'post_status' => 'publish'
                ));
                
                if (!empty($recent_bookings)) : ?>
                    <div class="yatra-activity-section">
                        <h3><?php echo __('Recent Bookings', 'yatra'); ?></h3>
                        <div class="yatra-activity-items">
                            <?php foreach ($recent_bookings as $booking) : ?>
                                <div class="yatra-activity-item">
                                    <div class="yatra-activity-icon">
                                        <span class="dashicons dashicons-calendar-alt"></span>
                                    </div>
                                    <div class="yatra-activity-content">
                                        <h4><?php echo esc_html($booking->post_title); ?></h4>
                                        <p><?php echo __('Booked', 'yatra'); ?>: <?php echo get_the_date('', $booking->ID); ?></p>
                                    </div>
                                    <div class="yatra-activity-action">
                                        <a href="<?php echo esc_url(get_edit_post_link($booking->ID)); ?>" class="yatra-btn-small">
                                            <?php echo __('View', 'yatra'); ?>
                                        </a>
                                    </div>
                                </div>
                            <?php endforeach; ?>
                        </div>
                    </div>
                <?php endif; ?>
            </div>
        </div>
    </div>
</div>
