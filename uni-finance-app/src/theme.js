// COLORS.ink/line/lineSoft resolve through CSS custom properties (set on the
// app's root element by App.jsx via themeCssVars()) so every component that
// already reads COLORS.ink automatically follows the user's chosen accent —
// no prop-drilling needed.
//
// COLORS.gold/teal/brick are FIXED semantic colors (warning / positive-saved /
// danger) and are never affected by the accent theme, so "saved" always reads
// as green and "over budget" always reads as red regardless of which accent
// the user picks.
export const COLORS = {
  ink: "var(--uf-ink)",
  paper: "#EDEFE7",
  paperDim: "#E2E4DA",
  gold: "#C98A3E",
  teal: "#3F7D6E",
  brick: "#B4483F",
  line: "rgba(var(--uf-ink-rgb),0.14)",
  lineSoft: "rgba(var(--uf-ink-rgb),0.08)",
};

// Accent theme presets (four only). `swatch` is the color shown in the theme
// picker; `ink` is what's used for text/backgrounds/borders app-wide. Any
// previously saved accent that no longer exists falls back to Navy via
// getTheme().
export const THEME_PRESETS = [
  { key: "navy", name: "Navy", swatch: "#16213A", ink: "#16213A" },
  { key: "maroon", name: "Maroon", swatch: "#6E1F2A", ink: "#6E1F2A" },
  { key: "plum", name: "Plum", swatch: "#5A2A5E", ink: "#5A2A5E" },
  { key: "black", name: "Black", swatch: "#121212", ink: "#121212" },
];

export const DEFAULT_ACCENT_KEY = "navy";

export const FONT_VOICE = "'Spectral', Georgia, 'Times New Roman', serif";
export const FONT_MONO = "'IBM Plex Mono', SFMono-Regular, Menlo, Consolas, monospace";
export const FONT_UI = "system-ui, -apple-system, 'Segoe UI', sans-serif";

export function getTheme(key) {
  return THEME_PRESETS.find((t) => t.key === key) || THEME_PRESETS[0];
}

export function hexToRgbTriplet(hex) {
  const h = hex.replace("#", "");
  const r = parseInt(h.substring(0, 2), 16);
  const g = parseInt(h.substring(2, 4), 16);
  const b = parseInt(h.substring(4, 6), 16);
  return `${r},${g},${b}`;
}

// Returns the CSS custom properties to spread onto the app's root element's
// inline `style`. Everything downstream (COLORS.ink/line/lineSoft, and any
// component using them) picks this up automatically via CSS var cascade.
export function themeCssVars(accentKey) {
  const t = getTheme(accentKey);
  return {
    "--uf-ink": t.ink,
    "--uf-ink-rgb": hexToRgbTriplet(t.ink),
  };
}

export function fmt(n) {
  const v = Math.round(n * 100) / 100;
  return v.toLocaleString("en-MY", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}
