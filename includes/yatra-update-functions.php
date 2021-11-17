<?php
if (!function_exists('yatra_update_2100_tour_dates_table_create')) {

    function yatra_update_2100_tour_dates_table_create()
    {
        Yatra_Install::verify_base_tables(true);
    }
}

if (!function_exists('yatra_update_2130_logs_update')) {

    function yatra_update_2130_logs_update()
    {
        Yatra_Install::verify_base_tables(true);

        yatra()->get_log_dir();
    }
}

