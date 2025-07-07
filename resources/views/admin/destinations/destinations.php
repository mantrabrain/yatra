<?php
/**
 * Destinations View
 * 
 * @package Yatra
 * @since 1.0.0
 */

// Prevent direct access
if (!defined('ABSPATH')) {
    exit;
}

// Calculate stats
$total_destinations = count($destinations);
$active_destinations = count(array_filter($destinations, function($d) { return $d['status'] === 'active'; }));
$inactive_destinations = count(array_filter($destinations, function($d) { return $d['status'] === 'inactive'; }));
$draft_destinations = count(array_filter($destinations, function($d) { return $d['status'] === 'draft'; }));
?>

<div class="yatra-destinations">
    <!-- Page Header -->
    <div class="yatra-page-header">
        <div class="yatra-page-header-left">
            <h2>Manage Destinations</h2>
            <p>Create and manage your travel destinations and locations</p>
        </div>
        <div class="yatra-page-header-right">
            <button type="button" class="yatra-btn yatra-btn-primary" id="add-destination-btn">
                <span class="yatra-btn-icon">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M12 5V19M5 12H19" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                    </svg>
                </span>
                Add New Destination
            </button>
        </div>
    </div>

    <!-- Stats Cards -->
    <div class="yatra-stats-grid">
        <div class="yatra-stat-card">
            <div class="yatra-stat-icon">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M21 10C21 17 12 23 12 23S3 17 3 10C3 7.61305 3.94821 5.32387 5.63604 3.63604C7.32387 1.94821 9.61305 1 12 1C14.3869 1 16.6761 1.94821 18.364 3.63604C20.0518 5.32387 21 7.61305 21 10Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                    <path d="M12 13C13.6569 13 15 11.6569 15 10C15 8.34315 13.6569 7 12 7C10.3431 7 9 8.34315 9 10C9 11.6569 10.3431 13 12 13Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
            </div>
            <div class="yatra-stat-content">
                <h3 class="yatra-stat-number"><?php echo $total_destinations; ?></h3>
                <p class="yatra-stat-label">Total Destinations</p>
            </div>
        </div>
        <div class="yatra-stat-card">
            <div class="yatra-stat-icon">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M9 12L11 14L15 10M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
            </div>
            <div class="yatra-stat-content">
                <h3 class="yatra-stat-number"><?php echo $active_destinations; ?></h3>
                <p class="yatra-stat-label">Active</p>
            </div>
        </div>
        <div class="yatra-stat-card">
            <div class="yatra-stat-icon">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M14 2H6C5.46957 2 4.96086 2.21071 4.58579 2.58579C4.21071 2.96086 4 3.46957 4 4V20C4 20.5304 4.21071 21.0391 4.58579 21.4142C4.96086 21.7893 5.46957 22 6 22H18C18.5304 22 19.0391 21.7893 19.4142 21.4142C19.7893 21.0391 20 20.5304 20 20V8L14 2Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                    <path d="M14 2V8H20" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                    <path d="M16 13H8" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                    <path d="M16 17H8" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                    <path d="M10 9H9H8" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
            </div>
            <div class="yatra-stat-content">
                <h3 class="yatra-stat-number"><?php echo $draft_destinations; ?></h3>
                <p class="yatra-stat-label">Drafts</p>
            </div>
        </div>
        <div class="yatra-stat-card">
            <div class="yatra-stat-icon">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
            </div>
            <div class="yatra-stat-content">
                <h3 class="yatra-stat-number"><?php echo $inactive_destinations; ?></h3>
                <p class="yatra-stat-label">Inactive</p>
            </div>
        </div>
    </div>

    <!-- Main Content -->
    <div class="yatra-content-card">
        <div class="yatra-card-header">
            <div class="yatra-card-header-left">
                <h3>All Destinations</h3>
                <p>Manage your travel destinations and locations</p>
            </div>
            <div class="yatra-card-header-right">
                <form class="yatra-filters-bar" method="get" action="">
                    <div class="yatra-status-filters">
                        <button type="button" class="yatra-status-filter active" data-status="all">All</button>
                        <button type="button" class="yatra-status-filter" data-status="active">Active</button>
                        <button type="button" class="yatra-status-filter" data-status="inactive">Inactive</button>
                        <button type="button" class="yatra-status-filter" data-status="draft">Draft</button>
                    </div>
                    <div class="yatra-search-box">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M21 21L16.514 16.506L21 21ZM19 10.5C19 15.194 15.194 19 10.5 19C5.806 19 2 15.194 2 10.5C2 5.806 5.806 2 10.5 2C15.194 2 19 5.806 19 10.5Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                        </svg>
                        <input type="text" id="destination-search" placeholder="Search destinations..." class="yatra-search-input">
                    </div>
                </form>
            </div>
        </div>
        <div class="yatra-card-body">
            <div class="yatra-bulk-actions-bar">
                <select id="bulk-action-select" class="yatra-bulk-select">
                    <option value="">Bulk Actions</option>
                    <option value="delete">Delete</option>
                    <option value="activate">Activate</option>
                    <option value="deactivate">Deactivate</option>
                </select>
                <button type="button" class="yatra-btn yatra-btn-secondary yatra-bulk-apply">Apply</button>
            </div>
            <div class="yatra-table-container">
                <table class="yatra-table">
                    <thead>
                        <tr>
                            <th><input type="checkbox" id="select-all-destinations"></th>
                            <th>Destination</th>
                            <th>Location</th>
                            <th>Status</th>
                            <th>Sort Order</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody id="destinations-tbody">
                        <?php if (empty($destinations)): ?>
                            <tr>
                                <td colspan="6" class="yatra-empty-state">
                                    <div class="empty-state">
                                        <div class="empty-icon">
                                            <svg width="64" height="64" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                <path d="M21 10C21 17 12 23 12 23S3 17 3 10C3 7.61305 3.94821 5.32387 5.63604 3.63604C7.32387 1.94821 9.61305 1 12 1C14.3869 1 16.6761 1.94821 18.364 3.63604C20.0518 5.32387 21 7.61305 21 10Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                                                <path d="M12 13C13.6569 13 15 11.6569 15 10C15 8.34315 13.6569 7 12 7C10.3431 7 9 8.34315 9 10C9 11.6569 10.3431 13 12 13Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                                            </svg>
                                        </div>
                                        <h4>No Destinations Found</h4>
                                        <p>Get started by creating your first destination.</p>
                                        <button type="button" class="yatra-btn yatra-btn-primary" id="add-first-destination-btn">
                                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                <path d="M12 5V19M5 12H19" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                                            </svg>
                                            Add Your First Destination
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        <?php else: ?>
                            <?php foreach ($destinations as $destination): ?>
                                <tr data-id="<?php echo esc_attr($destination['id']); ?>">
                                    <td><input type="checkbox" class="destination-checkbox" value="<?php echo esc_attr($destination['id']); ?>"></td>
                                    <td>
                                        <div class="yatra-destination-info">
                                            <div class="yatra-destination-image">
                                                <?php if (!empty($destination['featured_image'])): ?>
                                                    <img src="<?php echo esc_url($destination['featured_image']); ?>" alt="<?php echo esc_attr($destination['name'] ?? $destination['title']); ?>">
                                                <?php else: ?>
                                                    <div class="yatra-destination-placeholder">
                                                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                            <path d="M21 10C21 17 12 23 12 23S3 17 3 10C3 7.61305 3.94821 5.32387 5.63604 3.63604C7.32387 1.94821 9.61305 1 12 1C14.3869 1 16.6761 1.94821 18.364 3.63604C20.0518 5.32387 21 7.61305 21 10Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                                                            <path d="M12 13C13.6569 13 15 11.6569 15 10C15 8.34315 13.6569 7 12 7C10.3431 7 9 8.34315 9 10C9 11.6569 10.3431 13 12 13Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                                                        </svg>
                                                    </div>
                                                <?php endif; ?>
                                            </div>
                                            <div class="yatra-destination-details">
                                                <h4 class="yatra-destination-name">
                                                    <?php echo esc_html($destination['name'] ?? $destination['title']); ?>
                                                </h4>
                                                <?php if (!empty($destination['short_description'] ?? $destination['excerpt'])): ?>
                                                    <p class="yatra-destination-excerpt">
                                                        <?php echo esc_html(wp_trim_words($destination['short_description'] ?? $destination['excerpt'], 10)); ?>
                                                    </p>
                                                <?php endif; ?>
                                            </div>
                                        </div>
                                    </td>
                                    <td>
                                        <div class="yatra-destination-location">
                                            <?php 
                                            $country = esc_html($destination['country_name'] ?? $destination['country'] ?? '');
                                            $region = esc_html($destination['region'] ?? $destination['location'] ?? '');
                                            if ($country || $region): ?>
                                                <div class="location-info">
                                                    <?php if ($country): ?>
                                                        <span class="country"><?php echo $country; ?></span>
                                                    <?php endif; ?>
                                                    <?php if ($region): ?>
                                                        <span class="region"><?php echo $region; ?></span>
                                                    <?php endif; ?>
                                                </div>
                                            <?php else: ?>
                                                <span class="no-location">No location set</span>
                                            <?php endif; ?>
                                        </div>
                                    </td>
                                    <td>
                                        <span class="yatra-status yatra-status-<?php echo esc_attr($destination['status']); ?>">
                                            <?php echo esc_html(ucfirst($destination['status'])); ?>
                                        </span>
                                    </td>
                                    <td>
                                        <span class="yatra-sort-order"><?php echo esc_html($destination['sort_order'] ?? $destination['order'] ?? 0); ?></span>
                                    </td>
                                    <td>
                                        <div class="yatra-actions">
                                            <button type="button" class="yatra-btn yatra-btn-sm yatra-btn-primary view-destination" data-id="<?php echo esc_attr($destination['id']); ?>" title="View Details">
                                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                    <path d="M1 12S5 4 12 4S23 12 23 12S19 20 12 20S1 12 1 12Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                                                    <path d="M12 15C13.6569 15 15 13.6569 15 12C15 10.3431 13.6569 9 12 9C10.3431 9 9 10.3431 9 12C9 13.6569 10.3431 15 12 15Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                                                </svg>
                                            </button>
                                            <button type="button" class="yatra-btn yatra-btn-sm yatra-btn-secondary edit-destination" data-id="<?php echo esc_attr($destination['id']); ?>" title="Edit Destination">
                                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                    <path d="M11 4H4C3.46957 4 2.96086 4.21071 2.58579 4.58579C2.21071 4.96086 2 5.46957 2 6V20C2 20.5304 2.21071 21.0391 2.58579 21.4142C2.96086 21.7893 3.46957 22 4 22H18C18.5304 22 19.0391 21.7893 19.4142 21.4142C19.7893 21.0391 20 20.5304 20 20V13" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                                                    <path d="M18.5 2.5C18.8978 2.10217 19.4374 1.87868 20 1.87868C20.5626 1.87868 21.1022 2.10217 21.5 2.5C21.8978 2.89782 22.1213 3.43739 22.1213 4C22.1213 4.56261 21.8978 5.10217 21.5 5.5L12 15L8 16L9 12L18.5 2.5Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                                                </svg>
                                            </button>
                                            <button type="button" class="yatra-btn yatra-btn-sm yatra-btn-danger delete-destination" data-id="<?php echo esc_attr($destination['id']); ?>" title="Delete Destination">
                                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                    <path d="M3 6H5H21M8 6V4C8 3.46957 8.21071 2.96086 8.58579 2.58579C8.96086 2.21071 9.46957 2 10 2H14C14.5304 2 15.0391 2.21071 15.4142 2.58579C15.7893 2.96086 16 3.46957 16 4V6M19 6V20C19 20.5304 18.7893 21.0391 18.4142 21.4142C18.0391 21.7893 17.5304 22 17 22H7C6.46957 22 5.96086 21.7893 5.58579 21.4142C5.21071 21.0391 5 20.5304 5 20V6H19Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                                                </svg>
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            <?php endforeach; ?>
                        <?php endif; ?>
                    </tbody>
                </table>
            </div>
        </div>
    </div>
