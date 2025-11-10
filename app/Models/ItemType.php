<?php

declare(strict_types=1);

namespace Yatra\Models;

/**
 * Item Type Model
 * Represents an item type entity
 */
class ItemType
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
    public string $color;

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
        $itemType = new self();
        
        $itemType->id = (int) ($data['id'] ?? 0);
        $itemType->name = $data['name'] ?? '';
        $itemType->slug = $data['slug'] ?? '';
        $itemType->description = $data['description'] ?? '';
        $itemType->icon = isset($data['icon']) ? (is_array($data['icon']) ? $data['icon'] : maybe_unserialize($data['icon'])) : null;
        $itemType->color = $data['color'] ?? 'blue';
        $itemType->status = $data['status'] ?? 'draft';
        $itemType->created_at = $data['created_at'] ?? '';
        $itemType->updated_at = $data['updated_at'] ?? '';
        $itemType->created_by = (int) ($data['created_by'] ?? 0);
        $itemType->updated_by = (int) ($data['updated_by'] ?? 0);

        return $itemType;
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
            'color' => $this->color,
            'status' => $this->status,
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
            'created_by' => $this->created_by,
            'updated_by' => $this->updated_by,
        ];
    }
}

