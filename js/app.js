/* ==========================================================================
   DOKO — Lógica de la página
   Carta, personalización, carrito (guardado en el navegador), horario en
   vivo y envío del pedido formateado a WhatsApp.
   ========================================================================== */
import { CONFIG, CATEGORIES, PRODUCTS, EXTRAS, GALLERY } from './menu.js';

const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];

const CART_KEY = 'doko.cart.v2';
const CUSTOMER_KEY = 'doko.customer.v1';
const DAYS = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];

const products = PRODUCTS.filter((p) => p.available !== false);
const productById = Object.fromEntries(products.map((p) => [p.id, p]));
const categoryById = Object.fromEntries(CATEGORIES.map((c) => [c.id, c]));

/* ---------- Utilidades ---------- */
const money = (n) => '$' + Math.round(n).toLocaleString('es-CO');
const normalize = (s) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
const escapeHtml = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);

function readStore(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}
function writeStore(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* almacenamiento no disponible (modo privado): el carrito vive solo en memoria */
  }
}

const waLink = (text) => `https://wa.me/${CONFIG.whatsapp}?text=${encodeURIComponent(text)}`;

/* ---------- Íconos ---------- */
const ICONS = {
  burger: '<svg viewBox="0 0 24 24"><path d="M4 11c0-3.9 3.6-6.5 8-6.5s8 2.6 8 6.5H4Z"/><path d="M3 14.5h18"/><path d="M5 14.5l2 1.8 2-1.8"/><path d="M4.5 17.5h15v.5a2 2 0 0 1-2 2h-11a2 2 0 0 1-2-2v-.5Z"/><path d="M9 7.5h.01M12 6.8h.01M15 7.5h.01"/></svg>',
  fries: '<svg viewBox="0 0 24 24"><path d="M6 10h12l-1.6 10.2a1 1 0 0 1-1 .8H8.6a1 1 0 0 1-1-.8L6 10Z"/><path d="M8 10 7.4 4M11 10V3M13.5 10l.5-6.5M16 10l1-5"/><path d="M9 14.5c1.6 1.2 4.4 1.2 6 0"/></svg>',
  hotdog: '<svg viewBox="0 0 24 24"><path d="M4.5 12.5a2.5 2.5 0 0 1 0-5h15a2.5 2.5 0 0 1 0 5"/><path d="M3 12.5h18a3.5 3.5 0 0 1-3.5 3.5h-11A3.5 3.5 0 0 1 3 12.5Z"/><path d="M6.5 10c1-1 2 1 3 0s2 1 3 0 2 1 3 0 2 1 2.5 0"/></svg>',
  combo: '<svg viewBox="0 0 24 24"><path d="M5 8h14l-1.2 11.1a2 2 0 0 1-2 1.9H8.2a2 2 0 0 1-2-1.9L5 8Z"/><path d="M9 10V7a3 3 0 0 1 6 0v3"/><path d="M10 14.5l1.5 1.5 3-3"/></svg>',
  side: '<svg viewBox="0 0 24 24"><circle cx="9" cy="12" r="5"/><circle cx="9" cy="12" r="2.2"/><circle cx="16.5" cy="10" r="4"/><circle cx="16.5" cy="10" r="1.6"/></svg>',
  drink: '<svg viewBox="0 0 24 24"><path d="M6.5 8h11l-1.3 12a1 1 0 0 1-1 .9H8.8a1 1 0 0 1-1-.9L6.5 8Z"/><path d="M5.5 8h13"/><path d="M12 8l1.8-5H17"/><path d="M7.2 13h9.6"/></svg>',
  addon: '<svg viewBox="0 0 24 24"><path d="M12 3.5l2.4 5.1 5.6.7-4.1 3.9 1 5.6L12 16.1l-4.9 2.7 1-5.6-4.1-3.9 5.6-.7L12 3.5Z"/></svg>',
};
const UI = {
  plus: '<svg viewBox="0 0 24 24"><path d="M12 5v14M5 12h14"/></svg>',
  minus: '<svg viewBox="0 0 24 24"><path d="M5 12h14"/></svg>',
  close: '<svg viewBox="0 0 24 24"><path d="M6 6l12 12M18 6 6 18"/></svg>',
  check: '<svg viewBox="0 0 24 24"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>',
  trash: '<svg viewBox="0 0 24 24"><path d="M4 7h16M10 11v6M14 11v6M6 7l1 12a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2l1-12M9 7V4h6v3"/></svg>',
  play: '<svg viewBox="0 0 24 24"><path d="M8 5.5v13l11-6.5-11-6.5Z"/></svg>',
};

