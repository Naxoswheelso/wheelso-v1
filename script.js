// ============================================
// WHEELSO — Interactivity
// ============================================

// Sticky header shadow on scroll
const header = document.getElementById('siteHeader');
window.addEventListener('scroll', () => {
  if (window.scrollY > 8) {
    header.classList.add('scrolled');
  } else {
    header.classList.remove('scrolled');
  }
}, { passive: true });

// Different return location toggle
const diffReturn = document.getElementById('diffReturn');
const returnLocationField = document.getElementById('returnLocationField');
diffReturn.addEventListener('change', (e) => {
  returnLocationField.hidden = !e.target.checked;
});

// Populate time selects (every 30 min, 24h format)
function populateTimeSelect(selectEl, defaultVal) {
  const times = [];
  for (let h = 6; h <= 22; h++) {
    for (let m = 0; m < 60; m += 30) {
      times.push(`${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`);
    }
  }
  selectEl.innerHTML = times.map(t =>
    `<option value="${t}"${t === defaultVal ? ' selected' : ''}>${t}</option>`
  ).join('');
}
populateTimeSelect(document.getElementById('pickupTime'), '10:00');
populateTimeSelect(document.getElementById('returnTime'), '10:00');

// ============================================
// DATE RANGE PICKER
// ============================================
const MONTHS_EN = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const DOW_EN = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

const dateRangeTrigger = document.getElementById('dateRangeTrigger');
const dateRangePopover = document.getElementById('dateRangePopover');
const calMonth1 = document.getElementById('calMonth1');
const calMonth2 = document.getElementById('calMonth2');
const calTitle1 = document.getElementById('calTitle1');
const calTitle2 = document.getElementById('calTitle2');
const calPrev = document.getElementById('calPrev');
const calNext = document.getElementById('calNext');
const dateRangeHint = document.getElementById('dateRangeHint');
const dateRangeClear = document.getElementById('dateRangeClear');
const dateRangeApply = document.getElementById('dateRangeApply');
const pickupDisplay = document.getElementById('pickupDisplay');
const returnDisplay = document.getElementById('returnDisplay');
const pickupDateInput = document.getElementById('pickupDate');
const returnDateInput = document.getElementById('returnDate');

// State
const today = new Date(); today.setHours(0, 0, 0, 0);
let viewDate = new Date(today.getFullYear(), today.getMonth(), 1);
let pickupDate = new Date(today);
let returnDate = new Date(today);
returnDate.setDate(returnDate.getDate() + 3);
let hoverDate = null;
let pickingState = 'pickup';

// Helpers
const isSameDay = (a, b) => a && b && a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
const isBefore = (a, b) => a.getTime() < b.getTime();
const isAfter = (a, b) => a.getTime() > b.getTime();
const isInRange = (d, s, e) => d.getTime() > s.getTime() && d.getTime() < e.getTime();
const addMonths = (d, n) => new Date(d.getFullYear(), d.getMonth() + n, 1);

function formatDisplay(d) {
  if (!d) return '—';
  const dow = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'][d.getDay()];
  return `${dow}, ${d.getDate()} ${MONTHS_EN[d.getMonth()].slice(0, 3)}`;
}
function formatISO(d) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function renderMonth(container, baseDate) {
  const year = baseDate.getFullYear();
  const month = baseDate.getMonth();
  const firstDay = new Date(year, month, 1);
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  let startDow = firstDay.getDay() - 1;
  if (startDow < 0) startDow = 6;

  let html = '';
  DOW_EN.forEach(d => html += `<div class="cal-dow">${d}</div>`);

  for (let i = 0; i < startDow; i++) {
    html += '<div class="cal-day empty"></div>';
  }

  for (let day = 1; day <= daysInMonth; day++) {
    const d = new Date(year, month, day);
    const classes = ['cal-day'];

    if (d.getTime() < today.getTime()) classes.push('disabled');
    if (isSameDay(d, today)) classes.push('today');

    if (pickupDate && returnDate) {
      if (isSameDay(d, pickupDate)) classes.push('range-start');
      if (isSameDay(d, returnDate)) classes.push('range-end');
      if (isInRange(d, pickupDate, returnDate)) classes.push('in-range');
    } else if (pickupDate && !returnDate) {
      if (isSameDay(d, pickupDate)) classes.push('range-start');
    }

    if (pickingState === 'return' && pickupDate && !returnDate && hoverDate && isAfter(hoverDate, pickupDate)) {
      if (isInRange(d, pickupDate, hoverDate)) classes.push('preview-range');
      if (isSameDay(d, hoverDate)) classes.push('preview-end');
    }

    html += `<div class="${classes.join(' ')}" data-date="${formatISO(d)}"><span>${day}</span></div>`;
  }

  container.innerHTML = html;
}

