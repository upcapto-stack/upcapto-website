# Upcapto website

Marketing site for **Upcapto** - business software on one core. Static, no build
step, no dependencies. Layout modelled on plushvie.in: a **light page** with a
**floating white pill nav** and dark rounded **panels** for the immersive
sections (hero, platform core, impact, CTA), and white cards for products.

Opens with a full-screen **3-beat intro overture** driven by scroll: a particle
**sphere** ("Run your business on one core") morphs into a **cube** ("Built on
one core"), then reforms into a **particle core with orbiting product chips**
("Where every part of your business works together"), and on the 3rd scroll the
dark panel rounds into an inset on the white page while the pill nav slides in.

The intro is rendered in **3D with Three.js (WebGL)** — ~5,400 glowing additive
particles with real perspective depth, morphing between sphere / cube-wireframe /
core keyframes, finished with **UnrealBloomPass post-processing** for a cinematic
glow (the key to the premium look). Three.js (r128) and the bloom modules are
bundled locally under `assets/three.min.js` and `assets/three/` (no build step,
no runtime CDN needed). Bloom is skipped on phones for performance, and if WebGL
or Three is unavailable, or under `prefers-reduced-motion`, the intro falls back
to a static hero frame.

The rest: a bento product grid with a dark Kitty feature tile, tabbed use cases,
count-up impact numbers and a build-status track. Blue accent, navy buttons.

The intro reads scroll position from a rAF loop gated to a visible
IntersectionObserver (no scroll listeners). On phones (< 761px) and under
reduced motion it collapses to a single static hero frame (no pinned scroll).
Fonts: Bricolage Grotesque + Manrope + JetBrains Mono (Google Fonts).

All motion collapses to static under `prefers-reduced-motion`.

## Files

```
upcapto-website/
├── index.html        # the page (structure + content)
├── styles.css        # design system + all styles
├── script.js         # theme toggle, use-case tabs, scroll reveals
└── assets/
    └── favicon.svg
```

## Run locally

It's plain static HTML — open `index.html` in a browser, or serve the folder:

```bash
cd upcapto-website
python3 -m http.server 8000
```

Then visit http://localhost:8000.

## Products on the page

| Product            | What it is                                   | Status      |
|--------------------|----------------------------------------------|-------------|
| OneOS (Opticommerce) | Optical-retail OS: POS, clinic, lab, finance | ~50% built  |
| Ambarion OS        | Restaurant/café OS: POS, KDS, recipe costing | ~80% built  |
| Hind Workforce OS  | HR, attendance, leave, payroll               | Live (~71)  |
| Kitty              | Personal AI across the whole group           | Live        |
| AI Calling Agent   | Specialised business calling agent           | In build    |
| GMB Manager        | Google Business Profile reputation + insights| In build    |
| Market Radar       | Market intelligence for the Indian market    | Scoping     |

## Still to replace

- **Testimonials** — currently anonymous placeholders. Swap in real quotes.
- **Contact** — `hello@upcapto.com`. Update to the real address.
- **Logo** — the brand is set in text (`UPCAPTO`). Drop a real logo in `assets/`
  and swap the `.brand-name` markup if you have one.

## Deploy

Upload the folder to any static host — Netlify, Vercel, Cloudflare Pages,
GitHub Pages, or an S3 bucket. No server or build is required.
