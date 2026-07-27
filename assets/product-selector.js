/* Melt Labs — product selector. A segmented-control tab tray (Apple's
   Settings-app switcher: one pill slides behind whichever tab is active)
   above a swipeable stage. Clicking a tab, using arrow keys, or swiping
   the stage directly all move together - the tab that's showing is
   always the tab that's highlighted.

   Progressive enhancement: server-rendered markup hides every panel but
   the first via [hidden], so a no-JS visitor gets a plain click-free
   single panel and a row of buttons that just don't do anything except
   look like a segmented control. This script un-hides every panel and
   turns the stage into a one-panel-per-swipe scroller. */
(function () {
  'use strict';

  var motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
  var reduceMotion = motionQuery.matches;
  if (motionQuery.addEventListener) {
    motionQuery.addEventListener('change', function (e) { reduceMotion = e.matches; });
  }

  document.querySelectorAll('[data-product-selector]').forEach(function (root) {
    var tabs = Array.prototype.slice.call(root.querySelectorAll('[data-selector-tab]'));
    var panels = Array.prototype.slice.call(root.querySelectorAll('[data-selector-panel]'));
    var tabsWrap = root.querySelector('[data-selector-tabs]');
    var indicator = root.querySelector('[data-selector-indicator]');
    var stage = root.querySelector('[data-selector-stage]');
    if (tabs.length < 2 || tabs.length !== panels.length || !stage) return;

    tabsWrap.classList.add('product-selector__tabs--enhanced');
    stage.classList.add('product-selector__stage--enhanced');
    panels.forEach(function (panel) { panel.hidden = false; });

    var activeIndex = 0;
    var settleTimer = null;
    var suppressScrollSync = false;

    function placeIndicator(instant) {
      if (!indicator) return;
      var tab = tabs[activeIndex];
      var trayRect = tabsWrap.getBoundingClientRect();
      var tabRect = tab.getBoundingClientRect();
      var x = tabRect.left - trayRect.left;
      if (instant) tabsWrap.classList.remove('is-indicator-ready');
      indicator.style.transform = 'translateX(' + x + 'px)';
      indicator.style.width = tabRect.width + 'px';
      if (instant) {
        /* Force layout so the width/transform above apply before we
           re-enable the transition, otherwise the browser can batch them
           together and the very first placement slides in from zero. */
        void indicator.offsetWidth;
        tabsWrap.classList.add('is-indicator-ready');
      }
    }

    function setActive(index, opts) {
      opts = opts || {};
      activeIndex = index;

      tabs.forEach(function (tab, i) {
        var active = i === index;
        tab.classList.toggle('is-active', active);
        tab.setAttribute('aria-selected', active ? 'true' : 'false');
        tab.tabIndex = active ? 0 : -1;
        if (active && opts.focusTab) tab.focus();
      });
      panels.forEach(function (panel, i) {
        panel.setAttribute('aria-hidden', i === index ? 'false' : 'true');
      });
      placeIndicator(opts.instant);

      if (!opts.fromScroll) {
        suppressScrollSync = true;
        stage.classList.add('is-settling');
        clearTimeout(settleTimer);
        settleTimer = setTimeout(function () {
          stage.classList.remove('is-settling');
          suppressScrollSync = false;
        }, 420);
        stage.scrollTo({
          left: panels[index].offsetLeft - stage.offsetLeft,
          behavior: reduceMotion ? 'auto' : 'smooth'
        });
      }
    }

    tabs.forEach(function (tab, i) {
      tab.addEventListener('click', function () { setActive(i, {}); });
    });

    var tablist = root.querySelector('[data-selector-tabs]');
    tablist.addEventListener('keydown', function (e) {
      var target = null;
      if (e.key === 'ArrowRight') target = (activeIndex + 1) % tabs.length;
      else if (e.key === 'ArrowLeft') target = (activeIndex - 1 + tabs.length) % tabs.length;
      else if (e.key === 'Home') target = 0;
      else if (e.key === 'End') target = tabs.length - 1;
      if (target !== null) {
        e.preventDefault();
        setActive(target, { focusTab: true });
      }
    });

    /* Swipe support: which panel is "active" is decided from scroll
       geometry, same technique as the shared carousel - immune to the
       feedback loop that opacity/transform-driven intersection ratios
       would create. --panel-p is published every frame so the dim
       tracks the finger continuously through a swipe. */
    function nearestIndex() {
      var pos = stage.scrollLeft + stage.clientWidth / 2;
      var bestIndex = 0, bestDist = Infinity;
      panels.forEach(function (panel, i) {
        var center = panel.offsetLeft - stage.offsetLeft + panel.offsetWidth / 2;
        var dist = Math.abs(center - pos);
        if (dist < bestDist) { bestDist = dist; bestIndex = i; }
      });
      return bestIndex;
    }
    function updatePanelProps() {
      if (reduceMotion) return;
      var viewCenter = stage.scrollLeft + stage.clientWidth / 2;
      panels.forEach(function (panel) {
        var w = panel.offsetWidth || 1;
        var center = panel.offsetLeft - stage.offsetLeft + w / 2;
        var p = 1 - Math.min(1, Math.abs(center - viewCenter) / w);
        panel.style.setProperty('--panel-p', p.toFixed(3));
      });
    }

    var rafId = null;
    stage.addEventListener('scroll', function () {
      if (rafId) return;
      rafId = window.requestAnimationFrame(function () {
        rafId = null;
        updatePanelProps();
        if (suppressScrollSync) return;
        var i = nearestIndex();
        if (i !== activeIndex) setActive(i, { fromScroll: true });
      });
    }, { passive: true });

    window.addEventListener('resize', function () { placeIndicator(true); updatePanelProps(); });

    setActive(0, { instant: true });
    updatePanelProps();
  });
})();
