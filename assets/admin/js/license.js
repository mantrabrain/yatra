var YatraLicense = function ($) {
    return {
        init: function () {
            this.bindEvents();
        },
        bindEvents: function () {

            var _that = this;
            $('body').on('click', '.yatra-license-manager-table .modify-license', function () {
                var slug = $(this).closest('tr').attr('data-addon-slug');
                var license_html = '<input type="text" name="' + slug + '_license" placeholder="Please enter your license key here"/>';
                $(this).closest('td').find('.display-text').remove();
                $(this).closest('td').find('.license-column-inner').prepend(license_html);
                $(this).text('Update & Activate').addClass('update-license').removeClass('modify-license');

            });


            $('body').on('click', '.yatra-license-manager-table .update-license', function () {
                if ($(this).hasClass('updating-message')) {
                    return;
                }
                var slug = $(this).closest('tr').attr('data-addon-slug');
                var license_text = $(this).closest('td').find('input').val();

                if (slug === '' || license_text === '') {
                    alert('Empty license key');
                    return;
                }

                var data = {
                    nonce: yatraLicenseScript.update_license_nonce,
                    action: yatraLicenseScript.update_license_action,
                };
                data[slug + '_license'] = license_text;

                _that.ajaxCall(data, $(this));


            });


            $('body').on('click', '.yatra-license-manager-table .deactivate-license', function () {
                if ($(this).hasClass('updating-message')) {
                    return;
                }
                var slug = $(this).closest('tr').attr('data-addon-slug');

                if (slug === '') {

                    alert('Empty slug key');
                    return;
                }

                var data = {
                    nonce: yatraLicenseScript.deactivate_license_nonce,
                    action: yatraLicenseScript.deactivate_license_action,
                    slug: slug
                };

                _that.ajaxCall(data, $(this));


            });
        },
        ajaxCall: function (data, node) {


            $.ajax({
                type: "POST",
                url: yatraLicenseScript.ajax_url,
                data: data,
                beforeSend: function () {

                    node.addClass('updating-message');
                    node.closest('td').attr('disabled', 'disabled');

                },
                success: function (response) {

                },
                complete: function () {
                    alert('Task completed, please check message section for more details')
                    location.reload();
                    return false;
                }
            });
        }


    };
}(jQuery);
(function ($) {

    $(document).ready(function () {
        YatraLicense.init();

    });
}(jQuery));