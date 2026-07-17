/* Melt Labs — scroll effects. No libraries:
   1. Reveal-on-scroll via IntersectionObserver.
   2. Product subnav that slides in after the hero scrolls away.
   3. Hero video autoplay safety-net for browsers that ignore the
      autoplay attribute under some network/battery conditions.
   4. Stat count-up: locked percentages animate from 0 when scrolled
      into view, once.
   5. Science section scroll-scrub: a single video's currentTime is
      driven directly by scroll position through the sticky stage,
      forward on scroll-down, backward on scroll-up.
   All of the above collapse to static under prefers-reduced-motion. */
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

  /* 2. Scroll-aware product subnav. The site header and this subnav
     both pin to the top of the viewport (sticky vs. fixed), so only one
     may be visible at a time - hide the header the moment the subnav
     takes over, restore it when scrolling back above the hero. */
  var subnav = document.querySelector('[data-subnav]');
  var sentinel = document.querySelector('[data-subnav-sentinel]');
  var siteHeader = document.querySelector('.site-header');
  if (subnav && sentinel) {
    new IntersectionObserver(function (entries) {
      var stuck = !entries[0].isIntersecting;
      subnav.classList.toggle('is-stuck', stuck);
      if (siteHeader) siteHeader.classList.toggle('is-hidden', stuck);
    }).observe(sentinel);
  }

  /* 3. Hero video autoplay safety-net. The markup already carries the
     literal autoplay/muted/playsinline attributes iOS requires; this
     just nudges playback for browsers/situations that ignore autoplay
     (low-power mode, some in-app webviews). Silently ignored if it
     fails - the poster/fallback image still shows. */
  document.querySelectorAll('[data-autoplay-video]').forEach(function (video) {
    var tryPlay = function () {
      var p = video.play();
      if (p && typeof p.catch === 'function') p.catch(function () {});
    };
    if (video.readyState >= 2) tryPlay();
    else video.addEventListener('loadeddata', tryPlay, { once: true });
  });

  /* 4. Stat count-up: animate the locked percentage values from 0 the
     first time they scroll into view. Values/copy are never invented
     here - only the number already in the markup is what animates. */
  var countEls = document.querySelectorAll('[data-count-up]');
  if (countEls.length) {
    function finalize(el, raw) {
      el.textContent = raw;
    }
    function animateCount(el) {
      var raw = el.getAttribute('data-count-up');
      var match = raw.match(/^(\d+(?:\.\d+)?)(.*)$/);
      if (!match) { finalize(el, raw); return; }
      if (reduceMotion) { finalize(el, raw); return; }

      var target = parseFloat(match[1]);
      var suffix = match[2];
      var decimals = (match[1].split('.')[1] || '').length;
      var duration = 1100;
      var start = null;

      function step(ts) {
        if (!start) start = ts;
        var progress = Math.min(1, (ts - start) / duration);
        var eased = 1 - Math.pow(1 - progress, 3); /* ease-out cubic */
        el.textContent = (target * eased).toFixed(decimals) + suffix;
        if (progress < 1) requestAnimationFrame(step);
        else finalize(el, raw);
      }
      requestAnimationFrame(step);
    }

    var countObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          animateCount(entry.target);
          countObserver.unobserve(entry.target);
        }
      });
    }, { threshold: 0.6 });
    countEls.forEach(function (el) { countObserver.observe(el); });
  }

  /* 5. Science scrub: video.currentTime tracks scroll progress through
     the sticky stage. Scroll down plays forward, scroll up rewinds -
     no autoplay, no loop, purely position-driven like Apple's exploded
     product views. Falls back to a static poster frame under reduced
     motion, no video, or before metadata (duration) is known. */
  document.querySelectorAll('[data-scrub]').forEach(function (scroller) {
    var video = scroller.querySelector('[data-scrub-video]');
    if (!video) return; /* no video set yet - placeholder markup handles itself */

    if (reduceMotion) {
      scroller.classList.add('is-static');
      return;
    }

    var duration = 0;
    var ticking = false;
    var inView = false;

    function update() {
      ticking = false;
      if (!duration) return;
      var rect = scroller.getBoundingClientRect();
      var total = rect.height - window.innerHeight;
      if (total <= 0) return;
      var progress = Math.min(1, Math.max(0, -rect.top / total));
      var targetTime = progress * duration;
      if (Math.abs(video.currentTime - targetTime) > 0.03) {
        video.currentTime = targetTime;
      }
    }

    function onScroll() {
      if (!inView || ticking) return;
      ticking = true;
      requestAnimationFrame(update);
    }

    function onMetadata() {
      duration = video.duration || 0;
      scroller.classList.remove('is-static');
      update();
    }

    if (video.readyState >= 1 && video.duration) {
      onMetadata();
    } else {
      video.addEventListener('loadedmetadata', onMetadata, { once: true });
    }

    new IntersectionObserver(function (entries) {
      inView = entries[0].isIntersecting;
      if (inView) update();
    }).observe(scroller);

    window.addEventListener('scroll', onScroll, { passive: true });
  });
})();
