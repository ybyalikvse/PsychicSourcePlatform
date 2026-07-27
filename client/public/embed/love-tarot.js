/* Love Tarot Card Reading embed.
 * Usage on any site:
 *   <div id="ps-love-tarot"></div>
 *   <script async src="https://psychic-source-platform.vercel.app/embed/love-tarot.js"></script>
 * Renders directly into the page (Shadow DOM), no iframe.
 * Card faces: Rider-Waite-Smith deck (1909), public domain.
 */
(function () {
  "use strict";

  var SCRIPT_SRC = (document.currentScript && document.currentScript.src) || "";
  var ORIGIN = SCRIPT_SRC ? new URL(SCRIPT_SRC).origin : "https://psychic-source-platform.vercel.app";

  // The seven spread positions. frame() opens the modal's position text;
  // frag names which card fragment completes it. Cards may override a
  // position entirely via their pos{} map.
  var POSITIONS = [
    { label: "The energy between\nthe two of you when\nyou are together", frag: "energy", frame: function (n) { return "The " + n + " here reveals the energy between the two of you when you are together."; } },
    { label: "Baggage from your\npast that tests\nthis relationship", frag: "baggage", frame: function (n) { return "The " + n + " here points to baggage from your past that tests this relationship."; } },
    { label: "What you need most\nin a relationship", frag: "need", frame: function (n) { return "The " + n + " here speaks to what you need most in a relationship."; } },
    { label: "Lessons from your\npast/traits you have\nthat strengthens your\nbond", frag: "gift", frame: function (n) { return "The " + n + " here is trying to teach you a lesson."; } },
    { label: "Baggage from their\npast that tests this\nrelationship", frag: "baggage", frame: function (n) { return "The " + n + " here points to baggage from your partner's past that tests this relationship."; } },
    { label: "What your partner\nneeds most in a\nrelationship", frag: "need", frame: function (n) { return "The " + n + " here is telling you what your partner needs from you in this relationship."; } },
    { label: "Lessons from their\npast/traits they have\nthat strengthen your\nbond", frag: "gift", frame: function (n) { return "The " + n + " here reflects lessons from your partner's past and the traits they bring that strengthen your bond."; } },
  ];

  // Per card: n = name, love = general love meaning, then neutral fragments
  // completing each position frame. pos = optional verbatim overrides by
  // position index.
  var CARDS = [
    { n: "The Fool", love: "The Fool takes a creative approach to relationships. His carefree demeanor can be refreshing, but it's not always stable. If you're the fool, you're at risk of being overly influenced by those around you. If your partner is the fool, you may find that they don't fully appreciate what they have and approach love from a place of lightheartedness and immaturity.",
      energy: "Together the mood is playful and spontaneous, more like two friends on an adventure than a settled couple. Enjoy the lightness, but make sure someone occasionally reads the map.",
      baggage: "Old habits of leaping into love without looking may resurface here. The past holds a story of choosing excitement over judgment, and this relationship will test whether that lesson landed.",
      need: "What is needed most is room to play: spontaneity, humor, and a partner who says yes to the unplanned. Love that feels like a cage will not survive here.",
      gift: "A history of fresh starts brings real courage into this bond: the willingness to begin again, forgive quickly, and keep wonder alive long after the first date.",
      pos: { 3: "You may have lost your wits to love in the past, but this time you need to keep them about you. Don't lose your head in love. Keep your feet on the ground while appreciating what you have." } },
    { n: "The Magician", love: "The Magician brings intention and charisma to love. He has every tool on the table and knows how to use them, which makes him a partner of grand gestures and quick solutions. At his best he makes a relationship feel effortless and enchanted. At his worst, the same cleverness can shade into manipulation, so watch that the magic stays honest.",
      energy: "Together there is real spark and momentum; things happen when you two are in a room. The chemistry is active, creative, and a little dazzling to outsiders.",
      baggage: "The past may include using charm to steer outcomes rather than asking for them plainly. This relationship will test whether persuasion has matured into honesty.",
      need: "What is needed most is to feel capable and appreciated: a partner who admires the effort behind the magic and does not take the show for granted.",
      gift: "Resourcefulness is the dowry here. When problems arise, this one builds solutions out of whatever is at hand, and that steadiness in a crisis strengthens the bond." },
    { n: "The High Priestess", love: "The High Priestess loves quietly and deeply. She senses what is unsaid, keeps her own counsel, and reveals herself one veil at a time. As a partner she offers rare emotional depth and intuition, but she asks for patience: pushing her to open faster only closes the door. Trust is her currency, and it is earned slowly.",
      energy: "Together the connection runs beneath the surface: long silences that feel full, and an uncanny sense of what the other is thinking. Not everything needs to be spoken here.",
      baggage: "Secrets kept for safety in the past can become walls in the present. This relationship will test whether privacy has hardened into distance.",
      need: "What is needed most is emotional safety: a partner who listens more than they interrogate and treats confidences as sacred.",
      gift: "Deep intuition guards this bond. This one reads moods early, senses trouble before it surfaces, and knows when to speak and when simply to stay close." },
    { n: "The Empress", love: "The Empress is love in full bloom: warm, sensual, and endlessly giving. She nurtures a relationship the way a garden is tended, with patience and abundance, and being loved by her feels like home. Her challenge is over-giving; she can mother a partner until the romance fades, or give so much she forgets her own needs.",
      energy: "Together the energy is warm, affectionate, and comfortable: shared meals, physical closeness, and care in a hundred small daily forms.",
      baggage: "A history of giving too much and keeping score quietly may weigh here. This relationship will test whether care can flow without self-erasure.",
      need: "What is needed most is to be nurtured in return: gratitude, tenderness, and a partner who notices the giving and gives back.",
      gift: "Generosity is the great strength brought to this bond: a talent for making any place feel like home and any hard week feel survivable." },
    { n: "The Emperor", love: "The Emperor is the archetypal father figure of the tarot. He represents structure, authority, and power. This character is very practical, straightforward, and responsible in love, though he's not generally one for romance. He can represent abundance, prosperity, and acceptance into elite social circles, though this may come at the price of dealing with his authoritarian nature.",
      energy: "Together the energy is steady and orderly: plans get made, promises get kept, and the relationship runs like a well-managed household. Passion may need deliberate scheduling.",
      baggage: "A past built on control and being the strong one can make softness feel unsafe. This relationship will test whether authority can share the throne.",
      need: "What is needed most is respect and reliability: a partner who honors commitments and builds toward something lasting.",
      gift: "Stability is the inheritance here: protection, provision, and the kind of loyalty that shows up in actions year after year.",
      pos: { 5: "They're looking for strength and stability. If you're not interested in settling down, you may need to part ways." } },
    { n: "The Hierophant", love: "The Hierophant is the traditionalist of the deck. In love he favors courtship done properly: meeting the family, honoring commitments, and often marriage itself. A relationship under his influence tends toward shared values and a socially blessed union. The risk is rigidity, where the rules of love start mattering more than the love.",
      energy: "Together the bond has a traditional, almost ceremonial quality: shared values, family approval, and a sense that this is how it is supposed to be done.",
      baggage: "Old rules about how love must look can weigh on the present. This relationship will test which traditions serve the bond and which merely constrain it.",
      need: "What is needed most is commitment with structure: clear intentions, shared beliefs, and a relationship the wider world recognizes.",
      gift: "Faithfulness is the strength brought here, along with the wisdom of doing things properly: patience with process and reverence for promises." },
    { n: "The Lovers", love: "The Lovers is the card everyone hopes to draw in a love reading, and it earns its reputation: deep attraction, genuine union, and a bond that feels fated. But its secret is choice. This card asks for a real decision made with the whole heart, because half-commitments wither under its influence while chosen love thrives.",
      energy: "Together the energy is magnetic and unmistakable to everyone around you: real attraction, real tenderness, and the sense of two halves choosing each other.",
      baggage: "A past of divided hearts or choices avoided may echo here. This relationship will test whether the heart can commit fully rather than keep an exit open.",
      need: "What is needed most is wholehearted choice: to be picked deliberately, not by default, and to feel that certainty daily.",
      gift: "The capacity for true partnership is the gift: harmony, honest communication, and a love that makes both people more themselves." },
    { n: "The Chariot", love: "The Chariot brings drive and determination to romance. This is the partner who pursues, plans the future, and treats obstacles to the relationship as enemies to defeat. That momentum can be thrilling, but two hands gripping the reins in different directions will stall everything. In love, the Chariot must learn that a partner is not a destination to conquer.",
      energy: "Together the energy is forward-moving and ambitious: trips planned, milestones met, a couple that outsiders describe as going places.",
      baggage: "A past of steamrolling conflict or racing past feelings can trail into this bond. The test is slowing down enough to actually be reached.",
      need: "What is needed most is shared direction: a partner pulling the same way, with goals that belong to both of you.",
      gift: "Determination is the offering here: this one fights for the relationship, not with it, and does not abandon the road when it gets steep." },
    { n: "Strength", love: "Strength in love is gentleness that does not flinch. This card describes a partner who can sit calmly with another person's temper, fear, or wounds without being devoured by them. It speaks of patient courage, loyalty under pressure, and passion tamed into devotion. Its shadow is endurance for its own sake, staying soft in situations that call for boundaries.",
      energy: "Together the energy is calm and courageous: storms pass through this relationship without leveling it, and tenderness returns quickly after friction.",
      baggage: "A history of enduring too much too quietly can weigh here. This relationship will test the difference between patience and self-abandonment.",
      need: "What is needed most is emotional courage: a partner who stays present in hard conversations instead of retreating or roaring.",
      gift: "Steadiness under pressure is the strength brought to this bond: a soft heart with an unbreakable spine, and loyalty that has been tested before." },
    { n: "The Hermit", love: "The Hermit is the solitary soul of the deck, and in love he moves carefully. He needs space and reflection the way others need conversation, and he offers depth, wisdom, and complete sincerity once he lets someone onto the mountain. A relationship with the Hermit thrives on quality over constancy; smothering him dims the very lantern that drew you.",
      energy: "Together the energy is quiet and contemplative: deep talks, comfortable silences, and a bond that grows in private rather than on display.",
      baggage: "A past of withdrawing when hurt can become a habit of disappearing. This relationship will test whether solitude is renewal or escape.",
      need: "What is needed most is space without punishment: room to retreat and reflect, and a welcome that is still warm upon return.",
      gift: "Depth and sincerity are the gifts here: no games, no performance, and hard-won self-knowledge that keeps small problems from becoming large ones." },
    { n: "Wheel of Fortune", love: "The Wheel of Fortune says the relationship is in motion and the scenery is changing. Chance meetings, sudden turns, and shifts in circumstance surround this card; a romance under its influence rarely stays still. The invitation is to ride the cycle together, because couples who cling to how things were miss the better season the wheel may be turning toward.",
      energy: "Together the energy is eventful: luck, timing, and coincidence keep playing a role in your story, and the relationship never stays in one season for long.",
      baggage: "Past upheavals may have taught that good times cannot be trusted. This relationship will test whether change can be faced as a team instead of braced for alone.",
      need: "What is needed most is adaptability: a partner who stays on the ride through ups and downs rather than getting off at the first drop.",
      gift: "Resilience through change is the offering: this one has survived turning wheels before and knows the down-cycle is not the end of the story." },
    { n: "Justice", love: "Justice in love keeps honest scales. This card describes relationships built on fairness, truth-telling, and accountability, where both people carry their share. It can also mark consequences arriving: patterns being weighed and honest conversations that can no longer wait. Love under Justice endures when it is equitable, and corrects itself when it is not.",
      energy: "Together the energy is honest and balanced: decisions are weighed jointly, and both of you notice quickly when the scales tip.",
      baggage: "Old unfairness, kept ledgers of who owed what, may still be carried. This relationship will test whether the books can be closed and started fresh.",
      need: "What is needed most is fairness: truth spoken plainly, effort matched with effort, and no double standards.",
      gift: "Integrity is the strength here: a partner who owns mistakes, keeps their word, and treats the relationship as a matter of honor." },
    { n: "The Hanged Man", love: "The Hanged Man loves from an unusual angle. He represents pause, surrender, and seeing the relationship from a completely new perspective. Under his influence, romance may feel suspended, waiting on an answer, a move, a change of heart. The wisdom here is that not every delay is a loss; some pauses are where the transformation happens.",
      energy: "Together the energy is suspended and reflective: the relationship may feel like it is waiting for something, and the waiting itself is changing you both.",
      baggage: "Past sacrifices that turned into martyrdom can shadow this bond. The test is knowing the difference between patience and being strung along.",
      need: "What is needed most is patience and perspective: a partner willing to sit in uncertainty without forcing an answer before its time.",
      gift: "The gift is perspective: this one can release control, see the other side of an argument, and turn stuck seasons into quiet growth." },
    { n: "Death", love: "Death in a love reading is transformation, not tragedy. It marks the end of a chapter: a dynamic, a pattern, or a version of the relationship that has run its course. What follows depends on what both people do with the clearing. Couples who let the old form die often find something more honest growing in its place.",
      energy: "Together the energy is transitional: something between you is ending so something truer can begin, and you can both feel the season changing.",
      baggage: "An ending never fully grieved may still occupy space here. This relationship will test whether the past can be laid to rest rather than redecorated.",
      need: "What is needed most is renewal: permission to let old patterns die without treating change as betrayal.",
      gift: "Fearlessness about endings is the strength here: this one releases what is finished and meets the new chapter with clear eyes." },
    { n: "Temperance", love: "Temperance is the alchemist of relationships, blending two different lives into one workable mixture. It speaks of patience, moderation, and the daily art of compromise: not a bonfire romance but a hearth that keeps burning. Under its influence, healing happens and extremes settle. Its only warning is against diluting yourself entirely to keep the peace.",
      energy: "Together the energy is harmonious and healing: differences get blended rather than battled, and time with each other feels like exhaling.",
      baggage: "Past extremes, all-or-nothing love, may have left scars. This relationship will test whether balance can be trusted not to be boredom.",
      need: "What is needed most is equilibrium: a partner who meets in the middle and keeps neither too much distance nor too little.",
      gift: "The gift is the peacemaking touch: knowing how much honesty, how much humor, and how much patience a moment needs, and mixing accordingly." },
    { n: "The Devil", love: "The Devil in love is intensity with a catch. It can mark magnetic physical attraction and passionate obsession, and just as often the chains of a pattern neither partner will name: jealousy, control, or wanting someone because they are bad for you. The chains on this card are loose. Freedom is available the moment it is honestly chosen.",
      energy: "Together the energy is intense and magnetic, sometimes deliciously so, sometimes obsessively. The attraction is undeniable; the question is who holds the leash.",
      baggage: "Old patterns of jealousy, control, or staying because leaving felt impossible can follow into this bond. The test is naming the chain out loud.",
      need: "What is needed most is honesty about desire: passion without possession, and wanting each other freely rather than needing each other fearfully.",
      gift: "The gift is passionate devotion: when the intensity is pointed well, this one brings a depth of desire and commitment most people never experience." },
    { n: "The Tower", love: "The Tower shakes relationships to their foundations: a revelation, a sudden rupture, or a truth that changes everything at once. It is the most feared card in a love reading and the most clarifying. What the Tower destroys was standing on a false foundation; what survives its lightning is real, and can be rebuilt stronger on honest ground.",
      energy: "Together the energy is volatile and awake: sparks, sudden truths, and a relationship that refuses to run on autopilot.",
      baggage: "A past collapse, a betrayal or blindside, may still tremble under this bond. The test is not building the new love on the old fault line.",
      need: "What is needed most is truth up front: no comfortable illusions, because this heart would rather be shaken than deceived.",
      gift: "The gift is survivorship: this one has been through the collapse, knows what is real, and will never mistake a facade for a foundation again." },
    { n: "The Star", love: "The Star is healing after heartbreak. In love it marks renewed faith: the moment two people begin to believe in romance again, often after each has weathered something that could have closed their hearts. It is a gentle card of honesty, openness, and hope with its feet on the ground. Love under the Star recovers, replenishes, and quietly shines.",
      energy: "Together the energy is hopeful and gentle: wounds mend in each other's company, and the future feels bright again in a way it has not for a while.",
      baggage: "Old heartbreak may still whisper that hope is naive. This relationship will test whether faith in love can be fully restored.",
      need: "What is needed most is authenticity and calm: a love without games where both people can be exactly who they are.",
      gift: "The gift is renewal: this one brings healed optimism, emotional honesty, and a steady light that makes the relationship a place to recover." },
    { n: "The Moon", love: "The Moon casts romance in half-light. Emotions run deep under this card, but so do uncertainties: mixed signals, unspoken fears, or situations that are not what they appear. It asks partners to move slowly and speak plainly, because imagination will happily fill every silence with the wrong story. Clarity is coming; do not marry a guess in the meantime.",
      energy: "Together the energy is dreamy but uncertain: strong feelings, strange timing, and a sense that not everything between you has come into the light yet.",
      baggage: "Old fears and suspicions, some earned elsewhere, can project shadows onto this bond. The test is checking the story against the facts.",
      need: "What is needed most is reassurance and candor: fears named gently and promptly, before imagination gets there first.",
      gift: "The gift is emotional depth: this one feels currents others miss and, once secure, understands a partner's unspoken tides like no one else." },
    { n: "The Sun", love: "The Sun is joy made visible in a relationship. It marks warmth, laughter, easy affection, and love that does not need to hide or hedge. Under its light, couples celebrate each other publicly and problems shrink to their true size. It is among the best cards for love; its only request is gratitude, because this kind of brightness is meant to be enjoyed, not audited.",
      energy: "Together the energy is radiant: laughter comes easily, affection is open, and being seen together makes both of you a little proud.",
      baggage: "Even sunshine casts a shadow: past joy that ended can make present happiness feel suspicious. The test is letting good be good.",
      need: "What is needed most is celebration: open affection, shared delight, and a partner who enjoys the relationship out loud.",
      gift: "The gift is warmth itself: optimism, playfulness, and a talent for turning ordinary days together into favorite memories." },
    { n: "Judgement", love: "Judgement in love is the great awakening: an honest reckoning with the past and a summons to rise into a better chapter, sometimes with the same person, renewed. Old flames, old wounds, and old selves come up for review under this card. Forgiveness is its engine. Couples who answer its call step into a love more conscious than the one before.",
      energy: "Together the energy is transformative: your histories are on the table, and the relationship keeps calling both of you to become better versions of yourselves.",
      baggage: "Unforgiven chapters, of others or of self, can mute this bond. The test is closing old accounts so the present can be heard.",
      need: "What is needed most is forgiveness and evolution: a partner who does not hold the past against you and rises alongside you.",
      gift: "The gift is renewal through honesty: this one can face the past squarely, forgive what is owed, and begin again with a whole heart." },
    { n: "The World", love: "The World is love completed and whole: the long arc of a relationship arriving where it was always heading. It speaks of milestones, of couples who have grown through every stage together, and of a bond that feels like both an achievement and a beginning. Under this card, love has come full circle, and the next journey starts from higher ground.",
      energy: "Together the energy is fulfilled and steady: a sense of having built something complete, with the world feeling more open because you face it as a pair.",
      baggage: "The fear after finishing a long chapter is that nothing ahead can match it. The test is treating completion as a doorway rather than a peak.",
      need: "What is needed most is a shared sense of accomplishment: milestones honored, growth acknowledged, and a future planned together.",
      gift: "The gift is wholeness: this one arrives complete rather than seeking completion, and that maturity gives the bond an unshakable floor." },
  ];

  // ---------- Styles ----------

  var FONT = "'Segoe UI','Helvetica Neue',Helvetica,Arial,sans-serif";
  var WINE = "#8d2f42";
  var BLUE_S = "#6d9cc4";
  var ORANGE_S = "#d2622a";
  var INK = "#4a4438";

  var CSS = "" +
    ":host{all:initial;display:block}" +
    "*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}" +
    ".wrap{position:relative;font-family:" + FONT + ";color:" + INK + ";" +
    "background:radial-gradient(ellipse 130% 90% at 50% 0%,#efe5c5 0%,#e9dcb6 55%,#e2d2a8 100%);" +
    "padding:44px 24px 60px;overflow:hidden;line-height:1.6}" +
    ".rose{position:absolute;top:14px;right:10px;width:190px;pointer-events:none}" +
    ".candle{position:absolute;bottom:26px;width:120px;pointer-events:none;filter:drop-shadow(0 0 34px rgba(255,180,60,.85))}" +
    ".candle.l{left:36px}.candle.r{right:36px}" +
    ".inner{position:relative;max-width:1000px;margin:0 auto}" +
    ".title{display:flex;align-items:center;justify-content:center;gap:16px;font-family:'Great Vibes',cursive;font-weight:400;" +
    "font-size:clamp(38px,5.5vw,56px);color:" + WINE + ";text-align:center;line-height:1.1;margin-bottom:20px}" +
    ".title svg{color:" + WINE + ";flex:0 0 auto}" +
    ".intro{font-size:19px;text-align:center;margin:0 auto 8px;max-width:820px}" +
    ".choose{font-family:'Great Vibes',cursive;font-size:38px;color:" + BLUE_S + ";text-align:center;margin-top:16px}" +
    ".counter{font-family:Georgia,serif;font-style:italic;font-size:40px;color:" + ORANGE_S + ";text-align:center}" +
    ".shuffle{display:block;margin:4px auto 0;font-size:16px;font-weight:600;color:" + INK + ";text-decoration:underline;" +
    "background:none;border:none;cursor:pointer;font-family:" + FONT + ";position:relative;z-index:40}" +
    ".shuffle:hover{color:" + WINE + "}" +
    ".fanbox{position:relative;height:560px;margin:-90px auto 0;max-width:980px}" +
    ".card{position:absolute;width:150px;height:250px;margin-left:-75px;margin-top:-125px;" +
    "border-radius:11px;border:5px solid #161616;background:url('" + ORIGIN + "/embed/img/tarot/back.jpg') center/cover;" +
    "box-shadow:-4px 5px 12px rgba(0,0,0,.35);cursor:pointer;transition:transform .3s ease,opacity .35s ease}" +
    ".card:hover{filter:brightness(1.08)}" +
    ".actions{text-align:center;margin-top:24px}" +
    ".btn{display:inline-flex;align-items:center;gap:12px;font-family:" + FONT + ";font-size:19px;font-weight:600;" +
    "color:#fff;background:#b08a7d;border:none;border-radius:4px;padding:16px 46px;cursor:pointer;" +
    "box-shadow:0 3px 10px rgba(0,0,0,.2);transition:background .15s ease}" +
    ".btn.ready{background:#9d5b4d}" +
    ".btn.ready:hover{background:#8a4c3f}" +
    ".btn .tri{width:0;height:0;border-top:7px solid transparent;border-bottom:7px solid transparent;border-left:10px solid #fff}" +
    ".screen{display:none}" +
    ".screen.active{display:block;animation:fadein .5s ease}" +
    "@keyframes fadein{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:none}}" +
    ".rtitle{display:flex;align-items:center;justify-content:center;gap:14px;font-family:'Great Vibes',cursive;" +
    "font-size:clamp(40px,5.5vw,58px);color:" + WINE + ";margin-bottom:34px;line-height:1.1}" +
    ".rtitle svg{color:" + WINE + "}" +
    ".spread{position:relative}" +
    ".toprow{display:flex;justify-content:center;margin-bottom:56px}" +
    ".botrow{display:flex;justify-content:center;gap:12px;flex-wrap:wrap}" +
    ".gap{flex:0 0 48px}" +
    ".slot{width:136px}" +
    ".slot .plabel{font-size:14px;color:" + WINE + ";line-height:1.4;min-height:92px;white-space:pre-line;margin-bottom:8px;text-align:center}" +
    ".slot.top .plabel{min-height:0}" +
    ".scard{width:136px;height:227px;border-radius:11px;border:5px solid #161616;cursor:pointer;" +
    "background:url('" + ORIGIN + "/embed/img/tarot/back.jpg') center/cover;box-shadow:0 6px 16px rgba(0,0,0,.3);" +
    "transition:transform .15s ease;position:relative;overflow:hidden}" +
    ".scard:hover{transform:translateY(-3px)}" +
    ".scard img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;display:none}" +
    ".scard.flipped img{display:block}" +
    ".startover{display:block;margin:40px auto 0;font-family:Georgia,serif;font-size:22px;color:" + WINE + ";" +
    "text-decoration:underline;background:none;border:none;cursor:pointer}" +
    ".startover:hover{color:#6d2333}" +
    ".overlay{position:absolute;inset:0;display:none;align-items:flex-start;justify-content:center;z-index:60}" +
    ".overlay.open{display:flex}" +
    ".modal{position:relative;background:rgba(40,36,30,.96);color:#f2ede2;max-width:620px;margin:70px 16px 40px;" +
    "padding:34px 38px;border-radius:6px;box-shadow:0 20px 60px rgba(0,0,0,.5);animation:fadein .3s ease}" +
    ".modal .mx{position:absolute;top:14px;right:18px;font-size:22px;font-weight:700;color:#fff;background:none;border:none;cursor:pointer;font-family:" + FONT + "}" +
    ".modal .mname{font-family:'Great Vibes',cursive;font-size:40px;color:#f3e2b0;margin-bottom:14px;line-height:1.1}" +
    ".modal .mlove{font-size:17.5px;margin-bottom:24px}" +
    ".modal .mrow{display:flex;gap:22px;align-items:flex-start}" +
    ".modal .mrow img{width:130px;border-radius:8px;border:4px solid #f5f2ea;flex:0 0 auto;transform:rotate(-2deg);box-shadow:0 8px 22px rgba(0,0,0,.45)}" +
    ".modal .mpos{font-size:17.5px}" +
    "@media(max-width:900px){.gap{flex-basis:100%;height:10px}}" +
    "@media(max-width:760px){" +
    ".fanbox{height:430px;margin-top:-60px}" +
    ".card{width:104px;height:174px;margin-left:-52px;margin-top:-87px}" +
    ".rose{width:120px;top:6px;right:2px}" +
    ".candle{width:80px}.candle.l{left:10px}.candle.r{right:10px}" +
    ".botrow{gap:20px}" +
    ".slot .plabel{min-height:0}" +
    ".modal{padding:24px 20px;margin-top:40px}" +
    ".modal .mrow{flex-direction:column;align-items:center}" +
    ".wrap{padding:36px 14px 50px}}";

  var PAISLEY = "<svg width='46' height='30' viewBox='0 0 46 30' fill='none' xmlns='http://www.w3.org/2000/svg'>" +
    "<path d='M4 24 C 2 16, 8 8, 16 8 C 24 8, 28 14, 26 19 C 24 23, 18 23, 17 19 C 16 15, 20 13, 23 15' stroke='currentColor' stroke-width='1.6' fill='none' stroke-linecap='round'/>" +
    "<path d='M30 8 C 34 4, 42 6, 43 12 M32 14 C 35 11, 40 12, 41 16 M33 20 C 36 18, 39 19, 40 22' stroke='currentColor' stroke-width='1.5' fill='none' stroke-linecap='round'/>" +
    "<circle cx='7' cy='7' r='1.6' fill='currentColor'/><circle cx='12' cy='4' r='1.2' fill='currentColor'/></svg>";

  // ---------- Markup ----------

  function slotHtml(posIdx, extraClass) {
    return "<div class='slot " + (extraClass || "") + "' data-pos='" + posIdx + "'>" +
      "<div class='plabel'>" + POSITIONS[posIdx].label + "</div>" +
      "<div class='scard' role='button' aria-label='Reveal card'><img alt=''></div>" +
      "</div>";
  }

  function buildHtml() {
    return "<div class='wrap'>" +
      "<img class='rose' alt='' src='" + ORIGIN + "/embed/img/tarot/rose.png'>" +
      "<img class='candle l' alt='' src='" + ORIGIN + "/embed/img/tarot/candle.png'>" +
      "<img class='candle r' alt='' src='" + ORIGIN + "/embed/img/tarot/candle.png'>" +
      "<div class='inner'>" +

      "<div class='screen s-select active'>" +
      "<h2 class='title'>" + PAISLEY + "<span>Love Tarot Card Reading</span><span style='transform:scaleX(-1);display:inline-flex'>" + PAISLEY + "</span></h2>" +
      "<p class='intro'>Whether you're just entering a new relationship or looking for guidance on the future of your current partnership, turning to the tarot cards can be an enlightening experience. Pick seven cards for this relationship spread for some fresh insights on where your romantic life is headed.</p>" +
      "<div class='choose'>Choose 7 cards</div>" +
      "<div class='counter'>0/7</div>" +
      "<button class='shuffle' type='button'>Shuffle the Cards</button>" +
      "<div class='fanbox'></div>" +
      "<div class='actions'><button class='btn getreading' type='button'>Get Your Reading <span class='tri'></span></button></div>" +
      "</div>" +

      "<div class='screen s-reading'>" +
      "<div class='rtitle'>" + PAISLEY + "<span>Your Reading</span><span style='transform:scaleX(-1);display:inline-flex'>" + PAISLEY + "</span></div>" +
      "<div class='spread'>" +
      "<div class='toprow'>" + slotHtml(0, "top") + "</div>" +
      "<div class='botrow'>" + slotHtml(1) + slotHtml(2) + slotHtml(3) + "<div class='gap'></div>" + slotHtml(4) + slotHtml(5) + slotHtml(6) + "</div>" +
      "</div>" +
      "<button class='startover' type='button'>Start Over</button>" +
      "</div>" +

      "</div>" +
      "<div class='overlay'><div class='modal'>" +
      "<button class='mx' type='button' aria-label='Close'>X</button>" +
      "<div class='mname'></div>" +
      "<div class='mlove'></div>" +
      "<div class='mrow'><img alt=''><div class='mpos'></div></div>" +
      "</div></div>" +
      "</div>";
  }

  // ---------- Behavior ----------

  function init(host) {
    if (host.__psLoveTarot) return;
    host.__psLoveTarot = true;

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
    var picked = [];

    function shuffleDeck() {
      deck = [];
      for (var i = 0; i < CARDS.length; i++) deck.push(i);
      for (var j = deck.length - 1; j > 0; j--) {
        var k = Math.floor(Math.random() * (j + 1));
        var tmp = deck[j]; deck[j] = deck[k]; deck[k] = tmp;
      }
    }

    function layoutFan() {
      var box = $(".fanbox");
      box.innerHTML = "";
      var n = CARDS.length;
      var mid = (n - 1) / 2;
      for (var i = 0; i < n; i++) {
        var el = document.createElement("div");
        el.className = "card";
        el.setAttribute("data-slot", i);
        var t = i / (n - 1);
        // V shape: edges high, center low
        el.style.left = (8 + 84 * t) + "%";
        el.style.top = (26 + 52 * (1 - Math.abs(2 * t - 1)) * (1 - 0.35 * Math.abs(2 * t - 1))) + "%";
        var z = Math.round(Math.abs(i - mid)) + 1;
        el.style.zIndex = z;
        el.setAttribute("data-z", z);
        box.appendChild(el);
        el.addEventListener("click", onPick);
      }
    }

    function onPick(e) {
      var el = e.currentTarget;
      var cardIdx = deck[+el.getAttribute("data-slot")];
      if (el.classList.contains("picked")) {
        // unselect: slide the card back into the fan
        el.classList.remove("picked");
        el.style.transform = "";
        el.style.zIndex = el.getAttribute("data-z");
        picked = picked.filter(function (c) { return c !== cardIdx; });
        $(".counter").textContent = picked.length + "/7";
        $(".getreading").classList.remove("ready");
        return;
      }
      if (picked.length >= 7) return;
      el.classList.add("picked");
      el.style.transform = "translateY(-56px)";
      el.style.zIndex = 40;
      picked.push(cardIdx);
      $(".counter").textContent = picked.length + "/7";
      if (picked.length === 7) $(".getreading").classList.add("ready");
    }

    function resetAll() {
      picked = [];
      shuffleDeck();
      layoutFan();
      $(".counter").textContent = "0/7";
      $(".getreading").classList.remove("ready");
      mount.querySelectorAll(".scard").forEach(function (el) {
        el.classList.remove("flipped");
        el.querySelector("img").src = "";
      });
      $(".overlay").classList.remove("open");
    }

    $(".shuffle").addEventListener("click", function () {
      var remainingSlots = [];
      mount.querySelectorAll(".card:not(.picked)").forEach(function (el) {
        remainingSlots.push(+el.getAttribute("data-slot"));
      });
      var values = remainingSlots.map(function (s) { return deck[s]; });
      for (var j = values.length - 1; j > 0; j--) {
        var k = Math.floor(Math.random() * (j + 1));
        var tmp = values[j]; values[j] = values[k]; values[k] = tmp;
      }
      remainingSlots.forEach(function (s, i) { deck[s] = values[i]; });
      mount.querySelectorAll(".card:not(.picked)").forEach(function (el) {
        el.style.transition = "none";
        el.style.opacity = "0";
        setTimeout(function () {
          el.style.transition = "";
          el.style.opacity = "";
        }, 120 + Math.random() * 260);
      });
    });

    $(".getreading").addEventListener("click", function () {
      if (picked.length !== 7) return;
      show("reading");
    });

    function openModal(posIdx) {
      var cardIdx = picked[posIdx];
      var card = CARDS[cardIdx];
      var pos = POSITIONS[posIdx];
      $(".mname").textContent = card.n;
      $(".mlove").textContent = card.love;
      var posText = (card.pos && card.pos[posIdx])
        ? pos.frame(card.n.replace(/^The /, "")) + " " + card.pos[posIdx]
        : pos.frame(card.n.replace(/^The /, "")) + " " + card[pos.frag];
      $(".mpos").textContent = posText;
      $(".mrow img").src = ORIGIN + "/embed/img/tarot/" + String(cardIdx).padStart(2, "0") + ".jpg";
      $(".mrow img").alt = card.n + " tarot card";
      $(".overlay").classList.add("open");
    }

    mount.querySelectorAll(".slot").forEach(function (slot) {
      slot.querySelector(".scard").addEventListener("click", function () {
        var posIdx = +slot.getAttribute("data-pos");
        var cardIdx = picked[posIdx];
        if (cardIdx === undefined) return;
        var sc = slot.querySelector(".scard");
        if (!sc.classList.contains("flipped")) {
          sc.querySelector("img").src = ORIGIN + "/embed/img/tarot/" + String(cardIdx).padStart(2, "0") + ".jpg";
          sc.classList.add("flipped");
        }
        openModal(posIdx);
      });
    });

    $(".mx").addEventListener("click", function () { $(".overlay").classList.remove("open"); });
    $(".overlay").addEventListener("click", function (e) {
      if (e.target === $(".overlay")) $(".overlay").classList.remove("open");
    });

    $(".startover").addEventListener("click", function () {
      resetAll();
      show("select");
    });

    resetAll();
  }

  function boot() {
    var host = document.getElementById("ps-love-tarot") || document.querySelector("[data-ps-widget='love-tarot']");
    if (host) init(host);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})();