function media(product, { eager = false } = {}) {
  const icon = ICONS[categoryById[product.category]?.icon] || ICONS.burger;
  if (!product.image) return `<div class="ph">${icon}</div>`;
  return `<img src="${product.image}" alt="${escapeHtml(product.name)}" ${eager ? '' : 'loading="lazy"'} decoding="async">`;
}
const badgeHtml = (p) => (p.badge ? `<span class="badge ${p.badge === 'Top' ? 'badge--top' : ''}">${p.badge === 'Top' ? '🔥 Top' : escapeHtml(p.badge)}</span>` : '');

/* ==========================================================================
   Horario
   ========================================================================== */
const toMinutes = (t) => {
  const [h, m] = t.split(':').map(Number);
  return h * 60 + m;
};
function to12h(t) {
  const [h, m] = t.split(':').map(Number);
  const suffix = h >= 12 ? 'PM' : 'AM';
  const hh = h % 12 || 12;
  return `${hh}${m ? ':' + String(m).padStart(2, '0') : ''} ${suffix}`;
}
function nowInColombia() {
  const d = new Date(Date.now() + CONFIG.utcOffset * 3600 * 1000);
  return { day: d.getUTCDay(), minutes: d.getUTCHours() * 60 + d.getUTCMinutes() };
}
function getStatus() {
  const { day, minutes } = nowInColombia();
  const today = CONFIG.schedule[day];
  if (today) {
    const open = toMinutes(today[0]);
    const close = toMinutes(today[1]);
    if (minutes >= open && minutes < close) {
      const soon = close - minutes <= 30;
      return { open: true, label: soon ? 'Cerramos pronto' : 'Abierto ahora', detail: `Recibimos pedidos hasta las ${to12h(today[1])}` };
    }
    if (minutes < open) return { open: false, label: 'Cerrado', detail: `Abrimos hoy a las ${to12h(today[0])}`, next: `hoy a las ${to12h(today[0])}` };
  }
  for (let i = 1; i <= 7; i++) {
    const d = (day + i) % 7;
    const slot = CONFIG.schedule[d];
    if (slot) {
      const when = i === 1 ? 'mañana' : `el ${DAYS[d].toLowerCase()}`;
      return { open: false, label: 'Cerrado', detail: `Abrimos ${when} a las ${to12h(slot[0])}`, next: `${when} a las ${to12h(slot[0])}` };
    }
  }
  return { open: false, label: 'Cerrado', detail: '' };
}

function renderStatus() {
  const s = getStatus();
  $$('[data-status], [data-status-big]').forEach((el) => {
    el.classList.toggle('is-open', s.open);
    el.classList.toggle('is-closed', !s.open);
  });
  $$('[data-status-label]').forEach((el) => (el.textContent = s.label));
  $$('[data-status-detail]').forEach((el) => (el.textContent = s.detail));

  const { day } = nowInColombia();
  const today = CONFIG.schedule[day];
  const hoursEl = $('[data-today-hours]');
  if (hoursEl) hoursEl.textContent = today ? `${to12h(today[0]).replace(' PM', '')}–${to12h(today[1])}` : 'Cerrado';
  const todayLabel = $('[data-today-label]');
  if (todayLabel) todayLabel.textContent = s.open ? 'abierto hoy' : 'horario de hoy';

  const note = $('[data-closed-note]');
  if (note) {
    note.hidden = s.open;
    if (!s.open) note.innerHTML = `🌙 <span>Ahora estamos cerrados. Puedes enviar tu pedido y lo confirmamos apenas abramos (${escapeHtml(s.next || 'pronto')}).</span>`;
  }
  return s;
}

function renderSchedule() {
  const { day } = nowInColombia();
  const order = [1, 2, 3, 4, 5, 6, 0];
  $('[data-schedule]').innerHTML = order
    .map((d) => {
      const slot = CONFIG.schedule[d];
      return `<li class="${d === day ? 'is-today' : ''}"><span>${DAYS[d]}</span><span>${slot ? `${to12h(slot[0])} – ${to12h(slot[1])}` : 'Cerrado'}</span></li>`;
    })
    .join('');
}

/* ==========================================================================
   Carta
   ========================================================================== */
function itemCard(p) {
  return `
    <article class="item" data-product="${p.id}" tabindex="0" role="button" aria-label="${escapeHtml(p.name)}, ${money(p.price)}. Ver opciones">
      <div class="item__body">
        <h4 class="item__name">${escapeHtml(p.name)}</h4>
        <p class="item__desc">${escapeHtml(p.desc)}</p>
        <div class="item__foot">
          <span class="price">${money(p.price)}</span>
          <span class="item__qty" data-qty-for="${p.id}"></span>
        </div>
      </div>
      <div class="item__media">${badgeHtml(p)}${media(p)}</div>
      <button class="add-btn" type="button" data-quick-add="${p.id}" aria-label="Agregar ${escapeHtml(p.name)}">${UI.plus}</button>
    </article>`;
}

