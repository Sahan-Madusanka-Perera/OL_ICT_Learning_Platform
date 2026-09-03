---
name: O/L ICT Practice — Two State
description: A one-bit desktop; two colours, four dithers, and inversion as the only accent.
colors:
  ink: "#000000"
  paper: "#ffffff"
typography:
  display:
    fontFamily: "Silkscreen, ui-monospace, 'Courier New', monospace"
    fontSize: "48px"
    fontWeight: 400
    lineHeight: 1
    letterSpacing: "0.02em"
  headline:
    fontFamily: "Silkscreen, ui-monospace, 'Courier New', monospace"
    fontSize: "32px"
    fontWeight: 400
    lineHeight: 1.1
    letterSpacing: "0.02em"
  title:
    fontFamily: "Silkscreen, ui-monospace, 'Courier New', monospace"
    fontSize: "24px"
    fontWeight: 400
    lineHeight: 1.2
    letterSpacing: "0.02em"
  label:
    fontFamily: "Silkscreen, ui-monospace, 'Courier New', monospace"
    fontSize: "16px"
    fontWeight: 400
    lineHeight: 1
    letterSpacing: "0.02em"
  question:
    fontFamily: "'Source Sans 3', ui-sans-serif, system-ui, sans-serif"
    fontSize: "17px"
    fontWeight: 400
    lineHeight: 1.6
  option:
    fontFamily: "'Source Sans 3', ui-sans-serif, system-ui, sans-serif"
    fontSize: "16px"
    fontWeight: 400
    lineHeight: 1.5
  body:
    fontFamily: "'Source Sans 3', ui-sans-serif, system-ui, sans-serif"
    fontSize: "15px"
    fontWeight: 400
    lineHeight: 1.55
  fine:
    fontFamily: "'Source Sans 3', ui-sans-serif, system-ui, sans-serif"
    fontSize: "13px"
    fontWeight: 400
    lineHeight: 1.4
rounded:
  none: "0px"
spacing:
  hairline: "1px"
  tile: "4px"
  xs: "6px"
  sm: "8px"
  md: "12px"
  lg: "16px"
  xl: "20px"
  touch: "56px"
components:
  button-primary:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.paper}"
    typography: "{typography.label}"
    rounded: "{rounded.none}"
    padding: "8px 16px"
    height: "56px"
  button-primary-active:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.ink}"
  button-secondary:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.ink}"
    typography: "{typography.label}"
    rounded: "{rounded.none}"
    padding: "8px 16px"
    height: "56px"
  button-secondary-hover:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.paper}"
  button-ghost:
    backgroundColor: "transparent"
    textColor: "{colors.ink}"
    typography: "{typography.label}"
    padding: "6px 8px"
  button-lg:
    height: "64px"
    padding: "12px 24px"
  button-sm:
    height: "44px"
    padding: "6px 12px"
  button-icon:
    height: "56px"
    width: "56px"
    padding: "0"
  window:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.ink}"
    rounded: "{rounded.none}"
    padding: "16px 12px"
  window-titlebar:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.ink}"
    typography: "{typography.label}"
    padding: "8px 12px"
    height: "36px"
  input:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.ink}"
    typography: "{typography.label}"
    rounded: "{rounded.none}"
    padding: "0 12px"
    height: "48px"
  palette-cell:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.ink}"
    typography: "{typography.label}"
    height: "56px"
    width: "56px"
  nav-tab:
    backgroundColor: "transparent"
    textColor: "{colors.ink}"
    typography: "{typography.label}"
    padding: "12px 16px"
  nav-tab-hover:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.paper}"
---

# Design System: O/L ICT Practice

## Overview

**Creative North Star: "The Two-State Desktop"**

Unit 3 of this syllabus is two-state data representation, so the interface is rendered in two states. There are exactly two colours — ink (`#000000`) and paper (`#ffffff`) — and every apparent grey is an ordered dither: real black pixels on white, on a 4×4 tile painted at 4px, 1:1, never scaled. Surfaces are windows: 1px black chrome, a Silkscreen title bar, content on solid white, tiled on a 50% dither desktop. The interface is the curriculum, not a costume.

