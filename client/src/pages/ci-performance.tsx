import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import {
  ArrowLeft, TrendingUp, TrendingDown, Play, Loader2, CheckCircle, Clock, BarChart3,
} from "lucide-react";
import { Link } from "wouter";
import { useToast } from "@/hooks/use-toast";

interface PerformanceReport {
  id: number;
  weekLabel: string;
  reportData: {
    top_performing_topics?: string[];
    top_performing_hook_types?: string[];
    underperforming_topics?: string[];
    patterns?: string;
    recommendation?: string;
  };
  createdAt: string;
}

export default function CiPerformance() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [runningStep, setRunningStep] = useState<string | null>(null);

  const { data: pipelineStatus } = useQuery<Record<string, string | null>>({
    queryKey: ["/api/ci/pipeline/status"],
  });

  const { data: reports = [], isLoading } = useQuery<PerformanceReport[]>({
    queryKey: ["/api/ci/performance-reports"],
  });

  const runStepMutation = useMutation({
    mutationFn: async (step: string) => {
      const res = await apiRequest("POST", "/api/ci/pipeline/run-step", { step });
      return res.json();
    },
    onSuccess: (_data, step) => {
      toast({ title: `${step} completed` });
      queryClient.invalidateQueries({ queryKey: ["/api/ci"] });
      setRunningStep(null);
    },
    onError: (err: Error, step) => {
      toast({ title: `${step} failed`, description: err.message, variant: "destructive" });
      setRunningStep(null);
    },
  });

  function formatTimestamp(ts: string | null | undefined): string {
    if (!ts) return "Never";
    const d = new Date(ts);
    const diffMs = Date.now() - d.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffMins < 1440) return `${Math.floor(diffMins / 60)}h ago`;
    return `${Math.floor(diffMins / 1440)}d ago`;
  }

  function formatDate(date: string): string {
    return new Date(date).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  }

  // Sort reports newest first
  const sortedReports = [...reports].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-3">
          <Link href="/ci">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Performance Reports</h1>
            <p className="text-muted-foreground">
              Weekly performance insights from your content intelligence pipeline
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 text-xs text-muted-foreground mr-2">
            {pipelineStatus?.performance ? <CheckCircle className="h-3 w-3 text-green-500" /> : <Clock className="h-3 w-3" />}
            Performance: {formatTimestamp(pipelineStatus?.performance)}
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => { setRunningStep("performance"); runStepMutation.mutate("performance"); }}
            disabled={!!runningStep}
          >
            {runningStep === "performance" ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <Play className="h-4 w-4 mr-1" />}
            Run Performance
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Card key={i}>
              <CardContent className="pt-6">
                <div className="space-y-3">
                  <Skeleton className="h-6 w-48" />
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-20 w-full" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : sortedReports.length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-12">
              <BarChart3 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Performance Reports Yet</h3>
              <p className="text-muted-foreground mb-4">
                Run the performance step to generate your first weekly performance report.
              </p>
              <Link href="/ci">
                <Button variant="outline">Back to Dashboard</Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {sortedReports.map((report) => {
            const data = report.reportData || {};
            return (
              <Card key={report.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-lg">{report.weekLabel}</CardTitle>
                      <CardDescription>{formatDate(report.createdAt)}</CardDescription>
                    </div>
                    <Badge variant="outline">
                      <TrendingUp className="h-3 w-3 mr-1" />
                      Report
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-5">
                  {/* Top Performing Topics */}
                  {data.top_performing_topics && data.top_performing_topics.length > 0 && (
                    <div>
                      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-1">
                        <TrendingUp className="h-3 w-3 text-green-500" />
                        Top Performing Topics
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {data.top_performing_topics.map((topic, i) => (
                          <Badge key={i} variant="default" className="bg-green-100 text-green-800 hover:bg-green-100">
                            {topic}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Top Performing Hook Types */}
                  {data.top_performing_hook_types && data.top_performing_hook_types.length > 0 && (
                    <div>
                      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-1">
                        <TrendingUp className="h-3 w-3 text-blue-500" />
                        Top Performing Hook Types
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {data.top_performing_hook_types.map((hook, i) => (
                          <Badge key={i} variant="default" className="bg-blue-100 text-blue-800 hover:bg-blue-100">
                            {hook}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Underperforming Topics */}
                  {data.underperforming_topics && data.underperforming_topics.length > 0 && (
                    <div>
                      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-1">
                        <TrendingDown className="h-3 w-3 text-muted-foreground" />
                        Underperforming Topics
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {data.underperforming_topics.map((topic, i) => (
                          <Badge key={i} variant="outline" className="text-muted-foreground">
                            {topic}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Patterns */}
                  {data.patterns && (
                    <>
                      <Separator />
                      <div>
                        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">
                          Patterns
                        </p>
                        <p className="text-sm">{data.patterns}</p>
                      </div>
                    </>
                  )}

                  {/* Recommendation */}
                  {data.recommendation && (
                    <div className="p-4 bg-primary/5 border border-primary/20 rounded-lg">
                      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">
                        Recommendation
                      </p>
                      <p className="text-sm font-medium">{data.recommendation}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
