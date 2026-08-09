/* Venus Sign Calculator embed.
 * Usage on any site:
 *   <div id="ps-venus-sign"></div>
 *   <script async src="https://psychic-source-platform.vercel.app/embed/venus-sign.js"></script>
 * Renders directly into the page (Shadow DOM), no iframe.
 * City search data derived from GeoNames.org, licensed CC BY 4.0.
 */
(function () {
  "use strict";

  var SCRIPT_SRC = (document.currentScript && document.currentScript.src) || "";
  var ORIGIN = SCRIPT_SRC ? new URL(SCRIPT_SRC).origin : "https://psychic-source-platform.vercel.app";

  var CTA_URL = "https://www.psychicsource.com/psychic-advice/astrology-readings";
  var CTA_TEXT = "Speak with a psychic astrologer to learn more";

  var SIGNS = ["Aries", "Taurus", "Gemini", "Cancer", "Leo", "Virgo",
    "Libra", "Scorpio", "Sagittarius", "Capricorn", "Aquarius", "Pisces"];

  var MEANINGS = {
    Aries: "Venus in Aries loves boldly and fast. You are drawn to the thrill of the chase and fall hard and quickly, wearing your heart on your sleeve. Directness is your love language: you say what you feel and pursue who you want. You value passion, honesty, and a partner who can keep up with your fire. The lesson is patience, letting love deepen rather than always chasing the next spark.",
    Taurus: "Venus rules Taurus, so love here is sensual, loyal, and built to last. You show affection through touch, comfort, and steady devotion, and you want a relationship you can rely on. Beauty, good food, and physical closeness feed your heart. You value security and consistency over drama. Guard against possessiveness; the same steadiness that makes you devoted can tip into holding on too tightly.",
    Gemini: "Venus in Gemini falls in love through the mind. Conversation is courtship for you, and a partner who can talk, joke, and trade ideas keeps your heart engaged. You crave variety, playfulness, and mental spark, and boredom is the real threat to your relationships. You value curiosity and communication above all. The growth edge is depth, letting a connection become as deep as it is lively.",
    Cancer: "Venus in Cancer loves tenderly and protectively. You bond deeply, remember every anniversary, and show love by nurturing and creating a safe emotional home. You want to feel cherished and secure before you fully open, and once you do, your devotion runs bone-deep. You value loyalty, sentiment, and emotional safety. Watch a tendency to cling or retreat into your shell when you feel unsure.",
    Leo: "Venus in Leo loves grandly and generously. Romance is theater to you: big gestures, warmth, and pride in the person you adore. You give affection lavishly and need to feel adored in return. Loyalty and admiration matter enormously, and a partner who celebrates you openly wins your heart. You value passion and devotion. The lesson is that quiet love counts too, not just the applause-worthy moments.",
    Virgo: "Venus in Virgo shows love through devoted, practical care. You express affection by helping, remembering the details, and quietly making your partner's life easier. You are discerning about who you let in and want a relationship that is useful and real, not just romantic. You value reliability and thoughtfulness. Ease up on the inner critic; love does not have to be perfect to be worthy of you.",
    Libra: "Venus rules Libra, so relationships are your natural art form. You are romantic, charming, and happiest as part of a pair, with a gift for harmony and making others feel adored. Beauty, fairness, and partnership feed your soul. You value balance and companionship deeply. The growth edge is keeping your own preferences in view, so you do not lose yourself trying to keep the peace.",
    Scorpio: "Venus in Scorpio loves with all-or-nothing intensity. Surface romance holds no interest; you want soul-deep intimacy, total trust, and a bond that transforms you both. You are fiercely loyal and profoundly passionate once you commit. You value honesty, depth, and emotional truth. Watch the shadow of jealousy and control; the intensity that makes your love powerful can turn possessive if left unchecked.",
    Sagittarius: "Venus in Sagittarius loves freely and adventurously. You are drawn to partners who feel like fellow explorers, and you keep romance alive with travel, laughter, and big shared dreams. Feeling caged is the fastest way to lose you. You value honesty, independence, and fun. The lesson is that commitment and freedom can coexist; the right person expands your world rather than shrinking it.",
    Capricorn: "Venus in Capricorn loves seriously and for keeps. You are cautious at first, but once you commit, you are steadfast, dependable, and quietly devoted for the long haul. You show love through loyalty, effort, and building a future together. You value stability, respect, and shared ambition. Let your guard down sooner; the warmth beneath your composed exterior is a gift worth showing before someone has fully earned it.",
    Aquarius: "Venus in Aquarius loves as a friend first. You are drawn to independent, original people and need mental connection and freedom as much as affection. You express love in unconventional ways and resist anything that feels possessive. You value friendship, honesty, and space to be yourself. The growth edge is emotional closeness, letting a partner past the cool exterior into genuine intimacy.",
    Pisces: "Venus in Pisces loves dreamily and without limits. You are deeply romantic, compassionate, and drawn to soul connections that feel almost fated. You give of yourself completely and see the best in those you love. You value tenderness, imagination, and emotional union. The lesson is boundaries; because you love so selflessly, you must make sure you are cherished as generously as you cherish others.",
  };

  // ---------- Astronomy ----------
  // Geocentric ecliptic longitude of Venus, tropical (equinox of date),
  // from the JPL "Approximate Positions of the Planets" Keplerian elements
  // (Standish, valid 1800-2050). Validated against documented natal charts.
  // Geocentric, so birth place matters only through its timezone.

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
    venus: {
      base: [0.72333566, 0.00677672, 3.39467605, 181.97909950, 131.60246718, 76.67984255],
      rate: [0.00000390, -0.00004107, -0.00078890, 58517.81538729, 0.00268329, -0.27769418],
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

  function venusLongitude(utcMs) {
    var jd = utcMs / 86400000 + 2440587.5;
    var T = (jd - 2451545.0) / 36525;
    var earth = helio("emb", T);
    var venus = helio("venus", T);
    var lonJ2000 = mod360(Math.atan2(venus.y - earth.y, venus.x - earth.x) / D2R);
    var precession = (5029.0966 * T + 1.11113 * T * T) / 3600;
    return mod360(lonJ2000 + precession);
  }

  function venusSign(year, month, day, hour, minute, tz) {
    var lng = venusLongitude(localToUtcMs(year, month, day, hour, minute, tz));
    return { sign: SIGNS[Math.floor(lng / 30)], degree: Math.floor(lng % 30) };
  }

  // ---------- Styles ----------

  var FONT = "'Segoe UI','Helvetica Neue',Helvetica,Arial,sans-serif";
  var GOLD = "#e8a75e";

  var CSS = "" +
    ":host{all:initial;display:block}" +
    "*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}" +
    ".wrap{position:relative;font-family:" + FONT + ";color:#fff;" +
    "background:#0a0a16 url('" + ORIGIN + "/embed/img/mars/space.jpg') center/cover no-repeat;" +
    "padding:56px 24px 52px;overflow:hidden;line-height:1.65;transition:background-color .4s ease}" +
        ".inner{position:relative;max-width:860px;margin:0 auto}" +
    ".title{font-family:'Great Vibes',cursive;font-weight:400;font-size:clamp(44px,7vw,74px);color:" + GOLD + ";" +
    "text-align:center;text-shadow:0 2px 12px rgba(0,0,0,.5);margin-bottom:10px}" +
    ".flourish{display:flex;align-items:center;justify-content:center;gap:10px;max-width:640px;margin:0 auto 30px;color:" + GOLD + "}" +
    ".flourish .fline{flex:1;height:2px;background:" + GOLD + "}" +
    ".intro{font-size:19px;text-align:center;text-shadow:0 1px 6px rgba(0,0,0,.55);margin:0 auto 30px;max-width:820px}" +
    ".row{display:flex;align-items:center;gap:14px;margin-bottom:18px;flex-wrap:wrap}" +
    ".lbl{flex:0 0 130px;font-weight:700;font-size:20px;text-shadow:0 1px 4px rgba(0,0,0,.6)}" +
    ".fields{display:flex;gap:12px;flex:1;min-width:260px}" +
    "select,.place{appearance:none;-webkit-appearance:none;width:100%;padding:13px 34px 13px 16px;font-size:19px;" +
    "font-family:" + FONT + ";color:#fff;background-color:rgba(16,16,30,.75);border:1.5px solid rgba(255,255,255,.9);" +
    "border-radius:8px;outline:none;text-shadow:0 1px 3px rgba(0,0,0,.4)}" +
    "select{background-image:url(\"data:image/svg+xml;charset=utf-8,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='8'%3E%3Cpath d='M1 1l5 5 5-5' stroke='white' stroke-width='1.6' fill='none'/%3E%3C/svg%3E\");" +
    "background-repeat:no-repeat;background-position:right 12px center;cursor:pointer}" +
    "select:focus,.place:focus{border-color:#fff;box-shadow:0 0 0 2px rgba(255,255,255,.25)}" +
    "select option{color:#1c1c2e;background:#fff;text-shadow:none}" +
    ".sel{flex:1}" +
    ".place::placeholder{color:rgba(255,255,255,.7)}" +
    ".placewrap{position:relative;flex:1}" +
    ".drop{position:absolute;top:calc(100% + 2px);left:0;right:0;background:#fff;border-radius:6px;" +
    "box-shadow:0 10px 30px rgba(0,0,0,.5);z-index:30;max-height:280px;overflow-y:auto;display:none}" +
    ".drop.open{display:block}" +
    ".opt{padding:14px 18px;font-size:18px;color:#26263a;cursor:pointer;border-bottom:1px solid #efeff4;text-shadow:none}" +
    ".opt:last-child{border-bottom:0}" +
    ".opt:hover,.opt.hi{background:#efe9f7}" +
    ".actions{text-align:center;margin-top:30px}" +
    ".btn{display:inline-block;font-family:" + FONT + ";font-size:19px;font-weight:600;letter-spacing:.5px;color:#241505;" +
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
    "background:rgba(255,255,255,.05);padding:38px 34px}" +
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
    ".meaning p{font-size:18.5px;margin-bottom:14px;text-shadow:0 1px 4px rgba(0,0,0,.25)}" +
    ".meaning p:last-child{margin-bottom:0}" +
    ".outro{max-width:780px;margin:30px auto 0;text-align:center;font-size:18.5px;text-shadow:0 1px 5px rgba(0,0,0,.3)}" +
    ".cta{display:inline-block;font-family:" + FONT + ";font-size:20px;font-weight:600;color:#241505;text-decoration:none;" +
    "background:linear-gradient(180deg,#f2b26d," + GOLD + ");border-radius:999px;padding:16px 46px;" +
    "box-shadow:0 4px 16px rgba(0,0,0,.3);transition:transform .15s ease}" +
    ".cta:hover{transform:translateY(-1px)}" +
    ".retry{display:inline-block;font-family:" + FONT + ";font-size:18px;font-weight:700;letter-spacing:2px;" +
    "color:" + GOLD + ";background:none;border:none;cursor:pointer;text-shadow:0 1px 4px rgba(0,0,0,.3);padding:6px 10px;margin-top:8px}" +
    ".retry:hover{color:#f2c088}" +
    "@media(max-width:640px){" +
    ".lbl{flex:1 0 100%}" +
    ".cols{flex-direction:column}" +
    ".art{flex-basis:auto;max-width:250px}" +
    ".divider{display:none}" +
    ".result{padding:26px 18px}" +
    ".wrap{padding:40px 14px 44px}}";

  var FLOURISH_END = "<svg width='26' height='26' viewBox='0 0 26 26' fill='none' xmlns='http://www.w3.org/2000/svg'>" +
    "<path d='M2 13 C 8 13, 10 7, 13 7 C 16 7, 16 11, 13 11 C 10 11, 10 5, 15 4' stroke='currentColor' stroke-width='1.6' fill='none' stroke-linecap='round'/>" +
    "<path d='M2 13 C 8 13, 10 19, 13 19 C 16 19, 16 15, 13 15 C 10 15, 10 21, 15 22' stroke='currentColor' stroke-width='1.6' fill='none' stroke-linecap='round'/></svg>";

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
      "<h2 class='title'>Venus Sign Calculator</h2>" +
      "<div class='flourish'>" + FLOURISH_END + "<div class='fline'></div>" +
      "<svg width='26' height='26' style='transform:scaleX(-1)' viewBox='0 0 26 26' fill='none' xmlns='http://www.w3.org/2000/svg'>" +
      "<path d='M2 13 C 8 13, 10 7, 13 7 C 16 7, 16 11, 13 11 C 10 11, 10 5, 15 4' stroke='currentColor' stroke-width='1.6' fill='none' stroke-linecap='round'/>" +
      "<path d='M2 13 C 8 13, 10 19, 13 19 C 16 19, 16 15, 13 15 C 10 15, 10 21, 15 22' stroke='currentColor' stroke-width='1.6' fill='none' stroke-linecap='round'/></svg></div>" +
      "<div class='screen-form'>" +
      "<p class='intro'>Venus is the planet of love, beauty, and what your heart values most. Its position in your chart reveals how you give and receive affection, what draws you in, and the kind of relationship that truly satisfies you. Learn what your Venus sign says about your love nature.</p>" +
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
      "<div class='actions'><button class='btn' type='button'>Reveal My Venus Sign</button></div>" +
      "<div class='err' role='alert'></div>" +
      "</div>" +
      "<div class='screen-result' aria-live='polite'>" +
      "<div class='result'><div class='cols'>" +
      "<div class='art'><img alt='' loading='lazy'><div class='signname'></div></div>" +
      "<div class='divider'></div>" +
      "<div class='meaning'><div class='rname'></div><div class='deg'></div><div class='mtext'></div></div>" +
      "</div></div>" +
      "<p class='outro'>Venus is just one of the many planets that influences your astrological chart. Learn more about what sign your other planets fall into to see how all these puzzle pieces come together in your unique one-of-a-kind self.</p>" +
      cta +
      "<div class='actions'><button class='retry' type='button'>&#8592; RETRY</button></div>" +
      "</div>" +
      "</div></div>";
  }

  // ---------- Behavior ----------

  function init(host) {
    if (host.__psVenusSign) return;
    host.__psVenusSign = true;

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
    var wrap = $(".wrap");

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
      var r = venusSign(year, month, day, hour, +v("minute"), chosen.timezone);

      $(".rname").textContent = "Venus in " + r.sign;
      $(".deg").textContent = "Your Venus sits at " + r.degree + "° " + r.sign + ".";
      $(".signname").textContent = r.sign;
      $(".mtext").innerHTML = "<p>" + MEANINGS[r.sign] + "</p>";
      var img = $(".art img");
      img.src = ORIGIN + "/embed/img/mars/" + r.sign.toLowerCase() + ".png";
      img.alt = r.sign + " line art illustration";
      formScreen.classList.add("hidden");
      resultScreen.classList.add("active");
      wrap.scrollIntoView({ behavior: "smooth", block: "start" });
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
      wrap.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  }

  function boot() {
    var host = document.getElementById("ps-venus-sign") || document.querySelector("[data-ps-widget='venus-sign']");
    if (host) init(host);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})();
