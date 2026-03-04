<?php
/**
 * My Account Template
 * 
 * @package Yatra
 * @var \WP_User $user Current user object
 * @var array $bookings User's bookings
 * @var array $wishlist User's wishlist
 * @var array $atts Shortcode attributes
 */

// Prevent direct access
if (!defined('ABSPATH')) {
    exit;
}
?>

<div class="yatra-my-account">
    <div class="yatra-account-header">
        <div class="yatra-user-info">
            <div class="yatra-user-avatar">
                <?php echo get_avatar($user->ID, 80); ?>
            </div>
            <div class="yatra-user-details">
                <h2><?php echo esc_html($user->display_name); ?></h2>
                <p class="yatra-user-email"><?php echo esc_html($user->user_email); ?></p>
                <p class="yatra-member-since">
                    <?php 
                    printf(
                        esc_html__('Member since %s', 'yatra'),
                        esc_html(date_i18n(get_option('date_format'), strtotime($user->user_registered)))
                    );
                    ?>
                </p>
            </div>
        </div>
        <div class="yatra-account-actions">
            <a href="<?php echo esc_url(wp_logout_url(get_permalink())); ?>" class="yatra-btn yatra-btn-small yatra-btn-outline">
                <?php esc_html_e('Logout', 'yatra'); ?>
            </a>
        </div>
    </div>

    <div class="yatra-account-content">
        <!-- Navigation Tabs -->
        <div class="yatra-account-nav">
            <button class="yatra-nav-tab yatra-nav-tab-active" data-tab="bookings">
                <?php esc_html_e('My Bookings', 'yatra'); ?>
                <?php if (!empty($bookings)): ?>
                    <span class="yatra-tab-count"><?php echo count($bookings); ?></span>
                <?php endif; ?>
            </button>
            <button class="yatra-nav-tab" data-tab="wishlist">
                <?php esc_html_e('Wishlist', 'yatra'); ?>
                <?php if (!empty($wishlist)): ?>
                    <span class="yatra-tab-count"><?php echo count($wishlist); ?></span>
                <?php endif; ?>
            </button>
            <button class="yatra-nav-tab" data-tab="profile">
                <?php esc_html_e('Profile', 'yatra'); ?>
            </button>
        </div>

        <!-- Tab Content -->
        <div class="yatra-account-tabs">
            <!-- Bookings Tab -->
            <div class="yatra-tab-pane yatra-tab-active" id="bookings">
                <?php if ($atts['show_bookings'] === 'yes'): ?>
                    <?php if (!empty($bookings)): ?>
                        <div class="yatra-bookings-list">
                            <?php foreach ($bookings as $booking): ?>
                                <div class="yatra-booking-card">
                                    <div class="yatra-booking-header">
                                        <div class="yatra-booking-info">
                                            <h4 class="yatra-booking-title">
                                                <?php 
                                                $trip_title = get_the_title($booking['trip_id']);
                                                echo esc_html($trip_title ?: 'Trip #' . $booking['trip_id']);
                                                ?>
                                            </h4>
                                            <div class="yatra-booking-meta">
                                                <span class="yatra-booking-number">
                                                    <?php esc_html_e('Booking #', 'yatra'); ?>
                                                    <?php echo esc_html($booking['booking_number']); ?>
                                                </span>
                                                <span class="yatra-booking-date">
                                                    <?php echo esc_html(date_i18n(get_option('date_format'), strtotime($booking['date']))); ?>
                                                </span>
                                            </div>
                                        </div>
                                        <div class="yatra-booking-status">
                                            <span class="yatra-status-badge yatra-status-<?php echo esc_attr($booking['status']); ?>">
                                                <?php echo esc_html(ucfirst($booking['status'])); ?>
                                            </span>
                                        </div>
                                    </div>
                                    <div class="yatra-booking-details">
                                        <div class="yatra-booking-amount">
                                            <span class="yatra-amount-label"><?php esc_html_e('Total Amount', 'yatra'); ?></span>
                                            <span class="yatra-amount-value">
                                                <?php 
                                                $currency_symbol = \Yatra\Services\SettingsService::getCurrencySymbol();
                                                echo esc_html($currency_symbol . number_format($booking['total_amount'], 2));
                                                ?>
                                            </span>
                                        </div>
                                        <div class="yatra-booking-actions">
                                            <a href="<?php echo esc_url(get_permalink($booking['trip_id'])); ?>" class="yatra-btn yatra-btn-small">
                                                <?php esc_html_e('View Trip', 'yatra'); ?>
                                            </a>
                                            <?php if (get_post_status_object($booking['status'])->public): ?>
                                                <a href="#" class="yatra-btn yatra-btn-small yatra-btn-outline">
                                                    <?php esc_html_e('View Details', 'yatra'); ?>
                                                </a>
                                            <?php endif; ?>
                                        </div>
                                    </div>
                                </div>
                            <?php endforeach; ?>
                        </div>
                    <?php else: ?>
                        <div class="yatra-empty-state">
                            <div class="yatra-empty-icon">
                                <?php echo yatra_svg_icon('calendar', 'yatra-empty-icon-svg'); ?>
                            </div>
                            <h3><?php esc_html_e('No Bookings Yet', 'yatra'); ?></h3>
                            <p><?php esc_html_e('You haven\'t made any bookings yet. Start exploring our amazing trips!', 'yatra'); ?></p>
                            <a href="<?php echo esc_url(get_post_type_archive_link('trip')); ?>" class="yatra-btn yatra-btn-primary">
                                <?php esc_html_e('Explore Trips', 'yatra'); ?>
                            </a>
                        </div>
                    <?php endif; ?>
                <?php endif; ?>
            </div>

            <!-- Wishlist Tab -->
            <div class="yatra-tab-pane" id="wishlist">
                <?php if ($atts['show_wishlist'] === 'yes'): ?>
                    <?php if (!empty($wishlist)): ?>
                        <div class="yatra-wishlist-grid">
                            <?php foreach ($wishlist as $trip): ?>
                                <div class="yatra-wishlist-item">
                                    <div class="yatra-wishlist-image">
                                        <?php if ($trip['image']): ?>
                                            <img src="<?php echo esc_url($trip['image']); ?>" alt="<?php echo esc_attr($trip['title']); ?>">
                                        <?php else: ?>
                                            <div class="yatra-placeholder-image">
                                                <?php echo yatra_svg_icon('image', 'yatra-placeholder-icon'); ?>
                                            </div>
                                        <?php endif; ?>
                                    </div>
                                    <div class="yatra-wishlist-content">
                                        <h4 class="yatra-wishlist-title">
                                            <a href="<?php echo esc_url($trip['permalink']); ?>">
                                                <?php echo esc_html($trip['title']); ?>
                                            </a>
                                        </h4>
                                        <?php if ($trip['price']): ?>
                                            <div class="yatra-wishlist-price">
                                                <?php 
                                                $currency_symbol = \Yatra\Services\SettingsService::getCurrencySymbol();
                                                echo esc_html($currency_symbol . number_format($trip['price'], 2));
                                                ?>
                                            </div>
                                        <?php endif; ?>
                                    </div>
                                    <button class="yatra-wishlist-remove" data-trip-id="<?php echo esc_attr($trip['id']); ?>" title="<?php esc_attr_e('Remove from wishlist', 'yatra'); ?>">
                                        <?php echo yatra_svg_icon('x', 'yatra-remove-icon'); ?>
                                    </button>
                                </div>
                            <?php endforeach; ?>
                        </div>
                    <?php else: ?>
                        <div class="yatra-empty-state">
                            <div class="yatra-empty-icon">
                                <?php echo yatra_svg_icon('heart', 'yatra-empty-icon-svg'); ?>
                            </div>
                            <h3><?php esc_html_e('Your Wishlist is Empty', 'yatra'); ?></h3>
                            <p><?php esc_html_e('Start adding trips to your wishlist to keep track of your dream destinations!', 'yatra'); ?></p>
                            <a href="<?php echo esc_url(get_post_type_archive_link('trip')); ?>" class="yatra-btn yatra-btn-primary">
                                <?php esc_html_e('Explore Trips', 'yatra'); ?>
                            </a>
                        </div>
                    <?php endif; ?>
                <?php endif; ?>
            </div>

            <!-- Profile Tab -->
            <div class="yatra-tab-pane" id="profile">
                <?php if ($atts['show_profile'] === 'yes'): ?>
                    <div class="yatra-profile-section">
                        <h3><?php esc_html_e('Profile Information', 'yatra'); ?></h3>
                        
                        <div class="yatra-profile-form">
                            <div class="yatra-form-row">
                                <div class="yatra-form-group">
                                    <label for="yatra-first-name"><?php esc_html_e('First Name', 'yatra'); ?></label>
                                    <input type="text" id="yatra-first-name" name="first_name" value="<?php echo esc_attr($user->first_name); ?>" class="yatra-form-control">
                                </div>
                                <div class="yatra-form-group">
                                    <label for="yatra-last-name"><?php esc_html_e('Last Name', 'yatra'); ?></label>
                                    <input type="text" id="yatra-last-name" name="last_name" value="<?php echo esc_attr($user->last_name); ?>" class="yatra-form-control">
                                </div>
                            </div>
                            
                            <div class="yatra-form-group">
                                <label for="yatra-email"><?php esc_html_e('Email Address', 'yatra'); ?></label>
                                <input type="email" id="yatra-email" name="email" value="<?php echo esc_attr($user->user_email); ?>" class="yatra-form-control" readonly>
                            </div>
                            
                            <div class="yatra-form-group">
                                <label for="yatra-phone"><?php esc_html_e('Phone Number', 'yatra'); ?></label>
                                <input type="tel" id="yatra-phone" name="phone" value="<?php echo esc_attr(get_user_meta($user->ID, 'phone', true)); ?>" class="yatra-form-control">
                            </div>
                            
                            <div class="yatra-form-actions">
                                <button type="submit" class="yatra-btn yatra-btn-primary">
                                    <?php esc_html_e('Save Changes', 'yatra'); ?>
                                </button>
                            </div>
                        </div>
                    </div>
                <?php endif; ?>
            </div>
        </div>
    </div>
