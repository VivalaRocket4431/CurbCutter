// Keeps CurbCutter readable when a phone browser shows its "desktop site" view.
// That view lays every page out about 980 pixels wide and shrinks it onto the phone screen, so all
// the words come out tiny. People shouldn't have to find a browser setting to fix that, so CurbCutter
// notices it and zooms itself back to phone size. Computers and phones in their normal view are untouched.
// Loaded as a plain script in <head>, before the first paint, so the page never flashes tiny.
(function () {
  var root = document.documentElement;
  var applied = 0;

  function deviceWidth() {
    var landscape = window.matchMedia && window.matchMedia('(orientation: landscape)').matches;
    var a = screen.width || 0;
    var b = screen.height || 0;
    return landscape ? Math.max(a, b) : Math.min(a, b);
  }

  function fit() {
    try {
      var touch = (window.matchMedia && window.matchMedia('(pointer: coarse)').matches) || navigator.maxTouchPoints > 0;
      var device = deviceWidth();
      var layout = window.innerWidth;
      var ratio = device > 0 ? layout / device : 1;
      // A phone or small tablet whose page is laid out much wider than its screen.
      if (touch && device > 0 && device < 760 && ratio > 1.3) {
        if (Math.abs(ratio - applied) < 0.01) return;
        applied = ratio;
        root.style.zoom = ratio.toFixed(3);
        root.style.setProperty('--fit-zoom', ratio.toFixed(3));
        root.classList.add('phone-fit');
        root.classList.toggle('fit-w480', device <= 480);
        root.classList.toggle('fit-w352', device < 352);
      } else if (applied) {
        applied = 0;
        root.style.zoom = '';
        root.style.removeProperty('--fit-zoom');
        root.classList.remove('phone-fit', 'fit-w480', 'fit-w352');
      }
    } catch (e) {
      /* never stop the app from loading */
    }
  }

  fit();
  window.addEventListener('resize', fit);
  window.addEventListener('orientationchange', fit);
}());
