(function() {
  const STORAGE_KEY = 'kosen_cart';

  function getCart() {
    try {
      const raw = sessionStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch (e) {
      console.error('Error reading cart:', e);
      return [];
    }
  }

  function formatNumber(n) {
    return Number(n).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  function renderCheckoutSummary() {
    const container = document.getElementById('checkout-summary');
    const cart = getCart();

    if (!cart.length) {
      container.innerHTML = '<p>Your cart is empty.</p>';
      document.getElementById('place-order').disabled = true;
      return;
    }

    let html = '<table style="width:100%;border-collapse:collapse;">';
    let total = 0;

    cart.forEach(item => {
      const subtotal = item.price * item.qty;
      total += subtotal;
      html += `
        <tr>
          <td style="padding:8px;border-bottom:1px solid #ddd;">${item.title} (${item.size})</td>
          <td style="padding:8px;border-bottom:1px solid #ddd;text-align:right;">₱${formatNumber(subtotal)}</td>
        </tr>
      `;
    });

    html += `
      <tr>
        <td style="padding:8px;text-align:right;font-weight:bold;">Total:</td>
        <td style="padding:8px;text-align:right;font-weight:bold;">₱${formatNumber(total)}</td>
      </tr>
    </table>`;

    container.innerHTML = html;
  }

  function bindPlaceOrder() {
    const btn = document.getElementById('place-order');
    btn.addEventListener('click', () => {
      const name = document.getElementById('name').value.trim();
      const address = document.getElementById('address').value.trim();

      if (!name || !address) {
        alert('Please fill in all required fields.');
        return;
      }

      alert('✅ Thank you for your purchase, ' + name + '! Your order has been placed.');
      sessionStorage.removeItem(STORAGE_KEY);
      window.location.href = 'index.html';
    });
  }
  function bindGeolocation() {
  const btn = document.getElementById('get-location');
  const status = document.getElementById('location-status');
  const addressField = document.getElementById('address');

  btn.addEventListener('click', () => {
    if (!navigator.geolocation) {
      status.textContent = 'Geolocation is not supported by your browser.';
      return;
    }

    status.textContent = 'Getting your location... ⏳';

    navigator.geolocation.getCurrentPosition(success, error);
  });

  function success(position) {
    const { latitude, longitude } = position.coords;

    // Optional: reverse geocode using free API (OpenStreetMap Nominatim)
    fetch(`https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${latitude}&lon=${longitude}`)
      .then(res => res.json())
      .then(data => {
        if (data.display_name) {
          addressField.value = data.display_name;
          status.textContent = '✅ Location added!';
        } else {
          status.textContent = 'Coordinates received, but address not found.';
        }
      })
      .catch(() => {
        status.textContent = `Latitude: ${latitude}, Longitude: ${longitude}`;
      });
  }

  function error(err) {
    if (err.code === 1) {
      status.textContent = '❌ Permission denied.';
    } else if (err.code === 2) {
      status.textContent = '⚠️ Position unavailable.';
    } else {
      status.textContent = '❌ Unable to retrieve your location.';
    }
  }
}
 

function init() {
  renderCheckoutSummary();
  bindPlaceOrder();
  bindGeolocation(); // <-- Add this line
}


if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}
})();
