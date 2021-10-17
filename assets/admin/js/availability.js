// @var yatra_availability_params

document.addEventListener('DOMContentLoaded', function () {
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
                initialDate: '2021-10-10',
                editable: false,
                navLinks: false, // can click day/week names to navigate views
                dayMaxEvents: true, // allow "more" link when too many events,
                events: {
                    method: 'post',
                    extraParams: function () {
                        return {
                            action: yatra_availability_params.tour_availability.action,
                            yatra_nonce: yatra_availability_params.tour_availability.nonce,
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
                /*  eventSourceSuccess: function (content, xhr) {

                      return content.eventArray;
                  }*/
                eventRender: function (info) {
                    console.log(info);
                },

                eventDidMount: function (info) {

                    tippy(info.el, {
                        content: info.event.extendedProps.description,
                        allowHTML: true,
                    });


                    jQuery(info.el).find('.fc-event-title').html(info.event.title);

                },
                dayCellDidMount: function (info) {
                    jQuery(info.el).find('.fc-daygrid-day-top').append('<input type="checkbox" class="yatra-cal-checkbox"/>');
                },
                dayHeaderDidMount(info) {
                    jQuery(info.el).find('.fc-scrollgrid-sync-inner').append('<input type="checkbox" class="yatra-cal-header-checkbox"/>');
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

