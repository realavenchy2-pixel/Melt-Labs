/* Melt Labs — product selector. Apple-style segmented tabs that
   crossfade a showcase panel per product (ARIA tablist pattern:
   click, Left/Right arrow, Home/End all work). Panels stay in the DOM
   at a shared aspect ratio so switching never jumps the layout. */
(function () {
  'use strict';

  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  document.querySelectorAll('[data-product-selector]').forEach(function (root) {
    var tabs = Array.prototype.slice.call(root.querySelectorAll('[data-selector-tab]'));
    var panels = Array.prototype.slice.call(root.querySelectorAll('[data-selector-panel]'));
    if (tabs.length < 2 || tabs.length !== panels.length) return;

    function activate(index, focusTab) {
      tabs.forEach(function (tab, i) {
        var active = i === index;
        tab.classList.toggle('is-active', active);
        tab.setAttribute('aria-selected', active ? 'true' : 'false');
        tab.tabIndex = active ? 0 : -1;
        if (active && focusTab) tab.focus();
      });
      panels.forEach(function (panel, i) {
        if (i === index) {
          panel.hidden = false;
          if (!reduceMotion) {
            panel.animate(
              [{ opacity: 0, transform: 'translateY(10px)' }, { opacity: 1, transform: 'translateY(0)' }],
              { duration: 380, easing: 'cubic-bezier(0.23, 1, 0.32, 1)' }
            );
          }
        } else {
          panel.hidden = true;
        }
      });
    }

    tabs.forEach(function (tab, i) {
      tab.addEventListener('click', function () { activate(i, false); });
    });

    var tablist = root.querySelector('[data-selector-tabs]');
    if (tablist) {
      tablist.addEventListener('keydown', function (e) {
        var current = tabs.findIndex(function (t) { return t.classList.contains('is-active'); });
        var target = null;
        if (e.key === 'ArrowRight') target = (current + 1) % tabs.length;
        else if (e.key === 'ArrowLeft') target = (current - 1 + tabs.length) % tabs.length;
        else if (e.key === 'Home') target = 0;
        else if (e.key === 'End') target = tabs.length - 1;
        if (target !== null) {
          e.preventDefault();
          activate(target, true);
        }
      });
    }
  });
})();
