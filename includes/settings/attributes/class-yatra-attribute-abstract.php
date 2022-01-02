<?php
if (!defined('ABSPATH')) {
    exit;
}

abstract class Yatra_Attribute_Abstract implements Yatra_Attribute_Interface
{
    protected $id;

    protected $name;

    protected $slug;

    protected $description;

    protected $type;

    protected $content;


    public function __construct($tourID, $attributeID)
    {
        $attributes = get_post_meta($tourID, 'tour_meta_custom_attributes', true);

        $tour_attribute_content_item = isset($attributes[$attributeID]) ? $attributes[$attributeID] : array();

        if (!term_exists($attributeID)) {

            return;
        }
        $attribute_item = get_term($attributeID);

        if (is_wp_error($attribute_item)) {
            return;
        }

        $this->id = $attribute_item->term_id;

        $this->name = $attribute_item->name;

        $this->slug = $attribute_item->slug;

        $this->description = $attribute_item->description;

        $this->type = get_term_meta($attributeID, 'attribute_field_type', true);

        $meta = get_term_meta($attributeID, 'yatra_attribute_meta', true);

        $all_content = yatra_parse_args($tour_attribute_content_item, $meta, true);

        $this->content = $all_content;
    }
}