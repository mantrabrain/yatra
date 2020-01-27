<?php
echo '<div style="clear:both" class="mb-clear"></div>';

global $post;

$post_id = $post->ID;

$tour_meta_custom_attributes = get_post_meta($post_id, 'tour_meta_custom_attributes', true);

if (!is_array($tour_meta_custom_attributes)) {
    $tour_meta_custom_attributes = array();
}

$yatra_tour_attribute_type_options = array_keys(yatra_tour_attribute_type_options());

foreach ($tour_meta_custom_attributes as $term_id => $term_value_array) {

    $field_type = get_term_meta($term_id, 'attribute_field_type', true);


    if (in_array($field_type, $yatra_tour_attribute_type_options)) {

        echo '<div class="mb-tour-attributes">';

        echo $this->parse_attribute($field_type, $term_id, $term_value_array);

        echo '<div style="clear:both" class="mb-clear"></div>';

        echo '</div>';
    }

}