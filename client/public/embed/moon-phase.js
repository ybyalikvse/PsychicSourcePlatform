/* Moon Phase Today embed.
 * Usage on any site:
 *   <div id="ps-moon-phase"></div>
 *   <script async src="https://psychic-source-platform.vercel.app/embed/moon-phase.js"></script>
 * Renders directly into the page (Shadow DOM), no iframe. Computes the live
 * moon phase in the browser (no API calls).
 */
(function () {
  "use strict";

  var SCRIPT_SRC = (document.currentScript && document.currentScript.src) || "";
  var ORIGIN = SCRIPT_SRC ? new URL(SCRIPT_SRC).origin : "https://psychic-source-platform.vercel.app";

  // Set to a destination URL to show the CTA button.
  var CTA_URL = "https://www.psychicsource.com/our-psychics";
  var CTA_TEXT = "Ask a psychic what the moon means for you";

  var READINGS = {
    "New Moon": "The New Moon is the sky's blank page. With the moon dark and the slate clean, this is the moment for intentions, fresh starts, and quiet planting of seeds you cannot yet see. Whatever you begin now carries the momentum of the whole cycle ahead. Rest, dream, and set your direction; the light will come to meet you.",
    "Waxing Crescent": "A sliver of light returns, and with it, hope. The Waxing Crescent is the tender first growth after the New Moon's intentions, the phase of taking the first real step. Doubts may whisper that it is too soon, but momentum is building. Nurture what you started, protect it from second-guessing, and keep moving toward the light.",
    "First Quarter": "The First Quarter Moon is the phase of decision and push. Half-lit and climbing, it marks the point where intentions meet resistance and commitment is tested. Obstacles that surface now are not stop signs; they are the friction that makes you stronger. Choose, act, and press forward. This is a doer's moon.",
    "Waxing Gibbous": "Almost full, the Waxing Gibbous glows with anticipation. This is the refining phase, the final adjustments before something you have been building comes to fruition. Patience matters now, as does attention to detail. Trust the work you have done, tend the last few things, and prepare to receive what is nearly ripe.",
    "Full Moon": "The Full Moon is illumination at its peak: everything hidden is lit, everything felt is amplified. This is the cycle's culmination, a time of clarity, release, and heightened emotion. What you planted at the New Moon shows its face now. Celebrate what has bloomed, and let go of whatever the light reveals you no longer need.",
    "Waning Gibbous": "After the Full Moon's brilliance comes the Waning Gibbous, the phase of gratitude and sharing. The light is receding, inviting you to give back what you have gained: wisdom, resources, kindness. This is a reflective, generous moon. Digest your recent harvest, tell the truth of what you learned, and begin to release your grip.",
    "Last Quarter": "The Last Quarter Moon is the great exhale. Half-lit and descending, it is the phase of forgiveness, clearing, and letting go of what the cycle has outgrown. Old commitments, grudges, and clutter all feel heavier now and beg to be set down. Release without regret; you are making room for the next new beginning.",
    "Waning Crescent": "The final sliver before darkness, the Waning Crescent is the phase of surrender and rest. Energy is low by design; this is the moon's invitation to retreat, reflect, and heal before the cycle renews. Do not force anything now. Dream, forgive, sleep well, and quietly ready yourself for the fresh page the New Moon will bring.",
  };

  // ---------- Astronomy ----------
  var D2R = Math.PI / 180;
  function mod360(x) { return ((x % 360) + 360) % 360; }
  function T_of(ms) { return (ms / 86400000 + 2440587.5 - 2451545.0) / 36525; }

  function sunLongitude(ms) {
    var T = T_of(ms);
    var L0 = mod360(280.46646 + 36000.76983 * T + 0.0003032 * T * T);
    var M = mod360(357.52911 + 35999.05029 * T - 0.0001537 * T * T) * D2R;
    var C = (1.914602 - 0.004817 * T - 0.000014 * T * T) * Math.sin(M)
      + (0.019993 - 0.000101 * T) * Math.sin(2 * M) + 0.000289 * Math.sin(3 * M);
    return mod360(L0 + C);
  }

  var LTERMS = [
    [0,0,1,0,6288774],[2,0,-1,0,1274027],[2,0,0,0,658314],[0,0,2,0,213618],
    [0,1,0,0,-185116],[0,0,0,2,-114332],[2,0,-2,0,58793],[2,-1,-1,0,57066],
    [2,0,1,0,53322],[2,-1,0,0,45758],[0,1,-1,0,-40923],[1,0,0,0,-34720],
    [0,1,1,0,-30383],[2,0,0,-2,15327],[0,0,1,2,-12528],[0,0,1,-2,10980],
    [4,0,-1,0,10675],[0,0,3,0,10034],[4,0,-2,0,8548],[2,1,-1,0,-7888],
    [2,1,0,0,-6766],[1,0,-1,0,-5163],[1,1,0,0,4987],[2,-1,1,0,4036],
    [2,0,2,0,3994],[4,0,0,0,3861],[2,0,-3,0,3665],[0,1,-2,0,-2689],
    [2,0,-1,2,-2602],[2,-1,-2,0,2390],[1,0,1,0,-2348],[2,-2,0,0,2236],
    [0,1,2,0,-2120],[0,2,0,0,-2069],[2,-2,-1,0,2048],[2,0,1,-2,-1773],
    [2,0,0,2,-1595],[4,-1,-1,0,1215],[0,0,2,2,-1110],[3,0,-1,0,-892],
    [2,1,1,0,-810],[4,-1,-2,0,759],[0,2,-1,0,-713],[2,2,-1,0,-700],
    [2,1,-2,0,691],[2,-1,0,-2,596],[4,0,1,0,549],[0,0,4,0,537],
    [4,-1,0,0,520],[1,0,-2,0,-487]
  ];

  function moonLongitude(ms) {
    var T = T_of(ms);
    var Lp = mod360(218.3164477 + 481267.88123421*T - 0.0015786*T*T + T*T*T/538841 - T*T*T*T/65194000);
    var D = mod360(297.8501921 + 445267.1114034*T - 0.0018819*T*T + T*T*T/545868 - T*T*T*T/113065000);
    var M = mod360(357.5291092 + 35999.0502909*T - 0.0001536*T*T + T*T*T/24490000);
    var Mp = mod360(134.9633964 + 477198.8675055*T + 0.0087414*T*T + T*T*T/69699 - T*T*T*T/14712000);
    var F = mod360(93.2720950 + 483202.0175233*T - 0.0036539*T*T - T*T*T/3526000 + T*T*T*T/863310000);
    var E = 1 - 0.002516*T - 0.0000074*T*T;
    var sum = 0;
    for (var i = 0; i < LTERMS.length; i++) {
      var t = LTERMS[i], c = t[4];
      if (t[1] === 1 || t[1] === -1) c *= E; else if (t[1] === 2 || t[1] === -2) c *= E*E;
      sum += c * Math.sin((t[0]*D + t[1]*M + t[2]*Mp + t[3]*F) * D2R);
    }
    var A1 = mod360(119.75 + 131.849*T), A2 = mod360(53.09 + 479264.290*T);
    sum += 3958*Math.sin(A1*D2R) + 1962*Math.sin((Lp - F)*D2R) + 318*Math.sin(A2*D2R);
    return mod360(Lp + sum/1e6);
  }

  function elongation(ms) { return mod360(moonLongitude(ms) - sunLongitude(ms)); }
  function illumination(ms) { return (1 - Math.cos(elongation(ms) * D2R)) / 2; }

  var SYNODIC = 29.530588853;

  function phaseName(e) {
    if (e < 5 || e >= 355) return "New Moon";
    if (e < 85) return "Waxing Crescent";
    if (e < 95) return "First Quarter";
    if (e < 175) return "Waxing Gibbous";
    if (e < 185) return "Full Moon";
    if (e < 265) return "Waning Gibbous";
    if (e < 275) return "Last Quarter";
    return "Waning Crescent";
  }

  function nextEvent(startMs, targetDeg) {
    var step = 3600000, t = startMs;
    var prev = mod360(elongation(startMs) - targetDeg);
    for (var i = 0; i < 24 * 45; i++) {
      var next = t + step;
      var cur = mod360(elongation(next) - targetDeg);
      if (prev > 180 && cur <= 180 && (360 - prev) < 30) {
        var lo = t, hi = next;
        for (var b = 0; b < 40; b++) {
          var mid = (lo + hi) / 2;
          if (mod360(elongation(mid) - targetDeg) > 180) lo = mid; else hi = mid;
        }
        return (lo + hi) / 2;
      }
      prev = cur; t = next;
    }
    return null;
  }

  // ---------- Moon SVG ----------
  // Draw the lit region of the disc as a single path over a dark disc.
  function litPath(cx, cy, R, illum, waxing) {
    var rx = R * Math.abs(1 - 2 * illum); // terminator ellipse semi-x axis
    var outerSweep = waxing ? 1 : 0;      // lit semicircle side (right if waxing)
    var innerSweep;
    if (waxing) innerSweep = illum < 0.5 ? 0 : 1;
    else innerSweep = illum < 0.5 ? 1 : 0;
    return "M " + cx + " " + (cy - R) +
      " A " + R + " " + R + " 0 0 " + outerSweep + " " + cx + " " + (cy + R) +
      " A " + rx + " " + R + " 0 0 " + innerSweep + " " + cx + " " + (cy - R) + " Z";
  }

  function moonSvg(illum, waxing) {
    var R = 150, cx = 160, cy = 160;
    var craters = ""; // subtle craters, only visible where lit (clipped)
    var cr = [[120,110,20],[210,150,30],[150,215,24],[95,190,13],[225,95,12],[185,235,10],[130,160,9]];
    for (var i = 0; i < cr.length; i++) {
      craters += "<circle cx='" + cr[i][0] + "' cy='" + cr[i][1] + "' r='" + cr[i][2] + "' fill='#c9c6b4' opacity='.55'/>";
    }
    return "<svg viewBox='0 0 320 320' xmlns='http://www.w3.org/2000/svg'>" +
      "<defs>" +
      "<radialGradient id='litg' cx='42%' cy='38%'><stop offset='0%' stop-color='#fbfaf3'/><stop offset='70%' stop-color='#eceadb'/><stop offset='100%' stop-color='#cdcab6'/></radialGradient>" +
      "<clipPath id='litclip'><path d='" + litPath(cx, cy, R, illum, waxing) + "'/></clipPath>" +
      "<filter id='mglow'><feGaussianBlur stdDeviation='6' result='b'/><feMerge><feMergeNode in='b'/><feMergeNode in='SourceGraphic'/></feMerge></filter>" +
      "</defs>" +
      "<circle cx='" + cx + "' cy='" + cy + "' r='" + (R + 6) + "' fill='#f4f0d8' opacity='.10'/>" +
      "<circle cx='" + cx + "' cy='" + cy + "' r='" + R + "' fill='#232a44'/>" +   // dark disc
      "<g clip-path='url(#litclip)' filter='url(#mglow)'>" +
      "<circle cx='" + cx + "' cy='" + cy + "' r='" + R + "' fill='url(#litg)'/>" + craters +
      "</g>" +
      "<circle cx='" + cx + "' cy='" + cy + "' r='" + R + "' fill='none' stroke='rgba(255,255,255,.14)' stroke-width='1.5'/>" +
      "</svg>";
  }

  // ---------- Styles ----------
  var FONT = "'Segoe UI','Helvetica Neue',Helvetica,Arial,sans-serif";
  var GOLD = "#eda45f";

  var CSS = "" +
    ":host{all:initial;display:block}" +
    "*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}" +
    ".wrap{position:relative;font-family:" + FONT + ";color:#fff;" +
    "background-color:#11162e;" +
    "background-image:radial-gradient(ellipse 80% 60% at 78% 22%,rgba(90,110,180,.35),transparent 60%)," +
    "radial-gradient(ellipse 70% 60% at 15% 85%,rgba(60,40,110,.4),transparent 65%)," +
    "linear-gradient(160deg,#161c38 0%,#111530 55%,#0b0e22 100%);" +
    "padding:54px 24px 58px;overflow:hidden;line-height:1.65}" +
    ".stars{position:absolute;inset:0;pointer-events:none}" +
    ".inner{position:relative;max-width:900px;margin:0 auto;text-align:center}" +
    ".title{font-family:'Great Vibes',cursive;font-weight:400;font-size:clamp(46px,7vw,76px);color:" + GOLD + ";" +
    "text-shadow:0 2px 14px rgba(0,0,0,.5);margin-bottom:6px;line-height:1.1}" +
    ".datebar{display:flex;align-items:center;justify-content:center;gap:20px;margin-bottom:26px}" +
    ".navb{width:38px;height:38px;border-radius:50%;border:1.5px solid rgba(255,255,255,.55);background:rgba(255,255,255,.06);" +
    "color:#fff;font-size:18px;cursor:pointer;display:flex;align-items:center;justify-content:center;transition:background .15s ease}" +
    ".navb:hover{background:rgba(255,255,255,.16)}" +
    ".date{font-size:19px;letter-spacing:.5px;min-width:230px}" +
    ".moon{width:300px;max-width:74vw;margin:6px auto 4px;filter:drop-shadow(0 8px 30px rgba(0,0,0,.5))}" +
    ".pname{font-family:'Great Vibes',cursive;font-size:clamp(40px,6vw,60px);color:#fff;text-shadow:0 2px 12px rgba(0,0,0,.5);margin-top:6px}" +
    ".stats{display:flex;justify-content:center;gap:38px;flex-wrap:wrap;margin:20px auto 30px}" +
    ".stat{min-width:120px}" +
    ".stat .v{font-size:30px;font-weight:600;color:" + GOLD + "}" +
    ".stat .l{font-size:13px;letter-spacing:1.5px;text-transform:uppercase;opacity:.8;margin-top:2px}" +
    ".reading{font-size:18.5px;max-width:760px;margin:0 auto;text-shadow:0 1px 5px rgba(0,0,0,.5)}" +
    ".nextrow{display:flex;justify-content:center;gap:16px;flex-wrap:wrap;margin-top:30px}" +
    ".nextcard{flex:0 1 240px;border:1px solid rgba(255,255,255,.35);border-radius:12px;padding:16px 18px;background:rgba(255,255,255,.04)}" +
    ".nextcard .nl{font-size:13px;letter-spacing:1.5px;text-transform:uppercase;opacity:.8}" +
    ".nextcard .nv{font-size:19px;color:" + GOLD + ";margin-top:4px}" +
    ".nextcard .nd{font-size:14px;opacity:.75;margin-top:2px}" +
    ".actions{text-align:center;margin-top:32px}" +
    ".cta{display:inline-block;font-family:" + FONT + ";font-size:18px;font-weight:600;color:#241505;text-decoration:none;" +
    "background:linear-gradient(180deg,#f2b26d," + GOLD + ");border-radius:999px;padding:15px 42px;box-shadow:0 4px 16px rgba(0,0,0,.4)}" +
    ".cta:hover{transform:translateY(-1px)}" +
    "@media(max-width:640px){.stats{gap:22px}.date{min-width:0}.wrap{padding:40px 14px 46px}}";

  function starsSvg() {
    var s = "<svg class='stars' viewBox='0 0 1000 600' preserveAspectRatio='xMidYMid slice' xmlns='http://www.w3.org/2000/svg'>";
    var seed = 20;
    function rnd() { seed = (seed * 9301 + 49297) % 233280; return seed / 233280; }
    for (var i = 0; i < 90; i++) {
      var x = (rnd() * 1000).toFixed(0), y = (rnd() * 600).toFixed(0), r = (0.4 + rnd() * 1.4).toFixed(1), o = (0.25 + rnd() * 0.6).toFixed(2);
      s += "<circle cx='" + x + "' cy='" + y + "' r='" + r + "' fill='#fff' opacity='" + o + "'/>";
    }
    return s + "</svg>";
  }

  function fmtDate(ms) {
    return new Date(ms).toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric", year: "numeric" });
  }
  function fmtShort(ms) {
    return new Date(ms).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
  }

  function buildHtml() {
    return "<div class='wrap'>" + starsSvg() + "<div class='inner'>" +
      "<h2 class='title'>Moon Phase Today</h2>" +
      "<div class='datebar'>" +
      "<button class='navb prev' type='button' aria-label='Previous day'>&#8249;</button>" +
      "<div class='date'></div>" +
      "<button class='navb next' type='button' aria-label='Next day'>&#8250;</button>" +
      "</div>" +
      "<div class='moon'></div>" +
      "<div class='pname'></div>" +
      "<div class='stats'>" +
      "<div class='stat'><div class='v' data-s='illum'></div><div class='l'>Illuminated</div></div>" +
      "<div class='stat'><div class='v' data-s='age'></div><div class='l'>Moon Age</div></div>" +
      "</div>" +
      "<p class='reading'></p>" +
      "<div class='nextrow'>" +
      "<div class='nextcard'><div class='nl'>Next New Moon</div><div class='nv' data-n='new'></div><div class='nd' data-nd='new'></div></div>" +
      "<div class='nextcard'><div class='nl'>Next Full Moon</div><div class='nv' data-n='full'></div><div class='nd' data-nd='full'></div></div>" +
      "</div>" +
      "<div class='actions cta-slot'></div>" +
      "</div></div>";
  }

  function init(host) {
    if (host.__psMoonPhase) return;
    host.__psMoonPhase = true;

    if (!document.querySelector("link[data-ps-rsc-font]")) {
      var link = document.createElement("link");
      link.rel = "stylesheet";
      link.href = "https://fonts.googleapis.com/css2?family=Great+Vibes&display=swap";
      link.setAttribute("data-ps-rsc-font", "1");
      document.head.appendChild(link);
    }

    var root = host.attachShadow ? host.attachShadow({ mode: "open" }) : host;
    var style = document.createElement("style");
    style.textContent = CSS;
    var mount = document.createElement("div");
    mount.innerHTML = buildHtml();
    root.appendChild(style);
    root.appendChild(mount);
    var $ = function (s) { return mount.querySelector(s); };

    var today0 = Date.now();
    var viewMs = today0;

    function render() {
      var e = elongation(viewMs);
      var illum = illumination(viewMs);
      var name = phaseName(e);
      var waxing = e < 180;
      var age = (e / 360) * SYNODIC;

      $(".date").textContent = fmtDate(viewMs);
      $(".moon").innerHTML = moonSvg(illum, waxing);
      $(".pname").textContent = name;
      mount.querySelector("[data-s='illum']").textContent = Math.round(illum * 100) + "%";
      mount.querySelector("[data-s='age']").textContent = age.toFixed(1) + " days";
      $(".reading").textContent = READINGS[name];

      var nn = nextEvent(viewMs, 0), nf = nextEvent(viewMs, 180);
      mount.querySelector("[data-n='new']").textContent = nn ? fmtShort(nn) : "";
      mount.querySelector("[data-nd='new']").textContent = nn ? daysAway(nn) : "";
      mount.querySelector("[data-n='full']").textContent = nf ? fmtShort(nf) : "";
      mount.querySelector("[data-nd='full']").textContent = nf ? daysAway(nf) : "";
    }

    function daysAway(ms) {
      var d = Math.round((ms - viewMs) / 86400000);
      return d <= 0 ? "today" : "in " + d + (d === 1 ? " day" : " days");
    }

    $(".prev").addEventListener("click", function () { viewMs -= 86400000; render(); });
    $(".next").addEventListener("click", function () { viewMs += 86400000; render(); });

    if (CTA_URL) {
      var a = document.createElement("a");
      a.className = "cta"; a.href = CTA_URL; a.textContent = CTA_TEXT;
      $(".cta-slot").appendChild(a);
    }

    render();
  }

  function boot() {
    var host = document.getElementById("ps-moon-phase") || document.querySelector("[data-ps-widget='moon-phase']");
    if (host) init(host);
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
  else boot();
})();
