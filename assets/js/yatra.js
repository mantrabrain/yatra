// @var yatra_params
(function ($) {
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
            initDateTimePicker: function () {

                if ($(".yatra_tour_start_date").length === 0) {
                    return;
                }
                var single_tour = yatra_params.single_tour;
                if ($.fn.flatpickr) {
                    var config = {
                        minDate: 'today',
                        //defaultDate: '2022-02-15',
                        inline: true,
                        onReady: function (event, date) {

                        },
                        enable: single_tour.enabled_dates,
                        disables: [
                            {
                                from: "2021-10-28",
                                to: "2021-10-30"
                            },
                            {
                                from: "2021-11-05",
                                to: "2021-11-15"
                            }
                        ],
                        onReady: function (de, check) {

                        },
                        onMonthChange: function (selecteDate, sateStr, instance) {

                        },
                        onDayCreate: function (dObj, dStr, fp, dayElem) {

                            var day = $(dayElem).attr("aria-label");

                            var cal_date = new Date(day);
                            var date = cal_date.toISOString().split('T')[0].trim();
                            var object = yatra_params.single_tour.all_available_date_data[date];

                            if (object !== undefined) {
                                console.log(date);
                                console.log(day);
                                console.log(object);
                                console.log(dayElem);
                                $(dayElem).addClass('yatra-tippy-tooltip').attr('data-tippy-content', object.description);
                            }

                        },
                        onOpen: [
                            function (selectedDates, dateStr, instance) {
                                console.log(selectedDates);
                                console.log(dateStr);
                                console.log(instance);
                            },
                            function (selectedDates, dateStr, instance) {
                                //...
                            }
                        ],
                    };
                    $(".yatra_tour_start_date").flatpickr(config);
                }

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
                        this.$tabLink.on('click', function () {

                            this.changeTab();
                        }.bind(this));
                        this.$tabLink.on('keydown', function () {
                            this.changeTabKey();
                        }.bind(this));
                    },

                    changeTab: function () {
                        var self = $(event.target);
                        event.preventDefault();
                        this.removeTabFocus();
                        this.setSelectedTab(self);
                        this.hideAllTabPanels();
                        this.setSelectedTabPanel(self);
                    },

                    changeTabKey: function () {
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

    $(document).ready(function () {
        YatraFrontend.init();
        $('#yatra-tour-tabs').YatraTabs();
        $('#yatra-tour-sidebar-tabs').YatraTabs();


    });
}(jQuery));