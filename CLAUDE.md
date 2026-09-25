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

The page is split in two:

- **One dated block** carrying `data-promo-until="YYYY-MM-DD"` — the current month's offer. The guard in `public/js/app.js` removes it from the DOM once the date has passed.
- **Five permanent sections** that never expire — what's always included (free travel, no large-vehicle surcharge, fixed VAT-inclusive pricing), fleet discounts (−10/−20/−25 %), referral programme (5 referrals = 1 free Gold Pack), subscriptions (−10 % / −13 %), and the three booking steps.

**To run a new campaign:** replace only the dated `<section>` and the `Offer` object in the JSON-LD. Never touch the `<title>`, the `<h1>` or the permanent sections — the page must stay substantial when no offer is running, otherwise Google demotes it and printed QR codes land on an empty page. Both files carry a header comment restating this.

45 internal links point at the hub: nav (desktop + mobile), promo bar, promo section button, Diamond card label and footer on both homepages, plus the footer of all 38 location pages.

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
