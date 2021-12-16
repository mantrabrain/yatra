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

            },
            load_gateway: function (payment_mode) {

                $('body').trigger('yatra_gateway_loaded', [payment_mode]);
            }

        };
    }(jQuery);


    $(document).ready(function () {

        YatraCheckout.init();


    });
}(jQuery));