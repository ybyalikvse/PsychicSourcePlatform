/* Birth Chart (Natal Chart) generator embed.
 * Usage on any site:
 *   <div id="ps-birth-chart"></div>
 *   <script async src="https://psychic-source-platform.vercel.app/embed/birth-chart.js"></script>
 * Renders directly into the page (Shadow DOM), no iframe.
 * City search data derived from GeoNames.org, licensed CC BY 4.0.
 * Planet positions: JPL Standish approximate elements + Meeus Sun/Moon.
 * Houses: Placidus. Accurate to well within a degree for chart display.
 */
(function () {
  "use strict";

  var SCRIPT_SRC = (document.currentScript && document.currentScript.src) || "";
  var ORIGIN = SCRIPT_SRC ? new URL(SCRIPT_SRC).origin : "https://psychic-source-platform.vercel.app";

  var CTA_URL = "https://www.psychicsource.com/psychic-advice/astrology-readings";
  var CTA_TEXT = "Have a psychic astrologer read your chart";

  var SIGNS = ["Aries","Taurus","Gemini","Cancer","Leo","Virgo","Libra","Scorpio","Sagittarius","Capricorn","Aquarius","Pisces"];
  var SIGN_GLYPH = ["♈","♉","♊","♋","♌","♍","♎","♏","♐","♑","♒","♓"];
  var PLANETS = [
    { key: "Sun", glyph: "☉" }, { key: "Moon", glyph: "☽" }, { key: "Mercury", glyph: "☿" },
    { key: "Venus", glyph: "♀" }, { key: "Mars", glyph: "♂" }, { key: "Jupiter", glyph: "♃" },
    { key: "Saturn", glyph: "♄" }, { key: "Uranus", glyph: "♅" }, { key: "Neptune", glyph: "♆" },
    { key: "Pluto", glyph: "♇" },
  ];

  // ---------- Astronomy ----------
  function tzOffsetMs(tz, utcMs) {
    var dtf = new Intl.DateTimeFormat("en-US", { timeZone: tz, year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false });
    var p = {}; dtf.formatToParts(new Date(utcMs)).forEach(function (x) { p[x.type] = x.value; });
    return Date.UTC(+p.year, +p.month - 1, +p.day, p.hour === "24" ? 0 : +p.hour, +p.minute, +p.second) - utcMs;
  }
  function localToUtcMs(y, mo, d, h, mi, tz) {
    var wall = Date.UTC(y, mo - 1, d, h, mi, 0), g = wall;
    for (var i = 0; i < 3; i++) { var n = wall - tzOffsetMs(tz, g); if (n === g) break; g = n; }
    return g;
  }
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
    Pluto:{b:[39.48211675,0.24882730,17.14001206,238.92903833,224.06891629,110.30393684],r:[-0.00031596,0.00005170,0.00004818,145.20780515,-0.04062942,-0.01183482],aug:[-0.01262724,0,0,0]},
  };
  function helio(name, T) {
    var el = EL[name];
    var a=el.b[0]+el.r[0]*T, e=el.b[1]+el.r[1]*T, I=(el.b[2]+el.r[2]*T)*D2R, L=el.b[3]+el.r[3]*T, wBar=el.b[4]+el.r[4]*T, node=el.b[5]+el.r[5]*T;
    var M = L - wBar;
    if (el.aug) { M += el.aug[0]*T*T + el.aug[1]*Math.cos(el.aug[3]*T*D2R) + el.aug[2]*Math.sin(el.aug[3]*T*D2R); }
    M = mod360(M); if (M > 180) M -= 360;
    var w=(wBar-node)*D2R, nodeR=node*D2R, eStar=e/D2R;
    var E=M+eStar*Math.sin(M*D2R);
    for (var i=0;i<30;i++){var dM=M-(E-eStar*Math.sin(E*D2R)),dE=dM/(1-e*Math.cos(E*D2R));E+=dE;if(Math.abs(dE)<1e-9)break;}
    var Er=E*D2R, xp=a*(Math.cos(Er)-e), yp=a*Math.sqrt(1-e*e)*Math.sin(Er);
    var cw=Math.cos(w),sw=Math.sin(w),cn=Math.cos(nodeR),sn=Math.sin(nodeR),ci=Math.cos(I),si=Math.sin(I);
    return { x:(cw*cn-sw*sn*ci)*xp+(-sw*cn-cw*sn*ci)*yp, y:(cw*sn+sw*cn*ci)*xp+(-sw*sn+cw*cn*ci)*yp };
  }
  function precession(T) { return (5029.0966*T + 1.11113*T*T)/3600; }
  function planetLon(name, ms) {
    var T = T_of(ms), e = helio("EMB", T), p = helio(name, T);
    return mod360(mod360(Math.atan2(p.y-e.y, p.x-e.x)/D2R) + precession(T));
  }
  function sunLon(ms) {
    var T = T_of(ms);
    var L0 = mod360(280.46646 + 36000.76983*T + 0.0003032*T*T);
    var M = mod360(357.52911 + 35999.05029*T - 0.0001537*T*T)*D2R;
    var C = (1.914602-0.004817*T-0.000014*T*T)*Math.sin(M)+(0.019993-0.000101*T)*Math.sin(2*M)+0.000289*Math.sin(3*M);
    return mod360(L0+C);
  }
  var LT=[[0,0,1,0,6288774],[2,0,-1,0,1274027],[2,0,0,0,658314],[0,0,2,0,213618],[0,1,0,0,-185116],[0,0,0,2,-114332],[2,0,-2,0,58793],[2,-1,-1,0,57066],[2,0,1,0,53322],[2,-1,0,0,45758],[0,1,-1,0,-40923],[1,0,0,0,-34720],[0,1,1,0,-30383],[2,0,0,-2,15327],[0,0,1,2,-12528],[0,0,1,-2,10980],[4,0,-1,0,10675],[0,0,3,0,10034],[4,0,-2,0,8548],[2,1,-1,0,-7888],[2,1,0,0,-6766],[1,0,-1,0,-5163],[1,1,0,0,4987],[2,-1,1,0,4036],[2,0,2,0,3994],[4,0,0,0,3861],[2,0,-3,0,3665],[0,1,-2,0,-2689],[2,0,-1,2,-2602],[2,-1,-2,0,2390],[1,0,1,0,-2348],[2,-2,0,0,2236],[0,1,2,0,-2120],[0,2,0,0,-2069],[2,-2,-1,0,2048],[2,0,1,-2,-1773],[2,0,0,2,-1595],[4,-1,-1,0,1215],[0,0,2,2,-1110],[3,0,-1,0,-892],[2,1,1,0,-810],[4,-1,-2,0,759],[0,2,-1,0,-713],[2,2,-1,0,-700],[2,1,-2,0,691],[2,-1,0,-2,596],[4,0,1,0,549],[0,0,4,0,537],[4,-1,0,0,520],[1,0,-2,0,-487]];
  function moonLon(ms){var T=T_of(ms);var Lp=mod360(218.3164477+481267.88123421*T-0.0015786*T*T+T*T*T/538841-T*T*T*T/65194000);var D=mod360(297.8501921+445267.1114034*T-0.0018819*T*T+T*T*T/545868-T*T*T*T/113065000);var M=mod360(357.5291092+35999.0502909*T-0.0001536*T*T+T*T*T/24490000);var Mp=mod360(134.9633964+477198.8675055*T+0.0087414*T*T+T*T*T/69699-T*T*T*T/14712000);var F=mod360(93.2720950+483202.0175233*T-0.0036539*T*T-T*T*T/3526000+T*T*T*T/863310000);var E=1-0.002516*T-0.0000074*T*T,s=0;for(var i=0;i<LT.length;i++){var t=LT[i],c=t[4];if(t[1]===1||t[1]===-1)c*=E;else if(t[1]===2||t[1]===-2)c*=E*E;s+=c*Math.sin((t[0]*D+t[1]*M+t[2]*Mp+t[3]*F)*D2R);}var A1=mod360(119.75+131.849*T),A2=mod360(53.09+479264.290*T);s+=3958*Math.sin(A1*D2R)+1962*Math.sin((Lp-F)*D2R)+318*Math.sin(A2*D2R);return mod360(Lp+s/1e6);}

  function gmst(ms){var jd=ms/86400000+2440587.5,T=(jd-2451545.0)/36525;return mod360(280.46061837+360.98564736629*(jd-2451545.0)+0.000387933*T*T-T*T*T/38710000);}
  function obliq(ms){var T=T_of(ms);return 23.4392911-0.0130042*T-1.64e-7*T*T+5.04e-7*T*T*T;}
  function eclFromRa(ra,eps){ra*=D2R;eps*=D2R;return mod360(Math.atan2(Math.sin(ra),Math.cos(ra)*Math.cos(eps))/D2R);}
  function decFromEcl(lam,eps){return Math.asin(Math.sin(lam*D2R)*Math.sin(eps*D2R))/D2R;}
  function ascendant(ms,lat,lon){var ramc=mod360(gmst(ms)+lon)*D2R,eps=obliq(ms)*D2R,phi=lat*D2R;return mod360(Math.atan2(Math.cos(ramc),-(Math.sin(ramc)*Math.cos(eps)+Math.tan(phi)*Math.sin(eps)))/D2R);}
  function placidusCusp(ramc,lat,eps,off,frac,noct){var ra=mod360(ramc+off);for(var i=0;i<60;i++){var lam=eclFromRa(ra,eps),dec=decFromEcl(lam,eps),cosH=-Math.tan(lat*D2R)*Math.tan(dec*D2R);cosH=Math.max(-1,Math.min(1,cosH));var sda=Math.acos(cosH)/D2R;var target=noct?mod360(ramc+180-frac*(180-sda)):mod360(ramc+frac*sda);if(Math.abs(mod360(target-ra+180)-180)<1e-7){ra=target;break;}ra=target;}return eclFromRa(ra,eps);}
  function cusps(ms,lat,lon){var eps=obliq(ms),ramc=mod360(gmst(ms)+lon),c=new Array(13);c[1]=ascendant(ms,lat,lon);c[10]=eclFromRa(ramc,eps);c[11]=placidusCusp(ramc,lat,eps,30,1/3,false);c[12]=placidusCusp(ramc,lat,eps,60,2/3,false);c[2]=placidusCusp(ramc,lat,eps,120,2/3,true);c[3]=placidusCusp(ramc,lat,eps,150,1/3,true);c[4]=mod360(c[10]+180);c[5]=mod360(c[11]+180);c[6]=mod360(c[12]+180);c[7]=mod360(c[1]+180);c[8]=mod360(c[2]+180);c[9]=mod360(c[3]+180);return c;}
  function houseOf(lon,c){for(var h=1;h<=12;h++){var a=c[h],b=c[h===12?1:h+1];if(mod360(lon-a)<mod360(b-a))return h;}return 12;}
  function signStr(lon){var i=Math.floor(mod360(lon)/30);var d=mod360(lon)%30;return { sign: SIGNS[i], glyph: SIGN_GLYPH[i], deg: Math.floor(d), min: Math.floor((d%1)*60), idx: i };}

  function computeChart(y,mo,d,h,mi,tz,lat,lon) {
    var utc = localToUtcMs(y,mo,d,h,mi,tz);
    var c = cusps(utc, lat, lon);
    var bodies = PLANETS.map(function (p) {
      var lonv = p.key === "Sun" ? sunLon(utc) : p.key === "Moon" ? moonLon(utc) : planetLon(p.key, utc);
      return { key: p.key, glyph: p.glyph, lon: lonv, house: houseOf(lonv, c) };
    });
    return { cusps: c, bodies: bodies, asc: c[1], mc: c[10] };
  }

  // ---------- Chart wheel SVG ----------
  function pt(cx, cy, r, lonDeg, ascLon) {
    var theta = (lonDeg - ascLon + 180) * D2R;
    return [cx + r * Math.cos(theta), cy - r * Math.sin(theta)];
  }
  function wheelSvg(chart) {
    var S = 600, cx = 300, cy = 300, asc = chart.asc;
    var Rout = 288, Rsign = 250, Rhouse = 128, Rplanet = 205, Rsignglyph = 269, Rhousenum = 112;
    var GOLD = "#e8a75e", LINE = "rgba(255,255,255,.30)", LINE2 = "rgba(255,255,255,.55)";
    var s = "<svg viewBox='0 0 " + S + " " + S + "' xmlns='http://www.w3.org/2000/svg' font-family='Segoe UI,Helvetica,Arial,sans-serif'>";
    // circles
    [Rout, Rsign, Rhouse].forEach(function (r) { s += "<circle cx='" + cx + "' cy='" + cy + "' r='" + r + "' fill='none' stroke='" + LINE + "' stroke-width='1.2'/>"; });
    // sign band sectors + glyphs
    for (var i = 0; i < 12; i++) {
      var b0 = pt(cx, cy, Rsign, i * 30, asc), b1 = pt(cx, cy, Rout, i * 30, asc);
      s += "<line x1='" + b0[0].toFixed(1) + "' y1='" + b0[1].toFixed(1) + "' x2='" + b1[0].toFixed(1) + "' y2='" + b1[1].toFixed(1) + "' stroke='" + LINE + "' stroke-width='1'/>";
      var g = pt(cx, cy, Rsignglyph, i * 30 + 15, asc);
      s += "<text x='" + g[0].toFixed(1) + "' y='" + g[1].toFixed(1) + "' fill='" + GOLD + "' font-size='24' text-anchor='middle' dominant-baseline='central'>" + SIGN_GLYPH[i] + "︎</text>";
    }
    // house cusps
    for (var hh = 1; hh <= 12; hh++) {
      var isAngle = (hh === 1 || hh === 4 || hh === 7 || hh === 10);
      var a0 = pt(cx, cy, Rhouse, chart.cusps[hh], asc), a1 = pt(cx, cy, Rsign, chart.cusps[hh], asc);
      s += "<line x1='" + a0[0].toFixed(1) + "' y1='" + a0[1].toFixed(1) + "' x2='" + a1[0].toFixed(1) + "' y2='" + a1[1].toFixed(1) + "' stroke='" + (isAngle ? GOLD : LINE) + "' stroke-width='" + (isAngle ? 2 : 1) + "'/>";
      // house number at mid-sector
      var midLon = chart.cusps[hh] + mod360(chart.cusps[hh === 12 ? 1 : hh + 1] - chart.cusps[hh]) / 2;
      var hn = pt(cx, cy, Rhousenum, midLon, asc);
      s += "<text x='" + hn[0].toFixed(1) + "' y='" + hn[1].toFixed(1) + "' fill='rgba(255,255,255,.55)' font-size='13' text-anchor='middle' dominant-baseline='central'>" + hh + "</text>";
    }
    // ASC / MC labels
    var ascP = pt(cx, cy, Rsign - 16, chart.asc, asc);
    s += "<text x='" + ascP[0].toFixed(1) + "' y='" + ascP[1].toFixed(1) + "' fill='" + GOLD + "' font-size='13' font-weight='700' text-anchor='middle' dominant-baseline='central'>ASC</text>";
    var mcP = pt(cx, cy, Rsign - 16, chart.mc, asc);
    s += "<text x='" + mcP[0].toFixed(1) + "' y='" + mcP[1].toFixed(1) + "' fill='" + GOLD + "' font-size='13' font-weight='700' text-anchor='middle' dominant-baseline='central'>MC</text>";
    // planets with simple decluttering
    var sorted = chart.bodies.slice().sort(function (a, b) { return mod360(a.lon - asc) - mod360(b.lon - asc); });
    var lastAng = -999, tier = 0;
    for (var k = 0; k < sorted.length; k++) {
      var p = sorted[k], ang = mod360(p.lon - asc);
      if (ang - lastAng < 9) { tier += 1; } else { tier = 0; }
      lastAng = ang;
      var r = Rplanet - tier * 26;
      var pp = pt(cx, cy, r, p.lon, asc);
      var tick0 = pt(cx, cy, Rsign, p.lon, asc), tick1 = pt(cx, cy, Rsign - 8, p.lon, asc);
      s += "<line x1='" + tick0[0].toFixed(1) + "' y1='" + tick0[1].toFixed(1) + "' x2='" + tick1[0].toFixed(1) + "' y2='" + tick1[1].toFixed(1) + "' stroke='" + LINE2 + "' stroke-width='1'/>";
      s += "<text x='" + pp[0].toFixed(1) + "' y='" + pp[1].toFixed(1) + "' fill='#fff' font-size='22' text-anchor='middle' dominant-baseline='central'>" + p.glyph + "︎</text>";
    }
    return s + "</svg>";
  }

  // ---------- Styles ----------
  var FONT = "'Segoe UI','Helvetica Neue',Helvetica,Arial,sans-serif";
  var GOLD = "#e8a75e";
  var CSS = "" +
    ":host{all:initial;display:block}" +
    "*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}" +
    ".wrap{position:relative;font-family:" + FONT + ";color:#fff;" +
    "background:#0a0a16 url('" + ORIGIN + "/embed/img/mars/space.jpg') center/cover no-repeat;padding:54px 24px 56px;overflow:hidden;line-height:1.6}" +
    ".inner{position:relative;max-width:900px;margin:0 auto}" +
    ".title{font-family:'Great Vibes',cursive;font-weight:400;font-size:clamp(46px,7vw,74px);color:" + GOLD + ";text-align:center;text-shadow:0 2px 12px rgba(0,0,0,.5);margin-bottom:8px;line-height:1.1}" +
    ".intro{font-size:19px;text-align:center;margin:0 auto 30px;max-width:820px;text-shadow:0 1px 6px rgba(0,0,0,.5)}" +
    ".row{display:flex;align-items:center;gap:14px;margin-bottom:18px;flex-wrap:wrap}" +
    ".lbl{flex:0 0 130px;font-weight:700;font-size:20px;text-shadow:0 1px 4px rgba(0,0,0,.6)}" +
    ".fields{display:flex;gap:12px;flex:1;min-width:260px}" +
    "select,.place{appearance:none;-webkit-appearance:none;width:100%;padding:13px 34px 13px 16px;font-size:19px;font-family:" + FONT + ";color:#fff;background-color:rgba(16,16,30,.75);border:1.5px solid rgba(255,255,255,.9);border-radius:8px;outline:none;text-shadow:0 1px 3px rgba(0,0,0,.4)}" +
    "select{background-image:url(\"data:image/svg+xml;charset=utf-8,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='8'%3E%3Cpath d='M1 1l5 5 5-5' stroke='white' stroke-width='1.6' fill='none'/%3E%3C/svg%3E\");background-repeat:no-repeat;background-position:right 12px center;cursor:pointer}" +
    "select:focus,.place:focus{border-color:#fff;box-shadow:0 0 0 2px rgba(255,255,255,.25)}" +
    "select option{color:#1c1c2e;background:#fff;text-shadow:none}" +
    ".sel{flex:1}.place::placeholder{color:rgba(255,255,255,.7)}.placewrap{position:relative;flex:1}" +
    ".drop{position:absolute;top:calc(100% + 2px);left:0;right:0;background:#fff;border-radius:6px;box-shadow:0 10px 30px rgba(0,0,0,.5);z-index:30;max-height:280px;overflow-y:auto;display:none}" +
    ".drop.open{display:block}.opt{padding:14px 18px;font-size:18px;color:#26263a;cursor:pointer;border-bottom:1px solid #efeff4;text-shadow:none}.opt:last-child{border-bottom:0}.opt:hover,.opt.hi{background:#efe9f7}" +
    ".actions{text-align:center;margin-top:30px}" +
    ".btn{display:inline-block;font-family:" + FONT + ";font-size:19px;font-weight:600;letter-spacing:.5px;color:#241505;background:linear-gradient(180deg,#f2b26d," + GOLD + ");border:1.5px solid rgba(255,255,255,.85);border-radius:10px;padding:14px 44px;cursor:pointer;box-shadow:0 4px 16px rgba(0,0,0,.4);transition:transform .15s ease}" +
    ".btn:hover{transform:translateY(-1px)}" +
    ".err{display:none;text-align:center;margin-top:16px;font-size:17px;color:#ffce8a;text-shadow:0 1px 4px rgba(0,0,0,.6)}.err.show{display:block}" +
    ".screen-result{display:none}.screen-result.active{display:block;animation:fadein .6s ease}.screen-form.hidden{display:none}" +
    "@keyframes fadein{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:none}}" +
    ".chartgrid{display:flex;gap:30px;align-items:flex-start;flex-wrap:wrap;justify-content:center}" +
    ".wheel{flex:0 0 auto;width:min(460px,90vw)}" +
    ".ptable{flex:1;min-width:280px}" +
    ".ptable table{width:100%;border-collapse:collapse}" +
    ".ptable td{padding:8px 6px;border-bottom:1px solid rgba(255,255,255,.15);font-size:17px}" +
    ".ptable .pg{font-size:20px;width:26px;color:" + GOLD + "}" +
    ".ptable .pn{width:82px}" +
    ".ptable .ps{color:#fff}.ptable .ps .sg{color:" + GOLD + ";margin-right:5px}" +
    ".ptable .ph{text-align:right;opacity:.75;font-size:14px}" +
    ".outro{text-align:center;font-size:18px;max-width:760px;margin:28px auto 0;text-shadow:0 1px 5px rgba(0,0,0,.4)}" +
    ".cta{display:inline-block;font-family:" + FONT + ";font-size:19px;font-weight:600;color:#241505;text-decoration:none;background:linear-gradient(180deg,#f2b26d," + GOLD + ");border-radius:999px;padding:15px 42px;box-shadow:0 4px 16px rgba(0,0,0,.35)}" +
    ".cta:hover{transform:translateY(-1px)}" +
    ".retry{display:inline-block;font-family:" + FONT + ";font-size:18px;font-weight:700;letter-spacing:2px;color:" + GOLD + ";background:none;border:none;cursor:pointer;text-shadow:0 1px 4px rgba(0,0,0,.4);padding:6px 10px;margin-top:8px}" +
    ".retry:hover{color:#f2c088}" +
    "@media(max-width:640px){.lbl{flex:1 0 100%}.wrap{padding:40px 14px 44px}}";

  function option(v, l) { return "<option value=\"" + v + "\">" + l + "</option>"; }
  function buildHtml() {
    var months = "<option value=''>MM</option>"; for (var m = 1; m <= 12; m++) months += option(m, ("0" + m).slice(-2));
    var days = "<option value=''>DD</option>"; for (var d = 1; d <= 31; d++) days += option(d, ("0" + d).slice(-2));
    var years = "<option value=''>YYYY</option>"; var yr = new Date().getFullYear(); for (var y = yr; y >= 1920; y--) years += option(y, y);
    var hours = "<option value=''>HH</option>"; for (var h = 1; h <= 12; h++) hours += option(h, h);
    var mins = "<option value=''>MM</option>"; for (var mi = 0; mi < 60; mi++) mins += option(mi, ("0" + mi).slice(-2));
    var cta = CTA_URL ? "<div class='actions'><a class='cta' href='" + CTA_URL + "'>" + CTA_TEXT + "</a></div>" : "";
    return "<div class='wrap'><div class='inner'>" +
      "<h2 class='title'>Birth Chart Calculator</h2>" +
      "<div class='screen-form'>" +
      "<p class='intro'>Your birth chart is a snapshot of the sky at the exact moment you were born: the Sun, Moon, and every planet in their signs and houses. Enter your birth date, exact time, and city to generate your personal natal chart.</p>" +
      "<div class='row'><span class='lbl'>Birth Date:</span><div class='fields'>" +
      "<select class='sel' data-f='month' aria-label='Birth month'>" + months + "</select>" +
      "<select class='sel' data-f='day' aria-label='Birth day'>" + days + "</select>" +
      "<select class='sel' data-f='year' aria-label='Birth year'>" + years + "</select></div></div>" +
      "<div class='row'><span class='lbl'>Birth Time:</span><div class='fields'>" +
      "<select class='sel' data-f='hour' aria-label='Birth hour'>" + hours + "</select>" +
      "<select class='sel' data-f='minute' aria-label='Birth minute'>" + mins + "</select>" +
      "<select class='sel' data-f='ampm' aria-label='AM or PM'><option value='AM'>AM</option><option value='PM'>PM</option></select></div></div>" +
      "<div class='row'><span class='lbl'>Birth Place:</span><div class='fields'><div class='placewrap'>" +
      "<input class='place' type='text' data-f='place' placeholder='Start typing a city...' autocomplete='off' aria-label='Birth place'>" +
      "<div class='drop' role='listbox'></div></div></div></div>" +
      "<div class='actions'><button class='btn' type='button'>Generate My Chart</button></div>" +
      "<div class='err' role='alert'></div>" +
      "</div>" +
      "<div class='screen-result' aria-live='polite'>" +
      "<div class='chartgrid'><div class='wheel'></div><div class='ptable'></div></div>" +
      "<p class='outro'>Your chart is a map, not a verdict. A psychic astrologer can walk you through what these placements mean together and how they are shaping your life right now.</p>" +
      cta +
      "<div class='actions'><button class='retry' type='button'>&#8592; Start Over</button></div>" +
      "</div>" +
      "</div></div>";
  }

  function init(host) {
    if (host.__psBirthChart) return; host.__psBirthChart = true;
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
    var fields = {}; mount.querySelectorAll("[data-f]").forEach(function (el) { fields[el.getAttribute("data-f")] = el; });
    var drop = $(".drop"), err = $(".err"), formScreen = $(".screen-form"), resultScreen = $(".screen-result");
    var chosen = null, seq = 0, debounceTimer = null, hiIndex = -1, items = [];

    function closeDrop() { drop.classList.remove("open"); drop.innerHTML = ""; hiIndex = -1; items = []; }
    function renderDrop(list) {
      items = list; hiIndex = -1; if (!list.length) { closeDrop(); return; }
      drop.innerHTML = list.map(function (c, i) { return "<div class='opt' role='option' data-i='" + i + "'>" + c.name + (c.region ? ", " + c.region : "") + ", " + c.country + "</div>"; }).join("");
      drop.classList.add("open");
      drop.querySelectorAll(".opt").forEach(function (el) { el.addEventListener("mousedown", function (e) { e.preventDefault(); pick(+el.getAttribute("data-i")); }); });
    }
    function pick(i) { var c = items[i]; if (!c) return; chosen = c; fields.place.value = c.name + (c.region ? ", " + c.region : "") + ", " + c.country; closeDrop(); }
    function highlight(delta) { var opts = drop.querySelectorAll(".opt"); if (!opts.length) return; hiIndex = (hiIndex + delta + opts.length) % opts.length; opts.forEach(function (el, i) { el.classList.toggle("hi", i === hiIndex); }); }
    fields.place.addEventListener("input", function () {
      chosen = null; var q = fields.place.value.trim(); clearTimeout(debounceTimer);
      if (q.length < 2) { closeDrop(); return; }
      debounceTimer = setTimeout(function () { var my = ++seq; fetch(ORIGIN + "/api/calculators/cities?q=" + encodeURIComponent(q)).then(function (r) { return r.json(); }).then(function (list) { if (my === seq) renderDrop(list); }).catch(function () {}); }, 180);
    });
    fields.place.addEventListener("keydown", function (e) {
      if (!drop.classList.contains("open")) return;
      if (e.key === "ArrowDown") { e.preventDefault(); highlight(1); } else if (e.key === "ArrowUp") { e.preventDefault(); highlight(-1); }
      else if (e.key === "Enter") { e.preventDefault(); pick(hiIndex >= 0 ? hiIndex : 0); } else if (e.key === "Escape") closeDrop();
    });
    fields.place.addEventListener("blur", function () { setTimeout(closeDrop, 150); });
    function showError(m) { err.textContent = m; err.classList.add("show"); }

    $(".btn").addEventListener("click", function () {
      err.classList.remove("show");
      var v = function (n) { return fields[n].value; };
      if (!v("month") || !v("day") || !v("year")) return showError("Please select your full birth date.");
      if (!v("hour") || v("minute") === "") return showError("Please select your birth time. The houses and Rising sign depend on it.");
      if (!chosen) return showError("Please choose your birth place from the dropdown list.");
      var day = +v("day"), month = +v("month"), year = +v("year");
      if (day > new Date(year, month, 0).getDate()) return showError("That date does not exist. Please check the day and month.");
      var hour = (+v("hour")) % 12 + (v("ampm") === "PM" ? 12 : 0);
      var chart = computeChart(year, month, day, hour, +v("minute"), chosen.timezone, chosen.lat, chosen.lon);
      $(".wheel").innerHTML = wheelSvg(chart);

      var rows = "";
      chart.bodies.forEach(function (p) {
        var ss = signStr(p.lon);
        rows += "<tr><td class='pg'>" + p.glyph + "</td><td class='pn'>" + p.key + "</td>" +
          "<td class='ps'><span class='sg'>" + ss.glyph + "</span>" + ss.deg + "° " + ss.sign + "</td>" +
          "<td class='ph'>House " + p.house + "</td></tr>";
      });
      var ascS = signStr(chart.asc), mcS = signStr(chart.mc);
      rows += "<tr><td class='pg'>AC</td><td class='pn'>Ascendant</td><td class='ps'><span class='sg'>" + ascS.glyph + "</span>" + ascS.deg + "° " + ascS.sign + "</td><td class='ph'></td></tr>";
      rows += "<tr><td class='pg'>MC</td><td class='pn'>Midheaven</td><td class='ps'><span class='sg'>" + mcS.glyph + "</span>" + mcS.deg + "° " + mcS.sign + "</td><td class='ph'></td></tr>";
      $(".ptable").innerHTML = "<table>" + rows + "</table>";

      formScreen.classList.add("hidden"); resultScreen.classList.add("active");
      $(".wrap").scrollIntoView({ behavior: "smooth", block: "start" });
    });

    $(".retry").addEventListener("click", function () {
      ["month","day","year","hour","minute"].forEach(function (n) { fields[n].value = ""; });
      fields.ampm.value = "AM"; fields.place.value = ""; chosen = null; err.classList.remove("show"); closeDrop();
      resultScreen.classList.remove("active"); formScreen.classList.remove("hidden");
      $(".wrap").scrollIntoView({ behavior: "smooth", block: "start" });
    });
  }

  function boot() {
    var host = document.getElementById("ps-birth-chart") || document.querySelector("[data-ps-widget='birth-chart']");
    if (host) init(host);
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot); else boot();
})();
