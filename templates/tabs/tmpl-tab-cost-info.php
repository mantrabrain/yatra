<h3><?php echo esc_html($title); ?></h3>
<?php

foreach ($cost_info as $cost) {


    echo '<div class="cost-info-half ' . esc_attr($cost['id']) . '">';
    echo '<h4>' . esc_html($cost['title']) . '</h4>';
    echo $cost['text'];

    echo '</div>';

}
?>