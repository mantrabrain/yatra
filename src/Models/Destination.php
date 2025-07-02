<?php

declare(strict_types=1);

namespace Yatra\Models;

use Yatra\Core\Model;

/**
 * Destination model for managing destinations
 */
class Destination extends Model
{
    protected $table = 'yatra_destinations';

    protected $fillable = [
        'name',
        'slug',
        'description',
        'short_description',
        'featured_image',
        'gallery',
        'country',
        'region',
        'timezone',
        'latitude',
        'longitude',
        'elevation',
        'climate_info',
        'best_time_to_visit',
        'emergency_contacts',
        'visa_requirements',
        'status',
        'sort_order',
        'seo_title',
        'seo_description',
        'seo_keywords',
        'view_count',
        'created_by',
        'created_at',
        'updated_at',
    ];

    protected $casts = [
        'gallery' => 'array',
        'climate_info' => 'array',
        'best_time_to_visit' => 'array',
        'emergency_contacts' => 'array',
        'latitude' => 'float',
        'longitude' => 'float',
        'elevation' => 'integer',
        'view_count' => 'integer',
        'sort_order' => 'integer',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    /**
     * Get all destinations (optionally only active)
     */
    public static function getAll($onlyActive = false)
    {
        $query = self::query();
        if ($onlyActive) {
            $query = $query->where('status', '=', 'active');
        }
        return $query->orderBy('sort_order', 'asc')->orderBy('name', 'asc')->get();
    }

    /**
     * Get destination by ID
     */
    public static function getById($id)
    {
        return self::where('id', '=', $id)->first();
    }

    /**
     * Get destination by slug
     */
    public static function getBySlug($slug)
    {
        return self::where('slug', '=', $slug)->first();
    }

    /**
     * Create a new destination
     */
    public static function createDestination(array $data)
    {
        // Prepare data for database
        $dbData = self::prepareDataForDatabase($data);
        $dbData['created_at'] = $dbData['updated_at'] = date('Y-m-d H:i:s');
        $dbData['created_by'] = get_current_user_id();
        
        return self::create($dbData);
    }

    /**
     * Update a destination
     */
    public static function updateDestination($id, array $data)
    {
        // Prepare data for database
        $dbData = self::prepareDataForDatabase($data);
        $dbData['updated_at'] = date('Y-m-d H:i:s');
        $dbData['id'] = $id;
        
        return self::update($dbData);
    }

    /**
     * Delete a destination
     */
    public static function deleteDestination($id)
    {
        $instance = new static();
        $connection = self::getConnection();
        $tableName = $connection->getTableName($instance->table);
        return $connection->delete($tableName, ['id' => $id]);
    }

    /**
     * Prepare data for database storage
     */
    private static function prepareDataForDatabase(array $data): array
    {
        // Debug: Log incoming data
        error_log('Yatra: Preparing data for database: ' . print_r($data, true));
        
        $prepared = [];
        
        // Map form fields to database fields
        $fieldMapping = [
            'title' => 'name',
            'content' => 'description',
            'excerpt' => 'short_description',
            'image' => 'featured_image',
            'images' => 'gallery',
            'location' => 'region',
            'time_zone' => 'timezone',
            'lat' => 'latitude',
            'lng' => 'longitude',
            'height' => 'elevation',
            'weather' => 'climate_info',
            'best_season' => 'best_time_to_visit',
            'emergency' => 'emergency_contacts',
            'visa' => 'visa_requirements',
            'order' => 'sort_order',
            'meta_title' => 'seo_title',
            'meta_description' => 'seo_description',
            'meta_keywords' => 'seo_keywords',
        ];

        foreach ($data as $key => $value) {
            if (isset($fieldMapping[$key])) {
                $prepared[$fieldMapping[$key]] = $value;
            } else {
                $prepared[$key] = $value;
            }
        }

        // Generate slug if not provided
        if (empty($prepared['slug']) && !empty($prepared['name'])) {
            $prepared['slug'] = self::generateSlug($prepared['name']);
        }

        // Handle JSON fields
        $jsonFields = ['gallery', 'climate_info', 'best_time_to_visit', 'emergency_contacts'];
        foreach ($jsonFields as $field) {
            if (isset($prepared[$field]) && is_array($prepared[$field])) {
                $prepared[$field] = json_encode($prepared[$field]);
            }
        }

        // Ensure status is set
        if (!isset($prepared['status'])) {
            $prepared['status'] = 'active';
        }

        // Set default values
        if (!isset($prepared['sort_order'])) {
            $prepared['sort_order'] = 0;
        }

        if (!isset($prepared['view_count'])) {
            $prepared['view_count'] = 0;
        }

        // Debug: Log prepared data
        error_log('Yatra: Prepared data for database: ' . print_r($prepared, true));

        return $prepared;
    }

    /**
     * Generate a unique slug from name
     */
    private static function generateSlug($name): string
    {
        $slug = sanitize_title($name);
        $originalSlug = $slug;
        $counter = 1;

        // Check if slug already exists
        while (self::where('slug', '=', $slug)->first()) {
            $slug = $originalSlug . '-' . $counter;
            $counter++;
        }

        return $slug;
    }

    /**
     * Get destinations for display in admin
     */
    public static function getDestinationsForDisplay()
    {
        $destinations = self::getAll();
        
        return array_map(function($destination) {
            // Convert object to array if needed
            if (is_object($destination)) {
                $destination = (array) $destination;
            }
            
            // Decode JSON fields
            $jsonFields = ['gallery', 'climate_info', 'best_time_to_visit', 'emergency_contacts'];
            foreach ($jsonFields as $field) {
                if (isset($destination[$field]) && is_string($destination[$field])) {
                    $destination[$field] = json_decode($destination[$field], true) ?: [];
                }
            }
            
            // Map database fields back to display fields
            $destination['title'] = $destination['name'] ?? '';
            $destination['content'] = $destination['description'] ?? '';
            $destination['excerpt'] = $destination['short_description'] ?? '';
            $destination['image'] = $destination['featured_image'] ?? '';
            $destination['images'] = $destination['gallery'] ?? [];
            $destination['location'] = $destination['region'] ?? '';
            $destination['time_zone'] = $destination['timezone'] ?? '';
            $destination['lat'] = $destination['latitude'] ?? '';
            $destination['lng'] = $destination['longitude'] ?? '';
            $destination['height'] = $destination['elevation'] ?? '';
            $destination['weather'] = $destination['climate_info'] ?? [];
            $destination['best_season'] = $destination['best_time_to_visit'] ?? [];
            $destination['emergency'] = $destination['emergency_contacts'] ?? [];
            $destination['visa'] = $destination['visa_requirements'] ?? '';
            $destination['order'] = $destination['sort_order'] ?? 0;
            $destination['meta_title'] = $destination['seo_title'] ?? '';
            $destination['meta_description'] = $destination['seo_description'] ?? '';
            $destination['meta_keywords'] = $destination['seo_keywords'] ?? '';
            
            return $destination;
        }, $destinations);
    }
} 