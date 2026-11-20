// Formulario de contacto nativo: envía a mail.php en el VPS.
$(function () {
	$('form#contact-form').each(function () {
		var form = $(this);
		var msg = form.find('.form-messege');
		var btn = form.find('button[type="submit"]');
		var label = btn.text();
		var loadedAt = Date.now();
		var t = {
			sending: form.data('sending') || 'ENVIANDO...',
			ok: form.data('success') || '¡Gracias! Tu mensaje ha sido enviado. Te responderemos pronto.',
			invalid: form.data('invalid') || 'Revisa tu nombre y tu correo e intenta de nuevo.',
			error: form.data('error') || 'No pudimos enviar tu mensaje. Inténtalo de nuevo o escríbenos a administrativo@endemicasocial.com.'
		};

		form.on('submit', function (e) {
			e.preventDefault();
			var payload = {
				name: form.find('[name="name"]').val(),
				email: form.find('[name="email"]').val(),
				whatsapp: form.find('[name="whatsapp"]').val(),
				organization: form.find('[name="organization"]').val(),
				message: form.find('[name="message"]').val(),
				hp: form.find('[name="hp"]').val(),
				lang: document.documentElement.lang === 'en' ? 'en' : 'es',
				t: Date.now() - loadedAt
			};
			btn.prop('disabled', true).text(t.sending);
			msg.removeClass('success error').text('');

			fetch('/mail.php', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(payload)
			})
				.then(function (r) { return r.json().catch(function () { return {}; }).then(function (j) { return { status: r.status, body: j }; }); })
				.then(function (res) {
					if (res.body && res.body.ok) {
						msg.addClass('success').text(t.ok);
						form.find('input:not([type="hidden"]), textarea').val('');
					} else if (res.status === 400) {
						msg.addClass('error').text(t.invalid);
					} else {
						msg.addClass('error').text(t.error);
					}
				})
				.catch(function () { msg.addClass('error').text(t.error); })
				.then(function () { btn.prop('disabled', false).text(label); });
		});
	});
});
