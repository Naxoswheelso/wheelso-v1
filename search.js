// ============================================
// WHEELSO — Search Results Page
// ============================================

// ============================================
// API CONFIG (same as script.js)
// ============================================
const API_BASE = 'https://wheelso-backend-production.up.railway.app';

async function apiGet(path) {
  const res = await fetch(`${API_BASE}${path}`);
  if (!res.ok) throw new Error(`GET ${path} failed: ${res.status}`);
  return res.json();
}

async function apiPost(path, body) {
  const res = await fetch(`${API_BASE}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const msg = data.detail ? `${data.error}: ${data.detail}` : (data.error || `POST ${path} failed: ${res.status}`);
    const err = new Error(msg);
    err.data = data;
    throw err;
  }
  return data;
}

function frontendValueToStationCode(v) {
  return (v || '').toUpperCase();
}

// ============================================
// GA4 ANALYTICS (funnel events + client_id capture)
// ============================================
const GA_MEASUREMENT_ID = 'G-JW04MNN2T0';
let gaClientId = null;
let gaSessionId = null;

// Fire a GA4 event only if gtag exists (no-op without consent / on payment pages).
function gaEvent(name, params) {
  try { if (window.gtag) window.gtag('event', name, params || {}); } catch (_) {}
}

// Read client_id + session_id from GA so they're ready to attach to the booking.
// Best-effort: if gtag isn't ready or analytics consent is denied, they stay null
// and the backend simply skips the server-side purchase event (no error).
function captureGaIds() {
  try {
    if (!window.gtag) return;
    window.gtag('get', GA_MEASUREMENT_ID, 'client_id', (id) => { if (id) gaClientId = id; });
    window.gtag('get', GA_MEASUREMENT_ID, 'session_id', (id) => { if (id) gaSessionId = id; });
  } catch (_) {}
}
captureGaIds();
setTimeout(captureGaIds, 1500);
setTimeout(captureGaIds, 4000);

// Sticky header
const header = document.getElementById('siteHeader');
window.addEventListener('scroll', () => {
  if (window.scrollY > 8) header.classList.add('scrolled');
  else header.classList.remove('scrolled');
}, { passive: true });

// ============================================
// PARSE URL PARAMS
// ============================================
const urlParams = new URLSearchParams(window.location.search);
const searchCtx = {
  pickup: urlParams.get('pickup') || '',
  return: urlParams.get('return') || '',
  from: urlParams.get('from') || '',
  fromTime: urlParams.get('fromTime') || '10:00',
  to: urlParams.get('to') || '',
  toTime: urlParams.get('toTime') || '10:00',
  age: urlParams.get('age') || '26-69',
  promo: urlParams.get('promo') || ''
};
let promoState = { applied: false, discountAmount: 0, code: null };

// Young (21-25) and senior (70-75) drivers cannot take Full Protection (FDW / zero excess).
// Used to gate the protection step and as a submit-time safety net (backend also enforces).
function isRestrictedAge(age) {
  return age === '21-25' || age === '70-75';
}

// Compute days
function computeDays() {
  if (!searchCtx.from || !searchCtx.to) return 3;
  const d1 = new Date(searchCtx.from);
  const d2 = new Date(searchCtx.to);
  const diff = Math.round((d2 - d1) / 86400000);
  return diff > 0 ? diff : 3;
}
let rentalDays = computeDays();
let isOneWay = false;
let oneWayFeeGross = 0;

// ─── MAX RENTAL DAYS ───
const MAX_RENTAL_DAYS = 28;

function bestPrice(v) {
  return Math.round(v.price * 0.90 * 100) / 100;
}

// If rental exceeds 28 days, redirect back with error
if (rentalDays > MAX_RENTAL_DAYS) {
  const subtitleEl2 = document.getElementById('resultsSubtitle');
  if (subtitleEl2) subtitleEl2.textContent = '';
  const fleetGrid2 = document.getElementById('fleetGrid');
  const resultsEmpty2 = document.getElementById('resultsEmpty');
  if (fleetGrid2) fleetGrid2.innerHTML = '';
  if (resultsEmpty2) {
    resultsEmpty2.innerHTML = `
      <div style="text-align:center;padding:60px 20px;">
        <div style="font-size:56px;margin-bottom:20px;">📅</div>
        <h3 style="font-size:22px;font-weight:700;color:#093D5E;margin:0 0 12px;font-family:'Bricolage Grotesque',sans-serif;">Maximum rental period exceeded</h3>
        <p style="color:#64748b;font-size:15px;line-height:1.6;max-width:440px;margin:0 auto;">
          We currently offer rentals of up to 28 days. Please adjust your dates and try again.
        </p>
        <a href="index.html" style="display:inline-block;margin-top:24px;padding:12px 28px;background:#093D5E;color:#fff;border-radius:10px;font-weight:700;text-decoration:none;">Change dates</a>
      </div>`;
    resultsEmpty2.hidden = false;
  }
  // Stop all further execution
  throw new Error('MAX_DAYS_EXCEEDED');
}

// Location labels
const LOCATION_LABELS = {
  'ath-airport': 'Athens Airport',
  'ath-downtown': 'Athens Downtown',
  'myk-airport': 'Mykonos Airport',
  'myk-port': 'Mykonos Port',
  'par-airport': 'Paros Airport',
  'par-port': 'Paros Port',
  'nax-airport': 'Naxos Airport',
  'nax-port': 'Naxos Port'
};

function formatDateShort(iso) {
  if (!iso) return '—';
  const d = new Date(iso);
  const dow = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'][d.getDay()];
  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  return `${dow} ${d.getDate()} ${months[d.getMonth()]}`;
}

// Populate search summary
document.getElementById('summaryPickup').textContent = LOCATION_LABELS[searchCtx.pickup] || 'Athens Airport';
const datesText = `${formatDateShort(searchCtx.from)} ${searchCtx.fromTime} → ${formatDateShort(searchCtx.to)} ${searchCtx.toTime}`;
document.getElementById('summaryDates').textContent = datesText;
document.getElementById('summaryAge').textContent = searchCtx.age;

// Subtitle
const subtitleEl = document.getElementById('resultsSubtitle');
if (subtitleEl) subtitleEl.textContent = t('resultsSubtitleFor', { n: rentalDays, unit: rentalDays === 1 ? t('day') : t('days'), place: LOCATION_LABELS[searchCtx.pickup]?.split(' ')[0] || 'Greece' });

// ─── MODIFY PANEL ───
const modifyPanel = document.getElementById('modifyPanel');
const searchSummaryBtn = document.getElementById('searchSummary');

// Toggle modify panel open/close
searchSummaryBtn.addEventListener('click', () => {
  const isOpen = !modifyPanel.hidden;
  modifyPanel.hidden = isOpen;
  searchSummaryBtn.setAttribute('aria-expanded', !isOpen);
  if (!isOpen) populateModifyPanel();
});

// Close on Escape
document.addEventListener('keydown', e => {
  if (e.key === 'Escape' && !modifyPanel.hidden) {
    modifyPanel.hidden = true;
    searchSummaryBtn.setAttribute('aria-expanded', 'false');
  }
});

function populateModifyPanel() {
  const fromEl = document.getElementById('modifyFrom');
  const toEl = document.getElementById('modifyTo');
  const fromTimeEl = document.getElementById('modifyFromTime');
  const toTimeEl = document.getElementById('modifyToTime');
  const ageEl = document.getElementById('modifyAge');
  const pickupEl = document.getElementById('modifyPickup');
  const returnEl = document.getElementById('modifyReturn');

  if (fromEl) fromEl.value = searchCtx.from || '';
  if (toEl) toEl.value = searchCtx.to || '';
  if (fromTimeEl) fromTimeEl.value = searchCtx.fromTime || '10:00';
  if (toTimeEl) toTimeEl.value = searchCtx.toTime || '10:00';
  if (ageEl) ageEl.value = searchCtx.age || '26-69';

  // Match pickup dropdown to current value
  if (pickupEl && searchCtx.pickup) {
    [...pickupEl.options].forEach(o => {
      if (o.value.toLowerCase() === searchCtx.pickup.toLowerCase()) pickupEl.value = o.value;
    });
  }
  // Match return dropdown — default to same as pickup
  if (returnEl) {
    const returnVal = searchCtx.return || searchCtx.pickup;
    [...returnEl.options].forEach(o => {
      if (o.value.toLowerCase() === returnVal.toLowerCase()) returnEl.value = o.value;
    });
  }
}

// Search button → rebuild URL and reload
document.getElementById('modifySearchBtn').addEventListener('click', () => {
  const from = document.getElementById('modifyFrom').value;
  const to = document.getElementById('modifyTo').value;
  const fromTime = document.getElementById('modifyFromTime').value;
  const toTime = document.getElementById('modifyToTime').value;
  const age = document.getElementById('modifyAge').value;
  const pickup = document.getElementById('modifyPickup').value;
  const returnVal = document.getElementById('modifyReturn').value;

  if (!pickup || !from || !to) {
    alert('Please fill in all required fields.');
    return;
  }
  if (from >= to) {
    alert('Return date must be after pick-up date.');
    return;
  }
  const _rentalDays = Math.round((new Date(to) - new Date(from)) / 86400000);
  if (_rentalDays > 28) { alert('Maximum rental period is 28 days. Please choose shorter dates.'); return; }

  const params = new URLSearchParams({ pickup, from, to, fromTime, toTime, age });
  if (returnVal && returnVal !== pickup) params.set('return', returnVal);

  window.location.href = `search.html?${params.toString()}`;
});

// ============================================
// VEHICLE DATA (same as main page)
// ============================================
// ============================================
// VEHICLE DATA — loaded from API
// ============================================
let VEHICLES = [
  { code: 'MCMR', category: 'economy', name: 'Toyota Aygo', similar: 'or similar', seats: 4, bags: 2, doors: 3, transmission: 'manual', price: 22 },
  { code: 'MDMR', category: 'economy', name: 'Toyota Aygo', similar: 'or similar', seats: 4, bags: 2, doors: 5, transmission: 'manual', price: 24 },
  { code: 'MCAR', category: 'economy', name: 'Kia Picanto', similar: 'or similar', seats: 4, bags: 2, doors: 5, transmission: 'auto', price: 28 },
  { code: 'ECMR', category: 'compact', name: 'Nissan Micra', similar: 'or similar', seats: 5, bags: 2, doors: 5, transmission: 'manual', price: 30 },
  { code: 'EDMR', category: 'compact', name: 'Peugeot 208', similar: 'or similar', seats: 5, bags: 2, doors: 5, transmission: 'manual', price: 32 },
  { code: 'ECAR', category: 'compact', name: 'Nissan Micra Auto', similar: 'or similar', seats: 5, bags: 2, doors: 5, transmission: 'auto', price: 36 },
  { code: 'CCMR', category: 'intermediate', name: 'Kia Rio', similar: 'or similar', seats: 5, bags: 3, doors: 5, transmission: 'manual', price: 38 },
  { code: 'CDMR', category: 'intermediate', name: 'Fiat Tipo', similar: 'Hatchback', seats: 5, bags: 3, doors: 5, transmission: 'manual', price: 40 },
  { code: 'CFMR', category: 'intermediate', name: 'Kia Stonic', similar: 'or similar', seats: 5, bags: 3, doors: 5, transmission: 'manual', price: 44 },
  { code: 'CFAR', category: 'intermediate', name: 'Kia Stonic Auto', similar: 'or similar', seats: 5, bags: 3, doors: 5, transmission: 'auto', price: 48 },
  { code: 'IFAR', category: 'suv', name: 'VW T-Cross Auto', similar: 'or similar', seats: 5, bags: 4, doors: 5, transmission: 'auto', price: 58 },
  { code: 'SFAR', category: 'suv', name: 'BMW X1 Auto', similar: 'or similar', seats: 5, bags: 4, doors: 5, transmission: 'auto', price: 85 },
  { code: 'ICMR', category: 'premium', name: 'Premium Sedan', similar: 'or similar', seats: 5, bags: 4, doors: 4, transmission: 'manual', price: 55 },
  { code: 'CWMR', category: 'premium', name: 'Premium Wagon', similar: 'or similar', seats: 5, bags: 5, doors: 5, transmission: 'manual', price: 52 },
  { code: 'FVMR', category: 'van', name: '7-Seater Van', similar: 'or similar', seats: 7, bags: 5, doors: 5, transmission: 'manual', price: 65 }
];

function mapBackendCarToVehicle(c) {
  const cat = (c.category || '').toLowerCase();
  const knownCats = ['economy', 'compact', 'intermediate', 'suv', 'premium', 'van'];
  const category = knownCats.includes(cat) ? cat : 'compact';
  return {
    code: c.code,
    category,
    name: c.name || c.code,
    similar: c.similar || 'or similar',
    seats: c.seats ?? 5,
    bags: c.bags ?? 2,
    doors: c.doors ?? 5,
    transmission: (c.transmission || 'manual').toLowerCase(),
    price: c.price ?? 0,
    upon_request: !!c.upon_request,
    admin_upon_request: !!c.upon_request,
    image_url: c.image_url || null
  };
}

function carImageSrc(imageUrl) {
  if (!imageUrl) return '';
  if (/^https?:\/\//i.test(imageUrl)) return imageUrl;
  return API_BASE + imageUrl;
}

async function loadVehiclesFromAPI() {
  try {
    const res = await apiGet('/api/cars');
    const cars = Array.isArray(res) ? res : (res.cars || []);
    if (cars.length > 0) {
      VEHICLES = cars.map(mapBackendCarToVehicle);
      filterAndSort();
    }
  } catch (err) {
    console.warn('[Wheelso] Could not load cars from API, using fallback:', err.message);
  }
}

const CAR_SVGS = {
  economy: `<svg viewBox="0 0 200 100" xmlns="http://www.w3.org/2000/svg"><path d="M30 70 L40 70 C40 78 47 85 55 85 C63 85 70 78 70 70 L130 70 C130 78 137 85 145 85 C153 85 160 78 160 70 L175 70 L175 55 L160 50 L135 32 C130 28 122 25 113 25 L72 25 C65 25 58 28 53 33 L38 50 L25 53 C20 54 17 58 17 63 L17 68 Z" fill="#1C5875"/><path d="M75 30 L110 30 C115 30 119 32 121 35 L130 47 L70 47 L75 30 Z" fill="#a8c9d9" opacity="0.7"/><circle cx="55" cy="78" r="10" fill="#093D5E"/><circle cx="55" cy="78" r="4" fill="#CFDD28"/><circle cx="145" cy="78" r="10" fill="#093D5E"/><circle cx="145" cy="78" r="4" fill="#CFDD28"/></svg>`,
  compact: `<svg viewBox="0 0 200 100" xmlns="http://www.w3.org/2000/svg"><path d="M25 72 L36 72 C36 80 43 87 51 87 C59 87 66 80 66 72 L134 72 C134 80 141 87 149 87 C157 87 164 80 164 72 L180 72 L180 55 L162 48 L138 28 C133 24 125 22 116 22 L70 22 C63 22 56 25 51 30 L34 48 L20 52 C15 53 12 57 12 62 L12 70 Z" fill="#1C5875"/><path d="M73 26 L113 26 C118 26 122 28 125 31 L135 46 L65 46 L73 26 Z" fill="#a8c9d9" opacity="0.7"/><circle cx="51" cy="80" r="11" fill="#093D5E"/><circle cx="51" cy="80" r="5" fill="#CFDD28"/><circle cx="149" cy="80" r="11" fill="#093D5E"/><circle cx="149" cy="80" r="5" fill="#CFDD28"/></svg>`,
  intermediate: `<svg viewBox="0 0 200 100" xmlns="http://www.w3.org/2000/svg"><path d="M20 73 L34 73 C34 82 42 89 51 89 C60 89 68 82 68 73 L132 73 C132 82 140 89 149 89 C158 89 166 82 166 73 L184 73 L184 56 L164 47 L140 24 C135 20 127 18 117 18 L67 18 C60 18 53 21 48 26 L30 47 L16 51 C10 52 7 57 7 62 L7 71 Z" fill="#1C5875"/><path d="M72 22 L115 22 C120 22 125 24 128 28 L138 44 L62 44 L72 22 Z" fill="#a8c9d9" opacity="0.7"/><circle cx="51" cy="80" r="12" fill="#093D5E"/><circle cx="51" cy="80" r="5" fill="#CFDD28"/><circle cx="149" cy="80" r="12" fill="#093D5E"/><circle cx="149" cy="80" r="5" fill="#CFDD28"/></svg>`,
  suv: `<svg viewBox="0 0 200 100" xmlns="http://www.w3.org/2000/svg"><path d="M18 70 L32 70 C32 80 40 88 50 88 C60 88 68 80 68 70 L132 70 C132 80 140 88 150 88 C160 88 168 80 168 70 L186 70 L186 48 L168 38 L142 18 C137 14 128 12 118 12 L65 12 C57 12 50 15 45 21 L28 40 L14 44 C9 45 5 50 5 55 L5 68 Z" fill="#1C5875"/><path d="M70 16 L115 16 C120 16 125 18 128 22 L140 38 L58 38 L70 16 Z" fill="#a8c9d9" opacity="0.7"/><circle cx="50" cy="78" r="13" fill="#093D5E"/><circle cx="50" cy="78" r="6" fill="#CFDD28"/><circle cx="150" cy="78" r="13" fill="#093D5E"/><circle cx="150" cy="78" r="6" fill="#CFDD28"/></svg>`,
  premium: `<svg viewBox="0 0 200 100" xmlns="http://www.w3.org/2000/svg"><path d="M15 73 L30 73 C30 82 38 90 48 90 C58 90 66 82 66 73 L134 73 C134 82 142 90 152 90 C162 90 170 82 170 73 L188 73 L188 54 L165 44 L138 20 C133 16 124 14 114 14 L62 14 C55 14 47 17 42 22 L24 44 L11 48 C5 50 2 54 2 59 L2 71 Z" fill="#093D5E"/><path d="M68 18 L112 18 C117 18 122 20 125 24 L137 42 L56 42 L68 18 Z" fill="#a8c9d9" opacity="0.6"/><circle cx="48" cy="80" r="12" fill="#062b42"/><circle cx="48" cy="80" r="5" fill="#CFDD28"/><circle cx="152" cy="80" r="12" fill="#062b42"/><circle cx="152" cy="80" r="5" fill="#CFDD28"/></svg>`,
  van: `<svg viewBox="0 0 200 100" xmlns="http://www.w3.org/2000/svg"><path d="M12 72 L28 72 C28 81 36 89 46 89 C56 89 64 81 64 72 L136 72 C136 81 144 89 154 89 C164 89 172 81 172 72 L192 72 L192 28 C192 22 187 18 181 18 L30 18 C22 18 16 24 16 32 L16 50 L8 53 C4 55 2 58 2 62 L2 70 Z" fill="#1C5875"/><path d="M30 25 L80 25 L80 45 L30 45 Z M85 25 L130 25 L130 45 L85 45 Z M135 25 L180 25 L180 45 L135 45 Z" fill="#a8c9d9" opacity="0.6"/><circle cx="46" cy="80" r="12" fill="#093D5E"/><circle cx="46" cy="80" r="5" fill="#CFDD28"/><circle cx="154" cy="80" r="12" fill="#093D5E"/><circle cx="154" cy="80" r="5" fill="#CFDD28"/></svg>`
};

// Returns the inline SVG illustration for a category, with a safe default
// (e.g. 'mini' has no dedicated SVG → fall back to economy).
function carSvg(category) {
  return CAR_SVGS[category] || CAR_SVGS.economy;
}

// If a real (Cloudinary) car photo fails to load, swap the broken <img> for
// the category SVG so the user never sees a broken-image placeholder.
function onCarImgError(img, category) {
  img.insertAdjacentHTML('afterend', carSvg(category));
  img.remove();
}

// Car categories — loaded dynamically from API (fallback to hardcoded)
let CATEGORY_LABELS = {
  mini: 'Mini', economy: 'Economy', compact: 'Compact',
  intermediate: 'Intermediate', suv: 'SUV', premium: 'Premium', van: '7-Seater'
};

async function loadCategoriesFromAPI() {
  try {
    const res = await apiGet('/api/categories');
    const cats = Array.isArray(res) ? res : (res.categories || []);
    if (cats.length > 0) {
      CATEGORY_LABELS = {};
      cats.forEach(c => { CATEGORY_LABELS[c.code.toLowerCase()] = c.label; });
    }
  } catch (err) {
    console.warn('[Wheelso] Could not load categories from API, using defaults');
  }
}

const ICON_SEATS = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>';
const ICON_BAGS = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="7" width="18" height="13" rx="2"/><path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>';
const ICON_DOORS = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 21V5a2 2 0 0 0-2-2H7a2 2 0 0 0-2 2v16"/><line x1="3" y1="21" x2="21" y2="21"/><circle cx="15" cy="13" r="0.5" fill="currentColor"/></svg>';
const ICON_TRANS_AUTO = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><text x="12" y="16" text-anchor="middle" font-size="10" font-weight="700" fill="currentColor" stroke="none">A</text></svg>';
const ICON_TRANS_MAN = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><text x="12" y="16" text-anchor="middle" font-size="10" font-weight="700" fill="currentColor" stroke="none">M</text></svg>';

function escapeHtml(value) {
  if (value === null || value === undefined) return '';
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function renderVehicleCard(v) {
  const isAuto = v.transmission === 'auto';
  const totalForStay = (bestPrice(v) * rentalDays).toFixed(2);
  return `
    <article class="vehicle-card" data-category="${escapeHtml(v.category)}" data-code="${escapeHtml(v.code)}" data-transmission="${escapeHtml(v.transmission)}" data-price="${escapeHtml(v.price)}">
      <div class="vehicle-image">
        ${isAuto ? `<span class="vehicle-badge transmission-auto">${t('auto')}</span>` : `<span class="vehicle-badge">${t('manual')}</span>`}
        ${v.admin_upon_request ? `<span class="vehicle-badge on-request">${t('onRequest')}</span>` : ''}
        ${v.image_url
          ? `<img src="${escapeHtml(carImageSrc(v.image_url))}" alt="${escapeHtml(v.name)}" loading="lazy" decoding="async" onerror="onCarImgError(this, '${escapeHtml(v.category)}')" style="width:100%;height:100%;object-fit:contain;">`
          : carSvg(v.category)}
      </div>
      <div class="vehicle-body">
        <div class="vehicle-header">
          <span class="vehicle-category">${escapeHtml(CATEGORY_LABELS[v.category])} · ${escapeHtml(v.code)}</span>
          <h3 class="vehicle-name">${escapeHtml(v.name)}</h3>
          <span class="vehicle-similar">${escapeHtml(v.similar)}</span>
        </div>
        <div class="vehicle-specs">
          <div class="spec">${ICON_SEATS}<span class="spec-value">${escapeHtml(v.seats)}</span></div>
          <div class="spec">${ICON_BAGS}<span class="spec-value">${escapeHtml(v.bags)}</span></div>
          <div class="spec">${ICON_DOORS}<span class="spec-value">${escapeHtml(v.doors)}</span></div>
          <div class="spec">${isAuto ? ICON_TRANS_AUTO : ICON_TRANS_MAN}<span class="spec-value">${isAuto ? t('autoSpec') : t('manSpec')}</span></div>
        </div>
        <div class="vehicle-footer">
          <div class="vehicle-price">
            <span class="price-from">${t('from')}</span>
            <span><span class="price-amount">€${bestPrice(v).toFixed(2)}</span><span class="price-period">${t('perDay')}</span></span>
            <span class="price-total-stay">€${totalForStay} ${t('totalForDays', { n: rentalDays, unit: rentalDays === 1 ? t('day') : t('days') })}</span>
            ${v.admin_upon_request ? `<span class="on-request-note">${t('noPaymentNow')}</span>` : ''}
          </div>
          <span class="vehicle-cta">
            ${t('select')}
            <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
          </span>
        </div>
      </div>
    </article>
  `;
}

// ─── LOADING SKELETON ───
function showLoadingSkeleton() {
  const skeletonCard = `
    <div class="vehicle-card skeleton-card" style="pointer-events:none;">
      <div class="vehicle-image" style="background:linear-gradient(90deg,#e8eef3 25%,#d0dce5 50%,#e8eef3 75%);background-size:200% 100%;animation:shimmer 1.4s infinite;border-radius:12px 12px 0 0;height:160px;"></div>
      <div class="vehicle-info" style="padding:16px;">
        <div style="height:12px;width:60%;background:#e8eef3;border-radius:6px;margin-bottom:10px;animation:shimmer 1.4s infinite;background-size:200% 100%;background-image:linear-gradient(90deg,#e8eef3 25%,#d0dce5 50%,#e8eef3 75%);"></div>
        <div style="height:20px;width:80%;background:#e8eef3;border-radius:6px;margin-bottom:16px;animation:shimmer 1.4s infinite;background-size:200% 100%;background-image:linear-gradient(90deg,#e8eef3 25%,#d0dce5 50%,#e8eef3 75%);"></div>
        <div style="display:flex;gap:8px;margin-bottom:16px;">
          <div style="height:10px;width:30%;background:#e8eef3;border-radius:4px;animation:shimmer 1.4s infinite;background-size:200% 100%;background-image:linear-gradient(90deg,#e8eef3 25%,#d0dce5 50%,#e8eef3 75%);"></div>
          <div style="height:10px;width:25%;background:#e8eef3;border-radius:4px;animation:shimmer 1.4s infinite;background-size:200% 100%;background-image:linear-gradient(90deg,#e8eef3 25%,#d0dce5 50%,#e8eef3 75%);"></div>
        </div>
        <div style="height:36px;background:#e8eef3;border-radius:8px;animation:shimmer 1.4s infinite;background-size:200% 100%;background-image:linear-gradient(90deg,#e8eef3 25%,#d0dce5 50%,#e8eef3 75%);"></div>
      </div>
    </div>`;
  // Inject shimmer keyframes if not already present
  if (!document.getElementById('shimmer-style')) {
    const style = document.createElement('style');
    style.id = 'shimmer-style';
    style.textContent = `@keyframes shimmer { 0%{background-position:200% 0} 100%{background-position:-200% 0} }`;
    document.head.appendChild(style);
  }
  if (fleetGrid) fleetGrid.innerHTML = skeletonCard.repeat(6);
  if (resultsCount) resultsCount.textContent = '...';
}

// State for filtering and sorting
let currentFilter = 'all';
let currentTrans = 'all';
let currentSort = 'price-asc';

function filterAndSort() {
  let list = [...VEHICLES];
  if (currentFilter !== 'all') list = list.filter(v => v.category === currentFilter);
  if (currentTrans !== 'all') list = list.filter(v => v.transmission === currentTrans);

  if (currentSort === 'price-asc') list.sort((a, b) => a.price - b.price);
  else if (currentSort === 'price-desc') list.sort((a, b) => b.price - a.price);
  else if (currentSort === 'category') {
    const order = ['economy', 'compact', 'intermediate', 'suv', 'premium', 'van'];
    list.sort((a, b) => order.indexOf(a.category) - order.indexOf(b.category));
  }
  return list;
}

const fleetGrid = document.getElementById('fleetGrid');
const resultsEmpty = document.getElementById('resultsEmpty');
const resultsCount = document.getElementById('resultsCount');

function renderResults() {
  const list = filterAndSort();

  // Timing check — show error instead of results if not bookable
  const timing = checkPickupTiming();
  if (!timing.ok) {
    fleetGrid.innerHTML = '';
    resultsCount.textContent = '0';
    resultsEmpty.innerHTML = `
      <div style="text-align:center;padding:40px 20px;">
        <div style="font-size:48px;margin-bottom:16px;">🕐</div>
        <h3 style="font-size:20px;font-weight:700;color:#093D5E;margin:0 0 10px;">${
          timing.warning.includes('closed')
            ? t('closed_title')
            : t('tooSoon_title')
        }</h3>
        <p style="color:#64748b;font-size:15px;line-height:1.5;max-width:400px;margin:0 auto;">${timing.warning.replace('⚠️ ', '')}</p>
      </div>`;
    resultsEmpty.hidden = false;
    return;
  }

  resultsCount.textContent = list.length;
  if (list.length === 0) {
    fleetGrid.innerHTML = '';
    resultsEmpty.innerHTML = `
      <div style="text-align:center;padding:60px 20px;">
        <div style="font-size:56px;margin-bottom:20px;">🚗</div>
        <h3 style="font-size:22px;font-weight:700;color:#093D5E;margin:0 0 12px;font-family:'Bricolage Grotesque',sans-serif;">${t('empty_noCars')}</h3>
        <p style="color:#64748b;font-size:15px;line-height:1.6;max-width:440px;margin:0 auto;">
          ${t('empty_noCarsBody')}
        </p>
      </div>`;
    resultsEmpty.hidden = false;
  } else {
    resultsEmpty.hidden = true;
    fleetGrid.innerHTML = list.map(renderVehicleCard).join('');
    gaEvent('view_item_list', {
      item_list_id: (searchCtx.pickup || 'search').toLowerCase(),
      item_list_name: `Search ${searchCtx.pickup || ''}`.trim(),
      items: list.slice(0, 20).map(v => ({
        item_id: v.code, item_name: v.name, item_category: v.category,
        price: bestPrice(v), quantity: 1,
      })),
    });
  }
}

// Show skeleton loader while prices load (don't render hardcoded prices)
showLoadingSkeleton();

// Render category filter chips dynamically from CATEGORY_LABELS
function renderCategoryChips() {
  const container = document.getElementById('categoryChips');
  if (!container) return;

  // Keep "All" chip, rebuild the rest
  container.innerHTML = `
    <button class="filter-chip ${currentFilter === 'all' ? 'active' : ''}" data-filter="all" role="tab" aria-selected="${currentFilter === 'all'}">
      ${t('filter_all')} <span class="chip-count" data-count="all"></span>
    </button>
    ${Object.entries(CATEGORY_LABELS).map(([code, label]) => `
      <button class="filter-chip ${currentFilter === code ? 'active' : ''}" data-filter="${escapeHtml(code)}" role="tab" aria-selected="${currentFilter === code}">
        ${escapeHtml(label)} <span class="chip-count" data-count="${escapeHtml(code)}"></span>
      </button>
    `).join('')}
  `;

  // Re-attach click events
  container.querySelectorAll('.filter-chip').forEach(chip => {
    chip.addEventListener('click', () => {
      container.querySelectorAll('.filter-chip').forEach(c => {
        c.classList.remove('active');
        c.setAttribute('aria-selected', 'false');
      });
      chip.classList.add('active');
      chip.setAttribute('aria-selected', 'true');
      currentFilter = chip.dataset.filter;
      renderResults();
    });
  });

  updateChipCounts();
}

// Update chip counts (always based on transmission filter)
function updateChipCounts() {
  document.querySelectorAll('.chip-count').forEach(el => {
    const cat = el.dataset.count;
    let pool = currentTrans === 'all' ? VEHICLES : VEHICLES.filter(v => v.transmission === currentTrans);
    const count = cat === 'all' ? pool.length : pool.filter(v => v.category === cat).length;
    el.textContent = count;
  });
}
updateChipCounts();

// Filter chip behavior handled by renderCategoryChips() after categories load

// Transmission pill filter
document.querySelector('.pill-filter[data-trans="all"]').classList.add('active');
document.querySelectorAll('.pill-filter').forEach(p => {
  p.addEventListener('click', () => {
    document.querySelectorAll('.pill-filter').forEach(x => x.classList.remove('active'));
    p.classList.add('active');
    currentTrans = p.dataset.trans;
    updateChipCounts();
    renderResults();
  });
});

// Sort
document.getElementById('sortBy').addEventListener('change', (e) => {
  currentSort = e.target.value;
  renderResults();
});

// Click card → open modal
fleetGrid.addEventListener('click', (e) => {
  const card = e.target.closest('.vehicle-card');
  if (!card) return;
  const timing = checkPickupTiming();
  if (!timing.ok) { renderResults(); return; } // re-render with error
  const v = VEHICLES.find(x => x.code === card.dataset.code);
  if (v) openVehicleModal(v);
});

// ============================================
// VEHICLE MODAL (same logic as index)
// ============================================
const vehicleModal = document.getElementById('vehicleModal');

function openVehicleModal(v) {
  if (!vehicleModal) return;
  const isAuto = v.transmission === 'auto';
  function recalc() {
    const bookingOpt = vehicleModal.querySelector('input[name="bookingOption"]:checked')?.value;
    const daily = bookingOpt === 'flex' ? v.price : bestPrice(v);
    const total = (daily * rentalDays).toFixed(2);
    document.getElementById('modalPriceDay').innerHTML = `<strong>€${daily.toFixed(2)}</strong> <span>${t('perDay')}</span>`;
    document.getElementById('modalPriceTotal').textContent = `€${total} ${t('totalForDays', { n: rentalDays, unit: rentalDays === 1 ? t('day') : t('days') })}`;
  }

  document.getElementById('modalPreviewImage').innerHTML = v.image_url
    ? `<img src="${escapeHtml(carImageSrc(v.image_url))}" alt="${escapeHtml(v.name)}" loading="lazy" decoding="async" onerror="onCarImgError(this, '${escapeHtml(v.category)}')" style="width:100%;height:100%;object-fit:contain;">`
    : carSvg(v.category);
  document.getElementById('modalCategory').textContent = `${CATEGORY_LABELS[v.category]} · ${v.code}`;
  document.getElementById('modalTitle').textContent = v.name;
  document.getElementById('modalSimilar').textContent = v.similar;
  document.getElementById('modalSpecs').innerHTML = `
    <div class="spec">${ICON_SEATS}<span class="spec-value">${escapeHtml(v.seats)} seats</span></div>
    <div class="spec">${ICON_BAGS}<span class="spec-value">${escapeHtml(v.bags)} bags</span></div>
    <div class="spec">${ICON_DOORS}<span class="spec-value">${escapeHtml(v.doors)} doors</span></div>
    <div class="spec">${isAuto ? ICON_TRANS_AUTO : ICON_TRANS_MAN}<span class="spec-value">${isAuto ? 'Auto' : 'Manual'}</span></div>
  `;

  vehicleModal.querySelectorAll('input[type="radio"]').forEach(r => { r.checked = r.defaultChecked; });
  vehicleModal.querySelectorAll('.modal-option').forEach(o => o.classList.remove('selected'));
  vehicleModal.querySelectorAll('input[type="radio"]:checked').forEach(r => r.closest('.modal-option').classList.add('selected'));

  const bpEl = vehicleModal.querySelector('#modalBestPriceDay');
  const fpEl = vehicleModal.querySelector('#modalFlexPriceDay');
  if (bpEl) bpEl.textContent = `€${bestPrice(v).toFixed(2)}/day`;
  if (fpEl) fpEl.textContent = `€${v.price.toFixed(2)}/day`;

  vehicleModal.querySelectorAll('input[type="radio"]').forEach(r => {
    r.onchange = () => {
      const groupName = r.name;
      vehicleModal.querySelectorAll(`input[name="${groupName}"]`).forEach(other => {
        other.closest('.modal-option').classList.toggle('selected', other.checked);
      });
      recalc();
    };
  });

  const continueBtn = document.getElementById('modalContinue');
  continueBtn.onclick = () => {
    const rateChoice = vehicleModal.querySelector('input[name="bookingOption"]:checked')?.value || 'best';
    openProtectionPage(v, rentalDays, rateChoice);
    closeVehicleModal();
  };
  recalc();
  gaEvent('view_item', {
    currency: 'EUR',
    value: bestPrice(v) * rentalDays,
    items: [{ item_id: v.code, item_name: v.name, item_category: v.category, price: bestPrice(v), quantity: rentalDays }],
  });
  vehicleModal.hidden = false;
  const modalScrollArea = vehicleModal.querySelector('.modal-scroll-area');
  if (modalScrollArea) modalScrollArea.scrollTop = 0;
  document.body.classList.add('vehicle-modal-open');
  requestAnimationFrame(() => vehicleModal.classList.add('open'));
}

function closeVehicleModal() {
  if (!vehicleModal) return;
  vehicleModal.classList.remove('open');
  document.body.classList.remove('vehicle-modal-open');
  setTimeout(() => { vehicleModal.hidden = true; }, 220);
}

vehicleModal.addEventListener('click', (e) => {
  if (e.target.closest('[data-close]')) closeVehicleModal();
});
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && !vehicleModal.hidden) closeVehicleModal();
});

// ============================================
// PROTECTION PAGE
// ============================================

// Map backend feature keys → display labels
const FEATURE_LABELS = {
  ldw:        t('feat_ldw'),
  tire:       t('feat_tire'),
  windshield: t('feat_windshield'),
  roadside:   t('feat_roadside')
};
const FEATURE_ORDER = ['ldw', 'tire', 'windshield', 'roadside'];

// Normalize features: backend sends {ldw:true,...} → display labels
function normalizeFeatures(features) {
  if (!features || typeof features !== 'object') return {};
  const out = {};
  // If keys match backend shortcodes → map to labels
  if (Object.keys(features).some(k => FEATURE_LABELS[k] !== undefined)) {
    for (const key of FEATURE_ORDER) {
      if (FEATURE_LABELS[key]) out[FEATURE_LABELS[key]] = key === 'windshield' ? !!features['tire'] : !!features[key];
    }
    return out;
  }
  // Already has display labels (legacy) → pass through
  return features;
}

const DEFAULT_PROTECTION_PACKAGES = [
  { id: 'no_extra', name: t('prot_name_no_extra'), coverage: 1, eyebrow: t('prot_eyebrow_included'), tag: 'TPL', tagTooltip: t('prot_tooltip_tpl'), riskLabel: t('prot_ifDamage'), riskValue: t('prot_risk_full'), riskClass: 'bad',  pricePerDay: 0,    features: normalizeFeatures({ tpl:true,  ldw:false, tire:false, roadside:false }) },
  { id: 'basic',    name: t('prot_name_basic'),    coverage: 2, eyebrow: t('prot_eyebrow_reduced'),  tag: 'CDW', tagTooltip: t('prot_tooltip_cdw'), riskLabel: t('prot_ifDamage'), riskValue: t('prot_risk_800'),  riskClass: 'mid',  pricePerDay: 8,    recommended: false, features: normalizeFeatures({ tpl:true,  ldw:true,  tire:false, roadside:false }) },
  { id: 'full',     name: t('prot_name_full'),     coverage: 3, eyebrow: t('prot_eyebrow_zero'),     tag: 'FDW', tagTooltip: t('prot_tooltip_fdw'), riskLabel: t('prot_ifDamage'), riskValue: t('prot_risk_nothing'),           riskClass: 'good', pricePerDay: 15,   recommended: true,  footnote: t('prot_footnote'), features: normalizeFeatures({ tpl:true, ldw:true, tire:true, roadside:true }) }
];

let PROTECTION_PACKAGES = DEFAULT_PROTECTION_PACKAGES.slice();

async function loadProtectionForCategory(category) {
  try {
    const res = await apiGet(`/api/protection?category=${encodeURIComponent(category)}`);
    const data = Array.isArray(res) ? res : (res.packages || []);
    if (data.length > 0) {
      PROTECTION_PACKAGES = data.map(p => {
        const code = (p.code || '').toLowerCase();
        const def = DEFAULT_PROTECTION_PACKAGES.find(d => d.id === code) || {};
        const price = Number(p.price_per_day) || 0;
        const discount = Number(p.online_discount) || 0;
        let oldPrice = null, discountLabel = null;
        if (discount > 0 && price > 0) { oldPrice = +(price / (1 - discount / 100)).toFixed(2); discountLabel = `−${discount}% online`; }
        let features = def.features || {};
        if (p.features) {
          try {
            const raw = typeof p.features === 'string' ? JSON.parse(p.features) : p.features;
            features = normalizeFeatures(raw);
          } catch(e) {}
        }
        let excess = p.excess != null ? t('prot_excess_upto', { amount: p.excess }) : (def.excess || '—');
        let excessClass = def.excessClass || 'warning';
        if (Number(p.excess) === 0) { excess = t('prot_excess_zero'); excessClass = 'good'; }
        if (price === 0) { excess = def.excess || t('prot_excess_full'); excessClass = 'danger'; }
        const trueCount = Object.values(features).filter(Boolean).length;
        const derivedCoverage = def.coverage != null ? def.coverage : (code === 'no_extra' ? 1 : code === 'basic' ? 2 : code === 'full' ? 3 : Math.min(3, Math.max(1, Math.ceil(trueCount * 3 / 4))));
        return { id: code, name: p.name || def.name || code, coverage: derivedCoverage, eyebrow: def.eyebrow || '', tag: def.tag || null, tagTooltip: def.tagTooltip || null, riskLabel: def.riskLabel || t('prot_ifDamage'), riskValue: def.riskValue || '—', riskClass: def.riskClass || 'mid', pricePerDay: price, recommended: !!p.recommended || def.recommended || false, footnote: def.footnote || null, features };
      });
      // Filter out legacy packages, sort
      PROTECTION_PACKAGES = PROTECTION_PACKAGES.filter(p => !['smart','all_inclusive','all','none'].includes(p.id));
      const order = { no_extra: 0, basic: 1, full: 2 };
      PROTECTION_PACKAGES.sort((a, b) => (order[a.id] ?? 99) - (order[b.id] ?? 99));
      return;
    }
  } catch (err) {
    console.warn('[Wheelso] Protection API failed, using defaults:', err.message);
  }
  PROTECTION_PACKAGES = DEFAULT_PROTECTION_PACKAGES.slice();
}

const ICON_CHECK = '<svg class="protection-feature-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>';
const ICON_X = '<svg class="protection-feature-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>';

function renderCoverageBar(filled, total = 3, isLime = false) {
  let html = '<div class="protection-coverage-bar">';
  for (let i = 0; i < total; i++) {
    const cls = i < filled ? (isLime ? 'on lime' : 'on') : '';
    html += `<div class="protection-coverage-seg ${cls}"></div>`;
  }
  return html + '</div>';
}

function renderProtectionCard(pkg, selectedId, disabled = false) {
  const featuresHTML = Object.entries(pkg.features).map(([name, included]) => `
    <div class="protection-feature ${included ? 'included' : 'excluded'}">
      ${included ? ICON_CHECK : ICON_X}
      <span>${escapeHtml(name)}</span>
    </div>
  `).join('');

  let priceHTML;
  if (disabled) {
    priceHTML = `<div class="protection-fdw-note">${escapeHtml(t('prot_fdwAgeBlocked'))}</div>`;
  } else if (pkg.pricePerDay === 0) {
    priceHTML = `<div class="protection-price">${t('included')} <span>${t('inRate')}</span></div>`;
  } else {
    priceHTML = `<div class="protection-price">+€${pkg.pricePerDay.toFixed(2)} <span>${t('perDay')}</span></div>`;
  }

  // Tag with tooltip (TPL/CDW/FDW)
  const tagHTML = pkg.tag
    ? `<span class="protection-tag" tabindex="0">${escapeHtml(pkg.tag)}${pkg.tagTooltip ? `<span class="protection-tooltip">${escapeHtml(pkg.tagTooltip)}</span>` : ''}</span>`
    : '';

  // Risk row — "If damage occurs"
  const riskHTML = pkg.riskValue
    ? `<div class="protection-risk ${escapeHtml(pkg.riskClass || 'mid')}">
         <p class="protection-risk-label">${escapeHtml(pkg.riskLabel || t('prot_ifDamage'))}</p>
         <p class="protection-risk-value">${escapeHtml(pkg.riskValue)}</p>
       </div>`
    : '';

  const badgeHTML = (pkg.recommended && !disabled) ? `<span class="protection-badge">${t('mostPopular')}</span>` : '';
  const isLime = !!pkg.recommended && !disabled;
  const eyebrowHTML = pkg.eyebrow ? `<div class="protection-eyebrow">${escapeHtml(pkg.eyebrow)}</div>` : '';
  const footnoteHTML = pkg.footnote
    ? `<p class="protection-footnote">${escapeHtml(pkg.footnote).replace(t('prot_seeTerms'), `<a href="#" class="excl-trigger">${t('prot_seeTerms')}</a>`)}</p>`
    : '';

  return `
    <div class="protection-card ${(!disabled && selectedId === pkg.id) ? 'selected' : ''} ${(pkg.recommended && !disabled) ? 'recommended' : ''} ${disabled ? 'protection-card--disabled' : ''}" data-pkg="${escapeHtml(pkg.id)}"${disabled ? ' aria-disabled="true"' : ''}>
      ${badgeHTML}
      <div class="protection-card-radio"></div>
      ${renderCoverageBar(pkg.coverage || 1, 3, isLime)}
      ${eyebrowHTML}
      <div class="protection-name-row">
        <h3 class="protection-card-name">${escapeHtml(pkg.name)}</h3>
        ${tagHTML}
      </div>
      ${riskHTML}
      <div class="protection-features">${featuresHTML}</div>
      ${priceHTML}
      ${footnoteHTML}
    </div>
  `;
}

const protectionPage = document.getElementById('protectionPage');
const protectionGrid = document.getElementById('protectionGrid');
const protectionBack = document.getElementById('protectionBack');
const protectionContinue = document.getElementById('protectionContinue');
const protectionTotal = document.getElementById('protectionTotal');
const overviewCancellation = document.getElementById('overviewCancellation');

let currentProtection = { vehicle: null, days: 3, rate: 'best', selected: 'basic' };

async function openProtectionPage(v, days, rate) {
  currentProtection = { vehicle: v, days, rate, selected: 'basic' };
  protectionPage.hidden = false;
  document.body.classList.add('protection-open');
  protectionPage.scrollTop = 0;
  renderProtectionGrid();
  updateProtectionTotal();

  if (overviewCancellation) {
    const cancelText = v.admin_upon_request
      ? t('cancelOnRequest')
      : rate === 'flex'
        ? t('cancelPayLater')
        : t('cancelBestPrice');
    overviewCancellation.innerHTML = `<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg> ${cancelText}`;
  }

  await loadProtectionForCategory(v.category);
  if (!PROTECTION_PACKAGES.find(p => p.id === currentProtection.selected)) {
    currentProtection.selected = PROTECTION_PACKAGES[0]?.id || 'basic';
  }
  // Young/senior drivers may not have Full Protection — coerce to Basic if it slipped through.
  if (isRestrictedAge(searchCtx.age) && currentProtection.selected === 'full') {
    currentProtection.selected = 'basic';
  }
  renderProtectionGrid();
  updateProtectionTotal();
}

function closeProtectionPage() {
  protectionPage.hidden = true;
  document.body.classList.remove('protection-open');
}

function renderProtectionGrid() {
  const blockFull = isRestrictedAge(searchCtx.age);
  protectionGrid.innerHTML = PROTECTION_PACKAGES.map(p => renderProtectionCard(p, currentProtection.selected, blockFull && p.id === 'full')).join('');
}

function updateProtectionTotal() {
  const v = currentProtection.vehicle;
  const days = currentProtection.days;
  const vehicleDaily = currentProtection.rate === 'flex' ? v.price : bestPrice(v);
  const selectedPkg = PROTECTION_PACKAGES.find(p => p.id === currentProtection.selected);
  const protectionDaily = selectedPkg ? selectedPkg.pricePerDay : 0;
  const daily = vehicleDaily + protectionDaily;
  const total = (daily * days).toFixed(2);
  protectionTotal.textContent = `€${total}`;
}

protectionGrid.addEventListener('click', (e) => {
  const card = e.target.closest('.protection-card');
  if (!card || card.classList.contains('protection-card--disabled')) return;
  currentProtection.selected = card.dataset.pkg;
  renderProtectionGrid();
  updateProtectionTotal();
});

protectionBack.addEventListener('click', closeProtectionPage);

protectionContinue.addEventListener('click', () => {
  openExtrasPage();
});

document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && protectionPage && !protectionPage.hidden) closeProtectionPage();
});

// ============================================
// EXTRAS PAGE
// ============================================
const ICON_EXTRA_DEFAULT = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="16"/><line x1="8" y1="12" x2="16" y2="12"/></svg>';

const DEFAULT_EXTRAS = [
  { id: 'additional-driver', name: t('ex_name_additional'), priceLabel: t('ex_price_additional'), pricePerDay: 6.66, perUnit: false, maxQty: 4, icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><line x1="19" y1="8" x2="19" y2="14"/><line x1="22" y1="11" x2="16" y2="11"/></svg>', summary: t('ex_summary_additional'), details: t('ex_details_additional') },
  { id: 'gps', name: t('ex_name_gps'), priceLabel: t('ex_perDay', { price: 8 }), pricePerDay: 8, perUnit: false, maxQty: 4, icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="3 11 22 2 13 21 11 13 3 11"/></svg>', summary: t('ex_summary_gps'), details: t('ex_details_gps') },
  { id: 'child-seat', name: t('ex_name_child'), priceLabel: t('ex_perDay', { price: 5 }), pricePerDay: 5, perUnit: true, maxQty: 4, icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 4h-1V2h-2v2H8V2H6v2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2z"/><path d="M12 11v6"/><path d="M9 14h6"/></svg>', summary: t('ex_summary_child'), details: t('ex_details_child') },
  { id: 'baby-seat', name: t('ex_name_baby'), priceLabel: t('ex_perDay', { price: 5 }), pricePerDay: 5, perUnit: true, maxQty: 4, icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M9 11h.01M15 11h.01M8 16s1.5 2 4 2 4-2 4-2"/></svg>', summary: t('ex_summary_baby'), details: t('ex_details_baby') },
  { id: 'wifi', name: t('ex_name_wifi'), priceLabel: t('ex_perDay', { price: 7 }), pricePerDay: 7, perUnit: false, maxQty: 4, icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12.55a11 11 0 0 1 14.08 0"/><path d="M1.42 9a16 16 0 0 1 21.16 0"/><path d="M8.53 16.11a6 6 0 0 1 6.95 0"/><line x1="12" y1="20" x2="12.01" y2="20"/></svg>', summary: t('ex_summary_wifi'), details: t('ex_details_wifi') },
  { id: 'roof-rack', name: t('ex_name_roofrack'), priceLabel: t('ex_perDay', { price: 4 }), pricePerDay: 4, perUnit: false, maxQty: 4, icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="6" width="20" height="2"/><line x1="6" y1="6" x2="6" y2="14"/><line x1="18" y1="6" x2="18" y2="14"/><path d="M3 14h18v6H3z"/></svg>', summary: t('ex_summary_roofrack'), details: t('ex_details_roofrack') }
];

let EXTRAS = DEFAULT_EXTRAS.slice();

async function loadExtrasFromAPI() {
  try {
    const res = await apiGet('/api/extras');
    const data = Array.isArray(res) ? res : (res.extras || []);
    if (data.length > 0) {
      EXTRAS = data.map(e => {
        const id = (e.code || '').toLowerCase().replace(/_/g, '-');
        const def = DEFAULT_EXTRAS.find(d => d.id === id) || {};
        const price = Number(e.price_per_day) || 0;
        const perUnit = !!e.per_unit;
        return { id, name: e.name || def.name || id, priceLabel: perUnit ? t('ex_perDayItem', { price: price.toFixed(2) }) : t('ex_perDay', { price: price.toFixed(2) }), pricePerDay: price, perUnit, maxQty: e.max_qty || 4, icon: def.icon || ICON_EXTRA_DEFAULT, summary: e.description || def.summary || '', details: def.details || e.description || '' };
      });
    }
  } catch (err) {
    console.warn('[Wheelso] Extras API failed, using defaults:', err.message);
  }
}

const extrasPage = document.getElementById('extrasPage');
const extrasList = document.getElementById('extrasList');
const extrasBack = document.getElementById('extrasBack');
const extrasContinue = document.getElementById('extrasContinue');
const extrasTotal = document.getElementById('extrasTotal');
const extrasOverviewProtection = document.getElementById('extrasOverviewProtection');
const extrasOverviewCancellation = document.getElementById('extrasOverviewCancellation');

let selectedExtras = {};

function renderExtrasList() {
  if (!extrasList) return;
  extrasList.innerHTML = EXTRAS.map(extra => {
    const qty = selectedExtras[extra.id] || 0;
    const isOn = qty > 0;
    return `
      <div class="extra-card ${isOn ? 'selected' : ''}" data-extra="${escapeHtml(extra.id)}">
        <div class="extra-row">
          <div class="extra-icon">${extra.icon}</div>
          <div class="extra-info">
            <h3 class="extra-name">${escapeHtml(extra.name)}</h3>
            <p class="extra-summary">${escapeHtml(extra.summary)}</p>
            <span class="extra-price">${escapeHtml(extra.priceLabel)}</span>
          </div>
          <div class="extra-controls">
            ${extra.perUnit && isOn ? `
              <div class="extra-qty">
                <button type="button" class="qty-btn" data-action="dec" aria-label="Decrease">−</button>
                <span class="qty-value">${qty}</span>
                <button type="button" class="qty-btn" data-action="inc" aria-label="Increase">+</button>
              </div>
            ` : `
              <button type="button" class="extra-toggle ${isOn ? 'on' : ''}" data-action="toggle" aria-pressed="${isOn}">
                <span class="extra-toggle-thumb"></span>
              </button>
            `}
          </div>
        </div>
        <button type="button" class="extra-details-toggle" data-action="details" aria-expanded="false">
          ${t('whatsIncluded')}
          <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"/></svg>
        </button>
        <div class="extra-details" hidden>
          <p>${escapeHtml(extra.details)}</p>
        </div>
      </div>
    `;
  }).join('');
}

function calculateExtrasTotal() {
  return Object.entries(selectedExtras).reduce((sum, [id, qty]) => {
    const extra = EXTRAS.find(e => e.id === id);
    if (!extra || qty === 0) return sum;
    return sum + (extra.pricePerDay * qty * currentProtection.days);
  }, 0);
}

function updateExtrasTotal() {
  const v = currentProtection.vehicle;
  const days = currentProtection.days;
  const vehicleDaily = currentProtection.rate === 'flex' ? v.price : bestPrice(v);
  const selectedPkg = PROTECTION_PACKAGES.find(p => p.id === currentProtection.selected);
  const protectionDaily = selectedPkg ? selectedPkg.pricePerDay : 0;
  const baseTotal = (vehicleDaily + protectionDaily) * days;
  const extrasCost = calculateExtrasTotal();
  extrasTotal.textContent = `€${(baseTotal + extrasCost + oneWayFeeGross).toFixed(2)}`;
}

function openExtrasPage() {
  if (!extrasPage) return;
  selectedExtras = {};
  renderExtrasList();
  updateExtrasTotal();
  populateSummarySidebar();

  if (protectionPage) protectionPage.hidden = true;
  extrasPage.hidden = false;
  document.body.classList.add('protection-open');
  extrasPage.scrollTop = 0;
}

function populateSummarySidebar() {
  const v = currentProtection.vehicle;
  const pkg = PROTECTION_PACKAGES.find(p => p.id === currentProtection.selected);
  if (!v) return;

  const sv = document.getElementById('summaryVehicle');
  if (sv) {
    sv.innerHTML = `
      <div class="summary-vehicle-image">${carSvg(v.category)}</div>
      <div class="summary-vehicle-info">
        <span class="summary-vehicle-cat">${escapeHtml(CATEGORY_LABELS[v.category])}</span>
        <span class="summary-vehicle-name">${escapeHtml(v.name)}</span>
        <span class="summary-vehicle-similar">${escapeHtml(v.similar)}</span>
      </div>
    `;
  }

  const pickupLocText = LOCATION_LABELS[searchCtx.pickup] || 'Athens Airport';
  const returnLocText = searchCtx.return ? (LOCATION_LABELS[searchCtx.return] || pickupLocText) : pickupLocText;

  function fmt(iso) {
    if (!iso) return '—';
    const d = new Date(iso);
    if (isNaN(d.getTime())) return iso;
    const dow = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'][d.getDay()];
    const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    return `${dow} ${d.getDate()} ${months[d.getMonth()]}`;
  }

  const sPickLoc = document.getElementById('summaryPickupLocation');
  const sPickDate = document.getElementById('summaryPickupDate');
  const sRetLoc = document.getElementById('summaryReturnLocation');
  const sRetDate = document.getElementById('summaryReturnDate');
  if (sPickLoc) sPickLoc.textContent = pickupLocText;
  if (sPickDate) sPickDate.textContent = `${fmt(searchCtx.from)} · ${searchCtx.fromTime}`;
  if (sRetLoc) sRetLoc.textContent = returnLocText;
  if (sRetDate) sRetDate.textContent = `${fmt(searchCtx.to)} · ${searchCtx.toTime}`;

  const sRate = document.getElementById('summaryRate');
  const sProt = document.getElementById('summaryProtection');
  if (sRate) sRate.textContent = currentProtection.vehicle?.admin_upon_request
    ? t('sum_rate_onrequest')
    : currentProtection.rate === 'flex'
      ? t('sum_rate_flex')
      : t('sum_rate_best');
  if (sProt) sProt.textContent = pkg ? pkg.name : t('sum_protectionFallback');
}

function closeExtrasPage() {
  extrasPage.hidden = true;
  if (protectionPage) {
    protectionPage.hidden = false;
    document.body.classList.add('protection-open');
  } else {
    document.body.classList.remove('protection-open');
  }
}

if (extrasList) {
  extrasList.addEventListener('click', (e) => {
    const card = e.target.closest('.extra-card');
    if (!card) return;
    const extraId = card.dataset.extra;
    const extra = EXTRAS.find(x => x.id === extraId);
    if (!extra) return;
    const actionBtn = e.target.closest('[data-action]');
    if (!actionBtn) return;
    const action = actionBtn.dataset.action;

    if (action === 'toggle') {
      if (selectedExtras[extraId]) delete selectedExtras[extraId];
      else selectedExtras[extraId] = 1;
    } else if (action === 'inc') {
      selectedExtras[extraId] = Math.min((selectedExtras[extraId] || 0) + 1, 4);
    } else if (action === 'dec') {
      const newQty = (selectedExtras[extraId] || 0) - 1;
      if (newQty <= 0) delete selectedExtras[extraId];
      else selectedExtras[extraId] = newQty;
    } else if (action === 'details') {
      const detailsEl = card.querySelector('.extra-details');
      const isExpanded = !detailsEl.hidden;
      detailsEl.hidden = isExpanded;
      actionBtn.setAttribute('aria-expanded', String(!isExpanded));
      actionBtn.classList.toggle('expanded', !isExpanded);
      return;
    }

    renderExtrasList();
    updateExtrasTotal();
  });
}

if (extrasBack) extrasBack.addEventListener('click', closeExtrasPage);

if (extrasContinue) {
  extrasContinue.addEventListener('click', () => {
    openDriverPage();
  });
}

document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && extrasPage && !extrasPage.hidden) closeExtrasPage();
});

// ============================================
// DRIVER DETAILS PAGE (Step 4)
// ============================================
const driverPage = document.getElementById('driverPage');
const driverBack = document.getElementById('driverBack');
const driverContinueBtn = document.getElementById('driverContinue');
const driverTotalEl = document.getElementById('driverTotal');
const driverTotalLabelEl = document.getElementById('driverTotalLabel');
const driverTotalSubEl = document.getElementById('driverTotalSub');
const driverForm = document.getElementById('driverForm');

function renderDriverTotal(fullTotal) {
  const isUponRequest = !!currentProtection.vehicle?.admin_upon_request;
  if (isUponRequest) {
    // On-request: nothing is charged at request time; payment happens after
    // confirmation via the secure link.
    driverTotalLabelEl.textContent = t('payNow');
    driverTotalEl.textContent = '€0.00';
    if (currentProtection.rate === 'flex') {
      const deposit = fullTotal * 0.10;
      driverTotalSubEl.textContent = t('depositAfterConfirm', { amount: deposit.toFixed(2) });
    } else {
      driverTotalSubEl.textContent = t('afterConfirm', { amount: fullTotal.toFixed(2) });
    }
  } else if (currentProtection.rate === 'flex') {
    const deposit = fullTotal * 0.10;
    driverTotalLabelEl.textContent = t('payNow');
    driverTotalEl.textContent = `€${deposit.toFixed(2)}`;
    driverTotalSubEl.textContent = t('ofTotal', { amount: fullTotal.toFixed(2) });
  } else {
    driverTotalLabelEl.textContent = t('total');
    driverTotalEl.textContent = `€${fullTotal.toFixed(2)}`;
    driverTotalSubEl.textContent = '';
  }
}

// ─── PROMO DISCOUNT HELPERS ───
function computePreDiscountTotal(afterHoursFee = 0) {
  const v = currentProtection.vehicle;
  if (!v) return 0;
  const days = currentProtection.days;
  const vehicleDaily = currentProtection.rate === 'flex' ? v.price : bestPrice(v);
  const pkg = PROTECTION_PACKAGES.find(p => p.id === currentProtection.selected);
  const protectionDaily = pkg ? pkg.pricePerDay : 0;
  const raw = (vehicleDaily + protectionDaily) * days + calculateExtrasTotal() + afterHoursFee + (isOneWay ? oneWayFeeGross : 0);
  return Math.round(raw * 100) / 100;
}

async function ensurePromoChecked(afterHoursFee = 0) {
  promoState = { applied: false, discountAmount: 0, code: null };
  const code = (searchCtx.promo || '').trim();
  if (!code) return;
  const preDiscount = computePreDiscountTotal(afterHoursFee);
  try {
    const r = await apiPost('/api/promo/validate', { code, days: currentProtection.days, total: preDiscount });
    let d = Number(r.discount_amount) || 0;
    d = Math.min(d, preDiscount);
    promoState = { applied: d > 0, discountAmount: d, code: r.code || code };
  } catch (e) { /* invalid/expired/min_days — leave not-applied */ }
}

function getPromoDiscount() {
  return promoState.applied ? promoState.discountAmount : 0;
}

async function openDriverPage() {
  if (!driverPage) return;
  const timing = checkPickupTiming();
  await ensurePromoChecked(timing.afterHoursFee);
  populateDriverSummary();
  if (extrasPage) extrasPage.hidden = true;
  driverPage.hidden = false;
  document.body.classList.add('protection-open');
  driverPage.scrollTop = 0;

  const cpv = currentProtection && currentProtection.vehicle;
  if (cpv) {
    gaEvent('begin_checkout', {
      currency: 'EUR',
      items: [{ item_id: cpv.code, item_name: cpv.name, item_category: cpv.category, price: bestPrice(cpv), quantity: currentProtection.days || 1 }],
    });
  }

  // Show after-hours warning if applicable
  showAfterHoursWarning(timing.warning);
  showOneWayBanner();

  // Show young/senior driver warning if applicable
  const youngDriverBannerId = 'youngDriverBanner';
  let youngBanner = document.getElementById(youngDriverBannerId);
  if (searchCtx.age === '21-25') {
    if (!youngBanner) {
      youngBanner = document.createElement('div');
      youngBanner.id = youngDriverBannerId;
      youngBanner.style.cssText = 'background:#fff8e1;border:1px solid #f59e0b;border-radius:10px;padding:12px 16px;margin:0 0 16px;font-size:14px;color:#92400e;';
      const ageConfirm = document.getElementById('ageConfirm');
      if (ageConfirm) ageConfirm.closest('div')?.before(youngBanner);
    }
    youngBanner.innerHTML = t('youngDriverBanner');
    youngBanner.style.display = 'block';
  } else if (searchCtx.age === '70-75') {
    if (!youngBanner) {
      youngBanner = document.createElement('div');
      youngBanner.id = youngDriverBannerId;
      youngBanner.style.cssText = 'background:#fff8e1;border:1px solid #f59e0b;border-radius:10px;padding:12px 16px;margin:0 0 16px;font-size:14px;color:#92400e;';
      const ageConfirm = document.getElementById('ageConfirm');
      if (ageConfirm) ageConfirm.closest('div')?.before(youngBanner);
    }
    youngBanner.innerHTML = t('seniorDriverBanner');
    youngBanner.style.display = 'block';
  } else if (youngBanner) {
    youngBanner.style.display = 'none';
  }

  // Update total with after-hours fee
  updateDriverTotal(timing.afterHoursFee);

  // Trigger autofill: briefly show then focus first empty field
  requestAnimationFrame(() => {
    const firstEmpty = ['firstName', 'lastName', 'email', 'phone']
      .map(id => document.getElementById(id))
      .find(el => el && !el.value.trim());
    firstEmpty?.focus();
  });
}

function closeDriverPage() {
  driverPage.hidden = true;
  if (extrasPage) {
    extrasPage.hidden = false;
    document.body.classList.add('protection-open');
  } else {
    document.body.classList.remove('protection-open');
  }
}

function populateDriverSummary() {
  const v = currentProtection.vehicle;
  const pkg = PROTECTION_PACKAGES.find(p => p.id === currentProtection.selected);
  if (!v) return;

  const sv = document.getElementById('driverSummaryVehicle');
  if (sv) {
    sv.innerHTML = `
      <div class="summary-vehicle-image">${carSvg(v.category)}</div>
      <div class="summary-vehicle-info">
        <span class="summary-vehicle-cat">${escapeHtml(CATEGORY_LABELS[v.category])}</span>
        <span class="summary-vehicle-name">${escapeHtml(v.name)}</span>
        <span class="summary-vehicle-similar">${escapeHtml(v.similar)}</span>
      </div>
    `;
  }

  const pickupLocText = LOCATION_LABELS[searchCtx.pickup] || 'Athens Airport';
  const returnLocText = searchCtx.return ? (LOCATION_LABELS[searchCtx.return] || pickupLocText) : pickupLocText;

  function fmt(iso) {
    if (!iso) return '—';
    const d = new Date(iso);
    if (isNaN(d.getTime())) return iso;
    const dow = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'][d.getDay()];
    const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    return `${dow} ${d.getDate()} ${months[d.getMonth()]}`;
  }

  document.getElementById('driverSummaryPickupLoc').textContent = pickupLocText;
  document.getElementById('driverSummaryPickupDate').textContent = `${fmt(searchCtx.from)} · ${searchCtx.fromTime}`;
  document.getElementById('driverSummaryReturnLoc').textContent = returnLocText;
  document.getElementById('driverSummaryReturnDate').textContent = `${fmt(searchCtx.to)} · ${searchCtx.toTime}`;

  document.getElementById('driverSummaryRate').textContent = v.admin_upon_request
    ? t('onRequest')
    : currentProtection.rate === 'flex'
      ? t('payLater')
      : t('payNow');
  document.getElementById('driverSummaryProtection').textContent = pkg ? pkg.name : t('sum_protectionFallback');

  // Render dynamic info cards (Payment + Cancellation)
  renderInfoCards();

  const extrasEntries = Object.entries(selectedExtras).filter(([, qty]) => qty > 0);
  const extrasRow = document.getElementById('driverSummaryExtras');
  if (extrasEntries.length > 0 && extrasRow) {
    const txt = extrasEntries.map(([id, qty]) => {
      const e = EXTRAS.find(x => x.id === id);
      return qty > 1 ? `${e.name} (×${qty})` : e.name;
    }).join(', ');
    document.getElementById('driverSummaryExtrasText').textContent = txt;
    extrasRow.hidden = false;
  } else if (extrasRow) {
    extrasRow.hidden = true;
  }

  const days = currentProtection.days;
  const vehicleDaily = currentProtection.rate === 'flex' ? v.price : bestPrice(v);
  const protectionDaily = pkg ? pkg.pricePerDay : 0;
  const baseTotal = (vehicleDaily + protectionDaily) * days;
  const extrasCost = calculateExtrasTotal();
  renderDriverTotal(baseTotal + extrasCost + oneWayFeeGross - getPromoDiscount());
}

function updateDriverTotal(afterHoursFee = 0) {
  const v = currentProtection.vehicle;
  if (!v) return;
  const days = currentProtection.days;
  const vehicleDaily = currentProtection.rate === 'flex' ? v.price : bestPrice(v);
  const pkg = PROTECTION_PACKAGES.find(p => p.id === currentProtection.selected);
  const protectionDaily = pkg ? pkg.pricePerDay : 0;
  const baseTotal = (vehicleDaily + protectionDaily) * days;
  const extrasCost = calculateExtrasTotal();
  renderDriverTotal(baseTotal + extrasCost + afterHoursFee + oneWayFeeGross - getPromoDiscount());
}

if (driverBack) driverBack.addEventListener('click', closeDriverPage);

// ============================================
// AFTER-HOURS & LEAD TIME
// ============================================
   // 09:00
var BUSINESS_OPEN = 9; var BUSINESS_CLOSE = 21; // 21:00
var LEAD_TIME_HOURS = 2;
var AFTER_HOURS_FEE = 25;

// Returns { ok, afterHoursFee, warning }
function checkPickupTiming() {
  if (!searchCtx.from || !searchCtx.fromTime) return { ok: true, afterHoursFee: 0, warning: null };

  const now = new Date();
  const pickupDT = new Date(`${searchCtx.from}T${searchCtx.fromTime}:00`);
  const returnDT = new Date(`${searchCtx.to}T${searchCtx.toTime}:00`);
  const pickupMin = pickupDT.getHours() * 60 + pickupDT.getMinutes();
  const returnMin = returnDT.getHours() * 60 + returnDT.getMinutes();

  // Lead time check: pickup must be at least 2h from now
  const minPickup = new Date(now.getTime() + LEAD_TIME_HOURS * 60 * 60 * 1000);
  if (pickupDT < minPickup) {
    // If we're outside business hours, tell them earliest is 09:00 next open day
    const nowHour = now.getHours();
    const isNowClosed = nowHour < BUSINESS_OPEN || nowHour >= BUSINESS_CLOSE;
    if (isNowClosed) {
      const nextOpen = new Date(now);
      nextOpen.setHours(BUSINESS_OPEN, 0, 0, 0);
      if (nowHour >= BUSINESS_CLOSE) nextOpen.setDate(nextOpen.getDate() + 1);
      return {
        ok: false,
        afterHoursFee: 0,
        warning: `We're currently closed. Earliest pickup is ${nextOpen.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' })} at 09:00.`
      };
    }
    return {
      ok: false,
      afterHoursFee: 0,
      warning: `Pickup must be at least ${LEAD_TIME_HOURS} hours from now. Earliest: ${minPickup.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}.`
    };
  }

  // After-hours fee: pickup or return outside 09:00–21:00
  const pickupOutside = pickupMin < BUSINESS_OPEN * 60 || pickupMin > BUSINESS_CLOSE * 60;
  const returnOutside = returnMin < BUSINESS_OPEN * 60 || returnMin > BUSINESS_CLOSE * 60;
  const feeCount = (pickupOutside ? 1 : 0) + (returnOutside ? 1 : 0);
  const afterHoursFee = feeCount * AFTER_HOURS_FEE;

  let warning = null;
  if (afterHoursFee > 0) {
    const parts = [];
    if (pickupOutside) parts.push(t('afterHoursPickupAt', { time: searchCtx.fromTime }));
    if (returnOutside) parts.push(t('afterHoursReturnAt', { time: searchCtx.toTime }));
    warning = t('afterHoursBanner', { fee: afterHoursFee, parts: parts.join(` ${t('and')} `) });
  }

  return { ok: true, afterHoursFee, warning };
}

// One-way rental banner in driver page (sky blue — distinct from after-hours amber)
function showOneWayBanner() {
  let banner = document.getElementById('oneWayBanner');
  if (!banner) {
    banner = document.createElement('div');
    banner.id = 'oneWayBanner';
    banner.style.cssText = 'background:#e0f2fe;border:1.5px solid #38bdf8;border-radius:10px;padding:12px 16px;font-size:14px;font-weight:600;color:#0c4a6e;margin-bottom:16px;';
    const driverForm = document.getElementById('driverForm');
    driverForm?.parentElement?.insertBefore(banner, driverForm);
  }
  if (isOneWay && oneWayFeeGross > 0) {
    banner.textContent = t('oneWayBanner', { fee: oneWayFeeGross.toFixed(2) });
    banner.hidden = false;
  } else {
    banner.hidden = true;
  }
}

// After-hours warning banner in driver page
function showAfterHoursWarning(warning) {
  let banner = document.getElementById('afterHoursBanner');
  if (!banner) {
    banner = document.createElement('div');
    banner.id = 'afterHoursBanner';
    banner.style.cssText = 'background:#fff8e1;border:1.5px solid #f59e0b;border-radius:10px;padding:12px 16px;font-size:14px;font-weight:600;color:#92400e;margin-bottom:16px;';
    const driverForm = document.getElementById('driverForm');
    driverForm?.parentElement?.insertBefore(banner, driverForm);
  }
  if (warning) {
    banner.textContent = warning;
    banner.hidden = false;
  } else {
    banner.hidden = true;
  }
}

// ============================================
// THANK YOU POPUP
// ============================================
function showThankYouPopup(ref, email, total) { // TODO: remove unused 'total' param
  // Remove existing
  document.getElementById('thankYouOverlay')?.remove();

  const overlay = document.createElement('div');
  overlay.id = 'thankYouOverlay';
  overlay.style.cssText = `
    position:fixed;inset:0;z-index:9999;
    background:rgba(9,61,94,0.7);backdrop-filter:blur(4px);
    display:flex;align-items:center;justify-content:center;padding:20px;
  `;

  overlay.innerHTML = `
    <div style="background:#fff;border-radius:20px;padding:40px 36px;max-width:460px;width:100%;text-align:center;box-shadow:0 24px 60px rgba(0,0,0,0.25);">
      <div style="font-size:52px;margin-bottom:16px;">⏳</div>
      <h2 style="font-family:var(--font-display,sans-serif);font-size:26px;font-weight:800;color:#093D5E;margin:0 0 8px;letter-spacing:-0.02em;">${t('ty_title')}</h2>
      <p style="font-size:16px;color:#1C5875;font-weight:600;margin:0 0 20px;">${t('ty_body')}</p>
      <div style="background:#f0f7ff;border-radius:12px;padding:16px 20px;margin-bottom:20px;">
        <p style="font-size:13px;color:#64748b;margin:0 0 4px;font-weight:500;">${t('ty_reference')}</p>
        <p style="font-size:22px;font-weight:800;color:#093D5E;letter-spacing:0.05em;margin:0;">${escapeHtml(ref)}</p>
      </div>
      <p style="font-size:14px;color:#64748b;margin:0 0 28px;line-height:1.5;">
        ${t('ty_sentTo')}<br>
        <strong style="color:#093D5E;">${escapeHtml(email)}</strong>
      </p>
      <p style="font-size:13px;color:#666;margin:0 0 28px;line-height:1.5;">${t('ty_noCharge')}</p>
      <button id="thankYouClose" style="width:100%;background:#CFDD28;color:#093D5E;border:none;border-radius:12px;padding:16px;font-size:16px;font-weight:700;cursor:pointer;letter-spacing:-0.01em;">
        ${t('backToHome')}
      </button>
    </div>
  `;

  document.body.appendChild(overlay);

  document.getElementById('thankYouClose').addEventListener('click', () => {
    window.location.href = 'index.html';
  });

  // Click outside → also go home
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) window.location.href = 'index.html';
  });
}

// Confirmed-free booking (100% promo): nothing owed, booking already confirmed.
function showFreeConfirmedPopup(ref, email) {
  // Remove existing
  document.getElementById('thankYouOverlay')?.remove();

  const overlay = document.createElement('div');
  overlay.id = 'thankYouOverlay';
  overlay.style.cssText = `
    position:fixed;inset:0;z-index:9999;
    background:rgba(9,61,94,0.7);backdrop-filter:blur(4px);
    display:flex;align-items:center;justify-content:center;padding:20px;
  `;

  overlay.innerHTML = `
    <div style="background:#fff;border-radius:20px;padding:40px 36px;max-width:460px;width:100%;text-align:center;box-shadow:0 24px 60px rgba(0,0,0,0.25);">
      <div style="font-size:52px;margin-bottom:16px;">✅</div>
      <h2 style="font-family:var(--font-display,sans-serif);font-size:26px;font-weight:800;color:#093D5E;margin:0 0 8px;letter-spacing:-0.02em;">${t('fc_title')}</h2>
      <p style="font-size:16px;color:#1C5875;font-weight:600;margin:0 0 20px;">${t('fc_body')}</p>
      <div style="background:#f0f7ff;border-radius:12px;padding:16px 20px;margin-bottom:20px;">
        <p style="font-size:13px;color:#64748b;margin:0 0 4px;font-weight:500;">${t('fc_reference')}</p>
        <p style="font-size:22px;font-weight:800;color:#093D5E;letter-spacing:0.05em;margin:0;">${escapeHtml(ref)}</p>
      </div>
      <p style="font-size:14px;color:#64748b;margin:0 0 28px;line-height:1.5;">
        ${t('fc_sentTo')}<br>
        <strong style="color:#093D5E;">${escapeHtml(email)}</strong>
      </p>
      <p style="font-size:13px;color:#666;margin:0 0 28px;line-height:1.5;">${t('fc_noPayment')}</p>
      <button id="thankYouClose" style="width:100%;background:#CFDD28;color:#093D5E;border:none;border-radius:12px;padding:16px;font-size:16px;font-weight:700;cursor:pointer;letter-spacing:-0.01em;">
        ${t('backToHome')}
      </button>
    </div>
  `;

  document.body.appendChild(overlay);

  document.getElementById('thankYouClose').addEventListener('click', () => {
    window.location.href = 'index.html';
  });

  // Click outside → also go home
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) window.location.href = 'index.html';
  });
}

function showOnRequestConfirmPopup(onProceed) {
  document.getElementById('onRequestPopup')?.remove();

  const overlay = document.createElement('div');
  overlay.id = 'onRequestPopup';
  overlay.style.cssText = `
    position:fixed;inset:0;z-index:9999;
    background:rgba(9,61,94,0.7);backdrop-filter:blur(4px);
    display:flex;align-items:center;justify-content:center;padding:20px;
  `;

  overlay.innerHTML = `
    <div style="background:#fff;border-radius:20px;padding:36px 32px;max-width:460px;width:100%;text-align:center;box-shadow:0 24px 60px rgba(0,0,0,0.25);">
      <div style="font-size:44px;margin-bottom:12px;">📋</div>
      <h2 style="font-family:var(--font-display,sans-serif);font-size:22px;font-weight:800;color:#093D5E;margin:0 0 6px;letter-spacing:-0.02em;">${t('or_title')}</h2>
      <p style="font-size:14px;color:#64748b;margin:0 0 20px;line-height:1.5;">${t('or_intro')}</p>
      <div style="text-align:left;background:#f0f7ff;border-radius:12px;padding:18px 20px;margin-bottom:24px;">
        <div style="display:flex;gap:12px;align-items:flex-start;margin-bottom:14px;">
          <div style="background:#CFDD28;color:#093D5E;border-radius:50%;width:26px;height:26px;display:flex;align-items:center;justify-content:center;font-weight:800;font-size:12px;flex-shrink:0;">1</div>
          <div>
            <p style="margin:0;font-weight:700;color:#093D5E;font-size:14px;">${t('or_step1Title')}</p>
            <p style="margin:3px 0 0;color:#64748b;font-size:13px;">${t('or_step1Body')}</p>
          </div>
        </div>
        <div style="display:flex;gap:12px;align-items:flex-start;margin-bottom:14px;">
          <div style="background:#CFDD28;color:#093D5E;border-radius:50%;width:26px;height:26px;display:flex;align-items:center;justify-content:center;font-weight:800;font-size:12px;flex-shrink:0;">2</div>
          <div>
            <p style="margin:0;font-weight:700;color:#093D5E;font-size:14px;">${t('or_step2Title')}</p>
            <p style="margin:3px 0 0;color:#64748b;font-size:13px;">${t('or_step2Body')}</p>
          </div>
        </div>
        <div style="display:flex;gap:12px;align-items:flex-start;">
          <div style="background:#CFDD28;color:#093D5E;border-radius:50%;width:26px;height:26px;display:flex;align-items:center;justify-content:center;font-weight:800;font-size:12px;flex-shrink:0;">3</div>
          <div>
            <p style="margin:0;font-weight:700;color:#093D5E;font-size:14px;">${t('or_step3Title')}</p>
            <p style="margin:3px 0 0;color:#64748b;font-size:13px;">${t('or_step3Body')}</p>
          </div>
        </div>
      </div>
      <div style="display:flex;gap:10px;">
        <button id="onRequestCancel" style="flex:1;background:#f1f5f9;color:#475569;border:none;border-radius:12px;padding:14px;font-size:15px;font-weight:600;cursor:pointer;">
          ${t('or_cancel')}
        </button>
        <button id="onRequestSubmit" style="flex:2;background:#CFDD28;color:#093D5E;border:none;border-radius:12px;padding:14px;font-size:15px;font-weight:700;cursor:pointer;letter-spacing:-0.01em;">
          ${t('submitRequest')}
        </button>
      </div>
    </div>
  `;

  document.body.appendChild(overlay);

  const close = () => document.getElementById('onRequestPopup')?.remove();
  document.getElementById('onRequestCancel').addEventListener('click', close);
  document.getElementById('onRequestSubmit').addEventListener('click', () => { close(); onProceed(); });
  overlay.addEventListener('click', (e) => { if (e.target === overlay) close(); });
}

async function submitBooking(obj, timing) {
  const originalText = driverContinueBtn.textContent;
  driverContinueBtn.disabled = true;
  driverContinueBtn.textContent = t('processing');

  try {
    const payload = buildBookingPayload(obj, timing.afterHoursFee);
    const result = await apiPost('/api/bookings', payload);
    // Direct (instant) bookings: backend returns payment_url for Viva flow.
    // Redirect to payment.html where customer reviews booking + proceeds to Viva.
    if (result && result.payment_url) {
      window.location.href = result.payment_url;
      return;
    }
    const ref = result.reference || 'WLS-???';
    // Free (100% promo) booking: confirmed instantly, nothing to pay.
    if (result && result.free) {
      showFreeConfirmedPopup(ref, obj.email);
      return;
    }
    // Upon-request: show "Request received" popup.
    showThankYouPopup(ref, obj.email, driverTotalEl.textContent);
  } catch (err) {
    console.error('[Wheelso] Booking failed:', err);
    if (err.data?.error === 'fdw_age_restricted') {
      // Backend rejected Full Protection for a young/senior driver — downgrade locally,
      // re-sync every price display, and let the customer review + resubmit.
      currentProtection.selected = 'basic';
      populateDriverSummary();
      updateDriverTotal(checkPickupTiming().afterHoursFee);
      showFdwDowngradeNotice();
      driverContinueBtn.disabled = false;
      driverContinueBtn.textContent = originalText;
      return;
    }
    alert(`Sorry, we couldn't complete your booking:\n\n${err.message}\n\nPlease try again or contact us.`);
    driverContinueBtn.disabled = false;
    driverContinueBtn.textContent = originalText;
  }
}

