<?php
echo '<pre>';
print_r($additional_info);
echo '</pre>';
?>
<div class="yatra-tour-additional-info">
    <div class="yatra-tour-additional-info-item">
        <div class="icon-wrap">
            <i class="icon fa fa-user-clock"></i>
        </div>
        <div class="icon-content">
            <span class="info-title"><?php echo esc_html__('Duration', 'yatra'); ?></span>
            <p class="info-content"><?php echo esc_html($additional_info['tour_duration']); ?></p>
        </div>
    </div>
    <div class="yatra-tour-additional-info-item">
        <div class="icon-wrap">
            <i class="icon fa fa-clock"></i>
        </div>
        <div class="icon-content">
            <span class="info-title"><?php echo esc_html__('Country', 'yatra'); ?></span>
            <p class="info-content"><?php echo esc_html($additional_info['country']); ?></p>
        </div>
    </div>
    <div class="yatra-tour-additional-info-item">
        <div class="icon-wrap">
            <i class="icon fa fa-clock"></i>
        </div>
        <div class="icon-content">
            <span class="info-title"><?php echo esc_html__('Country', 'yatra'); ?></span>
            <p class="info-content"><?php echo esc_html($additional_info['country']); ?></p>
        </div>
    </div>
    <div class="yatra-tour-additional-info-item">
        <div class="icon-wrap">
            <i class="icon fa fa-clock"></i>
        </div>
        <div class="icon-content">
            <span class="info-title"><?php echo esc_html__('Country', 'yatra'); ?></span>
            <p class="info-content"><?php echo esc_html($additional_info['country']); ?></p>
        </div>
    </div>

</div>
<?php if (yatra_tour_has_attributes()) { ?>
    <div class="yatra-tour-attribute-info">
        <?php
        yatra_tour_custom_attributes_template(); ?>
    </div>
<?php } ?>
