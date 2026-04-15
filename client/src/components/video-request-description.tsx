import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { ChevronDown, ChevronRight, FileText, Smartphone } from "lucide-react";

interface StructuredBrief {
  _type: "ci_brief";
  topic_description: string | null;
  hook_options: string[];
  talking_points: string[];
  emotional_journey: string | null;
  suggested_cta: string | null;
  format_suggestion: string | null;
  estimated_length: string | null;
  difficulty: string | null;
  notes_for_creator: string | null;
  script: {
    hook: string | null;
    body: string | null;
    closeCta: string | null;
    full: string | null;
  } | null;
}

function humanize(value: string): string {
  const specialCases: Record<string, string> = {
    "POV_scenario": "POV Scenario",
    "short_form_talking_head": "Short-Form Talking Head",
  };
  if (specialCases[value]) return specialCases[value];
  return value
    .split(/[_\s]+/)
    .filter(Boolean)
    .map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(" ");
}

function cleanScript(text: string, stripDirections: boolean = false): string {
  let cleaned = text;
  // Replace em dashes and en dashes with hyphens
  cleaned = cleaned.replace(/[—–]/g, "-");
  // Remove markdown bold markers **
  cleaned = cleaned.replace(/\*\*/g, "");
  // Remove horizontal rules ---
  cleaned = cleaned.replace(/^-{3,}\s*$/gm, "");
  // Remove section headers that duplicate our own labels (HOOK:, BODY:, CLOSE + CTA:, etc.)
  cleaned = cleaned.replace(/^(?:HOOK|BODY|CLOSE\s*\+?\s*CTA)[:\s]*(?:\(.*?\))?\s*$/gim, "");
  // Remove leftover "+ CTA:" from bad parsing
  cleaned = cleaned.replace(/^\+?\s*CTA[:\s]*$/gim, "");
  // Remove timing labels like (0-3 seconds), (final 10 seconds)
  cleaned = cleaned.replace(/\(\d+-?\d*\s*seconds?\)/gi, "");
  // Remove OPTIONAL OVERLAY TEXT sections entirely
  cleaned = cleaned.replace(/\*?OPTIONAL OVERLAY.*?(?=\n\n|\n[A-Z]|$)/gis, "");
  // Remove VISUAL NOTES sections
  cleaned = cleaned.replace(/\*?\[?VISUAL NOTES\]?.*?(?=\n\n|\n[A-Z]|$)/gis, "");
  // Strip stage directions [in brackets] if clean mode
  if (stripDirections) {
    cleaned = cleaned.replace(/\[.*?\]/g, "");
  }
  // Collapse multiple blank lines
  cleaned = cleaned.replace(/\n{3,}/g, "\n\n");
  return cleaned.trim();
}