</div>

<style>
.yatra-my-account {
    max-width: 1200px;
    margin: 0 auto;
    padding: 20px;
}

.yatra-account-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 30px;
    padding-bottom: 20px;
    border-bottom: 1px solid #e5e7eb;
}

.yatra-user-info {
    display: flex;
    align-items: center;
    gap: 20px;
}

.yatra-user-avatar img {
    border-radius: 50%;
    border: 3px solid #f3f4f6;
}

.yatra-user-details h2 {
    margin: 0 0 5px 0;
    color: #1f2937;
}

.yatra-user-email {
    color: #6b7280;
    margin: 0 0 5px 0;
}

.yatra-member-since {
    color: #9ca3af;
    font-size: 0.875rem;
    margin: 0;
}

.yatra-account-nav {
    display: flex;
    border-bottom: 1px solid #e5e7eb;
    margin-bottom: 30px;
}

.yatra-nav-tab {
    background: none;
    border: none;
    padding: 15px 20px;
    cursor: pointer;
    position: relative;
    color: #6b7280;
    font-weight: 500;
    transition: all 0.3s ease;
}

.yatra-nav-tab:hover {
    color: #3b82f6;
}

.yatra-nav-tab.yatra-nav-tab-active {
    color: #3b82f6;
    border-bottom: 2px solid #3b82f6;
}

