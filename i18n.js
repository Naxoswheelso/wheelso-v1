/**
 * i18n.js — shared lightweight translation layer for wheelso.gr
 *
 * Loaded BEFORE script.js / search.js on every page. Language is detected
 * once from <html lang="…">, so a Greek page (/el/…) gets LANG='el' and an
 * English page gets LANG='en'. No build step, no dependencies.
 *
 * Usage:
 *   t('continue')                    -> "Continue" | "Συνέχεια"
 *   t('totalForDays', { n: 3, unit: t('days') })
 *
 * IMPORTANT — pricing invariant: this layer ONLY swaps visible text. It never
 * computes or carries €amounts; callers keep building prices exactly as before
 * and pass the already-computed number in as a {placeholder}. Keys here are
 * for the CORE booking path; rare alert() copy and the calendar month/day
 * arrays are intentionally left in English for now.
 */
(function (global) {
  'use strict';

  var LANG = (document.documentElement.lang === 'el') ? 'el' : 'en';

  var I18N = {
    // ---- common / buttons ----
    continue:        { en: 'Continue',          el: 'Συνέχεια' },
    select:          { en: 'Select',            el: 'Επιλογή' },
    filter_all:      { en: 'All',               el: 'Όλα' },
    empty_noCars:    { en: 'No cars available', el: 'Δεν υπάρχουν διαθέσιμα αυτοκίνητα' },
    empty_noCarsBody:{ en: 'Unfortunately, there are no cars available for the selected location and dates. Please try different dates or another location.',
                       el: 'Δυστυχώς, δεν υπάρχουν διαθέσιμα αυτοκίνητα για την επιλεγμένη τοποθεσία και ημερομηνίες. Δοκιμάστε άλλες ημερομηνίες ή τοποθεσία.' },
    closed_title:    { en: "We're currently closed", el: 'Είμαστε αυτή τη στιγμή κλειστά' },
    tooSoon_title:   { en: 'Too soon to book',       el: 'Πολύ νωρίς για κράτηση' },
    total:           { en: 'Total',             el: 'Σύνολο' },
    payNow:          { en: 'Pay now',           el: 'Πληρωμή τώρα' },
    from:            { en: 'From',              el: 'Από' },
    perDay:          { en: '/day',              el: '/ημέρα' },
    included:        { en: 'Included',          el: 'Περιλαμβάνεται' },
    inRate:          { en: 'in rate',           el: 'στην τιμή' },
    day:             { en: 'day',               el: 'ημέρα' },
    days:            { en: 'days',              el: 'ημέρες' },
    night:           { en: 'night',             el: 'βράδυ' },
    nights:          { en: 'nights',            el: 'βράδια' },
    mostPopular:     { en: 'Most popular',      el: 'Πιο δημοφιλές' },
    popular:         { en: 'Popular',           el: 'Δημοφιλές' },
    whatsIncluded:   { en: "What's included",   el: 'Τι περιλαμβάνεται' },
    processing:      { en: 'Processing…',       el: 'Επεξεργασία…' },
    searching:       { en: 'Searching...',      el: 'Αναζήτηση...' },
    searchCars:      { en: 'Search cars',       el: 'Αναζήτηση αυτοκινήτων' },
    selectLocation:  { en: 'Select location...', el: 'Επιλέξτε τοποθεσία...' },
    sameAsPickup:    { en: 'Same as pick-up',   el: 'Ίδια με παραλαβή' },
    backToHome:      { en: 'Back to Home',      el: 'Επιστροφή στην Αρχική' },
    confirmAndPay:   { en: 'Confirm & Pay',     el: 'Επιβεβαίωση & Πληρωμή' },
    submitRequest:   { en: 'Submit Request →',  el: 'Υποβολή Αιτήματος →' },

    // ---- vehicle specs ----
    auto:            { en: 'Auto',              el: 'Αυτόματο' },
    manual:          { en: 'Manual',            el: 'Χειροκίνητο' },
    autoSpec:        { en: 'Auto',              el: 'Αυτ.' },
    manSpec:         { en: 'Man',               el: 'Χειρ.' },
    onRequest:       { en: 'On request',        el: 'Κατόπιν ζήτησης' },
    seats:           { en: 'seats',             el: 'θέσεις' },
    bags:            { en: 'bags',              el: 'βαλίτσες' },
    doors:           { en: 'doors',             el: 'πόρτες' },

    // ---- price / rate labels ----
    // "total for {n} {unit}"  (unit = t('day') | t('days'))
    totalForDays:    { en: 'total for {n} {unit}',  el: 'σύνολο για {n} {unit}' },
    noPaymentNow:    { en: 'No payment now — pay only once we confirm',
                       el: 'Καμία πληρωμή τώρα — πληρώνετε μόνο μόλις επιβεβαιώσουμε' },
    // "€{amount} deposit after confirmation"
    depositAfterConfirm: { en: '€{amount} deposit after confirmation',
                           el: 'Προκαταβολή €{amount} μετά την επιβεβαίωση' },
    // "€{amount} after confirmation"
    afterConfirm:    { en: '€{amount} after confirmation',
                       el: '€{amount} μετά την επιβεβαίωση' },
    // "of €{amount} total"
    ofTotal:         { en: 'of €{amount} total', el: 'από €{amount} σύνολο' },

    // ---- rate option descriptions (vehicle modal) ----
    bestPriceDesc:   { en: 'Pay 100% today. Free cancellation up to 72h before pick-up.',
                       el: 'Πληρωμή 100% σήμερα. Δωρεάν ακύρωση έως 72 ώρες πριν την παραλαβή.' },
    payLaterDesc:    { en: '10% deposit now, pay the rest at the counter. Cancel anytime — deposit non-refundable.',
                       el: '10% προκαταβολή τώρα, το υπόλοιπο στο γραφείο. Ακύρωση οποτεδήποτε — η προκαταβολή δεν επιστρέφεται.' },

    // ---- cancellation copy (rate summaries) ----
    cancelOnRequest: { en: 'On request — no payment now, pay after confirmation',
                       el: 'Κατόπιν ζήτησης — καμία πληρωμή τώρα, πληρωμή μετά την επιβεβαίωση' },
    cancelPayLater:  { en: 'Pay Later — 10% deposit, balance at counter',
                       el: 'Πληρωμή αργότερα — 10% προκαταβολή, υπόλοιπο στο γραφείο' },
    cancelBestPrice: { en: 'Pay now — Free cancellation up to 72h before pick-up',
                       el: 'Πληρωμή τώρα — Δωρεάν ακύρωση έως 72 ώρες πριν την παραλαβή' },
    payLater:        { en: 'Pay Later', el: 'Πληρωμή αργότερα' },

    // ---- booking summary (sidebar / results subtitle) ----
    resultsSubtitleFor: { en: 'for {n} {unit} in {place}', el: 'για {n} {unit} στο {place}' },
    sum_rate_onrequest: { en: 'On request · No payment until confirmed',
                          el: 'Κατόπιν ζήτησης · Καμία πληρωμή μέχρι την επιβεβαίωση' },
    sum_rate_flex:      { en: 'Pay Later · 10% deposit + balance at counter',
                          el: 'Πληρωμή αργότερα · 10% προκαταβολή + υπόλοιπο στο γραφείο' },
    sum_rate_best:      { en: 'Pay now · Free cancellation up to 72h before',
                          el: 'Πληρωμή τώρα · Δωρεάν ακύρωση έως 72 ώρες πριν' },
    sum_protectionFallback: { en: 'Protection package', el: 'Πακέτο προστασίας' },

    // ---- protection feature labels ----
    feat_ldw:        { en: 'Loss Damage Waiver (including theft protection)',
                       el: 'Απαλλαγή Ζημιών (συμπεριλαμβανομένης κλοπής)' },
    feat_tire:       { en: 'Tire Protection',        el: 'Προστασία Ελαστικών' },
    feat_windshield: { en: 'Windshield Protection',  el: 'Προστασία Παρμπρίζ' },
    feat_roadside:   { en: 'Roadside Protection',    el: 'Οδική Βοήθεια' },

    // ---- protection package data (JS defaults; backend may override name/excess) ----
    prot_name_no_extra:   { en: 'No Protection',    el: 'Χωρίς Προστασία' },
    prot_name_basic:      { en: 'Basic Protection', el: 'Βασική Προστασία' },
    prot_name_full:       { en: 'Full Protection',  el: 'Πλήρης Προστασία' },
    prot_eyebrow_included:{ en: 'Included in rate', el: 'Περιλαμβάνεται στην τιμή' },
    prot_eyebrow_reduced: { en: 'Reduced excess',   el: 'Μειωμένη απαλλαγή' },
    prot_eyebrow_zero:    { en: 'Zero excess',      el: 'Μηδενική απαλλαγή' },
    prot_ifDamage:        { en: 'If damage occurs', el: 'Σε περίπτωση ζημιάς' },
    prot_risk_full:       { en: 'You cover full repair cost', el: 'Καλύπτετε το πλήρες κόστος επισκευής' },
    prot_risk_800:        { en: 'You pay up to €800',         el: 'Πληρώνετε έως €800' },
    prot_risk_nothing:    { en: 'You pay nothing',            el: 'Δεν πληρώνετε τίποτα' },
    prot_tooltip_tpl:     { en: 'Third Party Liability — covers damage to other vehicles or people, but not your rental car.',
                            el: 'Αστική Ευθύνη προς Τρίτους — καλύπτει ζημιές σε άλλα οχήματα ή άτομα, αλλά όχι το ενοικιαζόμενο όχημά σας.' },
    prot_tooltip_cdw:     { en: 'Collision Damage Waiver — your liability is capped at €800. Beyond that, we cover the damage.',
                            el: 'Απαλλαγή Ζημιών Σύγκρουσης — η ευθύνη σας περιορίζεται στα €800. Πέραν αυτού, καλύπτουμε εμείς τη ζημιά.' },
    prot_tooltip_fdw:     { en: 'Full Damage Waiver — zero excess. We cover all accidental damage, you pay nothing.',
                            el: 'Πλήρης Απαλλαγή Ζημιών — μηδενική απαλλαγή. Καλύπτουμε κάθε τυχαία ζημιά, δεν πληρώνετε τίποτα.' },
    prot_footnote:        { en: 'Card on file for excluded events only — see terms.',
                            el: 'Η κάρτα σας χρεώνεται μόνο για εξαιρούμενα περιστατικά — δείτε τους όρους.' },
    prot_seeTerms:        { en: 'see terms', el: 'δείτε τους όρους' },
    prot_fdwAgeBlocked:   { en: 'Not available for drivers aged 21–25 or 70–75.',
                            el: 'Μη διαθέσιμο για οδηγούς 21–25 ή 70–75 ετών.' },
    prot_fdwDowngraded:   { en: "Full Protection isn't available for your age range, so we've switched you to Basic Protection. Your total has been updated.",
                            el: 'Η Πλήρης Προστασία δεν είναι διαθέσιμη για την ηλικία σας — επιλέξαμε Βασική Προστασία. Το σύνολο ενημερώθηκε.' },
    prot_excess_full:     { en: 'Up to full vehicle value', el: 'Έως την πλήρη αξία του οχήματος' },
    prot_excess_zero:     { en: 'Zero excess', el: 'Μηδενική απαλλαγή' },
    prot_excess_upto:     { en: 'Up to €{amount}', el: 'Έως €{amount}' },

    // ---- extras (JS defaults; backend may override name/description) ----
    ex_perDay:            { en: '€{price} / day',          el: '€{price} / ημέρα' },
    ex_perDayItem:        { en: '€{price} / day per item', el: '€{price} / ημέρα ανά τεμάχιο' },
    ex_name_additional:   { en: 'Additional driver', el: 'Επιπλέον οδηγός' },
    ex_price_additional:  { en: '€6.66 / day per driver', el: '€6.66 / ημέρα ανά οδηγό' },
    ex_summary_additional:{ en: 'Share the wheel with a friend or partner.', el: 'Μοιραστείτε το τιμόνι με φίλο ή σύντροφο.' },
    ex_details_additional:{ en: "Planning to swap drivers during the trip? Add anyone you trust behind the wheel. They'll just need to bring a valid driving licence to the desk when you collect the car.",
                            el: 'Σκοπεύετε να εναλλάσσεστε οδηγοί στο ταξίδι; Προσθέστε όποιον εμπιστεύεστε στο τιμόνι. Αρκεί να φέρει έγκυρο δίπλωμα οδήγησης στο γραφείο κατά την παραλαβή.' },
    ex_name_gps:          { en: 'GPS navigation', el: 'Πλοήγηση GPS' },
    ex_summary_gps:       { en: 'Pre-loaded with Greek maps and points of interest.', el: 'Προφορτωμένο με ελληνικούς χάρτες και σημεία ενδιαφέροντος.' },
    ex_details_gps:       { en: 'Stay on track even without mobile data. Our portable GPS unit comes pre-loaded with detailed maps of Greece and the Cyclades, plus suggested routes to beaches, viewpoints, and tavernas.',
                            el: 'Μείνετε στη σωστή πορεία ακόμη και χωρίς δεδομένα κινητού. Η φορητή συσκευή GPS είναι προφορτωμένη με αναλυτικούς χάρτες της Ελλάδας και των Κυκλάδων, καθώς και προτεινόμενες διαδρομές προς παραλίες, σημεία θέας και ταβέρνες.' },
    ex_name_child:        { en: 'Child seat (4-7 years)', el: 'Παιδικό κάθισμα (4-7 ετών)' },
    ex_summary_child:     { en: 'Forward-facing seat for kids 4-7 years old (15-25kg).', el: 'Κάθισμα προς τα εμπρός για παιδιά 4-7 ετών (15-25kg).' },
    ex_details_child:     { en: 'Approved booster-style seat that meets all EU safety standards. Installed by our team at pick-up, ready to go. Choose the quantity if you need more than one.',
                            el: 'Εγκεκριμένο κάθισμα τύπου booster που πληροί όλα τα πρότυπα ασφαλείας της ΕΕ. Τοποθετείται από την ομάδα μας στην παραλαβή, έτοιμο για χρήση. Επιλέξτε ποσότητα αν χρειάζεστε περισσότερα από ένα.' },
    ex_name_baby:         { en: 'Baby seat (0-3 years)', el: 'Κάθισμα μωρού (0-3 ετών)' },
    ex_summary_baby:      { en: 'Rear-facing seat for infants and toddlers (0-13kg).', el: 'Κάθισμα προς τα πίσω για βρέφη και νήπια (0-13kg).' },
    ex_details_baby:      { en: 'A secure, comfortable rear-facing seat for your little one. Side-impact protection and adjustable harness included.',
                            el: 'Ένα ασφαλές, άνετο κάθισμα προς τα πίσω για το μικρό σας. Περιλαμβάνει προστασία πλευρικής σύγκρουσης και ρυθμιζόμενες ζώνες.' },
    ex_name_wifi:         { en: 'Portable WiFi hotspot', el: 'Φορητό WiFi hotspot' },
    ex_summary_wifi:      { en: 'Unlimited 4G data for up to 10 devices.', el: 'Απεριόριστα δεδομένα 4G για έως 10 συσκευές.' },
    ex_details_wifi:      { en: 'Stay connected wherever you go. Our pocket-sized hotspot delivers fast 4G across Greece and supports up to 10 devices at once.',
                            el: 'Μείνετε συνδεδεμένοι όπου κι αν πάτε. Το hotspot τσέπης προσφέρει γρήγορο 4G σε όλη την Ελλάδα και υποστηρίζει έως 10 συσκευές ταυτόχρονα.' },
    ex_name_roofrack:     { en: 'Roof rack', el: 'Σχάρα οροφής' },
    ex_summary_roofrack:  { en: 'Extra cargo space for surf boards, bikes, or luggage.', el: 'Επιπλέον χώρος για σανίδες surf, ποδήλατα ή αποσκευές.' },
    ex_details_roofrack:  { en: 'Bringing surf gear, bikes, or extra suitcases? Our roof rack adds carrying capacity without crowding the cabin.',
                            el: 'Φέρνετε εξοπλισμό surf, ποδήλατα ή επιπλέον βαλίτσες; Η σχάρα οροφής προσθέτει χώρο μεταφοράς χωρίς να γεμίζει η καμπίνα.' },

    // ---- young / senior / fee banners ----
    youngDriverBanner: {
      en: '⚠️ <strong>Young Driver Fee applies</strong> — drivers aged 21–25 are subject to an additional fee, payable at pick-up.',
      el: '⚠️ <strong>Ισχύει Χρέωση Νέου Οδηγού</strong> — οδηγοί 21–25 ετών επιβαρύνονται με επιπλέον χρέωση, πληρωτέα στην παραλαβή.' },
    seniorDriverBanner: {
      en: '⚠️ <strong>Senior Driver Fee applies</strong> — drivers aged 70–75 are subject to an additional fee, payable at pick-up.',
      el: '⚠️ <strong>Ισχύει Χρέωση Ηλικιωμένου Οδηγού</strong> — οδηγοί 70–75 ετών επιβαρύνονται με επιπλέον χρέωση, πληρωτέα στην παραλαβή.' },
    // "⚠️ After-hours fee: +€{fee} for {parts} (outside 09:00–21:00)."
    afterHoursBanner: {
      en: '⚠️ After-hours fee: +€{fee} for {parts} (outside 09:00–21:00).',
      el: '⚠️ Χρέωση εκτός ωραρίου: +€{fee} για {parts} (εκτός 09:00–21:00).' },
    afterHoursPickupAt: { en: 'pick-up at {time}', el: 'παραλαβή στις {time}' },
    afterHoursReturnAt: { en: 'return at {time}',  el: 'επιστροφή στις {time}' },
    and:               { en: 'and', el: 'και' },
    // "🚢 One-way rental — different island return. Includes €{fee} one-way fee."
    oneWayBanner: {
      en: '🚢 One-way rental — different island return. Includes €{fee} one-way fee.',
      el: '🚢 Ενοικίαση μονής διαδρομής — επιστροφή σε άλλο νησί. Περιλαμβάνει χρέωση €{fee}.' },

    // ---- price breakdown modal ----
    bd_vehicle:      { en: 'Vehicle',     el: 'Όχημα' },
    bd_protection:   { en: 'Protection',  el: 'Προστασία' },
    bd_extras:       { en: 'Extras',      el: 'Πρόσθετα' },
    bd_fees:         { en: 'Fees',        el: 'Χρεώσεις' },
    bd_afterHours:   { en: 'After-hours service fee', el: 'Χρέωση εκτός ωραρίου' },
    bd_afterHoursSub:{ en: 'Outside 09:00–21:00',     el: 'Εκτός 09:00–21:00' },
    bd_oneWay:       { en: 'One-way fee',             el: 'Χρέωση μονής διαδρομής' },
    bd_oneWaySub:    { en: 'Different island return', el: 'Επιστροφή σε άλλο νησί' },
    // "Promo {code}"
    bd_promo:        { en: 'Promo {code}', el: 'Κωδικός {code}' },
    // "€{amount}/day × {n} {unit}"
    bd_perDayTimes:  { en: '€{amount}/day × {n} {unit}', el: '€{amount}/ημέρα × {n} {unit}' },

    // ---- driver page: payment / cancellation info cards ----
    ic_payToday:           { en: 'Pay today',                    el: 'Πληρωμή σήμερα' },
    ic_afterConfirmation:  { en: 'After confirmation',          el: 'Μετά την επιβεβαίωση' },
    ic_depositAfterConfirm:{ en: 'Deposit after confirmation',  el: 'Προκαταβολή μετά την επιβεβαίωση' },
    ic_balanceAtCounter:   { en: 'Balance at counter',          el: 'Υπόλοιπο στο γραφείο' },
    ic_nothingNow:         { en: 'Nothing now',                 el: 'Τίποτα τώρα' },
    ic_secureLink:         { en: 'Secure link',                 el: 'Ασφαλής σύνδεσμος' },
    ic_atCounter:          { en: 'At counter',                  el: 'Στο γραφείο' },
    ic_nonRefundable:      { en: 'Non-refundable',              el: 'Μη επιστρέψιμο' },
    ic_payNothingToday:    { en: 'Nothing today — deposit on confirmation, balance at counter',
                             el: 'Τίποτα σήμερα — προκαταβολή με την επιβεβαίωση, υπόλοιπο στο γραφείο' },
    ic_noPaymentNowConfirm:{ en: 'No payment now — pay only after we confirm',
                             el: 'Καμία πληρωμή τώρα — πληρωμή μόνο αφού επιβεβαιώσουμε' },
    ic_payTodayDeposit:    { en: 'Pay today (booking deposit)', el: 'Πληρωμή σήμερα (προκαταβολή κράτησης)' },
    ic_atPickupBalance:    { en: 'At pick-up (balance)',        el: 'Στην παραλαβή (υπόλοιπο)' },
    ic_depositNowBalance:  { en: '10% deposit now · 90% balance at counter',
                             el: '10% προκαταβολή τώρα · 90% υπόλοιπο στο γραφείο' },
    ic_fullOnlineToday:    { en: '100% online today — secure checkout',
                             el: '100% online σήμερα — ασφαλής πληρωμή' },
    ic_freeUntil72h:       { en: 'Free until 72 hours before pick-up',
                             el: 'Δωρεάν έως 72 ώρες πριν την παραλαβή' },
    ic_3daysBefore:        { en: '3 days before pick-up',       el: '3 ημέρες πριν την παραλαβή' },
    // "Free cancellation until {deadline}"
    ic_freeCancelUntil:    { en: 'Free cancellation until {deadline}',
                             el: 'Δωρεάν ακύρωση έως {deadline}' },
    ic_lateNotice:         { en: 'Please contact us if you are running late — vehicles unclaimed after the pick-up time may be reallocated.',
                             el: 'Επικοινωνήστε μαζί μας αν καθυστερήσετε — οχήματα που δεν παραληφθούν μετά την ώρα παραλαβής ενδέχεται να διατεθούν αλλού.' },
    ic_flexibleCancel:     { en: 'Flexible — cancel anytime, deposit non-refundable',
                             el: 'Ευέλικτο — ακύρωση οποτεδήποτε, η προκαταβολή δεν επιστρέφεται' },
    ic_cancelAnytime:      { en: 'Cancel anytime, even at the last minute. Your 10% deposit is non-refundable, but you owe nothing more.',
                             el: 'Ακύρωση οποτεδήποτε, ακόμη και την τελευταία στιγμή. Η προκαταβολή 10% δεν επιστρέφεται, αλλά δεν οφείλετε τίποτα παραπάνω.' },
    ic_onlineNow:          { en: 'Online now',  el: 'Online τώρα' },
    ic_atPickup:           { en: 'At pick-up',  el: 'Στην παραλαβή' },
    ic_noChargeUntil:      { en: 'No charge until we confirm your booking',
                             el: 'Καμία χρέωση μέχρι να επιβεβαιώσουμε την κράτησή σας' },
    ic_reviewRequest:      { en: "We'll review your request and send you a secure payment link within 24 hours. You pay only after confirmation — nothing is charged today.",
                             el: 'Θα ελέγξουμε το αίτημά σας και θα σας στείλουμε ασφαλή σύνδεσμο πληρωμής εντός 24 ωρών. Πληρώνετε μόνο μετά την επιβεβαίωση — δεν χρεώνεται τίποτα σήμερα.' },
    ic_cancelAnytimeFlex:  { en: 'Cancel anytime, even at the last minute. Your booking deposit of <strong>€{deposit}</strong> is <span class="warn">non-refundable</span>, but you owe nothing else.',
                             el: 'Ακύρωση οποτεδήποτε, ακόμη και την τελευταία στιγμή. Η προκαταβολή κράτησης <strong>€{deposit}</strong> <span class="warn">δεν επιστρέφεται</span>, αλλά δεν οφείλετε τίποτα άλλο.' },
    ic_cancelBestPriceText:{ en: 'Cancel anytime up to <strong>3 days before pick-up</strong> for a full refund. After that, the booking becomes non-refundable.',
                             el: 'Ακύρωση οποτεδήποτε έως <strong>3 ημέρες πριν την παραλαβή</strong> για πλήρη επιστροφή. Μετά από αυτό, η κράτηση δεν επιστρέφεται.' },

    // ---- thank-you popup (upon request) ----
    ty_title:        { en: 'Request received', el: 'Το αίτημα ελήφθη' },
    ty_body:         { en: "We'll review your booking and respond within 12 hours.",
                       el: 'Θα ελέγξουμε την κράτησή σας και θα απαντήσουμε εντός 12 ωρών.' },
    ty_reference:    { en: 'Your request reference', el: 'Κωδικός αιτήματος' },
    ty_sentTo:       { en: "We've sent a confirmation of your request to",
                       el: 'Στείλαμε επιβεβαίωση του αιτήματός σας στο' },
    ty_noCharge:     { en: "You'll receive a payment link once we approve your booking. No charge has been made yet.",
                       el: 'Θα λάβετε σύνδεσμο πληρωμής μόλις εγκρίνουμε την κράτηση. Δεν έχει γίνει καμία χρέωση ακόμη.' },

    // ---- free-confirmed popup ----
    fc_title:        { en: 'Booking confirmed', el: 'Η κράτηση επιβεβαιώθηκε' },
    fc_body:         { en: "Your promo code covers the full amount — there's nothing to pay.",
                       el: 'Ο κωδικός σας καλύπτει το σύνολο — δεν υπάρχει τίποτα να πληρώσετε.' },
    fc_reference:    { en: 'Your booking reference', el: 'Κωδικός κράτησης' },
    fc_sentTo:       { en: "We've sent your confirmation and voucher to",
                       el: 'Στείλαμε την επιβεβαίωση και το voucher στο' },
    fc_noPayment:    { en: 'No payment is required. See you on the road!',
                       el: 'Δεν απαιτείται πληρωμή. Καλό δρόμο!' },

    // ---- on-request "how it works" popup ----
    or_title:        { en: 'How on-request bookings work',
                       el: 'Πώς λειτουργούν οι κρατήσεις κατόπιν ζήτησης' },
    or_intro:        { en: "No payment is made now. Here's what happens next:",
                       el: 'Δεν γίνεται καμία πληρωμή τώρα. Δείτε τι ακολουθεί:' },
    or_step1Title:   { en: 'Submit your request', el: 'Υποβάλετε το αίτημά σας' },
    or_step1Body:    { en: 'No payment now — your card is not charged.',
                       el: 'Καμία πληρωμή τώρα — η κάρτα σας δεν χρεώνεται.' },
    or_step2Title:   { en: 'We review & email you', el: 'Ελέγχουμε & σας ενημερώνουμε' },
    or_step2Body:    { en: "We'll confirm availability and respond within 12 hours.",
                       el: 'Θα επιβεβαιώσουμε τη διαθεσιμότητα και θα απαντήσουμε εντός 12 ωρών.' },
    or_step3Title:   { en: 'Secure payment link', el: 'Ασφαλής σύνδεσμος πληρωμής' },
    or_step3Body:    { en: 'Pay only after we confirm your booking.',
                       el: 'Πληρώνετε μόνο αφού επιβεβαιώσουμε την κράτηση.' },
    or_cancel:       { en: 'Cancel', el: 'Άκυρο' },

    // ---- card-on-file variants (shown only when /api/config card_on_file_enabled = true) ----
    // Customer saves their card now (Viva verification, €0) and is auto-charged on confirmation —
    // no payment link to click. These replace the legacy "secure payment link" copy.
    or_intro_cof:        { en: "No charge now — you'll securely save your card. Here's what happens next:",
                           el: 'Καμία χρέωση τώρα — αποθηκεύετε με ασφάλεια την κάρτα σας. Δείτε τι ακολουθεί:' },
    or_step1Body_cof:    { en: 'Enter your card now — €0, nothing is charged or held.',
                           el: 'Καταχωρείτε την κάρτα σας τώρα — €0, καμία χρέωση ή δέσμευση.' },
    or_step3Title_cof:   { en: 'Automatic charge on confirmation',
                           el: 'Αυτόματη χρέωση με την επιβεβαίωση' },
    or_step3Body_cof:    { en: 'If we confirm, your saved card is charged automatically and you get a confirmation email — no extra step. If not, you are not charged.',
                           el: 'Αν επιβεβαιώσουμε, η κάρτα σας χρεώνεται αυτόματα και λαμβάνετε επιβεβαιωτικό email — χωρίς άλλο βήμα. Αν όχι, δεν χρεώνεστε.' },
    ic_secureLink_cof:   { en: 'Auto-charge', el: 'Αυτόματη χρέωση' },
    ic_reviewRequest_cof:{ en: "We'll review your request within 12 hours. Your card is saved but not charged — we charge it automatically only if we confirm. Nothing is charged today.",
                           el: 'Θα ελέγξουμε το αίτημά σας εντός 12 ωρών. Η κάρτα σας αποθηκεύεται αλλά δεν χρεώνεται — τη χρεώνουμε αυτόματα μόνο αν επιβεβαιώσουμε. Δεν χρεώνεται τίποτα σήμερα.' }
  };

  function t(key, vars) {
    var entry = I18N[key];
    var str;
    if (entry == null) {
      str = key;
    } else if (typeof entry === 'string') {
      str = entry;
    } else {
      str = (entry[LANG] != null) ? entry[LANG] : (entry.en != null ? entry.en : key);
    }
    if (vars) {
      str = str.replace(/\{(\w+)\}/g, function (m, name) {
        return (vars[name] != null) ? vars[name] : m;
      });
    }
    return str;
  }

  /** Localized "N day(s)" / "N night(s)" helper. */
  function tCount(n, oneKey, otherKey) {
    return n + ' ' + t(n === 1 ? oneKey : otherKey);
  }

  global.LANG = LANG;
  global.t = t;
  global.tCount = tCount;
  global.I18N = I18N;
})(window);
