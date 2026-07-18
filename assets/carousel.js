/* Melt Labs — shared carousel. CSS scroll-snap does the work; JS tracks
   which slide is centered and toggles .is-active on it. Inactive slides
   sit slightly smaller and dimmer and the active one stretches to full
   size via a CSS transition, so moving between slides is a smooth,
   immersive scale rather than a flash. One component for every carousel
   on the site (testimonials, ingredients, benefit angles, about cards,
   experts).

   Autoplay (opt-in via data-carousel-autoplay): advances on a timer
   while the carousel is scrolled into view, pauses when the tab is
   hidden or the shopper interacts (arrow/dot/swipe/toggle), and never
   runs under prefers-reduced-motion. The play/pause button lets
   shoppers stop it entirely. */
(function () {
  'use strict';

  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function initCarousel(root) {
    var track = root.querySelector('[data-carousel-track]');
    var slides = Array.prototype.slice.call(track.children);
    if (slides.length < 2) return;

    var prev = root.querySelector('[data-carousel-prev]');
    var next = root.querySelector('[data-carousel-next]');
    var toggle = root.querySelector('[data-carousel-toggle]');
    var dotsWrap = root.querySelector('[data-carousel-dots]');
    var dots = [];
    var activeIndex = -1;
    /* Separate from activeIndex (which follows scroll position and only
       settles once the smooth-scroll finishes). Autoplay needs a stable
       "where did we last tell it to go" pointer so tick() always advances
       from the actual target, not an in-flight scroll reading. */
    var targetIndex = 0;

    root.classList.add('carousel--enhanced');

    if (dotsWrap) {
      slides.forEach(function (_, i) {
        var dot = document.createElement('button');
        dot.type = 'button';
        dot.className = 'carousel__dot';
        dot.setAttribute('aria-label', 'Go to slide ' + (i + 1));
        dot.addEventListener('click', function () { userInteracted(); scrollToSlide(i); });
        dotsWrap.appendChild(dot);
        dots.push(dot);
      });
    }

    function scrollToSlide(i) {
      i = Math.max(0, Math.min(slides.length - 1, i));
      targetIndex = i;
      track.scrollTo({ left: slides[i].offsetLeft - track.offsetLeft, behavior: 'smooth' });
    }

    function setActive(i) {
      if (i === activeIndex) return;
      activeIndex = i;
      slides.forEach(function (slide, s) { slide.classList.toggle('is-active', s === i); });
      dots.forEach(function (dot, d) { dot.classList.toggle('is-active', d === i); });
      if (prev) prev.disabled = i === 0;
      if (next) next.disabled = i === slides.length - 1;
    }

    if (prev) prev.addEventListener('click', function () { userInteracted(); scrollToSlide(targetIndex - 1); });
    if (next) next.addEventListener('click', function () { userInteracted(); scrollToSlide(targetIndex + 1); });

    /* Which slide is "active" is decided from scroll geometry (offsetLeft
       vs scrollLeft), not IntersectionObserver ratios: the active slide
       gets a CSS transform: scale() transition, and since intersection
       ratio reacts to an element's rendered (transformed) box, letting
       ratios drive activation created a feedback loop — activating a
       slide shrunk/grew it, which changed its ratio, which reactivated a
       different slide mid-transition. Layout geometry isn't affected by
       transforms, so it can't feed back on itself. */
    var rafId = null;
    function nearestIndex() {
      var pos = track.scrollLeft + track.clientWidth / 2;
      var bestIndex = 0;
      var bestDist = Infinity;
      slides.forEach(function (slide, i) {
        var center = slide.offsetLeft - track.offsetLeft + slide.offsetWidth / 2;
        var dist = Math.abs(center - pos);
        if (dist < bestDist) { bestDist = dist; bestIndex = i; }
      });
      return bestIndex;
    }
    function onScroll() {
      if (rafId) return;
      rafId = window.requestAnimationFrame(function () {
        rafId = null;
        setActive(nearestIndex());
      });
    }
    track.addEventListener('scroll', onScroll, { passive: true });

    setActive(0);

    /* ---- Autoplay ---- */
    var autoplayEnabled = root.hasAttribute('data-carousel-autoplay') && !reduceMotion;
    if (!autoplayEnabled) {
      if (toggle) toggle.hidden = true;
      return;
    }

    var interval = parseInt(root.getAttribute('data-carousel-interval'), 10) || 4500;
    var timer = null;
    var playing = true;
    var inView = false;

    function setToggleUI() {
      if (!toggle) return;
      toggle.setAttribute('data-playing', playing ? 'true' : 'false');
      toggle.setAttribute('aria-pressed', playing ? 'false' : 'true');
      toggle.setAttribute('aria-label', playing ? 'Pause autoplay' : 'Play autoplay');
    }

    function tick() {
      var nextIndex = targetIndex + 1;
      if (nextIndex >= slides.length) nextIndex = 0;
      scrollToSlide(nextIndex);
    }

    function start() {
      stop();
      if (playing && inView) timer = window.setInterval(tick, interval);
    }

    function stop() {
      if (timer) {
        window.clearInterval(timer);
        timer = null;
      }
    }

    function userInteracted() {
      if (!autoplayEnabled || !playing) return;
      /* A manual nudge pauses the timer briefly rather than fighting the
         shopper's own scroll/swipe; it resumes on the next tick cycle. */
      stop();
      start();
    }

    if (toggle) {
      toggle.addEventListener('click', function () {
        playing = !playing;
        setToggleUI();
        if (playing) start(); else stop();
      });
    }

    track.addEventListener('pointerdown', function () { stop(); });
    track.addEventListener('pointerup', function () { if (playing) start(); });

    document.addEventListener('visibilitychange', function () {
      if (document.hidden) stop();
      else if (playing) start();
    });

    new IntersectionObserver(function (entries) {
      inView = entries[0].isIntersecting;
      if (inView && playing) start();
      else stop();
    }, { threshold: 0.4 }).observe(root);

    setToggleUI();
  }

  document.querySelectorAll('[data-carousel]').forEach(initCarousel);
})();
