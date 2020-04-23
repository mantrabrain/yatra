<div class="yatra-tour-info">
    <div class="yatra-tour-info-inner">
        <div class="yatra-tabs" id="yatra-tour-sidebar-tabs">
            <ul class="yatra-tab-wrap" role="tablist">
                <li class="item active" role="presentation"><a href="#yatra-tour-booking-form" role="tab" tabindex="0"
                                                               aria-controls="yatra-tour-booking-form"
                                                               data-aria-selected="true">
                        Booking Form</a></li>
                <li class="item" role="presentation"><a href="#yatra-enquiry-form" role="tab" tabindex="-1"
                                                        aria-controls="yatra-enquiry-form">
                        Enquiry Form</a></li>

            </ul>
            <section id="yatra-tour-booking-form" class="yatra-tab-content" role="tabpanel">
                <div class="tab-inner" tabindex="0">
                    <h3 class="tab-title">Overview</h3>
                    <div class="yatra-tour-booking-form-section">
                        <div class="sec-row row">
                            <?php do_action('yatra_single_tour_booking_form') ?>
                        </div><!-- .sec-row -->
                    </div>
                </div>
            </section>
            <section id="yatra-enquiry-form" class="yatra-tab-content" role="tabpanel" aria-hidden="true">
                <div class="tab-inner" tabindex="0">
                    <h3 class="tab-title">Enquiry Form</h3>

                    <div class="yatra-tour-enquiry-form-section">
                        <div class="sec-row row">
                            <?php do_action('yatra_single_tour_enquiry_form') ?>
                        </div><!-- .sec-row -->
                    </div>


                </div>
            </section>


        </div>
        <?php //yatra_frontend_options(); ?>
    </div>
</div>