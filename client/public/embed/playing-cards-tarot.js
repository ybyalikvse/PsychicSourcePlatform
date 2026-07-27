/* Playing Cards Tarot (cartomancy) embed.
 * Usage on any site:
 *   <div id="ps-playing-cards-tarot"></div>
 *   <script async src="https://psychic-source-platform.vercel.app/embed/playing-cards-tarot.js"></script>
 * Renders directly into the page (Shadow DOM), no iframe.
 * Card faces and backs are drawn in SVG; no image assets besides the background.
 */
(function () {
  "use strict";

  var SCRIPT_SRC = (document.currentScript && document.currentScript.src) || "";
  var ORIGIN = SCRIPT_SRC ? new URL(SCRIPT_SRC).origin : "https://psychic-source-platform.vercel.app";

  var SUITS = ["Hearts", "Diamonds", "Clubs", "Spades"];
  var SUIT_CHAR = { Hearts: "♥", Diamonds: "♦", Clubs: "♣", Spades: "♠" };
  var RANK_NAME = ["", "Ace", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine", "Ten", "Jack", "Queen", "King"];
  var RANK_SHORT = ["", "A", "2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K"];

  var CATEGORIES = [
    { key: "ppf", label: "Past / Present / Future", positions: ["Past", "Present", "Future"] },
    { key: "love", label: "Love", positions: ["You", "Lover", "Dynamic"] },
    { key: "career", label: "Career", positions: ["Goals", "Tools", "Path"] },
  ];

  // Core cartomancy meaning per card, written as a neutral sentence about
  // the situation so every position frame can carry it.
  var MEANINGS = {
    Hearts: {
      1: "A new emotional beginning is opening: fresh affection, a renewed home, or a heart ready to feel again.",
      2: "Two hearts are finding their balance, and mutual understanding is closer than it has felt in a while.",
      3: "Celebration and warm company surround this moment, though scattered emotional energy needs gathering.",
      4: "Emotional foundations are settling; comfort is real here, but so is the temptation to coast on it.",
      5: "Feelings are shifting, and an emotional habit or attachment is loosening to make room for something truer.",
      6: "Old memories and familiar bonds are surfacing, offering healing through honesty about the past.",
      7: "Choices about the heart are multiplying, and wishful thinking must be separated from what is actually nourishing.",
      8: "Deeper emotional commitment is on the table, and it asks for presence rather than grand statements.",
      9: "This is the wish card: a heartfelt hope is within reach, closer than caution wants to admit.",
      10: "Emotional fulfillment and family happiness crown this card; something built with love is coming to completion.",
      11: "A message of affection or a playful, young-at-heart presence brings lightness and honest feeling.",
      12: "A deeply caring, intuitive presence offers support; leading with empathy will open what force cannot.",
      13: "A warm-hearted, emotionally steady figure brings wise counsel; maturity of feeling settles the moment.",
    },
    Diamonds: {
      1: "A tangible new opportunity is arriving: money, a message, or an opening with real-world weight.",
      2: "Resources and priorities are being juggled, and balance between two practical demands must be struck.",
      3: "Effort is beginning to pay; steady work and cooperation are building something of visible value.",
      4: "Material stability is holding firm, though guarding it too tightly can keep better things out.",
      5: "Change is arriving in practical, material matters: money, resources, and the shape of daily life.",
      6: "Generosity flows here: giving and receiving are coming back into fair proportion.",
      7: "Patience with an investment of time or money is being tested; the harvest needs more season.",
      8: "Skill and diligence are compounding; craftsmanship and repetition are quietly building mastery.",
      9: "Independence and earned comfort are within reach; enjoy what effort has built without apology.",
      10: "Lasting material security and legacy are indicated; something durable is being completed.",
      11: "Practical news or an ambitious young energy arrives, carrying useful information about money or work.",
      12: "A resourceful, practical presence offers grounded help; abundance is managed wisely in this company.",
      13: "An accomplished, business-minded figure holds influence here; decisive stewardship shapes the outcome.",
    },
    Clubs: {
      1: "A spark of ambition or a bold idea is igniting, and momentum favors acting on it soon.",
      2: "A plan is waiting on a decision between two directions; the world will not choose on its own.",
      3: "Collaboration and shared effort are expanding what is possible; teamwork multiplies this moment.",
      4: "A milestone deserves acknowledgment; stability has been earned through effort and it is safe to pause.",
      5: "Friction and competing agendas are stirring; the contest is really about direction, not victory.",
      6: "Recognition for effort is arriving, and confidence gained here should be reinvested, not spent on applause.",
      7: "A position must be defended; persistence against pushback is the difference between progress and retreat.",
      8: "Events are accelerating; messages, movement, and quick developments demand nimble follow-through.",
      9: "Resilience is being tested near the finish; reserves remain even when they feel spent.",
      10: "A heavy load nears its destination; completion is close, and so is the need to set burdens down.",
      11: "An energetic message or an eager, restless presence stirs action; enthusiasm needs a plan.",
      12: "A capable, encouraging presence backs this endeavor; warm confidence steadies the work.",
      13: "A seasoned leader's energy presides; vision paired with follow-through commands the room.",
    },
    Spades: {
      1: "A hard clarity is cutting through; a decisive truth ends confusion, even if it stings.",
      2: "A stalemate holds because something is being avoided; the standoff breaks when someone speaks first.",
      3: "Communication is strained and truths are going unspoken, with trust taking the damage.",
      4: "Rest and recovery are required; pushing through exhaustion will cost more than pausing.",
      5: "A conflict has left bruises on every side; winning the argument is worth less than repairing the field.",
      6: "A difficult chapter is being left behind; the waters ahead are calmer than the ones just crossed.",
      7: "Something is incomplete or quietly withheld; look closer before trusting appearances.",
      8: "A feeling of being boxed in prevails, yet most of the restraints are assumptions, not walls.",
      9: "Worry and sleepless-night anxiety loom large here, painting shadows bigger than their sources.",
      10: "An ending has arrived or must be accepted; closure now clears ground for genuine renewal.",
      11: "Guardedness or mixed messages complicate matters; watch actions more closely than words.",
      12: "A perceptive, sharp-eyed presence sees through pretense; candor is both the risk and the remedy.",
      13: "A stern, analytical authority weighs the situation; logic will decide what sentiment cannot.",
    },
  };

  // Position frames: opening subject sentence + closing advice sentence.
  var FRAMES = {
    ppf: [
      { open: "This card sits in your past.", close: "Its influence shaped where you stand today, but its chapter is closing; take the lesson and leave the weight." },
      { open: "This card describes your present.", close: "Meet it consciously, because it is the ground you are standing on right now." },
      { open: "This card points to what is approaching.", close: "Knowing it is coming is your advantage; prepare with intention rather than bracing with fear." },
    ],
    love: [
      { open: "This card speaks to where you stand in the relationship.", close: "Bring your side into the open; honesty from you is what moves things forward." },
      { open: "This card describes your partner right now.", close: "Offer patience and gentle questions rather than assumptions; they will meet you sooner than you think." },
      { open: "This card reflects the relationship itself.", close: "Name it together, and it becomes something you manage as a team instead of something that manages you." },
    ],
    career: [
      { open: "This card speaks to your goals.", close: "Let it sharpen what you are actually working toward, not what you feel obligated to chase." },
      { open: "This card shows the tools you need to gather.", close: "Collect what it points to before your next move, and the move itself gets easier." },
      { open: "This card shows your path forward.", close: "Walk it deliberately; steady steps on the right road outpace sprints on the wrong one." },
    ],
  };

  // Verbatim texts for the combinations shown in the reference design.
  var OVERRIDES = {
    "love|1|Spades|3": "You're struggling to communicate with your partner right now. It's possible that infidelity is involved, but you'll need to find a way to speak openly with one another to get to the truth of the matter.",
    "love|2|Spades|9": "Your partner is going through a period of depression or anxiety right now. Provide what support you can and encourage them to find someone to talk to if they need additional help.",
    "love|3|Diamonds|5": "Your relationship is growing past the emotion-driven early stages and into more real-world concerns, like finances, home, and even growing a family.",
  };

  function readingFor(catKey, posIdx, suit, rank) {
    var key = catKey + "|" + (posIdx + 1) + "|" + suit + "|" + rank;
    if (OVERRIDES[key]) return OVERRIDES[key];
    var frame = FRAMES[catKey][posIdx];
    return frame.open + " " + MEANINGS[suit][rank] + " " + frame.close;
  }

  // ---------- Card SVGs ----------

  var RED = "#c0392b";
  var BLACK = "#1d1d1f";

  // pip grid positions per rank (x in [0,1,2] columns, y in 0..6 rows)
  var PIP_LAYOUTS = {
    2: [[1, 0], [1, 6]],
    3: [[1, 0], [1, 3], [1, 6]],
    4: [[0, 0], [2, 0], [0, 6], [2, 6]],
    5: [[0, 0], [2, 0], [1, 3], [0, 6], [2, 6]],
    6: [[0, 0], [2, 0], [0, 3], [2, 3], [0, 6], [2, 6]],
    7: [[0, 0], [2, 0], [1, 1.5], [0, 3], [2, 3], [0, 6], [2, 6]],
    8: [[0, 0], [2, 0], [1, 1.5], [0, 3], [2, 3], [1, 4.5], [0, 6], [2, 6]],
    9: [[0, 0], [2, 0], [0, 2], [2, 2], [1, 3], [0, 4], [2, 4], [0, 6], [2, 6]],
    10: [[0, 0], [2, 0], [1, 1], [0, 2], [2, 2], [0, 4], [2, 4], [1, 5], [0, 6], [2, 6]],
  };

  function pipXY(col, row) {
    // pip field spans y 80..260, centered on the 340-tall card
    return [60 + col * 60, 80 + row * 30];
  }

  // Identical rank + suit index in both corners; bottom-right is the same
  // group rotated 180 degrees, exactly like a physical card.
  function cornerIndex(color, rank, ch) {
    return "<text x='0' y='0' font-size='34' font-family='Georgia,serif' font-weight='700' fill='" + color + "' text-anchor='middle'>" + RANK_SHORT[rank] + "</text>" +
      "<text x='0' y='28' font-size='26' fill='" + color + "' text-anchor='middle'>" + ch + "</text>";
  }

  function faceSvg(suit, rank) {
    var color = (suit === "Hearts" || suit === "Diamonds") ? RED : BLACK;
    var ch = SUIT_CHAR[suit];
    var s = "<svg viewBox='0 0 240 340' xmlns='http://www.w3.org/2000/svg'>" +
      "<rect width='240' height='340' rx='16' fill='#fff'/>" +
      "<g transform='translate(26,40)'>" + cornerIndex(color, rank, ch) + "</g>" +
      "<g transform='translate(214,300) rotate(180)'>" + cornerIndex(color, rank, ch) + "</g>";
    if (rank === 1) {
      s += "<text x='120' y='202' font-size='96' fill='" + color + "' text-anchor='middle'>" + ch + "</text>";
    } else if (rank >= 11) {
      s += "<rect x='62' y='85' width='116' height='170' rx='8' fill='none' stroke='" + color + "' stroke-width='2'/>" +
        "<text x='120' y='182' font-size='78' font-family='Georgia,serif' font-weight='700' fill='" + color + "' text-anchor='middle'>" + RANK_SHORT[rank] + "</text>" +
        "<text x='120' y='238' font-size='42' fill='" + color + "' text-anchor='middle'>" + ch + "</text>";
    } else {
      var pips = PIP_LAYOUTS[rank];
      for (var i = 0; i < pips.length; i++) {
        var xy = pipXY(pips[i][0], pips[i][1]);
        var flip = pips[i][1] > 3 ? " transform='rotate(180 " + xy[0] + " " + (xy[1] - 14) + ")'" : "";
        s += "<text x='" + xy[0] + "' y='" + xy[1] + "' font-size='44' fill='" + color + "' text-anchor='middle'" + flip + ">" + ch + "</text>";
      }
    }
    return s + "</svg>";
  }

  var BACK_SVG = (function () {
    var s = "<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 240 340' preserveAspectRatio='none'>" +
      "<rect width='240' height='340' rx='16' fill='%23fff'/>" +
      "<rect x='5' y='5' width='230' height='330' rx='12' fill='%23c14e2e'/>" +
      "<rect x='18' y='18' width='204' height='304' rx='8' fill='none' stroke='%23fff' stroke-width='2' stroke-dasharray='1 5'/>" +
      "<rect x='28' y='28' width='184' height='284' rx='6' fill='none' stroke='%23fff' stroke-width='1.4'/>";
    // center medallion: four overlapping petal circles
    var cx = 120, cy = 170;
    for (var a = 0; a < 4; a++) {
      var ang = a * Math.PI / 2;
      s += "<circle cx='" + (cx + 16 * Math.cos(ang)).toFixed(1) + "' cy='" + (cy + 16 * Math.sin(ang)).toFixed(1) + "' r='22' fill='none' stroke='%23fff' stroke-width='1.6'/>";
    }
    s += "<circle cx='120' cy='170' r='34' fill='none' stroke='%23fff' stroke-width='1'/>" +
      "</svg>";
    return "url(\"data:image/svg+xml;charset=utf-8," + s.replace(/#/g, "%23") + "\")";
  })();

  // ---------- Styles ----------

  var FONT = "'Segoe UI','Helvetica Neue',Helvetica,Arial,sans-serif";
  var GOLD = "#d9b36a";
  var TAN = "#e8be87";
  var DUSTY = "#b8544f";
  var PLUM = "#4a2530";

  var CSS = "" +
    ":host{all:initial;display:block}" +
    "*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}" +
    ".wrap{position:relative;font-family:" + FONT + ";color:#f3e6d5;" +
    "background:" + PLUM + " url('" + ORIGIN + "/embed/img/tarot/carto-bg.jpg') center/cover no-repeat;" +
    "padding:50px 30px 60px;overflow:hidden;line-height:1.65}" +
    ".corner{position:absolute;width:120px;height:280px;pointer-events:none;color:" + GOLD + ";opacity:.8}" +
    ".corner.tl{top:12px;left:12px}.corner.tr{top:12px;right:12px;transform:scaleX(-1)}" +
    ".corner.bl{bottom:12px;left:12px;transform:scaleY(-1)}.corner.br{bottom:12px;right:12px;transform:scale(-1,-1)}" +
    ".inner{position:relative;max-width:1060px;margin:0 auto}" +
    ".gtitle{font-family:Georgia,'Times New Roman',serif;font-size:clamp(34px,5vw,52px);color:" + TAN + ";" +
    "text-align:center;margin-bottom:16px;font-weight:700}" +
    ".gscript{font-family:'Great Vibes',cursive;font-weight:400;font-size:clamp(44px,6vw,64px);color:" + TAN + ";" +
    "text-align:center;margin-bottom:8px;line-height:1.1}" +
    ".divider{display:flex;align-items:center;justify-content:center;gap:0;color:" + GOLD + ";margin:0 auto 34px;max-width:340px}" +
    ".divider .dline{flex:1;height:1.5px;background:" + GOLD + "}" +
    ".intro{font-size:19px;text-align:center;margin:0 auto 34px;max-width:940px}" +
    ".screen{display:none}" +
    ".screen.active{display:block;animation:fadein .5s ease}" +
    "@keyframes fadein{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:none}}" +
    ".cols{display:flex;gap:0;margin-top:20px}" +
    ".col{flex:1;padding:0 30px;text-align:center}" +
    ".col + .col{border-left:1px solid rgba(243,230,213,.65)}" +
    ".col svg{color:#f3e6d5;margin-bottom:18px}" +
    ".chead{font-size:23px;font-weight:700;color:" + TAN + ";margin-bottom:12px}" +
    ".ctext{font-size:17.5px}" +
    ".beginrow{display:flex;align-items:center;justify-content:center;gap:14px;margin-top:44px}" +
    ".begin{font-size:22px;font-weight:600;color:#fff;background:none;border:none;cursor:pointer;font-family:" + FONT + ";display:inline-flex;align-items:center;gap:20px}" +
    ".begin:hover{color:" + TAN + "}" +
    ".begin .barrow{display:block;flex:0 0 auto}" +
    ".seltitle{font-size:24px;font-weight:700;text-align:center;margin-bottom:26px}" +
    ".cats{display:flex;justify-content:center;gap:24px;flex-wrap:wrap;margin-bottom:40px}" +
    ".cat{font-family:Georgia,serif;font-size:19px;color:#f7ecdc;background:" + DUSTY + ";border:none;border-radius:3px;" +
    "padding:12px 30px;cursor:pointer;transition:background .15s ease,color .15s ease}" +
    ".cat.active{background:" + TAN + ";color:#4a2c20}" +
    ".rowwrap{background:#fff;border-radius:14px;padding:8px;box-shadow:0 10px 30px rgba(0,0,0,.4);margin-top:150px}" +
    ".row{display:flex;height:300px}" +
    ".pcard{flex:1 1 18px;min-width:8px;position:relative}" +
    ".pcard .cface{position:absolute;left:0;top:0;width:190px;height:100%;border-radius:9px;" +
    "background-color:#fff;background-image:" + BACK_SVG + ";background-size:100% 100%;" +
    "box-shadow:-6px 0 10px rgba(0,0,0,.18);cursor:pointer;" +
    "transition:transform .38s cubic-bezier(.22,.85,.3,1)}" +
    ".pcard:hover .cface{transform:translateY(-10px)}" +
    ".pcard.picked .cface,.pcard.picked:hover .cface{transform:translateY(-46%);box-shadow:-4px 10px 18px rgba(0,0,0,.35)}" +
    ".pcard:last-child{flex:0 0 190px}" +
    ".actions{text-align:center;margin-top:40px}" +
    ".pill{display:inline-block;font-family:Georgia,serif;font-size:19px;font-weight:600;color:#4a2c20;background:" + TAN + ";" +
    "border:none;border-radius:999px;padding:14px 40px;cursor:pointer;box-shadow:0 4px 14px rgba(0,0,0,.35);transition:filter .15s ease}" +
    ".pill:hover{filter:brightness(1.06)}" +
    // question modal
    ".overlay{position:absolute;inset:0;display:none;align-items:center;justify-content:center;z-index:70;background:rgba(30,16,20,.45)}" +
    ".overlay.open{display:flex}" +
    ".qmodal{background:rgba(184,84,79,.96);border-radius:6px;max-width:920px;width:92%;padding:60px 40px;text-align:center;box-shadow:0 24px 70px rgba(0,0,0,.5);animation:fadein .3s ease}" +
    ".qmodal .qlabel{font-size:21px;font-weight:600;color:#fff;margin-bottom:26px}" +
    ".qmodal input{width:min(560px,90%);padding:15px 18px;font-size:19px;font-family:" + FONT + ";color:#fff;" +
    "background:rgba(90,30,30,.55);border:1.5px solid rgba(255,255,255,.7);border-radius:6px;outline:none}" +
    ".qmodal input:focus{border-color:#fff}" +
    ".qmodal .qsubmit{display:block;margin:30px auto 0;font-family:Georgia,serif;font-size:20px;color:#5a2c28;" +
    "background:#efe0d3;border:none;border-radius:999px;padding:13px 46px;cursor:pointer}" +
    ".qmodal .qsubmit:hover{filter:brightness(1.05)}" +
    // result
    ".panels{display:flex;gap:26px;justify-content:center;flex-wrap:wrap}" +
    ".panel{flex:1 1 260px;max-width:330px;background:" + TAN + ";border-radius:16px;padding:30px 24px;color:#3f2a1c;position:relative}" +
    ".panel .pframe{position:absolute;inset:10px;border:1px solid rgba(90,50,30,.5);border-radius:8px;pointer-events:none}" +
    ".panel .cardname{font-size:21px;font-weight:700;color:#7c2b33;text-align:center;margin-bottom:18px}" +
    ".panel .cardart{width:170px;margin:0 auto 20px;display:block;filter:drop-shadow(0 6px 14px rgba(0,0,0,.3))}" +
    ".panel .pos{font-family:Georgia,serif;font-size:26px;color:" + DUSTY + ";text-align:center;margin-bottom:10px;font-weight:700}" +
    ".panel .ptext{font-size:17px;text-align:center}" +
    ".closing{font-size:19px;text-align:center;max-width:1000px;margin:44px auto 0}" +
    "@media(max-width:820px){" +
    ".cols{flex-direction:column;gap:30px}" +
    ".col + .col{border-left:0;border-top:1px solid rgba(243,230,213,.5);padding-top:26px}" +
    ".row{height:210px}" +
    ".pcard:last-child{flex:0 0 130px}" +
    ".pcard .cface{width:130px}" +
    ".corner{display:none}" +
    ".wrap{padding:38px 16px 48px}}";

  var CORNER_SVG = "<svg viewBox='0 0 120 280' fill='none' xmlns='http://www.w3.org/2000/svg'>" +
    "<path d='M10 262 L10 30 C 10 14, 26 10, 30 18 C 33 25, 25 29, 21 24' stroke='currentColor' stroke-width='1.6' stroke-linecap='round'/>" +
    "<path d='M10 262 C 10 250, 22 247, 25 254 C 27 260, 20 263, 17 259' stroke='currentColor' stroke-width='1.6' stroke-linecap='round'/>" +
    "<path d='M58 138 L62 148 L58 158 L54 148 Z' fill='currentColor'/>" +
    "<path d='M46 148 L58 145 L70 148 L58 151 Z' fill='currentColor'/></svg>";

  var SCROLL_DIV = "<svg width='120' height='20' viewBox='0 0 120 20' fill='none' xmlns='http://www.w3.org/2000/svg'>" +
    "<path d='M4 10 C 12 2, 20 2, 24 10 C 28 18, 36 18, 40 10 C 44 2, 52 2, 56 10 C 60 18, 68 18, 72 10 C 76 2, 84 2, 88 10 C 92 18, 100 18, 108 10' stroke='currentColor' stroke-width='1.5' stroke-linecap='round'/>" +
    "<circle cx='60' cy='10' r='3.4' fill='currentColor'/></svg>";

  var ICON_BALL = "<svg width='96' height='96' viewBox='0 0 96 96' fill='none' xmlns='http://www.w3.org/2000/svg'>" +
    "<circle cx='48' cy='44' r='26' stroke='currentColor' stroke-width='2.4'/>" +
    "<path d='M34 78 L62 78 C 66 78, 68 74, 66 71 L60 64 L36 64 L30 71 C 28 74, 30 78, 34 78 Z' stroke='currentColor' stroke-width='2.4' stroke-linejoin='round'/>" +
    "<path d='M38 34 C 41 29, 47 26, 52 28' stroke='currentColor' stroke-width='2.2' stroke-linecap='round'/>" +
    "<path d='M74 22 L78 26 M80 14 L81 20 M70 12 L74 16' stroke='currentColor' stroke-width='2' stroke-linecap='round'/></svg>";
  var ICON_HANDS = "<svg width='96' height='96' viewBox='0 0 96 96' fill='none' xmlns='http://www.w3.org/2000/svg'>" +
    "<path d='M48 46 C 44 40, 36 40, 34 46 C 32 51, 36 55, 48 62 C 60 55, 64 51, 62 46 C 60 40, 52 40, 48 46 Z' stroke='currentColor' stroke-width='2.4' stroke-linejoin='round'/>" +
    "<path d='M30 52 L18 64 L26 84 L40 74 M66 52 L78 64 L70 84 L56 74' stroke='currentColor' stroke-width='2.4' stroke-linejoin='round'/>" +
    "<path d='M40 22 L42 30 M48 18 L48 27 M56 22 L54 30' stroke='currentColor' stroke-width='2.2' stroke-linecap='round'/></svg>";
  var ICON_CASE = "<svg width='96' height='96' viewBox='0 0 96 96' fill='none' xmlns='http://www.w3.org/2000/svg'>" +
    "<rect x='16' y='34' width='64' height='42' rx='8' stroke='currentColor' stroke-width='2.6'/>" +
    "<path d='M36 34 L36 26 C 36 22, 39 20, 42 20 L54 20 C 57 20, 60 22, 60 26 L60 34' stroke='currentColor' stroke-width='2.6'/>" +
    "<rect x='42' y='48' width='12' height='9' rx='2' stroke='currentColor' stroke-width='2.2'/></svg>";

  // ---------- Markup ----------

  function buildHtml() {
    return "<div class='wrap'>" +
      "<span class='corner tl'>" + CORNER_SVG + "</span><span class='corner tr'>" + CORNER_SVG + "</span>" +
      "<span class='corner bl'>" + CORNER_SVG + "</span><span class='corner br'>" + CORNER_SVG + "</span>" +
      "<div class='inner'>" +

      "<div class='screen s-intro active'>" +
      "<h2 class='gtitle'>Try Your Hand at Playing Cards Tarot</h2>" +
      "<p class='intro'>The distinctive 72-card tarot deck is the most common tool for getting a tarot reading, but these aren't the only cards you can use. In fact, you can get some intriguing insights with nothing more than your standard 52-card deck of playing cards. Here, we've provided three options for a tarot reading with playing cards.</p>" +
      "<div class='divider'><div class='dline'></div>" + SCROLL_DIV + "<div class='dline'></div></div>" +
      "<div class='cols'>" +
      "<div class='col'>" + ICON_BALL + "<div class='chead'>Past/Present/Future</div><div class='ctext'>Need help orienting yourself? This free cartomancy reading will highlight essential points regarding your past, present, and future to help you understand where you are on your life path.</div></div>" +
      "<div class='col'>" + ICON_HANDS + "<div class='chead'>Love</div><div class='ctext'>Feeling confused about your relationship? This free cartomancy reading offers some insights into you, your lover, and the dynamic that's currently playing out between the two of you.</div></div>" +
      "<div class='col'>" + ICON_CASE + "<div class='chead'>Career</div><div class='ctext'>If your career is at the front of your mind, try this playing cards tarot spread! You'll get some interesting details about your goals, the tools you need to gather, and what your path forward looks like.</div></div>" +
      "</div>" +
      "<div class='beginrow'><button class='begin' type='button'><span>Begin</span>" +
      "<svg class='barrow' width='104' height='26' viewBox='0 0 104 26' fill='none' xmlns='http://www.w3.org/2000/svg'>" +
      "<path d='M2 13 L92 13' stroke='#b8544f' stroke-width='5' stroke-linecap='round'/>" +
      "<path d='M78 3 L98 13 L78 23' stroke='#b8544f' stroke-width='5' stroke-linecap='round' stroke-linejoin='round' fill='none'/></svg>" +
      "</button></div>" +
      "</div>" +

      "<div class='screen s-select'>" +
      "<div class='seltitle'>Select a category then select three cards</div>" +
      "<div class='cats'>" + CATEGORIES.map(function (c, i) {
        return "<button class='cat" + (i === 0 ? " active" : "") + "' data-cat='" + c.key + "' type='button'>" + c.label + "</button>";
      }).join("") + "</div>" +
      "<div class='rowwrap'><div class='row'></div></div>" +
      "<div class='actions'><button class='pill shuffle' type='button'>Shuffle Cards</button></div>" +
      "</div>" +

      "<div class='screen s-result'>" +
      "<div class='gscript'>Result</div>" +
      "<div class='divider'><div class='dline'></div>" + SCROLL_DIV + "<div class='dline'></div></div>" +
      "<div class='panels'></div>" +
      "<p class='closing'>This three-card reading only touches the surface of what a tarot reading with playing cards can tell you. For deeper insights into your situation, consider speaking with a psychic tarot reader. A skilled professional can help you understand the delicate interplay between your cards and give you a more detailed look at what they mean for your life.</p>" +
      "<div class='actions'><button class='pill again' type='button'>Start Over</button></div>" +
      "</div>" +

      "</div>" +
      "<div class='overlay'><div class='qmodal'>" +
      "<div class='qlabel'>Enter your question or subject here</div>" +
      "<input type='text' aria-label='Your question'>" +
      "<button class='qsubmit' type='button'>Submit</button>" +
      "</div></div>" +
      "</div>";
  }

  // ---------- Behavior ----------

  function init(host) {
    if (host.__psPlayingCards) return;
    host.__psPlayingCards = true;

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

    var deck = [];       // 52 card indices (0..51), suit = floor(i/13), rank = i%13+1
    var picked = [];
    var category = CATEGORIES[0];

    function shuffleDeck() {
      deck = [];
      for (var i = 0; i < 52; i++) deck.push(i);
      for (var j = deck.length - 1; j > 0; j--) {
        var k = Math.floor(Math.random() * (j + 1));
        var tmp = deck[j]; deck[j] = deck[k]; deck[k] = tmp;
      }
    }

    var locked = false;

    function layoutRow() {
      var row = $(".row");
      row.innerHTML = "";
      for (var i = 0; i < 52; i++) {
        var el = document.createElement("div");
        el.className = "pcard";
        el.setAttribute("data-slot", i);
        el.setAttribute("role", "button");
        el.setAttribute("aria-label", "Pick this card");
        el.innerHTML = "<div class='cface'></div>";
        row.appendChild(el);
        el.addEventListener("click", onPick);
      }
    }

    function onPick(e) {
      if (locked) return;
      var el = e.currentTarget;
      var cardIdx = deck[+el.getAttribute("data-slot")];
      if (el.classList.contains("picked")) {
        // unselect: slide the card back down into the deck
        el.classList.remove("picked");
        picked = picked.filter(function (c) { return c !== cardIdx; });
        return;
      }
      if (picked.length >= 3) return;
      el.classList.add("picked");
      picked.push(cardIdx);
      if (picked.length === 3) {
        locked = true;
        setTimeout(function () {
          locked = false;
          renderResult();
        }, 700);
      }
    }

    function renderResult() {
      var panels = $(".panels");
      panels.innerHTML = "";
      picked.forEach(function (cardIdx, pos) {
        var suit = SUITS[Math.floor(cardIdx / 13)];
        var rank = (cardIdx % 13) + 1;
        var div = document.createElement("div");
        div.className = "panel";
        div.innerHTML = "<span class='pframe'></span>" +
          "<div class='cardname'>" + RANK_NAME[rank] + " of " + suit + "</div>" +
          "<div class='cardart'>" + faceSvg(suit, rank) + "</div>" +
          "<div class='pos'>" + category.positions[pos] + "</div>" +
          "<div class='ptext'>" + readingFor(category.key, pos, suit, rank) + "</div>";
        panels.appendChild(div);
      });
      show("result");
    }

    $(".begin").addEventListener("click", function () {
      $(".overlay").classList.add("open");
      var inp = $(".qmodal input");
      setTimeout(function () { inp.focus(); }, 50);
    });

    function submitQuestion() {
      $(".overlay").classList.remove("open");
      picked = [];
      shuffleDeck();
      layoutRow();
      show("select");
    }
    $(".qsubmit").addEventListener("click", submitQuestion);
    $(".qmodal input").addEventListener("keydown", function (e) {
      if (e.key === "Enter") submitQuestion();
    });

    mount.querySelectorAll(".cat").forEach(function (btn) {
      btn.addEventListener("click", function () {
        mount.querySelectorAll(".cat").forEach(function (b) { b.classList.remove("active"); });
        btn.classList.add("active");
        category = CATEGORIES.filter(function (c) { return c.key === btn.getAttribute("data-cat"); })[0];
      });
    });

    $(".shuffle").addEventListener("click", function () {
      shuffleDeck();
      mount.querySelectorAll(".pcard.picked").forEach(function (el) { el.classList.remove("picked"); });
      picked = [];
      var row = $(".row");
      row.style.opacity = "0";
      setTimeout(function () { row.style.transition = "opacity .35s ease"; row.style.opacity = "1"; }, 140);
    });

    $(".again").addEventListener("click", function () {
      picked = [];
      $(".qmodal input").value = "";
      show("intro");
    });
  }

  function boot() {
    var host = document.getElementById("ps-playing-cards-tarot") || document.querySelector("[data-ps-widget='playing-cards-tarot']");
    if (host) init(host);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})();
