# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

Personal portfolio for Vincent Waldmann. Static site, no framework, no build step, no
dependency manifest: `index.html` + `css/style.css` + `js/main.js` are shipped as written.
All user-facing copy is in French.

Note: this directory is **not** a git repository.

## Running it

The dev server is declared in `.claude/launch.json` — start it with the Browser pane
(`preview_start` with `{name: "portfolio"}`), never with Bash. It is `python3 -m http.server 4173`.
There is no build, lint or test command.

**The preview aggressively caches `style.css` and `main.js`.** A plain reload — even
`navigate` with `force: true` — will silently keep serving the old file, and injecting a
cache-busted `<script>` copy leaves *duplicate* IIFE instances registered, which produces
very confusing state. The reliable refresh is:

```js
await fetch('css/style.css', {cache: 'reload'}); await fetch('js/main.js', {cache: 'reload'}); location.reload();
```

If a change seems not to apply, verify by comparing `document.styleSheets` rules against a
fresh `fetch()` of the same file before assuming the code is wrong.

## Hero: a fixed design canvas addressed in percentages

`.hero__panel` is a container query context (`container-name: panel`) locked to
`aspect-ratio: 1472 / 599`, the Figma frame size. Every decorative element inside
`.hero__decor` is positioned in **percentages of that frame**, and text sizes use `cqw`.
So when a request is phrased in pixels ("descend la ligne de 10px"), convert against the
design size — **10px ≈ 0.679% horizontally, ≈ 1.669% vertically**. Sticker rotation lives in
each `.sticker-N` rule as `--rot`, not in a `transform`.

To place an element relative to a decorative SVG path (e.g. "put UX at the start of the
arrow"), read the fractional point out of the SVG's own `d`, scale it by the element's
`width:%` and by 1472/599 for the vertical component, then add the element's `left`/`top`.

## Sticker peel interaction (`js/main.js`, first IIFE)

Dragging a sticker must **not move it** — it lifts a corner in 3D and springs back.
JS only writes `--tiltx` / `--tilty` / `--peel-scale`; the composed transform lives entirely
in the `.decor--sticker` rule. Keep it that way: adding a translate in JS breaks the design
intent. `setPointerCapture` is wrapped in try/catch because synthetic drags throw
`NotFoundError`.

## Trail section (`#experiences`) — the scroll-driven topographic map

The most intricate part of the site. `js/main.js`, second IIFE.

**Shape.** A tall `.trail` runway (`height: 1150vh`) with a `position: sticky` stage.
Scroll progress is `-trail.getBoundingClientRect().top / runway`, rAF-throttled.

**The camera is one composed transform** on `.trail__map` (7200×7200, `transform-origin: 0 0`),
read right-to-left: bring the walker's map point to the origin, scale, rotate, then drop it
on screen.

```
translate(cx,cy) rotate(rot) scale(zoom) translate(-here.x,-here.y)
```

Everything else follows from this. **Do not animate anything else per frame** — a single
composited transform is why the section is smooth on touch. `cx`/`cy` are the screen centre
plus a small sine drift so the walker breathes around the middle without ever nearing an edge.

**Heading-up rotation** is sampled either side of the walker, then *unwrapped* across the
atan2 seam (`while (heading - prev > 180) heading -= 360`) or a fast scroll snaps a full turn,
then damped by `ROT_DAMP`. Raising the damping past ~0.4 makes fast scrolling feel swingy — the
current value was tuned down deliberately.

**Labels counter-transform.** Stops sit *inside* the rotating map so they stick to the terrain,
and cancel the camera with `rotate(calc(-1 * var(--rot))) scale(calc(1 / var(--zoom)))`.
`--rot` and `--zoom` are set on `.trail__map` every frame purely as this JS→CSS interface.

**Pacing is non-linear by design.** `costAt(p)` returns scroll cost per unit of route: a base,
plus a grade penalty from the `GRADE` profile ("as if you were climbing"), plus a triangular
dwell well at every stop so the walker nearly halts while the card is readable. It is
integrated once into a cumulative table and inverted by binary search in `progressFor()`.
Raise `DWELL_COST`/`DWELL_W` for longer pauses; both were lowered when a fifth stop was added,
since more stops multiply total runway.

**Scroll range is clamped to the stops.** `START`/`END` come from the first and last
`data-at`, so the section opens already standing at the first waypoint with green route
behind, and ends at the last one with grey dashes continuing past it. Consequence: the raw
route fraction is never 0 or 1 — the HUD readout deliberately shows `scrolled`, not `p`.

**Two stacked paths, identical `d`.** `.trail__track` is the grey dashed route ahead;
`.trail__track-done` is solid green and is revealed with `stroke-dasharray: ${walked} ${total}`.
That trick only works because the walked line is *not* dashed — if you ever make it dashed
again you need a `<mask>` and a separate reveal path.

Adding or moving a stop means editing `data-at` in `index.html`; positions on screen are
computed from `getPointAtLength`, so nothing else needs touching.

`prefers-reduced-motion: reduce` unpins the whole thing into a plain vertical timeline. When
hiding parts of the map there, hide the leaf elements — hiding a container has twice silently
taken `.trail__stops` with it.

## Generated assets

`assets/hero-topo.svg`, `assets/trail-map.svg` and the trail's route `d` attribute are all
**generated by throwaway Python scripts** (numpy / scipy / matplotlib) that were never
committed. Regenerating means rewriting them. Constraints they satisfy, worth preserving:

- `trail-map.svg` is a **seamless periodic 2400px tile** (`gaussian_filter(..., mode="wrap")`
  on every octave, plus a duplicated first row/column) so it can `background-repeat` across
  7200px at ~200 KB instead of one huge unique map. The map is oversized precisely so its
  edges never enter frame.
- Contour strokes must use the site navy (`#22345f` family), matching the background and type.
- The route is a Catmull-Rom spine through hand-placed switchbacks, displaced along the
  **normal** by multi-octave fractal noise and tapered to zero at both ends, to read like a
  real GPS trace rather than a drawn curve. It must not self-intersect, and there is no loop.
- `hero-topo.svg` is animated by the `#topo-wave` SVG filter defined at the top of
  `index.html` (`feTurbulence` + `feDisplacementMap`, SMIL-animated `baseFrequency`).

## Skills

`.claude/skills/` and `.agents/skills/` hold 26 vendored design/animation skills, pinned by
hash in `skills-lock.json`. They are third-party content — do not hand-edit them.
