// @var yatra_params
(function ($) {
    var YatraFrontend = function ($) {
        return {

            init: function () {
                this.cacheDom();
                this.bindEvents();
                this.initLib();
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
                $('body').on('click', 'table.yatra_cart_table input.yatra-number-of-person-field', function (e) {
                    e.preventDefault();

                    var yatra_cart_table = $(this).closest('.yatra_cart_table');

                    yatra_cart_table.find('.yatra_update_cart').removeAttr('disabled');

                });
                $('body').on('click',
                    '.yatra-itinerary-list-item .itinerary-heading svg, .yatra-itinerary-list-item .itinerary-heading .fa, .yatra-faq-list-item .faq-heading svg, .yatra-faq-list-item .faq-heading .fa', function () {

                        if ($(this).hasClass('fa-minus')) {

                            $this.toggleYatraList($(this), 'close');
                        } else {
                            $this.toggleYatraList($(this), 'open');
                        }
                    });
                $('body').on('click', '.yatra-tab-content .tab-title svg, .yatra-tab-content .tab-title .fa', function () {

                    var toggle_node = $(this);
                    var span = $('<span class=""/>');
                    var heading = toggle_node.closest('h3');
                    toggle_node.hide();
                    var toggle_status = 'close';
                    if (toggle_node.hasClass('fa-minus')) {
                        toggle_status = 'close';
                        span.addClass('fa fa-plus');
                    } else {
                        toggle_status = 'open';
                        span.addClass('fa fa-minus');
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