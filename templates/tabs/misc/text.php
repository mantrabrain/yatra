<h3 class="tab-title"><?php echo wp_kses($icon, array(
        'span' => array('class' => array())
    )) ?><?php echo esc_html($title); ?></h3>
<div class="overview-section">
	<div class="sec-row row">
		<?php echo $content; ?>
	</div><!-- .sec-row -->
</div>
