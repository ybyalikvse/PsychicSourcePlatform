import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ChevronDown, ChevronRight, FileText } from "lucide-react";

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

function stripBrackets(text: string): string {
  return text.replace(/\[.*?\]/g, "").replace(/\n{3,}/g, "\n\n").trim();
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

      {(structured.format_suggestion || structured.estimated_length || structured.difficulty) && (
        <div className="flex flex-wrap gap-2">
          {structured.format_suggestion && <Badge variant="outline">{structured.format_suggestion}</Badge>}
          {structured.estimated_length && <Badge variant="secondary">{structured.estimated_length}</Badge>}
          {structured.difficulty && <Badge variant="secondary">Difficulty: {structured.difficulty}</Badge>}
        </div>
      )}

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
                          <p className="text-sm whitespace-pre-wrap">{structured.script!.hook}</p>
                        </div>
                      )}
                      {structured.script!.body && (
                        <div>
                          <h4 className="text-xs font-bold text-primary uppercase tracking-wider mb-1">Body</h4>
                          <p className="text-sm whitespace-pre-wrap">{structured.script!.body}</p>
                        </div>
                      )}
                      {structured.script!.closeCta && (
                        <div>
                          <h4 className="text-xs font-bold text-primary uppercase tracking-wider mb-1">Close + CTA</h4>
                          <p className="text-sm whitespace-pre-wrap">{structured.script!.closeCta}</p>
                        </div>
                      )}
                      {!structured.script!.hook && !structured.script!.body && !structured.script!.closeCta && structured.script!.full && (
                        <p className="text-sm whitespace-pre-wrap">{structured.script!.full}</p>
                      )}
                    </div>
                  </TabsContent>

                  <TabsContent value="clean">
                    <div className="space-y-4">
                      {structured.script!.hook && (
                        <div>
                          <h4 className="text-xs font-bold text-primary uppercase tracking-wider mb-1">Hook</h4>
                          <p className="text-sm whitespace-pre-wrap">{stripBrackets(structured.script!.hook)}</p>
                        </div>
                      )}
                      {structured.script!.body && (
                        <div>
                          <h4 className="text-xs font-bold text-primary uppercase tracking-wider mb-1">Body</h4>
                          <p className="text-sm whitespace-pre-wrap">{stripBrackets(structured.script!.body)}</p>
                        </div>
                      )}
                      {structured.script!.closeCta && (
                        <div>
                          <h4 className="text-xs font-bold text-primary uppercase tracking-wider mb-1">Close + CTA</h4>
                          <p className="text-sm whitespace-pre-wrap">{stripBrackets(structured.script!.closeCta)}</p>
                        </div>
                      )}
                      {!structured.script!.hook && !structured.script!.body && !structured.script!.closeCta && structured.script!.full && (
                        <p className="text-sm whitespace-pre-wrap">{stripBrackets(structured.script!.full)}</p>
                      )}
                    </div>
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
