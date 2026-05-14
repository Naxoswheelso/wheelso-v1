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
    const err = new Error(data.error || `POST ${path} failed: ${res.status}`);
    err.data = data;
    throw err;
  }
  return data;
}

function frontendValueToStationCode(v) {
  return (v || '').toUpperCase();
}

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
  age: urlParams.get('age') || '25+',
  promo: urlParams.get('promo') || ''
};

// Compute days
function computeDays() {
  if (!searchCtx.from || !searchCtx.to) return 3;
  const d1 = new Date(searchCtx.from);
  const d2 = new Date(searchCtx.to);
  const diff = Math.round((d2 - d1) / 86400000);
  return diff > 0 ? diff : 3;
}
const rentalDays = computeDays();

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
if (subtitleEl) subtitleEl.textContent = `for ${rentalDays} ${rentalDays === 1 ? 'day' : 'days'} in ${LOCATION_LABELS[searchCtx.pickup]?.split(' ')[0] || 'Greece'}`;

// Search summary click → go back to home with focus on widget
document.getElementById('searchSummary').addEventListener('click', () => {
  window.location.href = 'index.html#booking';
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
    image_url: c.image_url || null
  };
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

const CATEGORY_LABELS = { economy: 'Economy', compact: 'Compact', intermediate: 'Intermediate', suv: 'SUV', premium: 'Premium', van: '7-Seater' };

const ICON_SEATS = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>';
const ICON_BAGS = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="7" width="18" height="13" rx="2"/><path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>';
const ICON_DOORS = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 21V5a2 2 0 0 0-2-2H7a2 2 0 0 0-2 2v16"/><line x1="3" y1="21" x2="21" y2="21"/><circle cx="15" cy="13" r="0.5" fill="currentColor"/></svg>';
const ICON_TRANS_AUTO = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><text x="12" y="16" text-anchor="middle" font-size="10" font-weight="700" fill="currentColor" stroke="none">A</text></svg>';
const ICON_TRANS_MAN = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><text x="12" y="16" text-anchor="middle" font-size="10" font-weight="700" fill="currentColor" stroke="none">M</text></svg>';

function renderVehicleCard(v) {
  const isAuto = v.transmission === 'auto';
  const totalForStay = (v.price * rentalDays).toFixed(2);
  return `
    <article class="vehicle-card" data-category="${v.category}" data-code="${v.code}" data-transmission="${v.transmission}" data-price="${v.price}">
      <div class="vehicle-image">
        ${isAuto ? '<span class="vehicle-badge transmission-auto">Auto</span>' : '<span class="vehicle-badge">Manual</span>'}
        ${v.image_url
          ? `<img src="https://wheelso-backend-production.up.railway.app${v.image_url}" alt="${v.name}" style="width:100%;height:100%;object-fit:contain;">`
          : CAR_SVGS[v.category]}
      </div>
      <div class="vehicle-body">
        <div class="vehicle-header">
          <span class="vehicle-category">${CATEGORY_LABELS[v.category]} · ${v.code}</span>
          <h3 class="vehicle-name">${v.name}</h3>
          <span class="vehicle-similar">${v.similar}</span>
        </div>
        <div class="vehicle-specs">
          <div class="spec">${ICON_SEATS}<span class="spec-value">${v.seats}</span></div>
          <div class="spec">${ICON_BAGS}<span class="spec-value">${v.bags}</span></div>
          <div class="spec">${ICON_DOORS}<span class="spec-value">${v.doors}</span></div>
          <div class="spec">${isAuto ? ICON_TRANS_AUTO : ICON_TRANS_MAN}<span class="spec-value">${isAuto ? 'Auto' : 'Man'}</span></div>
        </div>
        <div class="vehicle-footer">
          <div class="vehicle-price">
            <span class="price-from">From</span>
            <span><span class="price-amount">€${v.price}</span><span class="price-period">/day</span></span>
            <span class="price-total-stay">€${totalForStay} total for ${rentalDays} days</span>
          </div>
          <span class="vehicle-cta">
            Select
            <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
          </span>
        </div>
      </div>
    </article>
  `;
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
            ? "We're currently closed"
            : 'Too soon to book'
        }</h3>
        <p style="color:#64748b;font-size:15px;line-height:1.5;max-width:400px;margin:0 auto;">${timing.warning.replace('⚠️ ', '')}</p>
      </div>`;
    resultsEmpty.hidden = false;
    return;
  }

  resultsCount.textContent = list.length;
  if (list.length === 0) {
    fleetGrid.innerHTML = '';
    resultsEmpty.hidden = false;
  } else {
    resultsEmpty.hidden = true;
    fleetGrid.innerHTML = list.map(renderVehicleCard).join('');
  }
}

renderResults();

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

// Filter chip behavior
document.querySelectorAll('.filter-chip').forEach(chip => {
  chip.addEventListener('click', () => {
    document.querySelectorAll('.filter-chip').forEach(c => {
      c.classList.remove('active');
      c.setAttribute('aria-selected', 'false');
    });
    chip.classList.add('active');
    chip.setAttribute('aria-selected', 'true');
    currentFilter = chip.dataset.filter;
    renderResults();
  });
});

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
  const basePrice = v.price;

  function recalc() {
    const bookingOpt = vehicleModal.querySelector('input[name="bookingOption"]:checked')?.value;
    const dailyExtra = bookingOpt === 'flex' ? 1 : 0;
    const daily = basePrice + dailyExtra;
    const total = (daily * rentalDays).toFixed(2);
    document.getElementById('modalPriceDay').innerHTML = `<strong>€${daily.toFixed(2)}</strong> <span>/day</span>`;
    document.getElementById('modalPriceTotal').textContent = `€${total} total for ${rentalDays} days`;
  }

  document.getElementById('modalPreviewImage').innerHTML = v.image_url
    ? `<img src="https://wheelso-backend-production.up.railway.app${v.image_url}" alt="${v.name}" style="width:100%;height:100%;object-fit:contain;">`
    : CAR_SVGS[v.category];
  document.getElementById('modalCategory').textContent = `${CATEGORY_LABELS[v.category]} · ${v.code}`;
  document.getElementById('modalTitle').textContent = v.name;
  document.getElementById('modalSimilar').textContent = v.similar;
  document.getElementById('modalSpecs').innerHTML = `
    <div class="spec">${ICON_SEATS}<span class="spec-value">${v.seats} seats</span></div>
    <div class="spec">${ICON_BAGS}<span class="spec-value">${v.bags} bags</span></div>
    <div class="spec">${ICON_DOORS}<span class="spec-value">${v.doors} doors</span></div>
    <div class="spec">${isAuto ? ICON_TRANS_AUTO : ICON_TRANS_MAN}<span class="spec-value">${isAuto ? 'Auto' : 'Manual'}</span></div>
  `;

  vehicleModal.querySelectorAll('input[type="radio"]').forEach(r => { r.checked = r.defaultChecked; });
  vehicleModal.querySelectorAll('.modal-option').forEach(o => o.classList.remove('selected'));
  vehicleModal.querySelectorAll('input[type="radio"]:checked').forEach(r => r.closest('.modal-option').classList.add('selected'));

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
  vehicleModal.hidden = false;
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
// PROTECTION PAGE (same as index)
// ============================================
const DEFAULT_PROTECTION_PACKAGES = [
  { id: 'none', name: 'No extra protection', stars: 0, excessLabel: 'Liability:', excess: 'Up to full vehicle value', excessClass: 'danger', pricePerDay: 0, discount: null, features: { 'Loss Damage Waiver (including theft protection)': false, 'Tire & Windshield Protection': false, 'Personal Accident Protection': false, 'Roadside Protection': false, 'Interior Protection': false } },
  { id: 'basic', name: 'Basic Protection', stars: 1, excessLabel: 'Excess:', excess: 'Up to €800', excessClass: 'warning', pricePerDay: 1.65, discount: null, features: { 'Loss Damage Waiver (including theft protection)': true, 'Tire & Windshield Protection': false, 'Personal Accident Protection': false, 'Roadside Protection': false, 'Interior Protection': false } },
  { id: 'smart', name: 'Smart Protection', stars: 2, excessLabel: 'Excess:', excess: 'Zero excess', excessClass: 'good', pricePerDay: 14.02, oldPrice: 20.03, discount: '−30% online', features: { 'Loss Damage Waiver (including theft protection)': true, 'Tire & Windshield Protection': true, 'Personal Accident Protection': false, 'Roadside Protection': false, 'Interior Protection': false } },
  { id: 'all', name: 'All Inclusive Protection', stars: 3, excessLabel: 'Excess:', excess: 'Zero excess', excessClass: 'good', pricePerDay: 27.11, oldPrice: 41.71, discount: '−35% online', recommended: true, features: { 'Loss Damage Waiver (including theft protection)': true, 'Tire & Windshield Protection': true, 'Personal Accident Protection': true, 'Roadside Protection': true, 'Interior Protection': true } }
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
        if (p.features) { try { features = typeof p.features === 'string' ? JSON.parse(p.features) : p.features; } catch(e) {} }
        let excess = p.excess != null ? `Up to €${p.excess}` : (def.excess || '—');
        let excessClass = def.excessClass || 'warning';
        if (Number(p.excess) === 0) { excess = 'Zero excess'; excessClass = 'good'; }
        if (price === 0) { excess = def.excess || 'Up to full vehicle value'; excessClass = 'danger'; }
        return { id: code, name: p.name || def.name || code, stars: def.stars ?? 1, excessLabel: def.excessLabel || 'Excess:', excess, excessClass, pricePerDay: price, oldPrice, discount: discountLabel, recommended: def.recommended || false, features };
      });
      return;
    }
  } catch (err) {
    console.warn('[Wheelso] Protection API failed, using defaults:', err.message);
  }
  PROTECTION_PACKAGES = DEFAULT_PROTECTION_PACKAGES.slice();
}

const ICON_CHECK = '<svg class="protection-feature-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>';
const ICON_X = '<svg class="protection-feature-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>';

function renderStars(filled, total = 3) {
  let html = '<div class="protection-stars">';
  for (let i = 0; i < total; i++) {
    html += `<svg class="protection-star ${i < filled ? 'filled' : ''}" viewBox="0 0 24 24" fill="currentColor"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>`;
  }
  return html + '</div>';
}

function renderProtectionCard(pkg, selectedId) {
  const featuresHTML = Object.entries(pkg.features).map(([name, included]) => `
    <div class="protection-feature ${included ? 'included' : 'excluded'}">
      ${included ? ICON_CHECK : ICON_X}
      <span>${name}</span>
    </div>
  `).join('');

  let priceHTML;
  if (pkg.pricePerDay === 0) {
    priceHTML = `<div class="protection-price">Included <span>in rate</span></div>`;
  } else {
    priceHTML = `<div class="protection-price">€${pkg.pricePerDay.toFixed(2)} <span>/day</span>${pkg.oldPrice ? `<span class="protection-price-old">€${pkg.oldPrice.toFixed(2)}/day</span>` : ''}</div>`;
  }

  return `
    <div class="protection-card ${selectedId === pkg.id ? 'selected' : ''} ${pkg.recommended ? 'recommended' : ''}" data-pkg="${pkg.id}">
      <div class="protection-card-radio"></div>
      <h3 class="protection-card-name">${pkg.name}</h3>
      ${renderStars(pkg.stars)}
      ${pkg.discount ? `<span class="protection-discount">${pkg.discount}</span>` : ''}
      <div class="protection-excess ${pkg.excessClass}"><strong>${pkg.excessLabel}</strong>${pkg.excess}</div>
      <div class="protection-features">${featuresHTML}</div>
      ${priceHTML}
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
    const cancelText = rate === 'flex'
      ? 'Total flexibility — Free cancellation any time before pick-up'
      : 'Best price — Free cancellation up to 48h before pick-up';
    overviewCancellation.innerHTML = `<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg> ${cancelText}`;
  }

  await loadProtectionForCategory(v.category);
  if (!PROTECTION_PACKAGES.find(p => p.id === currentProtection.selected)) {
    currentProtection.selected = PROTECTION_PACKAGES[0]?.id || 'basic';
  }
  renderProtectionGrid();
  updateProtectionTotal();
}

