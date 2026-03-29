<?php

namespace Yatra\Migration;

use Yatra\Database\Tables\CustomersTable;
use Yatra\Migration\MigrationProgress;
use Yatra\Utils\Logger;

/**
 * CustomerMigration - Migrates customers from old Yatra CPT (yatra-customers) to new custom table.
 *
 * Old system: Custom Post Type 'yatra-customers'
 *   - post_title = customer email
 *   - post_meta keys from yatra_tour_customer_info: fullname, email, phone, country, etc.
 *   - post_meta 'yatra_customer_booking_meta' = array of booking meta params
 *   - post_meta 'yatra_user_id' = WordPress user ID
 *
 * New system: Custom table wp_yatra_new_customers
 */
class CustomerMigration extends BaseMigration
{
    public function __construct(MigrationProgress $service)
    {
        parent::__construct($service);
    }

    public function run(): array
    {
        $migrated = 0;
        $skipped = 0;
        $failed = 0;

        // Old customers are stored as CPT 'yatra-customers' in wp_posts
        $oldCustomers = $this->wpdb->get_results(
            "SELECT * FROM {$this->wpdb->posts} 
             WHERE post_type = 'yatra-customers' 
             AND post_status NOT IN ('trash', 'auto-draft')"
        );
        $total = count($oldCustomers);

        if ($total === 0) {
            return compact('migrated', 'skipped', 'failed');
        }

        Logger::info("Found {$total} old customers to migrate", ['source' => 'migration', 'data_type' => 'customers']);

        foreach ($oldCustomers as $oldCustomer) {
            try {
                // Check if already migrated
                $migratedId = $this->getRawPostMeta($oldCustomer->ID, '_migrated_to_customer_id');
                if ($migratedId && !$this->isForceMigration()) {
                    $skipped++;
                    $this->updateProgress('customers', 'running', $migrated, $skipped, $failed, $total, null, null);
                    continue;
                }

                $meta = $this->getPostMeta($oldCustomer->ID);

                // In old system, post_title is the customer email
                $email = $oldCustomer->post_title;

                // Customer info is stored as individual post meta keys
                // These come from yatra_tour_customer_info array saved during booking
                $fullname = $meta['fullname'] ?? $meta['full_name'] ?? $meta['name'] ?? '';
                $phone = $meta['phone'] ?? $meta['phone_number'] ?? $meta['contact'] ?? '';
                $country = $meta['country'] ?? '';
                $address = $meta['address'] ?? '';
                $city = $meta['city'] ?? '';
                $wpUserId = $meta['yatra_user_id'] ?? null;

                // Parse fullname into first/last
                $nameParts = $this->parseFullName($fullname);

                // Check if customer with this email already exists in new table
                $existingCustomerId = $this->wpdb->get_var($this->wpdb->prepare(
                    "SELECT id FROM " . CustomersTable::getTableName() . " WHERE email = %s",
                    $email
                ));

                $customerData = [
                    'first_name' => $nameParts['first_name'],
                    'last_name' => $nameParts['last_name'],
                    'email' => $email,
                    'phone' => $phone,
                    'country' => $country,
                    'city' => $city,
                    'address' => $address,
                    'user_id' => !empty($wpUserId) ? (int) $wpUserId : null,
                    'status' => 'active',
                    'created_at' => $oldCustomer->post_date,
                    'updated_at' => $oldCustomer->post_modified,
                ];

                if ($existingCustomerId && !$this->isForceMigration()) {
                    // Update existing customer
                    $updateData = $customerData;
                    unset($updateData['created_at']);

                    $this->wpdb->update(
                        CustomersTable::getTableName(),
                        $updateData,
                        ['id' => $existingCustomerId]
                    );
                    $newCustomerId = $existingCustomerId;
                    $migrated++;
                } else {
                    // Insert new customer
                    $inserted = $this->wpdb->insert(
                        CustomersTable::getTableName(),
                        $customerData
                    );

                    if ($inserted) {
                        $newCustomerId = $this->wpdb->insert_id;
                        $migrated++;
                    } else {
                        $failed++;
                        Logger::error("Failed to insert customer ID {$oldCustomer->ID}: {$this->wpdb->last_error}", [
                            'source' => 'migration',
                            'data_type' => 'customers',
                            'customer_id' => $oldCustomer->ID,
                            'email' => $email,
                        ]);
                        $this->updateProgress('customers', 'running', $migrated, $skipped, $failed, $total, null, null);
                        continue;
                    }
                }

                // Mark as migrated
                $this->setRawPostMeta($oldCustomer->ID, '_migrated_to_customer_id', (string) $newCustomerId);

                $this->updateProgress('customers', 'running', $migrated, $skipped, $failed, $total, null, null);
            } catch (\Exception $e) {
                $failed++;
                Logger::error("Exception migrating customer ID {$oldCustomer->ID}: {$e->getMessage()}", [
                    'source' => 'migration',
                    'data_type' => 'customers',
                    'customer_id' => $oldCustomer->ID,
                ]);
                $this->updateProgress('customers', 'running', $migrated, $skipped, $failed, $total, null, null);
            }
        }

        return compact('migrated', 'skipped', 'failed');
    }

    /**
     * Parse a full name string into first and last name parts
     */
    private function parseFullName(string $fullname): array
    {
        $fullname = trim($fullname);

        if (empty($fullname)) {
            return ['first_name' => '', 'last_name' => ''];
        }

        $parts = preg_split('/\s+/', $fullname, 2);

        return [
            'first_name' => $parts[0] ?? '',
            'last_name' => $parts[1] ?? '',
        ];
    }
}
