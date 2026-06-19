# Car-Rental CRM — Master Plan (Multi-tenant SaaS)

> Καινούργιο, ανεξάρτητο προϊόν. **Δεν** έχει σχέση με το Wheelso website.
> Όραμα: ένα «ultimate» CRM/management για car rental, εμπνευσμένο **λειτουργικά** από το Wheelsys
> (clean-room — ιδέες & χρηστικότητα, ΟΧΙ αντιγραφή κώδικα), που θα χρησιμοποιεί πρώτα ο owner και
> μετά θα νοικιάζεται σε **subscribers** (multi-tenant SaaS).
>
> Κατάσταση: **draft για συζήτηση**. Τίποτα δεν είναι οριστικό μέχρι να το εγκρίνεις.
> Ημ/νία: 2026-06-19.

---

## 0. Οι 4 θεμελιώδεις αρχές (μη διαπραγματεύσιμες)

1. **Data-driven / configuration-as-data.** Καμία επιχειρησιακή τιμή δεν ζει στον κώδικα.
   Αυτοκίνητα, τιμές, σεζόν, fees, extras, locations, κανόνες, email templates → **όλα στη βάση**,
   αλλάζουν από admin panel **χωρίς deploy**. Ο κώδικας ξέρει μόνο *πώς να εφαρμόζει κανόνες*,
   όχι *ποιες είναι οι τιμές*.
2. **Multi-tenant από την πρώτη γραμμή.** Κάθε δεδομένο ανήκει σε έναν `tenant` (ενοικιαστική εταιρεία).
   Απομόνωση δεδομένων εγγυημένη σε επίπεδο βάσης. Δεν «προσθέτουμε multi-tenancy μετά» — κοστίζει 10×.
3. **Authoritative server, untrusted client.** Τιμές/διαθεσιμότητα/κανόνες υπολογίζονται **πάντα** στον server.
   Ο client μόνο εμφανίζει. (Ίδια αρχή με το pricing invariant που ήδη ξέρεις από το Wheelso.)
4. **Clean-room & νομικά καθαρό.** Μοντελοποιούμε *λειτουργία* όχι *κώδικα τρίτου*. Κανένα PCI card data
   στη βάση μας, GDPR-by-design, audit log σε όλα.

---

## 1. Αρχιτεκτονική — high level

```
                       ┌─────────────────────────────────────────┐
                       │              Tenants (rental cos)        │
                       └─────────────────────────────────────────┘
   ┌──────────────┐     ┌──────────────┐     ┌────────────────────┐
   │ Admin Panel  │     │ Public       │     │ Partner / B2B API  │
   │ (back-office)│     │ Booking      │     │ + OTA / brokers    │
   │  SPA         │     │ Widget/site  │     │                    │
   └──────┬───────┘     └──────┬───────┘     └─────────┬──────────┘
          │  HTTPS/JSON        │                       │
          └──────────┬─────────┴───────────┬───────────┘
                     ▼                      ▼
              ┌─────────────────────────────────────┐
              │           API layer (REST)          │
              │  authn (JWT) · RBAC · tenant scope   │
              │  validation · rate-limit · webhooks  │
              └───────┬───────────────┬──────────────┘
                      ▼               ▼
          ┌───────────────────┐  ┌────────────────────┐
          │  Domain services  │  │  Rule / Pricing     │
          │ (fleet, booking,  │  │  engine (data-driven)│
          │  contracts, …)    │  └────────────────────┘
          └─────────┬─────────┘
                    ▼
   ┌────────────┬────────────┬─────────────┬──────────────┐
   │ PostgreSQL │ Redis      │ Object store│ Background    │
   │ (+ RLS)    │ cache/queue│ (S3-like)   │ jobs / cron   │
   └────────────┴────────────┴─────────────┴──────────────┘
                    │
        external: payment gateways (Viva/Stripe) · email/SMS · accounting · maps
```

### 1.1 Multi-tenancy μοντέλο — σύσταση

| Επιλογή | Απομόνωση | Κόστος/πολυπλοκότητα | Σύσταση |
|---|---|---|---|
| DB-per-tenant | Μέγιστη | Πολύ ακριβό σε scale | Όχι (μόνο enterprise on-prem) |
| Schema-per-tenant | Υψηλή | Μέτριο, migrations πονοκέφαλος | Όχι για αρχή |
| **Shared DB + `tenant_id` + Row-Level Security** | Καλή | Χαμηλό, scales | **ΝΑΙ** |