function addonRow(p) {
  return `
    <div class="addon" data-product="${p.id}">
      <span class="addon__name">${escapeHtml(p.name)}</span>
      <span class="addon__price">${money(p.price)}</span>
      <span class="item__qty" data-qty-for="${p.id}"></span>
      <button class="add-btn add-btn--sm" type="button" data-quick-add="${p.id}" aria-label="Agregar ${escapeHtml(p.name)}">${UI.plus}</button>
    </div>`;
}

function renderMenu() {
  $('[data-tabs]').innerHTML = CATEGORIES.filter((c) => products.some((p) => p.category === c.id))
    .map(
      (c, i) =>
        `<button class="tab" type="button" role="tab" aria-selected="${i === 0}" data-tab="${c.id}">${ICONS[c.icon] || ''}${c.name}</button>`
    )
    .join('');

  $('[data-menu]').innerHTML = CATEGORIES.map((c) => {
    const list = products.filter((p) => p.category === c.id);
    if (!list.length) return '';
    const body = c.compact
      ? `<p class="menu__cat-sub">Súmalos a cualquier producto al personalizarlo, o pídelos aparte.</p>
         <div class="addons">${list.map(addonRow).join('')}</div>`
      : `<div class="menu__grid">${list.map(itemCard).join('')}</div>`;
    return `
      <section class="menu__cat" id="cat-${c.id}" data-cat="${c.id}" aria-label="${c.name}">
        <header class="menu__cat-head"><h3>${c.name}</h3><span>${list.length}</span></header>
        ${body}
      </section>`;
  }).join('');

  $('[data-featured]').innerHTML = products
    .filter((p) => p.featured)
    .map(
      (p) => `
      <article class="feat" data-product="${p.id}" data-reveal tabindex="0" role="button" aria-label="${escapeHtml(p.name)}, ${money(p.price)}. Ver opciones">
        <div class="feat__media">${badgeHtml(p)}${media(p)}</div>
        <div class="feat__body">
          <h3 class="feat__name">${escapeHtml(p.name)}</h3>
          <p class="feat__desc">${escapeHtml(p.desc)}</p>
          <div class="feat__row">
            <span class="price">${money(p.price)}</span>
            <button class="add-btn" type="button" data-quick-add="${p.id}" aria-label="Agregar ${escapeHtml(p.name)}">${UI.plus}</button>
          </div>
        </div>
      </article>`
    )
    .join('');
}

