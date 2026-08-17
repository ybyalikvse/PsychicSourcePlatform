/* Psychic Source Member Tools Hub.
 * ONE embed for the whole subscriber toolkit:
 *   <div id="ps-tools-hub" data-token="OPTIONAL_SIGNED_MEMBER_TOKEN"></div>
 *   <script async src="https://psychic-source-platform.vercel.app/embed/tools-hub.js"></script>
 *
 * Renders a hub landing grid (Shadow DOM, no iframe) and lazy-loads each tool
 * module from <origin>/embed/hub/<id>.js on demand. Individual tool modules
 * register themselves via window.__PSHUB__.register(id, def).
 *
 * Identity: uses the signed member token from data-token / window.PS_HUB_TOKEN
 * when present (real cross-device sync + gating), otherwise falls back to an
 * anonymous per-browser id so everything works before that integration lands.
 */
(function () {
  "use strict";
  var SCRIPT_SRC = (document.currentScript && document.currentScript.src) || "";
  var ORIGIN = SCRIPT_SRC ? new URL(SCRIPT_SRC).origin : "https://psychic-source-platform.vercel.app";

  var FONT = "'Segoe UI','Helvetica Neue',Helvetica,Arial,sans-serif";
  // Accent is the PsychicSource brand red, referenced via a CSS variable so the
  // whole theme (hub + every tool that uses ctx.gold) can be retuned in one place.
  var GOLD = "var(--ps-accent)";

  // Tool catalogue. `enabled` flips to true as each module ships. Icons are text
  // glyphs with U+FE0E so they render monochrome, not as color emoji.
  var TOOLS = [
    { id: "life-path", title: "Numerology Profile", blurb: "Your full numerology chart from your name and birth date: core numbers, cycles, and life stages.", icon: "✧", enabled: true },
    { id: "fortune-cookie", title: "Daily Fortune Cookie", blurb: "A fortune written just for you today, drawn from your life path number.", icon: "♛", enabled: true },
    { id: "zodiac-compatibility", title: "Zodiac Compatibility", blurb: "Deep synastry between two charts across Sun, Moon, Venus, and Mars.", icon: "❤", enabled: true },
    { id: "birth-chart", title: "Birth Chart", blurb: "Your full natal wheel with planets, houses, and the aspects between them.", icon: "☉", enabled: true },
    { id: "attachment-style", title: "Attachment Style", blurb: "A guided assessment of how you connect, love, and handle closeness.", icon: "⚚", enabled: true },
    { id: "dream-journal", title: "Dream Journal", blurb: "Record your dreams and get AI interpretation, patterns, and imagery.", icon: "☽", enabled: true }
  ];
  var GLYPH = "︎";

  var CSS = "" +
    // Theme tokens (PsychicSource site palette). Retune the whole product here.
    ":host{all:initial;display:block;--ps-accent:#a5121b;--ps-accent-dark:#7c0a11;--ps-text:#241f1d;--ps-muted:#6f6a66;--ps-bg:#ffffff;--ps-panel:#f7f3f0;--ps-panel2:#efe8e2;--ps-border:#e4dcd4;--ps-on:#ffffff}" +
    "*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}" +
    ".wrap{position:relative;font-family:" + FONT + ";color:var(--ps-text);background:var(--ps-bg);padding:0;overflow:hidden;line-height:1.6;min-height:520px}" +
    ".inner{position:relative;max-width:1000px;margin:0 auto;padding:46px 24px 54px}" +
    // top bar (shown inside a tool view). Scoped under .bar so tool modules can
    // freely reuse class names like .back without inheriting hub chrome styles.
    ".bar{position:relative;display:none;margin-bottom:14px}" +
    ".bar.show{display:block}" +
    ".bar .back{display:inline-block;font-family:" + FONT + ";font-size:14px;font-weight:600;letter-spacing:.3px;color:" + GOLD + ";background:none;border:none;padding:4px 2px;cursor:pointer;white-space:nowrap}" +
    ".bar .back:hover{color:var(--ps-accent-dark);text-decoration:underline}" +
    ".bar .barttl{display:block;text-align:center;font-family:'Great Vibes',cursive;font-weight:400;font-size:clamp(34px,5.5vw,54px);color:" + GOLD + ";line-height:1.05;margin-top:2px}" +
    // hub landing. All scoped under .v-hub so these presentational class names
    // (card, badge, grid, ctitle, ...) never leak into tool module content.
    ".v-hub .eyebrow{text-align:center;font-size:13px;letter-spacing:3px;text-transform:uppercase;color:var(--ps-muted);margin-bottom:6px}" +
    ".v-hub .htitle{text-align:center;font-family:'Great Vibes',cursive;font-weight:400;font-size:clamp(46px,7vw,78px);color:" + GOLD + ";line-height:1.02}" +
    ".v-hub .hsub{text-align:center;font-size:18px;color:var(--ps-muted);max-width:560px;margin:10px auto 34px}" +
    ".v-hub .grid{display:grid;grid-template-columns:repeat(3,1fr);gap:18px}" +
    "@media(max-width:860px){.v-hub .grid{grid-template-columns:repeat(2,1fr)}}" +
    "@media(max-width:560px){.v-hub .grid{grid-template-columns:1fr}.inner{padding:36px 16px 44px}}" +
    ".v-hub .card{position:relative;text-align:left;background:#fff;border:1px solid var(--ps-border);border-radius:14px;padding:24px 22px 22px;cursor:pointer;transition:transform .16s ease,border-color .16s ease,box-shadow .16s ease;color:var(--ps-text);font-family:" + FONT + ";display:flex;flex-direction:column;min-height:186px;box-shadow:0 1px 3px rgba(0,0,0,.05)}" +
    ".v-hub .card:hover{transform:translateY(-3px);border-color:" + GOLD + ";box-shadow:0 10px 26px rgba(0,0,0,.12)}" +
    ".v-hub .card:focus-visible{outline:2px solid " + GOLD + ";outline-offset:2px}" +
    ".v-hub .card.soon{cursor:default;opacity:.6}.v-hub .card.soon:hover{transform:none;border-color:var(--ps-border);box-shadow:0 1px 3px rgba(0,0,0,.05)}" +
    ".v-hub .cicon{font-size:30px;line-height:1;color:" + GOLD + ";margin-bottom:14px}" +
    ".v-hub .ctitle{font-size:20px;font-weight:700;margin-bottom:7px;color:var(--ps-text)}" +
    ".v-hub .cblurb{font-size:15px;color:var(--ps-muted);flex:1}" +
    ".v-hub .copen{margin-top:16px;font-size:13px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;color:" + GOLD + "}" +
    ".v-hub .badge{position:absolute;top:16px;right:16px;font-size:10px;font-weight:700;letter-spacing:1.2px;text-transform:uppercase;color:var(--ps-on);background:" + GOLD + ";border-radius:999px;padding:4px 9px}" +
    ".v-hub .soonbadge{position:absolute;top:16px;right:16px;font-size:10px;font-weight:700;letter-spacing:1.2px;text-transform:uppercase;color:var(--ps-muted);border:1px solid var(--ps-border);border-radius:999px;padding:3px 9px}" +
    // views
    ".view{display:none}.view.show{display:block;animation:fadein .35s ease}" +
    "@keyframes fadein{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:none}}" +
    ".hubloading{text-align:center;padding:70px 20px;font-size:17px;color:var(--ps-muted)}" +
    ".hubspin{display:inline-block;width:34px;height:34px;border:3px solid var(--ps-border);border-top-color:" + GOLD + ";border-radius:50%;animation:sp 1s linear infinite;margin-bottom:16px}" +
    "@keyframes sp{to{transform:rotate(360deg)}}" +
    ".hubloaderr{text-align:center;padding:60px 20px;color:var(--ps-accent);font-size:16px}" +
    ".v-hub .foot{text-align:center;margin-top:34px;font-size:13px;color:var(--ps-muted)}";

  // Light theme matches the site (white background), so no starfield.
  function starsSvg() { return ""; }

  // ---- shared tool registry (modules call window.__PSHUB__.register) ----
  var HUB = window.__PSHUB__ = window.__PSHUB__ || { _reg: {}, _waiters: {}, register: function (id, def) {
    this._reg[id] = def;
    (this._waiters[id] || []).forEach(function (fn) { fn(def); });
    this._waiters[id] = [];
  } };
  function whenRegistered(id, timeoutMs) {
    return new Promise(function (resolve, reject) {
      if (HUB._reg[id]) return resolve(HUB._reg[id]);
      (HUB._waiters[id] = HUB._waiters[id] || []).push(resolve);
      setTimeout(function () { if (!HUB._reg[id]) reject(new Error("timeout")); }, timeoutMs || 12000);
    });
  }
  var loadedScript = {};
  function loadModule(id) {
    if (HUB._reg[id]) return Promise.resolve(HUB._reg[id]);
    if (!loadedScript[id]) {
      loadedScript[id] = true;
      var sc = document.createElement("script");
      sc.src = ORIGIN + "/embed/hub/" + id + ".js";
      sc.async = true;
      sc.onerror = function () { HUB._waiters[id] = []; };
      document.head.appendChild(sc);
    }
    return whenRegistered(id);
  }

  // ---- identity ----
  function getToken(host) {
    return host.getAttribute("data-token") || window.PS_HUB_TOKEN || null;
  }
  function getAnonId() {
    try {
      var k = "ps_hub_uid", v = localStorage.getItem(k);
      if (!v) { v = "anon-" + Math.abs(hash(String(Date.now()) + ":" + navigator.userAgent + ":" + Math.floor(performance.now()))).toString(36) + "-" + tinyRand(); localStorage.setItem(k, v); }
      return v;
    } catch (e) { return "anon-ephemeral"; }
  }
  function hash(s) { var h = 5381, i; for (i = 0; i < s.length; i++) h = ((h * 33) ^ s.charCodeAt(i)) | 0; return h; }
  function tinyRand() { var s = ""; var seed = (hash(String(Date.now())) >>> 0); for (var i = 0; i < 6; i++) { seed = (seed * 9301 + 49297) % 233280; s += "abcdefghijklmnopqrstuvwxyz0123456789"[Math.floor(seed / 233280 * 36)]; } return s; }

  function init(host) {
    if (host.__psHub) return; host.__psHub = true;
    if (!document.querySelector("link[data-ps-rsc-font]")) {
      var link = document.createElement("link"); link.rel = "stylesheet";
      link.href = "https://fonts.googleapis.com/css2?family=Great+Vibes&display=swap"; link.setAttribute("data-ps-rsc-font", "1");
      document.head.appendChild(link);
    }
    var root = host.attachShadow ? host.attachShadow({ mode: "open" }) : host;
    var style = document.createElement("style"); style.textContent = CSS;
    var wrap = document.createElement("div"); wrap.className = "wrap";
    wrap.innerHTML = starsSvg() +
      "<div class='inner'>" +
        "<div class='bar'><button class='back' type='button'>&#8592; All Tools</button><span class='barttl'></span></div>" +
        "<div class='view v-hub show'></div>" +
        "<div class='view v-tool'></div>" +
      "</div>";
    root.appendChild(style); root.appendChild(wrap);

    var $ = function (s) { return wrap.querySelector(s); };
    var hubView = $(".v-hub"), toolView = $(".v-tool"), bar = $(".bar"), barTtl = $(".barttl");
    var token = getToken(host);
    var userId = getAnonId();

    // context handed to every tool module
    var injected = {};
    var ctx = {
      origin: ORIGIN, gold: GOLD, font: FONT, glyph: GLYPH,
      token: token, userId: userId, authed: !!token,
      injectStyle: function (key, css) { if (injected[key]) return; injected[key] = true; var st = document.createElement("style"); st.setAttribute("data-mod", key); st.textContent = css; root.appendChild(st); },
      api: function (path, opts) {
        opts = opts || {}; opts.headers = opts.headers || {};
        if (token) opts.headers["X-PS-Hub-Token"] = token;
        opts.headers["X-PS-Hub-Uid"] = userId;
        if (opts.body && typeof opts.body !== "string") { opts.headers["Content-Type"] = "application/json"; opts.body = JSON.stringify(opts.body); }
        return fetch(ORIGIN + path, opts);
      },
      goHome: showHub,
      // Light-theme color tokens for tool modules (all CSS-variable backed).
      text: "var(--ps-text)", muted: "var(--ps-muted)", panel: "var(--ps-panel)",
      panel2: "var(--ps-panel2)", border: "var(--ps-border)", onAccent: "var(--ps-on)", accentDark: "var(--ps-accent-dark)"
    };

    // Shared, stateless AI UI: a grounded "personalized reading" block and an
    // in-session chat, both usable by any tool. Nothing is saved; the chat lives
    // only in the page. getFacts() returns the computed facts object at call time.
    ctx.injectStyle("aiui", "" +
      ".aiblock{max-width:720px;margin:26px auto 0;text-align:center}" +
      ".aibtn{font-family:" + FONT + ";font-size:16px;font-weight:600;color:var(--ps-on);background:" + GOLD + ";border:none;border-radius:999px;padding:13px 30px;cursor:pointer;box-shadow:0 2px 8px rgba(0,0,0,.12)}" +
      ".aibtn:hover{background:var(--ps-accent-dark)}" +
      ".aibtn:disabled{opacity:.6;cursor:default}" +
      ".aihint{font-size:13px;color:var(--ps-muted);margin-top:8px}" +
      ".aiout{text-align:left;margin-top:16px}" +
      ".aiout.card2{background:var(--ps-panel);border:1px solid var(--ps-border);border-radius:16px;padding:20px 22px}" +
      ".aiout h4{font-family:'Great Vibes',cursive;font-weight:400;font-size:30px;color:" + GOLD + ";margin-bottom:8px;text-align:center}" +
      ".aiout p{font-size:16.5px;line-height:1.75;color:var(--ps-text);margin-bottom:12px}.aiout p:last-child{margin-bottom:0}" +
      ".aispin{display:inline-block;width:16px;height:16px;border:2px solid rgba(255,255,255,.5);border-top-color:var(--ps-on);border-radius:50%;animation:aisp 1s linear infinite;vertical-align:-3px;margin-right:8px}@keyframes aisp{to{transform:rotate(360deg)}}" +
      ".aichat{max-width:720px;margin:20px auto 0;background:var(--ps-panel);border:1px solid var(--ps-border);border-radius:16px;padding:18px 20px}" +
      ".aichat h4{font-size:13px;letter-spacing:1.5px;text-transform:uppercase;color:" + GOLD + ";margin-bottom:12px;text-align:center}" +
      ".aithread{display:flex;flex-direction:column;gap:10px;margin-bottom:12px}" +
      ".aimsg{max-width:88%;padding:10px 14px;border-radius:14px;font-size:15.5px;line-height:1.6}" +
      ".aimsg.user{align-self:flex-end;background:var(--ps-accent);color:var(--ps-on)}" +
      ".aimsg.bot{align-self:flex-start;background:#fff;border:1px solid var(--ps-border);color:var(--ps-text)}" +
      ".airow{display:flex;gap:8px}.aiin{flex:1;padding:12px 14px;font-size:15px;font-family:" + FONT + ";color:var(--ps-text);background:#fff;border:1.5px solid var(--ps-border);border-radius:10px;outline:none}.aiin:focus{border-color:" + GOLD + "}.aiin::placeholder{color:var(--ps-muted)}" +
      ".aisend{font-family:" + FONT + ";font-size:15px;font-weight:600;color:var(--ps-on);background:" + GOLD + ";border:none;border-radius:10px;padding:0 20px;cursor:pointer}.aisend:hover{background:var(--ps-accent-dark)}.aisend:disabled{opacity:.6;cursor:default}" +
      // progress bar (used for every AI generation: readings, chat, dream image, transcription)
      ".psprog{max-width:520px;margin:16px auto 0}" +
      ".psbar{height:8px;background:var(--ps-panel2);border-radius:999px;overflow:hidden}" +
      ".psbar>i{display:block;height:100%;width:0;border-radius:999px;background:linear-gradient(90deg," + GOLD + ",var(--ps-accent-dark)," + GOLD + ");background-size:200% 100%;animation:psshim 1.1s linear infinite;transition:width .3s ease}" +
      "@keyframes psshim{0%{background-position:200% 0}100%{background-position:-200% 0}}" +
      ".pslabel{font-size:13px;color:var(--ps-muted);margin-top:8px;text-align:center}" +
      ".psprog.err .psbar>i{animation:none;background:var(--ps-accent)}.psprog.err .pslabel{color:var(--ps-accent)}");

    function paras(text) { return String(text).split(/\n\n+/).map(function (p) { return "<p>" + p.replace(/</g, "&lt;").replace(/\n/g, "<br>") + "</p>"; }).join(""); }

    // Reusable progress bar for unknown-duration AI work. Eases toward ~92% over
    // estMs, then completes on done(). Returns a controller.
    ctx.progress = function (container, opts) {
      opts = opts || {};
      var wrap = document.createElement("div"); wrap.className = "psprog";
      wrap.innerHTML = "<div class='psbar'><i></i></div>" + (opts.label ? "<div class='pslabel'>" + opts.label + "</div>" : "<div class='pslabel'></div>");
      container.appendChild(wrap);
      var fill = wrap.querySelector("i"), label = wrap.querySelector(".pslabel");
      var est = opts.estMs || 8000, start = Date.now(), cap = 0.92, finished = false, raf;
      function tick() { if (finished) return; var t = Date.now() - start; var p = cap * (1 - Math.exp(-t / est)); fill.style.width = (p * 100).toFixed(1) + "%"; raf = requestAnimationFrame(tick); }
      raf = requestAnimationFrame(tick);
      return {
        el: wrap,
        setLabel: function (s) { label.textContent = s; },
        done: function () { finished = true; if (raf) cancelAnimationFrame(raf); fill.style.width = "100%"; setTimeout(function () { if (wrap.parentNode) wrap.parentNode.removeChild(wrap); }, 350); },
        fail: function (msg) { finished = true; if (raf) cancelAnimationFrame(raf); wrap.classList.add("err"); fill.style.width = "100%"; label.textContent = msg || "Something went wrong."; }
      };
    };

    ctx.aiReading = function (container, kind, getFacts, opts) {
      opts = opts || {};
      var block = document.createElement("div"); block.className = "aiblock";
      block.innerHTML = "<button class='aibtn' type='button'>" + (opts.label || "Reveal your personalized reading") + "</button>" +
        (opts.hint ? "<div class='aihint'>" + opts.hint + "</div>" : "") + "<div class='aiout'></div>";
      container.appendChild(block);
      var btn = block.querySelector(".aibtn"), out = block.querySelector(".aiout");
      function run() {
        btn.disabled = true; var orig = btn.getAttribute("data-orig") || btn.textContent; btn.setAttribute("data-orig", orig); btn.textContent = "Generating...";
        out.className = "aiout"; out.innerHTML = "";
        var prog = ctx.progress(out, { estMs: opts.estMs || 8000, label: opts.working || "Reading the signs..." });
        ctx.api("/api/hub/ai/interpret", { method: "POST", body: { kind: kind, facts: getFacts(), mode: opts.mode } })
          .then(function (r) { return r.ok ? r.json() : r.json().then(function (j) { throw new Error(j.error || "Error"); }); })
          .then(function (d) { prog.done(); out.className = "aiout card2"; out.innerHTML = (opts.title ? "<h4>" + opts.title + "</h4>" : "") + paras(d.text); btn.disabled = false; btn.textContent = "Regenerate reading"; })
          .catch(function (e) { prog.fail(e.message); btn.disabled = false; btn.textContent = orig; });
      }
      btn.addEventListener("click", run);
      if (opts.auto) run();
      return block;
    };

    ctx.aiChat = function (container, kind, getFacts, opts) {
      opts = opts || {};
      var box = document.createElement("div"); box.className = "aichat";
      box.innerHTML = "<h4>" + (opts.title || "Ask a follow-up") + "</h4><div class='aithread'></div>" +
        "<div class='airow'><input class='aiin' type='text' placeholder='" + (opts.placeholder || "Ask a question...") + "'><button class='aisend' type='button'>Ask</button></div>";
      container.appendChild(box);
      var thread = box.querySelector(".aithread"), input = box.querySelector(".aiin"), send = box.querySelector(".aisend");
      var messages = [];
      function esc(s) { return String(s).replace(/[&<>]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;" }[c]; }); }
      function bubble(role, text) { var d = document.createElement("div"); d.className = "aimsg " + role; d.innerHTML = esc(text).replace(/\n/g, "<br>"); thread.appendChild(d); return d; }
      function ask() {
        var text = input.value.trim(); if (!text) return;
        bubble("user", text); messages.push({ role: "user", content: text }); input.value = ""; send.disabled = true;
        var typing = bubble("bot", ""); typing.style.minWidth = "160px";
        var prog = ctx.progress(typing, { estMs: 6000, label: "" }); prog.el.style.margin = "2px 0";
        ctx.api("/api/hub/ai/chat", { method: "POST", body: { kind: kind, facts: getFacts(), messages: messages } })
          .then(function (r) { return r.ok ? r.json() : r.json().then(function (j) { throw new Error(j.error || "Error"); }); })
          .then(function (d) { prog.done(); typing.style.minWidth = ""; typing.innerHTML = esc(d.reply).replace(/\n/g, "<br>"); messages.push({ role: "assistant", content: d.reply }); send.disabled = false; })
          .catch(function (e) { prog.fail(""); typing.textContent = e.message; send.disabled = false; });
      }
      send.addEventListener("click", ask);
      input.addEventListener("keydown", function (e) { if (e.key === "Enter") ask(); });
      return box;
    };

    function renderHub() {
      var cards = TOOLS.map(function (t) {
        if (!t.enabled) {
          return "<div class='card soon'><span class='soonbadge'>Soon</span>" +
            "<div class='cicon'>" + t.icon + GLYPH + "</div><div class='ctitle'>" + t.title + "</div>" +
            "<div class='cblurb'>" + t.blurb + "</div></div>";
        }
        return "<div class='card' role='button' tabindex='0' data-tool='" + t.id + "'>" +
          "<div class='cicon'>" + t.icon + GLYPH + "</div><div class='ctitle'>" + t.title + "</div>" +
          "<div class='cblurb'>" + t.blurb + "</div><div class='copen'>Open &#8594;</div></div>";
      }).join("");
      hubView.innerHTML =
        "<div class='eyebrow'>Psychic Source</div>" +
        "<h1 class='htitle'>Member Tools</h1>" +
        "<p class='hsub'>Your subscriber-only collection of spiritual tools. Explore, reflect, and come back anytime.</p>" +
        "<div class='grid'>" + cards + "</div>" +
        "<div class='foot'>Available exclusively to Psychic Source members.</div>";
      hubView.querySelectorAll(".card[data-tool]").forEach(function (c) {
        var open = function () { openTool(c.getAttribute("data-tool")); };
        c.addEventListener("click", open);
        c.addEventListener("keydown", function (e) { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); open(); } });
      });
    }

    function showHub() {
      bar.classList.remove("show");
      toolView.classList.remove("show"); toolView.innerHTML = "";
      hubView.classList.add("show");
      wrap.scrollIntoView({ behavior: "smooth", block: "start" });
    }

    function openTool(id) {
      var meta = TOOLS.filter(function (t) { return t.id === id; })[0] || { title: "" };
      hubView.classList.remove("show");
      barTtl.textContent = meta.title; bar.classList.add("show");
      toolView.classList.add("show");
      toolView.innerHTML = "<div class='hubloading'><div class='hubspin'></div><div>Loading " + meta.title + "...</div></div>";
      wrap.scrollIntoView({ behavior: "smooth", block: "start" });
      loadModule(id).then(function (def) {
        toolView.innerHTML = "";
        var mount = document.createElement("div"); toolView.appendChild(mount);
        def.render(mount, ctx);
      }).catch(function () {
        toolView.innerHTML = "<div class='hubloaderr'>This tool could not load right now. Please try again in a moment.</div>";
      });
    }

    $(".back").addEventListener("click", showHub);
    renderHub();
  }

  function boot() { var host = document.getElementById("ps-tools-hub") || document.querySelector("[data-ps-widget='tools-hub']"); if (host) init(host); }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot); else boot();
})();
