<?php
/**
 * Admin View: Page - Status Database Logs
 *
 * @package WooCommerce\Admin\Logs
 */

if (!defined('ABSPATH')) {
    exit;
}

?>
    <form method="post" id="mainform" action="">
        <?php $log_table_list->search_box(__('Search logs', 'yatra'), 'log'); ?>
        <?php $log_table_list->display(); ?>

        <input type="hidden" name="page" value="yatra-status"/>
        <input type="hidden" name="tab" value="logs"/>

        <?php submit_button(__('Flush all logs', 'yatra'), 'delete', 'flush-logs'); ?>
        <?php wp_nonce_field('yatra-status-logs'); ?>
    </form>
<?php
wc_enqueue_js(
    "jQuery( '#flush-logs' ).on( 'click', function() {
		if ( window.confirm('" . esc_js(__('Are you sure you want to clear all logs from the database?', 'yatra')) . "') ) {
			return true;
		}
		return false;
	});"
);
