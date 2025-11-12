(function () {
  const STORAGE_KEY = 'kosen_cart';


  function getCart() {
    try {
      const raw = sessionStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch (e) {
      console.error('Failed to parse cart from sessionStorage', e);
      return [];
    }
  }
  function saveCart(cart) {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(cart));
    renderCartCount();
  }

  function formatNumber(n) {
    return Number(n).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  function parsePrice(priceText) {

    if (!priceText) return 0;
    const cleaned = priceText.replace(/[^\d.]/g, '');
    const parsed = parseFloat(cleaned);
    return isNaN(parsed) ? 0 : parsed;
  }


  function renderCartCount() {
    const cart = getCart();
    const totalQty = cart.reduce((s, i) => s + (i.qty || 0), 0);


    const anchor = document.querySelector('.carticonlink') || document.querySelector('a[href*="cart-page"]') || null;
    if (!anchor) return;
    let badge = anchor.querySelector('#cart-count');
    if (!badge) {
      badge = document.createElement('span');
      badge.id = 'cart-count';

      badge.style.background = '#ff3b30';
      badge.style.color = 'white';
      badge.style.borderRadius = '50%';
      badge.style.padding = '2px 6px';
      badge.style.fontSize = '12px';
      badge.style.marginLeft = '6px';
      badge.style.verticalAlign = 'middle';
      anchor.appendChild(badge);
    }
    badge.textContent = totalQty;
  }


  function makeId(title, size) {
    return `${title}::${size || 'NOSIZE'}`.replace(/\s+/g, '-').toLowerCase();
  }


  function addToCart(item) {
    const cart = getCart();
    const id = makeId(item.title, item.size);
    const existing = cart.find(c => c.id === id);
    if (existing) {
      existing.qty += item.qty || 1;
    } else {
      cart.push({
        id,
        title: item.title,
        price: item.price,
        qty: item.qty || 1,
        size: item.size || '',
        img: item.img || ''
      });
    }
    saveCart(cart);
  }


  function bindAddButtons() {
    document.addEventListener('click', function (e) {
      const btn = e.target.closest && e.target.closest('.add-cart');
      if (!btn) return;
      const box = btn.closest('.product-box');
      if (!box) return;

      const titleEl = box.querySelector('h3');
      const priceEl = box.querySelector('.price');
      const select = box.querySelector('select');

      const title = titleEl ? titleEl.textContent.trim() : 'Untitled';
      let priceText = '';
      if (priceEl) {

        const newp = priceEl.querySelector && priceEl.querySelector('.new-price');
        priceText = (newp ? newp : priceEl).textContent;
      }
      const price = parsePrice(priceText);
      const size = select ? (select.value || select.options[select.selectedIndex].text) : '';
      const imgEl = box.querySelector('img');
      const img = imgEl ? imgEl.getAttribute('src') : '';

      addToCart({ title, price, size, img, qty: 1 });


      btn.textContent = 'Added ✓';
      btn.disabled = true;
      setTimeout(() => {
        btn.textContent = 'Add to Cart';
        btn.disabled = false;
      }, 700);
    });
  }


  function renderCartPage() {
    const cartContainer = document.querySelector('#cart-container');
    if (!cartContainer) return;
    const cart = getCart();
    cartContainer.innerHTML = '';

    if (!cart.length) {
      cartContainer.innerHTML = '<p>Your cart is empty.</p>';
      renderCartSummary(0);
      return;
    }

    const table = document.createElement('table');
    table.style.width = '100%';
    table.style.borderCollapse = 'collapse';

    cart.forEach(item => {
      const tr = document.createElement('tr');
      tr.dataset.id = item.id;

      tr.innerHTML = `
        <td style="padding:8px;border-bottom:1px solid #ddd;width:76px;">
          ${item.img ? `<img src="${item.img}" alt="" style="width:72px;height:auto;object-fit:cover;">` : ''}
        </td>
        <td style="padding:8px;border-bottom:1px solid #ddd;vertical-align:top;">
          <strong>${escapeHtml(item.title)}</strong>
          ${item.size ? `<div>Size: ${escapeHtml(item.size)}</div>` : ''}
          <div style="margin-top:6px;">
            <button data-action="dec">−</button>
            <span data-role="qty" style="margin:0 8px;">${item.qty}</span>
            <button data-action="inc">+</button>
            <button data-action="remove" style="margin-left:12px;color:#c00;">Remove</button>
          </div>
        </td>
        <td style="padding:8px;border-bottom:1px solid #ddd;text-align:right;vertical-align:top;">
          ₱${formatNumber(item.price)}
          <div style="margin-top:6px;"><strong>₱${formatNumber(item.price * item.qty)}</strong></div>
        </td>
      `;
      table.appendChild(tr);
    });

    cartContainer.appendChild(table);

    const total = cart.reduce((s, it) => s + it.price * it.qty, 0);
    renderCartSummary(total);
  }

  function renderCartSummary(total) {
    const summaryEl = document.querySelector('#cart-summary');
    if (!summaryEl) return;
    summaryEl.innerHTML = `
      <p style="font-weight:600">Total: ₱${formatNumber(total)}</p>
      <button id="clear-cart" class="shoppagebuttons">Clear Cart</button>
      <button id="checkout" class="shoppagebuttons" style="margin-left:12px;">Checkout</button>
    `;
  }

  function escapeHtml(str) {
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
  }

  function bindCartPageActions() {
    const container = document.querySelector('#cart-container');
    if (!container) return;

    container.addEventListener('click', function (e) {
      const btn = e.target.closest('button');
      if (!btn) return;
      const action = btn.dataset.action;
      const tr = btn.closest('tr');
      if (!tr) return;
      const id = tr.dataset.id;
      const cart = getCart();
      const idx = cart.findIndex(i => i.id === id);
      if (idx === -1) return;

      if (action === 'inc') {
        cart[idx].qty += 1;
      } else if (action === 'dec') {
        cart[idx].qty = Math.max(1, cart[idx].qty - 1);
      } else if (action === 'remove') {
        cart.splice(idx, 1);
      }
      saveCart(cart);
      renderCartPage();
    });

    document.addEventListener('click', function (e) {
      const cbtn = e.target.closest && e.target.closest('#clear-cart');
      if (cbtn) {
        sessionStorage.removeItem(STORAGE_KEY);
        renderCartPage();
        renderCartCount();
      }
      const checkoutBtn = e.target.closest && e.target.closest('#checkout');
      if (checkoutBtn) {
        alert('Checkout not implemented in this demo.');
      }
    });
  }

  function init() {
    bindAddButtons();
    renderCartCount();
    renderCartPage();
    bindCartPageActions();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();