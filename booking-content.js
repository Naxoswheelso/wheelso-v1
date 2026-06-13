/* ============================================================
   WHEELSO — Shared booking content (single source of truth)
   ============================================================
   Pure DATA + tiny resolvers consumed by BOTH customer-facing
   booking pages so the copy stays identical:
     • /emails/booking-voucher.html   (loads ../booking-content.js)
     • /my-booking.html               (loads booking-content.js)

   No DOM rendering here — each page renders with its own markup.
   Exposes a single global: window.WHEELSO_BOOKING

   Terminology mirrors the booking flow (search.js / i18n.js):
     TPL = Third-Party Liability   (no_extra)
     CDW = Collision Damage Waiver (basic — €800 excess)
     FDW = Full Damage Waiver      (full  — €0 excess)
   ============================================================ */
(function () {
  'use strict';

  // ─── Feature labels (match FEATURE_LABELS in search.js) ───
  var F = {
    tpl:        'Third-party liability — damage to other people / vehicles',
    ldw:        'Loss / Damage Waiver — incl. theft protection',
    tire:       'Tire protection',
    windshield: 'Windshield protection',
    roadside:   '24/7 roadside assistance & towing'
  };

  function feat(label, on) { return { label: label, included: !!on }; }

  // ─── Protection catalog (keyed by booking.protection_code) ───
  // Coverage flags mirror exactly what the customer saw at booking time
  // (search.js DEFAULT_PROTECTION_PACKAGES). Windshield mirrors tire, as on site.
  var PROTECTION = {
    no_extra: {
      code: 'no_extra',
      badge: 'TPL',
      title: 'No extra protection (Third-Party only)',
      whatItIs: 'Your rental includes Third-Party Liability by law — it covers damage you cause to other people or vehicles. It does NOT cover any damage to, or theft of, your rental car.',
      excessText: 'Up to the full value of the car (no cap)',
      liability: {
        text: 'If your rental car is damaged or stolen, you are responsible for the full repair or replacement cost — there is no cap.',
        severity: 'bad'
      },
      features: [
        feat(F.tpl, true),
        feat(F.ldw, false),
        feat(F.tire, false),
        feat(F.windshield, false),
        feat(F.roadside, false)
      ],
      warning: 'You took Third-Party only. In case of any damage or theft of the rental car, you are liable for the full value of the vehicle — there is no excess cap. You can upgrade to Basic or Full Protection at the counter.',
      upgradeNudge: 'Want damage cover? Upgrade to Basic or Full Protection at the counter.',
      excludedNote: null
    },
    basic: {
      code: 'basic',
      badge: 'CDW',
      title: 'Basic Protection',
      whatItIs: 'Collision Damage Waiver reduces your liability for damage to, or theft of, the rental car. You are covered above the excess; up to the excess you pay.',
      excessText: '€800',
      liability: {
        text: 'If the car is damaged or stolen, the most you pay is your €800 excess. We cover the rest.',
        severity: 'mid'
      },
      features: [
        feat(F.tpl, true),
        feat(F.ldw, true),
        feat(F.tire, false),
        feat(F.windshield, false),
        feat(F.roadside, false)
      ],
      warning: null,
      upgradeNudge: 'Want zero excess? Upgrade to Full Protection at the counter.',
      excludedNote: null
    },
    full: {
      code: 'full',
      badge: 'FDW',
      title: 'Full Protection',
      whatItIs: 'Full Damage Waiver — zero excess. We cover all accidental damage to the rental car; you pay nothing (a short list of excluded events aside).',
      excessText: '€0 — zero excess',
      liability: {
        text: 'If accidental damage or theft occurs, you pay nothing. A short list of excluded events applies — see terms.',
        severity: 'good'
      },
      features: [
        feat(F.tpl, true),
        feat(F.ldw, true),
        feat(F.tire, true),
        feat(F.windshield, true),
        feat(F.roadside, true)
      ],
      warning: null,
      upgradeNudge: null,
      excludedNote: 'Excluded events (charged to your card on file only if they occur): driving under the influence, off-road/unpaved roads, undercarriage damage, lost/damaged keys, wrong fuel, undeclared additional driver, and gross negligence. See full terms.'
    }
  };

  // ─── Station directory (keyed by full station code) ───
  // No address columns exist in the DB, so directions are curated here.
  // meetGreet is data-driven: flip to true to enable the meet-&-greet block
  // for a station (Mykonos enabled now per request).
  function maps(dest) {
    return 'https://www.google.com/maps/dir/?api=1&destination=' + encodeURIComponent(dest);
  }
  var STATIONS = {
    'ATH-AIRPORT':  { label: 'Athens International Airport (ATH)', island: 'ATH', pointType: 'airport', meetGreet: false, mapsUrl: maps('Athens International Airport Eleftherios Venizelos') },
    'ATH-DOWNTOWN': { label: 'Athens Downtown — Syngrou 22',       island: 'ATH', pointType: 'office',  meetGreet: false, mapsUrl: maps('Leoforos Syngrou 22, Athina 11742, Greece') },
    'MYK-AIRPORT':  { label: 'Mykonos Airport (JMK)',              island: 'MYK', pointType: 'airport', meetGreet: true,  mapsUrl: maps('Mykonos National Airport JMK') },
    'MYK-PORT':     { label: 'Mykonos New Port (Tourlos)',         island: 'MYK', pointType: 'port',    meetGreet: true,  mapsUrl: maps('Mykonos New Port Tourlos') },
    'PAR-AIRPORT':  { label: 'Paros National Airport (PAS)',       island: 'PAR', pointType: 'airport', meetGreet: false, mapsUrl: maps('Paros National Airport') },
    'PAR-PORT':     { label: 'Paros Port (Parikia)',              island: 'PAR', pointType: 'port',    meetGreet: false, mapsUrl: maps('Parikia Port Paros') },
    'NAX-AIRPORT':  { label: 'Naxos Island National Airport (JNX)', island: 'NAX', pointType: 'airport', meetGreet: false, mapsUrl: maps('Naxos Island National Airport') },
    'NAX-PORT':     { label: 'Naxos Port (Chora)',                 island: 'NAX', pointType: 'port',    meetGreet: false, mapsUrl: maps('Naxos Port Chora') },
    'SKI-AIRPORT':  { label: 'Skiathos Airport (JSI)',             island: 'SKI', pointType: 'airport', meetGreet: false, mapsUrl: maps('Skiathos Island National Airport') },
    'SKI-PORT':     { label: 'Skiathos Port',                      island: 'SKI', pointType: 'port',    meetGreet: false, mapsUrl: maps('Skiathos Port') }
  };

  // ─── Meet-&-greet copy (shown when the pickup station has meetGreet=true) ───
  var MEET_GREET = {
    title: "Meet & greet — we'll find you",
    bodyAirport: 'A Wheelso representative will be waiting at the arrivals exit holding a Wheelso name sign — no need to look for an office.',
    bodyPort:    'A Wheelso representative will be waiting at the port, by the dock, holding a Wheelso name sign — no need to look for an office.',
    bodyGeneric: 'A Wheelso representative will be waiting for you holding a Wheelso name sign.',
    ask: "So we don't miss each other, please make sure we have your arrival details — your flight number (if flying) or your ferry name & arrival time (if arriving by boat).",
    missing: "We don't have your arrival details yet. Please reply to your confirmation email or message us with your flight number or ferry name so we know when to expect you."
  };

  // ─── Resolvers ───

  // Resolve excess text from a protection_snapshot (overrides catalog default).
  function excessFromSnapshot(snapshot) {
    if (!snapshot) return null;
    var ex = snapshot.excess;
    if (ex === null || ex === undefined) return 'Up to the full value of the car (no cap)';
    if (Number(ex) === 0) return '€0 — zero excess';
    return '€' + ex;
  }

  // getProtection(code, snapshot) → merged display object.
  // The catalog is authoritative for copy/features; the snapshot (frozen at
  // booking time) overrides excess + display name when present. Always returns
  // a usable object — defaults to no_extra when code is missing (TP-only / old bookings).
  function getProtection(code, snapshot) {
    var key = (code || (snapshot && snapshot.code) || 'no_extra').toLowerCase();
    var base = PROTECTION[key] || PROTECTION.no_extra;
    // Shallow clone so we never mutate the catalog
    var out = {
      code: base.code,
      badge: base.badge,
      title: base.title,
      whatItIs: base.whatItIs,
      excessText: base.excessText,
      liability: { text: base.liability.text, severity: base.liability.severity },
      features: base.features.map(function (f) { return { label: f.label, included: f.included }; }),
      warning: base.warning,
      upgradeNudge: base.upgradeNudge,
      excludedNote: base.excludedNote
    };
    if (snapshot) {
      if (snapshot.name) out.title = snapshot.name;
      var snapEx = excessFromSnapshot(snapshot);
      if (snapEx) out.excessText = snapEx;
    }
    return out;
  }

  // getStation(code, fallbackName) → always returns a usable station object.
  function getStation(code, fallbackName) {
    var c = (code || '').toUpperCase();
    if (STATIONS[c]) return STATIONS[c];
    var island = c.split('-')[0] || '';
    var label = fallbackName || c || 'Pick-up location';
    return {
      label: label,
      island: island,
      pointType: c.indexOf('PORT') !== -1 ? 'port' : (c.indexOf('AIRPORT') !== -1 ? 'airport' : 'point'),
      meetGreet: false,
      mapsUrl: maps(fallbackName || label)
    };
  }

  // meetGreetBody(pointType) → the right one-liner for airport / port / generic.
  function meetGreetBody(pointType) {
    if (pointType === 'airport') return MEET_GREET.bodyAirport;
    if (pointType === 'port') return MEET_GREET.bodyPort;
    return MEET_GREET.bodyGeneric;
  }

  window.WHEELSO_BOOKING = {
    protection: PROTECTION,
    stations: STATIONS,
    meetGreet: MEET_GREET,
    getProtection: getProtection,
    getStation: getStation,
    meetGreetBody: meetGreetBody
  };
})();
