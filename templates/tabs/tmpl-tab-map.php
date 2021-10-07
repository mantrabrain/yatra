<h3 class="tab-title"><?php echo  wp_kses($icon, array(
        'span' => array('class' => array())
    )) ?><?php echo esc_html($title); ?></h3>
<?php
echo ($map);