if (driverContinueBtn) {
  driverContinueBtn.addEventListener('click', async () => {
    if (!validateDriverForm()) return;

    const timing = checkPickupTiming();
    if (!timing.ok) {
      alert(timing.warning);
      return;
    }

    const data = new FormData(driverForm);
    const obj = Object.fromEntries(data);
    const isUponRequest = !!currentProtection.vehicle?.admin_upon_request;

    if (isUponRequest) {
      showOnRequestConfirmPopup(() => submitBooking(obj, timing));
      return;
    }
    submitBooking(obj, timing);
  });
}

// ─── Country-code combobox (searchable, with flags + country names) ───
// Replaces the old single-field splitPhone() which silently defaulted to +30.
// The selected dial code is stored in the hidden #country input; #phone holds the
// national number only. country_code + phone are sent unchanged to the API.
function isoToFlag(iso) {
  if (!iso || iso.length !== 2) return '';
  const A = 0x1F1E6; // regional indicator 'A'
  return String.fromCodePoint(A + (iso.charCodeAt(0) - 65), A + (iso.charCodeAt(1) - 65));
}

function initCountryCombo() {
  const combo = document.getElementById('countryCombo');
  if (!combo) return;
  const toggle = document.getElementById('countryComboToggle');
  const valueEl = document.getElementById('countryComboValue');
  const panel = document.getElementById('countryComboPanel');
  const search = document.getElementById('countrySearch');
  const list = document.getElementById('countryComboList');
  const hidden = document.getElementById('country');

  const PRIORITY = ['GR', 'GB', 'DE', 'FR', 'IT', 'ES', 'US', 'NL', 'AT', 'CH'];
  const all = Array.isArray(window.COUNTRY_CODES) ? window.COUNTRY_CODES.slice() : [];
  const byIso = {};
  all.forEach(c => { byIso[c.iso] = c; });
  const ordered = [];
  PRIORITY.forEach(iso => { if (byIso[iso]) ordered.push(byIso[iso]); });
  all.filter(c => !PRIORITY.includes(c.iso)).forEach(c => ordered.push(c));
  if (!ordered.length) ordered.push({ iso: 'GR', name: 'Greece', dial: '+30' }); // fallback if country-codes.js missing

  // Preserve the localized placeholder text from the HTML ('Country code' / 'Κωδικός χώρας').
  const placeholderText = valueEl.textContent;

  function setSelection(c) {
    hidden.value = c.dial;
    valueEl.textContent = `${isoToFlag(c.iso)} ${c.dial}`;
    valueEl.classList.remove('country-combo-placeholder');
    toggle.classList.remove('invalid');
  }
  // No default selection — start empty so the customer must pick their own country
  // (the old +30 default was silently kept, mislabeling foreign numbers as Greek).
  hidden.value = '';
  valueEl.textContent = placeholderText;
  valueEl.classList.add('country-combo-placeholder');

  function render(filter) {
    const f = (filter || '').trim().toLowerCase();
    const items = f
      ? ordered.filter(c => c.name.toLowerCase().includes(f) || c.dial.includes(f) || c.iso.toLowerCase() === f)
      : ordered;
    list.innerHTML = items.length
      ? items.map(c => `<li class="country-combo-option" role="option" data-dial="${c.dial}" data-iso="${c.iso}" data-name="${escapeHtml(c.name)}">${isoToFlag(c.iso)} ${escapeHtml(c.name)} (${c.dial})</li>`).join('')
      : `<li class="country-combo-empty">No match</li>`;
  }
  function open() {
    render('');
    panel.hidden = false;
    toggle.setAttribute('aria-expanded', 'true');
    search.value = '';
    setTimeout(() => search.focus(), 0);
  }
  function close() {
    panel.hidden = true;
    toggle.setAttribute('aria-expanded', 'false');
  }
  toggle.addEventListener('click', () => { panel.hidden ? open() : close(); });
  search.addEventListener('input', () => render(search.value));
  list.addEventListener('click', (e) => {
    const li = e.target.closest('.country-combo-option');
    if (!li) return;
    setSelection({ iso: li.dataset.iso, name: li.dataset.name, dial: li.dataset.dial });
    close();
  });
  document.addEventListener('click', (e) => { if (!combo.contains(e.target)) close(); });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && !panel.hidden) close(); });
}
initCountryCombo();

