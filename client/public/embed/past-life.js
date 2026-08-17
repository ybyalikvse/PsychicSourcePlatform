/* Who Were You in a Past Life? embed.
 * Usage on any site:
 *   <div id="ps-past-life"></div>
 *   <script async src="https://psychic-source-platform.vercel.app/embed/past-life.js"></script>
 * Renders directly into the page (Shadow DOM), no iframe. No API calls.
 * Deterministic from name + birth date, so a person always gets the same result.
 */
(function () {
  "use strict";
  var SCRIPT_SRC = (document.currentScript && document.currentScript.src) || "";
  var ORIGIN = SCRIPT_SRC ? new URL(SCRIPT_SRC).origin : "https://psychic-source-platform.vercel.app";
  var CTA_URL = "https://www.psychicsource.com/psychic-advice/past-life-readings";
  var CTA_TEXT = "Explore your past lives with a psychic";

  var ERAS = [
    { name: "Ancient Egypt", when: "along the Nile over three thousand years ago" },
    { name: "Classical Greece", when: "in the age of philosophers and city-states" },
    { name: "the Roman Empire", when: "when Rome ruled the known world" },
    { name: "Feudal Japan", when: "in the era of samurai and silent temples" },
    { name: "the Viking Age", when: "among the seafarers of the cold North" },
    { name: "Renaissance Italy", when: "amid the rebirth of art and ideas" },
    { name: "the American frontier", when: "in the restless days of the Old West" },
    { name: "Victorian England", when: "in the gaslit age of invention and secrets" },
    { name: "the Maya civilization", when: "beneath the star-charting temples of Mesoamerica" },
    { name: "medieval Persia", when: "along the poetry and spice roads of the East" },
    { name: "Ming Dynasty China", when: "in an age of porcelain, silk, and scholarship" },
    { name: "precolonial West Africa", when: "in the great trading kingdoms of gold and story" },
  ];
  var ROLES = [
    { title: "a healer", desc: "tending the sick with herbs, hands, and an uncanny intuition for what the body needed" },
    { title: "a scholar", desc: "poring over manuscripts by candlelight, hungry to understand the workings of the world" },
    { title: "a warrior", desc: "known for courage and a fierce loyalty to the people you were sworn to protect" },
    { title: "an artist", desc: "creating beauty that outlived you, driven by a vision others could not yet see" },
    { title: "a merchant traveler", desc: "crossing borders and cultures, trading goods and carrying stories from far away" },
    { title: "an oracle", desc: "consulted by the powerful for the visions and dreams that came to you unbidden" },
    { title: "an explorer", desc: "always drawn to the horizon, mapping places no one you knew had ever seen" },
    { title: "a keeper of the land", desc: "living close to the seasons, patient and rooted, feeding a whole community" },
    { title: "a trusted advisor", desc: "whispering counsel to rulers, shaping decisions from just behind the throne" },
    { title: "a master craftsperson", desc: "shaping metal, wood, or cloth into works so fine they were spoken of for generations" },
    { title: "a storyteller", desc: "keeping the memory of your people alive in song and tale around the fire" },
    { title: "a navigator", desc: "reading the stars and currents to carry others safely across open water" },
  ];
  var LESSONS = [
    "The courage you carried then still lives in you; you are meant to lead again.",
    "You left that life with wisdom unfinished, and you are here to complete the lesson of patience.",
    "A love you lost echoes still; this life is your chance to keep your heart open.",
    "You learned to survive alone then. This time, you are meant to let others in.",
    "The creative gift you buried before is asking to be reclaimed now.",
    "You served others so fully that you forgot yourself; this life asks you to honor your own needs too.",
    "The restlessness you feel is an old traveler's soul; your purpose is a journey, not a destination.",
    "You held power carefully once, and you are being trusted with it again.",
  ];

  function hash(str) { var h = 5381; for (var i = 0; i < str.length; i++) h = ((h * 33) ^ str.charCodeAt(i)) >>> 0; return h; }

  var FONT = "'Segoe UI','Helvetica Neue',Helvetica,Arial,sans-serif";
  var GOLD = "#eda45f";
  var CSS = "" +
    ":host{all:initial;display:block}*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}" +
    ".wrap{position:relative;font-family:" + FONT + ";color:#fff;background:radial-gradient(ellipse 80% 60% at 50% 8%,#2a2350 0%,#191536 55%,#0f0c22 100%);padding:54px 24px 58px;overflow:hidden;line-height:1.65;text-align:center}" +
    ".stars{position:absolute;inset:0;pointer-events:none}.inner{position:relative;max-width:720px;margin:0 auto}" +
    ".title{font-family:'Great Vibes',cursive;font-weight:400;font-size:clamp(44px,7vw,72px);color:" + GOLD + ";text-shadow:0 2px 14px rgba(0,0,0,.5);margin-bottom:10px;line-height:1.05}" +
    ".intro{font-size:19px;margin:0 auto 24px;max-width:600px;text-shadow:0 1px 6px rgba(0,0,0,.5)}" +
    ".field{margin:0 auto 14px;max-width:420px}" +
    ".nin{width:100%;padding:14px 16px;font-size:19px;font-family:" + FONT + ";color:#fff;background:rgba(255,255,255,.12);border:1.5px solid rgba(255,255,255,.8);border-radius:10px;outline:none;text-align:center}" +
    ".nin:focus{border-color:#fff}.nin::placeholder{color:rgba(255,255,255,.6)}" +
    ".drow{display:flex;gap:10px;justify-content:center}" +
    "select{appearance:none;-webkit-appearance:none;padding:13px 34px 13px 14px;font-size:18px;font-family:" + FONT + ";color:#fff;background-color:rgba(20,20,40,.8);border:1.5px solid rgba(255,255,255,.8);border-radius:8px;outline:none;cursor:pointer;background-image:url(\"data:image/svg+xml;charset=utf-8,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='8'%3E%3Cpath d='M1 1l5 5 5-5' stroke='white' stroke-width='1.6' fill='none'/%3E%3C/svg%3E\");background-repeat:no-repeat;background-position:right 12px center}" +
    "select:focus{border-color:#fff}select option{color:#1c1c2e;background:#fff}" +
    ".btn{display:inline-block;font-family:" + FONT + ";font-size:19px;font-weight:600;color:#241505;background:linear-gradient(180deg,#f2b26d," + GOLD + ");border:none;border-radius:999px;padding:15px 44px;cursor:pointer;box-shadow:0 4px 16px rgba(0,0,0,.4);transition:transform .15s ease;margin-top:8px}" +
    ".btn:hover{transform:translateY(-1px)}" +
    ".err{display:none;margin-top:14px;font-size:16px;color:#ffce8a}.err.show{display:block}" +
    ".screen-result{display:none}.screen-result.active{display:block;animation:fadein .5s ease}.screen-form.hidden{display:none}" +
    "@keyframes fadein{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:none}}" +
    ".lead{font-size:19px;opacity:.85;margin-bottom:6px}" +
    ".era{font-family:'Great Vibes',cursive;font-size:clamp(44px,7vw,62px);color:" + GOLD + ";line-height:1.1}" +
    ".story{font-size:19px;max-width:620px;margin:16px auto 0;text-shadow:0 1px 5px rgba(0,0,0,.4)}" +
    ".lesson{font-size:18px;font-style:italic;color:#f0d3ac;max-width:600px;margin:18px auto 0}" +
    ".cta{display:inline-block;font-family:" + FONT + ";font-size:18px;font-weight:600;color:#241505;text-decoration:none;background:linear-gradient(180deg,#f2b26d," + GOLD + ");border-radius:999px;padding:14px 40px;box-shadow:0 4px 16px rgba(0,0,0,.35);margin-top:24px}" +
    ".retry{display:block;margin:14px auto 0;font-size:17px;font-weight:700;letter-spacing:1px;color:" + GOLD + ";background:none;border:none;cursor:pointer;font-family:" + FONT + "}" +
    "@media(max-width:600px){.wrap{padding:40px 14px 46px}}";

  function starsSvg() { var s = "<svg class='stars' viewBox='0 0 1000 600' preserveAspectRatio='xMidYMid slice' xmlns='http://www.w3.org/2000/svg'>", seed = 17; function rnd(){seed=(seed*9301+49297)%233280;return seed/233280;} for (var i=0;i<70;i++) s+="<circle cx='"+(rnd()*1000).toFixed(0)+"' cy='"+(rnd()*600).toFixed(0)+"' r='"+(0.4+rnd()*1.3).toFixed(1)+"' fill='#fff' opacity='"+(0.25+rnd()*0.55).toFixed(2)+"'/>"; return s+"</svg>"; }

  function option(v, l) { return "<option value=\"" + v + "\">" + l + "</option>"; }
  function buildHtml() {
    var mn = ["January","February","March","April","May","June","July","August","September","October","November","December"];
    var months = "<option value=''>Month</option>"; for (var m = 1; m <= 12; m++) months += option(m, mn[m-1]);
    var days = "<option value=''>Day</option>"; for (var d = 1; d <= 31; d++) days += option(d, d);
    var years = "<option value=''>Year</option>"; var yr = new Date().getFullYear(); for (var y = yr; y >= 1920; y--) years += option(y, y);
    var cta = CTA_URL ? "<a class='cta' href='" + CTA_URL + "'>" + CTA_TEXT + "</a>" : "";
    return "<div class='wrap'>" + starsSvg() + "<div class='inner'>" +
      "<h2 class='title'>Who Were You in a Past Life?</h2>" +
      "<div class='screen-form'>" +
      "<p class='intro'>Your soul has traveled through many lifetimes. Enter your name and birth date to glimpse who you may have been before.</p>" +
      "<div class='field'><input class='nin' data-f='name' type='text' placeholder='Your full name' autocomplete='off' aria-label='Your name'></div>" +
      "<div class='field'><div class='drow'>" +
      "<select data-f='month' aria-label='Month'>" + months + "</select>" +
      "<select data-f='day' aria-label='Day'>" + days + "</select>" +
      "<select data-f='year' aria-label='Year'>" + years + "</select></div></div>" +
      "<button class='btn' type='button'>Reveal My Past Life</button>" +
      "<div class='err' role='alert'></div>" +
      "</div>" +
      "<div class='screen-result' aria-live='polite'>" +
      "<div class='lead'>In a past life, you lived in</div>" +
      "<div class='era'></div>" +
      "<p class='story'></p>" +
      "<p class='lesson'></p>" + cta +
      "<button class='retry' type='button'>&#8592; Try Again</button>" +
      "</div>" +
      "</div></div>";
  }

  function init(host) {
    if (host.__psPastLife) return; host.__psPastLife = true;
    if (!document.querySelector("link[data-ps-rsc-font]")) { var link = document.createElement("link"); link.rel = "stylesheet"; link.href = "https://fonts.googleapis.com/css2?family=Great+Vibes&display=swap"; link.setAttribute("data-ps-rsc-font", "1"); document.head.appendChild(link); }
    var root = host.attachShadow ? host.attachShadow({ mode: "open" }) : host;
    var style = document.createElement("style"); style.textContent = CSS;
    var mount = document.createElement("div"); mount.innerHTML = buildHtml();
    root.appendChild(style); root.appendChild(mount);
    var $ = function (s) { return mount.querySelector(s); };
    var fields = {}; mount.querySelectorAll("[data-f]").forEach(function (el) { fields[el.getAttribute("data-f")] = el; });
    var err = $(".err"), formScreen = $(".screen-form"), resultScreen = $(".screen-result");

    $(".btn").addEventListener("click", function () {
      err.classList.remove("show");
      var name = fields.name.value.trim(), m = fields.month.value, d = fields.day.value, y = fields.year.value;
      if (!/[a-zA-Z]/.test(name)) { err.textContent = "Please enter your name."; err.classList.add("show"); return; }
      if (!m || !d || !y) { err.textContent = "Please select your full birth date."; err.classList.add("show"); return; }
      var seed = hash(name.toLowerCase().replace(/[^a-z]/g, "") + "|" + m + "|" + d + "|" + y);
      var era = ERAS[seed % ERAS.length];
      var role = ROLES[Math.floor(seed / 12) % ROLES.length];
      var lesson = LESSONS[Math.floor(seed / 144) % LESSONS.length];
      $(".era").textContent = era.name;
      $(".story").textContent = "You lived " + era.when + ", where you were " + role.title + ", " + role.desc + ".";
      $(".lesson").textContent = lesson;
      formScreen.classList.add("hidden"); resultScreen.classList.add("active");
      $(".wrap").scrollIntoView({ behavior: "smooth", block: "start" });
    });
    $(".retry").addEventListener("click", function () {
      fields.name.value = ""; fields.month.value = ""; fields.day.value = ""; fields.year.value = ""; err.classList.remove("show");
      resultScreen.classList.remove("active"); formScreen.classList.remove("hidden");
      $(".wrap").scrollIntoView({ behavior: "smooth", block: "start" });
    });
  }
  function boot() { var host = document.getElementById("ps-past-life") || document.querySelector("[data-ps-widget='past-life']"); if (host) init(host); }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot); else boot();
})();
