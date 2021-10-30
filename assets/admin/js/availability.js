// @var yatra_availability_params

document.addEventListener('DOMContentLoaded', function () {
    var $ = jQuery;
    var availability_date_ranges = [];
    var availability_calendar;

    var YatraPopUp = {

        title: '',

        data: '',

        id: 'yatra-admin-popup',

        post_title: '[ This is Post Title ]',

        init: function (source) {

            this.title = source.title;

            this.data = source.data;

            this.post_title = source.post_title;

            this.renderPopUp();

            this.initTooltip();

            this.initDateRangePicker();
        },
        renderPopUp: function () {
            var _that = this;

            var id = this.id;

            var content = this.data;

            var contentEl = $('<div class="yatra-admin-popup-content"/>');

            var popupHeader = $('<div class="yatra-admin-popup-header"/>');
            var h2 = $('<h2 class="yatra-admin-popup-header-title"/>');
            h2.append($('<span class="date"/>').text(_that.title));
            h2.append($('<span class="post-title"/>').text(_that.post_title));
            popupHeader.append(h2);
            popupHeader.append('<span class="yatra-admin-popup-close dashicons dashicons-no-alt"></span>');
            var popupBody = $('<div class="yatra-admin-popup-body"/>');
            popupBody.html(content);
            var popupFooter = $('<div class="yatra-admin-popup-footer"/>');
            popupFooter.append('<button type="button" class="button button-primary yatra-day-wise-availability-save">Save the changes</button>');
            contentEl.append(popupHeader);
            contentEl.append(popupBody);
            contentEl.append(popupFooter);
            var popupWrap = $('<div id="' + id + '"/>');
            popupWrap.append(contentEl);
            popupWrap.append('<div class="yatra-admin-popup-overlay"/>');
            $('body').find('#' + id).remove();
            $('body').append(popupWrap);
            $('body').addClass('yatra-popup-open');
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

            $('body').on('submit', 'form#yatra-availability-calendar-popup-form', function (event) {
                $(this).closest('#yatra-admin-popup').find('.yatra-day-wise-availability-save').trigger('click');
                event.preventDefault();
            });

            $('body').on('change', '#yatra-admin-popup .yatra_pricing_pricing_per', function () {
                var val = $(this).val();
                if (val === 'group') {
                    $(this).closest('.yatra-field-row').find('.yatra-field-wrap.yatra_pricing_group_size').removeClass('yatra-hide');
                } else {
                    $(this).closest('.yatra-field-row').find('.yatra-field-wrap.yatra_pricing_group_size').addClass('yatra-hide');
                }
            });

            $('body').on('change', '#yatra-admin-popup .yatra_availability_selected_date', function (event) {
                var that_item = $(this);

                var json_object = {
                    start: $(this).attr('data-start-date'),
                    end: $(this).attr('data-end-date'),
                }
                if (typeof json_object.start !== undefined && typeof json_object.end !== undefined) {

                    var ajax_data = {
                        data: {
                            yatra_nonce: yatra_availability_params.day_wise_tour_availability.nonce,
                            action: yatra_availability_params.day_wise_tour_availability.action,
                            tour_id: $('#yatra-availability-calendar-tour-id').val(),
                            start_date: json_object.start,
                            end_date: json_object.end,
                            content_only: true,

                        },
                        beforeSend: function () {
                            $('#yatra_availability_selected_date').attr('disabled', true);
                            $('#yatra-admin-popup').find('.yatra-availability-calendar-pricing-content').addClass('yatra-overlay');
                            that_item.closest('.yatra-field-wrap').append('<span class="spinner" style="visibility: visible"/>');
                        },
                        complete: function () {
                            $('#yatra-admin-popup').find('.yatra-availability-calendar-pricing-content').removeClass('yatra-overlay');
                            that_item.closest('.yatra-field-wrap').find('.spinner').remove();
                            $('#yatra-availability-calendar').removeClass('yatra-loading');
                            $('#yatra_availability_selected_date').removeAttr('disabled');

                        },
                        success: function (response) {

                            var id = $('#yatra-availability-calendar-tour-id').val();
                            var title = $('#yatra-availability-calendar-tour-id').attr('data-title');
                            var post_title = "[ #" + id + ' - ' + title + ' ]';

                            $('#yatra-admin-popup').find('h2.yatra-admin-popup-header-title .date').text(response.title);
                            $('#yatra-admin-popup').find('h2.yatra-admin-popup-header-title .post-title').text(post_title);
                            $('#yatra-admin-popup').find('.yatra-availability-calendar-pricing-content').html(response.data);

                        },
                    }
                    YatraAvailability.ajaxPopUp(ajax_data);
                }

            });

            $('body').on('click', '.yatra-day-wise-availability-save', function () {
                var that_item = $(this);
                $.ajax({
                    url: yatra_availability_params.ajax_url,
                    data: $("#yatra-availability-calendar-popup-form").serialize(),
                    method: 'post',
                    beforeSend: function () {
                        $("#yatra-availability-calendar-popup-form").addClass('loading');
                        that_item.addClass('updating-message');
                    },
                    complete: function () {
                        that_item.removeClass('updating-message');
                        $("#yatra-availability-calendar-popup-form").removeClass('loading');
                        _that.closePopup();
                    },
                    success: function (response) {
                    },
                    error: function (e) {

                    }
                });
            });

            $('body').on('click', '#yatra_availability_selected_date', function () {
                $(this).closest('.yatra-field-wrap').find('.yatra-avilability-daterange-picker').trigger('click');
            })
            $('body').on('change', '.yatra_availability_use_tour_settings', function () {

                var form = $(this).closest('form');
                if ($(this).prop('checked')) {
                    form.find('fieldset').addClass('disablssssed');
                }
                form.find('fieldset').removeClass('disablssssed');
            })
            $("body").on('change', '.yatra_availability_activate', function () {
                var form = $(this).closest('form');
                if ($(this).is(':checked')) {
                    form.removeClass('yatra-deactivate-form');
                } else {
                    form.addClass('yatra-deactivate-form');
                }
            });

        },
        closePopup: function () {
            $('#' + this.id).remove();
            $('body').removeClass('yatra-popup-open');
            availability_calendar.refetchEvents();
        },
        initTooltip: function () {
            tippy('.yatra-tippy-tooltip', {
                allowHTML: true,
            });
        },
        initDateRangePicker: function () {
            var _that = this;

            var start_date = $('#yatra_availability_selected_date').attr('data-start-date');
            var dateFormat = 'YYYY-MM-DD';
            var drpconfig = {
                parentEl: "#yatra-admin-popup",
                opens: 'right',
                locale: {
                    format: dateFormat,
                },
                minDate: new Date(),
                startDate: new Date(start_date),
                selectPastInvalidDate: false,
                isInvalidDate: function (date, log) {
                    if (availability_date_ranges.length == 0) {
                        return false;
                    }
                    return !_that.isDateInRange(availability_date_ranges, date);
                }
            };
            $('.yatra-avilability-daterange-picker').daterangepicker(drpconfig).bind('#yatra-admin-popup');
            $('.yatra-avilability-daterange-picker').on('apply.daterangepicker', function (event, picker) {

                var start_date = picker.startDate.format(dateFormat);
                var end_date = picker.endDate.format(dateFormat);

                if (!_that.isDateRangeOverlaps()) {
                    var input_field = $(this).closest('.yatra-field-wrap').find('.yatra_availability_selected_date');
                    var selected_date_string = start_date + ' - ' + end_date;
                    input_field.val(selected_date_string)
                    input_field.attr('data-start-date', start_date);
                    input_field.attr('data-end-date', end_date);
                    var date_obj = {
                        start: start_date,
                        end: end_date
                    };
                    $(this).closest('.yatra-field-wrap').find('.yatra_availability_selected_date').trigger('change');
                    $(this).closest('.yatra-field-wrap').find('#yatra_availability_selected_date_ranges').val(JSON.stringify(date_obj));
                }


            });

        },
        isDateInRange: function (ranges, date) {

            var status = false;

            for (let range of ranges) {

                if (date >= moment(range.start) && date <= moment(range.end)) {

                    status = true;
                    break;

                }


            }
            return status;
        },
        isDateRangeOverlaps: function () {
            return false;
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
            availability_calendar = new FullCalendar.Calendar(calendarEl, {
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
                    isLoading: function (bool) {
                        alert(bool);
                        $('#yatra-availability-calendar').addClass('yatra-loading');
                    },
                    url: yatra_availability_params.ajax_url,
                    failure: function () {
                        document.getElementById('script-warning').style.display = 'block'
                    },

                },
                loading: function (bool) {
                    if (bool) {
                        $('#yatra-availability-calendar').addClass('yatra-loading');

                    } else {
                        $('#yatra-availability-calendar').removeClass('yatra-loading');

                    }
                },

                eventDidMount: function (info) {

                    tippy(info.el, {
                        content: info.event.extendedProps.description,
                        allowHTML: true,
                    });


                    var title_class = info.event.extendedProps.is_active ? 'yatra-active-event' : 'yatra-inactive-event';
                    title_class += ' yatra-availability-' + info.event.extendedProps.availability;
                    title_class += info.event.extendedProps.is_full ? ' yatra-booking-full' : ' ';

                    var td_class = info.event.extendedProps.is_expired ? 'yatra-expired-date' : '';

                    // jQuery(info.el).closest('td').find('.yatra-cal-checkbox').prop('checked', true);
                    jQuery(info.el).find('.fc-event-title').html(info.event.title);
                    jQuery(info.el).find('.fc-event-title').addClass(title_class);
                    jQuery(info.el).closest('td').addClass(td_class);

                },
                dayCellDidMount: function (info) {

                    //jQuery(info.el).find('.fc-daygrid-day-top').append('<input type="checkbox" class="yatra-cal-checkbox" />');
                },
                dayHeaderDidMount(info) {
                    //jQuery(info.el).find('.fc-scrollgrid-sync-inner').append('<input type="checkbox" class="yatra-cal-header-checkbox"/>');
                },
                eventClick: function (info) {
                    var td = $(info.el).closest('td.fc-day');
                    var ajax_data = {
                        data: {
                            yatra_nonce: yatra_availability_params.day_wise_tour_availability.nonce,
                            action: yatra_availability_params.day_wise_tour_availability.action,
                            tour_id: $('#yatra-availability-calendar-tour-id').val(),
                            start_date: td.attr('data-date'),
                            end_date: td.attr('data-date'),

                        }
                    }
                    _that.ajaxPopUp(ajax_data);
                }


            });


            availability_calendar.render();

        },
        ajaxPopUp: function (options) {

            $('#yatra-availability-calendar').addClass('yatra-loading');

            let default_options = {
                url: yatra_availability_params.ajax_url,
                data: {},
                method: 'post',
                dataType: 'json',

                success: function (response) {

                    var id = $('#yatra-availability-calendar-tour-id').val();
                    var title = $('#yatra-availability-calendar-tour-id').attr('data-title');
                    var data = {
                        'title': response.title,
                        'data': response.data,
                        'post_title': "[ #" + id + ' - ' + title + ' ]',
                    };
                    availability_date_ranges = response.fixed_date_ranges;
                    YatraPopUp.init(data);
                },
                error: function (e) {

                },
                complete: function () {
                    $('#yatra-availability-calendar').removeClass('yatra-loading');
                }
            };
            let ajax_options = {
                ...default_options,
                ...options
            };


            $.ajax(ajax_options);
        },
        bindEvents: function () {
            var _that = this;
            $('body').on('click', '.yatra-availability-tour-lists li a', function (event) {
                event.preventDefault();
                $(this).closest('ul').find('li').removeClass('active-tour');
                $(this).closest('li').addClass('active-tour');
                var tour_id = $(this).attr('data-id');
                $('#yatra-availability-calendar-tour-id').val(tour_id);
                $('#yatra-availability-calendar-tour-id').attr('data-title', $(this).attr('data-title'));
                availability_calendar.refetchEvents();

            });
            YatraPopUp.initEvents();
        },


    };


    YatraAvailability.init();


});

