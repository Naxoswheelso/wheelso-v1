# Wheelso — Σημερινοί business rules (από το frontend)

> Εξήχθη από `search.js` / `script.js` / `booking-content.js`. Αυτές είναι οι ΠΡΑΓΜΑΤΙΚΕΣ τιμές/κανόνες
> που χρησιμοποιούνται σήμερα — input για το data-driven pricing engine του νέου CRM.
> Κάθε «hardcoded» τιμή παρακάτω πρέπει να γίνει **configurable παράμετρος** ανά tenant.

## Pricing
- **Best price = flex × 0.90** (10% online discount), στρογγυλοποίηση 2 δεκαδικά. `search.js:116`
- Χρέωση ανά **billing day** (24ωρα, ceil) — authoritative από backend (`result.days`).
- Νόμισμα: **EUR** (μόνο, χωρίς multi-currency ακόμη).

## Fees & surcharges
- **After-hours fee = €25 ανά event** (pickup ή/και return εκτός **09:00–21:00**). Δύο events = €50. `search.js:1332-1373`
- **Lead time = 2 ώρες** (μπλοκάρει pickup < τώρα+2h).
- **One-way fee**: ορίζεται από backend (`one_way_fee.fee_total`), μπαίνει στο total. `search.js:1967-1968`

## Protection (ανά ημέρα, excess)
| Code | Όνομα | €/ημέρα | Excess | Age restriction |
|---|---|---|---|---|
| `no_extra` | TPL | €0 | full value | — |
| `basic` | CDW | €8 | €800 | — |
| `full` | FDW | €15 | €0 | **μπλοκ σε 21-25 & 70-75** |

Φορτώνονται και ανά category από `/api/protection?category=X` (fallback τα defaults).

## Extras
| Code | €/ημέρα | per-unit | max qty |
|---|---|---|---|
| additional-driver | €6.66 | όχι | 4 |
| gps | €8 | όχι | 4 |
| child-seat | €5 | ναι | 4 |
| baby-seat | €5 | ναι | 4 |
| wifi | €7 | όχι | 4 |
| roof-rack | €4 | όχι | 4 |

Φορτώνονται από `/api/extras`. Total extra = `price/day × qty × days`.

## Promo
- Validate server-side: `POST /api/promo/validate {code, days, total}` → `discount_amount`.
- **Cap: `Math.min(discount, total)`** — ποτέ πάνω από το total. `search.js:1169`
- 100% promo → `free === true` → confirmed-free popup (€0 πληρωμή).

## Rate types & payment
- **best_price**: full amount online τώρα· free cancellation **72h** πριν το pickup.
- **flex**: **deposit 10%** τώρα, υπόλοιπο στο counter· free cancellation anytime.
- **upon-request**: εξαρτάται από flag `CARD_ON_FILE` (card verification €0 vs pay-by-link μετά).

## Availability / dates
- **Max rental = 28 ημέρες** (hard block). Min = 1 ημέρα (same-day επιτρέπεται).
- Driver age bands: `26-69`, `21-25`, `70-75` (επηρεάζουν FDW eligibility).

## Total formula
```
Total = vehicleDaily×days + protectionDaily×days + Σ(extra×qty×days)
        + after_hours_fee + one_way_fee − promo_discount   (2 decimals)
```
- **Server parity (409)**: server απορρίπτει αν `server_total > client_total + €0.05`.
- Η τιμή υπολογίζεται σε **4 σημεία** (renderDriverTotal, renderInfoCards, buildBreakdown,
  buildBookingPayload) — στο νέο σύστημα θα είναι **ΕΝΑ** authoritative `/quote` endpoint.

## API endpoints (σημερινά)
`/api/config`, `/api/cars`, `/api/categories`, `/api/protection?category=`, `/api/extras`,
`/api/stations`, `/api/` (availability+pricing, POST), `/api/promo/validate` (POST), `/api/bookings` (POST).

## Locations σήμερα
ATH (airport+downtown), MYK (airport+port, meet&greet), PAR, NAX, SKI (airport+port έκαστο).

## Παράμετροι που πρέπει να γίνουν configurable (data-driven)
`MAX_RENTAL_DAYS=28`, `AFTER_HOURS_FEE=25`, `BUSINESS_OPEN=09:00`, `BUSINESS_CLOSE=21:00`,
`LEAD_TIME_HOURS=2`, best-price multiplier `0.90`, flex deposit `0.10`, cancellation `72h`,
extras max qty `4`, age bands & FDW restriction list.
