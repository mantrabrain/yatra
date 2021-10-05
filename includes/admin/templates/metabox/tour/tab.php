<div class="yatra-admin--tabs">
	<ul>
		<?php foreach ($tabs as $tab_index => $tab) {
			$title = isset($tab['title']) ? $tab['title'] : '';

			$is_active = isset($tab['is_active']) ? (boolean)($tab['is_active']) : false;
			if ($active_tab != '') {
				$is_active = $active_tab === $tab_index;
			}
			$class = $is_active ? 'active' : '';
			?>
			<li data-tab="<?php echo esc_attr($tab_index) ?>"
				class="<?php echo esc_html($class); ?>"><?php echo esc_html($title); ?></li>
		<?php } ?>
	</ul>
</div>
