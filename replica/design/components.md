# Component specs — YMS landing clone (replica-design)

All values reference tokens (`tokens.json`), never raw hex. Assets are original:
open fonts (Space Grotesk / Manrope / JetBrains Mono, OFL), Lucide icons, our own SVGs.

## Navbar (pill)
- structure: logo lockup | link list (Product ▾, Markets ▾, Insights ▾, Resources ▾, About) | CTA
- tokens: radius md(12), height 64, top offset 24, width min(980px, 100%−48), blur 18px
- states: `dark` (default, surface-dark/85), `on-light` (surface-light/88, text-on-light),
  `on-teal` (teal-deep/92). Swap driven by scroll zone; transition motion.base
- a11y: real <nav aria-label>, links keyboard reachable, focus-visible ring accent 2px
- used on: every screen (S1)

## Button — primary / ghost
- sizes sm 32 / md 40 / lg 48; radius sm 6; font sm/600; padding 0 16
- primary: bg accent, text on-accent; hover brightness 1.06; active translateY(1px)
- ghost: transparent, border border-dark, text-on-dark; hover bg surface-dark
- states: default hover active focus-visible disabled loading(spinner keeps label)
- a11y: real <button>; contrast verified (on-accent/accent = 15.4:1)
- used on: S1 (Contact), S7 (footer CTA)

## Logo lockup
- 28px rounded square (radius 6) + wordmark, display font 16/700 tracking −0.02em
- mark is OUR OWN geometry (yard gate glyph), not traced from the target
- used on: S1, S7

## Grid background layer
- repeating-linear-gradient lines rgba(255,255,255,.065) @ 88px + radial dot overlay .16
- parallax: translateY up to 25% over hero scroll; disabled under prefers-reduced-motion
- used on: S2 hero, S5 closing (teal variant: line rgba(100,220,160,.12))

## Scallop divider (SVG)
- 1440×72 viewBox, two concave bumps at x≈360 and x≈1080, fill = next section bg
- flips direction at light→teal boundary (S5 top)
- used on: S2→S3, S4→S5

## Animated headline (word mask reveal)
- display 64/70 line 70 weight 700, max-width 900, centered
- each word wrapped in overflow-hidden span; inner span translateY(110%)→0,
  stagger 40ms, ease motion.ease, triggered once at viewport 80%
- reduced-motion: words shown immediately
- used on: S3 thesis, S5 closing title (line-mask variant)

## Sticky scroll story
- container pins one viewport; left column 40%: step num (mono xs, muted) + titles stack
  (only active visible; enter opacity/y 28→0 550ms, exit y→−18 350ms)
- right column 60%: viz canvas (grid + stars + scene layers); scenes crossfade 650ms
- progress: floor(scrollProgress × 4) selects step 0..3
- mobile (<768): collapses to stacked cards, no pinning
- used on: S4a–S4d

## Viz scenes (inline SVG, wireframe style)
- stroke cyan-viz at .2–.65 alpha; highlight strokes accent at .4–.9; labels mono 8–11
- Scene 01 truck check-in; Scene 02 lane rack with one highlighted lane;
  Scene 03 rotating/pulsing reticles + scan-line sweep (top 18%→82%, 2.2s);
  Scene 04 open-gate badge (bg accent, text on-accent) + info bar surface
- decorative: aria-hidden, replaced by textual alt summary for SR users
- used on: S4a–S4d

## Progress dots
- 4 dots 8px, active scales 1.4 + accent fill; click smooth-scrolls to step quarter
- hidden outside story zone (opacity transition)
- used on: S4

## Video card
- 16:9 poster (generated locally from our MP4s), play glyph (Lucide), caption sm
- hover: lift shadow.pop, accent ring; click opens native controls inline
- used on: S6

## Footer
- 4 link columns + logo + contact CTA; bg teal-deep, text-on-dark/muted-on-dark
- legal line xs/500 muted
- used on: S7

## Custom cursor
- dot 8px accent (mix-blend difference) + ring 34px accent/45; ring grows to 54 on
  interactive hover; only when pointer:fine AND no reduced-motion; else native cursor
- used on: all (S1 note)