function renderCalendar() {
  const m1 = viewDate;
  const m2 = addMonths(viewDate, 1);
  calTitle1.textContent = `${MONTHS_EN[m1.getMonth()]} ${m1.getFullYear()}`;
  calTitle2.textContent = `${MONTHS_EN[m2.getMonth()]} ${m2.getFullYear()}`;
  renderMonth(calMonth1, m1);
  renderMonth(calMonth2, m2);

  const currentMonth = new Date(today.getFullYear(), today.getMonth(), 1);
  calPrev.disabled = viewDate.getTime() <= currentMonth.getTime();

  if (pickingState === 'pickup' && !pickupDate) {
    dateRangeHint.innerHTML = 'Select <strong>pick-up date</strong>';
  } else if (pickingState === 'return') {
    dateRangeHint.innerHTML = 'Select <strong>return date</strong>';
  } else if (pickupDate && returnDate) {
    const nights = Math.round((returnDate - pickupDate) / 86400000);
    dateRangeHint.innerHTML = `<strong>${nights} day${nights !== 1 ? 's' : ''}</strong> selected`;
  }

  dateRangeApply.disabled = !(pickupDate && returnDate);
}

function updateDisplays() {
  if (pickupDate) {
    pickupDisplay.textContent = formatDisplay(pickupDate);
    pickupDisplay.classList.remove('placeholder');
    pickupDateInput.value = formatISO(pickupDate);
  } else {
    pickupDisplay.textContent = 'Select date';
    pickupDisplay.classList.add('placeholder');
    pickupDateInput.value = '';
  }
  if (returnDate) {
    returnDisplay.textContent = formatDisplay(returnDate);
    returnDisplay.classList.remove('placeholder');
    returnDateInput.value = formatISO(returnDate);
  } else {
    returnDisplay.textContent = 'Select date';
    returnDisplay.classList.add('placeholder');
    returnDateInput.value = '';
  }
}

function handleDayClick(e) {
  e.stopPropagation();
  const cell = e.target.closest('.cal-day');
  if (!cell || cell.classList.contains('empty') || cell.classList.contains('disabled')) return;

  const [y, m, d] = cell.dataset.date.split('-').map(Number);
  const clicked = new Date(y, m - 1, d);

  if (pickingState === 'pickup' || !pickupDate || (pickupDate && returnDate)) {
    pickupDate = clicked;
    returnDate = null;
    pickingState = 'return';
  } else if (pickingState === 'return') {
    if (isBefore(clicked, pickupDate)) {
      pickupDate = clicked;
      returnDate = null;
    } else if (isSameDay(clicked, pickupDate)) {
      returnDate = new Date(clicked);
      returnDate.setDate(returnDate.getDate() + 1);
      pickingState = 'pickup';
    } else {
      returnDate = clicked;
      pickingState = 'pickup';
    }
  }

  hoverDate = null;
  renderCalendar();
  updateDisplays();
}

function handleDayHover(e) {
  if (pickingState !== 'return' || !pickupDate || returnDate) return;
  const cell = e.target.closest('.cal-day');
  if (!cell || cell.classList.contains('empty') || cell.classList.contains('disabled')) {
    if (hoverDate) { hoverDate = null; renderCalendar(); }
    return;
  }
  const [y, m, d] = cell.dataset.date.split('-').map(Number);
  const newHover = new Date(y, m - 1, d);
  if (!hoverDate || !isSameDay(hoverDate, newHover)) {
    hoverDate = newHover;
    renderCalendar();
  }
}

function handleMouseLeave() {
  if (hoverDate) {
    hoverDate = null;
    renderCalendar();
  }
}

function openPopover() {
  dateRangePopover.hidden = false;
  dateRangeTrigger.classList.add('open');
  dateRangeTrigger.setAttribute('aria-expanded', 'true');
  document.body.classList.add('daterange-open');
  if (pickupDate) {
    viewDate = new Date(pickupDate.getFullYear(), pickupDate.getMonth(), 1);
  }
  if (pickupDate && returnDate) {
    pickingState = 'pickup';
  }
  renderCalendar();
}

function closePopover() {
  dateRangePopover.hidden = true;
  dateRangeTrigger.classList.remove('open');
  dateRangeTrigger.setAttribute('aria-expanded', 'false');
  document.body.classList.remove('daterange-open');
  hoverDate = null;
}

dateRangeTrigger.addEventListener('click', (e) => {
  e.stopPropagation();
  if (dateRangePopover.hidden) openPopover();
  else closePopover();
});

calPrev.addEventListener('click', (e) => {
  e.stopPropagation();
  viewDate = addMonths(viewDate, -1);
  renderCalendar();
});

calNext.addEventListener('click', (e) => {
  e.stopPropagation();
  viewDate = addMonths(viewDate, 1);
  renderCalendar();
});

calMonth1.addEventListener('click', handleDayClick);
calMonth2.addEventListener('click', handleDayClick);
calMonth1.addEventListener('mousemove', handleDayHover);
calMonth2.addEventListener('mousemove', handleDayHover);
calMonth1.addEventListener('mouseleave', handleMouseLeave);
calMonth2.addEventListener('mouseleave', handleMouseLeave);

