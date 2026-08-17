/* Attachment Style - hub tool module.
 * An 18-item assessment scored on two independent dimensions (attachment
 * anxiety and attachment avoidance), the model behind modern attachment
 * research. Places the user in one of four styles on a 2D map with a
 * percentage on each axis, plus growth guidance.
 */
(function () {
  "use strict";

  // dim: "anx" or "avo"; rev: reverse-scored
  var ITEMS = [
    { t: "I worry that romantic partners won't care about me as much as I care about them.", dim: "anx" },
    { t: "I often worry that a partner will leave me.", dim: "anx" },
    { t: "I need frequent reassurance that I am loved.", dim: "anx" },
    { t: "I get frustrated when a partner is not around as much as I would like.", dim: "anx" },
    { t: "When I'm apart from someone I love, I worry they might lose interest.", dim: "anx" },
    { t: "I worry a fair amount about losing the people closest to me.", dim: "anx" },
    { t: "My need for closeness sometimes feels like too much for others.", dim: "anx" },
    { t: "I get upset when someone I care about pulls away, even a little.", dim: "anx" },
    { t: "I rarely worry about being abandoned by the people I love.", dim: "anx", rev: true },
    { t: "I prefer not to depend on others or have them depend on me.", dim: "avo" },
    { t: "I find it difficult to open up to romantic partners.", dim: "avo" },
    { t: "I get uncomfortable when a partner wants to be very close.", dim: "avo" },
    { t: "I prefer to keep my feelings to myself.", dim: "avo" },
    { t: "I would rather handle problems on my own than lean on someone.", dim: "avo" },
    { t: "I feel uneasy when anyone gets too close emotionally.", dim: "avo" },
    { t: "I value my independence more than closeness in relationships.", dim: "avo" },
    { t: "I feel comfortable sharing my private thoughts and feelings with a partner.", dim: "avo", rev: true },
    { t: "It is easy for me to be affectionate and emotionally close.", dim: "avo", rev: true }
  ];
  var SCALE = ["Strongly disagree", "Disagree", "Neutral", "Agree", "Strongly agree"];

  var STYLES = {
    secure: { name: "Secure", tag: "Comfortable with closeness and independence", desc: "You are generally at ease in relationships. You can be close without losing yourself and independent without pushing others away. You trust that you are worthy of love, and you extend that trust to the people you care about.", rel: "In relationships you communicate openly, handle conflict without panic, and offer steady support. You give others room to be themselves.", strengths: ["Trusting and trustworthy", "Comfortable with intimacy", "Regulates emotions well", "Communicates needs directly"], growth: "Your work is to keep modeling this security for partners who did not grow up with it, and to remember that even secure people need support. Let others show up for you." },
    anxious: { name: "Anxious / Preoccupied", tag: "Craves closeness and fears distance", desc: "You love deeply and give generously, but a quiet fear of being left can keep your nervous system on alert. You are highly attuned to your partner's moods and can read distance where there is none, which sometimes leads to seeking reassurance.", rel: "In relationships you are warm, devoted, and expressive, and you may need more reassurance than a partner realizes. Space can feel like rejection even when it isn't.", strengths: ["Deeply loving and loyal", "Emotionally attuned", "Generous and attentive", "Willing to work on the relationship"], growth: "Your growth is in self-soothing: learning that a partner's need for space is not abandonment, and building a sense of security that comes from within rather than only from reassurance. Naming your needs calmly, before they spike, changes everything." },
    avoidant: { name: "Dismissive / Avoidant", tag: "Values independence over closeness", desc: "You are self-reliant and calm on the surface, and you protect your independence carefully. Closeness can feel like pressure, so you may keep a little distance or downplay how much you need others, even when you care a great deal.", rel: "In relationships you are steady and low-drama, but partners may feel shut out when you retreat into self-sufficiency or keep your inner world private.", strengths: ["Independent and capable", "Calm under pressure", "Respects others' autonomy", "Rarely clingy or controlling"], growth: "Your growth is in letting people in: noticing the impulse to withdraw and choosing to stay and share instead. Depending on someone is not weakness, and vulnerability is what turns closeness into real intimacy." },
    fearful: { name: "Fearful / Avoidant", tag: "Wants closeness but fears being hurt", desc: "You feel the pull toward deep connection and the fear of it at the same time. You long to be close, yet closeness can trigger a need to protect yourself, so you may move toward people and then pull away. This push-pull often traces back to relationships where love and hurt came together.", rel: "In relationships you can run hot and cold, craving intimacy one moment and needing distance the next, which can be confusing for you and your partner both.", strengths: ["Capable of deep connection", "Self-aware and reflective", "Empathetic to others' pain", "Resilient through hard experiences"], growth: "Your growth is in safety and consistency: slowing down, noticing the moment fear turns into flight, and learning that you can stay present through discomfort. This is the style that most benefits from a patient partner and supportive guidance." }
  };

  function styleKey(anx, avo) { var hiA = anx >= 50, hiV = avo >= 50; return hiA ? (hiV ? "fearful" : "anxious") : (hiV ? "avoidant" : "secure"); }

  function render(mount, ctx) {
    var GOLD = ctx.gold, FONT = ctx.font;
    ctx.injectStyle("as", "" +
      ".as{color:var(--ps-text);font-family:" + FONT + ";text-align:center}" +
      ".as .stage{display:none}.as .stage.show{display:block;animation:asf .35s ease}@keyframes asf{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:none}}" +
      ".as .panel{min-height:360px;display:flex;flex-direction:column;justify-content:center}" +
      ".as .intro{font-size:18px;max-width:600px;margin:0 auto 24px;color:var(--ps-text)}" +
      ".as .btn{font-family:" + FONT + ";font-size:18px;font-weight:600;color:var(--ps-on);background:" + GOLD + ";border:none;border-radius:999px;padding:14px 44px;cursor:pointer;box-shadow:0 4px 16px rgba(0,0,0,.10);align-self:center}" +
      ".as .prog{font-size:13px;letter-spacing:2px;text-transform:uppercase;color:var(--ps-muted);margin-bottom:16px}" +
      ".as .qt{font-size:23px;font-weight:600;max-width:620px;margin:0 auto 26px;min-height:70px;display:flex;align-items:center;justify-content:center}" +
      ".as .likert{display:flex;flex-direction:column;gap:10px;max-width:460px;margin:0 auto}" +
      ".as .opt{font-family:" + FONT + ";font-size:17px;color:var(--ps-text);background:var(--ps-panel);border:1.5px solid var(--ps-border);border-radius:12px;padding:14px 18px;cursor:pointer;transition:background .15s,border-color .15s}" +
      ".as .opt:hover{background:var(--ps-panel);border-color:var(--ps-text)}" +
      ".as .back{margin-top:20px;font-size:14px;color:var(--ps-muted);background:none;border:none;cursor:pointer;font-family:" + FONT + "}.as .back:hover{color:var(--ps-text)}.as .back[disabled]{visibility:hidden}" +
      ".as .rname{font-family:'Great Vibes',cursive;font-size:clamp(30px,4.5vw,44px);color:" + GOLD + ";line-height:1.05;margin-top:4px}" +
      ".as .rtag{font-size:17px;color:var(--ps-text);margin-bottom:18px}" +
      ".as .map{margin:6px auto 22px}" +
      ".as .axpct{display:flex;gap:26px;justify-content:center;margin-bottom:22px;font-size:15px}" +
      ".as .axpct b{color:" + GOLD + ";font-size:19px}" +
      ".as .rdesc{font-size:17px;max-width:640px;margin:0 auto 16px;color:var(--ps-text);line-height:1.7}" +
      ".as .rrel{font-size:16px;max-width:640px;margin:0 auto 22px;color:var(--ps-text);font-style:italic}" +
      ".as .cols{display:grid;grid-template-columns:1fr 1fr;gap:14px;max-width:720px;margin:0 auto;text-align:left}" +
      "@media(max-width:560px){.as .cols{grid-template-columns:1fr}}" +
      ".as .cell{background:var(--ps-panel);border:1px solid var(--ps-border);border-radius:14px;padding:16px 18px}" +
      ".as .cell h4{font-size:13px;letter-spacing:1.5px;text-transform:uppercase;color:" + GOLD + ";margin-bottom:8px}" +
      ".as .cell li{font-size:15.5px;color:var(--ps-text);list-style:none;padding:3px 0 3px 16px;position:relative}.as .cell li::before{content:'';position:absolute;left:0;top:12px;width:6px;height:6px;border-radius:50%;background:" + GOLD + "}" +
      ".as .cell p{font-size:15.5px;color:var(--ps-text)}" +
      ".as .retry{display:block;margin:26px auto 0;font-size:15px;font-weight:700;letter-spacing:1px;color:" + GOLD + ";background:none;border:none;cursor:pointer;font-family:" + FONT + "}");

    var el = document.createElement("div"); el.className = "as";
    el.innerHTML =
      "<div class='stage s-intro show'><div class='panel'>" +
        "<p class='intro'>Attachment style shapes how you love, handle closeness, and react when things feel uncertain. This 18-question assessment measures two dimensions, anxiety and avoidance, to reveal your style and how to grow. Answer honestly, based on how you generally feel.</p>" +
        "<button class='btn start' type='button'>Begin the Assessment</button>" +
      "</div></div>" +
      "<div class='stage s-q'><div class='panel'><div class='prog'></div><div class='qt'></div>" +
        "<div class='likert'></div><button class='back' type='button'>&#8592; Back</button></div></div>" +
      "<div class='stage s-result' aria-live='polite'></div>";
    mount.appendChild(el);

    var $ = function (s) { return el.querySelector(s); };
    var idx = 0, answers = new Array(ITEMS.length).fill(null);
    var sIntro = $(".s-intro"), sQ = $(".s-q"), sR = $(".s-result");
    function show(st) { [sIntro, sQ, sR].forEach(function (e) { e.classList.remove("show"); }); st.classList.add("show"); }

    function renderQ() {
      $(".prog").textContent = "Question " + (idx + 1) + " of " + ITEMS.length;
      $(".qt").textContent = ITEMS[idx].t;
      var lk = $(".likert"); lk.innerHTML = "";
      SCALE.forEach(function (label, v) {
        var b = document.createElement("button"); b.className = "opt"; b.type = "button"; b.textContent = label;
        b.addEventListener("click", function () { answers[idx] = v + 1; next(); });
        lk.appendChild(b);
      });
      $(".back").disabled = idx === 0;
    }
    function next() { if (idx < ITEMS.length - 1) { idx++; renderQ(); } else finish(); }

    function finish() {
      var anxSum = 0, avoSum = 0, anxN = 0, avoN = 0;
      ITEMS.forEach(function (it, i) { var v = answers[i]; if (it.rev) v = 6 - v; if (it.dim === "anx") { anxSum += v; anxN++; } else { avoSum += v; avoN++; } });
      var anx = Math.round((anxSum - anxN) / (anxN * 4) * 100);
      var avo = Math.round((avoSum - avoN) / (avoN * 4) * 100);
      var key = styleKey(anx, avo), S = STYLES[key];
      sR.innerHTML =
        "<div class='rname'>" + S.name + "</div>" +
        "<div class='rtag'>" + S.tag + "</div>" +
        mapSvg(anx, avo, key) +
        "<div class='axpct'><span>Attachment anxiety <b>" + anx + "%</b></span><span>Attachment avoidance <b>" + avo + "%</b></span></div>" +
        "<p class='rdesc'>" + S.desc + "</p>" +
        "<p class='rrel'>" + S.rel + "</p>" +
        "<div class='cols'><div class='cell'><h4>Your strengths</h4><ul>" + S.strengths.map(function (s) { return "<li>" + s + "</li>"; }).join("") + "</ul></div>" +
        "<div class='cell'><h4>Where to grow</h4><p>" + S.growth + "</p></div></div>" +
        "<div class='ai-reading-slot' style='text-align:left'></div>" +
        "<div class='ai-chat-slot' style='text-align:left'></div>" +
        "<button class='retry' type='button'>&#8592; Take it again</button>";
      show(sR);
      var asFacts = function () { return { style: key, styleName: S.name, attachmentAnxiety: anx, attachmentAvoidance: avo }; };
      if (ctx.aiReading) ctx.aiReading(sR.querySelector(".ai-reading-slot"), "attachment", asFacts, { title: "Your Personalized Growth Plan", label: "Get your personalized growth plan", hint: "Grounded in your anxiety and avoidance scores." });
      if (ctx.aiChat) ctx.aiChat(sR.querySelector(".ai-chat-slot"), "attachment", asFacts, { title: "Ask about your patterns", placeholder: "e.g. Why do I pull away when things get close?" });
      sR.querySelector(".retry").addEventListener("click", function () { idx = 0; answers = new Array(ITEMS.length).fill(null); show(sIntro); });
    }

    function mapSvg(anx, avo, key) {
      var S = 300, pad = 34, plot = S - pad * 2;
      var x = pad + (avo / 100) * plot;         // avoidance: left low -> right high
      var y = pad + (1 - anx / 100) * plot;     // anxiety: bottom low -> top high
      var GRID = "rgba(0,0,0,.18)", TXT = "#6f6a66", ACC = "#a5121b";
      function q(cx, cy, label, active) { return "<text x='" + cx + "' y='" + cy + "' fill='" + (active ? ACC : TXT) + "' font-size='13' font-weight='" + (active ? 700 : 400) + "' text-anchor='middle'>" + label + "</text>"; }
      return "<svg class='map' width='300' height='300' viewBox='0 0 300 300' xmlns='http://www.w3.org/2000/svg' font-family='" + FONT + "'>" +
        "<rect x='" + pad + "' y='" + pad + "' width='" + plot + "' height='" + plot + "' fill='rgba(0,0,0,.03)' stroke='" + GRID + "'/>" +
        "<line x1='" + (pad + plot / 2) + "' y1='" + pad + "' x2='" + (pad + plot / 2) + "' y2='" + (pad + plot) + "' stroke='" + GRID + "' stroke-dasharray='4 4'/>" +
        "<line x1='" + pad + "' y1='" + (pad + plot / 2) + "' x2='" + (pad + plot) + "' y2='" + (pad + plot / 2) + "' stroke='" + GRID + "' stroke-dasharray='4 4'/>" +
        q(pad + plot * 0.25, pad + plot * 0.14, "Anxious", key === "anxious") +
        q(pad + plot * 0.75, pad + plot * 0.14, "Fearful", key === "fearful") +
        q(pad + plot * 0.25, pad + plot * 0.9, "Secure", key === "secure") +
        q(pad + plot * 0.75, pad + plot * 0.9, "Avoidant", key === "avoidant") +
        "<text x='" + (pad + plot / 2) + "' y='" + (S - 6) + "' fill='" + TXT + "' font-size='11' text-anchor='middle'>Avoidance &#8594;</text>" +
        "<text x='12' y='" + (pad + plot / 2) + "' fill='" + TXT + "' font-size='11' text-anchor='middle' transform='rotate(-90 12 " + (pad + plot / 2) + ")'>Anxiety &#8594;</text>" +
        "<circle cx='" + x.toFixed(1) + "' cy='" + y.toFixed(1) + "' r='9' fill='" + ACC + "' stroke='#7c0a11' stroke-width='2'/>" +
        "</svg>";
    }

    $(".start").addEventListener("click", function () { idx = 0; answers = new Array(ITEMS.length).fill(null); renderQ(); show(sQ); });
    $(".back").addEventListener("click", function () { if (idx > 0) { idx--; renderQ(); } });
  }

  window.__PSHUB__ = window.__PSHUB__ || { _reg: {}, _waiters: {}, register: function (id, def) { this._reg[id] = def; (this._waiters[id] || []).forEach(function (fn) { fn(def); }); this._waiters[id] = []; } };
  window.__PSHUB__.register("attachment-style", { title: "Attachment Style", render: render });
})();
