/* Melt Labs — scroll effects. No libraries:
   1. Reveal-on-scroll via IntersectionObserver.
   2. Product subnav that slides in after the hero scrolls away.
   3. Hero video autoplay safety-net for browsers that ignore the
      autoplay attribute under some network/battery conditions.
   4. Stat count-up: locked percentages animate from 0 when scrolled
      into view, once.
   5. FAQ accordion: smooth open/close height animation.
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
    /* The sentinel sits just below the hero's own CTA button. It reveals
       the sticky Buy bar only once it has scrolled ABOVE the top of the
       viewport (button no longer visible) - not while it's still below
       the fold on load, which is also "not intersecting". The
       boundingClientRect.top check distinguishes the two. */
    new IntersectionObserver(function (entries) {
      var entry = entries[0];
      var stuck = !entry.isIntersecting && entry.boundingClientRect.top < 0;
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

  /* 5. FAQ accordion: native <details>/<summary> works without JS; this
     enhancement smooth-animates the open/close height with WAAPI. */
  document.querySelectorAll('[data-faq-item]').forEach(function (item) {
    var summary = item.querySelector('summary');
    var content = item.querySelector('[data-faq-content]');
    if (!summary || !content || reduceMotion) return;

    var animating = false;
    summary.addEventListener('click', function (e) {
      e.preventDefault();
      if (animating) return;
      animating = true;

      if (item.open) {
        var closeAnim = content.animate(
          [{ height: content.offsetHeight + 'px', opacity: 1 }, { height: '0px', opacity: 0 }],
          { duration: 260, easing: 'cubic-bezier(0.23, 1, 0.32, 1)' }
        );
        closeAnim.onfinish = function () {
          item.open = false;
          animating = false;
        };
      } else {
        item.open = true;
        var target = content.offsetHeight;
        var openAnim = content.animate(
          [{ height: '0px', opacity: 0 }, { height: target + 'px', opacity: 1 }],
          { duration: 300, easing: 'cubic-bezier(0.23, 1, 0.32, 1)' }
        );
        openAnim.onfinish = function () { animating = false; };
      }
    });
  });
})();
