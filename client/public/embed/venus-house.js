/* Venus House Calculator embed.
 * Usage on any site:
 *   <div id="ps-venus-house"></div>
 *   <script async src="https://psychic-source-platform.vercel.app/embed/venus-house.js"></script>
 * Renders directly into the page (Shadow DOM), no iframe.
 * City search data derived from GeoNames.org, licensed CC BY 4.0.
 */
(function () {
  "use strict";

  var SCRIPT_SRC = (document.currentScript && document.currentScript.src) || "";
  var ORIGIN = SCRIPT_SRC ? new URL(SCRIPT_SRC).origin : "https://psychic-source-platform.vercel.app";

  // Set to a destination URL pattern to show the CTA button on the result
  // screen, e.g. "https://www.psychicsource.com/venus/house-{n}".
  var CTA_URL_PATTERN = "";

  var ORDINALS = ["", "First", "Second", "Third", "Fourth", "Fifth", "Sixth",
    "Seventh", "Eighth", "Ninth", "Tenth", "Eleventh", "Twelfth"];

  var HOUSES = {
    1: {
      talents: "Making memorable first impressions", strengths: "Charm, natural style", weaknesses: "Focused on appearances",
      text: "With Venus in your first house, charm arrives before you say a word. People are drawn to your warmth, your style, and the easy grace you bring into a room. You have a gift for making things around you more beautiful, starting with yourself. Take care not to measure your worth by admiration alone; the affection you attract deepens when you let people past the lovely surface.",
    },
    2: {
      talents: "Attracting money and beautiful things", strengths: "Loyalty, patience", weaknesses: "Overindulgence",
      text: "Venus in your second house ties love and comfort together. You have a natural talent for attracting resources and surrounding yourself with quality, and you show affection through generous, tangible care. Stability in love matters as much as passion to you. Watch the urge to soothe feelings with spending or rich pleasures; your real security comes from the steady, patient devotion you give and deserve in return.",
    },
    3: {
      talents: "Poetry and literature", strengths: "Mediation, flexibility", weaknesses: "Hesitant to spend money",
      text: "Harmonious partnerships feel like second nature with Venus residing in your third house. You find it easy to maintain strong relationships with family members and neighbors. Peace and harmony come easily to you, and you often inspire these easygoing feelings in those around you. However, you're a force to be reckoned with when upset.",
    },
    4: {
      talents: "Homemaking, hosting", strengths: "Deep family devotion", weaknesses: "Clinging to the past",
      text: "Venus in the fourth house makes home your heart's true workshop. You create spaces that feel warm and welcoming, and the people you love feel it the moment they walk in. Family bonds run deep, and you often become the emotional glue of your household. Be mindful of holding onto what was; some comforts belong to the past, and your gift for nurturing deserves a present tense.",
    },
    5: {
      talents: "Creative and performing arts", strengths: "Playfulness, romance", weaknesses: "Craving attention",
      text: "With Venus in your fifth house, love and creativity share the same spark. Romance feels like art to you, full of gestures, playfulness, and delight, and you bring that same joy to everything you create. Children and lighthearted people are drawn to your warmth. Just watch the need for constant applause; your charm does not depend on an audience, and quiet love counts as much as grand scenes.",
    },
    6: {
      talents: "Caring for others, crafts", strengths: "Devotion through service", weaknesses: "Perfectionism in love",
      text: "Venus in the sixth house expresses love through everyday devotion. You show you care by helping, fixing, remembering, and quietly making life run smoother for the people who matter. Work friendships often blossom for you, and beauty shows up in your routines and craft. Remember that love does not need to be earned through usefulness; let others take care of you too.",
    },
    7: {
      talents: "Diplomacy, partnership", strengths: "Commitment, fairness", weaknesses: "Losing yourself in others",
      text: "Venus rules partnership, and in your seventh house it feels completely at home. You are built for committed, balanced relationships, and you bring out the best in the people you pair with, in love and in business alike. Harmony with a partner nourishes you deeply. The lesson is to stay a whole person inside the pair; a great partnership is two full hearts, not one dissolved into the other.",
    },
    8: {
      talents: "Deep emotional insight", strengths: "Passion, loyalty", weaknesses: "Jealousy, possessiveness",
      text: "Venus in the eighth house loves with depth and intensity. Surface romance holds little interest; you want soul-level bonds, complete trust, and transformation through intimacy. Shared resources often flow well for you, and others trust you with what is precious. The shadow side is holding too tightly. Love deepens when held with open hands, and your intensity becomes a gift when it is offered rather than imposed.",
    },
    9: {
      talents: "Languages, travel, teaching", strengths: "Open-mindedness", weaknesses: "Restless in love",
      text: "With Venus in your ninth house, love is an adventure and beauty lives on the horizon. You are drawn to people from different cultures and backgrounds, and shared beliefs or journeys bind you closer than routine ever could. You find romance in ideas, travel, and meaning. Beware of chasing the next horizon so eagerly that you overlook the love already beside you; some adventures deepen by staying.",
    },
    10: {
      talents: "Public grace, artistic career", strengths: "Professional charm", weaknesses: "Image over intimacy",
      text: "Venus in the tenth house brings charm into your public life. People in authority tend to like you, your reputation benefits from genuine warmth, and careers touching beauty, art, or diplomacy suit you well. You may be admired from afar more than you realize. Make sure your private heart gets the same care as your public image; being adored by many is no substitute for being known by one.",
    },
    11: {
      talents: "Building community", strengths: "Friendship, idealism", weaknesses: "Keeping love casual",
      text: "With Venus in your eleventh house, love often begins as friendship. Your social circle is wide and warm, people genuinely enjoy your company, and groups run smoother when you are in them. Shared dreams and causes draw you close to others. The growth edge is depth: keeping everything friendly and light can protect you from intimacy. Your best relationships are friendships that dared to become more.",
    },
    12: {
      talents: "Art, music, healing", strengths: "Compassion, selflessness", weaknesses: "Secret or self-denying love",
      text: "Venus in the twelfth house loves quietly and deeply. Your compassion extends to people others overlook, and your creativity draws from somewhere beyond the everyday. You may keep feelings private, or give love without asking anything back. There is great beauty in that, and one caution: do not hide your heart so well that no one can find it. You deserve the tenderness you so freely give.",
    },
  };

  // ---------- Astronomy ----------
  // Venus geocentric longitude from the JPL "Approximate Positions of the
  // Planets" elements, and Placidus house cusps derived from the semi-arc
  // definition. Both validated against documented natal charts.

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

  function gmstDeg(utcMs) {
    var jd = utcMs / 86400000 + 2440587.5;
    var T = (jd - 2451545.0) / 36525;
    return mod360(280.46061837 + 360.98564736629 * (jd - 2451545.0)
      + 0.000387933 * T * T - (T * T * T) / 38710000);
  }

  function obliquityDeg(utcMs) {
    var jd = utcMs / 86400000 + 2440587.5;
    var T = (jd - 2451545.0) / 36525;
    return 23.4392911 - 0.0130042 * T - 1.64e-7 * T * T + 5.04e-7 * T * T * T;
  }

  function eclFromRa(raDeg, epsDeg) {
    var ra = raDeg * D2R, eps = epsDeg * D2R;
    return mod360(Math.atan2(Math.sin(ra), Math.cos(ra) * Math.cos(eps)) / D2R);
  }

  function decFromEcl(lamDeg, epsDeg) {
    return Math.asin(Math.sin(lamDeg * D2R) * Math.sin(epsDeg * D2R)) / D2R;
  }

  function ascendantDeg(utcMs, latDeg, lonDeg) {
    var ramc = mod360(gmstDeg(utcMs) + lonDeg) * D2R;
    var eps = obliquityDeg(utcMs) * D2R;
    var phi = latDeg * D2R;
    var asc = Math.atan2(Math.cos(ramc), -(Math.sin(ramc) * Math.cos(eps) + Math.tan(phi) * Math.sin(eps)));
    return mod360(asc / D2R);
  }

  function placidusCusp(ramcDeg, latDeg, epsDeg, offsetDeg, fraction, nocturnal) {
    var ra = mod360(ramcDeg + offsetDeg);
    for (var i = 0; i < 60; i++) {
      var lam = eclFromRa(ra, epsDeg);
      var dec = decFromEcl(lam, epsDeg);
      var cosH = -Math.tan(latDeg * D2R) * Math.tan(dec * D2R);
      cosH = Math.max(-1, Math.min(1, cosH));
      var sda = Math.acos(cosH) / D2R;
      var target = nocturnal
        ? mod360(ramcDeg + 180 - fraction * (180 - sda))
        : mod360(ramcDeg + fraction * sda);
      if (Math.abs(mod360(target - ra + 180) - 180) < 1e-7) { ra = target; break; }
      ra = target;
    }
    return eclFromRa(ra, epsDeg);
  }

  function placidusCusps(utcMs, latDeg, lonDeg) {
    var eps = obliquityDeg(utcMs);
    var ramc = mod360(gmstDeg(utcMs) + lonDeg);
    var cusps = new Array(13);
    cusps[1] = ascendantDeg(utcMs, latDeg, lonDeg);
    cusps[10] = eclFromRa(ramc, eps);
    cusps[11] = placidusCusp(ramc, latDeg, eps, 30, 1 / 3, false);
    cusps[12] = placidusCusp(ramc, latDeg, eps, 60, 2 / 3, false);
    cusps[2] = placidusCusp(ramc, latDeg, eps, 120, 2 / 3, true);
    cusps[3] = placidusCusp(ramc, latDeg, eps, 150, 1 / 3, true);
    cusps[4] = mod360(cusps[10] + 180);
    cusps[5] = mod360(cusps[11] + 180);
    cusps[6] = mod360(cusps[12] + 180);
    cusps[7] = mod360(cusps[1] + 180);
    cusps[8] = mod360(cusps[2] + 180);
    cusps[9] = mod360(cusps[3] + 180);
    return cusps;
  }

  function houseOf(lonDeg, cusps) {
    for (var h = 1; h <= 12; h++) {
      var a = cusps[h];
      var b = cusps[h === 12 ? 1 : h + 1];
      var span = mod360(b - a);
      if (mod360(lonDeg - a) < span) return h;
    }
    return 12;
  }

  function venusHouse(year, month, day, hour, minute, tz, lat, lon) {
    var utcMs = localToUtcMs(year, month, day, hour, minute, tz);
    var lng = venusLongitude(utcMs);
    var cusps = placidusCusps(utcMs, lat, lon);
    return { house: houseOf(lng, cusps), longitude: lng };
  }

  // ---------- Styles ----------

  var FONT = "'Segoe UI','Helvetica Neue',Helvetica,Arial,sans-serif";
  var GOLD = "#eda45f";

  var CSS = "" +
    ":host{all:initial;display:block}" +
    "*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}" +
    ".wrap{position:relative;font-family:" + FONT + ";color:#fff;" +
    "background:#2c2455 url('" + ORIGIN + "/embed/img/venus/cosmos.jpg') center/cover no-repeat;" +
    "padding:52px 24px 52px;overflow:hidden;line-height:1.65}" +
    ".inner{position:relative;max-width:880px;margin:0 auto}" +
    ".title{font-family:'Great Vibes',cursive;font-weight:400;font-size:clamp(42px,6.5vw,68px);color:" + GOLD + ";" +
    "text-align:center;text-shadow:0 2px 12px rgba(0,0,0,.5);margin-bottom:8px;line-height:1.2}" +
    ".ornament{display:flex;align-items:center;justify-content:center;gap:8px;max-width:460px;margin:0 auto 30px;color:" + GOLD + "}" +
    ".ornament .oline{flex:1;height:2px;background:" + GOLD + "}" +
    ".badge{width:120px;height:120px;border-radius:50%;background:#0c0c18;margin:0 auto 20px;position:relative;" +
    "box-shadow:0 6px 24px rgba(0,0,0,.5);overflow:hidden;display:none}" +
    ".badge.show{display:block}" +
    ".badge img{position:absolute;inset:10px;width:100px;height:100px}" +
    ".badge svg{position:absolute;inset:0;margin:auto}" +
    ".intro{font-size:19px;text-align:center;text-shadow:0 1px 6px rgba(0,0,0,.55);margin:0 auto 30px;max-width:820px}" +
    ".row{display:flex;align-items:center;gap:14px;margin-bottom:18px;flex-wrap:wrap}" +
    ".lbl{flex:0 0 130px;font-weight:700;font-size:20px;text-shadow:0 1px 4px rgba(0,0,0,.6)}" +
    ".fields{display:flex;gap:12px;flex:1;min-width:260px}" +
    "select,.place{appearance:none;-webkit-appearance:none;width:100%;padding:13px 34px 13px 16px;font-size:19px;" +
    "font-family:" + FONT + ";color:#fff;background-color:rgba(24,20,52,.75);border:1.5px solid rgba(255,255,255,.9);" +
    "border-radius:8px;outline:none;text-shadow:0 1px 3px rgba(0,0,0,.4)}" +
    "select{background-image:url(\"data:image/svg+xml;charset=utf-8,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='8'%3E%3Cpath d='M1 1l5 5 5-5' stroke='white' stroke-width='1.6' fill='none'/%3E%3C/svg%3E\");" +
    "background-repeat:no-repeat;background-position:right 12px center;cursor:pointer}" +
    "select:focus,.place:focus{border-color:#fff;box-shadow:0 0 0 2px rgba(255,255,255,.25)}" +
    "select option{color:#262347;background:#fff;text-shadow:none}" +
    ".sel{flex:1}" +
    ".place::placeholder{color:rgba(255,255,255,.7)}" +
    ".placewrap{position:relative;flex:1}" +
    ".drop{position:absolute;top:calc(100% + 2px);left:0;right:0;background:#fff;border-radius:6px;" +
    "box-shadow:0 10px 30px rgba(0,0,0,.5);z-index:30;max-height:280px;overflow-y:auto;display:none}" +
    ".drop.open{display:block}" +
    ".opt{padding:14px 18px;font-size:18px;color:#2a2745;cursor:pointer;border-bottom:1px solid #f0eef6;text-shadow:none}" +
    ".opt:last-child{border-bottom:0}" +
    ".opt:hover,.opt.hi{background:#eee9f8}" +
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
    ".rtitle{font-family:'Great Vibes',cursive;font-weight:400;font-size:clamp(40px,5.5vw,62px);color:" + GOLD + ";" +
    "text-align:center;text-shadow:0 2px 12px rgba(0,0,0,.5);line-height:1.25;margin-bottom:6px}" +
    ".deg{font-size:15px;font-style:italic;text-align:center;color:rgba(255,255,255,.85);margin-bottom:24px;text-shadow:0 1px 4px rgba(0,0,0,.5)}" +
    ".card{border:1.5px solid " + GOLD + ";border-radius:14px;background:rgba(255,255,255,.09);padding:34px 26px}" +
    ".cols3{display:flex;align-items:stretch}" +
    ".col{flex:1;text-align:center;padding:0 18px}" +
    ".col + .col{border-left:1px solid rgba(255,255,255,.55)}" +
    ".col img{width:96px;height:96px;display:block;margin:0 auto 16px}" +
    ".chead{font-family:Georgia,'Times New Roman',serif;font-size:26px;color:" + GOLD + ";margin-bottom:10px}" +
    ".cval{font-family:Georgia,'Times New Roman',serif;font-size:20px}" +
    ".rtext{font-family:Georgia,'Times New Roman',serif;font-size:20px;text-align:center;max-width:820px;" +
    "margin:30px auto 0;text-shadow:0 1px 5px rgba(0,0,0,.5)}" +
    ".cta{display:inline-block;font-family:Georgia,serif;font-size:20px;color:#2b1a06;text-decoration:none;" +
    "background:linear-gradient(180deg,#f2b26d," + GOLD + ");border-radius:999px;padding:16px 46px;" +
    "box-shadow:0 4px 16px rgba(0,0,0,.3);transition:transform .15s ease}" +
    ".cta:hover{transform:translateY(-1px)}" +
    ".retry{display:inline-block;font-family:" + FONT + ";font-size:18px;font-weight:700;letter-spacing:2px;" +
    "color:" + GOLD + ";background:none;border:none;cursor:pointer;text-shadow:0 1px 4px rgba(0,0,0,.4);padding:6px 10px;margin-top:6px}" +
    ".retry:hover{color:#f3c084}" +
    "@media(max-width:640px){" +
    ".lbl{flex:1 0 100%}" +
    ".cols3{flex-direction:column;gap:26px}" +
    ".col + .col{border-left:0;border-top:1px solid rgba(255,255,255,.4);padding-top:24px}" +
    ".card{padding:26px 16px}" +
    ".wrap{padding:40px 14px 44px}}";

  var SCROLL_SVG = "<svg width='64' height='22' viewBox='0 0 64 22' fill='none' xmlns='http://www.w3.org/2000/svg'>" +
    "<path d='M2 11 C 10 11, 14 5, 20 5 C 26 5, 26 15, 20 15 C 15 15, 15 8, 22 7' stroke='currentColor' stroke-width='1.8' fill='none' stroke-linecap='round'/>" +
    "<path d='M62 11 C 54 11, 50 5, 44 5 C 38 5, 38 15, 44 15 C 49 15, 49 8, 42 7' stroke='currentColor' stroke-width='1.8' fill='none' stroke-linecap='round'/>" +
    "<circle cx='32' cy='10' r='3' stroke='currentColor' stroke-width='1.6' fill='none'/></svg>";

  function houseBadgeSvg(n) {
    return "<svg width='70' height='70' viewBox='0 0 70 70' fill='none' xmlns='http://www.w3.org/2000/svg'>" +
      "<path d='M14 34 L35 16 L56 34' stroke='white' stroke-width='3' fill='none' stroke-linecap='round' stroke-linejoin='round'/>" +
      "<path d='M20 30 L20 56 M50 30 L50 56' stroke='white' stroke-width='3' stroke-linecap='round'/>" +
      "<text x='35' y='50' text-anchor='middle' font-family='Georgia,serif' font-size='24' fill='white'>" + n + "</text></svg>";
  }

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

    return "<div class='wrap'><div class='inner'>" +
      "<div class='badge'><img alt='Planet Venus' src='" + ORIGIN + "/embed/img/venus/planet.png'><span class='bsvg'></span></div>" +
      "<h2 class='title'>Venus House Calculator</h2>" +
      "<div class='ornament'><div class='oline'></div>" + SCROLL_SVG + "<div class='oline'></div></div>" +
      "<div class='screen-form'>" +
      "<p class='intro'>In astrology, Venus governs love, beauty, pleasure, and what your heart values most. The house Venus occupies in your birth chart reveals where those gifts shine brightest in your life, from romance and friendship to money and career. Enter your birth date, time, and location below to discover which of the twelve houses Venus calls home in your chart.</p>" +
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
      "<div class='actions'><button class='btn' type='button'>Reveal My Venus House</button></div>" +
      "<div class='err' role='alert'></div>" +
      "</div>" +
      "<div class='screen-result' aria-live='polite'>" +
      "<div class='rtitle'></div><div class='deg'></div>" +
      "<div class='card'><div class='cols3'>" +
      "<div class='col'><img alt='' src='" + ORIGIN + "/embed/img/venus/talents.png'><div class='chead'>Talents</div><div class='cval' data-v='talents'></div></div>" +
      "<div class='col'><img alt='' src='" + ORIGIN + "/embed/img/venus/strengths.png'><div class='chead'>Strengths</div><div class='cval' data-v='strengths'></div></div>" +
      "<div class='col'><img alt='' src='" + ORIGIN + "/embed/img/venus/weaknesses.png'><div class='chead'>Weaknesses</div><div class='cval' data-v='weaknesses'></div></div>" +
      "</div></div>" +
      "<p class='rtext'></p>" +
      "<div class='actions cta-slot'></div>" +
      "<div class='actions'><button class='retry' type='button'>&#8592; RETRY</button></div>" +
      "</div>" +
      "</div></div>";
  }

  // ---------- Behavior ----------

  function init(host) {
    if (host.__psVenusHouse) return;
    host.__psVenusHouse = true;

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
    var badge = $(".badge");

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
      if (!v("hour") || v("minute") === "") return showError("Please select your birth time. Houses shift about every two hours, so the time matters.");
      if (!chosen) return showError("Please choose your birth place from the dropdown list.");

      var day = +v("day"), month = +v("month"), year = +v("year");
      var daysInMonth = new Date(year, month, 0).getDate();
      if (day > daysInMonth) return showError("That date does not exist. Please check the day and month.");

      var hour = (+v("hour")) % 12 + (v("ampm") === "PM" ? 12 : 0);
      var r = venusHouse(year, month, day, hour, +v("minute"), chosen.timezone, chosen.lat, chosen.lon);
      var content = HOUSES[r.house];
      var ordinal = ORDINALS[r.house];

      $(".rtitle").textContent = "Venus in the " + ordinal + " House";
      var SIGNS = ["Aries", "Taurus", "Gemini", "Cancer", "Leo", "Virgo", "Libra", "Scorpio", "Sagittarius", "Capricorn", "Aquarius", "Pisces"];
      $(".deg").textContent = "Your Venus sits at " + Math.floor(r.longitude % 30) + "° " + SIGNS[Math.floor(r.longitude / 30)] + " in your " + ordinal.toLowerCase() + " house.";
      mount.querySelector("[data-v='talents']").textContent = content.talents;
      mount.querySelector("[data-v='strengths']").textContent = content.strengths;
      mount.querySelector("[data-v='weaknesses']").textContent = content.weaknesses;
      $(".rtext").textContent = content.text;
      $(".bsvg").innerHTML = houseBadgeSvg(r.house);
      badge.classList.add("show");

      var slot = $(".cta-slot");
      slot.innerHTML = "";
      if (CTA_URL_PATTERN) {
        var a = document.createElement("a");
        a.className = "cta";
        a.href = CTA_URL_PATTERN.replace("{n}", r.house);
        a.textContent = "Continue reading about Venus in the " + ordinal + " House";
        slot.appendChild(a);
      }

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
      badge.classList.remove("show");
      resultScreen.classList.remove("active");
      formScreen.classList.remove("hidden");
      $(".wrap").scrollIntoView({ behavior: "smooth", block: "start" });
    });
  }

  function boot() {
    var host = document.getElementById("ps-venus-house") || document.querySelector("[data-ps-widget='venus-house']");
    if (host) init(host);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})();
