<?php
/**
 *
 * @var $this Yatra_Metabox_Tour_CPT
 */


?>
<div class="yatra-tab-content">
    <?php
    $fields = $this->metabox_config($tab_content_key);

    foreach ($fields as $field) {
        $this->metabox_html($field);
    }
    ?>
</div>
