<?php

declare(strict_types=1);

namespace Yatra\Repositories;

/**
 * Additional Services Repository
 *
 * Provides read access to the additional services table, if present.
 * Table schema differs across versions / Pro, so we resolve table + columns at runtime.
 */
class AdditionalServicesRepository extends BaseRepository
{
    private ?string $resolvedTable = null;
    private ?array $resolvedColumns = null;

    protected function getTableName(): string
    {
        return $this->getResolvedTable();
    }

    private function getResolvedTable(): string
    {
        if ($this->resolvedTable !== null) {
            return $this->resolvedTable;
        }

        // Candidate table names (avoid hardcoding wp_ prefix).
        $candidates = [
            $this->wpdb->prefix . 'yatra_additional_services',
        ];

        foreach ($candidates as $candidate) {
            $pattern = $this->wpdb->esc_like($candidate);
            $exists = $this->wpdb->get_var($this->wpdb->prepare('SHOW TABLES LIKE %s', $pattern));
            if ($exists === $candidate) {
                $this->resolvedTable = $candidate;
                return $candidate;
            }
        }

        // Not installed (e.g. Pro not active) — keep as prefix candidate for consistency,
        // but callers should treat "no columns" as "no data".
        $this->resolvedTable = $this->wpdb->prefix . 'yatra_additional_services';
        return $this->resolvedTable;
    }

    /**
     * Resolve columns for current schema.
     *
     * @return array{nameCol: string|null, priceCol: string|null, descCol: string|null, priceTypeCol: string|null, pricePerCol: string|null}
     */
    private function getResolvedColumns(): array
    {
        if ($this->resolvedColumns !== null) {
            return $this->resolvedColumns;
        }

        $table = $this->getResolvedTable();
        $columns = $this->wpdb->get_col("DESCRIBE {$table}", 0);
        $columns = is_array($columns) ? $columns : [];

        $has = static function (string $col) use ($columns): bool {
            return in_array($col, $columns, true);
        };

        $nameCol = $has('name') ? 'name' : ($has('title') ? 'title' : null);
        $priceCol = $has('price') ? 'price' : ($has('service_price') ? 'service_price' : null);
        $descCol = $has('description') ? 'description' : null;
        $priceTypeCol = $has('price_type') ? 'price_type' : null;
        $pricePerCol = $has('price_per') ? 'price_per' : null;

        $this->resolvedColumns = [
            'nameCol' => $nameCol,
            'priceCol' => $priceCol,
            'descCol' => $descCol,
            'priceTypeCol' => $priceTypeCol,
            'pricePerCol' => $pricePerCol,
        ];

        return $this->resolvedColumns;
    }

    /**
     * Fetch services by IDs (preserving input order).
     *
     * @param int[] $ids
     * @return array<int, array{id:int,name:string,description:string,price:float,price_type?:string,price_per?:string}>
     */
    public function getByIds(array $ids): array
    {
        $ids = array_values(array_unique(array_map('intval', array_filter($ids))));
        if ($ids === []) {
            return [];
        }

        $table = $this->getResolvedTable();
        $cols = $this->getResolvedColumns();
        $nameCol = $cols['nameCol'];
        $priceCol = $cols['priceCol'];
        $descCol = $cols['descCol'];
        $priceTypeCol = $cols['priceTypeCol'];
        $pricePerCol = $cols['pricePerCol'];

        if ($nameCol === null && $priceCol === null) {
            return [];
        }

        $selectCols = ['id'];
        if ($nameCol !== null) {
            $selectCols[] = $nameCol;
        }
        if ($descCol !== null) {
            $selectCols[] = $descCol;
        }
        if ($priceCol !== null) {
            $selectCols[] = $priceCol;
        }
        if ($priceTypeCol !== null) {
            $selectCols[] = $priceTypeCol;
        }
        if ($pricePerCol !== null) {
            $selectCols[] = $pricePerCol;
        }

        $placeholders = implode(',', array_fill(0, count($ids), '%d'));
        $rows = $this->wpdb->get_results($this->wpdb->prepare(
            'SELECT ' . implode(', ', $selectCols) . " FROM {$table} WHERE id IN ({$placeholders})",
            ...$ids
        )) ?: [];

        $index = [];
        foreach ($rows as $row) {
            if (!is_object($row) || empty($row->id)) {
                continue;
            }
            $index[(int) $row->id] = $row;
        }

        $out = [];
        foreach ($ids as $id) {
            if (!isset($index[$id])) {
                continue;
            }
            $row = $index[$id];

            $label = '';
            if ($nameCol !== null && !empty($row->{$nameCol})) {
                $label = (string) $row->{$nameCol};
            }

            $price = 0.0;
            if ($priceCol !== null && isset($row->{$priceCol})) {
                $price = (float) $row->{$priceCol};
            }

            $desc = '';
            if ($descCol !== null && isset($row->{$descCol})) {
                $desc = (string) $row->{$descCol};
            }

            $out[] = [
                'id' => (int) $row->id,
                'name' => $label,
                'description' => $desc,
                'price' => $price,
                'price_type' => $priceTypeCol !== null && isset($row->{$priceTypeCol}) ? (string) $row->{$priceTypeCol} : null,
                'price_per' => $pricePerCol !== null && isset($row->{$pricePerCol}) ? (string) $row->{$pricePerCol} : null,
            ];
        }

        return $out;
    }
}

