<?php

declare(strict_types=1);

namespace Yatra\Models;

/**
 * Traveler Category Model
 * Represents a traveler category entity
 */
class TravelerCategory
{
    /**
     * @var int
     */
    public int $id;

    /**
     * @var string
     */
    public string $label;

    /**
     * @var string
     */
    public string $slug;

    /**
     * @var string
     */
    public string $description;

    /**
     * @var int|null
     */
    public ?int $age_min;

    /**
     * @var int|null
     */
    public ?int $age_max;

    /**
     * @var string Pricing mode (per_person or per_group)
     */
    public string $pricing_mode;

    /**
     * @var int|null Minimum group size when pricing per group
     */
    public ?int $min_pax;

    /**
     * @var int|null Maximum group size when pricing per group
     */
    public ?int $max_pax;

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
        $category = new self();
        
        $category->id = (int) ($data['id'] ?? 0);
        $category->label = $data['label'] ?? '';
        $category->slug = $data['slug'] ?? '';
        $category->description = $data['description'] ?? '';
        $category->age_min = isset($data['age_min']) && $data['age_min'] !== '' ? (int) $data['age_min'] : null;
        $category->age_max = isset($data['age_max']) && $data['age_max'] !== '' ? (int) $data['age_max'] : null;
        $category->pricing_mode = isset($data['pricing_mode']) && in_array($data['pricing_mode'], ['per_person', 'per_group'], true)
            ? $data['pricing_mode']
            : 'per_person';
        $category->min_pax = isset($data['min_pax']) && $data['min_pax'] !== '' ? (int) $data['min_pax'] : null;
        $category->max_pax = isset($data['max_pax']) && $data['max_pax'] !== '' ? (int) $data['max_pax'] : null;
        $category->icon = isset($data['icon']) ? (is_array($data['icon']) ? $data['icon'] : maybe_unserialize($data['icon'])) : null;
        $category->status = $data['status'] ?? 'draft';
        $category->created_at = $data['created_at'] ?? '';
        $category->updated_at = $data['updated_at'] ?? '';
        $category->created_by = (int) ($data['created_by'] ?? 0);
        $category->updated_by = (int) ($data['updated_by'] ?? 0);

        return $category;
    }

    /**
     * Convert to array
     */
    public function toArray(): array
    {
        return [
            'id' => $this->id,
            'label' => $this->label,
            'slug' => $this->slug,
            'description' => $this->description,
            'age_min' => $this->age_min,
            'age_max' => $this->age_max,
            'pricing_mode' => $this->pricing_mode,
            'min_pax' => $this->min_pax,
            'max_pax' => $this->max_pax,
            'icon' => $this->icon,
            'status' => $this->status,
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
            'created_by' => $this->created_by,
            'updated_by' => $this->updated_by,
        ];
    }
}