**Σύσταση:** Postgres, κάθε επιχειρησιακός πίνακας έχει `tenant_id`, με **Row-Level Security (RLS)**
policies ώστε ένα query να μην μπορεί ΠΟΤΕ να δει δεδομένα άλλου tenant — ακόμη κι αν ξεχάσουμε ένα
`WHERE`. Το `tenant_id` μπαίνει στο session context από το JWT. Αργότερα, μεγάλος πελάτης μπορεί να
πάει σε dedicated schema/DB χωρίς αλλαγή domain logic.

### 1.2 Stack — σύσταση (ανοιχτό σε συζήτηση)

- **Backend:** Node.js + TypeScript (NestJS) **ή** Python (FastAPI). Πρόταση: **NestJS + TypeScript** —
  type-safety end-to-end, μοιράζεται types με το frontend, μεγάλο oikοσύστημα.
- **DB:** **PostgreSQL** (RLS, JSONB για flexible config, strong constraints). ORM: Prisma ή TypeORM.
- **Cache/queue:** **Redis** (cache, rate-limit, BullMQ jobs).
- **Object storage:** S3-compatible (φωτό οχημάτων, ζημιές, συμβόλαια PDF, license scans).
- **Admin frontend:** **React + TypeScript** (Vite). UI library: shadcn/ui ή MUI.
- **Public booking widget:** ελαφρύ embeddable (μπορεί και vanilla, όπως ήδη ξέρεις).
- **Hosting:** ξεκινάμε Railway/Render/Fly (όπως τώρα), έτοιμο για AWS/GCP αργότερα.
- **Auth:** δικό μας JWT + refresh, ή Auth provider (Clerk/Auth0) στην αρχή για ταχύτητα.

> Αν προτιμάς άλλο stack (π.χ. Laravel/PHP, .NET) πες μου — το design model δεν αλλάζει, μόνο η υλοποίηση.

---

## 2. Domain model — η καρδιά (data-driven)

Παρακάτω τα **bounded contexts** (domains). Για κάθε ένα: βασικές οντότητες + βασικά πεδία + το *τι
γίνεται configurable*. Όλα τα entities φέρουν `id`, `tenant_id`, `created_at`, `updated_at`,
`created_by`, soft-delete (`deleted_at`).

### 2.1 Tenancy & Identity
- **Tenant** (η ενοικιαστική εταιρεία): legal name, branding (logo, χρώματα, domain), locale, currency,
  timezone, subscription plan, feature flags, status.
- **User**: email, hashed password / SSO, name, status, MFA.
- **Membership**: συνδέει User↔Tenant με **Role** (ένας user μπορεί σε πολλούς tenants — π.χ. franchise).
- **Role / Permission** (RBAC, data-driven): owner / manager / agent / accountant / read-only +
  **custom roles** ανά tenant. Permissions ανά resource+action (`reservation:create`, `pricing:edit`…).
- **Location / Branch**: όνομα, διεύθυνση, geo, ωράρια λειτουργίας (για after-hours fees!), pickup points
  (airport, port, office, hotel-delivery), holiday calendar.

### 2.2 Fleet (στόλος)
- **VehicleCategory / Group**: π.χ. ACRISS code (MBMR…), περιγραφή, εικόνα, σειρά εμφάνισης. **Το pricing
  & η διαθεσιμότητα δουλεύουν συχνά σε επίπεδο category** (group-based availability) — κρίσιμη απόφαση.
- **Vehicle**: plate, VIN, make/model/year, category_id, χρώμα, καύσιμο, μετάδοση, θέσεις, πόρτες,
  εξοπλισμός, current_location, status (available / rented / maintenance / out-of-service), odometer,
  fuel level, acquisition cost & date (για ROI), φωτογραφίες.
- **VehicleDocument**: ασφάλεια, άδεια, ΚΤΕΟ, με ημερομηνίες λήξης + reminders.
- **MaintenanceTask / Service**: τύπος, κόστος, οδόμετρο, downtime window (κλειδώνει διαθεσιμότητα).
- **DamageReport / Inspection**: σημεία ζημιάς (diagram), φωτό, χρέωση, σύνδεση με rental.

