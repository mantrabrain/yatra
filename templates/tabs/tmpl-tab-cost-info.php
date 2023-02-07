<h3 class="tab-title"><?php echo wp_kses($icon, array(
        'span' => array('class' => array())
    )) ?><?php echo esc_html($title); ?></h3>
<div class="cost-info-section">
    <div class="yatra-tab-section-inner">
        <div class="cost-info-half cost_included">
            <h4><?php echo esc_html($cost_info['includes_title']) ?></h4>
            <?php echo do_shortcode($cost_info['includes_description']); ?>
        </div>

        <div class="cost-info-half cost_excluded">
            <h4><?php echo esc_html($cost_info['excludes_title']) ?></h4>
            <?php echo do_shortcode($cost_info['excludes_description']); ?>
        </div>

    </div>
</div>

