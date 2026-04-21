<?php

declare(strict_types=1);

namespace Yatra\Models;

/**
 * Activity Model
 * Represents an activity entity
 */
class Activity
{
    /**
     * @var int
     */
    public int $id;

    /**
     * @var string
     */
    public string $name;

    /**
     * @var string
     */
    public string $slug;

    /**
     * @var string
     */
    public string $description;

    /**
     * @var array|null Icon data (type and value)
     */
    public ?array $icon;

    /**
     * @var string
     */
    public string $status;

    /**
     * @var string
     */
    public string $created_at;

    /**
     * @var string
     */
    public string $updated_at;

    /**
     * @var int
     */
    public int $created_by;

    /**
     * @var int
     */
    public int $updated_by;

    /**
     * Create from array
     */
    public static function fromArray(array $data): self
    {
        $activity = new self();
        
        $activity->id = (int) ($data['id'] ?? 0);
        $activity->name = $data['name'] ?? '';
        $activity->slug = $data['slug'] ?? '';
        $activity->description = $data['description'] ?? '';
        $activity->icon = isset($data['icon']) ? (is_array($data['icon']) ? $data['icon'] : maybe_unserialize($data['icon'])) : null;
        $activity->status = $data['status'] ?? 'draft';
        $activity->created_at = $data['created_at'] ?? '';
        $activity->updated_at = $data['updated_at'] ?? '';
        $activity->created_by = (int) ($data['created_by'] ?? 0);
        $activity->updated_by = (int) ($data['updated_by'] ?? 0);

        return $activity;
    }

    /**
     * Convert to array
     */
    public function toArray(): array
    {
        return [
            'id' => $this->id,
            'name' => $this->name,
            'slug' => $this->slug,
            'description' => $this->description,
            'icon' => $this->icon,
            'status' => $this->status,
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
            'created_by' => $this->created_by,
            'updated_by' => $this->updated_by,
        ];
    }
}

