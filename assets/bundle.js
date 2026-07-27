/* Melt Labs — native bundle selector. No app, no Kaching.

   Each tier is a radio named "quantity" whose value is the number of
   real units that tier adds to the cart, so the order carries the exact
   bottle count (this is what Supliful reads) and the cart line shows all
   the units. Pricing shown on each tier is the merchant's agreed price;
   checkout is made to match it by a Shopify discount — either an
   automatic quantity discount (applies with no code) or a per-tier
   discount code that this script applies on add.

   Progressive enhancement: with JS off, the checked radio still posts
   its quantity and the native form adds the right units (automatic
   discounts still apply). With JS on, we add via AJAX and, if the tier
   has a code, apply it before landing on the cart. */
(function () {
  'use strict';

  document.querySelectorAll('[data-bundle]').forEach(function (bundle) {
    var form = bundle.closest('form');
    if (!form) return;

    var radios = Array.prototype.slice.call(bundle.querySelectorAll('[data-bundle-tier]'));
    var addBtn = form.querySelector('[data-bundle-add]');
    var totalSuffix = form.querySelector('[data-bundle-total-suffix]');
    if (radios.length === 0) return;

    function selected() {
      for (var i = 0; i < radios.length; i++) {
        if (radios[i].checked) return radios[i];
      }
      return radios[0];
    }

    function sync() {
      radios.forEach(function (radio) {
        var card = radio.closest('.bundle__tier');
        if (card) card.classList.toggle('is-selected', radio.checked);
      });
      if (totalSuffix) {
        var price = selected().getAttribute('data-price');
        totalSuffix.textContent = price ? ' · ' + price : '';
      }
    }

    radios.forEach(function (radio) {
      radio.addEventListener('change', sync);
    });
    sync();

    /* Status line for pending/error feedback. Created here rather than in
       Liquid so the no-JS path stays a plain native form. */
    var status = null;
    function statusEl() {
      if (status) return status;
      status = document.createElement('p');
      status.className = 'bundle__status';
      status.setAttribute('role', 'status');
      status.setAttribute('aria-live', 'polite');
      var actions = form.querySelector('.offer__actions') || form;
      actions.insertAdjacentElement('afterend', status);
      return status;
    }

    function setPending(on) {
      if (!addBtn) return;
      addBtn.disabled = on;
      addBtn.classList.toggle('is-loading', on);
      addBtn.setAttribute('aria-busy', on ? 'true' : 'false');
    }

    form.addEventListener('submit', function (e) {
      var choice = selected();
      if (!choice) return; /* let the native form handle it */
      e.preventDefault();

      var quantity = parseInt(choice.value, 10) || 1;
      var code = choice.getAttribute('data-code') || '';
      var idField = form.querySelector('[name="id"]');
      if (!idField) { form.submit(); return; }

      setPending(true);
      statusEl().textContent = 'Adding to your bag…';
      status.classList.remove('bundle__status--error');

      fetch('/cart/add.js', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify({ id: idField.value, quantity: quantity })
      })
        .then(function (res) {
          if (!res.ok) throw new Error('add failed');
          return res.json();
        })
        .then(function () {
          /* Completion feedback before the navigation, so a slow cart
             page still reads as success rather than a stalled tap. */
          statusEl().textContent = 'Added. Taking you to your bag…';
          /* No count in the add.js response, so this asks the header to
             go and read the real one. Matters when the redirect below
             is slow enough for the shopper to look back up at it. */
          document.dispatchEvent(new CustomEvent('cart:updated'));
          if (code) {
            /* Apply the discount, then land on the cart so the shopper
               sees the agreed total and every unit before checkout. */
            window.location.href = '/discount/' + encodeURIComponent(code) + '?redirect=/cart';
          } else {
            window.location.href = '/cart';
          }
        })
        .catch(function () {
          /* Say what happened and re-arm the button. The shopper decides
             whether to retry - a silent full-page resubmit looks like the
             tap did nothing. */
          setPending(false);
          statusEl().textContent = 'That didn’t go through. Check your connection and try again.';
          status.classList.add('bundle__status--error');
        });
    });
  });

  /* ---- Purchase-panel guard ----

     The tiered pricing widget states a total and a unit count on every
     tier, so it is the only place either number belongs. A lone unit
     price above it contradicts whichever tier is selected, and a
     typeable quantity box beside it hands the shopper two controls for
     one number - they disagree the moment either is touched.

     The widget renders after this script, so a single pass on load
     misses it; the observer below keeps watching for a short window and
     then stops, rather than staying live for the life of the page.

     KEEP is the important half. Everything the pricing widget owns -
     its own root, its tier cards, their prices, its quantity inputs -
     is off limits, so this only ever removes a duplicate that landed
     OUTSIDE the widget. If a match cannot be proven to sit outside, it
     is left alone: a stray price line is a smaller problem than a
     blanked-out pricing widget. */
  var panel = document.querySelector('[data-offer-panel]');
  if (!panel) return;

  var KEEP = [
    '[class*="kaching"]', '[id*="kaching"]',
    '[class*="bundle"]', '[id*="bundle"]', '[data-bundle]',
    '.shopify-app-block', '.shopify-block', '.shopify-payment-button',
    '[data-offer-keep]'
  ].join(',');

  /* Price nodes, then quantity controls. Deliberately narrow: named
     hooks and the conventional Shopify class names, not a wildcard on
     "price" - a wildcard also matches things like a compare-at note
     inside copy the merchant wrote on purpose. */
  var PRICE = '.offer__price, .price, .product-price, .product__price, [data-price], [data-product-price]';
  var QTY = [
    '.quantity', '.quantity-selector', '.quantity-input', '.product-form__quantity',
    '[data-quantity-selector]', '[data-quantity-input]',
    'input[name="quantity"]:not([type="hidden"])',
    'select[name="quantity"]'
  ].join(',');

  function strip() {
    panel.querySelectorAll(PRICE + ',' + QTY).forEach(function (el) {
      if (el.closest(KEEP)) return;          /* belongs to the widget */
      if (el.hasAttribute('data-offer-stripped')) return;
      /* A quantity input usually sits inside a labelled wrapper; hiding
         the input alone strips the control but leaves its "QUANTITY"
         label floating. Take the field wrapper when there is one. */
      var target = el.closest('.offer__field') || el;
      if (target.closest(KEEP)) return;
      target.setAttribute('data-offer-stripped', '');
      target.style.display = 'none';
    });
  }

  strip();

  if (typeof MutationObserver === 'function') {
    var observer = new MutationObserver(strip);
    observer.observe(panel, { childList: true, subtree: true });
    /* Long enough for a third-party widget to mount on a slow
       connection, short enough that it is not observing forever. */
    setTimeout(function () { observer.disconnect(); }, 10000);
  }
})();
