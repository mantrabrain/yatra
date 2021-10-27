// @var yatra_params
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
                    var form_data = $(this).serialize();
                    $this.sendEnquiry(form_data);
                });

                $('body').on('click', '.yatra_update_cart', function (e) {

                    e.preventDefault();

                    var form = $(this).closest('form');
                    var form_data = form.serialize();

                    $this.update_cart(form_data, $(this));
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


            },
            initLib: function () {

                if (typeof $().select2 !== 'undefined') {
                    $('.yatra-select2').select2();
                }
                if (typeof $().datepicker !== 'undefined') {
                    $('.yatra-date').datepicker();
                }
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
            update_cart: function (form_data, cart_btn) {

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


                        if (response.success === true) {

                            cart_form.find('.yatra-cart-table-wrapper').find('table.yatra_cart_table').remove();
                            cart_form.find('.yatra-cart-table-wrapper').append(response.data)
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

                        if (data.success === true) {

                            window.location = data.data.cart_page_url;

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

                let container = $(".yatra_tour_start_date").YatraCalendar({

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
                    onDateSelect: function (date) {
                        $(".yatra_tour_start_date").find('input').attr('data-selected-date', date).val(date);

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
                                    }
                                }

                            },
                            complete: function () {

                                $("#yatra-tour-booking-form").removeClass('yatra-loading');
                            }
                        });
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
                        this.$tabLink.on('keydown', function () {
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


    var YatraMessages = {

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
        showError: function (el, messages) {

            var message_html = this.getMessageHTML(messages);

            var error_html = $('<div class="yatra-message yatra-error"/>');

            error_html.append(message_html);

            $(el).find('.yatra-message').remove();

            $(el).append(error_html);

            $(el).find('.yatra-message').delay(5000).fadeOut(800);
        },
        showSuccess: function (el, messages) {

            var message_html = this.getMessageHTML(messages);

            var error_html = $('<div class="yatra-message yatra-success"/>');

            error_html.append(message_html);

            $(el).find('.yatra-message').remove();

            $(el).append(error_html);

            $(el).find('.yatra-message').delay(5000).fadeOut(800);
        }
    };

    $(document).ready(function () {
        YatraFrontend.init();
        $('#yatra-tour-tabs').YatraTabs();
        $('#yatra-tour-sidebar-tabs').YatraTabs();


    });
}(jQuery));