The build refuses the practice-app dashboard outright: no coloured progress rings, no green ticks, no red crosses. Correctness cannot be a colour here because there is no colour, so every state is carried by pattern and form — marching ants for selection and focus, inversion for the live thing, dither density for confidence and unavailability, dashed chrome for "quieter" and "not measured". What the old system had to promise about not relying on colour is structural here.

Emphasis is inversion, and it is the loudest thing the system owns, so it is rationed to **one inverted element per viewport**. On the dashboard that is START THIS SET; inside the runner it is the primary control while a question is open, handed to the correct option the moment an answer lands. Title bars, nav tabs, and badges are ink on white and stay that way. Density is high and rhythm is tight (12px inline, 16px block, 12px between windows) because the target device is a mid-range Android on mobile data and the student is a tired fifteen-year-old on a bus.

**Key Characteristics:**
- Two colours only; every tone is a 4×4 ordered dither at 1:1
- Zero radius, zero shadow — both Tailwind namespaces reset to `initial`
- Inversion as the only accent, one per viewport
- Silkscreen for chrome and numerals, Source Sans 3 for reading
- Quantities in reserved digit slots that align down a register
- 56px touch floor as the default, not the exception
- Whole-pixel everything: type sizes, icon grids, dither tiles, `steps()` motion

## Colors

There is no palette. There are two values and four densities of one of them.

### Primary
- **Ink** (`#000000`): every stroke, every rule, all chrome, all text, and the ground of the one inverted element per viewport. Also the fill of a set bit, a correct option, a bookmarked control, and a scrollbar thumb.

### Neutral
- **Paper** (`#ffffff`): every reading surface. Window bodies, the ground under prose, the knockout plate behind a disabled label, and the ink colour of anything inverted.

### The Dithers

Not colours — materials. Four densities, all on the same 4×4 tile so density can be cycled without the pattern resizing.

- **12% dither** (`--dither-12`, 2 of 16 on): the finest texture. Unmeasured mastery, disabled chrome, the first frame of the loading cycle.
- **25% dither** (`--dither-25`, 4 of 16 on): disabled fill, secondary ground, a wrong answer's ground, a field in error, a model-question badge, the scrollbar track, an unset bit cell.
- **50% dither** (`--dither-50`, checker): the desktop. Edge to edge on `body`; every window sits on it.
- **75% dither** (`--dither-75`, 12 of 16 on): heavy but short of committed. Its one job in the build is `BitStrip soft` — set by `MasteryBar` when `confidence === 'low'`, so an early estimate is drawn as material that is not yet solid ink.

### Named Rules

**The Two Values Rule.** Tailwind's entire `--color-*` namespace is reset to `initial`; only `ink`, `paper`, `transparent`, and `current` are redefined. A third colour is not a policy here, it is unexpressible — there is no utility that can type it.

**The Never-Scaled Rule.** A dither is always `background-size: 4px 4px` on a whole-pixel grid. A dither at any other scale is a moiré, not a tone.

**The Content-Off-The-Dither Rule.** Long-form reading always happens on solid paper. Where a dither must sit under words — the disabled control — the words get their own paper plate (`button:disabled > .btn-label`, 6px inline padding). Both rules hold only if the ground is dithered and the words are not; neither 25% nor 12% alone survives a 2px Silkscreen stem.

**The One Inversion Rule.** At most one inverted element per viewport, and it marks the live thing: the primary action, the current question, the selected option. Window chrome, navigation, and badges are never inverted — a `live` title bar was built during this session and deleted before ship.

## Typography

**Display / Label Font:** Silkscreen, one weight (400), with `ui-monospace` fallback
**Body Font:** Source Sans 3 (400 / 600), with `ui-sans-serif` fallback

**Character:** A bitmap chrome voice against a humanist reading voice — the same split the source system made between its chrome face and its content face. Silkscreen never gets synthesised bold or italic (`font-synthesis: none`, weight pinned to 400): in a world where emphasis is inversion, a faux-bold would be a second emphasis competing with the only one that means anything.