dateRangeClear.addEventListener('click', (e) => {
  e.stopPropagation();
  pickupDate = null;
  returnDate = null;
  pickingState = 'pickup';
  renderCalendar();
  updateDisplays();
});

dateRangeApply.addEventListener('click', (e) => {
  e.stopPropagation();
  if (pickupDate && returnDate) closePopover();
});

document.addEventListener('click', (e) => {
  if (dateRangePopover.hidden) return;
  if (!dateRangePopover.contains(e.target) && !dateRangeTrigger.contains(e.target)) {
    closePopover();
  }
});

document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && !dateRangePopover.hidden) closePopover();
});

updateDisplays();
renderCalendar();

// ============================================
// FORM SUBMIT
// ============================================
const bookingForm = document.getElementById('bookingWidget');
bookingForm.addEventListener('submit', (e) => {
  e.preventDefault();
  if (!pickupDate || !returnDate) {
    openPopover();
    return;
  }
  const data = new FormData(bookingForm);
  const obj = Object.fromEntries(data);

  if (!obj.pickupLocation) {
    document.getElementById('pickupLocation').focus();
    return;
  }

  const btn = bookingForm.querySelector('.btn-search');
  const originalContent = btn.innerHTML;
  btn.innerHTML = '<span>Searching...</span>';
  btn.style.opacity = '0.7';
  btn.disabled = true;

  // Build search URL with params
  const params = new URLSearchParams({
    pickup: obj.pickupLocation,
    ...(obj.returnLocation ? { return: obj.returnLocation } : {}),
    from: obj.pickupDate,
    fromTime: obj.pickupTime,
    to: obj.returnDate,
    toTime: obj.returnTime,
    age: obj.driverAge
  });
  if (obj.promoCode) params.set('promo', obj.promoCode);

  setTimeout(() => {
    window.location.href = `search.html?${params.toString()}`;
  }, 400);
});

// ============================================
// FLEET DATA & RENDERING
// ============================================
const VEHICLES = [
  // ECONOMY
  { code: 'MCMR', category: 'economy', name: 'Toyota Aygo', similar: 'or similar', seats: 4, bags: 2, doors: 3, transmission: 'manual', price: 22 },
  { code: 'MDMR', category: 'economy', name: 'Toyota Aygo', similar: 'or similar', seats: 4, bags: 2, doors: 5, transmission: 'manual', price: 24 },
  { code: 'MCAR', category: 'economy', name: 'Kia Picanto', similar: 'or similar', seats: 4, bags: 2, doors: 5, transmission: 'auto', price: 28 },

  // COMPACT
  { code: 'ECMR', category: 'compact', name: 'Nissan Micra', similar: 'or similar', seats: 5, bags: 2, doors: 5, transmission: 'manual', price: 30 },
  { code: 'EDMR', category: 'compact', name: 'Peugeot 208', similar: 'or similar', seats: 5, bags: 2, doors: 5, transmission: 'manual', price: 32 },
  { code: 'ECAR', category: 'compact', name: 'Nissan Micra Auto', similar: 'or similar', seats: 5, bags: 2, doors: 5, transmission: 'auto', price: 36 },

  // INTERMEDIATE
  { code: 'CCMR', category: 'intermediate', name: 'Kia Rio', similar: 'or similar', seats: 5, bags: 3, doors: 5, transmission: 'manual', price: 38 },
  { code: 'CDMR', category: 'intermediate', name: 'Fiat Tipo', similar: 'Hatchback', seats: 5, bags: 3, doors: 5, transmission: 'manual', price: 40 },
  { code: 'CFMR', category: 'intermediate', name: 'Kia Stonic', similar: 'or similar', seats: 5, bags: 3, doors: 5, transmission: 'manual', price: 44 },
  { code: 'CFAR', category: 'intermediate', name: 'Kia Stonic Auto', similar: 'or similar', seats: 5, bags: 3, doors: 5, transmission: 'auto', price: 48 },

  // SUV
  { code: 'IFAR', category: 'suv', name: 'VW T-Cross Auto', similar: 'or similar', seats: 5, bags: 4, doors: 5, transmission: 'auto', price: 58 },
  { code: 'SFAR', category: 'suv', name: 'BMW X1 Auto', similar: 'or similar', seats: 5, bags: 4, doors: 5, transmission: 'auto', price: 85 },

  // PREMIUM
  { code: 'ICMR', category: 'premium', name: 'Premium Sedan', similar: 'or similar', seats: 5, bags: 4, doors: 4, transmission: 'manual', price: 55 },
  { code: 'CWMR', category: 'premium', name: 'Premium Wagon', similar: 'or similar', seats: 5, bags: 5, doors: 5, transmission: 'manual', price: 52 },

  // 7-SEATER
  { code: 'FVMR', category: 'van', name: '7-Seater Van', similar: 'or similar', seats: 7, bags: 5, doors: 5, transmission: 'manual', price: 65 }
];

