<?php
/*
 * @var $data
 */
?>
<div class="<?php echo esc_attr($data['class']); ?> yatra-activity-item">
    <div class="yatra-item-inner">
        <h2 itemprop="name" class="activity-title"><?php echo esc_html($data['name']) ?></h2>
        <a title="<?php echo esc_attr($data['name']) ?>" href="<?php echo esc_url($data['permalink']) ?>"
           class="yatra-link">
            <?php if (!empty($data['image'])) { ?>
                <img width="300" height="275"
                     src="<?php echo esc_url($data['image']) ?>"
                     alt="<?php echo esc_html($data['name']) ?>" itemprop="image">
            <?php } ?>
        </a>
    </div>
</div>