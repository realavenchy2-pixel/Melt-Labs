/* Melt Labs — scroll effects. No libraries:
   1. Reveal-on-scroll via IntersectionObserver.
   2. Product subnav that slides in after the hero scrolls away.
   3. Hero video autoplay safety-net for browsers that ignore the
      autoplay attribute under some network/battery conditions.
   4. Stat count-up: locked percentages animate from 0 when scrolled
      into view, once. The real value is what ships in the HTML, so a
      no-JS visitor never sees a zeroed statistic.
   5. FAQ accordion: smooth, interruptible open/close.
   6. Media fade-in so late-decoding images arrive rather than snap.
   All of the above collapse to static under prefers-reduced-motion. */
(function () {
  'use strict';

  var motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
  var reduceMotion = motionQuery.matches;
  if (motionQuery.addEventListener) {
    motionQuery.addEventListener('change', function (e) { reduceMotion = e.matches; });
  }

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
    /* A hero the visitor has paused. Held on the section rather than on
       each <video> so the mobile and desktop files of one hero share a
       single state - crossing the breakpoint must not silently restart
       footage that was deliberately stopped. */
    function isHeroPaused(video) {
      var hero = video.closest('[data-hero]');
      return !!hero && hero.getAttribute('data-video-paused') === 'true';
    }
    function syncHeroVideos() {
      heroVideos.forEach(function (video) {
        if (isVisible(video) && !isHeroPaused(video)) {
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

    /* Play/pause control. Reduced motion starts it paused: a looping
       full-frame video is exactly the kind of motion that setting is
       asking us to stop, and the control is then how the visitor opts
       back in rather than something they have to fight. */
    document.querySelectorAll('[data-video-toggle]').forEach(function (btn) {
      var hero = btn.closest('[data-hero]');
      if (!hero) return;

      var playIcon = btn.querySelector('[data-video-toggle-icon="play"]');
      var pauseIcon = btn.querySelector('[data-video-toggle-icon="pause"]');

      function render(paused) {
        hero.setAttribute('data-video-paused', paused ? 'true' : 'false');
        /* aria-pressed says whether the pause is engaged; the label
           always names what the next press will do. */
        btn.setAttribute('aria-pressed', paused ? 'true' : 'false');
        btn.setAttribute('aria-label', paused ? 'Play background video' : 'Pause background video');
        if (playIcon) playIcon.hidden = !paused;
        if (pauseIcon) pauseIcon.hidden = paused;
      }

      render(reduceMotion);

      btn.addEventListener('click', function () {
        render(hero.getAttribute('data-video-paused') !== 'true');
        syncHeroVideos();
      });
    });

    syncHeroVideos();
    var heroResizeTimer;
    window.addEventListener('resize', function () {
      clearTimeout(heroResizeTimer);
      heroResizeTimer = setTimeout(syncHeroVideos, 200);
    });
  }

  /* 3b. Header cart count. Liquid renders the real number, so this only
     has to correct it when the rendered page is out of date - which is
     what happens on a back-navigation: the browser restores the cached
     page with whatever count it had before the shopper added anything.
     `pageshow` with persisted=true is that exact moment. Other scripts
     can also announce a change with a `cart:updated` event carrying the
     new count. */
  var cartCountEl = document.querySelector('[data-cart-count]');
  var cartLink = document.querySelector('[data-cart-link]');
  if (cartCountEl) {
    function setCartCount(count) {
      if (typeof count !== 'number' || count < 0) return;
      var previous = parseInt(cartCountEl.textContent, 10);
      cartCountEl.textContent = count;
      cartCountEl.hidden = count === 0;
      if (cartLink) {
        cartLink.setAttribute('aria-label', 'Cart, ' + count + (count === 1 ? ' item' : ' items'));
      }
      if (previous === count || count === 0) return;
      /* Restart the animation rather than letting a repeat change be
         swallowed by an already-applied class. */
      cartCountEl.classList.remove('is-bumped');
      void cartCountEl.offsetWidth;
      cartCountEl.classList.add('is-bumped');
    }

    function refreshCartCount() {
      fetch(window.Shopify && window.Shopify.routes ? window.Shopify.routes.root + 'cart.js' : '/cart.js', {
        headers: { Accept: 'application/json' },
        credentials: 'same-origin'
      })
        .then(function (res) { return res.ok ? res.json() : null; })
        .then(function (cart) { if (cart) setCartCount(cart.item_count); })
        .catch(function () { /* leave the rendered count in place */ });
    }

    window.addEventListener('pageshow', function (e) {
      if (e.persisted) refreshCartCount();
    });
    document.addEventListener('cart:updated', function (e) {
      if (e.detail && typeof e.detail.count === 'number') setCartCount(e.detail.count);
      else refreshCartCount();
    });
  }

  /* 4. Stat count-up. The markup ships the REAL value as text, so a
     visitor without JS reads the true statistic instead of "0%". Only
     once we know we can animate do we zero it and count up. */
  var countEls = document.querySelectorAll('[data-count-up]');
  if (countEls.length && !reduceMotion) {
    var pending = [];
    countEls.forEach(function (el) {
      var raw = el.getAttribute('data-count-up') || el.textContent;
      var match = raw.match(/^(\d+(?:\.\d+)?)(.*)$/);
      if (!match) return;
      var decimals = (match[1].split('.')[1] || '').length;
      /* Zero it only now, and reserve the final width so the row cannot
         reflow as digits are added. */
      el.style.minWidth = el.getBoundingClientRect().width + 'px';
      el.textContent = (0).toFixed(decimals) + match[2];
      pending.push(el);
    });

    function animateCount(el) {
      var raw = el.getAttribute('data-count-up');
      var match = raw.match(/^(\d+(?:\.\d+)?)(.*)$/);
      if (!match) return;

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
        else el.textContent = raw;
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
    pending.forEach(function (el) { countObserver.observe(el); });
  }

  /* 5. FAQ accordion: native <details>/<summary> works without JS; this
     enhancement smooth-animates the open/close.

     Every animation is interruptible. A second tap mid-flight cancels
     the running animation, reads the height actually on screen, and
     retargets from there - it is never swallowed, and the panel never
     jumps back to a logical value the shopper cannot see. */
  document.querySelectorAll('[data-faq-item]').forEach(function (item) {
    var summary = item.querySelector('summary');
    var content = item.querySelector('[data-faq-content]');
    if (!summary || !content) return;

    var current = null;   /* in-flight Animation */
    var closing = false;

    function currentHeight() {
      var h = content.getBoundingClientRect().height;
      return h > 0 ? h : content.offsetHeight;
    }

    function run(from, to, onDone) {
      if (current) current.cancel();
      content.style.overflow = 'hidden';
      current = content.animate(
        [
          { height: from + 'px', opacity: from === 0 ? 0 : 1 },
          { height: to + 'px', opacity: to === 0 ? 0 : 1 }
        ],
        { duration: 260, easing: 'cubic-bezier(0.23, 1, 0.32, 1)' }
      );
      current.onfinish = function () {
        current = null;
        content.style.overflow = '';
        content.style.height = '';
        if (onDone) onDone();
      };
    }

    summary.addEventListener('click', function (e) {
      if (reduceMotion) return; /* let <details> toggle natively */
      e.preventDefault();

      var from = current ? currentHeight() : (item.open ? currentHeight() : 0);
      if (current) current.cancel();
      current = null;

      if (item.open && !closing) {
        /* Closing: keep it open for the duration, then collapse. */
        closing = true;
        run(from, 0, function () {
          item.open = false;
          closing = false;
        });
      } else {
        /* Opening, or reversing a close that is still in flight. */
        closing = false;
        item.open = true;
        content.style.height = 'auto';
        var target = content.getBoundingClientRect().height;
        content.style.height = from + 'px';
        run(from, target);
      }
    });
  });

  /* 6. Media fade-in. Purely additive: an image is only marked as
     loading if it is NOT already decoded, so cached media never flashes
     and a no-JS visitor is never left with a transparent image. Eager /
     high-priority media is skipped entirely - fading the LCP element
     would delay the very metric this exists to protect. */
  if (!reduceMotion) {
    document.querySelectorAll('.media-slot > img, .media-slot > picture img').forEach(function (img) {
      if (img.loading === 'eager' || img.getAttribute('fetchpriority') === 'high') return;
      if (img.complete && img.naturalWidth > 0) return;
      img.classList.add('is-media-loading');
      function done() { img.classList.remove('is-media-loading'); }
      img.addEventListener('load', done, { once: true });
      img.addEventListener('error', done, { once: true });
    });
  }
})();
