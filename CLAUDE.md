# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
# Development
npm run dev          # Vite dev server
npm run build        # Vite production build
npm run preview      # Preview production build locally

# Generate location pages (run after editing locations.json or the template)
node generate-pages.js   # Regenerates all 38 /services/{cityId}/index.html pages + public/sitemap.xml
```

There is no test suite. Verify changes by running the dev server and inspecting the output HTML.

## Architecture

This is a **multilingual static site** for a Swiss premium car detailing service (Clean Cars Wash, Geneva). It is deployed to GitHub Pages at `clean-cars-wash.ch`.

**Build stack:** Vite 8 + Tailwind CSS 4 (Lightning CSS compiler). No JavaScript framework — all pages are plain HTML.

**Languages:** French (root `/`) and English (`/en/`). Pages use `hreflang` tags pointing to each other. The FR version is canonical (`x-default`).

### Page structure

| Path | Purpose |
|---|---|
| `index.html` | FR homepage — hero, service packages (CHF 96.20 / 161.05 / 312.40 incl. VAT), combos, subscriptions, FAQ, Schema.org |
| `en/index.html` | EN homepage — mirrors FR structure |
| `promos.html` / `en/promos.html` | **Permanent** offers hub — see below |
| `zones.html` / `en/zones.html` | Service areas & travel fees — see below |
| `abonnements.html` / `en/subscriptions.html` | Subscription plans |
| `services/{cityId}/index.html` | 38 auto-generated location SEO pages |
| `mentions-legales.html` / `en/legal-notices.html` | Legal notices |
| `politique-confidentialite.html` / `en/privacy-policy.html` | Privacy policy |
| `404.html` | Branded error page |

### Offers hub (`promos.html` / `en/promos.html`)

**The URL is permanent and must never change** — it is printed on marketing material and accumulates SEO authority campaign after campaign. It replaced a dated `promo.html` on 19.09.2026.

**Offer running: PROMO-OCT-2026.** 20% off **every service except subscriptions**, 1–31 October 2026, limited to the first 100 customers. Scope was widened on 12.10.2026 to include the five specialist services. Still excluded: subscriptions, surcharges (very dirty vehicle, pet hair) and Vaud travel fees — those are transport and restoration costs, not services sold. The deposit stays 30% of the **standard** rate — SumUp is untouched — and the 20% comes off the balance settled on site.

It lives in **14 blocks**: the promo bar on both homepages, the dated block on both offers hubs, and one dated block on each of the 10 specialist-service pages (regenerated from `PROMO` in `generate-prestations.js` — set it to `null` to drop all ten at once). `grep -rn "PROMO-OCT-2026"` finds the hand-written four. Everything expires on its own on 31.10.2026 at midnight (local time), and must be **deleted by hand** as soon as the owner reports the 100 customers reached, since nothing on the site counts them.

No discounted price appears outside those four blocks — not on the pack cards, not in any `meta description`, not in any `Offer` JSON-LD, which all keep the standard rate. That is the direct lesson of September 2026, described below.

The page also stands on its **five permanent sections**, which is what it was designed for: what's always included (travel free in Geneva, no large-vehicle surcharge, fixed VAT-inclusive pricing), fleet discounts (−10/−20/−25 %), referral programme (5 referrals = 1 free Gold Pack), subscriptions (−10 % / −13 %), and the three booking steps.

**To run a new campaign:** insert one dated `<section>` carrying `data-promo-until="YYYY-MM-DD"` just before the "01 All year round" section, and add an `Offer` object to the JSON-LD with the same `priceValidUntil`. The guard in `public/js/app.js` removes the block from the DOM once the date has passed. Never touch the `<title>`, the `<h1>` or the permanent sections — the page must stay substantial when no offer runs, otherwise Google demotes it and printed QR codes land on an empty page.

**`public/js/app.js` must stay null-safe.** It is written for the homepage but is also loaded by `promos.html` and `en/promos.html`, whose header is simplified and has no burger menu. Any unguarded `getElementById(...).something` at top level throws there, and an uncaught top-level error **stops the rest of the file** — including the promo guard, which sits near the end. That bug existed from 19.09 to 08.10.2026: the dated block on the offers hubs would never have expired on its own, while the homepage banner did. Three guards were added (mobile menu, subscription tabs `render()`, scroll progress bar). Before adding any top-level DOM access, check it exists on the secondary pages too. Quick test: on `promos.html`, `typeof window.ccwBookingGo` must be `"function"` — it is declared after the guard, so if it is `undefined` the file died earlier.

**The guard only covers what sits inside the dated block.** In September 2026 the promotional price also appeared outside it — on the Diamond Pack card of both homepages, in the `<meta description>`, and in the homepage `Offer` JSON-LD. Those stayed live for five days after the offer ended, advertising CHF 199 while SumUp still charged a deposit computed on CHF 312.40. A campaign therefore has two kinds of edits: the dated block (self-expiring) and everything else (**manual removal required**). The checklist for ending a campaign is: dated block, promo bar, `meta description`, `Offer` JSON-LD, and any pack card whose price changed — on both FR and EN.

45 internal links point at the hub: nav (desktop + mobile), promo bar, promo section button, Diamond card label and footer on both homepages, plus the footer of all 38 location pages.

### Specialist services (5 pages FR + 5 EN, generated)

Added 12.10.2026. **`prestations.json` is the source of truth, `generate-prestations.js` builds the pages** — same principle as the location pages: editing a produced file is pointless, `npm run build` overwrites it.

| FR | EN | Price |
|---|---|---|
| `ciel-etoile.html` | `en/starlight-headliner.html` | from CHF 499.00 |
| `ppf.html` | `en/ppf.html` | from CHF 999.00 |
| `covering.html` | `en/covering.html` | from CHF 999.00 |
| `polish-ceramique.html` | `en/ceramic-polish.html` | from CHF 999.00 |
| `nettoyage-chassis.html` | `en/chassis-cleaning.html` | CHF 159.90 fixed |

Design choices, not to be undone without reason:

- **No images at all.** The owner supplied poster graphics with the text baked in. They are not used: baked-in text is invisible to Google and to screen readers, and four posters would have cost 600 Kb–1 Mb on the homepage. All the content is HTML. The posters are not in the repo.
- **`app.js` is not loaded.** These pages have no modal and no burger menu. Instead each carries a **247-byte inline guard** at the end of `<body>`, a minimal copy of the dated-promo guard. Without it the dated block would never expire — the exact bug that hit the offers hubs until 08.10.2026.
- **The JSON-LD carries the standard price only**, never the promotional one, and the discounted price exists only inside the dated block.
- These services are **quoted, not booked online** — no SumUp link yet. CTA is phone + WhatsApp. SumUp integration is pending: see `SUMUP-NOUVELLES-PRESTATIONS.md` (untracked working file).

**Where each service can be carried out** (confirmed by the owner 13.10.2026) — stated in a "Lieu" section on every page:

- **Workshop only:** ciel étoilé (the headliner has to come off), PPF and covering (both need a dust-free environment).
- **Workshop or at the customer's:** polish céramique (**closed garage only**, no water point needed) and nettoyage châssis (**private parking + accessible water point**).
- **Polish céramique immobilises the vehicle for a full day minimum.** This is shown as a highlighted warning directly under the price, before the customer commits.

When SumUp is wired up this means **7 services, not 5** — the two with a home option need both variants, like the packs.

**The SumUp duration is not the duration of the work.** Decided 13.10.2026: one single calendar, managed by Ichem; occasional extra staff are not in it. A long job must therefore *not* consume calendar capacity, so the four long services (ciel étoilé, PPF, covering, polish) are declared at **30 minutes — the drop-off appointment**, not the hours of work. Declaring a polish at 8 hours would make SumUp refuse bookings the shop could actually honour, the same family of problem as the "last bookable slot computed backwards from closing time" that closed whole days in September 2026. The trade-off is accepted: SumUp will take three polishes on the same day, and Ichem arbitrates manually. `nettoyage-chassis` keeps its real duration — the car is handed back the same day.

Consequence for the site: wherever a booking button is added to these pages, it must say the slot is a **prise en charge**, otherwise a customer booking at 14:00 expects the car back at 14:30.

Internal linking: a card block (section 05, `#prestations`) on both homepages, footer links on both homepages, and a "Nos prestations spécialisées" block in the location-page template, so all 38 city pages link to the five. 44 pages link to them in total.

