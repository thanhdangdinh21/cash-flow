/* global localStorage, document */
// Pre-paint settings init — keep in sync with components/ui-settings.tsx.
// Loaded via <script async blocking="render"> so React 19 treats it as a
// hoistable script (no dev warning) while browsers still run it before paint.
try {
  var s = JSON.parse(localStorage.getItem("mf-ui") || "{}");
  document.documentElement.setAttribute("data-theme", s.theme === "dark" ? "dark" : "light");
  document.documentElement.setAttribute("data-density", s.density === "compact" ? "compact" : "comfortable");
  document.documentElement.setAttribute("data-hints", s.showKeyHints === false ? "off" : "on");
} catch {
  /* corrupted storage — CSS defaults apply */
}