function buildBookingPayload(formObj, afterHoursFee = 0) {
  const v = currentProtection.vehicle;
  const days = currentProtection.days;
  const rate = currentProtection.rate;
  const pkg = PROTECTION_PACKAGES.find(p => p.id === currentProtection.selected);

  const pickupStation = frontendValueToStationCode(searchCtx.pickup);
  const returnStation = searchCtx.return ? frontendValueToStationCode(searchCtx.return) : pickupStation;

  const vehicleDaily = rate === 'flex' ? v.price : bestPrice(v);
  const protectionDaily = pkg ? pkg.pricePerDay : 0;
  const carPriceTotal = +(vehicleDaily * days).toFixed(2);
  const protectionPriceTotal = +(protectionDaily * days).toFixed(2);
  const extrasPriceTotal = +calculateExtrasTotal().toFixed(2);
  const owFee = isOneWay ? oneWayFeeGross : 0;
  const totalPrice = +(carPriceTotal + protectionPriceTotal + extrasPriceTotal + afterHoursFee + owFee - getPromoDiscount()).toFixed(2);

  const extrasArr = Object.entries(selectedExtras)
    .filter(([, qty]) => qty > 0)
    .map(([id, qty]) => ({ code: id, quantity: qty }));

  return {
    first_name: formObj.firstName || '',
    last_name: formObj.lastName || '',
    email: formObj.email || '',
    phone: (formObj.phone || '').replace(/\s+/g, ''),
    country_code: formObj.country || '+30',
    pickup_station: pickupStation,
    return_station: returnStation,
    pickup_datetime: `${searchCtx.from}T${searchCtx.fromTime}:00`,
    return_datetime: `${searchCtx.to}T${searchCtx.toTime}:00`,
    car_code: v.code,
    rate_type: rate === 'flex' ? 'flex' : 'best_price',
    protection_code: pkg ? (pkg.id === 'none' ? 'no_extra' : pkg.id) : 'no_extra',
    after_hours_fee: afterHoursFee,
    one_way_fee: owFee,
    total_price: totalPrice,
    promo_discount_amount: getPromoDiscount() || null,
    promo_code: searchCtx.promo || null,
    driver_age: searchCtx.age || null,
    flight_ferry: formObj.flight || null,
    notes: formObj.notes || null,
    extras_json: extrasArr,
    ga_client_id: gaClientId,
    ga_session_id: gaSessionId
  };
}