</div>

<!-- Destination Modal -->
<div id="destination-modal" class="yatra-modal">
    <div class="yatra-modal-content">
        <div class="yatra-modal-header">
            <h3 id="destination-modal-title">Add New Destination</h3>
            <button type="button" class="yatra-modal-close" id="destination-modal-close">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
            </button>
        </div>
        <div class="yatra-modal-body">
            <form id="destination-form">
                <input type="hidden" id="destination-id" name="id" value="">
                
                <!-- Tab Navigation -->
                <div class="yatra-tab-navigation">
                    <button type="button" class="yatra-tab-btn active" data-tab="basic">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M12 2L2 7L12 12L22 7L12 2Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                            <path d="M2 17L12 22L22 17" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                            <path d="M2 12L12 17L22 12" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                        </svg>
                        Basic Info
                    </button>
                    <button type="button" class="yatra-tab-btn" data-tab="location">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M21 10C21 17 12 23 12 23S3 17 3 10C3 7.61305 3.94821 5.32387 5.63604 3.63604C7.32387 1.94821 9.61305 1 12 1C14.3869 1 16.6761 1.94821 18.364 3.63604C20.0518 5.32387 21 7.61305 21 10Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                            <path d="M12 13C13.6569 13 15 11.6569 15 10C15 8.34315 13.6569 7 12 7C10.3431 7 9 8.34315 9 10C9 11.6569 10.3431 13 12 13Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                        </svg>
                        Location
                    </button>
                    <button type="button" class="yatra-tab-btn" data-tab="travel">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M9 20L3 17V4L9 7M9 20L15 17M9 20V7M15 17L21 20V7L15 4M15 17V4M9 7L15 4" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                        </svg>
                        Travel Info
                    </button>
                    <button type="button" class="yatra-tab-btn" data-tab="climate">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M12 2V4M12 20V22M4.93 4.93L6.34 6.34M17.66 17.66L19.07 19.07M2 12H4M20 12H22M6.34 17.66L4.93 19.07M19.07 4.93L17.66 6.34" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                            <path d="M12 7C9.24 7 7 9.24 7 12C7 14.76 9.24 17 12 17C14.76 17 17 14.76 17 12C17 9.24 14.76 7 12 7Z" stroke="currentColor" stroke-width="2"/>
                        </svg>
                        Climate
                    </button>
                    <button type="button" class="yatra-tab-btn" data-tab="media">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M23 7L16 12L23 17V7Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                            <path d="M14 5H3C1.89543 5 1 5.89543 1 7V17C1 18.1046 1.89543 19 3 19H14C15.1046 19 16 18.1046 16 17V7C16 5.89543 15.1046 5 14 5Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                        </svg>
                        Media
                    </button>
                    <button type="button" class="yatra-tab-btn" data-tab="seo">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M21 21L16.514 16.506L21 21ZM19 10.5C19 15.194 15.194 19 10.5 19C5.806 19 2 15.194 2 10.5C2 5.806 5.806 2 10.5 2C15.194 2 19 5.806 19 10.5Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                        </svg>
                        SEO
                    </button>
                </div>

                <!-- Tab Content -->
                <div class="yatra-tab-content">
                    <!-- Basic Information Tab -->
                    <div class="yatra-tab-pane active" id="tab-basic">
                        <div class="yatra-form-row">
                            <div class="yatra-form-group">
                                <label for="destination-name">Name *</label>
                                <input type="text" id="destination-name" name="name" class="yatra-input" required>
                                <div class="form-desc">Enter the name of the destination (e.g., "Nepal", "Everest Base Camp", "Kathmandu Valley")</div>
                            </div>
                            <div class="yatra-form-group">
                                <label for="destination-slug">Slug</label>
                                <input type="text" id="destination-slug" name="slug" class="yatra-input">
                                <div class="form-desc">URL-friendly version of the name (auto-generated if left empty)</div>
                            </div>
                        </div>

                        <div class="yatra-form-row">
                            <div class="yatra-form-group">
                                <label for="destination-status">Status</label>
                                <select id="destination-status" name="status" class="yatra-select">
                                    <option value="active">Active</option>
                                    <option value="inactive">Inactive</option>
                                    <option value="draft">Draft</option>
                                </select>
                                <div class="form-desc">Choose whether this destination is active, inactive, or in draft mode</div>
                            </div>
                            <div class="yatra-form-group">
                                <label for="destination-sort-order">Sort Order</label>
                                <input type="number" id="destination-sort-order" name="sort_order" class="yatra-input" value="0" min="0">
                                <div class="form-desc">The order in which this destination appears in lists. Lower numbers appear first.</div>
                            </div>
                        </div>

                        <div class="yatra-form-group">
                            <label for="destination-short-description">Short Description</label>
                            <textarea id="destination-short-description" name="short_description" class="yatra-textarea" rows="3"></textarea>
                            <div class="form-desc">A brief overview of the destination (2-3 sentences). This will appear in destination lists and previews.</div>
                        </div>

                        <div class="yatra-form-group">
                            <label for="destination-description">Description</label>
                            <textarea id="destination-description" name="description" class="yatra-textarea" rows="5"></textarea>
                            <div class="form-desc">Detailed information about the destination including attractions, culture, history, and what makes it special.</div>
                        </div>
                    </div>

                    <!-- Location Information Tab -->
                    <div class="yatra-tab-pane" id="tab-location">
                        <div class="yatra-form-row">
                                                            <div class="yatra-form-group">
                                    <label for="destination-country">Country</label>
                                    <select id="destination-country" name="country" class="yatra-input" required>
                                        <option value="">Select a country</option>
                                        <option value="AF">Afghanistan</option>
                                        <option value="AL">Albania</option>
                                        <option value="DZ">Algeria</option>
                                        <option value="AD">Andorra</option>
                                        <option value="AO">Angola</option>
                                        <option value="AG">Antigua and Barbuda</option>
                                        <option value="AR">Argentina</option>
                                        <option value="AM">Armenia</option>
                                        <option value="AU">Australia</option>
                                        <option value="AT">Austria</option>
                                        <option value="AZ">Azerbaijan</option>
                                        <option value="BS">Bahamas</option>
                                        <option value="BH">Bahrain</option>
                                        <option value="BD">Bangladesh</option>
                                        <option value="BB">Barbados</option>
                                        <option value="BY">Belarus</option>
                                        <option value="BE">Belgium</option>
                                        <option value="BZ">Belize</option>
                                        <option value="BJ">Benin</option>
                                        <option value="BT">Bhutan</option>
                                        <option value="BO">Bolivia</option>
                                        <option value="BA">Bosnia and Herzegovina</option>
                                        <option value="BW">Botswana</option>
                                        <option value="BR">Brazil</option>
                                        <option value="BN">Brunei</option>
                                        <option value="BG">Bulgaria</option>
                                        <option value="BF">Burkina Faso</option>
                                        <option value="BI">Burundi</option>
                                        <option value="CV">Cabo Verde</option>
                                        <option value="KH">Cambodia</option>
                                        <option value="CM">Cameroon</option>
                                        <option value="CA">Canada</option>
                                        <option value="CF">Central African Republic</option>
                                        <option value="TD">Chad</option>
                                        <option value="CL">Chile</option>
                                        <option value="CN">China</option>
                                        <option value="CO">Colombia</option>
                                        <option value="KM">Comoros</option>
                                        <option value="CG">Congo</option>
                                        <option value="CR">Costa Rica</option>
                                        <option value="HR">Croatia</option>
                                        <option value="CU">Cuba</option>
                                        <option value="CY">Cyprus</option>
                                        <option value="CZ">Czech Republic</option>
                                        <option value="CD">Democratic Republic of the Congo</option>
                                        <option value="DK">Denmark</option>
                                        <option value="DJ">Djibouti</option>
                                        <option value="DM">Dominica</option>
                                        <option value="DO">Dominican Republic</option>
                                        <option value="TL">East Timor</option>
                                        <option value="EC">Ecuador</option>
                                        <option value="EG">Egypt</option>
                                        <option value="SV">El Salvador</option>
                                        <option value="GQ">Equatorial Guinea</option>
                                        <option value="ER">Eritrea</option>
                                        <option value="EE">Estonia</option>
                                        <option value="SZ">Eswatini</option>
                                        <option value="ET">Ethiopia</option>
                                        <option value="FJ">Fiji</option>
                                        <option value="FI">Finland</option>
                                        <option value="FR">France</option>
                                        <option value="GA">Gabon</option>
                                        <option value="GM">Gambia</option>
                                        <option value="GE">Georgia</option>
                                        <option value="DE">Germany</option>
                                        <option value="GH">Ghana</option>
                                        <option value="GR">Greece</option>
                                        <option value="GD">Grenada</option>
                                        <option value="GT">Guatemala</option>
                                        <option value="GN">Guinea</option>
                                        <option value="GW">Guinea-Bissau</option>
                                        <option value="GY">Guyana</option>
                                        <option value="HT">Haiti</option>
                                        <option value="HN">Honduras</option>
                                        <option value="HU">Hungary</option>
                                        <option value="IS">Iceland</option>
                                        <option value="IN">India</option>
                                        <option value="ID">Indonesia</option>
                                        <option value="IR">Iran</option>
                                        <option value="IQ">Iraq</option>
                                        <option value="IE">Ireland</option>
                                        <option value="IL">Israel</option>
                                        <option value="IT">Italy</option>
                                        <option value="CI">Ivory Coast</option>
                                        <option value="JM">Jamaica</option>
                                        <option value="JP">Japan</option>
                                        <option value="JO">Jordan</option>
                                        <option value="KZ">Kazakhstan</option>
                                        <option value="KE">Kenya</option>
                                        <option value="KI">Kiribati</option>
                                        <option value="KW">Kuwait</option>
                                        <option value="KG">Kyrgyzstan</option>
                                        <option value="LA">Laos</option>
                                        <option value="LV">Latvia</option>
                                        <option value="LB">Lebanon</option>
                                        <option value="LS">Lesotho</option>
                                        <option value="LR">Liberia</option>
                                        <option value="LY">Libya</option>
                                        <option value="LI">Liechtenstein</option>
                                        <option value="LT">Lithuania</option>
                                        <option value="LU">Luxembourg</option>
                                        <option value="MG">Madagascar</option>
                                        <option value="MW">Malawi</option>
                                        <option value="MY">Malaysia</option>
                                        <option value="MV">Maldives</option>
                                        <option value="ML">Mali</option>
                                        <option value="MT">Malta</option>
                                        <option value="MH">Marshall Islands</option>
                                        <option value="MR">Mauritania</option>
                                        <option value="MU">Mauritius</option>
                                        <option value="MX">Mexico</option>
                                        <option value="FM">Micronesia</option>
                                        <option value="MD">Moldova</option>
                                        <option value="MC">Monaco</option>
                                        <option value="MN">Mongolia</option>
                                        <option value="ME">Montenegro</option>
                                        <option value="MA">Morocco</option>
                                        <option value="MZ">Mozambique</option>
                                        <option value="MM">Myanmar</option>
                                        <option value="NA">Namibia</option>
                                        <option value="NR">Nauru</option>
                                        <option value="NP">Nepal</option>
                                        <option value="NL">Netherlands</option>
                                        <option value="NZ">New Zealand</option>
                                        <option value="NI">Nicaragua</option>
                                        <option value="NE">Niger</option>
                                        <option value="NG">Nigeria</option>
                                        <option value="KP">North Korea</option>
                                        <option value="MK">North Macedonia</option>
                                        <option value="NO">Norway</option>
                                        <option value="OM">Oman</option>
                                        <option value="PK">Pakistan</option>
                                        <option value="PW">Palau</option>
                                        <option value="PS">Palestine</option>
                                        <option value="PA">Panama</option>
                                        <option value="PG">Papua New Guinea</option>
                                        <option value="PY">Paraguay</option>
                                        <option value="PE">Peru</option>
                                        <option value="PH">Philippines</option>
                                        <option value="PL">Poland</option>
                                        <option value="PT">Portugal</option>
                                        <option value="QA">Qatar</option>
                                        <option value="RO">Romania</option>
                                        <option value="RU">Russia</option>
                                        <option value="RW">Rwanda</option>
                                        <option value="KN">Saint Kitts and Nevis</option>
                                        <option value="LC">Saint Lucia</option>
                                        <option value="VC">Saint Vincent and the Grenadines</option>
                                        <option value="WS">Samoa</option>
                                        <option value="SM">San Marino</option>
                                        <option value="ST">Sao Tome and Principe</option>
                                        <option value="SA">Saudi Arabia</option>
                                        <option value="SN">Senegal</option>
                                        <option value="RS">Serbia</option>
                                        <option value="SC">Seychelles</option>
                                        <option value="SL">Sierra Leone</option>
                                        <option value="SG">Singapore</option>
                                        <option value="SK">Slovakia</option>
                                        <option value="SI">Slovenia</option>
                                        <option value="SB">Solomon Islands</option>
                                        <option value="SO">Somalia</option>
                                        <option value="ZA">South Africa</option>
                                        <option value="KR">South Korea</option>
                                        <option value="SS">South Sudan</option>
                                        <option value="ES">Spain</option>
                                        <option value="LK">Sri Lanka</option>
                                        <option value="SD">Sudan</option>
                                        <option value="SR">Suriname</option>
                                        <option value="SE">Sweden</option>
                                        <option value="CH">Switzerland</option>
                                        <option value="SY">Syria</option>
                                        <option value="TW">Taiwan</option>
                                        <option value="TJ">Tajikistan</option>
                                        <option value="TZ">Tanzania</option>
                                        <option value="TH">Thailand</option>
                                        <option value="TG">Togo</option>
                                        <option value="TO">Tonga</option>
                                        <option value="TT">Trinidad and Tobago</option>
                                        <option value="TN">Tunisia</option>
                                        <option value="TR">Turkey</option>
                                        <option value="TM">Turkmenistan</option>
                                        <option value="TV">Tuvalu</option>
                                        <option value="UG">Uganda</option>
                                        <option value="UA">Ukraine</option>
                                        <option value="AE">United Arab Emirates</option>
                                        <option value="GB">United Kingdom</option>
                                        <option value="US">United States</option>
                                        <option value="UY">Uruguay</option>
                                        <option value="UZ">Uzbekistan</option>
                                        <option value="VU">Vanuatu</option>
                                        <option value="VA">Vatican City</option>
                                        <option value="VE">Venezuela</option>
                                        <option value="VN">Vietnam</option>
                                        <option value="YE">Yemen</option>
                                        <option value="ZM">Zambia</option>
                                        <option value="ZW">Zimbabwe</option>
                                    </select>
                                    <div class="form-desc">Select the country where this destination is located (using ISO 3166-1 alpha-2 country codes)</div>
                                </div>
                            <div class="yatra-form-group">
                                <label for="destination-region">Region</label>
                                <input type="text" id="destination-region" name="region" class="yatra-input">
                                <div class="form-desc">The specific region or area within the country (e.g., "Himalayas", "Kathmandu Valley", "Pokhara")</div>
                            </div>
                        </div>

                        <div class="yatra-form-row">
                            <div class="yatra-form-group">
                                <label for="destination-latitude">Latitude</label>
                                <input type="number" id="destination-latitude" name="latitude" class="yatra-input" step="0.00000001" min="-90" max="90">
                                <div class="form-desc">Geographic latitude coordinate (e.g., 27.7172 for Kathmandu)</div>
                            </div>
                            <div class="yatra-form-group">
                                <label for="destination-longitude">Longitude</label>
                                <input type="number" id="destination-longitude" name="longitude" class="yatra-input" step="0.00000001" min="-180" max="180">
                                <div class="form-desc">Geographic longitude coordinate (e.g., 85.3240 for Kathmandu)</div>
                            </div>
                        </div>

                        <div class="yatra-form-row">
                            <div class="yatra-form-group">
                                <label for="destination-elevation">Elevation (meters)</label>
                                <input type="number" id="destination-elevation" name="elevation" class="yatra-input" min="0">
                                <div class="form-desc">Elevation above sea level in meters (e.g., 1400 for Kathmandu)</div>
                            </div>
                            <div class="yatra-form-group">
                                <label for="destination-timezone">Timezone</label>
                                <input type="text" id="destination-timezone" name="timezone" class="yatra-input" placeholder="UTC">
                                <div class="form-desc">The timezone of the destination (e.g., "Asia/Kathmandu", "UTC+5:45")</div>
                            </div>
                        </div>
                    </div>

                    <!-- Travel Information Tab -->
                    <div class="yatra-tab-pane" id="tab-travel">
                        <div class="yatra-form-group">
                            <label for="destination-visa-requirements">Visa Requirements</label>
                            <textarea id="destination-visa-requirements" name="visa_requirements" class="yatra-textarea" rows="4"></textarea>
                            <div class="form-desc">Information about visa requirements, application process, and costs for different nationalities.</div>
                        </div>

                        <div class="yatra-form-group">
                            <label>Emergency Contacts</label>
                            <div class="yatra-emergency-contacts" id="emergency-contacts-container">
                                <!-- Dynamic emergency contacts will be added here -->
                            </div>
                            <button type="button" class="yatra-btn yatra-btn-secondary yatra-btn-sm" id="add-emergency-contact">
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M12 5V19M5 12H19" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                                </svg>
                                Add Emergency Contact
                            </button>
                            <div class="form-desc">Add emergency contact numbers for different services</div>
                        </div>
                    </div>

                    <!-- Climate & Best Time Tab -->
                    <div class="yatra-tab-pane" id="tab-climate">
                        <div class="yatra-form-group">
                            <label>Climate Information</label>
                            <div class="yatra-climate-info" id="climate-info-container">
                                <!-- Dynamic climate info will be added here -->
                            </div>
                            <button type="button" class="yatra-btn yatra-btn-secondary yatra-btn-sm" id="add-climate-info">
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M12 5V19M5 12H19" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                                </svg>
                                Add Climate Season
                            </button>
                            <div class="form-desc">Add climate details for different seasons with temperature ranges and conditions</div>
                        </div>

                        <div class="yatra-form-group">
                            <label>Best Time to Visit</label>
                            <div class="yatra-best-time" id="best-time-container">
                                <!-- Dynamic best time info will be added here -->
                            </div>
                            <button type="button" class="yatra-btn yatra-btn-secondary yatra-btn-sm" id="add-best-time">
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M12 5V19M5 12H19" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                                </svg>
                                Add Best Time Period
                            </button>
                            <div class="form-desc">Add best time periods to visit and reasons why</div>
                        </div>
                    </div>

                    <!-- Media Tab -->
                    <div class="yatra-tab-pane" id="tab-media">
                        <div class="yatra-form-group">
                            <label for="destination-featured-image">Featured Image URL</label>
                            <input type="url" id="destination-featured-image" name="featured_image" class="yatra-input" placeholder="https://example.com/image.jpg">
                            <div class="form-desc">URL of the main featured image for this destination</div>
                        </div>

                        <div class="yatra-form-group">
                            <label>Gallery Images</label>
                            <div class="yatra-gallery-images" id="gallery-images-container">
                                <!-- Dynamic gallery images will be added here -->
                            </div>
                            <button type="button" class="yatra-btn yatra-btn-secondary yatra-btn-sm" id="add-gallery-image">
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M12 5V19M5 12H19" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                                </svg>
                                Add Gallery Image
                            </button>
                            <div class="form-desc">Add URLs for destination gallery images</div>
                        </div>
                    </div>

                    <!-- SEO Information Tab -->
                    <div class="yatra-tab-pane" id="tab-seo">
                        <div class="yatra-form-group">
                            <label for="destination-seo-title">SEO Title</label>
                            <input type="text" id="destination-seo-title" name="seo_title" class="yatra-input">
                            <div class="form-desc">Custom title for search engines (leave empty to use destination name)</div>
                        </div>

                        <div class="yatra-form-group">
                            <label for="destination-seo-description">SEO Description</label>
                            <textarea id="destination-seo-description" name="seo_description" class="yatra-textarea" rows="3"></textarea>
                            <div class="form-desc">Meta description for search engines (150-160 characters recommended)</div>
                        </div>

                        <div class="yatra-form-group">
                            <label for="destination-seo-keywords">SEO Keywords</label>
                            <textarea id="destination-seo-keywords" name="seo_keywords" class="yatra-textarea" rows="2"></textarea>
                            <div class="form-desc">Comma-separated keywords for search engine optimization</div>
                        </div>
                    </div>
                </div>
            </form>
        </div>
        <div class="yatra-modal-footer">
            <button type="button" class="yatra-btn yatra-btn-secondary" id="destination-modal-cancel">Cancel</button>
            <button type="button" class="yatra-btn yatra-btn-primary" id="destination-modal-save">Save Destination</button>
        </div>
    </div>
