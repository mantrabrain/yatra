<div class="yatra-tour-additional-info">
    <div class="yatra-tour-additional-info-item">
        <i class="icon fa fa-user"></i><span
                class="info-title"><?php echo esc_html__('Price Per:', 'yatra'); ?>
            <strong><?php echo esc_html($additional_info['price_per']); ?></strong></span>
    </div>
    <div class="yatra-tour-additional-info-item">
        <i class="icon fa fa-user-circle"></i><span class="info-title"><?php echo esc_html__('Group Size:', 'yatra'); ?>
            <strong><?php echo esc_html($additional_info['group_size']); ?></strong></span>
    </div>
    <div class="yatra-tour-additional-info-item">
        <i class="icon fa fa-clock"></i><span class="info-title"><?php echo esc_html__('Duration:', 'yatra'); ?>
            <strong><?php echo esc_html($additional_info['tour_duration']); ?></strong></span>
    </div>
    <div class="yatra-tour-additional-info-item">
        <i class="icon fa fa-map"></i><span class="info-title"><?php echo esc_html__('Country:', 'yatra'); ?>
            <strong><?php echo esc_html($additional_info['country']); ?></strong></span>
    </div>

</div>
<div class="yatra-tour-attribute-info">
    <?php
    yatra_frontend_options(true); ?>
</div>
