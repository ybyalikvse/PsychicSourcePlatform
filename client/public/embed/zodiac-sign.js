/* What's My Zodiac Sign? calculator embed.
 * Usage on any site:
 *   <div id="ps-zodiac-sign"></div>
 *   <script async src="https://psychic-source-platform.vercel.app/embed/zodiac-sign.js"></script>
 * Renders directly into the page (Shadow DOM), no iframe. No API calls.
 */
(function () {
  "use strict";

  var SCRIPT_SRC = (document.currentScript && document.currentScript.src) || "";
  var ORIGIN = SCRIPT_SRC ? new URL(SCRIPT_SRC).origin : "https://psychic-source-platform.vercel.app";

  var CTA_URL = "https://www.psychicsource.com/psychic-advice/astrology-readings";
  var CTA_TEXT = "Get a reading from a psychic astrologer";

  // Standard tropical sun-sign date ranges (from month day, inclusive).
  var Z = [
    { name: "Capricorn", glyph: "♑", from: [12,22], to: [1,19], element: "Earth", modality: "Cardinal", ruler: "Saturn", dates: "December 22 to January 19", traits: "Disciplined, ambitious, and patient. Capricorns are the quiet achievers of the zodiac, climbing steadily toward their goals with remarkable self-control and a dry wit few see coming." },
    { name: "Aquarius", glyph: "♒", from: [1,20], to: [2,18], element: "Air", modality: "Fixed", ruler: "Uranus", dates: "January 20 to February 18", traits: "Original, independent, and humanitarian. Aquarians think ahead of their time, march to their own beat, and care deeply about ideas and the collective good." },
    { name: "Pisces", glyph: "♓", from: [2,19], to: [3,20], element: "Water", modality: "Mutable", ruler: "Neptune", dates: "February 19 to March 20", traits: "Compassionate, imaginative, and intuitive. Pisces feel everything deeply and dwell in dreams, art, and empathy, often sensing what others cannot put into words." },
    { name: "Aries", glyph: "♈", from: [3,21], to: [4,19], element: "Fire", modality: "Cardinal", ruler: "Mars", dates: "March 21 to April 19", traits: "Bold, energetic, and pioneering. Aries charge at life head-first, thrive on challenge, and lead with courage and refreshing directness." },
    { name: "Taurus", glyph: "♉", from: [4,20], to: [5,20], element: "Earth", modality: "Fixed", ruler: "Venus", dates: "April 20 to May 20", traits: "Steady, sensual, and loyal. Taurus values comfort, beauty, and security, moving at its own unhurried pace and standing immovable once its mind is made up." },
    { name: "Gemini", glyph: "♊", from: [5,21], to: [6,20], element: "Air", modality: "Mutable", ruler: "Mercury", dates: "May 21 to June 20", traits: "Curious, witty, and adaptable. Geminis are the communicators of the zodiac, quick-minded and endlessly interested, happiest with variety and a good conversation." },
    { name: "Cancer", glyph: "♋", from: [6,21], to: [7,22], element: "Water", modality: "Cardinal", ruler: "the Moon", dates: "June 21 to July 22", traits: "Nurturing, sensitive, and protective. Cancers lead with feeling, treasure home and family, and offer deep loyalty to those they let inside their shell." },
    { name: "Leo", glyph: "♌", from: [7,23], to: [8,22], element: "Fire", modality: "Fixed", ruler: "the Sun", dates: "July 23 to August 22", traits: "Warm, confident, and generous. Leos are born to shine, leading with heart and drama, and lifting everyone around them with their radiant, loyal spirit." },
    { name: "Virgo", glyph: "♍", from: [8,23], to: [9,22], element: "Earth", modality: "Mutable", ruler: "Mercury", dates: "August 23 to September 22", traits: "Precise, helpful, and analytical. Virgos notice the details everyone else misses and find real meaning in improving things and being of genuine service." },
    { name: "Libra", glyph: "♎", from: [9,23], to: [10,22], element: "Air", modality: "Cardinal", ruler: "Venus", dates: "September 23 to October 22", traits: "Charming, fair-minded, and relational. Libras seek balance, beauty, and harmony, with a gift for diplomacy and making everyone around them feel seen." },
    { name: "Scorpio", glyph: "♏", from: [10,23], to: [11,21], element: "Water", modality: "Fixed", ruler: "Pluto", dates: "October 23 to November 21", traits: "Intense, magnetic, and deep. Scorpios feel and perceive on a level others rarely reach, drawn to truth, transformation, and bonds of total loyalty." },
    { name: "Sagittarius", glyph: "♐", from: [11,22], to: [12,21], element: "Fire", modality: "Mutable", ruler: "Jupiter", dates: "November 22 to December 21", traits: "Adventurous, optimistic, and honest. Sagittarians chase freedom, meaning, and the next horizon, bringing contagious enthusiasm and blunt good humor wherever they go." },
  ];

  function signFor(month, day) {
    for (var i = 0; i < Z.length; i++) {
      var z = Z[i], f = z.from, t = z.to;
      if (f[0] === t[0]) { if (month === f[0] && day >= f[1] && day <= t[1]) return z; }
      else if ((month === f[0] && day >= f[1]) || (month === t[0] && day <= t[1])) return z;
    }
    return Z[0]; // Capricorn wraps year end
  }

  var FONT = "'Segoe UI','Helvetica Neue',Helvetica,Arial,sans-serif";
  var GOLD = "#e8a75e";
  var CSS = "" +
    ":host{all:initial;display:block}" +
    "*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}" +
    ".wrap{position:relative;font-family:" + FONT + ";color:#fff;background:#0a0a16 url('" + ORIGIN + "/embed/img/mars/space.jpg') center/cover no-repeat;padding:54px 24px 56px;overflow:hidden;line-height:1.65;text-align:center}" +
    ".inner{position:relative;max-width:820px;margin:0 auto}" +
    ".title{font-family:'Great Vibes',cursive;font-weight:400;font-size:clamp(46px,7vw,74px);color:" + GOLD + ";text-shadow:0 2px 12px rgba(0,0,0,.5);margin-bottom:10px;line-height:1.1}" +
    ".intro{font-size:19px;margin:0 auto 26px;max-width:720px;text-shadow:0 1px 6px rgba(0,0,0,.5)}" +
    ".pickrow{display:flex;gap:14px;justify-content:center;align-items:center;flex-wrap:wrap}" +
    ".lbl{font-weight:700;font-size:19px}" +
    "select{appearance:none;-webkit-appearance:none;padding:13px 40px 13px 16px;font-size:19px;font-family:" + FONT + ";color:#fff;background-color:rgba(16,16,30,.75);border:1.5px solid rgba(255,255,255,.9);border-radius:8px;outline:none;cursor:pointer;background-image:url(\"data:image/svg+xml;charset=utf-8,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='8'%3E%3Cpath d='M1 1l5 5 5-5' stroke='white' stroke-width='1.6' fill='none'/%3E%3C/svg%3E\");background-repeat:no-repeat;background-position:right 14px center}" +
    "select:focus{border-color:#fff;box-shadow:0 0 0 2px rgba(255,255,255,.25)}select option{color:#1c1c2e;background:#fff}" +
    ".actions{text-align:center;margin-top:28px}" +
    ".btn{display:inline-block;font-family:" + FONT + ";font-size:19px;font-weight:600;color:#241505;background:linear-gradient(180deg,#f2b26d," + GOLD + ");border:1.5px solid rgba(255,255,255,.85);border-radius:10px;padding:14px 44px;cursor:pointer;box-shadow:0 4px 16px rgba(0,0,0,.4);transition:transform .15s ease}" +
    ".btn:hover{transform:translateY(-1px)}" +
    ".err{display:none;margin-top:16px;font-size:17px;color:#ffce8a}.err.show{display:block}" +
    ".screen-result{display:none}.screen-result.active{display:block;animation:fadein .6s ease}.screen-form.hidden{display:none}" +
    "@keyframes fadein{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:none}}" +
    ".card{border:1.5px solid " + GOLD + ";border-radius:22px;background:rgba(255,255,255,.05);padding:34px 30px;max-width:600px;margin:0 auto}" +
    ".card img{width:120px;height:120px;margin:0 auto 6px;display:block;filter:drop-shadow(0 1px 6px rgba(0,0,0,.45))}" +
    ".sname{font-family:'Great Vibes',cursive;font-size:clamp(48px,8vw,68px);color:" + GOLD + ";line-height:1.05}" +
    ".sdates{font-style:italic;opacity:.85;margin-bottom:18px}" +
    ".facts{display:flex;justify-content:center;gap:26px;flex-wrap:wrap;margin-bottom:20px}" +
    ".fact .fv{font-size:20px;font-weight:600;color:" + GOLD + "}.fact .fl{font-size:12px;letter-spacing:1.5px;text-transform:uppercase;opacity:.75}" +
    ".straits{font-size:18.5px;text-shadow:0 1px 4px rgba(0,0,0,.4)}" +
    ".outro{font-size:18px;max-width:640px;margin:24px auto 0;text-shadow:0 1px 5px rgba(0,0,0,.4)}" +
    ".cta{display:inline-block;font-family:" + FONT + ";font-size:18px;font-weight:600;color:#241505;text-decoration:none;background:linear-gradient(180deg,#f2b26d," + GOLD + ");border-radius:999px;padding:14px 40px;box-shadow:0 4px 16px rgba(0,0,0,.35)}" +
    ".retry{display:block;margin:14px auto 0;font-family:" + FONT + ";font-size:17px;font-weight:700;letter-spacing:2px;color:" + GOLD + ";background:none;border:none;cursor:pointer}" +
    "@media(max-width:600px){.wrap{padding:40px 14px 44px}}";

  function option(v, l) { return "<option value=\"" + v + "\">" + l + "</option>"; }
  function buildHtml() {
    var mn = ["January","February","March","April","May","June","July","August","September","October","November","December"];
    var months = "<option value=''>Month</option>"; for (var m = 1; m <= 12; m++) months += option(m, mn[m-1]);
    var days = "<option value=''>Day</option>"; for (var d = 1; d <= 31; d++) days += option(d, d);
    var cta = CTA_URL ? "<div class='actions'><a class='cta' href='" + CTA_URL + "'>" + CTA_TEXT + "</a></div>" : "";
    return "<div class='wrap'><div class='inner'>" +
      "<h2 class='title'>What's My Zodiac Sign?</h2>" +
      "<div class='screen-form'>" +
      "<p class='intro'>Your Sun sign is the heart of your personality, the sign the Sun was traveling through on the day you were born. Enter your birthday to find yours.</p>" +
      "<div class='pickrow'><span class='lbl'>Birthday:</span>" +
      "<select data-f='month' aria-label='Birth month'>" + months + "</select>" +
      "<select data-f='day' aria-label='Birth day'>" + days + "</select></div>" +
      "<div class='actions'><button class='btn' type='button'>Reveal My Sign</button></div>" +
      "<div class='err' role='alert'></div>" +
      "</div>" +
      "<div class='screen-result' aria-live='polite'>" +
      "<div class='card'>" +
      "<img alt=''>" +
      "<div class='sname'></div><div class='sdates'></div>" +
      "<div class='facts'>" +
      "<div class='fact'><div class='fv' data-v='element'></div><div class='fl'>Element</div></div>" +
      "<div class='fact'><div class='fv' data-v='modality'></div><div class='fl'>Modality</div></div>" +
      "<div class='fact'><div class='fv' data-v='ruler'></div><div class='fl'>Ruler</div></div>" +
      "</div>" +
      "<div class='straits'></div></div>" +
      "<p class='outro'>Your Sun sign is just the beginning. Your Moon, Rising, and the rest of your chart complete the picture.</p>" +
      cta +
      "<button class='retry' type='button'>&#8592; Try Another Date</button>" +
      "</div>" +
      "</div></div>";
  }

  function init(host) {
    if (host.__psZodiacSign) return; host.__psZodiacSign = true;
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
      var month = +fields.month.value, day = +fields.day.value;
      if (!month || !day) { err.textContent = "Please pick your birth month and day."; err.classList.add("show"); return; }
      if (day > new Date(2001, month, 0).getDate()) { err.textContent = "That date does not exist. Please check the day."; err.classList.add("show"); return; }
      var z = signFor(month, day);
      $(".card img").src = ORIGIN + "/embed/img/mars/" + z.name.toLowerCase() + ".png";
      $(".card img").alt = z.name;
      $(".sname").textContent = z.glyph + "︎ " + z.name;
      $(".sdates").textContent = z.dates;
      mount.querySelector("[data-v='element']").textContent = z.element;
      mount.querySelector("[data-v='modality']").textContent = z.modality;
      mount.querySelector("[data-v='ruler']").textContent = z.ruler;
      $(".straits").textContent = z.traits;
      formScreen.classList.add("hidden"); resultScreen.classList.add("active");
      $(".wrap").scrollIntoView({ behavior: "smooth", block: "start" });
    });
    $(".retry").addEventListener("click", function () {
      fields.month.value = ""; fields.day.value = ""; err.classList.remove("show");
      resultScreen.classList.remove("active"); formScreen.classList.remove("hidden");
      $(".wrap").scrollIntoView({ behavior: "smooth", block: "start" });
    });
  }
  function boot() { var host = document.getElementById("ps-zodiac-sign") || document.querySelector("[data-ps-widget='zodiac-sign']"); if (host) init(host); }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot); else boot();
})();
