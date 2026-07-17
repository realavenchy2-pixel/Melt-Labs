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

  /* 1b. Mobile menu (hamburger). Toggles the panel, morphs the icon to
     an X, locks body scroll while open, and closes on link tap, Escape,
     or resize up to desktop. */
  var menuToggle = document.querySelector('[data-menu-toggle]');
  var mobileMenu = document.querySelector('[data-mobile-menu]');
  if (menuToggle && mobileMenu) {
    function openMenu() {
      mobileMenu.hidden = false;
      /* next frame so the unhide paints before the open animation */
      requestAnimationFrame(function () { mobileMenu.classList.add('is-open'); });
      menuToggle.setAttribute('aria-expanded', 'true');
      document.body.style.overflow = 'hidden';
    }
    function closeMenu() {
      mobileMenu.classList.remove('is-open');
      mobileMenu.hidden = true;
      menuToggle.setAttribute('aria-expanded', 'false');
      document.body.style.overflow = '';
    }
    menuToggle.addEventListener('click', function () {
      if (menuToggle.getAttribute('aria-expanded') === 'true') closeMenu();
      else openMenu();
    });
    mobileMenu.addEventListener('click', function (e) {
      if (e.target.closest('a')) closeMenu();
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && menuToggle.getAttribute('aria-expanded') === 'true') closeMenu();
    });
    window.addEventListener('resize', function () {
      if (window.innerWidth >= 900 && menuToggle.getAttribute('aria-expanded') === 'true') closeMenu();
    });
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

  /* 3. Hero video autoplay. Plays only the video that is actually
     visible at the current breakpoint (the responsive mobile/desktop
     pair hides one via CSS), so the hidden file - which uses
     preload="none" - never downloads. Re-checked on resize so crossing
     the breakpoint starts the newly-shown video. Safe on browsers/
     situations that ignore the autoplay attribute (low-power mode,
     in-app webviews); failures are ignored and the poster still shows. */
  var heroVideos = document.querySelectorAll('[data-autoplay-video]');
  if (heroVideos.length) {
    function isVisible(el) {
      return el.getClientRects().length > 0;
    }
    function syncHeroVideos() {
      heroVideos.forEach(function (video) {
        if (isVisible(video)) {
          /* Upgrade the visible one to eager buffering so it starts as
             fast as possible; the hidden breakpoint stays light. */
          if (video.preload !== 'auto') video.preload = 'auto';
          var p = video.play();
          if (p && typeof p.catch === 'function') p.catch(function () {});
        } else if (!video.paused) {
          video.pause();
        }
      });
    }
    syncHeroVideos();
    var heroResizeTimer;
    window.addEventListener('resize', function () {
      clearTimeout(heroResizeTimer);
      heroResizeTimer = setTimeout(syncHeroVideos, 200);
    });
  }

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

  /* 5. Science video. Baseline: the video just autoplays muted+looped
     (markup handles that), so the section is never blank. On a desktop
     pointer with motion enabled we UPGRADE to a scroll-scrub: pause the
     loop, size the scroller tall, pin the stage, and drive currentTime
     from scroll position (down = forward, up = rewind). Mobile, reduced
     motion, and no-JS all keep the plain autoplay loop. */
  var desktopScrub = window.matchMedia('(min-width: 768px) and (pointer: fine)').matches;
  document.querySelectorAll('[data-scrub]').forEach(function (scroller) {
    var video = scroller.querySelector('[data-scrub-video]');
    if (!video) return;

    /* Nudge autoplay for browsers that ignore the attribute. */
    var kick = video.play();
    if (kick && typeof kick.catch === 'function') kick.catch(function () {});

    if (reduceMotion || !desktopScrub) return; /* keep plain autoplay loop */

    var scrubVh = parseFloat(scroller.getAttribute('data-scrub-vh')) || 350;
    var duration = 0;
    var ticking = false;
    var inView = false;

    function enableScrub() {
      duration = video.duration || 0;
      if (!duration) return;
      video.pause();
      video.loop = false;
      video.removeAttribute('autoplay');
      scroller.classList.remove('is-static');
      scroller.style.height = scrubVh + 'vh';
      update();
    }

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

    if (video.readyState >= 1 && video.duration) {
      enableScrub();
    } else {
      video.addEventListener('loadedmetadata', enableScrub, { once: true });
    }

    new IntersectionObserver(function (entries) {
      inView = entries[0].isIntersecting;
      if (inView) update();
    }).observe(scroller);

    window.addEventListener('scroll', onScroll, { passive: true });
  });
})();
