(function ($) {

    var YatraSearch = function ($) {
        return {
            init: function () {
                this.bindEvents();

            },
            bindEvents: function () {

                var _that = this;
                $('body').on('click', '.yatra-search-module-item .input-placeholder', function () {
                    var module = $(this).closest('.yatra-search-module');
                    module.find('.yatra-search-module-item').removeClass('active');
                    $(this).closest('.yatra-search-module-item').addClass('active');

                });

                $('body').on('click', '.yatra-search-taxonomy li', function () {
                    var module = $(this).closest('.yatra-search-module-item');
                    var name = module.attr('data-name');
                    module.find('input[type="hidden"].input-field').attr('name', name).val($(this).attr('data-slug'));
                    module.find('.input-placeholder').text($(this).find('label').text()).addClass('active');
                    module.removeClass('active');
                    module.next('.yatra-search-module-item').find('.input-placeholder').trigger('click');
                });

            },


        };
    }(jQuery);


    $(document).ready(function () {

        YatraSearch.init();


    });
}(jQuery));