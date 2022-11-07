(function ($) {

    var YatraSearch = function ($) {
        return {
            init: function () {
                this.bindEvents();
                this.initLib();

            },
            bindEvents: function () {

                var _that = this;

                $('body').on('click', '.yatra-search-module-item .input-placeholder', function () {
                    var module = $(this).closest('.yatra-search-module');
                    if ($(this).closest('.yatra-search-module-item').hasClass('active')) {
                        $(this).closest('.yatra-search-module-item').removeClass('active');
                    } else {
                        module.find('.yatra-search-module-item').removeClass('active');
                        $(this).closest('.yatra-search-module-item').addClass('active');
                    }

                });

                $('body').on('click', '.yatra-search-taxonomy li', function () {
                    var module = $(this).closest('.yatra-search-module-item');
                    var name = module.attr('data-name');
                    module.find('input[type="hidden"].input-field').attr('name', name).val($(this).attr('data-slug'));
                    module.find('.input-placeholder').text($(this).find('label').text()).addClass('active');
                    module.removeClass('active');
                    module.next('.yatra-search-module-item').find('.input-placeholder').trigger('click');
                });

            },
            initLib: function () {
                $("#yatra-search-price-slider").slider({
                    range: true,
                    min: yatra_params.filter_options.price_range_min,
                    max: yatra_params.filter_options.price_range_max,
                    values: [yatra_params.filter_options.price_range_min_value, yatra_params.filter_options.price_range_max_value],
                    slide: function (event, ui) {
                        var min = ui.values[0]
                        var max = ui.values[1];
                        $('#yatra-price-slider-min').val(min);
                        $('#yatra-price-slider-max').val(max);
                        $(event.target).find('.ui-slider-handle').eq(0).attr('data-value', window.YatraPricingCalculator.getPrice(null, min)).addClass('visible');
                        $(event.target).find('.ui-slider-handle').eq(1).attr('data-value', window.YatraPricingCalculator.getPrice(null, max)).addClass('visible');
                    },
                    create: function (event, ui) {
                        var min = yatra_params.filter_options.price_range_min_value;
                        var max = yatra_params.filter_options.price_range_max_value;

                        if (max !== yatra_params.filter_options.price_range_max || min !== yatra_params.filter_options.price_range_min) {

                            $('#yatra-price-slider-min').val(min);
                            $('#yatra-price-slider-max').val(max);
                        }

                        $(event.target).find('.ui-slider-handle').eq(0).attr('data-value', window.YatraPricingCalculator.getPrice(null, min)).addClass('visible');
                        $(event.target).find('.ui-slider-handle').eq(1).attr('data-value', window.YatraPricingCalculator.getPrice(null, max)).addClass('visible');
                    },
                    stop: function (event, ui) {

                    }

                });

                // Days Slider
                $("#yatra-search-days-slider").slider({
                    range: true,
                    min: yatra_params.filter_options.days_range_min,
                    max: yatra_params.filter_options.days_range_max,
                    values: [yatra_params.filter_options.days_range_min_value, yatra_params.filter_options.days_range_max_value],
                    slide: function (event, ui) {
                        var min = ui.values[0]
                        var max = ui.values[1];
                        $('#yatra-days-slider-min').val(min);
                        $('#yatra-days-slider-max').val(max);
                        $(event.target).find('.ui-slider-handle').eq(0).attr('data-value', min + " " + yatra_params.filter_options.days).addClass('visible');
                        $(event.target).find('.ui-slider-handle').eq(1).attr('data-value', max + " " + yatra_params.filter_options.days).addClass('visible');
                    },
                    create: function (event, ui) {
                        var min = yatra_params.filter_options.days_range_min_value;
                        var max = yatra_params.filter_options.days_range_max_value;

                        if (max !== yatra_params.filter_options.days_range_max || min !== yatra_params.filter_options.days_range_min) {
                            $('#yatra-days-slider-max').val(max);
                            $('#yatra-days-slider-min').val(min);
                        }
                        $(event.target).find('.ui-slider-handle').eq(0).attr('data-value', (min + " " + yatra_params.filter_options.days)).addClass('visible');
                        $(event.target).find('.ui-slider-handle').eq(1).attr('data-value', (max + " " + yatra_params.filter_options.days)).addClass('visible');
                    },
                    stop: function (event, ui) {

                    }

                });
            }


        };
    }(jQuery);


    $(document).ready(function () {

        YatraSearch.init();


    });
}(jQuery));