### Hierarchy
- **Display** (Silkscreen 400, 48px, line-height 1): monumental quantities only — the recommended set's count, the register cells, the session score. This is the size the eye lands on first.
- **Headline** (Silkscreen 400, 32px / 40px on the landing hero only): page titles above `sm`. Steps down to 24px on a phone.
- **Title** (Silkscreen 400, 24px): page headings, the dashboard greeting, mid-weight numerals.
- **Label** (Silkscreen 400, 16px, uppercase, 0.02em): the workhorse. Title bars, micro-labels, badges, buttons, palette cells, nav, keyboard hints, and `::placeholder`. It is also the floor.
- **Question** (Source Sans 3 400, 17px, line-height 1.6): question stems. Never smaller.
- **Option** (Source Sans 3 400, 16px, line-height 1.5): answer options.
- **Body** (Source Sans 3 400, 15px): explanations, descriptions, list rows.
- **Fine** (Source Sans 3 400, 13px): hints, errors, provenance notes.

### Named Rules

**The 16px Floor Rule.** Silkscreen is never set below 16px. Its ladder in this build is 16 / 24 / 32 / 48 — whole-pixel steps only. (The direction record listed 8px; at 8px this face has roughly 4px of cap height and is not readable, so the floor shipped at 16.)

**The Tabular Rule.** `font-variant-numeric: tabular-nums` is on `body`. Every digit in the product is the same width, everywhere, always.

**The Placeholder-Speaks-Chrome Rule.** A placeholder cannot be grey text here, and grey text was always the weakest way to say it. `::placeholder` takes the pixel voice at 14px, uppercase, full-opacity ink; the value speaks in the reading voice. The distinction survives at any contrast setting.

## Layout

Windows on a dithered desktop. The `body` is a 50% dither edge to edge; every surface on top of it is a `Window` — 1px ink chrome, an optional 36px-min title bar with the title left, a note right, and an optional control after it.

**Full-bleed below `sm`, boxed above it.** Windows carry `border-y` always and `sm:border-x`; page containers run `px-0 sm:px-4`. On a 360px phone the window gives the screen its width back and the desktop dither shows only above and below; from `sm` up the window becomes a boxed object floating on the checker.

**Containers.** `max-w-5xl` for student pages and chrome, `max-w-3xl` for the session runner and its palette, `max-w-md` for auth forms. All centred with `mx-auto`.

**Rhythm.** Inline padding 12px (`px-3`), 16px from `sm` up. Window body block padding 16px. 12px between stacked windows and inside most rows; 8px between tight pairs; 4px multiples throughout, because the dither tile is 4px and everything should land on its grid. Register and grid seams are 1px ink gaps (`gap-px bg-ink`), not borders.

**Sticky frames.** The student header is sticky at the top (48px bar plus a tab row) and vanishes entirely inside a session. The runner puts a 64px header at the top and its action bar at the bottom, both sticky, both with `pb-[env(safe-area-inset-bottom)]`. The phone nav is a fixed 64px bottom bar, hidden from `sm` where it becomes a row of window tabs.

### Named Rules

**The One-Screen Rule.** A session owns the whole viewport. Persistent chrome and the bottom nav both return `null` under `/session/`; a student answering a question has exactly one thing in front of them.

**The Wrap-Above-Scroll-Below Rule.** The question palette wraps at `sm:flex-wrap` and scrolls horizontally below it, with the current cell scrolled to centre on change. Full 56px targets and a whole-paper overview only conflict inside a single row.

## Elevation & Depth

**There is no elevation.** `--shadow-*`, `--inset-shadow-*`, and `--drop-shadow-*` are all reset to `initial`; no shadow utility exists. A one-bit raster has no soft edge to cast a shadow onto.

