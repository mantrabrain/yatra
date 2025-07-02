<?php

declare(strict_types=1);

namespace Yatra\Admin;

/**
 * Handles Trip management: listing, creating, editing, and deleting trips
 */
class TripManager
{
    /**
     * Get all trips from the database
     */
    public function getAllTrips()
    {
        global $wpdb;
        $table_name = $wpdb->prefix . 'yatra_trips';
        
        $sql = "SELECT * FROM {$table_name} ORDER BY created_at DESC";
        return $wpdb->get_results($sql);
    }

    /**
     * Get trips by status
     */
    public function getTripsByStatus($status)
    {
        global $wpdb;
        $table_name = $wpdb->prefix . 'yatra_trips';
        
        $sql = $wpdb->prepare(
            "SELECT * FROM {$table_name} WHERE status = %s ORDER BY created_at DESC",
            $status
        );
        return $wpdb->get_results($sql);
    }

    /**
     * Get a single trip by ID
     */
    public function getTrip($id)
    {
        global $wpdb;
        $table_name = $wpdb->prefix . 'yatra_trips';
        
        $sql = $wpdb->prepare(
            "SELECT * FROM {$table_name} WHERE id = %d",
            $id
        );
        return $wpdb->get_row($sql);
    }

    /**
     * Create a new trip
     */
    public function createTrip($data)
    {
        global $wpdb;
        $table_name = $wpdb->prefix . 'yatra_trips';
        
        $data['created_at'] = current_time('mysql');
        $data['updated_at'] = current_time('mysql');
        $data['created_by'] = get_current_user_id();
        
        $result = $wpdb->insert($table_name, $data);
        
        if ($result) {
            return $wpdb->insert_id;
        }
        
        return false;
    }

    /**
     * Update an existing trip
     */
    public function updateTrip($id, $data)
    {
        global $wpdb;
        $table_name = $wpdb->prefix . 'yatra_trips';
        
        $data['updated_at'] = current_time('mysql');
        $data['updated_by'] = get_current_user_id();
        
        $result = $wpdb->update(
            $table_name,
            $data,
            ['id' => $id]
        );
        
        return $result !== false;
    }

    /**
     * Delete a trip
     */
    public function deleteTrip($id)
    {
        global $wpdb;
        $table_name = $wpdb->prefix . 'yatra_trips';
        
        $result = $wpdb->delete(
            $table_name,
            ['id' => $id]
        );
        
        return $result !== false;
    }

    /**
     * Get trip statistics
     */
    public function getTripStats()
    {
        global $wpdb;
        $table_name = $wpdb->prefix . 'yatra_trips';
        
        $stats = [
            'total' => $wpdb->get_var("SELECT COUNT(*) FROM {$table_name}"),
            'published' => $wpdb->get_var("SELECT COUNT(*) FROM {$table_name} WHERE status = 'published'"),
            'draft' => $wpdb->get_var("SELECT COUNT(*) FROM {$table_name} WHERE status = 'draft'"),
            'featured' => $wpdb->get_var("SELECT COUNT(*) FROM {$table_name} WHERE featured = 1"),
        ];
        
        return $stats;
    }

