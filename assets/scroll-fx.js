/* Melt Labs — scroll effects. Three jobs, no libraries:
   1. Reveal-on-scroll via IntersectionObserver.
   2. Product subnav that slides in after the hero scrolls away.
   3. Science section scroll-scrubbed frame sequence (sticky stage).
   All three collapse to static under prefers-reduced-motion. */
(function () {
  'use strict';

  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* 1. Reveal on scroll */
  var revealEls = document.querySelectorAll('[data-reveal]');
  if (reduceMotion) {
    revealEls.forEach(function (el) { el.classList.add('is-revealed'); });
  } else if (revealEls.length) {
    var revealObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-revealed');
          revealObserver.unobserve(entry.target);
        }
      });
    }, { rootMargin: '0px 0px -10% 0px' });
    revealEls.forEach(function (el) { revealObserver.observe(el); });
  }

  /* 2. Scroll-aware product subnav */
  var subnav = document.querySelector('[data-subnav]');
  var sentinel = document.querySelector('[data-subnav-sentinel]');
  if (subnav && sentinel) {
    new IntersectionObserver(function (entries) {
      subnav.classList.toggle('is-stuck', !entries[0].isIntersecting);
    }).observe(sentinel);
  }

  /* 3. Science scrub: progress through the scroller drives which frame shows */
  document.querySelectorAll('[data-scrub]').forEach(function (scroller) {
    var frames = scroller.querySelectorAll('.science__frame');
    if (!frames.length) return;

    /* Sections render static-first (no-JS fallback); scrub opts back in */
    if (reduceMotion || frames.length === 1) {
      scroller.classList.add('is-static');
      return;
    }
    scroller.classList.remove('is-static');

    var active = -1;
    var ticking = false;
    var inView = false;

    function update() {
      ticking = false;
      var rect = scroller.getBoundingClientRect();
      var total = rect.height - window.innerHeight;
      if (total <= 0) return;
      var progress = Math.min(1, Math.max(0, -rect.top / total));
      var index = Math.min(frames.length - 1, Math.floor(progress * frames.length));
      if (index !== active) {
        active = index;
        frames.forEach(function (frame, i) {
          frame.classList.toggle('is-active', i === index);
        });
      }
    }

    function onScroll() {
      if (!inView || ticking) return;
      ticking = true;
      requestAnimationFrame(update);
    }

    new IntersectionObserver(function (entries) {
      inView = entries[0].isIntersecting;
      if (inView) update();
    }).observe(scroller);

    window.addEventListener('scroll', onScroll, { passive: true });
    update();
  });
})();
