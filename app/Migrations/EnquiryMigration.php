<?php

namespace Yatra\Migration;

use Yatra\Database\Tables\EnquiriesTable;
use Yatra\Migration\MigrationProgress;
use Yatra\Utils\Logger;

/**
 * EnquiryMigration - Migrates enquiries from old Yatra custom table to new table.
 *
 * Old system: wp_yatra_tour_enquiries
 *   Columns: id, tour_id, fullname, email, country, phone_number,
 *            number_of_adults, number_of_childs, message, subject,
 *            additional_fields, ip_address, created_at
 *
 * New system: wp_yatra_new_enquiries
 *   Columns: id, trip_id, name, email, phone, message, travel_date,
 *            metadata (JSON), travelers_count, status, response_notes,
 *            responded_at, responded_by, ip_address, user_agent, source,
 *            created_at, updated_at, created_by
 *
 * Field mapping:
 *   tour_id          → trip_id  (looked up via _migrated_to_trip_id post meta)
 *   fullname         → name
 *   email            → email
 *   phone_number     → phone
 *   number_of_adults + number_of_childs → travelers_count + metadata.traveler_categories
 *   country          → metadata.country
 *   subject          → metadata.subject
 *   additional_fields → metadata.additional_fields
 *   ip_address       → ip_address
 *   created_at       → created_at / updated_at
 */
class EnquiryMigration extends BaseMigration
{
    public function __construct(MigrationProgress $service)
    {
        parent::__construct($service);
    }

