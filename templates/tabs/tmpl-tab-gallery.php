<h3 class="tab-title"><?php echo wp_kses($icon, array(
        'span' => array('class' => array())
    )) ?><?php echo esc_html($title); ?></h3>

<ul class="yatra-tour-gallery">
    <?php

    foreach ($attachments as $attachment) {

        echo '<li class="yatra-gallery-item">';

        echo '<a href="' . esc_url($attachment['url']) . '" data-lightbox="yatra-tour-gallery-1" data-title="' . esc_attr($attachment['caption']) . '" title="' . esc_attr($attachment['title']) . '">';

        echo '<img src="' . esc_url($attachment['url']) . '" alt="' . esc_attr($attachment['alt']) . '" title="' . esc_attr($attachment['title']) . '"/>';

        echo '</a>';


        echo '</li>';
    }
    ?>
</ul>
