<h2>Yatra Importer</h2>
<div class="upload-theme yatra-upload-file">
	<p class="install-help">
		<?php
		echo __('If you have a exported tours file, you can upload it from here and import the tour Or You can upload sample tour file. (file format .json)', 'yatra')
		?></p>
	<form method="post" enctype="multipart/form-data" class="wp-upload-form yatra-import-tour-form"
		  action="<?php echo esc_attr('admin-ajax.php'); ?>">
		<label class="screen-reader-text"
			   for="coursesfile"><?php echo esc_html__('Course exported file', 'yatra'); ?></label>
		<input type="file" id="yatra_import_file" name="yatra_import_file" accept=".json">
		<input type="submit" name="install-theme-submit" id="install-theme-submit" class="button"
			   value="<?php echo __('Import Now', 'yatra') ?>"
			   disabled="">

		<input type="hidden" value="yatra_import_content" name="action"/>
		<input type="hidden" value="<?php echo wp_create_nonce('wp_yatra_import_content_nonce') ?>"
			   name="yatra_nonce"/>

	</form>
</div>
