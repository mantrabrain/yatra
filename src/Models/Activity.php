<?php

declare(strict_types=1);

namespace Yatra\Models;

use Yatra\Core\Model;

/**
 * Activity model for managing global activities
 */
class Activity extends Model
{
    protected $table = 'yatra_activities';

    protected $fillable = [
        'title',
        'description',
        'time',
        'location',
        'image',
        'meta',
        'status',
        'created_by',
        'updated_by',
        'created_at',
        'updated_at',
    ];

    protected $casts = [
        'meta' => 'array',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    /**
     * Get all activities (optionally only active)
     */
    public static function getAll($onlyActive = false)
    {
        $query = self::query();
        if ($onlyActive) {
            $query = $query->where('status', '=', 'active');
        }
        return $query->orderBy('created_at', 'desc')->get();
    }

    /**
     * Get activity by ID
     */
    public static function getById($id)
    {
        return self::where('id', '=', $id)->first();
    }

    /**
     * Create a new activity
     */
    public static function createActivity(array $data)
    {
        // Prepare data for database
        $dbData = self::prepareDataForDatabase($data);
        $dbData['created_at'] = $dbData['updated_at'] = date('Y-m-d H:i:s');
        $dbData['created_by'] = $dbData['updated_by'] = get_current_user_id();
        
        return self::create($dbData);
    }

    /**
     * Update an activity
     */
    public static function updateActivity($id, array $data)
    {
        // Prepare data for database
        $dbData = self::prepareDataForDatabase($data);
        $dbData['updated_at'] = date('Y-m-d H:i:s');
        $dbData['updated_by'] = get_current_user_id();
        $dbData['id'] = $id;
        
        return self::update($dbData);
    }

    /**
     * Delete an activity
     */
    public static function deleteActivity($id)
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
        $prepared = [];
        
        // Map form fields to database fields
        $fieldMapping = [
            'name' => 'title',
            'duration' => 'time',
            'category' => 'location',
            'icon' => 'image'
        ];

        foreach ($data as $key => $value) {
            if (isset($fieldMapping[$key])) {
                $prepared[$fieldMapping[$key]] = $value;
            } else {
                $prepared[$key] = $value;
            }
        }

        // Handle meta data
        $meta = [];
        if (isset($data['difficulty']) && !empty($data['difficulty'])) {
            $meta['difficulty'] = $data['difficulty'];
        }
        if (isset($data['icon']) && !empty($data['icon'])) {
            $meta['icon'] = $data['icon'];
        }
        if (isset($data['category']) && !empty($data['category'])) {
            $meta['category'] = $data['category'];
        }

        // Only set meta if we have data, otherwise use NULL
        if (!empty($meta)) {
            $prepared['meta'] = json_encode($meta);
        } else {
            $prepared['meta'] = null;
        }

        // Ensure status is set
        if (!isset($prepared['status'])) {
            $prepared['status'] = 'active';
        }

        return $prepared;
    }

    /**
     * Get activities for display in admin
     */
    public static function getActivitiesForDisplay()
    {
        $activities = self::getAll();
        
        return array_map(function($activity) {
            // Convert object to array if needed
            if (is_object($activity)) {
                $activity = (array) $activity;
            }
            // Decode meta data
            if (isset($activity['meta']) && is_string($activity['meta'])) {
                $activity['meta'] = json_decode($activity['meta'], true) ?: [];
            }
            // Map database fields back to display fields
            $activity['name'] = $activity['title'] ?? '';
            $activity['duration'] = $activity['time'] ?? '';
            $activity['category'] = $activity['location'] ?? '';
            $activity['icon'] = $activity['image'] ?? '';
            $activity['difficulty'] = $activity['meta']['difficulty'] ?? 'Easy';
            return $activity;
        }, $activities);
    }
} 