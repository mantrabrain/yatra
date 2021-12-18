(function ($) {

    var YatraCheckout = function ($) {
        return {
            init: function () {
                this.bindEvents();
            },
            bindEvents: function () {

                var _that = this;

                $(document).on('change', 'input[name="yatra-payment-gateway"]', function (e) {

                    var payment_mode = $('ul.yatra-payment-gateway input[name="yatra-payment-gateway"]:checked').val();

                    if (payment_mode == '0') {
                        return false;
                    }

                    _that.load_gateway(payment_mode);

                    return false;
                });

                if ($('input[name="yatra-payment-gateway"]:checked').length < 1) {

                    $('input[name="yatra-payment-gateway"]').eq(0).trigger('click');
                }

            },
            load_gateway: function (payment_mode) {

                $('ul.yatra-payment-gateway').find('.yatra-payment-gateway-field-wrap').addClass('yatra-hide');

                $('body').trigger('yatra_gateway_loaded', [payment_mode]);
            }

        };
    }(jQuery);


    $(document).ready(function () {

        YatraCheckout.init();


    });
}(jQuery));