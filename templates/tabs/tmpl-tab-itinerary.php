<h3 class="tab-title"><?php echo wp_kses($icon, array(
        'span' => array('class' => array())
    )) ?><?php echo esc_html($title); ?><span class="icon fa fa-plus"></span></h3>
<ul class="yatra-list yatra-itinerary-list">
    <?php
    foreach ($itinerary as $itinerary_item) {

        echo '<li class="yatra-list-item">';

        echo '<div class="yatra-itinerary-list-item">';

        echo '<h4 class="yatra-heading itinerary-heading">' . esc_html($itinerary_item['itinerary_heading']) . '<span class="icon fa fa-plus"></span></h4>';

        echo '<div class="yatra-content itinerary-content" style="display: none">';

        if ($itinerary_item['itinerary_title'] !== '') {
            echo '<h4 class="itinerary-title">' . esc_html($itinerary_item['itinerary_title']) . '</h4>';
        }

        echo '<div class="itinerary-details">' . wpautop($itinerary_item['itinerary_details']) . '</div>';

        echo '</div>';

        echo '</div>';


        echo '</li>';
    }
    ?>
</ul>
