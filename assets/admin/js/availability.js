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
        }
    };
    var YatraAvailability = {

        init: function () {

            this.initCalendar();
            this.bindEvents();
        },
        initCalendar: function () {

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

                    $.ajax({
                        url: yatra_availability_params.ajax_url,
                        data: {
                            yatra_nonce: yatra_availability_params.day_wise_tour_availability.nonce,
                            action: yatra_availability_params.day_wise_tour_availability.action,

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
                }
                // eventContent: "Some Text"

            });


            calendar.render();

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
        }


    };


    YatraAvailability.init();


});

