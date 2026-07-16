/* Venus & Mars in Love compatibility calculator embed.
 * Usage on any site:
 *   <div id="ps-love-compatibility"></div>
 *   <script async src="https://psychic-source-platform.vercel.app/embed/love-compatibility.js"></script>
 * Renders directly into the page (Shadow DOM), no iframe.
 * Compares the user's real Mars sign to the partner's real Venus sign
 * (positions computed at noon UTC of each birth date).
 */
(function () {
  "use strict";

  var SCRIPT_SRC = (document.currentScript && document.currentScript.src) || "";
  var ORIGIN = SCRIPT_SRC ? new URL(SCRIPT_SRC).origin : "https://psychic-source-platform.vercel.app";

  var CTA_URL = "https://www.psychicsource.com/psychic-advice/astrology-readings";

  var SIGNS = ["Aries", "Taurus", "Gemini", "Cancer", "Leo", "Virgo",
    "Libra", "Scorpio", "Sagittarius", "Capricorn", "Aquarius", "Pisces"];
  var GLYPHS = ["♈", "♉", "♊", "♋", "♌", "♍",
    "♎", "♏", "♐", "♑", "♒", "♓"];
  var ELEMENTS_OF = ["fire", "earth", "air", "water", "fire", "earth",
    "air", "water", "fire", "earth", "air", "water"];

  // Aspect between the two signs (distance 0-6) drives the score and text.
  var ASPECTS = {
    0: {
      base: 85,
      text: "Your Mars and your partner's Venus share the very same sign, which creates an instant, unmistakable spark. What you desire and how your partner loves are cut from the same cloth, so passion and affection speak the same language. You rarely need to explain yourselves to each other; the attraction simply works. The challenge of so much sameness is intensity: when one of you runs hot, you both do. Learn to take turns being the calm one, and this connection can feel like coming home.",
    },
    1: {
      base: 42,
      text: "Your signs sit side-by-side, which is probably a good description of your relationship to each other. You may have spent years existing peacefully within each other's orbits, yet not quite recognizing the potential for a romantic spark. When you do get together, you may find that it takes a little while to get into the right flow together, but you can form a strong partnership once you do. Your love styles are distinct, yet complementary. You'll often find that you have an intuitive sense of where your partner is coming from, or where they're headed with their romantic ways.",
    },
    2: {
      base: 74,
      text: "Your signs form a sextile, one of the friendliest angles two charts can share. Attraction here feels easy and energizing: your drive complements your partner's way of loving, and you naturally encourage each other. This is the kind of connection where romance grows out of genuine friendship and shared adventures. The spark may not knock you over on day one, but it builds steadily and lasts. Keep choosing each other on the ordinary days and this pairing quietly becomes extraordinary.",
    },
    3: {
      base: 38,
      text: "Your signs form a square, the angle of friction, and friction makes heat. The attraction between you is real and often intense, precisely because you want things in different ways. Your passion pushes against your partner's love style, which can create magnetic chemistry alongside genuine frustration. Handled carelessly, this becomes a tug of war. Handled well, the tension keeps the romance permanently interesting. The key is fighting for the relationship rather than against each other; make that shift and sparks become fireworks.",
    },
    4: {
      base: 92,
      text: "Your signs form a trine, the most harmonious angle in astrology. Your desires and your partner's way of loving flow together like two streams joining a river: little effort, lots of warmth. You instinctively understand each other's romantic rhythms, and time together tends to feel easy, generous, and natural. The only caution with a connection this comfortable is complacency. Keep surprising each other, and this pairing offers passion and peace at the same time, which is rarer than it sounds.",
    },
    5: {
      base: 55,
      text: "Your signs sit five apart, an angle astrologers call the quincunx: intriguing, unlikely, and full of chemistry that logic cannot quite explain. Your desires and your partner's love style come from very different worlds, so this relationship asks for continual small adjustments. That is also its magic. Neither of you can coast; you must stay curious about each other. Couples who master this angle often share the most interesting love stories in the room, precisely because nothing about them was obvious.",
    },
    6: {
      base: 79,
      text: "Your signs sit directly opposite each other, and opposites really do attract. Your partner's way of loving is the mirror image of what you desire, which creates powerful magnetic pull and a sense of completing each other. At its best, this pairing balances perfectly: each of you supplies what the other lacks. At its trickiest, you pull in opposite directions on the same issues. Meet in the middle deliberately and often, and this becomes the classic great romance: two halves, one whole.",
    },
  };

  // ---------- Astronomy (JPL Standish elements, noon UTC of birth date) ----------

  var D2R = Math.PI / 180;
  function mod360(x) { return ((x % 360) + 360) % 360; }

  var ELEMENTS = {
    emb: {
      base: [1.00000261, 0.01671123, -0.00001531, 100.46457166, 102.93768193, 0.0],
      rate: [0.00000562, -0.00004392, -0.01294668, 35999.37244981, 0.32327364, 0.0],
    },
    mars: {
      base: [1.52371034, 0.09339410, 1.84969142, -4.55343205, -23.94362959, 49.55953891],
      rate: [0.00001847, 0.00007882, -0.00813131, 19140.30268499, 0.44441088, -0.29257343],
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

  function planetLongitude(body, utcMs) {
    var jd = utcMs / 86400000 + 2440587.5;
    var T = (jd - 2451545.0) / 36525;
    var earth = helio("emb", T);
    var p = helio(body, T);
    var lonJ2000 = mod360(Math.atan2(p.y - earth.y, p.x - earth.x) / D2R);
    var precession = (5029.0966 * T + 1.11113 * T * T) / 3600;
    return mod360(lonJ2000 + precession);
  }

  function signIndexOn(body, year, month, day) {
    return Math.floor(planetLongitude(body, Date.UTC(year, month - 1, day, 12)) / 30);
  }

  function compatibility(marsIdx, venusIdx) {
    var dist = Math.min(mod12(marsIdx - venusIdx), mod12(venusIdx - marsIdx));
    var score = ASPECTS[dist].base;
    var e1 = ELEMENTS_OF[marsIdx], e2 = ELEMENTS_OF[venusIdx];
    if ((e1 === "fire" && e2 === "air") || (e1 === "air" && e2 === "fire")) score += 4;
    if ((e1 === "earth" && e2 === "water") || (e1 === "water" && e2 === "earth")) score += 4;
    if ((e1 === "fire" && e2 === "water") || (e1 === "water" && e2 === "fire")) score -= 3;
    if ((e1 === "air" && e2 === "earth") || (e1 === "earth" && e2 === "air")) score -= 3;
    score = Math.max(5, Math.min(99, score));
    return { score: score, text: ASPECTS[dist].text };
  }

  function mod12(x) { return ((x % 12) + 12) % 12; }

  // ---------- Styles ----------

  var FONT = "'Segoe UI','Helvetica Neue',Helvetica,Arial,sans-serif";
  var WINE = "#7d2440";
  var NAVY = "#274860";
  var INK = "#3d3a34";

  var CSS = "" +
    ":host{all:initial;display:block}" +
    "*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}" +
    ".wrap{position:relative;font-family:" + FONT + ";color:" + INK + ";" +
    "background:#efe6cf url('" + ORIGIN + "/embed/img/love/parchment.jpg') center/cover no-repeat;" +
    "padding:44px 24px 56px;overflow:hidden;line-height:1.65}" +
    ".inner{position:relative;max-width:900px;margin:0 auto}" +
    ".tophead{display:flex;align-items:center;justify-content:center;gap:14px;color:" + NAVY + ";" +
    "font-size:22px;font-weight:600;letter-spacing:8px;text-transform:uppercase;margin-bottom:26px;text-align:center;flex-wrap:wrap}" +
    ".title{display:flex;align-items:center;justify-content:center;gap:18px;margin-bottom:20px}" +
    ".title h2{font-family:'Great Vibes',cursive;font-weight:400;font-size:clamp(42px,6.5vw,72px);color:" + WINE + ";line-height:1.1}" +
    ".intro{font-size:19px;text-align:center;margin:0 auto 34px;max-width:860px}" +
    ".seclabel{color:" + NAVY + ";font-size:21px;font-weight:700;letter-spacing:6px;text-transform:uppercase;" +
    "text-align:center;margin-bottom:18px;line-height:1.7}" +
    ".dates{display:flex;align-items:baseline;justify-content:center;gap:10px;font-family:Georgia,'Times New Roman',serif;" +
    "font-style:italic;font-size:32px;color:#5a6672;margin-bottom:8px}" +
    ".din{font-family:Georgia,serif;font-style:italic;font-size:32px;color:#5a6672;background:transparent;border:none;" +
    "border-bottom:2px solid #8b917f;outline:none;text-align:center;padding:2px 4px;border-radius:0}" +
    ".din:focus{border-bottom-color:" + NAVY + "}" +
    ".din.mm,.din.dd{width:72px}" +
    ".din.yy{width:120px}" +
    ".ampdiv{display:flex;align-items:center;gap:12px;max-width:760px;margin:30px auto}" +
    ".ampdiv .aline{flex:1;height:1px;background:#9aa08e}" +
    ".ampdiv .acirc{width:38px;height:38px;border:1px solid #9aa08e;border-radius:50%;display:flex;align-items:center;" +
    "justify-content:center;font-family:Georgia,serif;font-style:italic;font-size:20px;color:#7a8271}" +
    ".actions{text-align:center;margin-top:34px}" +
    ".btn{display:inline-block;font-family:" + FONT + ";font-size:19px;font-weight:600;letter-spacing:6px;" +
    "text-transform:uppercase;color:#f3e9d5;background:" + WINE + ";border:none;border-radius:2px;" +
    "padding:18px 40px;cursor:pointer;transition:background .15s ease;text-decoration:none}" +
    ".btn:hover{background:#933052}" +
    ".btn .dash{opacity:.65;font-weight:400}" +
    ".btnrow{display:flex;gap:22px;justify-content:center;flex-wrap:wrap;margin-top:38px}" +
    ".err{display:none;text-align:center;margin-top:16px;font-size:17px;color:#a03030}" +
    ".err.show{display:block}" +
    ".screen-result{display:none}" +
    ".screen-result.active{display:block;animation:fadein .6s ease}" +
    ".screen-form.hidden{display:none}" +
    "@keyframes fadein{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:none}}" +
    ".rintro{font-size:19px;text-align:center;margin:0 auto 36px;max-width:880px}" +
    ".rcols{display:flex;align-items:center;gap:36px}" +
    ".wheelbox{flex:0 0 300px;text-align:center}" +
    ".pct{font-family:'Great Vibes',cursive;font-size:38px;color:#3f6b8e;margin-top:10px}" +
    ".rtextbox{flex:1;border:1px solid #6b6154;padding:28px 30px;font-size:20px}" +
    ".pair{display:flex;align-items:center;justify-content:center;gap:22px;margin-top:44px}" +
    ".pside{flex:1;max-width:300px;display:flex;flex-direction:column;gap:12px}" +
    ".pside.right{align-items:flex-end}" +
    ".pname{font-size:22px;font-weight:600;letter-spacing:8px;text-transform:uppercase;color:#4b463c;padding:0 4px}" +
    ".pline{width:100%;height:1px;background:#6b6154}" +
    ".glyphs{position:relative;width:150px;height:120px}" +
    ".glyphs .g1{position:absolute;left:0;top:0;font-size:64px;color:#4b463c;font-family:Georgia,serif}" +
    ".glyphs .g2{position:absolute;right:0;bottom:0;font-size:64px;color:#4b463c;font-family:Georgia,serif}" +
    ".glyphs svg{position:absolute;inset:0;margin:auto}" +
    "@media(max-width:700px){" +
    ".rcols{flex-direction:column}" +
    ".wheelbox{flex-basis:auto}" +
    ".tophead{letter-spacing:4px;font-size:18px}" +
    ".pline{width:60px}" +
    ".wrap{padding:34px 14px 44px}}";

  var MARS_VENUS_SVG = "<svg width='34' height='44' viewBox='0 0 34 44' fill='none' xmlns='http://www.w3.org/2000/svg'>" +
    "<circle cx='17' cy='20' r='9' stroke='" + NAVY + "' stroke-width='2.4' fill='none'/>" +
    "<path d='M23 13 L30 5 M30 5 L24 5 M30 5 L30 11' stroke='" + WINE + "' stroke-width='2.4' fill='none' stroke-linecap='round'/>" +
    "<path d='M17 29 L17 42 M12 36 L22 36' stroke='" + WINE + "' stroke-width='2.4' stroke-linecap='round'/></svg>";

  var BURST_SVG = "<svg width='72' height='58' viewBox='0 0 72 58' fill='none' xmlns='http://www.w3.org/2000/svg'>" +
    "<g fill='" + WINE + "'><circle cx='26' cy='24' r='2'/><circle cx='34' cy='16' r='1.4'/><circle cx='18' cy='16' r='1.4'/>" +
    "<circle cx='34' cy='32' r='1.4'/><circle cx='18' cy='32' r='1.4'/><circle cx='26' cy='10' r='1.1'/><circle cx='26' cy='38' r='1.1'/>" +
    "<circle cx='12' cy='24' r='1.1'/><circle cx='40' cy='24' r='1.1'/></g>" +
    "<g fill='#8a8462'><circle cx='54' cy='38' r='1.6'/><circle cx='60' cy='32' r='1.1'/><circle cx='48' cy='32' r='1.1'/>" +
    "<circle cx='60' cy='44' r='1.1'/><circle cx='48' cy='44' r='1.1'/><circle cx='66' cy='38' r='.9'/><circle cx='54' cy='26' r='.9'/><circle cx='54' cy='50' r='.9'/></g></svg>";

  function wheelSvg(pct) {
    var segs = "";
    var filled = Math.round((pct / 100) * 12);
    for (var i = 0; i < 12; i++) {
      var a0 = (i * 30 - 90) * D2R, a1 = ((i + 1) * 30 - 90) * D2R;
      var x0 = 110 + 78 * Math.cos(a0), y0 = 110 + 78 * Math.sin(a0);
      var x1 = 110 + 78 * Math.cos(a1), y1 = 110 + 78 * Math.sin(a1);
      var xi0 = 110 + 34 * Math.cos(a0), yi0 = 110 + 34 * Math.sin(a0);
      var xi1 = 110 + 34 * Math.cos(a1), yi1 = 110 + 34 * Math.sin(a1);
      var fill = i < filled ? "#7ea3bd" : "none";
      segs += "<path d='M" + xi0.toFixed(1) + " " + yi0.toFixed(1) + " L" + x0.toFixed(1) + " " + y0.toFixed(1) +
        " A78 78 0 0 1 " + x1.toFixed(1) + " " + y1.toFixed(1) + " L" + xi1.toFixed(1) + " " + yi1.toFixed(1) +
        " A34 34 0 0 0 " + xi0.toFixed(1) + " " + yi0.toFixed(1) + " Z' fill='" + fill + "' fill-opacity='.75' stroke='#57534a' stroke-width='1.1'/>";
    }
    // orange freehand-style arc spanning the score fraction
    var arcEnd = (pct / 100) * 360 - 90;
    var large = pct > 50 ? 1 : 0;
    var ax = 110 + 98 * Math.cos(arcEnd * D2R), ay = 110 + 98 * Math.sin(arcEnd * D2R);
    var arc = "<path d='M110 12 A98 98 0 " + large + " 1 " + ax.toFixed(1) + " " + ay.toFixed(1) +
      "' stroke='#d96f35' stroke-width='7' fill='none' stroke-linecap='round' opacity='.85'/>";
    // center rosette
    var dots = "";
    for (var d = 0; d < 24; d++) {
      var ang = d * 15 * D2R, rr = 12 + (d % 3) * 5;
      dots += "<circle cx='" + (110 + rr * Math.cos(ang)).toFixed(1) + "' cy='" + (110 + rr * Math.sin(ang)).toFixed(1) + "' r='2.1' fill='#dd8a52'/>";
    }
    return "<svg width='230' height='230' viewBox='0 0 220 220' fill='none' xmlns='http://www.w3.org/2000/svg'>" +
      "<circle cx='110' cy='110' r='86' stroke='#57534a' stroke-width='1.4' fill='none'/>" +
      "<circle cx='110' cy='110' r='26' stroke='#57534a' stroke-width='1.1' fill='none'/>" +
      segs + arc + dots + "</svg>";
  }

  var SLASH_SVG = "<svg width='70' height='110' viewBox='0 0 70 110' fill='none' xmlns='http://www.w3.org/2000/svg'>" +
    "<path d='M46 4 L14 106 M56 4 L24 106' stroke='#4b463c' stroke-width='2.4'/></svg>";

  // ---------- Markup ----------

  function dateInputs(prefix) {
    return "<div class='dates'>" +
      "<input class='din mm' data-f='" + prefix + "m' inputmode='numeric' maxlength='2' placeholder='MM' aria-label='Month'> / " +
      "<input class='din dd' data-f='" + prefix + "d' inputmode='numeric' maxlength='2' placeholder='DD' aria-label='Day'> / " +
      "<input class='din yy' data-f='" + prefix + "y' inputmode='numeric' maxlength='4' placeholder='YYYY' aria-label='Year'>" +
      "</div>";
  }

  function buildHtml() {
    return "<div class='wrap'><div class='inner'>" +
      "<div class='tophead'><span>Finding Your</span>" + MARS_VENUS_SVG + "<span>Compatibility</span></div>" +
      "<div class='title'>" + BURST_SVG + "<h2>Venus &amp; Mars in Love</h2>" +
      "<span style='transform:scaleX(-1);display:inline-flex'>" + BURST_SVG + "</span></div>" +
      "<div class='screen-form'>" +
      "<p class='intro'>Mars and Venus influence your relationships more than any other planets. Venus is the planet of love, and its placement in your chart influences how you prefer to show love and receive love from others. Mars is a passionate planet that influences lust and intimacy. Examining how Mars and Venus influence both you and your partner offers valuable information about your strengths, weaknesses, and compatibility as a couple.</p>" +
      "<div class='seclabel'>Please Enter<br>Your Birthdate</div>" +
      dateInputs("a") +
      "<div class='ampdiv'><div class='aline'></div><div class='acirc'>&amp;</div><div class='aline'></div></div>" +
      "<div class='seclabel'>Please Enter<br>Your Partner's Birthdate</div>" +
      dateInputs("b") +
      "<div class='actions'><button class='btn' type='button'><span class='dash'>&#8212;</span>&nbsp;&nbsp;Get Your Results&nbsp;&nbsp;<span class='dash'>&#8212;</span></button></div>" +
      "<div class='err' role='alert'></div>" +
      "</div>" +
      "<div class='screen-result' aria-live='polite'>" +
      "<p class='rintro'>We have determined the compatibility of you and your partner by comparing your Mars astrology sign to your partner's Venus astrology sign. Your Mars astrology sign and your partner's Venus astrology sign are determined by the date of birth entered. An industry standard metric chart compares your Mars to your partner's Venus to determine your level of compatibility.</p>" +
      "<div class='rcols'>" +
      "<div class='wheelbox'><div class='wheel'></div><div class='pct'></div></div>" +
      "<div class='rtextbox'></div>" +
      "</div>" +
      "<div class='pair'>" +
      "<div class='pside'><span class='pname' data-p='left'></span><div class='pline'></div></div>" +
      "<div class='glyphs'><span class='g1'></span>" + SLASH_SVG + "<span class='g2'></span></div>" +
      "<div class='pside right'><span class='pname' data-p='right'></span><div class='pline'></div></div>" +
      "</div>" +
      "<div class='btnrow'>" +
      "<button class='btn restart' type='button'><span class='dash'>&#8212;</span>&nbsp;&nbsp;Start Over&nbsp;&nbsp;<span class='dash'>&#8212;</span></button>" +
      "<span class='cta-slot'></span>" +
      "</div>" +
      "</div>" +
      "</div></div>";
  }

  // ---------- Behavior ----------

  function init(host) {
    if (host.__psLoveCompat) return;
    host.__psLoveCompat = true;

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
    var err = $(".err");
    var formScreen = $(".screen-form");
    var resultScreen = $(".screen-result");

    // digits only + auto-advance
    var order = ["am", "ad", "ay", "bm", "bd", "by"];
    order.forEach(function (name, idx) {
      var el = fields[name];
      el.addEventListener("input", function () {
        el.value = el.value.replace(/[^0-9]/g, "");
        if (el.value.length >= +el.getAttribute("maxlength") && idx < order.length - 1) {
          fields[order[idx + 1]].focus();
        }
      });
    });

    function showError(msg) { err.textContent = msg; err.classList.add("show"); }
    function clearError() { err.classList.remove("show"); }

    function readDate(prefix, label) {
      var m = +fields[prefix + "m"].value, d = +fields[prefix + "d"].value, y = +fields[prefix + "y"].value;
      if (!m || !d || !y || fields[prefix + "y"].value.length !== 4) {
        showError("Please enter " + label + " as MM / DD / YYYY.");
        return null;
      }
      var now = new Date().getFullYear();
      if (y < 1920 || y > now) { showError("Please check the year in " + label + "."); return null; }
      if (m < 1 || m > 12 || d < 1 || d > new Date(y, m, 0).getDate()) {
        showError("That date does not exist. Please check " + label + ".");
        return null;
      }
      return { y: y, m: m, d: d };
    }

    $(".btn").addEventListener("click", function () {
      clearError();
      var a = readDate("a", "your birthdate");
      if (!a) return;
      var b = readDate("b", "your partner's birthdate");
      if (!b) return;

      var marsIdx = signIndexOn("mars", a.y, a.m, a.d);
      var venusIdx = signIndexOn("venus", b.y, b.m, b.d);
      var result = compatibility(marsIdx, venusIdx);

      $(".wheel").innerHTML = wheelSvg(result.score);
      $(".pct").textContent = result.score + "% Compatibility";
      $(".rtextbox").textContent = result.text;
      mount.querySelector("[data-p='left']").textContent = SIGNS[marsIdx];
      mount.querySelector("[data-p='right']").textContent = SIGNS[venusIdx];
      $(".g1").textContent = GLYPHS[marsIdx] + "︎";
      $(".g2").textContent = GLYPHS[venusIdx] + "︎";

      var slot = $(".cta-slot");
      slot.innerHTML = "";
      if (CTA_URL) {
        var link2 = document.createElement("a");
        link2.className = "btn";
        link2.href = CTA_URL;
        link2.innerHTML = "<span class='dash'>&#8212;</span>&nbsp;&nbsp;Get an Astrology Reading&nbsp;&nbsp;<span class='dash'>&#8212;</span>";
        slot.appendChild(link2);
      }

      formScreen.classList.add("hidden");
      resultScreen.classList.add("active");
      $(".wrap").scrollIntoView({ behavior: "smooth", block: "start" });
    });

    $(".restart").addEventListener("click", function () {
      order.forEach(function (name) { fields[name].value = ""; });
      clearError();
      resultScreen.classList.remove("active");
      formScreen.classList.remove("hidden");
      $(".wrap").scrollIntoView({ behavior: "smooth", block: "start" });
    });
  }

  function boot() {
    var host = document.getElementById("ps-love-compatibility") || document.querySelector("[data-ps-widget='love-compatibility']");
    if (host) init(host);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})();