// Shows the "switched to Basic Protection" notice on the driver page.
function showFdwDowngradeNotice() {
  const id = 'fdwDowngradeNotice';
  let el = document.getElementById(id);
  if (!el) {
    el = document.createElement('div');
    el.id = id;
    el.style.cssText = 'background:#fff8e1;border:1px solid #f59e0b;border-radius:10px;padding:12px 16px;margin:0 0 16px;font-size:14px;color:#92400e;';
    const form = document.getElementById('driverForm');
    if (form) form.prepend(el);
  }
  el.textContent = t('prot_fdwDowngraded');
  el.style.display = 'block';
  el.scrollIntoView({ behavior: 'smooth', block: 'center' });
}

function validateDriverForm() {
  let valid = true;

  const checkboxError = document.getElementById('checkboxError');
  if (checkboxError) checkboxError.hidden = true;

  // FDW safety net: young (21-25) / senior (70-75) drivers cannot keep Full Protection.
  // (Normally unreachable — the card is disabled at the protection step — but this guards
  // back-navigation / tampering and keeps the displayed total in sync before any charge.)
  if (isRestrictedAge(searchCtx.age) && currentProtection.selected === 'full') {
    currentProtection.selected = 'basic';
    populateDriverSummary();
    updateDriverTotal(checkPickupTiming().afterHoursFee);
    showFdwDowngradeNotice();
    return false;
  }

  // Country code is now mandatory (no silent +30 default) — block submit if unset.
  const countryHidden = document.getElementById('country');
  if (countryHidden && !countryHidden.value) {
    document.getElementById('countryComboToggle')?.classList.add('invalid');
    document.getElementById('countryCombo')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    return false;
  }

  const required = ['firstName', 'lastName', 'email', 'phone'];
  required.forEach(id => {
    const el = document.getElementById(id);
    if (!el) return;
    const v = el.value.trim();
    if (!v) {
      el.classList.add('invalid');
      valid = false;
    } else if (id === 'email' && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(v)) {
      el.classList.add('invalid');
      valid = false;
    } else {
      el.classList.remove('invalid');
    }
  });

  const ageOK = document.getElementById('ageConfirm')?.checked;
  const termsOK = document.getElementById('termsAgree')?.checked;
  if (!ageOK || !termsOK) {
    valid = false;
    if (checkboxError) {
      checkboxError.hidden = false;
      checkboxError.textContent = !ageOK
        ? 'Please confirm you are 21 or older and hold a valid driving licence.'
        : 'Please read and agree to the rental terms and privacy policy.';
      checkboxError.scrollIntoView({ behavior: 'smooth', block: 'center' });
    } else {
      const el = document.getElementById(!ageOK ? 'ageConfirm' : 'termsAgree');
      el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
    return false;
  }

  if (!valid) {
    const firstInvalid = driverForm.querySelector('.invalid');
    firstInvalid?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    firstInvalid?.focus();
  }
  return valid;
}

if (driverForm) {
  // Inject error div για checkboxes
  if (!document.getElementById('checkboxError')) {
    const errDiv = document.createElement('p');
    errDiv.id = 'checkboxError';
    errDiv.hidden = true;
    errDiv.style.cssText = 'color:#e03c3c;font-size:14px;font-weight:600;margin:8px 0 0;padding:10px 14px;background:#fff0f0;border:1.5px solid #e03c3c;border-radius:8px;';
    const termsEl = document.getElementById('termsAgree');
    const anchor = termsEl?.closest('label') || termsEl?.parentElement || driverForm.lastElementChild;
    anchor?.insertAdjacentElement('afterend', errDiv);
  }

  driverForm.addEventListener('input', (e) => {
    if (e.target.classList.contains('invalid')) e.target.classList.remove('invalid');
  });

  ['ageConfirm', 'termsAgree'].forEach(id => {
    document.getElementById(id)?.addEventListener('change', () => {
      const err = document.getElementById('checkboxError');
      if (err) err.hidden = true;
    });
  });
}

// ============================================
// INIT — load API data on page load
// ============================================
// ============================================
// STATIONS — same loader as script.js
// ============================================

// ─── PRE-SELECT PICKUP FROM URL PARAMETER ───
// Called after loadStationsFromAPI() populates the dropdowns.
// searchCtx.pickup is already set from the URL; loadAvailabilityPrices()
// already fetches and renders cars automatically. This only syncs the
// modify-panel dropdowns so they show the correct station if the user
// opens the modify panel without interacting first.
function applyUrlPickup() {
  const pickup = searchCtx.pickup;
  if (!pickup) return;

  const pickupEl = document.getElementById('modifyPickup');
  if (!pickupEl) return;

  const match = [...pickupEl.options].find(
    o => o.value.toLowerCase() === pickup.toLowerCase()
  );
  if (match) {
    pickupEl.value = match.value;
    // Pre-select return to same station (if not separately specified in URL)
    if (!searchCtx.return) {
      const returnEl = document.getElementById('modifyReturn');
      const retMatch = returnEl && [...returnEl.options].find(
        o => o.value.toLowerCase() === pickup.toLowerCase()
      );
      if (retMatch) returnEl.value = retMatch.value;
    }
    // console.log(`[Wheelso] Pre-selected pickup: "${match.value}" from URL param`);
  } else {
    console.warn(`[Wheelso] URL pickup "${pickup}" not found in station options`);
  }
}

function buildStationOptions(stations, includeDefault = true) {
  const regions = {};
  stations.forEach(s => {
    const region = s.region || s.name.split(' ')[0];
    if (!regions[region]) regions[region] = [];
    regions[region].push(s);
  });
  let html = includeDefault
    ? '<option value="" disabled selected>Select location...</option>'
    : '<option value="">Same as pick-up</option>';
  Object.entries(regions).forEach(([region, stns]) => {
    html += `<optgroup label="${escapeHtml(region)}">`;
    stns.forEach(s => {
      const val = s.code.toLowerCase();
      const icon = '';
      html += `<option value="${escapeHtml(val)}">${escapeHtml(s.name)}</option>`;
    });
    html += '</optgroup>';
  });
  return html;
}

async function loadStationsFromAPI() {
  try {
    const res = await apiGet('/api/stations');
    const stations = Array.isArray(res) ? res : (res.stations || []);
    if (stations.length === 0) return;
    ['modifyPickup', 'modifyReturn'].forEach((id) => {
      const el = document.getElementById(id);
      if (el) el.innerHTML = buildStationOptions(stations, true);
    });
    stations.forEach(s => {
      LOCATION_LABELS[s.code.toLowerCase()] = s.name;
    });
    // ─── PRE-SELECT FROM URL PARAMETER ───
    // Runs after options are injected so .value assignment works
    applyUrlPickup();
  } catch (err) {
    console.warn('[Wheelso Search] Could not load stations:', err.message);
  }
}

// ============================================
// AVAILABILITY PRICING — real prices from backend
// ============================================
async function loadAvailabilityPrices() {
  if (!searchCtx.pickup || !searchCtx.from || !searchCtx.to) return;

  try {
    const payload = {
      pickup_station: frontendValueToStationCode(searchCtx.pickup),
      return_station: searchCtx.return
        ? frontendValueToStationCode(searchCtx.return)
        : frontendValueToStationCode(searchCtx.pickup),
      pickup_datetime: `${searchCtx.from}T${searchCtx.fromTime}:00`,
      return_datetime: `${searchCtx.to}T${searchCtx.toTime}:00`
    };

    // Backend: availabilityRouter mounted at /api, POST / → /api/
    const result = await apiPost('/api/', payload);

    const cars = Array.isArray(result)
      ? result
      : (result.cars || result.available || result.vehicles || []);

    // Sync rentalDays with the backend's authoritative 24-hour billing value.
    // Local computeDays() uses only calendar dates (ignores pickup/return times),
    // so it can be wrong for time-crossing rentals (e.g. 30h = 1 calendar day but
    // 2 billing days). The backend already applies max(1, ceil((hours-2)/24)).
    if (result.days != null) {
      rentalDays = result.days;
      if (subtitleEl) subtitleEl.textContent = t('resultsSubtitleFor', { n: rentalDays, unit: rentalDays === 1 ? t('day') : t('days'), place: LOCATION_LABELS[searchCtx.pickup]?.split(' ')[0] || 'Greece' });
    }

    isOneWay = result.is_one_way === true;
    oneWayFeeGross = result.one_way_fee?.fee_total ? Number(result.one_way_fee.fee_total) : 0;

    if (cars.length > 0) {
      // Build set of car codes returned by backend (so we can hide cars NOT returned)
      const backendCodes = new Set(cars.map(c => c.code || c.car_code));

      // Hide vehicles not returned by backend (no pricing OR stopped for this date range)
      VEHICLES = VEHICLES.filter(v => backendCodes.has(v.code));

      cars.forEach(item => {
        const v = VEHICLES.find(x => x.code === item.code || x.code === item.car_code);
        if (v) {
          // Backend returns daily_avg as the per-day price
          if (item.daily_avg != null) v.price = Number(item.daily_avg);
          else if (item.price != null) v.price = Number(item.price);
          if (item.available === false) v.upon_request = true;
        }
      });
      renderResults();
      // console.log('[Wheelso] Availability prices loaded for', cars.length, 'cars');
    } else {
      // No cars returned (no pricing for this station/dates) → clear all vehicles
      VEHICLES = [];
      console.warn('[Wheelso] Availability returned 0 cars:', result.message || 'no message');
    }
  } catch (err) {
    console.warn('[Wheelso] Availability API failed, using default prices:', err.message);
  }
}

(async function initFromAPI() {
  await Promise.all([loadCategoriesFromAPI(), loadVehiclesFromAPI(), loadExtrasFromAPI(), loadStationsFromAPI()]);
  renderCategoryChips(); // render chips with real categories
  await loadAvailabilityPrices();
  renderResults();
  updateChipCounts();
  // console.log('[Wheelso Search] API data loaded:', VEHICLES.length, 'vehicles,', EXTRAS.length, 'extras');
})();

document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && driverPage && !driverPage.hidden) closeDriverPage();
});

