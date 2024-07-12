// @var yatra_admin_params

(function ($) {
    var YatraTourMeta = {


        init: function () {

            this.initElement();
            this.initGalleryBuilder();
            this.groupPricing();
            this.conditionalVisibility();
            this.initDateTimePicker();
            this.initDateRangePicker();


        },
        initElement: function () {
            this.gallery_upload_frame = '';
            let tour_slider = $('#yatra_tour_enable_slider');
            tour_slider.on('click', function () {
                let main = $(this).closest('.yatra-tour-slider-admin');

                if ($(this).is(':checked')) {

                    main.find('.add-slider-item').removeClass('hidden');
                } else {
                    main.find('.add-slider-item').addClass('hidden');
                }
            });

        },
        conditionalVisibility: function () {

            var _that = this;

            var conditions = yatra_admin_params.visibility_conditions;

            for (var eventTarget in conditions) {

                if (conditions.hasOwnProperty(eventTarget)) {

                    $('body').on('change', '#' + eventTarget, function (event) {

                        var type = event.target.type;

                        var currentValue = $(this).val();

                        var id = $(this).attr('id');

                        if (type === "checkbox") {
                            currentValue = $(this).prop("checked");
                        }

                        _that.applyConditionalVisibility(id, currentValue);

                    });
                }
            }
            //  console.log(conditions);
        },

        applyConditionalVisibility: function (id, currentValue) {


            var all_values = yatra_admin_params.visibility_conditions[id];

            var loopIndex = 0;
            for (loopIndex = 0; loopIndex < all_values.length; ++loopIndex) {
                var value = all_values[loopIndex].value;
                var target = all_values[loopIndex].target;
                if ($('#' + target).length > 0) {
                    if (value === currentValue) {
                        $('#' + target).closest('.yatra-field-wrap').removeClass('yatra-hide');
                    } else {
                        $('#' + target).closest('.yatra-field-wrap').addClass('yatra-hide');
                    }
                }
            }
        },

        initGalleryBuilder: function () {
            var uploadBtn = $('.mb-gallery-add');
            var $this = this;
            var parentClass = '.mb-admin-gallery';

            uploadBtn.on('click', function (event) {
                var parent = $(this).closest(parentClass);
                event.preventDefault();
                $this.initMediaUploader(uploadBtn, parent);
            });
            $('body').on('click', 'ul.mb-selected-gallery-list li a.remove', function (event) {
                event.preventDefault();
                var parent = $(this).closest(parentClass);
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
                        var template = '<div class="image-wrapper"><div class="image-content"><img src="' + attachment_url + '"/><div class="image-overlay"><a class="remove dashicons dashicons-trash"></a></div></div></div>';
                        selected_list_html += ('<li data-id="' + attachment_id + '">' + template + '</li>');
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
                tpl = _that._replaceAll(tpl, 'yatra-pricing-group-wrap-container', 'yatra-pricing-group-wrap-container active');
                $(this).closest('.yatra-field-wrap').before(tpl);
            });
            $('body').on('click', '.yatra-pricing-group-header .pricing-delete', function (e) {

                e.stopPropagation();
                var sure = confirm('Are you sure want to delete this group pricing? Pricing will be deleted only after publish.');
                if (sure) {
                    $(this).closest('.yatra-pricing-group-wrap-container').remove();
                }
            });

            $('body').on('click', '.yatra-pricing-group-header', function () {

                let container = $(this).closest('.yatra-pricing-group-wrap-container');
                if (container.hasClass('active')) {
                    container.removeClass('active');
                } else {
                    container.addClass('active');
                }

            });
            $('body').on('change', '.yatra_multiple_pricing_price_per', function () {
                var val = $(this).val();
                if (val === 'group') {
                    $(this).closest('.yatra-pricing-group-wrap').find('.yatra_multiple_pricing_group_size').removeClass('yatra-hide');
                } else {
                    $(this).closest('.yatra-pricing-group-wrap').find('.yatra_multiple_pricing_group_size').addClass('yatra-hide');
                }
            });
        },
        uniqid: function () {
            return '_' + Math.random().toString(36).substr(2, 9);
        },
        _replaceAll: function (str, toReplace, replaceWith) {
            return str ? str.split(toReplace).join(replaceWith) : '';
        },

        initDateTimePicker: function () {

            if ($.fn.yatra_datepicker) {

                $('.yatra-datepicker').yatra_datepicker({
                    language: 'en',
                    minDate: new Date(),
                    dateFormat: 'yyyy-mm-dd',
                    autoClose: true,


                });

                $('.yatra-timepicker').yatra_datepicker({
                    language: 'en',
                    timepicker: true,
                    onlyTimepicker: true,
                    autoClose: true,


                });
            }
        },
        initDateRangePicker: function () {
            var _that = this;
            var start = moment().subtract(29, 'days');
            var end = moment();
            var dateFormat = 'YYYY-MM-DD';

            var drpconfig = {
                opens: 'right',
                locale: {
                    format: dateFormat,
                },
                minDate: new Date(),
                selectPastInvalidDate: false,
                isInvalidDate: function (date, log) {
                    return _that.getSelectedDateRanges($('#yatra_tour_meta_availability_date_ranges')).reduce(function (bool, range) {
                        return bool || (date >= moment(range.start) && date <= moment(range.end));
                    }, false);
                },
            };
            $('.yatra-daterange-picker').daterangepicker(drpconfig);
            $('.yatra-daterange-picker').on('apply.daterangepicker', function (event, picker) {

                var start_date = picker.startDate.format(dateFormat);
                var end_date = picker.endDate.format(dateFormat);
                var wrap_ul = $(this).closest('.yatra-field-wrap').find('ul.yatra-daterange-list');

                var updateStatus = _that.updateSelectedDateRanges(start_date, end_date, $(this).closest('.yatra-field-wrap').find('input'));
                if (updateStatus) {
                    var list_item = $('<li class="yatra-tippy-tooltip"  data-tippy-content="' + start_date + ' - ' + end_date + '" data-start-date="' + start_date + '" data-end-date="' + end_date + '"/>');
                    list_item.append('<small class="dashicons dashicons-no"></small><span>' + start_date + ' - ' + end_date + '</span>');
                    wrap_ul.append(list_item);
                    tippy('.yatra-daterange-list li', {
                        allowHTML: true,
                    });
                }

            });
            $('body').on('click', 'ul.yatra-daterange-list li small.dashicons', function () {


                _that.deleteSelectedDateRanges($(this));
                $(this).closest('li').remove();
            });
        },
        getSelectedDateRanges: function (el) {


            var ranges = el.val();


            return ranges == null || ranges === "" ? [] : Object.values(JSON.parse(ranges));

        },
        deleteSelectedDateRanges: function (el) {
            var start_date = el.closest('li').attr('data-start-date');
            var end_date = el.closest('li').attr('data-end-date');
            var selectedDateRanges = this.getSelectedDateRanges(el.closest('.yatra-field-wrap').find('input'));
            var updatedRanges = [];
            for (const arr_obj of selectedDateRanges) {
                var arrStartDate = arr_obj.start;
                var arrEndDate = arr_obj.end;
                if (start_date !== arrStartDate && end_date !== arrEndDate) {
                    updatedRanges.push(arr_obj);
                }
            }
            var rangesString = JSON.stringify(updatedRanges);
            el.closest('.yatra-field-wrap').find('input').val(rangesString);
        },
        updateSelectedDateRanges: function (start_date, end_date, el) {
            var _that = this;
            var status = true;
            var selectedDateRanges = (this.getSelectedDateRanges(el.closest('.yatra-field-wrap').find('input')));

            selectedDateRanges.every(function (arr_obj) {
                var arrStartDate = arr_obj.start;
                var arrEndDate = arr_obj.end;
                var isOverlap = _that.isDateRangeOverlaps(start_date, end_date, arrStartDate, arrEndDate);
                if (isOverlap) {

                    status = false;
                    alert('You cant select that range because one of the selected date range already included into this range.');
                    return status;
                }

            });
            if (!status) {
                return false;
            }
            selectedDateRanges.push({
                'start': start_date,
                'end': end_date
            });
            var sortedDateRanges = selectedDateRanges.sort((a, b) => moment(a.start) - moment(b.start))
            var rangesString = JSON.stringify(sortedDateRanges);
            el.closest('.yatra-field-wrap').find('input').val(rangesString);

            return status;
        },
        isDateRangeOverlaps: function (a_start, a_end, b_start, b_end) {
            a_start = moment(a_start);
            a_end = moment(a_end);
            b_start = moment(b_start);
            b_end = moment(b_end);
            /*if (a_start <= b_start && b_start <= a_end) return true; // b starts in a
            if (a_start <= b_end && b_end <= a_end) return true; // b ends in a
            if (b_start <= a_start && a_end <= b_end) return true; // a in b*/

            if (a_start <= b_start && a_end >= b_start) return true; // b start in a range
            if (a_start <= b_end && a_end >= b_end) return true; // b end  in a range
            if (b_start <= a_start && b_end >= a_start) return true; // a start in b range
            if (b_start <= a_end && b_end >= a_end) return true; // a end  in b range

            return false;
        }

    };
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
            var _that = this;
            this.$tabLink.on('click', function (event) {

                this.changeTab(event);
            }.bind(this));
            this.$tabLink.on('keydown', function () {
                this.changeTabKey();
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

            $('body').on('click', '.mb-repeator-heading', function (e) {

                if ($(e.target).hasClass('add') || $(e.target).hasClass('remove')) {
                    return;
                }
                $(this).closest('.mb-repeator').find('.mb-repeator-fields').slideToggle('slow', function () {
                    if ($(this).closest('.mb-repeator').find('.toggle').hasClass('dashicons-arrow-down-alt2')) {
                        $(this).closest('.mb-repeator').find('.toggle').removeClass('dashicons-arrow-down-alt2')
                        $(this).closest('.mb-repeator').find('.toggle').addClass('dashicons-arrow-up-alt2')
                    } else {
                        $(this).closest('.mb-repeator').find('.toggle').removeClass('dashicons-arrow-up-alt2')
                        $(this).closest('.mb-repeator').find('.toggle').addClass('dashicons-arrow-down-alt2')
                    }
                });
            });

            $('body').on('click', '.mb-repeator-heading span.add', function () {

                $(this).closest('.mb-meta-vertical-tab-content-item').find('.mb-repeator:last').closest('.yatra-field-wrap').after($(this).closest('.yatra-field-wrap').clone());

                var node = $(this).closest('.mb-meta-vertical-tab-content-item').find('.mb-repeator:last').find('.mb-repeator-heading-input');

                var index = $this.getUpdatedRepeatorIndex($(this));

                $this.repeatorHeading(node, index);

                $this.editorFix(node);

            });

            $('body').on('click', '.mb-repeator-heading span.remove', function () {

                if ($(this).closest('.mb-meta-vertical-tab-content-item').find('.mb-repeator').length > 1) {
                    $(this).closest('.mb-repeator').parent().remove();
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
            $('input#yatra_tour_meta_tour_admin_subtab_active_tab').val(data_tab_content_id);
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
    var YatraTourCustomAttribute = {

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
                var _that = $(this);
                Swal.fire({
                    title: yatra_admin_params.remove_attribute_confirm_title,
                    icon: 'warning',
                    html: '<br/>',
                    showCancelButton: true,
                    focusConfirm: false,
                    focusCancel: true,
                    confirmButtonText: yatra_admin_params.remove_attribute_confirm_yes_button_text,
                    cancelButtonText: yatra_admin_params.remove_attribute_confirm_no_button_text,
                    confirmButtonColor: '#dd3036',
                    width: 650
                }).then((result) => {
                    if (result.value === true) {
                        var term_id = $(this).closest('.mb-tour-attributes-fields').attr('data-term-id');

                        $(this).closest('.mb-tour-attributes-fields').remove();

                        $this.$yatra_tab_section.find('#tour_attributes').find('option[value="' + term_id + '"]').removeAttr('disabled');
                    }
                });

            });
            $.each($this.$yatra_tab_section.find('.mb-tour-attributes-fields'), function () {

                var term_id = $(this).attr('data-term-id');

                $this.$yatra_tab_section.find('#tour_attributes').find('option[value="' + term_id + '"]').attr('disabled', 'disabled')

            });
        },


    };
    $(document).ready(function () {
        YatraTourMeta.init();
        YatraTabs.init();
        YatraSubTabs.init();
        YatraTourCustomAttribute.init();
    });
}(jQuery));