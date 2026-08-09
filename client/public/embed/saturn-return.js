/* Saturn Return Calculator embed.
 * Usage on any site:
 *   <div id="ps-saturn-return"></div>
 *   <script async src="https://psychic-source-platform.vercel.app/embed/saturn-return.js"></script>
 * Renders directly into the page (Shadow DOM), no iframe. No API calls.
 */
(function () {
  "use strict";

  var SCRIPT_SRC = (document.currentScript && document.currentScript.src) || "";
  var ORIGIN = SCRIPT_SRC ? new URL(SCRIPT_SRC).origin : "https://psychic-source-platform.vercel.app";

  var CTA_URL = "https://www.psychicsource.com/psychic-advice/astrology-readings";
  var CTA_TEXT = "Talk to a psychic astrologer about yours";

  var SIGNS = ["Aries","Taurus","Gemini","Cancer","Leo","Virgo","Libra","Scorpio","Sagittarius","Capricorn","Aquarius","Pisces"];
  var GLYPH = ["♈","♉","♊","♋","♌","♍","♎","♏","♐","♑","♒","♓"];

  var D2R = Math.PI / 180;
  function mod360(x) { return ((x % 360) + 360) % 360; }
  function T_of(ms) { return (ms / 86400000 + 2440587.5 - 2451545.0) / 36525; }
  var EL = {
    emb: { b: [1.00000261,0.01671123,-0.00001531,100.46457166,102.93768193,0], r: [0.00000562,-0.00004392,-0.01294668,35999.37244981,0.32327364,0] },
    sat: { b: [9.53667594,0.05386179,2.48599187,49.95424423,92.59887831,113.66242448], r: [-0.00125060,-0.00050991,0.00193609,1222.49362201,-0.41897216,-0.28867794], aug: [0.00025899,-0.13434469,0.87320147,38.35125] },
  };
  function helio(n, T) {
    var el = EL[n]; var a = el.b[0]+el.r[0]*T, e = el.b[1]+el.r[1]*T, I = (el.b[2]+el.r[2]*T)*D2R, L = el.b[3]+el.r[3]*T, wB = el.b[4]+el.r[4]*T, nd = el.b[5]+el.r[5]*T;
    var M = L - wB; if (el.aug) M += el.aug[0]*T*T + el.aug[1]*Math.cos(el.aug[3]*T*D2R) + el.aug[2]*Math.sin(el.aug[3]*T*D2R);
    M = mod360(M); if (M > 180) M -= 360;
    var w = (wB-nd)*D2R, node = nd*D2R, eS = e/D2R; var E = M + eS*Math.sin(M*D2R);
    for (var i = 0; i < 30; i++) { var dM = M-(E-eS*Math.sin(E*D2R)), dE = dM/(1-e*Math.cos(E*D2R)); E += dE; if (Math.abs(dE) < 1e-9) break; }
    var Er = E*D2R, xp = a*(Math.cos(Er)-e), yp = a*Math.sqrt(1-e*e)*Math.sin(Er);
    var cw = Math.cos(w), sw = Math.sin(w), cn = Math.cos(node), sn = Math.sin(node), ci = Math.cos(I);
    return { x:(cw*cn-sw*sn*ci)*xp+(-sw*cn-cw*sn*ci)*yp, y:(cw*sn+sw*cn*ci)*xp+(-sw*sn+cw*cn*ci)*yp };
  }
  function satLon(ms) { var T = T_of(ms), e = helio("emb", T), s = helio("sat", T); return mod360(mod360(Math.atan2(s.y-e.y, s.x-e.x)/D2R) + (5029.0966*T + 1.11113*T*T)/3600); }
  var DAY = 86400000, YR = 365.25 * DAY;
  function crossings(natal, centerMs) {
    var out = [], step = 5 * DAY, t = centerMs - 520 * DAY, prev = ((satLon(t) - natal + 540) % 360) - 180;
    for (var i = 0; i < 320; i++) {
      var nt = t + step, cur = ((satLon(nt) - natal + 540) % 360) - 180;
      if (Math.abs(prev) < 90 && Math.abs(cur) < 90 && ((prev < 0) !== (cur < 0))) {
        var lo = t, hi = nt;
        for (var b = 0; b < 40; b++) { var mid = (lo + hi) / 2, v = ((satLon(mid) - natal + 540) % 360) - 180; if ((v < 0) === (prev < 0)) lo = mid; else hi = mid; }
        out.push((lo + hi) / 2);
      }
      prev = cur; t = nt;
    }
    return out;
  }
  function returnPeriod(natal, birthMs, k) {
    var c = crossings(natal, birthMs + k * 29.4577 * YR);
    if (!c.length) return null;
    var exact = c[Math.floor((c.length - 1) / 2)];
    return { start: c[0], exact: exact, end: c[c.length - 1], age: Math.floor((exact - birthMs) / YR) };
  }

  var FONT = "'Segoe UI','Helvetica Neue',Helvetica,Arial,sans-serif";
  var GOLD = "#e8a75e";
  var CSS = "" +
    ":host{all:initial;display:block}" +
    "*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}" +
    ".wrap{position:relative;font-family:" + FONT + ";color:#fff;background:#0a0a16 url('" + ORIGIN + "/embed/img/mars/space.jpg') center/cover no-repeat;padding:54px 24px 56px;overflow:hidden;line-height:1.65;text-align:center}" +
    ".inner{position:relative;max-width:800px;margin:0 auto}" +
    ".title{font-family:'Great Vibes',cursive;font-weight:400;font-size:clamp(46px,7vw,74px);color:" + GOLD + ";text-shadow:0 2px 12px rgba(0,0,0,.5);margin-bottom:10px;line-height:1.1}" +
    ".intro{font-size:19px;margin:0 auto 24px;max-width:680px;text-shadow:0 1px 6px rgba(0,0,0,.5)}" +
    ".pickrow{display:flex;gap:12px;justify-content:center;align-items:center;flex-wrap:wrap}" +
    ".lbl{font-weight:700;font-size:19px}" +
    "select{appearance:none;-webkit-appearance:none;padding:13px 38px 13px 16px;font-size:19px;font-family:" + FONT + ";color:#fff;background-color:rgba(16,16,30,.75);border:1.5px solid rgba(255,255,255,.9);border-radius:8px;outline:none;cursor:pointer;background-image:url(\"data:image/svg+xml;charset=utf-8,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='8'%3E%3Cpath d='M1 1l5 5 5-5' stroke='white' stroke-width='1.6' fill='none'/%3E%3C/svg%3E\");background-repeat:no-repeat;background-position:right 14px center}" +
    "select:focus{border-color:#fff;box-shadow:0 0 0 2px rgba(255,255,255,.25)}select option{color:#1c1c2e;background:#fff}" +
    ".actions{text-align:center;margin-top:26px}" +
    ".btn{display:inline-block;font-family:" + FONT + ";font-size:19px;font-weight:600;color:#241505;background:linear-gradient(180deg,#f2b26d," + GOLD + ");border:1.5px solid rgba(255,255,255,.85);border-radius:10px;padding:14px 44px;cursor:pointer;box-shadow:0 4px 16px rgba(0,0,0,.4);transition:transform .15s ease}" +
    ".btn:hover{transform:translateY(-1px)}" +
    ".err{display:none;margin-top:16px;font-size:17px;color:#ffce8a}.err.show{display:block}" +
    ".screen-result{display:none}.screen-result.active{display:block;animation:fadein .6s ease}.screen-form.hidden{display:none}" +
    "@keyframes fadein{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:none}}" +
    ".natal{font-size:20px;margin-bottom:6px}.natal b{color:" + GOLD + "}" +
    ".status{font-family:'Great Vibes',cursive;font-size:clamp(34px,5vw,48px);color:#fff;margin:4px 0 20px;line-height:1.15}" +
    ".returns{display:flex;gap:18px;justify-content:center;flex-wrap:wrap;margin-bottom:22px}" +
    ".ret{flex:0 1 300px;border:1.5px solid " + GOLD + ";border-radius:16px;background:rgba(255,255,255,.05);padding:20px 22px}" +
    ".ret.active-now{background:rgba(232,167,94,.18);box-shadow:0 0 0 2px " + GOLD + " inset}" +
    ".ret .rl{font-size:13px;letter-spacing:1.6px;text-transform:uppercase;opacity:.8}" +
    ".ret .rv{font-size:22px;color:" + GOLD + ";margin:5px 0 3px}" +
    ".ret .rd{font-size:14px;opacity:.8}" +
    ".reading{font-size:18px;max-width:700px;margin:0 auto;text-shadow:0 1px 5px rgba(0,0,0,.4)}" +
    ".cta{display:inline-block;font-family:" + FONT + ";font-size:18px;font-weight:600;color:#241505;text-decoration:none;background:linear-gradient(180deg,#f2b26d," + GOLD + ");border-radius:999px;padding:14px 40px;box-shadow:0 4px 16px rgba(0,0,0,.35);margin-top:22px}" +
    ".retry{display:block;margin:14px auto 0;font-size:17px;font-weight:700;letter-spacing:1px;color:" + GOLD + ";background:none;border:none;cursor:pointer;font-family:" + FONT + "}" +
    "@media(max-width:600px){.wrap{padding:40px 14px 44px}}";

  function option(v, l) { return "<option value=\"" + v + "\">" + l + "</option>"; }
  function fmt(ms) { return new Date(ms).toLocaleDateString(undefined, { month: "long", year: "numeric" }); }
  function fmtFull(ms) { return new Date(ms).toLocaleDateString(undefined, { month: "long", day: "numeric", year: "numeric" }); }

  function buildHtml() {
    var mn = ["January","February","March","April","May","June","July","August","September","October","November","December"];
    var months = "<option value=''>Month</option>"; for (var m = 1; m <= 12; m++) months += option(m, mn[m-1]);
    var days = "<option value=''>Day</option>"; for (var d = 1; d <= 31; d++) days += option(d, d);
    var years = "<option value=''>Year</option>"; var yr = new Date().getFullYear(); for (var y = yr; y >= 1930; y--) years += option(y, y);
    var cta = CTA_URL ? "<a class='cta' href='" + CTA_URL + "'>" + CTA_TEXT + "</a>" : "";
    return "<div class='wrap'><div class='inner'>" +
      "<h2 class='title'>Saturn Return Calculator</h2>" +
      "<div class='screen-form'>" +
      "<p class='intro'>Roughly every 29 years, Saturn returns to where it sat when you were born, marking a milestone of growth, reckoning, and stepping into a new stage of adulthood. Enter your birth date to find yours.</p>" +
      "<div class='pickrow'><span class='lbl'>Birth Date:</span>" +
      "<select data-f='month' aria-label='Month'>" + months + "</select>" +
      "<select data-f='day' aria-label='Day'>" + days + "</select>" +
      "<select data-f='year' aria-label='Year'>" + years + "</select></div>" +
      "<div class='actions'><button class='btn' type='button'>Find My Saturn Return</button></div>" +
      "<div class='err' role='alert'></div>" +
      "</div>" +
      "<div class='screen-result' aria-live='polite'>" +
      "<div class='natal'></div>" +
      "<div class='status'></div>" +
      "<div class='returns'></div>" +
      "<p class='reading'></p>" +
      cta +
      "<button class='retry' type='button'>&#8592; Try Another Date</button>" +
      "</div>" +
      "</div></div>";
  }

  function init(host) {
    if (host.__psSaturnReturn) return; host.__psSaturnReturn = true;
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
    var fields = {}; mount.querySelectorAll("[data-f]").forEach(function (el) { fields[el.getAttribute("data-f")] = el; });
    var err = $(".err"), formScreen = $(".screen-form"), resultScreen = $(".screen-result");

    $(".btn").addEventListener("click", function () {
      err.classList.remove("show");
      var month = +fields.month.value, day = +fields.day.value, year = +fields.year.value;
      if (!month || !day || !year) { err.textContent = "Please select your full birth date."; err.classList.add("show"); return; }
      if (day > new Date(year, month, 0).getDate()) { err.textContent = "That date does not exist. Please check the day and month."; err.classList.add("show"); return; }
      var birthMs = Date.UTC(year, month - 1, day, 12);
      var natal = satLon(birthMs), si = Math.floor(natal / 30);
      var r1 = returnPeriod(natal, birthMs, 1), r2 = returnPeriod(natal, birthMs, 2);
      var now = Date.now();

      $(".natal").innerHTML = "Your natal Saturn is in <b>" + GLYPH[si] + "︎ " + SIGNS[si] + "</b> at " + Math.floor(natal % 30) + "°.";

      var inWhich = 0;
      if (r1 && now >= r1.start && now <= r1.end) inWhich = 1;
      else if (r2 && now >= r2.start && now <= r2.end) inWhich = 2;
      var status;
      if (inWhich) status = "You are in your " + (inWhich === 1 ? "first" : "second") + " Saturn return right now.";
      else if (r1 && now < r1.start) status = "Your first Saturn return is still ahead.";
      else if (r2 && now < r2.start) status = "Your first Saturn return has passed.";
      else status = "Both of your Saturn returns are behind you.";
      $(".status").textContent = status;

      function card(r, label) {
        if (!r) return "";
        var activeNow = (now >= r.start && now <= r.end);
        var range = (new Date(r.start).getFullYear() === new Date(r.end).getFullYear() && r.start === r.end)
          ? fmtFull(r.exact) : fmt(r.start) + " to " + fmt(r.end);
        return "<div class='ret" + (activeNow ? " active-now" : "") + "'><div class='rl'>" + label + "</div>" +
          "<div class='rv'>" + range + "</div><div class='rd'>exact " + fmtFull(r.exact) + " (around age " + r.age + ")</div></div>";
      }
      $(".returns").innerHTML = card(r1, "First Saturn Return") + card(r2, "Second Saturn Return");

      $(".reading").textContent = "A Saturn return is astrology's rite of passage. As Saturn, the planet of structure, responsibility, and hard-earned wisdom, comes back to its birth position, life tends to test what you have built and ask you to grow up in the truest sense. Careers pivot, relationships deepen or dissolve, and you step into who you are really meant to be. It can feel demanding, but it is the universe helping you build a life that actually fits.";

      formScreen.classList.add("hidden"); resultScreen.classList.add("active");
      $(".wrap").scrollIntoView({ behavior: "smooth", block: "start" });
    });
    $(".retry").addEventListener("click", function () {
      fields.month.value = ""; fields.day.value = ""; fields.year.value = ""; err.classList.remove("show");
      resultScreen.classList.remove("active"); formScreen.classList.remove("hidden");
      $(".wrap").scrollIntoView({ behavior: "smooth", block: "start" });
    });
  }
  function boot() { var host = document.getElementById("ps-saturn-return") || document.querySelector("[data-ps-widget='saturn-return']"); if (host) init(host); }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot); else boot();
})();