function closeProtectionPage() {
  protectionPage.hidden = true;
  document.body.classList.remove('protection-open');
}

function renderProtectionGrid() {
  protectionGrid.innerHTML = PROTECTION_PACKAGES.map(p => renderProtectionCard(p, currentProtection.selected)).join('');
}

function updateProtectionTotal() {
  const v = currentProtection.vehicle;
  const days = currentProtection.days;
  const rateExtra = currentProtection.rate === 'flex' ? 1 : 0;
  const selectedPkg = PROTECTION_PACKAGES.find(p => p.id === currentProtection.selected);
  const protectionDaily = selectedPkg ? selectedPkg.pricePerDay : 0;
  const daily = v.price + rateExtra + protectionDaily;
  const total = (daily * days).toFixed(2);
  protectionTotal.textContent = `€${total}`;
}

protectionGrid.addEventListener('click', (e) => {
  const card = e.target.closest('.protection-card');
  if (!card) return;
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
  { id: 'additional-driver', name: 'Additional driver', priceLabel: '€6.66 / day per driver', pricePerDay: 6.66, perUnit: false, maxQty: 4, icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><line x1="19" y1="8" x2="19" y2="14"/><line x1="22" y1="11" x2="16" y2="11"/></svg>', summary: 'Share the wheel with a friend or partner.', details: 'Planning to swap drivers during the trip? Add anyone you trust behind the wheel. They\'ll just need to bring a valid driving licence to the desk when you collect the car.' },
  { id: 'gps', name: 'GPS navigation', priceLabel: '€8 / day', pricePerDay: 8, perUnit: false, maxQty: 4, icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="3 11 22 2 13 21 11 13 3 11"/></svg>', summary: 'Pre-loaded with Greek maps and points of interest.', details: 'Stay on track even without mobile data. Our portable GPS unit comes pre-loaded with detailed maps of Greece and the Cyclades, plus suggested routes to beaches, viewpoints, and tavernas.' },
  { id: 'child-seat', name: 'Child seat (4-7 years)', priceLabel: '€5 / day', pricePerDay: 5, perUnit: true, maxQty: 4, icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 4h-1V2h-2v2H8V2H6v2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2z"/><path d="M12 11v6"/><path d="M9 14h6"/></svg>', summary: 'Forward-facing seat for kids 4-7 years old (15-25kg).', details: 'Approved booster-style seat that meets all EU safety standards. Installed by our team at pick-up, ready to go. Choose the quantity if you need more than one.' },
  { id: 'baby-seat', name: 'Baby seat (0-3 years)', priceLabel: '€5 / day', pricePerDay: 5, perUnit: true, maxQty: 4, icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M9 11h.01M15 11h.01M8 16s1.5 2 4 2 4-2 4-2"/></svg>', summary: 'Rear-facing seat for infants and toddlers (0-13kg).', details: 'A secure, comfortable rear-facing seat for your little one. Side-impact protection and adjustable harness included.' },
  { id: 'wifi', name: 'Portable WiFi hotspot', priceLabel: '€7 / day', pricePerDay: 7, perUnit: false, maxQty: 4, icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12.55a11 11 0 0 1 14.08 0"/><path d="M1.42 9a16 16 0 0 1 21.16 0"/><path d="M8.53 16.11a6 6 0 0 1 6.95 0"/><line x1="12" y1="20" x2="12.01" y2="20"/></svg>', summary: 'Unlimited 4G data for up to 10 devices.', details: 'Stay connected wherever you go. Our pocket-sized hotspot delivers fast 4G across Greece and supports up to 10 devices at once.' },
  { id: 'roof-rack', name: 'Roof rack', priceLabel: '€4 / day', pricePerDay: 4, perUnit: false, maxQty: 4, icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="6" width="20" height="2"/><line x1="6" y1="6" x2="6" y2="14"/><line x1="18" y1="6" x2="18" y2="14"/><path d="M3 14h18v6H3z"/></svg>', summary: 'Extra cargo space for surf boards, bikes, or luggage.', details: 'Bringing surf gear, bikes, or extra suitcases? Our roof rack adds carrying capacity without crowding the cabin.' }
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
        return { id, name: e.name || def.name || id, priceLabel: perUnit ? `€${price.toFixed(2)} / day per item` : `€${price.toFixed(2)} / day`, pricePerDay: price, perUnit, maxQty: e.max_qty || 4, icon: def.icon || ICON_EXTRA_DEFAULT, summary: e.description || def.summary || '', details: def.details || e.description || '' };
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
      <div class="extra-card ${isOn ? 'selected' : ''}" data-extra="${extra.id}">
        <div class="extra-row">
          <div class="extra-icon">${extra.icon}</div>
          <div class="extra-info">
            <h3 class="extra-name">${extra.name}</h3>
            <p class="extra-summary">${extra.summary}</p>
            <span class="extra-price">${extra.priceLabel}</span>
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
          What's included
          <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"/></svg>
        </button>
        <div class="extra-details" hidden>
          <p>${extra.details}</p>
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
  const rateExtra = currentProtection.rate === 'flex' ? 1 : 0;
  const selectedPkg = PROTECTION_PACKAGES.find(p => p.id === currentProtection.selected);
  const protectionDaily = selectedPkg ? selectedPkg.pricePerDay : 0;
  const baseTotal = (v.price + rateExtra + protectionDaily) * days;
  const extrasCost = calculateExtrasTotal();
  extrasTotal.textContent = `€${(baseTotal + extrasCost).toFixed(2)}`;
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
      <div class="summary-vehicle-image">${CAR_SVGS[v.category]}</div>
      <div class="summary-vehicle-info">
        <span class="summary-vehicle-cat">${CATEGORY_LABELS[v.category]}</span>
        <span class="summary-vehicle-name">${v.name}</span>
        <span class="summary-vehicle-similar">${v.similar}</span>
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
  if (sRate) sRate.textContent = currentProtection.rate === 'flex' ? 'Total flexibility · Free cancellation anytime' : 'Best price · Free cancellation up to 48h before';
  if (sProt) sProt.textContent = pkg ? pkg.name : 'Protection package';
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
const driverForm = document.getElementById('driverForm');

function openDriverPage() {
  if (!driverPage) return;
  populateDriverSummary();
  if (extrasPage) extrasPage.hidden = true;
  driverPage.hidden = false;
  document.body.classList.add('protection-open');
  driverPage.scrollTop = 0;

  // Show after-hours warning if applicable
  const timing = checkPickupTiming();
  showAfterHoursWarning(timing.warning);

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
      <div class="summary-vehicle-image">${CAR_SVGS[v.category]}</div>
      <div class="summary-vehicle-info">
        <span class="summary-vehicle-cat">${CATEGORY_LABELS[v.category]}</span>
        <span class="summary-vehicle-name">${v.name}</span>
        <span class="summary-vehicle-similar">${v.similar}</span>
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

  document.getElementById('driverSummaryRate').textContent = currentProtection.rate === 'flex'
    ? 'Total flexibility'
    : 'Best price · Free cancellation up to 48h before';
  document.getElementById('driverSummaryProtection').textContent = pkg ? pkg.name : 'Protection package';

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
  const rateExtra = currentProtection.rate === 'flex' ? 1 : 0;
  const protectionDaily = pkg ? pkg.pricePerDay : 0;
  const baseTotal = (v.price + rateExtra + protectionDaily) * days;
  const extrasCost = calculateExtrasTotal();
  driverTotalEl.textContent = `€${(baseTotal + extrasCost).toFixed(2)}`;
}

function updateDriverTotal(afterHoursFee = 0) {
  const v = currentProtection.vehicle;
  if (!v) return;
  const days = currentProtection.days;
  const rateExtra = currentProtection.rate === 'flex' ? 1 : 0;
  const pkg = PROTECTION_PACKAGES.find(p => p.id === currentProtection.selected);
  const protectionDaily = pkg ? pkg.pricePerDay : 0;
  const baseTotal = (v.price + rateExtra + protectionDaily) * days;
  const extrasCost = calculateExtrasTotal();
  driverTotalEl.textContent = `€${(baseTotal + extrasCost + afterHoursFee).toFixed(2)}`;
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
  const pickupHour = pickupDT.getHours();
  const returnHour = returnDT.getHours();

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
  const pickupOutside = pickupHour < BUSINESS_OPEN || pickupHour >= BUSINESS_CLOSE;
  const returnOutside = returnHour < BUSINESS_OPEN || returnHour >= BUSINESS_CLOSE;
  const feeCount = (pickupOutside ? 1 : 0) + (returnOutside ? 1 : 0);
  const afterHoursFee = feeCount * AFTER_HOURS_FEE;

  let warning = null;
  if (afterHoursFee > 0) {
    const parts = [];
    if (pickupOutside) parts.push(`pick-up at ${searchCtx.fromTime}`);
    if (returnOutside) parts.push(`return at ${searchCtx.toTime}`);
    warning = `⚠️ After-hours fee: +€${afterHoursFee} for ${parts.join(' and ')} (outside 09:00–21:00).`;
  }

  return { ok: true, afterHoursFee, warning };
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
function showThankYouPopup(ref, email, total) {
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
      <div style="font-size:52px;margin-bottom:16px;">🇬🇷</div>
      <h2 style="font-family:var(--font-display,sans-serif);font-size:26px;font-weight:800;color:#093D5E;margin:0 0 8px;letter-spacing:-0.02em;">Booking confirmed!</h2>
      <p style="font-size:16px;color:#1C5875;font-weight:600;margin:0 0 20px;">We'll see you in Greece!</p>
      <div style="background:#f0f7ff;border-radius:12px;padding:16px 20px;margin-bottom:20px;">
        <p style="font-size:13px;color:#64748b;margin:0 0 4px;font-weight:500;">Your booking reference</p>
        <p style="font-size:22px;font-weight:800;color:#093D5E;letter-spacing:0.05em;margin:0;">${ref}</p>
      </div>
      <p style="font-size:14px;color:#64748b;margin:0 0 28px;line-height:1.5;">
        A confirmation email has been sent to<br>
        <strong style="color:#093D5E;">${email}</strong>
      </p>
      <div style="font-size:18px;font-weight:700;color:#093D5E;margin-bottom:28px;">Total: ${total}</div>
      <button id="thankYouClose" style="width:100%;background:#CFDD28;color:#093D5E;border:none;border-radius:12px;padding:16px;font-size:16px;font-weight:700;cursor:pointer;letter-spacing:-0.01em;">
        Back to Home
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

if (driverContinueBtn) {
  driverContinueBtn.addEventListener('click', async () => {
    if (!validateDriverForm()) return;

    // Lead time / after-hours check
    const timing = checkPickupTiming();
    if (!timing.ok) {
      alert(timing.warning);
      return;
    }

    const data = new FormData(driverForm);
    const obj = Object.fromEntries(data);

    const originalText = driverContinueBtn.textContent;
    driverContinueBtn.disabled = true;
    driverContinueBtn.textContent = 'Processing…';

    try {
      const payload = buildBookingPayload(obj, timing.afterHoursFee);
      const result = await apiPost('/api/bookings', payload);
      const ref = result.reference || 'WLS-???';
      showThankYouPopup(ref, obj.email, driverTotalEl.textContent);
    } catch (err) {
      console.error('[Wheelso] Booking failed:', err);
      alert(`Sorry, we couldn't complete your booking:\n\n${err.message}\n\nPlease try again or contact us.`);
      driverContinueBtn.disabled = false;
      driverContinueBtn.textContent = originalText;
    }
  });
}

function buildBookingPayload(formObj, afterHoursFee = 0) {
  const v = currentProtection.vehicle;
  const days = currentProtection.days;
  const rate = currentProtection.rate;
  const pkg = PROTECTION_PACKAGES.find(p => p.id === currentProtection.selected);

  const pickupStation = frontendValueToStationCode(searchCtx.pickup);
  const returnStation = searchCtx.return ? frontendValueToStationCode(searchCtx.return) : pickupStation;

  const rateExtra = rate === 'flex' ? 1 : 0;
  const protectionDaily = pkg ? pkg.pricePerDay : 0;
  const carPriceTotal = +((v.price + rateExtra) * days).toFixed(2);
  const protectionPriceTotal = +(protectionDaily * days).toFixed(2);
  const extrasPriceTotal = +calculateExtrasTotal().toFixed(2);
  const totalPrice = +(carPriceTotal + protectionPriceTotal + extrasPriceTotal + afterHoursFee).toFixed(2);

  const extrasArr = Object.entries(selectedExtras)
    .filter(([, qty]) => qty > 0)
    .map(([id, qty]) => {
      const e = EXTRAS.find(x => x.id === id);
      return { code: id, name: e?.name || id, quantity: qty, price_per_day: e?.pricePerDay || 0, total: +((e?.pricePerDay || 0) * qty * days).toFixed(2) };
    });

  return {
    first_name: formObj.firstName || '',
    last_name: formObj.lastName || '',
    email: formObj.email || '',
    phone: formObj.phone || '',
    country_code: formObj.country || null,
    pickup_station: pickupStation,
    return_station: returnStation,
    pickup_datetime: `${searchCtx.from}T${searchCtx.fromTime}:00`,
    return_datetime: `${searchCtx.to}T${searchCtx.toTime}:00`,
    car_code: v.code,
    rate_type: rate === 'flex' ? 'flex' : 'best_price',
    protection_code: pkg ? (pkg.id === 'none' ? 'no_extra' : pkg.id) : 'no_extra',
    car_price: carPriceTotal,
    protection_price: protectionPriceTotal,
    extras_price: extrasPriceTotal,
    after_hours_fee: afterHoursFee,
    total_price: totalPrice,
    discount_amount: 0,
    promo_code: searchCtx.promo || null,
    driver_age: searchCtx.age || null,
    flight_ferry: formObj.flight || null,
    notes: formObj.notes || null,
    extras_json: extrasArr
  };
}

function validateDriverForm() {
  let valid = true;

  const checkboxError = document.getElementById('checkboxError');
  if (checkboxError) checkboxError.hidden = true;

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
    html += `<optgroup label="📍 ${region}">`;
    stns.forEach(s => {
      const val = s.code.toLowerCase();
      const icon = s.type === 'airport' ? '✈️' : s.type === 'port' ? '⚓' : '🏙️';
      html += `<option value="${val}">${icon} ${s.name}</option>`;
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
    ['modifyPickup', 'modifyReturn'].forEach((id, i) => {
      const el = document.getElementById(id);
      if (el) el.innerHTML = buildStationOptions(stations, i === 0);
    });
    stations.forEach(s => {
      LOCATION_LABELS[s.code.toLowerCase()] = s.name;
    });
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

    if (cars.length > 0) {
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
      console.log('[Wheelso] Availability prices loaded for', cars.length, 'cars');
    } else {
      console.warn('[Wheelso] Availability returned 0 cars:', result.message || 'no message');
    }
  } catch (err) {
    console.warn('[Wheelso] Availability API failed, using default prices:', err.message);
  }
}

(async function initFromAPI() {
  await Promise.all([loadVehiclesFromAPI(), loadExtrasFromAPI(), loadStationsFromAPI()]);
  // After vehicles loaded, fetch real prices
  await loadAvailabilityPrices();
  console.log('[Wheelso Search] API data loaded:', VEHICLES.length, 'vehicles,', EXTRAS.length, 'extras');
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
  const rateExtra = currentProtection.rate === 'flex' ? 1 : 0;
  const pkg = PROTECTION_PACKAGES.find(p => p.id === currentProtection.selected);
  const protectionDaily = pkg ? pkg.pricePerDay : 0;
  const timing = checkPickupTiming();
  const afterHoursFee = timing.afterHoursFee || 0;

  let html = '';
  html += `<div class="breakdown-section-title">Vehicle</div>`;
  html += `<div class="breakdown-line">
    <span>${v.name}<span class="breakdown-line-meta">€${v.price}/day × ${days} ${days===1?'day':'days'}</span></span>
    <strong>€${(v.price * days).toFixed(2)}</strong>
  </div>`;

  if (rateExtra > 0) {
    html += `<div class="breakdown-line">
      <span>Total flexibility upgrade<span class="breakdown-line-meta">+€${rateExtra}/day × ${days} ${days===1?'day':'days'}</span></span>
      <strong>€${(rateExtra * days).toFixed(2)}</strong>
    </div>`;
  }

  if (pkg) {
    html += `<div class="breakdown-divider"></div>`;
    html += `<div class="breakdown-section-title">Protection</div>`;
    if (pkg.pricePerDay > 0) {
      html += `<div class="breakdown-line">
        <span>${pkg.name}<span class="breakdown-line-meta">€${pkg.pricePerDay.toFixed(2)}/day × ${days} ${days===1?'day':'days'}</span></span>
        <strong>€${(pkg.pricePerDay * days).toFixed(2)}</strong>
      </div>`;
    } else {
      html += `<div class="breakdown-line"><span>${pkg.name}</span><strong>Included</strong></div>`;
    }
  }

  const extrasEntries = Object.entries(selectedExtras).filter(([, qty]) => qty > 0);
  if (extrasEntries.length > 0) {
    html += `<div class="breakdown-divider"></div>`;
    html += `<div class="breakdown-section-title">Extras</div>`;
    extrasEntries.forEach(([id, qty]) => {
      const e = EXTRAS.find(x => x.id === id);
      if (!e) return;
      const lineTotal = e.pricePerDay * qty * days;
      const qtyLabel = qty > 1 ? ` × ${qty}` : '';
      html += `<div class="breakdown-line">
        <span>${e.name}${qtyLabel}<span class="breakdown-line-meta">€${e.pricePerDay.toFixed(2)}/day${qty > 1 ? ` × ${qty}` : ''} × ${days} ${days===1?'day':'days'}</span></span>
        <strong>€${lineTotal.toFixed(2)}</strong>
      </div>`;
    });
  }

  if (afterHoursFee > 0) {
    html += `<div class="breakdown-divider"></div>`;
    html += `<div class="breakdown-section-title">Fees</div>`;
    html += `<div class="breakdown-line">
      <span>After-hours service fee<span class="breakdown-line-meta">Outside 09:00–21:00</span></span>
      <strong>€${afterHoursFee.toFixed(2)}</strong>
    </div>`;
  }

  breakdownContent.innerHTML = html;
  const baseTotal = (v.price + rateExtra + protectionDaily) * days;
  const extrasCost = calculateExtrasTotal();
  breakdownTotalEl.textContent = `€${(baseTotal + extrasCost + afterHoursFee).toFixed(2)}`;
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
