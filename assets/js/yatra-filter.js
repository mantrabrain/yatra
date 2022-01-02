(function ($) {

    var YatraFilter = function ($) {
        return {
            init: function () {
                this.bindEvents();
                this.initLib();
            },
            bindEvents: function () {

                var that = this;

                $('body').on('click', '.yatra-sidebar-filter-section-content .show-more', function () {
                    $(this).closest('li').find('ul.yatra-terms-more-list').show();
                    $(this).closest('li').find('.show-less').show();
                    $(this).hide();
                });

                $('body').on('click', '.yatra-sidebar-filter-section-content .show-less', function () {
                    $(this).closest('li').find('ul.yatra-terms-more-list').hide();
                    $(this).closest('li').find('.show-more').show();
                    $(this).hide();
                });

                $('body').on('click', '.yatra-sidebar-filter-field input[type="checkbox"].yatra-filter-item', function () {
                });
                $('body').on('click', 'form.yatra-tour-filter-sidebar-form .yatra-clear-filter', function () {
                    var form = $(this).closest('form');
                    form[0].reset();
                    $(this).addClass('yatra-hide');
                });

                $('body').on('submit', 'form.yatra-tour-filter-sidebar-form', function (event) {
                    event.preventDefault();
                    that.processFilter($(this));

                });

                $('body').on('change', 'select#yatra-top-filter-sorting-by', function (event) {
                    $(this).closest('form.yatra-topbar-filter-order-form').submit();

                })

            },
            initLib: function () {
                var that = this;
                $("#yatra-price-slider").slider({
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
                $("#yatra-days-slider").slider({
                    range: true,
                    min: yatra_params.filter_options.days_range_min,
                    max: yatra_params.filter_options.days_range_max,
                    values: [yatra_params.filter_options.days_range_min_value, yatra_params.filter_options.days_range_max_value],
                    slide: function (event, ui) {
                        var min = ui.values[0]
                        var max = ui.values[1];
                        $('#yatra-days-slider-min').val(min);
                        $('#yatra-days-slider-max').val(max);
                        $(event.target).find('.ui-slider-handle').eq(0).attr('data-value', min + yatra_params.filter_options.days).addClass('visible');
                        $(event.target).find('.ui-slider-handle').eq(1).attr('data-value', max + yatra_params.filter_options.days).addClass('visible');
                    },
                    create: function (event, ui) {
                        var min = yatra_params.filter_options.days_range_min_value;
                        var max = yatra_params.filter_options.days_range_max_value;

                        if (max !== yatra_params.filter_options.days_range_max || min !== yatra_params.filter_options.days_range_min) {
                            $('#yatra-days-slider-max').val(max);
                            $('#yatra-days-slider-min').val(min);
                        }
                        $(event.target).find('.ui-slider-handle').eq(0).attr('data-value', (min + yatra_params.filter_options.days)).addClass('visible');
                        $(event.target).find('.ui-slider-handle').eq(1).attr('data-value', (max + yatra_params.filter_options.days)).addClass('visible');
                    },
                    stop: function (event, ui) {

                    }

                });
            },
            processFilter: function (form) {
                form.find('.yatra-clear-filter').removeClass('yatra-hide');

                var action = form.attr('action');

                var form_data = form.serializeArray();

                var query_params = {};

                for (var form_field_len = 0; form_field_len < form_data.length; form_field_len++) {
                    var name = form_data[form_field_len].name;
                    var value = form_data[form_field_len].value;
                    if (value !== '' && value !== "undefined" && name !== '') {
                        if (typeof query_params[name] !== "undefined") {
                            query_params[name] = query_params[name] + ',' + value;
                        } else {
                            query_params[name] = value;
                        }
                    }

                }
                var param_concat = action.includes("?") ? "&" : "?";
                window.location = (action + param_concat + $.param(query_params));

            }

        };
    }(jQuery);


    $(document).ready(function () {

        YatraFilter.init();


    });
}(jQuery));