/* Mercury Sign Calculator embed (results show Mercury's house placement).
 * Usage on any site:
 *   <div id="ps-mercury-house"></div>
 *   <script async src="https://psychic-source-platform.vercel.app/embed/mercury-house.js"></script>
 * Renders directly into the page (Shadow DOM), no iframe.
 * City search data derived from GeoNames.org, licensed CC BY 4.0.
 */
(function () {
  "use strict";

  var SCRIPT_SRC = (document.currentScript && document.currentScript.src) || "";
  var ORIGIN = SCRIPT_SRC ? new URL(SCRIPT_SRC).origin : "https://psychic-source-platform.vercel.app";

  // Set to a destination URL pattern to show the CTA button, e.g.
  // "https://www.psychicsource.com/mercury/house-{n}".
  var CTA_URL_PATTERN = "";

  var ORDINALS = ["", "First", "Second", "Third", "Fourth", "Fifth", "Sixth",
    "Seventh", "Eighth", "Ninth", "Tenth", "Eleventh", "Twelfth"];

  var HOUSES = {
    1: {
      talents: "Debate and self-expression", strengths: "Quick wit", weaknesses: "Impulsive words",
      text: "You think out loud and the world listens. With Mercury in your first house, your intelligence is the first thing people notice: quick, curious, and always in motion. You express your identity through words and ideas, and conversation is how you meet life. Guard against letting the first thought win; your sharpest insights arrive a breath after the impulse to speak.",
    },
    2: {
      talents: "Business and trade", strengths: "Communication", weaknesses: "Rigidity",
      text: "You're a deeply intellectual individual with a knack for numbers. You're great with any type of business dealing that involves careful calculations, as math comes very naturally to you. While you can excel at nearly any business project, you need to do it at your own pace and don't respond well to being rushed. You dislike multitasking and prefer to focus on, and thoroughly solve, one problem at a time.",
    },
    3: {
      talents: "Writing and languages", strengths: "Curiosity, versatility", weaknesses: "Scattered focus",
      text: "Mercury rules the third house, so your mind is in its element here. Words, ideas, and connections come to you effortlessly, and you likely have a gift for writing, teaching, or storytelling. Siblings and neighbors play a meaningful role in your life. Your curiosity is endless, which is both your engine and your challenge: choose a few interests and go deep, and your natural brilliance compounds.",
    },
    4: {
      talents: "Family history, memory", strengths: "Emotional intelligence", weaknesses: "Overthinking the past",
      text: "Your sharpest thinking happens close to home. With Mercury in the fourth house, you carry your family's stories, and you often become the one who remembers, explains, and connects the generations. You analyze feelings as naturally as facts, and working from home suits you. Be careful not to replay old conversations on a loop; some chapters are meant to be understood once and then closed.",
    },
    5: {
      talents: "Storytelling, performance", strengths: "Playful creativity", weaknesses: "Restless hobbies",
      text: "Mercury in the fifth house gives your mind a flair for drama and play. You express ideas creatively, whether through writing, games, performance, or sheer charisma in conversation, and your humor draws people in. You may hop between hobbies, mastering the interesting parts and moving on. Romance for you begins in the mind: banter is your love language, and a clever partner keeps your heart engaged.",
    },
    6: {
      talents: "Organization, analysis", strengths: "Precision, planning", weaknesses: "Worry over details",
      text: "Your mind excels at making things work. Mercury in the sixth house gives you a talent for analysis, systems, and the kind of detail work that others find exhausting. Colleagues rely on your clear thinking, and your health benefits from the same careful research you bring to everything else. The mind that catches every detail can also worry over each one; schedule rest for your thoughts the way you schedule your tasks.",
    },
    7: {
      talents: "Negotiation, counsel", strengths: "Listening, fairness", weaknesses: "Depending on feedback",
      text: "Mercury in the seventh house thinks best in dialogue. You understand your own ideas by discussing them, and you have a real gift for negotiation, mediation, and seeing the other side. Partners tend to be talkative, clever people, because mental connection is non-negotiable for you. Just be sure your own voice stays in the conversation; agreement feels good, but honesty keeps partnerships alive.",
    },
    8: {
      talents: "Research, investigation", strengths: "Depth, discretion", weaknesses: "Suspicious thinking",
      text: "Your mind is drawn to what lies beneath. Mercury in the eighth house makes you a natural researcher, investigator, and keeper of secrets, and people confide in you because you understand what most miss. Finances, psychology, and mysteries suit your intellect. Watch the tendency to dig for hidden motives where there are none; not every silence hides a secret.",
    },
    9: {
      talents: "Teaching, publishing", strengths: "Vision, philosophy", weaknesses: "Preachiness",
      text: "Mercury in the ninth house gives you a mind built for big ideas. You think in philosophies, cultures, and possibilities, and you love sharing what you discover through teaching, travel stories, or writing. Foreign languages and distant places call to you. Your enthusiasm for truth is contagious; just remember that the best teachers stay students, and other people's maps are worth reading too.",
    },
    10: {
      talents: "Public speaking, strategy", strengths: "Professional communication", weaknesses: "Overworked mind",
      text: "Your intellect is made for the public stage. Mercury in the tenth house ties your career to communication: speaking, writing, planning, or any work where your ideas carry your reputation. Authority figures notice your competence early, and you think strategically about your path. Give your career-mind evenings off; your best professional ideas often arrive while you are resting.",
    },
    11: {
      talents: "Networking, group ideas", strengths: "Collaboration, innovation", weaknesses: "Swayed by the crowd",
      text: "Mercury in the eleventh house thinks in networks. You connect people, ideas, and causes effortlessly, and friends treasure your advice. Groups run smarter with you in them, and your vision of the future is often ahead of its time. You gather perspectives widely; just remember to keep your own conclusions. A hundred opinions are data, but your judgment is the compass.",
    },
    12: {
      talents: "Intuition, poetic mind", strengths: "Imagination, empathy", weaknesses: "Unspoken thoughts",
      text: "Your mind works in the quiet. Mercury in the twelfth house thinks in symbols, dreams, and intuitions, and your best ideas surface in solitude, often arriving whole as if from somewhere else. You understand what people mean beneath their words. Writing or meditation helps your thoughts find daylight. Speak your insights more often; the world needs the things you almost said.",
    },
  };

  // ---------- Astronomy ----------
  // Mercury geocentric longitude (JPL Standish elements) and Placidus house
  // cusps. Validated against documented natal charts and the 2023 Mercury
  // retrograde stations.

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
    mercury: {
      base: [0.38709927, 0.20563593, 7.00497902, 252.25032350, 77.45779628, 48.33076593],
      rate: [0.00000037, 0.00001906, -0.00594749, 149472.67411175, 0.16047689, -0.12534081],
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
    for (var i = 0; i < 20; i++) {
      var dM = M - (E - eStar * Math.sin(E * D2R));
      var dE = dM / (1 - e * Math.cos(E * D2R));
      E += dE;
      if (Math.abs(dE) < 1e-9) break;
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

  function mercuryLongitude(utcMs) {
    var jd = utcMs / 86400000 + 2440587.5;
    var T = (jd - 2451545.0) / 36525;
    var earth = helio("emb", T);
    var merc = helio("mercury", T);
    var lonJ2000 = mod360(Math.atan2(merc.y - earth.y, merc.x - earth.x) / D2R);
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

  function mercuryHouse(year, month, day, hour, minute, tz, lat, lon) {
    var utcMs = localToUtcMs(year, month, day, hour, minute, tz);
    var lng = mercuryLongitude(utcMs);
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
    "background:#122438 url('" + ORIGIN + "/embed/img/mercury/nebula.jpg') center/cover no-repeat;" +
    "padding:52px 24px 52px;overflow:hidden;line-height:1.65}" +
    ".inner{position:relative;max-width:880px;margin:0 auto}" +
    ".badge{width:120px;height:120px;border-radius:50%;background:#0c0c18;margin:0 auto 18px;position:relative;" +
    "box-shadow:0 6px 24px rgba(0,0,0,.5);overflow:hidden;display:none}" +
    ".badge.show{display:block}" +
    ".badge img{position:absolute;inset:10px;width:100px;height:100px}" +
    ".badge svg{position:absolute;inset:0;margin:auto}" +
    ".title{font-family:'Great Vibes',cursive;font-weight:400;font-size:clamp(42px,6.5vw,68px);color:" + GOLD + ";" +
    "text-align:center;text-shadow:0 2px 12px rgba(0,0,0,.5);margin-bottom:8px;line-height:1.25}" +
    ".flourish{display:flex;align-items:center;justify-content:center;gap:10px;max-width:640px;margin:0 auto 28px;color:" + GOLD + "}" +
    ".flourish .fline{flex:1;height:1.5px;background:" + GOLD + "}" +
    ".intro{font-size:19px;text-align:center;text-shadow:0 1px 6px rgba(0,0,0,.55);margin:0 auto 30px;max-width:800px}" +
    ".row{display:flex;align-items:center;gap:14px;margin-bottom:18px;flex-wrap:wrap}" +
    ".lbl{flex:0 0 130px;font-weight:700;font-size:20px;text-shadow:0 1px 4px rgba(0,0,0,.6)}" +
    ".fields{display:flex;gap:12px;flex:1;min-width:260px}" +
    "select,.place{appearance:none;-webkit-appearance:none;width:100%;padding:13px 34px 13px 16px;font-size:19px;" +
    "font-family:" + FONT + ";color:#fff;background-color:rgba(14,30,48,.7);border:1.5px solid rgba(255,255,255,.9);" +
    "border-radius:8px;outline:none;text-shadow:0 1px 3px rgba(0,0,0,.4)}" +
    "select{background-image:url(\"data:image/svg+xml;charset=utf-8,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='8'%3E%3Cpath d='M1 1l5 5 5-5' stroke='white' stroke-width='1.6' fill='none'/%3E%3C/svg%3E\");" +
    "background-repeat:no-repeat;background-position:right 12px center;cursor:pointer}" +
    "select:focus,.place:focus{border-color:#fff;box-shadow:0 0 0 2px rgba(255,255,255,.25)}" +
    "select option{color:#1c2c3c;background:#fff;text-shadow:none}" +
    ".sel{flex:1}" +
    ".place::placeholder{color:rgba(255,255,255,.7)}" +
    ".placewrap{position:relative;flex:1}" +
    ".drop{position:absolute;top:calc(100% + 2px);left:0;right:0;background:#fff;border-radius:6px;" +
    "box-shadow:0 10px 30px rgba(0,0,0,.5);z-index:30;max-height:280px;overflow-y:auto;display:none}" +
    ".drop.open{display:block}" +
    ".opt{padding:14px 18px;font-size:18px;color:#243240;cursor:pointer;border-bottom:1px solid #eef1f4;text-shadow:none}" +
    ".opt:last-child{border-bottom:0}" +
    ".opt:hover,.opt.hi{background:#e8eff5}" +
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
    ".card{border:1px solid rgba(255,255,255,.6);border-radius:6px;background:rgba(10,24,40,.35);padding:36px 26px}" +
    ".cols3{display:flex;align-items:stretch}" +
    ".col{flex:1;text-align:center;padding:0 18px}" +
    ".col + .col{border-left:1px solid rgba(255,255,255,.45)}" +
    ".cicon{width:110px;height:110px;border-radius:50%;background:#fff;margin:0 auto 18px;display:flex;align-items:center;justify-content:center;box-shadow:0 4px 14px rgba(0,0,0,.35)}" +
    ".cicon img{width:78px;height:78px}" +
    ".chead{font-family:Georgia,'Times New Roman',serif;font-size:26px;color:" + GOLD + ";margin-bottom:10px}" +
    ".cval{font-family:Georgia,'Times New Roman',serif;font-size:20px}" +
    ".rtext{font-family:Georgia,'Times New Roman',serif;font-size:20px;text-align:center;max-width:840px;" +
    "margin:30px auto 0;text-shadow:0 1px 5px rgba(0,0,0,.5)}" +
    ".cta{display:inline-block;font-family:Georgia,serif;font-size:20px;color:#2b1a06;text-decoration:none;" +
    "background:linear-gradient(180deg,#f2b26d," + GOLD + ");border-radius:999px;padding:16px 46px;" +
    "box-shadow:0 4px 16px rgba(0,0,0,.35);transition:transform .15s ease}" +
    ".cta:hover{transform:translateY(-1px)}" +
    ".notewrap{margin-top:38px}" +
    ".arch{display:flex;align-items:flex-end;color:" + GOLD + "}" +
    ".arch .aline{flex:1;height:1.5px;background:" + GOLD + ";margin-bottom:1px}" +
    ".arch.flip{transform:scaleY(-1)}" +
    ".note{font-family:Georgia,'Times New Roman',serif;font-size:19.5px;text-align:center;max-width:820px;" +
    "margin:22px auto;text-shadow:0 1px 5px rgba(0,0,0,.5)}" +
    ".retry{display:inline-block;font-family:" + FONT + ";font-size:19px;font-weight:600;" +
    "color:#fff;background:none;border:none;cursor:pointer;text-shadow:0 1px 4px rgba(0,0,0,.5);padding:6px 10px;margin-top:4px}" +
    ".retry:hover{color:" + GOLD + "}" +
    "@media(max-width:640px){" +
    ".lbl{flex:1 0 100%}" +
    ".cols3{flex-direction:column;gap:26px}" +
    ".col + .col{border-left:0;border-top:1px solid rgba(255,255,255,.4);padding-top:24px}" +
    ".card{padding:26px 16px}" +
    ".wrap{padding:40px 14px 44px}}";

  var FLOURISH_END = "<svg width='30' height='24' viewBox='0 0 30 24' fill='none' xmlns='http://www.w3.org/2000/svg'>" +
    "<path d='M28 12 L10 12 M14 12 C 10 8, 5 7, 3 10 C 1 13, 5 15, 7 12 M14 12 C 10 16, 5 17, 3 14' stroke='currentColor' stroke-width='1.5' fill='none' stroke-linecap='round'/>" +
    "<circle cx='6' cy='5' r='2.4' stroke='currentColor' stroke-width='1.4' fill='none'/>" +
    "<circle cx='6' cy='19' r='2.4' stroke='currentColor' stroke-width='1.4' fill='none'/></svg>";

  var ARCH_SVG = "<svg width='150' height='26' viewBox='0 0 150 26' fill='none' xmlns='http://www.w3.org/2000/svg'>" +
    "<path d='M0 24 L40 24 C 46 10, 60 2, 75 2 C 90 2, 104 10, 110 24 L150 24' stroke='currentColor' stroke-width='1.6' fill='none'/>" +
    "<path d='M55 24 C 58 14, 66 8, 75 8 C 84 8, 92 14, 95 24' stroke='currentColor' stroke-width='1.6' fill='none'/>" +
    "<path d='M75 8 L75 20' stroke='currentColor' stroke-width='1.6'/></svg>";

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
      "<div class='badge'><img alt='Planet Mercury' src='" + ORIGIN + "/embed/img/mercury/planet.png'><span class='bsvg'></span></div>" +
      "<h2 class='title'>Mercury Sign Calculator</h2>" +
      "<div class='flourish'>" + FLOURISH_END + "<div class='fline'></div>" +
      "<span style='transform:scaleX(-1);display:inline-flex'>" + FLOURISH_END + "</span></div>" +
      "<div class='screen-form'>" +
      "<p class='intro'>Mercury rules over intellect and communication. Its position in your chart says a lot about how you think and analyze things. Understanding where Mercury is in your chart can give you powerful insights into the best career choices for your particular skills.</p>" +
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
      "<div class='actions'><button class='btn' type='button'>Reveal My Mercury Placement</button></div>" +
      "<div class='err' role='alert'></div>" +
      "</div>" +
      "<div class='screen-result' aria-live='polite'>" +
      "<div class='rtitle'></div><div class='deg'></div>" +
      "<div class='card'><div class='cols3'>" +
      "<div class='col'><div class='cicon'><img alt='' src='" + ORIGIN + "/embed/img/mercury/talents.png'></div><div class='chead'>Talents</div><div class='cval' data-v='talents'></div></div>" +
      "<div class='col'><div class='cicon'><img alt='' src='" + ORIGIN + "/embed/img/mercury/strengths.png'></div><div class='chead'>Strengths</div><div class='cval' data-v='strengths'></div></div>" +
      "<div class='col'><div class='cicon'><img alt='' src='" + ORIGIN + "/embed/img/mercury/weaknesses.png'></div><div class='chead'>Weaknesses</div><div class='cval' data-v='weaknesses'></div></div>" +
      "</div></div>" +
      "<p class='rtext'></p>" +
      "<div class='actions cta-slot'></div>" +
      "<div class='notewrap'>" +
      "<div class='arch'><div class='aline'></div>" + ARCH_SVG + "<div class='aline'></div></div>" +
      "<p class='note'>It's important to note that Mercury's position cannot be properly analyzed without also considering the planets in your other houses. For an in-depth look at your astrological chart, contact a psychic. This will help you dig deeper and fully understand the influence that all of the planets have on you.</p>" +
      "<div class='arch flip'><div class='aline'></div>" + ARCH_SVG + "<div class='aline'></div></div>" +
      "</div>" +
      "<div class='actions'><button class='retry' type='button'>&#171; Start Again</button></div>" +
      "</div>" +
      "</div></div>";
  }

  // ---------- Behavior ----------

  function init(host) {
    if (host.__psMercuryHouse) return;
    host.__psMercuryHouse = true;

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
      var r = mercuryHouse(year, month, day, hour, +v("minute"), chosen.timezone, chosen.lat, chosen.lon);
      var content = HOUSES[r.house];
      var ordinal = ORDINALS[r.house];

      $(".rtitle").textContent = "Mercury in the " + ordinal + " House";
      var SIGNS = ["Aries", "Taurus", "Gemini", "Cancer", "Leo", "Virgo", "Libra", "Scorpio", "Sagittarius", "Capricorn", "Aquarius", "Pisces"];
      $(".deg").textContent = "Your Mercury sits at " + Math.floor(r.longitude % 30) + "° " + SIGNS[Math.floor(r.longitude / 30)] + " in your " + ordinal.toLowerCase() + " house.";
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
        a.textContent = "Continue reading about Mercury in the " + ordinal + " House";
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
    var host = document.getElementById("ps-mercury-house") || document.querySelector("[data-ps-widget='mercury-house']");
    if (host) init(host);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})();
