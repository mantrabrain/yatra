(function ($) {

    var YatraSingleTour = function ($) {
        return {
            init: function () {
                this.bindEvents();
            },
            bindEvents: function () {
                var _that = this;
                $('body').on('click', '.yatra-responsive-tab-title', _that.toggle_tabs);
            },
            toggle_tabs: function (event) {
                var _that = this;
                event.preventDefault();
                let id = $(this).attr('data-id');
                let wrap = $(this).closest('.yatra-single-tour-tabs');
                if (wrap.find('.yatra-tab-content#' + id).length > 0) {
                    if (wrap.find('.yatra-tab-content#' + id).is(':visible')) {
                        wrap.find('.yatra-tab-content#' + id).slideUp();
                        $(this).find('.yatra-toggle-icon').addClass('fa-angle-down').removeClass('fa-angle-up')
                    } else {
                        wrap.find('.yatra-tab-content#' + id).slideDown();

                        $(this).find('.yatra-toggle-icon').addClass('fa-angle-up').removeClass('fa-angle-down')
                    }
                    wrap.find('.yatra-tab-content:not(#' + id + ')').hide();
                    wrap.find('.yatra-responsive-tab-title:not([data-id="' + id + '"])').find('.yatra-toggle-icon').addClass('fa-angle-down').removeClass('fa-angle-up');

                }

            }


        };
    }(jQuery);
    $(document).ready(function () {

        YatraSingleTour.init();


    });
}(jQuery));