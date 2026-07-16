/* Moon Sign Calculator embed.
 * Usage on any site:
 *   <div id="ps-moon-sign"></div>
 *   <script async src="https://psychic-source-platform.vercel.app/embed/moon-sign.js"></script>
 * Renders directly into the page (Shadow DOM), no iframe.
 * City search data derived from GeoNames.org, licensed CC BY 4.0.
 */
(function () {
  "use strict";

  var SCRIPT_SRC = (document.currentScript && document.currentScript.src) || "";
  var ORIGIN = SCRIPT_SRC ? new URL(SCRIPT_SRC).origin : "https://psychic-source-platform.vercel.app";

  var SIGNS = ["Aries", "Taurus", "Gemini", "Cancer", "Leo", "Virgo",
    "Libra", "Scorpio", "Sagittarius", "Capricorn", "Aquarius", "Pisces"];

  var MEANINGS = {
    Aries: "Having an Aries moon sign means your emotions arrive fast and burn bright. You feel things immediately and act on them, which makes you passionate, honest, and quick to defend the people you love. Frustration can flare just as quickly, though it rarely lasts long. You process feelings best through action, movement, and forward momentum. Learning to pause before reacting gives your emotional fire real power. At your core, you need independence, fresh challenges, and the freedom to want what you want without apology.",
    Taurus: "Having a Taurus moon sign gives you a steady, patient emotional core. You crave comfort, consistency, and the quiet pleasures of the senses: good food, soft blankets, familiar routines. Once you feel settled, very little can shake you, and the people around you lean on that calm. Change is your tender spot, since your heart prefers what it already knows and trusts. You find emotional security through stability, nature, and simple daily rituals that remind you the ground beneath you is solid.",
    Gemini: "Having a Gemini moon sign means you process emotions through words and ideas. Talking things out is how you understand what you feel, and a good conversation can lift your mood faster than almost anything. Your inner world is quick, curious, and a little restless, so variety keeps your heart light. When feelings get heavy, you may retreat into your head instead of your heart. You find the most emotional security when you let yourself feel things fully, not just explain them beautifully.",
    Cancer: "Having a Cancer moon sign places the Moon in the sign it rules, which makes your emotional world deep, intuitive, and powerful. You sense what others feel before they say a word, and caring for the people you love is second nature. Home matters enormously to you; it is where your heart recharges. Your moods move like tides, so gentleness with yourself matters. You find emotional security in close bonds, cherished memories, and a safe nest that is truly your own.",
    Leo: "Having a Leo moon sign means your emotions are warm, generous, and impossible to hide. When you're happy, the whole room feels it; when you're hurt, your silence speaks volumes. You need to feel appreciated by the people you love, and a little sincere recognition restores you completely. Your heart is loyal and dramatic in the best sense, always ready to celebrate the people you care about. You find emotional security in love that is expressed openly, creativity, and being truly seen.",
    Virgo: "Having a Virgo moon sign means you process feelings by making sense of them. You notice the small things others miss, and you show love through practical care: solving problems, remembering details, quietly making life easier for the people you cherish. Emotional chaos unsettles you, so order and routine calm your heart. Be gentle with your inner critic, which holds you to impossible standards. You find emotional security in being useful, keeping life tidy, and knowing you can rely on yourself.",
    Libra: "Having a Libra moon sign helps you analyze, understand, and manage your emotions wisely. You're always working to promote harmony in your relationships and the relationships around you. Do make sure that you protect your own interests as well as those of others. You tend to be very accommodating, but you'll enjoy the most emotional security from caring for your own needs alongside those of others.",
    Scorpio: "Having a Scorpio moon sign gives you an intense, all-or-nothing emotional world. You feel everything deeply, though you rarely show it right away, preferring to trust slowly and completely. Once someone earns your loyalty, you will stand by them through anything. Your intuition about people's hidden motives is uncanny. Letting others see your softer side takes courage, but it transforms your closest bonds. You find emotional security in depth, honesty, and relationships where nothing important stays unspoken.",
    Sagittarius: "Having a Sagittarius moon sign means your heart needs room to roam. Optimism is your emotional default, and you recover from setbacks faster than almost anyone, usually with a story and a laugh to show for it. Feeling trapped or boxed in is what truly unsettles you. New places, big ideas, and honest conversations restore your spirit. You find emotional security, paradoxically, in freedom: knowing you can explore, question, and grow keeps your heart settled and your outlook bright.",
    Capricorn: "Having a Capricorn moon sign means you keep your emotions composed and your standards high. You show love through commitment, responsibility, and quietly showing up when it counts. Others may read you as reserved, but beneath the surface is a loyal, surprisingly tender heart that simply prefers proof over promises. You tend to carry burdens alone, so letting trusted people support you is a skill worth practicing. You find emotional security in achievement, structure, and relationships built to last.",
    Aquarius: "Having an Aquarius moon sign means you understand feelings best from a little distance. You stay calm when others spiral, offering perspective instead of panic, and your friendships mean as much to you as romance. Emotional pressure or clinginess makes you retreat, since your heart needs breathing room. Underneath the cool exterior is genuine care for people, often expressed through ideals and causes. You find emotional security in independence, honest friendship, and being accepted exactly as unconventional as you are.",
    Pisces: "Having a Pisces moon sign gives you one of the most sensitive and compassionate hearts in the zodiac. You absorb the moods around you like water, which makes you deeply empathetic and occasionally overwhelmed. Imagination, music, and quiet time near water restore you. Boundaries are your lifelong lesson, since you give so freely that you can forget to save something for yourself. You find emotional security in creative expression, spiritual connection, and love that is gentle and unconditional.",
  };

  // ---------- Astronomy ----------
  // Geocentric lunar longitude, truncated ELP-2000/82 (Meeus ch. 47 main
  // terms). Validated against the Meeus worked example and documented
  // natal charts. The moon sign is geocentric, so birth place matters
  // only through its timezone.

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

  var LTERMS = [
    [0, 0, 1, 0, 6288774], [2, 0, -1, 0, 1274027], [2, 0, 0, 0, 658314],
    [0, 0, 2, 0, 213618], [0, 1, 0, 0, -185116], [0, 0, 0, 2, -114332],
    [2, 0, -2, 0, 58793], [2, -1, -1, 0, 57066], [2, 0, 1, 0, 53322],
    [2, -1, 0, 0, 45758], [0, 1, -1, 0, -40923], [1, 0, 0, 0, -34720],
    [0, 1, 1, 0, -30383], [2, 0, 0, -2, 15327], [0, 0, 1, 2, -12528],
    [0, 0, 1, -2, 10980], [4, 0, -1, 0, 10675], [0, 0, 3, 0, 10034],
    [4, 0, -2, 0, 8548], [2, 1, -1, 0, -7888], [2, 1, 0, 0, -6766],
    [1, 0, -1, 0, -5163], [1, 1, 0, 0, 4987], [2, -1, 1, 0, 4036],
    [2, 0, 2, 0, 3994], [4, 0, 0, 0, 3861], [2, 0, -3, 0, 3665],
    [0, 1, -2, 0, -2689], [2, 0, -1, 2, -2602], [2, -1, -2, 0, 2390],
    [1, 0, 1, 0, -2348], [2, -2, 0, 0, 2236], [0, 1, 2, 0, -2120],
    [0, 2, 0, 0, -2069], [2, -2, -1, 0, 2048], [2, 0, 1, -2, -1773],
    [2, 0, 0, 2, -1595], [4, -1, -1, 0, 1215], [0, 0, 2, 2, -1110],
    [3, 0, -1, 0, -892], [2, 1, 1, 0, -810], [4, -1, -2, 0, 759],
    [0, 2, -1, 0, -713], [2, 2, -1, 0, -700], [2, 1, -2, 0, 691],
    [2, -1, 0, -2, 596], [4, 0, 1, 0, 549], [0, 0, 4, 0, 537],
    [4, -1, 0, 0, 520], [1, 0, -2, 0, -487],
  ];

  function moonLongitude(utcMs) {
    var jd = utcMs / 86400000 + 2440587.5;
    var T = (jd - 2451545.0) / 36525;

    var Lp = mod360(218.3164477 + 481267.88123421 * T - 0.0015786 * T * T + T * T * T / 538841 - T * T * T * T / 65194000);
    var D = mod360(297.8501921 + 445267.1114034 * T - 0.0018819 * T * T + T * T * T / 545868 - T * T * T * T / 113065000);
    var M = mod360(357.5291092 + 35999.0502909 * T - 0.0001536 * T * T + T * T * T / 24490000);
    var Mp = mod360(134.9633964 + 477198.8675055 * T + 0.0087414 * T * T + T * T * T / 69699 - T * T * T * T / 14712000);
    var F = mod360(93.2720950 + 483202.0175233 * T - 0.0036539 * T * T - T * T * T / 3526000 + T * T * T * T / 863310000);
    var E = 1 - 0.002516 * T - 0.0000074 * T * T;

    var sum = 0;
    for (var i = 0; i < LTERMS.length; i++) {
      var t = LTERMS[i];
      var c = t[4];
      if (t[1] === 1 || t[1] === -1) c *= E;
      else if (t[1] === 2 || t[1] === -2) c *= E * E;
      sum += c * Math.sin((t[0] * D + t[1] * M + t[2] * Mp + t[3] * F) * D2R);
    }
    var A1 = mod360(119.75 + 131.849 * T);
    var A2 = mod360(53.09 + 479264.290 * T);
    sum += 3958 * Math.sin(A1 * D2R) + 1962 * Math.sin((Lp - F) * D2R) + 318 * Math.sin(A2 * D2R);

    return mod360(Lp + sum / 1e6);
  }

  function moonSign(year, month, day, hour, minute, tz) {
    var lng = moonLongitude(localToUtcMs(year, month, day, hour, minute, tz));
    return { sign: SIGNS[Math.floor(lng / 30)], degree: Math.floor(lng % 30) };
  }

  // ---------- Styles ----------

  var FONT = "'Segoe UI','Helvetica Neue',Helvetica,Arial,sans-serif";

  var CSS = "" +
    ":host{all:initial;display:block}" +
    "*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}" +
    ".wrap{position:relative;font-family:" + FONT + ";color:#fff;" +
    "background:#12222e url('" + ORIGIN + "/embed/img/moon/night-sky.jpg') center/cover no-repeat;" +
    "padding:56px 24px 46px;overflow:hidden;line-height:1.65}" +
    ".wrap::before{content:'';position:absolute;inset:0;background:rgba(6,14,22,.28)}" +
    ".inner{position:relative;max-width:860px;margin:0 auto}" +
    ".title{font-family:'Great Vibes',cursive;font-weight:400;font-size:clamp(44px,7vw,74px);" +
    "text-align:center;text-shadow:0 2px 12px rgba(0,0,0,.5);margin-bottom:22px}" +
    ".intro{font-size:19px;text-align:center;text-shadow:0 1px 6px rgba(0,0,0,.55);margin:0 auto 26px;max-width:820px}" +
    ".row{display:flex;align-items:center;gap:14px;margin-bottom:18px;flex-wrap:wrap}" +
    ".lbl{flex:0 0 130px;font-weight:700;font-size:20px;text-shadow:0 1px 4px rgba(0,0,0,.6)}" +
    ".fields{display:flex;gap:12px;flex:1;min-width:260px}" +
    "select,.place{appearance:none;-webkit-appearance:none;width:100%;padding:13px 34px 13px 16px;font-size:19px;" +
    "font-family:" + FONT + ";color:#fff;background-color:rgba(14,32,46,.65);border:1.5px solid rgba(255,255,255,.9);" +
    "border-radius:8px;outline:none;text-shadow:0 1px 3px rgba(0,0,0,.4)}" +
    "select{background-image:url(\"data:image/svg+xml;charset=utf-8,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='8'%3E%3Cpath d='M1 1l5 5 5-5' stroke='white' stroke-width='1.6' fill='none'/%3E%3C/svg%3E\");" +
    "background-repeat:no-repeat;background-position:right 12px center;cursor:pointer}" +
    "select:focus,.place:focus{border-color:#fff;box-shadow:0 0 0 2px rgba(255,255,255,.25)}" +
    "select option{color:#1e2c38;background:#fff;text-shadow:none}" +
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
    ".btn{display:inline-block;font-family:" + FONT + ";font-size:19px;font-weight:600;letter-spacing:.5px;color:#14273a;" +
    "background:linear-gradient(180deg,#f3f7fa,#d8e4ec);border:1.5px solid rgba(255,255,255,.9);border-radius:8px;" +
    "padding:14px 44px;cursor:pointer;box-shadow:0 4px 16px rgba(0,0,0,.35);transition:transform .15s ease,box-shadow .15s ease}" +
    ".btn:hover{transform:translateY(-1px);box-shadow:0 6px 20px rgba(0,0,0,.45)}" +
    ".err{display:none;text-align:center;margin-top:16px;font-size:17px;color:#ffce8a;text-shadow:0 1px 4px rgba(0,0,0,.6)}" +
    ".err.show{display:block}" +
    ".screen-result{display:none}" +
    ".screen-result.active{display:block;animation:fadein .6s ease}" +
    ".screen-form.hidden{display:none}" +
    "@keyframes fadein{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:none}}" +
    ".rname{font-family:'Great Vibes',cursive;font-weight:400;font-size:clamp(46px,6vw,66px);color:#fff;" +
    "text-align:center;text-shadow:0 2px 12px rgba(0,0,0,.55);line-height:1.1;margin-bottom:4px}" +
    ".deg{font-size:15px;font-style:italic;text-align:center;color:rgba(255,255,255,.85);margin-bottom:22px;text-shadow:0 1px 4px rgba(0,0,0,.5)}" +
    ".result{border:1px solid rgba(255,255,255,.9);border-radius:14px;" +
    "background:rgba(10,20,30,.38);backdrop-filter:blur(2px);padding:34px 30px}" +
    ".cols{display:flex;align-items:center;gap:28px}" +
    ".art{flex:0 0 36%;text-align:center}" +
    ".art img{max-width:100%;height:auto;display:block;margin:0 auto;filter:drop-shadow(0 1px 6px rgba(0,0,0,.5))}" +
    ".divider{flex:0 0 2px;align-self:stretch;background:rgba(255,255,255,.85);min-height:200px}" +
    ".meaning{flex:1;min-width:0}" +
    ".meaning p{font-size:18.5px;margin-bottom:14px;text-shadow:0 1px 4px rgba(0,0,0,.5)}" +
    ".meaning p:last-child{margin-bottom:0}" +
    ".outro{max-width:780px;margin:30px auto 0;text-align:center;font-size:18.5px;text-shadow:0 1px 5px rgba(0,0,0,.55)}" +
    ".outro a{color:#ff8a75;text-decoration:underline}" +
    ".retry{display:inline-block;font-family:" + FONT + ";font-size:19px;font-weight:700;letter-spacing:2px;" +
    "color:#e8a33d;background:none;border:none;cursor:pointer;text-shadow:0 1px 4px rgba(0,0,0,.5);padding:6px 10px}" +
    ".retry:hover{color:#f7bd63}" +
    ".ornament{display:flex;align-items:center;gap:16px;max-width:520px;margin:38px auto 0;opacity:.95}" +
    ".ornament .line{flex:1;height:1.5px;background:rgba(255,255,255,.9)}" +
    "@media(max-width:640px){" +
    ".lbl{flex:1 0 100%}" +
    ".cols{flex-direction:column}" +
    ".art{flex-basis:auto;max-width:250px}" +
    ".divider{display:none}" +
    ".result{padding:26px 18px}" +
    ".wrap{padding:40px 14px 40px}}";

  var MOON_SVG = "<svg width='34' height='34' viewBox='0 0 34 34' fill='none' xmlns='http://www.w3.org/2000/svg'>" +
    "<path d='M12 4 A 15 15 0 1 0 30 22 A 12.5 12.5 0 1 1 12 4 Z' stroke='white' stroke-width='1.6' fill='none' stroke-linejoin='round'/></svg>";

  // ---------- Markup ----------

  function option(value, label) {
    return "<option value=\"" + value + "\">" + label + "</option>";
  }

  function outroHtml() {
    return "Speaking with an intuitive psychic can help you take a deep dive into your personal astrological chart so you can gain a deeper understanding of how the stars and planets are influencing your life.";
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
      "<h2 class='title'>Moon Sign Calculator</h2>" +
      "<div class='screen-form'>" +
      "<p class='intro'>You're probably familiar with your sun sign, which is the primary zodiac sign considered for most horoscopes. However, you also have a secondary astrological sign known as your moon sign. This sign changes about every two and a half days, so you typically need to know the time as well as the location of your birth to determine your moon sign.</p>" +
      "<p class='intro'>Your moon sign impacts your emotional attitudes and how you handle the shifting tides of life. Enter your birth date, time, and location below to learn more about what your moon sign says about you.</p>" +
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
      "<div class='actions'><button class='btn' type='button'>Reveal My Moon Sign</button></div>" +
      "<div class='err' role='alert'></div>" +
      "</div>" +
      "<div class='screen-result' aria-live='polite'>" +
      "<div class='rname'></div><div class='deg'></div>" +
      "<div class='result'><div class='cols'>" +
      "<div class='art'><img alt='' loading='lazy'></div>" +
      "<div class='divider'></div>" +
      "<div class='meaning'><div class='mtext'></div></div>" +
      "</div></div>" +
      "<p class='outro'>" + outroHtml() + "</p>" +
      "<div class='actions'><button class='retry' type='button'>&#8592; RETRY</button></div>" +
      "<div class='ornament'><div class='line'></div>" + MOON_SVG + "<div class='line'></div></div>" +
      "</div>" +
      "</div></div>";
  }

  // ---------- Behavior ----------

  function init(host) {
    if (host.__psMoonSign) return;
    host.__psMoonSign = true;

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
      if (!v("hour") || v("minute") === "") return showError("Please select your birth time. The moon changes signs about every two and a half days, so the time matters.");
      if (!chosen) return showError("Please choose your birth place from the dropdown list.");

      var day = +v("day"), month = +v("month"), year = +v("year");
      var daysInMonth = new Date(year, month, 0).getDate();
      if (day > daysInMonth) return showError("That date does not exist. Please check the day and month.");

      var hour = (+v("hour")) % 12 + (v("ampm") === "PM" ? 12 : 0);
      var r = moonSign(year, month, day, hour, +v("minute"), chosen.timezone);

      $(".rname").textContent = r.sign;
      $(".deg").textContent = "Your moon sits at " + r.degree + "° " + r.sign + ".";
      $(".mtext").innerHTML = MEANINGS[r.sign].split("\n\n").map(function (p) { return "<p>" + p + "</p>"; }).join("");
      var img = $(".art img");
      img.src = ORIGIN + "/embed/img/moon/" + r.sign.toLowerCase() + ".png";
      img.alt = r.sign + " zodiac icon";
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
    var host = document.getElementById("ps-moon-sign") || document.querySelector("[data-ps-widget='moon-sign']");
    if (host) init(host);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})();
