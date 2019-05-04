// @var yatra_params
var YatraFrontend = function ($) {
    return {

        init: function () {
            this.cacheDom();
            this.bindEvents();
        },
        cacheDom: function () {
            this.$book_now = $('.yatra-book-now-btn');
        },

        bindEvents: function () {
            var $this = this;
            this.$book_now.on('click', function (e) {
                e.preventDefault();
                var tour_id = $(this).attr('data-tour-id');
                if (tour_id < 1) {
                    return;
                }
                $this.bookTour(tour_id);
            });
        },
        addLoading: function ($node) {

            var type = $node[0].tagName.toLowerCase();

            if (type === "a") {
                $node.text($node.attr('data-loading-text'));
            } else {
                $node.val($node.attr('data-loading-text'));
            }

        }, removeLoading: function ($node) {
            var type = $node[0].tagName.toLowerCase();
            if (type === "a") {
                $node.text($node.attr('data-text'));
            } else {
                $node.val($node.attr('data-text'));
            }
        },
        bookTour: function (tour_id) {
            var $this = this;
             var booking_params = yatra_params.booking_params;
            var booking_data = {
                action: booking_params.booking_action,
                yatra_nonce: booking_params.booking_nonce,
                tour_id: tour_id
            };
            $.ajax({
                type: "POST",
                url: yatra_params.ajax_url,
                data: booking_data,
                beforeSend: function () {
                    $this.addLoading($this.$book_now);
                },
                success: function (data) {

                    if (data.success === true) {

                        window.location = data.data.redirect_url;

                    }
                },
                complete: function () {
                    $this.removeLoading($this.$book_now);
                }
            });
        }

    };
}(jQuery);
(function ($) {

    $(document).ready(function () {
        YatraFrontend.init();
    });
}(jQuery));