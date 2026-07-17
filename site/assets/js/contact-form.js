(function () {
  var form = document.getElementById('contact-form');
  if (!form) return;

  var submitBtn = document.getElementById('submit-btn');
  var msgEl = document.getElementById('form-msg');
  var successPanel = document.getElementById('success-panel');

  function showError(text) {
    msgEl.textContent = text;
    msgEl.classList.remove('success');
    msgEl.classList.add('error', 'show');
  }

  function clearMsg() {
    msgEl.textContent = '';
    msgEl.classList.remove('error', 'success', 'show');
  }

  function setLoading(isLoading) {
    submitBtn.disabled = isLoading;
    submitBtn.textContent = isLoading ? 'Sending…' : 'Send message';
  }

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    clearMsg();

    if (!form.checkValidity()) {
      form.reportValidity();
      return;
    }

    var payload = {
      name: form.name.value.trim(),
      email: form.email.value.trim(),
      phone: form.phone.value.trim(),
      subject: form.subject.value,
      message: form.message.value.trim(),
      website: form.website.value
    };

    setLoading(true);

    fetch('/api/contact', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    })
      .then(function (res) {
        return res.json().then(function (data) {
          return { ok: res.ok, data: data };
        });
      })
      .then(function (result) {
        setLoading(false);
        if (result.data && result.data.ok) {
          form.style.display = 'none';
          successPanel.style.display = 'block';
        } else {
          showError((result.data && result.data.error) || "Couldn't send, try again or email us directly.");
        }
      })
      .catch(function () {
        setLoading(false);
        showError("Couldn't send, try again or email us directly.");
      });
  });
})();
