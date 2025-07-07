<?php
/**
 * Destination Detail View
 * 
 * @package Yatra
 * @since 1.0.0
 */

// Prevent direct access
if (!defined('ABSPATH')) {
    exit;
}

// Decode JSON fields for display
$emergency_contacts = is_string($destination['emergency_contacts']) ? json_decode($destination['emergency_contacts'], true) : ($destination['emergency_contacts'] ?? []);
$climate_info = is_string($destination['climate_info']) ? json_decode($destination['climate_info'], true) : ($destination['climate_info'] ?? []);
$best_time_to_visit = is_string($destination['best_time_to_visit']) ? json_decode($destination['best_time_to_visit'], true) : ($destination['best_time_to_visit'] ?? []);
$gallery = is_string($destination['gallery']) ? json_decode($destination['gallery'], true) : ($destination['gallery'] ?? []);
?>

<div class="yatra-destination-view">
    <div class="yatra-page-header">
        <div class="yatra-page-header-left">
            <a href="<?php echo admin_url('admin.php?page=yatra-app&subpage=destinations'); ?>" class="yatra-back-link">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M19 12H5M12 19L5 12L12 5" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
                Back to Destinations
            </a>
            <h2><?php echo esc_html($destination['name'] ?? $destination['title']); ?></h2>
            <p>Destination Details</p>
        </div>
        <div class="yatra-page-header-right">
            <a href="<?php echo admin_url('admin.php?page=yatra-app&subpage=destinations&action=edit&id=' . $destination['id']); ?>" class="yatra-btn yatra-btn-primary">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M11 4H4C3.46957 4 2.96086 4.21071 2.58579 4.58579C2.21071 4.96086 2 5.46957 2 6V20C2 20.5304 2.21071 21.0391 2.58579 21.4142C2.96086 21.7893 3.46957 22 4 22H18C18.5304 22 19.0391 21.7893 19.4142 21.4142C19.7893 21.0391 20 20.5304 20 20V13" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                    <path d="M18.5 2.5C18.8978 2.10217 19.4374 1.87868 20 1.87868C20.5626 1.87868 21.1022 2.10217 21.5 2.5C21.8978 2.89782 22.1213 3.43739 22.1213 4C22.1213 4.56261 21.8978 5.10217 21.5 5.5L12 15L8 16L9 12L18.5 2.5Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
                Edit Destination
            </a>
        </div>
    </div>

    <?php if (!empty($destination['featured_image'])): ?>
        <div class="yatra-featured-image">
            <img src="<?php echo esc_url($destination['featured_image']); ?>" alt="<?php echo esc_attr($destination['name'] ?? $destination['title']); ?>">
        </div>
    <?php endif; ?>

    <div class="yatra-content-grid">
        <main class="yatra-main-content">
            <section class="yatra-content-card">
                <div class="yatra-card-header">
                    <h3>Basic Information</h3>
                </div>
                <div class="yatra-card-body">
                    <div class="yatra-info-grid">
                        <div class="yatra-info-item">
                            <label>Name</label>
                            <span><?php echo esc_html($destination['name'] ?? $destination['title']); ?></span>
                        </div>
                        <div class="yatra-info-item">
                            <label>Slug</label>
                            <span><?php echo esc_html($destination['slug']); ?></span>
                        </div>
                        <div class="yatra-info-item">
                            <label>Status</label>
                            <span class="yatra-status yatra-status-<?php echo esc_attr($destination['status']); ?>">
                                <?php echo esc_html(ucfirst($destination['status'])); ?>
                            </span>
                        </div>
                        <div class="yatra-info-item">
                            <label>Sort Order</label>
                            <span><?php echo esc_html($destination['sort_order'] ?? $destination['order'] ?? 0); ?></span>
                        </div>
                    </div>
                    <?php if (!empty($destination['short_description'] ?? $destination['excerpt'])): ?>
                        <div class="yatra-info-section">
                            <label>Short Description</label>
                            <p><?php echo esc_html($destination['short_description'] ?? $destination['excerpt']); ?></p>
                        </div>
                    <?php endif; ?>
                    <?php if (!empty($destination['description'] ?? $destination['content'])): ?>
                        <div class="yatra-info-section">
                            <label>Description</label>
                            <div class="yatra-description">
                                <?php echo wp_kses_post($destination['description'] ?? $destination['content']); ?>
                            </div>
                        </div>
                    <?php endif; ?>
                </div>
            </section>
            <section class="yatra-content-card">
                <div class="yatra-card-header">
                    <h3>Location Information</h3>
                </div>
                <div class="yatra-card-body">
                    <div class="yatra-info-grid">
                        <?php if (!empty($destination['country_name'] ?? $destination['country'])): ?>
                            <div class="yatra-info-item">
                                <label>Country</label>
                                <span><?php echo esc_html($destination['country_name'] ?? $destination['country']); ?></span>
                            </div>
                        <?php endif; ?>
                        <?php if (!empty($destination['region'] ?? $destination['location'])): ?>
                            <div class="yatra-info-item">
                                <label>Region</label>
                                <span><?php echo esc_html($destination['region'] ?? $destination['location']); ?></span>
                            </div>
                        <?php endif; ?>
                        <?php if (!empty($destination['latitude'])): ?>
                            <div class="yatra-info-item">
                                <label>Latitude</label>
                                <span><?php echo esc_html($destination['latitude']); ?></span>
                            </div>
                        <?php endif; ?>
                        <?php if (!empty($destination['longitude'])): ?>
                            <div class="yatra-info-item">
                                <label>Longitude</label>
                                <span><?php echo esc_html($destination['longitude']); ?></span>
                            </div>
                        <?php endif; ?>
                        <?php if (!empty($destination['elevation'])): ?>
                            <div class="yatra-info-item">
                                <label>Elevation</label>
                                <span><?php echo esc_html($destination['elevation']); ?> meters</span>
                            </div>
                        <?php endif; ?>
                        <?php if (!empty($destination['timezone'])): ?>
                            <div class="yatra-info-item">
                                <label>Timezone</label>
                                <span><?php echo esc_html($destination['timezone']); ?></span>
                            </div>
                        <?php endif; ?>
                    </div>
                </div>
            </section>
            <?php if (!empty($destination['visa_requirements'] ?? $destination['visa']) || !empty($emergency_contacts)): ?>
            <section class="yatra-content-card">
                <div class="yatra-card-header">
                    <h3>Travel Information</h3>
                </div>
                <div class="yatra-card-body">
                    <?php if (!empty($destination['visa_requirements'] ?? $destination['visa'])): ?>
                        <div class="yatra-info-section">
                            <label>Visa Requirements</label>
                            <div class="yatra-visa-requirements">
                                <?php echo wp_kses_post($destination['visa_requirements'] ?? $destination['visa']); ?>
                            </div>
                        </div>
                    <?php endif; ?>
                    <?php if (!empty($emergency_contacts)): ?>
                        <div class="yatra-info-section">
                            <label>Emergency Contacts</label>
                            <div class="yatra-emergency-contacts-list">
                                <?php foreach ($emergency_contacts as $type => $number): ?>
                                    <div class="yatra-contact-item">
                                        <span class="contact-type"><?php echo esc_html($type); ?></span>
                                        <span class="contact-number"><?php echo esc_html($number); ?></span>
                                    </div>
                                <?php endforeach; ?>
                            </div>
                        </div>
                    <?php endif; ?>
                </div>
            </section>
            <?php endif; ?>
            <?php if (!empty($climate_info) || !empty($best_time_to_visit)): ?>
            <section class="yatra-content-card">
                <div class="yatra-card-header">
                    <h3>Climate & Best Time to Visit</h3>
                </div>
                <div class="yatra-card-body">
                    <?php if (!empty($climate_info)): ?>
                        <div class="yatra-info-section">
                            <label>Climate Information</label>
                            <div class="yatra-climate-list">
                                <?php foreach ($climate_info as $season => $description): ?>
                                    <div class="yatra-climate-item">
                                        <span class="season"><?php echo esc_html($season); ?></span>
                                        <span class="description"><?php echo esc_html($description); ?></span>
                                    </div>
                                <?php endforeach; ?>
                            </div>
                        </div>
                    <?php endif; ?>
                    <?php if (!empty($best_time_to_visit)): ?>
                        <div class="yatra-info-section">
                            <label>Best Time to Visit</label>
                            <div class="yatra-best-time-info">
                                <?php if (isset($best_time_to_visit['months']) && is_array($best_time_to_visit['months'])): ?>
                                    <div class="best-months">
                                        <strong>Best Months:</strong> <?php echo esc_html(implode(', ', $best_time_to_visit['months'])); ?>
                                    </div>
                                <?php endif; ?>
                                <?php if (!empty($best_time_to_visit['reason'])): ?>
                                    <div class="best-reason">
                                        <strong>Why Visit Then:</strong> <?php echo esc_html($best_time_to_visit['reason']); ?>
                                    </div>
                                <?php endif; ?>
                            </div>
                        </div>
                    <?php endif; ?>
                </div>
            </section>
            <?php endif; ?>
        </main>
        <aside class="yatra-sidebar">
            <section class="yatra-content-card yatra-gallery-card">
                <div class="yatra-card-header">
                    <h3>Gallery</h3>
                </div>
                <div class="yatra-card-body">
                    <div class="yatra-gallery-grid">
                        <?php if (!empty($gallery)): ?>
                            <?php foreach ($gallery as $image_url): ?>
                                <div class="yatra-gallery-item">
                                    <?php if ($image_url): ?>
                                        <img src="<?php echo esc_url($image_url); ?>" alt="Gallery Image">
                                    <?php else: ?>
                                        <span class="yatra-gallery-placeholder">No Image</span>
                                    <?php endif; ?>
                                </div>
                            <?php endforeach; ?>
                        <?php else: ?>
                            <div class="yatra-gallery-item">
                                <span class="yatra-gallery-placeholder">No Images</span>
                            </div>
                        <?php endif; ?>
                    </div>
                </div>
            </section>
            <?php if (!empty($destination['seo_title'] ?? $destination['meta_title']) || !empty($destination['seo_description'] ?? $destination['meta_description']) || !empty($destination['seo_keywords'] ?? $destination['meta_keywords'])): ?>
            <section class="yatra-content-card yatra-seo-card">
                <div class="yatra-card-header">
                    <h3>SEO Information</h3>
                </div>
                <div class="yatra-card-body">
                    <?php if (!empty($destination['seo_title'] ?? $destination['meta_title'])): ?>
                        <div class="yatra-info-item">
                            <label>SEO Title</label>
                            <span><?php echo esc_html($destination['seo_title'] ?? $destination['meta_title']); ?></span>
                        </div>
                    <?php endif; ?>
                    <?php if (!empty($destination['seo_description'] ?? $destination['meta_description'])): ?>
                        <div class="yatra-info-item">
                            <label>SEO Description</label>
                            <span><?php echo esc_html($destination['seo_description'] ?? $destination['meta_description']); ?></span>
                        </div>
                    <?php endif; ?>
                    <?php if (!empty($destination['seo_keywords'] ?? $destination['meta_keywords'])): ?>
                        <div class="yatra-info-item">
                            <label>SEO Keywords</label>
                            <span><?php echo esc_html($destination['seo_keywords'] ?? $destination['meta_keywords']); ?></span>
                        </div>
                    <?php endif; ?>
                </div>
            </section>
            <?php endif; ?>
            <section class="yatra-content-card yatra-meta-card">
                <div class="yatra-card-header">
                    <h3>Meta Information</h3>
                </div>
                <div class="yatra-card-body">
                    <div class="yatra-info-grid">
                        <div class="yatra-info-item">
                            <label>Created</label>
                            <span><?php echo esc_html($destination['created_at'] ?? 'N/A'); ?></span>
                        </div>
                        <div class="yatra-info-item">
                            <label>Last Updated</label>
                            <span><?php echo esc_html($destination['updated_at'] ?? 'N/A'); ?></span>
                        </div>
                        <?php if (!empty($destination['view_count'])): ?>
                            <div class="yatra-info-item">
                                <label>View Count</label>
                                <span><?php echo esc_html($destination['view_count']); ?></span>
                            </div>
                        <?php endif; ?>
                    </div>
                </div>
            </section>
        </aside>
    </div>
</div> 