$(function() {

	// Get all contact forms.
	var forms = $('form#contact-form');

	forms.each(function() {
		var form = $(this);
		var formMessages = form.find('.form-messege');
		var submitBtn = form.find('button[type="submit"]');
		var originalBtnText = submitBtn.text();

		form.submit(function(e) {
			// Stop the browser from submitting the form.
			e.preventDefault();

			// Show loading status
			submitBtn.prop('disabled', true).text('ENVIANDO...');

			// Serialize the form data.
			var formData = form.serialize();

			// Submit the form using AJAX.
			$.ajax({
				type: 'POST',
				url: form.attr('action'),
				data: formData,
				dataType: 'json'
			})
			.done(function(response) {
				formMessages.removeClass('error').addClass('success');

				if (response && response.message) {
					formMessages.text(response.message);
				} else {
					formMessages.text('¡Gracias! Tu mensaje ha sido enviado con éxito.');
				}

				// Clear visible inputs without clearing hidden keys
				form.find('input:not([type="hidden"]), textarea').val('');
			})
			.fail(function(data) {
				formMessages.removeClass('success').addClass('error');

				if (data.responseJSON && data.responseJSON.message) {
					formMessages.text(data.responseJSON.message);
				} else if (data.responseText && data.responseText !== '') {
					formMessages.text(data.responseText);
				} else {
					formMessages.text('Ocurrió un error al enviar el mensaje. Por favor intenta de nuevo.');
				}
			})
			.always(function() {
				submitBtn.prop('disabled', false).text(originalBtnText);
			});
		});
	});

});
