/* Birthstone by Month lookup embed.
 * Usage on any site:
 *   <div id="ps-birthstone"></div>
 *   <script async src="https://psychic-source-platform.vercel.app/embed/birthstone.js"></script>
 * Renders directly into the page (Shadow DOM), no iframe. No API calls.
 */
(function () {
  "use strict";
  var SCRIPT_SRC = (document.currentScript && document.currentScript.src) || "";
  var ORIGIN = SCRIPT_SRC ? new URL(SCRIPT_SRC).origin : "https://psychic-source-platform.vercel.app";
  var CTA_URL = "https://www.psychicsource.com/our-psychics";
  var CTA_TEXT = "Explore your stones with a psychic";

  var STONES = {
    1:  { stone: "Garnet", also: "", color:"#7d1f2b", light:"#c0485a", meaning: "Garnet is a stone of protection, passion, and vitality. Long carried by travelers as a talisman against harm, it is believed to ignite energy, strengthen commitment, and keep the heart warm and courageous through any darkness." },
    2:  { stone: "Amethyst", also: "", color:"#6a3d9a", light:"#a97fd6", meaning: "Amethyst is the stone of spiritual clarity and calm. Prized for centuries as a guard against overindulgence and anxiety, it is said to soothe the mind, deepen intuition, and open a clear channel to higher wisdom." },
    3:  { stone: "Aquamarine", also: "Bloodstone", color:"#2f8fae", light:"#7fd0e0", meaning: "Aquamarine carries the serene courage of the sea. Sailors once wore it for safe passage, and it is believed to calm fear, clear communication, and wash the spirit clean like cool water over stone." },
    4:  { stone: "Diamond", also: "", color:"#cfd8e0", light:"#ffffff", meaning: "The diamond is the stone of enduring strength and clarity. Unbreakable and brilliant, it symbolizes eternal love, invincibility, and the light of pure intention that no pressure can dim." },
    5:  { stone: "Emerald", also: "", color:"#1f7a4d", light:"#5fc78e", meaning: "Emerald is the stone of the heart, love, and renewal. Sacred to Venus, it is believed to bring loyalty, rebirth, and prophetic insight, opening the heart to deeper compassion and truth." },
    6:  { stone: "Pearl", also: "Alexandrite, Moonstone", color:"#e6e2d3", light:"#fbf9f2", meaning: "The pearl is the stone of purity, intuition, and the tides of emotion. Born of the sea rather than the earth, it is linked to the Moon and the feminine, calming the spirit and honoring quiet inner wisdom." },
    7:  { stone: "Ruby", also: "", color:"#a01a2b", light:"#e0576a", meaning: "The ruby is the king of gems, a stone of passion, protection, and life force. Believed to hold an inextinguishable flame, it fuels confidence, love, and vitality, and guards its wearer against misfortune." },
    8:  { stone: "Peridot", also: "Spinel", color:"#8a9a2b", light:"#c8d76a", meaning: "Peridot is the stone of light and renewal, born of volcanic fire and even fallen stars. It is believed to dispel negativity, invite abundance, and lift the spirit with fresh, optimistic energy." },
    9:  { stone: "Sapphire", also: "", color:"#1f4a8c", light:"#5f8fd6", meaning: "Sapphire is the stone of wisdom, loyalty, and divine favor. Worn by royalty and clergy alike, it is believed to guard against envy, focus the mind, and draw down blessings and truth from above." },
    10: { stone: "Opal", also: "Tourmaline", color:"#8fb0c0", light:"#e6d9c0", meaning: "The opal is the stone of imagination and inspiration, flashing every color within it. It is believed to amplify emotions and creativity, awaken artistic vision, and reflect the true mood of the soul." },
    11: { stone: "Topaz", also: "Citrine", color:"#d98b1f", light:"#f5c25e", meaning: "Topaz is the stone of warmth, generosity, and manifestation. Golden as the sun, it is believed to attract success and joy, calm the temper, and help you speak and live your intentions into being." },
    12: { stone: "Turquoise", also: "Tanzanite, Zircon", color:"#2fae9e", light:"#7fe0d2", meaning: "Turquoise is one of the oldest protective talismans, a stone of healing, wholeness, and good fortune. Bridging earth and sky, it is believed to guard the traveler, steady the emotions, and invite serenity." },
  };
  var MONTHS = ["January","February","March","April","May","June","July","August","September","October","November","December"];

  var FONT = "'Segoe UI','Helvetica Neue',Helvetica,Arial,sans-serif";
  var GOLD = "#eda45f";
  var CSS = "" +
    ":host{all:initial;display:block}*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}" +
    ".wrap{position:relative;font-family:" + FONT + ";color:#fff;background:radial-gradient(ellipse 80% 60% at 50% 8%,#22314e 0%,#182338 55%,#101725 100%);padding:54px 24px 58px;overflow:hidden;line-height:1.65;text-align:center}" +
    ".inner{position:relative;max-width:680px;margin:0 auto}" +
    ".title{font-family:'Great Vibes',cursive;font-weight:400;font-size:clamp(44px,7vw,72px);color:" + GOLD + ";text-shadow:0 2px 14px rgba(0,0,0,.5);margin-bottom:10px;line-height:1.05}" +
    ".intro{font-size:19px;margin:0 auto 24px;max-width:560px;text-shadow:0 1px 6px rgba(0,0,0,.5)}" +
    ".row{display:flex;gap:12px;justify-content:center;align-items:center;flex-wrap:wrap}" +
    ".lbl{font-weight:700;font-size:19px}" +
    "select{appearance:none;-webkit-appearance:none;padding:13px 40px 13px 16px;font-size:19px;font-family:" + FONT + ";color:#fff;background-color:rgba(16,22,40,.8);border:1.5px solid rgba(255,255,255,.9);border-radius:8px;outline:none;cursor:pointer;background-image:url(\"data:image/svg+xml;charset=utf-8,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='8'%3E%3Cpath d='M1 1l5 5 5-5' stroke='white' stroke-width='1.6' fill='none'/%3E%3C/svg%3E\");background-repeat:no-repeat;background-position:right 14px center}" +
    "select:focus{border-color:#fff;box-shadow:0 0 0 2px rgba(255,255,255,.25)}select option{color:#1c1c2e;background:#fff}" +
    ".btn{display:inline-block;font-family:" + FONT + ";font-size:18px;font-weight:600;color:#241505;background:linear-gradient(180deg,#f2b26d," + GOLD + ");border:none;border-radius:999px;padding:14px 34px;cursor:pointer;box-shadow:0 4px 16px rgba(0,0,0,.4);transition:transform .15s ease}" +
    ".btn:hover{transform:translateY(-1px)}" +
    ".screen-result{display:none}.screen-result.active{display:block;animation:fadein .5s ease}.screen-form.hidden{display:none}" +
    "@keyframes fadein{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:none}}" +
    ".gem{width:120px;height:120px;margin:0 auto 12px;border-radius:14px;transform:rotate(45deg);box-shadow:0 8px 26px rgba(0,0,0,.5),inset 0 6px 18px rgba(255,255,255,.4),inset 0 -8px 18px rgba(0,0,0,.3)}" +
    ".mo{font-size:15px;letter-spacing:2px;text-transform:uppercase;opacity:.75}" +
    ".sname{font-family:'Great Vibes',cursive;font-size:clamp(46px,7vw,66px);color:" + GOLD + ";line-height:1.05}" +
    ".also{font-size:15px;opacity:.8;margin-bottom:14px}" +
    ".meaning{font-size:18.5px;max-width:600px;margin:0 auto;text-shadow:0 1px 5px rgba(0,0,0,.4)}" +
    ".cta{display:inline-block;font-family:" + FONT + ";font-size:18px;font-weight:600;color:#241505;text-decoration:none;background:linear-gradient(180deg,#f2b26d," + GOLD + ");border-radius:999px;padding:14px 40px;box-shadow:0 4px 16px rgba(0,0,0,.35);margin-top:22px}" +
    ".retry{display:block;margin:14px auto 0;font-size:17px;font-weight:700;letter-spacing:1px;color:" + GOLD + ";background:none;border:none;cursor:pointer;font-family:" + FONT + "}" +
    "@media(max-width:600px){.wrap{padding:40px 14px 46px}}";

  function buildHtml() {
    var opts = "<option value=''>Select your birth month</option>";
    for (var m = 1; m <= 12; m++) opts += "<option value='" + m + "'>" + MONTHS[m-1] + "</option>";
    var cta = CTA_URL ? "<a class='cta' href='" + CTA_URL + "'>" + CTA_TEXT + "</a>" : "";
    return "<div class='wrap'><div class='inner'>" +
      "<h2 class='title'>What's My Birthstone?</h2>" +
      "<div class='screen-form'>" +
      "<p class='intro'>Each month has a birthstone carrying its own beauty and meaning. Choose your birth month to discover yours and what it symbolizes.</p>" +
      "<div class='row'><span class='lbl'>Birth Month:</span><select data-f='month' aria-label='Birth month'>" + opts + "</select>" +
      "<button class='btn' type='button'>Reveal</button></div>" +
      "<div class='err' style='display:none;margin-top:14px;color:#ffce8a'>Please select your birth month.</div>" +
      "</div>" +
      "<div class='screen-result' aria-live='polite'>" +
      "<div class='gem'></div><div class='mo'></div><div class='sname'></div><div class='also'></div>" +
      "<p class='meaning'></p>" + cta +
      "<button class='retry' type='button'>Try Another Month</button>" +
      "</div>" +
      "</div></div>";
  }

  function init(host) {
    if (host.__psBirthstone) return; host.__psBirthstone = true;
    if (!document.querySelector("link[data-ps-rsc-font]")) { var link = document.createElement("link"); link.rel = "stylesheet"; link.href = "https://fonts.googleapis.com/css2?family=Great+Vibes&display=swap"; link.setAttribute("data-ps-rsc-font", "1"); document.head.appendChild(link); }
    var root = host.attachShadow ? host.attachShadow({ mode: "open" }) : host;
    var style = document.createElement("style"); style.textContent = CSS;
    var mount = document.createElement("div"); mount.innerHTML = buildHtml();
    root.appendChild(style); root.appendChild(mount);
    var $ = function (s) { return mount.querySelector(s); };
    var sel = $("[data-f='month']"), err = $(".err"), formScreen = $(".screen-form"), resultScreen = $(".screen-result");

    function go() {
      var m = +sel.value;
      if (!m) { err.style.display = "block"; return; }
      err.style.display = "none";
      var s = STONES[m];
      $(".gem").style.background = "linear-gradient(135deg," + s.light + "," + s.color + ")";
      $(".mo").textContent = MONTHS[m-1];
      $(".sname").textContent = s.stone;
      $(".also").textContent = s.also ? "Also: " + s.also : "";
      $(".meaning").textContent = s.meaning;
      formScreen.classList.add("hidden"); resultScreen.classList.add("active");
      $(".wrap").scrollIntoView({ behavior: "smooth", block: "start" });
    }
    $(".btn").addEventListener("click", go);
    $(".retry").addEventListener("click", function () { sel.value = ""; resultScreen.classList.remove("active"); formScreen.classList.remove("hidden"); $(".wrap").scrollIntoView({ behavior: "smooth", block: "start" }); });
  }
  function boot() { var host = document.getElementById("ps-birthstone") || document.querySelector("[data-ps-widget='birthstone']"); if (host) init(host); }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot); else boot();
})();
