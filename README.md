# Wheelso — New Website

## Πώς να ανοίξεις το site

1. Κάνε **unzip** αυτόν τον φάκελο σε όποιο μέρος θες στον υπολογιστή σου
2. Άνοιξε τον φάκελο `wheelso/`
3. **Διπλό click στο `index.html`** → θα ανοίξει στον default browser σου (Chrome, Safari, Edge, Firefox)

## Δομή αρχείων

```
wheelso/
├── index.html       ← Το κύριο HTML (Header + Hero + Booking Widget)
├── styles.css       ← Όλα τα styles (χρώματα, layout, calendar)
├── script.js        ← Το JavaScript (date picker, interactivity)
├── README.md        ← Αυτό το αρχείο
└── assets/
    ├── logo.png         ← Το logo για το header
    └── logo-full.png    ← Πλήρες logo σε υψηλή ανάλυση (backup)
```

## Brand Colors (από το Wheelso brand guide)

- **Σκούρο μπλε:** `#093D5E` (Pantone 2955 C) — primary
- **Μεσαίο μπλε:** `#1C5875` (Pantone 7700 C) — secondary
- **Lime:** `#CFDD28` (Pantone 380 C) — accent / CTAs

Όλα τα χρώματα είναι ορισμένα ως CSS variables στην αρχή του `styles.css` και μπορούν εύκολα να αλλάξουν από ένα σημείο.

## Τι περιλαμβάνει αυτή η έκδοση (v1)

- **Header** με logo, navigation, language switcher (EN/GR), "My Booking"
- **Hero section** με headline, subtitle, eyebrow badge
- **Booking widget** Sixt-style με:
  - Pick-up location dropdown (Airport / City / Port)
  - Optional different return location
  - **Date Range Picker** (2 μήνες, hover preview, click-to-select)
  - Pick-up & Return time (30-min intervals)
  - Driver age
  - Promo code
  - "Search cars" CTA
- **Trust strip** με 5 features (Insurance, Mileage, No Deposit, Cancellation, Roadside)
- **Fully responsive** σε desktop, tablet, mobile

## Επόμενα τμήματα (TODO)

- [ ] Vehicle Categories / Fleet (Sixt-style cards)
- [ ] Locations (Athens, Mykonos, Paros, Naxos)
- [ ] Why Wheelso (γιατί εμάς)
- [ ] Insurance Options (CDW / SCDW / FDW)
- [ ] How it works
- [ ] FAQ
- [ ] Footer

## Σημειώσεις για development

- Δεν χρειάζεται build process — απλά static files
- Δουλεύει χωρίς internet (εκτός από Google Fonts που φορτώνουν online)
- Όλο το CSS χρησιμοποιεί CSS variables — εύκολο rebrand
- Το JavaScript είναι vanilla (καμία βιβλιοθήκη)
