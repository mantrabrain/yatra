// @var yatra_admin_params

(function ($) {
    var YatraTourListing = {
        init: function () {
            this.bindEvents();
        },
        bindEvents: function () {
            var _that = this;
            $('body').on("click", '.yatra-update-feature-tour-icon', function () {
                _that.updateTourFeaturedStatus($(this));
            });

        },
        updateTourFeaturedStatus: function (el) {
            if ($(el).hasClass('processing')) {
                return;
            }
            var tour_id = $(el).attr('data-tour-id');
            var nonce = $(el).attr('data-tour-nonce');
            var status = $(el).attr('data-is-featured');

            var status_update_data = {
                action: yatra_admin_params.tour_featured_status_update_action,
                yatra_nonce: nonce,
                tour_id: tour_id,
                featured_status: status
            };
            $.ajax({
                type: "POST",
                url: yatra_admin_params.ajax_url,
                data: status_update_data,
                beforeSend: function () {
                    $(el).addClass('processing');
                },
                success: function (response) {

                    if (response.success === true) {

                        var response_status = response.data;

                        $(el).removeClass('far');
                        $(el).removeClass('fa');

                        if (response_status === 1) {

                            $(el).addClass('fa');

                        } else {

                            $(el).addClass('far');
                        }
                        $(el).attr('data-is-featured', response_status);
                    }


                },
                complete: function () {
                    $(el).removeClass('processing');
                }
            });
        },


    };
    $(document).ready(function () {
        YatraTourListing.init();
    });
}(jQuery));