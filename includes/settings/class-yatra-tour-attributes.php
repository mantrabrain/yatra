<?php
if ( ! defined( 'ABSPATH' ) ) {
    exit;
}
include_once "attributes/class-yatra-attribute-interface.php";
include_once "attributes/class-yatra-attribute-abstract.php";
include_once "attributes/class-yatra-attributes.php";

class Yatra_Tour_Attributes
{
    private $attributes;

    private $allAttributes;

    private $tourID;

    public function __construct($tourID)
    {
        $attributes = get_post_meta($tourID, 'tour_meta_custom_attributes', true);

        $attributes = is_array($attributes) ? $attributes : array();

        $this->attributes = $attributes;

        $this->tourID = $tourID;
    }

    public function getAllAtributes()
    {
        foreach ($this->attributes as $attributeID => $attributeContent) {

            $this->allAttributes[] = new Yatra_Attributes($this->tourID, $attributeID);
        }
        return $this->allAttributes;

    }

}