Depth is carried by three things instead: the 1px ink rule (structure), dither density (ground versus surface — a white window on a 50% desktop reads as lifted because it is a different material, not because it is lit), and inversion (the live thing comes forward). A dashed 1px rule is the same line at lower density — it is how this world says "quieter" without reaching for a grey, and it stands in wherever a dithered border would be needed, since a 1px dithered line is not expressible.

### Named Rules

**The Flat Raster Rule.** Nothing casts. If a surface needs to separate from what is behind it, give it chrome or change its ground's density — never a shadow, never a blur, never opacity.

## Shapes

**Zero radius everywhere.** `--radius-*` is reset to `initial`, so a rounded corner cannot be typed either. Every corner in the product is square.

Borders are 1px ink by default. 2px ink means "this one" — the current palette cell, a selected option, a field in error, the runner's advance control. Dashed 1px ink means low-density: an inert option after the answer locks, a disabled control's chrome, an unmeasured strip, a model-question badge, a soft `Rule`.

**Icons are pixels.** The whole icon family is drawn as filled rects on a 12×12 cell grid with `shapeRendering="crispEdges"`, rendered only at whole multiples (12 / 24 / 36), in `currentColor` so an icon inverts with its host. No strokes, no curves, no anti-aliased edge anywhere in the product.

**Motion is `steps()`.** One authored moment: the explanation window opens as a shutter (`window-open`, 240ms `steps(6)`) and the verdict mark lands inside it a beat later (`verdict-land`, 160ms `steps(4)`, 200ms delay) — one gesture in two parts. Marching ants run at 480ms `steps(4)`. Loading is density cycling 12 → 25 → 50 → 25 at 1200ms `steps(1, end)`. Ants and the loading cycle stop entirely under `prefers-reduced-motion: reduce`, and the reveal never starts.

## Components

### Buttons
- **Shape:** square (0 radius), 1px ink chrome, uppercase Silkscreen at 16px, `transition-none`.
- **Primary:** the inversion — ink ground, paper text. This is the viewport's one inverted element; there is at most one on screen.
- **Secondary:** paper ground, ink text, inverts on hover.
- **Ghost:** transparent chrome and ground, inverts on hover.
- **Active:** every variant inverts for the duration of the press, which flips the primary back to paper — the press is always a visible state change.
- **Focus:** `.ant-focus` — marching ants at a 3px outset, only while focus is visible.
- **Disabled:** a 25% dither ground, chrome drops to dashed, and the label sits on its own paper plate (`.btn-label`, 6px inline padding). Never opacity: opacity would manufacture a grey.
- **Sizes:** `sm` 44px (mouse-driven admin chrome only, never a student surface), `md` 56px (default), `lg` 64px, `icon` 56×56.

### Cards / Containers — the Window
- **Corner Style:** square.
- **Border:** 1px ink, `border-y` always, `border-x` from `sm` up.
- **Title bar:** min 36px, 1px ink bottom rule, Silkscreen 16px uppercase truncating title, optional right-aligned note, optional control. **Always ink on paper — never inverted.**
- **Background:** solid paper. Reading never happens on a dither.
- **Internal padding:** 12px inline / 16px block, 16px inline from `sm`.
- **Rule:** `Rule` draws a 1px ink line; `soft` makes it dashed.

### Inputs / Fields
- **Style:** 48px tall, 1px ink chrome, paper ground, square, 16px text, 12px inline padding. Label above in Silkscreen 16px uppercase.
- **Placeholder:** pixel voice, uppercase, 14px, full-opacity ink.
- **Focus:** 2px `currentColor` outline at 2px offset for replaced elements that cannot carry ants.
- **Error:** 25% dither ground plus a doubled ink rule, with a pixel `AlertIcon` and the message at 13px semibold. The error is a change of material, not a change of hue.

### Navigation
- Silkscreen 16px uppercase throughout. The active section is marked by a solid 4px ink edge (bottom on desktop tabs, top on the phone bar) plus `aria-current` — never by inversion, because the viewport's inversion belongs to the action.
- Links and secondary chrome invert on hover (`hover:bg-ink hover:text-paper`), the native behaviour of the source system.
- Mobile: fixed 64px bottom bar, four destinations, icon over label. Desktop: a row of window tabs in the sticky header.

