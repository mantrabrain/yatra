// @var yatra_admin_params

(function ($) {
    var YatraAdminGlobal = {
        init: function () {
            this.initLib();
        },
        initLib: function () {

            if (jQuery.fn.select2) {

                var select2 = $('.yatra-select2');

                if (select2.length > 0) {
                    $.each(select2, function () {
                        var select2Args = {};
                        select2Args.placeholder = typeof $(this).data('placeholder') !== undefined ? $(this).data('placeholder') : ''
                        $(this).select2(select2Args);
                    });


                }
            }

            if (typeof tippy !== 'undefined') {
                if ($('.yatra-tippy-tooltip').length > 0) {
                    tippy('.yatra-tippy-tooltip', {
                        allowHTML: true,
                    });
                }
            }
        },


    };

    $(document).ready(function () {
        YatraAdminGlobal.init();
    });
}(jQuery));