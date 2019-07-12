// @var yatra_params
var YatraFrontend = function ($) {
    return {

        init: function () {
            this.cacheDom();
            this.bindEvents();
        },
        cacheDom: function () {
            this.$book_now = $('.yatra-book-now-btn');
        },

        bindEvents: function () {
            var $this = this;
            this.$book_now.on('click', function (e) {
                e.preventDefault();
                var tour_id = $(this).attr('data-tour-id');
                if (tour_id < 1) {
                    return;
                }
                $this.bookTour(tour_id);
            });
        },
        addLoading: function ($node) {

            var type = $node[0].tagName.toLowerCase();

            if (type === "a") {
                $node.text($node.attr('data-loading-text'));
            } else {
                $node.val($node.attr('data-loading-text'));
            }

        }, removeLoading: function ($node) {
            var type = $node[0].tagName.toLowerCase();
            if (type === "a") {
                $node.text($node.attr('data-text'));
            } else {
                $node.val($node.attr('data-text'));
            }
        },
        bookTour: function (tour_id) {
            var $this = this;
            var booking_params = yatra_params.booking_params;
            var booking_data = {
                action: booking_params.booking_action,
                yatra_nonce: booking_params.booking_nonce,
                tour_id: tour_id
            };
            $.ajax({
                type: "POST",
                url: yatra_params.ajax_url,
                data: booking_data,
                beforeSend: function () {
                    $this.addLoading($this.$book_now);
                },
                success: function (data) {

                    if (data.success === true) {

                        window.location = data.data.redirect_url;

                    }
                },
                complete: function () {
                    $this.removeLoading($this.$book_now);
                }
            });
        }

    };
}(jQuery);

var YatraTabs = function ($) {
    return {

        init: function () {

            this.cacheDom();
            this.setupAria();
            this.bindEvents();
        },

        cacheDom: function () {
            this.$el = $('.yatra-tabs');
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
            var $this = self || $('[role="tab"]');

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

(function ($) {

    $(document).ready(function () {
        YatraFrontend.init();
        YatraTabs.init();


    });
}(jQuery));