.yatra-tab-count {
    background: #3b82f6;
    color: white;
    border-radius: 50%;
    padding: 2px 6px;
    font-size: 0.75rem;
    margin-left: 8px;
}

.yatra-tab-pane {
    display: none;
}

.yatra-tab-pane.yatra-tab-active {
    display: block;
}

.yatra-booking-card {
    background: white;
    border: 1px solid #e5e7eb;
    border-radius: 8px;
    padding: 20px;
    margin-bottom: 15px;
}

.yatra-booking-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: 15px;
}

.yatra-booking-title {
    margin: 0 0 5px 0;
    color: #1f2937;
}

.yatra-booking-meta {
    display: flex;
    gap: 15px;
    font-size: 0.875rem;
    color: #6b7280;
}

.yatra-status-badge {
    padding: 4px 12px;
    border-radius: 20px;
    font-size: 0.75rem;
    font-weight: 500;
}

.yatra-status-publish {
    background: #dcfce7;
    color: #166534;
}

.yatra-status-confirmed {
    background: #dbeafe;
    color: #1e40af;
}

.yatra-status-pending {
    background: #fef3c7;
    color: #d97706;
}

.yatra-status-cancelled {
    background: #fee2e2;
    color: #dc2626;
}

.yatra-booking-details {
    display: flex;
    justify-content: space-between;
    align-items: center;
}

.yatra-booking-amount {
    text-align: left;
}

.yatra-amount-label {
    display: block;
    font-size: 0.875rem;
    color: #6b7280;
    margin-bottom: 4px;
}

.yatra-amount-value {
    font-size: 1.25rem;
    font-weight: 600;
    color: #1f2937;
}

.yatra-booking-actions {
    display: flex;
    gap: 10px;
}

.yatra-empty-state {
    text-align: center;
    padding: 60px 20px;
}

.yatra-empty-icon {
    margin-bottom: 20px;
    opacity: 0.5;
}

