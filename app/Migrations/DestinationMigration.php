<?php

namespace Yatra\Migration;

use Yatra\Migration\MigrationProgress;

class DestinationMigration extends BaseMigration
{
    public function __construct(MigrationProgress $service)
    {
        parent::__construct($service);
    }

    public function run(): array
    {
        return $this->migrateTaxonomy('destination', 'destination', 'destinations');
    }
}