### 2.3 Availability & Calendar
- **AvailabilityEngine**: για ζητούμενο [category ή vehicle] × [location] × [from–to] επιστρέφει τι είναι
  ελεύθερο, λαμβάνοντας υπόψη: υπάρχουσες κρατήσεις, maintenance, buffer χρόνος καθαρισμού, μεταφορές
  μεταξύ locations, overbooking policy (configurable: strict / allow N% / group-pooling).
- **BlackoutDates / Stop-sell** ανά category/location/period (data-driven).

### 2.4 Pricing engine ⭐ (το πιο σημαντικό data-driven κομμάτι)
Στόχος: ο owner αλλάζει **τα πάντα** για τις τιμές χωρίς κώδικα. Μοντέλο ως **rules + rate tables**:

- **RatePlan**: ονομασία (π.χ. "Standard 2026", "Early-bird"), νόμισμα, προτεραιότητα, ισχύς από/έως.
- **Season**: ονομασία + date ranges (επικαλυπτόμενα με προτεραιότητα), π.χ. High/Mid/Low.
- **TariffTable**: τιμή ανά `category × season × duration-tier`. Duration tiers = κλίμακες ημερών
  (1-2, 3-6, 7-14, 15+) με **διαφορετική €/ημέρα** (όσο πιο πολλές μέρες τόσο φθηνότερα).
- **PricingModifier / Rules** (lista κανόνων με conditions → effect):
  - Length-of-rental discounts, day-of-week, lead-time (early booking), last-minute, occupancy-based
    (yield), minimum rental days ανά σεζόν.
- **Fee** (data-driven, με condition engine): after-hours pickup/return (βάσει ωραρίου location),
  one-way / different drop-off, young-driver, additional-driver, airport/port surcharge, delivery fee
  (ανά ζώνη/χιλιόμετρα), cleaning, fuel policy, child seat κ.λπ. Κάθε fee = {τύπος (flat/%/per-day/per-km),
  ποσό, condition, φορολογείται?}.
- **Extra / Add-on**: GPS, child seat, additional driver, insurance upgrade — με δικό του pricing
  (per-day / per-rental / flat) και απόθεμα (π.χ. έχω 5 child seats).
- **Protection / Insurance products**: CDW, SCDW, theft, tyres&glass — με excess/deposit ανά προϊόν.
- **Deposit / Pre-authorization**: ποσό ανά category ή protection level.
- **Tax / VAT**: ποσοστά ανά κατηγορία υπηρεσίας/χώρα, inclusive/exclusive.
- **Promotion / Coupon**: code, τύπος (% ή €), όρια (min days, ποσό, χρήσεις, ημερομηνίες, categories),
  **πάντα validated & capped server-side** (ίδια αρχή με το Wheelso promo invariant).
- **Currency / FX**: multi-currency με rate source.

> **Quote endpoint (authoritative):** `POST /quote` παίρνει {category/vehicle, dates, locations, extras,
> protection, promo, driver_age} και γυρίζει αναλυτικό breakdown + `total`. Αυτό είναι το single source
> of truth — ίδια φιλοσοφία με `computeBookingQuote`.

### 2.5 Reservations (κρατήσεις)
- **Reservation**: tenant, customer, status (quote → hold/option → confirmed → checked-out → checked-in/
  returned → completed / cancelled / no-show), pickup & dropoff (location + datetime), category/vehicle
  (μπορεί category τώρα, assign vehicle αργότερα), drivers, selected extras/protection, **price snapshot**
  (κλειδωμένο breakdown — δεν αλλάζει αν αλλάξει το tariff μετά), source/channel, agent, notes.
- **ReservationStateMachine**: επιτρεπτές μεταβάσεις + side-effects (π.χ. confirm → δέσμευση οχήματος,
  cancel → cancellation fee βάσει πολιτικής).
- **CancellationPolicy** (data-driven): free until X ώρες, μετά Y% χρέωση.
- **Hold/Option** με λήξη (auto-expire job).

### 2.6 Rental Agreement / Contract (το «φυσικό» κομμάτι)
- **Checkout (παράδοση)**: assign συγκεκριμένο vehicle, odometer out, fuel out, condition/damage diagram,
  φωτό, υπογραφή πελάτη (e-sign), εκτύπωση/PDF συμβολαίου.
