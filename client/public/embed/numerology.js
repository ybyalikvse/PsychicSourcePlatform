/* Your Personal Numerology Calculator embed.
 * Usage on any site:
 *   <div id="ps-numerology"></div>
 *   <script async src="https://psychic-source-platform.vercel.app/embed/numerology.js"></script>
 * Renders directly into the page (Shadow DOM), no iframe.
 * Pythagorean numerology computed entirely in the browser.
 */
(function () {
  "use strict";

  var SCRIPT_SRC = (document.currentScript && document.currentScript.src) || "";
  var ORIGIN = SCRIPT_SRC ? new URL(SCRIPT_SRC).origin : "https://psychic-source-platform.vercel.app";

  var CTA_URL = "https://www.psychicsource.com/psychic-advice/numerology-readings";

  var LIFE_PATH = {
    1: { text: "The number one life path belongs to born leaders. You're independent, driven, and happiest when you're blazing your own trail rather than following someone else's. Obstacles rarely stop you; they simply become part of the story you tell later. Watch a tendency toward stubbornness and going it alone when help is available.", s: "Independence, ambition, courage", w: "Stubbornness, impatience, pride", j: "Entrepreneur, executive, director" },
    2: { text: "The number two life path is the peacemaker's road. You're diplomatic, intuitive, and gifted at bringing people together, often resolving conflicts others would rather avoid. Partnership suits you better than solo ventures, and your sensitivity is a strength even when it feels like a burden. Guard against losing yourself in other people's needs.", s: "Diplomacy, empathy, cooperation", w: "Oversensitivity, indecision, dependency", j: "Mediator, counselor, diplomat" },
    3: { text: "The number three life path overflows with creativity and expression. You're witty, optimistic, and naturally magnetic; words, art, and performance come easily to you. People leave your company feeling lighter. Your challenge is focus: talent scattered across too many projects finishes none of them. Choose your stage and your gift multiplies.", s: "Creativity, charisma, optimism", w: "Scattered energy, procrastination, drama", j: "Writer, artist, entertainer" },
    4: { text: "The number four life path is the builder's path. You're practical, disciplined, and trustworthy, the person others count on when it matters. You create order out of chaos and value work done properly over shortcuts. Routine is your friend, but rigidity is your trap; leave a window open for the unexpected.", s: "Reliability, discipline, patience", w: "Rigidity, overwork, resistance to change", j: "Engineer, accountant, project manager" },
    5: { text: "The number five life path craves freedom and experience. You're adventurous, adaptable, and endlessly curious, collecting places, people, and stories the way others collect possessions. Change energizes you rather than frightens you. The lesson of the five is commitment: some of life's richest rewards only open up after you stay.", s: "Adaptability, curiosity, energy", w: "Restlessness, impulsiveness, excess", j: "Travel writer, salesperson, consultant" },
    6: { text: "The number six life path is very domestic. You're a natural caregiver and nurturer. Those with a number six life path have strong parental instincts and thrive in large families. You're compassionate and community oriented. You're happiest when you're surrounded by others. The number six also gives you a great deal of adaptability, which is ideal for evolving with your children through their ever-changing growth stages.", s: "Selflessness, sympathy, creativity", w: "Criticism of others, meddling, self-righteousness", j: "Teacher, counselor, nurse, doctor" },
    7: { text: "The number seven life path is the seeker's journey. You're analytical, introspective, and drawn to life's deeper questions, happiest with time and space to think. Others sense there's more to you than you reveal. Solitude restores you, but isolation starves you; share your discoveries and they become wisdom.", s: "Insight, analysis, spirituality", w: "Isolation, secrecy, overthinking", j: "Researcher, analyst, scientist" },
    8: { text: "The number eight life path carries natural authority and material ambition. You understand power, money, and organization instinctively, and you're built to achieve on a large scale. Setbacks tend to make you stronger. Your lesson is balance: success that costs your relationships or health is not the abundance you were born for.", s: "Ambition, leadership, resilience", w: "Workaholism, control, materialism", j: "Executive, banker, business owner" },
    9: { text: "The number nine life path is the humanitarian's road. You're compassionate, idealistic, and moved by causes larger than yourself, with wisdom that feels older than your years. Giving comes naturally; letting go does not. Your fulfillment arrives when you serve the world without abandoning your own needs in the process.", s: "Compassion, wisdom, generosity", w: "Martyrdom, moodiness, holding on", j: "Nonprofit leader, healer, artist" },
  };

  var DESTINY = {
    1: "You're a natural born leader who moves forward boldly to make things happen. You don't like dealing with the details, but you're an excellent initiator. Ambitious and fearless, your destiny in this life is to blaze trails and lead the way. Be wary of your tendency to dominate. Your biggest pitfall is your need to be in control.",
    2: "Your destiny is to be the bridge. You're meant to bring harmony where there is friction, partnership where there is division, and quiet counsel where there is noise. Your greatest work will rarely be done alone; you shine as the trusted partner, advisor, and peacemaker whose influence is felt more than seen.",
    3: "Your destiny is expression. You're here to communicate, create, and lift spirits, whether through words, art, humor, or sheer presence. The world needs your voice, and hiding it is the only real failure. Expect your path to reward creativity and punish any routine that silences you.",
    4: "Your destiny is to build things that last. Systems, businesses, homes, institutions: whatever you construct is meant to outlive the moment. You're the foundation others build their dreams upon. Your purpose asks for patience and craftsmanship, and repays it with legacy.",
    5: "Your destiny is change itself. You're meant to explore, push boundaries, and show others that life is bigger than their routines. Freedom isn't a luxury for you; it's your assignment. The lives you touch will be looser, braver, and more alive because you passed through.",
    6: "Your destiny is care. You're meant to nurture, teach, and take responsibility for the wellbeing of others, creating harmony wherever you settle. Family, community, and service are your arenas. Your purpose deepens when you learn to serve without controlling and give without depleting yourself.",
    7: "Your destiny is understanding. You're meant to go deeper than others: into knowledge, mysteries, and truths that surface thinkers miss. Your findings become guidance for people who cannot see what you see. Trust the pull toward study and contemplation; it is not escape, it is your work.",
    8: "Your destiny is stewardship of power. You're meant to achieve, organize, and manage resources on a scale most people find intimidating. Wealth and authority tend to find you when you act with integrity. Your purpose is proving that ambition and ethics can share the same desk.",
    9: "Your destiny is service to the whole. You're meant to give your gifts away: to causes, communities, and people who may never repay you directly. Completion is your theme, helping others finish chapters and heal. The more generously you live, the larger your life becomes.",
  };

  var PERSONALITY = {
    1: "People see you as confident, capable, and in charge, often before you've said a word. You project leadership even in casual settings, and others instinctively step aside or fall in line. The impression is strong; just remember to soften it when collaboration matters more than command.",
    2: "People perceive you as warm, gentle, and approachable, the safe person in the room. Strangers open up to you quickly and trust you with things they tell no one else. You may be underestimated at first glance, which often becomes your quiet advantage.",
    3: "People see you as bright, entertaining, and full of life. Your humor and style make first impressions effortless, and you're often remembered long after brief meetings. The risk is being taken for all sparkle; let people glimpse your depth early.",
    4: "People perceive you as solid, sensible, and dependable, the one who has things handled. You inspire trust in bosses, clients, and strangers alike. The first impression is of quiet competence rather than flash, and it opens doors that showmanship cannot.",
    5: "People see you as dynamic, magnetic, and a little unpredictable, in the best way. You radiate energy and adventure, and others feel more alive around you. First impressions of you are rarely neutral; you intrigue people and they want to know what happens next.",
    6: "People perceive you as warm, responsible, and trustworthy, someone safe to lean on. There's a nurturing quality in your presence that makes others feel cared for immediately. Strangers ask you for directions, advice, and help; something about you says home.",
    7: "People see you as thoughtful, private, and intriguing. You carry an air of mystery that makes others curious about what you're thinking, and your words carry extra weight because you spend them carefully. Some read your reserve as aloofness; the right people read it as depth.",
    8: "People perceive you as powerful, polished, and successful, often assuming you're in charge even when you're not. You command respect in rooms you've just entered. That strength attracts opportunity and, occasionally, challengers; wear it with warmth and it becomes charisma.",
    9: "People perceive your number nine personality as noble and aristocratic. You are elegant with a natural charisma that draws attention to your presence. You do best when you're communicating with others on a grand scale, which is why many performers have this personality type. One-on-one interactions are your weak point.",
  };

  var SOUL_URGE = {
    1: "A number one reflected in your soul urge indicates that you desire independence. You want to be in charge of great works and receive recognition for them. You're driven by a desire to succeed and achieve great success, particularly in business dealings.",
    2: "A number two soul urge reveals a deep longing for connection and peace. Beneath everything, you want closeness: a partner, a confidant, a life where harmony is the rule rather than the exception. Conflict drains you more than others realize. Your soul rests when the people you love are at ease with each other.",
    3: "A number three soul urge means your heart wants to create and be heard. Deep down you long to express what's inside you: to write it, sing it, say it, make it. Joy is not optional for you; it's oxygen. You feel most yourself when something you made touches someone else.",
    4: "A number four soul urge reveals a deep desire for order and security. Beneath the surface, you crave a life that stands on solid ground: stable home, honest work, promises kept. Chaos unsettles you more than you admit. Your soul is satisfied by steady progress you can see and touch.",
    5: "A number five soul urge means freedom is your deepest hunger. Beneath your commitments lives a wanderer who needs new places, new people, and room to breathe. Restriction feels like suffocation to you. Your soul is fed by variety, movement, and the sense that tomorrow could surprise you.",
    6: "A number six soul urge reveals a heart that longs to love and be needed. Deep down, you want a home full of people to care for and the warmth of belonging. Appreciation matters more to you than applause. Your soul is fullest when someone you love is thriving because of you.",
    7: "A number seven soul urge means your deepest desire is understanding. Beneath daily life, you crave quiet, truth, and the space to explore what lies beneath appearances. Small talk starves you; meaning feeds you. Your soul rests in solitude, study, and moments of genuine insight.",
    8: "A number eight soul urge reveals a deep drive for achievement and influence. Beneath the surface, you want to matter in measurable ways: success, security, and the respect of people you respect. You're not vain; you're built for impact. Your soul settles when your ambitions have room to grow.",
    9: "A number nine soul urge means your heart beats for something bigger than yourself. Deep down, you long to heal, give, and leave the world gentler than you found it. Injustice wounds you personally. Your soul is fullest when your compassion has somewhere meaningful to go.",
  };

  // ---------- Numerology math (Pythagorean) ----------

  function reduceNum(n) {
    while (n > 9) {
      var s = 0;
      while (n > 0) { s += n % 10; n = Math.floor(n / 10); }
      n = s;
    }
    return n;
  }

  function digitSum(n) {
    var s = 0;
    while (n > 0) { s += n % 10; n = Math.floor(n / 10); }
    return s;
  }

  function letterValue(ch) {
    var code = ch.toUpperCase().charCodeAt(0) - 65;
    if (code < 0 || code > 25) return 0;
    return (code % 9) + 1;
  }

  var VOWELS = "AEIOU";

  // Y counts as a vowel when neither neighbor is a vowel.
  function isVowelAt(word, i) {
    var ch = word[i].toUpperCase();
    if (VOWELS.indexOf(ch) >= 0) return true;
    if (ch !== "Y") return false;
    var prev = i > 0 ? word[i - 1].toUpperCase() : "";
    var next = i < word.length - 1 ? word[i + 1].toUpperCase() : "";
    return VOWELS.indexOf(prev) < 0 && VOWELS.indexOf(next) < 0;
  }

  function nameNumbers(fullName) {
    var words = fullName.toUpperCase().replace(/[^A-Z\s'-]/g, "").split(/[\s'-]+/).filter(Boolean);
    var destinyTotal = 0, vowelSum = 0, consSum = 0;
    words.forEach(function (word) {
      var wordSum = 0;
      for (var i = 0; i < word.length; i++) {
        var v = letterValue(word[i]);
        if (!v) continue;
        wordSum += v;
        if (isVowelAt(word, i)) vowelSum += v;
        else consSum += v;
      }
      destinyTotal += reduceNum(wordSum);
    });
    return {
      destiny: reduceNum(destinyTotal),
      soulUrge: reduceNum(vowelSum),
      personality: reduceNum(consSum),
    };
  }

  var MONTH_NAMES = ["JANUARY", "FEBRUARY", "MARCH", "APRIL", "MAY", "JUNE",
    "JULY", "AUGUST", "SEPTEMBER", "OCTOBER", "NOVEMBER", "DECEMBER"];

  function lifePath(month, day, year) {
    var m = reduceNum(month);
    var d = reduceNum(day);
    var y = reduceNum(digitSum(year));
    var total = m + d + y;
    var lp = reduceNum(total);

    // Breakdown like: 4 + 4 + (2 + 0 + 2 + 3 = 7) = 4 + 4 + 7 = 1 + 5 = 6
    var parts = [];
    parts.push(month === m ? String(m) : "(" + String(month).split("").join(" + ") + " = " + m + ")");
    parts.push(day === d ? String(d) : "(" + String(day).split("").join(" + ") + " = " + d + ")");
    parts.push("(" + String(year).split("").join(" + ") + " = " + y + ")");
    var chain = parts.join(" + ") + " = " + m + " + " + d + " + " + y;
    if (total > 9) chain += " = " + String(total).split("").join(" + ") + " = " + lp;
    else chain += " = " + lp;

    return { value: lp, breakdown: chain, dateLabel: MONTH_NAMES[month - 1] + " " + day + ", " + year };
  }

  // ---------- Styles ----------

  var FONT = "'Segoe UI','Helvetica Neue',Helvetica,Arial,sans-serif";
  var ORANGE = "#d2622a";
  var NAVY = "#28395c";
  var INK = "#3b382f";

  // Faint handwritten-digit texture, tiled (stands in for the paper photo).
  function digitsPattern() {
    var rows = "";
    var seq = "9 2 5 3 9 0 5 6 0 1 3 5 9 5 4 8 8 2 0 4 6 6 5 2 1 5 8 4 1 4 6 9 5 1 9 4".split(" ");
    for (var r = 0; r < 6; r++) {
      var y = 34 + r * 40;
      var text = "";
      for (var c = 0; c < 12; c++) {
        var d = seq[(r * 12 + c * 7 + r * 3) % seq.length];
        text += "<text x='" + (10 + c * 34 + (r % 3) * 6) + "' y='" + y + "' font-family='Georgia,serif' font-size='30' fill='%23a4936b' opacity='.13'>" + d + "</text>";
      }
      rows += text;
    }
    return "url(\"data:image/svg+xml;charset=utf-8,%3Csvg xmlns='http://www.w3.org/2000/svg' width='420' height='250'%3E" + rows + "%3C/svg%3E\")";
  }

  var CSS = "" +
    ":host{all:initial;display:block}" +
    "*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}" +
    ".wrap{position:relative;font-family:" + FONT + ";color:" + INK + ";" +
    "background-color:#efe3bf;background-image:" + digitsPattern() + ",radial-gradient(ellipse 120% 80% at 30% 10%,rgba(255,252,240,.55),transparent 60%),linear-gradient(180deg,#f0e4c2 0%,#ecdfb8 100%);" +
    "padding:46px 24px 56px;overflow:hidden;line-height:1.65}" +
    ".inner{position:relative;max-width:960px;margin:0 auto}" +
    ".logo{text-align:center;margin-bottom:30px;position:relative}" +
    ".logo .small{font-size:15px;font-weight:600;letter-spacing:9px;color:" + NAVY + ";text-transform:uppercase}" +
    ".logo .big{font-family:Georgia,'Times New Roman',serif;font-size:clamp(38px,6vw,58px);font-weight:700;letter-spacing:6px;color:" + NAVY + ";line-height:1.15;position:relative;display:inline-block}" +
    ".logo .burst{position:absolute;top:-16px;left:50%;transform:translateX(-50%);z-index:-1;opacity:.85}" +
    ".intro{font-size:19px;text-align:center;margin:0 auto 20px;max-width:880px}" +
    ".formrow{display:flex;gap:40px;justify-content:center;align-items:flex-end;flex-wrap:wrap;margin-top:34px}" +
    ".fgroup{text-align:center}" +
    ".flabel{font-family:Georgia,serif;font-weight:700;font-size:17px;letter-spacing:2px;color:#2e2b22;margin-bottom:12px;text-transform:uppercase}" +
    ".namein{width:min(480px,86vw);padding:16px;font-size:20px;font-family:" + FONT + ";color:" + INK + ";" +
    "background:#fff;border:1px solid #cfc39f;border-radius:6px;outline:none}" +
    ".namein:focus{border-color:" + NAVY + "}" +
    ".dsel{appearance:none;-webkit-appearance:none;padding:16px 38px 16px 14px;font-size:18px;font-family:" + FONT + ";color:#7d7666;" +
    "background:#fff url(\"data:image/svg+xml;charset=utf-8,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='8'%3E%3Cpath d='M1 1l5 5 5-5' fill='%23555'/%3E%3C/svg%3E\") no-repeat right 12px center;" +
    "border:1px solid #cfc39f;border-radius:6px;outline:none;cursor:pointer}" +
    ".dsel.hasval{color:" + INK + "}" +
    ".band{background:rgba(255,252,240,.6);margin:34px -24px 0;padding:26px 24px;text-align:center}" +
    ".calc{display:inline-block;font-family:'Great Vibes',cursive;font-size:34px;color:#fff;background:" + ORANGE + ";" +
    "border:none;border-radius:4px;padding:10px 62px 16px;cursor:pointer;box-shadow:0 4px 0 #a84e22;transition:transform .12s ease}" +
    ".calc:hover{transform:translateY(-1px)}" +
    ".err{display:none;text-align:center;margin-top:16px;font-size:17px;color:#a03030}" +
    ".err.show{display:block}" +
    ".screen{display:none}" +
    ".screen.active{display:block;animation:fadein .5s ease}" +
    "@keyframes fadein{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:none}}" +
    ".stitle{font-family:Georgia,'Times New Roman',serif;font-size:clamp(38px,6vw,58px);color:" + ORANGE + ";text-align:center;margin-bottom:22px;font-weight:400}" +
    ".sdesc{font-size:19px;text-align:center;margin:0 auto 26px;max-width:860px}" +
    ".numband{background:rgba(255,252,240,.65);margin:0 -24px;padding:34px 24px}" +
    ".numrow{display:flex;align-items:center;gap:26px;max-width:880px;margin:0 auto}" +
    ".bignum{font-family:Georgia,'Times New Roman',serif;font-size:150px;line-height:.72;color:#1d1a12;flex:0 0 auto}" +
    ".numtext{font-size:19px}" +
    ".numtext .meta{margin-top:14px;font-size:18px}" +
    ".numtext .meta b{font-weight:700}" +
    ".calcline{max-width:880px;margin:26px auto 0;font-size:19px}" +
    ".calcline .dlabel{font-weight:700;letter-spacing:1px;text-transform:uppercase}" +
    ".calcline .chain{color:" + ORANGE + ";font-weight:600}" +
    ".calcline .chain .dim{color:#8f867a;font-weight:400}" +
    ".navrow{display:flex;justify-content:space-between;align-items:center;gap:18px;margin-top:44px;flex-wrap:wrap}" +
    ".navbtn{display:inline-flex;align-items:center;gap:12px;background:none;border:none;cursor:pointer;" +
    "font-family:" + FONT + ";font-size:18px;font-weight:700;color:#2e2b22;padding:4px}" +
    ".navbtn .circ{width:38px;height:38px;border-radius:50%;background:" + ORANGE + ";display:inline-flex;" +
    "align-items:center;justify-content:center;box-shadow:0 2px 6px rgba(0,0,0,.25)}.navbtn .circ svg{display:block}" +
    ".navbtn:hover .circ{background:#b8511e}" +
    ".navright{text-align:right}" +
    ".ctacol{display:flex;flex-direction:column;align-items:flex-end;gap:14px}" +
    ".ctalink{display:inline-block;font-size:18px;font-weight:700;color:#fff;background:" + ORANGE + ";padding:13px 32px;border-radius:6px;text-decoration:none;box-shadow:0 3px 0 #a84e22;transition:transform .12s ease}.ctalink:hover{transform:translateY(-1px)}" +
    "" +
    ".startover{font-size:17px;font-weight:700;color:#7d2b2b;background:transparent;border:2px solid #7d2b2b;padding:11px 28px;border-radius:6px;cursor:pointer;font-family:" + FONT + ";transition:background .15s ease,color .15s ease}.startover:hover{background:#7d2b2b;color:#f3e9d5}" +
    ".sumrows{margin-top:10px}" +
    ".sumrow{display:flex;align-items:center;gap:18px;margin-bottom:30px}" +
    ".sumlabel{flex:0 0 130px;font-family:Georgia,serif;font-size:26px;color:" + ORANGE + ";text-align:right}" +
    ".sumnum{flex:0 0 auto;font-family:Georgia,serif;font-size:60px;line-height:.72;color:#1d1a12;min-width:44px;text-align:center}" +
    ".sumtext{font-size:18px}" +
    "@media(max-width:680px){" +
    ".numrow{flex-direction:column;text-align:left}" +
    ".bignum{font-size:100px}" +
    ".sumrow{flex-wrap:wrap}" +
    ".sumlabel{flex-basis:100%;text-align:left}" +
    ".wrap{padding:36px 14px 46px}}";

  var BURST_SVG = (function () {
    var rays = "";
    for (var i = 0; i < 24; i++) {
      var a = (i * 15) * Math.PI / 180;
      var r1 = 16 + (i % 2) * 6, r2 = 34 + (i % 3) * 8;
      rays += "<line x1='" + (50 + r1 * Math.cos(a)).toFixed(1) + "' y1='" + (50 + r1 * Math.sin(a)).toFixed(1) +
        "' x2='" + (50 + r2 * Math.cos(a)).toFixed(1) + "' y2='" + (50 + r2 * Math.sin(a)).toFixed(1) +
        "' stroke='#e8a75e' stroke-width='3.4' stroke-linecap='round' opacity='.8'/>";
    }
    return "<svg class='burst' width='100' height='100' viewBox='0 0 100 100' fill='none' xmlns='http://www.w3.org/2000/svg'>" + rays + "</svg>";
  })();

  // ---------- Markup ----------

  var STEPS = [
    { key: "lp", title: "Your Life Path Number", label: "Your Life Path Number", desc: "Your life path number is derived from your birthdate and tells you a great deal about your strengths, weaknesses, and tendencies. It can help you see your path more clearly so you can spot the most advantageous opportunities for your life when they pop up." },
    { key: "destiny", title: "Your Destiny Number", label: "Your Destiny Number", desc: "Your destiny number takes every letter of your name into account. This number gives you a peek into your greater purpose in this life." },
    { key: "personality", title: "Your Personality Number", label: "Your Personality Number", desc: "Your personality number offers insight into how others see you. Derived from the consonants in your name, this is the filter through which people first perceive your personality. It may not accurately reflect what's underneath. Understanding how you look to others at your first introduction will help you overcome erroneous perceptions and let your inner self shine through." },
    { key: "soul", title: "Your Soul Urge Number", label: "Your Soul Urge Number", desc: "Your soul urge number is calculated using the vowels in your name. This number will give you insight into your deepest desires. These are not always reflected on the surface, but reside deep within your soul." },
    { key: "summary", title: "", label: "Summary", desc: "" },
  ];

  function option(value, label) {
    return "<option value=\"" + value + "\">" + label + "</option>";
  }

  function logoHtml() {
    return "<div class='logo'><div class='small'>Your Personal</div>" +
      "<div class='big'>" + BURST_SVG + "NUMEROLOGY</div>" +
      "<div class='small' style='letter-spacing:12px'>Calculator</div></div>";
  }

  var CHEV_L = "<svg width='12' height='16' viewBox='0 0 12 16' fill='none' xmlns='http://www.w3.org/2000/svg'><path d='M9 2 L3 8 L9 14' stroke='white' stroke-width='2.4' fill='none' stroke-linecap='round' stroke-linejoin='round'/></svg>";
  var CHEV_R = "<svg width='12' height='16' viewBox='0 0 12 16' fill='none' xmlns='http://www.w3.org/2000/svg'><path d='M3 2 L9 8 L3 14' stroke='white' stroke-width='2.4' fill='none' stroke-linecap='round' stroke-linejoin='round'/></svg>";

  function navRow(prevIdx, nextIdx, isSummary) {
    var left = prevIdx === null ? "<span></span>" :
      "<button class='navbtn nav-prev' data-go='" + prevIdx + "' type='button'><span class='circ'>" + CHEV_L + "</span><span>" + STEPS[prevIdx].label + "</span></button>";
    var right;
    if (isSummary) {
      right = "<div class='ctacol'><span class='cta-slot'></span><button class='startover' type='button'>Start Over</button></div>";
    } else {
      right = "<button class='navbtn navright nav-next' data-go='" + nextIdx + "' type='button'><span>" + STEPS[nextIdx].label + "</span><span class='circ'>" + CHEV_R + "</span></button>";
    }
    return "<div class='navrow'>" + left + right + "</div>";
  }

  function buildHtml() {
    var months = "<option value=''>Month</option>";
    var monthLabels = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
    for (var m = 1; m <= 12; m++) months += option(m, monthLabels[m - 1]);
    var days = "<option value=''>Day</option>";
    for (var d = 1; d <= 31; d++) days += option(d, d);
    var years = "<option value=''>Year</option>";
    var thisYear = new Date().getFullYear();
    for (var y = thisYear; y >= 1920; y--) years += option(y, y);

    var html = "<div class='wrap'><div class='inner'>";

    // Form screen
    html += "<div class='screen s-form active'>" + logoHtml() +
      "<p class='intro'>Numerology takes the information in your birth date and given birth name to uncover powerful insights about your personality, life path, and pursuits. You are driven by several different numbers which contribute important pieces to the unique whole that is your personality and destiny.</p>" +
      "<p class='intro'>Enter your full name as it was given to you at birth as well as your birthdate to see what your personal numerology reading says about you.</p>" +
      "<div class='formrow'>" +
      "<div class='fgroup'><div class='flabel'>Your Full Name</div><input class='namein' data-f='name' type='text' autocomplete='off' aria-label='Your full name'></div>" +
      "<div class='fgroup'><div class='flabel'>Your Birthdate</div><div style='display:flex;gap:10px'>" +
      "<select class='dsel' data-f='month' aria-label='Month'>" + months + "</select>" +
      "<select class='dsel' data-f='day' aria-label='Day'>" + days + "</select>" +
      "<select class='dsel' data-f='year' aria-label='Year'>" + years + "</select>" +
      "</div></div></div>" +
      "<div class='band'><button class='calc' type='button'>Calculate</button></div>" +
      "<div class='err' role='alert'></div>" +
      "</div>";

    // Step screens
    for (var i = 0; i < 4; i++) {
      var st = STEPS[i];
      html += "<div class='screen s-" + st.key + "'>" +
        "<h2 class='stitle'>" + st.title + "</h2>" +
        "<p class='sdesc'>" + st.desc + "</p>" +
        "<div class='numband'><div class='numrow'>" +
        "<div class='bignum' data-n='" + st.key + "'></div>" +
        "<div class='numtext'><span data-t='" + st.key + "'></span>" +
        (st.key === "lp" ? "<div class='meta' data-meta='lp'></div>" : "") +
        "</div></div>" +
        (st.key === "lp" ? "<div class='calcline'><div class='dlabel' data-lp='date'></div><div class='chain' data-lp='chain'></div></div>" : "") +
        "</div>" +
        navRow(i === 0 ? null : i - 1, i + 1, false) +
        "</div>";
    }

    // Summary screen
    html += "<div class='screen s-summary'>" + logoHtml() +
      "<div class='sumrows'>" +
      ["lp|Life Path", "destiny|Destiny", "personality|Personality", "soul|Soul Urge"].map(function (pair) {
        var key = pair.split("|")[0], label = pair.split("|")[1];
        return "<div class='sumrow'><div class='sumlabel'>" + label + "</div>" +
          "<div class='sumnum' data-sn='" + key + "'></div>" +
          "<div class='sumtext' data-st='" + key + "'></div></div>";
      }).join("") +
      "</div>" +
      navRow(3, null, true) +
      "</div>";

    html += "</div></div>";
    return html;
  }

  // ---------- Behavior ----------

  function init(host) {
    if (host.__psNumerology) return;
    host.__psNumerology = true;

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
    var fields = {};
    mount.querySelectorAll("[data-f]").forEach(function (el) { fields[el.getAttribute("data-f")] = el; });
    var err = $(".err");

    mount.querySelectorAll(".dsel").forEach(function (el) {
      el.addEventListener("change", function () { el.classList.toggle("hasval", !!el.value); });
    });

    function show(key) {
      mount.querySelectorAll(".screen").forEach(function (el) { el.classList.remove("active"); });
      $(".s-" + key).classList.add("active");
      $(".wrap").scrollIntoView({ behavior: "smooth", block: "start" });
    }

    mount.querySelectorAll(".nav-prev,.nav-next").forEach(function (btn) {
      btn.addEventListener("click", function () {
        var idx = +btn.getAttribute("data-go");
        show(STEPS[idx].key);
      });
    });

    function showError(msg) { err.textContent = msg; err.classList.add("show"); }
    function clearError() { err.classList.remove("show"); }

    $(".calc").addEventListener("click", function () {
      clearError();
      var name = fields.name.value.trim();
      var month = +fields.month.value, day = +fields.day.value, year = +fields.year.value;
      if (!/[a-zA-Z].*[a-zA-Z]/.test(name)) return showError("Please enter your full name as it was given at birth.");
      if (!month || !day || !year) return showError("Please select your full birthdate.");
      if (day > new Date(year, month, 0).getDate()) return showError("That date does not exist. Please check the day and month.");

      var lp = lifePath(month, day, year);
      var nn = nameNumbers(name);

      // Step screens
      $("[data-n='lp']").textContent = lp.value;
      $("[data-t='lp']").textContent = LIFE_PATH[lp.value].text;
      $("[data-meta='lp']").innerHTML = "<div><b>Strengths:</b> " + LIFE_PATH[lp.value].s + "</div>" +
        "<div><b>Weaknesses:</b> " + LIFE_PATH[lp.value].w + "</div>" +
        "<div><b>Best Jobs:</b> " + LIFE_PATH[lp.value].j + "</div>";
      $("[data-lp='date']").textContent = lp.dateLabel;
      $("[data-lp='chain']").textContent = lp.breakdown;
      $("[data-n='destiny']").textContent = nn.destiny;
      $("[data-t='destiny']").textContent = DESTINY[nn.destiny];
      $("[data-n='personality']").textContent = nn.personality;
      $("[data-t='personality']").textContent = PERSONALITY[nn.personality];
      $("[data-n='soul']").textContent = nn.soulUrge;
      $("[data-t='soul']").textContent = SOUL_URGE[nn.soulUrge];

      // Summary
      $("[data-sn='lp']").textContent = lp.value;
      $("[data-st='lp']").textContent = LIFE_PATH[lp.value].text;
      $("[data-sn='destiny']").textContent = nn.destiny;
      $("[data-st='destiny']").textContent = DESTINY[nn.destiny];
      $("[data-sn='personality']").textContent = nn.personality;
      $("[data-st='personality']").textContent = PERSONALITY[nn.personality];
      $("[data-sn='soul']").textContent = nn.soulUrge;
      $("[data-st='soul']").textContent = SOUL_URGE[nn.soulUrge];

      var slot = $(".cta-slot");
      slot.innerHTML = "";
      if (CTA_URL) {
        var a = document.createElement("a");
        a.className = "ctalink";
        a.href = CTA_URL;
        a.textContent = "Get a Live Reading";
        slot.appendChild(a);
      }

      show("lp");
    });

    $(".startover").addEventListener("click", function () {
      fields.name.value = "";
      fields.month.value = "";
      fields.day.value = "";
      fields.year.value = "";
      mount.querySelectorAll(".dsel").forEach(function (el) { el.classList.remove("hasval"); });
      clearError();
      show("form");
    });
  }

  function boot() {
    var host = document.getElementById("ps-numerology") || document.querySelector("[data-ps-widget='numerology']");
    if (host) init(host);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})();
