import { useEffect, useRef, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Sparkles, Copy, Check, ExternalLink } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const EMBED_ORIGIN = "https://psychic-source-platform.vercel.app";

const CALCULATORS = [
  {
    slug: "rising-sign",
    name: "Rising Sign Calculator",
    description:
      "Visitors enter their birth date, exact time, and city. The calculator runs real astronomical math in the browser and reveals their ascendant with a full meaning write-up. City search covers 34,000 cities worldwide with historically correct time zones.",
    mountId: "ps-rising-sign",
  },
  {
    slug: "mercury-retrograde",
    name: "Is Mercury in Retrograde?",
    description:
      "Live yes/no tracker: computes whether Mercury is currently retrograde, shows the current or next retrograde window with countdowns, lists the year's retrograde periods, and gives phase-appropriate guidance. Real-time, so the answer changes with the sky.",
    mountId: "ps-mercury-retrograde",
  },
  {
    slug: "moon-phase",
    name: "Moon Phase Today",
    description:
      "A live moon-phase widget: shows today's moon rendered to its actual illumination and waxing/waning shape (drawn in SVG), with the phase name, illumination %, moon age, next new and full moon dates, a reading for the phase, and prev/next-day navigation.",
    mountId: "ps-moon-phase",
  },
  {
    slug: "moon-sign",
    name: "Moon Sign Calculator",
    description:
      "Night-sky themed. Computes the Moon's actual position at the moment of birth (lunar theory accurate to a hundredth of a degree) and reveals the visitor's moon sign with an emotions-focused meaning write-up.",
    mountId: "ps-moon-sign",
  },
  {
    slug: "zodiac-sign",
    name: "What's My Zodiac Sign?",
    description:
      "Birthday in, Sun sign out: glyph, date range, element, modality, ruling planet, and a traits write-up for all 12 signs. Dead-simple, very high volume ('what is my zodiac sign', '[month] zodiac sign').",
    mountId: "ps-zodiac-sign",
  },
  {
    slug: "love-calculator",
    name: "Love Calculator (name match)",
    description:
      "The viral name-compatibility toy: two names in, a deterministic order-independent percentage out with a filling heart meter and a message band. Distinct from the astrology-based Venus & Mars compatibility tool. No CTA URL wired yet.",
    mountId: "ps-love-calculator",
  },
  {
    slug: "yes-no-tarot",
    name: "Yes / No Tarot",
    description:
      "Ask a yes-or-no question and draw one Major Arcana card that flips to reveal a Yes, No, or Maybe verdict with a short reason. Reuses the Rider-Waite deck. No CTA URL wired yet.",
    mountId: "ps-yes-no-tarot",
  },
  {
    slug: "saturn-return",
    name: "Saturn Return Calculator",
    description:
      "Birth date in; computes natal Saturn, then finds when transiting Saturn returns to it (first around age 29, second around 59), with date ranges, current status, and meaning. Reuses the validated Saturn engine.",
    mountId: "ps-saturn-return",
  },
  {
    slug: "birth-chart",
    name: "Birth Chart Calculator",
    description:
      "Full natal chart from birth date, time, and city: an SVG chart wheel with the zodiac ring, Placidus house cusps, and all ten planets placed by longitude, plus a placements table (planet, sign, degree, house) with Ascendant and Midheaven. All positions computed and validated in the browser.",
    mountId: "ps-birth-chart",
  },
  {
    slug: "big-three",
    name: "Sun, Moon & Rising (Big 3)",
    description:
      "Birth date, time, and city in; returns all three foundational placements at once, Sun (core self), Moon (emotional world), and Rising (how others see you), each with a short read. Reuses the validated sign and ascendant math.",
    mountId: "ps-big-three",
  },
  {
    slug: "venus-sign",
    name: "Venus Sign Calculator",
    description:
      "Computes the visitor's Venus sign (love style and values) from birth date/time/place, with a per-sign meaning. Companion to the Venus House calculator (which gives the life-area placement instead).",
    mountId: "ps-venus-sign",
  },
  {
    slug: "mars-sign",
    name: "Mars Sign Calculator",
    description:
      "Space-themed form with a teal result screen. Computes Mars' geocentric position from planetary orbital mechanics (JPL elements, arcminute accuracy) and reveals the visitor's Mars sign with a drive-and-passion meaning write-up.",
    mountId: "ps-mars-sign",
  },
  {
    slug: "jupiter-sign",
    name: "Jupiter Sign Calculator",
    description:
      "Dark maroon starry theme. Computes Jupiter's geocentric position (JPL elements, validated against documented charts and known ingresses) and reveals the visitor's Jupiter sign with an abundance-and-growth meaning write-up.",
    mountId: "ps-jupiter-sign",
  },
  {
    slug: "mercury-house",
    name: "Mercury Placement Calculator",
    description:
      "Teal starry theme. Computes Mercury's position plus the Placidus house wheel and reveals which house Mercury occupies, with Talents / Strengths / Weaknesses columns (colorful icons), a meaning write-up for all 12 houses, and the framed footnote from the example.",
    mountId: "ps-mercury-house",
  },
  {
    slug: "love-compatibility",
    name: "Venus & Mars in Love",
    description:
      "Vintage parchment theme. Two birthdates in, then real Mars (yours) and Venus (partner's) signs are computed and scored by their astrological aspect, with a percentage wheel, a synastry write-up, and the sign-pair glyphs.",
    mountId: "ps-love-compatibility",
  },
  {
    slug: "lunar-node",
    name: "Lunar Node Calculator",
    description:
      "Purple nebula theme, three-screen flow: orbital diagram intro, node explainer with the birth form, then a Result table showing North and South node signs and Placidus houses with a karmic life-path write-up for all 12 placements.",
    mountId: "ps-lunar-node",
  },
  {
    slug: "numerology",
    name: "Numerology Calculator",
    description:
      "Vintage paper theme with a faint handwritten-digits texture. Full name plus birthdate in, then a five-screen reading: Life Path (with the calculation breakdown, strengths, weaknesses, and best jobs), Destiny, Personality, Soul Urge, and a Summary. Pythagorean numerology, no API dependencies.",
    mountId: "ps-numerology",
  },
  {
    slug: "ai-tarot",
    name: "AI Tarot Reading",
    description:
      "The AI-tarot intercept: visitors draw three cards for a Past/Present/Future reading generated live by an AI (server-side, rate-limited), woven into one narrative, ending with a hand-off to a real psychic. The strategic counter to people using ChatGPT for tarot. CTA URL not wired yet.",
    mountId: "ps-ai-tarot",
  },
  {
    slug: "yes-no-tarot",
    name: "Yes / No Tarot",
    description:
      "Ask a yes-or-no question and draw one Major Arcana card that flips to a Yes, No, or Maybe verdict with a reason. Reuses the Rider-Waite deck. CTA URL not wired yet.",
    mountId: "ps-yes-no-tarot",
  },
  {
    slug: "aura-quiz",
    name: "Aura Color Quiz",
    description: "Six-question quiz revealing the visitor's dominant aura color (one of seven) with a color swatch and meaning. High-volume 'aura' cluster.",
    mountId: "ps-aura-quiz",
  },
  {
    slug: "chakra-quiz",
    name: "Chakra Quiz",
    description: "Six-question quiz revealing which of the seven chakras is most active, with its color and guidance. High-volume, low-difficulty 'chakra' cluster.",
    mountId: "ps-chakra-quiz",
  },
  {
    slug: "spirit-animal-quiz",
    name: "Spirit Animal Quiz",
    description: "Six-question quiz revealing the visitor's spirit animal (one of seven) with its symbolism. High-volume 'spirit animal' term.",
    mountId: "ps-spirit-animal-quiz",
  },
  {
    slug: "angel-number",
    name: "Angel Number Meaning",
    description: "Enter a repeating number (111, 444, 1111...) to decode its angel-number meaning, with a fallback that interprets any digit combination. Part of the ~2.8M-search angel-number cluster.",
    mountId: "ps-angel-number",
  },
  {
    slug: "birthstone",
    name: "Birthstone by Month",
    description: "Pick a birth month to reveal its birthstone, color, alternates, and spiritual meaning. Companion to the birthstone content cluster.",
    mountId: "ps-birthstone",
  },
  {
    slug: "past-life",
    name: "Past Life Generator",
    description: "Name and birth date in; a deterministic (stable per person) past-life persona out: era, role, and a lesson carried into this life. Shareable novelty tool.",
    mountId: "ps-past-life",
  },
  {
    slug: "tarot-reading",
    name: "Online Tarot Reading",
    description:
      "Vintage parchment theme, three stages: intro, a fanned deck of 22 face-down Major Arcana where the visitor selects six (with shuffle), then a card-by-card reading across the classic six positions using authentic public-domain Rider-Waite card art.",
    mountId: "ps-tarot-reading",
  },
  {
    slug: "love-tarot",
    name: "Love Tarot Card Reading",
    description:
      "Romantic parchment theme with rose and candle decorations. Visitors choose seven cards from a V-shaped fan, then explore a relationship spread: the energy between you plus your side and your partner's side, clicking each card to flip it and read the love meaning in a modal.",
    mountId: "ps-love-tarot",
  },
  {
    slug: "lgbtq-tarot",
    name: "One Card Tarot (LGBTQIA+)",
    description:
      "Warm pride theme: a row of 22 Progress Pride card backs, pick one and it flips in 3D to reveal an authentic Rider-Waite card with an inclusive reading written for the LGBTQIA+ community, plus Shuffle Cards and Try Another Card.",
    mountId: "ps-lgbtq-tarot",
  },
  {
    slug: "playing-cards-tarot",
    name: "Playing Cards Tarot",
    description:
      "Dark cartomancy theme. Three spread categories (Past/Present/Future, Love, Career), a question prompt, then a row of all 52 playing cards drawn in SVG; pick three that pop up from the deck and get a three-panel result with position-specific readings.",
    mountId: "ps-playing-cards-tarot",
  },
  {
    slug: "venus-house",
    name: "Venus House Calculator",
    description:
      "Indigo cosmic theme. Computes Venus' position plus the full Placidus house wheel from the birth time and place, then reveals which house Venus occupies with Talents / Strengths / Weaknesses and a meaning write-up for all 12 houses.",
    mountId: "ps-venus-house",
  },
];

