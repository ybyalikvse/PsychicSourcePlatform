/* What Is My Spirit Animal? quiz embed.
 * Usage on any site:
 *   <div id="ps-spirit-animal-quiz"></div>
 *   <script async src="https://psychic-source-platform.vercel.app/embed/spirit-animal-quiz.js"></script>
 * Renders directly into the page (Shadow DOM), no iframe. No API calls.
 */
(function () {
  "use strict";
  var SCRIPT_SRC = (document.currentScript && document.currentScript.src) || "";
  var ORIGIN = SCRIPT_SRC ? new URL(SCRIPT_SRC).origin : "https://psychic-source-platform.vercel.app";
  var CTA_URL = "https://www.psychicsource.com/our-psychics";
  var CTA_TEXT = "Discover your guides with a psychic";
  var TITLE = "What's My Spirit Animal?";
  var INTRO = "A spirit animal reflects your deepest instincts and the energy you carry through the world. Answer a few questions to reveal yours.";
  var RESULT_LABEL = "Your Spirit Animal";
  var QUESTIONS = [{"q":"How do you move through the world?","o":[{"t":"Loyally, with my pack","k":"wolf"},{"t":"Quietly, watching everything","k":"owl"},{"t":"Boldly and independently","k":"bear"},{"t":"Gently and gracefully","k":"deer"}]},{"q":"How do you solve problems?","o":[{"t":"Cleverness and cunning","k":"fox"},{"t":"Patient observation","k":"owl"},{"t":"A clear plan from above","k":"hawk"},{"t":"Following my heart","k":"dolphin"}]},{"q":"What do people come to you for?","o":[{"t":"Wisdom and honesty","k":"owl"},{"t":"Strength and protection","k":"bear"},{"t":"Playfulness and joy","k":"dolphin"},{"t":"Loyalty and support","k":"wolf"}]},{"q":"Pick a landscape:","o":[{"t":"Deep forest","k":"wolf"},{"t":"Open sky","k":"hawk"},{"t":"Sunlit meadow","k":"deer"},{"t":"Ocean waves","k":"dolphin"}]},{"q":"Which trait fits you best?","o":[{"t":"Adaptable and quick","k":"fox"},{"t":"Sensitive and intuitive","k":"deer"},{"t":"Visionary and focused","k":"hawk"},{"t":"Strong and self-reliant","k":"bear"}]},{"q":"How do you handle change?","o":[{"t":"I adapt and outsmart it","k":"fox"},{"t":"I rise above for perspective","k":"hawk"},{"t":"I go with the flow joyfully","k":"dolphin"},{"t":"I retreat and reflect first","k":"owl"}]}];
  var RESULTS = {"wolf":{"name":"The Wolf","emoji":"🐺","text":"Your spirit animal is the Wolf, a symbol of loyalty, deep social bonds, and instinct. You value your pack fiercely and lead with both strength and heart. Independent yet devoted, you trust your gut and protect what you love."},"owl":{"name":"The Owl","emoji":"🦉","text":"Your spirit animal is the Owl, keeper of wisdom and hidden truths. You see what others overlook and move through life with quiet, watchful insight. Trust your ability to perceive the deeper currents beneath the surface."},"bear":{"name":"The Bear","emoji":"🐻","text":"Your spirit animal is the Bear, emblem of strength, courage, and self-reliance. Grounded and protective, you are comfortable in your own power and know when to stand firm and when to retreat and restore."},"deer":{"name":"The Deer","emoji":"🦌","text":"Your spirit animal is the Deer, gentle and intuitive. You move through the world with grace and sensitivity, attuned to subtle energies. Your kindness is a strength, and your gentleness opens doors that force cannot."},"fox":{"name":"The Fox","emoji":"🦊","text":"Your spirit animal is the Fox, clever and adaptable. You think on your feet, read situations quickly, and find creative paths others miss. Your wit and resourcefulness carry you through almost anything."},"hawk":{"name":"The Hawk","emoji":"🦅","text":"Your spirit animal is the Hawk, the visionary. You rise above the details to see the bigger picture with sharp focus and clarity. A natural messenger and leader, you spot opportunities long before others do."},"dolphin":{"name":"The Dolphin","emoji":"🐬","text":"Your spirit animal is the Dolphin, playful and deeply emotional. You lead with joy, intelligence, and heart, and you help others feel lighter. Your harmony with the flow of life is a gift to everyone around you."}};

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
    if (host.__psQuiz_animal) return; host.__psQuiz_animal = true;
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
  function boot() { var host = document.getElementById("ps-spirit-animal-quiz") || document.querySelector("[data-ps-widget='spirit-animal-quiz']"); if (host) init(host); }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot); else boot();
})();