// ============================================
// PRICE BREAKDOWN MODAL
// ============================================
const breakdownModal = document.getElementById('breakdownModal');
const breakdownContent = document.getElementById('breakdownContent');
const breakdownTotalEl = document.getElementById('breakdownTotal');

function buildBreakdown() {
  if (!currentProtection.vehicle) return;
  const v = currentProtection.vehicle;
  const days = currentProtection.days;
  const vehicleDaily = currentProtection.rate === 'flex' ? v.price : bestPrice(v);
  const pkg = PROTECTION_PACKAGES.find(p => p.id === currentProtection.selected);
  const protectionDaily = pkg ? pkg.pricePerDay : 0;
  const timing = checkPickupTiming();
  const afterHoursFee = timing.afterHoursFee || 0;

  const dayUnit = days === 1 ? t('day') : t('days');
  let html = '';
  html += `<div class="breakdown-section-title">${t('bd_vehicle')}</div>`;
  html += `<div class="breakdown-line">
    <span>${escapeHtml(v.name)}<span class="breakdown-line-meta">€${vehicleDaily.toFixed(2)}${t('perDay')} × ${days} ${dayUnit}</span></span>
    <strong>€${(vehicleDaily * days).toFixed(2)}</strong>
  </div>`;

  if (pkg) {
    html += `<div class="breakdown-divider"></div>`;
    html += `<div class="breakdown-section-title">${t('bd_protection')}</div>`;
    if (pkg.pricePerDay > 0) {
      html += `<div class="breakdown-line">
        <span>${escapeHtml(pkg.name)}<span class="breakdown-line-meta">€${pkg.pricePerDay.toFixed(2)}${t('perDay')} × ${days} ${dayUnit}</span></span>
        <strong>€${(pkg.pricePerDay * days).toFixed(2)}</strong>
      </div>`;
    } else {
      html += `<div class="breakdown-line"><span>${escapeHtml(pkg.name)}</span><strong>${t('included')}</strong></div>`;
    }
  }

  const extrasEntries = Object.entries(selectedExtras).filter(([, qty]) => qty > 0);
  if (extrasEntries.length > 0) {
    html += `<div class="breakdown-divider"></div>`;
    html += `<div class="breakdown-section-title">${t('bd_extras')}</div>`;
    extrasEntries.forEach(([id, qty]) => {
      const e = EXTRAS.find(x => x.id === id);
      if (!e) return;
      const lineTotal = e.pricePerDay * qty * days;
      const qtyLabel = qty > 1 ? ` × ${qty}` : '';
      html += `<div class="breakdown-line">
        <span>${escapeHtml(e.name)}${qtyLabel}<span class="breakdown-line-meta">€${e.pricePerDay.toFixed(2)}${t('perDay')}${qty > 1 ? ` × ${qty}` : ''} × ${days} ${dayUnit}</span></span>
        <strong>€${lineTotal.toFixed(2)}</strong>
      </div>`;
    });
  }

  if (afterHoursFee > 0 || (isOneWay && oneWayFeeGross > 0)) {
    html += `<div class="breakdown-divider"></div>`;
    html += `<div class="breakdown-section-title">${t('bd_fees')}</div>`;
    if (afterHoursFee > 0) {
      html += `<div class="breakdown-line">
        <span>${t('bd_afterHours')}<span class="breakdown-line-meta">${t('bd_afterHoursSub')}</span></span>
        <strong>€${afterHoursFee.toFixed(2)}</strong>
      </div>`;
    }
    if (isOneWay && oneWayFeeGross > 0) {
      html += `<div class="breakdown-line">
        <span>${t('bd_oneWay')}<span class="breakdown-line-meta">${t('bd_oneWaySub')}</span></span>
        <strong>€${oneWayFeeGross.toFixed(2)}</strong>
      </div>`;
    }
  }

  const promoDiscount = getPromoDiscount();
  if (promoDiscount > 0) {
    html += `<div class="breakdown-divider"></div>`;
    html += `<div class="breakdown-line">
      <span>${t('bd_promo', { code: escapeHtml(promoState.code || '') })}</span>
      <strong>−€${promoDiscount.toFixed(2)}</strong>
    </div>`;
  }
  breakdownContent.innerHTML = html;
  const baseTotal = (vehicleDaily + protectionDaily) * days;
  const extrasCost = calculateExtrasTotal();
  breakdownTotalEl.textContent = `€${(baseTotal + extrasCost + afterHoursFee + oneWayFeeGross - promoDiscount).toFixed(2)}`;
}

