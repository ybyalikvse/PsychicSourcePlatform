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
