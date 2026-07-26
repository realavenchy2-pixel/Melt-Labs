/* Melt Labs — shared carousel. CSS scroll-snap does the scrolling; JS
   reads scroll position every frame and publishes two normalized values
   per slide as custom properties:

     --slide-p  1 when the slide is centered, 0 when it is a full slide
                width away. Drives the scale/dim of the card.
     --slide-x  signed -1..1 offset from centre. Drives the horizontal
                parallax of the media INSIDE the card, so the photo
                drifts against the card like a window rather than moving
                with it (the Apple "Get the highlights" treatment).

   Both are written straight from scroll geometry, so the card tracks the
   finger 1:1 through a swipe. Nothing here waits for a transition to
   finish, so a swipe can be grabbed, reversed, or handed to an arrow tap
   at any moment.

   Autoplay (opt-in via data-carousel-autoplay): advances on a timer
   while the carousel is scrolled into view, pauses when the tab is
   hidden or the shopper interacts, and never runs under
   prefers-reduced-motion. */
(function () {
  'use strict';

  var motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
  var reduceMotion = motionQuery.matches;
  /* Re-read the preference if the shopper changes it mid-session rather
     than pinning whatever it was at load. */
  if (motionQuery.addEventListener) {
    motionQuery.addEventListener('change', function (e) { reduceMotion = e.matches; });
  }

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
    if (!reduceMotion) root.classList.add('carousel--parallax');

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
      /* Longer easing only while a programmatic jump is in flight - a
         finger-driven scroll keeps the 1:1 tracking transition. */
      root.classList.add('is-settling');
      clearTimeout(settleTimer);
      settleTimer = setTimeout(function () { root.classList.remove('is-settling'); }, 420);
      track.scrollTo({
        left: slides[i].offsetLeft - track.offsetLeft,
        behavior: reduceMotion ? 'auto' : 'smooth'
      });
    }
    var settleTimer = null;

    function setActive(i) {
      if (i === activeIndex) return;
      activeIndex = i;
      slides.forEach(function (slide, s) { slide.classList.toggle('is-active', s === i); });
      dots.forEach(function (dot, d) {
        dot.classList.toggle('is-active', d === i);
        dot.setAttribute('aria-current', d === i ? 'true' : 'false');
      });
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

    /* Publish per-slide centredness + parallax offset. Pure reads of
       layout geometry (offsetLeft/offsetWidth are not affected by the
       transforms we then apply), so this can run every frame without
       feeding back on itself. */
    function updateSlideProps() {
      if (reduceMotion) return;
      var viewCenter = track.scrollLeft + track.clientWidth / 2;
      slides.forEach(function (slide) {
        var w = slide.offsetWidth || 1;
        var center = slide.offsetLeft - track.offsetLeft + w / 2;
        var delta = (center - viewCenter) / w; /* -1 .. 1 across one slide */
        var clamped = delta < -1 ? -1 : (delta > 1 ? 1 : delta);
        var p = 1 - Math.abs(clamped);
        slide.style.setProperty('--slide-p', p.toFixed(3));
        slide.style.setProperty('--slide-x', clamped.toFixed(3));
      });
    }

    /* Variant-a (Apple pill indicator): the active dot stretches into a
       bar whose length hands off to the neighboring dot continuously as
       the track scrolls, instead of flipping discretely. */
    var scrubbing = root.classList.contains('carousel--pill');
    if (scrubbing && !reduceMotion) {
      dots.forEach(function (dot) {
        dot.style.transition = 'width 80ms linear, background-color 200ms var(--ease-out)';
      });
    }
    function scrubDots() {
      if (!scrubbing || reduceMotion || dots.length < 2) return;
      /* Normalize scroll progress across the whole track so f runs
         exactly 0 -> (n-1) from first slide to last, since snap-start
         slides never center in the viewport. */
      var maxScroll = track.scrollWidth - track.clientWidth;
      if (maxScroll <= 0) return;
      var f = (track.scrollLeft / maxScroll) * (slides.length - 1);
      if (f < 0) f = 0;
      if (f > slides.length - 1) f = slides.length - 1;
      dots.forEach(function (dot, i) {
        var closeness = 1 - Math.abs(f - i);
        if (closeness < 0) closeness = 0;
        dot.style.width = (7 + closeness * 15) + 'px';
      });
    }

    function onScroll() {
      if (rafId) return;
      rafId = window.requestAnimationFrame(function () {
        rafId = null;
        setActive(nearestIndex());
        updateSlideProps();
        scrubDots();
      });
    }
    track.addEventListener('scroll', onScroll, { passive: true });

    setActive(0);
    updateSlideProps();
    scrubDots();
    window.addEventListener('resize', function () { updateSlideProps(); scrubDots(); });

    /* ---- Autoplay ---- */
    var autoplayEnabled = root.hasAttribute('data-carousel-autoplay') && !reduceMotion;

    function endDrag() {
      root.classList.remove('is-dragging');
      if (autoplayEnabled && playing) start();
    }
    track.addEventListener('pointerdown', function () {
      root.classList.add('is-dragging');
      root.classList.remove('is-settling');
      if (autoplayEnabled) stop();
    });
    /* pointercancel as well as pointerup: a swipe interrupted by a system
       gesture never fires pointerup, which used to leave autoplay stopped
       for good and the will-change hint stuck on. */
    track.addEventListener('pointerup', endDrag);
    track.addEventListener('pointercancel', endDrag);

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
      /* A manual nudge restarts the timer rather than fighting the
         shopper's own scroll/swipe: they get a full interval before the
         carousel moves on its own again. */
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

  var allCarousels = Array.prototype.slice.call(document.querySelectorAll('[data-carousel]'));
  allCarousels.forEach(function (root, i) {
    /* First two carousels keep the default dot style; later ones get a
       different indicator so the page feels custom, not templated. */
    var variant = i < 2 ? 'a' : (i === 2 ? 'b' : 'c');
    root.classList.add('carousel--dots-' + variant);
    initCarousel(root);
  });

  /* Vertical entrance drift: each carousel's cards rise into their
     resting position as the section scrolls into frame (scroll-linked and
     clamped, so it settles when in frame and reverses on the way back up),
     and the caption springs in once. Skipped entirely under reduced
     motion. This is the section-level parallax; the per-slide horizontal
     parallax lives in updateSlideProps() above. */
  if (!reduceMotion && allCarousels.length) {
    var pxItems = allCarousels.map(function (root) {
      root.setAttribute('data-parallax', '');
      return { root: root, wordsIn: false, top: 0 };
    });
    var ticking = false;
    function updateParallax() {
      ticking = false;
      var vh = window.innerHeight || document.documentElement.clientHeight;
      var startY = vh * 0.9; /* begins as the carousel top enters the lower viewport */
      var endY = vh * 0.4;   /* fully settled once it's comfortably in frame */
      pxItems.forEach(function (item) {
        var top = item.top;
        var p = (startY - top) / (startY - endY);
        p = p < 0 ? 0 : (p > 1 ? 1 : p);
        var eased = 1 - Math.pow(1 - p, 3);
        item.root.style.setProperty('--reveal-p', eased.toFixed(3));
        if (!item.wordsIn && p >= 0.5) {
          item.wordsIn = true;
          item.root.classList.add('carousel--words-in');
        } else if (item.wordsIn && p <= 0.02) {
          item.wordsIn = false;
          item.root.classList.remove('carousel--words-in');
        }
      });
    }
    /* Measure every carousel in one batch, then write in one batch, so a
       page with five carousels forces layout once per frame instead of
       once per carousel. */
    function measure() {
      pxItems.forEach(function (item) { item.top = item.root.getBoundingClientRect().top; });
    }
    function onScroll() {
      if (!ticking) {
        ticking = true;
        window.requestAnimationFrame(function () { measure(); updateParallax(); });
      }
    }
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    measure();
    updateParallax();
  }
})();
