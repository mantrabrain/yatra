var YatraTabs = function ($) {
    return {

        init: function () {

            this.cacheDom();
            this.setupAria();
            this.bindEvents();
            this.removeStyle();
        },

        cacheDom: function () {
            this.$el = $('.yatra-tabs');
            this.$tabList = this.$el.find('ul.mb-tab-list');
            this.$tab = this.$tabList.find('li');
            this.$tabFirst = this.$tabList.find('li:first-child a');
            this.$tabLink = this.$tabList.find('li>a');

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
                'aria-selected': null
            });
        },

        selectFirstTab: function () {
            this.$tabFirst.attr({
                'aria-selected': 'true',
                'tabindex': '0'
            });
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
                'aria-selected': true,
                'tabindex': '0'
            }).focus();
        },

        setSelectedTabPanel: function (self) {
            this.$el.find('#' + self.attr('aria-controls')).attr('aria-hidden', null);
        },
        removeStyle: function () {
            this.$el.find('.yatra-tab-section').removeAttr('style');
        }

    };
}(jQuery);

var YatraAdmin = function ($) {
    return {

        init: function () {

            this.initElement();
            this.initLib();
            this.initGalleryBuilder();
        },
        initElement: function () {
            this.gallery_upload_frame = '';

        }, initLib: function () {

            if (typeof "select2" !== 'undefined') {
                $('.yatra-select2').select2();
            }
        },
        initGalleryBuilder: function () {
            var uploadBtn = $('.mb-gallery-add');
            var parent = uploadBtn.closest('.mb-admin-gallery');
            var $this = this;
            uploadBtn.on('click', function (event) {
                event.preventDefault();
                $this.initMediaUploader(uploadBtn, parent);
            });
            $('body').on('click', 'ul.mb-selected-gallery-list li a.remove', function (event) {
                event.preventDefault();
                $this.removeGalleryItem($(this).closest('li'), parent);

            });
        },
        initMediaUploader: function (uploadBtn, wrapper) {

            var $this = this;
            if (this.gallery_upload_frame) this.gallery_upload_frame.close();

            this.gallery_upload_frame = wp.media.frames.file_frame = wp.media({
                title: uploadBtn.data('uploader-title'),
                button: {
                    text: uploadBtn.data('uploader-button-text'),
                },
                multiple: true
            });

            this.gallery_upload_frame.on('select', function () {
                var previous_selection_value = wrapper.find("input").val();
                var previous_selection_array = previous_selection_value.split(",");
                if (previous_selection_array.length == 1 && previous_selection_array[0] == "") {
                    previous_selection_array = [];
                }
                var selection = $this.gallery_upload_frame.state().get('selection');
                var selected_list_node = wrapper.find('ul.mb-selected-gallery-list');
                var selected_list_html = '';
                selection.map(function (attachment_object, i) {
                    var attachment = attachment_object.toJSON();
                    var attachment_id = attachment.id;
                    var attachment_url = attachment.sizes.full.url;
                    if ($.inArray(attachment_id, previous_selection_array) !== "-1") {
                        previous_selection_array.push(attachment_id);
                        selected_list_html += ('<li data-id="' + attachment_id + '"><a class="remove dashicons dashicons-trash"></a><img src="' + attachment_url + '"/></li>');
                    }


                });
                wrapper.find("input").val(previous_selection_array.join())
                selected_list_node.append(selected_list_html);
            });


            this.gallery_upload_frame.open();
        },
        removeGalleryItem: function (gallery_item, wrapper) {
            var gallery_id = gallery_item.attr('data-id');
            var list_ids = wrapper.find("input").val();

            var list_ids_array = list_ids.split(",");
            if (list_ids_array.length == 1 && list_ids_array[0] == "") {
                list_ids_array = [];
            }
            var index = list_ids_array.indexOf(gallery_id);

            if (index > -1) {
                list_ids_array.splice(index, 1);
            }
            gallery_item.remove();
            wrapper.find("input").val(list_ids_array.join());
        }

    };
}(jQuery);

var YatraSubTabs = function ($) {
    return {

        init: function () {

            this.cacheDom();
            this.bindEvents();
        },

        cacheDom: function () {
            this.$tabList = $('.mb-meta-vertical-tab');
            this.$tab = this.$tabList.find('li');
            this.$tabFirst = this.$tabList.find('li:first-child');
            this.$tabLink = this.$tabList.find('li');
            this.$tabPanel = this.$tabList.closest('section').find('.mb-meta-vertical-tab-content-item');

        },

        bindEvents: function () {
            var $this = this;
            this.$tabLink.on('click', function () {
                this.changeTab();
            }.bind(this));

            $('body').on('click', '.mb-repeator-heading span.toggle', function () {

                $(this).closest('.mb-repeator').find('.mb-repeator-fields').slideToggle('slow', function () {

                });
            });

            $('body').on('click', '.mb-repeator-heading span.add', function () {

                $(this).closest('.mb-meta-vertical-tab-content-item').find('.mb-repeator:last').after($(this).closest('.mb-repeator').clone());


                var node = $(this).closest('.mb-meta-vertical-tab-content-item').find('.mb-repeator:last').find('.mb-repeator-heading-input');

                var index = $(this).closest('.mb-meta-vertical-tab-content-item').find('.mb-repeator').index(node.closest('.mb-repeator'));

                $this.repeatorHeading(node, index);

                $this.updateRepeatorIndex($(this));
            });

            $('body').on('click', '.mb-repeator-heading span.remove', function () {

                if ($(this).closest('.mb-meta-vertical-tab-content-item').find('.mb-repeator').length > 1) {
                    $(this).closest('.mb-repeator').remove();
                }
                $('.mb-repeator-heading-input').trigger('keyup');
                $this.updateRepeatorIndex($(this));
            });
            $('body').on('keyup', '.mb-repeator-heading-input', function () {

                var index = $(this).closest('.mb-meta-vertical-tab-content-item').find('.mb-repeator').index($(this).closest('.mb-repeator'));

                $this.repeatorHeading($(this), index);

            });
            $.each($('.mb-repeator-heading-input'), function () {

                var index = $(this).closest('.mb-meta-vertical-tab-content-item').find('.mb-repeator').index($(this).closest('.mb-repeator'));

                $this.repeatorHeading($(this), index);
            });
        },
        repeatorHeading: function ($node, $node_index) {
            var $node_val = $node.val();
            var replaced_value = $node_val.replace("{index}", $node_index + 1);
            $node.closest('.mb-repeator').find('.repeator-title').html(replaced_value);
        },

        updateRepeatorIndex: function ($node) {

        },

        changeTab: function () {
            var self = $(event.target);
            event.preventDefault();
            this.$tab.removeClass('active');
            self.addClass('active');
            var data_tab_content_id = self.attr('data-tab-content');

            this.$tabPanel.removeClass('active');
            this.$tabList.closest('section').find('.mb-meta-vertical-tab-content-item[data-tab-content="' + data_tab_content_id + '"]').addClass('active');
        }

    };
}(jQuery);

$(function () {
    YatraAdmin.init();
    YatraTabs.init();
    YatraSubTabs.init();
});