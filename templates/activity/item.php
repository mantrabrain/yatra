<?php
/*
 * @var $data
 */
?>
<div class="yatra-activity-item">
    <h2 itemprop="name" class="activity-title"><?php echo esc_html($data['name']) ?></h2>
    <a href="<?php echo esc_url($data['permalink']) ?>">
        <?php if (!empty($data['image'])) { ?>
            <img width="300" height="275"
                 src="<?php echo esc_url($data['image'])?>"
                 alt="<?php echo esc_html($data['name']) ?>" itemprop="image">
        <?php } ?>
    </a>
</div>
