// Keeps CurbCutter readable when a phone browser shows its "desktop site" view.
// That view lays every page out about 980 pixels wide and shrinks it onto the phone screen, so all
// the words come out tiny. People shouldn't have to find a browser setting to fix that, so CurbCutter
// notices it and zooms itself back to phone size. Computers and phones in their normal view are untouched.
// Loaded as a plain script in <head>, before the first paint, so the page never flashes tiny.
//
// The zoom is worked out once for each way the phone is held, and only changes when the phone turns.
// In the desktop-site view the browser can widen the page or zoom in on its own (a double tap, a
// pinch, the keyboard opening). Re-measuring then fed the zoom back into itself until buttons filled
// the whole screen, so those changes are ignored.
(function () {
  var root = document.documentElement;
  var applied = 0;
  var measuredFor = 0;

  function deviceWidth() {
    // Which way the phone is held, from the phone itself rather than the page, which can change shape
    // when the keyboard opens.
    var a = screen.width || 0;
    var b = screen.height || 0;
    var landscape = typeof window.orientation === 'number' ? Math.abs(window.orientation) === 90 : a > b;
    return landscape ? Math.max(a, b) : Math.min(a, b);
  }

  function fit() {
    try {
      var touch = (window.matchMedia && window.matchMedia('(pointer: coarse)').matches) || navigator.maxTouchPoints > 0;
      var device = deviceWidth();
      if (device === measuredFor) return;
      measuredFor = device;
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
  // Some browsers report the new page width a moment after the phone turns, so measure again then.
  window.addEventListener('orientationchange', function () {
    setTimeout(function () { measuredFor = 0; fit(); }, 300);
  });
}());
