// @var
jQuery(function ($) {
    var yatraSetupImportDemoSampleData = {
        init: function () {
            var _this = this;
            $('button.yatra-import-dummy-data').on('click', function (e) {
                e.preventDefault();
                _this.import($(this));

            });
            $('body').on('click', '.yatra-theme-install', function (e) {
                var button = $(this);
                e.preventDefault();
                _this.install_and_activate(button);
            });

        },
        import: function ($this) {
            $.ajax({
                url: yatraSetup.ajax_url,
                type: 'POST',
                data: {
                    action: yatraSetup.import_action,
                    yatra_nonce: yatraSetup.import_nonce,
                },
                beforeSend: function () {
                    Swal.fire({
                        title: 'Please wait.....',
                        text: 'System is processing your request',
                        showCancelButton: false, // There won't be any cancel button
                        showConfirmButton: false, // There won't be any confirm button
                        imageUrl: yatraSetup.loading_image,
                        imageWidth: 300
                    });
                },
            }).done(function (response) {
                if (typeof response.success != "undefined" && response.success) {
                    Swal.fire(
                        'Congratulations!',
                        'Import process successfully completed.',
                        'success'
                    );
                    $this.hide();
                } else {
                    var error_message = 'Something went wrong with ajax !';
                    if (typeof response.data != "undefined") {
                        error_message = response.data;
                    }
                    Swal.fire('Oops...', error_message, 'error');

                }

            }).fail(function () {
                Swal.fire('Oops...', 'Something went wrong with ajax !', 'error');
            });
        },
        install_and_activate: function (button) {

            var _this = this;
            var theme_slug = button.attr('data-slug');
            if (theme_slug === '' || theme_slug === undefined || button.hasClass('disabled')) {
                return;
            }

            $.ajax({
                url: yatraSetup.ajax_url,
                type: 'POST',
                data: {
                    action: yatraSetup.theme_install_action,
                    yatra_nonce: yatraSetup.theme_install_nonce,
                    theme: theme_slug
                },
                beforeSend: function () {
                    Swal.fire({
                        title: 'Please wait.....',
                        text: 'System is processing your request',
                        showCancelButton: false, // There won't be any cancel button
                        showConfirmButton: false, // There won't be any confirm button
                        imageUrl: yatraSetup.loading_image,
                        imageWidth: 300
                    });
                    button.addClass('disabled');
                },
            }).done(function (response) {
                _this.showThemeActionMessage(response, button);


            }).fail(function (response) {
                _this.showThemeActionMessage(response, button);
            });

        },
        showThemeActionMessage: function (response, button) {
            if (typeof response === "object") {

                if (typeof response.success != "undefined" && response.success) {
                    Swal.fire(
                        'Congratulations!',
                        'Task successfully completed.',
                        'success'
                    );
                    button.remove();

                    return;
                } else {

                    Swal.fire('Oops...', 'Something went wrong with ajax !', 'error');
                    button.removeClass('disabled');

                }
            } else if (typeof response == 'string') {
                let result = response.includes("yatra_theme_install_response"); // return boolean value

                if (!result) {

                    Swal.fire('Oops...', 'Something went wrong with ajax !', 'error');
                    button.removeClass('disabled');
                } else {
                    Swal.fire(
                        'Congratulations!',
                        'Task successfully completed.',
                        'success'
                    );
                    button.remove();
                }
            } else {
                Swal.fire('Oops...', 'Something went wrong with ajax !', 'error');
                button.removeClass('disabled');
            }
        }

    };
    $(document).ready(function () {

        yatraSetupImportDemoSampleData.init();
    });

});
