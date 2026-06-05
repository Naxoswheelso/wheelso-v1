// ga.js — Google Analytics 4 bootstrap for wheelso.gr
//
// GDPR consent-gating is handled by CookieYes (Google Consent Mode v2 enabled in
// the CookieYes dashboard). CookieYes loads earlier in <head> and sets the default
// consent state to "denied", then updates to "granted" when the visitor accepts the
// Analytics category. We therefore just load gtag normally here — no manual consent
// default/update, to avoid race conditions with CookieYes's own sequencing.
//
// NOTE: This file is NOT included on payment*.html (sensitive payment flow).
(function () {
  var GA_ID = 'G-JW04MNN2T0';

  window.dataLayer = window.dataLayer || [];
  function gtag() { dataLayer.push(arguments); }
  window.gtag = gtag;

  var s = document.createElement('script');
  s.async = true;
  s.src = 'https://www.googletagmanager.com/gtag/js?id=' + GA_ID;
  document.head.appendChild(s);

  gtag('js', new Date());
  gtag('config', GA_ID);
})();
