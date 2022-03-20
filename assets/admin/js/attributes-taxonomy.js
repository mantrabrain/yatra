// @var yatra_admin_params

(function ($) {
    var AttributeTaxonomy = {

        init: function () {

            this.cacheDom();
            this.bindEvents();
        },

        cacheDom: function () {

            this.$attribute_field_type = $('select[name="attribute_field_type"]');
            this.$taxonomy_form_field = $('<div class="form-field term-group"/>');
        },

        bindEvents: function () {

            var $this = this;
            $this.$attribute_field_type.on('change', function () {
                $this.onChangeAttributeType($(this));
            });

        },
        onChangeAttributeType: function ($attribute_node) {

            var spinner = $('<div class="spinner is-active" style="float:none;"></div>');

            var attribute_params = yatra_admin_params.attribute_params;

            if ($attribute_node.val() == '') {
                $attribute_node.closest('form').find('.yatra-taxonomy-group').remove();
                return;
            }

            var attribute_data = {
                action: attribute_params.attribute_action,
                yatra_nonce: attribute_params.attribute_nonce,
                attribute_type: $attribute_node.val(),
                is_edit: attribute_params.is_edit
            };
            $attribute_node.after(spinner);
            $.ajax({
                type: "POST",
                url: yatra_admin_params.ajax_url,
                data: attribute_data,
                beforeSend: function () {

                },
                success: function (response) {

                    if (response.success === true) {

                        $attribute_node.closest('form').find('.yatra-taxonomy-group').remove();

                        if (attribute_params.is_edit) {
                            $attribute_node.closest('tr').after(response.data);
                        } else {
                            $attribute_node.closest('.form-field').after(response.data);
                        }

                    }
                    $attribute_node.closest('.form-field').find('.spinner').remove()

                },
                complete: function () {
                    $attribute_node.closest('.form-field').find('.spinner').remove()
                }
            });
        }

    };

    $(document).ready(function () {

        AttributeTaxonomy.init();

    });
}(jQuery));
