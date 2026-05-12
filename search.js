// ============================================
// WHEELSO — Search Results Page
// ============================================

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
const VEHICLES = [
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
        ${CAR_SVGS[v.category]}
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

  document.getElementById('modalPreviewImage').innerHTML = CAR_SVGS[v.category];
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
    closeVehicleModal();
    openProtectionPage(v, rentalDays, rateChoice);
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
const PROTECTION_PACKAGES = [
  { id: 'none', name: 'No extra protection', stars: 0, excessLabel: 'Liability:', excess: 'Up to full vehicle value', excessClass: 'danger', pricePerDay: 0, discount: null, features: { 'Loss Damage Waiver (including theft protection)': false, 'Tire & Windshield Protection': false, 'Personal Accident Protection': false, 'Roadside Protection': false, 'Interior Protection': false } },
  { id: 'basic', name: 'Basic Protection', stars: 1, excessLabel: 'Excess:', excess: 'Up to €800', excessClass: 'warning', pricePerDay: 1.65, discount: null, features: { 'Loss Damage Waiver (including theft protection)': true, 'Tire & Windshield Protection': false, 'Personal Accident Protection': false, 'Roadside Protection': false, 'Interior Protection': false } },
  { id: 'smart', name: 'Smart Protection', stars: 2, excessLabel: 'Excess:', excess: 'Zero excess', excessClass: 'good', pricePerDay: 14.02, oldPrice: 20.03, discount: '−30% online', features: { 'Loss Damage Waiver (including theft protection)': true, 'Tire & Windshield Protection': true, 'Personal Accident Protection': false, 'Roadside Protection': false, 'Interior Protection': false } },
  { id: 'all', name: 'All Inclusive Protection', stars: 3, excessLabel: 'Excess:', excess: 'Zero excess', excessClass: 'good', pricePerDay: 27.11, oldPrice: 41.71, discount: '−35% online', recommended: true, features: { 'Loss Damage Waiver (including theft protection)': true, 'Tire & Windshield Protection': true, 'Personal Accident Protection': true, 'Roadside Protection': true, 'Interior Protection': true } }
];

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

function openProtectionPage(v, days, rate) {
  currentProtection = { vehicle: v, days, rate, selected: 'basic' };
  renderProtectionGrid();
  updateProtectionTotal();

  if (overviewCancellation) {
    const cancelText = rate === 'flex'
      ? 'Total flexibility — Free cancellation any time before pick-up'
      : 'Best price — Free cancellation up to 48h before pick-up';
    overviewCancellation.innerHTML = `<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg> ${cancelText}`;
  }

  protectionPage.hidden = false;
  document.body.classList.add('protection-open');
  protectionPage.scrollTop = 0;
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
  alert(`Demo: Booking confirmed!\n\nVehicle: ${currentProtection.vehicle.name}\nDates: ${searchCtx.from} → ${searchCtx.to}\nRate: ${currentProtection.rate}\nProtection: ${currentProtection.selected}\nTotal: ${protectionTotal.textContent}`);
});

document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && protectionPage && !protectionPage.hidden) closeProtectionPage();
});

// Language switcher
document.querySelectorAll('.lang-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.lang-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
  });
});
