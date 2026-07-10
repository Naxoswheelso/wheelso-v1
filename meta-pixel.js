// meta-pixel.js — Meta (Facebook) Pixel bootstrap for wheelso.gr
//
// GDPR: the Pixel is an ADVERTISING tracker, so it must NOT load until the visitor
// grants the "Advertisement" consent category in CookieYes. Unlike GA4 (gated
// automatically by Google Consent Mode v2), Meta is not a Google product, so
// CookieYes's Consent Mode does not gate it — we gate it ourselves here, keyed off
// the CookieYes consent cookie (source of truth) and its consent-update event.
//
// No <noscript> fallback on purpose: a no-JS pixel image cannot be consent-checked
// and would fire tracking without consent. NOT included on payment*.html (sensitive).
(function () {
  var PIXEL_ID = '961451723586980';
  var started = false;

  // True only when the visitor has actively accepted the Advertisement category.
  function hasAdConsent() {
    try {
      var m = document.cookie.match(/(?:^|;\s*)cookieyes-consent=([^;]+)/);
      if (!m) return false;
      return /(?:^|,)advertisement:yes(?:,|$)/.test(decodeURIComponent(m[1]));
    } catch (_) { return false; }
  }

  function startPixel() {
    if (started || !hasAdConsent()) return;
    started = true;
    // Standard Meta Pixel bootstrap (loads fbevents.js, then init + PageView).
    !function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?
      n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;
      n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;
      t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,
      document,'script','https://connect.facebook.net/en_US/fbevents.js');
    window.fbq('init', PIXEL_ID);
    window.fbq('track', 'PageView');
  }

  // Case 1: returning visitor who already consented → cookie present on load.
  startPixel();
  // Case 2: visitor accepts (or changes) consent during this pageview. CookieYes
  // fires this event; re-check on it, plus a short delayed re-check in case the
  // cookie is written a tick after the event.
  document.addEventListener('cookieyes_consent_update', function () {
    startPixel();
    setTimeout(startPixel, 500);
  });
})();
