/* Yes / No Tarot embed.
 * Usage on any site:
 *   <div id="ps-yes-no-tarot"></div>
 *   <script async src="https://psychic-source-platform.vercel.app/embed/yes-no-tarot.js"></script>
 * Renders directly into the page (Shadow DOM), no iframe.
 * Card faces: Rider-Waite-Smith deck (1909), public domain.
 */
(function () {
  "use strict";

  var SCRIPT_SRC = (document.currentScript && document.currentScript.src) || "";
  var ORIGIN = SCRIPT_SRC ? new URL(SCRIPT_SRC).origin : "https://psychic-source-platform.vercel.app";

  var CTA_URL = "";
  var CTA_TEXT = "Ask a psychic for the full story";

  // idx 0-21 map to Major Arcana with a yes/no/maybe verdict + reason.
  var CARDS = [
    { n: "The Fool", v: "Yes", t: "The Fool says leap. This is a card of fresh starts and trusting the unknown, so the answer leans toward a hopeful, open-hearted yes. Take the step." },
    { n: "The Magician", v: "Yes", t: "The Magician holds every tool needed to make it happen. The answer is a confident yes: you have the power and the timing to manifest this." },
    { n: "The High Priestess", v: "Maybe", t: "The High Priestess counsels patience. The answer is not yet visible on the surface. Trust your intuition and wait for more to be revealed before deciding." },
    { n: "The Empress", v: "Yes", t: "The Empress is abundance and growth. The answer is a warm yes, especially for anything involving love, creativity, or nurturing something into being." },
    { n: "The Emperor", v: "Yes", t: "The Emperor brings structure and authority. The answer is yes, provided you approach it with discipline and a solid plan rather than on a whim." },
    { n: "The Hierophant", v: "Yes", t: "The Hierophant favors the traditional path. The answer is yes if you work within established structures, seek guidance, and honor commitments." },
    { n: "The Lovers", v: "Yes", t: "The Lovers is union and alignment. The answer is a heartfelt yes, though it asks you to choose wholeheartedly and from your true values." },
    { n: "The Chariot", v: "Yes", t: "The Chariot is determination and victory through willpower. The answer is yes: stay focused, hold the reins, and push forward to success." },
    { n: "Strength", v: "Yes", t: "Strength answers yes, won not by force but by patience and courage. Stay calm and steady and the outcome moves in your favor." },
    { n: "The Hermit", v: "Maybe", t: "The Hermit says pause and reflect before answering. This is a time for solitude and inner searching, not a firm yes or no just yet." },
    { n: "Wheel of Fortune", v: "Yes", t: "The Wheel of Fortune turns in your favor. The answer is a lucky yes, with fate and good timing on your side. Ride the momentum." },
    { n: "Justice", v: "Maybe", t: "Justice weighs the scales. The answer depends on fairness and truth: if your cause is just and honest, it tips yes. Act with integrity." },
    { n: "The Hanged Man", v: "No", t: "The Hanged Man asks you to wait and shift perspective. For now the answer is no, or at least not yet; something needs to be surrendered first." },
    { n: "Death", v: "No", t: "Death signals an ending and transformation. For this question the answer is no; a chapter is closing to make room for something new." },
    { n: "Temperance", v: "Maybe", t: "Temperance calls for balance and patience. The answer is a measured maybe: with moderation and the right timing, it can come together." },
    { n: "The Devil", v: "No", t: "The Devil warns of unhealthy attachments or illusion. The answer is no; look closely at what is really binding you before moving ahead." },
    { n: "The Tower", v: "No", t: "The Tower brings sudden upheaval. The answer is no: this path is built on shaky ground, and pushing now may bring a necessary collapse." },
    { n: "The Star", v: "Yes", t: "The Star is hope and healing. The answer is a gentle, optimistic yes. Have faith; the future is brighter than it has felt." },
    { n: "The Moon", v: "No", t: "The Moon is illusion and uncertainty. The answer leans no for now; things are not as clear as they seem, so avoid deciding in the fog." },
    { n: "The Sun", v: "Yes", t: "The Sun is the clearest yes in the deck. Joy, success, and clarity shine on this question. Move ahead with confidence." },
    { n: "Judgement", v: "Yes", t: "Judgement is a calling and an awakening. The answer is yes: you are being summoned toward this, so answer the call and rise to it." },
    { n: "The World", v: "Yes", t: "The World is completion and fulfillment. The answer is a resounding yes; this is coming full circle in the best possible way." },
  ];

  var FONT = "'Segoe UI','Helvetica Neue',Helvetica,Arial,sans-serif";
  var GOLD = "#eda45f";
  var YES = "#6fbf8a", NO = "#e2705a", MAYBE = "#e8c06a";
  var CSS = "" +
    ":host{all:initial;display:block}" +
    "*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}" +
    ".wrap{position:relative;font-family:" + FONT + ";color:#fff;background:radial-gradient(ellipse 80% 60% at 50% 12%,#2a2350 0%,#1a1636 55%,#100d24 100%);padding:54px 24px 58px;overflow:hidden;line-height:1.65;text-align:center}" +
    ".stars{position:absolute;inset:0;pointer-events:none}" +
    ".inner{position:relative;max-width:760px;margin:0 auto}" +
    ".title{font-family:'Great Vibes',cursive;font-weight:400;font-size:clamp(48px,8vw,80px);color:" + GOLD + ";text-shadow:0 2px 14px rgba(0,0,0,.5);margin-bottom:10px;line-height:1.05}" +
    ".intro{font-size:19px;margin:0 auto 8px;max-width:640px;text-shadow:0 1px 6px rgba(0,0,0,.5)}" +
    ".qwrap{margin:22px auto 6px;max-width:520px}" +
    ".qin{width:100%;padding:15px 18px;font-size:19px;font-family:" + FONT + ";color:#fff;background:rgba(255,255,255,.12);border:1.5px solid rgba(255,255,255,.8);border-radius:10px;outline:none;text-align:center}" +
    ".qin:focus{border-color:#fff}.qin::placeholder{color:rgba(255,255,255,.65)}" +
    ".actions{text-align:center;margin-top:24px}" +
    ".btn{display:inline-block;font-family:" + FONT + ";font-size:19px;font-weight:600;color:#241505;background:linear-gradient(180deg,#f2b26d," + GOLD + ");border:none;border-radius:999px;padding:15px 46px;cursor:pointer;box-shadow:0 4px 16px rgba(0,0,0,.4);transition:transform .15s ease}" +
    ".btn:hover{transform:translateY(-1px)}" +
    ".deckhint{font-size:15px;opacity:.7;margin-top:12px}" +
    ".screen-result{display:none}.screen-result.active{display:block;animation:fadein .6s ease}.screen-form.hidden{display:none}" +
    "@keyframes fadein{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:none}}" +
    ".flipstage{perspective:1200px;width:210px;height:350px;margin:6px auto 18px}" +
    ".flipper{width:100%;height:100%;position:relative;transform-style:preserve-3d;animation:flip3d 1s cubic-bezier(.4,.05,.3,1) forwards}" +
    "@keyframes flip3d{0%{transform:rotateY(0)}100%{transform:rotateY(540deg)}}" +
    ".flipper .f,.flipper .bk{position:absolute;inset:0;border-radius:14px;backface-visibility:hidden;background-size:cover;background-position:center;box-shadow:0 18px 44px rgba(0,0,0,.5);border:5px solid #fff}" +
    ".flipper .bk{background-image:url('" + ORIGIN + "/embed/img/tarot/back.jpg')}" +
    ".flipper .f{transform:rotateY(180deg)}" +
    ".verdict{font-family:'Great Vibes',cursive;font-size:clamp(72px,13vw,120px);line-height:1;text-shadow:0 3px 18px rgba(0,0,0,.5)}" +
    ".verdict.yes{color:" + YES + "}.verdict.no{color:" + NO + "}.verdict.maybe{color:" + MAYBE + "}" +
    ".cardname{font-size:20px;letter-spacing:1px;opacity:.9;margin-bottom:14px}" +
    ".reason{font-size:18.5px;max-width:620px;margin:0 auto;text-shadow:0 1px 5px rgba(0,0,0,.5)}" +
    ".cta{display:inline-block;font-family:" + FONT + ";font-size:18px;font-weight:600;color:#241505;text-decoration:none;background:linear-gradient(180deg,#f2b26d," + GOLD + ");border-radius:999px;padding:14px 40px;box-shadow:0 4px 16px rgba(0,0,0,.35)}" +
    ".retry{display:block;margin:14px auto 0;font-size:17px;font-weight:700;letter-spacing:1px;color:" + GOLD + ";background:none;border:none;cursor:pointer;font-family:" + FONT + "}" +
    "@media(max-width:600px){.wrap{padding:40px 14px 46px}}";

  function starsSvg() {
    var s = "<svg class='stars' viewBox='0 0 1000 600' preserveAspectRatio='xMidYMid slice' xmlns='http://www.w3.org/2000/svg'>", seed = 7;
    function rnd() { seed = (seed * 9301 + 49297) % 233280; return seed / 233280; }
    for (var i = 0; i < 70; i++) s += "<circle cx='" + (rnd()*1000).toFixed(0) + "' cy='" + (rnd()*600).toFixed(0) + "' r='" + (0.4+rnd()*1.3).toFixed(1) + "' fill='#fff' opacity='" + (0.25+rnd()*0.55).toFixed(2) + "'/>";
    return s + "</svg>";
  }

  function buildHtml() {
    var cta = CTA_URL ? "<div class='actions'><a class='cta' href='" + CTA_URL + "'>" + CTA_TEXT + "</a></div>" : "";
    return "<div class='wrap'>" + starsSvg() + "<div class='inner'>" +
      "<h2 class='title'>Yes or No Tarot</h2>" +
      "<div class='screen-form'>" +
      "<p class='intro'>Have a yes-or-no question on your mind? Focus on it, then draw a card for your answer.</p>" +
      "<div class='qwrap'><input class='qin' type='text' placeholder='Type your question (optional)' aria-label='Your question'></div>" +
      "<div class='actions'><button class='btn' type='button'>Draw Your Card</button></div>" +
      "<div class='deckhint'>Take a breath and hold your question in mind.</div>" +
      "</div>" +
      "<div class='screen-result' aria-live='polite'>" +
      "<div class='flipstage'></div>" +
      "<div class='verdict'></div>" +
      "<div class='cardname'></div>" +
      "<p class='reason'></p>" +
      cta +
      "<button class='retry' type='button'>Ask Another Question</button>" +
      "</div>" +
      "</div></div>";
  }

  function init(host) {
    if (host.__psYesNoTarot) return; host.__psYesNoTarot = true;
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
    var formScreen = $(".screen-form"), resultScreen = $(".screen-result");
    var animating = false;

    function draw() {
      if (animating) return; animating = true;
      var idx = Math.floor(Math.random() * CARDS.length);
      var card = CARDS[idx];
      var face = ORIGIN + "/embed/img/tarot/" + String(idx).padStart(2, "0") + ".jpg";
      $(".flipstage").innerHTML = "<div class='flipper'><div class='bk'></div><div class='f' style=\"background-image:url('" + face + "')\"></div></div>";
      var v = $(".verdict"); v.className = "verdict";
      $(".verdict").textContent = ""; $(".cardname").textContent = ""; $(".reason").textContent = "";
      formScreen.classList.add("hidden"); resultScreen.classList.add("active");
      $(".wrap").scrollIntoView({ behavior: "smooth", block: "start" });
      setTimeout(function () {
        v.classList.add(card.v.toLowerCase());
        v.textContent = card.v;
        $(".cardname").textContent = "You drew " + card.n;
        $(".reason").textContent = card.t;
        animating = false;
      }, 1000);
    }
    $(".btn").addEventListener("click", draw);
    $(".qin").addEventListener("keydown", function (e) { if (e.key === "Enter") draw(); });
    $(".retry").addEventListener("click", function () {
      resultScreen.classList.remove("active"); formScreen.classList.remove("hidden");
      $(".wrap").scrollIntoView({ behavior: "smooth", block: "start" });
    });
  }
  function boot() { var host = document.getElementById("ps-yes-no-tarot") || document.querySelector("[data-ps-widget='yes-no-tarot']"); if (host) init(host); }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot); else boot();
})();