function openBreakdown() {
  if (!breakdownModal) return;
  buildBreakdown();
  breakdownModal.hidden = false;
  document.body.classList.add('breakdown-open');
  requestAnimationFrame(() => breakdownModal.classList.add('open'));
}

function closeBreakdown() {
  if (!breakdownModal) return;
  breakdownModal.classList.remove('open');
  document.body.classList.remove('breakdown-open');
  setTimeout(() => { breakdownModal.hidden = true; }, 220);
}

if (breakdownModal) {
  breakdownModal.addEventListener('click', (e) => {
    if (e.target.closest('[data-close-breakdown]')) closeBreakdown();
  });
  document.querySelectorAll('.protection-breakdown').forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      openBreakdown();
    });
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && !breakdownModal.hidden) closeBreakdown();
  });
}

// Language switcher
document.querySelectorAll('.lang-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.lang-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
  });
});

// ============ EXCLUDED EVENTS MODAL ============
(function() {
  const modal = document.getElementById('exclModal');
  const backdrop = document.getElementById('exclBackdrop');
  const closeBtn = document.getElementById('exclClose');
  if (!modal) return;

  function openExcl(e) { e.preventDefault(); modal.hidden = false; document.body.style.overflow = 'hidden'; }
  function closeExcl() { modal.hidden = true; document.body.style.overflow = ''; }

  document.addEventListener('click', (e) => {
    if (e.target.closest('.excl-trigger')) openExcl(e);
  });
  backdrop.addEventListener('click', closeExcl);
  closeBtn.addEventListener('click', closeExcl);
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && !modal.hidden) closeExcl(); });
})();

