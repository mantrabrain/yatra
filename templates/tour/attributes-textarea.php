<div class="yatra-attribute-item type-textarea">
    <?php if ('' != $title) { ?>
        <span class="attribute-title">
            <span class="attribute-icon <?php echo esc_attr($icon) ?>"></span>
            <?php echo esc_html($title) ?></span>
    <?php } ?>
    <p class="attribute-content"><?php echo esc_html($content) ?></p>
</div>