// SVG car silhouettes by category — simple, branded
const CAR_SVGS = {
  economy: `<svg viewBox="0 0 200 100" xmlns="http://www.w3.org/2000/svg"><path d="M30 70 L40 70 C40 78 47 85 55 85 C63 85 70 78 70 70 L130 70 C130 78 137 85 145 85 C153 85 160 78 160 70 L175 70 L175 55 L160 50 L135 32 C130 28 122 25 113 25 L72 25 C65 25 58 28 53 33 L38 50 L25 53 C20 54 17 58 17 63 L17 68 Z" fill="#1C5875"/><path d="M75 30 L110 30 C115 30 119 32 121 35 L130 47 L70 47 L75 30 Z" fill="#a8c9d9" opacity="0.7"/><circle cx="55" cy="78" r="10" fill="#093D5E"/><circle cx="55" cy="78" r="4" fill="#CFDD28"/><circle cx="145" cy="78" r="10" fill="#093D5E"/><circle cx="145" cy="78" r="4" fill="#CFDD28"/></svg>`,
  compact: `<svg viewBox="0 0 200 100" xmlns="http://www.w3.org/2000/svg"><path d="M25 72 L36 72 C36 80 43 87 51 87 C59 87 66 80 66 72 L134 72 C134 80 141 87 149 87 C157 87 164 80 164 72 L180 72 L180 55 L162 48 L138 28 C133 24 125 22 116 22 L70 22 C63 22 56 25 51 30 L34 48 L20 52 C15 53 12 57 12 62 L12 70 Z" fill="#1C5875"/><path d="M73 26 L113 26 C118 26 122 28 125 31 L135 46 L65 46 L73 26 Z" fill="#a8c9d9" opacity="0.7"/><circle cx="51" cy="80" r="11" fill="#093D5E"/><circle cx="51" cy="80" r="5" fill="#CFDD28"/><circle cx="149" cy="80" r="11" fill="#093D5E"/><circle cx="149" cy="80" r="5" fill="#CFDD28"/></svg>`,
  intermediate: `<svg viewBox="0 0 200 100" xmlns="http://www.w3.org/2000/svg"><path d="M20 73 L34 73 C34 82 42 89 51 89 C60 89 68 82 68 73 L132 73 C132 82 140 89 149 89 C158 89 166 82 166 73 L184 73 L184 56 L164 47 L140 24 C135 20 127 18 117 18 L67 18 C60 18 53 21 48 26 L30 47 L16 51 C10 52 7 57 7 62 L7 71 Z" fill="#1C5875"/><path d="M72 22 L115 22 C120 22 125 24 128 28 L138 44 L62 44 L72 22 Z" fill="#a8c9d9" opacity="0.7"/><circle cx="51" cy="80" r="12" fill="#093D5E"/><circle cx="51" cy="80" r="5" fill="#CFDD28"/><circle cx="149" cy="80" r="12" fill="#093D5E"/><circle cx="149" cy="80" r="5" fill="#CFDD28"/></svg>`,
  suv: `<svg viewBox="0 0 200 100" xmlns="http://www.w3.org/2000/svg"><path d="M18 70 L32 70 C32 80 40 88 50 88 C60 88 68 80 68 70 L132 70 C132 80 140 88 150 88 C160 88 168 80 168 70 L186 70 L186 48 L168 38 L142 18 C137 14 128 12 118 12 L65 12 C57 12 50 15 45 21 L28 40 L14 44 C9 45 5 50 5 55 L5 68 Z" fill="#1C5875"/><path d="M70 16 L115 16 C120 16 125 18 128 22 L140 38 L58 38 L70 16 Z" fill="#a8c9d9" opacity="0.7"/><circle cx="50" cy="78" r="13" fill="#093D5E"/><circle cx="50" cy="78" r="6" fill="#CFDD28"/><circle cx="150" cy="78" r="13" fill="#093D5E"/><circle cx="150" cy="78" r="6" fill="#CFDD28"/></svg>`,
  premium: `<svg viewBox="0 0 200 100" xmlns="http://www.w3.org/2000/svg"><path d="M15 73 L30 73 C30 82 38 90 48 90 C58 90 66 82 66 73 L134 73 C134 82 142 90 152 90 C162 90 170 82 170 73 L188 73 L188 54 L165 44 L138 20 C133 16 124 14 114 14 L62 14 C55 14 47 17 42 22 L24 44 L11 48 C5 50 2 54 2 59 L2 71 Z" fill="#093D5E"/><path d="M68 18 L112 18 C117 18 122 20 125 24 L137 42 L56 42 L68 18 Z" fill="#a8c9d9" opacity="0.6"/><circle cx="48" cy="80" r="12" fill="#062b42"/><circle cx="48" cy="80" r="5" fill="#CFDD28"/><circle cx="152" cy="80" r="12" fill="#062b42"/><circle cx="152" cy="80" r="5" fill="#CFDD28"/></svg>`,
  van: `<svg viewBox="0 0 200 100" xmlns="http://www.w3.org/2000/svg"><path d="M12 72 L28 72 C28 81 36 89 46 89 C56 89 64 81 64 72 L136 72 C136 81 144 89 154 89 C164 89 172 81 172 72 L192 72 L192 28 C192 22 187 18 181 18 L30 18 C22 18 16 24 16 32 L16 50 L8 53 C4 55 2 58 2 62 L2 70 Z" fill="#1C5875"/><path d="M30 25 L80 25 L80 45 L30 45 Z M85 25 L130 25 L130 45 L85 45 Z M135 25 L180 25 L180 45 L135 45 Z" fill="#a8c9d9" opacity="0.6"/><circle cx="46" cy="80" r="12" fill="#093D5E"/><circle cx="46" cy="80" r="5" fill="#CFDD28"/><circle cx="154" cy="80" r="12" fill="#093D5E"/><circle cx="154" cy="80" r="5" fill="#CFDD28"/></svg>`
};

