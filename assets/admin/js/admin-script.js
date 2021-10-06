// @var yatra_admin_params

(function ($) {
    var YatraTabs = {

        init: function () {
            this.initNewYatraTabs();
            this.cacheDom();
            this.setupAria();
            this.bindEvents();
            this.removeStyle();
        },
        initNewYatraTabs: function () {
            var parent = $('.yatra-admin--tabs');
            parent.find('li').on('click', function () {
                $(this).closest('ul').find('li').removeClass('active');
                $(this).addClass('active');
                var tab_key = $(this).attr('data-tab');
                $('input#yatra_tour_meta_tour_admin_active_tab').val(tab_key);
                var content = parent.next('.yatra-admin--tab-content');
                content.find('.yatra-admin-tab--content-section').removeClass('active');
                content.find('#' + tab_key).addClass('active');
            });
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


    var YatraAdmin = {

        init: function () {

            this.initElement();
            this.initLib();
            this.initGalleryBuilder();
            this.groupPricing();
            this.fixedDeparture();
            this.initDateTimePicker();
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
                wrapper.find("input").val(previous_selection_array.join());
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
        },
        groupPricing: function () {
            var _that = this;
            var add_new = $('#yatra_add_new_pricing_option');
            add_new.on('click', function () {
                var pricing_option_id = _that.uniqid();
                var tpl = $('#yatra-group-pricing-tmpl').html();
                tpl = _that._replaceAll(tpl, '{%pricing_option_id%}', pricing_option_id);
                $(this).closest('.yatra-field-wrap').before(tpl);

            });
            $('body').on('click', '.yatra-pricing-group-wrap .pricing-delete', function () {

                var sure = confirm('Are you sure want to delete this group pricing? Pricing will be deleted only after publish.');
                if (sure) {
                    $(this).closest('.yatra-pricing-group-wrap-container').remove();
                }
            });
        },
        uniqid: function () {
            return '_' + Math.random().toString(36).substr(2, 9);
        },
        _replaceAll: function (str, toReplace, replaceWith) {
            return str ? str.split(toReplace).join(replaceWith) : '';
        },
        fixedDeparture: function () {
            $('#yatra_tour_meta_tour_fixed_departure').on('click', function () {

                if ($(this).prop('checked') == true) {
                    $('div[data-wrap-id="yatra_tour_meta_tour_start_date"]').removeClass('yatra-hide');
                    $('div[data-wrap-id="yatra_tour_meta_tour_end_date"]').removeClass('yatra-hide');

                    $('div[data-wrap-id="yatra_tour_meta_tour_duration_days"]').addClass('yatra-hide');
                    $('div[data-wrap-id="yatra_tour_meta_tour_duration_nights"]').addClass('yatra-hide');
                } else {
                    $('div[data-wrap-id="yatra_tour_meta_tour_start_date"]').addClass('yatra-hide');
                    $('div[data-wrap-id="yatra_tour_meta_tour_end_date"]').addClass('yatra-hide');

                    $('div[data-wrap-id="yatra_tour_meta_tour_duration_days"]').removeClass('yatra-hide');
                    $('div[data-wrap-id="yatra_tour_meta_tour_duration_nights"]').removeClass('yatra-hide');
                }
            });

        },
        initDateTimePicker: function () {

            if ($.fn.yatra_datepicker) {
                $('#yatra_tour_meta_tour_start_date').yatra_datepicker({
                    language: 'en',
                    dateFormat: 'yyyy-mm-dd',
                    minDate: new Date(),
                    onSelect: function (dateStr) {
                        newMinDate = null;
                        newMaxDate = new Date();
                        if ('' !== dateStr) {
                            // milliseconds = moment( dateStr, wp_travel_drag_drop_uploader.moment_date_format ).format( 'MM/DD/YYYY' );
                            milliseconds = moment(dateStr, 'YYYY-MM-DD');
                            new_date_min = new Date(milliseconds);
                            newMinDate = new Date(new_date_min.setDate(new Date(new_date_min.getDate())));

                        }
                        $('#yatra_tour_meta_tour_end_date').yatra_datepicker({
                            minDate: newMinDate,
                            dateFormat: 'yyyy-mm-dd',

                        });
                    }
                });

                $('#yatra_tour_meta_tour_end_date').yatra_datepicker({
                    language: 'en',
                    minDate: new Date(),
                    dateFormat: 'yyyy-mm-dd',

                });

                $('.yatra-datepicker').yatra_datepicker({
                    language: 'en',
                    minDate: new Date(),
                    dateFormat: 'yyyy-mm-dd',

                });

                $('.yatra-timepicker').yatra_datepicker({
                    language: 'en',
                    timepicker: true,
                    onlyTimepicker: true,

                });
            }
        }

    };


    var YatraSubTabs = {

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
            this.tabReordering();

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

                var index = $this.getUpdatedRepeatorIndex($(this));

                $this.repeatorHeading(node, index);

                $this.editorFix(node);

            });

            $('body').on('click', '.mb-repeator-heading span.remove', function () {

                if ($(this).closest('.mb-meta-vertical-tab-content-item').find('.mb-repeator').length > 1) {
                    $(this).closest('.mb-repeator').remove();
                }
                $('.mb-repeator-heading-input').trigger('keyup');
            });
            $('body').on('keyup', '.mb-repeator-heading-input', function () {

                var index = $this.getUpdatedRepeatorIndex($(this));

                $this.repeatorHeading($(this));

            });
            $.each($('.mb-repeator-heading-input'), function () {

                var index = $(this).closest('.mb-meta-vertical-tab-content-item').find('.mb-repeator').index($(this).closest('.mb-repeator'));

                $this.repeatorHeading($(this));
            });

            $('body').on('click', '.yatra-tab-visibility', function () {
                var li = $(this).closest('li');
                var visibility = 1;
                if (!li.hasClass('hide')) {
                    li.removeClass('visible');
                    li.addClass('hide');
                    $(this).removeClass('dashicons-visibility');
                    $(this).addClass('dashicons-hidden');
                    visibility = 0;

                } else {
                    li.removeClass('hide');
                    li.addClass('visible');
                    $(this).removeClass('dashicons-hidden');
                    $(this).addClass('dashicons-visibility');
                    visibility = 1;
                }
                li.trigger('click');
                var data_tab_content = li.attr('data-tab-content');
                var visibility_node_id = data_tab_content + '_visibility';
                if ($('input#' + visibility_node_id).length === 1) {
                    $('input#' + visibility_node_id).val(visibility).trigger('change');
                }

            });
        },
        updateTourTabList: function () {

            var sortableItemArray = [];

            $.each(this.$tabList.find('li'), function () {
                sortableItemArray.push($(this).attr('data-tab-content'));
            });
            if (sortableItemArray.length > 0) {
                $('input#yatra_tour_meta_tour_tabs_ordering').val(sortableItemArray.join());
            }
        },
        editorFix: function (node) {

            var $this = this;

            var editorAreas = node.closest('.mb-meta-vertical-tab-content-item').find('.mb-repeator:last').find('.wp-editor-area');

            node.closest('.mb-meta-vertical-tab-content-item').find('.mb-repeator:last').find('.tmce-active').hide();

            $.each(editorAreas, function () {

                var this_id = $(this).attr('id');

                var trimed_id = this_id.substr(0, this_id.lastIndexOf("-", this_id.length - 2));

                var latest_id = $this.getUpdatedRepeatorIndex(node);

                var updated_id = trimed_id + '-' + latest_id;

                $(this).attr('id', updated_id);

                $(this).closest('.yatra-field-wrap').append($(this));

                $(this).closest('.yatra-field-wrap').find('#' + updated_id).show();

                node.closest('.mb-meta-vertical-tab-content-item').find('.mb-repeator:last').find('.tmce-active').remove();
                node.closest('.mb-meta-vertical-tab-content-item').find('.mb-repeator:last').find('.mce-tinymce').remove();

                tinyMCE.execCommand("mceAddEditor", true, updated_id);

                /* var editorSettings = {
                     mediaButtons: true, // <- must be true
                     tinymce: true,      // <- must be true
                     quicktags: true,    // <- must be true

                 };

                 wp.editor.initialize(updated_id, editorSettings);*/


            });


        },
        repeatorHeading: function ($node) {
            var $node_val = $node.val();
            var $node_index = this.getUpdatedRepeatorIndex($node);
            var replaced_value = $node_val.replace("{index}", $node_index);
            $node.closest('.mb-repeator').find('.repeator-title').html(replaced_value);
        },
        getUpdatedRepeatorIndex: function ($node) {
            var index = $node.closest('.mb-meta-vertical-tab-content-item').find('.mb-repeator').index($node.closest('.mb-repeator'));
            return index + 1;
        },
        changeTab: function () {
            var self = $(event.target);
            event.preventDefault();
            this.$tab.removeClass('active');
            self.addClass('active');
            var data_tab_content_id = self.attr('data-tab-content');

            this.$tabPanel.removeClass('active');
            this.$tabList.closest('section').find('.mb-meta-vertical-tab-content-item[data-tab-content="' + data_tab_content_id + '"]').addClass('active');
        },
        tabReordering: function () {
            var $this = this;
            this.$tabList.sortable({
                update: function (event, ui) {
                    $this.updateTourTabList();
                }
            });
        }

    };


    var YatraTaxonomy = {

        init: function () {

            this.cacheDom();
            this.bindEvents();
        },

        cacheDom: function () {

            this.$attribute_field_type = $('select[name="attribute_field_type"]');
            this.$taxonomy_form_field = $('<div class="form-field term-group"/>');
        },

        bindEvents: function () {

            var $this = this;
            $this.$attribute_field_type.on('change', function () {
                $this.onChangeAttributeType($(this));
            });

        },
        onChangeAttributeType: function ($attribute_node) {

            var spinner = $('<div class="spinner is-active" style="float:none;"></div>');

            var attribute_params = yatra_admin_params.attribute_params;

            if ($attribute_node.val() == '') {
                $attribute_node.closest('form').find('.yatra-taxonomy-group').remove();
                return;
            }

            var attribute_data = {
                action: attribute_params.attribute_action,
                yatra_nonce: attribute_params.attribute_nonce,
                attribute_type: $attribute_node.val(),
                is_edit: attribute_params.is_edit
            };
            $attribute_node.after(spinner);
            $.ajax({
                type: "POST",
                url: yatra_admin_params.ajax_url,
                data: attribute_data,
                beforeSend: function () {

                },
                success: function (response) {

                    if (response.success === true) {

                        $attribute_node.closest('form').find('.yatra-taxonomy-group').remove();

                        if (attribute_params.is_edit) {
                            $attribute_node.closest('tr').after(response.data);
                        } else {
                            $attribute_node.closest('.form-field').after(response.data);
                        }

                    }
                    $attribute_node.closest('.form-field').find('.spinner').remove()

                },
                complete: function () {
                    $attribute_node.closest('.form-field').find('.spinner').remove()
                }
            });
        }

    };


    var YatraTourAttributes = {

        init: function () {

            this.cacheDom();

            this.bindEvents();
        },

        cacheDom: function () {

            this.$add_tour_attribute = $('#add_tour_attribute');

            this.$yatra_tab_section = this.$add_tour_attribute.closest('.yatra-admin-tab-content-inner');

        },

        bindEvents: function () {

            var $this = this;

            this.$add_tour_attribute.on('click', function () {

                var term_id = $this.$yatra_tab_section.find('select[name="tour_attributes"]').find('option:selected').val();

                var spinner = $('<div class="spinner is-active" style="float:none; margin-top:-5px;"></div>');

                var attribute_tour_meta_params = yatra_admin_params.attribute_tour_meta_params;

                var length = $this.$yatra_tab_section.find('.mb-tour-attributes-fields[data-term-id="' + term_id + '"]').length;

                if (term_id < 1 || length > 0) {

                    return;
                }

                var attribute_tour_meta_data = {
                    action: attribute_tour_meta_params.attribute_meta_action,
                    yatra_nonce: attribute_tour_meta_params.attribute_meta_nonce,
                    term_id: term_id,
                    post_id: $('body').find('.yatra_tour_cpt_meta_post_id').val()
                };

                $this.$add_tour_attribute.after(spinner);
                $.ajax({
                    type: "POST",
                    url: yatra_admin_params.ajax_url,
                    data: attribute_tour_meta_data,
                    beforeSend: function () {

                    },
                    success: function (response) {

                        if (response.success === true) {

                            $this.$yatra_tab_section.append(response.data);

                            $this.$yatra_tab_section.find('select[name="tour_attributes"]').find('option[value="' + term_id + '"]').attr('disabled', 'disabled');

                        }
                        $this.$yatra_tab_section.find('.spinner').remove()

                    },
                    complete: function () {
                        $this.$yatra_tab_section.find('.spinner').remove()
                    }
                });


            });

            $('body').on('click', '.mb-remove-item', function () {

                var confirm = window.confirm('Are you sure want to delete attribute?');

                if (!confirm) {

                    return;
                }

                var term_id = $(this).closest('.mb-tour-attributes-fields').attr('data-term-id');

                $(this).closest('.mb-tour-attributes-fields').remove();

                $this.$yatra_tab_section.find('#tour_attributes').find('option[value="' + term_id + '"]').removeAttr('disabled');
            });
            $.each($this.$yatra_tab_section.find('.mb-tour-attributes-fields'), function () {

                var term_id = $(this).attr('data-term-id');

                $this.$yatra_tab_section.find('#tour_attributes').find('option[value="' + term_id + '"]').attr('disabled', 'disabled')

            });
        },


    };


    var YatraSettingFrontTabs = {
        init: function () {
            this.cacheDom();
            this.bindEvents();
        },
        bindEvents: function () {
            var _that = this;
            this.button.on('click', function () {
                _that.addNewTab($(this));
            });
            $('body').on('change', 'input.yatra_frontend_tabs_available_options_icon', function () {
                var className = 'label';
                className += ' ' + $(this).val();
                $(this).closest('li').find('span.label').attr('class', className);
            });
            $('body').on('keyup', 'input.yatra_frontend_tabs_available_options_label', function () {

                $(this).closest('li').find('span.label').text($(this).val());
            });

            $('body').on('click', 'button.available-tab-remove-item', function (e) {
                e.preventDefault();
                var that = $(this);

                Swal.fire({
                    title: yatra_admin_params.tab_settings_remove_tab_item_confirm_title,
                    icon: 'warning',
                    html: yatra_admin_params.tab_settings_remove_tab_item_confirm_message,
                    showCancelButton: true,
                    focusConfirm: false,
                    focusCancel: true,
                    confirmButtonText: yatra_admin_params.tab_settings_remove_tab_item_yes_button_text,
                    cancelButtonText: yatra_admin_params.tab_settings_remove_tab_item_no_button_text,
                    confirmButtonColor: '#dd3036',
                    width: 650
                }).then((result) => {
                    if (result.value === true) {
                        that.closest('li').remove();
                        _that.updateTabOrdering();
                    }
                });

            });

        },
        cacheDom: function () {
            this.button = $('#yatra-setting-tab-option-add-new-tab');

        },
        addNewTab: function ($button) {
            var wrap = $button.closest('.yatra-setting-tab-options');
            var icon_name = wrap.find('ul').attr('data-icon-name');
            var type_name = wrap.find('ul').attr('data-type-name');
            var label_name = wrap.find('ul').attr('data-label-name');
            var visibility_name = wrap.find('ul').attr('data-visibility-name');
            var uuid = this.getUniqueID('text_');
            var li = $('<li data-tab-type="' + uuid + '"/>');
            //name
            li.append('<span class="label">Tab Label Goes Here</span><input class="yatra_frontend_tabs_available_options_label" name="' + this.replaceAll(label_name, uuid) + '" type="text" value="Tab Label"/>');
            //label
            li.append('<input class="yatra_frontend_tabs_available_options_icon icopick" name="' + this.replaceAll(icon_name, uuid) + '" type="text"/>');
            //visbility

            li.append('<label class="yatra-switch-control">\n' +
                '<input class="widefat" id="' + this.replaceAll(icon_name, uuid) + '" name="' + this.replaceAll(icon_name, uuid) + '" type="checkbox" value="1">\n' +
                '<span class="slider round" data-on="show" data-off="hide"></span>\n' +
                '</label>')

            //icon

            li.append('<input name="' + this.replaceAll(type_name, uuid) + '" type="hidden" value="text"/>');

            li.append('<span><button type="button" class="available-tab-remove-item">x</button></span>');

            wrap.find('ul').append(li);

            this.updateTabOrdering();

        },
        replaceAll(text, uuid) {
            return text.replace('TAB_INDEX', uuid);
        },
        getUniqueID: function (prefix = null, suffix = null) {
            var uuid = Math.random().toString(36).substring(2) + (new Date()).getTime().toString(36);
            uuid = prefix !== null ? (prefix + uuid) : uuid;
            uuid = suffix !== null ? (uuid + suffix) : uuid;
            return uuid;
        },
        updateTabOrdering: function () {

            var sortableItemArray = [];

            var $tab_ul = $('.yatra-setting-tab-options').find('ul');

            $.each($tab_ul.find('li'), function () {

                sortableItemArray.push($(this).attr('data-tab-type'));

            });
            if (sortableItemArray.length > 0) {
                $('input#yatra_frontend_tabs_ordering_global').val(sortableItemArray.join());
            }
        }

    };


    $(document).ready(function () {
        YatraAdmin.init();
        YatraTabs.init();
        YatraSubTabs.init();
        YatraTaxonomy.init();
        YatraTourAttributes.init();
        YatraSettingFrontTabs.init();
    });
}(jQuery));
