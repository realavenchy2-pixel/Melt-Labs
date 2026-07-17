/* Melt Labs — shared carousel. CSS scroll-snap does the work; JS tracks
   which slide is centered and toggles .is-active on it. Inactive slides
   sit slightly smaller and dimmer and the active one stretches to full
   size via a CSS transition, so moving between slides is a smooth,
   immersive scale rather than a flash. One component for every carousel
   on the site (testimonials, ingredients, benefit angles, about cards). */
(function () {
  'use strict';

  function initCarousel(root) {
    var track = root.querySelector('[data-carousel-track]');
    var slides = Array.prototype.slice.call(track.children);
    if (slides.length < 2) return;

    var prev = root.querySelector('[data-carousel-prev]');
    var next = root.querySelector('[data-carousel-next]');
    var dotsWrap = root.querySelector('[data-carousel-dots]');
    var dots = [];
    var activeIndex = -1;

    root.classList.add('carousel--enhanced');

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
      slides.forEach(function (slide, s) { slide.classList.toggle('is-active', s === i); });
      dots.forEach(function (dot, d) { dot.classList.toggle('is-active', d === i); });
      if (prev) prev.disabled = i === 0;
      if (next) next.disabled = i === slides.length - 1;
    }

    if (prev) prev.addEventListener('click', function () { scrollToSlide(activeIndex - 1); });
    if (next) next.addEventListener('click', function () { scrollToSlide(activeIndex + 1); });

    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) setActive(slides.indexOf(entry.target));
      });
    }, { root: track, threshold: 0.6 });
    slides.forEach(function (slide) { observer.observe(slide); });

    setActive(0);
  }

  document.querySelectorAll('[data-carousel]').forEach(initCarousel);
})();
