(function () {
  document.addEventListener('click', function (e) {
    var btn = e.target.closest('.cta-btn');
    if (!btn) return;

    var payload = JSON.stringify({
      button: btn.textContent.trim().replace(/\s+/g, ' '),
      page: location.pathname
    });

    if (navigator.sendBeacon) {
      navigator.sendBeacon('/api/track', new Blob([payload], { type: 'application/json' }));
    } else {
      fetch('/api/track', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: payload,
        keepalive: true
      }).catch(function () {});
    }
  });
})();
