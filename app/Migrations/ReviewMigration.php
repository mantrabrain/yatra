<?php

namespace Yatra\Migration;

use Yatra\Migration\MigrationProgress;

class ReviewMigration
{
    private MigrationProgress $service;

    public function __construct(MigrationProgress $service)
    {
        $this->service = $service;
    }

    public function run(): array
    {
        return $this->service->migrateReviews();
    }
}
