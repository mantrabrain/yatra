<div class="yatra-attribute-item type-shortcode">
    <?php if ('' != $title) { ?>
        <span class="attribute-title"><?php echo esc_html($title) ?></span>
    <?php } ?>
    <div class="attribute-content"><?php echo do_shortcode($content) ?></div>
</div>