/**
 * SONALI PAITHANI — shared site behaviour
 * Mobile nav, scroll-reveal, product card rendering + filters,
 * WhatsApp link building, and the enquiry/booking modal.
 * No framework, no build step — open the HTML files directly
 * or serve the folder with any static file server.
 */

document.addEventListener("DOMContentLoaded", () => {
  initMobileNav();
  initScrollReveal();
  initWishlistCounter();
  wireWhatsappLinks();
  initModal();
});

/* ---------------- Mobile nav ---------------- */
function initMobileNav() {
  const toggle = document.querySelector(".nav-toggle");
  const drawer = document.querySelector(".mobile-drawer");
  const closeBtn = document.querySelector(".nav-drawer-close");
  if (!toggle || !drawer) return;
  toggle.addEventListener("click", () => {
    drawer.classList.toggle("open");
  });
  if (closeBtn) {
    closeBtn.addEventListener("click", () => drawer.classList.remove("open"));
  }
  drawer.querySelectorAll("a").forEach((a) =>
    a.addEventListener("click", () => drawer.classList.remove("open"))
  );
  drawer.addEventListener("click", (e) => {
    if (e.target === drawer) drawer.classList.remove("open");
  });
}

/* ---------------- Scroll reveal ---------------- */
function initScrollReveal() {
  const items = document.querySelectorAll(".reveal");
  if (!items.length) return;
  const obs = new IntersectionObserver(
    (entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting) {
          e.target.classList.add("in");
          obs.unobserve(e.target);
        }
      });
    },
    { threshold: 0.12 }
  );
  items.forEach((i) => obs.observe(i));
}

/* ---------------- Wishlist / cart counters ---------------- */
const DEMO_STATE = { wishlist: new Set(), cart: new Set() };

async function initWishlistCounter() {
  // If user is authenticated, sync wishlist from backend
  if (window.Api && window.Api.getToken()) {
    try {
      const res = await window.Api.getWishlist();
      if (res && res.ids) {
        DEMO_STATE.wishlist = new Set(res.ids);
      }
    } catch (e) {
      // Keep local state
    }
  }

  // Update badge count
  document.querySelectorAll("[data-wish-count]").forEach((el) => (el.textContent = DEMO_STATE.wishlist.size));

  // Update button active state
  document.querySelectorAll("[data-wish-btn]").forEach((btn) => {
    const id = btn.dataset.wishBtn;
    if (DEMO_STATE.wishlist.has(id)) {
      btn.classList.add("active");
    } else {
      btn.classList.remove("active");
    }

    // Remove old listener if re-initialized
    btn.onclick = async (e) => {
      e.preventDefault();
      const sareeId = btn.dataset.wishBtn;

      if (window.Api && window.Api.getToken()) {
        try {
          const res = await window.Api.toggleWishlist(sareeId);
          if (res.action === 'added') DEMO_STATE.wishlist.add(sareeId);
          else DEMO_STATE.wishlist.delete(sareeId);
        } catch (err) {
          DEMO_STATE.wishlist.has(sareeId) ? DEMO_STATE.wishlist.delete(sareeId) : DEMO_STATE.wishlist.add(sareeId);
        }
      } else {
        DEMO_STATE.wishlist.has(sareeId) ? DEMO_STATE.wishlist.delete(sareeId) : DEMO_STATE.wishlist.add(sareeId);
      }

      btn.classList.toggle("active", DEMO_STATE.wishlist.has(sareeId));
      document.querySelectorAll("[data-wish-count]").forEach((el) => (el.textContent = DEMO_STATE.wishlist.size));
    };
  });
}

/* ---------------- WhatsApp deep links ---------------- */
function wireWhatsappLinks() {
  document.querySelectorAll("[data-wa]").forEach((el) => {
    const msg = encodeURIComponent(el.dataset.wa || "Hi Sonali Paithani, I'd like to know more about your sarees.");
    el.href = `https://wa.me/${SHOP_INFO.whatsapp}?text=${msg}`;
    el.target = "_blank";
    el.rel = "noopener";
  });
}

