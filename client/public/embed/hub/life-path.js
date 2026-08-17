/* Numerology Profile - hub tool module (upgraded from Life Path).
 * From full name + birth date, computes a complete Pythagorean numerology
 * chart: Life Path, Expression, Soul Urge, Personality, Birthday, Maturity;
 * current Personal Year/Month/Day cycles; the four Pinnacles and Challenges
 * with ages; lucky numbers and favorable days; and an optional Life Path
 * compatibility check. Master numbers (11/22/33) and karmic debt (13/14/16/19)
 * are preserved.
 */
(function () {
  "use strict";

  var MASTERS = { 11: 1, 22: 1, 33: 1 };
  function digitSum(n) { return String(n).split("").reduce(function (a, d) { return a + (+d || 0); }, 0); }
  function reduceKeepMaster(n) { while (n > 9 && !MASTERS[n]) n = digitSum(n); return n; }
  function reduceToSingle(n) { while (n > 9) n = digitSum(n); return n; }
  function letterVal(ch) { return ((ch.charCodeAt(0) - 65) % 9) + 1; }
  var VOW = "AEIOU";
  function isVowelAt(word, i) {
    var ch = word[i];
    if (VOW.indexOf(ch) >= 0) return true;
    if (ch === "Y") { var p = word[i - 1], n = word[i + 1]; return !(p && VOW.indexOf(p) >= 0) && !(n && VOW.indexOf(n) >= 0); }
    return false;
  }
  function nameNumbers(name) {
    var words = name.toUpperCase().split(/[^A-Z]+/).filter(Boolean);
    var all = 0, vow = 0, con = 0;
    words.forEach(function (w) { for (var i = 0; i < w.length; i++) { var v = letterVal(w[i]); all += v; if (isVowelAt(w, i)) vow += v; else con += v; } });
    return { expression: reduceKeepMaster(all), soul: reduceKeepMaster(vow), personality: reduceKeepMaster(con), hasLetters: all > 0 };
  }
  function compute(month, day, year, name) {
    var mr = reduceKeepMaster(month), dr = reduceKeepMaster(day), yr = reduceKeepMaster(year);
    var total = mr + dr + yr, lifePath = reduceKeepMaster(total);
    var karmic = [13, 14, 16, 19].indexOf(total) !== -1 ? total : ([13, 14, 16, 19].indexOf(day) !== -1 ? day : null);
    var nn = name ? nameNumbers(name) : { expression: null, soul: null, personality: null, hasLetters: false };
    var birthday = reduceKeepMaster(day);
    var maturity = nn.hasLetters ? reduceKeepMaster(reduceToSingle(lifePath) + reduceToSingle(nn.expression)) : null;
    var now = new Date();
    var py = reduceToSingle(reduceToSingle(month) + reduceToSingle(day) + reduceToSingle(now.getFullYear()));
    var pm = reduceToSingle(py + (now.getMonth() + 1));
    var pd = reduceToSingle(pm + now.getDate());
    // pinnacles + challenges
    var m1 = reduceToSingle(month), d1 = reduceToSingle(day), y1 = reduceToSingle(year);
    var P1 = reduceKeepMaster(m1 + d1), P2 = reduceKeepMaster(d1 + y1), P3 = reduceKeepMaster(reduceToSingle(P1) + reduceToSingle(P2)), P4 = reduceKeepMaster(m1 + y1);
    var C1 = Math.abs(m1 - d1), C2 = Math.abs(d1 - y1), C3 = Math.abs(C1 - C2), C4 = Math.abs(m1 - y1);
    var a1 = 36 - reduceToSingle(lifePath);
    var age = now.getFullYear() - year - ((now.getMonth() + 1 < month || (now.getMonth() + 1 === month && now.getDate() < day)) ? 1 : 0);
    var pinnacles = [
      { p: P1, c: C1, from: 0, to: a1 }, { p: P2, c: C2, from: a1 + 1, to: a1 + 9 },
      { p: P3, c: C3, from: a1 + 10, to: a1 + 18 }, { p: P4, c: C4, from: a1 + 19, to: null }
    ];
    return { mr: mr, dr: dr, yr: yr, total: total, lifePath: lifePath, karmic: karmic,
      expression: nn.expression, soul: nn.soul, personality: nn.personality, hasName: nn.hasLetters,
      birthday: birthday, maturity: maturity, personalYear: py, personalMonth: pm, personalDay: pd,
      year: now.getFullYear(), pinnacles: pinnacles, age: age, lifePathSingle: reduceToSingle(lifePath) };
  }

  var PROFILES = {
    1: { name: "The Leader", essence: "You are here to stand on your own two feet and pioneer. Independent, driven, and original, you carry the raw energy of new beginnings.", strengths: ["Bold initiative", "Originality", "Self-reliance", "Determination"], challenges: ["Stubbornness", "Impatience", "Fear of not being first"], career: "Entrepreneur, founder, inventor, or any role where you set the direction.", love: "You need a partner who respects your independence and cheers your ambitions." },
    2: { name: "The Peacemaker", essence: "You are the diplomat and the glue in every room. Sensitive, intuitive, and cooperative, your gift is bringing people together.", strengths: ["Empathy", "Tact", "Patience", "Partnership"], challenges: ["Over-sensitivity", "Self-doubt", "Avoiding conflict"], career: "Counselor, mediator, healer, or any collaborative work.", love: "You thrive in a gentle, secure partnership where your feelings are met with equal care." },
    3: { name: "The Communicator", essence: "You are creative self-expression in motion. Joyful, imaginative, and social, you inspire and uplift others through words and art.", strengths: ["Creativity", "Optimism", "Charisma", "Expression"], challenges: ["Scattered focus", "Superficiality", "Mood swings"], career: "Writer, performer, designer, teacher, or anything that lets your voice be heard.", love: "You want fun, laughter, and emotional openness with a partner who can play and feel deeply." },
    4: { name: "The Builder", essence: "You are the foundation others rely on. Practical, disciplined, and loyal, you turn ideas into lasting structures.", strengths: ["Reliability", "Discipline", "Loyalty", "Practical wisdom"], challenges: ["Rigidity", "Workaholism", "Resistance to change"], career: "Engineer, manager, craftsperson, or any role that rewards steady mastery.", love: "You show love through devotion and need a partner who values security as much as you do." },
    5: { name: "The Explorer", essence: "You are freedom and change itself. Adventurous, curious, and adaptable, you are here to experience life fully.", strengths: ["Versatility", "Courage", "Charisma", "Adaptability"], challenges: ["Restlessness", "Impulsiveness", "Fear of commitment"], career: "Traveler, journalist, sales, or any dynamic role with variety.", love: "You need a partner who gives you room to roam and will adventure alongside you." },
    6: { name: "The Nurturer", essence: "You are the heart of home and community. Responsible, loving, and protective, your purpose is to care and create harmony.", strengths: ["Compassion", "Responsibility", "Warmth", "Devotion"], challenges: ["Over-giving", "Worry", "Taking on too much"], career: "Teacher, nurse, designer, or any role centered on care and beauty.", love: "You love completely and want a family-like bond; let yourself be cared for too." },
    7: { name: "The Seeker", essence: "You are the soul in search of truth. Analytical, spiritual, and introspective, you look beneath the surface of life.", strengths: ["Insight", "Wisdom", "Intuition", "Focus"], challenges: ["Isolation", "Skepticism", "Emotional distance"], career: "Researcher, analyst, scientist, mystic, or any path of deep study.", love: "You need a partner who respects your solitude and can meet you on a soul level." },
    8: { name: "The Powerhouse", essence: "You are here to master the material world. Ambitious, capable, and authoritative, you carry the energy of abundance.", strengths: ["Leadership", "Vision", "Resilience", "Manifestation"], challenges: ["Control issues", "Workaholism", "Money fixation"], career: "Executive, investor, founder, or any role with real scope and stakes.", love: "You need a strong, equal partner who supports your drive." },
    9: { name: "The Humanitarian", essence: "You are the old soul who came to give. Compassionate, wise, and idealistic, you lead with your heart.", strengths: ["Generosity", "Compassion", "Vision", "Tolerance"], challenges: ["Martyrdom", "Difficulty letting go", "Overwhelm"], career: "Humanitarian, artist, healer, or any mission-driven work.", love: "A partner who shares your ideals and lets you be free will hold your heart." },
    11: { name: "The Illuminator", essence: "A master number. You carry the 2's sensitivity raised to a spiritual octave: intuition, inspiration, and the power to enlighten.", strengths: ["Heightened intuition", "Inspiration", "Idealism", "Vision"], challenges: ["Nervous tension", "Self-doubt", "Overwhelm"], career: "Spiritual teacher, artist, counselor, or any visionary role.", love: "You need a grounded partner who can steady your intensity and honor your sensitivity." },
    22: { name: "The Master Builder", essence: "The most powerful master number. You blend the 4's discipline with visionary scope: you can turn great dreams into concrete reality.", strengths: ["Visionary practicality", "Leadership", "Discipline", "Impact"], challenges: ["Enormous pressure", "Self-doubt", "All-or-nothing thinking"], career: "Architect of large ventures, founder, leader of movements.", love: "You need a patient, supportive partner who understands the size of your mission." },
    33: { name: "The Master Teacher", essence: "The rarest master number, the master of loving service. You heal and uplift humanity through selfless love.", strengths: ["Compassionate wisdom", "Healing presence", "Devotion"], challenges: ["Self-sacrifice", "Heavy sense of duty", "Emotional burden"], career: "Healer, teacher, humanitarian leader, or any role of devoted service.", love: "A partner who nurtures you in return keeps your well full." }
  };
  var KARMIC = { 13: "Karmic Debt 13: a lesson in focus and honest effort. Discipline and finishing what you start bring real transformation.", 14: "Karmic Debt 14: a lesson in freedom and moderation. Build healthy boundaries and use your freedom wisely.", 16: "Karmic Debt 16: a lesson in ego and rebirth. Humbling change clears the way for a truer self. Surrender and honesty are the path.", 19: "Karmic Debt 19: a lesson in independence and compassion. Stand on your own without leaning on or over others." };
  var EXPRESS = { 1: "a bold leader and original force, here to initiate", 2: "a natural diplomat who works best in partnership", 3: "a creative communicator meant to inspire and delight", 4: "a builder who creates lasting, practical things", 5: "a versatile free spirit meant to promote change", 6: "a nurturer devoted to family, beauty, and service", 7: "a seeker here to find deeper truth and wisdom", 8: "a powerhouse meant to lead and build real influence", 9: "a compassionate humanitarian here to give and uplift", 11: "an inspired visionary and spiritual messenger", 22: "a master builder who turns grand visions into reality", 33: "a master teacher devoted to healing through love" };
  var SOUL = { 1: "independence, achievement, and to be recognized as original", 2: "harmony, deep connection, and to be needed and loved", 3: "to express yourself, create, and share joy", 4: "security, order, and to build something that endures", 5: "freedom, variety, and adventure", 6: "to love and be loved, and to care for others", 7: "understanding, solitude, and spiritual truth", 8: "achievement, abundance, and recognition", 9: "to serve humanity and make the world better", 11: "spiritual insight and to inspire and enlighten", 22: "to build something of lasting significance for many", 33: "to uplift and heal others through compassion" };
  var PERSON = { 1: "confident, pioneering, and self-assured", 2: "gentle, warm, and approachable", 3: "charming, expressive, and fun", 4: "dependable, grounded, and hardworking", 5: "dynamic, magnetic, and full of energy", 6: "warm, responsible, and comforting", 7: "thoughtful, reserved, and quietly wise", 8: "authoritative, capable, and impressive", 9: "gracious, worldly, and kind", 11: "magnetic, sensitive, and quietly radiant", 22: "capable, grounded, and quietly powerful", 33: "warm, wise, and deeply caring" };
  var BIRTHDAY = { 1: "independence and leadership", 2: "sensitivity and cooperation", 3: "creativity and self-expression", 4: "discipline and reliability", 5: "adaptability and a love of freedom", 6: "nurturing and responsibility", 7: "insight and a searching mind", 8: "ambition and a head for the material world", 9: "compassion and a giving heart", 11: "heightened intuition and inspiration", 22: "the vision to build on a large scale" };
  var MATURITY = { 1: "stepping fully into leadership and independence", 2: "finding peace, partnership, and diplomacy", 3: "expressing your creativity and joy more freely", 4: "building security and a stable legacy", 5: "embracing freedom and welcoming change", 6: "deepening into love, family, and service", 7: "turning inward toward wisdom and truth", 8: "coming into your power, success, and abundance", 9: "living for a greater humanitarian purpose", 11: "becoming a source of inspiration for others", 22: "realizing a large and lasting vision", 33: "teaching and healing through love" };
  var PY = { 1: "A year of fresh starts. Plant seeds and take initiative; what you begin now shapes the next nine years.", 2: "A year of patience and partnership. Nurture relationships and trust the timing.", 3: "A year of expression and joy. Create, socialize, and let your voice out.", 4: "A year of foundation and hard work. Build systems and put in steady effort.", 5: "A year of change and freedom. Expect movement; stay flexible and say yes.", 6: "A year of love and responsibility. Home, family, and commitments take center stage.", 7: "A year of reflection and depth. Slow down, study, and turn inward.", 8: "A year of power and reward. Ambition and finances come into focus; step up.", 9: "A year of completion and release. Let go of what no longer fits." };
  var CYCLE = { 1: "begin something new and lead", 2: "cooperate, be patient, and nurture bonds", 3: "create, socialize, and express yourself", 4: "focus, organize, and do the work", 5: "welcome change and stay flexible", 6: "tend to home, love, and responsibilities", 7: "reflect, rest, and go within", 8: "push on goals and money matters", 9: "finish, release, and make space" };
  var PINNACLE = { 1: "developing independence, courage, and leadership", 2: "learning cooperation, patience, and emotional sensitivity", 3: "expressing creativity and finding your voice", 4: "building foundations through discipline and work", 5: "embracing change, freedom, and new experiences", 6: "growing through love, family, and responsibility", 7: "deepening in wisdom, study, and inner life", 8: "achieving in the material and professional world", 9: "serving others and living with compassion", 11: "awakening intuition and inspiring others", 22: "building something large and lasting", 33: "healing and uplifting through love" };
  var CHALLENGE = { 0: "no single dominant challenge; you must find your own balance across many areas", 1: "learning to stand up for yourself without domineering", 2: "overcoming over-sensitivity and self-doubt", 3: "focusing your creative energy instead of scattering it", 4: "building discipline without becoming rigid", 5: "using freedom wisely and avoiding excess", 6: "serving without over-giving or controlling", 7: "opening up and trusting rather than isolating", 8: "handling power and money with integrity" };
  var HARM = { 1: [3, 5, 9], 2: [2, 6, 8, 9], 3: [1, 3, 5, 7], 4: [2, 4, 6, 7, 8], 5: [1, 3, 5, 7], 6: [2, 4, 6, 9], 7: [3, 4, 5, 7], 8: [2, 4, 8], 9: [1, 2, 6, 9] };
  function compat(a, b) {
    var A = reduceToSingle(a), B = reduceToSingle(b);
    var tier, note;
    if (A === B) { tier = "Kindred numbers"; note = "You share the same core vibration, so you understand each other instinctively. The gift is deep recognition; the risk is amplifying each other's blind spots."; }
    else if ((HARM[A] || []).indexOf(B) >= 0) { tier = "Naturally compatible"; note = "Your numbers flow together easily, supporting and balancing one another. This is a pairing with real natural harmony."; }
    else { tier = "A growth pairing"; note = "Your numbers are quite different, which can either balance beautifully or create friction. With awareness and respect, the contrast becomes a source of growth."; }
    return { tier: tier, note: note };
  }

  function render(mount, ctx) {
    var GOLD = ctx.gold, FONT = ctx.font;
    var CHEV = "background-image:url(\"data:image/svg+xml;charset=utf-8,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='8'%3E%3Cpath d='M1 1l5 5 5-5' stroke='%23999' stroke-width='1.6' fill='none'/%3E%3C/svg%3E\");background-repeat:no-repeat;background-position:right 12px center";
    ctx.injectStyle("lp", "" +
      ".lp{color:var(--ps-text);font-family:" + FONT + ";text-align:center}" +
      ".lp .intro{font-size:18px;max-width:580px;margin:0 auto 22px;color:var(--ps-muted)}" +
      ".lp label{display:block;font-size:13px;letter-spacing:1px;text-transform:uppercase;color:var(--ps-muted);margin:0 auto 6px;max-width:420px;text-align:left}" +
      ".lp .nin{width:100%;max-width:420px;margin:0 auto 16px;padding:13px 16px;font-size:17px;font-family:" + FONT + ";color:var(--ps-text);background:#fff;border:1.5px solid var(--ps-border);border-radius:10px;outline:none;text-align:center;display:block}" +
      ".lp .nin:focus{border-color:" + GOLD + "}.lp .nin::placeholder{color:var(--ps-muted)}" +
      ".lp .drow{display:flex;gap:10px;justify-content:center;flex-wrap:wrap;margin-bottom:18px}" +
      ".lp select{appearance:none;-webkit-appearance:none;padding:13px 36px 13px 14px;font-size:17px;font-family:" + FONT + ";color:var(--ps-text);background-color:#fff;border:1.5px solid var(--ps-border);border-radius:8px;outline:none;cursor:pointer;" + CHEV + "}" +
      ".lp select:focus{border-color:" + GOLD + "}.lp select option{color:var(--ps-text);background:#fff}" +
      ".lp .btn{font-family:" + FONT + ";font-size:18px;font-weight:600;color:var(--ps-on);background:" + GOLD + ";border:none;border-radius:999px;padding:14px 40px;cursor:pointer;box-shadow:0 2px 8px rgba(0,0,0,.12)}.lp .btn:hover{background:var(--ps-accent-dark)}" +
      ".lp .err{display:none;margin-top:12px;color:" + GOLD + ";font-size:15px}.lp .err.show{display:block}" +
      ".lp .res{display:none}.lp .res.show{display:block;animation:lpf .4s ease}@keyframes lpf{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:none}}" +
      ".lp .num{font-family:'Great Vibes',cursive;font-size:clamp(88px,18vw,160px);line-height:.95;color:" + GOLD + "}" +
      ".lp .pname{font-size:25px;font-weight:700}.lp .sublabel{font-size:13px;letter-spacing:2px;text-transform:uppercase;color:var(--ps-muted)}" +
      ".lp .badges{display:flex;gap:8px;justify-content:center;flex-wrap:wrap;margin:12px 0 4px}.lp .badge{font-size:12px;font-weight:700;letter-spacing:1px;text-transform:uppercase;border-radius:999px;padding:5px 12px}.lp .b-master{color:var(--ps-on);background:" + GOLD + "}.lp .b-karmic{color:" + GOLD + ";border:1px solid " + GOLD + "}" +
      ".lp .calc{font-size:14px;color:var(--ps-muted);margin:8px 0 18px}" +
      ".lp .essence{font-size:17px;max-width:640px;margin:0 auto 22px;color:var(--ps-text)}" +
      ".lp .cols{display:grid;grid-template-columns:1fr 1fr;gap:12px;max-width:720px;margin:0 auto;text-align:left}@media(max-width:560px){.lp .cols{grid-template-columns:1fr}}" +
      ".lp .cell{background:var(--ps-panel);border:1px solid var(--ps-border);border-radius:14px;padding:15px 17px}.lp .cell h4{font-size:12px;letter-spacing:1.5px;text-transform:uppercase;color:" + GOLD + ";margin-bottom:7px}.lp .cell p,.lp .cell li{font-size:15px;color:var(--ps-text)}.lp .cell ul{list-style:none}.lp .cell li{padding:2px 0 2px 15px;position:relative}.lp .cell li::before{content:'';position:absolute;left:0;top:11px;width:5px;height:5px;border-radius:50%;background:" + GOLD + "}" +
      ".lp h3{font-family:'Great Vibes',cursive;font-weight:400;font-size:38px;color:" + GOLD + ";margin:34px 0 14px}" +
      ".lp .core{display:grid;grid-template-columns:repeat(3,1fr);gap:12px;max-width:760px;margin:0 auto}@media(max-width:640px){.lp .core{grid-template-columns:repeat(2,1fr)}}@media(max-width:420px){.lp .core{grid-template-columns:1fr}}" +
      ".lp .ncard{background:var(--ps-panel);border:1px solid var(--ps-border);border-radius:14px;padding:16px;text-align:center}.lp .ncard .k{font-size:12px;letter-spacing:1.5px;text-transform:uppercase;color:var(--ps-muted)}.lp .ncard .v{font-size:40px;font-weight:700;color:" + GOLD + ";line-height:1.1}.lp .ncard .d{font-size:14px;color:var(--ps-text);margin-top:4px}" +
      ".lp .cycles{display:grid;grid-template-columns:repeat(3,1fr);gap:12px;max-width:720px;margin:0 auto}@media(max-width:560px){.lp .cycles{grid-template-columns:1fr}}" +
      ".lp .cyc{background:rgba(165,18,27,.06);border:1px solid rgba(165,18,27,.25);border-radius:14px;padding:15px 16px;text-align:left}.lp .cyc h4{font-size:12px;letter-spacing:1.5px;text-transform:uppercase;color:" + GOLD + "}.lp .cyc .cv{font-size:20px;font-weight:700;margin:2px 0 4px}.lp .cyc p{font-size:14.5px;color:var(--ps-text)}" +
      ".lp .timeline{max-width:720px;margin:0 auto;text-align:left}.lp .pin{display:flex;gap:14px;padding:13px 0;border-bottom:1px solid var(--ps-border)}.lp .pin:last-child{border-bottom:0}.lp .pin.active{background:rgba(165,18,27,.06);border-radius:10px;padding:13px}.lp .pinnum{flex:0 0 46px;text-align:center}.lp .pinnum .pn{font-size:30px;font-weight:700;color:" + GOLD + ";line-height:1}.lp .pinnum .ages{font-size:11px;color:var(--ps-muted)}.lp .pinbody{flex:1}.lp .pinbody .pt{font-size:15px}.lp .pinbody .ch{font-size:13.5px;color:var(--ps-muted);margin-top:3px}.lp .nowtag{font-size:10px;font-weight:700;letter-spacing:1px;text-transform:uppercase;color:var(--ps-on);background:" + GOLD + ";border-radius:999px;padding:2px 8px;margin-left:6px}" +
      ".lp .lucky{max-width:720px;margin:0 auto;display:flex;gap:16px;flex-wrap:wrap;justify-content:center}.lp .lk{background:var(--ps-panel);border:1px solid var(--ps-border);border-radius:14px;padding:14px 22px}.lp .lk .k{font-size:12px;letter-spacing:1.5px;text-transform:uppercase;color:var(--ps-muted)}.lp .lk .v{font-size:22px;font-weight:700;color:" + GOLD + "}" +
      ".lp .compat{max-width:560px;margin:0 auto}.lp .compat .drow{margin-bottom:0}.lp .cres{margin-top:14px;background:var(--ps-panel);border:1px solid var(--ps-border);border-radius:14px;padding:16px 18px;display:none}.lp .cres.show{display:block}.lp .cres .ct{font-size:18px;font-weight:700;color:" + GOLD + "}.lp .cres p{font-size:15px;color:var(--ps-text);margin-top:5px}" +
      ".lp .retry{display:block;margin:28px auto 0;font-size:15px;font-weight:700;letter-spacing:1px;color:" + GOLD + ";background:none;border:none;cursor:pointer;font-family:" + FONT + "}");

    var mn = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
    function opts(list, ph) { var s = "<option value=''>" + ph + "</option>"; list.forEach(function (o) { s += "<option value='" + o[0] + "'>" + o[1] + "</option>"; }); return s; }
    var months = mn.map(function (m, i) { return [i + 1, m]; });
    var days = []; for (var d = 1; d <= 31; d++) days.push([d, d]);
    var years = []; var yr = new Date().getFullYear(); for (var y = yr; y >= 1920; y--) years.push([y, y]);

    var el = document.createElement("div"); el.className = "lp";
    el.innerHTML =
      "<div class='form'>" +
        "<p class='intro'>Your full birth name and birth date together reveal your complete numerology chart: your purpose, your inner desires, the cycles you are moving through, and the gifts you carry.</p>" +
        "<label>Full birth name</label><input class='nin' data-f='name' type='text' placeholder='Your full name at birth' autocomplete='off'>" +
        "<label style='text-align:center;max-width:none'>Birth date</label>" +
        "<div class='drow'><select data-f='month'>" + opts(months, "Month") + "</select><select data-f='day'>" + opts(days, "Day") + "</select><select data-f='year'>" + opts(years, "Year") + "</select></div>" +
        "<button class='btn' type='button'>Reveal My Numerology</button>" +
        "<div class='err' role='alert'></div>" +
      "</div>" +
      "<div class='res' aria-live='polite'></div>";
    mount.appendChild(el);

    var $ = function (s) { return el.querySelector(s); };
    var form = $(".form"), res = $(".res"), err = $(".err");
    function val(n) { return $("[data-f='" + n + "']").value; }
    function masterBadge(n) { return MASTERS[n] ? " <span class='badge b-master' style='vertical-align:middle'>Master</span>" : ""; }

    $(".btn").addEventListener("click", function () {
      var name = val("name").trim(), m = +val("month"), d = +val("day"), y = +val("year");
      if (!/[a-zA-Z]/.test(name)) { err.textContent = "Please enter your full name."; err.classList.add("show"); return; }
      if (!m || !d || !y) { err.textContent = "Please select your full birth date."; err.classList.add("show"); return; }
      if (d > new Date(y, m, 0).getDate()) { err.textContent = "That day does not exist in the selected month."; err.classList.add("show"); return; }
      err.classList.remove("show");
      var r = compute(m, d, y, name), p = PROFILES[r.lifePath];
      var badges = "";
      if (MASTERS[r.lifePath]) badges += "<span class='badge b-master'>Master Number</span>";
      if (r.karmic) badges += "<span class='badge b-karmic'>Karmic Debt " + r.karmic + "</span>";

      function ncard(k, v, desc) { return "<div class='ncard'><div class='k'>" + k + "</div><div class='v'>" + v + "</div><div class='d'>" + desc + "</div></div>"; }
      var core = ncard("Expression", r.expression, "You are " + EXPRESS[r.expression] + ".") +
        ncard("Soul Urge", r.soul, "At heart you crave " + SOUL[r.soul] + ".") +
        ncard("Personality", r.personality, "Others see you as " + PERSON[r.personality] + ".") +
        ncard("Birthday", r.birthday, "Your natural gift is " + BIRTHDAY[r.birthday] + ".") +
        ncard("Maturity", r.maturity, "In time you grow toward " + MATURITY[r.maturity] + ".") +
        ncard("Life Path", r.lifePath, p.name + ", your core purpose.");

      var pins = r.pinnacles.map(function (x, i) {
        var active = r.age >= x.from && (x.to === null || r.age <= x.to);
        var ages = x.to === null ? (x.from + "+") : (x.from + " to " + x.to);
        return "<div class='pin" + (active ? " active" : "") + "'><div class='pinnum'><div class='pn'>" + x.p + "</div><div class='ages'>ages " + ages + "</div></div>" +
          "<div class='pinbody'><div class='pt'>Pinnacle " + (i + 1) + ": " + PINNACLE[x.p] + (active ? "<span class='nowtag'>You are here</span>" : "") + "</div>" +
          "<div class='ch'>Challenge " + x.c + ": " + CHALLENGE[x.c] + "</div></div></div>";
      }).join("");

      var favDays = []; for (var dd = 1; dd <= 31; dd++) if (reduceToSingle(dd) === r.lifePathSingle) favDays.push(dd);
      var lucky = [r.lifePath, r.expression, r.birthday].filter(function (v, i, a) { return a.indexOf(v) === i; });

      res.innerHTML =
        "<div class='sublabel'>Your Life Path</div><div class='num'>" + r.lifePath + "</div><div class='pname'>" + p.name + "</div>" +
        (badges ? "<div class='badges'>" + badges + "</div>" : "") +
        "<div class='calc'>" + r.mr + " + " + r.dr + " + " + r.yr + " = " + r.total + (r.total !== r.lifePath ? " which reduces to " + r.lifePath : "") + "</div>" +
        "<p class='essence'>" + p.essence + "</p>" +
        "<div class='cols'>" +
          "<div class='cell'><h4>Strengths</h4><ul>" + p.strengths.map(function (s) { return "<li>" + s + "</li>"; }).join("") + "</ul></div>" +
          "<div class='cell'><h4>Challenges</h4><ul>" + p.challenges.map(function (s) { return "<li>" + s + "</li>"; }).join("") + "</ul></div>" +
          "<div class='cell'><h4>Career</h4><p>" + p.career + "</p></div>" +
          "<div class='cell'><h4>Love</h4><p>" + p.love + "</p></div>" +
        "</div>" +
        (r.karmic ? "<div class='cell' style='max-width:720px;margin:14px auto 0'><h4>Karmic Debt</h4><p>" + KARMIC[r.karmic] + "</p></div>" : "") +
        "<h3>Your Personalized Reading</h3><div class='ai-reading-slot'></div>" +
        "<h3>Your Core Numbers</h3><div class='core'>" + core + "</div>" +
        "<h3>Where You Are Now</h3><div class='cycles'>" +
          "<div class='cyc'><h4>Personal Year</h4><div class='cv'>" + r.personalYear + "</div><p>" + PY[r.personalYear] + "</p></div>" +
          "<div class='cyc'><h4>This Month</h4><div class='cv'>" + r.personalMonth + "</div><p>A month to " + CYCLE[r.personalMonth] + ".</p></div>" +
          "<div class='cyc'><h4>Today</h4><div class='cv'>" + r.personalDay + "</div><p>A day to " + CYCLE[r.personalDay] + ".</p></div>" +
        "</div>" +
        "<h3>Your Life Cycles</h3><div class='timeline'>" + pins + "</div>" +
        "<h3>Lucky Numbers &amp; Days</h3><div class='lucky'>" +
          "<div class='lk'><div class='k'>Lucky numbers</div><div class='v'>" + lucky.join(" &middot; ") + "</div></div>" +
          "<div class='lk'><div class='k'>Favorable days each month</div><div class='v'>" + favDays.join(", ") + "</div></div>" +
        "</div>" +
        "<h3>Compatibility Check</h3><div class='compat'><p class='intro' style='margin-bottom:12px'>Enter someone's birth date to compare Life Paths.</p>" +
          "<div class='drow'><select data-c='month'>" + opts(months, "Month") + "</select><select data-c='day'>" + opts(days, "Day") + "</select><select data-c='year'>" + opts(years, "Year") + "</select>" +
          "<button class='btn cbtn' type='button' style='padding:13px 24px'>Compare</button></div>" +
          "<div class='cres'></div></div>" +
        "<h3>Ask About Your Numbers</h3><div class='ai-chat-slot'></div>" +
        "<button class='retry' type='button'>&#8592; Start over</button>";
      form.style.display = "none"; res.classList.add("show");

      var lpFacts = function () { return { lifePath: r.lifePath, lifePathName: p.name, expression: r.expression, soulUrge: r.soul, personality: r.personality, birthday: r.birthday, maturity: r.maturity, personalYear: r.personalYear, personalMonth: r.personalMonth, personalDay: r.personalDay, karmicDebt: r.karmic || null }; };
      if (ctx.aiReading) ctx.aiReading(res.querySelector(".ai-reading-slot"), "numerology", lpFacts, { title: "Your Numbers, Woven Together", label: "Reveal your personalized reading", hint: "A reading grounded in your specific numbers." });
      if (ctx.aiChat) ctx.aiChat(res.querySelector(".ai-chat-slot"), "numerology", lpFacts, { title: "Ask about your numbers", placeholder: "e.g. How do my Life Path and Expression work together?" });

      var cres = res.querySelector(".cres");
      res.querySelector(".cbtn").addEventListener("click", function () {
        var cm = +res.querySelector("[data-c='month']").value, cd = +res.querySelector("[data-c='day']").value, cy = +res.querySelector("[data-c='year']").value;
        if (!cm || !cd || !cy) { cres.classList.add("show"); cres.innerHTML = "<p>Please select a full date to compare.</p>"; return; }
        var their = reduceKeepMaster(reduceKeepMaster(cm) + reduceKeepMaster(cd) + reduceKeepMaster(cy));
        var c = compat(r.lifePath, their);
        cres.classList.add("show");
        cres.innerHTML = "<div class='ct'>" + c.tier + "</div><p>Your Life Path " + r.lifePath + " with their Life Path " + their + ": " + c.note + "</p>";
      });
      res.querySelector(".retry").addEventListener("click", function () { res.classList.remove("show"); res.innerHTML = ""; form.style.display = ""; });
    });
  }

  window.__PSHUB__ = window.__PSHUB__ || { _reg: {}, _waiters: {}, register: function (id, def) { this._reg[id] = def; (this._waiters[id] || []).forEach(function (fn) { fn(def); }); this._waiters[id] = []; } };
  window.__PSHUB__.register("life-path", { title: "Numerology Profile", render: render });
})();
