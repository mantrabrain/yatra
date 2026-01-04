<section class="yatra-trip-section" id="what-makes-special">
    <h2 class="yatra-trip-section-title">
        <?php echo yatra_svg_icon('star', 'yatra-trip-section-title-icon'); ?>
        What Makes This Trip Special
    </h2>
    <div class="yatra-trip-special">
        <p class="yatra-trip-special-text"><?php echo esc_html($trip->what_makes_special ?? ''); ?></p>
    </div>
</section>