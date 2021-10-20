// @var yatra_availability_params

document.addEventListener('DOMContentLoaded', function () {
    var $ = jQuery;

    var YatraPopUp = {

        title: '',

        data: '',

        id: 'yatra-admin-popup',

        init: function (source) {
            this.title = source.title;
            this.data = source.data;
            this.renderPopUp();
            this.initEvents();
            this.initTooltip();
        },
        renderPopUp: function () {
            var _that = this;
            var id = this.id;

            var content = this.data;

            var contentEl = $('<div class="yatra-admin-popup-content"/>');

            var popupHeader = $('<div class="yatra-admin-popup-header"/>');
            popupHeader.append($('<h2 class="yatra-admin-popup-header-title"/>').text(_that.title));
            popupHeader.append('<span class="yatra-admin-popup-close dashicons dashicons-no-alt"></span>');
            var popupBody = $('<div class="yatra-admin-popup-body"/>');
            popupBody.html(content);
            var popupFooter = $('<div class="yatra-admin-popup-footer"/>');
            contentEl.append(popupHeader);
            contentEl.append(popupBody);
            contentEl.append(popupFooter);
            var popupWrap = $('<div id="' + id + '"/>');
            popupWrap.append(contentEl);
            popupWrap.append('<div class="yatra-admin-popup-overlay"/>');
            $('body').find('#' + id).remove();
            $('body').append(popupWrap);
        },
        initEvents: function () {
            var _that = this;
            $('body').on('click', '.yatra-admin-popup-close', function () {
                _that.closePopup();
            });
            $("body").keydown(function (event) {
                var key = event.key; // const {key} = event; in ES6+
                if (key === "Escape") {
                    _that.closePopup();
                }
            });
        },
        closePopup: function () {
            $('#' + this.id).remove();
        },
        initTooltip: function () {
            tippy('.yatra-tippy-tooltip', {
                allowHTML: true,
            });
        }
    };
    var YatraAvailability = {

        init: function () {

            this.initCalendar();
            this.bindEvents();
        },
        initCalendar: function () {

            var _that = this;
            var calendarEl = document.getElementById('yatra-availability-calendar');
            var calendar = new FullCalendar.Calendar(calendarEl, {
                headerToolbar: {
                    left: '',
                    center: 'title',
                    right: 'today prev,next'
                },
                editable: false,
                navLinks: false, // can click day/week names to navigate views
                dayMaxEvents: true, // allow "more" link when too many events,
                events: {
                    method: 'post',
                    extraParams: function (extra) {
                        return {
                            action: yatra_availability_params.tour_availability.action,
                            yatra_nonce: yatra_availability_params.tour_availability.nonce,
                            tour_id: $('#yatra-availability-calendar-tour-id').val()
                            // current_date: jQuery('#yatra-availability-calendar').FullCalendar('getDate')

                        }
                    },
                    url: yatra_availability_params.ajax_url,
                    failure: function () {
                        document.getElementById('script-warning').style.display = 'block'
                    },

                },
                loading: function (bool) {
                    /*document.getElementById('loading').style.display =
                        bool ? 'block' : 'none';*/
                },

                eventDidMount: function (info) {

                    tippy(info.el, {
                        content: info.event.extendedProps.description,
                        allowHTML: true,
                    });


                    jQuery(info.el).closest('td').find('.yatra-cal-checkbox').prop('checked', true);
                    jQuery(info.el).find('.fc-event-title').html(info.event.title);

                },
                dayCellDidMount: function (info) {

                    jQuery(info.el).find('.fc-daygrid-day-top').append('<input type="checkbox" class="yatra-cal-checkbox" />');
                },
                dayHeaderDidMount(info) {
                    jQuery(info.el).find('.fc-scrollgrid-sync-inner').append('<input type="checkbox" class="yatra-cal-header-checkbox"/>');
                },
                eventClick: function (info) {
                    var td = $(info.el).closest('td.fc-day');
                    _that.ajaxPopUp(td);
                }


            });


            calendar.render();

        },
        ajaxPopUp: function (td) {
            $.ajax({
                url: yatra_availability_params.ajax_url,
                data: {
                    yatra_nonce: yatra_availability_params.day_wise_tour_availability.nonce,
                    action: yatra_availability_params.day_wise_tour_availability.action,
                    tour_id: $('#yatra-availability-calendar-tour-id').val(),
                    start_date: td.attr('data-date'),
                    end_date: td.attr('data-date')

                },
                method: 'post',
                dataType: 'json',

                success: function (response) {

                    var data = {
                        'title': response.title,
                        'data': response.data
                    };
                    YatraPopUp.init(data);
                },
                error: function (e) {

                }
            });
        },
        bindEvents: function () {
            jQuery('body').on('click', '.yatra-cal-header-checkbox', function () {
                var _that = jQuery(this);
                var tdIndex = jQuery(this).closest('th').index();
                var wrap = jQuery(this).closest('#yatra-availability-calendar-container').find('table.fc-scrollgrid-sync-table');
                var checked = false;
                if (jQuery(this).is(':checked')) {
                    checked = true;
                }
                jQuery.each(wrap.find('tr'), function () {
                    var indexedTd = jQuery(this).find('td').eq(tdIndex);
                    if (!jQuery(indexedTd).hasClass('fc-day-other')) {
                        jQuery(indexedTd).find('input.yatra-cal-checkbox').prop('checked', checked);
                    }
                });
                _that.trigger('yatra_calendar_header_change', _that.prop('checked'));
            });
            jQuery('body').on('yatra_calendar_header_change', '.yatra-cal-header-checkbox', function (event, checkbox_value) {
                alert(checkbox_value);
            });
            $('body').on('change', '#yatra-admin-popup .yatra_pricing_pricing_per', function () {
                var val = $(this).val();
                if (val === 'group') {
                    $(this).closest('.yatra-pricing-row').find('.yatra-field-wrap.yatra_pricing_group_size').removeClass('yatra-hide');
                } else {
                    $(this).closest('.yatra-pricing-row').find('.yatra-field-wrap.yatra_pricing_group_size').addClass('yatra-hide');
                }
            });
        }


    };


    YatraAvailability.init();


});

