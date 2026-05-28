// nav.js — Shared navigation behaviors (dropdown)
// Loaded on every page that has the primary nav.
// Keep this file free of page-specific logic.

(function initNavDropdown() {
  const toggles = document.querySelectorAll('.nav-dropdown-toggle');
  if (!toggles.length) {
    // console.log('[Wheelso nav] No dropdown toggles found on this page');
    return;
  }

  toggles.forEach(toggle => {
    const dropdown = toggle.closest('.nav-dropdown');
    const menu = dropdown?.querySelector('.nav-dropdown-menu');
    if (!menu) return;

    toggle.addEventListener('click', (e) => {
      e.stopPropagation();
      const isOpen = toggle.getAttribute('aria-expanded') === 'true';

      // Close all other dropdowns
      toggles.forEach(t => t.setAttribute('aria-expanded', 'false'));

      // Toggle current
      toggle.setAttribute('aria-expanded', isOpen ? 'false' : 'true');
    });
  });

  // Close on outside click
  document.addEventListener('click', (e) => {
    if (!e.target.closest('.nav-dropdown')) {
      toggles.forEach(t => t.setAttribute('aria-expanded', 'false'));
    }
  });

  // Close on ESC
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      toggles.forEach(t => t.setAttribute('aria-expanded', 'false'));
    }
  });

  // console.log('[Wheelso nav] Dropdown initialized for', toggles.length, 'toggle(s)');
})();
