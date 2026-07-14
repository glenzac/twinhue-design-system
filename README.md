# TwinHue

**Twin themes, one system** — MorningHue by day, EveningHue by night.

MorningHue (light) + EveningHue (dark) as a drop-in re-skin for **Bootstrap 5.3**
apps. One CSS file, one JS file — stock Bootstrap markup comes out themed, with
dark mode that follows macOS appearance and a manual toggle.

Sibling repos: [morninghue-theme](../morninghue-theme) · [eveninghue-theme](../eveninghue-theme)

## Quick start

```html
<!-- head, before all CSS: anti-flash theme snippet (see SKILL.md) -->
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Lato:wght@300;400;600;700&family=Source+Code+Pro:wght@400;500;600&display=swap" rel="stylesheet">
<link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/css/bootstrap.min.css" rel="stylesheet">
<link rel="stylesheet" href="css/hue.css">
...
<button class="hue-theme-toggle" data-hue-toggle></button>
...
<script src="js/hue-theme.js"></script>
```

Open `docs/demo.html` for the full component gallery.

## Files

| File | Purpose |
|---|---|
| `css/hue.css` | Tokens for both modes + Bootstrap 5.3 overrides + `hue-*` extras |
| `js/hue-theme.js` | Auto/light/dark switcher (`window.HueTheme`), chart-color helpers |
| `tokens.json` | W3C design tokens, both modes, WCAG-annotated |
| `docs/demo.html` | Component gallery with live theme toggle |
| `docs/reference.html` | Light and dark side by side — tokens, all components, charts |
| `SKILL.md` | Claude Code skill — the app-migration playbook |

## How it themes Bootstrap

Bootstrap 5.3 exposes nearly everything as CSS custom properties. `hue.css`:

1. defines `--hue-*` tokens under `:root`/`[data-bs-theme="light"]` (MorningHue)
   and `[data-bs-theme="dark"]` (EveningHue);
2. remaps Bootstrap's root variables (`--bs-body-bg`, `--bs-primary`,
   `*-bg-subtle`, `*-text-emphasis`, …) onto those tokens;
3. re-points per-component variables that Bootstrap bakes in at compile time
   (`.btn-*`, `.dropdown-menu`, `.pagination`, …).

No Sass build, no Bootstrap fork — load it after `bootstrap.min.css`.

## Design decisions

- **Mode-native accents**: light uses MorningHue's Sea Teal `#005F5F`; dark uses
  EveningHue's `#005FAF` blue with Steel Blue links — each mode keeps its
  theme's own identity, matching the iTerm2/VS Code presets.
- **Warm neutrals only**: pure white/black are banned; dark bg is the
  research-backed warm charcoal `#262320`.
- **WCAG-checked**: body text AAA in both modes; secondary text AA
  (dark mode gets a web-only `#A39C90` because the terminal comment gray fails).
- Apps **copy** the two files (version stamp on line 1) so they stay
  self-contained; the source repo is the single place to make changes.

## Versioning

Bump the `vX.Y.Z` stamp in the header of `css/hue.css` and `js/hue-theme.js`
on every change, then re-sync app copies (the skill automates this).
