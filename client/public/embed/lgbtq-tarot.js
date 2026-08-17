/* Free One Card Tarot Reading (LGBTQIA+) embed.
 * Usage on any site:
 *   <div id="ps-lgbtq-tarot"></div>
 *   <script async src="https://psychic-source-platform.vercel.app/embed/lgbtq-tarot.js"></script>
 * Renders directly into the page (Shadow DOM), no iframe.
 * Card faces: Rider-Waite-Smith deck (1909), public domain.
 */
(function () {
  "use strict";

  var SCRIPT_SRC = (document.currentScript && document.currentScript.src) || "";
  var ORIGIN = SCRIPT_SRC ? new URL(SCRIPT_SRC).origin : "https://psychic-source-platform.vercel.app";

  // Set to a destination URL to show a CTA link on the result panel.
  var CTA_URL = "https://www.psychicsource.com/psychic-advice/tarot-readings";
  var CTA_TEXT = "Talk with a Tarot Reader";

  var CARDS = [
    { n: "The Fool", t: ["The Fool is the first step of every journey, taken on nothing but self-trust. For many in the LGBTQIA+ community, the biggest leaps, coming out, transitioning, building chosen family, happen without a map, and this card honors exactly that courage. The Fool says the step in front of you does not require certainty. It requires honesty about who you are and a willingness to begin.", "Drawing this card is also a reminder that beginnings are allowed at any age. Whether you came into your identity at fifteen or fifty, your journey is not late; it is yours. Pack light, bring your joy, and let the path teach you as you walk it."] },
    { n: "The Magician", t: ["The Magician stands with every tool laid out and a channel open between heaven and earth. This card celebrates self-creation, and few people know more about consciously authoring themselves than the LGBTQIA+ community. The name you chose, the presentation you refined, the life you assembled from possibility: that is the Magician's work, and it is powerful magic.", "Right now, the card says your tools are sufficient. You do not need to wait for one more resource, one more approval, or one more sign. Set your intention clearly and act. The same will that built your identity can build whatever you are dreaming about next."] },
    { n: "The High Priestess", t: ["If the Magician is all about outer expression, the High Priestess is an invitation to dive deeper inside you. So many people on the LGBTQIA+ spectrum have had their needs and wants invalidated by the outside world. It's hard to separate intuition from anxiety because of the spiritual toll that takes. But the energy of the High Priestess is here to give you a gentle affirmation to trust yourself and your intuition. Your inner wisdom is waiting to be heard.", "When the High Priestess comes up, it can also be letting you know that you have the breathing room to do some self-evaluation and find out who you are without a societal script forced on you. There's so much pressure to conform or settle, especially when personal safety becomes an issue. But now there is time and energy available to be honest with yourself about your desires, and discover what feels best for you, emotionally and physically. Be fearless in exploring who you are."] },
    { n: "The Empress", t: ["No matter what gender you identify as, there's a time in our lives where we can use the nurturing and fertile energy of the Empress. While yes, it could indicate success in becoming a caretaker of children (biological or adopted), the Empress card can mean far more than that. Giving birth to any creative endeavor falls under the energy of the Empress, from the visual arts, theatrical arts, literary arts, and beyond. The energy is there for you to fully manifest anything that's been gestating inside of you.", "Mentoring others also is part of the Empress. You may find some of your harder edges softening as you help guide others through a place you've been before. You might see yourself in someone who is just beginning to question the concept of gender. The newbie at your regular LGBTQIA+ hangout might be asking for help coming out to other people. Understand that you both have the wisdom and compassion needed to help fellow members of the community. Just make sure that helping doesn't become taking over the agency of another person."] },
    { n: "The Emperor", t: ["The Emperor is the architect of safety: boundaries, structure, and a domain where your rules apply. For LGBTQIA+ people, this card lands differently, because many of us learned early that authority does not always protect us. The Emperor invites you to become the protective authority in your own life: the person who decides who gets access, what behavior is acceptable, and what home is going to feel like.", "This card can also point to stepping into leadership: in your workplace, your community, or your chosen family. Someone probably already looks to you for steadiness. Claim the role deliberately. Structure built with love is not control; it is shelter, and you know exactly why shelter matters."] },
    { n: "The Hierophant", t: ["The Hierophant represents tradition and institutions, which is complicated territory when some traditions were used against you. Drawing this card is not a demand to conform. It is an invitation to decide your own relationship with tradition: to keep the rituals that feed you, rewrite the ones that do not, and build new ones with your chosen family that are worthy of being passed down.", "The Hierophant can also mark the appearance of a mentor or a community elder, someone who has walked this road and carries wisdom worth hearing. If you have been doing everything self-taught, this card gently suggests you do not have to. Guidance that honors who you are exists, and you deserve it."] },
    { n: "The Lovers", t: ["The Lovers is about union at its most honest: being fully seen and choosing someone from that place. Queer love carries a particular bravery, because loving openly has not always been safe, and this card honors every relationship built anyway. If romance is on your mind, the Lovers signals a connection with real depth available now, one where you do not have to edit yourself.", "This card is also about the deeper choice of self-acceptance, the union between who you are and how you live. Any decision in front of you should be made from your values, not from what is easiest to explain to others. Choose what makes you more yourself."] },
    { n: "The Chariot", t: ["The Chariot is momentum won through will, steering two pulling forces in one chosen direction. Many LGBTQIA+ people know this tension intimately: pride and caution, visibility and safety, the person you are and the roles others expect. The Chariot says you are strong enough to hold the reins and still move forward. The tension does not disqualify you; mastering it is precisely the victory.", "Expect progress now on something you have been pushing toward, especially anything that once felt blocked. Keep your destination vivid and your grip steady. You have already survived harder roads than the one ahead."] },
    { n: "Strength", t: ["Strength shows gentleness taming what roars, and there may be no better portrait of queer resilience. The composure it takes to stay soft in a world that has not always been kind, to answer ignorance with dignity, to keep your heart open after it has been tested: that is the lion's work, and this card says you are doing it well.", "Drawing Strength is also permission to be gentle with your own inner beast: the anger, fear, or shame that sometimes rises. Those feelings are not enemies; they kept you safe once. Meet them with the same compassion you would offer a friend, and they settle. Your softness was never weakness. It is the proof of your power."] },
    { n: "The Hermit", t: ["The Hermit lifts a lantern lit from within and steps away from the crowd to find truth. Time alone, away even from community expectations, is sometimes exactly what an LGBTQIA+ soul needs, because there are layers of identity that only reveal themselves in quiet. This card blesses that retreat. Solitude chosen for growth is not isolation; it is devotion to yourself.", "The Hermit can also mark you as the lantern-bearer for someone else. Your story, told honestly, may be the light another person is searching for. Share it when you are ready, and remember that the wisdom you found in your own dark is a gift the community needs."] },
    { n: "Wheel of Fortune", t: ["The Wheel of Fortune turns for everyone, and its message here is that change is arriving whether or not it was scheduled. Many LGBTQIA+ lives are full of wheel-turns: identities clarifying, relationships evolving, communities shifting. This card says the current turn is moving in your favor. Luck, timing, and the right encounter are aligning.", "If things have been hard, take this as the promise that no season is permanent. If things are good, enjoy them fully now rather than auditing them for flaws. Either way, you are not at the mercy of the wheel; you are riding it, and riders who stay flexible land well."] },
    { n: "Justice", t: ["Justice holds the scales and the sword: truth weighed honestly and consequences delivered fairly. For a community that has spent generations fighting for fairness, this card carries extra weight. Drawing it now suggests a situation in your life is coming into balance: recognition arriving, an imbalance corrected, or a truth finally acknowledged.", "Justice also asks you to wield fairness yourself, including toward you. Are you giving yourself the same understanding you extend to others? Any decision in front of you should be made with clear eyes and honest accounting. Act with integrity and the outcome will hold, because what is built on truth does not need defending."] },
    { n: "The Hanged Man", t: ["The Hanged Man hangs upside down by choice, and from that inverted place he sees what no one standing upright can. LGBTQIA+ people are fluent in this perspective: viewing the world from outside its defaults reveals truths the mainstream misses. This card says your different angle is not a delay or a detour. It is vision.", "If life feels suspended right now, waiting on an answer, a change, or clarity about identity, the Hanged Man counsels patience with the pause. Something is reorganizing beneath the surface. Surrender to the in-between for a little longer; the revelation it is preparing will be worth the wait."] },
    { n: "Death", t: ["Death in the tarot is transformation: the ending that makes the next self possible. Few communities understand this card as deeply as ours. Letting an old name, an old presentation, or an old life fall away so a truer one can emerge is Death's exact work, and it is sacred. Whatever is ending in your life now, this card frames it as a shedding, not a loss.", "Grieve what needs grieving; even outgrown chapters deserve a goodbye. Then turn around, because the sun on this card is rising, not setting. The person emerging from this transition has been waiting a long time to breathe. Let them."] },
    { n: "Temperance", t: ["Temperance is the angel of blending: two currents poured into one living mixture. It speaks to everyone who holds more than one truth at once, and LGBTQIA+ lives are often exactly that art: identities, communities, families, and histories blended into something entirely your own. This card blesses the mixture. You do not have to choose one part of yourself over another.", "Drawing Temperance also signals healing in progress, the quiet kind that happens gradually and holds. If you have been running hot or swinging between extremes, the invitation is moderation and self-patience. Balance is not boring; for a heart that has known chaos, balance is the luxury."] },
    { n: "The Devil", t: ["The Devil shows chains that look permanent and are actually loose. For LGBTQIA+ people, the card often points to internalized chains: shame absorbed from outside, the closet's leftover habits, relationships or patterns that shrink you. The Devil's honest message is that whatever binds you now stays only by consent, and consent can be withdrawn.", "Look at what you reach for when the old pain surfaces, and ask whether it frees you or holds you. There is no judgment here; chains were survival once. But you are past surviving. Name the chain out loud, to yourself or someone safe, and feel how much looser it already is."] },
    { n: "The Tower", t: ["The Tower is the lightning bolt that demolishes what was built on a false foundation. Many in our community have lived a Tower moment: the coming out that rearranged everything, the truth that could not stay unspoken. This card says such a shake-up, past or arriving, is clearing space for a life that does not require pretending.", "What survives your Tower moment is what was real all along: the people who stayed, the self that emerged, the strength you discovered mid-fall. If something is collapsing now, resist the urge to rebuild the old walls. Build honest this time. Towers built on truth do not attract lightning."] },
    { n: "The Star", t: ["The Star is the healing that comes after the storm: hope with its feet in the water and its eyes on the sky. After hard seasons, of rejection, of hiding, of fighting to be seen, this card arrives as a promise that your faith in the future is being restored, and that it is wise, not naive, to believe again.", "The Star is also the card of authenticity shining unguarded. The version of you that dreams openly, loves openly, and hopes openly is the one this card blesses. Pour into yourself the way the figure pours the water: generously, without rationing. You are being replenished for what comes next, and what comes next is bright."] },
    { n: "The Moon", t: ["The Moon lights a half-seen path between fear and imagination. Many LGBTQIA+ people know its terrain: reading rooms for safety, wondering which perceptions to trust, feeling truths before they can be proven. This card acknowledges that uncertainty without shaming it, and reminds you that your sensitivity in the dark is a skill, not a flaw.", "Right now the Moon counsels going slow with a situation that is not fully visible. Do not let anxiety write the ending before the facts arrive. Your intuition is sharp; your fear is loud. Learn to tell their voices apart, and take the winding path one honest step at a time. Daylight is coming."] },
    { n: "The Sun", t: ["The Sun is joy without an asterisk: warmth, clarity, and life lived in full light. For a community whose celebrations were once held in secret, this card lands like a festival. Drawing it signals a season of visibility and delight: love that wants to be seen, achievements ready to be celebrated, and a version of you that no longer negotiates for daylight.", "Whatever you have been working toward is ripening, and the card's only instruction is to enjoy it unapologetically. Happiness does not need to be earned twice. Stand in the warmth you fought for, share it with your people, and let joy be the loudest thing about you for a while."] },
    { n: "Judgement", t: ["Judgement is the great awakening: a call that summons you to rise into your next chapter, whole. Despite its stern name, this card is about liberation from old verdicts, including the ones others passed on you and the ones you passed on yourself. The trumpet here does not condemn. It announces that the past no longer gets the final word.", "Something is calling you to rise right now: a truer expression, a bolder chapter, a reconciliation with your own history. Answer it. Forgive the younger you who did their best with less freedom than you have today. They got you here, and this card says here is where the new life begins."] },
    { n: "The World", t: ["The World is wholeness achieved: the dance at the end of a long becoming. It speaks of arriving in your own life, at home in your identity, surrounded by what you built, complete not because the journey is over but because you are finally whole within it. For anyone who fought to become themselves, this card is the deck's standing ovation.", "Take stock of how far you have traveled: the honesty won, the family chosen, the self assembled with courage and care. Celebrate it properly. And know that the World is also a doorway; the next cycle begins from this higher ground, with everything you have become traveling with you."] },
  ];

  // ---------- Styles ----------

  var FONT = "Verdana,'Segoe UI',Geneva,sans-serif";
  var WINE = "#9c3a3f";
  var INK = "#4a4030";

  // Progress Pride flag card back, hoist at top, as an SVG data URI.
  var BACK_SVG = (function () {
    var s = "<svg xmlns='http://www.w3.org/2000/svg' width='150' height='250' viewBox='0 0 150 250' preserveAspectRatio='none'>" +
      "<rect width='150' height='250' rx='10' fill='%23fff'/>";
    // six flag stripes, vertical bands under the chevrons
    var stripes = ["%23750787", "%23004dff", "%23008026", "%23ffed00", "%23ff8c00", "%23e40303"];
    for (var i = 0; i < 6; i++) {
      s += "<rect x='" + (i * 25) + "' y='0' width='25' height='250' fill='" + stripes[i] + "'/>";
    }
    // chevrons from the top: white, pink, light blue, brown, black
    var chevs = ["%23ffffff", "%23ffafc8", "%2374d7ee", "%23613915", "%23000000"];
    for (var c = chevs.length - 1; c >= 0; c--) {
      var d = 30 + c * 26;
      s += "<path d='M0 0 L150 0 L150 " + d + " L75 " + (d + 58) + " L0 " + d + " Z' fill='" + chevs[c] + "'/>";
    }
    // rounded-corner mask ring
    s += "<rect x='1.5' y='1.5' width='147' height='247' rx='9' fill='none' stroke='%23f6ead0' stroke-width='3'/>" +
      "</svg>";
    return "url(\"data:image/svg+xml;charset=utf-8," + s + "\")";
  })();

  var CSS = "" +
    ":host{all:initial;display:block}" +
    "*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}" +
    ".wrap{position:relative;font-family:" + FONT + ";color:" + INK + ";" +
    "background:#eec27f url('" + ORIGIN + "/embed/img/tarot/pride-bg.jpg') center/cover no-repeat;" +
    "padding:46px 34px 56px;overflow:hidden;line-height:1.7}" +
    ".frame{position:absolute;inset:16px;border:1.5px solid " + WINE + ";border-radius:2px;pointer-events:none;opacity:.75}" +
    ".inner{position:relative;max-width:1040px;margin:0 auto}" +
    ".title{font-family:'Great Vibes',cursive;font-weight:400;font-size:clamp(34px,4.6vw,46px);color:" + WINE + ";" +
    "text-align:center;line-height:1.15;margin-bottom:10px}" +
    ".divider{display:flex;align-items:center;justify-content:center;gap:0;color:#5e1f24;margin:0 auto 30px;max-width:760px}" +
    ".divider .dline{flex:1;height:2px;background:#5e1f24}" +
    ".big{font-size:clamp(34px,4.6vw,52px);font-weight:700;letter-spacing:2px;color:" + WINE + ";text-align:center;margin-bottom:22px}" +
    ".intro{font-size:19px;text-align:center;margin:0 auto 14px;max-width:900px}" +
    ".screen{display:none}" +
    ".screen.active{display:block;animation:fadein .5s ease}" +
    "@keyframes fadein{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:none}}" +
    ".row{display:flex;justify-content:center;margin:44px auto 0;height:250px;max-width:980px}" +
    ".card{flex:0 1 44px;min-width:14px;height:250px;position:relative}" +
    ".card .cface{position:absolute;left:0;top:0;width:150px;height:100%;border-radius:10px;" +
    "background-color:#fff;background-image:" + BACK_SVG + ";background-size:100% 100%;" +
    "box-shadow:-5px 0 10px rgba(0,0,0,.24);cursor:pointer;" +
    "transition:transform .28s cubic-bezier(.22,.85,.3,1),filter .18s ease}" +
    ".card:hover .cface{transform:translateY(-16px);filter:brightness(1.06)}" +
    ".card:last-child{flex:0 0 150px}" +
    ".actions{text-align:center;margin-top:44px}" +
    ".pill{display:inline-block;font-family:" + FONT + ";font-size:18px;font-weight:600;color:#f7eedd;background:" + WINE + ";" +
    "border:none;border-radius:999px;padding:15px 44px;cursor:pointer;box-shadow:0 4px 12px rgba(0,0,0,.25);" +
    "transition:background .15s ease;text-decoration:none}" +
    ".pill:hover{background:#7f2d31}" +
    // flip overlay
    ".flipstage{position:fixed;inset:0;display:none;align-items:center;justify-content:center;z-index:80;pointer-events:none}" +
    ".flipstage.on{display:flex}" +
    ".flipper{width:210px;height:350px;position:relative;transform-style:preserve-3d;" +
    "animation:flip3d .9s cubic-bezier(.45,.05,.35,1) forwards}" +
    "@keyframes flip3d{0%{transform:rotateY(0) scale(1)}100%{transform:rotateY(540deg) scale(1.06)}}" +
    ".flipper .face,.flipper .backf{position:absolute;inset:0;border-radius:12px;backface-visibility:hidden;" +
    "box-shadow:0 22px 60px rgba(0,0,0,.45)}" +
    ".flipper .backf{background-image:" + BACK_SVG + ";background-size:cover}" +
    ".flipper .face{transform:rotateY(180deg);background:#fff center/cover no-repeat;border:6px solid #fff}" +
    // result
    ".panel{background:rgba(250,242,222,.72);border-radius:22px;padding:44px 48px;display:flex;gap:44px;align-items:flex-start;margin-top:8px}" +
    ".panel .cimg{width:280px;flex:0 0 auto;border-radius:14px;border:8px solid #fff;box-shadow:0 12px 32px rgba(0,0,0,.3)}" +
    ".panel .body{flex:1;min-width:0}" +
    ".cname{font-family:'Great Vibes',cursive;font-size:clamp(40px,5.5vw,58px);color:" + WINE + ";margin-bottom:14px;line-height:1.1}" +
    ".ctext p{font-size:18.5px;margin-bottom:16px}" +
    ".endrow{display:flex;justify-content:flex-end;gap:16px;flex-wrap:wrap;margin-top:8px}" +
    "@media(max-width:820px){" +
    ".panel{flex-direction:column;align-items:center;padding:28px 20px}" +
    ".panel .cimg{width:210px}" +
    ".row{height:190px}" +
    ".card{height:190px}" +
    ".card .cface{width:114px;border-radius:8px}" +
    ".card:last-child{flex:0 0 114px}" +
    ".wrap{padding:36px 18px 46px}}";

  var DIVIDER_SVG = "<svg width='170' height='22' viewBox='0 0 170 22' fill='none' xmlns='http://www.w3.org/2000/svg'>" +
    "<path d='M0 11 L28 11 M142 11 L170 11' stroke='#5e1f24' stroke-width='2'/>" +
    "<path d='M30 11 L38 6 L46 11 L38 16 Z' fill='#5e1f24'/>" +
    "<circle cx='54' cy='11' r='3' fill='#5e1f24'/><circle cx='64' cy='11' r='4' fill='#5e1f24'/>" +
    "<path d='M72 11 L85 2 L98 11 L85 20 Z' fill='#5e1f24'/>" +
    "<circle cx='106' cy='11' r='4' fill='#5e1f24'/><circle cx='116' cy='11' r='3' fill='#5e1f24'/>" +
    "<path d='M124 11 L132 6 L140 11 L132 16 Z' fill='#5e1f24'/></svg>";

  // ---------- Markup ----------

  function buildHtml() {
    return "<div class='wrap'>" +
      "<div class='frame'></div>" +
      "<div class='inner'>" +
      "<h2 class='title'>Free One Card Tarot Reading</h2>" +
      "<div class='divider'><div class='dline'></div>" + DIVIDER_SVG + "<div class='dline'></div></div>" +
      "<div class='big'>LGBTQIA+</div>" +

      "<div class='screen s-select active'>" +
      "<p class='intro'>What makes the Tarot such an effective spiritual tool is its nuance. The imagery and the cards' meanings can be applied to the full range of human experiences.</p>" +
      "<p class='intro'>Try our one-card tarot interactive, which shares messages geared specifically toward our LGBTQIA+ family.</p>" +
      "<div class='row'></div>" +
      "<div class='actions'><button class='pill shuffle' type='button'>Shuffle Cards</button></div>" +
      "</div>" +

      "<div class='screen s-result'>" +
      "<div class='panel'>" +
      "<img class='cimg' alt=''>" +
      "<div class='body'><div class='cname'></div><div class='ctext'></div>" +
      "<div class='endrow'><span class='cta-slot'></span><button class='pill again' type='button'>Try Another Card</button></div>" +
      "</div></div>" +
      "</div>" +

      "</div>" +
      "<div class='flipstage'></div>" +
      "</div>";
  }

  // ---------- Behavior ----------

  function init(host) {
    if (host.__psLgbtqTarot) return;
    host.__psLgbtqTarot = true;

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

    var deck = [];
    var animating = false;

    function shuffleDeck() {
      deck = [];
      for (var i = 0; i < CARDS.length; i++) deck.push(i);
      for (var j = deck.length - 1; j > 0; j--) {
        var k = Math.floor(Math.random() * (j + 1));
        var tmp = deck[j]; deck[j] = deck[k]; deck[k] = tmp;
      }
    }

    function layoutRow() {
      var row = $(".row");
      row.innerHTML = "";
      for (var i = 0; i < CARDS.length; i++) {
        var el = document.createElement("div");
        el.className = "card";
        el.setAttribute("data-slot", i);
        el.setAttribute("role", "button");
        el.setAttribute("aria-label", "Draw this card");
        el.innerHTML = "<div class='cface'></div>";
        row.appendChild(el);
        el.addEventListener("click", onDraw);
      }
    }

    function reveal(cardIdx) {
      var card = CARDS[cardIdx];
      $(".cimg").src = ORIGIN + "/embed/img/tarot/" + String(cardIdx).padStart(2, "0") + ".jpg";
      $(".cimg").alt = card.n + " tarot card";
      $(".cname").textContent = card.n;
      $(".ctext").innerHTML = card.t.map(function (p) { return "<p>" + p + "</p>"; }).join("");
      var slot = $(".cta-slot");
      slot.innerHTML = "";
      if (CTA_URL) {
        var a = document.createElement("a");
        a.className = "pill";
        a.href = CTA_URL;
        a.textContent = CTA_TEXT;
        slot.appendChild(a);
      }
      show("result");
    }

    function onDraw(e) {
      if (animating) return;
      animating = true;
      var cardIdx = deck[+e.currentTarget.getAttribute("data-slot")];
      var stage = $(".flipstage");
      stage.innerHTML = "<div class='flipper'><div class='backf'></div>" +
        "<div class='face' style=\"background-image:url('" + ORIGIN + "/embed/img/tarot/" + String(cardIdx).padStart(2, "0") + ".jpg')\"></div></div>";
      stage.classList.add("on");
      setTimeout(function () {
        stage.classList.remove("on");
        stage.innerHTML = "";
        animating = false;
        reveal(cardIdx);
      }, 950);
    }

    $(".shuffle").addEventListener("click", function () {
      shuffleDeck();
      var row = $(".row");
      row.style.opacity = "0";
      setTimeout(function () { row.style.transition = "opacity .35s ease"; row.style.opacity = "1"; }, 140);
    });

    $(".again").addEventListener("click", function () {
      shuffleDeck();
      layoutRow();
      show("select");
    });

    shuffleDeck();
    layoutRow();
  }

  function boot() {
    var host = document.getElementById("ps-lgbtq-tarot") || document.querySelector("[data-ps-widget='lgbtq-tarot']");
    if (host) init(host);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})();
