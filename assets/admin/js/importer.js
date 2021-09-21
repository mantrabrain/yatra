// @var

jQuery(function ($) {
	var yatraImporter = {
		init: function () {

			var form = $('form.yatra-import-course-form');

			var _this = this;
			form.on('submit', function (e) {
				e.preventDefault();
				var formData = new FormData(this);
				_this.import_course(formData, $(this));

			});

		},
		import_course: function (formData, form) {

			$.ajax({
				url: yatraImporterData.ajax_url,
				type: 'POST',
				data: formData,
				contentType: false,
				cache: false,
				processData: false,
				beforeSend: function () {
					form.trigger("reset");
					Swal.fire({
						title: 'Please wait.....',
						text: 'System is processing your request',
						showCancelButton: false, // There won't be any cancel button
						showConfirmButton: false, // There won't be any confirm button
						imageUrl: yatraImporterData.loading_image,
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
		}

	};
	$(document).ready(function () {

		yatraImporter.init();
	});

});