- **Check-in (επιστροφή)**: odometer in, fuel in, νέες ζημιές, υπολογισμός extra χρεώσεων (km over, fuel,
  late return, damage, fines/tolls), τελικό settlement.
- **AdditionalCharge**: post-rental χρεώσεις (κλήσεις, διόδια, καθάρισμα, ζημιά).

### 2.7 Customers / CRM
- **Customer** (person ή company), **Driver** (license number/expiry/scan, date of birth → young-driver
  fee), επικοινωνία, διεύθυνση, ΑΦΜ/tax id, **blacklist flag**, loyalty tier, σημειώσεις.
- **CommunicationLog**: emails/SMS/calls, με templates.
- **Consent / GDPR**: συναινέσεις, data export & erasure, retention policy.

### 2.8 Payments & Billing
- **PaymentGateway config** ανά tenant (Viva, Stripe…). **Δεν** αποθηκεύουμε κάρτες — tokenization στον
  gateway (PCI-safe).
- **Payment / Transaction**: auth/capture/refund, deposit pre-auth & release, partial payments.
- **Invoice / CreditNote**: αρίθμηση ανά tenant, νόμιμα στοιχεία, VAT breakdown, PDF, export προς λογιστική.
- **Payout / Commission** (για B2B/partners & για το SaaS billing σου).

### 2.9 Channel / Distribution
- **Public booking widget/API**, **B2B agent portal** (δικές τους τιμές/εκπτώσεις), **OTA/broker
  integrations** (rate & availability push, booking pull), **rate parity** controls.

### 2.10 Operations
- Fleet planning board (ποιο όχημα, πού, πότε), vehicle movements/transfers, handover scheduling,
  cleaning & maintenance tasks, staff assignment, daily run-sheet.

### 2.11 Reporting & Analytics
- Utilization %, RevPAR, revenue/category/location, fleet ROI & depreciation, top customers, channel mix,
  outstanding payments, damage frequency. Export CSV/Excel, dashboards.

### 2.12 Notifications (data-driven templates)
- **NotificationTemplate**: ανά event (booking confirmed, reminder, pickup, return, payment, doc expiry),
  ανά γλώσσα, email/SMS, με variables. **Triggers** configurable.

### 2.13 Settings / Configuration registry  ⭐
Ο «εγκέφαλος» της data-driven αρχής:
- **TenantSetting** (key-value + JSONB): ωράρια, νόμισμα, locale, πολιτικές, fee toggles, branding.
- **FeatureFlag** ανά tenant/plan: ποια modules βλέπει ο κάθε subscriber (π.χ. βασικό plan χωρίς OTA).
- **Catalog tables** (όλα τα παραπάνω) = η «βάση που αλλάζει τα πάντα από το backend».