</div>

<script>
jQuery(document).ready(function($) {
    let destinations = <?php echo json_encode($destinations); ?>;
    let currentDestination = null;

    // Add destination button
    $('#add-destination-btn, #add-first-destination-btn').on('click', function() {
        openDestinationModal();
    });

    // Modal close button
    $('#destination-modal-close, #destination-modal-cancel').on('click', function() {
        closeDestinationModal();
    });

    // Save destination
    $('#destination-modal-save').on('click', function() {
        saveDestination();
    });

    // Tab switching functionality
    $('.yatra-tab-btn').on('click', function() {
        const tabId = $(this).data('tab');
        
        // Remove active class from all tabs and panes
        $('.yatra-tab-btn').removeClass('active');
        $('.yatra-tab-pane').removeClass('active');
        
        // Add active class to clicked tab and corresponding pane
        $(this).addClass('active');
        $('#tab-' + tabId).addClass('active');
    });

    // Dynamic field functionality
    let emergencyContactCounter = 0;
    let climateInfoCounter = 0;
    let bestTimeCounter = 0;
    let galleryImageCounter = 0;

    // Add Emergency Contact
    $('#add-emergency-contact').on('click', function() {
        const contactId = 'emergency-contact-' + emergencyContactCounter++;
        const contactHtml = `
            <div class="yatra-dynamic-field" data-id="${contactId}">
                <div class="yatra-form-row">
                    <div class="yatra-form-group">
                        <label for="${contactId}-type">Contact Type</label>
                        <input type="text" id="${contactId}-type" name="${contactId}-type" class="yatra-input" placeholder="Police, Ambulance, Fire, Embassy">
                    </div>
                    <div class="yatra-form-group">
                        <label for="${contactId}-number">Contact Number</label>
                        <input type="text" id="${contactId}-number" name="${contactId}-number" class="yatra-input" placeholder="100, 102, 101, +977-1-4411666">
                    </div>
                    <div class="yatra-form-group" style="flex: 0 0 auto;">
                        <button type="button" class="yatra-btn yatra-btn-danger yatra-btn-sm remove-field" data-target="${contactId}">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                            </svg>
                        </button>
                    </div>
                </div>
            </div>
        `;
        $('#emergency-contacts-container').append(contactHtml);
    });

    // Add Climate Info
    $('#add-climate-info').on('click', function() {
        const climateId = 'climate-info-' + climateInfoCounter++;
        const climateHtml = `
            <div class="yatra-dynamic-field" data-id="${climateId}">
                <div class="yatra-form-row">
                    <div class="yatra-form-group">
                        <label for="${climateId}-season">Season</label>
                        <input type="text" id="${climateId}-season" name="${climateId}-season" class="yatra-input" placeholder="Spring, Summer, Autumn, Winter">
                    </div>
                    <div class="yatra-form-group">
                        <label for="${climateId}-description">Climate Description</label>
                        <input type="text" id="${climateId}-description" name="${climateId}-description" class="yatra-input" placeholder="15-25°C, pleasant weather">
                    </div>
                    <div class="yatra-form-group" style="flex: 0 0 auto;">
                        <button type="button" class="yatra-btn yatra-btn-danger yatra-btn-sm remove-field" data-target="${climateId}">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                            </svg>
                        </button>
                    </div>
                </div>
            </div>
        `;
        $('#climate-info-container').append(climateHtml);
    });

    // Add Best Time
    $('#add-best-time').on('click', function() {
        const bestTimeId = 'best-time-' + bestTimeCounter++;
        const bestTimeHtml = `
            <div class="yatra-dynamic-field" data-id="${bestTimeId}">
                <div class="yatra-form-row">
                    <div class="yatra-form-group">
                        <label for="${bestTimeId}-months">Best Months</label>
                        <input type="text" id="${bestTimeId}-months" name="${bestTimeId}-months" class="yatra-input" placeholder="March-May, September-November">
                    </div>
                    <div class="yatra-form-group">
                        <label for="${bestTimeId}-reason">Why Visit Then</label>
                        <input type="text" id="${bestTimeId}-reason" name="${bestTimeId}-reason" class="yatra-input" placeholder="Clear weather, good visibility">
                    </div>
                    <div class="yatra-form-group" style="flex: 0 0 auto;">
                        <button type="button" class="yatra-btn yatra-btn-danger yatra-btn-sm remove-field" data-target="${bestTimeId}">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                            </svg>
                        </button>
                    </div>
                </div>
            </div>
        `;
        $('#best-time-container').append(bestTimeHtml);
    });

    // Add Gallery Image
    $('#add-gallery-image').on('click', function() {
        const galleryId = 'gallery-image-' + galleryImageCounter++;
        const galleryHtml = `
            <div class="yatra-dynamic-field" data-id="${galleryId}">
                <div class="yatra-form-row">
                    <div class="yatra-form-group">
                        <label for="${galleryId}-url">Image URL</label>
                        <input type="url" id="${galleryId}-url" name="${galleryId}-url" class="yatra-input" placeholder="https://example.com/image.jpg">
                    </div>
                    <div class="yatra-form-group" style="flex: 0 0 auto;">
                        <button type="button" class="yatra-btn yatra-btn-danger yatra-btn-sm remove-field" data-target="${galleryId}">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                            </svg>
                        </button>
                    </div>
                </div>
            </div>
        `;
        $('#gallery-images-container').append(galleryHtml);
    });

    // Remove dynamic field
    $(document).on('click', '.remove-field', function() {
        const targetId = $(this).data('target');
        $('[data-id="' + targetId + '"]').remove();
    });

    // Status filter functionality
    $('.yatra-status-filter').on('click', function() {
        $('.yatra-status-filter').removeClass('active');
        $(this).addClass('active');
        const status = $(this).data('status');
        filterDestinations($('#destination-search').val().toLowerCase(), status);
    });

    // Search functionality (update to work with status filter)
    $('#destination-search').on('input', function() {
        const searchTerm = $(this).val().toLowerCase();
        const status = $('.yatra-status-filter.active').data('status');
        filterDestinations(searchTerm, status);
    });

    // Filter function (search + status)
    function filterDestinations(searchTerm = '', status = 'all') {
        const filtered = destinations.filter(function(destination) {
            const name = (destination.name || destination.title || '').toLowerCase();
            const country = (destination.country || '').toLowerCase();
            const region = (destination.region || destination.location || '').toLowerCase();
            const description = (destination.short_description || destination.excerpt || '').toLowerCase();
            const matchesSearch = name.includes(searchTerm) || country.includes(searchTerm) || region.includes(searchTerm) || description.includes(searchTerm);
            const matchesStatus = (status === 'all') ? true : (destination.status === status);
            return matchesSearch && matchesStatus;
        });
        renderDestinationsTable(filtered);
    }

    // Bind view, edit and delete events for existing rows
    $('.edit-destination').on('click', function() {
        const id = $(this).data('id');
        editDestination(id);
    });

    $('.delete-destination').on('click', function() {
        const id = $(this).data('id');
        deleteDestination(id);
    });

    $('.view-destination').on('click', function() {
        const id = $(this).data('id');
        viewDestination(id);
    });

    function renderDestinationsTable(destinationsToRender = destinations) {
        const tbody = $('#destinations-tbody');
        tbody.empty();

        if (destinationsToRender.length === 0) {
            tbody.html(`
                <tr>
                    <td colspan="5" class="yatra-empty-state">
                        <div class="empty-state">
                            <div class="empty-icon">
                                <svg width="64" height="64" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M21 10C21 17 12 23 12 23S3 17 3 10C3 7.61305 3.94821 5.32387 5.63604 3.63604C7.32387 1.94821 9.61305 1 12 1C14.3869 1 16.6761 1.94821 18.364 3.63604C20.0518 5.32387 21 7.61305 21 10Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                                    <path d="M12 13C13.6569 13 15 11.6569 15 10C15 8.34315 13.6569 7 12 7C10.3431 7 9 8.34315 9 10C9 11.6569 10.3431 13 12 13Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                                </svg>
                            </div>
                            <h4>No Destinations Found</h4>
                            <p>No destinations match your search criteria.</p>
                        </div>
                    </td>
                </tr>
            `);
            return;
        }

        destinationsToRender.forEach(function(destination) {
            const row = `
                <tr data-id="${destination.id}">
                    <td>
                        <div class="yatra-destination-info">
                            <div class="yatra-destination-image">
                                ${destination.featured_image ? 
                                    `<img src="${destination.featured_image}" alt="${destination.name || destination.title}">` :
                                    `<div class="yatra-destination-placeholder">
                                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                            <path d="M21 10C21 17 12 23 12 23S3 17 3 10C3 7.61305 3.94821 5.32387 5.63604 3.63604C7.32387 1.94821 9.61305 1 12 1C14.3869 1 16.6761 1.94821 18.364 3.63604C20.0518 5.32387 21 7.61305 21 10Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                                            <path d="M12 13C13.6569 13 15 11.6569 15 10C15 8.34315 13.6569 7 12 7C10.3431 7 9 8.34315 9 10C9 11.6569 10.3431 13 12 13Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                                        </svg>
                                    </div>`
                                }
                            </div>
                            <div class="yatra-destination-details">
                                <h4 class="yatra-destination-name">${destination.name || destination.title}</h4>
                                ${destination.short_description || destination.excerpt ? 
                                    `<p class="yatra-destination-excerpt">${(destination.short_description || destination.excerpt).substring(0, 60)}${(destination.short_description || destination.excerpt).length > 60 ? '...' : ''}</p>` : 
                                    ''
                                }
                            </div>
                        </div>
                    </td>
                    <td>
                        <div class="yatra-destination-location">
                            ${destination.country || destination.region || destination.location ? 
                                `<div class="location-info">
                                    ${destination.country ? `<span class="country">${destination.country}</span>` : ''}
                                    ${destination.region || destination.location ? `<span class="region">${destination.region || destination.location}</span>` : ''}
                                </div>` : 
                                '<span class="no-location">No location set</span>'
                            }
                        </div>
                    </td>
                    <td>
                        <span class="yatra-status yatra-status-${destination.status}">${destination.status.charAt(0).toUpperCase() + destination.status.slice(1)}</span>
                    </td>
                    <td>
                        <span class="yatra-sort-order">${destination.sort_order || destination.order || 0}</span>
                    </td>
                    <td>
                        <div class="yatra-actions">
                            <button type="button" class="yatra-btn yatra-btn-sm yatra-btn-primary view-destination" data-id="${destination.id}" title="View Details">
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M1 12S5 4 12 4S23 12 23 12S19 20 12 20S1 12 1 12Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                                    <path d="M12 15C13.6569 15 15 13.6569 15 12C15 10.3431 13.6569 9 12 9C10.3431 9 9 10.3431 9 12C9 13.6569 10.3431 15 12 15Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                                </svg>
                            </button>
                            <button type="button" class="yatra-btn yatra-btn-sm yatra-btn-secondary edit-destination" data-id="${destination.id}" title="Edit Destination">
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M11 4H4C3.46957 4 2.96086 4.21071 2.58579 4.58579C2.21071 4.96086 2 5.46957 2 6V20C2 20.5304 2.21071 21.0391 2.58579 21.4142C2.96086 21.7893 3.46957 22 4 22H18C18.5304 22 19.0391 21.7893 19.4142 21.4142C19.7893 21.0391 20 20.5304 20 20V13" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                                    <path d="M18.5 2.5C18.8978 2.10217 19.4374 1.87868 20 1.87868C20.5626 1.87868 21.1022 2.10217 21.5 2.5C21.8978 2.89782 22.1213 3.43739 22.1213 4C22.1213 4.56261 21.8978 5.10217 21.5 5.5L12 15L8 16L9 12L18.5 2.5Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                                </svg>
                            </button>
                            <button type="button" class="yatra-btn yatra-btn-sm yatra-btn-danger delete-destination" data-id="${destination.id}" title="Delete Destination">
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M3 6H5H21M8 6V4C8 3.46957 8.21071 2.96086 8.58579 2.58579C8.96086 2.21071 9.46957 2 10 2H14C14.5304 2 15.0391 2.21071 15.4142 2.58579C15.7893 2.96086 16 3.46957 16 4V6M19 6V20C19 20.5304 18.7893 21.0391 18.4142 21.4142C18.0391 21.7893 17.5304 22 17 22H7C6.46957 22 5.96086 21.7893 5.58579 21.4142C5.21071 21.0391 5 20.5304 5 20V6H19Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                                </svg>
                            </button>
                        </div>
                    </td>
                </tr>
            `;
            tbody.append(row);
        });

        // Re-bind edit and delete events
        $('.edit-destination').on('click', function() {
            const id = $(this).data('id');
            editDestination(id);
        });

        $('.delete-destination').on('click', function() {
            const id = $(this).data('id');
            deleteDestination(id);
        });

        $('.view-destination').on('click', function() {
            const id = $(this).data('id');
            viewDestination(id);
        });
    }

    function viewDestination(id) {
        const destination = destinations.find(d => d.id == id);
        if (destination) {
            // Open destination details in a new window or modal
            window.open('<?php echo admin_url('admin.php?page=yatra-app&subpage=destinations&action=view&id='); ?>' + id, '_blank');
        }
    }

    function openDestinationModal(destination = null) {
        currentDestination = destination;
        const isEdit = destination !== null;
        
        // Clear all dynamic fields first
        $('#emergency-contacts-container').empty();
        $('#climate-info-container').empty();
        $('#best-time-container').empty();
        $('#gallery-images-container').empty();
        
        // Reset counters
        emergencyContactCounter = 0;
        climateInfoCounter = 0;
        bestTimeCounter = 0;
        galleryImageCounter = 0;
        
        $('#destination-modal-title').text(isEdit ? 'Edit Destination' : 'Add New Destination');
        $('#destination-id').val(isEdit ? destination.id : '');
        
        if (isEdit) {
            console.log('Loading destination data:', destination);
            
            // Populate form with destination data
            $('#destination-name').val(destination.name || destination.title);
            $('#destination-slug').val(destination.slug);
            $('#destination-status').val(destination.status);
            $('#destination-country').val(destination.country || destination.country_code);
            $('#destination-region').val(destination.region || destination.location);
            $('#destination-short-description').val(destination.short_description || destination.excerpt);
            $('#destination-description').val(destination.description || destination.content);
            $('#destination-sort-order').val(destination.sort_order || destination.order || 0);
            $('#destination-timezone').val(destination.timezone || destination.time_zone);
            $('#destination-latitude').val(destination.latitude || destination.lat);
            $('#destination-longitude').val(destination.longitude || destination.lng);
            $('#destination-elevation').val(destination.elevation || destination.height);
            $('#destination-visa-requirements').val(destination.visa_requirements || destination.visa);
            $('#destination-featured-image').val(destination.featured_image || destination.image);
            $('#destination-seo-title').val(destination.seo_title || destination.meta_title);
            $('#destination-seo-description').val(destination.seo_description || destination.meta_description);
            $('#destination-seo-keywords').val(destination.seo_keywords || destination.meta_keywords);
            
            // Handle emergency contacts
            const emergencyContacts = destination.emergency_contacts || destination.emergency || {};
            console.log('Emergency contacts:', emergencyContacts);
            if (typeof emergencyContacts === 'object' && Object.keys(emergencyContacts).length > 0) {
                Object.keys(emergencyContacts).forEach((type, index) => {
                    const contactId = 'emergency-contact-' + index;
                    const contactHtml = `
                        <div class="yatra-dynamic-field" data-id="${contactId}">
                            <div class="yatra-form-row">
                                <div class="yatra-form-group">
                                    <label for="${contactId}-type">Contact Type</label>
                                    <input type="text" id="${contactId}-type" name="${contactId}-type" class="yatra-input" value="${type}" placeholder="Police, Ambulance, Fire, Embassy">
                                </div>
                                <div class="yatra-form-group">
                                    <label for="${contactId}-number">Contact Number</label>
                                    <input type="text" id="${contactId}-number" name="${contactId}-number" class="yatra-input" value="${emergencyContacts[type]}" placeholder="100, 102, 101, +977-1-4411666">
                                </div>
                                <div class="yatra-form-group" style="flex: 0 0 auto;">
                                    <button type="button" class="yatra-btn yatra-btn-danger yatra-btn-sm remove-field" data-target="${contactId}">
                                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                            <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                                        </svg>
                                    </button>
                                </div>
                            </div>
                        </div>
                    `;
                    $('#emergency-contacts-container').append(contactHtml);
                });
                emergencyContactCounter = Object.keys(emergencyContacts).length;
            }
            
            // Handle climate info
            const climateInfo = destination.climate_info || destination.weather || {};
            console.log('Climate info:', climateInfo);
            if (typeof climateInfo === 'object' && Object.keys(climateInfo).length > 0) {
                Object.keys(climateInfo).forEach((season, index) => {
                    const climateId = 'climate-info-' + index;
                    const climateHtml = `
                        <div class="yatra-dynamic-field" data-id="${climateId}">
                            <div class="yatra-form-row">
                                <div class="yatra-form-group">
                                    <label for="${climateId}-season">Season</label>
                                    <input type="text" id="${climateId}-season" name="${climateId}-season" class="yatra-input" value="${season}" placeholder="Spring, Summer, Autumn, Winter">
                                </div>
                                <div class="yatra-form-group">
                                    <label for="${climateId}-description">Climate Description</label>
                                    <input type="text" id="${climateId}-description" name="${climateId}-description" class="yatra-input" value="${climateInfo[season]}" placeholder="15-25°C, pleasant weather">
                                </div>
                                <div class="yatra-form-group" style="flex: 0 0 auto;">
                                    <button type="button" class="yatra-btn yatra-btn-danger yatra-btn-sm remove-field" data-target="${climateId}">
                                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                            <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                                        </svg>
                                    </button>
                                </div>
                            </div>
                        </div>
                    `;
                    $('#climate-info-container').append(climateHtml);
                });
                climateInfoCounter = Object.keys(climateInfo).length;
            }
            
            // Handle best time to visit
            const bestTimeToVisit = destination.best_time_to_visit || destination.best_season || {};
            console.log('Best time to visit:', bestTimeToVisit);
            if (typeof bestTimeToVisit === 'object') {
                if (bestTimeToVisit.months && Array.isArray(bestTimeToVisit.months)) {
                    bestTimeToVisit.months.forEach((months, index) => {
                        const bestTimeId = 'best-time-' + index;
                        const bestTimeHtml = `
                            <div class="yatra-dynamic-field" data-id="${bestTimeId}">
                                <div class="yatra-form-row">
                                    <div class="yatra-form-group">
                                        <label for="${bestTimeId}-months">Best Months</label>
                                        <input type="text" id="${bestTimeId}-months" name="${bestTimeId}-months" class="yatra-input" value="${months}" placeholder="March-May, September-November">
                                    </div>
                                    <div class="yatra-form-group">
                                        <label for="${bestTimeId}-reason">Why Visit Then</label>
                                        <input type="text" id="${bestTimeId}-reason" name="${bestTimeId}-reason" class="yatra-input" value="${bestTimeToVisit.reason || ''}" placeholder="Clear weather, good visibility">
                                    </div>
                                    <div class="yatra-form-group" style="flex: 0 0 auto;">
                                        <button type="button" class="yatra-btn yatra-btn-danger yatra-btn-sm remove-field" data-target="${bestTimeId}">
                                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                                            </svg>
                                        </button>
                                    </div>
                                </div>
                            </div>
                        `;
                        $('#best-time-container').append(bestTimeHtml);
                    });
                    bestTimeCounter = bestTimeToVisit.months.length;
                }
            }
            
            // Handle gallery images
            const gallery = destination.gallery || destination.images || [];
            console.log('Gallery images:', gallery);
            if (Array.isArray(gallery) && gallery.length > 0) {
                gallery.forEach((imageUrl, index) => {
                    const galleryId = 'gallery-image-' + index;
                    const galleryHtml = `
                        <div class="yatra-dynamic-field" data-id="${galleryId}">
                            <div class="yatra-form-row">
                                <div class="yatra-form-group">
                                    <label for="${galleryId}-url">Image URL</label>
                                    <input type="url" id="${galleryId}-url" name="${galleryId}-url" class="yatra-input" value="${imageUrl}" placeholder="https://example.com/image.jpg">
                                </div>
                                <div class="yatra-form-group" style="flex: 0 0 auto;">
                                    <button type="button" class="yatra-btn yatra-btn-danger yatra-btn-sm remove-field" data-target="${galleryId}">
                                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                            <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                                        </svg>
                                    </button>
                                </div>
                            </div>
                        </div>
                    `;
                    $('#gallery-images-container').append(galleryHtml);
                });
                galleryImageCounter = gallery.length;
            }
        } else {
            // Clear form
            $('#destination-form')[0].reset();
            $('#destination-id').val('');
            $('#destination-sort-order').val('0');
        }
        
        $('#destination-modal').addClass('yatra-modal-open');
    }

    function closeDestinationModal() {
        $('#destination-modal').removeClass('yatra-modal-open');
        currentDestination = null;
    }

    function saveDestination() {
        const formData = new FormData($('#destination-form')[0]);
        
        // Convert dynamic fields to JSON before sending
        const emergencyContacts = {};
        $('.yatra-emergency-contacts .yatra-dynamic-field').each(function() {
            const type = $(this).find('input[name$="-type"]').val();
            const number = $(this).find('input[name$="-number"]').val();
            if (type && number) {
                emergencyContacts[type] = number;
            }
        });
        
        const climateInfo = {};
        $('.yatra-climate-info .yatra-dynamic-field').each(function() {
            const season = $(this).find('input[name$="-season"]').val();
            const description = $(this).find('input[name$="-description"]').val();
            if (season && description) {
                climateInfo[season] = description;
            }
        });
        
        const bestTimeToVisit = {
            months: [],
            reason: ''
        };
        $('.yatra-best-time .yatra-dynamic-field').each(function() {
            const months = $(this).find('input[name$="-months"]').val();
            const reason = $(this).find('input[name$="-reason"]').val();
            if (months) {
                bestTimeToVisit.months.push(months);
            }
            if (reason) {
                bestTimeToVisit.reason = reason;
            }
        });
        
        const gallery = [];
        $('.yatra-gallery-images .yatra-dynamic-field').each(function() {
            const imageUrl = $(this).find('input[name$="-url"]').val();
            if (imageUrl) {
                gallery.push(imageUrl);
            }
        });
        
        console.log('Saving data:', {
            emergencyContacts,
            climateInfo,
            bestTimeToVisit,
            gallery
        });
        
        // Remove all dynamic field data
        $('.yatra-dynamic-field input').each(function() {
            formData.delete($(this).attr('name'));
        });
        
        formData.append('emergency_contacts', JSON.stringify(emergencyContacts));
        formData.append('climate_info', JSON.stringify(climateInfo));
        formData.append('best_time_to_visit', JSON.stringify(bestTimeToVisit));
        formData.append('gallery', JSON.stringify(gallery));
        
        formData.append('action', 'yatra_save_destination');
        formData.append('nonce', yatraAdmin.nonce);

        $.ajax({
            url: yatraAdmin.ajaxUrl,
            type: 'POST',
            data: formData,
            processData: false,
            contentType: false,
            success: function(response) {
                console.log('Save response:', response);
                if (response.success) {
                    showMessage(response.data.message, 'success');
                    closeDestinationModal();
                    
                    // Reload the page to get updated data
                    setTimeout(function() {
                        window.location.reload();
                    }, 1000);
                } else {
                    showMessage('Error: ' + response.data, 'error');
                }
            },
            error: function(xhr, status, error) {
                console.error('Save error:', {xhr, status, error});
                showMessage('Failed to save destination', 'error');
            }
        });
    }

    function editDestination(id) {
        const destination = destinations.find(d => d.id == id);
        if (destination) {
            openDestinationModal(destination);
        }
    }

    function deleteDestination(id) {
        if (confirm('Are you sure you want to delete this destination?')) {
            $.ajax({
                url: yatraAdmin.ajaxUrl,
                type: 'POST',
                data: {
                    action: 'yatra_delete_destination',
                    id: id,
                    nonce: yatraAdmin.nonce
                },
                success: function(response) {
                    if (response.success) {
                        showMessage(response.data, 'success');
                        
                        // Reload the page to get updated data
                        setTimeout(function() {
                            window.location.reload();
                        }, 1000);
                    } else {
                        showMessage('Error: ' + response.data, 'error');
                    }
                },
                error: function() {
                    showMessage('Failed to delete destination', 'error');
                }
            });
        }
    }

    function viewDestination(id) {
        const destination = destinations.find(d => d.id == id);
        if (destination) {
            // Open destination details in a new window or modal
            window.open('<?php echo admin_url('admin.php?page=yatra-app&subpage=destinations&action=view&id='); ?>' + id, '_blank');
        }
    }

    function showMessage(message, type) {
        // Create a simple message display
        const messageClass = type === 'success' ? 'yatra-message-success' : 'yatra-message-error';
        const messageHtml = `<div class="yatra-message ${messageClass}">${message}</div>`;
        
        // Remove existing messages
        $('.yatra-message').remove();
        
        // Add new message
        $('.yatra-destinations').prepend(messageHtml);
        
        // Auto-remove after 3 seconds
        setTimeout(function() {
            $('.yatra-message').fadeOut(function() {
                $(this).remove();
            });
        }, 3000);
    }
});
</script> 