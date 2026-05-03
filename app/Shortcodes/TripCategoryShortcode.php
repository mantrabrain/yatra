<?php

declare(strict_types=1);

namespace Yatra\Shortcodes;

use Yatra\Services\SettingsService;

/**
 * Trip category listing shortcode — same card UI as {@see DestinationShortcode}.
 */
class TripCategoryShortcode extends BaseShortcode
{
    public function __construct()
    {
        parent::__construct('yatra_trip_category', [
            'order' => 'desc',
            'per_page' => '10',
            'columns' => '3',
            'show_trip_count' => 'yes',
            'show_description' => 'yes',
            'show_image' => 'yes',
            'show_pagination' => 'yes',
            'category' => '',
            'hide_empty' => 'yes',
            'featured_only' => 'no',
            'title' => 'Trip Categories',
        ]);
    }

    protected function renderContent(array $atts): string
    {
        $atts = shortcode_atts($this->default_attributes, $atts, $this->tag);

        $per_page = 10;
        if (!empty($atts['per_page']) && is_numeric($atts['per_page'])) {
            $per_page = (int) $atts['per_page'];
        }
        $atts['per_page'] = $per_page;

        $categories_data = $this->getCategories($atts);

        $data = [
            'categories' => $categories_data['categories'] ?? [],
            'atts' => $atts,
            'current_page' => $categories_data['current_page'] ?? 1,
            'max_pages' => $categories_data['max_pages'] ?? 1,
            'total_found' => $categories_data['total_found'] ?? 0,
            'per_page' => $per_page,
        ];

        wp_enqueue_style(
            'yatra-destination-shortcode',
            YATRA_PLUGIN_URL . 'assets/css/shortcodes/destination-shortcode.css',
            [],
            YATRA_VERSION
        );

        wp_enqueue_script(
            'yatra-trip-category-shortcode',
            YATRA_PLUGIN_URL . 'assets/js/trip-category-shortcode.js',
            ['jquery'],
            YATRA_VERSION,
            true
        );

        wp_localize_script('yatra-trip-category-shortcode', 'yatraTripCategoryShortcode', [
            'ajaxurl' => admin_url('admin-ajax.php'),
            'nonce' => wp_create_nonce('yatra_trip_category_shortcode_nonce'),
        ]);

        return $this->loadTemplate('shortcodes/trip-category.php', $data);
    }

