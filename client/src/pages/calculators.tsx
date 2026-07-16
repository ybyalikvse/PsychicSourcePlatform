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
    slug: "moon-sign",
    name: "Moon Sign Calculator",
    description:
      "Night-sky themed. Computes the Moon's actual position at the moment of birth (lunar theory accurate to a hundredth of a degree) and reveals the visitor's moon sign with an emotions-focused meaning write-up.",
    mountId: "ps-moon-sign",
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
