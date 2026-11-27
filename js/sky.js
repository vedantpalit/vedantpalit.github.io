/* Time of day for every page, loaded first in <head> so the right theme and
   background are there before the first paint.

   - Theme: light between sunrise and sunset, dark otherwise. Sun times are
     worked out for today at Tübingen (or, for visitors in other time zones,
     roughly from their zone). A manual toggle is saved as themeChoice and
     holds until the next sunrise or sunset.
   - Background: white by day and near-black by night. It tints as the sky
     changes: a dawn sky (navy → plum glow) builds over the last 90 minutes
     before sunrise, a faint peach follows sunrise, a sunset sky
     (lavender → pink → peach) builds over the 90 minutes before sunset, and
     a violet-ink dusk fades out after it. The tint is a fixed, screen-high
     gradient set through --sky-top/--sky-mid/--sky-bot (see css/style.css).
   Pages that only want the theme can load this with data-no-tint. */
(function () {
  const root = document.documentElement;
  const tint = !(document.currentScript && document.currentScript.hasAttribute("data-no-tint"));
  const MIN = 60000, RAMP = 90 * MIN;

  // Where to compute the sun for: Tübingen, or a rough guess from the time zone
  function place() {
    let zone = "";
    try { zone = Intl.DateTimeFormat().resolvedOptions().timeZone; } catch (e) {}
    if (zone === "Europe/Berlin") return { lat: 48.52, lon: 9.06 };
    const y = new Date().getFullYear();
    const std = Math.max(new Date(y, 0, 1).getTimezoneOffset(), new Date(y, 6, 1).getTimezoneOffset());
    return { lat: 45, lon: -std / 4 };
  }

  // Sunrise and sunset (ms) for a local calendar day, NOAA approximation
  function sunTimes(day) {
    const { lat, lon } = place();
    const r = Math.PI / 180;
    const utc0 = Date.UTC(day.getFullYear(), day.getMonth(), day.getDate());
    const n = (utc0 - Date.UTC(day.getFullYear(), 0, 0)) / 864e5;
    const g = 2 * Math.PI / 365 * (n - 1);
    const eqt = 229.18 * (0.000075 + 0.001868 * Math.cos(g) - 0.032077 * Math.sin(g)
      - 0.014615 * Math.cos(2 * g) - 0.040849 * Math.sin(2 * g));
    const decl = 0.006918 - 0.399912 * Math.cos(g) + 0.070257 * Math.sin(g) - 0.006758 * Math.cos(2 * g)
      + 0.000907 * Math.sin(2 * g) - 0.002697 * Math.cos(3 * g) + 0.00148 * Math.sin(3 * g);
    const c = Math.cos(90.833 * r) / (Math.cos(lat * r) * Math.cos(decl)) - Math.tan(lat * r) * Math.tan(decl);
    const ha = Math.acos(Math.max(-1, Math.min(1, c))) / r;
    return {
      rise: utc0 + (720 - 4 * (lon + ha) - eqt) * MIN,
      set: utc0 + (720 - 4 * (lon - ha) - eqt) * MIN
    };
  }

  function clockTheme(now) {
    const s = sunTimes(new Date(now));
    return now >= s.rise && now < s.set ? "light" : "dark";
  }

  // When the clock's theme next changes (used to expire a manual toggle)
  function nextSwitch(now) {
    now = now || Date.now();
    const s = sunTimes(new Date(now));
    if (now < s.rise) return s.rise;
    if (now < s.set) return s.set;
    const t = new Date(now); t.setDate(t.getDate() + 1);
    return sunTimes(t).rise;
  }

  const hex = h => [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16));
  const mix = (a, b, k) => a.map((v, i) => Math.round(v + (b[i] - v) * k));
  // Hex, not rgb(): the blog post reads --bg back as a hex colour to tell light from dark
  const css = c => "#" + c.map(v => v.toString(16).padStart(2, "0")).join("");
  const BASE = { light: hex("#ffffff"), dark: hex("#121517") };
  const SKY = {
    dawn:    ["#0d1326", "#171a31", "#261d31"].map(hex),   // before sunrise, dark theme
    sunrise: ["#fff7f0", "#fff7f0", "#fff7f0"].map(hex),   // after sunrise, light theme
    sunset:  ["#f4e9f7", "#ffe9ee", "#ffeedd"].map(hex),   // before sunset, light theme
    dusk:    ["#16151f", "#16151f", "#16151f"].map(hex)    // after sunset, dark theme
  };

  // Which sky to show, and how strongly (0..1), for a moment in a given theme
  function skyFor(now, theme) {
    const s = sunTimes(new Date(now));
    const ramp = (from, to) => Math.max(0, Math.min(1, (now - from) / (to - from)));
    if (theme === "light") {
      if (now < s.rise || now >= s.set) return null;              // light forced at night: plain
      if (now >= s.set - RAMP) return { sky: SKY.sunset, k: ramp(s.set - RAMP, s.set) };
      if (now < s.rise + RAMP) return { sky: SKY.sunrise, k: 1 - ramp(s.rise, s.rise + RAMP) };
      return null;
    }
    if (now >= s.rise && now < s.set) return null;                // dark forced by day: plain
    if (now < s.rise && now >= s.rise - RAMP) return { sky: SKY.dawn, k: ramp(s.rise - RAMP, s.rise) };
    if (now >= s.set && now < s.set + 2 * RAMP) return { sky: SKY.dusk, k: 1 - ramp(s.set, s.set + 2 * RAMP) };
    return null;
  }

  function paint(now) {
    if (!tint) return;
    const theme = root.getAttribute("data-theme") === "dark" ? "dark" : "light";
    const base = BASE[theme], t = skyFor(now, theme);
    const stops = [0, 1, 2].map(i => t ? mix(base, t.sky[i], t.k) : base);
    root.style.setProperty("--sky-top", css(stops[0]));
    root.style.setProperty("--sky-mid", css(stops[1]));
    root.style.setProperty("--sky-bot", css(stops[2]));
    root.style.setProperty("--bg", css(stops[1]));
    root.style.setProperty("--nav-bg", "rgba(" + stops[0].join(",") + ",0.85)");
  }

  function savedChoice(now) {
    try {
      localStorage.removeItem("theme");   // old permanent choice
      const c = JSON.parse(localStorage.getItem("themeChoice") || "null");
      if (c && now < c.until) return c.theme;
    } catch (e) {}
    return null;
  }

  function update() {
    const now = Date.now();
    const theme = savedChoice(now) || clockTheme(now);
    if (root.getAttribute("data-theme") !== theme) root.setAttribute("data-theme", theme);
    paint(now);
  }

  // Called by the theme toggles: flip, remember until the next sunrise/sunset, repaint
  function toggle() {
    const next = root.getAttribute("data-theme") === "dark" ? "light" : "dark";
    try { localStorage.setItem("themeChoice", JSON.stringify({ theme: next, until: nextSwitch() })); } catch (e) {}
    root.setAttribute("data-theme", next);
    paint(Date.now());
    return next;
  }

  // The current phase for anything that wants to follow the sky (the pixel world):
  // { theme, sky: "dawn" | "sunrise" | "sunset" | "dusk" | null, k: 0..1 }
  function moment(now) {
    const theme = root.getAttribute("data-theme") === "dark" ? "dark" : "light";
    const t = skyFor(now || Date.now(), theme);
    return { theme, sky: t ? Object.keys(SKY).find(n => SKY[n] === t.sky) : null, k: t ? t.k : 0 };
  }

  window.siteSky = { toggle, nextSwitch, update, moment };
  update();
  setInterval(update, 2 * MIN);   // drift the tint, and switch at sunrise/sunset while the page is open
})();