### Travel fees (`zones.html` / `en/zones.html`)

Since 25.09.2026 travel is **no longer free everywhere**. Fees are set **per district**, not per commune:

- **Canton of Geneva** — free, all 45 communes.
- **Vaud, orange zone — CHF 39.90 incl. VAT** — districts of Nyon, Morges, Ouest lausannois, Lausanne, Gros-de-Vaud.
- **Vaud, red zone — CHF 59.90 incl. VAT** — Jura–Nord vaudois, Broye–Vully, Lavaux–Oron, Riviera–Pays-d'Enhaut, Aigle.

The fee is added once per trip, is **not** part of the 30 % online deposit, and is settled on site with the balance. SumUp is untouched — the 10 booking links still cover only the service price.

**These amounts are duplicated in nine places.** Changing one means changing all of them, or the site contradicts itself: `zones.html`, `en/zones.html`, article 9 of `mentions-legales.html` and `en/legal-notices.html`, the comparison table + FAQ + booking modal of both homepages, both `promos.html`, the `conditions-title` line in `generate-pages.js`, and — critically — the two map **images** (`assets/images/zone-geneve.webp`, `zone-vaud.webp`), which are flattened artwork and cannot be edited in code. Source JPEGs are kept alongside them.

**Never claim free travel across Vaud.** Wording everywhere is "offert à Genève" / "included in Geneva", never "sur Genève et Vaud". `locations.json` carries no zone data yet: the district→commune mapping for the 21 Vaud cities is still unvalidated, so no city page states its own zone — they link to `zones.html` instead.

