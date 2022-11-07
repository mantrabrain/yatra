(function ($) {

    var YatraSearch = function ($) {
        return {
            init: function () {
                this.bindEvents();

            },
            bindEvents: function () {

                var _that = this;
                $('body').on('click', '.yatra-search-module-item input[type="text"]', function () {
                    var module = $(this).closest('.yatra-search-module');
                    module.find('.yatra-search-module-item').removeClass('active');
                    $(this).closest('.yatra-search-module-item').addClass('active');

                });

                $('body').on('click', '.yatra-search-taxonomy li', function () {
                    var module = $(this).closest('.yatra-search-module-item');
                    var name = module.attr('data-name');
                    module.find('input[type="text"]').attr('name', name).val($(this).attr('data-slug'));
                    module.removeClass('active');
                });

            },


        };
    }(jQuery);


    $(document).ready(function () {

        YatraSearch.init();


    });
}(jQuery));