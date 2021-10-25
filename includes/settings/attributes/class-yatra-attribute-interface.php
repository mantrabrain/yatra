<?php
if ( ! defined( 'ABSPATH' ) ) {
    exit;
}
interface Yatra_Attribute_Interface
{
    public function getID();

    public function getName();

    public function getSlug();

    public function getDescription();

    public function getType();

    public function getContent();

}