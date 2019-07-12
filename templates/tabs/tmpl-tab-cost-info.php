<h3><?php echo esc_html($title); ?></h3>

<div class="cost-info-half cost_included">
    <h4><?php echo esc_html($cost_info['includes_title']) ?></h4>
    <?php echo $cost_info['includes_description']; ?>
</div>

<div class="cost-info-half cost_excluded">
    <h4><?php echo esc_html($cost_info['excludes_title']) ?></h4>
    <?php echo $cost_info['excludes_description']; ?>
</div>


