/* global yatra_admin_notices */

/**
 * Yatra Dismissible Notices.
 *
 */

'use strict';

var YatraAdminNotices = window.YatraAdminNotices || (function (document, window, $) {

    /**
     * Public functions and properties.
     *
     *
     * @type {object}
     */
    var app = {

        /**
         * Start the engine.
         *
         */
        init: function () {

            $(app.ready);
        },

        /**
         * Document ready.
         *
         */
        ready: function () {

            app.events();
        },

        /**
         * Dismissible notices events.
         *
         */
        events: function () {


            $(document).on(
                'click',
                '.yatra-notice .notice-dismiss, .yatra-notice .yatra-notice-dismiss',
                app.dismissNotice
            );
        },

        /**
         * Dismiss notice event handler.
         *
         *
         * @param {object} e Event object.
         * */
        dismissNotice: function (e) {
            e.preventDefault();
            $.post(yatra_admin_notices.ajax_url, {
                action: 'yatra_notice_dismiss',
                nonce: yatra_admin_notices.nonce,
                id: ($(this).closest('.yatra-notice').attr('id') || '').replace('yatra-notice-', ''),
            }).done(function () {
                window.location.reload();

            });
        },
    };

    return app;

}(document, window, jQuery));
// Initialize.
YatraAdminNotices.init();