### Badges
- Silkscreen 16px uppercase, 1px chrome, 8px/4px padding, square, with a 12-cell pixel mark. **Past paper:** solid chrome, paper ground, seal mark. **Model / adapted:** dashed chrome, 25% dither ground, pencil mark. Four simultaneous differences — chrome, ground, mark, wording — so an authored question can never be mistaken for an examination question.

### Bit Strips (signature)
A quantity is a field of cells that are on or off, which in a one-bit world is literally the data. 16px tall (12px at `sm`), 1px ink chrome, ink ground showing through as 1px seams between cells.
- **Set cell:** solid ink. **Unset cell:** 25% dither.
- **Soft (`confidence === 'low'`):** set cells fill at 75% dither instead of solid — heavy, but short of committed.
- **`UnmeasuredStrip`:** 12% dither behind dashed chrome, no cells at all.

### The Register (signature)
`Numeral` puts every digit in a fixed-width slot (`0.72em`) whether or not it holds a digit, padded with reserved blanks, so a count of 7 and a count of 148 put their last digit in the same place down a column. Silkscreen at 16 / 24 / 32 / 48px. The dashboard's STANDING window is the canonical case: three cells, 48px numerals, 1px ink seams, each cell inverting on hover. Zeroes are drawn as zeroes — "nothing due" is a measurement.

### Marching Ants
The one device that carries both selection and focus, drawn as an `::after` overlay in `currentColor` so it sits over a dithered or inverted ground without disturbing it and inverts with its host. `.ants` marches always (the selected thing); `.ant-focus` marches only on `:focus-visible`, at a 3px outset. 4px on, 4px off, 480ms `steps(4)`.

## Do's and Don'ts

### Do:
- **Do** build every surface as a `Window`: 1px ink chrome, Silkscreen title bar, content on solid paper.
- **Do** spend the viewport's one inversion on the live thing — the primary action, the current question, the selected option — and hand it over when the live thing changes.
- **Do** keep Silkscreen at 16 / 24 / 32 / 48px and Source Sans 3 for anything longer than a label.
- **Do** carry state with pattern and form: ants for selection and focus, dither density for confidence and unavailability, dashed chrome for quieter, the word alongside every verdict mark.
- **Do** give a disabled control a 25% dither ground, dashed chrome, and a paper plate under its label.
- **Do** distinguish unmeasured (12% dither, dashed) from measured-at-zero (25% empty cells). This is the product's honesty rule rendered, and it must survive every future change.
- **Do** put quantities in reserved digit slots so they align down the column, and draw zeroes as zeroes.
- **Do** hold a 56px minimum on anything a student taps; 44px exists only for mouse-driven admin chrome.
- **Do** let windows go full-bleed below `sm` (`border-y` / `sm:border-x`, containers `px-0 sm:px-4`).
- **Do** invert secondary controls and nav links on hover.
- **Do** time every animation in `steps()` and stop all of it under `prefers-reduced-motion`.

### Don't:
- **Don't** introduce a third value, a gradient, or an opacity that manufactures a grey. Two colours and four dither densities is the whole material set.
- **Don't** round a corner or cast a shadow — the namespaces are reset; there is nothing to reach for.
- **Don't** invert a title bar, a nav item, or a badge. Chrome is not the live thing.
- **Don't** scale a dither. `background-size` is `4px 4px`, always.
- **Don't** set body text on a dither, and don't set a Silkscreen label on one without a paper plate.
- **Don't** synthesise bold or italic on the pixel voice.
- **Don't** draw a bar at zero for something that has not been measured.
- **Don't** carry a verdict on a mark alone; the word ships beside every ✓ and ╳.
- **Don't** import a stroked or rounded icon set. Icons are filled cells on a 12×12 grid at whole multiples.
- **Don't** add decorative pixel art, a fake menu bar, or a trash can. If a pixel is not carrying information, it is not in the design. **BIT is the one character in the build and it earns its pixels the same way everything else does** — see below.

