<?php

declare(strict_types=1);

namespace Yatra\Services;

/**
 * Tracks old → new primary keys during import so foreign keys can be rewritten.
 */
final class ExportImportIdMapper
{
    /** @var array<string, array<int, int>> */
    private array $maps = [];

    public function remember(string $entity, int $oldId, int $newId): void
    {
        if ($oldId <= 0 || $newId <= 0) {
            return;
        }
        $this->maps[$entity][$oldId] = $newId;
    }

    public function map(string $entity, $oldId): ?int
    {
        if ($oldId === null || $oldId === '') {
            return null;
        }
        $old = (int) $oldId;
        if ($old <= 0) {
            return null;
        }

        return $this->maps[$entity][$old] ?? null;
    }

    /**
     * For nullable FKs: unmapped IDs become null to avoid pointing at wrong rows.
     *
     * @param mixed $oldId
     */
    public function mapFkNullable(string $entity, $oldId): ?int
    {
        if ($oldId === null || $oldId === '') {
            return null;
        }
        if ((int) $oldId === 0) {
            return null;
        }

        return $this->map($entity, $oldId);
    }
}
