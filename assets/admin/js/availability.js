// @var yatra_availability_params

document.addEventListener('DOMContentLoaded', function () {
    var YatraAvailability = {

        init: function () {

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

            });


            calendar.render();

        },


    };


    YatraAvailability.init();


});

