# KLAXO — public site

The marketing site. Separate from the app on purpose: this is a static export
with no server, no database and no API, so it can sit on any static host while
the app runs wherever it runs.

## Running it

```bash
npm install
npm run dev      # http://localhost:3200
```

The app itself runs separately (port 3101 in development). Every "Sign in" and
"Open KLAXO" link points at it.

## Building

```bash
npm run build    # static files land in out/
```

`out/` is the whole site. Upload it, or point a static host at this directory
with `npm run build` as the build command and `out` as the output directory.

Set `NEXT_PUBLIC_APP_URL` at build time so the sign-in links point at the real
app rather than at localhost:

```bash
NEXT_PUBLIC_APP_URL=https://app.example.com npm run build
```

## Design

"Mineral Rose": a cool periwinkle-grey ground, indigo-charcoal ink, and exactly
one accent — a deep rose — used the same way everywhere. Schibsted Grotesk
carries structure, Newsreader carries running prose. The tokens live at the top
of `src/app/globals.css`; the app uses the same system so the two surfaces feel
like one product.

Motion is deliberately narrow: one easing (`cubic-bezier(.16,1,.3,1)`), one
distance, a fade-and-rise on page change, and the beam in the hero diagram.
Everything respects `prefers-reduced-motion`.

`src/components/AnimatedBeam.tsx` is adapted from Magic UI's `animated-beam`
(21st.dev, @dillionverma).
