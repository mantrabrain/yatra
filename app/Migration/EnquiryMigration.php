<?php

namespace Yatra\Migration;

use Yatra\Migration\MigrationProgress;

class EnquiryMigration extends BaseMigration
{
    public function __construct(MigrationProgress $service)
    {
        parent::__construct($service);
    }

    public function run(): array
    {
        return [
            'migrated' => 0,
            'skipped' => 0,
            'failed' => 0,
        ];
    }
}