// ============ INFO CARDS (Payment / Cancellation) ============
function renderInfoCards() {
  const v = currentProtection.vehicle;
  if (!v) return;
  const pkg = PROTECTION_PACKAGES.find(p => p.id === currentProtection.selected);
  const days = currentProtection.days;
  const vehicleDaily = currentProtection.rate === 'flex' ? v.price : bestPrice(v);
  const protectionDaily = pkg ? pkg.pricePerDay : 0;
  const total = Math.max(0, ((vehicleDaily + protectionDaily) * days) + calculateExtrasTotal() - getPromoDiscount());
  const isFlex = currentProtection.rate === 'flex';
  const isUponRequest = !!v.admin_upon_request;

  const payCardSub  = document.getElementById('payCardSub');
  const payCardBody = document.getElementById('payCardBody');
  const cancelCardSub  = document.getElementById('cancelCardSub');
  const cancelCardBody = document.getElementById('cancelCardBody');
  if (!payCardSub || !payCardBody || !cancelCardSub || !cancelCardBody) return;

  // Format cancellation deadline: 72h before pickup datetime
  let deadlineStr = '';
  if (searchCtx.from && searchCtx.fromTime) {
    const pickupDt = new Date(`${searchCtx.from}T${searchCtx.fromTime}:00`);
    if (!isNaN(pickupDt.getTime())) {
      const deadline = new Date(pickupDt.getTime() - 72 * 60 * 60 * 1000);
      const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
      const hh = String(deadline.getHours()).padStart(2, '0');
      const mm = String(deadline.getMinutes()).padStart(2, '0');
      deadlineStr = `${deadline.getDate()} ${months[deadline.getMonth()]}, ${hh}:${mm}`;
    }
  }

  if (isUponRequest) {
    if (isFlex) {
      const deposit = total * 0.10;
      const balance = total - deposit;
      payCardSub.textContent = t('ic_payNothingToday');
      payCardBody.innerHTML = `
        <div class="pay-row">
          <span>${t('ic_payToday')}</span>
          <span><strong>€0.00</strong> <span class="pay-pill later">${t('ic_nothingNow')}</span></span>
        </div>
        <div class="pay-row">
          <span>${t('ic_depositAfterConfirm')}</span>
          <span><strong>€${deposit.toFixed(2)}</strong> <span class="pay-pill later">${t('ic_secureLink')}</span></span>
        </div>
        <div class="pay-row">
          <span>${t('ic_balanceAtCounter')}</span>
          <span><strong>€${balance.toFixed(2)}</strong> <span class="pay-pill later">${t('ic_atCounter')}</span></span>
        </div>
        <div class="pay-row highlight">
          <span>${t('total')}</span>
          <span>€${total.toFixed(2)}</span>
        </div>
      `;
    } else {
      payCardSub.textContent = t('ic_noPaymentNowConfirm');
      payCardBody.innerHTML = `
        <div class="pay-row">
          <span>${t('ic_payToday')}</span>
          <span><strong>€0.00</strong> <span class="pay-pill later">${t('ic_nothingNow')}</span></span>
        </div>
        <div class="pay-row">
          <span>${t('ic_afterConfirmation')}</span>
          <span><strong>€${total.toFixed(2)}</strong> <span class="pay-pill later">${t('ic_secureLink')}</span></span>
        </div>
      `;
    }
    cancelCardSub.textContent = t('ic_noChargeUntil');
    cancelCardBody.innerHTML = `
      <p class="cancel-row">${t('ic_reviewRequest')}</p>
    `;
  } else if (isFlex) {
    // PAY LATER
    const deposit  = total * 0.10;
    const balance  = total - deposit;
    payCardSub.textContent = t('ic_depositNowBalance');
    payCardBody.innerHTML = `
      <div class="pay-row">
        <span>${t('ic_payTodayDeposit')}</span>
        <span><strong>€${deposit.toFixed(2)}</strong> <span class="pay-pill now">${t('ic_onlineNow')}</span></span>
      </div>
      <div class="pay-row">
        <span>${t('ic_atPickupBalance')}</span>
        <span><strong>€${balance.toFixed(2)}</strong> <span class="pay-pill later">${t('ic_atCounter')}</span></span>
      </div>
      <div class="pay-row highlight">
        <span>${t('total')}</span>
        <span>€${total.toFixed(2)}</span>
      </div>
    `;

    cancelCardSub.textContent = t('ic_flexibleCancel');
    cancelCardBody.innerHTML = `
      <p class="cancel-row">${t('ic_cancelAnytimeFlex', { deposit: deposit.toFixed(2) })}</p>
      <p class="cancel-row" style="margin-top:10px;font-size:11.5px;color:#6B7280;">${t('ic_lateNotice')}</p>
    `;
  } else {
    // BEST PRICE — full pay now
    payCardSub.textContent = t('ic_fullOnlineToday');
    payCardBody.innerHTML = `
      <div class="pay-row">
        <span>${t('ic_payToday')}</span>
        <span><strong>€${total.toFixed(2)}</strong> <span class="pay-pill now">${t('ic_onlineNow')}</span></span>
      </div>
      <div class="pay-row">
        <span>${t('ic_atPickup')}</span>
        <span><strong>€0.00</strong></span>
      </div>
    `;

    cancelCardSub.textContent = t('ic_freeUntil72h');
    cancelCardBody.innerHTML = `
      <p class="cancel-row">${t('ic_cancelBestPriceText')}</p>
      ${deadlineStr ? `<div class="cancel-deadline"><svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>${t('ic_freeCancelUntil', { deadline: deadlineStr })}</div>` : ''}
      <p class="cancel-row" style="margin-top:10px;font-size:11.5px;color:#6B7280;">${t('ic_lateNotice')}</p>
    `;
  }

  const btn = document.getElementById('driverContinue');
  if (btn) btn.textContent = v.admin_upon_request ? t('submitRequest') : t('confirmAndPay');
}