Any change to the fees must also bump the "En vigueur au" / "Effective" date at the top of the CGV.

### Programmatic SEO pages

`locations.json` is the source of truth for the 38 location pages. Each entry contains:
- `cityId` — URL slug used as directory name under `/services/`
- `cityName`, `region`, `typology` — display content
- `environmentalPainPoint`, `clienteleType`, `recommendedService` — injected into page body
- `seoIntroSnippet` — used as meta description and intro paragraph
- `localLandmark` — geographic reference for local SEO

Running `node generate-pages.js` reads `locations.json`, writes each page to `services/{cityId}/index.html`, and regenerates `public/sitemap.xml` with all URLs.

The page template lives inside `generate-pages.js` and is the **sole source of truth** for the 38 pages — editing a generated file directly is pointless, `npm run build` runs the generator and overwrites it.

### Styling

- **Tailwind:** pages link `assets/css/tailwind-src.css` directly; Vite compiles it at build time into a hashed `dist/assets/tailwind-src-[hash].css`. There is **no** `tailwind.min.css` — linking one produces a 404 in production (fixed during the 09.2026 SEO audit).
- **Custom components:** `assets/css/style.css` — `.premium-card`, `.cta-devis`, `.gallery-item`, `.hero-lockup`, `.section-index`, `.nav-swap`, `.cta-star`, `.reveal`, gradient buttons
- **Theme colors:** Gold (`#D4AF37` / `#AA8C2C`), Charcoal (`#0a0a0a` → `#1e1e1e`)
- **Fonts:** Inter (body), Montserrat (display headings) — loaded from Google Fonts
- **Motion:** every animation is gated behind a `prefers-reduced-motion` block. Keep it that way.

After editing source CSS, rebuild with `npm run build`.

### SEO & structured data

Each page embeds Schema.org JSON-LD in the `<head>`. The homepage carries `AutoWash` + `LocalBusiness` + `FAQPage` types. Location pages carry `LocalBusiness` with city-specific data. Keep structured data in sync when editing business info (address, phone, hours, prices).

`public/sitemap.xml` is auto-generated by `generate-pages.js` — do not edit it manually. `public/robots.txt` points to it.

**Both files must live in `public/`.** Vite only copies that directory into `dist/`, so a copy at the repo root is never deployed — that was the cause of the sitemap and robots 404s in production. Dead root-level duplicates of `robots.txt`, `sitemap.xml` and `sw.js` are still on disk but untracked; they can be deleted.

### PWA

`manifest.json` is wired up. `public/sw.js` is **not** a functional service worker: it is an unregistration tombstone added 15.09.2026 that clears caches and unregisters itself. It has no `fetch` handler and nothing in the source registers it, so it cannot serve stale content. Delete it after 15.12.2026.
