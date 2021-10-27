<div class="yatra-tour-info">
    <div class="yatra-tour-info-inner">
        <div class="yatra-tabs" id="yatra-tour-sidebar-tabs">
            <ul class="yatra-tab-wrap" role="tablist">
                <li class="item active" role="presentation">
                    <a href="#yatra-tour-booking-form" role="tab" tabindex="0"
                       aria-controls="yatra-tour-booking-form"
                       data-aria-selected="true">
                        <?php echo esc_html(get_option('yatra_booking_form_title_text', __('Booking Form', 'yatra'))); ?>
                    </a>
                </li>
                <li class="item" role="presentation">
                    <a href="#yatra-tour-enquiry-form" role="tab" tabindex="1"
                       aria-controls="yatra-tour-enquiry-form">
                        <?php echo esc_html(get_option('yatra_enquiry_form_title_text', __('Enquiry Form', 'yatra'))); ?>
                    </a>
                </li>


            </ul>
            <section id="yatra-tour-booking-form" class="yatra-tab-content" role="tabpanel">
                <div class="tab-inner" tabindex="0">
                    <div class="yatra-tour-booking-form-section">
                        <div class="sec-row row">
                            <?php do_action('yatra_single_tour_booking_form') ?>
                        </div><!-- .sec-row -->
                    </div>
                </div>
            </section>
            <section id="yatra-tour-enquiry-form" class="yatra-tab-content" role="tabpanel">
                <div class="tab-inner" tabindex="0">
                    <div class="yatra-tour-enquiry-form-section">
                        <div class="sec-row row">
                            <?php do_action('yatra_single_tour_enquiry_form') ?>
                        </div><!-- .sec-row -->
                    </div>
                </div>
            </section>


        </div>

    </div>
</div>
