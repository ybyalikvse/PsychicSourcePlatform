import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { TrendingUp, TrendingDown, Minus, ExternalLink, Sparkles, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { Keyword } from "@shared/schema";

interface KeywordAnalysis {
  keyword: string;
  metrics: {
    volume: number;
    difficulty: number;
    cpc: number;
    trafficPotential: number;
    globalVolume: number;
    parentTopic: string | null;
  };
  recommendations: string[];
}

interface KeywordTableProps {
  keywords: Keyword[];
  isLoading?: boolean;
}

export function KeywordTable({ keywords, isLoading }: KeywordTableProps) {
  const { toast } = useToast();
  const [analysisDialogOpen, setAnalysisDialogOpen] = useState(false);
  const [analysisData, setAnalysisData] = useState<KeywordAnalysis | null>(null);
  const [analyzingKeywordId, setAnalyzingKeywordId] = useState<string | null>(null);

  const analyzeMutation = useMutation({
    mutationFn: async (keywordId: string) => {
      setAnalyzingKeywordId(keywordId);
      const response = await fetch(`/api/keywords/${keywordId}/analyze`);
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || data.error || "Failed to analyze keyword");
      }
      return data;
    },
    onSuccess: (data: KeywordAnalysis) => {
      setAnalysisData(data);
      setAnalysisDialogOpen(true);
      setAnalyzingKeywordId(null);
      queryClient.invalidateQueries({ queryKey: ["/api/keywords"] });
    },
    onError: (error: Error) => {
      setAnalyzingKeywordId(null);
      toast({
        title: "Analysis Failed",
        description: error.message || "Could not analyze keyword. Please check your Ahrefs connection.",
        variant: "destructive",
      });
    },
  });

  const getPositionChange = (current: number | null, previous: number | null) => {
    if (current === null || previous === null) return null;
    return previous - current;
  };

  const getDifficultyBadge = (difficulty: number | null | undefined) => {
    if (difficulty === null || difficulty === undefined) {
      return <span className="text-muted-foreground">--</span>;
    }
    const config = {
      className: cn(
        "font-mono text-xs",
        difficulty <= 30 && "bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/20",
        difficulty > 30 && difficulty <= 60 && "bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 border-yellow-500/20",
        difficulty > 60 && "bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20"
      ),
    };
    return <Badge variant="outline" className={config.className}>{difficulty}</Badge>;
  };

  const formatNumber = (num: number | null | undefined) => {
    if (num === null || num === undefined) return "--";
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  if (isLoading) {
    return (
      <div className="rounded-lg border">
        <div className="p-8 text-center text-muted-foreground">
          Loading keywords...
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-lg border" data-testid="keyword-table">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Keyword</TableHead>
            <TableHead className="text-right">Position</TableHead>
            <TableHead className="text-right">Volume</TableHead>
            <TableHead className="text-right">Difficulty</TableHead>
            <TableHead className="text-right">Clicks</TableHead>
            <TableHead className="text-right">Impressions</TableHead>
            <TableHead className="text-right">CTR</TableHead>
            <TableHead>URL</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {keywords.length === 0 ? (
            <TableRow>
              <TableCell colSpan={9} className="h-24 text-center text-muted-foreground">
                No keywords tracked yet.
              </TableCell>
            </TableRow>
          ) : (
            keywords.map((keyword) => {
              const change = getPositionChange(keyword.currentPosition, keyword.previousPosition);
              return (
                <TableRow key={keyword.id} data-testid={`row-keyword-${keyword.id}`}>
                  <TableCell>
                    <span className="font-medium">{keyword.keyword}</span>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <span className="font-mono">
                        {keyword.currentPosition ?? "--"}
                      </span>
                      {change !== null && change !== 0 && (
                        <div className="flex items-center">
                          {change > 0 ? (
                            <TrendingUp className="h-3 w-3 text-green-500" />
                          ) : (
                            <TrendingDown className="h-3 w-3 text-red-500" />
                          )}
                          <span
                            className={cn(
                              "text-xs font-mono ml-1",
                              change > 0 ? "text-green-500" : "text-red-500"
                            )}
                          >
                            {change > 0 ? `+${change}` : change}
                          </span>
                        </div>
                      )}
                      {change === 0 && (
                        <Minus className="h-3 w-3 text-muted-foreground" />
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-right font-mono">
                    {formatNumber(keyword.volume)}
                  </TableCell>
                  <TableCell className="text-right">
                    {getDifficultyBadge(keyword.difficulty)}
                  </TableCell>
                  <TableCell className="text-right font-mono">
                    {formatNumber(keyword.clicks)}
                  </TableCell>
                  <TableCell className="text-right font-mono">
                    {formatNumber(keyword.impressions)}
                  </TableCell>
                  <TableCell className="text-right font-mono">
                    {keyword.ctr || "--"}
                  </TableCell>
                  <TableCell>
                    {keyword.url ? (
                      <a
                        href={keyword.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground truncate max-w-[150px]"
                      >
                        <ExternalLink className="h-3 w-3 shrink-0" />
                        <span className="truncate">{keyword.url.replace(/^https?:\/\//, '')}</span>
                      </a>
                    ) : (
                      <span className="text-muted-foreground">--</span>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => analyzeMutation.mutate(keyword.id)}
                      disabled={analyzingKeywordId === keyword.id}
                      data-testid={`button-analyze-keyword-${keyword.id}`}
                    >
                      {analyzingKeywordId === keyword.id ? (
                        <Loader2 className="h-3 w-3 animate-spin" />
                      ) : (
                        <Sparkles className="h-3 w-3" />
                      )}
                      <span className="ml-1">Analyze</span>
                    </Button>
                  </TableCell>
                </TableRow>
              );
            })
          )}
        </TableBody>
      </Table>

      <Dialog open={analysisDialogOpen} onOpenChange={setAnalysisDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Keyword Analysis</DialogTitle>
            <DialogDescription>
              SEO insights for "{analysisData?.keyword}"
            </DialogDescription>
          </DialogHeader>
          {analysisData && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Search Volume</p>
                  <p className="text-2xl font-semibold">{analysisData.metrics.volume.toLocaleString()}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Difficulty</p>
                  <div className="flex items-center gap-2">
                    <p className="text-2xl font-semibold">{analysisData.metrics.difficulty}</p>
                    {getDifficultyBadge(analysisData.metrics.difficulty)}
                  </div>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">CPC</p>
                  <p className="text-2xl font-semibold">${analysisData.metrics.cpc.toFixed(2)}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Traffic Potential</p>
                  <p className="text-2xl font-semibold">{analysisData.metrics.trafficPotential.toLocaleString()}</p>
                </div>
              </div>

              {analysisData.metrics.parentTopic && (
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Parent Topic</p>
                  <p className="font-medium">{analysisData.metrics.parentTopic}</p>
                </div>
              )}

              {analysisData.recommendations.length > 0 && (
                <div className="space-y-2">
                  <p className="text-sm font-medium">SEO Recommendations</p>
                  <ul className="space-y-2">
                    {analysisData.recommendations.map((rec, idx) => (
                      <li key={idx} className="flex items-start gap-2 text-sm">
                        <Sparkles className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                        <span>{rec}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