function embedCode(calc: (typeof CALCULATORS)[number]) {
  return `<div id="${calc.mountId}"></div>\n<script async src="${EMBED_ORIGIN}/embed/${calc.slug}.js"></script>`;
}

function CalculatorPreview({ calc }: { calc: (typeof CALCULATORS)[number] }) {
  const hostRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;
    host.innerHTML = `<div id="${calc.mountId}"></div>`;
    const script = document.createElement("script");
    // Load from the local origin in dev, production origin otherwise
    const origin = window.location.hostname === "localhost" ? "" : EMBED_ORIGIN;
    script.src = `${origin}/embed/${calc.slug}.js`;
    script.async = true;
    host.appendChild(script);
    return () => {
      host.innerHTML = "";
    };
  }, [calc]);

  return <div ref={hostRef} className="rounded-lg overflow-hidden border" />;
}

export default function Calculators() {
  const { toast } = useToast();
  const [copied, setCopied] = useState<string | null>(null);

  const copy = (calc: (typeof CALCULATORS)[number]) => {
    navigator.clipboard.writeText(embedCode(calc)).then(() => {
      setCopied(calc.slug);
      toast({ title: "Embed code copied", description: "Paste it into the destination page's HTML." });
      setTimeout(() => setCopied(null), 2500);
    });
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-3">
        <Sparkles className="h-6 w-6" />
        <div>
          <h1 className="text-2xl font-semibold">Calculators</h1>
          <p className="text-sm text-muted-foreground">
            Embeddable calculators for external sites. They render directly into the host page, so
            there is no iframe, no scrollbars, and no visible seam.
          </p>
        </div>
      </div>

      {CALCULATORS.map(calc => (
        <Card key={calc.slug}>
          <CardHeader>
            <div className="flex items-start justify-between gap-4 flex-wrap">
              <div>
                <CardTitle className="flex items-center gap-2">
                  {calc.name}
                  <Badge variant="secondary">live</Badge>
                </CardTitle>
                <CardDescription className="mt-1 max-w-2xl">{calc.description}</CardDescription>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" asChild>
                  <a href={`${EMBED_ORIGIN}/embed/${calc.slug}.js`} target="_blank" rel="noreferrer">
                    <ExternalLink className="h-4 w-4 mr-1" /> Script
                  </a>
                </Button>
                <Button size="sm" onClick={() => copy(calc)}>
                  {copied === calc.slug ? <Check className="h-4 w-4 mr-1" /> : <Copy className="h-4 w-4 mr-1" />}
                  Copy embed code
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <pre className="bg-muted rounded-md p-3 text-xs overflow-x-auto whitespace-pre-wrap">
              {embedCode(calc)}
            </pre>
            <div>
              <p className="text-sm font-medium mb-2">Live preview</p>
              <CalculatorPreview calc={calc} />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
