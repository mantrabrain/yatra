<?php
/**
 *
 * @var $this Yatra_Metabox_Tour_CPT
 */


$fields = $this->metabox_config($tab_content_key);

foreach ($fields as $field) {
    
    $this->tour_options($field);
}
