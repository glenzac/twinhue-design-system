/*!
 * hue-design-system v1.0.0 (2026-07-14) — theme switcher
 * MorningHue (light) / EveningHue (dark), follows macOS appearance by default.
 *
 * Modes: "auto" (default, follows OS) | "light" | "dark", persisted in
 * localStorage["hue-theme"]. Applies data-bs-theme on <html>.
 *
 * To avoid a flash of wrong theme, ALSO inline this one-liner in <head>
 * BEFORE the stylesheets (it duplicates the apply logic on purpose):
 *
 *   <script>
 *     (function(){var s=localStorage.getItem("hue-theme"),d=matchMedia("(prefers-color-scheme: dark)").matches;
 *     document.documentElement.setAttribute("data-bs-theme",(s==="light"||s==="dark")?s:(d?"dark":"light"));})();
 *   </script>
 *
 * Toggle button: give any element data-hue-toggle. It cycles auto → light →
 * dark → auto and its text/title update automatically.
 *
 * Charts: listen for the "hue-theme-change" event on document and re-read
 * HueTheme.chartColors() / HueTheme.tokens() to restyle.
 */
(function () {
  "use strict";

  var STORAGE_KEY = "hue-theme";
  var media = window.matchMedia("(prefers-color-scheme: dark)");

  function stored() {
    var v = localStorage.getItem(STORAGE_KEY);
    return v === "light" || v === "dark" ? v : "auto";
  }

  function effective(mode) {
    if (mode === "light" || mode === "dark") return mode;
    return media.matches ? "dark" : "light";
  }

  function apply(mode) {
    var eff = effective(mode);
    document.documentElement.setAttribute("data-bs-theme", eff);
    document.dispatchEvent(
      new CustomEvent("hue-theme-change", { detail: { mode: mode, effective: eff } })
    );
    updateToggles(mode, eff);
  }

  var ICONS = { auto: "◐", light: "☀", dark: "☾" };
  var LABELS = { auto: "Auto (OS)", light: "Light", dark: "Dark" };

  function updateToggles(mode, eff) {
    document.querySelectorAll("[data-hue-toggle]").forEach(function (el) {
      el.textContent = ICONS[mode] + " " + LABELS[mode];
      el.title = "Theme: " + LABELS[mode] + " (currently " + eff + "). Click to change.";
      el.setAttribute("aria-label", el.title);
    });
  }

  var HueTheme = {
    /** current mode: "auto" | "light" | "dark" */
    get: stored,
    /** effective rendered theme: "light" | "dark" */
    current: function () { return effective(stored()); },
    set: function (mode) {
      if (mode === "auto") localStorage.removeItem(STORAGE_KEY);
      else localStorage.setItem(STORAGE_KEY, mode);
      apply(mode);
    },
    /** cycle auto → light → dark → auto */
    cycle: function () {
      var order = ["auto", "light", "dark"];
      HueTheme.set(order[(order.indexOf(stored()) + 1) % 3]);
    },
    /** read any CSS custom property from the active theme */
    token: function (name) {
      return getComputedStyle(document.documentElement)
        .getPropertyValue(name).trim();
    },
    /** categorical chart palette for the active theme (8 colors) */
    chartColors: function () {
      var out = [];
      for (var i = 1; i <= 8; i++) out.push(HueTheme.token("--hue-chart-" + i));
      return out;
    },
    /** common chart styling tokens for the active theme */
    chartTheme: function () {
      return {
        colors: HueTheme.chartColors(),
        gridColor: HueTheme.token("--hue-chart-grid"),
        textColor: HueTheme.token("--hue-text-2"),
        fontFamily: HueTheme.token("--hue-font-body") || "Lato, sans-serif",
        success: HueTheme.token("--hue-success"),
        danger: HueTheme.token("--hue-danger")
      };
    }
  };

  media.addEventListener("change", function () {
    if (stored() === "auto") apply("auto");
  });

  document.addEventListener("click", function (e) {
    var el = e.target.closest("[data-hue-toggle]");
    if (el) { e.preventDefault(); HueTheme.cycle(); }
  });

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", function () { apply(stored()); });
  } else {
    apply(stored());
  }

  window.HueTheme = HueTheme;
})();