## BIT

The build has exactly one character, and the rule above is why it is shaped the
way it is. A mascot that smiles when you do well is decoration, and decoration
is not permitted here. BIT is a **readout**: its face reports the student's
current run — how many right, or wrong, in a row this session — which is the one
fact about their performance that appears nowhere else on screen. The progress
strip counts answered questions; the numeral counts position; neither says "you
have four in a row".

Every mood is derived from answers the student actually gave. There is no state
BIT can be put into by hand, and no state that means anything other than the run
it is drawn from. `lib/domain/companion.ts` holds that logic with the rest of the
pure code, and its tests assert the negative cases as hard as the arithmetic —
including one that fails if any label ever acquires a praise word.

**It is a status light, not a reaction.** It lives in the session title bar and
is present the whole time; only its expression moves. It is deliberately not
beside the verdict: the feedback panel argues that an overshoot there "would read
as a game congratulating a child", and half the time the verdict is "not quite".
A face that appears at the moment you get something right is a celebration, and
this product does not celebrate.

**It goes quiet in an exam.** Correctness is withheld until submit, so
`isCorrect` arrives as null, there is no run to report, and BIT is not rendered
at all rather than wearing a neutral face it cannot justify.

### Drawing

16×16 grid, filled cells only, `currentColor`, `crispEdges`, rendered at whole
multiples (16 / 32 / 48). Sixteen rather than the icon set's twelve because eyes,
a mouth and a body do not land on whole cells at twelve. The screen's interior is
rows 2-8; eyes sit on rows 3-4 and mouths on 6-7, which keeps a clear row above
and below both — a mouth on row 8 touches the bottom frame and the face reads as
melting into its own stand. For the same reason `streak` widens its eyes rather
than heightening them: row 2 is the last clear row.

Never inverted. The viewport's one inversion belongs to the live thing, and a
status readout is not the live thing.

### The blink

The only unprompted motion in the product: four frames of a 5.2-second cycle,
under 3% of the time. Enough to register as alive in peripheral vision, never
enough to compete with the one authored moment. Two static groups swap
visibility — no geometry is interpolated, so the face is on whole cells at every
frame. `steps(1, end)`, and stopped entirely under `prefers-reduced-motion`, where
the eyes rest open.

## Sound

Off until a student turns it on, and the default is the design rather than
caution. This product's reader is on a bus or in a classroom; an app that makes
a noise on first open is one they get told off for and then mute at the OS,
which costs the feature and some of their trust with it.

It needs no reduced-motion special case, which is the point: the default is
already silence for everyone, so a student asking their system for less sensory
load gets what they asked for without the product inferring anything.

### One-bit audio

There are no audio files. A square wave is a one-bit waveform — the sample is
either up or down — so the sounds are the same claim as the pixels, synthesised
from oscillators at play time. That also costs zero bytes on mobile data for a
feature most students will never switch on.

Pitches come from one pentatonic set, so a tick landing under a verdict cannot
beat against it. Peak gain is 0.05 with a 5ms attack and 20ms release: a gated
square wave pops without an envelope, and at full tilt through a laptop speaker
it is a shriek.

### What a sound is allowed to say

The same rule as everything else — report, do not judge.

**`right` and `wrong` are the same length and the same loudness**, differing
only in pitch, and a test asserts it. A longer, lower or funnier sound for a
wrong answer is the product laughing at a fifteen-year-old; a fanfare for a
right one is the celebration the feedback panel already refuses. `wrong` is a
single note for the same reason: a fall from one pitch to a lower one is the
sad-trombone shape.

`streak` is the one flourish and it is deliberately small — the `right` figure
with one note added, at the same three-in-a-row threshold BIT uses on screen. A
test fails if those two thresholds ever drift, because a streak note arriving
while the companion still reads "2 in a row" is the product contradicting
itself.

**Nothing is ever only a sound.** Every verdict already ships a mark and a word,
so muting loses a student no information at all. That is what makes it safe to
default off.
