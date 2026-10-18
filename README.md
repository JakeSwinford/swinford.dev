# swinford.dev

Personal site. SvelteKit on [Vite+](https://viteplus.dev) — Vite 8, Oxlint, Oxfmt and Vitest behind one `vp` CLI.

```sh
npm install
npm run dev      # vp dev
npm run check    # svelte-kit sync, vp check (format, lint, types), svelte-check
npm test         # vp test
npm run build    # vp build
```

Page copy lives in `src/lib/content.ts`.

## The mark

The logo is the Calabi–Yau quintic z₁⁵ + z₂⁵ = 1, after Andrew Hanson's rendering, reduced to a one-ink symbol. `npm run logo` rebuilds it from the surface itself:

1. `src/lib/logo/quintic.ts` meshes the 25 patches and projects them in a three-quarter view, shading each face by its angle to the light.
2. `scripts/logo/silhouette.ts` unions the faces into the outline.
3. `src/lib/logo/screen.ts` engraves the surface as a horizontal line screen — stripes thicken where the surface turns from the light — and `scripts/logo/screen.ts` clips it to the outline.

It writes three cuts to `src/lib/mark.ts` — a fine line screen for display sizes, a coarse one for sizes under 64px, and the solid silhouette — plus the icons in `static/`. Both icons are the coarse screen on a white tile; the favicon redraws it to the pixel grid of a 32px tab, two pixels to a stripe.

The mark also moves. `src/lib/logo/live.ts` re-engraves the surface on a canvas every frame, with the same screen, so the header mark can turn and the light can circle the plate. It loads on demand, starts and ends on the static SVG, and stays still for `prefers-reduced-motion`.
