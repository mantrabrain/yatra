<?php

class Yatra_Module_Section_Logs
{
    public function __construct()
    {
        $log_handler = defined('YATRA_LOG_HANDLER') ? YATRA_LOG_HANDLER : '';

        if ('Yatra_Log_Handler_DB' === $log_handler) {

            self::status_logs_db();

        } else {
            self::status_logs_file();
        }
    }

    public static function get_log_file_handle($filename)
    {
        return substr($filename, 0, strlen($filename) > 48 ? strlen($filename) - 48 : strlen($filename) - 4);
    }

    public static function scan_log_files()
    {
        return Yatra_Log_Handler_File::get_log_files();
    }

    public static function remove_log()
    {
        if (empty($_REQUEST['_wpnonce']) || !wp_verify_nonce(wp_unslash($_REQUEST['_wpnonce']), 'remove_log')) { // WPCS: input var ok, sanitization ok.
            wp_die(esc_html__('Action failed. Please refresh the page and retry.', 'woocommerce'));
        }

        if (!empty($_REQUEST['handle'])) {  // WPCS: input var ok.
            $log_handler = new Yatra_Log_Handler_File();
            $log_handler->remove(wp_unslash($_REQUEST['handle'])); // WPCS: input var ok, sanitization ok.
        }

        wp_safe_redirect(esc_url_raw(admin_url('admin.php?page=yatra-status&tab=logs')));
        exit();
    }

    public static function status_logs_file()
    {
        $logs = self::scan_log_files();

        if (!empty($_REQUEST['log_file']) && isset($logs[sanitize_title(wp_unslash($_REQUEST['log_file']))])) { // WPCS: input var ok, CSRF ok.
            $viewed_log = $logs[sanitize_title(wp_unslash($_REQUEST['log_file']))]; // WPCS: input var ok, CSRF ok.
        } elseif (!empty($logs)) {
            $viewed_log = current($logs);
        }

        $handle = !empty($viewed_log) ? self::get_log_file_handle($viewed_log) : '';

        if (!empty($_REQUEST['handle'])) { // WPCS: input var ok, CSRF ok.
            self::remove_log();
        }

        include YATRA_ABSPATH . 'includes/modules/status/templates/html-admin-page-status-logs.php';
    }

    private static function flush_db_logs()
    {
        if (empty($_REQUEST['_wpnonce']) || !wp_verify_nonce($_REQUEST['_wpnonce'], 'woocommerce-status-logs')) { // WPCS: input var ok, sanitization ok.
            wp_die(esc_html__('Action failed. Please refresh the page and retry.', 'woocommerce'));
        }

        WC_Log_Handler_DB::flush();

        wp_safe_redirect(esc_url_raw(admin_url('admin.php?page=yatra-status&tab=logs')));
        exit();
    }

    private static function log_table_bulk_actions()
    {
        if (empty($_REQUEST['_wpnonce']) || !wp_verify_nonce($_REQUEST['_wpnonce'], 'woocommerce-status-logs')) { // WPCS: input var ok, sanitization ok.
            wp_die(esc_html__('Action failed. Please refresh the page and retry.', 'woocommerce'));
        }

        $log_ids = array_map('absint', (array)isset($_REQUEST['log']) ? wp_unslash($_REQUEST['log']) : array()); // WPCS: input var ok, sanitization ok.

        if ((isset($_REQUEST['action']) && 'delete' === $_REQUEST['action']) || (isset($_REQUEST['action2']) && 'delete' === $_REQUEST['action2'])) { // WPCS: input var ok, sanitization ok.
            WC_Log_Handler_DB::delete($log_ids);
            wp_safe_redirect(esc_url_raw(admin_url('admin.php?page=yatra-status&tab=logs')));
            exit();
        }
    }

    public static function status_logs_db()
    {
        if (!empty($_REQUEST['flush-logs'])) { // WPCS: input var ok, CSRF ok.
            self::flush_db_logs();
        }

        if (isset($_REQUEST['action']) && isset($_REQUEST['log'])) { // WPCS: input var ok, CSRF ok.
            self::log_table_bulk_actions();
        }

        $log_table_list = new Yatra_Admin_Log_Table_List();
        $log_table_list->prepare_items();

        include YATRA_ABSPATH . 'includes/modules/status/templates/html-admin-page-status-logs-db.php';
    }
}

new Yatra_Module_Section_Logs();