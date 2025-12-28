import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, Lightbulb, AlertTriangle, Info } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ContentSuggestion } from "@shared/schema";

interface SuggestionCardProps {
  suggestion: ContentSuggestion;
  onApply?: (suggestion: ContentSuggestion) => void;
  onDismiss?: (suggestion: ContentSuggestion) => void;
}

export function SuggestionCard({ suggestion, onApply, onDismiss }: SuggestionCardProps) {
  const typeConfig: Record<string, { icon: React.ReactNode; label: string }> = {
    keyword: { icon: <Lightbulb className="h-4 w-4" />, label: "Keyword" },
    structure: { icon: <Info className="h-4 w-4" />, label: "Structure" },
    readability: { icon: <AlertTriangle className="h-4 w-4" />, label: "Readability" },
    competitor: { icon: <Lightbulb className="h-4 w-4" />, label: "Competitor" },
  };

  const priorityConfig: Record<string, { variant: "default" | "secondary" | "outline"; className: string }> = {
    high: { variant: "default", className: "bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20" },
    medium: { variant: "outline", className: "bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 border-yellow-500/20" },
    low: { variant: "secondary", className: "" },
  };

  const typeInfo = typeConfig[suggestion.type] || typeConfig.keyword;
  const priorityInfo = priorityConfig[suggestion.priority || "medium"];

  return (
    <Card
      className={cn(
        "transition-opacity",
        suggestion.applied && "opacity-50"
      )}
      data-testid={`suggestion-card-${suggestion.id}`}
    >
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <div className="mt-0.5 text-muted-foreground">{typeInfo.icon}</div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <Badge variant="outline" className="text-xs">
                {typeInfo.label}
              </Badge>
              <Badge variant={priorityInfo.variant} className={cn("text-xs", priorityInfo.className)}>
                {suggestion.priority}
              </Badge>
            </div>
            <p className="text-sm">{suggestion.suggestion}</p>
          </div>
          {!suggestion.applied && (
            <div className="flex items-center gap-1 shrink-0">
              {onApply && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => onApply(suggestion)}
                  data-testid={`button-apply-${suggestion.id}`}
                >
                  <Check className="h-4 w-4 text-green-500" />
                </Button>
              )}
            </div>
          )}
          {suggestion.applied && (
            <Badge variant="outline" className="shrink-0 text-green-600 dark:text-green-400">
              Applied
            </Badge>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
