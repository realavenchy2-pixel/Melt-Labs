/* Melt Labs — shared carousel. CSS scroll-snap does the work; JS adds
   arrows, dots, active-slide tracking, and a subtle enter animation on
   the slide's content whenever the active slide changes (scroll, swipe,
   or arrow/dot click). One component for every carousel on the site
   (testimonials, ingredients, benefit angles, about cards). */
(function () {
  'use strict';

  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var ENTER_EASING = 'cubic-bezier(0.23, 1, 0.32, 1)'; /* fast ease-out, no overshoot */

  function animateEnter(slide) {
    if (reduceMotion) return;
    var content = slide.firstElementChild;
    if (!content) return;
    content.animate(
      [
        { opacity: 0.001, transform: 'translateY(10px)' },
        { opacity: 1, transform: 'translateY(0)' }
      ],
      { duration: 320, easing: ENTER_EASING, fill: 'both' }
    );
  }

  function initCarousel(root) {
    var track = root.querySelector('[data-carousel-track]');
    var slides = Array.prototype.slice.call(track.children);
    if (slides.length < 2) return;

    var prev = root.querySelector('[data-carousel-prev]');
    var next = root.querySelector('[data-carousel-next]');
    var dotsWrap = root.querySelector('[data-carousel-dots]');
    var dots = [];
    var activeIndex = 0;
    var mounted = false;

    if (dotsWrap) {
      slides.forEach(function (_, i) {
        var dot = document.createElement('button');
        dot.type = 'button';
        dot.className = 'carousel__dot';
        dot.setAttribute('aria-label', 'Go to slide ' + (i + 1));
        dot.addEventListener('click', function () { scrollToSlide(i); });
        dotsWrap.appendChild(dot);
        dots.push(dot);
      });
    }

    function scrollToSlide(i) {
      i = Math.max(0, Math.min(slides.length - 1, i));
      track.scrollTo({ left: slides[i].offsetLeft - track.offsetLeft, behavior: 'smooth' });
    }

    function setActive(i) {
      if (i === activeIndex) return;
      activeIndex = i;
      dots.forEach(function (dot, d) { dot.classList.toggle('is-active', d === i); });
      if (prev) prev.disabled = i === 0;
      if (next) next.disabled = i === slides.length - 1;
      /* Skip the enter animation on initial mount; only animate slides
         that become active from a real scroll/swipe/click interaction. */
      if (mounted) animateEnter(slides[i]);
    }

    if (prev) prev.addEventListener('click', function () { scrollToSlide(activeIndex - 1); });
    if (next) next.addEventListener('click', function () { scrollToSlide(activeIndex + 1); });

    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) setActive(slides.indexOf(entry.target));
      });
    }, { root: track, threshold: 0.6 });
    slides.forEach(function (slide) { observer.observe(slide); });

    activeIndex = -1;
    setActive(0);
    mounted = true;
  }

  document.querySelectorAll('[data-carousel]').forEach(initCarousel);
})();