/* Pestañas + scroll-spy */
let spyLocked = false;
function setActiveTab(id) {
  const bar = $('[data-tabs]');
  $$('[data-tab]', bar).forEach((t) => {
    const on = t.dataset.tab === id;
    if ((t.getAttribute('aria-selected') === 'true') === on) return;
    t.setAttribute('aria-selected', on);
    if (!on) return;
    // Centra la pestaña moviendo solo la barra de pestañas. scrollIntoView también movería
    // la página y cortaría el scroll que el cliente está haciendo con la rueda del mouse.
    const offset = t.getBoundingClientRect().left - bar.getBoundingClientRect().left - (bar.clientWidth - t.offsetWidth) / 2;
    bar.scrollBy({ left: offset, behavior: 'smooth' });
  });
}
function setupTabs() {
  $('[data-tabs]').addEventListener('click', (e) => {
    const tab = e.target.closest('[data-tab]');
    if (!tab) return;
    clearSearch();
    setActiveTab(tab.dataset.tab);
    spyLocked = true;
    $(`#cat-${tab.dataset.tab}`).scrollIntoView({ behavior: 'smooth', block: 'start' });
    setTimeout(() => (spyLocked = false), 900);
  });

  const observer = new IntersectionObserver(
    (entries) => {
      if (spyLocked) return;
      const visible = entries.filter((e) => e.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
      if (visible[0]) setActiveTab(visible[0].target.dataset.cat);
    },
    { rootMargin: '-35% 0px -55% 0px' }
  );
  $$('[data-cat]').forEach((s) => observer.observe(s));
}

/* Búsqueda */
function clearSearch() {
  const input = $('[data-search]');
  if (input.value) {
    input.value = '';
    applySearch('');
  }
}
function applySearch(q) {
  const term = normalize(q.trim());
  let shown = 0;
  $$('[data-cat]').forEach((section) => {
    let count = 0;
    $$('[data-product]', section).forEach((card) => {
      const p = productById[card.dataset.product];
      const hit = !term || normalize(`${p.name} ${p.desc} ${categoryById[p.category].name}`).includes(term);
      card.hidden = !hit;
      if (hit) count++;
    });
    section.hidden = count === 0;
    shown += count;
  });
  $('[data-menu-empty]').hidden = shown > 0;
}

/* ==========================================================================
   Carrito
   ========================================================================== */
let cart = readStore(CART_KEY, []).filter((l) => productById[l.id] && Array.isArray(l.options));

const lineKey = (l) => [l.id, l.options.join('/'), [...l.extras].sort().join('+'), (l.note || '').trim().toLowerCase()].join('|');
const unitPrice = (l) => productById[l.id].price + l.extras.reduce((sum, e) => sum + (EXTRAS[e]?.price || 0), 0);
const cartCount = () => cart.reduce((n, l) => n + l.qty, 0);
const cartTotal = () => cart.reduce((n, l) => n + unitPrice(l) * l.qty, 0);

function saveCart() {
  writeStore(CART_KEY, cart);
  renderCart();
}

function addToCart({ id, qty = 1, options = [], extras = [], note = '' }) {
  const line = { id, qty, options, extras: extras.filter((e) => EXTRAS[e]), note: note.trim() };
  const existing = cart.find((l) => lineKey(l) === lineKey(line));
  if (existing) existing.qty += qty;
  else cart.push(line);
  saveCart();
  const btn = $('.cart-btn');
  btn.classList.remove('is-bump');
  void btn.offsetWidth;
  btn.classList.add('is-bump');
  toast(`${qty > 1 ? qty + '× ' : ''}${productById[id].name} se sumó a tu pedido`);
}

function renderCart() {
  const count = cartCount();
  const total = cartTotal();

  $$('[data-cart-count]').forEach((el) => {
    el.textContent = count;
    if (el.classList.contains('cart-btn__count')) el.hidden = count === 0;
  });
  $$('[data-cart-total]').forEach((el) => (el.textContent = money(total)));
  $('[data-cart-subtotal]').textContent = money(total);
  $('[data-order-bar]').hidden = count === 0;
  document.body.classList.toggle('has-order-bar', count > 0);

  // contador por producto en la carta
  const perProduct = {};
  cart.forEach((l) => (perProduct[l.id] = (perProduct[l.id] || 0) + l.qty));
  $$('[data-menu] [data-product]').forEach((card) => {
    const n = perProduct[card.dataset.product] || 0;
    card.classList.toggle('in-cart', n > 0);
    $('.item__qty', card).textContent = n ? (card.classList.contains('addon') ? `×${n}` : `${n} en tu pedido`) : '';
  });

  // lista
  $('[data-cart-list]').innerHTML = cart
    .map((l, i) => {
      const p = productById[l.id];
      const meta = [
        p.category === 'adicionales' ? 'Adicional' : '',
        ...l.options.map(escapeHtml),
        ...l.extras.map((e) => `+ ${escapeHtml(EXTRAS[e].name)}`),
        l.note ? `<em>“${escapeHtml(l.note)}”</em>` : '',
      ].filter(Boolean);
      return `
        <li class="line">
          <div class="line__media">${media(p)}</div>
          <div>
            <div class="line__top">
              <div>
                <div class="line__name">${escapeHtml(p.name)}</div>
                ${meta.length ? `<div class="line__meta">${meta.join(' · ')}</div>` : ''}
              </div>
              <button class="line__remove" type="button" data-remove="${i}" aria-label="Quitar ${escapeHtml(p.name)}">${UI.trash}</button>
            </div>
            <div class="line__bottom">
              <div class="stepper stepper--sm">
                <button type="button" data-dec="${i}" aria-label="Quitar uno">${UI.minus}</button>
                <output aria-live="polite">${l.qty}</output>
                <button type="button" data-inc="${i}" aria-label="Agregar uno">${UI.plus}</button>
              </div>
              <span class="line__price">${money(unitPrice(l) * l.qty)}</span>
            </div>
          </div>
        </li>`;
    })
    .join('');

  const empty = count === 0;
  $('[data-cart-empty]').hidden = !empty;
  if (currentStep === 'items') $('[data-cart-foot]').hidden = empty;
  if (empty && currentStep === 'checkout') showStep('items');
}

function setupCartList() {
  $('[data-cart-list]').addEventListener('click', (e) => {
    const inc = e.target.closest('[data-inc]');
    const dec = e.target.closest('[data-dec]');
    const rem = e.target.closest('[data-remove]');
    if (inc) cart[+inc.dataset.inc].qty++;
    else if (dec) {
      const l = cart[+dec.dataset.dec];
      l.qty--;
      if (l.qty <= 0) cart.splice(+dec.dataset.dec, 1);
    } else if (rem) cart.splice(+rem.dataset.remove, 1);
    else return;
    saveCart();
  });
}

/* ==========================================================================
   Diálogo de producto
   ========================================================================== */
const productDialog = $('[data-product-dialog]');
const productForm = $('[data-product-form]');
let activeProduct = null;

function openProduct(id) {
  const p = productById[id];
  if (!p) return;
  activeProduct = p;
  const extras = (p.extras || []).filter((e) => EXTRAS[e]);

  productForm.innerHTML = `
    <div class="pd__media">${badgeHtml(p)}${media(p, { eager: true })}
      <button class="icon-btn pd__close" type="button" data-close-product aria-label="Cerrar">${UI.close}</button>
    </div>
    <div class="pd__scroll">
      <h2 class="pd__title" id="pd-title">${escapeHtml(p.name)}</h2>
      <p class="pd__desc">${escapeHtml(p.desc)}</p>
      <span class="price pd__price">${money(p.price)}</span>

      ${(p.options || [])
        .map(
          (group, g) => `<fieldset class="pd__group">
              <legend>${escapeHtml(group.label)} <small>Elige una</small></legend>
              ${group.choices
                .map(
                  (c, i) => `<label class="opt"><input type="radio" name="opt-${g}" value="${escapeHtml(c)}" ${i === 0 ? 'checked' : ''}><span class="opt__box">${UI.check}</span><span class="opt__name">${escapeHtml(c)}</span></label>`
                )
                .join('')}
            </fieldset>`
        )
        .join('')}

      ${
        extras.length
          ? `<fieldset class="pd__group">
              <legend>Adicionales <small>Opcional</small></legend>
              <div class="pd__extras">
              ${extras
                .map(
                  (e) => `<label class="opt"><input type="checkbox" name="extra" value="${e}"><span class="opt__box">${UI.check}</span><span class="opt__name">${escapeHtml(EXTRAS[e].name)}</span><span class="opt__price">+${money(EXTRAS[e].price)}</span></label>`
                )
                .join('')}
              </div>
            </fieldset>`
          : ''
      }

      <div class="pd__group">
        <label class="pd__label" for="pd-note">¿Alguna indicación? <small>Opcional</small></label>
        <textarea id="pd-note" name="note" rows="2" maxlength="140" placeholder="Ej: sin cebolla, salsas aparte…"></textarea>
      </div>
    </div>
    <div class="pd__foot">
      <div class="stepper">
        <button type="button" data-pd-dec aria-label="Quitar uno">${UI.minus}</button>
        <output data-pd-qty aria-live="polite">1</output>
        <button type="button" data-pd-inc aria-label="Agregar uno">${UI.plus}</button>
      </div>
      <button class="btn btn--flame btn--lg" type="submit" data-pd-add>Agregar · <span data-pd-total>${money(p.price)}</span></button>
    </div>`;

  updateProductTotal();
  openDialog(productDialog);
}

function readProductForm() {
  const fd = new FormData(productForm);
  return {
    id: activeProduct.id,
    qty: +$('[data-pd-qty]', productForm).textContent,
    options: (activeProduct.options || []).map((_, g) => fd.get(`opt-${g}`)),
    extras: fd.getAll('extra'),
    note: fd.get('note') || '',
  };
}
function updateProductTotal() {
  if (!activeProduct) return;
  const sel = readProductForm();
  $('[data-pd-total]', productForm).textContent = money(unitPrice(sel) * sel.qty);
}

function setupProductDialog() {
  productForm.addEventListener('change', updateProductTotal);
  productForm.addEventListener('click', (e) => {
    const qtyEl = $('[data-pd-qty]', productForm);
    if (e.target.closest('[data-pd-inc]')) qtyEl.textContent = Math.min(+qtyEl.textContent + 1, 50);
    else if (e.target.closest('[data-pd-dec]')) qtyEl.textContent = Math.max(+qtyEl.textContent - 1, 1);
    else if (e.target.closest('[data-close-product]')) return closeDialog(productDialog);
    else return;
    updateProductTotal();
  });
  productForm.addEventListener('submit', (e) => {
    e.preventDefault();
    addToCart(readProductForm());
    closeDialog(productDialog);
  });

  // Abrir producto desde tarjetas o "+" rápido
  document.addEventListener('click', (e) => {
    const quick = e.target.closest('[data-quick-add]');
    if (quick) {
      e.stopPropagation();
      const p = productById[quick.dataset.quickAdd];
      // Si tiene elección obligatoria, abrimos el detalle; si no, se agrega directo
      if (p.options?.length) openProduct(p.id);
      else addToCart({ id: p.id });
      return;
    }
    const card = e.target.closest('[data-product]');
    if (!card || card.closest('dialog')) return;
    if (card.classList.contains('addon')) addToCart({ id: card.dataset.product });
    else openProduct(card.dataset.product);
  });
  document.addEventListener('keydown', (e) => {
    if ((e.key === 'Enter' || e.key === ' ') && e.target.matches('[data-product]')) {
      e.preventDefault();
      openProduct(e.target.dataset.product);
    }
  });
}

/* ==========================================================================
   Diálogos (abrir/cerrar con bloqueo de scroll)
   ========================================================================== */
function openDialog(dialog) {
  if (dialog.open) return;
  dialog.showModal();
  document.documentElement.classList.add('is-locked');
}
function closeDialog(dialog) {
  if (!dialog.open) return;
  dialog.close();
}
$$('dialog').forEach((d) => {
  d.addEventListener('close', () => {
    if (!$$('dialog').some((x) => x.open)) document.documentElement.classList.remove('is-locked');
  });
  // Cerrar al tocar el fondo oscuro
  d.addEventListener('click', (e) => {
    if (e.target === d) closeDialog(d);
  });
});

/* ==========================================================================
   Pedido: drawer en 3 pasos (productos → datos → enviado)
   ========================================================================== */
const cartDialog = $('[data-cart-dialog]');
const checkoutForm = $('[data-checkout]');
let currentStep = 'items';
let lastOrder = null;

function showStep(step) {
  currentStep = step;
  $$('[data-step]', cartDialog).forEach((el) => (el.hidden = el.dataset.step !== step));
  $('[data-cart-title]').textContent = { items: 'Tu pedido', checkout: 'Tus datos', sent: 'Enviado' }[step];
  $('[data-cart-back]').hidden = step !== 'checkout';
  $('[data-cart-foot]').hidden = step === 'sent' || (step === 'items' && cartCount() === 0);
  $('[data-checkout-next]').hidden = step !== 'items';
  $('[data-send]').hidden = step !== 'checkout';
  $('[data-delivery-row]').hidden = getMode() !== 'Domicilio';
  const body = $(`[data-step="${step}"]`, cartDialog);
  body.scrollTop = 0;
}

function openCart() {
  renderStatus();
  if (currentStep === 'sent') showStep('items');
  openDialog(cartDialog);
}

const getMode = () => checkoutForm.elements.mode.value;

function renderPayments() {
  const methods = CONFIG.paymentMethods;
  $('[data-payment-chips]').innerHTML = methods
    .map((m, i) => `<label class="chip"><input type="radio" name="payment" value="${escapeHtml(m)}" ${i === 0 ? 'checked' : ''}><span>${escapeHtml(m)}</span></label>`)
    .join('');
  const list = methods.length > 1 ? `${methods.slice(0, -1).join(', ')} y ${methods.at(-1)}` : methods[0];
  $$('[data-payments]').forEach((el) => (el.textContent = list));
}

function syncCheckoutFields() {
  const delivery = getMode() === 'Domicilio';
  const group = $('[data-delivery-fields]');
  group.hidden = !delivery;
  $$('input', group).forEach((i) => {
    if (i.name !== 'reference') i.required = delivery;
  });
  $('[data-delivery-row]').hidden = !delivery;
  $('[data-cash-field]').hidden = checkoutForm.elements.payment.value !== 'Efectivo';
}

function restoreCustomer() {
  const c = readStore(CUSTOMER_KEY, null);
  if (!c) return;
  const f = checkoutForm.elements;
  ['name', 'address', 'hood', 'reference'].forEach((k) => c[k] && (f[k].value = c[k]));
  if (c.mode) f.mode.value = c.mode;
  if (c.payment && CONFIG.paymentMethods.includes(c.payment)) f.payment.value = c.payment;
}

function setError(input, msg) {
  const field = input.closest('.field');
  field.classList.toggle('is-invalid', !!msg);
  let err = $('.field__error', field);
  if (msg) {
    if (!err) {
      err = document.createElement('span');
      err.className = 'field__error';
      field.append(err);
    }
    err.textContent = msg;
  } else err?.remove();
}

function validateCheckout() {
  let firstBad = null;
  $$('input[required]', checkoutForm).forEach((input) => {
    if (input.closest('[hidden]')) return setError(input, '');
    const ok = input.value.trim().length >= 2;
    setError(input, ok ? '' : 'Este dato es necesario para tu pedido');
    if (!ok && !firstBad) firstBad = input;
  });
  if (firstBad) {
    firstBad.focus();
    firstBad.scrollIntoView({ block: 'center', behavior: 'smooth' });
  }
  return !firstBad;
}

function orderId() {
  const n = Math.floor(1000 + Math.random() * 9000);
  return `DK-${n}`;
}

function buildMessage(data, id) {
  const lines = [];
  lines.push(`🔥 *NUEVO PEDIDO DOKO* · #${id}`);
  lines.push('');
  lines.push('*Pedido:*');
  cart.forEach((l) => {
    const p = productById[l.id];
    const label = p.category === 'adicionales' ? `Adicional: ${p.name}` : p.name;
    lines.push(`• ${l.qty}x ${label}${l.options.length ? ` (${l.options.join(', ')})` : ''} — ${money(unitPrice(l) * l.qty)}`);
    l.extras.forEach((e) => lines.push(`   + ${EXTRAS[e].name}`));
    if (l.note) lines.push(`   📝 ${l.note}`);
  });
  lines.push('');
  lines.push(`*Subtotal:* ${money(cartTotal())}`);
  if (data.mode === 'Domicilio') lines.push('🛵 Domicilio: por confirmar según el barrio');
  lines.push('');
  lines.push(`*Nombre:* ${data.name}`);
  lines.push(`*Entrega:* ${data.mode === 'Domicilio' ? 'Domicilio 🛵' : 'Recoger en DOKO 🛍️'}`);
  if (data.mode === 'Domicilio') {
    lines.push(`*Dirección:* ${data.address}`);
    lines.push(`*Barrio:* ${data.hood}`);
    if (data.reference) lines.push(`*Referencia:* ${data.reference}`);
  }
  lines.push(`*Pago:* ${data.payment}${data.payment === 'Efectivo' && data.cash ? ` (pago con $${data.cash})` : ''}`);
  if (data.notes) lines.push(`*Notas:* ${data.notes}`);
  lines.push('');
  lines.push('_Pedido hecho desde la página web_ 🌐');
  return lines.join('\n');
}

function sendOrder() {
  if (!cart.length) return showStep('items');
  if (!validateCheckout()) return;

  const fd = new FormData(checkoutForm);
  const data = Object.fromEntries(['mode', 'name', 'address', 'hood', 'reference', 'payment', 'cash', 'notes'].map((k) => [k, (fd.get(k) || '').toString().trim()]));
  data.cash = data.cash.replace(/[^\d]/g, '') ? Number(data.cash.replace(/[^\d]/g, '')).toLocaleString('es-CO') : '';

  if (fd.get('remember')) {
    const { name, address, hood, reference, mode, payment } = data;
    writeStore(CUSTOMER_KEY, { name, address, hood, reference, mode, payment });
  } else {
    try { localStorage.removeItem(CUSTOMER_KEY); } catch { /* sin almacenamiento */ }
  }

  const id = orderId();
  const url = waLink(buildMessage(data, id));
  lastOrder = { id, url };

  $('[data-order-id]').textContent = `#${id}`;
  $('[data-wa-retry]').href = url;
  showStep('sent');

  const win = window.open(url, '_blank', 'noopener');
  if (!win) window.location.href = url;
}

function setupCheckout() {
  renderPayments();
  restoreCustomer();
  syncCheckoutFields();

  checkoutForm.addEventListener('change', syncCheckoutFields);
  checkoutForm.addEventListener('input', (e) => {
    if (e.target.closest('.field.is-invalid') && e.target.value.trim().length >= 2) setError(e.target, '');
  });
  checkoutForm.addEventListener('submit', (e) => {
    e.preventDefault();
    sendOrder();
  });

  $('[data-checkout-next]').addEventListener('click', () => {
    showStep('checkout');
    setTimeout(() => {
      const first = $$('input[required]', checkoutForm).find((i) => !i.closest('[hidden]') && !i.value.trim());
      first?.focus({ preventScroll: true });
    }, 350);
  });
  $('[data-send]').addEventListener('click', sendOrder);
  $('[data-cart-back]').addEventListener('click', () => showStep('items'));
  $('[data-new-order]').addEventListener('click', () => {
    cart = [];
    saveCart();
    showStep('items');
    closeDialog(cartDialog);
    toast('¡Listo! Puedes armar un pedido nuevo');
  });

  $$('[data-open-cart]').forEach((b) => b.addEventListener('click', openCart));
  $$('[data-close-cart]').forEach((b) =>
    b.addEventListener('click', () => {
      closeDialog(cartDialog);
      if (b.hasAttribute('data-goto-menu')) $('#carta').scrollIntoView({ behavior: 'smooth' });
    })
  );
}

/* ==========================================================================
   Extras de la página
   ========================================================================== */
function toast(text) {
  const wrap = $('[data-toasts]');
  const el = document.createElement('div');
  el.className = 'toast';
  el.innerHTML = `${UI.check}<span>${escapeHtml(text)}</span>`;
  wrap.append(el);
  setTimeout(() => {
    el.classList.add('is-out');
    el.addEventListener('animationend', () => el.remove(), { once: true });
  }, 2200);
  while (wrap.children.length > 3) wrap.firstElementChild.remove();
}

function renderGallery() {
  $('[data-gallery]').innerHTML = GALLERY.map(
    (g) => `
    <a class="reel" href="${g.url}" target="_blank" rel="noopener" aria-label="Ver en Instagram: ${escapeHtml(g.alt)}">
      <img src="${g.img}" alt="${escapeHtml(g.alt)}" loading="lazy" decoding="async" width="360" height="640">
      <span class="reel__play">${UI.play}Ver reel</span>
    </a>`
  ).join('');
}

function fillContactInfo() {
  const greet = waLink(CONFIG.whatsappGreeting);
  $$('[data-wa-direct]').forEach((a) => (a.href = greet));
  $$('[data-wa-display]').forEach((el) => (el.textContent = CONFIG.whatsappDisplay));
  $$('[data-ig-link]').forEach((a) => (a.href = CONFIG.instagram));
  $$('[data-ig-handle]').forEach((el) => (el.textContent = CONFIG.instagramHandle));
  $$('[data-followers]').forEach((el) => (el.textContent = CONFIG.followers));
  $$('[data-location-note]').forEach((el) => (el.textContent = CONFIG.locationNote));
  $$('[data-delivery-note]').forEach((el) => (el.textContent = CONFIG.deliveryNote));
  $$('[data-year]').forEach((el) => (el.textContent = new Date().getFullYear()));
}

function setupHeader() {
  const header = $('[data-header]');
  const onScroll = () => header.classList.toggle('is-scrolled', window.scrollY > 8);
  onScroll();
  window.addEventListener('scroll', onScroll, { passive: true });

  const nav = $('[data-nav]');
  const toggle = $('[data-nav-toggle]');
  const setNav = (open) => {
    nav.classList.toggle('is-open', open);
    toggle.setAttribute('aria-expanded', open);
    toggle.setAttribute('aria-label', open ? 'Cerrar menú' : 'Abrir menú');
  };
  toggle.addEventListener('click', () => setNav(!nav.classList.contains('is-open')));

  // En celular, el botón flotante de WhatsApp se oculta mientras se recorre la carta
  new IntersectionObserver(([entry]) => document.body.classList.toggle('in-menu', entry.isIntersecting), {
    rootMargin: '-20% 0px -20% 0px',
  }).observe($('#carta'));
  nav.addEventListener('click', (e) => e.target.closest('a') && setNav(false));
  document.addEventListener('keydown', (e) => e.key === 'Escape' && setNav(false));
}

function setupMarquee() {
  // Duplicamos el contenido para que el desplazamiento sea infinito
  $$('[data-marquee]').forEach((track) => (track.innerHTML += track.innerHTML + track.innerHTML));
}

function setupReveal() {
  const els = $$('[data-reveal]');
  if (!('IntersectionObserver' in window)) return els.forEach((el) => el.classList.add('is-in'));
  const io = new IntersectionObserver(
    (entries) =>
      entries.forEach((e) => {
        if (!e.isIntersecting) return;
        const siblings = [...e.target.parentElement.children].filter((c) => c.hasAttribute('data-reveal'));
        e.target.style.transitionDelay = `${Math.min(siblings.indexOf(e.target), 4) * 70}ms`;
        e.target.classList.add('is-in');
        io.unobserve(e.target);
      }),
    { rootMargin: '0px 0px -8% 0px' }
  );
  els.forEach((el) => io.observe(el));
}

/* ==========================================================================
   Inicio
   ========================================================================== */
document.documentElement.classList.remove('no-js');
fillContactInfo();
renderMenu();
renderGallery();
renderSchedule();
renderStatus();
setInterval(renderStatus, 60 * 1000);
setupHeader();
setupMarquee();
setupTabs();
setupProductDialog();
setupCartList();
setupCheckout();
renderCart();
showStep('items');
setupReveal();

$('[data-search]').addEventListener('input', (e) => applySearch(e.target.value));
