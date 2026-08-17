/* Daily Fortune Cookie - hub tool module.
 * The fortune is seeded by the visitor's Life Path number + today's date, so
 * each member gets their own fortune that is stable for the whole day and
 * changes tomorrow. Animated cookie that cracks open to reveal the slip.
 */
(function () {
  "use strict";

  function digitSum(n) { return String(n).split("").reduce(function (a, d) { return a + (+d || 0); }, 0); }
  var MASTERS = { 11: 1, 22: 1, 33: 1 };
  function reduceKeepMaster(n) { while (n > 9 && !MASTERS[n]) n = digitSum(n); return n; }
  function lifePathOf(m, d, y) { return reduceKeepMaster(reduceKeepMaster(m) + reduceKeepMaster(d) + reduceKeepMaster(y)); }
  function hash(s) { var h = 5381, i; for (i = 0; i < s.length; i++) h = ((h * 33) ^ s.charCodeAt(i)) | 0; return h >>> 0; }

  // Fortune pools tuned to each life path's themes.
  var FORTUNES = {
    1: ["The door you have been waiting on opens the moment you push it yourself.", "A bold first step today becomes the story you tell for years.", "Your independence is not loneliness; it is the runway before flight.", "Lead where others hesitate, and they will follow where you land.", "What you begin today carries an unusual amount of luck. Begin it."],
    2: ["The quiet word you offer today will mean more than any grand gesture.", "Balance returns the moment you stop carrying both sides alone.", "A partnership near you is ready to deepen. Let it.", "Your intuition is louder than usual today. Trust the first feeling.", "Peace is not passive; the calm you create changes the whole room."],
    3: ["Say the thing you have been rehearsing. Your voice is the gift.", "Joy is your currency today, and you are about to be rich.", "A creative spark refuses to be ignored. Follow it before it fades.", "Someone needs your light today more than they will admit.", "Play is not a distraction from your path; today it is the path."],
    4: ["The brick you lay today holds up something you cannot yet see.", "Order clears the fog. Tidy one corner and the rest follows.", "Your patience is quietly building an unshakable foundation.", "Slow and honest beats fast and clever, every time, especially today.", "The work no one notices is the work that changes everything."],
    5: ["Say yes to the unexpected invitation; it is disguised as your future.", "Freedom finds you the instant you release what you have outgrown.", "A change you have feared turns out to be the door, not the wall.", "Adventure is closer than you think, and it starts with one detour.", "Your restlessness is a compass today. Let it point you somewhere new."],
    6: ["Love given freely today returns to you multiplied.", "Tend to your own garden first; you cannot pour from an empty cup.", "A home, a heart, or a hurt is ready to be healed by your care.", "Harmony is your superpower. Someone nearby needs it today.", "Beauty you create today outlasts the moment. Make something lovely."],
    7: ["The answer you seek is beneath the question you keep avoiding.", "Solitude today is not retreat; it is where your wisdom refuels.", "Trust the insight that arrives in the quiet. It is rarely wrong.", "A mystery unravels the moment you stop forcing it.", "Look deeper. The surface has been lying to you, gently."],
    8: ["Abundance flows to the one who acts as though it already has.", "A door to real reward opens; walk through it with clean hands.", "Your ambition is not too much. Today it is exactly enough.", "Money follows mastery. Perfect one thing and watch.", "The power you have been building is ready to be used well."],
    9: ["Release what is finished and your hands will be full by evening.", "Your compassion changes a life today, perhaps without you knowing.", "An ending you have resisted is the doorway you have prayed for.", "Give generously; the universe is keeping a very kind ledger.", "You are an old soul with new work. The world is waiting for it."],
    11: ["A flash of insight today is a message. Write it down before it flies.", "You are a channel for something larger. Let it move through you.", "Your sensitivity is a gift disguised as intensity. Honor it today.", "Inspire one person today and the ripple will outrun your sight.", "The light you carry lands exactly where it is needed. Shine on."],
    22: ["The impossible dream is asking for a first blueprint today.", "You can build on a scale others only imagine. Start the foundation.", "Vision plus discipline equals miracles. You hold both today.", "Think bigger; the plan you shrank was closer to right than you feared.", "What you construct now can outlast you. Build it to matter."],
    33: ["Your care today heals more than you will ever be told.", "Lead with love and the hard problem softens in your hands.", "You teach simply by how you show up. Show up fully today.", "The comfort you give returns as strength when you least expect it.", "Serve from a full heart, and remember to fill it back up."]
  };
  var GUIDES = {
    1: "Focus today: take initiative on the one thing you keep postponing.",
    2: "Focus today: choose cooperation over control.",
    3: "Focus today: express yourself, out loud and unapologetically.",
    4: "Focus today: build one small system that makes tomorrow easier.",
    5: "Focus today: welcome one change instead of resisting it.",
    6: "Focus today: give care, and let yourself receive it too.",
    7: "Focus today: make space for quiet and listen inward.",
    8: "Focus today: act on your ambition with integrity.",
    9: "Focus today: let go of one thing that is already over.",
    11: "Focus today: trust and record your intuition.",
    22: "Focus today: take one concrete step toward the big vision.",
    33: "Focus today: lead with compassion in every exchange."
  };

  function render(mount, ctx) {
    var GOLD = ctx.gold, FONT = ctx.font;
    ctx.injectStyle("fortune-cookie", "" +
      ".fc{color:var(--ps-text);font-family:" + FONT + ";text-align:center}" +
      ".fc .intro{font-size:18px;max-width:560px;margin:0 auto 22px;color:var(--ps-text)}" +
      ".fc .drow{display:flex;gap:10px;justify-content:center;flex-wrap:wrap;margin-bottom:18px}" +
      ".fc select{appearance:none;-webkit-appearance:none;padding:13px 36px 13px 14px;font-size:17px;font-family:" + FONT + ";color:var(--ps-text);background-color:#fff;border:1.5px solid var(--ps-border);border-radius:8px;outline:none;cursor:pointer;background-image:url(\"data:image/svg+xml;charset=utf-8,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='8'%3E%3Cpath d='M1 1l5 5 5-5' stroke=%27%23999%27 stroke-width='1.6' fill='none'/%3E%3C/svg%3E\");background-repeat:no-repeat;background-position:right 12px center}" +
      ".fc select:focus{border-color:var(--ps-text)}.fc select option{color:#1c1c2e;background:#fff}" +
      ".fc .btn{font-family:" + FONT + ";font-size:18px;font-weight:600;color:var(--ps-on);background:" + GOLD + ";border:none;border-radius:999px;padding:14px 40px;cursor:pointer;box-shadow:0 4px 16px rgba(0,0,0,.10);transition:transform .15s ease}" +
      ".fc .btn:hover{transform:translateY(-1px)}" +
      ".fc .err{display:none;margin-top:12px;color:var(--ps-accent);font-size:15px}.fc .err.show{display:block}" +
      ".fc .stage{display:none}.fc .stage.show{display:block}" +
      ".fc .cookiewrap{position:relative;width:280px;height:220px;margin:6px auto 0;cursor:pointer}" +
      ".fc .half{transition:transform .8s cubic-bezier(.2,.8,.3,1);transform-origin:140px 130px}" +
      ".fc .cookiewrap.open .lh{transform:translate(-64px,6px) rotate(-16deg)}" +
      ".fc .cookiewrap.open .rh{transform:translate(64px,6px) rotate(16deg)}" +
      ".fc .tap{position:absolute;left:0;right:0;bottom:2px;font-size:14px;letter-spacing:1px;text-transform:uppercase;color:var(--ps-muted)}" +
      ".fc .cookiewrap.open .tap{opacity:0}" +
      ".fc .slip{position:relative;max-width:520px;margin:14px auto 0;background:linear-gradient(180deg,#fdfaf0,#f3ead2);color:#2a2213;border-radius:10px;padding:26px 26px 22px;box-shadow:0 12px 30px rgba(0,0,0,.10);opacity:0;transform:scale(.9) translateY(12px);transition:opacity .5s ease .5s,transform .5s ease .5s}" +
      ".fc .cookiewrap.open ~ .slip,.fc .slip.show{opacity:1;transform:none}" +
      ".fc .slip::before{content:'';position:absolute;left:26px;right:26px;top:12px;border-top:1px dashed rgba(0,0,0,.18)}" +
      ".fc .slip::after{content:'';position:absolute;left:26px;right:26px;bottom:12px;border-top:1px dashed rgba(0,0,0,.18)}" +
      ".fc .ftext{font-family:Georgia,'Times New Roman',serif;font-size:22px;font-style:italic;line-height:1.5}" +
      ".fc .meta{display:flex;gap:22px;justify-content:center;flex-wrap:wrap;margin-top:18px;font-size:14px;color:#6a5a34}" +
      ".fc .meta b{color:#2a2213}" +
      ".fc .guide{max-width:520px;margin:16px auto 0;font-size:15.5px;color:var(--ps-text)}" +
      ".fc .note{margin-top:10px;font-size:13px;color:var(--ps-muted)}" +
      ".fc .retry{display:block;margin:22px auto 0;font-size:15px;font-weight:700;letter-spacing:1px;color:" + GOLD + ";background:none;border:none;cursor:pointer;font-family:" + FONT + "}");

    var mn = ["January","February","March","April","May","June","July","August","September","October","November","December"];
    function opts(list, ph) { var s = "<option value=''>" + ph + "</option>"; list.forEach(function (o) { s += "<option value='" + o[0] + "'>" + o[1] + "</option>"; }); return s; }
    var months = mn.map(function (m, i) { return [i + 1, m]; });
    var days = []; for (var d = 1; d <= 31; d++) days.push([d, d]);
    var years = []; var yr = new Date().getFullYear(); for (var y = yr; y >= 1920; y--) years.push([y, y]);

    // fortune cookie SVG (two mirrored halves that split apart)
    var cookieSvg = "<svg viewBox='0 0 280 200' width='280' height='200' xmlns='http://www.w3.org/2000/svg'>" +
      "<defs><linearGradient id='fcg' x1='0' y1='0' x2='0' y2='1'><stop offset='0' stop-color='#f6c884'/><stop offset='1' stop-color='#d99a4e'/></linearGradient>" +
      "<linearGradient id='fcg2' x1='0' y1='0' x2='0' y2='1'><stop offset='0' stop-color='#eab873'/><stop offset='1' stop-color='#c98a41'/></linearGradient></defs>" +
      "<g class='half lh'><path d='M140 46 C96 34 54 58 52 104 C51 138 82 168 140 156 L140 46 Z' fill='url(#fcg)' stroke='#b9803a' stroke-width='2'/>" +
      "<path d='M140 46 C120 60 116 140 140 156' fill='none' stroke='#b9803a' stroke-width='2' opacity='.6'/>" +
      "<path d='M96 44 C70 52 70 92 92 100' fill='none' stroke='#fff' stroke-width='3' opacity='.35' stroke-linecap='round'/></g>" +
      "<g class='half rh'><path d='M140 46 C184 34 226 58 228 104 C229 138 198 168 140 156 L140 46 Z' fill='url(#fcg2)' stroke='#b9803a' stroke-width='2'/>" +
      "<path d='M140 46 C160 60 164 140 140 156' fill='none' stroke='#b9803a' stroke-width='2' opacity='.6'/></g>" +
      "</svg>";

    var el = document.createElement("div"); el.className = "fc";
    el.innerHTML =
      "<div class='stage s-form show'>" +
        "<p class='intro'>Your fortune for today is drawn from your Life Path number, so it belongs to you alone. Enter your birth date and crack open your cookie.</p>" +
        "<div class='drow'>" +
          "<select data-f='month'>" + opts(months, "Month") + "</select>" +
          "<select data-f='day'>" + opts(days, "Day") + "</select>" +
          "<select data-f='year'>" + opts(years, "Year") + "</select>" +
        "</div>" +
        "<button class='btn' type='button'>Get My Cookie</button>" +
        "<div class='err' role='alert'></div>" +
      "</div>" +
      "<div class='stage s-cookie' aria-live='polite'>" +
        "<div class='cookiewrap' role='button' tabindex='0' aria-label='Crack the cookie'>" + cookieSvg + "<div class='tap'>Tap to crack it open</div></div>" +
        "<div class='slip'><div class='ftext'></div><div class='meta'></div></div>" +
        "<p class='guide'></p>" +
        "<div class='ai-slot'></div>" +
        "<p class='note'>Come back tomorrow for a brand new fortune.</p>" +
        "<button class='retry' type='button'>&#8592; Try another date</button>" +
      "</div>";
    mount.appendChild(el);

    var $ = function (s) { return el.querySelector(s); };
    function val(n) { return $("[data-f='" + n + "']").value; }
    var err = $(".err"), sForm = $(".s-form"), sCookie = $(".s-cookie"), cookie = $(".cookiewrap"), slip = $(".slip");

    function build(lifePath) {
      var now = new Date();
      var seed = hash(lifePath + "|" + now.getFullYear() + "-" + (now.getMonth() + 1) + "-" + now.getDate());
      var pool = FORTUNES[lifePath] || FORTUNES[1];
      var fortune = pool[seed % pool.length];
      var lucky = (seed % 99) + 1;
      $(".ftext").textContent = "“" + fortune + "”";
      $(".meta").innerHTML = "<span>Lucky number <b>" + lucky + "</b></span><span>Life Path <b>" + lifePath + "</b></span>";
      $(".guide").textContent = GUIDES[lifePath] || "";
    }
    function crack() { cookie.classList.add("open"); slip.classList.add("show"); }

    $(".btn").addEventListener("click", function () {
      var m = +val("month"), d = +val("day"), y = +val("year");
      if (!m || !d || !y) { err.textContent = "Please select your full birth date."; err.classList.add("show"); return; }
      if (d > new Date(y, m, 0).getDate()) { err.textContent = "That day does not exist in the selected month."; err.classList.add("show"); return; }
      err.classList.remove("show");
      var lp = lifePathOf(m, d, y);
      build(lp);
      var slot = $(".ai-slot"); slot.innerHTML = "";
      if (ctx.aiReading) ctx.aiReading(slot, "fortune", function () { return { lifePath: lp, date: new Date().toISOString().slice(0, 10) }; }, { label: "Read today's fuller message", title: "Today, For You", hint: "A short personal reading for today." });
      sForm.classList.remove("show"); sCookie.classList.add("show");
    });
    cookie.addEventListener("click", crack);
    cookie.addEventListener("keydown", function (e) { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); crack(); } });
    $(".retry").addEventListener("click", function () {
      cookie.classList.remove("open"); slip.classList.remove("show");
      sCookie.classList.remove("show"); sForm.classList.add("show");
    });
  }

  window.__PSHUB__ = window.__PSHUB__ || { _reg: {}, _waiters: {}, register: function (id, def) { this._reg[id] = def; (this._waiters[id] || []).forEach(function (fn) { fn(def); }); this._waiters[id] = []; } };
  window.__PSHUB__.register("fortune-cookie", { title: "Daily Fortune Cookie", render: render });
})();
