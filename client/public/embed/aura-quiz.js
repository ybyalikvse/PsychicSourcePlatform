/* What Color Is My Aura? quiz embed.
 * Usage on any site:
 *   <div id="ps-aura-quiz"></div>
 *   <script async src="https://psychic-source-platform.vercel.app/embed/aura-quiz.js"></script>
 * Renders directly into the page (Shadow DOM), no iframe. No API calls.
 */
(function () {
  "use strict";
  var SCRIPT_SRC = (document.currentScript && document.currentScript.src) || "";
  var ORIGIN = SCRIPT_SRC ? new URL(SCRIPT_SRC).origin : "https://psychic-source-platform.vercel.app";
  var CTA_URL = "https://www.psychicsource.com/our-psychics";
  var CTA_TEXT = "Ask a psychic to read your aura";
  var TITLE = "What Color Is My Aura?";
  var INTRO = "Your aura is the energy field that surrounds you, and its color reveals your emotional and spiritual state. Answer a few questions to discover the dominant color of yours.";
  var RESULT_LABEL = "Your Aura Color";
  var QUESTIONS = [{"q":"How would your closest friends describe you?","o":[{"t":"Passionate and driven","k":"red"},{"t":"Warm and adventurous","k":"orange"},{"t":"Cheerful and clever","k":"yellow"},{"t":"Calm and caring","k":"green"}]},{"q":"How do you recharge after a hard week?","o":[{"t":"Physical activity or a project","k":"red"},{"t":"Something new and fun","k":"orange"},{"t":"Learning or a good conversation","k":"yellow"},{"t":"Quiet time in nature","k":"green"}]},{"q":"What matters most to you in life?","o":[{"t":"Peace and honest communication","k":"blue"},{"t":"Insight and understanding","k":"indigo"},{"t":"Meaning and spiritual growth","k":"violet"},{"t":"Helping and healing others","k":"green"}]},{"q":"When facing a big decision, you rely on...","o":[{"t":"Gut instinct and action","k":"red"},{"t":"Logic and facts","k":"yellow"},{"t":"Your deep intuition","k":"indigo"},{"t":"How it feels emotionally","k":"blue"}]},{"q":"Which word feels most like you?","o":[{"t":"Creative","k":"orange"},{"t":"Wise","k":"violet"},{"t":"Loyal","k":"blue"},{"t":"Perceptive","k":"indigo"}]},{"q":"Pick a place that calls to you:","o":[{"t":"A lively festival","k":"orange"},{"t":"A mountain forest","k":"green"},{"t":"A quiet temple","k":"violet"},{"t":"By the calm ocean","k":"blue"}]}];
  var RESULTS = {"red":{"name":"Red Aura","color":"#c0392b","light":"#e8776a","text":"A red aura burns with passion, vitality, and drive. You are grounded, action-oriented, and unafraid to go after what you want. Your energy is powerful and magnetic; channel it with intention and you can accomplish almost anything."},"orange":{"name":"Orange Aura","color":"#d2622a","light":"#f0a25e","text":"An orange aura glows with creativity, adventure, and warmth. You are sociable, spontaneous, and full of life, drawing people in with your enthusiasm. You thrive when you are creating, exploring, and connecting."},"yellow":{"name":"Yellow Aura","color":"#d9a800","light":"#f5d557","text":"A yellow aura shines with optimism, intellect, and playful energy. You are curious, quick-minded, and naturally uplifting. Your bright spirit inspires those around you and keeps your outlook hopeful even in hard times."},"green":{"name":"Green Aura","color":"#2e8b57","light":"#6fc593","text":"A green aura radiates healing, balance, and compassion. You are a natural caregiver, deeply connected to nature and to the wellbeing of others. Growth and harmony follow you wherever you go."},"blue":{"name":"Blue Aura","color":"#2f6fb0","light":"#74a9dd","text":"A blue aura flows with calm, honesty, and heartfelt communication. You are trustworthy, intuitive about others' feelings, and a soothing presence. People feel safe opening up to you."},"indigo":{"name":"Indigo Aura","color":"#3f3a8c","light":"#7f79c8","text":"An indigo aura pulses with deep intuition and inner vision. You sense what others miss and feel drawn to life's mysteries. Highly perceptive and reflective, you are something of an old soul."},"violet":{"name":"Violet Aura","color":"#6a3d9a","light":"#a97fd6","text":"A violet aura vibrates with spirituality, wisdom, and imagination. You are a visionary, attuned to higher meaning and the bigger picture. Your presence carries a rare, transcendent calm."}};

  var FONT = "'Segoe UI','Helvetica Neue',Helvetica,Arial,sans-serif";
  var GOLD = "#eda45f";
  var CSS = "" +
    ":host{all:initial;display:block}" +
    "*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}" +
    ".wrap{position:relative;font-family:" + FONT + ";color:#fff;background:radial-gradient(ellipse 80% 60% at 50% 8%,#2a2350 0%,#191536 55%,#0f0c22 100%);padding:52px 24px 58px;overflow:hidden;line-height:1.65;text-align:center}" +
    ".stars{position:absolute;inset:0;pointer-events:none}" +
    ".inner{position:relative;max-width:720px;margin:0 auto}" +
    ".title{font-family:'Great Vibes',cursive;font-weight:400;font-size:clamp(44px,7vw,72px);color:" + GOLD + ";text-shadow:0 2px 14px rgba(0,0,0,.5);margin-bottom:8px;line-height:1.05}" +
    ".intro{font-size:19px;margin:0 auto 26px;max-width:600px;text-shadow:0 1px 6px rgba(0,0,0,.5)}" +
    ".btn{display:inline-block;font-family:" + FONT + ";font-size:19px;font-weight:600;color:#241505;background:linear-gradient(180deg,#f2b26d," + GOLD + ");border:none;border-radius:999px;padding:15px 46px;cursor:pointer;box-shadow:0 4px 16px rgba(0,0,0,.4);transition:transform .15s ease}" +
    ".btn:hover{transform:translateY(-1px)}" +
    ".screens{display:flex;flex-direction:column;justify-content:center}" +
    ".screen{display:none;width:100%}.screen.active{display:block;animation:fadein .4s ease}" +
    "@keyframes fadein{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:none}}" +
    ".prog{font-size:14px;letter-spacing:2px;text-transform:uppercase;opacity:.7;margin-bottom:14px}" +
    ".q{font-size:24px;font-weight:600;margin:0 auto 26px;max-width:600px;min-height:66px}" +
    ".opts{display:flex;flex-direction:column;gap:12px;max-width:520px;margin:0 auto}" +
    ".opt{font-family:" + FONT + ";font-size:18px;color:#fff;background:rgba(255,255,255,.08);border:1.5px solid rgba(255,255,255,.5);border-radius:12px;padding:15px 20px;cursor:pointer;transition:background .15s ease,border-color .15s ease;text-align:left}" +
    ".opt:hover{background:rgba(255,255,255,.18);border-color:#fff}" +
    ".back{margin-top:20px;font-size:15px;color:rgba(255,255,255,.7);background:none;border:none;cursor:pointer;font-family:" + FONT + "}" +
    ".back:hover{color:#fff}" +
    ".rswatch{width:120px;height:120px;border-radius:50%;margin:0 auto 12px;box-shadow:0 6px 20px rgba(0,0,0,.4)}" +
    ".remoji{font-size:96px;line-height:1;margin-bottom:6px}" +
    ".rname{font-family:'Great Vibes',cursive;font-size:clamp(44px,7vw,64px);color:" + GOLD + ";line-height:1.05}" +
    ".rlabel{font-size:14px;letter-spacing:2px;text-transform:uppercase;opacity:.75;margin-bottom:2px}" +
    ".rtext{font-size:18.5px;max-width:600px;margin:16px auto 0;text-shadow:0 1px 5px rgba(0,0,0,.4)}" +
    ".cta{display:inline-block;font-family:" + FONT + ";font-size:18px;font-weight:600;color:#241505;text-decoration:none;background:linear-gradient(180deg,#f2b26d," + GOLD + ");border-radius:999px;padding:14px 40px;box-shadow:0 4px 16px rgba(0,0,0,.35);margin-top:24px}" +
    ".retry{display:block;margin:14px auto 0;font-size:17px;font-weight:700;letter-spacing:1px;color:" + GOLD + ";background:none;border:none;cursor:pointer;font-family:" + FONT + "}" +
    "@media(max-width:600px){.wrap{padding:40px 14px 46px}.q{font-size:21px}}";

  function starsSvg() {
    var s = "<svg class='stars' viewBox='0 0 1000 600' preserveAspectRatio='xMidYMid slice' xmlns='http://www.w3.org/2000/svg'>", seed = 13;
    function rnd() { seed = (seed * 9301 + 49297) % 233280; return seed / 233280; }
    for (var i = 0; i < 70; i++) s += "<circle cx='" + (rnd()*1000).toFixed(0) + "' cy='" + (rnd()*600).toFixed(0) + "' r='" + (0.4+rnd()*1.3).toFixed(1) + "' fill='#fff' opacity='" + (0.25+rnd()*0.55).toFixed(2) + "'/>";
    return s + "</svg>";
  }
  function buildHtml() {
    var cta = CTA_URL ? "<a class='cta' href='" + CTA_URL + "'>" + CTA_TEXT + "</a>" : "";
    return "<div class='wrap'>" + starsSvg() + "<div class='inner'>" +
      "<h2 class='title'>" + TITLE + "</h2>" +
      "<div class='screens'>" +
      "<div class='screen s-intro active'><p class='intro'>" + INTRO + "</p>" +
      "<button class='btn start' type='button'>Start the Quiz</button></div>" +
      "<div class='screen s-q'><div class='prog'></div><div class='q'></div><div class='opts'></div>" +
      "<button class='back' type='button'>&#8592; Back</button></div>" +
      "<div class='screen s-result'>" +
      "<div class='rvis'></div><div class='rlabel'>" + RESULT_LABEL + "</div><div class='rname'></div>" +
      "<p class='rtext'></p>" + cta +
      "<button class='retry' type='button'>Take It Again</button></div>" +
      "</div>" +
      "</div></div>";
  }
  function init(host) {
    if (host.__psQuiz_aura) return; host.__psQuiz_aura = true;
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
    var idx = 0, scores = {};

    function setActive(sc) { mount.querySelectorAll(".screen").forEach(function (e) { e.classList.remove("active"); }); $(".s-" + sc).classList.add("active"); }
    function show(sc) { setActive(sc); $(".wrap").scrollIntoView({ behavior: "smooth", block: "start" }); }
    // Lock the screen area to the tallest screen so the widget never resizes between steps.
    function lockHeight() {
      var screensEl = $(".screens"), maxH = 0, i;
      screensEl.style.minHeight = "";
      for (i = 0; i < QUESTIONS.length; i++) { idx = i; renderQ(); setActive("q"); if (screensEl.offsetHeight > maxH) maxH = screensEl.offsetHeight; }
      Object.keys(RESULTS).forEach(function (k) { populateResult(k); setActive("result"); if (screensEl.offsetHeight > maxH) maxH = screensEl.offsetHeight; });
      setActive("intro"); if (screensEl.offsetHeight > maxH) maxH = screensEl.offsetHeight;
      screensEl.style.minHeight = maxH + "px";
      idx = 0; scores = {};
    }
    function renderQ() {
      var q = QUESTIONS[idx];
      $(".prog").textContent = "Question " + (idx + 1) + " of " + QUESTIONS.length;
      $(".q").textContent = q.q;
      var opts = $(".opts"); opts.innerHTML = "";
      q.o.forEach(function (o) {
        var b = document.createElement("button"); b.className = "opt"; b.type = "button"; b.textContent = o.t;
        b.addEventListener("click", function () { choose(o.k); });
        opts.appendChild(b);
      });
      $(".back").style.visibility = idx === 0 ? "hidden" : "visible";
    }
    function choose(k) { scores[k] = (scores[k] || 0) + 1; idx++; if (idx < QUESTIONS.length) renderQ(); else finish(); }
    function populateResult(k) {
      var r = RESULTS[k];
      var vis = $(".rvis");
      if (r.color) vis.innerHTML = "<div class='rswatch' style='background:radial-gradient(circle at 38% 35%," + r.light + "," + r.color + ")'></div>";
      else if (r.emoji) vis.innerHTML = "<div class='remoji'>" + r.emoji + "︎</div>";
      else vis.innerHTML = "";
      $(".rname").textContent = r.name;
      $(".rtext").textContent = r.text;
    }
    function finish() {
      var best = null, bestN = -1;
      Object.keys(RESULTS).forEach(function (k) { var n = scores[k] || 0; if (n > bestN) { bestN = n; best = k; } });
      populateResult(best);
      show("result");
    }
    $(".start").addEventListener("click", function () { idx = 0; scores = {}; renderQ(); show("q"); });
    $(".back").addEventListener("click", function () { if (idx > 0) { idx--; renderQ(); } });
    $(".retry").addEventListener("click", function () { idx = 0; scores = {}; show("intro"); });
    lockHeight();
    // remeasure once the cursive font loads (it changes the result title height)
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(function () { if ($(".s-intro").classList.contains("active")) lockHeight(); });
  }
  function boot() { var host = document.getElementById("ps-aura-quiz") || document.querySelector("[data-ps-widget='aura-quiz']"); if (host) init(host); }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot); else boot();
})();
