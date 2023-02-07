<h3 class="tab-title"><?php echo wp_kses($icon, array(
        'span' => array('class' => array())
    )) ?><?php echo esc_html($title); ?></h3>
<div class="text-section">
    <div class="yatra-tab-section-inner">
        <?php echo do_shortcode(wpautop($content)); ?>
    </div><!-- .yatra-tab-section-inner -->
</div>