    /**
     * @return array{categories: array, current_page: int, max_pages: int, total_found: int, per_page: int}
     */
    public function getCategories(array $atts): array
    {
        try {
            $categoryService = new \Yatra\Services\TripCategoryService();

            $current_page = isset($atts['current_page'])
                ? (int) $atts['current_page']
                : (isset($_GET['trip_category_page']) ? (int) $_GET['trip_category_page'] : 1);

            $per_page = !empty($atts['per_page']) ? (int) $atts['per_page'] : 10;
            $per_page = max(1, min($per_page, 100));
            $offset = ($current_page - 1) * $per_page;

            $args = [
                'limit' => $per_page,
                'offset' => $offset,
                'order_by' => 'name',
                'order' => ($atts['order'] ?? 'desc') === 'asc' ? 'ASC' : 'DESC',
                'where' => [
                    'status' => 'publish',
                ],
            ];

            if (!empty($atts['category'])) {
                $args['where']['slug'] = array_map('trim', explode(',', (string) $atts['category']));
            }

            $count_args = $args;
            unset($count_args['limit'], $count_args['offset']);
            $total_categories = $categoryService->count($count_args);

            $result = $categoryService->getAll($args);

            $categories = [];

            foreach ($result as $categoryData) {
                global $wpdb;

                $tripClassificationsTable = \Yatra\Database\Tables\TripClassificationsTable::getTableName();
                $tripsTable = \Yatra\Database\Tables\TripsTable::getTableName();

                $trip_ids = $wpdb->get_col($wpdb->prepare(
                    "SELECT tc.trip_id 
                     FROM {$tripClassificationsTable} tc 
                     INNER JOIN {$tripsTable} t ON tc.trip_id = t.id 
                     WHERE tc.classification_id = %d 
                     AND tc.classification_type = 'category' 
                     AND t.status = 'publish'",
                    $categoryData->id
                ));

                $trip_count = count($trip_ids);

                $trips = [];
                if (!empty($trip_ids)) {
                    $placeholders = implode(',', array_fill(0, count($trip_ids), '%d'));
                    $trips = $wpdb->get_results($wpdb->prepare(
                        "SELECT * FROM {$tripsTable} 
                         WHERE id IN ({$placeholders}) 
                         AND status = 'publish' 
                         ORDER BY created_at DESC 
                         LIMIT 6",
                        ...$trip_ids
                    ));
                }

                $min_price = null;
                $max_price = null;
                $durations = [];
                $group_sizes = [];
                $best_seasons = [];

                $total_rating_sum = 0;
                $total_review_count = 0;

                if (!empty($trip_ids)) {
                    $reviewsTable = \Yatra\Database\Tables\ReviewsTable::getTableName();
                    $placeholders = implode(',', array_fill(0, count($trip_ids), '%d'));

                    $reviews = $wpdb->get_results($wpdb->prepare(
                        "SELECT rating, COUNT(*) as review_count 
                         FROM {$reviewsTable} 
                         WHERE trip_id IN ({$placeholders}) 
                         AND status = 'approved'",
                        ...$trip_ids
                    ));

                    foreach ($reviews as $review) {
                        $total_rating_sum += $review->rating * $review->review_count;
                        $total_review_count += $review->review_count;
                    }
                }

                $avg_rating = $total_review_count > 0 ? $total_rating_sum / $total_review_count : 0;

                foreach ($trips as $trip) {
                    $effective = \Yatra\Services\TripPricingService::getEffectivePrice($trip);
                    if ($effective > 0) {
                        if ($min_price === null || $effective < $min_price) {
                            $min_price = $effective;
                        }
                        if ($max_price === null || $effective > $max_price) {
                            $max_price = $effective;
                        }
                    }
                    if (!empty($trip->duration)) {
                        $durations[] = $trip->duration;
                    }
                    if (!empty($trip->max_group_size)) {
                        $group_sizes[] = $trip->max_group_size;
                    }
                    if (!empty($trip->best_season)) {
                        $best_seasons[] = $trip->best_season;
                    }
                }

                $final_avg_rating = $avg_rating;
                $avg_duration = !empty($durations) ? array_sum($durations) / count($durations) : 0;
                $avg_group_size = !empty($group_sizes) ? round(array_sum($group_sizes) / count($group_sizes)) : 0;
                $best_season = !empty($best_seasons) ? $this->getMostCommonSeason($best_seasons) : 'Summer';

                $categories[] = [
                    'term' => $categoryData,
                    'trips' => $trips,
                    'trip_count' => $trip_count,
                    'description' => $categoryData->description ?? '',
                    'image' => $this->getCategoryImage($categoryData, $trips),
                    'link' => $this->getCategoryLink($categoryData),
                    'min_price' => $min_price,
                    'max_price' => $max_price,
                    'avg_rating' => $final_avg_rating,
                    'rating_count' => $total_review_count,
                    'avg_duration' => $avg_duration,
                    'avg_group_size' => $avg_group_size,
                    'best_season' => $best_season,
                ];
            }

            if (($atts['hide_empty'] ?? 'yes') === 'yes') {
                $categories = array_filter($categories, static function ($row) {
                    return !empty($row['term']->name) && !empty($row['term']->slug);
                });
            }

            if (($atts['featured_only'] ?? 'no') === 'yes') {
                $categories = array_filter($categories, static function ($row) {
                    $t = $row['term'];

                    return (isset($t->is_featured) && (int) $t->is_featured === 1)
                        || (isset($t->featured) && (int) $t->featured === 1);
                });
            }

            $max_pages = $per_page > 0 ? (int) ceil($total_categories / $per_page) : 1;

            return [
                'categories' => $categories,
                'current_page' => $current_page,
                'max_pages' => max(1, $max_pages),
                'total_found' => $total_categories,
                'per_page' => $per_page,
            ];
        } catch (\Exception $e) {
            if (defined('WP_DEBUG') && WP_DEBUG) {
            }

            return [
                'categories' => [],
                'current_page' => 1,
                'max_pages' => 1,
                'total_found' => 0,
                'per_page' => (int) ($atts['per_page'] ?? 10),
            ];
        }
    }

