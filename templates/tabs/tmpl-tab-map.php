<h3 class="tab-title"><?php echo wp_kses($icon, array(
        'span' => array('class' => array())
    )) ?><?php echo esc_html($title); ?></h3>

<div class="map-section">
    <div class="yatra-tab-section-inner">
        <?php echo do_shortcode(wp_kses($map, array(
            'iframe' => array(
                'src' => array(),
                'border' => array(),
                'width' => array(),
                'height' => array(),
                'frameborder' => array(),
                'allowfullscreen' => array()
            ),
            'img' => array('src' => array(), 'height' => array(), 'width' => array())
        ))); ?>
    </div><!-- .yatra-tab-section-inner -->
</div>