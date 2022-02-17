// @var yatra_params
window.yatra_global_tour_additional_price = 0;
(function ($) {
    let yatra_availability_enable_dates = yatra_params.single_tour.enabled_dates;
    let yatra_availability_date_data = yatra_params.single_tour.all_available_date_data;
    var YatraFrontend = function ($) {
        return {
            init: function () {
                this.cacheDom();
                this.bindEvents();
                this.initLib();
                this.initNiceNumber();
                this.initDateTimePicker();
            },
            initNiceNumber: function () {
                var _that = this;
                $('body').on('click', '.yatra-nice-input-number button.plus-button', function () {
                    var input = $(this).closest('.yatra-nice-input-number').find('input');
                    _that.calculateNiceNumber(input, 'plus');
                });
                $('body').on('click', '.yatra-nice-input-number button.minus-button', function () {
                    var input = $(this).closest('.yatra-nice-input-number').find('input');
                    _that.calculateNiceNumber(input, 'minus');
                });
            },
            calculateNiceNumber: function (input, type) {
                var step = input.attr('data-step') === undefined ? 1 : parseInt(input.attr('data-step'));
                var max = input.attr('data-max') === undefined ? 99999 : parseInt(input.attr('data-max'));
                var min = input.attr('data-min') === undefined ? 0 : parseInt(input.attr('data-min'));
                var current = parseInt(input.val());

                if (type === 'plus') {
                    current = current + step;
                } else {
                    current = current - step;
                }

                if (current >= max) {
                    input.val(max).trigger('change');
                    return;
                }
                if (current < min) {
                    input.val(min).trigger('change');
                    return;
                }

                input.val(current).trigger('change');
            },
            cacheDom: function () {
                this.$booking_form = $('#yatra-tour-booking-form-fields');
                this.$enquiry_form = $('#yatra-tour-enquiry-form-fields');
                this.$yatra_update_cart = $('.yatra_update_cart');
            },

            bindEvents: function () {
                var $this = this;
                this.$booking_form.on('submit', function (e) {
                    e.preventDefault();
                    var tour_id = $(this).attr('data-tour-id');
                    var form_data = $(this).serialize();
                    $this.bookTour(form_data);
                });

                this.$enquiry_form.on('submit', function (e) {
                    e.preventDefault();
                    var selected_date = $('input.yatra-booking-calendar-choosen-date').val();
                    var form_data = $(this).serializeArray();
                    form_data.push({name: "selected_date", value: selected_date});
                    $this.sendEnquiry(form_data);
                });

                $('form.yatra-cart-form').on('submit', function (e) {
                    e.preventDefault();
                    var form = $(this);
                    var form_data = form.serialize();
                    $this.submit_cart_form(form_data, $(this));
                });
                $('body').on('click', '.yatra_update_cart', function (e) {
                    e.preventDefault();
                    var form = $(this).closest('form');
                    var field = $('<input type="hidden" name="yatra_cart_submit_type" value="update_cart"/>');
                    form.find('.yatra_cart_submit_type').remove();
                    form.append(field);
                    var form_data = form.serialize();
                    $this.submit_cart_form(form_data, $(this));
                });

                $('body').on('click', '.yatra_apply_coupon', function (e) {
                    e.preventDefault();
                    var form = $(this).closest('form');
                    var field = $('<input type="hidden" name="yatra_cart_submit_type" value="apply_coupon"/>');
                    form.find('.yatra_cart_submit_type').remove();
                    form.append(field);
                    var form_data = form.serialize();
                    $this.submit_cart_form(form_data, $(this));
                });
                $('body').on('change', 'table.yatra_cart_table input.yatra-number-of-person-field', function (e) {
                    e.preventDefault();

                    var yatra_cart_table = $(this).closest('.yatra_cart_table');

                    yatra_cart_table.find('.yatra_update_cart').removeAttr('disabled');

                });
                $('body').on('click',
                    '.yatra-itinerary-list-item .itinerary-heading, .yatra-itinerary-list-item .itinerary-heading, .yatra-faq-list-item .faq-heading, .yatra-faq-list-item .faq-heading', function () {

                        if ($(this).find('.icon').length === 0 && $(this).find('svg').length === 0) {
                            return;
                        }
                        var toggle_node = $(this).find('.icon').length !== 0 ? $(this).find('.icon') : $(this).find('svg');

                        if (toggle_node.hasClass('fa-minus')) {

                            $this.toggleYatraList(toggle_node, 'close');
                        } else {
                            $this.toggleYatraList(toggle_node, 'open');
                        }
                    });
                $('body').on('click', '.yatra-tab-content .tab-title, .yatra-tab-content .tab-title', function () {

                    if ($(this).find('.icon').length === 0 && $(this).find('svg').length === 0) {
                        return;
                    }
                    var toggle_node = $(this).find('.icon').length !== 0 ? $(this).find('.icon') : $(this).find('svg');
                    var span = $('<span class=""/>');
                    var heading = toggle_node.closest('h3');
                    toggle_node.hide();
                    var toggle_status = 'close';
                    if (toggle_node.hasClass('fa-minus')) {
                        toggle_status = 'close';
                        span.addClass('icon fa fa-plus');
                    } else {
                        toggle_status = 'open';
                        span.addClass('icon fa fa-minus');
                    }

                    $.each(toggle_node.closest('.yatra-tab-content').find('ul.yatra-list li.yatra-list-item .yatra-heading'), function () {

                        var icon = $(this).find('.icon');
                        if (icon.length > 0) {
                            $this.toggleYatraList(icon, toggle_status);
                        }
                    });


                    heading.append(span);
                    toggle_node.remove();

                });
                $('body').on('click', '.yatra-enquiry-now-btn', function (event) {
                    $('#yatra-tour-sidebar-tabs').find('.yatra-tab-wrap li').find('a[aria-controls="yatra-tour-enquiry-form"]').trigger('click');
                    event.preventDefault();

                });

                $('body').on('click', '.yatra-calendar-date-listing-item', function () {
                    if ($(this).hasClass('yatra-availability-none')) {
                        return;
                    }
                    var date = $(this).attr('data-date');
                    $(this).closest('ul').find('li span').removeClass('active');
                    $(this).addClass('active');
                    $this.onDateSelect(date);
                })

                $('body').on('change', '.yatra-availability-select-year-month', function () {
                    var value = $(this).val();
                    $this.calendarMonthChange(value);
                });


            },
            initLib: function () {

                if (typeof $().select2 !== 'undefined') {
                    $('.yatra-select2').select2();
                }
                if (typeof $().datepicker !== 'undefined') {
                    $('.yatra-date').datepicker();
                }
                tippy('.yatra-tippy-tooltip', {
                    allowHTML: true,
                });

            },
            toggleYatraList: function ($toggle_node, toggle_status) {
                var $this = this;


                if (toggle_status == 'open') {
                    $this.listToggleOpen($toggle_node);
                } else {
                    $this.listToggleClose($toggle_node);

                }
            },
            listToggleOpen: function ($toggle_node) {
                $toggle_node.closest('li.yatra-list-item').find('.yatra-content').slideDown('slow');
                var span = $('<span class="icon fa fa-minus"/>');
                var heading = $toggle_node.closest('h4');
                $toggle_node.hide();
                heading.append(span);
                $toggle_node.remove();

            },
            listToggleClose: function ($toggle_node) {
                $toggle_node.closest('li.yatra-list-item').find('.yatra-content').slideUp('slow');
                var span = $('<span class="icon fa fa-plus"/>');
                var heading = $toggle_node.closest('h4');
                $toggle_node.hide();
                heading.append(span);
                $toggle_node.remove();

            },
            addLoading: function ($node) {

                var type = $node[0].tagName.toLowerCase();

                if (type === "a" || type === "button") {
                    $node.text($node.attr('data-loading-text'));
                } else {
                    $node.val($node.attr('data-loading-text'));
                }

            }, removeLoading: function ($node) {
                var type = $node[0].tagName.toLowerCase();
                if (type === "a" || type === "button") {
                    $node.text($node.attr('data-text'));
                } else {
                    $node.val($node.attr('data-text'));
                }
            },
            submit_cart_form: function (form_data, cart_btn) {

                var cart_form = cart_btn.closest('form.yatra-cart-form');
                var $this = this;
                $.ajax({
                    type: "POST",
                    url: yatra_params.ajax_url,
                    data: form_data,
                    beforeSend: function () {
                        $this.table_loading(cart_btn);
                    },
                    success: function (response) {

                        var el = cart_form.closest('.yatra-shortcode-wrapper');
                        if (response.success === true) {
                            var table = response.data.table;
                            cart_form.find('.yatra-cart-table-wrapper').find('table.yatra_cart_table').remove();
                            cart_form.find('.yatra-cart-table-wrapper').append(table)
                            window.YatraMessages.showSuccess(el, response.data.message);

                        } else {
                            window.YatraMessages.showError(el, response.data);

                        }
                        cart_form.find('.yatra-overlay').remove();
                    },
                    complete: function () {
                        cart_form.find('.yatra-overlay').remove();
                    }
                });
            },
            table_loading: function (cart_btn) {
                cart_btn.closest('form').append('<div class="yatra-overlay"></div>');
            },
            bookTour: function (form_data) {
                var $this = this;
                var $btn = $this.$booking_form.find('.yatra-book-now-btn');
                $.ajax({
                    type: "POST",
                    url: yatra_params.ajax_url,
                    data: form_data,
                    beforeSend: function () {
                        $this.addLoading($btn);
                    },
                    success: function (data) {

                        var el = $('.yatra-book-btn-wrapper.book-btn');
                        if (data.success === true) {

                            window.location = data.data.cart_page_url;

                        } else {
                            YatraMessages.showError(el, data.data);

                        }
                    },
                    complete: function () {
                        $this.removeLoading($btn);
                    }
                });
            },

            sendEnquiry: function (form_data) {
                var $this = this;
                $.ajax({
                    type: "POST",
                    url: yatra_params.ajax_url,
                    data: form_data,
                    beforeSend: function () {
                        $this.$enquiry_form.find('fieldset').prop('disabled', true);
                    },
                    success: function (data) {
                        var el = $('.yatra-enquiry-submit-btn-wrapper');

                        if (data.success === true) {
                            YatraMessages.showSuccess(el, data.data);
                            $this.$enquiry_form[0].reset();

                        } else {
                            YatraMessages.showError(el, data.data);
                        }
                    },
                    complete: function () {
                        $this.$enquiry_form.find('fieldset').prop('disabled', false);
                    }
                });
            },
            initDateTimePicker: function () {

                var _that = this;
                if ($(".yatra_tour_start_date").length === 0) {
                    return;
                }
                var single_tour = yatra_params.single_tour;

                let container = $(".yatra-calendar-wrap").YatraCalendar({

                    fixedStartDay: 0, // begin weeks by sunday

                    enable: function (d) {
                        return yatra_availability_enable_dates;
                    },

                    onDayCreate: function (el, fullDate, day, month, year) {
                        var date = fullDate.trim();
                        var object = yatra_availability_date_data[date];
                        if (object !== undefined && !$(el).hasClass('disabled')) {
                            var class_name = 'yatra-tippy-tooltip yatra-availability-' + object.availability;
                            $(el).addClass(class_name).attr('data-tippy-content', object.description);
                        }
                    },
                    onCalendarLoad: function () {
                        tippy('.yatra-tippy-tooltip', {
                            allowHTML: true,
                        });
                    },
                    onDateSelect: function (date, el) {

                        if ($(el).hasClass('yatra-availability-none')) {
                            $(el).closest('td').removeClass('active');
                            return;
                        }

                        _that.onDateSelect(date);
                    },

                    onBeforeMonthChange: function (month, year) {
                        var _that = this;
                        var selected_date = year + '-' + (month + 1) + '-01';
                        $("#yatra-tour-booking-form").addClass('yatra-loading');
                        $.ajax({
                            type: "POST",
                            url: yatra_params.ajax_url,
                            async: false,
                            data: {
                                tour_id: $('form#yatra-tour-booking-form-fields').find('input[name="tour_id"]').val(),
                                selected_date: selected_date,
                                action: yatra_params.single_tour.availability_month_action,
                                yatra_nonce: yatra_params.single_tour.availability_month_nonce
                            },
                            beforeSend: function () {

                            },
                            success: function (data) {
                                if (typeof data.success) {
                                    yatra_availability_enable_dates = data.data.enable_dates;
                                    yatra_availability_date_data = data.data.available_data;
                                }

                            },
                            complete: function () {
                            }
                        });
                        $("#yatra-tour-booking-form").removeClass('yatra-loading');
                    }

                });

                tippy('.yatra-tippy-tooltip', {
                    allowHTML: true,
                });
            },
            onDateSelect: function (date) {
                $(".yatra_tour_start_date").find('input').attr('data-selected-date', date).val(date);
                const date_full = new Date(date);  // 2009-11-10
                const month = date_full.toLocaleString('default', {month: 'long'});

                var date_string = month + ' ' + date_full.getDate() + ', ' + date_full.getFullYear();

                $('.tour-info-pricing-header').find('h2').html(date_string);
                $.ajax({
                    type: "POST",
                    url: yatra_params.ajax_url,
                    data: {
                        tour_id: $('form#yatra-tour-booking-form-fields').find('input[name="tour_id"]').val(),
                        selected_date: date,
                        action: yatra_params.single_tour.availability_action,
                        yatra_nonce: yatra_params.single_tour.availability_nonce
                    },
                    beforeSend: function () {
                        $("#yatra-tour-booking-form").addClass('yatra-loading');
                    },
                    success: function (data) {

                        if (typeof data.success !== undefined) {
                            if (data.success) {
                                $('.yatra-tour-booking-pricing-wrap').html(data.data);

                                if (yatra_params.show_enquiry_form === 'no') {

                                    $('#yatra-tour-sidebar-tabs').find('li.yatra-enquiry-form-list').addClass('yatra-hide');
                                    $('#yatra-tour-enquiry-form.yatra-tab-content ').addClass('yatra-hide');
                                }

                                if ($('.yatra-tour-booking-pricing-wrap').find('button.yatra-enquiry-now-btn').length === 1) {

                                    $('#yatra-tour-sidebar-tabs').find('li.yatra-enquiry-form-list').removeClass('yatra-hide');
                                    $('#yatra-tour-enquiry-form.yatra-tab-content ').removeClass('yatra-hide');

                                }

                                setTimeout(function () {
                                    tippy('.yatra-tippy-tooltip', {
                                        allowHTML: true,
                                    });
                                }, 500);

                            }
                        }

                    },
                    complete: function () {


                        $("#yatra-tour-booking-form").removeClass('yatra-loading');


                    }
                });
            },
            calendarMonthChange: function (selected_date) {
                $("#yatra-tour-booking-form").addClass('yatra-loading');
                $.ajax({
                    type: "POST",
                    url: yatra_params.ajax_url,
                    data: {
                        tour_id: $('form#yatra-tour-booking-form-fields').find('input[name="tour_id"]').val(),
                        selected_date: selected_date,
                        action: yatra_params.single_tour.availability_month_action,
                        yatra_nonce: yatra_params.single_tour.availability_month_nonce,
                        type: 'date_listing'
                    },
                    beforeSend: function () {

                    },
                    success: function (data) {
                        if (typeof data.success) {
                            var content = data.data.content;
                            $('.yatra-calendar-listing-wrap').html(content);

                        } else {
                            $('.yatra-calendar-listing-wrap').html('<h2>Somethign went wrong, please try again');
                        }

                    },
                    complete: function () {
                        $("#yatra-tour-booking-form").removeClass('yatra-loading');
                        tippy('.yatra-tippy-tooltip', {
                            allowHTML: true,
                        });
                    }
                });
            }


        };
    }(jQuery);

    $.fn.YatraTabs = function (params) {

        this.each(function () {

            // express a single node as a jQuery object
            var $el = $(this);

            var YatraTabsMethods = function ($) {
                return {

                    init: function ($el) {

                        this.cacheDom($el);
                        this.setupAria();
                        this.bindEvents();
                    },

                    cacheDom: function () {
                        this.$el = $el;
                        this.$tabList = this.$el.find('ul.yatra-tab-wrap');
                        this.$tab = this.$tabList.find('li.item');
                        this.$tabFirst = this.$tabList.find('li.item:first-child a');
                        this.$tabLink = this.$tabList.find('li.item > a')
                        this.$tabPanel = this.$el.find('section');
                        this.$tabPanelFirstContent = this.$el.find('section > *:first-child');
                        this.$tabPanelFirst = this.$el.find('section:first-child');
                        this.$tabPanelNotFirst = this.$el.find('section:not(:first-of-type)');
                    },

                    bindEvents: function () {
                        this.$tabLink.on('click', function (e) {

                            this.changeTab(e);
                        }.bind(this));
                        this.$tabLink.on('keydown', function (e) {
                            this.changeTabKey(e);
                        }.bind(this));
                    },

                    changeTab: function (event) {
                        var self = $(event.target);
                        event.preventDefault();
                        this.removeTabFocus();
                        this.setSelectedTab(self);
                        this.hideAllTabPanels();
                        this.setSelectedTabPanel(self);
                    },

                    changeTabKey: function (event) {
                        var self = $(event.target),
                            $target = this.setKeyboardDirection(self, event.keyCode);

                        if ($target.length) {
                            this.removeTabFocus(self);
                            this.setSelectedTab($target);
                        }
                        this.hideAllTabPanels();
                        this.setSelectedTabPanel($(document.activeElement));
                    },

                    hideAllTabPanels: function () {
                        this.$tabPanel.attr('aria-hidden', 'true');
                    },

                    removeTabFocus: function (self) {
                        var $this = this.$el.find('[role="tab"]');

                        $this.attr({
                            'tabindex': '-1',
                            'data-aria-selected': null
                        }).closest('li').removeClass('active');
                    },

                    selectFirstTab: function () {
                        this.$tabFirst.attr({
                            'data-aria-selected': 'true',
                            'tabindex': '0'
                        }).closest('li').addClass('active');
                    },

                    setupAria: function () {
                        this.$tabList.attr('role', 'tablist');
                        this.$tab.attr('role', 'presentation');
                        this.$tabLink.attr({
                            'role': 'tab',
                            'tabindex': '-1'
                        });
                        this.$tabLink.each(function () {
                            var $this = $(this);

                            $this.attr('aria-controls', $this.attr('href').substring(1));
                        });
                        this.$tabPanel.attr({
                            'role': 'tabpanel'
                        });
                        this.$tabPanelFirstContent.attr({
                            'tabindex': '0'
                        });
                        this.$tabPanelNotFirst.attr({
                            'aria-hidden': 'true'
                        });
                        this.selectFirstTab();
                    },

                    setKeyboardDirection: function (self, keycode) {
                        var $prev = self.parents('li').prev().children('[role="tab"]'),
                            $next = self.parents('li').next().children('[role="tab"]');

                        switch (keycode) {
                            case 37:
                                return $prev;
                                break;
                            case 39:
                                return $next;
                                break;
                            default:
                                return false;
                                break;
                        }
                    },

                    setSelectedTab: function (self) {
                        self.attr({
                            'data-aria-selected': true,
                            'tabindex': '0'
                        }).focus().closest('li').addClass('active');
                    },

                    setSelectedTabPanel: function (self) {
                        this.$el.find('#' + self.attr('aria-controls')).attr('aria-hidden', null);
                    },

                };
            }(jQuery);

            YatraTabsMethods.init($el);


        });

        // allow jQuery chaining
        return this;
    };


    window.YatraMessages = {

        getMessageHTML: function (messages) {
            var message_html = $("<ul/>");

            if (typeof messages === "object") {
                messages.forEach((value, index) => {
                    var li = $('<li/>').text(value);
                    message_html.append(li);
                });
            } else if (typeof messages === "string") {
                var li = $('<li/>').text(messages);
                message_html.append(li);
            }
            return message_html;
        },
        showError: function (el, messages, is_append = true, fade_out_delay = 5000) {

            var message_html = this.getMessageHTML(messages);

            var error_html = $('<div class="yatra-message yatra-error" id="yatra-message"/>');

            error_html.append(message_html);

            $(el).find('.yatra-message').remove();

            if (is_append) {
                $(el).append(error_html);

            } else {
                $(el).prepend(error_html);
            }
            document.getElementById("yatra-message").scrollIntoView();

            if (fade_out_delay > 0) {

                $(el).find('.yatra-message').delay(fade_out_delay).fadeOut(800, function () {
                    $(this).remove()
                });
            }

        },
        showSuccess: function (el, messages, is_append = true, fade_out_delay = 5000) {

            var message_html = this.getMessageHTML(messages);

            var error_html = $('<div class="yatra-message yatra-success" id="yatra-message"/>');

            error_html.append(message_html);

            $(el).find('.yatra-message').remove();

            if (is_append) {
                $(el).append(error_html);

            } else {
                $(el).prepend(error_html);
            }
            document.getElementById("yatra-message").scrollIntoView();

            if (fade_out_delay > 0) {
                $(el).find('.yatra-message').delay(fade_out_delay).fadeOut(800, function () {
                    $(this).remove()
                });
            }


        }
    };

    var YatraPricingCalculator = {

        init: function () {

            this.bindEvents();
        },
        bindEvents: function () {
            var _that = this;
            $('body').on('change', '.yatra-single-tour-number-of-person', function () {
                var price_field = $(this).closest('.yatra-price-item-field');
                var final_price = _that.getPriceItemFinalPrice(price_field);
                var finalPriceString = _that.getPrice(yatra_params.currency_symbol, final_price.final);
                var regularPriceString = _that.getPrice(yatra_params.currency_symbol, final_price.regular);
                price_field.find('.yatra-traveller-price').find('.final').text(finalPriceString);
                price_field.find('.yatra-traveller-price').find('.regular').text(regularPriceString);
                $(this).trigger('yatra_single_tour_number_of_person_changed', $(this).val());
                var total_price = _that.getTotalTourPrice();

                $('.yatra-tour-total-price').find('span').text(_that.getPrice(yatra_params.currency_symbol, total_price)).attr('data-total-price', total_price);


            });

        },
        getPrice(currency = null, price) {
            currency = currency === null ? yatra_params.currency_symbol : currency;

            price = this.numberFormat(price);

            var currency_position = yatra_params.currency_position;
            if (currency_position === "left_space") {
                return currency + ' ' + price;

            } else if (currency_position === "right_space") {
                return price + ' ' + currency;

            } else if (currency_position === "right") {
                return price + currency;

            } else {
                return currency + price;

            }
        },
        numberFormat: function (number) {
            var decimals = yatra_params.decimals;
            var dec_point = yatra_params.decimal_separator;
            var thousands_sep = yatra_params.thousand_separator;
            // Strip all characters but numerical ones.
            number = (number + '').replace(/[^0-9+\-Ee.]/g, '');
            var n = !isFinite(+number) ? 0 : +number,
                prec = !isFinite(+decimals) ? 0 : Math.abs(decimals),
                sep = (typeof thousands_sep === 'undefined') ? ',' : thousands_sep,
                dec = (typeof dec_point === 'undefined') ? '.' : dec_point,
                s = '',
                toFixedFix = function (n, prec) {
                    var k = Math.pow(10, prec);
                    return '' + Math.round(n * k) / k;
                };
            // Fix for IE parseFloat(0.55).toFixed(0) = 0;
            s = (prec ? toFixedFix(n, prec) : '' + Math.round(n)).split('.');
            if (s[0].length > 3) {
                s[0] = s[0].replace(/\B(?=(?:\d{3})+(?!\d))/g, sep);
            }
            if ((s[1] || '').length < prec) {
                s[1] = s[1] || '';
                s[1] += new Array(prec - s[1].length + 1).join('0');
            }
            return s.join(dec);
        },
        getTotalTourPrice: function () {

            var _that = this;

            var total_price = 0;

            $.each($('.yatra-price-item-field'), function () {

                var final_price = _that.getPriceItemFinalPrice($(this));

                total_price += parseInt(final_price.final);
            });

            return ((parseInt(window.yatra_global_tour_additional_price)) + total_price);


        },

        getPriceItemFinalPrice: function (price_field) {

            var price = {
                'regular': price_field.data('regular-price'),
                'sales': price_field.data('sales-price'),
                'final': price_field.data('final-price'),
                'people': price_field.find('.yatra-single-tour-number-of-person').val(),
                'currency': price_field.data('currency-symbol'),
                'pricing_per': price_field.data('pricing-per'),
                'group_size': price_field.data('group-size')
            }

            var total_people = parseInt(price.people);
            var pricing_per = price.pricing_per;
            var person_count = total_people;
            if (pricing_per === "group" && total_people > 0) {
                var group_size = parseInt(price.group_size);
                group_size = group_size < 1 ? 1 : group_size;
                person_count = Math.ceil(total_people / group_size)

            }
            var total_regular_price = parseInt(price.regular) * person_count;
            var total_sales_price = (price.sales) === '' ? total_regular_price : parseInt(price.sales) * person_count;

            return {
                'regular': total_regular_price,
                'final': total_sales_price
            };

        }
    };

    $(document).ready(function () {
        YatraFrontend.init();
        YatraPricingCalculator.init();
        $('#yatra-tour-tabs').YatraTabs();
        $('#yatra-tour-sidebar-tabs').YatraTabs();
        window.YatraPricingCalculator = YatraPricingCalculator;


    });
}(jQuery));