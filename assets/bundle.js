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

    form.addEventListener('submit', function (e) {
      var choice = selected();
      if (!choice) return; /* let the native form handle it */
      e.preventDefault();

      var quantity = parseInt(choice.value, 10) || 1;
      var code = choice.getAttribute('data-code') || '';
      var idField = form.querySelector('[name="id"]');
      if (!idField) { form.submit(); return; }

      if (addBtn) { addBtn.disabled = true; addBtn.classList.add('is-loading'); }

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
          if (code) {
            /* Apply the discount, then land on the cart so the shopper
               sees the agreed total and every unit before checkout. */
            window.location.href = '/discount/' + encodeURIComponent(code) + '?redirect=/cart';
          } else {
            window.location.href = '/cart';
          }
        })
        .catch(function () {
          /* Fall back to a normal form post so the shopper is never stuck. */
          if (addBtn) { addBtn.disabled = false; addBtn.classList.remove('is-loading'); }
          form.submit();
        });
    });
  });
})();
