/* Jupiter Sign Calculator embed.
 * Usage on any site:
 *   <div id="ps-jupiter-sign"></div>
 *   <script async src="https://psychic-source-platform.vercel.app/embed/jupiter-sign.js"></script>
 * Renders directly into the page (Shadow DOM), no iframe.
 * City search data derived from GeoNames.org, licensed CC BY 4.0.
 */
(function () {
  "use strict";

  var SCRIPT_SRC = (document.currentScript && document.currentScript.src) || "";
  var ORIGIN = SCRIPT_SRC ? new URL(SCRIPT_SRC).origin : "https://psychic-source-platform.vercel.app";

  var CTA_URL = "https://www.psychicsource.com/psychic-advice/astrology-readings";
  var CTA_TEXT = "Speak with an astrology psychic";

  var SIGNS = ["Aries", "Taurus", "Gemini", "Cancer", "Leo", "Virgo",
    "Libra", "Scorpio", "Sagittarius", "Capricorn", "Aquarius", "Pisces"];

  var MEANINGS = {
    Aries: "Jupiter in Aries multiplies your courage. Luck finds you when you act boldly, take initiative, and trust your first instincts. You grow through challenges that would intimidate others, and your enthusiasm opens doors that planning alone never could. Leadership suits you, and your optimism is contagious. Just remember that patience is also a strategy; not every opportunity needs to be seized this instant.",
    Taurus: "Jupiter in Taurus attracts abundance through patience and good judgment. You grow wealth and wisdom slowly, and what you build tends to last. You have a gift for enjoying life's pleasures without losing sight of your goals, and generosity with the people you love comes naturally. Luck arrives when you commit for the long haul. Trust your steady pace; it wins bigger races than sprinting.",
    Gemini: "Jupiter in Gemini expands your world through ideas, conversation, and connections. You collect knowledge the way others collect possessions, and your curiosity keeps opening new doors. Opportunities often arrive through the people you know and the questions you ask. You may study or work in several fields across your life. Your growth comes from depth as well as breadth; finish exploring one door before opening five more.",
    Cancer: "Jupiter is exalted in Cancer, which blesses your emotional wisdom. You grow through caring for others, and generosity flows back to you multiplied. Family, home, and roots are lucky ground for you, and your intuition about people rarely misses. Abundance tends to find you when you trust your feelings and nurture what you love. Your kindness is your fortune; protect it, but never lock it away.",
    Leo: "Jupiter in Leo magnifies your natural radiance. Luck follows your confidence, and doors open when you dare to be seen. You inspire people effortlessly, and your generosity is as grand as your dreams. Creative work, leadership, and anything requiring heart tend to flourish for you. Growth comes from sharing the spotlight as freely as you claim it; lifted others rise with you, and so does your fortune.",
    Virgo: "Jupiter in Virgo expands your life through skill, service, and attention to detail. You grow by mastering your craft, and opportunities arrive when your competence quietly speaks for itself. Others trust you with responsibility because you deliver. Health, routines, and meaningful work are lucky territory for you. Remember that done is often better than perfect; your growth accelerates when you let good work go out into the world.",
    Libra: "Jupiter in Libra attracts luck through relationships, fairness, and grace. Partnerships expand your world, and the right people seem to appear exactly when you need them. You have a talent for creating harmony and for helping others find common ground, which builds you a wide circle of goodwill. Beauty and justice both call to you. Growth comes from choosing honestly, even when the fair answer disappoints someone.",
    Scorpio: "Jupiter in Scorpio deepens everything it touches. You grow through transformation: the endings, reinventions, and truths that others avoid become your greatest teachers. You have a gift for seeing beneath the surface, and wealth often comes through insight, research, or managing what others entrust to you. Your passion is magnetic. Luck expands when you share your depths instead of guarding them.",
    Sagittarius: "Jupiter rules Sagittarius, so its gifts flow to you undiluted. Optimism, luck, and a hunger for meaning run through everything you do. You grow through travel, learning, and big questions, and fortune favors your leaps of faith more than most. People trust your honesty and catch your enthusiasm. The horizon will always call you; just make sure your wisdom travels as far as your feet.",
    Capricorn: "Jupiter in Capricorn grows success the old-fashioned way: earned, structured, and built to last. Your ambitions are big, but your patience is bigger, and that combination is rare. Luck finds you at the top of the mountain you climbed step by step. Authority suits you, and others trust you with real responsibility. Remember to celebrate the summits; achievement tastes better when you actually pause to enjoy it.",
    Aquarius: "You have a strong humanitarian streak and do your best work when you're pursuing justice and helping others. You're fair-minded and can easily see the value in others, even when they're different from yourself. You appreciate uniqueness and bring out the best in those around you with your tolerance and generosity.",
    Pisces: "Jupiter in Pisces overflows with compassion and imagination. You grow through creativity, spirituality, and quiet acts of kindness that ripple further than you know. Luck tends to arrive in uncanny, well-timed ways, as if the universe keeps an eye on you. Art, healing, and helping others are fortunate paths. Anchor your dreams with a little structure and they stop being dreams; they become your life.",
  };

  // ---------- Astronomy ----------
  // Geocentric ecliptic longitude of Jupiter, tropical (equinox of date),
  // from the JPL "Approximate Positions of the Planets" Keplerian elements
  // (Standish, valid 1800-2050). Validated against documented natal charts
  // and known Jupiter ingresses. Geocentric, so birth place matters only
  // through its timezone.

  function tzOffsetMs(tz, utcMs) {
    var dtf = new Intl.DateTimeFormat("en-US", {
      timeZone: tz, year: "numeric", month: "2-digit", day: "2-digit",
      hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false,
    });
    var p = {};
    dtf.formatToParts(new Date(utcMs)).forEach(function (part) { p[part.type] = part.value; });
    var asUtc = Date.UTC(+p.year, +p.month - 1, +p.day, p.hour === "24" ? 0 : +p.hour, +p.minute, +p.second);
    return asUtc - utcMs;
  }

  function localToUtcMs(year, month, day, hour, minute, tz) {
    var wall = Date.UTC(year, month - 1, day, hour, minute, 0);
    var guess = wall;
    for (var i = 0; i < 3; i++) {
      var next = wall - tzOffsetMs(tz, guess);
      if (next === guess) break;
      guess = next;
    }
    return guess;
  }

  var D2R = Math.PI / 180;
  function mod360(x) { return ((x % 360) + 360) % 360; }

  var ELEMENTS = {
    emb: {
      base: [1.00000261, 0.01671123, -0.00001531, 100.46457166, 102.93768193, 0.0],
      rate: [0.00000562, -0.00004392, -0.01294668, 35999.37244981, 0.32327364, 0.0],
    },
    jupiter: {
      base: [5.20288700, 0.04838624, 1.30439695, 34.39644051, 14.72847983, 100.47390909],
      rate: [-0.00011607, -0.00013253, -0.00183714, 3034.74612775, 0.21252668, 0.20469106],
    },
  };

  function helio(body, T) {
    var el = ELEMENTS[body];
    var a = el.base[0] + el.rate[0] * T;
    var e = el.base[1] + el.rate[1] * T;
    var I = (el.base[2] + el.rate[2] * T) * D2R;
    var L = el.base[3] + el.rate[3] * T;
    var wBar = el.base[4] + el.rate[4] * T;
    var nodeDeg = el.base[5] + el.rate[5] * T;
    var node = nodeDeg * D2R;
    var w = (wBar - nodeDeg) * D2R;

    var M = mod360(L - wBar);
    if (M > 180) M -= 360;
    var eStar = e / D2R;
    var E = M + eStar * Math.sin(M * D2R);
    for (var i = 0; i < 10; i++) {
      var dM = M - (E - eStar * Math.sin(E * D2R));
      var dE = dM / (1 - e * Math.cos(E * D2R));
      E += dE;
      if (Math.abs(dE) < 1e-8) break;
    }
    var Erad = E * D2R;
    var xp = a * (Math.cos(Erad) - e);
    var yp = a * Math.sqrt(1 - e * e) * Math.sin(Erad);
    var cw = Math.cos(w), sw = Math.sin(w);
    var cn = Math.cos(node), sn = Math.sin(node);
    var ci = Math.cos(I), si = Math.sin(I);
    return {
      x: (cw * cn - sw * sn * ci) * xp + (-sw * cn - cw * sn * ci) * yp,
      y: (cw * sn + sw * cn * ci) * xp + (-sw * sn + cw * cn * ci) * yp,
    };
  }

  function jupiterLongitude(utcMs) {
    var jd = utcMs / 86400000 + 2440587.5;
    var T = (jd - 2451545.0) / 36525;
    var earth = helio("emb", T);
    var jup = helio("jupiter", T);
    var lonJ2000 = mod360(Math.atan2(jup.y - earth.y, jup.x - earth.x) / D2R);
    var precession = (5029.0966 * T + 1.11113 * T * T) / 3600;
    return mod360(lonJ2000 + precession);
  }

  function jupiterSign(year, month, day, hour, minute, tz) {
    var lng = jupiterLongitude(localToUtcMs(year, month, day, hour, minute, tz));
    return { sign: SIGNS[Math.floor(lng / 30)], degree: Math.floor(lng % 30) };
  }

  // ---------- Styles ----------

  var FONT = "'Segoe UI','Helvetica Neue',Helvetica,Arial,sans-serif";
  var GOLD = "#eda45f";

  var CSS = "" +
    ":host{all:initial;display:block}" +
    "*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}" +
    ".wrap{position:relative;font-family:" + FONT + ";color:#fff;" +
    "background:#160a0c url('" + ORIGIN + "/embed/img/jupiter/stars.jpg') center/cover no-repeat;" +
    "padding:56px 24px 52px;overflow:hidden;line-height:1.65}" +
    ".inner{position:relative;max-width:880px;margin:0 auto}" +
    ".title{font-family:'Great Vibes',cursive;font-weight:400;font-size:clamp(44px,7vw,74px);color:" + GOLD + ";" +
    "text-align:center;text-shadow:0 2px 12px rgba(0,0,0,.5);margin-bottom:10px}" +
    ".flourish{display:flex;align-items:center;justify-content:center;gap:8px;max-width:700px;margin:0 auto 28px;color:" + GOLD + "}" +
    ".flourish .fline{flex:1;height:2px;background:" + GOLD + "}" +
    ".subhead{font-size:26px;color:" + GOLD + ";text-align:center;margin-bottom:16px;text-shadow:0 1px 6px rgba(0,0,0,.55)}" +
    ".intro{font-size:19px;text-align:center;text-shadow:0 1px 6px rgba(0,0,0,.55);margin:0 auto 22px;max-width:840px}" +
    ".row{display:flex;align-items:center;gap:14px;margin-bottom:18px;flex-wrap:wrap}" +
    ".lbl{flex:0 0 130px;font-weight:700;font-size:20px;text-shadow:0 1px 4px rgba(0,0,0,.6)}" +
    ".fields{display:flex;gap:12px;flex:1;min-width:260px}" +
    "select,.place{appearance:none;-webkit-appearance:none;width:100%;padding:13px 34px 13px 16px;font-size:19px;" +
    "font-family:" + FONT + ";color:#fff;background-color:rgba(56,30,36,.65);border:1.5px solid rgba(255,255,255,.9);" +
    "border-radius:8px;outline:none;text-shadow:0 1px 3px rgba(0,0,0,.4)}" +
    "select{background-image:url(\"data:image/svg+xml;charset=utf-8,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='8'%3E%3Cpath d='M1 1l5 5 5-5' stroke='white' stroke-width='1.6' fill='none'/%3E%3C/svg%3E\");" +
    "background-repeat:no-repeat;background-position:right 12px center;cursor:pointer}" +
    "select:focus,.place:focus{border-color:#fff;box-shadow:0 0 0 2px rgba(255,255,255,.25)}" +
    "select option{color:#3a2228;background:#fff;text-shadow:none}" +
    ".sel{flex:1}" +
    ".place::placeholder{color:rgba(255,255,255,.7)}" +
    ".placewrap{position:relative;flex:1}" +
    ".drop{position:absolute;top:calc(100% + 2px);left:0;right:0;background:#fff;border-radius:6px;" +
    "box-shadow:0 10px 30px rgba(0,0,0,.5);z-index:30;max-height:280px;overflow-y:auto;display:none}" +
    ".drop.open{display:block}" +
    ".opt{padding:14px 18px;font-size:18px;color:#3a2830;cursor:pointer;border-bottom:1px solid #f4eef0;text-shadow:none}" +
    ".opt:last-child{border-bottom:0}" +
    ".opt:hover,.opt.hi{background:#f7ebe6}" +
    ".actions{text-align:center;margin-top:30px}" +
    ".btn{display:inline-block;font-family:" + FONT + ";font-size:19px;font-weight:600;letter-spacing:.5px;color:#2b1a06;" +
    "background:linear-gradient(180deg,#f2b26d," + GOLD + ");border:1.5px solid rgba(255,255,255,.85);border-radius:10px;" +
    "padding:14px 44px;cursor:pointer;box-shadow:0 4px 16px rgba(0,0,0,.4);transition:transform .15s ease,box-shadow .15s ease}" +
    ".btn:hover{transform:translateY(-1px);box-shadow:0 6px 20px rgba(0,0,0,.5)}" +
    ".err{display:none;text-align:center;margin-top:16px;font-size:17px;color:#ffce8a;text-shadow:0 1px 4px rgba(0,0,0,.6)}" +
    ".err.show{display:block}" +
    ".screen-result{display:none}" +
    ".screen-result.active{display:block;animation:fadein .6s ease}" +
    ".screen-form.hidden{display:none}" +
    "@keyframes fadein{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:none}}" +
    ".result{border:1.5px solid " + GOLD + ";border-radius:26px;" +
    "background:rgba(255,255,255,.05);padding:38px 34px;margin-top:6px}" +
    ".cols{display:flex;align-items:center;gap:30px}" +
    ".art{flex:0 0 34%;text-align:center}" +
    ".art img{max-width:100%;height:auto;display:block;margin:0 auto;filter:drop-shadow(0 1px 5px rgba(0,0,0,.35))}" +
    ".signname{margin-top:14px;font-size:24px;font-weight:600;letter-spacing:4px;text-transform:uppercase}" +
    ".divider{flex:0 0 4px;align-self:stretch;min-height:220px;" +
    "background-image:radial-gradient(circle," + GOLD + " 1.6px,transparent 1.8px);background-size:4px 12px;background-repeat:repeat-y;background-position:center}" +
    ".meaning{flex:1;min-width:0}" +
    ".rname{font-family:'Great Vibes',cursive;font-weight:400;font-size:clamp(36px,5vw,54px);color:" + GOLD + ";" +
    "text-shadow:0 1px 6px rgba(0,0,0,.3);line-height:1.15;margin-bottom:4px}" +
    ".deg{font-size:15px;font-style:italic;color:rgba(255,255,255,.85);margin-bottom:14px}" +
    ".meaning p{font-size:18.5px;margin-bottom:14px;text-shadow:0 1px 4px rgba(0,0,0,.4)}" +
    ".meaning p:last-child{margin-bottom:0}" +
    ".outro{max-width:800px;margin:30px auto 0;text-align:center;font-size:18.5px;text-shadow:0 1px 5px rgba(0,0,0,.5)}" +
    ".cta{display:inline-block;font-family:" + FONT + ";font-size:20px;font-weight:600;color:#2b1a06;text-decoration:none;" +
    "background:linear-gradient(180deg,#f2b26d," + GOLD + ");border-radius:999px;padding:16px 46px;" +
    "box-shadow:0 4px 16px rgba(0,0,0,.35);transition:transform .15s ease}" +
    ".cta:hover{transform:translateY(-1px)}" +
    ".retry{display:inline-block;font-family:" + FONT + ";font-size:19px;font-weight:600;" +
    "color:#fff;background:none;border:none;cursor:pointer;text-shadow:0 1px 4px rgba(0,0,0,.5);padding:6px 10px;margin-top:8px}" +
    ".retry:hover{color:" + GOLD + "}" +
    "@media(max-width:640px){" +
    ".lbl{flex:1 0 100%}" +
    ".cols{flex-direction:column}" +
    ".art{flex-basis:auto;max-width:250px}" +
    ".divider{display:none}" +
    ".result{padding:26px 18px}" +
    ".wrap{padding:40px 14px 44px}}";

  var ORNAMENT = "<svg width='40' height='24' viewBox='0 0 40 24' fill='none' xmlns='http://www.w3.org/2000/svg'>" +
    "<path d='M38 12 L26 12 M30 12 C 26 8, 20 6, 14 8 M30 12 C 26 16, 20 18, 14 16' stroke='currentColor' stroke-width='1.7' fill='none' stroke-linecap='round'/>" +
    "<path d='M10 8 L10 16 M6 7 L6 17 M2 9 L2 15' stroke='currentColor' stroke-width='2' stroke-linecap='round'/></svg>";
  var CENTER_DOTS = "<svg width='34' height='12' viewBox='0 0 34 12' fill='none' xmlns='http://www.w3.org/2000/svg'>" +
    "<circle cx='6' cy='6' r='2.6' fill='currentColor'/><circle cx='17' cy='6' r='4' fill='currentColor'/><circle cx='28' cy='6' r='2.6' fill='currentColor'/></svg>";

  // ---------- Markup ----------

  function option(value, label) {
    return "<option value=\"" + value + "\">" + label + "</option>";
  }

  function buildHtml() {
    var months = "<option value=''>MM</option>";
    for (var m = 1; m <= 12; m++) months += option(m, ("0" + m).slice(-2));
    var days = "<option value=''>DD</option>";
    for (var d = 1; d <= 31; d++) days += option(d, ("0" + d).slice(-2));
    var years = "<option value=''>YYYY</option>";
    var thisYear = new Date().getFullYear();
    for (var y = thisYear; y >= 1920; y--) years += option(y, y);
    var hours = "<option value=''>HH</option>";
    for (var h = 1; h <= 12; h++) hours += option(h, h);
    var mins = "<option value=''>MM</option>";
    for (var mi = 0; mi < 60; mi++) mins += option(mi, ("0" + mi).slice(-2));

    var cta = CTA_URL
      ? "<div class='actions'><a class='cta' href='" + CTA_URL + "'>" + CTA_TEXT + "</a></div>"
      : "";

    return "<div class='wrap'><div class='inner'>" +
      "<h2 class='title'>Jupiter Sign Calculator</h2>" +
      "<div class='flourish'>" + ORNAMENT + "<div class='fline'></div>" + CENTER_DOTS + "<div class='fline'></div>" +
      "<span style='transform:scaleX(-1);display:inline-flex'>" + ORNAMENT + "</span></div>" +
      "<div class='screen-form'>" +
      "<div class='subhead'>How Does Jupiter Work in Your Chart?</div>" +
      "<p class='intro'>Jupiter's position on your natal chart has a huge impact on how you approach life. Understanding what sign Jupiter is in provides insights into how you attract abundance, approach challenges, and see the world around you. Use this calculator to find out where Jupiter lands for you.</p>" +
      "<p class='intro'>Jupiter is more than twice the size of all the other planets in our solar system combined. This gives it immense influence over your life. The position of Jupiter at the time of your birth determines how you approach risks, attract abundance, learn lessons, and achieve success.</p>" +
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
      "<div class='actions'><button class='btn' type='button'>Reveal My Jupiter Sign</button></div>" +
      "<div class='err' role='alert'></div>" +
      "</div>" +
      "<div class='screen-result' aria-live='polite'>" +
      "<div class='result'><div class='cols'>" +
      "<div class='art'><img alt='' loading='lazy'><div class='signname'></div></div>" +
      "<div class='divider'></div>" +
      "<div class='meaning'><div class='rname'></div><div class='deg'></div><div class='mtext'></div></div>" +
      "</div></div>" +
      "<p class='outro'>To best understand your Jupiter sign, you should also explore the other planets in your chart. Speak with an astrology psychic for a full reading that reveals more about Jupiter's expansive influence in your life.</p>" +
      cta +
      "<div class='actions'><button class='retry' type='button'>&#171; Start Again</button></div>" +
      "</div>" +
      "</div></div>";
  }

  // ---------- Behavior ----------

  function init(host) {
    if (host.__psJupiterSign) return;
    host.__psJupiterSign = true;

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

    var $ = function (sel) { return mount.querySelector(sel); };
    var fields = {};
    mount.querySelectorAll("[data-f]").forEach(function (el) { fields[el.getAttribute("data-f")] = el; });
    var drop = $(".drop");
    var err = $(".err");
    var btn = $(".btn");
    var formScreen = $(".screen-form");
    var resultScreen = $(".screen-result");

    var chosen = null;
    var seq = 0;
    var debounceTimer = null;
    var hiIndex = -1;
    var items = [];

    function closeDrop() { drop.classList.remove("open"); drop.innerHTML = ""; hiIndex = -1; items = []; }

    function renderDrop(list) {
      items = list;
      hiIndex = -1;
      if (!list.length) { closeDrop(); return; }
      drop.innerHTML = list.map(function (c, i) {
        var label = c.name + (c.region ? ", " + c.region : "") + ", " + c.country;
        return "<div class='opt' role='option' data-i='" + i + "'>" + label + "</div>";
      }).join("");
      drop.classList.add("open");
      drop.querySelectorAll(".opt").forEach(function (el) {
        el.addEventListener("mousedown", function (e) {
          e.preventDefault();
          pick(+el.getAttribute("data-i"));
        });
      });
    }

    function pick(i) {
      var c = items[i];
      if (!c) return;
      chosen = c;
      fields.place.value = c.name + (c.region ? ", " + c.region : "") + ", " + c.country;
      closeDrop();
    }

    function highlight(delta) {
      var opts = drop.querySelectorAll(".opt");
      if (!opts.length) return;
      hiIndex = (hiIndex + delta + opts.length) % opts.length;
      opts.forEach(function (el, i) { el.classList.toggle("hi", i === hiIndex); });
    }

    fields.place.addEventListener("input", function () {
      chosen = null;
      var q = fields.place.value.trim();
      clearTimeout(debounceTimer);
      if (q.length < 2) { closeDrop(); return; }
      debounceTimer = setTimeout(function () {
        var mySeq = ++seq;
        fetch(ORIGIN + "/api/calculators/cities?q=" + encodeURIComponent(q))
          .then(function (r) { return r.json(); })
          .then(function (list) { if (mySeq === seq) renderDrop(list); })
          .catch(function () { });
      }, 180);
    });

    fields.place.addEventListener("keydown", function (e) {
      if (!drop.classList.contains("open")) return;
      if (e.key === "ArrowDown") { e.preventDefault(); highlight(1); }
      else if (e.key === "ArrowUp") { e.preventDefault(); highlight(-1); }
      else if (e.key === "Enter") { e.preventDefault(); pick(hiIndex >= 0 ? hiIndex : 0); }
      else if (e.key === "Escape") { closeDrop(); }
    });

    fields.place.addEventListener("blur", function () { setTimeout(closeDrop, 150); });

    function showError(msg) { err.textContent = msg; err.classList.add("show"); }
    function clearError() { err.classList.remove("show"); }

    btn.addEventListener("click", function () {
      clearError();
      var v = function (name) { return fields[name].value; };
      if (!v("month") || !v("day") || !v("year")) return showError("Please select your full birth date.");
      if (!v("hour") || v("minute") === "") return showError("Please select your birth time.");
      if (!chosen) return showError("Please choose your birth place from the dropdown list.");

      var day = +v("day"), month = +v("month"), year = +v("year");
      var daysInMonth = new Date(year, month, 0).getDate();
      if (day > daysInMonth) return showError("That date does not exist. Please check the day and month.");

      var hour = (+v("hour")) % 12 + (v("ampm") === "PM" ? 12 : 0);
      var r = jupiterSign(year, month, day, hour, +v("minute"), chosen.timezone);

      $(".rname").textContent = "Jupiter in " + r.sign;
      $(".deg").textContent = "Your Jupiter sits at " + r.degree + "° " + r.sign + ".";
      $(".signname").textContent = r.sign;
      $(".mtext").innerHTML = "<p>" + MEANINGS[r.sign] + "</p>";
      var img = $(".art img");
      img.src = ORIGIN + "/embed/img/mars/" + r.sign.toLowerCase() + ".png";
      img.alt = r.sign + " line art illustration";
      formScreen.classList.add("hidden");
      resultScreen.classList.add("active");
      $(".wrap").scrollIntoView({ behavior: "smooth", block: "start" });
    });

    $(".retry").addEventListener("click", function () {
      ["month", "day", "year", "hour", "minute"].forEach(function (name) { fields[name].value = ""; });
      fields.ampm.value = "AM";
      fields.place.value = "";
      chosen = null;
      clearError();
      closeDrop();
      resultScreen.classList.remove("active");
      formScreen.classList.remove("hidden");
      $(".wrap").scrollIntoView({ behavior: "smooth", block: "start" });
    });
  }

  function boot() {
    var host = document.getElementById("ps-jupiter-sign") || document.querySelector("[data-ps-widget='jupiter-sign']");
    if (host) init(host);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})();
