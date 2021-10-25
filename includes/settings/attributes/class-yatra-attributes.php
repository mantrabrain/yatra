<?php
if ( ! defined( 'ABSPATH' ) ) {
    exit;
}
class Yatra_Attributes extends Yatra_Attribute_Abstract
{
    public function __construct($tourID, $attributeID)
    {
        parent::__construct($tourID, $attributeID);
    }

    public function getID()
    {
        return $this->id;
    }

    public function getName()
    {
        return $this->name;
    }

    public function getSlug()
    {
        return $this->slug;
    }

    public function getDescription()
    {
        return $this->description;
    }

    public function getType()
    {
        return $this->type;
    }

    public function getContent()
    {
        return $this->content;
    }


}