(function () {
  try {
    var t = localStorage.getItem('messtix-theme');
    if (t === 'dark') {
      document.documentElement.setAttribute('data-theme', 'dark');
    }
  } catch {}
})();
