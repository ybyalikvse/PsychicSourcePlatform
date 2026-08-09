/* Is Mercury in Retrograde? real-time tracker embed.
 * Usage on any site:
 *   <div id="ps-mercury-retrograde"></div>
 *   <script async src="https://psychic-source-platform.vercel.app/embed/mercury-retrograde.js"></script>
 * Renders directly into the page (Shadow DOM), no iframe. Computes live in
 * the browser (no API calls).
 */
(function () {
  "use strict";

  var SCRIPT_SRC = (document.currentScript && document.currentScript.src) || "";
  var ORIGIN = SCRIPT_SRC ? new URL(SCRIPT_SRC).origin : "https://psychic-source-platform.vercel.app";

  var CTA_URL = "https://www.psychicsource.com/psychic-advice/astrology-readings";
  var CTA_TEXT = "Ask a psychic how to navigate it";

  // ---------- Astronomy ----------
  var D2R = Math.PI / 180;
  function mod360(x) { return ((x % 360) + 360) % 360; }
  function T_of(ms) { return (ms / 86400000 + 2440587.5 - 2451545.0) / 36525; }
  var EL = {
    emb: { b: [1.00000261,0.01671123,-0.00001531,100.46457166,102.93768193,0], r: [0.00000562,-0.00004392,-0.01294668,35999.37244981,0.32327364,0] },
    merc: { b: [0.38709927,0.20563593,7.00497902,252.25032350,77.45779628,48.33076593], r: [0.00000037,0.00001906,-0.00594749,149472.67411175,0.16047689,-0.12534081] },
  };
  function helio(n, T) {
    var el = EL[n];
    var a = el.b[0]+el.r[0]*T, e = el.b[1]+el.r[1]*T, I = (el.b[2]+el.r[2]*T)*D2R, L = el.b[3]+el.r[3]*T, wB = el.b[4]+el.r[4]*T, nd = el.b[5]+el.r[5]*T;
    var M = mod360(L-wB); if (M > 180) M -= 360;
    var w = (wB-nd)*D2R, node = nd*D2R, eS = e/D2R;
    var E = M + eS*Math.sin(M*D2R);
    for (var i = 0; i < 20; i++) { var dM = M-(E-eS*Math.sin(E*D2R)), dE = dM/(1-e*Math.cos(E*D2R)); E += dE; if (Math.abs(dE) < 1e-9) break; }
    var Er = E*D2R, xp = a*(Math.cos(Er)-e), yp = a*Math.sqrt(1-e*e)*Math.sin(Er);
    var cw = Math.cos(w), sw = Math.sin(w), cn = Math.cos(node), sn = Math.sin(node), ci = Math.cos(I);
    return { x:(cw*cn-sw*sn*ci)*xp+(-sw*cn-cw*sn*ci)*yp, y:(cw*sn+sw*cn*ci)*xp+(-sw*sn+cw*cn*ci)*yp };
  }
  function mercLon(ms) {
    var T = T_of(ms), e = helio("emb", T), m = helio("merc", T);
    return mod360(mod360(Math.atan2(m.y-e.y, m.x-e.x)/D2R) + (5029.0966*T + 1.11113*T*T)/3600);
  }
  var HALFDAY = 43200000, DAY = 86400000;
  function isRetro(ms) {
    var a = mercLon(ms - HALFDAY), b = mercLon(ms + HALFDAY);
    return (((b - a + 540) % 360) - 180) < 0;
  }
  // Refine a station (retro-state change) between two times by bisection.
  function refineStation(lo, hi) {
    var sLo = isRetro(lo);
    for (var i = 0; i < 44; i++) { var mid = (lo + hi) / 2; if (isRetro(mid) === sLo) lo = mid; else hi = mid; }
    return (lo + hi) / 2;
  }
  // Find retrograde windows overlapping/after startMs, up to n of them.
  function findWindows(startMs, n) {
    var out = [], t = startMs - 60 * DAY, prev = isRetro(t), spanStart = prev ? t : null;
    for (var i = 0; i < 900 && out.length < n; i++) {
      var next = t + DAY, cur = isRetro(next);
      if (cur && !prev) spanStart = refineStation(t, next);       // enters retro
      else if (!cur && prev) {                                     // exits retro
        var end = refineStation(t, next);
        if (spanStart != null && end >= startMs - 40 * DAY) out.push({ start: spanStart, end: end });
        spanStart = null;
      }
      prev = cur; t = next;
    }
    return out;
  }

  // ---------- Styles ----------
  var FONT = "'Segoe UI','Helvetica Neue',Helvetica,Arial,sans-serif";
  var GOLD = "#eda45f";
  var YESRED = "#e2705a", NOGREEN = "#6fbf8a";

  var CSS = "" +
    ":host{all:initial;display:block}" +
    "*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}" +
    ".wrap{position:relative;font-family:" + FONT + ";color:#fff;" +
    "background-color:#0e1330;background-image:radial-gradient(ellipse 70% 55% at 80% 20%,rgba(120,90,180,.35),transparent 60%)," +
    "radial-gradient(ellipse 65% 55% at 12% 82%,rgba(70,60,150,.4),transparent 65%),linear-gradient(160deg,#141a3a 0%,#0f1330 55%,#0a0d22 100%);" +
    "padding:54px 24px 56px;overflow:hidden;line-height:1.65;text-align:center}" +
    ".stars{position:absolute;inset:0;pointer-events:none}" +
    ".inner{position:relative;max-width:820px;margin:0 auto}" +
    ".title{font-family:'Great Vibes',cursive;font-weight:400;font-size:clamp(44px,7vw,72px);color:" + GOLD + ";text-shadow:0 2px 14px rgba(0,0,0,.5);margin-bottom:6px;line-height:1.1}" +
    ".date{font-size:17px;opacity:.85;margin-bottom:28px}" +
    ".answer{font-family:'Great Vibes',cursive;font-size:clamp(80px,15vw,150px);line-height:1;text-shadow:0 3px 20px rgba(0,0,0,.5)}" +
    ".answer.yes{color:" + YESRED + "}.answer.no{color:" + NOGREEN + "}" +
    ".sub{font-size:22px;margin-top:6px;margin-bottom:24px}" +
    ".window{display:inline-block;border:1.5px solid " + GOLD + ";border-radius:14px;padding:16px 26px;background:rgba(255,255,255,.05);margin-bottom:26px}" +
    ".window .wl{font-size:13px;letter-spacing:1.6px;text-transform:uppercase;opacity:.8}" +
    ".window .wv{font-size:21px;color:" + GOLD + ";margin-top:4px}" +
    ".window .wd{font-size:14px;opacity:.78;margin-top:2px}" +
    ".reading{font-size:18px;max-width:720px;margin:0 auto;text-shadow:0 1px 5px rgba(0,0,0,.5)}" +
    ".upcoming{margin-top:34px}" +
    ".upcoming h3{font-size:14px;letter-spacing:2px;text-transform:uppercase;opacity:.8;margin-bottom:14px}" +
    ".ulist{display:flex;flex-direction:column;gap:8px;max-width:460px;margin:0 auto}" +
    ".uitem{display:flex;justify-content:space-between;gap:12px;border-bottom:1px solid rgba(255,255,255,.14);padding:9px 4px;font-size:16px}" +
    ".uitem span:last-child{opacity:.7}" +
    ".actions{text-align:center;margin-top:30px}" +
    ".cta{display:inline-block;font-family:" + FONT + ";font-size:18px;font-weight:600;color:#241505;text-decoration:none;background:linear-gradient(180deg,#f2b26d," + GOLD + ");border-radius:999px;padding:15px 42px;box-shadow:0 4px 16px rgba(0,0,0,.4)}" +
    ".cta:hover{transform:translateY(-1px)}" +
    "@media(max-width:600px){.wrap{padding:40px 14px 46px}}";

  function starsSvg() {
    var s = "<svg class='stars' viewBox='0 0 1000 600' preserveAspectRatio='xMidYMid slice' xmlns='http://www.w3.org/2000/svg'>", seed = 11;
    function rnd() { seed = (seed * 9301 + 49297) % 233280; return seed / 233280; }
    for (var i = 0; i < 80; i++) s += "<circle cx='" + (rnd()*1000).toFixed(0) + "' cy='" + (rnd()*600).toFixed(0) + "' r='" + (0.4+rnd()*1.4).toFixed(1) + "' fill='#fff' opacity='" + (0.25+rnd()*0.6).toFixed(2) + "'/>";
    return s + "</svg>";
  }

  function fmt(ms) { return new Date(ms).toLocaleDateString(undefined, { month: "long", day: "numeric", year: "numeric" }); }
  function fmtShort(ms) { return new Date(ms).toLocaleDateString(undefined, { month: "short", day: "numeric" }); }
  function daysBetween(a, b) { return Math.round((b - a) / DAY); }

  var READING_RETRO = "Mercury, the planet of communication, travel, and technology, appears to move backward right now. Traditionally this is a time to slow down and double-check: expect crossed wires, delayed plans, and misread messages. It is not a time to panic, but a time to review rather than launch. Back up your files, reread before you send, confirm your travel, and be patient with the misunderstandings that crop up. Old faces and unfinished business often resurface too, which makes it a surprisingly good window for reflection and reconnection.";
  var READING_DIRECT = "Mercury, the planet of communication, travel, and technology, is moving forward normally right now, so the skies are clear for action. This is a green light for launching plans, signing agreements, having important conversations, and moving projects ahead. Make the most of it: Mercury spends roughly a fifth of the year retrograde, so these direct stretches are the time to commit and build momentum before the next review period arrives.";

  function buildHtml() {
    return "<div class='wrap'>" + starsSvg() + "<div class='inner'>" +
      "<h2 class='title'>Is Mercury in Retrograde?</h2>" +
      "<div class='date'></div>" +
      "<div class='answer'></div>" +
      "<div class='sub'></div>" +
      "<div class='window'><div class='wl'></div><div class='wv'></div><div class='wd'></div></div>" +
      "<p class='reading'></p>" +
      "<div class='upcoming'><h3>Mercury Retrograde Periods</h3><div class='ulist'></div></div>" +
      "<div class='actions cta-slot'></div>" +
      "</div></div>";
  }

  function init(host) {
    if (host.__psMercRetro) return; host.__psMercRetro = true;
    if (!document.querySelector("link[data-ps-rsc-font]")) {
      var link = document.createElement("link"); link.rel = "stylesheet";
      link.href = "https://fonts.googleapis.com/css2?family=Great+Vibes&display=swap"; link.setAttribute("data-ps-rsc-font", "1");
      document.head.appendChild(link);
    }
    var root = host.attachShadow ? host.attachShadow({ mode: "open" }) : host;
    var style = document.createElement("style"); style.textContent = CSS;
    var mount = document.createElement("div"); mount.innerHTML = buildHtml();
    root.appendChild(style); root.appendChild(mount);
    var $ = function (s) { return mount.querySelector(s); };

    var now = Date.now();
    var retro = isRetro(now);
    var windows = findWindows(now, 6);

    $(".date").textContent = new Date(now).toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric", year: "numeric" });
    var ans = $(".answer");
    ans.textContent = retro ? "Yes" : "No";
    ans.classList.add(retro ? "yes" : "no");

    // current window (if retro) or next upcoming
    var current = null, next = null;
    for (var i = 0; i < windows.length; i++) {
      if (windows[i].start <= now && now <= windows[i].end) current = windows[i];
      else if (windows[i].start > now && !next) next = windows[i];
    }
    if (retro && current) {
      $(".sub").textContent = "Mercury is retrograde right now.";
      $(".window .wl").textContent = "Ends";
      $(".window .wv").textContent = fmt(current.end);
      $(".window .wd").textContent = "in " + daysBetween(now, current.end) + " days (began " + fmtShort(current.start) + ")";
    } else if (next) {
      $(".sub").textContent = "Mercury is direct and moving forward.";
      $(".window .wl").textContent = "Next Retrograde";
      $(".window .wv").textContent = fmt(next.start) + " to " + fmt(next.end);
      $(".window .wd").textContent = "begins in " + daysBetween(now, next.start) + " days";
    }
    $(".reading").textContent = retro ? READING_RETRO : READING_DIRECT;

    var ul = $(".ulist");
    ul.innerHTML = windows.filter(function (w) { return w.end >= now - 40 * DAY; }).slice(0, 5).map(function (w) {
      var tag = (w.start <= now && now <= w.end) ? "now" : (w.start > now ? "upcoming" : "recent");
      return "<div class='uitem'><span>" + fmtShort(w.start) + " to " + fmt(w.end) + "</span><span>" + tag + "</span></div>";
    }).join("");

    if (CTA_URL) {
      var a = document.createElement("a"); a.className = "cta"; a.href = CTA_URL; a.textContent = CTA_TEXT;
      $(".cta-slot").appendChild(a);
    }
  }

  function boot() {
    var host = document.getElementById("ps-mercury-retrograde") || document.querySelector("[data-ps-widget='mercury-retrograde']");
    if (host) init(host);
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot); else boot();
})();
