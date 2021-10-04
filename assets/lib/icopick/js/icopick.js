(function ($) {

	var $document = $(document);

	var icoPick = {

		init: function () {

			this.icons = yatra_admin_params.font_awesome_icons;

			this.initPicker();

			this.initSearch();

			this.initIconType();

			this.initClosePickerPanel();

			this.clearIcon();

		},
		clearIcon: function () {
			$document.on('click', '.icopick-control-field .icon-clear', function () {
				var wrap = $(this).closest('.icopick-control-field');
				wrap.find('.customize-control-icon-picker-value').val('').trigger('change');
				wrap.find('.icon-show').attr('class', 'icon-show');

			});
		},
		closePicker: function () {
			$('#icopick').find('.picker-header .customize-controls-icon-close').trigger('click');
			$('.icopick-control-field .customize-control-icon-picker-value').removeClass('open-input-field');
		},
		openPicker: function (input) {
			$('#icopick').addClass('picker-active');
			$('.icopick-control-field .customize-control-icon-picker-value').removeClass('open-input-field');
			input.addClass('open-input-field');
			$('#agency-ecommerce-icon-browser ul.agency-ecommerce-icon-list-ul li').removeClass('active');
			var input_val = input.val();
			if (input_val != '') {
				$('#agency-ecommerce-icon-browser ul.agency-ecommerce-icon-list-ul li[data-icon="' + input_val + '"]').addClass('active');
			}
		},
		initClosePickerPanel: function () {
			$document.on('click', '.picker-header .customize-controls-icon-close', function () {
				$('#icopick').removeClass('picker-active');

			});
		},
		pickIcon: function ($this) {
			var _that = this;
			var icon = $this.attr('data-icon');
			var input = $('.icopick-control-field .customize-control-icon-picker-value.open-input-field');
			input.val(icon).trigger('change');
			input.closest('.icopick-control-field').find('.icon-show').attr('class', 'icon-show ' + icon);
			_that.closePicker();

		},
		initIconType: function () {
			$document.on("change", "#agency-ecommerce-icon-type", function () {
				var wrap = $(this).closest('.icopick-control-field');
				var type = $(this).val();
				if (!type || type == "all") {
					wrap.find("#agency-ecommerce-icon-browser ul.agency-ecommerce-icon-list-ul").show();
				} else {
					wrap.find("#agency-ecommerce-icon-browser ul.agency-ecommerce-icon-list-ul").hide();
					wrap.find(
						'#agency-ecommerce-icon-browser ul.agency-ecommerce-icon-list-ul[data-icon-type="' + type + '"]'
					).show();
				}
			});
		},
		initSearch: function () {
			$document.on("keyup", "#agency-ecommerce-icon-search-input", function (e) {
				var v = $(this).val();
				v = v.trim();
				var wrap = $(this).closest('#icopick');
				if (v) {

					wrap.find('#agency-ecommerce-icon-browser li').hide();

					wrap.find(
						"#agency-ecommerce-icon-browser li[data-icon*='" + v + "']"
					).show();
				} else {
					wrap.find('#agency-ecommerce-icon-browser li').show();
				}
			});
		},
		initPicker: function () {
			var _that = this;
			_that.renderTemplate();
			var picker_wrap = $('#icopick');
			_that.lodIcons(picker_wrap);
			$document.on('click', ".customize-control-icon-picker-value, .icopick-control-field .icon-show", function () {
				var input = $(this).closest('.icopick-control-field').find('input.customize-control-icon-picker-value');
				var width_customizer = $(this).closest('#customize-controls');


				if (picker_wrap.hasClass('picker-active')) {
					_that.closePicker();
					picker_wrap
						.css({
							'left': width_customizer.width() + 'px'
						});
				} else {
					_that.openPicker(input);
					picker_wrap.css({
						'left': width_customizer.width() + 'px'
					});
				}


			});
			$(document).on('click', 'body *', function (e) {

				if ($(e.target).closest('#icopick').length > 0) {
					return;
				}
				if ($(e.target).closest('.icopick-control-field').length > 0) {
					return;
				}
				_that.closePicker();
			});

			$(document).on('keyup', function (e) {
				if (e.which === 27) {
					_that.closePicker();
				}
			});

			$('body').on('click', '#icopick .agency-ecommerce-icon-list-ul li', function () {
				_that.pickIcon($(this));
			});

		},
		lodIcons: function (wrap) {
			var icon_wrap = wrap.find('#agency-ecommerce-icon-browser');
			var icon_select = $('#icopick').find('select#agency-ecommerce-icon-type');
			var icon = this.icons;
			if (icon_select.find('option').length < 2) {
				var icon_select_node = $('<select/>');
				var all_icon_list = $('<div/>');

				for (var icon_key in icon) {

					var icon_list_node = $('<ul class="agency-ecommerce-icon-list-ul" data-icon-type="' + icon_key + '"/>');
					var icon_prefix = '';
					switch (icon_key) {
						case "font_awesome":
							icon_prefix = 'fa ';
							break;
					}
					if (typeof icon_key != undefined) {

						var title = typeof icon[icon_key].title != undefined ? icon[icon_key].title : icon_key;
						var all_icons = typeof icon[icon_key].icons != undefined ? icon[icon_key].icons : {};
						icon_select_node.append('<option value="' + icon_key + '">' + title + '</option>');


						for (var all_icon_key in all_icons) {
							if (all_icon_key.replace(icon_prefix) != all_icon_key) {
								icon_prefix = '';

							}
							icon_list_node.append('<li title="' + all_icon_key + '" data-type="' + icon_key + '" data-icon="' + icon_prefix + all_icon_key + '" style="display: list-item;"><span class="icon-wrapper"><i class="' + icon_prefix + ' ' + all_icon_key + '"></i></span></li>');
						}
					}
					all_icon_list.append(icon_list_node);


				}

				icon_select.append(icon_select_node.html());
				icon_wrap.append(all_icon_list.html());
			}

		},
		renderTemplate: function () {

			if ($('body').find('#icopick').length > 0) {
				return;
			}

			var template = '<div id="icopick" class="icopick-picker-container">\n' +
				'<div class="picker-header">\n' +
				'<a class="customize-controls-icon-close" href="#">\n' +
				'<span class="screen-reader-text">Cancel</span>\n' +
				'</a>\n' +
				'<div class="icon-type-selector">\n' +
				'<select id="agency-ecommerce-icon-type">\n' +
				'<option value="all">All Icon Types</option>\n' +
				'</select>\n' +
				'</div>\n' +
				'</div>\n' +
				'<div class="agency-ecommerce-icon-search">\n' +
				'<input type="text" id="agency-ecommerce-icon-search-input"\n' +
				'placeholder="Type icon name here">\n' +
				'</div>\n' +
				'<div id="agency-ecommerce-icon-browser">\n' +
				'\n' +
				'</div>\n' +
				'</div>';
			$('body').append(template);

		},


	};

	$(document).ready(function () {
		icoPick.init();
	});


}(jQuery));
