/* AI Tarot Reading embed (three-card Past/Present/Future with an AI reading).
 * Usage on any site:
 *   <div id="ps-ai-tarot"></div>
 *   <script async src="https://psychic-source-platform.vercel.app/embed/ai-tarot.js"></script>
 * Renders directly into the page (Shadow DOM), no iframe.
 * Reading generated server-side; card faces are the public-domain RWS deck.
 */
(function () {
  "use strict";

  var SCRIPT_SRC = (document.currentScript && document.currentScript.src) || "";
  var ORIGIN = SCRIPT_SRC ? new URL(SCRIPT_SRC).origin : "https://psychic-source-platform.vercel.app";

  var CTA_URL = "https://www.psychicsource.com/psychic-advice/tarot-readings";
  var CTA_TEXT = "Get a reading from a real psychic";

  var CARDS = ["The Fool","The Magician","The High Priestess","The Empress","The Emperor","The Hierophant","The Lovers","The Chariot","Strength","The Hermit","Wheel of Fortune","Justice","The Hanged Man","Death","Temperance","The Devil","The Tower","The Star","The Moon","The Sun","Judgement","The World"];
  var POSITIONS = ["Past", "Present", "Future"];

  var FONT = "'Segoe UI','Helvetica Neue',Helvetica,Arial,sans-serif";
  var GOLD = "#eda45f";
  var CSS = "" +
    ":host{all:initial;display:block}" +
    "*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}" +
    ".wrap{position:relative;font-family:" + FONT + ";color:#fff;background:radial-gradient(ellipse 80% 60% at 50% 10%,#2a2350 0%,#191536 55%,#0f0c22 100%);padding:54px 24px 58px;overflow:hidden;line-height:1.65;text-align:center}" +
    ".stars{position:absolute;inset:0;pointer-events:none}" +
    ".inner{position:relative;max-width:820px;margin:0 auto}" +
    ".title{font-family:'Great Vibes',cursive;font-weight:400;font-size:clamp(46px,7vw,76px);color:" + GOLD + ";text-shadow:0 2px 14px rgba(0,0,0,.5);margin-bottom:8px;line-height:1.05}" +
    ".intro{font-size:19px;margin:0 auto 18px;max-width:640px;text-shadow:0 1px 6px rgba(0,0,0,.5)}" +
    ".qwrap{margin:20px auto 4px;max-width:520px}" +
    ".qin{width:100%;padding:15px 18px;font-size:19px;font-family:" + FONT + ";color:#fff;background:rgba(255,255,255,.12);border:1.5px solid rgba(255,255,255,.8);border-radius:10px;outline:none;text-align:center}" +
    ".qin:focus{border-color:#fff}.qin::placeholder{color:rgba(255,255,255,.65)}" +
    ".actions{text-align:center;margin-top:24px}" +
    ".btn{display:inline-block;font-family:" + FONT + ";font-size:19px;font-weight:600;color:#241505;background:linear-gradient(180deg,#f2b26d," + GOLD + ");border:none;border-radius:999px;padding:15px 46px;cursor:pointer;box-shadow:0 4px 16px rgba(0,0,0,.4);transition:transform .15s ease}" +
    ".btn:hover{transform:translateY(-1px)}.btn:disabled{opacity:.6;cursor:default}" +
    ".screen-result{display:none}.screen-result.active{display:block;animation:fadein .6s ease}.screen-form.hidden{display:none}" +
    "@keyframes fadein{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:none}}" +
    ".spread{display:flex;justify-content:center;gap:20px;flex-wrap:wrap;margin:8px auto 26px}" +
    ".slot{width:150px}" +
    ".slot .pos{font-family:'Great Vibes',cursive;font-size:30px;color:" + GOLD + ";margin-bottom:8px}" +
    ".slot .card{perspective:1000px;width:150px;height:250px;margin:0 auto}" +
    ".slot .flip{position:relative;width:100%;height:100%;transform-style:preserve-3d;transition:transform .8s cubic-bezier(.4,.05,.3,1)}" +
    ".slot .flip.rev{transform:rotateY(180deg)}" +
    ".slot .face,.slot .bk{position:absolute;inset:0;border-radius:11px;backface-visibility:hidden;background-size:cover;background-position:center;box-shadow:0 8px 22px rgba(0,0,0,.45);border:4px solid #fff}" +
    ".slot .bk{background-image:url('" + ORIGIN + "/embed/img/tarot/back.jpg')}" +
    ".slot .face{transform:rotateY(180deg)}" +
    ".slot .cn{margin-top:8px;font-size:15px;opacity:.85}" +
    ".loading{font-family:'Great Vibes',cursive;font-size:34px;color:" + GOLD + ";margin:10px 0 6px}" +
    ".loading .dots span{opacity:.3;animation:blink 1.2s infinite}.loading .dots span:nth-child(2){animation-delay:.2s}.loading .dots span:nth-child(3){animation-delay:.4s}" +
    "@keyframes blink{0%,100%{opacity:.3}50%{opacity:1}}" +
    ".reading{border:1.5px solid " + GOLD + ";border-radius:16px;background:rgba(255,255,255,.05);padding:26px 30px;font-size:18.5px;text-align:left;max-width:680px;margin:0 auto;white-space:pre-wrap;text-shadow:0 1px 4px rgba(0,0,0,.4)}" +
    ".handoff{margin-top:26px;font-size:18px;opacity:.95}" +
    ".cta{display:inline-block;font-family:" + FONT + ";font-size:18px;font-weight:600;color:#241505;text-decoration:none;background:linear-gradient(180deg,#f2b26d," + GOLD + ");border-radius:999px;padding:15px 42px;box-shadow:0 4px 16px rgba(0,0,0,.4);margin-top:12px}" +
    ".retry{display:block;margin:16px auto 0;font-size:17px;font-weight:700;letter-spacing:1px;color:" + GOLD + ";background:none;border:none;cursor:pointer;font-family:" + FONT + "}" +
    ".err{color:#ffce8a;font-size:17px;margin-top:12px}" +
    "@media(max-width:600px){.slot{width:120px}.slot .card{width:120px;height:200px}.wrap{padding:40px 14px 46px}}";

  function starsSvg() {
    var s = "<svg class='stars' viewBox='0 0 1000 600' preserveAspectRatio='xMidYMid slice' xmlns='http://www.w3.org/2000/svg'>", seed = 9;
    function rnd() { seed = (seed * 9301 + 49297) % 233280; return seed / 233280; }
    for (var i = 0; i < 70; i++) s += "<circle cx='" + (rnd()*1000).toFixed(0) + "' cy='" + (rnd()*600).toFixed(0) + "' r='" + (0.4+rnd()*1.3).toFixed(1) + "' fill='#fff' opacity='" + (0.25+rnd()*0.55).toFixed(2) + "'/>";
    return s + "</svg>";
  }

  function buildHtml() {
    var slots = POSITIONS.map(function (p) {
      return "<div class='slot'><div class='pos'>" + p + "</div>" +
        "<div class='card'><div class='flip'><div class='bk'></div><div class='face'></div></div></div>" +
        "<div class='cn'></div></div>";
    }).join("");
    return "<div class='wrap'>" + starsSvg() + "<div class='inner'>" +
      "<h2 class='title'>AI Tarot Reading</h2>" +
      "<div class='screen-form'>" +
      "<p class='intro'>Focus on a question or an area of your life, then draw three cards for a past, present, and future reading.</p>" +
      "<div class='qwrap'><input class='qin' type='text' placeholder='Type your question (optional)' aria-label='Your question' maxlength='300'></div>" +
      "<div class='actions'><button class='btn draw' type='button'>Draw My Cards</button></div>" +
      "</div>" +
      "<div class='screen-result' aria-live='polite'>" +
      "<div class='spread'>" + slots + "</div>" +
      "<div class='readbox'></div>" +
      "<div class='handoff' style='display:none'>An AI can read the cards, but it cannot read <em>you</em>. For a reading that truly sees your energy, talk with a real psychic.</div>" +
      "<div class='cta-slot' style='text-align:center'></div>" +
      "<button class='retry' type='button' style='display:none'>Ask Another Question</button>" +
      "</div>" +
      "</div></div>";
  }

  function init(host) {
    if (host.__psAiTarot) return; host.__psAiTarot = true;
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

    function draw() {
      var q = $(".qin").value.trim();
      // pick 3 distinct cards
      var pool = CARDS.slice(), picks = [];
      for (var i = 0; i < 3; i++) picks.push(pool.splice(Math.floor(Math.random() * pool.length), 1)[0]);
      formScreen.classList.add("hidden"); resultScreen.classList.add("active");
      $(".wrap").scrollIntoView({ behavior: "smooth", block: "start" });

      var slots = mount.querySelectorAll(".slot");
      slots.forEach(function (slot, i) {
        var idx = CARDS.indexOf(picks[i]);
        slot.querySelector(".face").style.backgroundImage = "url('" + ORIGIN + "/embed/img/tarot/" + String(idx).padStart(2, "0") + ".jpg')";
        slot.querySelector(".flip").classList.remove("rev");
        slot.querySelector(".cn").textContent = "";
        setTimeout(function () {
          slot.querySelector(".flip").classList.add("rev");
          slot.querySelector(".cn").textContent = picks[i];
        }, 300 + i * 450);
      });

      var readbox = $(".readbox");
      readbox.innerHTML = "<div class='loading'>The cards are speaking<span class='dots'><span>.</span><span>.</span><span>.</span></span></div>";
      $(".handoff").style.display = "none";
      $(".cta-slot").innerHTML = "";
      $(".retry").style.display = "none";

      fetch(ORIGIN + "/api/calculators/ai-tarot", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: q, cards: picks }),
      }).then(function (r) { return r.json().then(function (j) { return { ok: r.ok, j: j }; }); })
        .then(function (res) {
          setTimeout(function () {
            if (!res.ok || !res.j.reading) {
              readbox.innerHTML = "<div class='err'>" + (res.j && res.j.error ? res.j.error : "The reading could not be completed. Please try again.") + "</div>";
            } else {
              readbox.innerHTML = "<div class='reading'></div>";
              readbox.querySelector(".reading").textContent = res.j.reading;
              $(".handoff").style.display = "";
              if (CTA_URL) { var a = document.createElement("a"); a.className = "cta"; a.href = CTA_URL; a.textContent = CTA_TEXT; $(".cta-slot").appendChild(a); }
            }
            $(".retry").style.display = "";
          }, 1700); // let the flip animation finish first
        })
        .catch(function () {
          readbox.innerHTML = "<div class='err'>The reading could not be reached. Please try again.</div>";
          $(".retry").style.display = "";
        });
    }
    $(".draw").addEventListener("click", draw);
    $(".qin").addEventListener("keydown", function (e) { if (e.key === "Enter") draw(); });
    $(".retry").addEventListener("click", function () {
      resultScreen.classList.remove("active"); formScreen.classList.remove("hidden");
      $(".wrap").scrollIntoView({ behavior: "smooth", block: "start" });
    });
  }
  function boot() { var host = document.getElementById("ps-ai-tarot") || document.querySelector("[data-ps-widget='ai-tarot']"); if (host) init(host); }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot); else boot();
})();
