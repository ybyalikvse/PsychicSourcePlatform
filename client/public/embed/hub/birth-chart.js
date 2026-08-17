/* Birth Chart (advanced) - hub tool module.
 * Reuses the validated 10-planet engine (JPL Standish elements, Meeus Sun/Moon,
 * Placidus houses) and adds: aspects with orbs, an aspect grid, chart ruler,
 * dominant element and modality, and per-placement interpretations.
 * Needs birth time + place (city search via /api/calculators/cities).
 */
(function () {
  "use strict";

  var SIGNS = ["Aries","Taurus","Gemini","Cancer","Leo","Virgo","Libra","Scorpio","Sagittarius","Capricorn","Aquarius","Pisces"];
  var SIGN_GLYPH = ["♈","♉","♊","♋","♌","♍","♎","♏","♐","♑","♒","♓"];
  var PLANETS = [
    { key: "Sun", glyph: "☉" }, { key: "Moon", glyph: "☽" }, { key: "Mercury", glyph: "☿" },
    { key: "Venus", glyph: "♀" }, { key: "Mars", glyph: "♂" }, { key: "Jupiter", glyph: "♃" },
    { key: "Saturn", glyph: "♄" }, { key: "Uranus", glyph: "♅" }, { key: "Neptune", glyph: "♆" }, { key: "Pluto", glyph: "♇" }
  ];
  function tzOffsetMs(tz, utcMs) {
    var dtf = new Intl.DateTimeFormat("en-US", { timeZone: tz, year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false });
    var p = {}; dtf.formatToParts(new Date(utcMs)).forEach(function (x) { p[x.type] = x.value; });
    return Date.UTC(+p.year, +p.month - 1, +p.day, p.hour === "24" ? 0 : +p.hour, +p.minute, +p.second) - utcMs;
  }
  function localToUtcMs(y, mo, d, h, mi, tz) { var wall = Date.UTC(y, mo - 1, d, h, mi, 0), g = wall; for (var i = 0; i < 3; i++) { var n = wall - tzOffsetMs(tz, g); if (n === g) break; g = n; } return g; }
  var D2R = Math.PI / 180;
  function mod360(x) { return ((x % 360) + 360) % 360; }
  function T_of(ms) { return (ms / 86400000 + 2440587.5 - 2451545.0) / 36525; }
  var EL = {
    Mercury:{b:[0.38709927,0.20563593,7.00497902,252.25032350,77.45779628,48.33076593],r:[0.00000037,0.00001906,-0.00594749,149472.67411175,0.16047689,-0.12534081]},
    Venus:{b:[0.72333566,0.00677672,3.39467605,181.97909950,131.60246718,76.67984255],r:[0.00000390,-0.00004107,-0.00078890,58517.81538729,0.00268329,-0.27769418]},
    EMB:{b:[1.00000261,0.01671123,-0.00001531,100.46457166,102.93768193,0.0],r:[0.00000562,-0.00004392,-0.01294668,35999.37244981,0.32327364,0.0]},
    Mars:{b:[1.52371034,0.09339410,1.84969142,-4.55343205,-23.94362959,49.55953891],r:[0.00001847,0.00007882,-0.00813131,19140.30268499,0.44441088,-0.29257343]},
    Jupiter:{b:[5.20288700,0.04838624,1.30439695,34.39644051,14.72847983,100.47390909],r:[-0.00011607,-0.00013253,-0.00183714,3034.74612775,0.21252668,0.20469106],aug:[-0.00012452,0.06064060,-0.35635438,38.35125000]},
    Saturn:{b:[9.53667594,0.05386179,2.48599187,49.95424423,92.59887831,113.66242448],r:[-0.00125060,-0.00050991,0.00193609,1222.49362201,-0.41897216,-0.28867794],aug:[0.00025899,-0.13434469,0.87320147,38.35125000]},
    Uranus:{b:[19.18916464,0.04725744,0.77263783,313.23810451,170.95427630,74.01692503],r:[-0.00196176,-0.00004397,-0.00242939,428.48202785,0.40805281,0.04240589],aug:[0.00058331,-0.97731848,0.17689245,7.67025000]},
    Neptune:{b:[30.06992276,0.00859048,1.77004347,-55.12002969,44.96476227,131.78422574],r:[0.00026291,0.00005105,0.00035372,218.45945325,-0.32241464,-0.00508664],aug:[-0.00041348,0.68346318,-0.10162547,7.67025000]},
    Pluto:{b:[39.48211675,0.24882730,17.14001206,238.92903833,224.06891629,110.30393684],r:[-0.00031596,0.00005170,0.00004818,145.20780515,-0.04062942,-0.01183482],aug:[-0.01262724,0,0,0]}
  };
  function helio(name, T) {
    var el = EL[name];
    var a=el.b[0]+el.r[0]*T, e=el.b[1]+el.r[1]*T, I=(el.b[2]+el.r[2]*T)*D2R, L=el.b[3]+el.r[3]*T, wBar=el.b[4]+el.r[4]*T, node=el.b[5]+el.r[5]*T;
    var M = L - wBar; if (el.aug) { M += el.aug[0]*T*T + el.aug[1]*Math.cos(el.aug[3]*T*D2R) + el.aug[2]*Math.sin(el.aug[3]*T*D2R); }
    M = mod360(M); if (M > 180) M -= 360;
    var w=(wBar-node)*D2R, nodeR=node*D2R, eStar=e/D2R, E=M+eStar*Math.sin(M*D2R);
    for (var i=0;i<30;i++){var dM=M-(E-eStar*Math.sin(E*D2R)),dE=dM/(1-e*Math.cos(E*D2R));E+=dE;if(Math.abs(dE)<1e-9)break;}
    var Er=E*D2R, xp=a*(Math.cos(Er)-e), yp=a*Math.sqrt(1-e*e)*Math.sin(Er);
    var cw=Math.cos(w),sw=Math.sin(w),cn=Math.cos(nodeR),sn=Math.sin(nodeR),ci=Math.cos(I);
    return { x:(cw*cn-sw*sn*ci)*xp+(-sw*cn-cw*sn*ci)*yp, y:(cw*sn+sw*cn*ci)*xp+(-sw*sn+cw*cn*ci)*yp };
  }
  function precession(T) { return (5029.0966*T + 1.11113*T*T)/3600; }
  function planetLon(name, ms) { var T=T_of(ms), e=helio("EMB",T), p=helio(name,T); return mod360(mod360(Math.atan2(p.y-e.y,p.x-e.x)/D2R)+precession(T)); }
  function sunLon(ms){var T=T_of(ms);var L0=mod360(280.46646+36000.76983*T+0.0003032*T*T);var M=mod360(357.52911+35999.05029*T-0.0001537*T*T)*D2R;var C=(1.914602-0.004817*T-0.000014*T*T)*Math.sin(M)+(0.019993-0.000101*T)*Math.sin(2*M)+0.000289*Math.sin(3*M);return mod360(L0+C);}
  var LT=[[0,0,1,0,6288774],[2,0,-1,0,1274027],[2,0,0,0,658314],[0,0,2,0,213618],[0,1,0,0,-185116],[0,0,0,2,-114332],[2,0,-2,0,58793],[2,-1,-1,0,57066],[2,0,1,0,53322],[2,-1,0,0,45758],[0,1,-1,0,-40923],[1,0,0,0,-34720],[0,1,1,0,-30383],[2,0,0,-2,15327],[0,0,1,2,-12528],[0,0,1,-2,10980],[4,0,-1,0,10675],[0,0,3,0,10034],[4,0,-2,0,8548],[2,1,-1,0,-7888],[2,1,0,0,-6766],[1,0,-1,0,-5163],[1,1,0,0,4987],[2,-1,1,0,4036],[2,0,2,0,3994],[4,0,0,0,3861],[2,0,-3,0,3665],[0,1,-2,0,-2689],[2,0,-1,2,-2602],[2,-1,-2,0,2390],[1,0,1,0,-2348],[2,-2,0,0,2236],[0,1,2,0,-2120],[0,2,0,0,-2069],[2,-2,-1,0,2048]];
  function moonLon(ms){var T=T_of(ms);var Lp=mod360(218.3164477+481267.88123421*T-0.0015786*T*T);var D=mod360(297.8501921+445267.1114034*T-0.0018819*T*T);var M=mod360(357.5291092+35999.0502909*T-0.0001536*T*T);var Mp=mod360(134.9633964+477198.8675055*T+0.0087414*T*T);var F=mod360(93.2720950+483202.0175233*T-0.0036539*T*T);var E=1-0.002516*T,s=0;for(var i=0;i<LT.length;i++){var t=LT[i],c=t[4];if(t[1]===1||t[1]===-1)c*=E;else if(t[1]===2||t[1]===-2)c*=E*E;s+=c*Math.sin((t[0]*D+t[1]*M+t[2]*Mp+t[3]*F)*D2R);}return mod360(Lp+s/1e6);}
  function gmst(ms){var jd=ms/86400000+2440587.5,T=(jd-2451545.0)/36525;return mod360(280.46061837+360.98564736629*(jd-2451545.0)+0.000387933*T*T-T*T*T/38710000);}
  function obliq(ms){var T=T_of(ms);return 23.4392911-0.0130042*T-1.64e-7*T*T+5.04e-7*T*T*T;}
  function eclFromRa(ra,eps){ra*=D2R;eps*=D2R;return mod360(Math.atan2(Math.sin(ra),Math.cos(ra)*Math.cos(eps))/D2R);}
  function decFromEcl(lam,eps){return Math.asin(Math.sin(lam*D2R)*Math.sin(eps*D2R))/D2R;}
  function ascendant(ms,lat,lon){var ramc=mod360(gmst(ms)+lon)*D2R,eps=obliq(ms)*D2R,phi=lat*D2R;return mod360(Math.atan2(Math.cos(ramc),-(Math.sin(ramc)*Math.cos(eps)+Math.tan(phi)*Math.sin(eps)))/D2R);}
  function placidusCusp(ramc,lat,eps,off,frac,noct){var ra=mod360(ramc+off);for(var i=0;i<60;i++){var lam=eclFromRa(ra,eps),dec=decFromEcl(lam,eps),cosH=-Math.tan(lat*D2R)*Math.tan(dec*D2R);cosH=Math.max(-1,Math.min(1,cosH));var sda=Math.acos(cosH)/D2R;var target=noct?mod360(ramc+180-frac*(180-sda)):mod360(ramc+frac*sda);if(Math.abs(mod360(target-ra+180)-180)<1e-7){ra=target;break;}ra=target;}return eclFromRa(ra,eps);}
  function cusps(ms,lat,lon){var eps=obliq(ms),ramc=mod360(gmst(ms)+lon),c=new Array(13);c[1]=ascendant(ms,lat,lon);c[10]=eclFromRa(ramc,eps);c[11]=placidusCusp(ramc,lat,eps,30,1/3,false);c[12]=placidusCusp(ramc,lat,eps,60,2/3,false);c[2]=placidusCusp(ramc,lat,eps,120,2/3,true);c[3]=placidusCusp(ramc,lat,eps,150,1/3,true);c[4]=mod360(c[10]+180);c[5]=mod360(c[11]+180);c[6]=mod360(c[12]+180);c[7]=mod360(c[1]+180);c[8]=mod360(c[2]+180);c[9]=mod360(c[3]+180);return c;}
  function houseOf(lon,c){for(var h=1;h<=12;h++){var a=c[h],b=c[h===12?1:h+1];if(mod360(lon-a)<mod360(b-a))return h;}return 12;}
  function signIdx(lon){return Math.floor(mod360(lon)/30);}
  function signStr(lon){var i=signIdx(lon);var d=mod360(lon)%30;return { sign: SIGNS[i], glyph: SIGN_GLYPH[i], deg: Math.floor(d), min: Math.floor((d%1)*60), idx: i };}
  function computeChart(y,mo,d,h,mi,tz,lat,lon){var utc=localToUtcMs(y,mo,d,h,mi,tz);var c=cusps(utc,lat,lon);var bodies=PLANETS.map(function(p){var lonv=p.key==="Sun"?sunLon(utc):p.key==="Moon"?moonLon(utc):planetLon(p.key,utc);return{key:p.key,glyph:p.glyph,lon:lonv,house:houseOf(lonv,c)};});return{cusps:c,bodies:bodies,asc:c[1],mc:c[10]};}

  function pt(cx, cy, r, lonDeg, ascLon){var theta=(lonDeg-ascLon+180)*D2R;return [cx+r*Math.cos(theta),cy-r*Math.sin(theta)];}
  function wheelSvg(chart) {
    var S=600,cx=300,cy=300,asc=chart.asc,Rout=288,Rsign=250,Rhouse=128,Rplanet=205,Rsignglyph=269,Rhousenum=112;
    var GOLD="#a5121b",LINE="rgba(0,0,0,.20)",LINE2="rgba(0,0,0,.42)";
    var s="<svg viewBox='0 0 "+S+" "+S+"' xmlns='http://www.w3.org/2000/svg' font-family='Segoe UI,Helvetica,Arial,sans-serif'>";
    [Rout,Rsign,Rhouse].forEach(function(r){s+="<circle cx='"+cx+"' cy='"+cy+"' r='"+r+"' fill='none' stroke='"+LINE+"' stroke-width='1.2'/>";});
    for(var i=0;i<12;i++){var b0=pt(cx,cy,Rsign,i*30,asc),b1=pt(cx,cy,Rout,i*30,asc);s+="<line x1='"+b0[0].toFixed(1)+"' y1='"+b0[1].toFixed(1)+"' x2='"+b1[0].toFixed(1)+"' y2='"+b1[1].toFixed(1)+"' stroke='"+LINE+"' stroke-width='1'/>";var g=pt(cx,cy,Rsignglyph,i*30+15,asc);s+="<text x='"+g[0].toFixed(1)+"' y='"+g[1].toFixed(1)+"' fill='"+GOLD+"' font-size='24' text-anchor='middle' dominant-baseline='central'>"+SIGN_GLYPH[i]+"︎</text>";}
    for(var hh=1;hh<=12;hh++){var isAngle=(hh===1||hh===4||hh===7||hh===10);var a0=pt(cx,cy,Rhouse,chart.cusps[hh],asc),a1=pt(cx,cy,Rsign,chart.cusps[hh],asc);s+="<line x1='"+a0[0].toFixed(1)+"' y1='"+a0[1].toFixed(1)+"' x2='"+a1[0].toFixed(1)+"' y2='"+a1[1].toFixed(1)+"' stroke='"+(isAngle?GOLD:LINE)+"' stroke-width='"+(isAngle?2:1)+"'/>";var midLon=chart.cusps[hh]+mod360(chart.cusps[hh===12?1:hh+1]-chart.cusps[hh])/2;var hn=pt(cx,cy,Rhousenum,midLon,asc);s+="<text x='"+hn[0].toFixed(1)+"' y='"+hn[1].toFixed(1)+"' fill='rgba(0,0,0,.5)' font-size='13' text-anchor='middle' dominant-baseline='central'>"+hh+"</text>";}
    var ascP=pt(cx,cy,Rsign-16,chart.asc,asc);s+="<text x='"+ascP[0].toFixed(1)+"' y='"+ascP[1].toFixed(1)+"' fill='"+GOLD+"' font-size='13' font-weight='700' text-anchor='middle' dominant-baseline='central'>ASC</text>";
    var mcP=pt(cx,cy,Rsign-16,chart.mc,asc);s+="<text x='"+mcP[0].toFixed(1)+"' y='"+mcP[1].toFixed(1)+"' fill='"+GOLD+"' font-size='13' font-weight='700' text-anchor='middle' dominant-baseline='central'>MC</text>";
    var sorted=chart.bodies.slice().sort(function(a,b){return mod360(a.lon-asc)-mod360(b.lon-asc);});var lastAng=-999,tier=0;
    for(var k=0;k<sorted.length;k++){var p=sorted[k],ang=mod360(p.lon-asc);if(ang-lastAng<9){tier+=1;}else{tier=0;}lastAng=ang;var r=Rplanet-tier*26;var pp=pt(cx,cy,r,p.lon,asc);var tick0=pt(cx,cy,Rsign,p.lon,asc),tick1=pt(cx,cy,Rsign-8,p.lon,asc);s+="<line x1='"+tick0[0].toFixed(1)+"' y1='"+tick0[1].toFixed(1)+"' x2='"+tick1[0].toFixed(1)+"' y2='"+tick1[1].toFixed(1)+"' stroke='"+LINE2+"' stroke-width='1'/>";s+="<text x='"+pp[0].toFixed(1)+"' y='"+pp[1].toFixed(1)+"' fill='#241f1d' font-size='22' text-anchor='middle' dominant-baseline='central'>"+p.glyph+"︎</text>";}
    return s+"</svg>";
  }

  // ---- advanced analysis ----
  function sepAngle(a, b) { var d = Math.abs(mod360(a - b)); return d > 180 ? 360 - d : d; }
  var ASPECTS = [
    { n: "Conjunction", a: 0, o: 8, g: "☌", k: "conj" }, { n: "Sextile", a: 60, o: 5, g: "⚹", k: "harm" },
    { n: "Square", a: 90, o: 6, g: "□", k: "tense" }, { n: "Trine", a: 120, o: 7, g: "△", k: "harm" }, { n: "Opposition", a: 180, o: 7, g: "☍", k: "tense" }
  ];
  function findAspect(l1, l2) { var d = sepAngle(l1, l2), best = null; ASPECTS.forEach(function (A) { var orb = Math.abs(d - A.a); if (orb <= A.o && (!best || orb < best.orb)) best = { A: A, orb: orb }; }); return best; }
  var RULER = ["Mars","Venus","Mercury","Moon","Sun","Mercury","Venus","Mars","Jupiter","Saturn","Saturn","Jupiter"];
  var WEIGHT = { Sun:3, Moon:3, Mercury:2, Venus:2, Mars:2, Jupiter:1, Saturn:1, Uranus:1, Neptune:1, Pluto:1 };
  var ELEMS = ["Fire","Earth","Air","Water"], MODES = ["Cardinal","Fixed","Mutable"];
  var ELEM_DESC = { Fire:"passion, action, and inspiration", Earth:"practicality, patience, and the material world", Air:"ideas, communication, and connection", Water:"emotion, intuition, and depth" };
  var MODE_DESC = { Cardinal:"a natural initiator who likes to start things and lead", Fixed:"steady and determined, with real staying power", Mutable:"adaptable and flexible, comfortable with change" };
  var SIGN_TRAIT = ["bold, direct, and pioneering","steady, sensual, and grounded","curious, quick, and communicative","nurturing, sensitive, and protective","warm, expressive, and proud","precise, helpful, and discerning","gracious, fair, and relationship-focused","intense, deep, and transformative","adventurous, honest, and freedom-loving","disciplined, ambitious, and responsible","original, independent, and forward-thinking","dreamy, compassionate, and intuitive"];
  var PTHEME = { Sun:"core identity", Moon:"emotional nature", Mercury:"mind and communication", Venus:"love and values", Mars:"drive and desire", Jupiter:"growth and luck", Saturn:"discipline and limits", Uranus:"individuality", Neptune:"imagination and spirit", Pluto:"power and transformation" };
  var APHRASE = { Conjunction:"a powerful fusion of", Sextile:"an easy, supportive link between", Square:"dynamic tension between", Trine:"natural harmony between", Opposition:"a balancing pull between" };

  function analyze(chart) {
    var elem = { Fire:0, Earth:0, Air:0, Water:0 }, mode = { Cardinal:0, Fixed:0, Mutable:0 };
    chart.bodies.forEach(function (p) { var i = signIdx(p.lon), w = WEIGHT[p.key] || 1; elem[ELEMS[i % 4]] += w; mode[MODES[i % 3]] += w; });
    var ai = signIdx(chart.asc); elem[ELEMS[ai % 4]] += 3; mode[MODES[ai % 3]] += 3;
    function top(obj) { var best = null; Object.keys(obj).forEach(function (k) { if (!best || obj[k] > obj[best]) best = k; }); return best; }
    var domE = top(elem), domM = top(mode);
    var rulerName = RULER[ai];
    var rulerBody = chart.bodies.filter(function (b) { return b.key === rulerName; })[0];
    // aspects
    var b = chart.bodies, list = [];
    for (var i = 0; i < b.length; i++) for (var j = i + 1; j < b.length; j++) { var f = findAspect(b[i].lon, b[j].lon); if (f) list.push({ p1: b[i], p2: b[j], asp: f.A, orb: f.orb }); }
    list.sort(function (x, y) { return x.orb - y.orb; });
    return { elem: elem, mode: mode, domE: domE, domM: domM, rulerName: rulerName, rulerBody: rulerBody, aspects: list };
  }

  function render(mount, ctx) {
    var GOLD = ctx.gold, FONT = ctx.font, ORIGIN = ctx.origin;
    ctx.injectStyle("bc", "" +
      ".bc{color:var(--ps-text);font-family:" + FONT + "}" +
      ".bc .intro{font-size:18px;text-align:center;max-width:660px;margin:0 auto 24px;color:var(--ps-text)}" +
      ".bc .row{display:flex;align-items:center;gap:12px;margin-bottom:14px;flex-wrap:wrap;justify-content:center}" +
      ".bc .lbl{flex:0 0 108px;text-align:right;font-weight:600;font-size:16px}" +
      ".bc .fields{display:flex;gap:8px;flex:0 1 420px;min-width:240px}" +
      ".bc select,.bc .place{appearance:none;-webkit-appearance:none;width:100%;padding:11px 30px 11px 13px;font-size:16px;font-family:" + FONT + ";color:var(--ps-text);background-color:#fff;border:1.5px solid var(--ps-border);border-radius:8px;outline:none}" +
      ".bc select{background-image:url(\"data:image/svg+xml;charset=utf-8,%3Csvg xmlns='http://www.w3.org/2000/svg' width='11' height='7'%3E%3Cpath d='M1 1l4.5 4.5L10 1' stroke=%27%23999%27 stroke-width='1.5' fill='none'/%3E%3C/svg%3E\");background-repeat:no-repeat;background-position:right 10px center;cursor:pointer}" +
      ".bc select option{color:#1c1c2e;background:#fff}.bc .place::placeholder{color:var(--ps-muted)}" +
      ".bc .placewrap{position:relative;flex:1}" +
      ".bc .drop{position:absolute;top:calc(100% + 2px);left:0;right:0;background:#fff;border-radius:6px;box-shadow:0 10px 30px rgba(0,0,0,.10);z-index:30;max-height:260px;overflow-y:auto;display:none}" +
      ".bc .drop.open{display:block}.bc .opt{padding:12px 15px;font-size:16px;color:#26263a;cursor:pointer;border-bottom:1px solid #efeff4}.bc .opt:hover,.bc .opt.hi{background:#efe9f7}" +
      ".bc .btn{display:block;margin:22px auto 0;font-family:" + FONT + ";font-size:18px;font-weight:600;color:var(--ps-on);background:" + GOLD + ";border:none;border-radius:999px;padding:14px 42px;cursor:pointer;box-shadow:0 4px 16px rgba(0,0,0,.10)}" +
      ".bc .err{display:none;text-align:center;margin-top:14px;color:var(--ps-accent);font-size:15px}.bc .err.show{display:block}" +
      ".bc .res{display:none}.bc .res.show{display:block;animation:bcf .5s ease}@keyframes bcf{from{opacity:0}to{opacity:1}}" +
      ".bc .top{display:flex;gap:26px;align-items:flex-start;flex-wrap:wrap;justify-content:center}" +
      ".bc .wheel{flex:0 0 auto;width:min(440px,92vw)}" +
      ".bc .ptable{flex:1;min-width:260px}.bc .ptable table{width:100%;border-collapse:collapse}" +
      ".bc .ptable td{padding:7px 5px;border-bottom:1px solid var(--ps-border);font-size:15.5px}" +
      ".bc .pg{font-size:18px;width:24px;color:" + GOLD + "}.bc .pn{width:78px}.bc .sg{color:" + GOLD + ";margin-right:4px}.bc .ph{text-align:right;opacity:.7;font-size:13px}" +
      ".bc h3{text-align:center;font-family:'Great Vibes',cursive;font-weight:400;font-size:38px;color:" + GOLD + ";margin:34px 0 16px}" +
      ".bc .big3{display:grid;grid-template-columns:repeat(3,1fr);gap:14px;max-width:760px;margin:0 auto}" +
      "@media(max-width:560px){.bc .big3{grid-template-columns:1fr}}" +
      ".bc .b3{background:var(--ps-panel);border:1px solid var(--ps-border);border-radius:14px;padding:16px 18px;text-align:center}" +
      ".bc .b3 .g{font-size:30px;color:" + GOLD + "}.bc .b3 .t{font-size:13px;letter-spacing:1.5px;text-transform:uppercase;color:var(--ps-muted);margin:4px 0}.bc .b3 .s{font-size:19px;font-weight:600}.bc .b3 p{font-size:14.5px;color:var(--ps-text);margin-top:6px}" +
      ".bc .dom{display:flex;gap:16px;flex-wrap:wrap;justify-content:center;max-width:760px;margin:0 auto}" +
      ".bc .domcard{flex:1;min-width:240px;background:linear-gradient(180deg,rgba(165,18,27,.14),rgba(165,18,27,.04));border:1px solid rgba(165,18,27,.35);border-radius:14px;padding:18px 20px}" +
      ".bc .domcard h4{font-size:13px;letter-spacing:1.5px;text-transform:uppercase;color:" + GOLD + ";margin-bottom:6px}.bc .domcard .v{font-size:22px;font-weight:700;margin-bottom:4px}.bc .domcard p{font-size:15px;color:var(--ps-text)}.bc .domcard .bd{font-size:13px;color:var(--ps-muted);margin-top:8px}" +
      ".bc .ruler{max-width:760px;margin:16px auto 0;text-align:center;font-size:16px;color:var(--ps-text)}" +
      ".bc .aspwrap{display:flex;gap:26px;flex-wrap:wrap;justify-content:center;align-items:flex-start}" +
      ".bc .grid{border-collapse:collapse}.bc .grid td{width:30px;height:30px;text-align:center;font-size:16px;border:1px solid var(--ps-border)}.bc .grid .hd{color:" + GOLD + ";font-size:16px}.bc .grid .conj{color:var(--ps-text)}.bc .grid .harm{color:#2e7d52}.bc .grid .tense{color:#c0392b}" +
      ".bc .asplist{flex:1;min-width:280px;max-width:440px}.bc .aspitem{font-size:15px;padding:7px 0;border-bottom:1px solid var(--ps-border);color:var(--ps-text)}.bc .aspitem .ag{margin:0 5px}.bc .aspitem .harm{color:#2e7d52}.bc .aspitem .tense{color:#c0392b}.bc .aspitem .conj{color:" + GOLD + "}" +
      ".bc .retry{display:block;margin:28px auto 0;font-size:15px;font-weight:700;letter-spacing:1px;color:" + GOLD + ";background:none;border:none;cursor:pointer;font-family:" + FONT + "}");

    function option(v, l) { return "<option value='" + v + "'>" + l + "</option>"; }
    var months = "<option value=''>MM</option>"; for (var m = 1; m <= 12; m++) months += option(m, ("0" + m).slice(-2));
    var days = "<option value=''>DD</option>"; for (var d = 1; d <= 31; d++) days += option(d, ("0" + d).slice(-2));
    var years = "<option value=''>YYYY</option>"; var yr = new Date().getFullYear(); for (var y = yr; y >= 1920; y--) years += option(y, y);
    var hours = "<option value=''>HH</option>"; for (var h = 1; h <= 12; h++) hours += option(h, h);
    var mins = "<option value=''>MM</option>"; for (var mi = 0; mi < 60; mi++) mins += option(mi, ("0" + mi).slice(-2));

    var el = document.createElement("div"); el.className = "bc";
    el.innerHTML =
      "<div class='form'>" +
        "<p class='intro'>Your birth chart is the sky at the exact moment you were born. Enter your date, exact time, and city for a full natal chart with planets, houses, aspects, and what they reveal.</p>" +
        "<div class='row'><span class='lbl'>Birth date</span><div class='fields'><select data-f='month'>" + months + "</select><select data-f='day'>" + days + "</select><select data-f='year'>" + years + "</select></div></div>" +
        "<div class='row'><span class='lbl'>Birth time</span><div class='fields'><select data-f='hour'>" + hours + "</select><select data-f='minute'>" + mins + "</select><select data-f='ampm'><option value='AM'>AM</option><option value='PM'>PM</option></select></div></div>" +
        "<div class='row'><span class='lbl'>Birth place</span><div class='fields'><div class='placewrap'><input class='place' type='text' data-f='place' placeholder='Start typing a city...' autocomplete='off'><div class='drop' role='listbox'></div></div></div></div>" +
        "<button class='btn' type='button'>Generate My Chart</button>" +
        "<div class='err' role='alert'></div>" +
      "</div>" +
      "<div class='res' aria-live='polite'></div>";
    mount.appendChild(el);

    var $ = function (s) { return el.querySelector(s); };
    var fields = {}; el.querySelectorAll("[data-f]").forEach(function (n) { fields[n.getAttribute("data-f")] = n; });
    var drop = $(".drop"), err = $(".err"), form = $(".form"), res = $(".res");
    var chosen = null, seq = 0, debounceTimer = null, hiIndex = -1, items = [];
    function closeDrop() { drop.classList.remove("open"); drop.innerHTML = ""; hiIndex = -1; items = []; }
    function renderDrop(list) { items = list; hiIndex = -1; if (!list.length) { closeDrop(); return; } drop.innerHTML = list.map(function (c, i) { return "<div class='opt' data-i='" + i + "'>" + c.name + (c.region ? ", " + c.region : "") + ", " + c.country + "</div>"; }).join(""); drop.classList.add("open"); drop.querySelectorAll(".opt").forEach(function (o) { o.addEventListener("mousedown", function (e) { e.preventDefault(); pick(+o.getAttribute("data-i")); }); }); }
    function pick(i) { var c = items[i]; if (!c) return; chosen = c; fields.place.value = c.name + (c.region ? ", " + c.region : "") + ", " + c.country; closeDrop(); }
    function highlight(delta) { var opts = drop.querySelectorAll(".opt"); if (!opts.length) return; hiIndex = (hiIndex + delta + opts.length) % opts.length; opts.forEach(function (o, i) { o.classList.toggle("hi", i === hiIndex); }); }
    fields.place.addEventListener("input", function () { chosen = null; var q = fields.place.value.trim(); clearTimeout(debounceTimer); if (q.length < 2) { closeDrop(); return; } debounceTimer = setTimeout(function () { var my = ++seq; fetch(ORIGIN + "/api/calculators/cities?q=" + encodeURIComponent(q)).then(function (r) { return r.json(); }).then(function (list) { if (my === seq) renderDrop(list); }).catch(function () {}); }, 180); });
    fields.place.addEventListener("keydown", function (e) { if (!drop.classList.contains("open")) return; if (e.key === "ArrowDown") { e.preventDefault(); highlight(1); } else if (e.key === "ArrowUp") { e.preventDefault(); highlight(-1); } else if (e.key === "Enter") { e.preventDefault(); pick(hiIndex >= 0 ? hiIndex : 0); } else if (e.key === "Escape") closeDrop(); });
    fields.place.addEventListener("blur", function () { setTimeout(closeDrop, 150); });
    function showError(m) { err.textContent = m; err.classList.add("show"); }

    $(".btn").addEventListener("click", function () {
      err.classList.remove("show");
      var v = function (n) { return fields[n].value; };
      if (!v("month") || !v("day") || !v("year")) return showError("Please select your full birth date.");
      if (!v("hour") || v("minute") === "") return showError("Please select your birth time. Houses and Rising sign depend on it.");
      if (!chosen) return showError("Please choose your birth place from the dropdown list.");
      var day = +v("day"), month = +v("month"), year = +v("year");
      if (day > new Date(year, month, 0).getDate()) return showError("That date does not exist. Please check the day and month.");
      var hour = (+v("hour")) % 12 + (v("ampm") === "PM" ? 12 : 0);
      var chart = computeChart(year, month, day, hour, +v("minute"), chosen.timezone, chosen.lat, chosen.lon);
      var A = analyze(chart);

      // placements table
      var rows = "";
      chart.bodies.forEach(function (p) { var ss = signStr(p.lon); rows += "<tr><td class='pg'>" + p.glyph + "︎</td><td class='pn'>" + p.key + "</td><td><span class='sg'>" + ss.glyph + "︎</span>" + ss.deg + "° " + ss.sign + "</td><td class='ph'>House " + p.house + "</td></tr>"; });
      var ascS = signStr(chart.asc), mcS = signStr(chart.mc);
      rows += "<tr><td class='pg'>AC</td><td class='pn'>Ascendant</td><td><span class='sg'>" + ascS.glyph + "︎</span>" + ascS.deg + "° " + ascS.sign + "</td><td class='ph'></td></tr>";
      rows += "<tr><td class='pg'>MC</td><td class='pn'>Midheaven</td><td><span class='sg'>" + mcS.glyph + "︎</span>" + mcS.deg + "° " + mcS.sign + "</td><td class='ph'></td></tr>";

      // big three
      var sun = chart.bodies[0], moon = chart.bodies[1];
      var si = signIdx(sun.lon), mi2 = signIdx(moon.lon), ri = signIdx(chart.asc);
      function b3(glyph, label, idx, frame) { return "<div class='b3'><div class='g'>" + glyph + "︎</div><div class='t'>" + label + "</div><div class='s'>" + SIGN_GLYPH[idx] + "︎ " + SIGNS[idx] + "</div><p>" + frame + " " + SIGN_TRAIT[idx] + ".</p></div>"; }

      // aspect grid (lower triangle)
      var b = chart.bodies;
      var grid = "<table class='grid'><tr><td></td>";
      for (var c = 0; c < b.length; c++) grid += "<td class='hd'>" + b[c].glyph + "︎</td>";
      grid += "</tr>";
      for (var rI = 0; rI < b.length; rI++) {
        grid += "<tr><td class='hd'>" + b[rI].glyph + "︎</td>";
        for (var cI = 0; cI < b.length; cI++) {
          if (cI >= rI) { grid += "<td></td>"; continue; }
          var f = findAspect(b[rI].lon, b[cI].lon);
          grid += "<td class='" + (f ? f.A.k : "") + "'>" + (f ? f.A.g + "︎" : "") + "</td>";
        }
        grid += "</tr>";
      }
      grid += "</table>";

      var topAsp = A.aspects.slice(0, 6).map(function (x) {
        return "<div class='aspitem'>" + x.p1.key + " <span class='ag " + x.asp.k + "'>" + x.asp.g + "︎</span> " + x.p2.key +
          ": " + APHRASE[x.asp.n] + " your " + PTHEME[x.p1.key] + " and " + PTHEME[x.p2.key] + " <span style='opacity:.55'>(" + x.orb.toFixed(1) + "° orb)</span></div>";
      }).join("");

      function ord(n) { var s = ["th","st","nd","rd"], v = n % 100; return n + (s[(v - 20) % 10] || s[v] || s[0]); }
      var rb = A.rulerBody;
      var rulerLine = rb ? ("Your chart is ruled by <b style='color:" + GOLD + "'>" + A.rulerName + "</b> (the ruler of your " + SIGNS[ri] + " Ascendant), placed in <b>" + SIGNS[signIdx(rb.lon)] + "</b> in the <b>" + ord(rb.house) + " house</b>. This planet sets the tone for your whole chart.") : "";

      res.innerHTML =
        "<div class='top'><div class='wheel'>" + wheelSvg(chart) + "</div><div class='ptable'><table>" + rows + "</table></div></div>" +
        "<h3>Your Big Three</h3><div class='big3'>" +
          b3("☉", "Sun", si, "Your core self is") + b3("☽", "Moon", mi2, "Emotionally you are") + b3("↑", "Rising", ri, "You meet the world as") +
        "</div>" +
        "<h3>Dominant Energies</h3><div class='dom'>" +
          "<div class='domcard'><h4>Dominant Element</h4><div class='v'>" + A.domE + "</div><p>You lead with " + ELEM_DESC[A.domE] + ".</p><div class='bd'>Fire " + A.elem.Fire + " &middot; Earth " + A.elem.Earth + " &middot; Air " + A.elem.Air + " &middot; Water " + A.elem.Water + "</div></div>" +
          "<div class='domcard'><h4>Dominant Modality</h4><div class='v'>" + A.domM + "</div><p>You are " + MODE_DESC[A.domM] + ".</p><div class='bd'>Cardinal " + A.mode.Cardinal + " &middot; Fixed " + A.mode.Fixed + " &middot; Mutable " + A.mode.Mutable + "</div></div>" +
        "</div>" +
        "<p class='ruler'>" + rulerLine + "</p>" +
        "<h3>Major Aspects</h3><div class='aspwrap'><div>" + grid + "</div><div class='asplist'>" + topAsp + "</div></div>" +
        "<h3>Your Chart, Interpreted</h3><div class='ai-reading-slot'></div>" +
        "<h3>Happening Now</h3><div class='ai-transits-slot'></div>" +
        "<h3>Ask an Astrologer</h3><div class='ai-chat-slot'></div>" +
        "<button class='retry' type='button'>&#8592; Start over</button>";

      form.style.display = "none"; res.classList.add("show");

      // facts for AI grounding
      var bcFacts = function () {
        return {
          rising: SIGNS[ri], sun: { sign: SIGNS[si], house: sun.house }, moon: { sign: SIGNS[mi2], house: moon.house },
          placements: chart.bodies.map(function (b) { return { planet: b.key, sign: SIGNS[signIdx(b.lon)], house: b.house }; }),
          aspects: A.aspects.slice(0, 8).map(function (x) { return x.p1.key + " " + x.asp.n + " " + x.p2.key; }),
          dominantElement: A.domE, dominantModality: A.domM, chartRuler: A.rulerName
        };
      };
      // live transits: today's planets against the natal chart
      var transitsFacts = function () {
        var nowMs = Date.now();
        var tb = PLANETS.map(function (p) {
          var lonv = p.key === "Sun" ? sunLon(nowMs) : p.key === "Moon" ? moonLon(nowMs) : planetLon(p.key, nowMs);
          var natalHits = chart.bodies.filter(function (nb) { return sepAngle(lonv, nb.lon) <= 3; }).map(function (nb) { return nb.key; });
          return { planet: p.key, sign: SIGNS[signIdx(lonv)], throughYourHouse: houseOf(lonv, chart.cusps), conjunctYourNatal: natalHits };
        });
        return { today: new Date().toISOString().slice(0, 10), transits: tb };
      };
      if (ctx.aiReading) {
        ctx.aiReading(res.querySelector(".ai-reading-slot"), "birth-chart", bcFacts, { title: "Your Natal Chart", label: "Interpret my chart with AI", hint: "Grounded in your exact placements and aspects." });
        ctx.aiReading(res.querySelector(".ai-transits-slot"), "transits", transitsFacts, { title: "The Sky Right Now", label: "See what is happening in your chart now", hint: "Today's planets moving through your natal chart." });
      }
      if (ctx.aiChat) ctx.aiChat(res.querySelector(".ai-chat-slot"), "birth-chart", bcFacts, { title: "Ask an AI astrologer about your chart", placeholder: "e.g. What does my Saturn placement mean for my career?" });
      res.querySelector(".retry").addEventListener("click", function () {
        ["month","day","year","hour","minute"].forEach(function (n) { fields[n].value = ""; });
        fields.ampm.value = "AM"; fields.place.value = ""; chosen = null; err.classList.remove("show"); closeDrop();
        res.classList.remove("show"); res.innerHTML = ""; form.style.display = "";
      });
    });
  }

  window.__PSHUB__ = window.__PSHUB__ || { _reg: {}, _waiters: {}, register: function (id, def) { this._reg[id] = def; (this._waiters[id] || []).forEach(function (fn) { fn(def); }); this._waiters[id] = []; } };
  window.__PSHUB__.register("birth-chart", { title: "Birth Chart", render: render });
})();
