<section class="yatra-trip-section" id="trip-details">
    <h2 class="yatra-trip-section-title">
        <?php echo yatra_svg_icon('info', 'yatra-trip-section-title-icon'); ?>
        Trip Details
    </h2>
    <div class="yatra-trip-description">
        <?php echo wp_kses_post($trip->trip_details ?? ''); ?>
    </div>
</section>