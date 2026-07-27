/* Your Personal Online Tarot Reading embed.
 * Usage on any site:
 *   <div id="ps-tarot-reading"></div>
 *   <script async src="https://psychic-source-platform.vercel.app/embed/tarot-reading.js"></script>
 * Renders directly into the page (Shadow DOM), no iframe.
 * Card faces: Rider-Waite-Smith deck (1909), public domain.
 */
(function () {
  "use strict";

  var SCRIPT_SRC = (document.currentScript && document.currentScript.src) || "";
  var ORIGIN = SCRIPT_SRC ? new URL(SCRIPT_SRC).origin : "https://psychic-source-platform.vercel.app";

  // Set to a destination URL to show the CTA button after the last card.
  var CTA_URL = "";
  var CTA_TEXT = "Get a Live Tarot Reading";

  var POSITIONS = [
    "How you feel about yourself now",
    "What you most want at this moment",
    "Your fears",
    "What is going for you",
    "What is going against you",
    "The outcome",
  ];

  var CARDS = [
    { n: "The Fool", t: "The fool stands at the edge of a cliff, face lifted to the sky, a small bundle over his shoulder and a loyal dog at his heels. He is the spirit of pure beginnings, stepping forward on faith alone. You are at the start of something new, and the unknown feels larger than the map. Trust your instincts and take the step; the path appears under the feet of those who walk." },
    { n: "The Magician", t: "The magician stands before a table holding all four symbols of the suits, one hand raised to the heavens and one pointing to the earth. Everything he needs is already in front of him. This card says the same of you: the tools, talent, and timing are present. What remains is the act of will. Direct your focus deliberately and you can shape the situation rather than react to it." },
    { n: "The High Priestess", t: "The high priestess sits between two pillars, a crescent moon at her feet and a veil of pomegranates behind her, guarding what cannot be spoken aloud. She is the keeper of intuition and hidden knowledge. Something in your situation is not yet visible on the surface. Quiet the noise and listen inward; you already sense the truth even if you cannot yet prove it." },
    { n: "The Empress", t: "The empress reclines in a lush garden, wheat ripening at her feet, her shield marked with the symbol of love. She is abundance, nurture, and creation in full bloom. This card points to growth in your life: a relationship, a project, or a version of yourself that is ready to flourish. Tend it with patience and generosity, and let yourself receive care as freely as you give it." },
    { n: "The Emperor", t: "The emperor sits on a stone throne carved with rams' heads, holding the symbols of authority, mountains rising behind him. He is structure, order, and earned command. Your situation calls for boundaries and steady leadership, whether over others or over your own habits. Build the framework now; the discipline that feels rigid today becomes the foundation that frees you tomorrow." },
    { n: "The Hierophant", t: "The hierophant sits between two pillars raising a hand in blessing, keys crossed at his feet, two initiates listening below. He represents tradition, teaching, and trusted counsel. You may be seeking guidance, or being asked to work within an established structure rather than against it. Wisdom that has served generations has something to offer you now; seek out a mentor or a proven path." },
    { n: "The Lovers", t: "Beneath a radiant angel, two figures stand in a garden, a choice laid out between them. The lovers speak of union, and just as often of decision: the moment where the heart must commit. A meaningful choice stands before you, and it cannot be made halfway. Choose from your values rather than convenience, and the relationship or path you commit to will align with who you truly are." },
    { n: "The Chariot", t: "A crowned figure rides a chariot drawn by two sphinxes, one black and one white, each pulling in its own direction. Victory here comes not from ease but from control of opposing forces. You are managing tensions that tug you two ways at once. Hold the reins firmly and keep your destination in view; determination, not luck, carries this situation forward." },
    { n: "Strength", t: "A woman calmly closes the jaws of a lion with bare hands, an infinity symbol floating above her head. Her power is not force but gentleness that does not flinch. The card tells you the situation will not be won by pushing harder. Patience, compassion, and quiet courage tame what roars at you, including the fears inside. Your softest strength is your realest one." },
    { n: "The Hermit", t: "The hermit stands alone on a mountain peak, holding a lantern with a six-pointed star, lighting only the next few steps. He has withdrawn to find what crowds cannot give. You may need solitude now: time to reflect, review, and hear your own voice again. The answer you're seeking is not in more opinions but in the quiet where your inner light becomes visible." },
    { n: "Wheel of Fortune", t: "A great wheel turns in the sky, strange creatures rising and falling on its rim while a sphinx sits composed at the top. The wheel is fate in motion: cycles ending, cycles beginning. Change is arriving in your situation whether invited or not. What falls away was due to fall; what rises deserves your readiness. Position yourself like the sphinx: steady at the center while the rim spins." },
    { n: "Justice", t: "Justice sits crowned between two pillars, a sword upright in one hand and scales balanced in the other. Nothing here is hidden and nothing is unearned. This card speaks of truth, fairness, and consequences arriving in their proper measure. A decision or reckoning in your life asks for honesty, including with yourself. Act with integrity and the scales will tip in your favor." },
    { n: "The Hanged Man", t: "The hanged man is not at all what he sounds like. On this card, the man in question hangs serenely, suspended by one foot. The other leg is bent, indicating a crossroads. The hanged man is in a position of complete surrender with his hands behind his back. A halo of light around his head indicates a revelation that may soon guide his way. You feel as though you're suspended right now, unable to move forward. You're going through a major transformation but will soon come out on the other side." },
    { n: "Death", t: "A skeletal rider in black armor carries a banner with a white rose while figures from every station of life yield before him; on the horizon, the sun rises between two towers. Death in the tarot is almost never literal. Something in your life is ending so that something else can begin. Release your grip on what is already leaving, and grieve if you need to; the sunrise on this card is yours too." },
    { n: "Temperance", t: "A winged angel stands with one foot on land and one in water, pouring liquid between two cups in an impossible, flowing stream. This is the art of balance and right mixture. Your situation asks for moderation, patience, and blending rather than choosing extremes. Healing is underway, though it works quietly. Give the process time; what is being combined in your life needs a careful hand, not a fast one." },
    { n: "The Devil", t: "A horned figure looms over two chained humans, but look closely: the chains around their necks are loose enough to lift off. The devil is bondage that continues by consent, whether a habit, a fear, a relationship pattern, or a story you tell yourself. Something has been holding you that you have the power to remove. Naming the chain honestly is the first pull that loosens it." },
    { n: "The Tower", t: "Lightning strikes a crowned tower built on a jagged peak, flames burst from its windows, and figures fall through the night sky. The tower is sudden upheaval: the collapse of something built on a false foundation. A disruption in your life, however unwelcome, is clearing what could not stand. What is true in your life will survive this. What falls was never load-bearing for your future." },
    { n: "The Star", t: "Under a vast night sky, a woman kneels at the water's edge pouring water onto land and pool alike, one great star blazing above seven smaller ones. After the storm of the tower comes this: hope, healing, and quiet renewal. This card is a deep breath for your soul. Your faith in the future is being restored, and it is not naive; it is guidance. Follow the star you can see again." },
    { n: "The Moon", t: "A full moon rises between two towers while a dog and a wolf howl below and a crayfish crawls from the water onto a winding path. The moon is the realm of uncertainty, dreams, and things half-seen. Your situation contains more illusion than fact right now, and imagination may be filling the gaps with fear. Move slowly, verify what you can, and trust that the path continues past what you can currently see." },
    { n: "The Sun", t: "A radiant sun beams over a garden wall of sunflowers while a joyful child rides a white horse, arms open to the day. This is the most unambiguous yes in the deck: vitality, clarity, and success. Warmth is returning to your situation, and what you've worked toward is ripening in full light. Let yourself feel the joy without waiting for a catch. This brightness is earned and real." },
    { n: "Judgement", t: "An angel sounds a trumpet from the clouds and figures rise from below with faces lifted, answering a call that cannot be ignored. Judgement is awakening: the summons to your next chapter and an honest accounting of the last one. Something is calling you to rise, forgive what is finished, and step into a larger version of your life. You already hear it. This card asks you to answer." },
    { n: "The World", t: "A dancer moves within a great laurel wreath, a wand in each hand, while the four fixed figures of the heavens watch from the corners. The world is completion: the end of a long cycle, arrived at whole. Something significant in your life is reaching its fulfillment, and you are not who you were when it began. Take in the achievement fully, because your next journey will begin from this higher ground." },
  ];

  // ---------- Styles ----------

  var FONT = "'Segoe UI','Helvetica Neue',Helvetica,Arial,sans-serif";
  var WINE = "#8d2f42";
  var NAVY = "#25415e";
  var ORANGE_S = "#e59a54";
  var BLUE_S = "#6d9cc4";
  var INK = "#3f3c34";

  var CSS = "" +
    ":host{all:initial;display:block}" +
    "*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}" +
    ".wrap{position:relative;font-family:" + FONT + ";color:" + INK + ";" +
    "background:radial-gradient(ellipse 120% 90% at 30% 8%,#f8f2df 0%,#f2e9cf 55%,#ecdfbc 100%);" +
    "padding:54px 24px 64px;overflow:hidden;line-height:1.65}" +
    ".corner{position:absolute;width:150px;height:230px;border-radius:12px;border:6px solid #1c1c1c;" +
    "background:url('" + ORIGIN + "/embed/img/tarot/back.jpg') center/cover;box-shadow:0 8px 24px rgba(0,0,0,.3)}" +
    ".corner.tl{top:-70px;left:-52px;transform:rotate(24deg)}" +
    ".corner.br{bottom:-80px;right:-46px;transform:rotate(-160deg)}" +
    ".inner{position:relative;max-width:980px;margin:0 auto}" +
    ".pretitle{display:flex;align-items:center;justify-content:center;gap:10px;font-family:'Great Vibes',cursive;" +
    "font-size:30px;color:#3d3a30}" +
    ".pretitle svg{color:#3d3a30}" +
    ".title{display:flex;align-items:center;justify-content:center;gap:16px;font-family:'Great Vibes',cursive;font-weight:400;" +
    "font-size:clamp(48px,7.5vw,84px);color:" + WINE + ";text-align:center;line-height:1.1;margin-bottom:26px}" +
    ".title svg{color:" + WINE + ";flex:0 0 auto}" +
    ".intro{font-size:19px;text-align:center;margin:0 auto 22px;max-width:900px}" +
    ".actions{text-align:center;margin-top:34px}" +
    ".btn{display:inline-flex;align-items:center;gap:12px;font-family:" + FONT + ";font-size:19px;font-weight:600;" +
    "color:#fff;background:" + NAVY + ";border:2px solid #4a687f;border-radius:4px;padding:15px 40px;cursor:pointer;" +
    "box-shadow:0 3px 10px rgba(0,0,0,.25);transition:background .15s ease}" +
    ".btn:hover{background:#2f5175}" +
    ".btn:disabled,.btn.off{background:#9aa0a4;border-color:#b3b8bb;cursor:default}" +
    ".btn .tri{width:0;height:0;border-top:7px solid transparent;border-bottom:7px solid transparent;border-left:10px solid #fff}" +
    ".screen{display:none}" +
    ".screen.active{display:block;animation:fadein .5s ease}" +
    "@keyframes fadein{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:none}}" +
    ".fanbox{position:relative;height:420px;margin:10px auto 0;max-width:940px}" +
    ".card{position:absolute;width:118px;height:196px;margin-left:-59px;margin-top:-98px;" +
    "border-radius:9px;border:4px solid #161616;background:url('" + ORIGIN + "/embed/img/tarot/back.jpg') center/cover;" +
    "box-shadow:-3px 4px 10px rgba(0,0,0,.35);cursor:pointer;transition:transform .32s cubic-bezier(.22,.85,.3,1)}" +
    ".card:hover{filter:brightness(1.08)}" +
    ".card.picked{box-shadow:-3px 10px 16px rgba(0,0,0,.4)}" +
    ".counter{font-family:Georgia,serif;font-style:italic;font-size:44px;color:#d2622a;text-align:center;margin-top:6px}" +
    ".shuffle{display:block;margin:8px auto 0;font-size:17px;font-weight:600;color:#3f3c34;text-decoration:underline;" +
    "background:none;border:none;cursor:pointer;font-family:" + FONT + "}" +
    ".shuffle:hover{color:" + WINE + "}" +
    ".rhead{display:flex;align-items:center;justify-content:center;gap:16px;font-family:'Great Vibes',cursive;" +
    "font-size:clamp(44px,6.5vw,70px);color:" + WINE + ";margin-bottom:30px;line-height:1.1}" +
    ".stepbox{position:relative;border:1.5px solid #6b6154;padding:40px 40px 40px 220px;min-height:360px;max-width:880px;margin:60px auto 0}" +
    ".cardimg{position:absolute;left:-40px;top:-46px;width:230px;border-radius:12px;border:5px solid #f5f2ea;" +
    "box-shadow:0 14px 34px rgba(0,0,0,.35);transform:rotate(-4deg);background:#fff}" +
    ".poslabel{display:flex;align-items:center;gap:14px;font-family:'Great Vibes',cursive;font-size:clamp(26px,3.4vw,36px);" +
    "color:" + BLUE_S + ";justify-content:flex-end;margin:6px 4px 22px 0;line-height:1.3}" +
    ".poslabel .pline{flex:0 0 36px;height:1.5px;background:#6b6154}" +
    ".cname{font-family:'Great Vibes',cursive;font-size:clamp(34px,4.5vw,46px);color:" + ORANGE_S + ";margin-bottom:14px;line-height:1.15}" +
    ".ctext{font-size:19px}" +
    ".stepactions{text-align:right;margin-top:26px}" +
    ".endrow{display:flex;gap:18px;justify-content:flex-end;flex-wrap:wrap;margin-top:26px}" +
    ".startover{font-size:18px;font-weight:600;color:" + WINE + ";background:none;border:2px solid " + WINE + ";" +
    "border-radius:4px;padding:13px 32px;cursor:pointer;font-family:" + FONT + ";transition:background .15s ease,color .15s ease}" +
    ".startover:hover{background:" + WINE + ";color:#f6efdb}" +
    "@media(max-width:760px){" +
    ".fanbox{height:340px}" +
    ".card{width:92px;height:152px;margin-left:-46px;margin-top:-76px}" +
    ".stepbox{padding:190px 22px 30px;margin-top:40px}" +
    ".cardimg{left:50%;top:-60px;transform:translateX(-50%) rotate(-3deg);width:170px}" +
    ".poslabel{justify-content:center;margin:0 0 14px}" +
    ".stepactions,.endrow{text-align:center;justify-content:center}" +
    ".corner{display:none}" +
    ".wrap{padding:40px 14px 50px}}";

  var LEAF_L = "<svg width='58' height='34' viewBox='0 0 58 34' fill='none' xmlns='http://www.w3.org/2000/svg'>" +
    "<path d='M56 28 C 40 30, 22 26, 8 12 C 16 12, 22 14, 27 18 M56 28 C 44 22, 36 14, 33 4 C 37 8, 41 14, 43 20 M56 28 C 48 27, 38 22, 33 15' stroke='currentColor' stroke-width='1.6' fill='none' stroke-linecap='round'/></svg>";
  var SWIRL = "<svg width='40' height='22' viewBox='0 0 40 22' fill='none' xmlns='http://www.w3.org/2000/svg'>" +
    "<path d='M2 16 C 10 4, 20 4, 24 10 C 27 15, 22 19, 18 16 C 15 13, 18 8, 24 8 C 30 8, 34 12, 38 10' stroke='currentColor' stroke-width='1.5' fill='none' stroke-linecap='round'/></svg>";

  // ---------- Markup ----------

  function buildHtml() {
    return "<div class='wrap'>" +
      "<div class='corner tl'></div><div class='corner br'></div>" +
      "<div class='inner'>" +

      "<div class='screen s-intro active'>" +
      "<div class='pretitle'>" + SWIRL + "<span>Your Personal Online</span><span style='transform:scaleX(-1);display:inline-flex'>" + SWIRL + "</span></div>" +
      "<h2 class='title'>Tarot Reading</h2>" +
      "<p class='intro'>Tarot cards carry a wealth of information and insight with them. The cards you select in this online reading can give you a deeper understanding of your current situation and provide guidance for your next steps. The 22 Major Arcana cards used in this tarot reading symbolize the universal steps to enlightenment.</p>" +
      "<p class='intro'>Look at the card presented for each part of your personal online reading before you read the accompanying text. Trust your gut reaction to the symbolism there, and pay the most attention to those elements that stand out to you. There is no single finite interpretation for each card, so use the information provided to guide your understanding as it pertains to your own life and current situation.</p>" +
      "<div class='actions'><button class='btn proceed' type='button'>Proceed <span class='tri'></span></button></div>" +
      "</div>" +

      "<div class='screen s-select'>" +
      "<h2 class='title'>" + SWIRL + "Select Your Cards<span style='transform:scaleX(-1);display:inline-flex'>" + SWIRL + "</span></h2>" +
      "<p class='intro'>Calm and center yourself before you select your six cards. You may wish to meditate, pray, ask for spiritual guidance, or follow another ritual before beginning.</p>" +
      "<p class='intro'>If you have an important question that you want to address with your reading, hold it in your mind as you select your cards.</p>" +
      "<div class='fanbox'></div>" +
      "<div class='counter'>0/6</div>" +
      "<button class='shuffle' type='button'>Shuffle the Cards</button>" +
      "<div class='actions'><button class='btn getreading off' type='button'>Get Your Reading <span class='tri'></span></button></div>" +
      "</div>" +

      "<div class='screen s-reading'>" +
      "<div class='rhead'>" + LEAF_L + "<span>Your Reading</span><span style='transform:scaleX(-1);display:inline-flex'>" + LEAF_L + "</span></div>" +
      "<div class='stepbox'>" +
      "<img class='cardimg' alt=''>" +
      "<div class='poslabel'><span class='ptext'></span><span class='pline'></span></div>" +
      "<div class='cname'></div>" +
      "<div class='ctext'></div>" +
      "<div class='stepactions'><button class='btn next' type='button'>Next Card <span class='tri'></span></button></div>" +
      "<div class='endrow' style='display:none'><span class='cta-slot'></span><button class='startover' type='button'>Start Over</button></div>" +
      "</div>" +
      "</div>" +

      "</div></div>";
  }

  // ---------- Behavior ----------

  function init(host) {
    if (host.__psTarot) return;
    host.__psTarot = true;

    if (!document.querySelector("link[data-ps-rsc-font]")) {
      var link = document.createElement("link");
      link.rel = "stylesheet";
      link.href = "https://fonts.googleapis.com/css2?family=Great+Vibes&display=swap";
      link.setAttribute("data-ps-rsc-font", "1");
      document.head.appendChild(link);
    }

    var root = host.attachShadow ? host.attachShadow({ mode: "open" }) : host;
    var style = document.createElement("style");
    style.textContent = CSS;
    var mount = document.createElement("div");
    mount.innerHTML = buildHtml();
    root.appendChild(style);
    root.appendChild(mount);

    var $ = function (sel) { return mount.querySelector(sel); };

    function show(screen) {
      mount.querySelectorAll(".screen").forEach(function (el) { el.classList.remove("active"); });
      $(".s-" + screen).classList.add("active");
      $(".wrap").scrollIntoView({ behavior: "smooth", block: "start" });
    }

    // -- deck state
    var deck = [];      // card index for each fan slot
    var picked = [];    // card indices in pick order
    var step = 0;

    function shuffleDeck() {
      deck = [];
      for (var i = 0; i < CARDS.length; i++) deck.push(i);
      for (var j = deck.length - 1; j > 0; j--) {
        var k = Math.floor(Math.random() * (j + 1));
        var tmp = deck[j]; deck[j] = deck[k]; deck[k] = tmp;
      }
    }

    function layoutFan() {
      var box = $(".fanbox");
      box.innerHTML = "";
      var n = CARDS.length;
      for (var i = 0; i < n; i++) {
        var el = document.createElement("div");
        el.className = "card";
        el.setAttribute("data-slot", i);
        var t = n === 1 ? 0.5 : i / (n - 1);
        // arc: edges low, center high, slight tilt following the curve
        var rot = -32 + 64 * t;
        el.style.left = (7 + 86 * t) + "%";
        el.style.top = (66 - 26 * Math.sin(Math.PI * t)) + "%";
        el.style.transform = "rotate(" + rot + "deg)";
        el.setAttribute("data-rot", rot);
        el.style.zIndex = i + 1;
        box.appendChild(el);
        el.addEventListener("click", onPick);
      }
    }

    function onPick(e) {
      var el = e.currentTarget;
      var rot = el.getAttribute("data-rot");
      if (el.classList.contains("picked")) {
        // unselect: settle back into the fan
        el.classList.remove("picked");
        el.style.transform = "rotate(" + rot + "deg)";
        el.style.zIndex = el.getAttribute("data-z") || 1;
        picked = picked.filter(function (c) { return c !== deck[+el.getAttribute("data-slot")]; });
        $(".counter").textContent = picked.length + "/6";
        $(".getreading").classList.add("off");
        return;
      }
      if (picked.length >= 6) return;
      el.classList.add("picked");
      el.setAttribute("data-z", el.style.zIndex);
      el.style.opacity = "";
      // lift straight up in screen space, then keep the fan rotation
      el.style.transform = "translateY(-52px) rotate(" + rot + "deg)";
      el.style.zIndex = 40;
      picked.push(deck[+el.getAttribute("data-slot")]);
      $(".counter").textContent = picked.length + "/6";
      if (picked.length === 6) {
        $(".getreading").classList.remove("off");
      }
    }

    function renderStep() {
      var cardIdx = picked[step];
      var card = CARDS[cardIdx];
      $(".ptext").textContent = POSITIONS[step];
      $(".cname").textContent = card.n;
      $(".ctext").textContent = card.t;
      var img = $(".cardimg");
      img.src = ORIGIN + "/embed/img/tarot/" + String(cardIdx).padStart(2, "0") + ".jpg";
      img.alt = card.n + " tarot card";
      img.style.transform = "rotate(" + (step % 2 === 0 ? -4 : 3) + "deg)";
      var last = step === 5;
      $(".next").style.display = last ? "none" : "";
      $(".endrow").style.display = last ? "flex" : "none";
      if (last && CTA_URL && !$(".cta-slot a")) {
        var a = document.createElement("a");
        a.className = "btn";
        a.href = CTA_URL;
        a.style.textDecoration = "none";
        a.innerHTML = CTA_TEXT + " <span class='tri'></span>";
        $(".cta-slot").appendChild(a);
      }
    }

    function resetSelect() {
      picked = [];
      step = 0;
      shuffleDeck();
      layoutFan();
      $(".counter").textContent = "0/6";
      $(".getreading").classList.add("off");
    }

    $(".proceed").addEventListener("click", function () {
      resetSelect();
      show("select");
    });

    $(".shuffle").addEventListener("click", function () {
      // Re-shuffle the cards remaining in the fan (picks are kept).
      var remainingSlots = [];
      mount.querySelectorAll(".card:not(.picked)").forEach(function (el) {
        remainingSlots.push(+el.getAttribute("data-slot"));
      });
      var values = remainingSlots.map(function (s) { return deck[s]; });
      for (var j = values.length - 1; j > 0; j--) {
        var k = Math.floor(Math.random() * (j + 1));
        var tmp = values[j]; values[j] = values[k]; values[k] = tmp;
      }
      remainingSlots.forEach(function (s, i) { deck[s] = values[i]; });
      // brief visual flutter
      mount.querySelectorAll(".card:not(.picked)").forEach(function (el) {
        el.style.transition = "none";
        el.style.opacity = "0";
        setTimeout(function () {
          el.style.transition = "";
          el.style.opacity = "";
        }, 120 + Math.random() * 260);
      });
    });

    $(".getreading").addEventListener("click", function () {
      if (picked.length !== 6) return;
      step = 0;
      renderStep();
      show("reading");
    });

    $(".next").addEventListener("click", function () {
      if (step < 5) {
        step++;
        renderStep();
        $(".wrap").scrollIntoView({ behavior: "smooth", block: "start" });
      }
    });

    $(".startover").addEventListener("click", function () {
      resetSelect();
      show("intro");
    });
  }

  function boot() {
    var host = document.getElementById("ps-tarot-reading") || document.querySelector("[data-ps-widget='tarot-reading']");
    if (host) init(host);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})();
