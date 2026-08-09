/* The Big 3 (Sun, Moon & Rising) Calculator embed.
 * Usage on any site:
 *   <div id="ps-big-three"></div>
 *   <script async src="https://psychic-source-platform.vercel.app/embed/big-three.js"></script>
 * Renders directly into the page (Shadow DOM), no iframe.
 * City search data derived from GeoNames.org, licensed CC BY 4.0.
 */
(function () {
  "use strict";

  var SCRIPT_SRC = (document.currentScript && document.currentScript.src) || "";
  var ORIGIN = SCRIPT_SRC ? new URL(SCRIPT_SRC).origin : "https://psychic-source-platform.vercel.app";

  var CTA_URL = "https://www.psychicsource.com/psychic-advice/astrology-readings";
  var CTA_TEXT = "Get your full chart read by a psychic astrologer";

  var SIGNS = ["Aries", "Taurus", "Gemini", "Cancer", "Leo", "Virgo",
    "Libra", "Scorpio", "Sagittarius", "Capricorn", "Aquarius", "Pisces"];

  // One line per sign for each of the Big 3 dimensions.
  var SUN = {
    Aries: "a bold, pioneering core that is happiest leading and starting new things.",
    Taurus: "a steady, grounded core that craves security, comfort, and things that last.",
    Gemini: "a curious, quick-witted core driven by ideas, variety, and communication.",
    Cancer: "a nurturing, sensitive core that leads with feeling and protects what it loves.",
    Leo: "a warm, radiant core that is built to create, express, and shine.",
    Virgo: "a precise, helpful core that finds meaning in improving and being of service.",
    Libra: "a harmonious, relational core that seeks balance, beauty, and partnership.",
    Scorpio: "an intense, deep core drawn to truth, transformation, and real intimacy.",
    Sagittarius: "an adventurous, optimistic core hungry for freedom, meaning, and the next horizon.",
    Capricorn: "an ambitious, disciplined core that builds lasting achievement step by step.",
    Aquarius: "an original, independent core that thinks ahead and lives by its own ideals.",
    Pisces: "a compassionate, dreamy core tuned to imagination, empathy, and the unseen.",
  };
  var MOON = {
    Aries: "you feel fast and fiery, needing action and independence to process emotion.",
    Taurus: "you feel calm and steady, soothed by comfort, routine, and physical security.",
    Gemini: "you process feelings through words and need to talk things out to feel settled.",
    Cancer: "your emotions run deep and tidal; home and close bonds are where you recharge.",
    Leo: "your heart is warm and expressive, and you need appreciation to feel secure.",
    Virgo: "you feel safest when life is orderly and you can be useful to those you love.",
    Libra: "your inner world craves harmony, and conflict unsettles you more than most.",
    Scorpio: "you feel everything intensely and privately, trusting slowly but completely.",
    Sagittarius: "your heart needs freedom and optimism, and you heal by moving forward.",
    Capricorn: "you keep emotions composed and show love through loyalty and quiet reliability.",
    Aquarius: "you understand feelings from a little distance and need space to feel free.",
    Pisces: "you are deeply empathic and absorb the moods around you like water.",
  };
  var RISING = {
    Aries: "you come across as direct, energetic, and ready to take the lead.",
    Taurus: "you come across as calm, warm, and reassuringly steady.",
    Gemini: "you come across as quick, chatty, and endlessly curious.",
    Cancer: "you come across as gentle, caring, and quietly protective.",
    Leo: "you come across as confident, warm, and impossible to overlook.",
    Virgo: "you come across as composed, capable, and quietly observant.",
    Libra: "you come across as charming, graceful, and easy to be around.",
    Scorpio: "you come across as magnetic, composed, and a little mysterious.",
    Sagittarius: "you come across as open, adventurous, and refreshingly honest.",
    Capricorn: "you come across as mature, competent, and quietly authoritative.",
    Aquarius: "you come across as original, independent, and intriguingly different.",
    Pisces: "you come across as gentle, dreamy, and deeply intuitive.",
  };

  // ---------- Astronomy ----------
  function tzOffsetMs(tz, utcMs) {
    var dtf = new Intl.DateTimeFormat("en-US", { timeZone: tz, year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false });
    var p = {}; dtf.formatToParts(new Date(utcMs)).forEach(function (part) { p[part.type] = part.value; });
    return Date.UTC(+p.year, +p.month - 1, +p.day, p.hour === "24" ? 0 : +p.hour, +p.minute, +p.second) - utcMs;
  }
  function localToUtcMs(y, mo, d, h, mi, tz) {
    var wall = Date.UTC(y, mo - 1, d, h, mi, 0), guess = wall;
    for (var i = 0; i < 3; i++) { var n = wall - tzOffsetMs(tz, guess); if (n === guess) break; guess = n; }
    return guess;
  }
  var D2R = Math.PI / 180;
  function mod360(x) { return ((x % 360) + 360) % 360; }
  function T_of(ms) { return (ms / 86400000 + 2440587.5 - 2451545.0) / 36525; }

  function sunLongitude(ms) {
    var T = T_of(ms);
    var L0 = mod360(280.46646 + 36000.76983 * T + 0.0003032 * T * T);
    var M = mod360(357.52911 + 35999.05029 * T - 0.0001537 * T * T) * D2R;
    var C = (1.914602 - 0.004817 * T - 0.000014 * T * T) * Math.sin(M) + (0.019993 - 0.000101 * T) * Math.sin(2 * M) + 0.000289 * Math.sin(3 * M);
    return mod360(L0 + C);
  }
  var LT = [[0,0,1,0,6288774],[2,0,-1,0,1274027],[2,0,0,0,658314],[0,0,2,0,213618],[0,1,0,0,-185116],[0,0,0,2,-114332],[2,0,-2,0,58793],[2,-1,-1,0,57066],[2,0,1,0,53322],[2,-1,0,0,45758],[0,1,-1,0,-40923],[1,0,0,0,-34720],[0,1,1,0,-30383],[2,0,0,-2,15327],[0,0,1,2,-12528],[0,0,1,-2,10980],[4,0,-1,0,10675],[0,0,3,0,10034],[4,0,-2,0,8548],[2,1,-1,0,-7888],[2,1,0,0,-6766],[1,0,-1,0,-5163],[1,1,0,0,4987],[2,-1,1,0,4036],[2,0,2,0,3994],[4,0,0,0,3861],[2,0,-3,0,3665],[0,1,-2,0,-2689],[2,0,-1,2,-2602],[2,-1,-2,0,2390],[1,0,1,0,-2348],[2,-2,0,0,2236],[0,1,2,0,-2120],[0,2,0,0,-2069],[2,-2,-1,0,2048],[2,0,1,-2,-1773],[2,0,0,2,-1595],[4,-1,-1,0,1215],[0,0,2,2,-1110],[3,0,-1,0,-892],[2,1,1,0,-810],[4,-1,-2,0,759],[0,2,-1,0,-713],[2,2,-1,0,-700],[2,1,-2,0,691],[2,-1,0,-2,596],[4,0,1,0,549],[0,0,4,0,537],[4,-1,0,0,520],[1,0,-2,0,-487]];
  function moonLongitude(ms) {
    var T = T_of(ms);
    var Lp = mod360(218.3164477 + 481267.88123421*T - 0.0015786*T*T + T*T*T/538841 - T*T*T*T/65194000);
    var D = mod360(297.8501921 + 445267.1114034*T - 0.0018819*T*T + T*T*T/545868 - T*T*T*T/113065000);
    var M = mod360(357.5291092 + 35999.0502909*T - 0.0001536*T*T + T*T*T/24490000);
    var Mp = mod360(134.9633964 + 477198.8675055*T + 0.0087414*T*T + T*T*T/69699 - T*T*T*T/14712000);
    var F = mod360(93.2720950 + 483202.0175233*T - 0.0036539*T*T - T*T*T/3526000 + T*T*T*T/863310000);
    var E = 1 - 0.002516*T - 0.0000074*T*T, s = 0;
    for (var i = 0; i < LT.length; i++) { var t = LT[i], c = t[4]; if (t[1]===1||t[1]===-1) c*=E; else if (t[1]===2||t[1]===-2) c*=E*E; s += c*Math.sin((t[0]*D+t[1]*M+t[2]*Mp+t[3]*F)*D2R); }
    var A1 = mod360(119.75+131.849*T), A2 = mod360(53.09+479264.290*T);
    s += 3958*Math.sin(A1*D2R) + 1962*Math.sin((Lp-F)*D2R) + 318*Math.sin(A2*D2R);
    return mod360(Lp + s/1e6);
  }
  function ascendant(ms, lat, lon) {
    var jd = ms/86400000 + 2440587.5, T = (jd-2451545.0)/36525;
    var gmst = mod360(280.46061837 + 360.98564736629*(jd-2451545.0) + 0.000387933*T*T - T*T*T/38710000);
    var ramc = mod360(gmst + lon) * D2R;
    var eps = (23.4392911 - 0.0130042*T - 1.64e-7*T*T + 5.04e-7*T*T*T) * D2R;
    var phi = lat * D2R;
    var asc = Math.atan2(Math.cos(ramc), -(Math.sin(ramc)*Math.cos(eps) + Math.tan(phi)*Math.sin(eps)));
    return mod360(asc / D2R);
  }
  function signOf(lon) { return SIGNS[Math.floor(mod360(lon) / 30)]; }

  // ---------- Styles ----------
  var FONT = "'Segoe UI','Helvetica Neue',Helvetica,Arial,sans-serif";
  var GOLD = "#e8a75e";

  var CSS = "" +
    ":host{all:initial;display:block}" +
    "*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}" +
    ".wrap{position:relative;font-family:" + FONT + ";color:#fff;" +
    "background:#0a0a16 url('" + ORIGIN + "/embed/img/mars/space.jpg') center/cover no-repeat;" +
    "padding:54px 24px 56px;overflow:hidden;line-height:1.65}" +
    ".inner{position:relative;max-width:900px;margin:0 auto}" +
    ".title{font-family:'Great Vibes',cursive;font-weight:400;font-size:clamp(46px,7vw,74px);color:" + GOLD + ";text-align:center;text-shadow:0 2px 12px rgba(0,0,0,.5);margin-bottom:8px;line-height:1.1}" +
    ".intro{font-size:19px;text-align:center;margin:0 auto 30px;max-width:820px;text-shadow:0 1px 6px rgba(0,0,0,.5)}" +
    ".row{display:flex;align-items:center;gap:14px;margin-bottom:18px;flex-wrap:wrap}" +
    ".lbl{flex:0 0 130px;font-weight:700;font-size:20px;text-shadow:0 1px 4px rgba(0,0,0,.6)}" +
    ".fields{display:flex;gap:12px;flex:1;min-width:260px}" +
    "select,.place{appearance:none;-webkit-appearance:none;width:100%;padding:13px 34px 13px 16px;font-size:19px;font-family:" + FONT + ";color:#fff;background-color:rgba(16,16,30,.75);border:1.5px solid rgba(255,255,255,.9);border-radius:8px;outline:none;text-shadow:0 1px 3px rgba(0,0,0,.4)}" +
    "select{background-image:url(\"data:image/svg+xml;charset=utf-8,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='8'%3E%3Cpath d='M1 1l5 5 5-5' stroke='white' stroke-width='1.6' fill='none'/%3E%3C/svg%3E\");background-repeat:no-repeat;background-position:right 12px center;cursor:pointer}" +
    "select:focus,.place:focus{border-color:#fff;box-shadow:0 0 0 2px rgba(255,255,255,.25)}" +
    "select option{color:#1c1c2e;background:#fff;text-shadow:none}" +
    ".sel{flex:1}.place::placeholder{color:rgba(255,255,255,.7)}.placewrap{position:relative;flex:1}" +
    ".drop{position:absolute;top:calc(100% + 2px);left:0;right:0;background:#fff;border-radius:6px;box-shadow:0 10px 30px rgba(0,0,0,.5);z-index:30;max-height:280px;overflow-y:auto;display:none}" +
    ".drop.open{display:block}.opt{padding:14px 18px;font-size:18px;color:#26263a;cursor:pointer;border-bottom:1px solid #efeff4;text-shadow:none}.opt:last-child{border-bottom:0}.opt:hover,.opt.hi{background:#efe9f7}" +
    ".actions{text-align:center;margin-top:30px}" +
    ".btn{display:inline-block;font-family:" + FONT + ";font-size:19px;font-weight:600;letter-spacing:.5px;color:#241505;background:linear-gradient(180deg,#f2b26d," + GOLD + ");border:1.5px solid rgba(255,255,255,.85);border-radius:10px;padding:14px 44px;cursor:pointer;box-shadow:0 4px 16px rgba(0,0,0,.4);transition:transform .15s ease}" +
    ".btn:hover{transform:translateY(-1px)}" +
    ".err{display:none;text-align:center;margin-top:16px;font-size:17px;color:#ffce8a;text-shadow:0 1px 4px rgba(0,0,0,.6)}.err.show{display:block}" +
    ".screen-result{display:none}.screen-result.active{display:block;animation:fadein .6s ease}.screen-form.hidden{display:none}" +
    "@keyframes fadein{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:none}}" +
    ".cards{display:flex;flex-direction:column;gap:18px;margin-top:6px}" +
    ".b3{display:flex;align-items:center;gap:24px;border:1.5px solid " + GOLD + ";border-radius:18px;background:rgba(255,255,255,.05);padding:22px 26px}" +
    ".b3 img{width:92px;height:92px;flex:0 0 auto;filter:drop-shadow(0 1px 5px rgba(0,0,0,.4))}" +
    ".b3 .body{flex:1;min-width:0}" +
    ".b3 .role{font-size:14px;letter-spacing:2px;text-transform:uppercase;color:rgba(255,255,255,.7)}" +
    ".b3 .nm{font-family:'Great Vibes',cursive;font-size:clamp(34px,4.6vw,46px);color:" + GOLD + ";line-height:1.1;margin:2px 0 6px}" +
    ".b3 .tx{font-size:18px;text-shadow:0 1px 4px rgba(0,0,0,.35)}" +
    ".outro{text-align:center;font-size:18.5px;max-width:800px;margin:28px auto 0;text-shadow:0 1px 5px rgba(0,0,0,.4)}" +
    ".cta{display:inline-block;font-family:" + FONT + ";font-size:19px;font-weight:600;color:#241505;text-decoration:none;background:linear-gradient(180deg,#f2b26d," + GOLD + ");border-radius:999px;padding:15px 42px;box-shadow:0 4px 16px rgba(0,0,0,.35)}" +
    ".cta:hover{transform:translateY(-1px)}" +
    ".retry{display:inline-block;font-family:" + FONT + ";font-size:18px;font-weight:700;letter-spacing:2px;color:" + GOLD + ";background:none;border:none;cursor:pointer;text-shadow:0 1px 4px rgba(0,0,0,.4);padding:6px 10px;margin-top:8px}" +
    ".retry:hover{color:#f2c088}" +
    "@media(max-width:640px){.lbl{flex:1 0 100%}.b3{flex-direction:column;text-align:center}.wrap{padding:40px 14px 44px}}";

  function option(v, l) { return "<option value=\"" + v + "\">" + l + "</option>"; }

  function buildHtml() {
    var months = "<option value=''>MM</option>"; for (var m = 1; m <= 12; m++) months += option(m, ("0" + m).slice(-2));
    var days = "<option value=''>DD</option>"; for (var d = 1; d <= 31; d++) days += option(d, ("0" + d).slice(-2));
    var years = "<option value=''>YYYY</option>"; var yr = new Date().getFullYear(); for (var y = yr; y >= 1920; y--) years += option(y, y);
    var hours = "<option value=''>HH</option>"; for (var h = 1; h <= 12; h++) hours += option(h, h);
    var mins = "<option value=''>MM</option>"; for (var mi = 0; mi < 60; mi++) mins += option(mi, ("0" + mi).slice(-2));
    var cta = CTA_URL ? "<div class='actions'><a class='cta' href='" + CTA_URL + "'>" + CTA_TEXT + "</a></div>" : "";
    return "<div class='wrap'><div class='inner'>" +
      "<h2 class='title'>Sun, Moon &amp; Rising Calculator</h2>" +
      "<div class='screen-form'>" +
      "<p class='intro'>Your Big 3 are the heart of your birth chart: your Sun (your core self), your Moon (your inner emotional world), and your Rising sign (the face you show the world). Enter your birth details below to reveal all three at once.</p>" +
      "<div class='row'><span class='lbl'>Birth Date:</span><div class='fields'>" +
      "<select class='sel' data-f='month' aria-label='Birth month'>" + months + "</select>" +
      "<select class='sel' data-f='day' aria-label='Birth day'>" + days + "</select>" +
      "<select class='sel' data-f='year' aria-label='Birth year'>" + years + "</select></div></div>" +
      "<div class='row'><span class='lbl'>Birth Time:</span><div class='fields'>" +
      "<select class='sel' data-f='hour' aria-label='Birth hour'>" + hours + "</select>" +
      "<select class='sel' data-f='minute' aria-label='Birth minute'>" + mins + "</select>" +
      "<select class='sel' data-f='ampm' aria-label='AM or PM'><option value='AM'>AM</option><option value='PM'>PM</option></select></div></div>" +
      "<div class='row'><span class='lbl'>Birth Place:</span><div class='fields'><div class='placewrap'>" +
      "<input class='place' type='text' data-f='place' placeholder='Start typing a city...' autocomplete='off' aria-label='Birth place'>" +
      "<div class='drop' role='listbox'></div></div></div></div>" +
      "<div class='actions'><button class='btn' type='button'>Reveal My Big 3</button></div>" +
      "<div class='err' role='alert'></div>" +
      "</div>" +
      "<div class='screen-result' aria-live='polite'>" +
      "<div class='cards'>" +
      b3card("Sun") + b3card("Moon") + b3card("Rising") +
      "</div>" +
      "<p class='outro'>These three placements are just the beginning. A psychic astrologer can read your full chart to show how every planet works together in your unique story.</p>" +
      cta +
      "<div class='actions'><button class='retry' type='button'>&#8592; Start Over</button></div>" +
      "</div>" +
      "</div></div>";
  }
  function b3card(role) {
    return "<div class='b3' data-role='" + role + "'><img alt=''><div class='body'>" +
      "<div class='role'>" + role + " Sign</div><div class='nm'></div><div class='tx'></div></div></div>";
  }

  function init(host) {
    if (host.__psBigThree) return; host.__psBigThree = true;
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
    var drop = $(".drop"), err = $(".err"), formScreen = $(".screen-form"), resultScreen = $(".screen-result");
    var chosen = null, seq = 0, debounceTimer = null, hiIndex = -1, items = [];

    function closeDrop() { drop.classList.remove("open"); drop.innerHTML = ""; hiIndex = -1; items = []; }
    function renderDrop(list) {
      items = list; hiIndex = -1;
      if (!list.length) { closeDrop(); return; }
      drop.innerHTML = list.map(function (c, i) { return "<div class='opt' role='option' data-i='" + i + "'>" + c.name + (c.region ? ", " + c.region : "") + ", " + c.country + "</div>"; }).join("");
      drop.classList.add("open");
      drop.querySelectorAll(".opt").forEach(function (el) { el.addEventListener("mousedown", function (e) { e.preventDefault(); pick(+el.getAttribute("data-i")); }); });
    }
    function pick(i) { var c = items[i]; if (!c) return; chosen = c; fields.place.value = c.name + (c.region ? ", " + c.region : "") + ", " + c.country; closeDrop(); }
    function highlight(delta) { var opts = drop.querySelectorAll(".opt"); if (!opts.length) return; hiIndex = (hiIndex + delta + opts.length) % opts.length; opts.forEach(function (el, i) { el.classList.toggle("hi", i === hiIndex); }); }

    fields.place.addEventListener("input", function () {
      chosen = null; var q = fields.place.value.trim(); clearTimeout(debounceTimer);
      if (q.length < 2) { closeDrop(); return; }
      debounceTimer = setTimeout(function () {
        var my = ++seq;
        fetch(ORIGIN + "/api/calculators/cities?q=" + encodeURIComponent(q)).then(function (r) { return r.json(); }).then(function (list) { if (my === seq) renderDrop(list); }).catch(function () {});
      }, 180);
    });
    fields.place.addEventListener("keydown", function (e) {
      if (!drop.classList.contains("open")) return;
      if (e.key === "ArrowDown") { e.preventDefault(); highlight(1); }
      else if (e.key === "ArrowUp") { e.preventDefault(); highlight(-1); }
      else if (e.key === "Enter") { e.preventDefault(); pick(hiIndex >= 0 ? hiIndex : 0); }
      else if (e.key === "Escape") closeDrop();
    });
    fields.place.addEventListener("blur", function () { setTimeout(closeDrop, 150); });

    function showError(m) { err.textContent = m; err.classList.add("show"); }
    function setCard(role, sign, text) {
      var el = mount.querySelector("[data-role='" + role + "']");
      el.querySelector(".nm").textContent = role + " in " + sign;
      el.querySelector(".tx").textContent = text;
      var img = el.querySelector("img");
      img.src = ORIGIN + "/embed/img/mars/" + sign.toLowerCase() + ".png";
      img.alt = sign;
    }

    $(".btn").addEventListener("click", function () {
      err.classList.remove("show");
      var v = function (n) { return fields[n].value; };
      if (!v("month") || !v("day") || !v("year")) return showError("Please select your full birth date.");
      if (!v("hour") || v("minute") === "") return showError("Please select your birth time. Your Rising sign changes every two hours, so the time matters.");
      if (!chosen) return showError("Please choose your birth place from the dropdown list.");
      var day = +v("day"), month = +v("month"), year = +v("year");
      if (day > new Date(year, month, 0).getDate()) return showError("That date does not exist. Please check the day and month.");
      var hour = (+v("hour")) % 12 + (v("ampm") === "PM" ? 12 : 0);
      var utc = localToUtcMs(year, month, day, hour, +v("minute"), chosen.timezone);
      var sun = signOf(sunLongitude(utc)), moon = signOf(moonLongitude(utc)), rise = signOf(ascendant(utc, chosen.lat, chosen.lon));
      setCard("Sun", sun, "With your Sun in " + sun + ", you have " + SUN[sun]);
      setCard("Moon", moon, "With your Moon in " + moon + ", " + MOON[moon]);
      setCard("Rising", rise, "With " + rise + " rising, " + RISING[rise]);
      formScreen.classList.add("hidden"); resultScreen.classList.add("active");
      $(".wrap").scrollIntoView({ behavior: "smooth", block: "start" });
    });

    $(".retry").addEventListener("click", function () {
      ["month", "day", "year", "hour", "minute"].forEach(function (n) { fields[n].value = ""; });
      fields.ampm.value = "AM"; fields.place.value = ""; chosen = null;
      err.classList.remove("show"); closeDrop();
      resultScreen.classList.remove("active"); formScreen.classList.remove("hidden");
      $(".wrap").scrollIntoView({ behavior: "smooth", block: "start" });
    });
  }

  function boot() {
    var host = document.getElementById("ps-big-three") || document.querySelector("[data-ps-widget='big-three']");
    if (host) init(host);
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot); else boot();
})();