    private function getMostCommonSeason(array $seasons): string
    {
        if (empty($seasons)) {
            return 'Summer';
        }
        $counts = array_count_values($seasons);
        arsort($counts);

        return array_key_first($counts);
    }

    private function getImageUrlFromCategoryIcon($icon): string
    {
        if ($icon === null || $icon === '') {
            return '';
        }

        if (is_string($icon)) {
            $decoded = json_decode($icon, true);
            if (is_array($decoded)) {
                $icon = $decoded;
            } else {
                $icon = maybe_unserialize($icon);
            }
        }

        if (!is_array($icon)) {
            return '';
        }

        $type = $icon['type'] ?? $icon[0] ?? '';
        $value = $icon['value'] ?? $icon[1] ?? '';

        if ($type !== 'image' || $value === '' || $value === null) {
            return '';
        }

        if (is_numeric($value)) {
            $url = wp_get_attachment_image_url((int) $value, 'large');

            return $url ?: '';
        }

        if (is_string($value) && filter_var($value, FILTER_VALIDATE_URL)) {
            return $value;
        }

        return '';
    }

    /**
     * @return array<string, mixed>
     */
    private function decodeCategoryMetadata($raw): array
    {
        if ($raw === null || $raw === '') {
            return [];
        }
        if (is_array($raw)) {
            return $raw;
        }
        if (!is_string($raw)) {
            return [];
        }
        $decoded = json_decode($raw, true);
        if (is_array($decoded)) {
            return $decoded;
        }
        $unserialized = maybe_unserialize($raw);

        return is_array($unserialized) ? $unserialized : [];
    }

    /**
     * @param object $category Row from classifications (type category)
     * @param array<int, object> $trips
     */
    private function getCategoryImage($category, array $trips = []): string
    {
        if (isset($category->image) && !empty($category->image)) {
            return $category->image;
        }
        if (isset($category->banner) && !empty($category->banner)) {
            return $category->banner;
        }
        if (isset($category->thumbnail) && !empty($category->thumbnail)) {
            return is_numeric($category->thumbnail)
                ? (string) wp_get_attachment_url((int) $category->thumbnail)
                : $category->thumbnail;
        }
        if (isset($category->cover_image) && !empty($category->cover_image)) {
            return $category->cover_image;
        }
        if (isset($category->hero_image) && !empty($category->hero_image)) {
            return $category->hero_image;
        }

        $fromIcon = $this->getImageUrlFromCategoryIcon($category->icon ?? null);
        if ($fromIcon !== '') {
            return $fromIcon;
        }

        if (isset($category->metadata) && $category->metadata !== '') {
            $metadata = $this->decodeCategoryMetadata($category->metadata);
            if ($metadata !== []) {
                $image_fields = ['image', 'thumbnail', 'banner', 'featured_image', 'cover_image', 'hero_image', 'image_id'];
                foreach ($image_fields as $field) {
                    if (!empty($metadata[$field])) {
                        $val = $metadata[$field];

                        return is_numeric($val) ? (string) wp_get_attachment_url((int) $val) : (string) $val;
                    }
                }
            }
        }

        foreach ($trips as $trip) {
            if (!empty($trip->featured_image) && is_numeric($trip->featured_image)) {
                $url = wp_get_attachment_image_url((int) $trip->featured_image, 'large');
                if ($url !== false && $url !== '') {
                    return $url;
                }
            }
        }

        return YATRA_PLUGIN_URL . 'assets/images/placeholder.png';
    }

    private function getCategoryLink($category): string
    {
        if (isset($category->slug) && function_exists('yatra_get_category_permalink')) {
            $url = yatra_get_category_permalink($category);

            return $url !== '' ? $url : '#';
        }

        $base = SettingsService::getString('trip_category_base', 'trip-category');

        return isset($category->slug) ? home_url('/' . $base . '/' . $category->slug . '/') : '#';
    }
}
