/* Angel Number Meaning decoder embed.
 * Usage on any site:
 *   <div id="ps-angel-number"></div>
 *   <script async src="https://psychic-source-platform.vercel.app/embed/angel-number.js"></script>
 * Renders directly into the page (Shadow DOM), no iframe. No API calls.
 */
(function () {
  "use strict";
  var SCRIPT_SRC = (document.currentScript && document.currentScript.src) || "";
  var ORIGIN = SCRIPT_SRC ? new URL(SCRIPT_SRC).origin : "https://psychic-source-platform.vercel.app";
  var CTA_URL = "https://www.psychicsource.com/psychic-advice/numerology-readings";
  var CTA_TEXT = "Ask a psychic what your number means for you";

  // Meanings for repeating sequences. Single-digit meanings power any
  // unknown repeating number as a fallback.
  var KNOWN = {
    "000": "New beginnings and infinite potential. Zero is the point before creation, so 000 signals a fresh cycle and a reminder that you are one with the universe. A blank page is in front of you.",
    "111": "A powerful manifestation gateway. Your thoughts are aligning with reality quickly, so focus on what you truly want. 111 is a nudge to think positively; a new chapter is beginning.",
    "222": "Balance, harmony, and trust. 222 asks you to have faith that things are working out, even mid-process. Keep the peace, nurture your relationships, and trust the timing of your life.",
    "333": "Support and encouragement from your guides and ascended masters. 333 says you are protected and your creative gifts are needed. Speak your truth and step into your purpose with confidence.",
    "444": "Protection and solid foundations. 444 is a sign that your angels are near and everything is exactly as it should be. Keep building; the structure you are creating is sound.",
    "555": "Major change is coming. 555 heralds transformation and freedom, an invitation to release the old and embrace what is arriving. Stay open; the shift is leading somewhere good.",
    "666": "Realign and rebalance. Far from ominous, 666 gently asks you to check where your focus has drifted toward worry or the material, and to return to your heart and higher values.",
    "777": "Spiritual alignment and good fortune. 777 is a sign you are on the right path and your inner work is paying off. Luck and wisdom are flowing; keep trusting your intuition.",
    "888": "Abundance and reward. 888 signals prosperity, balance, and the return of energy you have put out. Financial or karmic abundance is on its way; stay in a mindset of gratitude.",
    "999": "Completion and release. A significant chapter is ending to make room for the next. 999 asks you to let go, tie up loose ends, and step forward into your true purpose.",
    "1010": "Spiritual awakening and forward motion. 1010 blends new beginnings with divine wholeness, urging you to grow, trust your path, and keep your thoughts positive as you level up.",
    "1111": "The most famous angel number: a wide-open manifestation portal. 1111 is a wake-up call from the universe. Make a wish, set your intention, and know your angels are close.",
    "1212": "Step out of your comfort zone toward your highest path. 1212 blends manifestation with balance, a sign of spiritual growth and encouragement to keep faith as you rise.",
    "1234": "Steady progress, one step at a time. 1234 is a sign you are moving in the right direction in a natural sequence. Keep going; simplify, and trust the momentum you are building.",
  };
  var DIGIT = {
    0: "wholeness, potential, and spiritual beginnings", 1: "new beginnings, independence, and manifestation",
    2: "balance, partnership, and trust", 3: "creativity, self-expression, and guidance",
    4: "stability, foundations, and the presence of your angels", 5: "change, freedom, and transformation",
    6: "harmony, home, and realignment of priorities", 7: "spiritual growth, wisdom, and good fortune",
    8: "abundance, success, and karmic reward", 9: "completion, release, and higher purpose",
  };
  function meaningFor(num) {
    if (KNOWN[num]) return KNOWN[num];
    // repeating single digit like 22222, or general: describe by unique digits
    var uniq = num.split("").filter(function (d, i, a) { return a.indexOf(d) === i; });
    var parts = uniq.map(function (d) { return "the energy of " + d + " (" + DIGIT[+d] + ")"; });
    var joined = parts.length === 1 ? parts[0] : parts.slice(0, -1).join(", ") + ", and " + parts[parts.length - 1];
    return "This number carries " + joined + ". Seeing it repeatedly is a message to pay attention to those themes in your life right now. When a digit repeats, its influence is amplified.";
  }

  var FONT = "'Segoe UI','Helvetica Neue',Helvetica,Arial,sans-serif";
  var GOLD = "#eda45f";
  var CSS = "" +
    ":host{all:initial;display:block}*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}" +
    ".wrap{position:relative;font-family:" + FONT + ";color:#fff;background:radial-gradient(ellipse 80% 60% at 50% 10%,#2a2350 0%,#191536 55%,#0f0c22 100%);padding:54px 24px 58px;overflow:hidden;line-height:1.65;text-align:center}" +
    ".stars{position:absolute;inset:0;pointer-events:none}.inner{position:relative;max-width:720px;margin:0 auto}" +
    ".title{font-family:'Great Vibes',cursive;font-weight:400;font-size:clamp(44px,7vw,72px);color:" + GOLD + ";text-shadow:0 2px 14px rgba(0,0,0,.5);margin-bottom:8px;line-height:1.05}" +
    ".intro{font-size:19px;margin:0 auto 22px;max-width:600px;text-shadow:0 1px 6px rgba(0,0,0,.5)}" +
    ".row{display:flex;gap:12px;justify-content:center;flex-wrap:wrap}" +
    ".nin{width:min(240px,70vw);padding:15px 18px;font-size:24px;letter-spacing:6px;text-align:center;font-family:" + FONT + ";color:#fff;background:rgba(255,255,255,.12);border:1.5px solid rgba(255,255,255,.8);border-radius:10px;outline:none}" +
    ".nin:focus{border-color:#fff}.nin::placeholder{letter-spacing:2px;color:rgba(255,255,255,.6)}" +
    ".btn{display:inline-block;font-family:" + FONT + ";font-size:18px;font-weight:600;color:#241505;background:linear-gradient(180deg,#f2b26d," + GOLD + ");border:none;border-radius:999px;padding:15px 34px;cursor:pointer;box-shadow:0 4px 16px rgba(0,0,0,.4);transition:transform .15s ease}" +
    ".btn:hover{transform:translateY(-1px)}" +
    ".chips{margin-top:18px;display:flex;gap:8px;justify-content:center;flex-wrap:wrap}" +
    ".chip{font-size:15px;color:#fff;background:rgba(255,255,255,.1);border:1px solid rgba(255,255,255,.4);border-radius:999px;padding:6px 14px;cursor:pointer}" +
    ".chip:hover{background:rgba(255,255,255,.22)}" +
    ".err{display:none;margin-top:14px;font-size:16px;color:#ffce8a}.err.show{display:block}" +
    ".screen-result{display:none}.screen-result.active{display:block;animation:fadein .5s ease}.screen-form.hidden{display:none}" +
    "@keyframes fadein{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:none}}" +
    ".bignum{font-family:'Great Vibes',cursive;font-size:clamp(80px,16vw,150px);color:" + GOLD + ";line-height:1;text-shadow:0 3px 18px rgba(0,0,0,.5)}" +
    ".rlabel{font-size:14px;letter-spacing:2px;text-transform:uppercase;opacity:.75;margin:6px 0 14px}" +
    ".rtext{font-size:19px;max-width:620px;margin:0 auto;text-shadow:0 1px 5px rgba(0,0,0,.4)}" +
    ".cta{display:inline-block;font-family:" + FONT + ";font-size:18px;font-weight:600;color:#241505;text-decoration:none;background:linear-gradient(180deg,#f2b26d," + GOLD + ");border-radius:999px;padding:14px 40px;box-shadow:0 4px 16px rgba(0,0,0,.35);margin-top:22px}" +
    ".retry{display:block;margin:14px auto 0;font-size:17px;font-weight:700;letter-spacing:1px;color:" + GOLD + ";background:none;border:none;cursor:pointer;font-family:" + FONT + "}" +
    "@media(max-width:600px){.wrap{padding:40px 14px 46px}}";

  function starsSvg() { var s = "<svg class='stars' viewBox='0 0 1000 600' preserveAspectRatio='xMidYMid slice' xmlns='http://www.w3.org/2000/svg'>", seed = 5; function rnd(){seed=(seed*9301+49297)%233280;return seed/233280;} for (var i=0;i<70;i++) s+="<circle cx='"+(rnd()*1000).toFixed(0)+"' cy='"+(rnd()*600).toFixed(0)+"' r='"+(0.4+rnd()*1.3).toFixed(1)+"' fill='#fff' opacity='"+(0.25+rnd()*0.55).toFixed(2)+"'/>"; return s+"</svg>"; }

  function buildHtml() {
    var chips = ["111","222","333","444","555","1111","1212"].map(function (n) { return "<button class='chip' data-n='" + n + "' type='button'>" + n + "</button>"; }).join("");
    var cta = CTA_URL ? "<a class='cta' href='" + CTA_URL + "'>" + CTA_TEXT + "</a>" : "";
    return "<div class='wrap'>" + starsSvg() + "<div class='inner'>" +
      "<h2 class='title'>Angel Number Meaning</h2>" +
      "<div class='screen-form'>" +
      "<p class='intro'>Keep seeing the same number everywhere? Angel numbers are repeating sequences your guides use to send a message. Enter the number you keep noticing to decode it.</p>" +
      "<div class='row'><input class='nin' type='text' inputmode='numeric' maxlength='6' placeholder='e.g. 1111' aria-label='Angel number'>" +
      "<button class='btn' type='button'>Decode</button></div>" +
      "<div class='chips'>" + chips + "</div>" +
      "<div class='err' role='alert'></div>" +
      "</div>" +
      "<div class='screen-result' aria-live='polite'>" +
      "<div class='bignum'></div><div class='rlabel'>Angel Number</div><p class='rtext'></p>" + cta +
      "<button class='retry' type='button'>Decode Another</button>" +
      "</div>" +
      "</div></div>";
  }

  function init(host) {
    if (host.__psAngelNumber) return; host.__psAngelNumber = true;
    if (!document.querySelector("link[data-ps-rsc-font]")) { var link = document.createElement("link"); link.rel = "stylesheet"; link.href = "https://fonts.googleapis.com/css2?family=Great+Vibes&display=swap"; link.setAttribute("data-ps-rsc-font", "1"); document.head.appendChild(link); }
    var root = host.attachShadow ? host.attachShadow({ mode: "open" }) : host;
    var style = document.createElement("style"); style.textContent = CSS;
    var mount = document.createElement("div"); mount.innerHTML = buildHtml();
    root.appendChild(style); root.appendChild(mount);
    var $ = function (s) { return mount.querySelector(s); };
    var input = $(".nin"), err = $(".err"), formScreen = $(".screen-form"), resultScreen = $(".screen-result");
    input.addEventListener("input", function () { input.value = input.value.replace(/[^0-9]/g, ""); });

    function decode(num) {
      err.classList.remove("show");
      if (!/^[0-9]{2,6}$/.test(num)) { err.textContent = "Please enter a number of 2 to 6 digits."; err.classList.add("show"); return; }
      $(".bignum").textContent = num;
      $(".rtext").textContent = meaningFor(num);
      formScreen.classList.add("hidden"); resultScreen.classList.add("active");
      $(".wrap").scrollIntoView({ behavior: "smooth", block: "start" });
    }
    $(".btn").addEventListener("click", function () { decode(input.value.trim()); });
    input.addEventListener("keydown", function (e) { if (e.key === "Enter") decode(input.value.trim()); });
    mount.querySelectorAll(".chip").forEach(function (c) { c.addEventListener("click", function () { input.value = c.getAttribute("data-n"); decode(input.value); }); });
    $(".retry").addEventListener("click", function () { input.value = ""; err.classList.remove("show"); resultScreen.classList.remove("active"); formScreen.classList.remove("hidden"); $(".wrap").scrollIntoView({ behavior: "smooth", block: "start" }); });
  }
  function boot() { var host = document.getElementById("ps-angel-number") || document.querySelector("[data-ps-widget='angel-number']"); if (host) init(host); }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot); else boot();
})();
