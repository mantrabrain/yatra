// @var yatra_admin_params

(function ($) {
    var YatraAdminSettings = {

        init: function () {

            this.cacheDom();
            this.initLib();
            this.bindEvents();
            this.sortableSetting();


        },
        cacheDom: function () {
            this.button = $('#yatra-setting-tab-option-add-new-tab');
        },
        initLib: function () {

            if ($.isFunction($.fn.wpColorPicker)) {
                $('.yatra-color-picker-container').remove();
                $('.yatra-colorpicker').wpColorPicker().removeClass('yatra-hide');
            }

        },
        bindEvents: function () {
            var _that = this;
            this.button.on('click', function () {
                _that.addNewTab($(this));
            });
            $('body').on('change', 'input.yatra_frontend_tabs_available_options_icon', function () {
                var className = 'icon';
                className += ' ' + $(this).val();
                $(this).closest('li').find('.label .icon').attr('class', className);
            });
            $('body').on('keyup', 'input.yatra_frontend_tabs_available_options_label', function () {

                $(this).closest('li').find('.label .text').text($(this).val());
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
        addNewTab: function ($button) {
            var wrap = $button.closest('.yatra-setting-tab-options');
            var icon_name = wrap.find('ul').attr('data-icon-name');
            var type_name = wrap.find('ul').attr('data-type-name');
            var label_name = wrap.find('ul').attr('data-label-name');
            var visibility_name = wrap.find('ul').attr('data-visibility-name');
            var uuid = this.getUniqueID('text_');
            var li = $('<li data-tab-type="' + uuid + '"/>');
            //name
            li.append('<div class="label"><span class="icon"></span><span class="text">Tab Label Goes Here</span></div><input class="yatra_frontend_tabs_available_options_label" name="' + this.replaceAll(label_name, uuid) + '" type="text" value="Tab Label"/>');
            //label
            li.append('<input class="yatra_frontend_tabs_available_options_icon icopick" name="' + this.replaceAll(icon_name, uuid) + '" type="text" value=""/>');
            //visbility

            li.append('<label class="yatra-switch-control">\n' +
                '<input class="widefat" id="' + this.replaceAll(icon_name, uuid) + '" name="' + this.replaceAll(visibility_name, uuid) + '" type="checkbox" value="1">\n' +
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
        },
        sortableSetting: function () {
            $('.yatra-setting-tab-options ul').sortable({
                update: function (event, ui) {
                },
            });
        }

    };

    $(document).ready(function () {
        YatraAdminSettings.init();
    });
}(jQuery));