    /**
     * Render the trips listing page
     */
    public function renderTripsList()
    {
        $trips = $this->getAllTrips();
        $stats = $this->getTripStats();
        
        ?>
        <div class="yatra-trips">
            <!-- Page Header -->
            <div class="yatra-page-header">
                <div class="yatra-page-header-left">
                    <h2>Manage Trips</h2>
                    <p>Create and manage your travel packages and tours</p>
                </div>
                <div class="yatra-page-header-right">
                    <a href="?page=yatra-app&subpage=trips&action=add" class="yatra-btn yatra-btn-primary">
                        <span class="yatra-btn-icon">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M12 5V19M5 12H19" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                            </svg>
                        </span>
                        Add New Trip
                    </a>
                </div>
            </div>

            <!-- Stats Cards -->
            <div class="yatra-stats-grid">
                <div class="yatra-stat-card">
                    <div class="yatra-stat-icon">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M9 20L3 17V4L9 7M9 20L15 17M9 20V7M15 17L21 20V7L15 4M15 17V4M9 7L15 4" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                        </svg>
                    </div>
                    <div class="yatra-stat-content">
                        <h3 class="yatra-stat-number"><?php echo $stats['total']; ?></h3>
                        <p class="yatra-stat-label">Total Trips</p>
                    </div>
                </div>
                <div class="yatra-stat-card">
                    <div class="yatra-stat-icon">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M9 12L11 14L15 10M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                        </svg>
                    </div>
                    <div class="yatra-stat-content">
                        <h3 class="yatra-stat-number"><?php echo $stats['published']; ?></h3>
                        <p class="yatra-stat-label">Published</p>
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
                        <h3 class="yatra-stat-number"><?php echo $stats['draft']; ?></h3>
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
                        <h3 class="yatra-stat-number"><?php echo $stats['featured']; ?></h3>
                        <p class="yatra-stat-label">Featured</p>
                    </div>
                </div>
            </div>

            <!-- Filters and Search -->
            <div class="yatra-filters-bar">
                <div class="yatra-filters-left">
                    <select class="yatra-form-select" id="status-filter">
                        <option value="">All Status</option>
                        <option value="published">Published</option>
                        <option value="draft">Draft</option>
                        <option value="completed">Completed</option>
                        <option value="cancelled">Cancelled</option>
                    </select>
                    <select class="yatra-form-select" id="featured-filter">
                        <option value="">All Trips</option>
                        <option value="1">Featured Only</option>
                        <option value="0">Not Featured</option>
                    </select>
                </div>
                <div class="yatra-filters-right">
                    <div class="yatra-search-box">
                        <input type="text" class="yatra-form-input" id="search-trips" placeholder="Search trips...">
                        <button class="yatra-search-btn" id="search-btn">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M21 21L16.514 16.506L21 21ZM19 10.5C19 15.194 15.194 19 10.5 19C5.806 19 2 15.194 2 10.5C2 5.806 5.806 2 10.5 2C15.194 2 19 5.806 19 10.5Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                            </svg>
                        </button>
                    </div>
                </div>
            </div>

            <!-- Trips Table -->
            <div class="yatra-content-card">
                <?php if (empty($trips)): ?>
                    <div class="yatra-empty-state">
                        <div class="yatra-empty-icon">
                            <svg width="64" height="64" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M9 20L3 17V4L9 7M9 20L15 17M9 20V7M15 17L21 20V7L15 4M15 17V4M9 7L15 4" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                            </svg>
                        </div>
                        <h3>No trips found</h3>
                        <p>Get started by creating your first trip package.</p>
                        <a href="?page=yatra-app&subpage=trips&action=add" class="yatra-btn yatra-btn-primary">
                            Create Your First Trip
                        </a>
                    </div>
                <?php else: ?>
                    <div class="yatra-table-container">
                        <table class="yatra-table">
                            <thead>
                                <tr>
                                    <th>Image</th>
                                    <th>Title</th>
                                    <th>Destination</th>
                                    <th>Duration</th>
                                    <th>Price</th>
                                    <th>Status</th>
                                    <th>Featured</th>
                                    <th>Created</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                <?php foreach ($trips as $trip): ?>
                                    <tr>
                                        <td>
                                            <?php if ($trip->featured_image): ?>
                                                <img src="<?php echo esc_url($trip->featured_image); ?>" 
                                                     alt="<?php echo esc_attr($trip->title); ?>" 
                                                     class="yatra-trip-thumbnail">
                                            <?php else: ?>
                                                <div class="yatra-trip-placeholder">
                                                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                        <path d="M9 20L3 17V4L9 7M9 20L15 17M9 20V7M15 17L21 20V7L15 4M15 17V4M9 7L15 4" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                                                    </svg>
                                                </div>
                                            <?php endif; ?>
                                        </td>
                                        <td>
                                            <div class="yatra-trip-title">
                                                <strong><?php echo esc_html($trip->title); ?></strong>
                                                <?php if ($trip->slug): ?>
                                                    <small class="yatra-trip-slug"><?php echo esc_html($trip->slug); ?></small>
                                                <?php endif; ?>
                                            </div>
                                        </td>
                                        <td><?php echo esc_html($trip->destination); ?></td>
                                        <td>
                                            <?php 
                                            if ($trip->duration) {
                                                echo esc_html($trip->duration . ' ' . ($trip->duration_type ?: 'days'));
                                            } else {
                                                echo '—';
                                            }
                                            ?>
                                        </td>
                                        <td>
                                            <?php if ($trip->price): ?>
                                                <div class="yatra-trip-price">
                                                    <?php if ($trip->sale_price && $trip->sale_price < $trip->price): ?>
                                                        <span class="yatra-price-original"><?php echo esc_html($this->formatPrice($trip->price, $trip->currency)); ?></span>
                                                        <span class="yatra-price-sale"><?php echo esc_html($this->formatPrice($trip->sale_price, $trip->currency)); ?></span>
                                                    <?php else: ?>
                                                        <span class="yatra-price"><?php echo esc_html($this->formatPrice($trip->price, $trip->currency)); ?></span>
                                                    <?php endif; ?>
                                                </div>
                                            <?php else: ?>
                                                <span class="yatra-price-free">Free</span>
                                            <?php endif; ?>
                                        </td>
                                        <td>
                                            <span class="yatra-status yatra-status-<?php echo esc_attr($trip->status); ?>">
                                                <?php echo esc_html(ucfirst($trip->status)); ?>
                                            </span>
                                        </td>
                                        <td>
                                            <?php if ($trip->featured): ?>
                                                <span class="yatra-featured-badge">
                                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                        <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                                                    </svg>
                                                    Featured
                                                </span>
                                            <?php else: ?>
                                                <span class="yatra-not-featured">—</span>
                                            <?php endif; ?>
                                        </td>
                                        <td><?php echo esc_html(date('M j, Y', strtotime($trip->created_at))); ?></td>
                                        <td>
                                            <div class="yatra-actions">
                                                <a href="?page=yatra-app&subpage=trips&action=edit&id=<?php echo $trip->id; ?>" 
                                                   class="yatra-btn yatra-btn-sm yatra-btn-secondary" 
                                                   title="Edit">
                                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                        <path d="M11 4H4C3.46957 4 2.96086 4.21071 2.58579 4.58579C2.21071 4.96086 2 5.46957 2 6V20C2 20.5304 2.21071 21.0391 2.58579 21.4142C2.96086 21.7893 3.46957 22 4 22H18C18.5304 22 19.0391 21.7893 19.4142 21.4142C19.7893 21.0391 20 20.5304 20 20V13" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                                                        <path d="M18.5 2.5C18.8978 2.10217 19.4374 1.87868 20 1.87868C20.5626 1.87868 21.1022 2.10217 21.5 2.5C21.8978 2.89782 22.1213 3.43739 22.1213 4C22.1213 4.56261 21.8978 5.10217 21.5 5.5L12 15L8 16L9 12L18.5 2.5Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                                                    </svg>
                                                </a>
                                                <a href="?page=yatra-app&subpage=trips&action=view&id=<?php echo $trip->id; ?>" 
                                                   class="yatra-btn yatra-btn-sm yatra-btn-secondary" 
                                                   title="View">
                                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                        <path d="M1 12S5 4 12 4S23 12 23 12S19 20 12 20S1 12 1 12Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                                                        <path d="M12 15C13.6569 15 15 13.6569 15 12C15 10.3431 13.6569 9 12 9C10.3431 9 9 10.3431 9 12C9 13.6569 10.3431 15 12 15Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                                                    </svg>
                                                </a>
                                                <button class="yatra-btn yatra-btn-sm yatra-btn-danger yatra-delete-trip" 
                                                        data-id="<?php echo $trip->id; ?>" 
                                                        title="Delete">
                                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                        <path d="M3 6H5H21" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                                                        <path d="M8 6V4C8 3.46957 8.21071 2.96086 8.58579 2.58579C8.96086 2.21071 9.46957 2 10 2H14C14.5304 2 15.0391 2.21071 15.4142 2.58579C15.7893 2.96086 16 3.46957 16 4V6M19 6V20C19 20.5304 18.7893 21.0391 18.4142 21.4142C18.0391 21.7893 17.5304 22 17 22H7C6.46957 22 5.96086 21.7893 5.58579 21.4142C5.21071 21.0391 5 20.5304 5 20V6H19Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                                                    </svg>
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                <?php endforeach; ?>
                            </tbody>
                        </table>
                    </div>
                <?php endif; ?>
            </div>
        </div>
        <?php
    }