const CATEGORY_LABELS = {
  economy: 'Economy',
  compact: 'Compact',
  intermediate: 'Intermediate',
  suv: 'SUV',
  premium: 'Premium',
  van: '7-Seater'
};

const ICON_SEATS = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>';
const ICON_BAGS = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="7" width="18" height="13" rx="2"/><path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>';
const ICON_DOORS = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 21V5a2 2 0 0 0-2-2H7a2 2 0 0 0-2 2v16"/><line x1="3" y1="21" x2="21" y2="21"/><circle cx="15" cy="13" r="0.5" fill="currentColor"/></svg>';
const ICON_TRANS_AUTO = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><text x="12" y="16" text-anchor="middle" font-size="10" font-weight="700" fill="currentColor" stroke="none">A</text></svg>';
const ICON_TRANS_MAN = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><text x="12" y="16" text-anchor="middle" font-size="10" font-weight="700" fill="currentColor" stroke="none">M</text></svg>';

function renderVehicleCard(v) {
  const isAuto = v.transmission === 'auto';
  return `
    <article class="vehicle-card" data-category="${v.category}" data-code="${v.code}">
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

const fleetGrid = document.getElementById('fleetGrid');
if (fleetGrid) {
  fleetGrid.innerHTML = VEHICLES.map(renderVehicleCard).join('');

  // Update chip counts
  document.querySelectorAll('.chip-count').forEach(el => {
    const cat = el.dataset.count;
    const count = cat === 'all' ? VEHICLES.length : VEHICLES.filter(v => v.category === cat).length;
    el.textContent = count;
  });

  // Filter behavior
  document.querySelectorAll('.filter-chip').forEach(chip => {
    chip.addEventListener('click', () => {
      document.querySelectorAll('.filter-chip').forEach(c => {
        c.classList.remove('active');
        c.setAttribute('aria-selected', 'false');
      });
      chip.classList.add('active');
      chip.setAttribute('aria-selected', 'true');

      const filter = chip.dataset.filter;
      document.querySelectorAll('.vehicle-card').forEach(card => {
        card.hidden = !(filter === 'all' || card.dataset.category === filter);
      });
    });
  });

  // Click card → open modal
  fleetGrid.addEventListener('click', (e) => {
    const card = e.target.closest('.vehicle-card');
    if (!card) return;
    const code = card.dataset.code;
    const v = VEHICLES.find(x => x.code === code);
    if (v) openVehicleModal(v);
  });
}

// ============================================
// VEHICLE MODAL
// ============================================
const vehicleModal = document.getElementById('vehicleModal');

function openVehicleModal(v) {
  if (!vehicleModal) return;
  const isAuto = v.transmission === 'auto';
  const days = 3;
  const basePrice = v.price;

  function getRateExtra() {
    const bookingOpt = vehicleModal.querySelector('input[name="bookingOption"]:checked')?.value;
    return bookingOpt === 'flex' ? 1 : 0;
  }

  function recalc() {
    const daily = basePrice + getRateExtra();
    const total = (daily * days).toFixed(2);
    document.getElementById('modalPriceDay').innerHTML = `<strong>€${daily.toFixed(2)}</strong> <span>/day</span>`;
    document.getElementById('modalPriceTotal').textContent = `€${total} total for ${days} days`;
  }

  // Populate content
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

  // Reset option selections
  vehicleModal.querySelectorAll('input[type="radio"]').forEach(r => { r.checked = r.defaultChecked; });
  vehicleModal.querySelectorAll('.modal-option').forEach(o => o.classList.remove('selected'));
  vehicleModal.querySelectorAll('input[type="radio"]:checked').forEach(r => r.closest('.modal-option').classList.add('selected'));

  // Bind change events
  vehicleModal.querySelectorAll('input[type="radio"]').forEach(r => {
    r.onchange = () => {
      const groupName = r.name;
      vehicleModal.querySelectorAll(`input[name="${groupName}"]`).forEach(other => {
        other.closest('.modal-option').classList.toggle('selected', other.checked);
      });
      recalc();
    };
  });

  // Continue button → open Protection page
  const continueBtn = document.getElementById('modalContinue');
  continueBtn.onclick = () => {
    const rateChoice = vehicleModal.querySelector('input[name="bookingOption"]:checked')?.value || 'best';
    closeVehicleModal();
    openProtectionPage(v, days, rateChoice);
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

if (vehicleModal) {
  vehicleModal.addEventListener('click', (e) => {
    if (e.target.closest('[data-close]')) closeVehicleModal();
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && !vehicleModal.hidden) closeVehicleModal();
  });
}

// ============================================
// PROTECTION SELECTION PAGE
// ============================================
const PROTECTION_PACKAGES = [
  {
    id: 'none',
    name: 'No extra protection',
    stars: 0,
    excessLabel: 'Liability:',
    excess: 'Up to full vehicle value',
    excessClass: 'danger',
    pricePerDay: 0,
    discount: null,
    features: {
      'Loss Damage Waiver (including theft protection)': false,
      'Tire & Windshield Protection': false,
      'Personal Accident Protection': false,
      'Roadside Protection': false,
      'Interior Protection': false
    }
  },
  {
    id: 'basic',
    name: 'Basic Protection',
    stars: 1,
    excessLabel: 'Excess:',
    excess: 'Up to €800',
    excessClass: 'warning',
    pricePerDay: 1.65,
    discount: null,
    features: {
      'Loss Damage Waiver (including theft protection)': true,
      'Tire & Windshield Protection': false,
      'Personal Accident Protection': false,
      'Roadside Protection': false,
      'Interior Protection': false
    }
  },
  {
    id: 'smart',
    name: 'Smart Protection',
    stars: 2,
    excessLabel: 'Excess:',
    excess: 'Zero excess',
    excessClass: 'good',
    pricePerDay: 14.02,
    oldPrice: 20.03,
    discount: '−30% online',
    features: {
      'Loss Damage Waiver (including theft protection)': true,
      'Tire & Windshield Protection': true,
      'Personal Accident Protection': false,
      'Roadside Protection': false,
      'Interior Protection': false
    }
  },
  {
    id: 'all',
    name: 'All Inclusive Protection',
    stars: 3,
    excessLabel: 'Excess:',
    excess: 'Zero excess',
    excessClass: 'good',
    pricePerDay: 27.11,
    oldPrice: 41.71,
    discount: '−35% online',
    recommended: true,
    features: {
      'Loss Damage Waiver (including theft protection)': true,
      'Tire & Windshield Protection': true,
      'Personal Accident Protection': true,
      'Roadside Protection': true,
      'Interior Protection': true
    }
  }
];

const ICON_CHECK = '<svg class="protection-feature-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>';
const ICON_X = '<svg class="protection-feature-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>';

function renderStars(filled, total = 3) {
  let html = '<div class="protection-stars">';
  for (let i = 0; i < total; i++) {
    html += `<svg class="protection-star ${i < filled ? 'filled' : ''}" viewBox="0 0 24 24" fill="currentColor"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>`;
  }
  html += '</div>';
  return html;
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
      <div class="protection-excess ${pkg.excessClass}">
        <strong>${pkg.excessLabel}</strong>
        ${pkg.excess}
      </div>
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

  // Update cancellation overview based on rate choice
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

if (protectionGrid) {
  protectionGrid.addEventListener('click', (e) => {
    const card = e.target.closest('.protection-card');
    if (!card) return;
    currentProtection.selected = card.dataset.pkg;
    renderProtectionGrid();
    updateProtectionTotal();
  });
}

if (protectionBack) {
  protectionBack.addEventListener('click', closeProtectionPage);
}

if (protectionContinue) {
  protectionContinue.addEventListener('click', () => {
    openExtrasPage();
  });
}

document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && protectionPage && !protectionPage.hidden) closeProtectionPage();
});

// ============================================
// EXTRAS PAGE (Step 3)
// ============================================
const EXTRAS = [
  {
    id: 'additional-driver',
    name: 'Additional driver',
    priceLabel: '€6.66 / day per driver',
    pricePerDay: 6.66,
    perUnit: false,
    icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><line x1="19" y1="8" x2="19" y2="14"/><line x1="22" y1="11" x2="16" y2="11"/></svg>',
    summary: 'Share the wheel with a friend or partner.',
    details: 'Planning to swap drivers during the trip? Add anyone you trust behind the wheel. They\'ll just need to bring a valid driving licence to the desk when you collect the car.'
  },
  {
    id: 'gps',
    name: 'GPS navigation',
    priceLabel: '€8 / day',
    pricePerDay: 8,
    perUnit: false,
    icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="3 11 22 2 13 21 11 13 3 11"/></svg>',
    summary: 'Pre-loaded with Greek maps and points of interest.',
    details: 'Stay on track even without mobile data. Our portable GPS unit comes pre-loaded with detailed maps of Greece and the Cyclades, plus suggested routes to beaches, viewpoints, and tavernas.'
  },
  {
    id: 'child-seat',
    name: 'Child seat (4-7 years)',
    priceLabel: '€5 / day',
    pricePerDay: 5,
    perUnit: true,
    icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 4h-1V2h-2v2H8V2H6v2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2z"/><path d="M12 11v6"/><path d="M9 14h6"/></svg>',
    summary: 'Forward-facing seat for kids 4-7 years old (15-25kg).',
    details: 'Approved booster-style seat that meets all EU safety standards. Installed by our team at pick-up, ready to go. Choose the quantity if you need more than one.'
  },
  {
    id: 'baby-seat',
    name: 'Baby seat (0-3 years)',
    priceLabel: '€5 / day',
    pricePerDay: 5,
    perUnit: true,
    icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M9 11h.01M15 11h.01M8 16s1.5 2 4 2 4-2 4-2"/></svg>',
    summary: 'Rear-facing seat for infants and toddlers (0-13kg).',
    details: 'A secure, comfortable rear-facing seat for your little one. Side-impact protection and adjustable harness included. Choose the quantity if you\'re travelling with more than one baby.'
  },
  {
    id: 'wifi',
    name: 'Portable WiFi hotspot',
    priceLabel: '€7 / day',
    pricePerDay: 7,
    perUnit: false,
    icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12.55a11 11 0 0 1 14.08 0"/><path d="M1.42 9a16 16 0 0 1 21.16 0"/><path d="M8.53 16.11a6 6 0 0 1 6.95 0"/><line x1="12" y1="20" x2="12.01" y2="20"/></svg>',
    summary: 'Unlimited 4G data for up to 10 devices.',
    details: 'Stay connected wherever you go. Our pocket-sized hotspot delivers fast 4G across Greece and supports up to 10 devices at once — perfect for groups travelling between islands.'
  },
  {
    id: 'roof-rack',
    name: 'Roof rack',
    priceLabel: '€4 / day',
    pricePerDay: 4,
    perUnit: false,
    icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="6" width="20" height="2"/><line x1="6" y1="6" x2="6" y2="14"/><line x1="18" y1="6" x2="18" y2="14"/><path d="M3 14h18v6H3z"/></svg>',
    summary: 'Extra cargo space for surf boards, bikes, or luggage.',
    details: 'Bringing surf gear, bikes, or extra suitcases? Our roof rack adds carrying capacity without crowding the cabin. Includes safety straps — installed by our team before you drive off.'
  }
];

const extrasPage = document.getElementById('extrasPage');
const extrasList = document.getElementById('extrasList');
const extrasBack = document.getElementById('extrasBack');
const extrasContinue = document.getElementById('extrasContinue');
const extrasTotal = document.getElementById('extrasTotal');
const extrasOverviewProtection = document.getElementById('extrasOverviewProtection');
const extrasOverviewCancellation = document.getElementById('extrasOverviewCancellation');

let selectedExtras = {}; // {extraId: quantity}

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

  // Vehicle card
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

  // Use the booking form values from homepage (or defaults)
  const pickupLocSel = document.getElementById('pickupLocation');
  const pickupLocText = pickupLocSel && pickupLocSel.selectedIndex >= 0 && pickupLocSel.value
    ? pickupLocSel.options[pickupLocSel.selectedIndex].text.trim()
    : 'Athens Airport';
  const pickupDateValue = pickupDateInput?.value || formatISO(pickupDate || new Date());
  const returnDateValue = returnDateInput?.value || formatISO(returnDate || new Date());
  const pickupTimeValue = document.getElementById('pickupTime')?.value || '10:00';
  const returnTimeValue = document.getElementById('returnTime')?.value || '10:00';
  const returnLocSel = document.getElementById('returnLocation');
  const useReturn = document.getElementById('diffReturn')?.checked;
  const returnLocText = useReturn && returnLocSel?.value
    ? returnLocSel.options[returnLocSel.selectedIndex].text.trim()
    : pickupLocText;

  const sPickLoc = document.getElementById('summaryPickupLocation');
  const sPickDate = document.getElementById('summaryPickupDate');
  const sRetLoc = document.getElementById('summaryReturnLocation');
  const sRetDate = document.getElementById('summaryReturnDate');
  if (sPickLoc) sPickLoc.textContent = pickupLocText;
  if (sPickDate) sPickDate.textContent = `${formatDateDisplay(pickupDateValue)} · ${pickupTimeValue}`;
  if (sRetLoc) sRetLoc.textContent = returnLocText;
  if (sRetDate) sRetDate.textContent = `${formatDateDisplay(returnDateValue)} · ${returnTimeValue}`;

  // Rate + protection
  const sRate = document.getElementById('summaryRate');
  const sProt = document.getElementById('summaryProtection');
  if (sRate) sRate.textContent = currentProtection.rate === 'flex' ? 'Total flexibility · Free cancellation anytime' : 'Best price · Free cancellation up to 48h before';
  if (sProt) sProt.textContent = pkg ? pkg.name : 'Protection package';
}

function formatDateDisplay(iso) {
  if (!iso) return '—';
  const d = new Date(iso);
  if (isNaN(d.getTime())) return iso;
  const dow = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'][d.getDay()];
  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  return `${dow} ${d.getDate()} ${months[d.getMonth()]}`;
}

function closeExtrasPage() {
  extrasPage.hidden = true;
  // Re-open protection page
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
      if (selectedExtras[extraId]) {
        delete selectedExtras[extraId];
      } else {
        selectedExtras[extraId] = 1;
      }
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
      return; // don't re-render, just toggle
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

  // Vehicle card
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

  // Reuse the same location/date data
  const pickupLocSel = document.getElementById('pickupLocation');
  const pickupLocText = pickupLocSel && pickupLocSel.selectedIndex >= 0 && pickupLocSel.value
    ? pickupLocSel.options[pickupLocSel.selectedIndex].text.trim()
    : 'Athens Airport';
  const pickupDateValue = pickupDateInput?.value || (pickupDate ? formatISO(pickupDate) : '');
  const returnDateValue = returnDateInput?.value || (returnDate ? formatISO(returnDate) : '');
  const pickupTimeValue = document.getElementById('pickupTime')?.value || '10:00';
  const returnTimeValue = document.getElementById('returnTime')?.value || '10:00';
  const returnLocSel = document.getElementById('returnLocation');
  const useReturn = document.getElementById('diffReturn')?.checked;
  const returnLocText = useReturn && returnLocSel?.value
    ? returnLocSel.options[returnLocSel.selectedIndex].text.trim()
    : pickupLocText;

  document.getElementById('driverSummaryPickupLoc').textContent = pickupLocText;
  document.getElementById('driverSummaryPickupDate').textContent = `${formatDateDisplay(pickupDateValue)} · ${pickupTimeValue}`;
  document.getElementById('driverSummaryReturnLoc').textContent = returnLocText;
  document.getElementById('driverSummaryReturnDate').textContent = `${formatDateDisplay(returnDateValue)} · ${returnTimeValue}`;

  document.getElementById('driverSummaryRate').textContent = currentProtection.rate === 'flex'
    ? 'Total flexibility'
    : 'Best price · Free cancellation up to 48h before';
  document.getElementById('driverSummaryProtection').textContent = pkg ? pkg.name : 'Protection package';

  // Extras summary
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

  // Total
  const days = currentProtection.days;
  const rateExtra = currentProtection.rate === 'flex' ? 1 : 0;
  const protectionDaily = pkg ? pkg.pricePerDay : 0;
  const baseTotal = (v.price + rateExtra + protectionDaily) * days;
  const extrasCost = calculateExtrasTotal();
  driverTotalEl.textContent = `€${(baseTotal + extrasCost).toFixed(2)}`;
}

if (driverBack) driverBack.addEventListener('click', closeDriverPage);

if (driverContinueBtn) {
  driverContinueBtn.addEventListener('click', () => {
    if (!validateDriverForm()) return;
    const data = new FormData(driverForm);
    const obj = Object.fromEntries(data);
    alert(`Demo: Booking confirmed!\n\n${obj.firstName} ${obj.lastName}\nEmail: ${obj.email}\nPhone: ${obj.country} ${obj.phone}\nTotal: ${driverTotalEl.textContent}\n\nNext step in production: redirect to payment provider (Viva Wallet / Stripe / Bank ePOS).`);
  });
}

function validateDriverForm() {
  let valid = true;
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
    if (!ageOK) document.getElementById('ageConfirm')?.focus();
    else document.getElementById('termsAgree')?.focus();
  }
  if (!valid) {
    const firstInvalid = driverForm.querySelector('.invalid');
    firstInvalid?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    firstInvalid?.focus();
  }
  return valid;
}

if (driverForm) {
  driverForm.addEventListener('input', (e) => {
    if (e.target.classList.contains('invalid')) {
      e.target.classList.remove('invalid');
    }
  });
}

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

  let html = '';

  // VEHICLE
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

  // PROTECTION
  if (pkg) {
    html += `<div class="breakdown-divider"></div>`;
    html += `<div class="breakdown-section-title">Protection</div>`;
    if (pkg.pricePerDay > 0) {
      html += `<div class="breakdown-line">
        <span>${pkg.name}<span class="breakdown-line-meta">€${pkg.pricePerDay.toFixed(2)}/day × ${days} ${days===1?'day':'days'}</span></span>
        <strong>€${(pkg.pricePerDay * days).toFixed(2)}</strong>
      </div>`;
    } else {
      html += `<div class="breakdown-line">
        <span>${pkg.name}</span>
        <strong>Included</strong>
      </div>`;
    }
  }

  // EXTRAS
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

  breakdownContent.innerHTML = html;

  // Total
  const baseTotal = (v.price + rateExtra + protectionDaily) * days;
  const extrasCost = calculateExtrasTotal();
  breakdownTotalEl.textContent = `€${(baseTotal + extrasCost).toFixed(2)}`;
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
  // Open from any "Price breakdown" link
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

// Language switcher (demo)
document.querySelectorAll('.lang-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.lang-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
  });
});
