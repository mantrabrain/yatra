<?php

namespace Yatra\Database\Tables;

class LegacyTourDatesTable extends BaseTable
{
    protected static string $table = 'yatra_tour_dates';

    public static function getSchema(): string
    {
        return '';
    }
}
