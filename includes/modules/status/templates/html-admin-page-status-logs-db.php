<?php
if (!defined('ABSPATH')) {
    exit;
}

?>
    <form method="post" id="mainform" action="">
        <?php $log_table_list->search_box(__('Search logs', 'yatra'), 'log'); ?>
        <?php $log_table_list->display(); ?>

        <input type="hidden" name="page" value="yatra-status"/>
        <input type="hidden" name="tab" value="logs"/>

        <?php submit_button(__('Flush all logs', 'yatra'), 'delete', 'yatra-flush-logs'); ?>
        <?php wp_nonce_field('yatra-status-logs'); ?>
    </form>
<?php
yatra_enqueue_js(
    "jQuery( '#yatra-flush-logs' ).on( 'click', function() {
		if ( window.confirm('" . esc_js(__('Are you sure you want to clear all logs from the database?', 'yatra')) . "') ) {
			return true;
		}
		return false;
	});"
);
