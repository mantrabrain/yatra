<h3 class="tab-title"><?php echo wp_kses($icon, array(
        'span' => array('class' => array())
    )) ?><?php echo esc_html($title); ?></h3>
<div class="overview-section">
	<div class="yatra-tab-section-inner">
		<?php echo $content; ?>
	</div><!-- .yatra-tab-section-inner -->
</div>
