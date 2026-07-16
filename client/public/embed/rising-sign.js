/* Rising Sign Calculator embed.
 * Usage on any site:
 *   <div id="ps-rising-sign"></div>
 *   <script async src="https://psychic-source-platform.vercel.app/embed/rising-sign.js"></script>
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
    Aries: "Aries is a fire sign that leads with courage. You come across as direct, energetic, and ready for whatever is next. People notice you the moment you walk in, and they tend to follow your lead without quite knowing why. First meetings feel like a spark: you make fast decisions, speak plainly, and rarely hesitate.\n\nOthers may read you as impatient or competitive, especially when things move slower than you would like. But that same boldness makes you the person everyone wants in their corner when it counts. You give the impression of someone who starts things, and you usually do.",
    Taurus: "Taurus is an earth sign that radiates calm. You come across as steady, warm, and completely unhurried, the kind of person others instinctively relax around. There is a quiet strength in the way you carry yourself, and people often describe you as comforting to be near.\n\nOthers may see you as stubborn once your mind is made up, and they are not entirely wrong. But that same steadiness reads as reliability, and people trust you with things that matter. You give the impression of someone built to last, with a fine eye for comfort, beauty, and the good things in life.",
    Gemini: "Gemini is an air sign that sparkles with curiosity. You come across as quick, witty, and endlessly interesting to talk to. Conversation is your natural element, and strangers often feel like they have known you for years within minutes of meeting you.\n\nOthers may see you as restless or hard to pin down, since your attention moves as fast as your mind. But that same liveliness makes you the person who keeps every room from going dull. You give the impression of youthfulness at any age, someone with a story, a question, and a joke always ready.",
    Cancer: "Cancer is a water sign that leads with care. You come across as warm, gentle, and quietly attentive, the person others open up to without meaning to. There is something in your presence that feels like home, and people remember how safe they felt around you long after they forget what was said.\n\nOthers may read you as reserved or moody at first, since you protect your softer side until you know someone is safe. But once that shell opens, your loyalty runs deeper than almost anyone's. You give the impression of someone who notices feelings others miss, because you do.",
    Leo: "Leo is a fire sign that shines without trying. You come across as confident, generous, and impossible to overlook. There is a natural warmth to your presence that draws people in, and you tend to become the center of the room whether you planned to or not.\n\nOthers may see you as dramatic or proud, and you do enjoy a little admiration. But that same radiance lifts everyone around you, and your generosity is as big as your presence. You give the impression of someone born for the spotlight, with a heart that matches the show.",
    Virgo: "Virgo is an earth sign that leads with precision. You come across as composed, polished, and quietly observant, the person who has clearly thought things through. Others often assume you are the most capable one in the room, and they are usually right.\n\nPeople may read you as reserved or exacting, since you hold yourself to standards most would find exhausting. But that same care makes you the one everyone turns to when something actually needs to be done well. You give the impression of effortless competence, even when your mind is running through every detail.",
    Libra: "Libra is an air sign that leads with grace. You come across as charming, considerate, and effortlessly pleasant to be around. You have a gift for making people feel seen, and social situations seem to smooth themselves out in your presence.\n\nOthers may see you as indecisive, since you weigh every side before you commit. But that same fairness makes people trust you as the diplomat, the matchmaker, and the friend who always knows what to say. You give the impression of elegance and balance, someone who makes the world feel a little more civilized.",
    Scorpio: "Scorpio is a water sign that leads with intensity. You come across as magnetic, composed, and a little mysterious, the person others notice immediately but cannot quite figure out. Your gaze feels like it sees straight through small talk, because it usually does.\n\nOthers may read you as guarded or intimidating, since you reveal yourself slowly and on your own terms. But that same depth makes your trust, once earned, feel like a privilege. You give the impression of quiet power, someone who holds more beneath the surface than they will ever show at once.",
    Sagittarius: "Sagittarius is a fire sign that leads with optimism. You come across as open, adventurous, and refreshingly honest, the person whose laugh carries across the room. People feel freer around you, as if the world just got bigger and more interesting.\n\nOthers may see you as blunt or restless, since you say what you think and resist anything that feels like a cage. But that same candor is why people trust you, and your enthusiasm is genuinely contagious. You give the impression of someone mid-journey, always with one more horizon in mind.",
    Capricorn: "Capricorn is an earth sign that keeps you grounded. You give off an air of total competence and unending dedication. You'll excel in job interviews, where these qualities are highly prized. In social settings, others may see you as a stolid workaholic with a somewhat demanding attitude.\n\nYou seem mature for your age and come across as extremely organized and driven. People instinctively hand you the difficult things, because you look like someone who finishes what they start. Beneath the composed exterior is a dry wit and a loyalty that those closest to you know well.",
    Aquarius: "Aquarius is an air sign that leads with originality. You come across as independent, intriguing, and quietly unconventional, the person who sees the world from an angle no one else considered. People often remember meeting you, even when the meeting was brief.\n\nOthers may read you as detached or hard to reach, since you live partly in the future and guard your independence closely. But that same distance gives you rare clarity, and your acceptance of people as they are makes you a magnet for interesting souls. You give the impression of someone ahead of their time.",
    Pisces: "Pisces is a water sign that leads with imagination. You come across as gentle, dreamy, and deeply intuitive, the person who seems tuned to a frequency others cannot hear. There is a softness in your presence that invites people to lower their defenses.\n\nOthers may see you as elusive or lost in thought, drifting somewhere just beyond the conversation. But that same sensitivity lets you understand people better than they understand themselves. You give the impression of an old soul, compassionate without effort and creative without trying.",
  };

  // ---------- Astronomy (validated against documented natal charts) ----------

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

  function ascendantLongitude(utcMs, latDeg, lonDeg) {
    var jd = utcMs / 86400000 + 2440587.5;
    var T = (jd - 2451545.0) / 36525;
    var gmst = mod360(280.46061837 + 360.98564736629 * (jd - 2451545.0)
      + 0.000387933 * T * T - (T * T * T) / 38710000);
    var ramc = mod360(gmst + lonDeg) * D2R;
    var eps = (23.4392911 - 0.0130042 * T - 1.64e-7 * T * T + 5.04e-7 * T * T * T) * D2R;
    var phi = latDeg * D2R;
    var asc = Math.atan2(Math.cos(ramc), -(Math.sin(ramc) * Math.cos(eps) + Math.tan(phi) * Math.sin(eps)));
    return mod360(asc / D2R);
  }

  function risingSign(year, month, day, hour, minute, tz, lat, lon) {
    var lng = ascendantLongitude(localToUtcMs(year, month, day, hour, minute, tz), lat, lon);
    return { sign: SIGNS[Math.floor(lng / 30)], degree: Math.floor(lng % 30) };
  }

  // ---------- Styles ----------

  var CSS = "" +
    ":host{all:initial;display:block}" +
    "*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}" +
    ".wrap{position:relative;font-family:Georgia,'Times New Roman',serif;color:#fff;" +
    "background:#6b5d49 url('" + ORIGIN + "/embed/img/sky.jpg') center/cover no-repeat;" +
    "padding:56px 24px 64px;overflow:hidden;line-height:1.6}" +
    ".wrap::before{content:'';position:absolute;inset:0;background:rgba(40,32,20,.25)}" +
    ".inner{position:relative;max-width:860px;margin:0 auto}" +
    ".title{font-family:'Great Vibes',cursive;font-weight:400;font-size:clamp(44px,7vw,74px);" +
    "text-align:center;text-shadow:0 2px 12px rgba(0,0,0,.35);margin-bottom:18px}" +
    ".intro{font-size:19px;text-align:center;text-shadow:0 1px 6px rgba(0,0,0,.4);margin:0 auto 40px;max-width:820px}" +
    ".row{display:flex;align-items:center;gap:14px;margin-bottom:18px;flex-wrap:wrap}" +
    ".lbl{flex:0 0 130px;font-weight:700;font-size:20px;font-family:Arial,Helvetica,sans-serif;text-shadow:0 1px 4px rgba(0,0,0,.45)}" +
    ".fields{display:flex;gap:12px;flex:1;min-width:260px}" +
    "select,.place{appearance:none;-webkit-appearance:none;width:100%;padding:13px 34px 13px 16px;font-size:19px;" +
    "font-family:Georgia,serif;color:#fff;background-color:rgba(148,124,88,.55);border:1px solid rgba(255,255,255,.75);" +
    "border-radius:6px;outline:none;text-shadow:0 1px 3px rgba(0,0,0,.3)}" +
    "select{background-image:url(\"data:image/svg+xml;charset=utf-8,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='8'%3E%3Cpath d='M1 1l5 5 5-5' stroke='white' stroke-width='1.6' fill='none'/%3E%3C/svg%3E\");" +
    "background-repeat:no-repeat;background-position:right 12px center;cursor:pointer}" +
    "select:focus,.place:focus{border-color:#fff;box-shadow:0 0 0 2px rgba(255,255,255,.25)}" +
    "select option{color:#3a3128;background:#fff;text-shadow:none}" +
    ".sel{flex:1}" +
    ".place::placeholder{color:rgba(255,255,255,.75)}" +
    ".placewrap{position:relative;flex:1}" +
    ".drop{position:absolute;top:calc(100% + 2px);left:0;right:0;background:#fff;border-radius:4px;" +
    "box-shadow:0 10px 30px rgba(0,0,0,.35);z-index:30;max-height:280px;overflow-y:auto;display:none}" +
    ".drop.open{display:block}" +
    ".opt{padding:14px 18px;font-size:19px;color:#2e2820;cursor:pointer;border-bottom:1px solid #eee;text-shadow:none}" +
    ".opt:last-child{border-bottom:0}" +
    ".opt:hover,.opt.hi{background:#f3ecdf}" +
    ".actions{text-align:center;margin-top:30px}" +
    ".btn{display:inline-block;font-family:Georgia,serif;font-size:20px;letter-spacing:.5px;color:#3a2f1c;" +
    "background:linear-gradient(180deg,#f0d9a6,#dcb875);border:1px solid rgba(255,255,255,.8);border-radius:8px;" +
    "padding:14px 44px;cursor:pointer;box-shadow:0 4px 16px rgba(0,0,0,.25);transition:transform .15s ease,box-shadow .15s ease}" +
    ".btn:hover{transform:translateY(-1px);box-shadow:0 6px 20px rgba(0,0,0,.3)}" +
    ".btn:disabled{opacity:.6;cursor:default;transform:none}" +
    ".err{display:none;text-align:center;margin-top:16px;font-size:17px;color:#ffd9b0;text-shadow:0 1px 4px rgba(0,0,0,.5)}" +
    ".err.show{display:block}" +
    ".screen-result{display:none}" +
    ".screen-result.active{display:block;animation:fadein .6s ease}" +
    ".screen-form.hidden{display:none}" +
    ".result{margin-top:8px;border:1px solid rgba(255,255,255,.85);border-radius:26px;" +
    "background:rgba(48,38,24,.4);backdrop-filter:blur(2px);padding:38px 34px}" +
    ".outro{max-width:760px;margin:30px auto 0;text-align:center;font-size:18px;text-shadow:0 1px 5px rgba(0,0,0,.45)}" +
    ".btn2{display:inline-block;font-family:Georgia,serif;font-size:18px;letter-spacing:.5px;color:#fff;" +
    "background:rgba(148,124,88,.45);border:1px solid rgba(255,255,255,.8);border-radius:8px;" +
    "padding:12px 36px;cursor:pointer;text-shadow:0 1px 3px rgba(0,0,0,.35);transition:background .15s ease}" +
    ".btn2:hover{background:rgba(148,124,88,.7)}" +
    "@keyframes fadein{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:none}}" +
    ".cols{display:flex;align-items:center;gap:30px}" +
    ".art{flex:0 0 38%;text-align:center}" +
    ".art img{max-width:100%;height:auto;display:block;margin:0 auto;filter:drop-shadow(0 1px 5px rgba(0,0,0,.55))}" +
    ".divider{flex:0 0 14px;align-self:stretch;display:flex;align-items:center;justify-content:center}" +
    ".meaning{flex:1;min-width:0}" +
    ".rname{font-family:'Great Vibes',cursive;font-weight:400;font-size:clamp(38px,5vw,58px);color:#eec380;" +
    "text-shadow:0 2px 10px rgba(0,0,0,.35);margin-bottom:6px;line-height:1.15}" +
    ".deg{font-size:15px;font-style:italic;color:rgba(255,255,255,.85);margin-bottom:16px}" +
    ".meaning p{font-size:18.5px;margin-bottom:14px;text-shadow:0 1px 4px rgba(0,0,0,.35)}" +
    ".meaning p:last-child{margin-bottom:0}" +
    "@media(max-width:640px){" +
    ".lbl{flex:1 0 100%}" +
    ".cols{flex-direction:column}" +
    ".art{flex-basis:auto;max-width:280px}" +
    ".divider{display:none}" +
    ".result{padding:28px 20px}" +
    ".wrap{padding:40px 14px 48px}}";

  var DIVIDER_SVG = "<svg width='14' height='260' viewBox='0 0 14 260' fill='none' xmlns='http://www.w3.org/2000/svg' style='height:100%;min-height:220px'>" +
    "<line x1='7' y1='0' x2='7' y2='96' stroke='white' stroke-width='1' opacity='.9'/>" +
    "<path d='M7 100 L11 110 L7 120 L3 110 Z' stroke='white' fill='none'/>" +
    "<circle cx='7' cy='130' r='5' stroke='white' fill='none'/><circle cx='7' cy='130' r='2' fill='white'/>" +
    "<path d='M7 140 L11 150 L7 160 L3 150 Z' stroke='white' fill='none'/>" +
    "<line x1='7' y1='164' x2='7' y2='260' stroke='white' stroke-width='1' opacity='.9'/>" +
    "<path d='M7 0 L10 8 L7 16 L4 8 Z' fill='white'/><path d='M7 244 L10 252 L7 260 L4 252 Z' fill='white'/></svg>";

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
      "<h2 class='title'>Rising Sign Calculator</h2>" +
      "<div class='screen-form'>" +
      "<p class='intro'>You're probably familiar with your sun sign, which is your primary zodiac sign, but you may not know about your rising sign. Also known as your ascendant sign, your rising sign represents the mask that you wear for the world. This is the zodiac sign that was rising over the eastern horizon at the time of your birth. Rising signs change every two hours, so you need to know exactly when you came into the world to determine your ascendant. Fill out the information below to learn more about the outward impression that you give to the world.</p>" +
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
      "<div class='actions'><button class='btn' type='button'>Reveal My Rising Sign</button></div>" +
      "<div class='err' role='alert'></div>" +
      "</div>" +
      "<div class='screen-result' aria-live='polite'>" +
      "<div class='result'><div class='cols'>" +
      "<div class='art'><img alt='' loading='lazy'></div>" +
      "<div class='divider'>" + DIVIDER_SVG + "</div>" +
      "<div class='meaning'><div class='rname'></div><div class='deg'></div><div class='mtext'></div></div>" +
      "</div></div>" +
      "<p class='outro'>For a more complete picture, be sure to check out your Sun and Moon sign. Together, these 3 placements form the foundation of your personality. You can also request a psychic astrologer review your complete natal chart with you for even deeper insights.</p>" +
      "<div class='actions'><button class='btn2' type='button'>Start Over</button></div>" +
      "</div>" +
      "</div></div>";
  }

  // ---------- Behavior ----------

  function init(host) {
    if (host.__psRisingSign) return;
    host.__psRisingSign = true;

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

    var chosen = null;   // {name, region, country, timezone, lat, lon}
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
      if (!v("hour") || v("minute") === "") return showError("Please select your birth time. Rising signs change every two hours, so the time matters.");
      if (!chosen) return showError("Please choose your birth place from the dropdown list.");

      var day = +v("day"), month = +v("month"), year = +v("year");
      var daysInMonth = new Date(year, month, 0).getDate();
      if (day > daysInMonth) return showError("That date does not exist. Please check the day and month.");

      var hour = (+v("hour")) % 12 + (v("ampm") === "PM" ? 12 : 0);
      var r = risingSign(year, month, day, hour, +v("minute"), chosen.timezone, chosen.lat, chosen.lon);

      $(".rname").textContent = r.sign + " Rising";
      $(".deg").textContent = "Your ascendant sits at " + r.degree + "° " + r.sign + ".";
      $(".mtext").innerHTML = MEANINGS[r.sign].split("\n\n").map(function (p) { return "<p>" + p + "</p>"; }).join("");
      var img = $(".art img");
      img.src = ORIGIN + "/embed/img/" + r.sign.toLowerCase() + ".png";
      img.alt = r.sign + " line art illustration";
      formScreen.classList.add("hidden");
      resultScreen.classList.add("active");
      $(".wrap").scrollIntoView({ behavior: "smooth", block: "start" });
    });

    $(".btn2").addEventListener("click", function () {
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
    var host = document.getElementById("ps-rising-sign") || document.querySelector("[data-ps-widget='rising-sign']");
    if (host) init(host);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})();
