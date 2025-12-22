<?php

namespace Yatra\Migration;

use Yatra\Migration\MigrationProgress;

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

        $oldTable = $this->wpdb->prefix . 'yatra_customer';

        if (!$this->tableExists($oldTable)) {
            return compact('migrated', 'skipped', 'failed');
        }

        $oldCustomers = $this->wpdb->get_results("SELECT * FROM {$oldTable}");
        $total = count($oldCustomers);

        foreach ($oldCustomers as $oldCustomer) {
            try {
                $inserted = $this->wpdb->insert(
                    $this->wpdb->prefix . 'yatra_customers',
                    [
                        'first_name' => $oldCustomer->first_name ?? '',
                        'last_name' => $oldCustomer->last_name ?? '',
                        'email' => $oldCustomer->email ?? '',
                        'phone' => $oldCustomer->phone ?? '',
                        'country' => $oldCustomer->country ?? '',
                        'city' => $oldCustomer->city ?? '',
                        'address' => $oldCustomer->address ?? '',
                        'created_at' => $oldCustomer->created_at ?? current_time('mysql'),
                        'updated_at' => $oldCustomer->updated_at ?? current_time('mysql'),
                    ]
                );

                if ($inserted) {
                    $migrated++;
                } else {
                    $failed++;
                }

                $this->updateProgress('customers', 'running', $migrated, $skipped, $failed, $total, null, null);
            } catch (\Exception $e) {
                $failed++;
                $this->updateProgress('customers', 'running', $migrated, $skipped, $failed, $total, null, null);
            }
        }

        return compact('migrated', 'skipped', 'failed');
    }
}
