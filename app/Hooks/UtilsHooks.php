<?php

declare(strict_types=1);

namespace Yatra\Hooks;

/**
 * Utility Hooks
 *
 * Handles various utility functionality like admin bar modifications
 */
class UtilsHooks
{
    /**
     * Initialize utility hooks
     */
    public static function init(): void
    {
        // Add "Edit Trip" to admin bar on single trip page
        add_action('admin_bar_menu', [self::class, 'addEditTripAdminBarLink'], 80);

        // Add admin bar CSS for trip edit link
        add_action('wp_head', [self::class, 'addAdminBarTripEditCSS']);
    }

    /**
     * Add "Edit Trip" link to admin bar on single trip page
     * Add "Edit Destination/Activity/Category" links on taxonomy pages
     *
     * @param \WP_Admin_Bar $admin_bar
     */
    public static function addEditTripAdminBarLink($admin_bar): void
    {
        // Debug logging at function start
    
        // Only for logged-in users who can edit Yatra items
        if (!is_user_logged_in() || (!current_user_can('manage_options'))) {
            
            return;
        }

        // Check if we're on a single trip page (use query var, not global $trip —
        // the booking template also assigns $trip at global scope, which would
        // otherwise leak this menu into the booking page admin bar).
        global $trip;
        if (function_exists('yatra_is_single_trip') && yatra_is_single_trip() && !empty($trip) && !empty($trip->id)) {
            // Build the edit URL for the trip
            $edit_url = admin_url('admin.php?page=yatra&subpage=trips&action=edit&id=' . (int) $trip->id);

            // Add the Edit Trip node
            $admin_bar->add_node([
                'id'    => 'yatra-edit-trip',
                'title' => __('Edit Trip', 'yatra'),
                'href'  => $edit_url,
                'meta'  => [
                    'title' => __('Edit this trip in Yatra admin', 'yatra'),
                ],
            ]);
        }

        // Check if we're on a taxonomy page
        $taxonomy_data = $GLOBALS['yatra_taxonomy_data'] ?? null;
        
      
        
        if (!empty($taxonomy_data) && !empty($taxonomy_data->id)) {
            // Build the edit URL based on taxonomy type
            $type = $taxonomy_data->type ?? '';
            $id = (int) $taxonomy_data->id;

            $tabs = '';
            $title = '';

             switch ($type) {
                case 'destination':
                    $tabs = 'destinations';
                    $title = __('Edit Destination', 'yatra');
                    break;
                case 'activity':
                    $tabs = 'activities';
                    $title = __('Edit Activity', 'yatra');
                    break;
                case 'category':
                    $tabs = 'categories';
                    $title = __('Edit Category', 'yatra');
                    break;
            }

            if ($tabs && $title) {
                $edit_url = admin_url('admin.php?page=yatra&subpage=trips&tab=' . $tabs . '&action=edit&id=' . $id);

                $node_id = 'yatra-edit-' . $type;

            
                $admin_bar->add_node([
                    'id'    => $node_id,
                    'title' => $title,
                    'href'  => $edit_url,
                    'meta'  => [
                        'title' => sprintf(__('Edit this %s in Yatra admin', 'yatra'), $type),
                    ],
                ]);
            }
        }
    }

    /**
     * Add CSS for the Edit Trip/Taxonomy admin bar links
     */
    public static function addAdminBarTripEditCSS(): void
    {
        // Only output CSS if user can see admin bar
        if (!is_user_logged_in() || !is_admin_bar_showing()) {
            return;
        }

        // Check if we're on a trip page or taxonomy page
        global $trip;
        $taxonomy_data = $GLOBALS['yatra_taxonomy_data'] ?? null;

        if (empty($trip) && empty($taxonomy_data)) {
            return;
        }

        echo '<style>
            #wpadminbar #wp-admin-bar-yatra-edit-trip > .ab-item:before,
            #wpadminbar #wp-admin-bar-yatra-edit-destination > .ab-item:before,
            #wpadminbar #wp-admin-bar-yatra-edit-activity > .ab-item:before,
            #wpadminbar #wp-admin-bar-yatra-edit-category > .ab-item:before {
                content: "\f464";
                font-family: dashicons;
                margin-right: 5px;
            }
        </style>';
    }
}
