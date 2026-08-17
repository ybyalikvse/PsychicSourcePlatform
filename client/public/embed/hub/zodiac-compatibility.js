/* Zodiac Compatibility (synastry) - hub tool module.
 * Real synastry between two birth dates: computes each person's Sun, Moon,
 * Venus, and Mars, then scores the inter-aspects between the two charts across
 * four categories, with a written synthesis. Planets computed at noon UTC
 * (no birth time/place needed); the Moon is therefore approximate.
 */
(function () {
  "use strict";

  var SIGNS = ["Aries","Taurus","Gemini","Cancer","Leo","Virgo","Libra","Scorpio","Sagittarius","Capricorn","Aquarius","Pisces"];
  var GLYPHS = ["♈","♉","♊","♋","♌","♍","♎","♏","♐","♑","♒","♓"];
  var D2R = Math.PI / 180;
  function mod360(x) { return ((x % 360) + 360) % 360; }
  function T_of(ms) { return (ms / 86400000 + 2440587.5 - 2451545.0) / 36525; }
  var EL = {
    Venus:{b:[0.72333566,0.00677672,3.39467605,181.97909950,131.60246718,76.67984255],r:[0.00000390,-0.00004107,-0.00078890,58517.81538729,0.00268329,-0.27769418]},
    EMB:{b:[1.00000261,0.01671123,-0.00001531,100.46457166,102.93768193,0.0],r:[0.00000562,-0.00004392,-0.01294668,35999.37244981,0.32327364,0.0]},
    Mars:{b:[1.52371034,0.09339410,1.84969142,-4.55343205,-23.94362959,49.55953891],r:[0.00001847,0.00007882,-0.00813131,19140.30268499,0.44441088,-0.29257343]}
  };
  function helio(name, T) {
    var el = EL[name];
    var a=el.b[0]+el.r[0]*T, e=el.b[1]+el.r[1]*T, I=(el.b[2]+el.r[2]*T)*D2R, L=el.b[3]+el.r[3]*T, wBar=el.b[4]+el.r[4]*T, node=el.b[5]+el.r[5]*T;
    var M = mod360(L - wBar); if (M > 180) M -= 360;
    var w=(wBar-node)*D2R, nodeR=node*D2R, eStar=e/D2R, E=M+eStar*Math.sin(M*D2R);
    for (var i=0;i<30;i++){var dM=M-(E-eStar*Math.sin(E*D2R)),dE=dM/(1-e*Math.cos(E*D2R));E+=dE;if(Math.abs(dE)<1e-9)break;}
    var Er=E*D2R, xp=a*(Math.cos(Er)-e), yp=a*Math.sqrt(1-e*e)*Math.sin(Er);
    var cw=Math.cos(w),sw=Math.sin(w),cn=Math.cos(nodeR),sn=Math.sin(nodeR),ci=Math.cos(I),si=Math.sin(I);
    return { x:(cw*cn-sw*sn*ci)*xp+(-sw*cn-cw*sn*ci)*yp, y:(cw*sn+sw*cn*ci)*xp+(-sw*sn+cw*cn*ci)*yp };
  }
  function precession(T) { return (5029.0966*T + 1.11113*T*T)/3600; }
  function planetLon(name, ms) { var T=T_of(ms), e=helio("EMB",T), p=helio(name,T); return mod360(mod360(Math.atan2(p.y-e.y,p.x-e.x)/D2R)+precession(T)); }
  function sunLon(ms){var T=T_of(ms);var L0=mod360(280.46646+36000.76983*T+0.0003032*T*T);var M=mod360(357.52911+35999.05029*T-0.0001537*T*T)*D2R;var C=(1.914602-0.004817*T-0.000014*T*T)*Math.sin(M)+(0.019993-0.000101*T)*Math.sin(2*M)+0.000289*Math.sin(3*M);return mod360(L0+C);}
  var LT=[[0,0,1,0,6288774],[2,0,-1,0,1274027],[2,0,0,0,658314],[0,0,2,0,213618],[0,1,0,0,-185116],[0,0,0,2,-114332],[2,0,-2,0,58793],[2,-1,-1,0,57066],[2,0,1,0,53322],[2,-1,0,0,45758],[0,1,-1,0,-40923],[1,0,0,0,-34720],[0,1,1,0,-30383],[2,0,0,-2,15327],[0,0,1,2,-12528],[0,0,1,-2,10980],[4,0,-1,0,10675],[0,0,3,0,10034],[4,0,-2,0,8548],[2,1,-1,0,-7888],[2,1,0,0,-6766],[1,0,-1,0,-5163],[1,1,0,0,4987],[2,-1,1,0,4036],[2,0,2,0,3994],[4,0,0,0,3861],[2,0,-3,0,3665],[0,1,-2,0,-2689],[2,0,-1,2,-2602],[2,-1,-2,0,2390],[1,0,1,0,-2348],[2,-2,0,0,2236],[0,1,2,0,-2120],[0,2,0,0,-2069],[2,-2,-1,0,2048]];
  function moonLon(ms){var T=T_of(ms);var Lp=mod360(218.3164477+481267.88123421*T-0.0015786*T*T);var D=mod360(297.8501921+445267.1114034*T-0.0018819*T*T);var M=mod360(357.5291092+35999.0502909*T-0.0001536*T*T);var Mp=mod360(134.9633964+477198.8675055*T+0.0087414*T*T);var F=mod360(93.2720950+483202.0175233*T-0.0036539*T*T);var E=1-0.002516*T,s=0;for(var i=0;i<LT.length;i++){var t=LT[i],c=t[4];if(t[1]===1||t[1]===-1)c*=E;else if(t[1]===2||t[1]===-2)c*=E*E;s+=c*Math.sin((t[0]*D+t[1]*M+t[2]*Mp+t[3]*F)*D2R);}return mod360(Lp+s/1e6);}
  function signIdx(lon){ return Math.floor(mod360(lon)/30); }

  function chartFor(m, d, y) {
    var ms = Date.UTC(y, m - 1, d, 12, 0, 0);
    return { sun: sunLon(ms), moon: moonLon(ms), venus: planetLon("Venus", ms), mars: planetLon("Mars", ms) };
  }
  function sepAngle(a, b) { var x = Math.abs(mod360(a - b)); return x > 180 ? 360 - x : x; }
  function aspectH(a, b) {
    var d = sepAngle(a, b);
    if (d <= 8) return 1.5;               // conjunction
    if (Math.abs(d - 120) <= 8) return 2; // trine
    if (Math.abs(d - 60) <= 6) return 1;  // sextile
    if (Math.abs(d - 90) <= 7) return -1.5; // square
    if (Math.abs(d - 180) <= 8) return -0.5; // opposition (magnetic but tense)
    return 0;
  }
  function ELEMENT(i) { return [0,1,2,3,0,1,2,3,0,1,2,3][i]; } // 0 fire 1 earth 2 air 3 water
  function elementScore(iA, iB) {
    var eA = ELEMENT(iA), eB = ELEMENT(iB);
    if (eA === eB) return 1.5;
    var comp = (eA + eB) % 2 === 0; // fire(0)+air(2) or earth(1)+water(3)
    if (comp && Math.abs(eA - eB) === 2) return 1.5; // fire-air / earth-water feed each other
    if (!comp) return -1; // fire-water / earth-air clash
    return 0; // fire-earth / air-water: different tempos
  }
  function elementWord(iA, iB) {
    var eA = ELEMENT(iA), eB = ELEMENT(iB);
    if (eA === eB) return "share the same element, giving you an easy, instinctive rapport";
    if ((eA + eB) % 2 === 0 && Math.abs(eA - eB) === 2) return "carry elements that naturally feed each other";
    if ((eA + eB) % 2 !== 0) return "carry elements that can clash and ask you to learn each other's language";
    return "move at different tempos that can either balance or frustrate you";
  }

  function score(pairs) { var s = 0; pairs.forEach(function (p) { s += aspectH(p[0], p[1]); }); return s; }
  function band(v) { return v >= 85 ? "Exceptional" : v >= 70 ? "Strong" : v >= 55 ? "Good" : v >= 42 ? "Workable" : "Challenging"; }
  function toPct(sum, base) { return Math.max(25, Math.min(98, Math.round((base || 55) + sum * 8))); }

  function synth(A, B, cats, overall, nameA, nameB) {
    var elt = elementWord(signIdx(A.sun), signIdx(B.sun));
    var order = cats.slice().sort(function (a, b) { return b.v - a.v; });
    var top = order[0], low = order[order.length - 1];
    var verdict = overall >= 85 ? "This is a rare and powerful connection." :
      overall >= 72 ? "This is a strong, promising match." :
      overall >= 58 ? "This is a good match with real potential." :
      overall >= 45 ? "This is a workable pairing that rewards genuine effort." :
      "This is a challenging match that will ask for patience from you both.";
    return verdict + " Your Sun signs " + elt + ". Your greatest strength together is " + top.label.toLowerCase() +
      ", where the two charts click naturally. The area that will need the most care is " + low.label.toLowerCase() +
      "; give it attention and honesty and it can become a source of growth rather than friction. " +
      "Remember this reading is drawn from birth dates alone, so exact birth times would refine the emotional picture even further.";
  }

  function render(mount, ctx) {
    var GOLD = ctx.gold, FONT = ctx.font;
    ctx.injectStyle("zc", "" +
      ".zc{color:var(--ps-text);font-family:" + FONT + ";text-align:center}" +
      ".zc .intro{font-size:18px;max-width:600px;margin:0 auto 24px;color:var(--ps-text)}" +
      ".zc .people{display:flex;gap:20px;justify-content:center;flex-wrap:wrap;margin-bottom:8px}" +
      ".zc .person{background:var(--ps-panel);border:1px solid var(--ps-border);border-radius:16px;padding:18px 20px;min-width:220px}" +
      ".zc .person h4{font-size:13px;letter-spacing:1.5px;text-transform:uppercase;color:" + GOLD + ";margin-bottom:12px}" +
      ".zc input[type=text]{width:100%;padding:11px 13px;font-size:15px;font-family:" + FONT + ";color:var(--ps-text);background:var(--ps-panel);border:1.5px solid var(--ps-border);border-radius:8px;outline:none;text-align:center;margin-bottom:10px}" +
      ".zc input::placeholder{color:var(--ps-muted)}" +
      ".zc .drow{display:flex;gap:8px;justify-content:center}" +
      ".zc select{appearance:none;-webkit-appearance:none;padding:11px 28px 11px 12px;font-size:15px;font-family:" + FONT + ";color:var(--ps-text);background-color:#fff;border:1.5px solid var(--ps-border);border-radius:8px;outline:none;cursor:pointer;background-image:url(\"data:image/svg+xml;charset=utf-8,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='7'%3E%3Cpath d='M1 1l4 4 4-4' stroke=%27%23999%27 stroke-width='1.5' fill='none'/%3E%3C/svg%3E\");background-repeat:no-repeat;background-position:right 9px center}" +
      ".zc select option{color:#1c1c2e;background:#fff}" +
      ".zc .btn{margin-top:20px;font-family:" + FONT + ";font-size:18px;font-weight:600;color:var(--ps-on);background:" + GOLD + ";border:none;border-radius:999px;padding:14px 42px;cursor:pointer;box-shadow:0 4px 16px rgba(0,0,0,.10);transition:transform .15s ease}" +
      ".zc .btn:hover{transform:translateY(-1px)}" +
      ".zc .err{display:none;margin-top:12px;color:var(--ps-accent);font-size:15px}.zc .err.show{display:block}" +
      ".zc .res{display:none}.zc .res.show{display:block;animation:zcf .4s ease}@keyframes zcf{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:none}}" +
      ".zc .score{font-family:'Great Vibes',cursive;font-size:clamp(80px,16vw,140px);line-height:1;color:" + GOLD + ";text-shadow:0 3px 18px rgba(0,0,0,.10)}" +
      ".zc .verdict{font-size:20px;font-weight:600;margin-bottom:6px}" +
      ".zc .signs{display:flex;gap:26px;justify-content:center;flex-wrap:wrap;margin:16px 0 26px}" +
      ".zc .scol h5{font-size:13px;letter-spacing:1px;text-transform:uppercase;color:var(--ps-muted);margin-bottom:8px}" +
      ".zc .sline{font-size:15px;color:var(--ps-text);margin:3px 0}" +
      ".zc .sline b{color:" + GOLD + ";font-weight:600}" +
      ".zc .cats{max-width:620px;margin:0 auto;text-align:left}" +
      ".zc .cat{margin-bottom:16px}" +
      ".zc .cattop{display:flex;justify-content:space-between;font-size:15px;margin-bottom:6px}" +
      ".zc .cattop .cv{color:" + GOLD + ";font-weight:700}" +
      ".zc .track{height:10px;background:var(--ps-panel);border-radius:999px;overflow:hidden}" +
      ".zc .fill{height:100%;background:" + GOLD + ";border-radius:999px;transition:width .8s ease}" +
      ".zc .catd{font-size:13px;color:var(--ps-muted);margin-top:4px}" +
      ".zc .synth{max-width:640px;margin:24px auto 0;font-size:16.5px;line-height:1.7;color:var(--ps-text)}" +
      ".zc .retry{display:block;margin:24px auto 0;font-size:15px;font-weight:700;letter-spacing:1px;color:" + GOLD + ";background:none;border:none;cursor:pointer;font-family:" + FONT + "}");

    var mn = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
    function opts(list, ph) { var s = "<option value=''>" + ph + "</option>"; list.forEach(function (o) { s += "<option value='" + o[0] + "'>" + o[1] + "</option>"; }); return s; }
    var months = mn.map(function (m, i) { return [i + 1, m]; });
    var days = []; for (var i = 1; i <= 31; i++) days.push([i, i]);
    var years = []; var yr = new Date().getFullYear(); for (var y = yr; y >= 1920; y--) years.push([y, y]);
    function personHtml(k, label, ph) {
      return "<div class='person'><h4>" + label + "</h4>" +
        "<input type='text' data-f='" + k + "-name' placeholder='" + ph + "' autocomplete='off'>" +
        "<div class='drow'><select data-f='" + k + "-m'>" + opts(months, "Mon") + "</select>" +
        "<select data-f='" + k + "-d'>" + opts(days, "Day") + "</select>" +
        "<select data-f='" + k + "-y'>" + opts(years, "Year") + "</select></div></div>";
    }

    var el = document.createElement("div"); el.className = "zc";
    el.innerHTML =
      "<div class='form'>" +
        "<p class='intro'>True compatibility is more than Sun signs. Enter two birth dates and we will compare both charts across the Sun, Moon, Venus, and Mars to reveal how you really fit together.</p>" +
        "<div class='people'>" + personHtml("a", "You", "Your name (optional)") + personHtml("b", "Your Match", "Their name (optional)") + "</div>" +
        "<button class='btn' type='button'>Reveal Our Compatibility</button>" +
        "<div class='err' role='alert'></div>" +
      "</div>" +
      "<div class='res' aria-live='polite'></div>";
    mount.appendChild(el);

    var $ = function (s) { return el.querySelector(s); };
    function val(n) { return $("[data-f='" + n + "']").value; }
    var err = $(".err"), form = $(".form"), res = $(".res");

    function signLine(planet, lon) { var i = signIdx(lon); return "<div class='sline'>" + planet + " <b>" + GLYPHS[i] + "︎ " + SIGNS[i] + "</b></div>"; }

    $(".btn").addEventListener("click", function () {
      var am = +val("a-m"), ad = +val("a-d"), ay = +val("a-y"), bm = +val("b-m"), bd = +val("b-d"), by = +val("b-y");
      if (!am || !ad || !ay || !bm || !bd || !by) { err.textContent = "Please enter both full birth dates."; err.classList.add("show"); return; }
      if (ad > new Date(ay, am, 0).getDate() || bd > new Date(by, bm, 0).getDate()) { err.textContent = "One of those days does not exist in its month."; err.classList.add("show"); return; }
      err.classList.remove("show");
      var nameA = (val("a-name") || "You").trim(), nameB = (val("b-name") || "Your Match").trim();
      var A = chartFor(am, ad, ay), B = chartFor(bm, bd, by);

      var romance = score([[A.venus, B.mars], [A.mars, B.venus], [A.sun, B.venus], [A.venus, B.sun]]);
      var emotional = score([[A.moon, B.moon], [A.sun, B.moon], [A.moon, B.sun]]);
      var passion = score([[A.mars, B.mars], [A.mars, B.venus], [A.venus, B.mars], [A.sun, B.mars], [A.mars, B.sun]]);
      var longterm = score([[A.sun, B.sun], [A.moon, B.moon], [A.sun, B.moon], [A.moon, B.sun], [A.venus, B.venus]]) + elementScore(signIdx(A.sun), signIdx(B.sun));

      var cats = [
        { label: "Romance & Attraction", v: toPct(romance, 55), d: "Venus and Mars: how strongly you are drawn to each other." },
        { label: "Emotional Connection", v: toPct(emotional, 55), d: "Sun and Moon: how safe and understood you feel together." },
        { label: "Passion & Chemistry", v: toPct(passion, 54), d: "Mars energy: the spark, drive, and physical pull." },
        { label: "Long-Term Harmony", v: toPct(longterm, 55), d: "The staying power and day-to-day ease of the bond." }
      ];
      var overall = Math.round(cats.reduce(function (a, c) { return a + c.v; }, 0) / cats.length);

      res.innerHTML =
        "<div class='score'>" + overall + "%</div>" +
        "<div class='verdict'>" + band(overall) + " Match</div>" +
        "<div class='signs'>" +
          "<div class='scol'><h5>" + esc(nameA) + "</h5>" + signLine("Sun", A.sun) + signLine("Moon", A.moon) + signLine("Venus", A.venus) + signLine("Mars", A.mars) + "</div>" +
          "<div class='scol'><h5>" + esc(nameB) + "</h5>" + signLine("Sun", B.sun) + signLine("Moon", B.moon) + signLine("Venus", B.venus) + signLine("Mars", B.mars) + "</div>" +
        "</div>" +
        "<div class='cats'>" + cats.map(function (c) {
          return "<div class='cat'><div class='cattop'><span>" + c.label + "</span><span class='cv'>" + c.v + "% &middot; " + band(c.v) + "</span></div>" +
            "<div class='track'><div class='fill' style='width:" + c.v + "%'></div></div><div class='catd'>" + c.d + "</div></div>";
        }).join("") + "</div>" +
        "<p class='synth'>" + synth(A, B, cats, overall, nameA, nameB) + "</p>" +
        "<div class='ai-reading-slot'></div>" +
        "<div class='ai-chat-slot'></div>" +
        "<button class='retry' type='button'>&#8592; Try another pairing</button>";
      form.style.display = "none"; res.classList.add("show");
      var sgn = function (l) { return SIGNS[signIdx(l)]; };
      var zcFacts = function () { return {
        personA: { name: nameA, sun: sgn(A.sun), moon: sgn(A.moon), venus: sgn(A.venus), mars: sgn(A.mars) },
        personB: { name: nameB, sun: sgn(B.sun), moon: sgn(B.moon), venus: sgn(B.venus), mars: sgn(B.mars) },
        scores: { overall: overall, romance: cats[0].v, emotional: cats[1].v, passion: cats[2].v, longTerm: cats[3].v }
      }; };
      if (ctx.aiReading) ctx.aiReading(res.querySelector(".ai-reading-slot"), "compatibility", zcFacts, { title: "Your Relationship Report", label: "Get your full relationship report", hint: "Grounded in both charts and your category scores." });
      if (ctx.aiChat) ctx.aiChat(res.querySelector(".ai-chat-slot"), "compatibility", zcFacts, { title: "Ask about your connection", placeholder: "e.g. Where will we clash, and how do we handle it?" });
      res.querySelector(".retry").addEventListener("click", function () { res.classList.remove("show"); res.innerHTML = ""; form.style.display = ""; });
    });
    function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); }
  }

  window.__PSHUB__ = window.__PSHUB__ || { _reg: {}, _waiters: {}, register: function (id, def) { this._reg[id] = def; (this._waiters[id] || []).forEach(function (fn) { fn(def); }); this._waiters[id] = []; } };
  window.__PSHUB__.register("zodiac-compatibility", { title: "Zodiac Compatibility", render: render });
})();
