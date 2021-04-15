<hr/>
<h2>Yatra Exporter</h2>
<form method="post" class="yatra_export_form">

	<?php
	foreach ($yatra_export_type_lists as $export_key_type => $export_types) {
		foreach ($export_types as $yatra_export_type) {
			echo '<p><label><input checked type="checkbox" name="yatra_export_type_list_array['.esc_attr($export_key_type).'][]" value="' . esc_attr($yatra_export_type) . '">' . esc_html(ucwords($yatra_export_type)) . '</label></p>';
		}
	}
	?>
	<p class="submit"><input type="submit" name="submit" id="submit" class="button button-primary"
							 value="Download Export File"></p>

	<input type="hidden" value="yatra_export" name="yatra_action"/>
	<input type="hidden" value="yatra_export" name="yatra_export_notice"/>
	<input type="hidden" value="<?php echo wp_create_nonce('wp_yatra_export_nonce') ?>"
		   name="yatra_nonce"/>
</form>