    public function run(): array
    {
        $migrated = 0;
        $skipped  = 0;
        $failed   = 0;

        $oldTable = $this->wpdb->prefix . 'yatra_tour_enquiries';

        // Bail early if the old table does not exist.
        if ($this->wpdb->get_var("SHOW TABLES LIKE '{$oldTable}'") !== $oldTable) {
            Logger::info('No old yatra_tour_enquiries table found — skipping enquiry migration.', [
                'source' => 'migration',
            ]);
            return compact('migrated', 'skipped', 'failed');
        }

        $oldEnquiries = $this->wpdb->get_results("SELECT * FROM {$oldTable} ORDER BY id ASC");
        $total        = count($oldEnquiries);

        if ($total === 0) {
            Logger::info('Old enquiry table exists but is empty.', ['source' => 'migration']);
            return compact('migrated', 'skipped', 'failed');
        }

        Logger::info("Found {$total} enquiries to migrate.", [
            'source' => 'migration',
            'count'  => $total,
        ]);

        $newTable = EnquiriesTable::getTableName();

        foreach ($oldEnquiries as $enquiry) {
            try {
                $oldId = (int) $enquiry->id;
                $email = sanitize_email($enquiry->email ?? '');

                if (empty($email)) {
                    $skipped++;
                    Logger::debug("Enquiry #{$oldId} skipped — no email address.", ['source' => 'migration']);
                    $this->updateProgress('enquiries', 'running', $migrated, $skipped, $failed, $total, null, null);
                    continue;
                }

                // ---------- Resolve new trip_id ----------
                $oldTourId = (int) ($enquiry->tour_id ?? 0);
                $newTripId = null;

                if ($oldTourId > 0) {
                    $newTripId = $this->getMigratedTripId($oldTourId);

                    // Fallback: look up by the old post title in the new trips table.
                    if (!$newTripId) {
                        $oldTourTitle = $this->wpdb->get_var($this->wpdb->prepare(
                            "SELECT post_title FROM {$this->wpdb->posts}
                             WHERE ID = %d AND post_type = 'tour' LIMIT 1",
                            $oldTourId
                        ));

                        if ($oldTourTitle) {
                            $newTripId = $this->wpdb->get_var($this->wpdb->prepare(
                                "SELECT id FROM " . \Yatra\Database\Tables\TripsTable::getTableName() . "
                                 WHERE title = %s LIMIT 1",
                                $oldTourTitle
                            ));
                        }
                    }
                }

                // ---------- Duplicate detection ----------
                // Consider an enquiry a duplicate when the same email submitted for
                // the same (possibly null) trip_id on the same day.
                $createdDate = !empty($enquiry->created_at)
                    ? date('Y-m-d', strtotime($enquiry->created_at))
                    : null;

                if (!$this->isForceMigration()) {
                    if ($newTripId) {
                        $existingId = $this->wpdb->get_var($this->wpdb->prepare(
                            "SELECT id FROM {$newTable}
                             WHERE email = %s AND trip_id = %d AND DATE(created_at) = %s
                             LIMIT 1",
                            $email,
                            $newTripId,
                            $createdDate ?? date('Y-m-d')
                        ));
                    } else {
                        $existingId = $this->wpdb->get_var($this->wpdb->prepare(
                            "SELECT id FROM {$newTable}
                             WHERE email = %s AND trip_id IS NULL AND DATE(created_at) = %s
                             LIMIT 1",
                            $email,
                            $createdDate ?? date('Y-m-d')
                        ));
                    }

                    if ($existingId) {
                        $skipped++;
                        Logger::debug("Enquiry #{$oldId} skipped — already migrated (new ID {$existingId}).", [
                            'source' => 'migration',
                        ]);
                        $this->updateProgress('enquiries', 'running', $migrated, $skipped, $failed, $total, null, null);
                        continue;
                    }
                }

                // ---------- Traveler counts ----------
                $adults   = (int) ($enquiry->number_of_adults ?? 0);
                $children = (int) ($enquiry->number_of_childs  ?? 0);
                $travelersCount = $adults + $children;

                // ---------- Build metadata JSON ----------
                $metadata = [];

                if (!empty($enquiry->country)) {
                    $metadata['country'] = sanitize_text_field($enquiry->country);
                }

                if (!empty($enquiry->subject)) {
                    $metadata['subject'] = sanitize_text_field($enquiry->subject);
                }

                if ($adults > 0 || $children > 0) {
                    $metadata['traveler_categories'] = [];
                    if ($adults > 0) {
                        $metadata['traveler_categories'][] = [
                            'title' => 'Adult',
                            'count' => $adults,
                        ];
                    }
                    if ($children > 0) {
                        $metadata['traveler_categories'][] = [
                            'title' => 'Child',
                            'count' => $children,
                        ];
                    }
                }

                if (!empty($enquiry->additional_fields)) {
                    $parsed = maybe_unserialize($enquiry->additional_fields);
                    $metadata['additional_fields'] = is_array($parsed)
                        ? $parsed
                        : $enquiry->additional_fields;
                }

                $metadataJson = !empty($metadata) ? wp_json_encode($metadata) : null;

                // ---------- Normalise created_at ----------
                $createdAt = null;
                if (!empty($enquiry->created_at)) {
                    $ts = strtotime($enquiry->created_at);
                    $createdAt = $ts ? date('Y-m-d H:i:s', $ts) : current_time('mysql');
                } else {
                    $createdAt = current_time('mysql');
                }

                // ---------- Build insert row ----------
                $insertData = [
                    'trip_id'         => $newTripId ?: null,
                    'name'            => sanitize_text_field($enquiry->fullname ?? ''),
                    'email'           => $email,
                    'phone'           => sanitize_text_field($enquiry->phone_number ?? ''),
                    'message'         => wp_kses_post($enquiry->message ?? ''),
                    'travel_date'     => null,
                    'metadata'        => $metadataJson,
                    'travelers_count' => $travelersCount > 0 ? $travelersCount : null,
                    'status'          => 'new',
                    'ip_address'      => sanitize_text_field($enquiry->ip_address ?? ''),
                    'source'          => 'website',
                    'created_at'      => $createdAt,
                    'updated_at'      => $createdAt,
                ];

                $inserted = $this->wpdb->insert($newTable, $insertData);

                if ($inserted) {
                    $migrated++;
                    Logger::debug("Enquiry #{$oldId} migrated as new enquiry #{$this->wpdb->insert_id}.", [
                        'source'      => 'migration',
                        'old_tour_id' => $oldTourId,
                        'new_trip_id' => $newTripId,
                        'email'       => $email,
                    ]);
                } else {
                    $failed++;
                    Logger::error("Failed to insert enquiry #{$oldId}: {$this->wpdb->last_error}", [
                        'source' => 'migration',
                        'old_id' => $oldId,
                        'email'  => $email,
                        'error'  => $this->wpdb->last_error,
                    ]);
                }

                $this->updateProgress('enquiries', 'running', $migrated, $skipped, $failed, $total, null, null);

            } catch (\Throwable $e) {
                $failed++;
                Logger::error("Exception migrating enquiry #{$enquiry->id}: {$e->getMessage()}", [
                    'source' => 'migration',
                    'old_id' => $enquiry->id ?? 'unknown',
                    'error'  => $e->getMessage(),
                ]);
                $this->updateProgress('enquiries', 'running', $migrated, $skipped, $failed, $total, null, null);
            }
        }

        Logger::info("Enquiry migration complete.", [
            'source'   => 'migration',
            'migrated' => $migrated,
            'skipped'  => $skipped,
            'failed'   => $failed,
        ]);

        return compact('migrated', 'skipped', 'failed');
    }
}
