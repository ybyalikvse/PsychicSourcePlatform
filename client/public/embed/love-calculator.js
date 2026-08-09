/* Love Calculator embed.
 * Usage on any site:
 *   <div id="ps-love-calculator"></div>
 *   <script async src="https://psychic-source-platform.vercel.app/embed/love-calculator.js"></script>
 * Renders directly into the page (Shadow DOM), no iframe. No API calls.
 */
(function () {
  "use strict";

  var SCRIPT_SRC = (document.currentScript && document.currentScript.src) || "";
  var ORIGIN = SCRIPT_SRC ? new URL(SCRIPT_SRC).origin : "https://psychic-source-platform.vercel.app";

  var CTA_URL = "";
  var CTA_TEXT = "Ask a love psychic about your connection";

  // Deterministic, order-independent score mapped to an encouraging 40-99 band.
  function score(a, b) {
    var c = (a + b).toLowerCase().replace(/[^a-z]/g, "").split("").sort().join("");
    var h = 5381;
    for (var i = 0; i < c.length; i++) h = ((h * 33) ^ c.charCodeAt(i)) >>> 0;
    return 40 + (h % 60);
  }
  var BANDS = [
    { min: 90, title: "Written in the Stars", msg: "This is the rare kind of connection people write songs about. Your names carry a spark that suggests deep, magnetic compatibility, the sort of bond that feels effortless and fated. Nurture it, because love like this is a gift." },
    { min: 75, title: "Deeply Compatible", msg: "There is real chemistry here. You balance and bring out the best in each other, with the kind of natural harmony that can grow into something lasting. Keep choosing each other and this connection will only deepen." },
    { min: 60, title: "Strong Potential", msg: "You two have a genuine spark and plenty to build on. With honest communication and a little effort, this is a connection that can blossom into something beautiful. The foundation is there." },
    { min: 50, title: "Promising with Effort", msg: "There is warmth between you and real possibility. Like any good thing, it will ask for patience and understanding, but the raw ingredients for love are present. Give it room to grow." },
    { min: 0, title: "Opposites at Work", msg: "Your energies are different, and that can mean fireworks or friction depending on how you handle it. Opposites often attract for a reason; with openness and care, contrast can become chemistry." },
  ];
  function band(p) { for (var i = 0; i < BANDS.length; i++) if (p >= BANDS[i].min) return BANDS[i]; return BANDS[BANDS.length - 1]; }

  var FONT = "'Segoe UI','Helvetica Neue',Helvetica,Arial,sans-serif";
  var WINE = "#8d2f42", INK = "#4a4033";
  var CSS = "" +
    ":host{all:initial;display:block}" +
    "*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}" +
    ".wrap{position:relative;font-family:" + FONT + ";color:" + INK + ";background:#efe5c6 url('" + ORIGIN + "/embed/img/love/parchment.jpg') center/cover no-repeat;padding:52px 24px 58px;overflow:hidden;line-height:1.65;text-align:center}" +
    ".inner{position:relative;max-width:760px;margin:0 auto}" +
    ".title{font-family:'Great Vibes',cursive;font-weight:400;font-size:clamp(48px,8vw,78px);color:" + WINE + ";line-height:1.05;margin-bottom:10px}" +
    ".intro{font-size:19px;margin:0 auto 26px;max-width:640px}" +
    ".names{display:flex;gap:18px;justify-content:center;align-items:center;flex-wrap:wrap}" +
    ".nin{width:min(260px,80vw);padding:15px 16px;font-size:20px;font-family:" + FONT + ";color:" + INK + ";background:rgba(255,255,255,.75);border:1px solid #c9bd98;border-radius:8px;outline:none;text-align:center}" +
    ".nin:focus{border-color:" + WINE + "}" +
    ".heart-amp{font-family:'Great Vibes',cursive;font-size:44px;color:" + WINE + "}" +
    ".actions{text-align:center;margin-top:26px}" +
    ".btn{display:inline-block;font-family:'Great Vibes',cursive;font-size:32px;color:#fff;background:" + WINE + ";border:none;border-radius:6px;padding:8px 54px 14px;cursor:pointer;box-shadow:0 4px 0 #6d2333;transition:transform .12s ease}" +
    ".btn:hover{transform:translateY(-1px)}" +
    ".err{display:none;margin-top:16px;font-size:17px;color:#a03030}.err.show{display:block}" +
    ".screen-result{display:none}.screen-result.active{display:block;animation:fadein .6s ease}.screen-form.hidden{display:none}" +
    "@keyframes fadein{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:none}}" +
    ".pair{font-size:22px;font-weight:600;color:" + WINE + ";letter-spacing:1px;margin-bottom:8px}" +
    ".heartwrap{position:relative;width:220px;margin:6px auto 4px}" +
    ".pct{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;font-family:'Great Vibes',cursive;font-size:56px;color:#fff;text-shadow:0 2px 8px rgba(0,0,0,.35);padding-top:16px}" +
    ".rtitle{font-family:'Great Vibes',cursive;font-size:clamp(40px,6vw,56px);color:" + WINE + ";margin:6px 0 8px;line-height:1.1}" +
    ".rmsg{font-size:19px;max-width:620px;margin:0 auto}" +
    ".cta{display:inline-block;font-family:" + FONT + ";font-size:18px;font-weight:600;color:#fff;text-decoration:none;background:" + WINE + ";border-radius:999px;padding:14px 38px;box-shadow:0 4px 14px rgba(0,0,0,.25)}" +
    ".cta:hover{filter:brightness(1.08)}" +
    ".retry{display:block;margin:14px auto 0;font-size:17px;font-weight:700;color:" + WINE + ";background:none;border:none;cursor:pointer;font-family:" + FONT + ";text-decoration:underline}" +
    "@media(max-width:600px){.wrap{padding:40px 14px 46px}}";

  function heartSvg(pct) {
    var fillTop = 100 - pct; // percentage from top that stays empty
    return "<svg viewBox='0 0 200 190' xmlns='http://www.w3.org/2000/svg'>" +
      "<defs><clipPath id='hclip'><path d='M100 178 C 30 120, 8 70, 30 40 C 48 16, 84 18, 100 46 C 116 18, 152 16, 170 40 C 192 70, 170 120, 100 178 Z'/></clipPath>" +
      "<linearGradient id='hg' x1='0' y1='1' x2='0' y2='0'><stop offset='0%' stop-color='#b23b56'/><stop offset='100%' stop-color='#e26d86'/></linearGradient></defs>" +
      "<g clip-path='url(#hclip)'>" +
      "<rect x='0' y='0' width='200' height='190' fill='rgba(141,47,66,.14)'/>" +
      "<rect x='0' y='" + (fillTop * 1.9).toFixed(1) + "' width='200' height='190' fill='url(#hg)'/>" +
      "</g>" +
      "<path d='M100 178 C 30 120, 8 70, 30 40 C 48 16, 84 18, 100 46 C 116 18, 152 16, 170 40 C 192 70, 170 120, 100 178 Z' fill='none' stroke='" + WINE + "' stroke-width='2.5'/></svg>";
  }

  function buildHtml() {
    var cta = CTA_URL ? "<div class='actions'><a class='cta' href='" + CTA_URL + "'>" + CTA_TEXT + "</a></div>" : "";
    return "<div class='wrap'><div class='inner'>" +
      "<h2 class='title'>Love Calculator</h2>" +
      "<div class='screen-form'>" +
      "<p class='intro'>Curious how well your names match? Enter yours and your love interest's to reveal your compatibility score.</p>" +
      "<div class='names'>" +
      "<input class='nin' data-f='a' type='text' placeholder='Your name' autocomplete='off' aria-label='Your name'>" +
      "<span class='heart-amp'>&amp;</span>" +
      "<input class='nin' data-f='b' type='text' placeholder='Their name' autocomplete='off' aria-label='Their name'>" +
      "</div>" +
      "<div class='actions'><button class='btn' type='button'>Calculate</button></div>" +
      "<div class='err' role='alert'></div>" +
      "</div>" +
      "<div class='screen-result' aria-live='polite'>" +
      "<div class='pair'></div>" +
      "<div class='heartwrap'><div class='heartsvg'></div><div class='pct'></div></div>" +
      "<div class='rtitle'></div>" +
      "<p class='rmsg'></p>" +
      cta +
      "<button class='retry' type='button'>Try Another Match</button>" +
      "</div>" +
      "</div></div>";
  }

  function init(host) {
    if (host.__psLoveCalc) return; host.__psLoveCalc = true;
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
    var err = $(".err"), formScreen = $(".screen-form"), resultScreen = $(".screen-result");

    function go() {
      var a = fields.a.value.trim(), b = fields.b.value.trim();
      err.classList.remove("show");
      if (!/[a-zA-Z]/.test(a) || !/[a-zA-Z]/.test(b)) { err.textContent = "Please enter both names."; err.classList.add("show"); return; }
      var p = score(a, b), bd = band(p);
      $(".pair").textContent = a + " & " + b;
      $(".heartsvg").innerHTML = heartSvg(p);
      $(".pct").textContent = p + "%";
      $(".rtitle").textContent = bd.title;
      $(".rmsg").textContent = bd.msg;
      formScreen.classList.add("hidden"); resultScreen.classList.add("active");
      $(".wrap").scrollIntoView({ behavior: "smooth", block: "start" });
    }
    $(".btn").addEventListener("click", go);
    mount.querySelectorAll(".nin").forEach(function (el) { el.addEventListener("keydown", function (e) { if (e.key === "Enter") go(); }); });
    $(".retry").addEventListener("click", function () {
      fields.a.value = ""; fields.b.value = ""; err.classList.remove("show");
      resultScreen.classList.remove("active"); formScreen.classList.remove("hidden");
      $(".wrap").scrollIntoView({ behavior: "smooth", block: "start" });
    });
  }
  function boot() { var host = document.getElementById("ps-love-calculator") || document.querySelector("[data-ps-widget='love-calculator']"); if (host) init(host); }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot); else boot();
})();
