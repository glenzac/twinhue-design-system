---
name: twinhue-design-system
description: Apply the TwinHue design system (MorningHue light + EveningHue dark) to Bootstrap 5.3 Flask apps. Use when migrating an app to the design system, adding dark mode, fixing theme inconsistencies, styling new pages/components, or choosing chart colors in any of Glen's dashboard apps. Supersedes morninghue-design-system.
---

# TwinHue Design System (MorningHue light / EveningHue dark)

One CSS file that re-skins stock Bootstrap 5.3 into MorningHue (light) and
EveningHue (dark), plus a theme switcher that follows macOS appearance with a
manual override. **Source of truth: `~/scripts/twinhue-design-system`** — never
hand-edit copies inside apps; fix the source, then re-sync.

```
~/scripts/twinhue-design-system/
├── css/hue.css        # tokens (both modes) + Bootstrap overrides + hue-* extras
├── js/hue-theme.js    # auto/light/dark switcher, window.HueTheme, chart helpers
├── tokens.json        # W3C design tokens, both modes
├── docs/demo.html     # component gallery — open it to see everything
├── docs/reference.html# light vs dark side by side — the acceptance reference
└── SKILL.md           # this file
```

## Migrating an app (the standard procedure)

### 1. Verify Bootstrap ≥ 5.3

`grep -rn "bootstrap@" templates/` — must be 5.3+ (dark mode needs
`data-bs-theme`). If older, bump the CDN link to 5.3.2 first and smoke-test.

### 2. Sync the files

Copy (never symlink — apps must stay self-contained):

```bash
cp ~/scripts/twinhue-design-system/css/hue.css   <app>/app/static/css/hue.css
cp ~/scripts/twinhue-design-system/js/hue-theme.js <app>/app/static/js/hue-theme.js
```

The version stamp is the first line of each file (`twinhue-design-system vX.Y.Z`).
When asked to "update the design system" in an app, diff the stamp against the
source and re-copy.

### 3. Wire the base template

In `base.html` (order matters):

```html
<head>
  <!-- FIRST, before any CSS — prevents flash of wrong theme -->
  <script>
    (function(){var s=localStorage.getItem("hue-theme"),d=matchMedia("(prefers-color-scheme: dark)").matches;
    document.documentElement.setAttribute("data-bs-theme",(s==="light"||s==="dark")?s:(d?"dark":"light"));})();
  </script>

  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Lato:wght@300;400;600;700&family=Source+Code+Pro:wght@400;500;600&display=swap" rel="stylesheet">

  <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/css/bootstrap.min.css" rel="stylesheet">
  <link rel="stylesheet" href="{{ url_for('static', filename='css/hue.css') }}">   <!-- AFTER bootstrap -->
  <link rel="stylesheet" href="{{ url_for('static', filename='css/main.css') }}">  <!-- app css last -->
</head>
```

Before `</body>`: `<script src="{{ url_for('static', filename='js/hue-theme.js') }}"></script>`

Add the toggle to the navbar: `<button class="hue-theme-toggle" data-hue-toggle></button>`
(it self-labels and cycles Auto → Light → Dark; choice persists in localStorage).

### 4. Purge conflicting styling — this is where uniformity is won or lost

Go through the app's own CSS and templates and remove everything the design
system now owns. Checklist:

- **Delete the old `static/css/morninghue.css`** and its `<link>` (superseded;
  the only `mh-*` classes ever used were `mh-base`/`mh-brand` — drop/rename them).
- **Hunt hard-coded colors** in app CSS and inline styles:
  `grep -rnE '#[0-9a-fA-F]{3,6}|rgba?\(' app/static/css app/templates`.
  Every hit must become a `var(--hue-*)` token or be deleted in favor of a stock
  Bootstrap class. A hard-coded hex is correct in at most one theme — in the
  other it's a bug.
- **Remove Bootstrap re-theming** in app CSS (`.btn-primary { background: … }`,
  navbar colors, card backgrounds, table stripes…) — `hue.css` owns all of it.
- **Replace `bg-white`, `text-black`, `bg-light` misuse**: pure white/black are
  banned. Cards are just `.card`; page bg comes from `body`.
- **Navbars**: prefer a plain `.navbar` with `style="background: var(--hue-surface)"`
  (or a `bg-body-tertiary` class). Legacy `navbar-dark bg-dark` still renders
  EveningHue-toned, but converge on the surface navbar.
- Keep app CSS strictly for **layout** (grid, spacing, page-specific structure).
  If a rule mentions a color, it probably shouldn't exist.

