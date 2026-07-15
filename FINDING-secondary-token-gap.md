# Finding: `--bs-secondary-rgb` is never remapped — `.bg-secondary` escapes the theme

**Status:** fixed in v1.1.5 (2026-07-15) — see `css/hue.css`. Audit also found
and fixed three siblings of the same bug (never-remapped `-rgb` companions):
`--bs-secondary-bg-rgb` (`.bg-body-secondary`), `--bs-tertiary-bg-rgb`
(`.bg-body-tertiary`), and `--bs-emphasis-color-rgb` (table stripe/hover/active
tint, `.navbar-color` opacity) — all previously fell through to stock
Bootstrap black/white/grey in both modes. `--bs-link-color-rgb`,
`--bs-link-hover-color-rgb`, `--bs-body-*-rgb`, and `--bs-secondary/tertiary
-color-rgb` were also given proper `--hue-*-rgb` token backing (they worked
before via hand-maintained literals, now derived to remove drift risk).
**Found in:** finance-dashboard, 2026-07-15, while verifying the v1.1.4 sync
**Affects:** `css/hue.css` — would ship as v1.1.5, re-sync every app
**Severity:** AA failure on `.badge.bg-secondary` + `.text-bg-secondary`; off-brand
stock-Bootstrap grey leaking into both modes on every `.bg-secondary` surface
**Regression:** yes — v1.1.4 made `badge bg-secondary` worse (see below)

---

## Summary

`--bs-secondary-rgb` is the **only** one of the six Bootstrap theme colours that
`hue.css` never remaps:

| var | `--bs-{name}` | `--bs-{name}-rgb` |
| --- | --- | --- |
| primary | `var(--hue-primary)` | `var(--hue-primary-rgb)` |
| **secondary** | `var(--hue-text-2)` (line 174) | **missing** |
| success | `var(--hue-success)` | `var(--hue-success-rgb)` |
| danger | `var(--hue-danger)` | `var(--hue-danger-rgb)` |
| warning | `var(--hue-warning)` | `var(--hue-warning-rgb)` |
| info | `var(--hue-info)` | `var(--hue-info-rgb)` |

Bootstrap's fill utilities read the **`-rgb`** form, not the base form:

```css
.bg-secondary { background-color: rgba(var(--bs-secondary-rgb), var(--bs-bg-opacity)) !important; }
```

So `--bs-secondary: var(--hue-text-2)` themes `.btn-secondary` and friends, while
`.bg-secondary` silently keeps Bootstrap's stock `#6c757d`. Measured in Chrome
against v1.1.4 — **identical in both modes**, i.e. it never theme-switches at all:

```
light  badge bg-secondary   bg=rgb(108,117,125)   ← stock #6c757d
dark   badge bg-secondary   bg=rgb(108,117,125)   ← stock #6c757d
```

This is almost certainly why the line was omitted rather than an oversight of
intent: **there is no `--hue-text-2-rgb` companion token to point it at.** The
other five all have one (`--hue-warning-rgb: 135, 95, 0`, etc.). The fix
therefore needs a new token, not just a new line.

## The v1.1.4 regression

v1.1.4's guard assumes *the fill is a themed token that flips lightness between
modes, so the text must flip with it*. For secondary that premise is **false** —
the fill is stock grey in both modes. So the guard pairs a non-flipping mid-grey
with a flipping text colour, and dark mode puts near-black `#262320` on `#6c757d`:

| `badge bg-secondary` | light | dark |
| --- | --- | --- |
| v1.1.3 (Bootstrap's flat white default) | 4.69 ✓ | 4.69 ✓ |
| v1.1.4 (guard) | **4.04 ✗** | **3.33 ✗** |

Bootstrap's flat white was accidentally the better answer here, precisely because
the background it sits on is also flat. finance-dashboard has 29 `badge
bg-secondary` call sites, all currently failing AA.

Note this is **not new breakage in kind** — `.text-bg-secondary` measures the same
4.04 / 3.33 on v1.1.3 and v1.1.4 alike, because `hue.css:762-763` already paired
secondary this way. v1.1.4 mirrored that existing pairing faithfully onto
`.badge.bg-secondary`; the underlying bug is older than the guard. What v1.1.4
changed is blast radius: from `.text-bg-secondary` (rare) to `.bg-secondary`
(common).

## Root cause

Two half-measures that don't meet:

1. `--bs-secondary` is remapped to a **foreground** token (`--hue-text-2`, a
   muted *text* colour) — the same category error the v1.1.4 finding documented
   for `--hue-warning`.
2. `--bs-secondary-rgb` isn't remapped at all, so the actual fill never changes.

The result: `.text-secondary` is themed but `.bg-secondary` is not. Two utilities
named for the same colour resolve to different colours.

## Proposed change (`css/hue.css`)

Add the missing companion token in both mode blocks, then wire it up.

Light `:root` (next to `--hue-text-2: #6b6560`, ~line 24):
```css
--hue-text-2-rgb: 107, 101, 96;
```

Dark block (next to `--hue-text-2: #a39c90`, ~line 92):
```css
--hue-text-2-rgb: 163, 156, 144;
```

Bootstrap bridge (next to `--bs-secondary: var(--hue-text-2)`, line 174):
```css
--bs-secondary-rgb: var(--hue-text-2-rgb);
```

### Verified result

Measured in headless Chrome, Bootstrap 5.3.3 + v1.1.4 + the patch above:

| | light | dark |
| --- | --- | --- |
| `badge bg-secondary` | 4.04 → **4.95 ✓** | 3.33 → **5.74 ✓** |
| `badge text-bg-secondary` | 4.04 → **4.95 ✓** | 3.33 → **5.74 ✓** |

`.bg-secondary` now flips lightness with the theme (`#6b6560` light →
`#a39c90` dark), which makes the v1.1.4 guard's premise **true** for secondary.
No change to the guard is needed — this fixes it at the source, and
`.text-bg-secondary`'s pre-existing failure is fixed as a side effect.

### Blast radius

`--bs-secondary-rgb` is read by `.bg-secondary`, `.text-bg-secondary`,
`.border-secondary`, and `.link-secondary`. Surveyed in finance-dashboard:

- **29 ×** `badge bg-secondary` — all move 4.04/3.33 → 4.95/5.74. Improvement.
- **2 ×** `vr bg-secondary` dividers — light `#6c757d`→`#6b6560` (imperceptible);
  dark `#6c757d`→`#a39c90` (lighter, more visible on charcoal). Improvement.
- **1 ×** `card-header bg-secondary` — unaffected; the
  `.card-header[class*="bg-"]` block already overrides the background.
- **3 ×** `border-secondary` — becomes theme-aware rather than stock grey.
- **0 ×** `link-secondary`.

Low risk in this app. Worth a look in any app leaning on `.bg-secondary` for
large surfaces, since those move from stock grey to a warm neutral.

## Alternatives considered and rejected

- **Drop `.badge.bg-secondary` from the v1.1.4 guard** — returns to Bootstrap's
  white (4.69 both modes, passes). One-line retreat, but leaves `.bg-secondary`
  as un-themed stock grey and leaves `.text-bg-secondary` failing. Treats the
  symptom.
- **Pin `.badge.bg-secondary { color: #fff }` in both modes** — honest about
  secondary not being a flipping token, but entrenches the inconsistency where
  `.text-secondary` is themed and `.bg-secondary` isn't. Also `#FFFFFF` is a
  DON'T.

## Open question

Is `--hue-text-2` the right thing for `--bs-secondary` to mean at all? It is
defined as *secondary text*, and it is being used as a *fill*. It happens to work
(both modes clear AA once the `-rgb` lands), but a purpose-built neutral-fill
token would say what it means. Out of scope here — flagging because the same
foreground-token-used-as-fill pattern is what caused the v1.1.4 finding.

## Verification

Contrast ratios are WCAG 2.1 relative luminance, computed on
`getComputedStyle()` output in headless Chrome against Bootstrap 5.3.3 +
`css/hue.css` v1.1.4. After applying, check in **both** modes:
- `badge bg-secondary` and `badge text-bg-secondary` on a plain surface
- `vr bg-secondary` dividers remain visible on `--hue-bg` in dark
- `card-header bg-secondary` still renders as the quiet tint (unchanged)