### 2.14 Platform / SaaS layer (για τους subscribers σου)
- **SubscriptionPlan** (tiers, limits: #vehicles, #users, modules), **Billing** προς subscribers,
  **Onboarding** νέου tenant (self-serve signup → seed default config), **Super-admin** console για σένα,
  **Usage metering**, **System audit**.

### 2.15 Audit & Activity log
- Αμετάβλητο log: ποιος, τι, πότε, παλιά→νέα τιμή — σε όλα τα κρίσιμα entities (ειδικά pricing & payments).

---

## 3. API design (γραμμές)
- **REST + JSON**, versioned (`/v1`), JWT auth, tenant από token, RBAC guards, request validation (zod/DTO).
- Κρίσιμα endpoints: `/quote`, `/availability`, `/reservations`, `/contracts`, `/vehicles`, `/pricing/*`,
  `/customers`, `/payments`, `/settings`, `/reports/*`, `/webhooks/*`.
- **Idempotency keys** σε create/payment. **Webhooks** προς tenants & από gateways. **Public API** keys
  για widgets/partners με scopes.

---

## 4. Security & compliance
- **Tenant isolation** via RLS (πρωτεύον), επιπλέον app-level scoping.
- **RBAC** granular· least-privilege.
- **PII/GDPR**: encryption at rest, data minimization, export/erase, retention, consent log, license-scan
  access control.
- **PCI**: ποτέ raw card data — gateway tokenization μόνο.
- **AuthN**: password hashing (argon2), MFA, refresh-token rotation, brute-force lockout, rate-limit.
- **Audit** σε pricing/payments/permissions.
- **Backups** + point-in-time recovery, **secrets management**.

---

## 5. Phased roadmap (MVP → ultimate)

| Φάση | Στόχος | Παραδοτέο |
|---|---|---|
| **0. Foundation** | Σκελετός, multi-tenancy, auth/RBAC, settings registry, CI, DB+RLS | Login, tenant, users, roles, locations |
| **1. Fleet + Pricing engine** ⭐ | Στόλος + data-driven τιμές + availability + `/quote` | Διαχείριση οχημάτων/κατηγοριών, rate tables/seasons/fees/extras/promos, διαθεσιμότητα, authoritative quote |
| **2. Reservations** | Πλήρης κύκλος κράτησης + public booking widget | Δημιουργία/τροποποίηση/ακύρωση, price snapshot, calendar, online booking |
| **3. Contracts/Operations** | Checkout/check-in, ζημιές, χιλιόμετρα/καύσιμα, operations board | Ψηφιακό συμβόλαιο + settlement |
| **4. Payments/Billing** | Gateway, deposits/pre-auth, invoices, refunds, accounting export | Online πληρωμές + τιμολόγηση |
| **5. CRM/Customers** | Πελάτες, drivers, GDPR, communications/templates | Καρτέλα πελάτη + notifications |
| **6. Reporting** | Dashboards & εξαγωγές | KPIs, utilization, revenue, ROI |
| **7. SaaS hardening** | Subscriber onboarding, plans/limits, super-admin, SaaS billing | Έτοιμο να μπουν πληρωμένοι subscribers |
| **8. Channel/Distribution** | B2B portal, OTA/broker, partner rates | Διανομή & συνεργάτες |

> **Σύσταση εκκίνησης:** Φάση 0 → 1. Το pricing engine είναι το «βαρύ» κομμάτι και ό,τι σε πονάει σήμερα
> (hardcoded τιμές). Μόλις γίνει data-driven, όλα τα υπόλοιπα πατούν πάνω του.

---

## 6. Ανοιχτά ερωτήματα (να απαντηθούν πριν τη Φάση 0)

1. **Stack:** NestJS+Postgres (πρόταση) ή έχεις προτίμηση (PHP/Laravel, .NET, Python/FastAPI);
2. **Availability granularity:** ανά **category/group** (όπως τα περισσότερα rental systems) ή ανά
   **συγκεκριμένο όχημα**; (επηρεάζει βαθιά pricing & availability)
3. **Pricing tiers:** δουλεύεις με **κλίμακες ημερών** (1-2 / 3-6 / 7+) όπως φαντάζομαι; Ποια fees έχεις
   σήμερα στην πραγματικότητα (after-hours, one-way, young driver, delivery…);
4. **Locations:** πόσα σημεία/νησιά; one-way μεταξύ τους;
5. **Payments:** Viva (όπως τώρα) + κάτι άλλο; Deposits/pre-auth ναι;
6. **Subscribers:** τι θα τους χρεώνεις (per-vehicle, flat, tiers) και τι θες να μπορούν να αλλάζουν μόνοι;
7. **Reuse:** θες να **επαναχρησιμοποιήσουμε** ό,τι καλό υπάρχει στο `wheelso-backend` (π.χ. quote/promo
   λογική) ή ξεκινάμε από καθαρό repo;

---

## 7. Τι θα ζητήσω αύριο (από PC) για να γίνει πιστό
- **Screenshots από το admin/back-office του Wheelsys** — ειδικά οι οθόνες: vehicles, pricing/seasons,
  fees, extras, locations, users/roles, reservation form, contract. (Όσα περισσότερα πεδία, τόσο πιστότερο
  το model.)
- Λίστα με τα **modules που θεωρείς must-have** για το «ultimate».
- Απαντήσεις στα ανοιχτά ερωτήματα §6.

---

### Σημείωση μεθόδου (clean-room)
Μοντελοποιούμε **λειτουργικότητα & data model** όπως τα παρατηρούμε ως χρήστες — όχι κώδικα τρίτου.
Παίρνουμε ιδέες/χρηστικότητα (θεμιτό), χτίζουμε **δική μας, καλύτερη, νομικά καθαρή** υλοποίηση.