export function VideoRequestDescription({ description }: { description: string }) {
  const [showScript, setShowScript] = useState(false);

  // Try to parse as structured JSON
  let structured: StructuredBrief | null = null;
  try {
    const parsed = JSON.parse(description);
    if (parsed._type === "ci_brief") {
      structured = parsed;
    }
  } catch {
    // Not JSON — render as plain text
  }

  if (!structured) {
    return <p className="text-sm whitespace-pre-wrap">{description}</p>;
  }

  return (
    <div className="space-y-4">
      {structured.topic_description && (
        <div>
          <h4 className="text-sm font-bold mb-1">Topic</h4>
          <p className="text-sm">{structured.topic_description}</p>
        </div>
      )}

      {structured.hook_options.length > 0 && (
        <div>
          <h4 className="text-sm font-bold mb-1">Hook Options</h4>
          <ol className="list-decimal list-inside space-y-1">
            {structured.hook_options.map((h, i) => (
              <li key={i} className="text-sm">{h}</li>
            ))}
          </ol>
        </div>
      )}

      {structured.talking_points.length > 0 && (
        <div>
          <h4 className="text-sm font-bold mb-1">Talking Points</h4>
          <ul className="list-disc list-inside space-y-1">
            {structured.talking_points.map((p, i) => (
              <li key={i} className="text-sm">{p}</li>
            ))}
          </ul>
        </div>
      )}

      {structured.emotional_journey && (
        <div>
          <h4 className="text-sm font-bold mb-1">Emotional Journey</h4>
          <p className="text-sm">{structured.emotional_journey}</p>
        </div>
      )}

      {structured.suggested_cta && (
        <div>
          <h4 className="text-sm font-bold mb-1">Suggested CTA</h4>
          <p className="text-sm">{structured.suggested_cta}</p>
        </div>
      )}

      <div className="flex flex-wrap gap-2">
        <Badge variant="outline" className="gap-1">
          <Smartphone className="h-3 w-3" />
          Portrait (9:16)
        </Badge>
        {(structured.format_suggestion || structured.estimated_length || structured.difficulty) && (
          <>
          {structured.format_suggestion && (
            <Tooltip delayDuration={150}>
              <TooltipTrigger asChild>
                <Badge variant="outline" className="cursor-help">
                  <span className="text-muted-foreground mr-1">Format:</span>{humanize(structured.format_suggestion)}
                </Badge>
              </TooltipTrigger>
              <TooltipContent side="top" className="max-w-xs">
                Suggested shooting style and energy for this video, based on what performed well in competitor content for this topic.
              </TooltipContent>
            </Tooltip>
          )}
          {structured.estimated_length && <Badge variant="secondary">{structured.estimated_length}</Badge>}
          {structured.difficulty && (
            <Tooltip delayDuration={150}>
              <TooltipTrigger asChild>
                <Badge variant="secondary" className="cursor-help">
                  <span className="text-muted-foreground mr-1">Difficulty:</span>{humanize(structured.difficulty)}
                </Badge>
              </TooltipTrigger>
              <TooltipContent side="top" className="max-w-xs">
                How complex this topic is to deliver well on camera. Easy = conversational, anyone can do it. Medium = requires some explanation or nuance. Advanced = requires deep expertise.
              </TooltipContent>
            </Tooltip>
          )}
          </>
        )}
      </div>

      {structured.notes_for_creator && (
        <div>
          <h4 className="text-sm font-bold mb-1">Notes for Creator</h4>
          <p className="text-sm italic text-muted-foreground">{structured.notes_for_creator}</p>
        </div>
      )}

      {structured.script && (structured.script.hook || structured.script.body || structured.script.closeCta || structured.script.full) && (
        <>
          <Separator />
          <div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowScript(!showScript)}
              className="mb-3"
            >
              {showScript ? <ChevronDown className="h-4 w-4 mr-1" /> : <ChevronRight className="h-4 w-4 mr-1" />}
              <FileText className="h-4 w-4 mr-1" />
              Full Script (Optional)
            </Button>

            {showScript && (
              <div className="border rounded-lg p-4">
                <Tabs defaultValue="with-directions">
                  <TabsList className="mb-3">
                    <TabsTrigger value="with-directions">With Directions</TabsTrigger>
                    <TabsTrigger value="clean">Clean Script</TabsTrigger>
                  </TabsList>

                  <TabsContent value="with-directions">
                    <div className="space-y-4">
                      {structured.script!.hook && (
                        <div>
                          <h4 className="text-xs font-bold text-primary uppercase tracking-wider mb-1">Hook</h4>
                          <p className="text-sm whitespace-pre-wrap">{cleanScript(structured.script!.hook)}</p>
                        </div>
                      )}
                      {structured.script!.body && (
                        <div>
                          <h4 className="text-xs font-bold text-primary uppercase tracking-wider mb-1">Body</h4>
                          <p className="text-sm whitespace-pre-wrap">{cleanScript(structured.script!.body)}</p>
                        </div>
                      )}
                      {structured.script!.closeCta && (
                        <div>
                          <h4 className="text-xs font-bold text-primary uppercase tracking-wider mb-1">Close + CTA</h4>
                          <p className="text-sm whitespace-pre-wrap">{cleanScript(structured.script!.closeCta)}</p>
                        </div>
                      )}
                      {!structured.script!.hook && !structured.script!.body && !structured.script!.closeCta && structured.script!.full && (
                        <p className="text-sm whitespace-pre-wrap">{cleanScript(structured.script!.full)}</p>
                      )}
                    </div>
                  </TabsContent>

                  <TabsContent value="clean">
                    <p className="text-sm whitespace-pre-wrap">{
                      [
                        structured.script!.hook ? cleanScript(structured.script!.hook, true) : "",
                        structured.script!.body ? cleanScript(structured.script!.body, true) : "",
                        structured.script!.closeCta ? cleanScript(structured.script!.closeCta, true) : "",
                      ].filter(Boolean).join("\n\n")
                      || (structured.script!.full ? cleanScript(structured.script!.full, true) : "")
                    }</p>
                  </TabsContent>
                </Tabs>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