    /**
     * Format price with currency
     */
    public function formatPrice($price, $currency = 'USD')
    {
        $currency = $currency ?: 'USD';
        
        switch ($currency) {
            case 'USD':
                return '$' . number_format($price, 2);
            case 'EUR':
                return '€' . number_format($price, 2);
            case 'GBP':
                return '£' . number_format($price, 2);
            default:
                return $currency . ' ' . number_format($price, 2);
        }
    }

    /**
     * Generate a unique slug for a trip
     */
    private function generateSlug($title, $exclude_id = null)
    {
        global $wpdb;
        $table_name = $wpdb->prefix . 'yatra_trips';
        
        $slug = sanitize_title($title);
        $original_slug = $slug;
        $counter = 1;
        
        // Check if slug already exists
        while (true) {
            $sql = $wpdb->prepare(
                "SELECT id FROM {$table_name} WHERE slug = %s",
                $slug
            );
            
            if ($exclude_id) {
                $sql .= $wpdb->prepare(" AND id != %d", $exclude_id);
            }
            
            $existing = $wpdb->get_var($sql);
            
            if (!$existing) {
                break;
            }
            
            $slug = $original_slug . '-' . $counter;
            $counter++;
        }
        
        return $slug;
    }

    public function saveTrip($data)
    {
        global $wpdb;
        $table_name = $wpdb->prefix . 'yatra_trips';

        $tripForm = new TripForm();
        $config = $tripForm->get_config($data, isset($data['id']) ? 'edit' : 'add');
        $errors = [];
        $tripData = [];

        // Loop through all sections/fields in config
        foreach ($config as $section) {
            foreach ($section['fields'] as $field) {
                $field_id = $field['id'];
                $raw = $data[$field_id] ?? null;
                $sanitized = $raw;
                if (isset($field['sanitize_callback']) && is_callable($field['sanitize_callback'])) {
                    $sanitized = call_user_func($field['sanitize_callback'], $raw);
                }
                if (!empty($field['required']) && ($sanitized === null || $sanitized === '')) {
                    $errors[$field_id] = $field['label'] . ' is required.';
                } elseif (isset($field['validate_callback']) && is_callable($field['validate_callback'])) {
                    $valid = call_user_func($field['validate_callback'], $sanitized);
                    if ($valid === false) {
                        $errors[$field_id] = $field['label'] . ' is invalid.';
                    }
                }
                $tripData[$field_id] = $sanitized;
            }
        }

        // Handle itinerary (array of days)
        $itinerary_config = $tripForm->get_itinerary_config();
        if (isset($data['itinerary']) && is_array($data['itinerary'])) {
            $itinerary = [];
            foreach ($data['itinerary'] as $dayNum => $dayData) {
                $dayArr = [];
                foreach ($itinerary_config as $field) {
                    $field_id = $field['id'];
                    $raw = $dayData[$field_id] ?? null;
                    $sanitized = $raw;
                    if (isset($field['sanitize_callback']) && is_callable($field['sanitize_callback'])) {
                        $sanitized = call_user_func($field['sanitize_callback'], $raw);
                    }
                    if (!empty($field['required']) && ($sanitized === null || $sanitized === '')) {
                        $errors['itinerary_' . $dayNum . '_' . $field_id] = 'Day ' . ($dayNum + 1) . ': ' . $field['label'] . ' is required.';
                    } elseif (isset($field['validate_callback']) && is_callable($field['validate_callback'])) {
                        $valid = call_user_func($field['validate_callback'], $sanitized);
                        if ($valid === false) {
                            $errors['itinerary_' . $dayNum . '_' . $field_id] = 'Day ' . ($dayNum + 1) . ': ' . $field['label'] . ' is invalid.';
                        }
                    }
                    $dayArr[$field_id] = $sanitized;
                }
                $itinerary[] = $dayArr;
            }
            $tripData['itinerary'] = json_encode($itinerary);
        }

        // If errors, return them
        if (!empty($errors)) {
            return ['success' => false, 'errors' => $errors, 'message' => 'Please fix the errors and try again.'];
        }

        // Add/update meta fields
        $tripData['updated_at'] = current_time('mysql');
        if (isset($data['id']) && !empty($data['id'])) {
            $result = $wpdb->update(
                $table_name,
                $tripData,
                ['id' => intval($data['id'])],
                null,
                ['%d']
            );
            if ($result !== false) {
                return [
                    'success' => true,
                    'message' => 'Trip updated successfully',
                    'redirect' => admin_url('admin.php?page=yatra-trips&action=view&id=' . $data['id'])
                ];
            }
        } else {
            $tripData['created_at'] = current_time('mysql');
            $tripData['created_by'] = get_current_user_id();
            $result = $wpdb->insert($table_name, $tripData);
            if ($result) {
                $trip_id = $wpdb->insert_id;
                return [
                    'success' => true,
                    'message' => 'Trip created successfully',
                    'redirect' => admin_url('admin.php?page=yatra-trips&action=view&id=' . $trip_id)
                ];
            }
        }
        return ['success' => false, 'message' => 'Failed to save trip'];
    }
} 