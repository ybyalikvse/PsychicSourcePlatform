/* Dream Journal - hub tool module (subscriber-only).
 * Saves entries to the PsychicSourcePlatform database via /api/hub/dreams,
 * keyed to the hub user id. Features: entry list, calendar-aware dates,
 * pattern analysis, and four AI features (interpretation, follow-up chat,
 * dream image, and voice-to-text). No email.
 */
(function () {
  "use strict";

  var MOODS = ["Peaceful", "Happy", "Anxious", "Afraid", "Sad", "Confused", "Excited", "Neutral"];
  var LENSES = [["emotional", "Emotional"], ["symbolic", "Symbolic"], ["spiritual", "Spiritual"], ["practical", "Practical"]];

  function render(mount, ctx) {
    var GOLD = ctx.gold, FONT = ctx.font;
    ctx.injectStyle("dj", "" +
      ".dj{color:var(--ps-text);font-family:" + FONT + "}" +
      ".dj .djview{animation:djf .3s ease}@keyframes djf{from{opacity:0}to{opacity:1}}" +
      ".dj .hd{display:flex;align-items:center;justify-content:space-between;gap:12px;flex-wrap:wrap;margin-bottom:20px}" +
      ".dj h3{font-family:'Great Vibes',cursive;font-weight:400;font-size:40px;color:" + GOLD + ";line-height:1}" +
      ".dj .hactions{display:flex;gap:10px}" +
      ".dj .btn{font-family:" + FONT + ";font-size:15px;font-weight:600;color:var(--ps-on);background:" + GOLD + ";border:none;border-radius:999px;padding:11px 22px;cursor:pointer;box-shadow:0 3px 12px rgba(0,0,0,.10)}" +
      ".dj .btn.ghost{color:" + GOLD + ";background:var(--ps-panel);border:1px solid var(--ps-border);box-shadow:none}" +
      ".dj .btn:disabled{opacity:.55;cursor:default}" +
      ".dj .link{color:" + GOLD + ";background:none;border:none;cursor:pointer;font-family:" + FONT + ";font-size:15px;font-weight:600}" +
      ".dj .empty{text-align:center;padding:50px 20px;color:var(--ps-muted);font-size:17px}" +
      ".dj .list{display:grid;grid-template-columns:repeat(2,1fr);gap:14px}@media(max-width:600px){.dj .list{grid-template-columns:1fr}}" +
      ".dj .card{display:flex;gap:14px;text-align:left;background:var(--ps-panel);border:1px solid var(--ps-border);border-radius:14px;padding:14px 16px;cursor:pointer;transition:border-color .15s,transform .15s;color:var(--ps-text);font-family:" + FONT + "}" +
      ".dj .card:hover{border-color:" + GOLD + ";transform:translateY(-2px)}" +
      ".dj .thumb{flex:0 0 56px;width:56px;height:56px;border-radius:10px;background:var(--ps-panel) center/cover no-repeat;display:flex;align-items:center;justify-content:center;font-size:24px;color:var(--ps-muted)}" +
      ".dj .cbody{flex:1;min-width:0}" +
      ".dj .cdate{font-size:12px;letter-spacing:1px;text-transform:uppercase;color:" + GOLD + "}" +
      ".dj .ctitle{font-size:17px;font-weight:600;margin:2px 0 3px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}" +
      ".dj .cprev{font-size:14px;color:var(--ps-muted);display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}" +
      ".dj .flags{margin-top:6px}.dj .flag{display:inline-block;font-size:11px;font-weight:700;letter-spacing:.5px;text-transform:uppercase;color:" + GOLD + ";border:1px solid rgba(165,18,27,.5);border-radius:999px;padding:2px 8px;margin-right:5px}" +
      ".dj label{display:block;font-size:13px;letter-spacing:1px;text-transform:uppercase;color:var(--ps-muted);margin:16px 0 6px}" +
      ".dj input[type=text],.dj input[type=date],.dj textarea,.dj select{width:100%;padding:12px 14px;font-size:16px;font-family:" + FONT + ";color:var(--ps-text);background:var(--ps-panel);border:1.5px solid var(--ps-border);border-radius:10px;outline:none;color-scheme:light}" +
      ".dj textarea{min-height:150px;resize:vertical;line-height:1.6}" +
      ".dj input:focus,.dj textarea:focus,.dj select:focus{border-color:" + GOLD + "}" +
      ".dj select option{color:#1c1c2e;background:#fff}" +
      ".dj .narrwrap{position:relative}.dj .mic{position:absolute;right:10px;bottom:10px;width:44px;height:44px;border-radius:50%;border:none;background:rgba(165,18,27,.9);color:var(--ps-on);font-size:20px;cursor:pointer;display:flex;align-items:center;justify-content:center;box-shadow:0 3px 10px rgba(0,0,0,.10)}" +
      ".dj .mic.rec{background:#c0392b;color:var(--ps-on);animation:pulse 1.2s infinite}@keyframes pulse{0%,100%{box-shadow:0 0 0 0 rgba(192,57,43,.5)}50%{box-shadow:0 0 0 10px rgba(192,57,43,0)}}" +
      ".dj .mic small{position:absolute}" +
      ".dj .micnote{font-size:13px;color:var(--ps-muted);margin-top:6px}" +
      ".dj .checks{display:flex;gap:18px;flex-wrap:wrap;margin-top:14px}" +
      ".dj .chk{display:flex;align-items:center;gap:8px;font-size:15px;cursor:pointer}.dj .chk input{width:auto}" +
      ".dj .err{display:none;margin-top:12px;color:var(--ps-accent);font-size:15px}.dj .err.show{display:block}" +
      ".dj .detail .dtop{display:flex;justify-content:space-between;align-items:flex-start;gap:12px;flex-wrap:wrap}" +
      ".dj .dnarr{font-size:17px;line-height:1.75;color:var(--ps-text);white-space:pre-wrap;margin:12px 0 18px}" +
      ".dj .aiactions{display:flex;gap:10px;flex-wrap:wrap;margin-bottom:8px}" +
      ".dj .block{background:var(--ps-panel);border:1px solid var(--ps-border);border-radius:14px;padding:18px 20px;margin-top:16px}" +
      ".dj .block h4{font-size:13px;letter-spacing:1.5px;text-transform:uppercase;color:" + GOLD + ";margin-bottom:10px}" +
      ".dj .interp{font-size:16.5px;line-height:1.75;color:var(--ps-text);white-space:pre-wrap}" +
      ".dj .dimg{width:100%;max-width:520px;border-radius:12px;display:block;margin:0 auto;box-shadow:0 8px 24px rgba(0,0,0,.10)}" +
      ".dj .chatthread{display:flex;flex-direction:column;gap:10px;margin-bottom:12px}" +
      ".dj .msg{max-width:85%;padding:10px 14px;border-radius:14px;font-size:15.5px;line-height:1.6}" +
      ".dj .msg.user{align-self:flex-end;background:rgba(165,18,27,.2);border:1px solid rgba(165,18,27,.4)}" +
      ".dj .msg.assistant{align-self:flex-start;background:var(--ps-panel);border:1px solid var(--ps-border)}" +
      ".dj .chatrow{display:flex;gap:8px}.dj .chatrow input{flex:1}" +
      ".dj .spin{display:inline-block;width:16px;height:16px;border:2px solid rgba(36,21,5,.35);border-top-color:var(--ps-on);border-radius:50%;animation:djs 1s linear infinite;vertical-align:-3px;margin-right:6px}@keyframes djs{to{transform:rotate(360deg)}}" +
      ".dj .stats{display:grid;grid-template-columns:repeat(4,1fr);gap:12px;margin-bottom:20px}@media(max-width:560px){.dj .stats{grid-template-columns:repeat(2,1fr)}}" +
      ".dj .stat{background:var(--ps-panel);border:1px solid var(--ps-border);border-radius:14px;padding:16px;text-align:center}" +
      ".dj .stat .n{font-size:30px;font-weight:700;color:" + GOLD + "}.dj .stat .l{font-size:13px;color:var(--ps-muted);margin-top:2px}" +
      ".dj .chips{display:flex;gap:8px;flex-wrap:wrap;margin-top:8px}.dj .chip{font-size:14px;background:var(--ps-panel);border:1px solid var(--ps-border);border-radius:999px;padding:5px 12px}.dj .chip b{color:" + GOLD + "}" +
      ".dj .wk{display:flex;gap:6px;align-items:flex-end;height:90px;margin-top:10px}.dj .wkbar{flex:1;display:flex;flex-direction:column;align-items:center;gap:6px}.dj .wkfill{width:100%;background:" + GOLD + ";border-radius:6px 6px 0 0;min-height:3px}.dj .wkl{font-size:12px;color:var(--ps-muted)}" +
      // tabs
      ".dj .djtop{display:flex;justify-content:space-between;align-items:flex-end;gap:12px;flex-wrap:wrap;border-bottom:1px solid var(--ps-border);margin-bottom:20px}" +
      ".dj .djtop .new{margin-bottom:8px}" +
      ".dj .djtabs{display:flex;gap:4px}" +
      ".dj .djtab{font-family:" + FONT + ";font-size:15px;font-weight:600;color:var(--ps-muted);background:none;border:none;border-bottom:2px solid transparent;padding:10px 16px;margin-bottom:-1px;cursor:pointer}" +
      ".dj .djtab:hover{color:var(--ps-text)}.dj .djtab.on{color:" + GOLD + ";border-bottom-color:" + GOLD + "}" +
      // mood chips + quality toggles
      ".dj .chiprow{display:flex;gap:8px;flex-wrap:wrap}" +
      ".dj .mchip,.dj .qtoggle,.dj .emochip{font-family:" + FONT + ";font-size:14px;color:var(--ps-text);background:var(--ps-panel);border:1.5px solid var(--ps-border);border-radius:999px;padding:8px 16px;cursor:pointer}" +
      ".dj .mchip:hover,.dj .qtoggle:hover,.dj .emochip:hover{border-color:var(--ps-muted)}" +
      ".dj .mchip.on,.dj .qtoggle.on,.dj .emochip.on{color:var(--ps-on);background:" + GOLD + ";border-color:" + GOLD + "}" +
      ".dj .moretoggle{display:block;margin-top:18px;font-family:" + FONT + ";font-size:14px;font-weight:600;color:" + GOLD + ";background:none;border:none;cursor:pointer;padding:4px 0}.dj .moretoggle:hover{text-decoration:underline}" +
      ".dj .moresec label:first-child{margin-top:14px}" +
      // detail meta + share
      ".dj .dmeta{display:flex;gap:10px;flex-wrap:wrap;margin:14px 0}" +
      ".dj .dmeta .mitem{background:var(--ps-panel);border:1px solid var(--ps-border);border-radius:12px;padding:8px 14px;font-size:13px;color:var(--ps-muted);text-align:center}" +
      ".dj .dmeta .mitem b{display:block;color:" + GOLD + ";font-size:15px}" +
      ".dj .sharebox:empty{display:none}.dj .sharebox{margin:6px 0 4px}" +
      ".dj .sharelink{display:flex;gap:8px;align-items:center;flex-wrap:wrap;background:var(--ps-panel);border:1px solid var(--ps-border);border-radius:12px;padding:10px 12px}" +
      ".dj .sharelink input{flex:1;min-width:180px;border:none;background:none;font-size:14px;color:var(--ps-text);outline:none}" +
      ".dj .sharelink .btn{font-size:13px;padding:8px 16px}" +
      // interpretation lenses + section headers + image gallery
      ".dj .sech{font-family:'Great Vibes',cursive;font-weight:400;font-size:30px;color:" + GOLD + ";margin:26px 0 12px}" +
      ".dj .lenstabs{display:flex;gap:6px;flex-wrap:wrap;margin-bottom:6px}" +
      ".dj .lenstab{font-family:" + FONT + ";font-size:14px;font-weight:600;color:" + GOLD + ";background:var(--ps-panel);border:1.5px solid var(--ps-border);border-radius:999px;padding:8px 16px;cursor:pointer}" +
      ".dj .lenstab:hover{border-color:" + GOLD + "}.dj .lenstab.on{color:var(--ps-on);background:" + GOLD + ";border-color:" + GOLD + "}" +
      ".dj .interp .regen,.dj .block .regen{margin-top:10px;display:inline-block}" +
      ".dj .dmain{width:100%;max-width:520px;border-radius:12px;display:block;margin:0 auto;box-shadow:0 8px 24px rgba(0,0,0,.12)}" +
      ".dj .dthumbs{display:flex;gap:8px;flex-wrap:wrap;justify-content:center;margin-top:12px}" +
      ".dj .dthumb{width:60px;height:60px;object-fit:cover;border-radius:8px;cursor:pointer;border:2px solid transparent;opacity:.7}.dj .dthumb.on,.dj .dthumb:hover{border-color:" + GOLD + ";opacity:1}" +
      // calendar
      ".dj .cal{max-width:640px;margin:0 auto}" +
      ".dj .calhead{display:flex;align-items:center;justify-content:space-between;margin-bottom:12px}" +
      ".dj .calhead .m{font-size:19px;font-weight:700}" +
      ".dj .calnav{font-family:" + FONT + ";font-size:20px;color:" + GOLD + ";background:var(--ps-panel);border:1px solid var(--ps-border);border-radius:8px;width:38px;height:38px;cursor:pointer;line-height:1}" +
      ".dj .calnav:hover{background:var(--ps-panel2)}" +
      ".dj .caldow{display:grid;grid-template-columns:repeat(7,1fr);gap:6px;margin-bottom:6px}.dj .caldow span{text-align:center;font-size:11px;letter-spacing:1px;text-transform:uppercase;color:var(--ps-muted)}" +
      ".dj .calgrid{display:grid;grid-template-columns:repeat(7,1fr);gap:6px}" +
      ".dj .calcell{aspect-ratio:1;border:1px solid var(--ps-border);border-radius:10px;padding:6px;display:flex;flex-direction:column;align-items:flex-start;font-size:13px;color:var(--ps-text);background:#fff}" +
      ".dj .calcell.out{color:var(--ps-muted);background:var(--ps-panel);opacity:.6}" +
      ".dj .calcell.today{border-color:" + GOLD + "}" +
      ".dj .calcell.has{cursor:pointer;background:rgba(165,18,27,.06);border-color:rgba(165,18,27,.3)}.dj .calcell.has:hover{background:rgba(165,18,27,.12)}" +
      ".dj .caldots{margin-top:auto;display:flex;gap:3px;flex-wrap:wrap}.dj .caldot{width:7px;height:7px;border-radius:50%;background:" + GOLD + "}" +
      ".dj .daypanel{margin-top:18px}.dj .dayttl{font-size:14px;font-weight:700;color:" + GOLD + ";margin-bottom:8px;text-align:center}" +
      // title suggest
      ".dj .titlerow{display:flex;gap:8px;align-items:center}.dj .titlerow input{flex:1}" +
      ".dj .suggest{font-family:" + FONT + ";font-size:13px;font-weight:600;color:" + GOLD + ";background:var(--ps-panel);border:1px solid var(--ps-border);border-radius:8px;padding:11px 14px;cursor:pointer;white-space:nowrap}.dj .suggest:hover{background:var(--ps-panel2)}.dj .suggest:disabled{opacity:.6;cursor:default}");

    var el = document.createElement("div"); el.className = "dj"; mount.appendChild(el);
    var api = ctx.api;

    function jerr(r) { return r.json().then(function (j) { throw new Error(j.error || "Something went wrong."); }); }
    function call(path, opts) { return api(path, opts).then(function (r) { return r.ok ? r.json() : jerr(r); }); }
    function esc(s) { return String(s == null ? "" : s).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); }
    function fmtDate(iso) { var d = new Date(iso + "T00:00:00"); return d.toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric", year: "numeric" }); }
    function todayIso() { var d = new Date(); return d.getFullYear() + "-" + ("0" + (d.getMonth() + 1)).slice(-2) + "-" + ("0" + d.getDate()).slice(-2); }

    // ---------------- Shared shell with tabs ----------------
    function shell(active) {
      function tab(k, label) { return "<button class='djtab" + (k === active ? " on" : "") + "' data-tab='" + k + "' type='button'>" + label + "</button>"; }
      el.innerHTML = "<div class='djview'>" +
        "<div class='djtop'><div class='djtabs'>" + tab("entries", "Entries") + tab("calendar", "Calendar") + tab("patterns", "Patterns") + "</div>" +
        "<button class='btn new' type='button'>+ New Dream</button></div>" +
        "<div class='dj-content'></div></div>";
      el.querySelector(".new").addEventListener("click", function () { form(null); });
      el.querySelector("[data-tab='entries']").addEventListener("click", home);
      el.querySelector("[data-tab='calendar']").addEventListener("click", calendar);
      el.querySelector("[data-tab='patterns']").addEventListener("click", patterns);
      return el.querySelector(".dj-content");
    }

    function dreamCard(d) {
      var flags = [d.isLucid ? "Lucid" : null, d.isRecurring ? "Recurring" : null, d.isNightmare ? "Nightmare" : null].filter(Boolean);
      var thumb = d.imageUrl ? "<div class='thumb' style='background-image:url(" + esc(d.imageUrl) + ")'></div>" : "<div class='thumb'>&#9789;&#xFE0E;</div>";
      return "<div class='card' data-id='" + d.id + "'>" + thumb + "<div class='cbody'>" +
        "<div class='cdate'>" + fmtDate(d.dreamtOn) + "</div>" +
        "<div class='ctitle'>" + esc(d.title || "Untitled dream") + "</div>" +
        "<div class='cprev'>" + esc(d.narrative) + "</div>" +
        (flags.length ? "<div class='flags'>" + flags.map(function (f) { return "<span class='flag'>" + f + "</span>"; }).join("") + "</div>" : "") +
        "</div></div>";
    }
    function wireCards(container) { container.querySelectorAll(".card").forEach(function (c) { c.addEventListener("click", function () { detail(c.getAttribute("data-id")); }); }); }

    // ---------------- Entries (list) ----------------
    function home() {
      var c = shell("entries"); c.innerHTML = "<div class='empty'>Loading your dreams...</div>";
      call("/api/hub/dreams").then(function (data) {
        if (!data.dreams.length) { c.innerHTML = "<div class='empty'>Your dream journal is empty. Record your first dream and watch the patterns emerge over time.</div>"; return; }
        c.innerHTML = "<div class='list'>" + data.dreams.map(dreamCard).join("") + "</div>";
        wireCards(c);
      }).catch(function (e) { c.innerHTML = "<div class='empty'>" + esc(e.message) + "</div>"; });
    }

    // ---------------- Calendar ----------------
    function calendar() {
      var c = shell("calendar"); c.innerHTML = "<div class='empty'>Loading your calendar...</div>";
      call("/api/hub/dreams").then(function (data) { renderCalendar(c, data.dreams); }).catch(function (e) { c.innerHTML = "<div class='empty'>" + esc(e.message) + "</div>"; });
    }
    function pad2(n) { return (n < 10 ? "0" : "") + n; }
    function isoOf(dt) { return dt.getFullYear() + "-" + pad2(dt.getMonth() + 1) + "-" + pad2(dt.getDate()); }
    function renderCalendar(c, dreams) {
      var byDate = {};
      dreams.forEach(function (d) { (byDate[d.dreamtOn] = byDate[d.dreamtOn] || []).push(d); });
      var cursor = dreams.length ? new Date(dreams[0].dreamtOn + "T00:00:00") : new Date();
      cursor = new Date(cursor.getFullYear(), cursor.getMonth(), 1);
      var MN = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
      var DOW = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
      function draw() {
        var y = cursor.getFullYear(), m = cursor.getMonth();
        var first = new Date(y, m, 1), startOffset = first.getDay();
        var gridStart = new Date(y, m, 1 - startOffset);
        var todayKey = isoOf(new Date());
        var cells = "";
        for (var i = 0; i < 42; i++) {
          var dt = new Date(gridStart.getFullYear(), gridStart.getMonth(), gridStart.getDate() + i);
          var key = isoOf(dt), inMonth = dt.getMonth() === m, list = byDate[key] || [];
          var cls = "calcell" + (inMonth ? "" : " out") + (key === todayKey ? " today" : "") + (list.length ? " has" : "");
          var dots = list.length ? "<div class='caldots'>" + list.slice(0, 4).map(function () { return "<span class='caldot'></span>"; }).join("") + "</div>" : "";
          cells += "<div class='" + cls + "'" + (list.length ? " data-day='" + key + "'" : "") + "><span>" + dt.getDate() + "</span>" + dots + "</div>";
        }
        c.innerHTML = "<div class='cal'>" +
          "<div class='calhead'><button class='calnav prev' type='button'>&#8249;</button><div class='m'>" + MN[m] + " " + y + "</div><button class='calnav next' type='button'>&#8250;</button></div>" +
          "<div class='caldow'>" + DOW.map(function (d) { return "<span>" + d + "</span>"; }).join("") + "</div>" +
          "<div class='calgrid'>" + cells + "</div>" +
          "<div class='daypanel'></div></div>";
        c.querySelector(".prev").addEventListener("click", function () { cursor = new Date(y, m - 1, 1); draw(); });
        c.querySelector(".next").addEventListener("click", function () { cursor = new Date(y, m + 1, 1); draw(); });
        c.querySelectorAll(".calcell.has").forEach(function (cell) {
          cell.addEventListener("click", function () {
            var list = byDate[cell.getAttribute("data-day")] || [];
            if (list.length === 1) { detail(list[0].id); return; }
            var dp = c.querySelector(".daypanel");
            dp.innerHTML = "<div class='dayttl'>" + fmtDate(cell.getAttribute("data-day")) + "</div><div class='list'>" + list.map(dreamCard).join("") + "</div>";
            wireCards(dp); dp.scrollIntoView({ behavior: "smooth", block: "nearest" });
          });
        });
      }
      draw();
    }

    // ---------------- New / edit form ----------------
    var FLAGS = [["isLucid", "Lucid"], ["isRecurring", "Recurring"], ["isNightmare", "Nightmare"]];
    var XFLAGS = [["isFalseAwakening", "False awakening"], ["isSleepParalysis", "Sleep paralysis"]];
    var EMOTIONS = ["Joy", "Fear", "Love", "Anger", "Sadness", "Peace", "Confusion", "Wonder", "Anxiety", "Excitement", "Grief", "Freedom"];
    var POVS = ["First person", "Observer"];
    var AGENCIES = ["In control", "Some control", "Powerless", "Just observing"];
    function chipHtml(cls, val, label, on) { return "<button type='button' class='" + cls + (on ? " on" : "") + "' data-v='" + esc(val) + "'>" + esc(label) + "</button>"; }
    function ratingRow(sel, cur) { var s = ""; for (var i = 1; i <= 5; i++) s += chipHtml("mchip", i, i, cur === i); return "<div class='chiprow " + sel + "'>" + s + "</div>"; }
    function singleGroup(container) { if (!container) return; container.querySelectorAll(".mchip").forEach(function (chip) { chip.addEventListener("click", function () { var was = chip.classList.contains("on"); container.querySelectorAll(".mchip").forEach(function (x) { x.classList.remove("on"); }); if (!was) chip.classList.add("on"); }); }); }
    function multiGroup(container, cls) { if (!container) return; container.querySelectorAll("." + cls).forEach(function (chip) { chip.addEventListener("click", function () { chip.classList.toggle("on"); }); }); }
    function selVal(container) { var on = container && container.querySelector(".mchip.on"); return on ? on.getAttribute("data-v") : null; }

    function form(existing) {
      var d = existing || {};
      function has(arr, v) { return (arr || []).indexOf(v) !== -1; }
      el.innerHTML = "<div class='djview'><div class='hd'><h3>" + (existing ? "Edit Dream" : "New Dream") + "</h3><button class='link back' type='button'>&#8592; Back</button></div>" +
        "<label>Date of the dream</label><input type='date' data-f='date' max='" + todayIso() + "' value='" + (d.dreamtOn || todayIso()) + "'>" +
        "<label>What happened in your dream?</label><div class='narrwrap'><textarea data-f='narrative' placeholder='Describe your dream in as much detail as you can remember...'>" + esc(d.narrative || "") + "</textarea>" +
        "<button class='mic' type='button' title='Record with your voice' aria-label='Record with your voice'>&#127908;&#xFE0E;</button></div>" +
        "<div class='micnote'>Tip: tap the microphone to speak your dream and we will transcribe it.</div>" +
        "<label>Title (optional)</label><div class='titlerow'><input type='text' data-f='title' placeholder='Give your dream a name' value=\"" + esc(d.title || "") + "\"><button class='suggest' type='button'>Suggest</button></div>" +
        "<label>Mood on waking</label><div class='chiprow moodrow'>" + MOODS.map(function (m) { return "<button type='button' class='mchip" + (d.mood === m ? " on" : "") + "' data-v='" + m + "'>" + m + "</button>"; }).join("") + "</div>" +
        "<label>Dream qualities</label><div class='chiprow qtoggles'>" + FLAGS.map(function (f) { return "<button type='button' class='qtoggle" + (d[f[0]] ? " on" : "") + "' data-flag='" + f[0] + "'>" + f[1] + "</button>"; }).join("") + "</div>" +
        "<div class='micnote' style='margin-top:12px'>We will pull out the recurring themes of your dream automatically.</div>" +
        "<button class='moretoggle' type='button'>+ More details (optional)</button>" +
        "<div class='moresec' style='display:none'>" +
          "<label>How vivid was it?</label>" + ratingRow("vivrow", d.vividness) +
          "<label>Sleep quality</label>" + ratingRow("slprow", d.sleepQuality) +
          "<label>Mood before sleep</label><div class='chiprow mbrow'>" + MOODS.map(function (m) { return chipHtml("mchip", m, m, d.moodBeforeSleep === m); }).join("") + "</div>" +
          "<label>Emotions in the dream</label><div class='chiprow emorow'>" + EMOTIONS.map(function (e2) { return chipHtml("emochip", e2, e2, has(d.emotions, e2)); }).join("") + "</div>" +
          "<label>Point of view</label><div class='chiprow povrow'>" + POVS.map(function (p) { return chipHtml("mchip", p, p, d.pov === p); }).join("") + "</div>" +
          "<label>Sense of control</label><div class='chiprow agrow'>" + AGENCIES.map(function (a) { return chipHtml("mchip", a, a, d.agency === a); }).join("") + "</div>" +
          "<label>Other qualities</label><div class='chiprow qtoggles2'>" + XFLAGS.map(function (f) { return "<button type='button' class='qtoggle" + (d[f[0]] ? " on" : "") + "' data-flag='" + f[0] + "'>" + f[1] + "</button>"; }).join("") + "</div>" +
        "</div>" +
        "<div style='margin-top:24px'><button class='btn save' type='button'>" + (existing ? "Save Changes" : "Save Dream") + "</button></div>" +
        "<div class='err' role='alert'></div></div>";
      el.querySelector(".back").addEventListener("click", function () { existing ? detail(existing.id) : home(); });
      setupMic(el.querySelector(".mic"), el.querySelector("[data-f='narrative']"));
      var err = el.querySelector(".err");
      singleGroup(el.querySelector(".moodrow")); singleGroup(el.querySelector(".vivrow")); singleGroup(el.querySelector(".slprow")); singleGroup(el.querySelector(".mbrow")); singleGroup(el.querySelector(".povrow")); singleGroup(el.querySelector(".agrow"));
      multiGroup(el.querySelector(".qtoggles"), "qtoggle"); multiGroup(el.querySelector(".qtoggles2"), "qtoggle"); multiGroup(el.querySelector(".emorow"), "emochip");
      // reveal More details automatically when editing a dream that already has extras
      var moreBtn = el.querySelector(".moretoggle"), moreSec = el.querySelector(".moresec");
      var hasExtra = d.vividness || d.sleepQuality || d.moodBeforeSleep || d.pov || d.agency || (d.emotions && d.emotions.length) || d.isFalseAwakening || d.isSleepParalysis;
      if (hasExtra) { moreSec.style.display = ""; moreBtn.style.display = "none"; }
      moreBtn.addEventListener("click", function () { moreSec.style.display = ""; moreBtn.style.display = "none"; });
      // AI title suggestion
      var sug = el.querySelector(".suggest");
      sug.addEventListener("click", function () {
        var narrative = el.querySelector("[data-f='narrative']").value.trim();
        if (!narrative) { err.textContent = "Write your dream first, then I can suggest a title."; err.classList.add("show"); return; }
        err.classList.remove("show"); sug.disabled = true; var o = sug.textContent; sug.textContent = "...";
        call("/api/hub/ai/title", { method: "POST", body: { narrative: narrative } })
          .then(function (r) { el.querySelector("[data-f='title']").value = r.title || ""; sug.disabled = false; sug.textContent = o; })
          .catch(function (e) { sug.disabled = false; sug.textContent = o; err.textContent = e.message; err.classList.add("show"); });
      });
      el.querySelector(".save").addEventListener("click", function () {
        var g = function (f) { return el.querySelector("[data-f='" + f + "']"); };
        var narrative = g("narrative").value.trim();
        if (!narrative) { err.textContent = "Please describe your dream."; err.classList.add("show"); return; }
        var flagOn = {}; el.querySelectorAll(".qtoggle.on").forEach(function (t) { flagOn[t.getAttribute("data-flag")] = true; });
        var emotions = []; el.querySelectorAll(".emorow .emochip.on").forEach(function (c) { emotions.push(c.getAttribute("data-v")); });
        var viv = selVal(el.querySelector(".vivrow")), slp = selVal(el.querySelector(".slprow"));
        var payload = {
          dreamtOn: g("date").value || todayIso(), title: g("title").value.trim() || null, narrative: narrative,
          mood: selVal(el.querySelector(".moodrow")),
          isLucid: !!flagOn.isLucid, isRecurring: !!flagOn.isRecurring, isNightmare: !!flagOn.isNightmare,
          isFalseAwakening: !!flagOn.isFalseAwakening, isSleepParalysis: !!flagOn.isSleepParalysis,
          vividness: viv ? +viv : null, sleepQuality: slp ? +slp : null,
          moodBeforeSleep: selVal(el.querySelector(".mbrow")), pov: selVal(el.querySelector(".povrow")), agency: selVal(el.querySelector(".agrow")), emotions: emotions,
        };
        var btn = el.querySelector(".save"); btn.disabled = true; btn.textContent = "Saving your dream...";
        var p = existing ? call("/api/hub/dreams/" + existing.id, { method: "PATCH", body: payload }) : call("/api/hub/dreams", { method: "POST", body: payload });
        p.then(function (res) { detail(res.dream.id); }).catch(function (e) { btn.disabled = false; btn.textContent = existing ? "Save Changes" : "Save Dream"; err.textContent = e.message; err.classList.add("show"); });
      });
    }

    // ---------------- Detail ----------------
    function detail(id) {
      el.innerHTML = "<div class='djview'><div class='empty'>Loading...</div></div>";
      call("/api/hub/dreams/" + id).then(function (data) {
        var d = data.dream, msgs = data.messages || [];
        var flags = [d.isLucid ? "Lucid" : null, d.isRecurring ? "Recurring" : null, d.isNightmare ? "Nightmare" : null, d.isFalseAwakening ? "False awakening" : null, d.isSleepParalysis ? "Sleep paralysis" : null].filter(Boolean);
        var meta = [];
        if (d.mood) meta.push(["Mood on waking", d.mood]);
        if (d.moodBeforeSleep) meta.push(["Before sleep", d.moodBeforeSleep]);
        if (d.vividness) meta.push(["Vividness", d.vividness + "/5"]);
        if (d.sleepQuality) meta.push(["Sleep quality", d.sleepQuality + "/5"]);
        if (d.pov) meta.push(["Point of view", d.pov]);
        if (d.agency) meta.push(["Sense of control", d.agency]);
        var metaHtml = meta.length ? "<div class='dmeta'>" + meta.map(function (m) { return "<div class='mitem'>" + esc(m[0]) + "<b>" + esc(m[1]) + "</b></div>"; }).join("") + "</div>" : "";
        var chipList = function (arr) { return "<div class='flags' style='margin:6px 0'>" + arr.map(function (t) { return "<span class='flag'>" + esc(t) + "</span>"; }).join("") + "</div>"; };
        var themesHtml = (d.themes && d.themes.length) ? "<div class='block'><h4>Recurring themes</h4>" + chipList(d.themes) + "</div>" : "";
        el.innerHTML = "<div class='djview detail'>" +
          "<div class='hd'><button class='link back' type='button'>&#8592; All dreams</button><div class='hactions'><button class='link share' type='button'>Share</button><button class='link edit' type='button'>Edit</button><button class='link del' type='button' style='color:#c0392b'>Delete</button></div></div>" +
          "<div class='dtop'><div><div class='cdate'>" + fmtDate(d.dreamtOn) + "</div><h3 style='margin-top:2px'>" + esc(d.title || "Untitled dream") + "</h3></div></div>" +
          (flags.length ? "<div class='flags' style='margin:8px 0'>" + flags.map(function (f) { return "<span class='flag'>" + esc(f) + "</span>"; }).join("") + "</div>" : "") +
          "<div class='sharebox'></div>" +
          "<div class='dnarr'>" + esc(d.narrative) + "</div>" +
          metaHtml +
          ((d.emotions && d.emotions.length) ? "<div class='block'><h4>Emotions in the dream</h4>" + chipList(d.emotions) + "</div>" : "") +
          themesHtml +
          "<h4 class='sech'>Interpretation</h4>" +
          "<div class='lenstabs'>" + LENSES.map(function (l) { return "<button type='button' class='lenstab' data-lens='" + l[0] + "'>" + l[1] + "</button>"; }).join("") + "</div>" +
          "<div class='interp-area'></div>" +
          "<h4 class='sech'>Dream imagery</h4>" +
          "<div class='aiactions'><button class='btn img' type='button'>" + (d.imageUrl ? "Generate another image" : "Create a dream image") + "</button></div>" +
          "<div class='img-area'></div>" +
          "<div class='block'><h4>Ask about this dream</h4><div class='chatthread'>" + msgs.map(msgHtml).join("") + "</div>" +
          "<div class='chatrow'><input type='text' class='chatin' placeholder='Ask a follow-up question...'><button class='btn chatsend' type='button'>Send</button></div>" +
          "<div class='err chaterr' role='alert'></div></div>" +
          "</div>";
        el.querySelector(".back").addEventListener("click", home);
        el.querySelector(".edit").addEventListener("click", function () { form(d); });
        el.querySelector(".del").addEventListener("click", function () { if (win_confirm("Delete this dream? This cannot be undone.")) call("/api/hub/dreams/" + id, { method: "DELETE" }).then(home).catch(function () {}); });
        setupShare(id, d.publicSlug);
        setupLenses(id, d.interpretations || {});
        renderGallery(d.images || (d.imageUrl ? [{ url: d.imageUrl }] : []));
        el.querySelector(".img").addEventListener("click", function () { runImage(id, this); });
        var send = el.querySelector(".chatsend"), input = el.querySelector(".chatin");
        function doSend() { runChat(id, input, send); }
        send.addEventListener("click", doSend);
        input.addEventListener("keydown", function (e) { if (e.key === "Enter") doSend(); });
      }).catch(function (e) { el.innerHTML = "<div class='djview'><button class='link back' type='button'>&#8592; Back</button><div class='empty'>" + esc(e.message) + "</div></div>"; el.querySelector(".back").addEventListener("click", home); });
    }
    function interpBlock(text) { return "<div class='block'><h4>Interpretation</h4><div class='interp'>" + esc(text) + "</div></div>"; }
    function imgBlock(url) { return "<div class='block'><h4>Your dream, visualized</h4><img class='dimg' src='" + esc(url) + "' alt='AI image of your dream'></div>"; }
    function msgHtml(m) { return "<div class='msg " + (m.role === "user" ? "user" : "assistant") + "'>" + esc(m.content) + "</div>"; }
    function win_confirm(m) { try { return window.confirm(m); } catch (e) { return true; } }
    function setupShare(id, slug) {
      var box = el.querySelector(".sharebox"), shareBtn = el.querySelector(".share");
      function url(s) { return ctx.origin + "/embed/dream.html?d=" + s; }
      function renderOn(s) {
        box.innerHTML = "<div class='sharelink'><input type='text' readonly value=\"" + esc(url(s)) + "\"><button class='btn copyl' type='button'>Copy link</button><button class='link stopl' type='button' style='color:#c0392b'>Stop sharing</button></div><div class='micnote'>Anyone with this private link can read this dream. It is not listed anywhere.</div>";
        box.querySelector(".copyl").addEventListener("click", function () { var inp = box.querySelector("input"); inp.select(); try { navigator.clipboard.writeText(inp.value); } catch (e) { try { document.execCommand("copy"); } catch (e2) {} } this.textContent = "Copied"; });
        box.querySelector(".stopl").addEventListener("click", function () { call("/api/hub/dreams/" + id + "/share", { method: "POST", body: { enabled: false } }).then(function () { slug = null; box.innerHTML = ""; shareBtn.textContent = "Share"; }).catch(function (e) { alert(e.message); }); });
        shareBtn.textContent = "Sharing";
      }
      if (slug) renderOn(slug);
      shareBtn.addEventListener("click", function () {
        if (box.innerHTML) { box.innerHTML = ""; shareBtn.textContent = "Share"; return; }
        if (slug) { renderOn(slug); return; }
        shareBtn.disabled = true;
        call("/api/hub/dreams/" + id + "/share", { method: "POST", body: { enabled: true } })
          .then(function (r) { slug = r.publicSlug; shareBtn.disabled = false; renderOn(slug); })
          .catch(function (e) { shareBtn.disabled = false; alert(e.message); });
      });
    }

    // Multi-lens interpretation: tabs that show a cached lens or generate it.
    function setupLenses(id, interps) {
      var area = el.querySelector(".interp-area");
      var tabs = el.querySelectorAll(".lenstab");
      function activate(tab) { tabs.forEach(function (t) { t.classList.remove("on"); }); tab.classList.add("on"); }
      function show(lens, tab) {
        activate(tab);
        if (interps[lens]) { area.innerHTML = "<div class='block'><div class='interp'>" + esc(interps[lens]).replace(/\n/g, "<br>") + "</div><button class='link regen' type='button'>Regenerate</button></div>"; area.querySelector(".regen").addEventListener("click", function () { gen(lens, tab); }); return; }
        gen(lens, tab);
      }
      function gen(lens, tab) {
        area.innerHTML = "<div class='block'><div class='ipp'></div></div>";
        var prog = ctx.progress(area.querySelector(".ipp"), { estMs: 9000, label: "Reading your dream through the " + lens + " lens..." });
        call("/api/hub/dreams/" + id + "/interpret", { method: "POST", body: { lens: lens } })
          .then(function (r) { prog.done(); interps = r.interpretations || interps; interps[lens] = r.text; show(lens, tab); })
          .catch(function (e) { prog.fail(e.message); });
      }
      tabs.forEach(function (tab) { tab.addEventListener("click", function () { show(tab.getAttribute("data-lens"), tab); }); });
      // if any lens already exists, open the first one; else prompt to pick
      var first = null; LENSES.forEach(function (l) { if (!first && interps[l[0]]) first = l[0]; });
      if (first) { var t = el.querySelector(".lenstab[data-lens='" + first + "']"); show(first, t); }
      else { area.innerHTML = "<div class='micnote' style='text-align:left'>Choose a lens above to interpret your dream.</div>"; }
    }
    function renderGallery(images) {
      var area = el.querySelector(".img-area"); if (!images || !images.length) { area.innerHTML = ""; return; }
      var main = images[0].url;
      area.innerHTML = "<div class='block'><img class='dmain' src='" + esc(main) + "' alt='AI image of your dream'>" +
        (images.length > 1 ? "<div class='dthumbs'>" + images.map(function (im, i) { return "<img class='dthumb" + (i === 0 ? " on" : "") + "' data-u='" + esc(im.url) + "' src='" + esc(im.url) + "'>"; }).join("") + "</div>" : "") + "</div>";
      area.querySelectorAll(".dthumb").forEach(function (t) { t.addEventListener("click", function () { area.querySelector(".dmain").src = t.getAttribute("data-u"); area.querySelectorAll(".dthumb").forEach(function (x) { x.classList.remove("on"); }); t.classList.add("on"); }); });
    }
    function runImage(id, btn) {
      btn.disabled = true; var orig = btn.textContent; btn.textContent = "Painting...";
      var area = el.querySelector(".img-area"); area.innerHTML = "<div class='block'><div class='imp'></div></div>";
      var prog = ctx.progress(area.querySelector(".imp"), { estMs: 120000, label: "Painting your dream. This can take a minute or two, please keep this open." });
      call("/api/hub/dreams/" + id + "/image", { method: "POST", body: {} }).then(function (r) {
        prog.done(); renderGallery(r.images || [{ url: r.imageUrl }]); btn.disabled = false; btn.textContent = "Generate another image";
      }).catch(function (e) { prog.fail(e.message); btn.disabled = false; btn.textContent = orig; });
    }
    function runChat(id, input, btn) {
      var text = input.value.trim(); if (!text) return;
      var thread = el.querySelector(".chatthread");
      thread.insertAdjacentHTML("beforeend", msgHtml({ role: "user", content: text }));
      input.value = ""; btn.disabled = true;
      var typing = document.createElement("div"); typing.className = "msg assistant"; typing.style.minWidth = "150px";
      thread.appendChild(typing);
      var prog = ctx.progress(typing, { estMs: 7000, label: "" }); prog.el.style.margin = "2px 0";
      call("/api/hub/dreams/" + id + "/chat", { method: "POST", body: { message: text } }).then(function (r) {
        prog.done(); typing.style.minWidth = ""; typing.textContent = r.reply; btn.disabled = false;
      }).catch(function (e) { prog.fail(""); typing.textContent = e.message; btn.disabled = false; });
    }

    // ---------------- Voice recording ----------------
    function setupMic(mic, textarea) {
      if (!mic) return;
      if (!navigator.mediaDevices || !window.MediaRecorder) { mic.style.display = "none"; return; }
      var recorder = null, chunks = [], recording = false;
      mic.addEventListener("click", function () {
        if (recording) { recorder && recorder.stop(); return; }
        navigator.mediaDevices.getUserMedia({ audio: true }).then(function (stream) {
          chunks = []; recorder = new MediaRecorder(stream);
          recorder.ondataavailable = function (e) { if (e.data.size) chunks.push(e.data); };
          recorder.onstop = function () {
            stream.getTracks().forEach(function (t) { t.stop(); });
            recording = false; mic.classList.remove("rec"); mic.innerHTML = "&#127908;&#xFE0E;";
            var blob = new Blob(chunks, { type: "audio/webm" });
            if (!blob.size) return;
            mic.innerHTML = "<span class='spin'></span>";
            var progHost = document.createElement("div"); textarea.parentNode.insertAdjacentElement("afterend", progHost);
            var prog = ctx.progress(progHost, { estMs: 8000, label: "Transcribing your voice..." });
            // Convert the recorded audio to WAV, the format the transcription
            // model reliably accepts, then send as base64.
            blobToWav(blob).then(function (wavB64) {
              return call("/api/hub/transcribe", { method: "POST", body: { audio: wavB64, format: "wav" } });
            }).then(function (r) {
              prog.done(); setTimeout(function () { if (progHost.parentNode) progHost.parentNode.removeChild(progHost); }, 400);
              mic.innerHTML = "&#127908;&#xFE0E;";
              if (r.text) { textarea.value = (textarea.value ? textarea.value.replace(/\s*$/, "") + " " : "") + r.text; textarea.focus(); }
            }).catch(function (e) { prog.fail(e.message || "Could not transcribe the audio."); mic.innerHTML = "&#127908;&#xFE0E;"; setTimeout(function () { if (progHost.parentNode) progHost.parentNode.removeChild(progHost); }, 2500); });
          };
          recorder.start(); recording = true; mic.classList.add("rec"); mic.innerHTML = "&#9632;&#xFE0E;";
        }).catch(function () { alert("Microphone access was blocked. You can still type your dream."); });
      });
    }

    // Decode a recorded audio Blob and re-encode as a mono 16-bit WAV data URL.
    function blobToWav(blob) {
      return blob.arrayBuffer().then(function (buf) {
        var AC = window.AudioContext || window.webkitAudioContext;
        var ac = new AC();
        return ac.decodeAudioData(buf).then(function (audioBuf) {
          if (ac.close) ac.close();
          var len = audioBuf.length, rate = audioBuf.sampleRate, chs = audioBuf.numberOfChannels;
          var data = new Float32Array(len);
          for (var c = 0; c < chs; c++) { var ch = audioBuf.getChannelData(c); for (var i = 0; i < len; i++) data[i] += ch[i] / chs; }
          var ab = new ArrayBuffer(44 + len * 2), view = new DataView(ab);
          function ws(o, s) { for (var i = 0; i < s.length; i++) view.setUint8(o + i, s.charCodeAt(i)); }
          ws(0, "RIFF"); view.setUint32(4, 36 + len * 2, true); ws(8, "WAVE"); ws(12, "fmt ");
          view.setUint32(16, 16, true); view.setUint16(20, 1, true); view.setUint16(22, 1, true);
          view.setUint32(24, rate, true); view.setUint32(28, rate * 2, true); view.setUint16(32, 2, true); view.setUint16(34, 16, true);
          ws(36, "data"); view.setUint32(40, len * 2, true);
          var off = 44; for (var j = 0; j < len; j++) { var s = Math.max(-1, Math.min(1, data[j])); view.setInt16(off, s < 0 ? s * 0x8000 : s * 0x7fff, true); off += 2; }
          var bytes = new Uint8Array(ab), bin = ""; for (var k = 0; k < bytes.length; k++) bin += String.fromCharCode(bytes[k]);
          return "data:audio/wav;base64," + btoa(bin);
        });
      });
    }

    // ---------------- Patterns ----------------
    function patterns() {
      var c = shell("patterns"); c.innerHTML = "<div class='empty'>Analyzing your dreams...</div>";
      call("/api/hub/patterns").then(function (p) {
        if (!p.total) { c.innerHTML = "<div class='empty'>Record a few dreams and your patterns will appear here.</div>"; return; }
        var days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"], maxW = Math.max.apply(null, p.weekday.concat([1]));
        c.innerHTML =
          "<div class='stats'>" +
            stat(p.total, "Dreams logged") + stat(p.lucid, "Lucid") + stat(p.recurring, "Recurring") + stat(p.nightmares, "Nightmares") +
          "</div>" +
          (p.moods.length ? "<div class='block'><h4>Most common moods on waking</h4><div class='chips'>" + p.moods.map(function (m) { return "<span class='chip'>" + esc(m[0]) + " <b>" + m[1] + "</b></span>"; }).join("") + "</div></div>" : "") +
          ((p.themes && p.themes.length) ? "<div class='block'><h4>Recurring themes and symbols</h4><div class='chips'>" + p.themes.map(function (t) { return "<span class='chip'>" + esc(t[0]) + " <b>" + t[1] + "</b></span>"; }).join("") + "</div></div>" : "") +
          "<div class='block'><h4>When you dream</h4><div class='wk'>" + p.weekday.map(function (n, i) { return "<div class='wkbar'><div class='wkfill' style='height:" + Math.round(n / maxW * 78) + "px'></div><div class='wkl'>" + days[i] + "</div></div>"; }).join("") + "</div></div>";
      }).catch(function (e) { c.innerHTML = "<div class='empty'>" + esc(e.message) + "</div>"; });
    }
    function stat(n, l) { return "<div class='stat'><div class='n'>" + n + "</div><div class='l'>" + l + "</div></div>"; }

    home();
  }

  window.__PSHUB__ = window.__PSHUB__ || { _reg: {}, _waiters: {}, register: function (id, def) { this._reg[id] = def; (this._waiters[id] || []).forEach(function (fn) { fn(def); }); this._waiters[id] = []; } };
  window.__PSHUB__.register("dream-journal", { title: "Dream Journal", render: render });
})();
