/* Lunar Node Calculator embed.
 * Usage on any site:
 *   <div id="ps-lunar-node"></div>
 *   <script async src="https://psychic-source-platform.vercel.app/embed/lunar-node.js"></script>
 * Renders directly into the page (Shadow DOM), no iframe.
 * City search data derived from GeoNames.org, licensed CC BY 4.0.
 */
(function () {
  "use strict";

  var SCRIPT_SRC = (document.currentScript && document.currentScript.src) || "";
  var ORIGIN = SCRIPT_SRC ? new URL(SCRIPT_SRC).origin : "https://psychic-source-platform.vercel.app";

  var SIGNS = ["Aries", "Taurus", "Gemini", "Cancer", "Leo", "Virgo",
    "Libra", "Scorpio", "Sagittarius", "Capricorn", "Aquarius", "Pisces"];
  var GLYPHS = ["♈", "♉", "♊", "♋", "♌", "♍", "♎", "♏", "♐", "♑", "♒", "♓"];
  var ORDINAL = ["", "1st", "2nd", "3rd", "4th", "5th", "6th", "7th", "8th", "9th", "10th", "11th", "12th"];

  // Keyed by NORTH node sign; the south node is always the opposite sign.
  var MEANINGS = {
    Aries: "Libra's gift for partnership taught you to accommodate, mediate, and keep everyone happy in the past. Harmony still matters to you, but this lifetime calls you to stand on your own and choose yourself without guilt. Resist the urge to defer, please, and endlessly weigh what others want. Your growth lives in bold, independent action: name your desires, make the decision, and trust that the right people will still love you when you lead your own life.",
    Taurus: "Scorpio's intensity taught you to survive storms, merge deeply with others, and live on the edge of transformation. That depth still runs in you, but this lifetime asks you to build something calm and lasting. Resist the pull toward crisis and other people's resources, and cultivate your own: steady income, simple pleasures, peace you can touch. Your soul grows through patience, self-worth, and the quiet discovery that safety is not boring; it is freedom.",
    Gemini: "Sagittarius made you the seeker in past chapters: certain of the truth, hungry for the horizon, and quick to preach what you found. Conviction still fuels you, but this lifetime asks you to trade the pulpit for curiosity. Resist the urge to have the final answer. Ask questions, listen closely, learn from your neighbors as much as from distant temples. Your growth lives in conversation, flexibility, and the humility of the eternal student.",
    Cancer: "Capricorn's strong work ethic drove you to focus on your career and keep your nose to the grindstone in the past. This ethos still runs strong in you, but you're called to soften into your family, home, and a greater dependence on others in this lifetime. Resist the urge to throw yourself into your work for the sake of security, and instead allow yourself to accept support from your partner so you can enjoy nesting, nurturing, and caring for your clan.",
    Leo: "Aquarius taught you to belong to the group: the cause, the collective, the circle of friends where no one stands taller than the rest. Community still matters to you, but this lifetime calls you to step out of the crowd and shine as yourself. Resist hiding behind detachment or the group's opinion. Create, perform, romance, play. Your growth lives in the vulnerable joy of being seen, applauded, and loved for exactly who you are.",
    Virgo: "Pisces left you fluent in dreams, intuition, and surrender; drifting came easily in past chapters. That gentle magic is still yours, but this lifetime asks you to bring it down to earth. Resist escaping into fantasy, vagueness, or waiting to be rescued. Build routines, master skills, serve in practical ways. Your growth lives in the details: showing up on time, finishing the work, and discovering that competence is its own kind of grace.",
    Libra: "Aries taught you to fight your own battles, and in past chapters you learned independence so well it became armor. Courage still defines you, but this lifetime calls you into true partnership. Resist doing everything alone and treating compromise like defeat. Let people matter. Listen, share decisions, build a life that has room for two. Your growth lives in the discovery that needing someone is not weakness; it is the next brave thing.",
    Scorpio: "Taurus built you a past of comfort, possessions, and staying put; security became second nature. Stability still soothes you, but this lifetime asks you to let go of what you have outgrown, even when letting go costs something. Resist clinging to comfort, routine, and material proof of safety. Merge, trust, transform. Your growth lives in the deep waters: intimacy without guarantees, change without a safety net, and the power on the other side of surrender.",
    Sagittarius: "Gemini gave you a past of clever words, endless questions, and a thousand scattered interests. Curiosity is still your charm, but this lifetime calls you toward meaning, not just information. Resist gossip, overthinking, and collecting facts you never act on. Choose a direction, commit to a philosophy, take the long journey. Your growth lives in faith: trusting your own wisdom enough to stop asking everyone else and start walking.",
    Capricorn: "Cancer made you the caretaker in past chapters: tuned to every feeling, bound to home, holding the family together. That tenderness remains, but this lifetime calls you to climb. Resist retreating into your shell, your moods, or other people's needs as a reason to postpone your ambitions. Set goals, take charge, earn your authority. Your growth lives in responsibility: becoming the steady adult you once needed and building a legacy beyond your front door.",
    Aquarius: "Leo gave you a past on center stage: adored, applauded, and sure of your own radiance. Warmth still pours out of you, but this lifetime calls you to a bigger stage than yourself. Resist needing the spotlight, the drama, and the constant proof that you are special. Join the circle, champion a cause, lift others into the light. Your growth lives in belonging: discovering your gifts matter most when the whole community shines.",
    Pisces: "Virgo perfected you in past chapters: precise, useful, and endlessly self-improving. Discipline still serves you, but this lifetime asks you to loosen your grip. Resist criticizing yourself into paralysis and organizing life instead of living it. Trust intuition, make art, rest, forgive imperfection everywhere you find it. Your growth lives in surrender: the radical faith that you are already enough, and that some of life's best answers arrive when you stop analyzing.",
  };

  // ---------- Astronomy ----------
  // Mean lunar node (Meeus) + Placidus houses, both validated against
  // documented natal charts.

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

  function meanNodeDeg(utcMs) {
    var jd = utcMs / 86400000 + 2440587.5;
    var T = (jd - 2451545.0) / 36525;
    return mod360(125.0445479 - 1934.1362891 * T + 0.0020754 * T * T + T * T * T / 467441 - T * T * T * T / 60616000);
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

  function lunarNodes(year, month, day, hour, minute, tz, lat, lon) {
    var utcMs = localToUtcMs(year, month, day, hour, minute, tz);
    var nn = meanNodeDeg(utcMs);
    var sn = mod360(nn + 180);
    var cusps = placidusCusps(utcMs, lat, lon);
    return {
      north: { lon: nn, signIdx: Math.floor(nn / 30), house: houseOf(nn, cusps) },
      south: { lon: sn, signIdx: Math.floor(sn / 30), house: houseOf(sn, cusps) },
    };
  }

  // ---------- Styles ----------

  var FONT = "'Segoe UI','Helvetica Neue',Helvetica,Arial,sans-serif";
  var GOLD = "#eda45f";

  var CSS = "" +
    ":host{all:initial;display:block}" +
    "*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}" +
    ".wrap{position:relative;font-family:Georgia,'Times New Roman',serif;color:#fff;" +
    "background-color:#231a4e;" +
    "background-image:url('" + ORIGIN + "/embed/img/node/nebula.jpg')," +
    "radial-gradient(ellipse 90% 70% at 88% 78%,rgba(64,170,220,.5),transparent 60%)," +
    "radial-gradient(ellipse 80% 60% at 10% 15%,rgba(90,45,140,.55),transparent 65%)," +
    "linear-gradient(150deg,#2a1a52 0%,#1d1a46 45%,#14203c 100%);" +
    "background-size:cover;background-position:center;" +
    "padding:52px 24px 52px;overflow:hidden;line-height:1.7}" +
    ".inner{position:relative;max-width:880px;margin:0 auto}" +
    ".title{font-family:'Great Vibes',cursive;font-weight:400;font-size:clamp(44px,7vw,72px);color:" + GOLD + ";" +
    "text-align:center;text-shadow:0 2px 12px rgba(0,0,0,.5);margin-bottom:10px;line-height:1.2}" +
    ".flourish{display:flex;align-items:center;justify-content:center;gap:8px;max-width:760px;margin:0 auto 30px;color:" + GOLD + "}" +
    ".flourish .fline{flex:1;height:1px;background:" + GOLD + "}" +
    ".intro{font-size:20px;text-align:center;text-shadow:0 1px 6px rgba(0,0,0,.55);margin:0 auto 26px;max-width:780px}" +
    ".screen{display:none}" +
    ".screen.active{display:block;animation:fadein .5s ease}" +
    "@keyframes fadein{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:none}}" +
    ".diagram{max-width:760px;margin:0 auto 10px;display:block}" +
    ".actions{text-align:center;margin-top:26px}" +
    ".pill{display:inline-block;font-family:Georgia,serif;font-size:22px;color:#3a2410;" +
    "background:linear-gradient(180deg,#f2b26d," + GOLD + ");border:none;border-radius:999px;" +
    "padding:14px 52px;cursor:pointer;box-shadow:0 4px 16px rgba(0,0,0,.4);transition:transform .15s ease}" +
    ".pill:hover{transform:translateY(-1px)}" +
    ".nodes2{display:flex;gap:34px;margin-bottom:34px}" +
    ".ncol{flex:1;display:flex;gap:14px;align-items:flex-start;font-family:" + FONT + ";font-size:18px;line-height:1.75}" +
    ".ncol .ng{flex:0 0 52px}" +
    ".ncol b{color:" + GOLD + ";font-weight:600}" +
    ".row{display:flex;align-items:center;gap:14px;margin-bottom:18px;flex-wrap:wrap}" +
    ".lbl{flex:0 0 130px;font-weight:700;font-size:21px;text-shadow:0 1px 4px rgba(0,0,0,.6)}" +
    ".fields{display:flex;gap:12px;flex:1;min-width:260px}" +
    "select,.place{appearance:none;-webkit-appearance:none;width:100%;padding:13px 34px 13px 16px;font-size:19px;" +
    "font-family:Georgia,serif;color:#fff;background-color:rgba(255,255,255,.14);border:1.5px solid rgba(255,255,255,.85);" +
    "border-radius:8px;outline:none;text-shadow:0 1px 3px rgba(0,0,0,.4)}" +
    "select{background-image:url(\"data:image/svg+xml;charset=utf-8,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='8'%3E%3Cpath d='M1 1l5 5 5-5' stroke='white' stroke-width='1.6' fill='none'/%3E%3C/svg%3E\");" +
    "background-repeat:no-repeat;background-position:right 12px center;cursor:pointer}" +
    "select:focus,.place:focus{border-color:#fff;box-shadow:0 0 0 2px rgba(255,255,255,.25)}" +
    "select option{color:#2c2452;background:#fff;text-shadow:none}" +
    ".sel{flex:1}" +
    ".place::placeholder{color:rgba(255,255,255,.7)}" +
    ".placewrap{position:relative;flex:1}" +
    ".drop{position:absolute;top:calc(100% + 2px);left:0;right:0;background:#fff;border-radius:6px;" +
    "box-shadow:0 10px 30px rgba(0,0,0,.5);z-index:30;max-height:280px;overflow-y:auto;display:none}" +
    ".drop.open{display:block}" +
    ".opt{padding:14px 18px;font-size:18px;font-family:" + FONT + ";color:#2c2846;cursor:pointer;border-bottom:1px solid #f0eef6;text-shadow:none}" +
    ".opt:last-child{border-bottom:0}" +
    ".opt:hover,.opt.hi{background:#eee9f8}" +
    ".err{display:none;text-align:center;margin-top:16px;font-size:17px;font-family:" + FONT + ";color:#ffce8a;text-shadow:0 1px 4px rgba(0,0,0,.6)}" +
    ".err.show{display:block}" +
    ".rtable{border:1px solid rgba(255,255,255,.85);border-collapse:collapse;width:100%;margin-bottom:34px}" +
    ".rtable th{font-family:" + FONT + ";font-weight:500;font-size:26px;padding:20px 12px;background:rgba(10,8,30,.35);" +
    "border-bottom:1.5px solid rgba(255,255,255,.85);text-shadow:0 1px 4px rgba(0,0,0,.5)}" +
    ".rtable td{font-size:24px;padding:24px 18px;border:1px solid rgba(255,255,255,.6);text-align:center}" +
    ".cell{display:flex;align-items:center;justify-content:center;gap:16px}" +
    ".glyph{font-size:34px;font-family:Georgia,serif}" +
    ".hbadge{display:inline-block;width:64px;height:64px;border-radius:50%;background:#0c0c18;position:relative;overflow:hidden;flex:0 0 64px;box-shadow:0 3px 10px rgba(0,0,0,.45)}" +
    ".hbadge img{position:absolute;inset:5px;width:54px;height:54px}" +
    ".hbadge svg{position:absolute;inset:0;margin:auto}" +
    ".rtext{font-size:21px;text-align:center;max-width:840px;margin:0 auto;text-shadow:0 1px 5px rgba(0,0,0,.5)}" +
    ".sep{margin:34px auto}" +
    ".outro{font-size:21px;text-align:center;max-width:840px;margin:0 auto;text-shadow:0 1px 5px rgba(0,0,0,.5)}" +
    ".again{display:inline-flex;align-items:center;gap:10px;font-family:Georgia,serif;font-size:26px;color:" + GOLD + ";" +
    "background:none;border:none;cursor:pointer;text-shadow:0 1px 4px rgba(0,0,0,.5);padding:6px 10px;margin-top:10px}" +
    ".again:hover{color:#f3c084}" +
    "@media(max-width:680px){" +
    ".lbl{flex:1 0 100%}" +
    ".nodes2{flex-direction:column}" +
    ".rtable th{font-size:20px;padding:14px 6px}" +
    ".rtable td{font-size:18px;padding:14px 8px}" +
    ".cell{gap:8px;flex-direction:column}" +
    ".wrap{padding:38px 14px 44px}}";

  var FLOURISH_END = "<svg width='34' height='26' viewBox='0 0 34 26' fill='none' xmlns='http://www.w3.org/2000/svg'>" +
    "<path d='M32 13 L12 13 M16 13 C 12 9, 7 8, 5 11 C 3 14, 7 16, 9 13 M16 13 C 12 17, 7 18, 5 15' stroke='currentColor' stroke-width='1.5' fill='none' stroke-linecap='round'/>" +
    "<circle cx='8' cy='5' r='2.6' stroke='currentColor' stroke-width='1.4' fill='none'/>" +
    "<circle cx='8' cy='21' r='2.6' stroke='currentColor' stroke-width='1.4' fill='none'/>" +
    "<path d='M2 13 L5 10 L8 13 L5 16 Z' fill='currentColor'/></svg>";

  function nodeGlyphSvg(south, size) {
    var s = size || 52;
    var body = south
      ? "<path d='M9 16 A 19 19 0 1 0 43 16'/><circle cx='9' cy='11' r='5'/><circle cx='43' cy='11' r='5'/>"
      : "<path d='M9 36 A 19 19 0 1 1 43 36'/><circle cx='9' cy='41' r='5'/><circle cx='43' cy='41' r='5'/>";
    return "<svg width='" + s + "' height='" + s + "' viewBox='0 0 52 52' fill='none' xmlns='http://www.w3.org/2000/svg'>" +
      "<g stroke='white' stroke-width='2.6' fill='none' stroke-linecap='round'>" + body + "</g></svg>";
  }

  // The two orbit ellipses intersect at (334,138) and (462,328); the node
  // glyphs sit exactly on those crossings. The <image> slots layer generated
  // artwork over the gradient bodies when the sprite files exist.
  var DIAGRAM_SVG = "<svg class='diagram' viewBox='0 0 760 420' fill='none' xmlns='http://www.w3.org/2000/svg'>" +
    "<defs>" +
    "<radialGradient id='sunglow'><stop offset='30%' stop-color='rgba(247,195,62,.55)'/><stop offset='100%' stop-color='rgba(247,195,62,0)'/></radialGradient>" +
    "<radialGradient id='sung' cx='38%' cy='36%'><stop offset='0%' stop-color='#fff3b0'/><stop offset='45%' stop-color='#f9cb45'/><stop offset='80%' stop-color='#ef9027'/><stop offset='100%' stop-color='#dd6c17'/></radialGradient>" +
    "<radialGradient id='earthg' cx='38%' cy='32%'><stop offset='0%' stop-color='#d6effc'/><stop offset='45%' stop-color='#79b7e6'/><stop offset='80%' stop-color='#3a6fb0'/><stop offset='100%' stop-color='#274a83'/></radialGradient>" +
    "<radialGradient id='moonglow'><stop offset='25%' stop-color='rgba(232,240,252,.5)'/><stop offset='100%' stop-color='rgba(232,240,252,0)'/></radialGradient>" +
    "<clipPath id='earthclip'><circle cx='390' cy='240' r='62'/></clipPath>" +
    "</defs>" +
    // orbits
    "<ellipse cx='380' cy='235' rx='345' ry='100' stroke='white' stroke-width='1.7' transform='rotate(-3 380 235)'/>" +
    "<ellipse cx='420' cy='225' rx='330' ry='110' stroke='white' stroke-width='1.7' stroke-dasharray='11 9' transform='rotate(-18 420 225)'/>" +
    // sun
    "<circle cx='128' cy='205' r='80' fill='url(#sunglow)'/>" +
    "<circle cx='128' cy='205' r='50' fill='url(#sung)'/>" +
    "<image x='66' y='143' width='124' height='124' href='" + ORIGIN + "/embed/img/node/sun.png'/>" +
    "<text x='108' y='138' font-family='" + FONT + "' font-size='16' fill='white'>Sun</text>" +
    // earth
    "<circle cx='390' cy='240' r='62' fill='url(#earthg)'/>" +
    "<g clip-path='url(#earthclip)' opacity='.9'>" +
    "<path d='M352 214 C 366 202, 388 200, 398 212 C 388 222, 368 226, 352 214 Z' fill='#84b866'/>" +
    "<path d='M398 250 C 412 240, 434 242, 444 256 C 430 268, 408 266, 398 250 Z' fill='#8fbf6d'/>" +
    "<path d='M356 262 C 366 256, 380 258, 386 268 C 376 276, 362 274, 356 262 Z' fill='#7cad5e'/>" +
    "<path d='M340 234 C 360 228, 384 232, 396 244' stroke='#eef7fd' stroke-width='7' stroke-linecap='round' opacity='.55'/>" +
    "<path d='M382 282 C 398 272, 420 272, 434 282' stroke='#eef7fd' stroke-width='6' stroke-linecap='round' opacity='.5'/>" +
    "</g>" +
    "<image x='326' y='176' width='128' height='128' href='" + ORIGIN + "/embed/img/node/earth.png'/>" +
    // moon
    "<circle cx='655' cy='102' r='52' fill='url(#moonglow)'/>" +
    "<path d='M640 70 A 34 34 0 1 0 672 128 A 27 27 0 1 1 640 70 Z' fill='#eef2f8'/>" +
    "<image x='611' y='58' width='88' height='88' href='" + ORIGIN + "/embed/img/node/moon.png'/>" +
    "<text x='706' y='98' font-family='" + FONT + "' font-size='16' fill='white'>Moon</text>" +
    // nodes on the orbit crossings
    "<text x='300' y='145' text-anchor='end' font-family='" + FONT + "' font-size='16' fill='white'>Lunar South Node</text>" +
    "<g transform='translate(311,115)'>" + nodeGlyphSvg(true, 46) + "</g>" +
    "<g transform='translate(439,305)'>" + nodeGlyphSvg(false, 46) + "</g>" +
    "<text x='498' y='336' font-family='" + FONT + "' font-size='16' fill='white'>Lunar North Node</text>" +
    "</svg>";

  function houseBadge(n) {
    return "<span class='hbadge'><img alt='' src='" + ORIGIN + "/embed/img/venus/planet.png'>" +
      "<svg width='40' height='40' viewBox='0 0 70 70' fill='none' xmlns='http://www.w3.org/2000/svg'>" +
      "<path d='M14 34 L35 16 L56 34' stroke='white' stroke-width='4' fill='none' stroke-linecap='round' stroke-linejoin='round'/>" +
      "<path d='M20 30 L20 56 M50 30 L50 56' stroke='white' stroke-width='4' stroke-linecap='round'/>" +
      "<text x='35' y='52' text-anchor='middle' font-family='Georgia,serif' font-size='22' fill='white'>" + n + "</text></svg></span>";
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
      "<h2 class='title'>Lunar Node Calculator</h2>" +
      "<div class='flourish'>" + FLOURISH_END + "<div class='fline'></div>" +
      "<span style='transform:scaleX(-1);display:inline-flex'>" + FLOURISH_END + "</span></div>" +

      "<div class='screen s-intro active'>" +
      "<p class='intro'>The lunar nodes are points in the sky where the orbits of the moon and Earth intersect. The astrological signs within the North and South nodes sit opposite one another. These signs change at roughly 18-month intervals. Your North and South nodes can tell you a great deal about the purpose and trajectory of your life.</p>" +
      DIAGRAM_SVG +
      "<div class='actions'><button class='pill next' type='button'>Next</button></div>" +
      "</div>" +

      "<div class='screen s-form'>" +
      "<div class='nodes2'>" +
      "<div class='ncol'><span class='ng'>" + nodeGlyphSvg(false, 52) + "</span><span>Your <b>North node</b> represents your life's purpose. This is the ultimate destination where you've achieved complete self-actualization. The traits and qualities the North node represents are those that you need to actively pursue and work on. The North node symbolizes your future and all that you can become when you stretch yourself beyond your comfort zone and strive for something more.</span></div>" +
      "<div class='ncol'><span class='ng'>" + nodeGlyphSvg(true, 52) + "</span><span>Your <b>South node</b> represents where you came from. The qualities of this node were likely developed in a previous lifetime. As such, they're already deeply ingrained, perhaps too much so. It's dangerous to fall back too heavily on your South node qualities as this will inhibit growth and keep you stuck in a motionless mindset.</span></div>" +
      "</div>" +
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
      "<div class='actions'><button class='pill submit' type='button'>Submit</button></div>" +
      "<div class='err' role='alert'></div>" +
      "</div>" +

      "<div class='screen s-result' aria-live='polite'>" +
      "<table class='rtable'><thead><tr><th>Lunar Nodes</th><th>Signs</th><th>Houses</th></tr></thead><tbody>" +
      "<tr><td><span class='cell'>" + nodeGlyphSvg(false, 44) + "<span>North Node</span></span></td>" +
      "<td><span class='cell'><span class='glyph' data-r='ng'></span><span data-r='nsign'></span></span></td>" +
      "<td><span class='cell'><span data-r='nhouse'></span><span data-r='nbadge'></span></span></td></tr>" +
      "<tr><td><span class='cell'>" + nodeGlyphSvg(true, 44) + "<span>South Node</span></span></td>" +
      "<td><span class='cell'><span class='glyph' data-r='sg'></span><span data-r='ssign'></span></span></td>" +
      "<td><span class='cell'><span data-r='shouse'></span><span data-r='sbadge'></span></span></td></tr>" +
      "</tbody></table>" +
      "<p class='rtext'></p>" +
      "<div class='flourish sep'>" + FLOURISH_END + "<div class='fline'></div>" +
      "<span style='transform:scaleX(-1);display:inline-flex'>" + FLOURISH_END + "</span></div>" +
      "<p class='outro'>Speaking with a psychic astrologer can help you explore the deeper meanings and implications associated with your North and South nodes. Understanding the placement of these key planets will help you understand and optimize the road map for your life.</p>" +
      "<div class='actions'><button class='again' type='button'>Start Again <span>&#8250;</span></button></div>" +
      "</div>" +

      "</div></div>";
  }

  // ---------- Behavior ----------

  function init(host) {
    if (host.__psLunarNode) return;
    host.__psLunarNode = true;

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
    var $r = function (name) { return mount.querySelector("[data-r='" + name + "']"); };
    var fields = {};
    mount.querySelectorAll("[data-f]").forEach(function (el) { fields[el.getAttribute("data-f")] = el; });
    var drop = $(".drop");
    var err = $(".err");

    function show(screen) {
      mount.querySelectorAll(".screen").forEach(function (el) { el.classList.remove("active"); });
      $(".s-" + screen).classList.add("active");
      $(".wrap").scrollIntoView({ behavior: "smooth", block: "start" });
    }

    $(".next").addEventListener("click", function () { show("form"); });

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

    $(".submit").addEventListener("click", function () {
      clearError();
      var v = function (name) { return fields[name].value; };
      if (!v("month") || !v("day") || !v("year")) return showError("Please select your full birth date.");
      if (!v("hour") || v("minute") === "") return showError("Please select your birth time. Houses shift about every two hours, so the time matters.");
      if (!chosen) return showError("Please choose your birth place from the dropdown list.");

      var day = +v("day"), month = +v("month"), year = +v("year");
      var daysInMonth = new Date(year, month, 0).getDate();
      if (day > daysInMonth) return showError("That date does not exist. Please check the day and month.");

      var hour = (+v("hour")) % 12 + (v("ampm") === "PM" ? 12 : 0);
      var r = lunarNodes(year, month, day, hour, +v("minute"), chosen.timezone, chosen.lat, chosen.lon);

      $r("ng").textContent = GLYPHS[r.north.signIdx] + "︎";
      $r("nsign").textContent = SIGNS[r.north.signIdx];
      $r("nhouse").textContent = ORDINAL[r.north.house] + " House";
      $r("nbadge").innerHTML = houseBadge(r.north.house);
      $r("sg").textContent = GLYPHS[r.south.signIdx] + "︎";
      $r("ssign").textContent = SIGNS[r.south.signIdx];
      $r("shouse").textContent = ORDINAL[r.south.house] + " House";
      $r("sbadge").innerHTML = houseBadge(r.south.house);
      $(".rtext").textContent = MEANINGS[SIGNS[r.north.signIdx]];

      show("result");
    });

    $(".again").addEventListener("click", function () {
      ["month", "day", "year", "hour", "minute"].forEach(function (name) { fields[name].value = ""; });
      fields.ampm.value = "AM";
      fields.place.value = "";
      chosen = null;
      clearError();
      closeDrop();
      show("intro");
    });
  }

  function boot() {
    var host = document.getElementById("ps-lunar-node") || document.querySelector("[data-ps-widget='lunar-node']");
    if (host) init(host);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})();
