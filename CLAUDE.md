# WHEELSO Frontend — Claude Code project guide

Static site on **Netlify**. Staging: `https://soft-florentine-6429c0.netlify.app`
- `search.js` + `search.html` = **LIVE checkout/results**. `script.js` + `index.html` = home. `checkout.html/js` = **LEGACY, ignore**.
- `API_BASE` hardcoded in `search.js:16` and `script.js` → `https://wheelso-backend-production.up.railway.app`.
- `apiGet`/`apiPost` helpers: **`apiPost` throws on non-2xx; `err.data` = response body**.

## Second brain (knowledge tracking)
Knowledge, αποφάσεις & ιστορικό αυτού του project ζουν στο **second brain**:
`C:\Users\bogda\Documents\GitHub\Yorgos_brain\wiki\projects\wheelso-gr.md` (ιστορικό: `wiki\sources\wheelso-handoffs.md`).
Όταν παίρνεται **σημαντική απόφαση** (UX, pricing, security, launch), κατέγραψέ την εκεί στο
*Decisions log*. Ο κώδικας μένει εδώ· το brain κρατά μόνο τη γνώση.

## Working method (always)
- Use **Plan mode** for any change touching logic or more than one file: research read-only, present a plan, wait for approval, then edit.
- Flow: recon (read-only) → plan → **show `git diff` before committing** → **atomic commit per logical change** → push. Stage only the intended files.
- Before editing, **self-review the plan for pricing / security / edge cases**.
- **Ask** business/UX decisions — don't assume.

## CRITICAL invariant — price is shown client-side but OWNED server-side
- What we display MUST equal what we send as `total_price`, and the server (`computeBookingQuote`) is authoritative and 409s if `server_total > client_total + €0.05`.
- **The promo discount amount comes from the server** (`POST /api/promo/validate` with `{code, days, total}`) — never computed or trusted in JS. Always **cap the discount at the total** (`Math.min(discount, total)`) to mirror the server.

## CRITICAL invariant — price shows in 4 places; keep them in sync
Any price change must update ALL of these (each recomputes the total):
1. `renderDriverTotal` — via `populateDriverSummary` and `updateDriverTotal`
2. `renderInfoCards`
3. `buildBreakdown` (the price-breakdown modal)
4. `buildBookingPayload` (the `total_price` sent to the server)

`searchCtx.promo` is module-level and in scope everywhere. The promo is validated **once** in `openDriverPage` (the total is locked by then).

## CRITICAL invariant — cross-repo price parity (avoid 409)
Any fee/price rule must match the **backend (`wheelso-backend`)** exactly: after-hours window, one-way fee, best_price ×0.90, protection/extras, promo discount + cap. **Change both repos together and deploy close in time**, or e.g. a 21:00 booking 409s.

## Booking submit outcomes (`driverContinueBtn` handler)
- `result.payment_url` → redirect to Viva.
- `result.free === true` (100% promo, €0) → `showFreeConfirmedPopup` ("confirmed, nothing to pay").
- else (upon-request) → `showThankYouPopup` ("Request received").

## Known issues / backlog (remove when fixed)
- `renderInfoCards` total omits after-hours/one-way fees (pre-existing) → can disagree with the breakdown total when fees apply; currently floored at 0 for promos.
- `showThankYouPopup` has an unused `total` param (TODO in code).

## Done recently
- After-hours fee free at exactly 21:00 — minute-precision boundary (`70f2b8c`; backend match `173a4f9`).
- BUG-A: promo discount in display + payload (`39955bf`), confirmed-free popup (`2550e52`). BUG-01..04 closed; max-28-day guard; home-form promo validation.
