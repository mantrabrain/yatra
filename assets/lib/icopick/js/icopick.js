(function ($) {

	var $document = $(document);

	var icoPick = {

		init: function () {

			this.icons = yatra_admin_params.font_awesome_icons;

			this.initPicker();

			this.bindEvents();

			this.active_el = null;
		},
		initPicker: function () {
			var _that = this;
			_that.renderTemplate();
			var picker_wrap = $('#icopick');
			_that.lodIcons(picker_wrap);


		},

		bindEvents: function () {
			var _that = this;
			$('body').on('click', '.icopick', function () {
				var default_icon = $(this).val();
				if (!_that.isPickerActive()) {
					_that.showPicker(default_icon);
					_that.active_el = $(this);
				} else {
					_that.hidePicker();
				}

			});

			$('body').on("keyup", "#icopick-search-input", function (e) {
				var v = $(this).val();
				v = v.trim();
				var wrap = $(this).closest('#icopick');
				if (v) {

					wrap.find('#icopick-browser li').hide();

					wrap.find(
						"#icopick-browser li[data-icon*='" + v + "']"
					).show();
				} else {
					wrap.find('#icopick-browser li').show();
				}
			});
			$(document).on('keyup', function (e) {
				if (e.which === 27) {
					_that.hidePicker();
				}
			});

			$('body').on('click', '#icopick .icopick-list-ul li', function () {

				_that.pickIcon($(this));
			});

			$('body').on('click', '#icopick .picker-header .icon-close', function () {
				_that.hidePicker();
			});
		},
		showPicker: function (default_icon = null) {
			$('#icopick').show();
			$('#icopick').find('ul.icopick-list-ul').find('li').removeClass('active');
			if (null != default_icon) {

				$('#icopick').find('ul.icopick-list-ul').find('li[data-icon="' + default_icon + '"]').addClass('active');

			}
		},
		hidePicker: function () {
			$('#icopick').hide();
		},
		isPickerActive: function () {
			if ($('#icopick').is(":hidden")) {
				return false;
			}
			return true;

		},
		pickIcon: function ($this) {
			var _that = this;
			var icon = $this.attr('data-icon');
			if (null === _that.active_el) {
				return;
			}
			_that.active_el.val(icon).trigger('change').focus();
			_that.hidePicker();

		},


		lodIcons: function (wrap) {
			var icon_wrap = wrap.find('#icopick-browser');
			var icon_select = $('#icopick').find('select#icopick-type');
			var icon = this.icons;
			if (icon_select.find('option').length < 2) {
				var icon_select_node = $('<select/>');
				var all_icon_list = $('<div/>');

				for (var icon_key in icon) {


					var icon_list_node = $('<ul class="icopick-list-ul" data-icon-type="' + icon_key + '"/>');
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
							var icon_content_key_text = all_icons[all_icon_key];
							icon_list_node.append('<li title="' + icon_content_key_text + '" data-type="' + icon_key + '" data-icon="' + icon_content_key_text + '" style="display: list-item;"><span class="icon-wrapper"><i class="' + icon_content_key_text + '"></i></span></li>');
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
				'<div class="icopick-inner">\n' +
				'<div class="picker-header">\n' +
				'<a class="icon-close" href="#">\n' +
				'<span class="screen-reader-text">Cancel</span>\n' +
				'</a>\n' +
				'<div class="icon-type-selector">\n' +
				'<select id="icopick-type">\n' +
				'<option value="all">All Icon Types</option>\n' +
				'</select>\n' +
				'</div>\n' +
				'</div>\n' +
				'<div class="icopick-search">\n' +
				'<input type="text" id="icopick-search-input"\n' +
				'placeholder="Type icon name here">\n' +
				'</div>\n' +
				'<div id="icopick-browser">\n' +
				'\n' +
				'</div>\n' +
				'</div>\n' +
				'</div>';
			$('body').append(template);

		},


	};

	$(document).ready(function () {
		icoPick.init();
	});


}(jQuery));