### 5. Charts (Chart.js / Plotly / ECharts)

Never hard-code chart colors. Use the helpers:

```js
const t = HueTheme.chartTheme();
// t.colors (8 categorical), t.gridColor, t.textColor, t.fontFamily, t.success, t.danger
```

Re-style on theme change (charts don't inherit CSS variables):

```js
document.addEventListener("hue-theme-change", () => {
  const t = HueTheme.chartTheme();
  chart.options.scales.x.grid.color = t.gridColor;   // etc.
  chart.options.color = t.textColor;
  chart.update();
});
```

Gains/losses: `t.success` / `t.danger` (green/red in both modes). For single-series
charts use `--hue-chart-1`.

### 6. Verify (mandatory)

Run the app and check **both modes** (use the toggle) on the main pages:

- No pure-white or default-Bootstrap-blue elements anywhere.
- Toggle to dark: no light "flash" on reload, no unreadable text, no
  light-colored boxes left behind (those are hard-coded colors you missed).
- Modals, dropdowns, toasts, and charts follow the theme.
- Screenshot the dashboard in both modes and eyeball against
  `~/scripts/twinhue-design-system/docs/reference.html` (light/dark side by side —
  the acceptance reference for how every component and chart must look).

## Token quick reference

Semantics, not hexes — the same token resolves per mode:

| Token | Light (MorningHue) | Dark (EveningHue) | Use |
|---|---|---|---|
| `--hue-bg` | `#F1EDE5` | `#262320` | page background |
| `--hue-surface` | `#E8E4DC` | `#2E2B27` | card, panel, navbar |
| `--hue-hover` | `#E4DED6` | `#33302B` | hover, active row |
| `--hue-widget` | `#E4E4E4` | `#3A362F` | popup, tooltip |
| `--hue-border` | `#D0D0D0` | `#3A362F` | borders, dividers |
| `--hue-text` | `#444444` AAA | `#D7D0C5` AAA | all body text |
| `--hue-text-2` | `#6B6560` AA | `#A39C90` AA | secondary text |
| `--hue-text-3` | `#949494` | `#5C564E` | **decorative only — fails WCAG** |
| `--hue-primary` | `#005F5F` teal | `#005FAF` blue | primary FILLS: buttons, pills, progress (mode-native accents by design) |
| `--hue-primary-emphasis` | `#005F5F` | `#93B2E0` | primary as TEXT/outline on bg — in dark, `#005FAF` fails contrast as text; never use `--hue-primary` for text |
| `--hue-link` | `#005F5F` | `#93B2E0` | links |
| `--hue-success` | `#005F00` | `#93C27E` | positive amounts, success |
| `--hue-warning` | `#875F00` | `#D9A854` | pending, attention |
| `--hue-danger` | `#AF0000` | `#EF8073` | negative amounts, errors |
| `--hue-info` | `#005F87` | `#7FC0D8` | informational |
| `--hue-chart-1…8` | vivid syntax hues | pastel accents | categorical charts |

Fonts: `--hue-font-display` (Inter — headings, KPI numbers), `--hue-font-body`
(Lato), `--hue-font-mono` (Source Code Pro — tables/code). Base size 14px.

## Extra components (beyond Bootstrap)

- `.hue-stat` + `.hue-stat-num`/`.hue-stat-label` — KPI blocks
- `.badge badge-soft-{primary,success,warning,danger,info,neutral}` — preferred
  chip style for table statuses (quieter than solid `text-bg-*`)
- `.hue-status hue-status-{ok,warn,error}` — status dot + label
- `.hue-log` with `hue-log-{dim,info,success,warn,error}` spans — log panels
- `.hue-label` — uppercase overline section label
- `.hue-amount-pos` / `.hue-amount-neg` — tabular-nums money coloring

## Rules

**DO**
- Stock Bootstrap markup first; tokens for anything custom; layout-only app CSS.
- Semantic tokens over palette values (`--hue-danger`, not a red hex).
- Test every change in both modes before calling it done.

**DON'T**
- Never `#FFFFFF` / `#000000` backgrounds or text — warm neutrals only.
- Never readable text in `--hue-text-3` — it deliberately fails WCAG.
- Never new accent colors — teal (light) / blue (dark) is the identity.
- Never `data-bs-theme` set anywhere except by the head snippet + `hue-theme.js`.
- Never edit `hue.css`/`hue-theme.js` inside an app — change the source repo,
  bump the version stamp, re-sync every app.
