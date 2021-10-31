<div class="yatra-attribute-item type-text">
    <!--<div class="icon-wrap">
        <span class="attribute-icon fa fa-home"></span>
    </div>-->
    <div class="icon-content">
        <?php if ('' != $title) { ?>
            <span class="attribute-title"><?php echo esc_html($title) ?></span>
        <?php } ?>
        <span class="attribute-icon fa fa-pie-chart"></span>
        <p class="attribute-content"><?php echo esc_html($content) ?></p>
    </div>
</div>