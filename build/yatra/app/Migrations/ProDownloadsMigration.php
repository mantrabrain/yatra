<?php

namespace Yatra\Migration;

use Yatra\Database\Tables\TripsTable;
use Yatra\Utils\Logger;

/**
 * Migrate legacy Pro tour downloads into TripsTable.custom_fields JSON.
 *
 * Legacy:
 * - option: yatra_global_downloadable_files (comma-separated attachment IDs)
 * - postmeta (tour): downloads_downloadable_files (comma-separated attachment IDs)
 * - postmeta (tour): downloads_description (HTML/text)
 *
 * New:
 * - TripsTable.custom_fields JSON under key `downloads`:
 *   { global_files: string[], files: string[], description: string }
 */
class ProDownloadsMigration extends BaseMigration
{
    public function run(): array
    {
        $migrated = 0;
        $skipped = 0;
        $failed = 0;

        $tripsTable = TripsTable::getTableName();

        $global = (string) get_option('yatra_global_downloadable_files', '');
        $globalList = $this->csvToList($global);

        $rows = $this->wpdb->get_results(
            $this->wpdb->prepare(
                "SELECT pm.post_id AS tour_id, pm.meta_value AS files
                 FROM {$this->wpdb->postmeta} pm
                 INNER JOIN {$this->wpdb->posts} p ON p.ID = pm.post_id
                 WHERE p.post_type = %s
                 AND pm.meta_key = %s
                 AND pm.meta_value <> ''",
                'tour',
                'downloads_downloadable_files'
            )
        );

        $total = (is_array($rows) ? count($rows) : 0) + ($globalList !== [] ? 1 : 0);
        if ($total === 0) {
            return compact('migrated', 'skipped', 'failed');
        }

        // Apply global downloads to every migrated trip (only when we have a migrated trip row).
        if ($globalList !== []) {
            try {
                $tripIds = $this->wpdb->get_col("SELECT id FROM {$tripsTable}");
                if (is_array($tripIds)) {
                    foreach ($tripIds as $tripId) {
                        $tripId = (int) $tripId;
                        $this->mergeTripDownloads($tripsTable, $tripId, [
                            'global_files' => $globalList,
                        ]);
                    }
                }
                $migrated++;
                $this->updateProgress('pro_downloads', 'running', $migrated, $skipped, $failed, $total, null, null);
            } catch (\Throwable $e) {
                $failed++;
                Logger::error('ProDownloadsMigration: global merge failed', [
                    'source' => 'migration',
                    'error' => $e->getMessage(),
                ]);
                $this->updateProgress('pro_downloads', 'running', $migrated, $skipped, $failed, $total, null, null);
            }
        }

        foreach (($rows ?: []) as $row) {
            try {
                $tourId = (int) ($row->tour_id ?? 0);
                if ($tourId <= 0) {
                    $skipped++;
                    $this->updateProgress('pro_downloads', 'running', $migrated, $skipped, $failed, $total, null, null);
                    continue;
                }

                $newTripId = $this->getMigratedTripId($tourId);
                if (!$newTripId) {
                    $skipped++;
                    $this->updateProgress('pro_downloads', 'running', $migrated, $skipped, $failed, $total, null, null);
                    continue;
                }

                $files = $this->csvToList((string) ($row->files ?? ''));
                $desc = (string) ($this->getRawPostMeta($tourId, 'downloads_description') ?? '');

                $this->mergeTripDownloads($tripsTable, (int) $newTripId, [
                    'files' => $files,
                    'description' => $desc,
                ]);

                $migrated++;
                $this->updateProgress('pro_downloads', 'running', $migrated, $skipped, $failed, $total, null, null);
            } catch (\Throwable $e) {
                $failed++;
                Logger::error('ProDownloadsMigration exception', [
                    'source' => 'migration',
                    'error' => $e->getMessage(),
                ]);
                $this->updateProgress('pro_downloads', 'running', $migrated, $skipped, $failed, $total, null, null);
            }
        }

        return compact('migrated', 'skipped', 'failed');
    }

    /**
     * @return list<string>
     */
    private function csvToList(string $csv): array
    {
        $csv = trim($csv);
        if ($csv === '') {
            return [];
        }
        $parts = array_map('trim', explode(',', $csv));
        $parts = array_values(array_filter($parts, static fn ($v) => $v !== ''));

        return $parts;
    }

    /**
     * @param array{global_files?: list<string>, files?: list<string>, description?: string} $payload
     */
    private function mergeTripDownloads(string $tripsTable, int $tripId, array $payload): void
    {
        $existing = $this->wpdb->get_var($this->wpdb->prepare("SELECT custom_fields FROM {$tripsTable} WHERE id = %d", $tripId));
        $custom = [];
        if (is_string($existing) && $existing !== '') {
            $decoded = json_decode($existing, true);
            if (is_array($decoded)) {
                $custom = $decoded;
            }
        }

        $downloads = [];
        if (isset($custom['downloads']) && is_array($custom['downloads'])) {
            $downloads = $custom['downloads'];
        }

        if (isset($payload['global_files'])) {
            $prev = isset($downloads['global_files']) && is_array($downloads['global_files']) ? $downloads['global_files'] : [];
            $downloads['global_files'] = array_values(array_unique(array_merge($prev, $payload['global_files'])));
        }
        if (isset($payload['files'])) {
            $prev = isset($downloads['files']) && is_array($downloads['files']) ? $downloads['files'] : [];
            $downloads['files'] = array_values(array_unique(array_merge($prev, $payload['files'])));
        }
        if (isset($payload['description']) && $payload['description'] !== '') {
            if (empty($downloads['description']) || $this->isForceMigration()) {
                $downloads['description'] = $payload['description'];
            }
        }

        $custom['downloads'] = $downloads;

        $this->wpdb->update(
            $tripsTable,
            ['custom_fields' => json_encode($custom)],
            ['id' => $tripId]
        );
    }
}

