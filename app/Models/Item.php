<?php

declare(strict_types=1);

namespace Yatra\Models;

/**
 * Item Model (Item Subtype)
 * Represents an item entity (subtype under item types)
 */
class Item
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
     * @var int Item Type ID
     */
    public int $type_id;

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
        $item = new self();
        
        $item->id = (int) ($data['id'] ?? 0);
        $item->name = $data['name'] ?? '';
        $item->slug = $data['slug'] ?? '';
        $item->description = $data['description'] ?? '';
        $item->type_id = (int) ($data['type_id'] ?? 0);
        $item->status = $data['status'] ?? 'draft';
        $item->created_at = $data['created_at'] ?? '';
        $item->updated_at = $data['updated_at'] ?? '';
        $item->created_by = (int) ($data['created_by'] ?? 0);
        $item->updated_by = (int) ($data['updated_by'] ?? 0);

        return $item;
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
            'type_id' => $this->type_id,
            'status' => $this->status,
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
            'created_by' => $this->created_by,
            'updated_by' => $this->updated_by,
        ];
    }
}

