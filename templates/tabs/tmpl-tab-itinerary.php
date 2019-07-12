<h3><?php echo esc_html($title); ?></h3>
<ul class="yatra-itinerary-list">
    <?php

    foreach ($itinerary as $itinerary_item) {

        echo '<li>';

        echo '<div class="yatra-itinerary-list-item">';

        echo '<h4>' . esc_html($itinerary_item['itinerary_heading']) . '</h4>';

        echo '<div class="itinerary-title">'.esc_html($itinerary_item['itinerary_title']).'</div>';

        echo '<div class="itinerary-details">'.($itinerary_item['itinerary_details']).'</div>';

        echo '</div>';

        echo '</li>';
    }
    ?>
</ul>