/* ---------------- Product card rendering ----------------
   Used by index.html (featured strip) and collections.html (full grid + filters).
------------------------------------------------------------------------- */
function formatINR(n) {
  return "₹" + n.toLocaleString("en-IN");
}

function productCardHTML(p) {
  const imgSrc = p.image || `assets/products/${p.id}.jpg`;
  const swatchStyle = `background:linear-gradient(155deg, ${p.swatch[0]}, ${p.swatch[1]})`;
  return `
    <article class="card reveal">
      <div class="card-media">
        ${p.badge ? `<span class="badge">${p.badge}</span>` : ""}
        <button class="wish" data-wish-btn="${p.id}" aria-label="Save to wishlist">&#9825;</button>
        <a href="product.html?id=${p.id}" class="card-media-link" style="${swatchStyle}">
          <img class="card-img" src="${imgSrc}" alt="${p.name}" loading="lazy" onerror="this.style.opacity='0';" />
          <div class="card-gradient-veil"></div>
          <div class="swatch-label">${p.weave}</div>
        </a>
      </div>
      <div class="card-body">
        <div class="card-tags">
          <span class="tag">${p.motif}</span>
          <span class="tag">${(typeof OCCASION_GUIDE !== 'undefined' && OCCASION_GUIDE[p.occasion[0]]?.label) || p.occasion[0]}</span>
        </div>
        <h3><a href="product.html?id=${p.id}">${p.name}</a></h3>
        <div class="card-price">${formatINR(p.price)}</div>
        <div class="card-actions">
          <a href="product.html?id=${p.id}" class="btn btn-outline btn-sm btn-block">View Details</a>
        </div>
      </div>
    </article>
  `;
}

function renderGrid(el, items) {
  el.innerHTML = items.map(productCardHTML).join("");
  initWishlistCounter();
  initScrollReveal();
}

/* ---------------- Enquiry / booking modal ---------------- */
function initModal() {
  const overlay = document.querySelector(".modal-overlay");
  if (!overlay) return;
  const openers = document.querySelectorAll("[data-open-modal]");
  const closeBtn = overlay.querySelector(".modal-close");
  const form = overlay.querySelector("form");
  const successEl = overlay.querySelector(".form-success");
  const nameField = overlay.querySelector('[name="saree"]');
  const custNameField = document.getElementById("f-name");
  const custPhoneField = document.getElementById("f-phone");
  const custDateField = document.getElementById("f-date");

  let currentSareeId = null;

  openers.forEach((btn) =>
    btn.addEventListener("click", () => {
      overlay.classList.add("open");
      if (nameField && btn.dataset.sareeName) nameField.value = btn.dataset.sareeName;
      currentSareeId = btn.dataset.sareeId || null;

      // Prefill if customer is logged in
      if (window.Api) {
        const u = window.Api.getUser();
        if (u) {
          if (custNameField && !custNameField.value && u.name) custNameField.value = u.name;
          if (custPhoneField && !custPhoneField.value && u.phone) custPhoneField.value = u.phone;
        }
      }
    })
  );

  closeBtn?.addEventListener("click", () => overlay.classList.remove("open"));
  overlay.addEventListener("click", (e) => {
    if (e.target === overlay) overlay.classList.remove("open");
  });

  form?.addEventListener("submit", async (e) => {
    e.preventDefault();
    const submitBtn = form.querySelector('button[type="submit"]');
    const origText = submitBtn.textContent;
    submitBtn.disabled = true;
    submitBtn.textContent = "Sending request…";

    const payload = {
      name: custNameField ? custNameField.value.trim() : "",
      phone: custPhoneField ? custPhoneField.value.trim() : "",
      date: custDateField ? custDateField.value : "",
      saree: nameField ? nameField.value.trim() : "",
      saree_id: currentSareeId
    };

    try {
      if (window.Api) {
        await window.Api.createBooking(payload);
      }
      form.style.display = "none";
      successEl.classList.add("show");
    } catch (err) {
      alert("Could not submit request: " + (err.message || "Please check your network."));
      submitBtn.disabled = false;
      submitBtn.textContent = origText;
    }
  });
}