.yatra-empty-icon-svg {
    width: 60px;
    height: 60px;
    color: #9ca3af;
}

.yatra-empty-state h3 {
    margin: 0 0 10px 0;
    color: #1f2937;
}

.yatra-empty-state p {
    color: #6b7280;
    margin: 0 0 20px 0;
}

.yatra-wishlist-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
    gap: 20px;
}

.yatra-wishlist-item {
    background: white;
    border: 1px solid #e5e7eb;
    border-radius: 8px;
    overflow: hidden;
    position: relative;
}

.yatra-wishlist-image {
    height: 200px;
    background: #f9fafb;
}

.yatra-wishlist-image img {
    width: 100%;
    height: 100%;
    object-fit: cover;
}

.yatra-placeholder-image {
    width: 100%;
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
}

.yatra-placeholder-icon {
    width: 40px;
    height: 40px;
    color: #9ca3af;
}

.yatra-wishlist-content {
    padding: 15px;
}

.yatra-wishlist-title {
    margin: 0 0 10px 0;
}

.yatra-wishlist-title a {
    color: #1f2937;
    text-decoration: none;
}

.yatra-wishlist-title a:hover {
    color: #3b82f6;
}

.yatra-wishlist-price {
    font-size: 1.25rem;
    font-weight: 600;
    color: #1f2937;
}

.yatra-wishlist-remove {
    position: absolute;
    top: 10px;
    right: 10px;
    background: white;
    border: 1px solid #e5e7eb;
    border-radius: 50%;
    width: 32px;
    height: 32px;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    transition: all 0.3s ease;
}

.yatra-wishlist-remove:hover {
    background: #fee2e2;
    border-color: #dc2626;
    color: #dc2626;
}

.yatra-profile-section {
    background: white;
    border: 1px solid #e5e7eb;
    border-radius: 8px;
    padding: 30px;
}

.yatra-profile-section h3 {
    margin: 0 0 20px 0;
    color: #1f2937;
}

.yatra-form-row {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 20px;
}

.yatra-form-group {
    margin-bottom: 20px;
}

.yatra-form-group label {
    display: block;
    margin-bottom: 5px;
    font-weight: 500;
    color: #374151;
}

.yatra-form-control {
    width: 100%;
    padding: 10px 15px;
    border: 1px solid #d1d5db;
    border-radius: 6px;
    font-size: 1rem;
}

.yatra-form-control:focus {
    outline: none;
    border-color: #3b82f6;
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.yatra-form-actions {
    margin-top: 30px;
}

@media (max-width: 768px) {
    .yatra-account-header {
        flex-direction: column;
        gap: 20px;
        text-align: center;
    }
    
    .yatra-user-info {
        flex-direction: column;
    }
    
    .yatra-account-nav {
        overflow-x: auto;
    }
    
    .yatra-booking-header,
    .yatra-booking-details {
        flex-direction: column;
        gap: 15px;
        align-items: flex-start;
    }
    
    .yatra-form-row {
        grid-template-columns: 1fr;
    }
    
    .yatra-wishlist-grid {
        grid-template-columns: 1fr;
    }
}
</style>

<script>
document.addEventListener('DOMContentLoaded', function() {
    // Tab functionality
    const tabs = document.querySelectorAll('.yatra-nav-tab');
    const panes = document.querySelectorAll('.yatra-tab-pane');
    
    tabs.forEach(tab => {
        tab.addEventListener('click', function() {
            const targetTab = this.getAttribute('data-tab');
            
            // Remove active class from all tabs and panes
            tabs.forEach(t => t.classList.remove('yatra-nav-tab-active'));
            panes.forEach(p => p.classList.remove('yatra-tab-active'));
            
            // Add active class to clicked tab and corresponding pane
            this.classList.add('yatra-nav-tab-active');
            document.getElementById(targetTab).classList.add('yatra-tab-active');
        });
    });
    
    // Wishlist remove functionality
    const removeButtons = document.querySelectorAll('.yatra-wishlist-remove');
    removeButtons.forEach(button => {
        button.addEventListener('click', function() {
            const tripId = this.getAttribute('data-trip-id');
            const item = this.closest('.yatra-wishlist-item');
            
            if (confirm('<?php esc_html_e("Are you sure you want to remove this trip from your wishlist?", "yatra"); ?>')) {
                // Here you would typically make an AJAX call to remove from wishlist
                item.style.opacity = '0.5';
                setTimeout(() => item.remove(), 300);
            }
        });
    });
});
</script>
